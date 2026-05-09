import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { UserAccountStatus, UserRole } from "@/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid user id." }, { status: 400 });
  }

  const body = (await req.json()) as {
    action?: "approve" | "restrict" | "soft_delete" | "restore";
    role?: UserRole;
    userStatus?: UserAccountStatus;
  };

  const db = await getDb();
  const now = new Date();

  if (body.action === "soft_delete") {
    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { deletedAt: now, updatedAt: now } }
    );
    return NextResponse.json({ message: "User archived (soft delete)." });
  }

  if (body.action === "restore") {
    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $unset: { deletedAt: "" }, $set: { updatedAt: now } }
    );
    return NextResponse.json({ message: "User restored." });
  }

  if (body.action === "restrict") {
    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { userStatus: "RESTRICTED", updatedAt: now } }
    );
    return NextResponse.json({ message: "User restricted." });
  }

  if (body.action === "approve") {
    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { userStatus: "ACTIVE", updatedAt: now } }
    );
    return NextResponse.json({ message: "User approved." });
  }

  const $set: Record<string, unknown> = { updatedAt: now };
  if (body.role && ["CUSTOMER", "SELLER", "ADMIN"].includes(body.role)) {
    $set.role = body.role;
  }
  if (body.userStatus && ["ACTIVE", "RESTRICTED", "PENDING_APPROVAL"].includes(body.userStatus)) {
    $set.userStatus = body.userStatus;
  }

  if (Object.keys($set).length <= 1) {
    return NextResponse.json({ message: "No valid fields to update." }, { status: 400 });
  }

  await db.collection("users").updateOne({ _id: new ObjectId(id) }, { $set });

  return NextResponse.json({ message: "User updated." });
}
