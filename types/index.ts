export type UserRole = "CUSTOMER" | "SELLER" | "ADMIN";

export type UserAccountStatus = "ACTIVE" | "RESTRICTED" | "PENDING_APPROVAL";

export type PaymentMethod = "COD" | "CARD_STRIPE" | "PAYPAL" | "WALLET";

export interface Address {
  city: string;
  country: string;
  street: string;
  zipCode: string;
}

export interface PaymentDetails {
  cardLast4?: string;
  cardHolderName?: string;
}

export interface AppUser {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  userStatus?: UserAccountStatus;
  deletedAt?: Date | null;
  walletBalance?: number;
  address?: Address;
  paymentDetails?: PaymentDetails;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  wishlist: string[];
  favorites: string[];
  orderHistory: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  _id?: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  stock: number;
  sellerId?: string;
  rating?: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  _id?: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface OrderItemLine {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  _id?: string;
  userId?: string | null;
  guestEmail?: string;
  guestName?: string;
  items: OrderItemLine[];
  subtotal: number;
  tax: number;
  shipping: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: string;
  stripeSessionId?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDoc {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
