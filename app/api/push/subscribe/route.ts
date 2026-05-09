import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

function configureVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@localhost";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    if (!configureVapid()) {
      return NextResponse.json(
        { message: "Push is not configured (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)." },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    const body = (await req.json()) as {
      subscription?: { endpoint: string; keys: { p256dh: string; auth: string } };
      topic?: string;
    };

    if (!body.subscription?.endpoint) {
      return NextResponse.json({ message: "Invalid subscription payload." }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("push_subscriptions").updateOne(
      { endpoint: body.subscription.endpoint },
      {
        $set: {
          subscription: body.subscription,
          userId: session?.user?.id ?? null,
          topic: body.topic ?? "promos",
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return NextResponse.json({ message: "Subscription saved." });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to save subscription.", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
