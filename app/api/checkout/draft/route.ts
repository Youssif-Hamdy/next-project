import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { buildLinesFromRequestedItems } from "@/lib/checkout";
import { computeOrderTotals } from "@/lib/order-pricing";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = (await req.json()) as {
      items?: { productId: string; quantity: number }[];
      guestEmail?: string;
      guestName?: string;
    };

    if (!body.items?.length) {
      return NextResponse.json({ message: "Cart is empty." }, { status: 400 });
    }

    const userId = session?.user?.id ?? null;
    if (!userId) {
      if (!body.guestEmail?.trim() || !body.guestName?.trim()) {
        return NextResponse.json({ message: "Guest name and email are required." }, { status: 400 });
      }
    }

    const built = await buildLinesFromRequestedItems(body.items);
    if ("error" in built) {
      return NextResponse.json({ message: built.error }, { status: 400 });
    }

    const subtotalSum = built.lines.reduce((s, l) => s + l.lineTotal, 0);
    const pricing = computeOrderTotals(subtotalSum);
    const now = new Date();
    const db = await getDb();

    const result = await db.collection("checkout_drafts").insertOne({
      userId,
      guestEmail: userId ? undefined : body.guestEmail?.trim(),
      guestName: userId ? undefined : body.guestName?.trim(),
      lines: built.lines,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      shipping: pricing.shipping,
      total: pricing.total,
      createdAt: now,
    });

    return NextResponse.json({
      draftId: result.insertedId.toString(),
      ...pricing,
      lines: built.lines,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to prepare checkout.", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
