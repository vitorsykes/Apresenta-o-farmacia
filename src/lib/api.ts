import { User, Product, Category, Promotion, Flyer, Order, Coupon, AdminLog, DashboardStats } from "../types.js";

const getHeaders = () => {
  const token = localStorage.getItem("vitalidade_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  login: async (email: string, password?: string, googleToken?: string): Promise<{ user: User; token: string }> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, googleToken })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao fazer login");
    }
    const data = await res.json();
    localStorage.setItem("vitalidade_token", data.token);
    return data;
  },

  register: async (email: string, name: string): Promise<{ user: User; token: string }> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao registrar");
    }
    const data = await res.json();
    localStorage.setItem("vitalidade_token", data.token);
    return data;
  },

  updateProfile: async (name: string, email: string): Promise<User> => {
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ name, email })
    });
    if (!res.ok) throw new Error("Erro ao atualizar perfil");
    return res.json();
  },

  logout: () => {
    localStorage.removeItem("vitalidade_token");
  },

  // Products
  getProducts: async (search?: string, category?: string, filter?: string): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category) params.append("category", category);
    if (filter) params.append("filter", filter);
    const res = await fetch(`/api/products?${params.toString()}`);
    return res.json();
  },

  getProductById: async (id: string): Promise<Product> => {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error("Produto não encontrado");
    return res.json();
  },

  createProduct: async (product: Partial<Product>): Promise<Product> => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error("Erro ao criar produto");
    return res.json();
  },

  updateProduct: async (id: string, product: Product): Promise<void> => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error("Erro ao atualizar produto");
  },

  deleteProduct: async (id: string): Promise<void> => {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Erro ao excluir produto");
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const res = await fetch("/api/categories");
    return res.json();
  },

  saveCategories: async (cats: Category[]): Promise<void> => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(cats)
    });
    if (!res.ok) throw new Error("Erro ao ordenar categorias");
  },

  // Promotions
  getPromotions: async (): Promise<Promotion[]> => {
    const res = await fetch("/api/promotions");
    return res.json();
  },

  createPromotion: async (promo: Partial<Promotion>): Promise<Promotion> => {
    const res = await fetch("/api/promotions", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(promo)
    });
    if (!res.ok) throw new Error("Erro ao criar promoção");
    return res.json();
  },

  deletePromotion: async (id: string): Promise<void> => {
    const res = await fetch(`/api/promotions/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Erro ao excluir promoção");
  },

  // Flyers
  getFlyers: async (): Promise<Flyer[]> => {
    const res = await fetch("/api/flyers");
    return res.json();
  },

  createFlyer: async (flyer: Partial<Flyer>): Promise<Flyer> => {
    const res = await fetch("/api/flyers", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(flyer)
    });
    if (!res.ok) throw new Error("Erro ao criar encarte");
    return res.json();
  },

  deleteFlyer: async (id: string): Promise<void> => {
    const res = await fetch(`/api/flyers/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Erro ao excluir encarte");
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    const res = await fetch("/api/orders", { headers: getHeaders() });
    return res.json();
  },

  createOrder: async (order: Partial<Order>): Promise<Order> => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(order)
    });
    if (!res.ok) throw new Error("Erro ao finalizar pedido");
    return res.json();
  },

  updateOrderStatus: async (id: string, status: Order["status"]): Promise<void> => {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error("Erro ao atualizar status do pedido");
  },

  // Coupons
  getCoupons: async (): Promise<Coupon[]> => {
    const res = await fetch("/api/coupons");
    return res.json();
  },

  // Logs
  getLogs: async (): Promise<AdminLog[]> => {
    const res = await fetch("/api/logs", { headers: getHeaders() });
    return res.json();
  },

  // Stats
  getStats: async (): Promise<DashboardStats> => {
    const res = await fetch("/api/stats", { headers: getHeaders() });
    return res.json();
  },

  // Favorites
  getFavorites: async (): Promise<string[]> => {
    const res = await fetch("/api/favorites", { headers: getHeaders() });
    return res.json();
  },

  toggleFavorite: async (productId: string): Promise<string[]> => {
    const res = await fetch("/api/favorites/toggle", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ productId })
    });
    if (!res.ok) throw new Error("Erro ao favoritar");
    return res.json();
  },

  // Cart
  getCart: async (): Promise<{ productId: string; quantity: number }[]> => {
    const res = await fetch("/api/cart", { headers: getHeaders() });
    return res.json();
  },

  saveCart: async (items: { productId: string; quantity: number }[], productIdTracked?: string): Promise<void> => {
    await fetch("/api/cart", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ items, productIdTracked })
    });
  },

  // Smart Search
  smartSearch: async (term: string): Promise<{ answer: string; recommendations: string[] }> => {
    const res = await fetch("/api/search/smart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term })
    });
    return res.json();
  }
};
