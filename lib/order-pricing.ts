export function computeOrderTotals(subtotal: number) {
  const s = Math.round(subtotal * 100) / 100;
  const tax = Math.round(s * 0.08 * 100) / 100;
  const shipping = s >= 50 ? 0 : 5.99;
  const total = Math.round((s + tax + shipping) * 100) / 100;
  return { subtotal: s, tax, shipping, total };
}
