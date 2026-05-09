import { ObjectId } from "mongodb";
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  if (!configureVapid()) {
    return NextResponse.json(
      { message: "Push is not configured (VAPID keys missing)." },
      { status: 503 }
    );
  }

  const body = (await req.json()) as { title?: string; body?: string; url?: string };
  if (!body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json({ message: "title and body are required." }, { status: 400 });
  }

  const db = await getDb();
  const subs = await db.collection("push_subscriptions").find({}).toArray();
  const payload = JSON.stringify({
    title: body.title,
    body: body.body,
    url: body.url ?? "/",
  });

  let delivered = 0;
  const stale: ObjectId[] = [];

  for (const doc of subs) {
    const sub = doc.subscription as webpush.PushSubscription;
    try {
      await webpush.sendNotification(sub, payload);
      delivered += 1;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if ((status === 404 || status === 410) && doc._id instanceof ObjectId) {
        stale.push(doc._id);
      }
    }
  }

  if (stale.length) {
    await db.collection("push_subscriptions").deleteMany({ _id: { $in: stale } });
  }

  return NextResponse.json({
    message: "Broadcast attempted.",
    subscriptions: subs.length,
    delivered,
  });
}
