import { ObjectId } from "mongodb";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

const aliveFilter = {
  $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
};

async function canEditProduct(db: Awaited<ReturnType<typeof getDb>>, session: Session, product: unknown) {
  const sellerId = product && typeof product === "object" && "sellerId" in product ? String((product as { sellerId?: string }).sellerId ?? "") : "";
  const user = session.user;
  if (!user?.id) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "SELLER" && sellerId === user.id) {
    const me = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
    return (me?.userStatus ?? "ACTIVE") === "ACTIVE";
  }
  return false;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const product = await db.collection("products").findOne({
      $and: [{ _id: new ObjectId(id) }, aliveFilter],
    });

    if (!product) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    const reviews = await db
      .collection("reviews")
      .find({ productId: id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ product, reviews });
  } catch {
    return NextResponse.json({ message: "Invalid product id." }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid id." }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection("products").findOne({
      $and: [{ _id: new ObjectId(id) }, aliveFilter],
    });
    if (!existing) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    if (!(await canEditProduct(db, session as Session, existing))) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const body = (await req.json()) as Partial<{
      name: string;
      description: string;
      category: string;
      images: string[];
      price: number;
      stock: number;
    }>;

    const $set: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) $set.name = String(body.name).trim();
    if (body.description !== undefined) $set.description = String(body.description).trim();
    if (body.category !== undefined) $set.category = String(body.category).trim();
    if (body.images !== undefined) $set.images = body.images;
    if (typeof body.price === "number") $set.price = body.price;
    if (typeof body.stock === "number") $set.stock = body.stock;

    await db.collection("products").updateOne({ _id: new ObjectId(id) }, { $set });
    return NextResponse.json({ message: "Product updated." });
  } catch (error) {
    return NextResponse.json(
      { message: "Update failed.", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid id." }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection("products").findOne({
      $and: [{ _id: new ObjectId(id) }, aliveFilter],
    });
    if (!existing) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    if (!(await canEditProduct(db, session as Session, existing))) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      { $set: { deletedAt: new Date(), updatedAt: new Date() } }
    );
    return NextResponse.json({ message: "Product removed." });
  } catch (error) {
    return NextResponse.json(
      { message: "Delete failed.", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
