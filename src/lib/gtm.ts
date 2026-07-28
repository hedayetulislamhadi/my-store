"use client";

declare global {
  interface Window {
    dataLayer: Record<string, any>[];
  }
}

export type GTMItem = {
  item_id: string;
  item_name: string;
  affiliation?: string;
  coupon?: string;
  discount?: number;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  price: number;
  quantity?: number;
};

export type GTMUserData = {
  email?: string;
  phone_number?: string;
  address?: {
    first_name?: string;
    last_name?: string;
    street?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
};

/**
  Push raw object or event to window.dataLayer after ensuring array initialization.
 */
export function pushDataLayer(data: Record<string, any>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}

/**
  Push user_data for Google Ads Enhanced Conversions / GA4 User Data.
 */
export function trackUserData(userData: GTMUserData) {
  pushDataLayer({
    event: "user_data_update",
    user_data: userData,
  });
}

/**
  Clears the previous ecommerce object before pushing new ecommerce event
  as required by official GA4 dataLayer documentation.
 */
export function pushEcommerceEvent(eventName: string, ecommerceData: Record<string, any>, userData?: GTMUserData) {
  pushDataLayer({ ecommerce: null });
  const payload: Record<string, any> = {
    event: eventName,
    ecommerce: ecommerceData,
  };
  if (userData) {
    payload.user_data = userData;
  }
  pushDataLayer(payload);
}

/**
  1. view_item_list
 */
export function trackViewItemList(params: {
  item_list_id?: string;
  item_list_name?: string;
  items: GTMItem[];
}) {
  pushEcommerceEvent("view_item_list", {
    item_list_id: params.item_list_id || "product_catalog",
    item_list_name: params.item_list_name || "Product Catalog",
    items: params.items,
  });
}

/**
  2. select_item
 */
export function trackSelectItem(params: {
  item_list_id?: string;
  item_list_name?: string;
  item: GTMItem;
}) {
  pushEcommerceEvent("select_item", {
    item_list_id: params.item_list_id || "product_catalog",
    item_list_name: params.item_list_name || "Product Catalog",
    items: [params.item],
  });
}

/**
  3. view_item
 */
export function trackViewItem(params: {
  currency?: string;
  value: number;
  items: GTMItem[];
}) {
  pushEcommerceEvent("view_item", {
    currency: params.currency || "USD",
    value: params.value,
    items: params.items,
  });
}

/**
  4. add_to_cart
 */
export function trackAddToCart(params: {
  currency?: string;
  value: number;
  items: GTMItem[];
}) {
  pushEcommerceEvent("add_to_cart", {
    currency: params.currency || "USD",
    value: params.value,
    items: params.items,
  });
}

/**
  5. remove_from_cart
 */
export function trackRemoveFromCart(params: {
  currency?: string;
  value: number;
  items: GTMItem[];
}) {
  pushEcommerceEvent("remove_from_cart", {
    currency: params.currency || "USD",
    value: params.value,
    items: params.items,
  });
}

/**
  6. view_cart
 */
export function trackViewCart(params: {
  currency?: string;
  value: number;
  items: GTMItem[];
}) {
  pushEcommerceEvent("view_cart", {
    currency: params.currency || "USD",
    value: params.value,
    items: params.items,
  });
}

/**
  7. begin_checkout
 */
export function trackBeginCheckout(params: {
  currency?: string;
  value: number;
  coupon?: string;
  items: GTMItem[];
  user_data?: GTMUserData;
}) {
  pushEcommerceEvent(
    "begin_checkout",
    {
      currency: params.currency || "USD",
      value: params.value,
      coupon: params.coupon,
      items: params.items,
    },
    params.user_data,
  );
}

/**
  8. add_shipping_info
 */
export function trackAddShippingInfo(params: {
  currency?: string;
  value: number;
  coupon?: string;
  shipping_tier?: string;
  items: GTMItem[];
  user_data?: GTMUserData;
}) {
  pushEcommerceEvent(
    "add_shipping_info",
    {
      currency: params.currency || "USD",
      value: params.value,
      coupon: params.coupon,
      shipping_tier: params.shipping_tier || "Standard Ground",
      items: params.items,
    },
    params.user_data,
  );
}

/**
  9. add_payment_info
 */
export function trackAddPaymentInfo(params: {
  currency?: string;
  value: number;
  coupon?: string;
  payment_type?: string;
  items: GTMItem[];
  user_data?: GTMUserData;
}) {
  pushEcommerceEvent(
    "add_payment_info",
    {
      currency: params.currency || "USD",
      value: params.value,
      coupon: params.coupon,
      payment_type: params.payment_type || "Cash on Delivery",
      items: params.items,
    },
    params.user_data,
  );
}

/**
  10. purchase
 */
export function trackPurchase(params: {
  transaction_id: string;
  value: number;
  tax?: number;
  shipping?: number;
  currency?: string;
  coupon?: string;
  items: GTMItem[];
  user_data?: GTMUserData;
}) {
  pushEcommerceEvent(
    "purchase",
    {
      transaction_id: params.transaction_id,
      value: params.value,
      tax: params.tax ?? 0,
      shipping: params.shipping ?? 0,
      currency: params.currency || "USD",
      coupon: params.coupon,
      items: params.items,
    },
    params.user_data,
  );
}
