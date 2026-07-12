CREATE TABLE "admin_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_id" text NOT NULL,
	"admin_name" text NOT NULL,
	"action" text NOT NULL,
	"details" text NOT NULL,
	"timestamp" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer NOT NULL,
	"icon" text,
	"gradient_index" integer
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"discount_amount" double precision NOT NULL,
	"min_purchase" double precision NOT NULL,
	"expiry_date" text NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "dashboard_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"access_count" integer DEFAULT 0 NOT NULL,
	"logins_count" integer DEFAULT 0 NOT NULL,
	"sales_conversion_rate" double precision DEFAULT 0 NOT NULL,
	"users_count" integer DEFAULT 0 NOT NULL,
	"out_of_stock_count" integer DEFAULT 0 NOT NULL,
	"near_expiry_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flyers" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"image_url" text NOT NULL,
	"display_start" text NOT NULL,
	"display_end" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" double precision NOT NULL,
	"image_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"subtotal" double precision NOT NULL,
	"discount" double precision NOT NULL,
	"freight" double precision NOT NULL,
	"total" double precision NOT NULL,
	"status" text NOT NULL,
	"delivery_type" text NOT NULL,
	"payment_method" text NOT NULL,
	"address" jsonb NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"price" double precision NOT NULL,
	"promo_price" double precision,
	"promo_expiry" text,
	"image_urls" jsonb NOT NULL,
	"stock" integer NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_promo" boolean DEFAULT false NOT NULL,
	"laboratory" text,
	"presentation" text,
	"indications" text,
	"simplified_leaflet" text,
	"expiry_date" text,
	"views" integer DEFAULT 0 NOT NULL,
	"searches" integer DEFAULT 0 NOT NULL,
	"average_view_time" integer DEFAULT 0 NOT NULL,
	"cart_adds" integer DEFAULT 0 NOT NULL,
	"favorites_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"banner_url" text NOT NULL,
	"display_start" text NOT NULL,
	"display_end" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"avatar" text,
	"orders_count" integer DEFAULT 0,
	"coupons_count" integer DEFAULT 0,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
