import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid id." }, { status: 400 });
  }

  const body = (await req.json()) as { name?: string; description?: string };
  const $set: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name?.trim()) $set.name = body.name.trim();
  if (typeof body.description === "string") $set.description = body.description.trim();

  const db = await getDb();
  const res = await db.collection("categories").updateOne({ _id: new ObjectId(id) }, { $set });
  if (res.matchedCount === 0) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ message: "Category updated." });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid id." }, { status: 400 });
  }

  const db = await getDb();
  const res = await db.collection("categories").deleteOne({ _id: new ObjectId(id) });
  if (res.deletedCount === 0) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ message: "Category deleted." });
}
