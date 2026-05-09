import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { sendNewsletterEmail } from "@/lib/email";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = body.email?.toLowerCase().trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ message: "Valid email is required." }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection("newsletter_subscribers").findOne({ email });
    if (existing) {
      return NextResponse.json({ message: "You are already subscribed." }, { status: 200 });
    }

    await db.collection("newsletter_subscribers").insertOne({
      email,
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "Subscribed to updates." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Subscription failed.", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const db = await getDb();
  const subscribers = await db
    .collection("newsletter_subscribers")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({ subscribers });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const body = (await req.json()) as { subject?: string; html?: string };
  if (!body.subject?.trim() || !body.html?.trim()) {
    return NextResponse.json({ message: "subject and html are required." }, { status: 400 });
  }

  const db = await getDb();
  const subscribers = await db.collection("newsletter_subscribers").find({}).toArray();
  let sent = 0;
  for (const sub of subscribers) {
    const res = await sendNewsletterEmail(String(sub.email), body.subject, body.html);
    if (res.sent) sent += 1;
  }

  return NextResponse.json({
    message: "Broadcast finished.",
    recipients: subscribers.length,
    sentViaSmtp: sent,
  });
}
