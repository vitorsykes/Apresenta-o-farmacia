export enum UserRole {
  CLIENT = "Cliente",
  ADMIN = "Administrador",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string; // only stored server-side
  avatar?: string;
  ordersCount?: number;
  couponsCount?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  promoPrice?: number;
  promoExpiry?: string; // YYYY-MM-DD
  imageUrls: string[];
  stock: number;
  isFeatured: boolean;
  isPromo: boolean;
  laboratory?: string;
  presentation?: string; // e.g. "21 Cápsulas"
  indications?: string;
  simplifiedLeaflet?: string; // Bula simplificada
  expiryDate?: string; // product shelf life expiry
  // stats tracked
  views: number;
  searches: number;
  averageViewTime: number; // in seconds
  cartAdds: number;
  favoritesCount: number;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  icon?: string; // Lucide icon name
  gradientIndex?: number; // 1-6 gradient class index
}

export interface Promotion {
  id: string;
  title: string;
  type: "daily" | "weekly" | "banner";
  bannerUrl: string;
  displayStart: string;
  displayEnd: string;
  description?: string;
}

export interface Flyer {
  id: string;
  title: string;
  imageUrl: string;
  displayStart: string;
  displayEnd: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  freight: number;
  total: number;
  status: "Pendente" | "Em Rota" | "Concluído" | "Cancelado";
  deliveryType: "Expressa" | "Padrão";
  paymentMethod: "PIX" | "Cartão" | "Boleto" | "Dinheiro";
  address: {
    label: string;
    street: string;
    city: string;
    zipCode: string;
  };
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountAmount: number;
  minPurchase: number;
  expiryDate: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string; // e.g. "Criação de Produto", "Alteração de Preço"
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  accessCount: number;
  loginsCount: number;
  salesConversionRate: number; // percent e.g. 2.4
  usersCount: number;
  outOfStockCount: number;
  nearExpiryCount: number;
}
