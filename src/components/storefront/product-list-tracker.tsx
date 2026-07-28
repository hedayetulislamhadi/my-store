"use client";

import { useEffect, useRef } from "react";
import { trackViewItemList, type GTMItem } from "@/lib/gtm";

export function ProductListTracker({
  listId = "product_catalog",
  listName = "Product Catalog",
  products,
}: {
  listId?: string;
  listName?: string;
  products: {
    id: string;
    name: string;
    priceCents: number;
  }[];
}) {
  const trackedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!products || products.length === 0) return;
    const currentKey = `${listId}_${products.map((p) => p.id).join(",")}`;
    if (trackedKeyRef.current === currentKey) return;
    trackedKeyRef.current = currentKey;

    const items: GTMItem[] = products.map((p, index) => ({
      item_id: p.id,
      item_name: p.name,
      price: p.priceCents / 100,
      index: index,
      item_list_id: listId,
      item_list_name: listName,
    }));

    trackViewItemList({
      item_list_id: listId,
      item_list_name: listName,
      items,
    });
  }, [listId, listName, products]);

  return null;
}
