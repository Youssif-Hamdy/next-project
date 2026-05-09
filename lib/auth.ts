import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare, hash } from "bcryptjs";
import { getDb } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Email or Phone",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) {
          return null;
        }

        const db = await getDb();
        const user = await db.collection("users").findOne({
          $or: [
            { email: credentials.identifier.toLowerCase().trim() },
            { phone: credentials.identifier.trim() },
          ],
        });

        if (!user?.password) {
          return null;
        }

        if (user.deletedAt) {
          return null;
        }

        const userStatus = user.userStatus ?? "ACTIVE";
        if (userStatus === "RESTRICTED") {
          return null;
        }

        if (!user.isEmailVerified) {
          return null;
        }

        const isHash = /^\$2[aby]\$\d{2}\$/.test(user.password);
        let isValidPassword = false;

        if (isHash) {
          isValidPassword = await compare(credentials.password, user.password);
        } else {
          // Backward compatibility for legacy plain-text passwords.
          // On successful login, migrate immediately to bcrypt hash.
          isValidPassword = credentials.password === user.password;
          if (isValidPassword) {
            const nextHash = await hash(credentials.password, 12);
            await db.collection("users").updateOne(
              { _id: user._id },
              { $set: { password: nextHash, updatedAt: new Date() } }
            );
          }
        }

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          userStatus,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user?.email) {
        const db = await getDb();
        const doc = await db.collection("users").findOne({ email: user.email });
        if (doc) {
          token.sub = doc._id.toString();
          token.role = doc.role ?? "CUSTOMER";
          token.userStatus = doc.userStatus ?? "ACTIVE";
        }
        return token;
      }

      if (user) {
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
        token.userStatus = (user as { userStatus?: string }).userStatus ?? "ACTIVE";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = typeof token.role === "string" ? token.role : "CUSTOMER";
        session.user.userStatus = typeof token.userStatus === "string" ? token.userStatus : "ACTIVE";
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      if (!user.email) {
        return false;
      }

      const db = await getDb();
      const existingUser = await db.collection("users").findOne({ email: user.email });

      if (existingUser?.deletedAt) {
        return false;
      }
      if (existingUser?.userStatus === "RESTRICTED") {
        return false;
      }

      if (!existingUser) {
        const now = new Date();
        await db.collection("users").insertOne({
          name: user.name ?? "Google User",
          email: user.email,
          phone: "",
          password: "",
          role: "CUSTOMER",
          userStatus: "ACTIVE",
          walletBalance: 0,
          isEmailVerified: true,
          wishlist: [],
          favorites: [],
          orderHistory: [],
          createdAt: now,
          updatedAt: now,
        });
      }

      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};
