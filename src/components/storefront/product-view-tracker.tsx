"use client";

import { useEffect, useRef } from "react";
import { trackViewItem, type GTMItem } from "@/lib/gtm";

export function ProductViewTracker({
  product,
}: {
  product: {
    id: string;
    name: string;
    priceCents: number;
    categoryName?: string;
  };
}) {
  const trackedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (trackedIdRef.current === product.id) return;
    trackedIdRef.current = product.id;

    const price = product.priceCents / 100;
    const item: GTMItem = {
      item_id: product.id,
      item_name: product.name,
      item_category: product.categoryName,
      price: price,
      quantity: 1,
    };
    trackViewItem({
      currency: "USD",
      value: price,
      items: [item],
    });
  }, [product.id, product.name, product.priceCents, product.categoryName]);

  return null;
}
