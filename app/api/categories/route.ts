import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  try {
    const db = await getDb();
    const categories = await db.collection("categories").find({}).sort({ name: 1 }).toArray();
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to load categories.", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const body = (await req.json()) as { name?: string; description?: string };
    if (!body.name?.trim()) {
      return NextResponse.json({ message: "Name is required." }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date();
    const base = slugify(body.name);
    let slug = base;
    let n = 1;
    while (await db.collection("categories").findOne({ slug })) {
      slug = `${base}-${n++}`;
    }

    const result = await db.collection("categories").insertOne({
      name: body.name.trim(),
      slug,
      description: body.description?.trim() ?? "",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      { message: "Category created.", categoryId: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create category.", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
