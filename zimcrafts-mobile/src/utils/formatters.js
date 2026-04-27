export function formatCurrency(amount) {
  const value = Number(amount || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function getProductImage(product) {
  return (
    product?.productimages?.find((entry) => entry?.isPrimary)?.url ||
    product?.productimages?.[0]?.url ||
    "https://via.placeholder.com/640x480.png?text=ZimCrafts"
  );
}
