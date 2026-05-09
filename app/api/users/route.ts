import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password, role } = body as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      role?: "CUSTOMER" | "SELLER" | "ADMIN";
    };

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { message: "name, email, phone, and password are required." },
        { status: 400 }
      );
    }

    if (role === "ADMIN") {
      return NextResponse.json({ message: "Admin accounts cannot be registered publicly." }, { status: 403 });
    }

    const safeRole = role === "SELLER" ? "SELLER" : "CUSTOMER";
    const userStatus = safeRole === "SELLER" ? "PENDING_APPROVAL" : "ACTIVE";

    const db = await getDb();
    const users = db.collection("users");

    const existingUser = await users.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }],
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with the same email or phone already exists." },
        { status: 409 }
      );
    }

    const emailVerificationToken = randomBytes(24).toString("hex");
    const passwordHash = await hash(password, 12);
    const now = new Date();

    const result = await users.insertOne({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: passwordHash,
      role: safeRole,
      userStatus,
      walletBalance: 0,
      isEmailVerified: false,
      emailVerificationToken,
      wishlist: [],
      favorites: [],
      orderHistory: [],
      createdAt: now,
      updatedAt: now,
    });

    const verifyPath = `/auth/verify-email?token=${emailVerificationToken}`;
    await sendVerificationEmail(email.toLowerCase().trim(), verifyPath);

    return NextResponse.json(
      {
        message: "User created. Please verify your email.",
        userId: result.insertedId.toString(),
        verifyUrl: verifyPath,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to register user.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const role = req.nextUrl.searchParams.get("role");
    const db = await getDb();

    const query: Record<string, unknown> = {};
    if (role && ["CUSTOMER", "SELLER", "ADMIN"].includes(role)) {
      query.role = role;
    }

    const users = await db
      .collection("users")
      .find(query, { projection: { password: 0, emailVerificationToken: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch users.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { token } = (await req.json()) as { token?: string };
    if (!token) {
      return NextResponse.json({ message: "Token is required." }, { status: 400 });
    }

    const db = await getDb();
    const update = await db.collection("users").updateOne(
      { emailVerificationToken: token },
      {
        $set: { isEmailVerified: true, updatedAt: new Date() },
        $unset: { emailVerificationToken: "" },
      }
    );

    if (update.matchedCount === 0) {
      return NextResponse.json({ message: "Invalid token." }, { status: 404 });
    }

    return NextResponse.json({ message: "Email verified successfully." });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to verify email.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
