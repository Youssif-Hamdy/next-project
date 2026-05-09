import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";

export const aliveProductFilter = {
  $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
};

export type CartLine = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export async function buildLinesFromRequestedItems(
  items: { productId: string; quantity: number }[]
): Promise<{ lines: CartLine[] } | { error: string }> {
  const db = await getDb();
  const lines: CartLine[] = [];

  for (const item of items) {
    if (!ObjectId.isValid(item.productId) || !Number.isFinite(item.quantity) || item.quantity < 1) {
      return { error: "Invalid line item." };
    }
    const p = await db.collection("products").findOne({
      $and: [{ _id: new ObjectId(item.productId) }, aliveProductFilter],
    });
    if (!p) return { error: "Product not available." };
    if (p.stock < item.quantity) return { error: `Insufficient stock for ${p.name}.` };
    const unitPrice = Number(p.price);
    lines.push({
      productId: item.productId,
      name: String(p.name),
      quantity: item.quantity,
      unitPrice,
      lineTotal: Math.round(unitPrice * item.quantity * 100) / 100,
    });
  }

  return { lines };
}

export async function decrementStock(lines: CartLine[]) {
  const db = await getDb();
  const now = new Date();
  const decremented: { id: ObjectId; qty: number }[] = [];

  for (const line of lines) {
    const res = await db.collection("products").updateOne(
      {
        $and: [
          { _id: new ObjectId(line.productId) },
          aliveProductFilter,
          { stock: { $gte: line.quantity } },
        ],
      },
      { $inc: { stock: -line.quantity }, $set: { updatedAt: now } }
    );
    if (res.modifiedCount === 0) {
      for (const d of decremented) {
        await db.collection("products").updateOne({ _id: d.id }, { $inc: { stock: d.qty } });
      }
      return { ok: false as const, message: "Stock changed, please retry checkout." };
    }
    decremented.push({ id: new ObjectId(line.productId), qty: line.quantity });
  }

  return { ok: true as const, decremented };
}

export async function rollbackStock(decremented: { id: ObjectId; qty: number }[]) {
  const db = await getDb();
  for (const d of decremented) {
    await db.collection("products").updateOne({ _id: d.id }, { $inc: { stock: d.qty } });
  }
}
