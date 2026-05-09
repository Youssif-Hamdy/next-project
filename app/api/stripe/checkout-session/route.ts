import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ message: "Stripe is not configured (STRIPE_SECRET_KEY)." }, { status: 503 });
  }

  try {
    const session = await getServerSession(authOptions);
    const body = (await req.json()) as { draftId?: string };
    if (!body.draftId || !ObjectId.isValid(body.draftId)) {
      return NextResponse.json({ message: "Valid draftId is required." }, { status: 400 });
    }

    const db = await getDb();
    const draft = await db.collection("checkout_drafts").findOne({ _id: new ObjectId(body.draftId) });
    if (!draft) {
      return NextResponse.json({ message: "Checkout draft not found." }, { status: 404 });
    }

    const userId = session?.user?.id ?? null;
    if (draft.userId && draft.userId !== userId) {
      return NextResponse.json({ message: "Draft does not belong to this session." }, { status: 403 });
    }
    if (!draft.userId && userId) {
      return NextResponse.json({ message: "Guest draft mismatch." }, { status: 403 });
    }

    const lines = draft.lines as Array<{
      name: string;
      productId: string;
      quantity: number;
      unitPrice: number;
    }>;

    const stripe = new Stripe(key);
    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const successUrl = `${base.replace(/\/$/, "")}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${base.replace(/\/$/, "")}/checkout?cancelled=1`;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      metadata: { draftId: body.draftId },
      line_items: lines.map((l) => ({
        price_data: {
          currency: "usd",
          unit_amount: Math.round(l.unitPrice * 100),
          product_data: {
            name: l.name,
            metadata: { productId: l.productId },
          },
        },
        quantity: l.quantity,
      })),
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    await db.collection("checkout_drafts").updateOne(
      { _id: new ObjectId(body.draftId) },
      { $set: { stripeSessionId: checkoutSession.id, updatedAt: new Date() } }
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    return NextResponse.json(
      { message: "Stripe session failed.", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
