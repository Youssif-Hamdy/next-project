import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";
import {
  buildLinesFromRequestedItems,
  decrementStock,
  rollbackStock,
  type CartLine,
} from "@/lib/checkout";
import { computeOrderTotals } from "@/lib/order-pricing";
import { getDb } from "@/lib/db";
import type { PaymentMethod } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const db = await getDb();
  const orders = await db
    .collection("orders")
    .find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ orders });
}

async function finalizeStripeSession(sessionId: string) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ message: "Stripe is not configured." }, { status: 503 });
  }

  const stripe = new Stripe(key);
  const cs = await stripe.checkout.sessions.retrieve(sessionId);

  if (cs.payment_status !== "paid") {
    return NextResponse.json({ message: "Payment not completed." }, { status: 400 });
  }

  const draftId = cs.metadata?.draftId;
  if (!draftId || !ObjectId.isValid(draftId)) {
    return NextResponse.json({ message: "Invalid checkout metadata." }, { status: 400 });
  }

  const db = await getDb();
  const existing = await db.collection("orders").findOne({ stripeSessionId: sessionId });
  if (existing) {
    return NextResponse.json({
      message: "Order already recorded.",
      orderId: existing._id.toString(),
      duplicate: true,
    });
  }

  const draft = await db.collection("checkout_drafts").findOne({ _id: new ObjectId(draftId) });
  if (!draft) {
    return NextResponse.json({ message: "Checkout draft expired." }, { status: 400 });
  }

  const lines = draft.lines as CartLine[];
  const expectedCents = Math.round(Number(draft.total) * 100);
  if (typeof cs.amount_total === "number" && cs.amount_total !== expectedCents) {
    return NextResponse.json({ message: "Paid amount does not match order." }, { status: 400 });
  }

  const stock = await decrementStock(lines);
  if (!stock.ok) {
    return NextResponse.json({ message: stock.message }, { status: 409 });
  }

  const now = new Date();
  const userId = (draft.userId as string | null) ?? null;

  try {
    const orderResult = await db.collection("orders").insertOne({
      userId,
      guestEmail: userId ? undefined : draft.guestEmail,
      guestName: userId ? undefined : draft.guestName,
      items: lines,
      subtotal: draft.subtotal,
      tax: draft.tax,
      shipping: draft.shipping,
      totalPrice: draft.total,
      paymentMethod: "CARD_STRIPE" satisfies PaymentMethod,
      paymentStatus: "PAID",
      stripeSessionId: sessionId,
      status: "PLACED",
      createdAt: now,
      updatedAt: now,
    });

    if (userId) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $push: { orderHistory: orderResult.insertedId.toString() },
          $set: { updatedAt: now },
        } as never
      );
    }

    await db.collection("checkout_drafts").deleteOne({ _id: new ObjectId(draftId) });

    return NextResponse.json({
      message: "Order created.",
      orderId: orderResult.insertedId.toString(),
      subtotal: draft.subtotal,
      tax: draft.tax,
      shipping: draft.shipping,
      total: draft.total,
    });
  } catch (error) {
    await rollbackStock(stock.decremented);
    return NextResponse.json(
      { message: "Failed to finalize order.", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = (await req.json()) as {
    items?: { productId: string; quantity: number }[];
    paymentMethod?: PaymentMethod;
    guestEmail?: string;
    guestName?: string;
    stripeCheckoutSessionId?: string;
  };

  if (body.stripeCheckoutSessionId) {
    return finalizeStripeSession(body.stripeCheckoutSessionId);
  }

  const paymentMethod = body.paymentMethod;
  const allowed: PaymentMethod[] = ["COD", "CARD_STRIPE", "PAYPAL", "WALLET"];
  if (!paymentMethod || !allowed.includes(paymentMethod)) {
    return NextResponse.json({ message: "Invalid payment method." }, { status: 400 });
  }

  if (paymentMethod === "CARD_STRIPE") {
    return NextResponse.json(
      { message: "Use the Stripe checkout button to pay by card." },
      { status: 400 }
    );
  }

  if (!body.items?.length) {
    return NextResponse.json({ message: "Cart is empty." }, { status: 400 });
  }

  const userId = session?.user?.id ?? null;
  if (!userId) {
    if (!body.guestEmail?.trim() || !body.guestName?.trim()) {
      return NextResponse.json({ message: "Guest name and email are required." }, { status: 400 });
    }
  }

  if (paymentMethod === "WALLET" && !userId) {
    return NextResponse.json({ message: "Wallet requires a logged-in account." }, { status: 400 });
  }

  const built = await buildLinesFromRequestedItems(body.items);
  if ("error" in built) {
    return NextResponse.json({ message: built.error }, { status: 400 });
  }

  const subtotalSum = built.lines.reduce((s, l) => s + l.lineTotal, 0);
  const { subtotal, tax, shipping, total } = computeOrderTotals(subtotalSum);

  const db = await getDb();
  const now = new Date();

  if (paymentMethod === "WALLET") {
    const wr = await db.collection("users").updateOne(
      { _id: new ObjectId(userId!), walletBalance: { $gte: total } },
      { $inc: { walletBalance: -total }, $set: { updatedAt: now } }
    );
    if (wr.modifiedCount === 0) {
      return NextResponse.json({ message: "Insufficient wallet balance." }, { status: 400 });
    }
  }

  const stock = await decrementStock(built.lines);
  if (!stock.ok) {
    if (paymentMethod === "WALLET") {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId!) },
        { $inc: { walletBalance: total }, $set: { updatedAt: new Date() } }
      );
    }
    return NextResponse.json({ message: stock.message }, { status: 409 });
  }

  try {
    const paymentStatus =
      paymentMethod === "WALLET" ? "PAID" : paymentMethod === "COD" || paymentMethod === "PAYPAL" ? "PENDING" : "PENDING";

    const orderResult = await db.collection("orders").insertOne({
      userId,
      guestEmail: userId ? undefined : body.guestEmail?.trim(),
      guestName: userId ? undefined : body.guestName?.trim(),
      items: built.lines,
      subtotal,
      tax,
      shipping,
      totalPrice: total,
      paymentMethod,
      paymentStatus,
      status: "PLACED",
      createdAt: now,
      updatedAt: now,
    });

    if (userId) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $push: { orderHistory: orderResult.insertedId.toString() },
          $set: { updatedAt: now },
        } as never
      );
    }

    return NextResponse.json({
      message: "Order created.",
      orderId: orderResult.insertedId.toString(),
      subtotal,
      tax,
      shipping,
      total,
    });
  } catch (error) {
    await rollbackStock(stock.decremented);
    if (paymentMethod === "WALLET") {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId!) },
        { $inc: { walletBalance: total }, $set: { updatedAt: new Date() } }
      );
    }
    return NextResponse.json(
      { message: "Order failed.", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
