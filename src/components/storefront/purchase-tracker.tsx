"use client";

import { useEffect } from "react";
import { trackPurchase, type GTMItem, type GTMUserData } from "@/lib/gtm";

export type PurchaseTrackerOrder = {
  orderNumber: string;
  totalCents: number;
  taxCents: number;
  shippingCents: number;
  couponCode?: string | null;
  email?: string;
  phone?: string;
  customerName?: string;
  shipLine1?: string;
  shipCity?: string;
  shipState?: string | null;
  shipPostalCode?: string;
  shipCountry?: string;
  items: {
    productId?: string | null;
    name: string;
    priceCents: number;
    quantity: number;
  }[];
};

export function PurchaseTracker({ order }: { order: PurchaseTrackerOrder }) {
  useEffect(() => {
    if (!order) return;

    // Deduplicate purchase tracking per order via sessionStorage
    const storageKey = `gtm_purchase_tracked_${order.orderNumber}`;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(storageKey)) {
      return;
    }

    const items: GTMItem[] = order.items.map((item) => ({
      item_id: item.productId || item.name,
      item_name: item.name,
      price: item.priceCents / 100,
      quantity: item.quantity,
    }));

    let userData: GTMUserData | undefined;
    if (order.email || order.phone || order.customerName) {
      const names = (order.customerName || "").trim().split(" ");
      userData = {
        email: order.email,
        phone_number: order.phone,
        address: {
          first_name: names[0] || "",
          last_name: names.slice(1).join(" ") || "",
          street: order.shipLine1,
          city: order.shipCity,
          region: order.shipState || undefined,
          postal_code: order.shipPostalCode,
          country: order.shipCountry,
        },
      };
    }

    trackPurchase({
      transaction_id: order.orderNumber,
      value: order.totalCents / 100,
      tax: order.taxCents / 100,
      shipping: order.shippingCents / 100,
      currency: "USD",
      coupon: order.couponCode || undefined,
      items,
      user_data: userData,
    });

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey, "true");
    }
  }, [order]);

  return null;
}
