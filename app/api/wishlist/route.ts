import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(session.user.id) },
    { projection: { wishlist: 1, favorites: 1 } }
  );

  return NextResponse.json({
    wishlist: user?.wishlist ?? [],
    favorites: user?.favorites ?? [],
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { productId, type } = (await req.json()) as {
    productId?: string;
    type?: "wishlist" | "favorites";
  };

  if (!productId || !type || !["wishlist", "favorites"].includes(type)) {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(session.user.id) },
    { $addToSet: { [type]: productId }, $set: { updatedAt: new Date() } } as never
  );

  return NextResponse.json({ message: "Added successfully." });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { productId, type } = (await req.json()) as {
    productId?: string;
    type?: "wishlist" | "favorites";
  };

  if (!productId || !type || !["wishlist", "favorites"].includes(type)) {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(session.user.id) },
    { $pull: { [type]: productId }, $set: { updatedAt: new Date() } } as never
  );

  return NextResponse.json({ message: "Removed successfully." });
}
