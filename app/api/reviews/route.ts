import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { productId, rating, comment } = (await req.json()) as {
    productId?: string;
    rating?: number;
    comment?: string;
  };

  if (!productId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("reviews").insertOne({
    productId,
    userId: session.user.id,
    rating,
    comment: comment?.trim() ?? "",
    createdAt: new Date(),
  });

  const reviews = await db.collection("reviews").find({ productId }).toArray();
  const avgRating = reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0) / reviews.length;

  await db.collection("products").updateOne(
    { _id: new ObjectId(productId) },
    { $set: { rating: Number(avgRating.toFixed(2)), updatedAt: new Date() } }
  );

  return NextResponse.json({ message: "Review added." }, { status: 201 });
}
