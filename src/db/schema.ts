import { pgTable, text, integer, boolean, doublePrecision, jsonb, timestamp } from "drizzle-orm/pg-core";

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Matching the mock string UUIDs / Google IDs
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(), // "Cliente" or "Administrador"
  avatar: text("avatar"),
  ordersCount: integer("orders_count").default(0),
  couponsCount: integer("coupons_count").default(0),
  whatsapp: text("whatsapp"),
  address: text("address"),
});

// Categories table
export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull(),
  icon: text("icon"),
  gradientIndex: integer("gradient_index"),
});

// Products table
export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  price: doublePrecision("price").notNull(),
  promoPrice: doublePrecision("promo_price"),
  promoExpiry: text("promo_expiry"), // YYYY-MM-DD
  imageUrls: jsonb("image_urls").$type<string[]>().notNull(),
  stock: integer("stock").notNull(),
  isFeatured: boolean("is_featured").notNull().default(false),
  isPromo: boolean("is_promo").notNull().default(false),
  laboratory: text("laboratory"),
  presentation: text("presentation"),
  indications: text("indications"),
  simplifiedLeaflet: text("simplified_leaflet"),
  expiryDate: text("expiry_date"), // YYYY-MM-DD
  // statistics
  views: integer("views").notNull().default(0),
  searches: integer("searches").notNull().default(0),
  averageViewTime: integer("average_view_time").notNull().default(0),
  cartAdds: integer("cart_adds").notNull().default(0),
  favoritesCount: integer("favorites_count").notNull().default(0),
});

// Promotions table
export const promotions = pgTable("promotions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // "daily" | "weekly" | "banner"
  bannerUrl: text("banner_url").notNull(),
  displayStart: text("display_start").notNull(),
  displayEnd: text("display_end").notNull(),
  description: text("description"),
});

// Flyers table
export const flyers = pgTable("flyers", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  displayStart: text("display_start").notNull(),
  displayEnd: text("display_end").notNull(),
});

// Coupons table
export const coupons = pgTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountAmount: doublePrecision("discount_amount").notNull(),
  minPurchase: doublePrecision("min_purchase").notNull(),
  expiryDate: text("expiry_date").notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
  discount: doublePrecision("discount").notNull(),
  freight: doublePrecision("freight").notNull(),
  total: doublePrecision("total").notNull(),
  status: text("status").notNull(), // "Pendente" | "Em Rota" | "Concluído" | "Cancelado"
  deliveryType: text("delivery_type").notNull(), // "Expressa" | "Padrão"
  paymentMethod: text("payment_method").notNull(), // "PIX" | "Cartão" | "Boleto" | "Dinheiro"
  address: jsonb("address").notNull(), // { label, street, city, zipCode }
  createdAt: text("created_at").notNull(),
});

// Order Items table
export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey(), // Usually "order_id-product_id" or simple UUID
  orderId: text("order_id").notNull(),
  productId: text("product_id").notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
  imageUrl: text("image_url").notNull(),
});

// Admin Logs table
export const adminLogs = pgTable("admin_logs", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").notNull(),
  adminName: text("admin_name").notNull(),
  action: text("action").notNull(),
  details: text("details").notNull(),
  timestamp: text("timestamp").notNull(),
});

// Dashboard Stats table
export const dashboardStats = pgTable("dashboard_stats", {
  id: text("id").primaryKey(), // Typically "singleton"
  accessCount: integer("access_count").notNull().default(0),
  loginsCount: integer("logins_count").notNull().default(0),
  salesConversionRate: doublePrecision("sales_conversion_rate").notNull().default(0.0),
  usersCount: integer("users_count").notNull().default(0),
  outOfStockCount: integer("out_of_stock_count").notNull().default(0),
  nearExpiryCount: integer("near_expiry_count").notNull().default(0),
});
