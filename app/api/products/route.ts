import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

const aliveFilter = {
  $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
};

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search")?.trim() ?? "";
    const category = req.nextUrl.searchParams.get("category")?.trim() ?? "";
    const minPrice = Number(req.nextUrl.searchParams.get("minPrice") ?? 0);
    const maxPrice = Number(req.nextUrl.searchParams.get("maxPrice") ?? Number.MAX_SAFE_INTEGER);
    const inStock = req.nextUrl.searchParams.get("inStock");

    const filters: Record<string, unknown>[] = [
      aliveFilter,
      { price: { $gte: minPrice, $lte: maxPrice } },
    ];

    if (search) {
      filters.push({ name: { $regex: search, $options: "i" } });
    }

    if (category) {
      filters.push({ category });
    }

    if (inStock === "true") {
      filters.push({ stock: { $gt: 0 } });
    }

    const query = { $and: filters };

    const db = await getDb();
    const products = await db.collection("products").find(query).sort({ createdAt: -1 }).toArray();

    const categoriesFromProducts = await db.collection("products").distinct("category", aliveFilter);
    const categoryDocs = await db.collection("categories").find({}).sort({ name: 1 }).toArray();
    const categories = Array.from(
      new Set([...categoryDocs.map((c) => c.name as string), ...categoriesFromProducts])
    ).filter(Boolean);

    return NextResponse.json({ products, categories });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch products.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    if (!["SELLER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const db = await getDb();
    if (session.user.role === "SELLER") {
      const me = await db.collection("users").findOne({ _id: new ObjectId(session.user.id) });
      const status = me?.userStatus ?? "ACTIVE";
      if (status !== "ACTIVE") {
        return NextResponse.json(
          { message: "Seller account must be approved by an admin before listing products." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { name, description, category, images, price, stock } = body as {
      name?: string;
      description?: string;
      category?: string;
      images?: string[];
      price?: number;
      stock?: number;
    };

    if (!name || !description || !category || typeof price !== "number" || typeof stock !== "number") {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    const now = new Date();

    const result = await db.collection("products").insertOne({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      images: images?.length ? images : [],
      price,
      stock,
      sellerId: session.user.id,
      rating: 0,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      { message: "Product created.", productId: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to create product.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
