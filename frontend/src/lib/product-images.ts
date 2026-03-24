const LOCAL_PRODUCT_IMAGES_BY_SLUG: Record<string, string> = {
  clasico: "/images/products/roll1.PNG",
  oreo: "/images/products/roll2.PNG",
  pistacho: "/images/products/roll3.PNG",
  "manjar-y-nueces": "/images/products/roll2.PNG",
  "choco-avellana": "/images/products/roll3.PNG",
  "frutos-rojos": "/images/products/roll1.PNG",
  "creme-brulee": "/images/products/roll1.PNG",
  pizza: "/images/products/roll2.PNG",
  "box-miti-miti-x4": "/images/products/roll1.PNG",
  "box-miti-miti-x6": "/images/products/roll2.PNG",
  "box-premium-x4": "/images/products/roll3.PNG",
  "box-premium-x6": "/images/products/roll1.PNG",
};

export function resolveCatalogImageUrl(
  slug: string,
  imageUrl?: string | null
): string | null {
  const trimmedImageUrl = imageUrl?.trim();
  if (trimmedImageUrl) {
    return trimmedImageUrl;
  }

  return LOCAL_PRODUCT_IMAGES_BY_SLUG[slug] ?? null;
}

