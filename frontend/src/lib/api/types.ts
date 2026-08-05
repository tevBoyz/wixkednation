/** Shared API types aligned with backend Postman / api-endpoints.md */

export type PaginationQuery = {
  page?: number;
  limit?: number;
};

export type PaginatedMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

export type UserRole = "customer" | "admin" | string;

export type AuthUser = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  role?: UserRole | null;
  authProvider?: string | null;
  hasPin?: boolean;
};

export type Reputation = {
  reputationScore: number;
  deliveredOrderCount: number;
  cancelledOrderCount: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
  deletedAt?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  children?: Category[];
};

export type ProductImage = {
  id: string;
  url: string;
  isCover?: boolean;
  sortOrder?: number;
};

export type ProductSku = {
  id: string;
  label?: string | null;
  volume: number | string;
  measurementUnit: string;
  price: number | string;
  sortOrder: number;
  /** Present on admin responses; public list is already filtered to visible. */
  isVisible?: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  /** Primary denormalized pack price for catalog cards. */
  price: number | string | null;
  measurementUnit: string;
  /** Primary denormalized pack size for catalog cards. */
  volume?: number | string | null;
  /** Visible SKUs only on public APIs, sorted by sortOrder. */
  skus?: ProductSku[];
  productType?: string;
  strainType?: string | null;
  thcPercent?: string | number | null;
  cbdPercent?: string | number | null;
  flavors?: string[];
  effects?: string[];
  isVisible?: boolean;
  isFeatured?: boolean;
  categoryId?: string;
  category?: Category | null;
  images?: ProductImage[];
  coverImageIndex?: number;
  deletedAt?: string | null;
};

export type ProductsListResult = {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CartItem = {
  id: string;
  productId: string;
  skuId?: string;
  quantity: number;
  volume?: number | string | null;
  /** volume × quantity from API */
  effectiveVolume?: number | string | null;
  measurementUnit?: string | null;
  lineTotal?: number | string | null;
  sku?: ProductSku | null;
  skuLabel?: string | null;
  product?: Product | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Cart = {
  id?: string;
  userId?: string;
  items: CartItem[];
  itemCount?: number;
  totalAmount?: number | string;
  createdAt?: string;
  updatedAt?: string;
};

export type Address = {
  id: string;
  label?: string | null;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  country: string;
  isDefault?: boolean;
};

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "OutForDelivery"
  | "Delivered"
  | "Cancelled"
  | string;

export type OrderItemSnapshot = {
  productId: string;
  skuId?: string;
  name: string;
  slug?: string;
  unitPrice: number | string;
  quantity: number;
  volume?: number | string | null;
  /** volume × quantity */
  effectiveVolume?: number | string | null;
  measurementUnit?: string | null;
  skuLabel?: string | null;
  lineTotal: number | string;
};

export type OrderAddressSnapshot = {
  id?: string;
  label?: string | null;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  country: string;
};

export type OrderStatusHistoryEntry = {
  id: string;
  oldStatus?: OrderStatus | null;
  newStatus: OrderStatus;
  note?: string | null;
  changedBy?: string | null;
  createdAt?: string;
};

export type UserReputation = {
  reputationScore: number;
  deliveredOrderCount: number;
  cancelledOrderCount: number;
};

export type AdminOrderUser = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  role?: string;
  reputation?: UserReputation;
};

export type AdminOrder = Order & {
  user?: AdminOrderUser;
  statusHistory?: OrderStatusHistoryEntry[];
};

export type AdminOrdersListResult = {
  orders: AdminOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminOrderStatusUpdateResult = {
  order: AdminOrder;
  notification?: {
    id: string;
    userId: string;
    orderId?: string | null;
    type?: string;
    title?: string;
    message?: string;
    isRead?: boolean;
    createdAt?: string;
  };
};

export type AdminCustomer = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  authProvider?: string | null;
  reputation?: UserReputation;
  orderCount?: number;
  createdAt?: string;
};

export type AdminCustomersListResult = {
  customers: AdminCustomer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminCustomerSummaryOrder = {
  id: string;
  orderNumber?: string;
  status: OrderStatus;
  totalAmount?: number | string | null;
  createdAt?: string;
};

export type AdminCustomerDetail = AdminCustomer & {
  role?: string;
  updatedAt?: string;
};

export type AdminCustomerDetailResult = {
  customer: AdminCustomerDetail;
  orderCount: number;
  recentOrders: AdminCustomerSummaryOrder[];
};

export type AdminCustomerOrdersResult = {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminMediaItem = {
  imageId: string;
  productId: string;
  productName: string;
  productSlug: string;
  url: string;
  size: number;
  createdAt: string;
  isCover: boolean;
  productIsVisible: boolean;
  productDeletedAt: string | null;
};

export type AdminMediaListResult = {
  items: AdminMediaItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalImages: number;
    totalBytes: number;
  };
};

export type OrderRisk = {
  lowReputation?: boolean;
  pendingPileUp?: boolean;
  reputationScore?: number;
  cancelledOrderCount?: number;
  pendingOrderCount?: number;
};

export type Order = {
  id: string;
  orderNumber?: string;
  status: OrderStatus;
  paymentMethod?: string;
  totalAmount?: number | string;
  createdAt?: string;
  updatedAt?: string;
  items?: OrderItemSnapshot[];
  deliveryAddress?: OrderAddressSnapshot;
  statusHistory?: OrderStatusHistoryEntry[];
  placedAsGuest?: boolean;
  matchedExistingAccount?: boolean;
  risk?: OrderRisk;
};

export type MyOrdersResult = {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type Notification = {
  id: string;
  title?: string;
  message?: string;
  isRead: boolean;
  createdAt?: string;
  orderId?: string | null;
};

export type NotificationsPayload = {
  notifications?: Notification[];
  items?: Notification[];
  unreadCount: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminPhoneNumber = {
  id: string;
  phone: string;
  showOnBanner?: boolean;
};

export type OrderContactPhone = {
  id: string;
  phone: string;
};

export type AdminSettings = {
  id?: string;
  defaultMeasurementUnit?: string;
  defaultCurrency?: string;
  adminPhoneNumbers?: AdminPhoneNumber[];
  smsProviderConfig?: {
    provider?: string;
    senderId?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type SmsLog = {
  id: string;
  phone: string;
  message?: string | null;
  provider?: string | null;
  providerRef?: string | null;
  status?: string | null;
  errorMessage?: string | null;
  metadata?: {
    purpose?: string;
    [key: string]: unknown;
  } | null;
  createdAt?: string;
};

export type SmsLogsResult = {
  logs: SmsLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SendTestSmsResult = {
  phone: string;
  provider?: string | null;
  providerRef?: string | null;
  smsLogId?: string | null;
  purpose?: string;
};

export function toQuery(
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  if (!params) {
    return "";
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    search.set(key, String(value));
  }

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
