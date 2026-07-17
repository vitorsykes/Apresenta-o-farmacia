import React, { useState, useEffect } from "react";
import { User, Product, Category, Promotion, Flyer, Order, AdminLog, DashboardStats, Coupon, StoreSettings } from "../types.js";
import { api } from "../lib/api.js";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area 
} from "recharts";
import { 
  LayoutDashboard, ShoppingBag, FolderTree, Tag, ClipboardList, Plus, Edit2, Trash2, 
  Search, ShieldAlert, Check, RefreshCw, Layers, Sparkles, Loader2, Save, Ticket,
  Settings, Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  storeSettings: StoreSettings;
  onSettingsUpdate: (newSettings: StoreSettings) => void;
  adminUser: User;
  onNavigateBack: () => void;
}

type AdminTab = "dashboard" | "products" | "categories" | "promotions" | "orders" | "logs" | "coupons" | "settings" | "users";

export default function AdminPanel({ storeSettings, onSettingsUpdate, adminUser, onNavigateBack }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Data lists
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Search/Filter states
  const [prodSearch, setProdSearch] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState("");

  // Loading indicator
  const [loading, setLoading] = useState(true);

  // Form states: Products
  const [showProdModal, setShowProdModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodCat, setProdCat] = useState("Medicamentos");
  const [prodPrice, setProdPrice] = useState("");
  const [prodPromoPrice, setProdPromoPrice] = useState("");
  const [prodPromoExpiry, setProdPromoExpiry] = useState("");
  const [prodStock, setProdStock] = useState("");
  const [prodLaboratory, setProdLaboratory] = useState("");
  const [prodPresentation, setProdPresentation] = useState("");
  const [prodIndications, setProdIndications] = useState("");
  const [prodLeaflet, setProdLeaflet] = useState("");
  const [prodExpiryDate, setProdExpiryDate] = useState("");
  const [prodImagesString, setProdImagesString] = useState(""); // comma separated URLs
  const [prodIsFeatured, setProdIsFeatured] = useState(false);
  const [prodIsPromo, setProdIsPromo] = useState(false);

  // Form states: Categories
  const [newCatName, setNewCatName] = useState("");
  const [newCatOrder, setNewCatOrder] = useState("");

  // Form states: Promo
  const [promoTitle, setPromoTitle] = useState("");
  const [promoType, setPromoType] = useState<"daily" | "weekly" | "banner">("banner");
  const [promoBannerUrl, setPromoBannerUrl] = useState("");
  const [promoStart, setPromoStart] = useState("");
  const [promoEnd, setPromoEnd] = useState("");
  const [promoDesc, setPromoDesc] = useState("");

  // Form states: Flyer
  const [flyerTitle, setFlyerTitle] = useState("");
  const [flyerImg, setFlyerImg] = useState("");
  const [flyerStart, setFlyerStart] = useState("");
  const [flyerEnd, setFlyerEnd] = useState("");

  // Form states: Coupon
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState("");
  const [newCouponMinPurchase, setNewCouponMinPurchase] = useState("");
  const [newCouponExpiry, setNewCouponExpiry] = useState("");
  const [couponTargetType, setCouponTargetType] = useState<"all" | "products" | "categories">("all");
  const [couponSelectedProducts, setCouponSelectedProducts] = useState<string[]>([]);
  const [couponSelectedCategories, setCouponSelectedCategories] = useState<string[]>([]);

  // Stats reset states
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Store Settings state
  const [settingsName, setSettingsName] = useState(storeSettings.name);
  const [settingsLogoUrl, setSettingsLogoUrl] = useState(storeSettings.logoUrl);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Users state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Store settings sync
  useEffect(() => {
    setSettingsName(storeSettings.name);
    setSettingsLogoUrl(storeSettings.logoUrl);
  }, [storeSettings]);

  // Load users on demand
  useEffect(() => {
    if (activeTab === "users") {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const list = await api.getUsers();
          setUsersList(list);
        } catch (err) {
          console.error("Erro ao carregar usuários:", err);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [activeTab]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    setSettingsError(null);
    try {
      const updated = await api.updateStoreSettings({ name: settingsName, logoUrl: settingsLogoUrl });
      onSettingsUpdate(updated);
      setSettingsSuccess(true);
      // Log this action to admin log
      await api.getLogs(); // refresh logs
    } catch (err: any) {
      setSettingsError(err.message || "Erro ao salvar configurações");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResetStats = async () => {
    setResetting(true);
    try {
      const updatedStats = await api.resetStats();
      setStats(updatedStats);
      // Refresh entire dashboard data
      await loadAdminData();
      setShowResetConfirm(false);
    } catch (err) {
      console.error("Erro ao zerar estatísticas:", err);
    } finally {
      setResetting(false);
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [
        dashboardStats,
        prodsList,
        catsList,
        promosList,
        flysList,
        ordersList,
        logsList,
        couponsList
      ] = await Promise.all([
        api.getStats(),
        api.getProducts(),
        api.getCategories(),
        api.getPromotions(),
        api.getFlyers(),
        api.getOrders(),
        api.getLogs(),
        api.getCoupons()
      ]);

      setStats(dashboardStats);
      setProducts(prodsList);
      setCategories(catsList);
      setPromotions(promosList);
      setFlyers(flysList);
      setOrders(ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLogs(logsList);
      setCoupons(couponsList);
    } catch (err) {
      console.error("Erro ao carregar dados administrativos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  // Product actions
  const handleOpenProdModal = (prod: Product | null = null) => {
    if (prod) {
      setEditProduct(prod);
      setProdName(prod.name);
      setProdDesc(prod.description);
      setProdCat(prod.category);
      setProdPrice(prod.price.toString());
      setProdPromoPrice(prod.promoPrice ? prod.promoPrice.toString() : "");
      setProdPromoExpiry(prod.promoExpiry || "");
      setProdStock(prod.stock.toString());
      setProdLaboratory(prod.laboratory || "");
      setProdPresentation(prod.presentation || "");
      setProdIndications(prod.indications || "");
      setProdLeaflet(prod.simplifiedLeaflet || "");
      setProdExpiryDate(prod.expiryDate || "");
      setProdImagesString(prod.imageUrls.join(", "));
      setProdIsFeatured(prod.isFeatured);
      setProdIsPromo(prod.isPromo);
    } else {
      setEditProduct(null);
      setProdName("");
      setProdDesc("");
      setProdCat("Medicamentos");
      setProdPrice("");
      setProdPromoPrice("");
      setProdPromoExpiry("");
      setProdStock("");
      setProdLaboratory("");
      setProdPresentation("");
      setProdIndications("");
      setProdLeaflet("");
      setProdExpiryDate("");
      // Default to amoxicilina mock as initial image or placeholder
      setProdImagesString("https://lh3.googleusercontent.com/aida-public/AB6AXuA9wWTNWwC16ebbNTE4vl5LWazENbI6N3owVhb0RPnuT64vBzrXQg-GAVmlbIcUlBVvhFNpMILEgUwRD_wUcPrAWVIhqUG46m3oNHLj6xU4PWRMlNzvm0itbruZjWqM-OgyjJ_zRVrUv9W1WaDc3UuHwzjmMIzMpmIVzIOG7KOQfRzoZyBvT-W8GBKDlOoMcHTDUTs9tuq8_zy81FRKLZipiCIy9jNgOwxFNBfJNdQdbDTEQ2lJNMdm");
      setProdIsFeatured(false);
      setProdIsPromo(false);
    }
    setShowProdModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const imgs = prodImagesString.split(",").map(s => s.trim()).filter(s => s !== "");
    const priceNum = parseFloat(prodPrice) || 0;
    const promoNum = parseFloat(prodPromoPrice) || undefined;
    const stockNum = parseInt(prodStock) || 0;

    const payload: Partial<Product> = {
      name: prodName,
      description: prodDesc,
      category: prodCat,
      price: priceNum,
      promoPrice: promoNum,
      promoExpiry: prodPromoExpiry || undefined,
      stock: stockNum,
      laboratory: prodLaboratory || undefined,
      presentation: prodPresentation || undefined,
      indications: prodIndications || undefined,
      simplifiedLeaflet: prodLeaflet || undefined,
      expiryDate: prodExpiryDate || undefined,
      imageUrls: imgs,
      isFeatured: prodIsFeatured,
      isPromo: prodIsPromo
    };

    try {
      if (editProduct) {
        await api.updateProduct(editProduct.id, { ...editProduct, ...payload } as Product);
      } else {
        await api.createProduct(payload);
      }
      setShowProdModal(false);
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await api.deleteProduct(id);
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickPriceChange = async (prod: Product, newPrice: string) => {
    const val = parseFloat(newPrice);
    if (isNaN(val)) return;
    try {
      await api.updateProduct(prod.id, { ...prod, price: val });
      // update state item quickly
      setProducts(products.map(p => p.id === prod.id ? { ...p, price: val } : p));
    } catch (err) {
      console.error(err);
    }
  };

  // Category Actions
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const orderNum = parseInt(newCatOrder) || (categories.length + 1);

    const updated = [...categories, {
      id: "cat-" + Math.random().toString(36).substr(2, 9),
      name: newCatName,
      sortOrder: orderNum
    }].sort((a, b) => a.sortOrder - b.sortOrder);

    try {
      await api.saveCategories(updated);
      setNewCatName("");
      setNewCatOrder("");
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Excluir esta categoria?")) return;
    const updated = categories.filter(c => c.id !== id);
    try {
      await api.saveCategories(updated);
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Promo Actions
  const handleAddPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitle.trim() || !promoBannerUrl.trim()) return;

    try {
      await api.createPromotion({
        title: promoTitle,
        type: promoType,
        bannerUrl: promoBannerUrl,
        displayStart: promoStart || new Date().toISOString().split("T")[0],
        displayEnd: promoEnd || new Date().toISOString().split("T")[0],
        description: promoDesc
      });
      setPromoTitle("");
      setPromoBannerUrl("");
      setPromoDesc("");
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (!confirm("Excluir esta promoção?")) return;
    try {
      await api.deletePromotion(id);
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Flyer Actions
  const handleAddFlyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flyerTitle.trim() || !flyerImg.trim()) return;

    try {
      await api.createFlyer({
        title: flyerTitle,
        imageUrl: flyerImg,
        displayStart: flyerStart || new Date().toISOString().split("T")[0],
        displayEnd: flyerEnd || new Date().toISOString().split("T")[0]
      });
      setFlyerTitle("");
      setFlyerImg("");
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFlyer = async (id: string) => {
    if (!confirm("Excluir este encarte?")) return;
    try {
      await api.deleteFlyer(id);
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Coupon Actions
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim() || !newCouponDiscount) return;

    const payload: Partial<Coupon> = {
      code: newCouponCode.trim().toUpperCase(),
      discountAmount: parseFloat(newCouponDiscount) || 0,
      minPurchase: parseFloat(newCouponMinPurchase) || 0,
      expiryDate: newCouponExpiry || new Date().toISOString().split("T")[0],
      targetProducts: couponTargetType === "products" ? couponSelectedProducts : [],
      targetCategories: couponTargetType === "categories" ? couponSelectedCategories : []
    };

    try {
      if (editCoupon) {
        await api.updateCoupon(editCoupon.id, payload);
      } else {
        await api.createCoupon(payload);
      }
      setEditCoupon(null);
      setNewCouponCode("");
      setNewCouponDiscount("");
      setNewCouponMinPurchase("");
      setNewCouponExpiry("");
      setCouponTargetType("all");
      setCouponSelectedProducts([]);
      setCouponSelectedCategories([]);
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCouponTrigger = (coupon: Coupon) => {
    setEditCoupon(coupon);
    setNewCouponCode(coupon.code);
    setNewCouponDiscount(coupon.discountAmount.toString());
    setNewCouponMinPurchase(coupon.minPurchase ? coupon.minPurchase.toString() : "");
    setNewCouponExpiry(coupon.expiryDate || "");
    if (coupon.targetProducts && coupon.targetProducts.length > 0) {
      setCouponTargetType("products");
      setCouponSelectedProducts(coupon.targetProducts);
      setCouponSelectedCategories([]);
    } else if (coupon.targetCategories && coupon.targetCategories.length > 0) {
      setCouponTargetType("categories");
      setCouponSelectedCategories(coupon.targetCategories);
      setCouponSelectedProducts([]);
    } else {
      setCouponTargetType("all");
      setCouponSelectedProducts([]);
      setCouponSelectedCategories([]);
    }
  };

  const handleCancelEditCoupon = () => {
    setEditCoupon(null);
    setNewCouponCode("");
    setNewCouponDiscount("");
    setNewCouponMinPurchase("");
    setNewCouponExpiry("");
    setCouponTargetType("all");
    setCouponSelectedProducts([]);
    setCouponSelectedCategories([]);
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;
    try {
      await api.deleteCoupon(id);
      if (editCoupon && editCoupon.id === id) {
        handleCancelEditCoupon();
      }
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Order Actions
  const handleUpdateStatus = async (id: string, currentStatus: Order["status"]) => {
    let nextStatus: Order["status"] = "Em Rota";
    if (currentStatus === "Pendente") nextStatus = "Em Rota";
    else if (currentStatus === "Em Rota") nextStatus = "Concluído";
    else return;

    try {
      await api.updateOrderStatus(id, nextStatus);
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelOrder = async (id: string) => {
    if (!confirm("Cancelar este pedido?")) return;
    try {
      await api.updateOrderStatus(id, "Cancelado");
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Prepare Recharts data based on actual product statistics
  const viewsChartData = products.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
    views: p.views || 0,
    searches: p.searches || 0,
    cartAdds: p.cartAdds || 0,
    favorites: p.favoritesCount || 0
  })).sort((a, b) => b.views - a.views).slice(0, 5); // top 5 most viewed

  // Generate last 7 days dynamically
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const conversionsChartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = daysOfWeek[d.getDay()];
    const dateStr = d.toISOString().split("T")[0];
    
    // Count real orders placed on this date
    const ordersOnDay = orders.filter(o => o.createdAt && o.createdAt.split("T")[0] === dateStr);
    const orderCount = ordersOnDay.length;
    
    // Proportional, realistic representation of daily page views matching total stats
    const isToday = d.toDateString() === new Date().toDateString();
    const mockAccesses = 85 + (d.getDay() * 20) + (orderCount * 12);
    const accesses = isToday ? (stats?.accessCount || mockAccesses) : mockAccesses;

    return {
      day: dayLabel,
      acessos: accesses,
      compras: orderCount
    };
  });

  return (
    <div className="bg-[#fbf9f8] min-h-screen font-sans text-[#1b1c1c] pb-24">
      {/* Admin header */}
      <header className="bg-[#003e7a] text-white py-4 px-6 flex justify-between items-center shadow">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-[#74f9a0]" />
          <div>
            <h1 className="font-extrabold text-sm md:text-base leading-none">Vitalidade Farmácia</h1>
            <p className="text-[10px] text-[#a8c8ff] font-bold mt-0.5">Painel Administrativo Protegido</p>
          </div>
        </div>
        <button 
          onClick={onNavigateBack}
          className="text-xs bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-lg border border-white/20 transition-colors font-bold cursor-pointer"
        >
          Ir para App do Cliente
        </button>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Sidebar tabs selection */}
        <nav className="md:col-span-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-[#c2c6d3]/30 pr-4">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs transition-all w-full text-left cursor-pointer ${
              activeTab === "dashboard" ? "bg-[#d5e3ff] text-[#003e7a]" : "bg-white hover:bg-[#efeded] text-[#727783]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Painel Geral
          </button>
          
          <button 
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs transition-all w-full text-left cursor-pointer ${
              activeTab === "products" ? "bg-[#d5e3ff] text-[#003e7a]" : "bg-white hover:bg-[#efeded] text-[#727783]"
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Produtos
          </button>

          <button 
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs transition-all w-full text-left cursor-pointer ${
              activeTab === "categories" ? "bg-[#d5e3ff] text-[#003e7a]" : "bg-white hover:bg-[#efeded] text-[#727783]"
            }`}
          >
            <FolderTree className="w-4 h-4" /> Categorias
          </button>

          <button 
            onClick={() => setActiveTab("promotions")}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs transition-all w-full text-left cursor-pointer ${
              activeTab === "promotions" ? "bg-[#d5e3ff] text-[#003e7a]" : "bg-white hover:bg-[#efeded] text-[#727783]"
            }`}
          >
            <Tag className="w-4 h-4" /> Campanhas e Encartes
          </button>

          <button 
            onClick={() => setActiveTab("coupons")}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs transition-all w-full text-left cursor-pointer ${
              activeTab === "coupons" ? "bg-[#d5e3ff] text-[#003e7a]" : "bg-white hover:bg-[#efeded] text-[#727783]"
            }`}
          >
            <Ticket className="w-4 h-4" /> Cupons de Desconto
          </button>

          <button 
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs transition-all w-full text-left cursor-pointer ${
              activeTab === "orders" ? "bg-[#d5e3ff] text-[#003e7a]" : "bg-white hover:bg-[#efeded] text-[#727783]"
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Pedidos Clientes
          </button>

          <button 
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs transition-all w-full text-left cursor-pointer ${
              activeTab === "logs" ? "bg-[#d5e3ff] text-[#003e7a]" : "bg-white hover:bg-[#efeded] text-[#727783]"
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Logs de Auditoria
          </button>

          <button 
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs transition-all w-full text-left cursor-pointer ${
              activeTab === "users" ? "bg-[#d5e3ff] text-[#003e7a]" : "bg-white hover:bg-[#efeded] text-[#727783]"
            }`}
          >
            <Users className="w-4 h-4" /> Usuários e Insights
          </button>

          <button 
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs transition-all w-full text-left cursor-pointer ${
              activeTab === "settings" ? "bg-[#d5e3ff] text-[#003e7a]" : "bg-white hover:bg-[#efeded] text-[#727783]"
            }`}
          >
            <Settings className="w-4 h-4" /> Personalização / Logo
          </button>
        </nav>

        {/* Content body based on selected tab */}
        <div className="md:col-span-9 space-y-6">
          {loading ? (
            <div className="bg-white border rounded-xl p-12 text-center text-[#727783] flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-[#003e7a] animate-spin" />
              <span className="text-xs font-semibold">Carregando dados do painel...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && stats && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Dashboard Header & Reset Stats Action */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-[#c2c6d3]/40 shadow-xs">
                    <div>
                      <h2 className="text-base font-bold text-[#1b1c1c] flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5 text-[#003e7a]" />
                        Métricas de Desempenho Geral
                      </h2>
                      <p className="text-[11px] text-[#727783]">Estatísticas de navegação, logins, conversões e engajamento da loja.</p>
                    </div>

                    {!showResetConfirm ? (
                      <button 
                        onClick={() => setShowResetConfirm(true)}
                        className="bg-red-50 text-[#ba1a1a] hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-red-200 cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-pulse" />
                        Zerar Informações do Painel
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-[#ffebee] border border-[#ba1a1a]/20 p-2 rounded-lg text-xs">
                        <span className="font-bold text-[#ba1a1a]">Zerar todas as métricas?</span>
                        <button 
                          disabled={resetting}
                          onClick={handleResetStats}
                          className="bg-[#ba1a1a] text-white hover:bg-[#93000a] px-2.5 py-1 rounded-md font-bold transition-colors disabled:opacity-50"
                        >
                          {resetting ? "Zerando..." : "Sim, Zerar"}
                        </button>
                        <button 
                          onClick={() => setShowResetConfirm(false)}
                          className="text-[#727783] hover:text-[#1b1c1c] font-bold px-2 py-1 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stats Cards Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-[#c2c6d3]/40 shadow-xs">
                      <span className="text-[10px] font-bold text-[#727783] uppercase tracking-wide">Acessos Gerais</span>
                      <p className="font-extrabold text-2xl text-[#003e7a] mt-1">{stats.accessCount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-[#c2c6d3]/40 shadow-xs">
                      <span className="text-[10px] font-bold text-[#727783] uppercase tracking-wide">Logins Efetuados</span>
                      <p className="font-extrabold text-2xl text-[#003e7a] mt-1">{stats.loginsCount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-[#c2c6d3]/40 shadow-xs">
                      <span className="text-[10px] font-bold text-[#727783] uppercase tracking-wide">Taxa de Conversão</span>
                      <p className="font-extrabold text-2xl text-[#006d38] mt-1">{stats.salesConversionRate}%</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-[#c2c6d3]/40 shadow-xs">
                      <span className="text-[10px] font-bold text-[#727783] uppercase tracking-wide">Fora de Estoque</span>
                      <p className={`font-extrabold text-2xl mt-1 ${stats.outOfStockCount > 0 ? "text-[#ba1a1a]" : "text-[#727783]"}`}>
                        {stats.outOfStockCount}
                      </p>
                    </div>
                  </div>

                  {/* Recharts Analytics section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Access / logins trend */}
                    <div className="bg-white p-4 rounded-xl border border-[#c2c6d3]/40 shadow-xs">
                      <h3 className="text-xs font-bold text-[#1b1c1c] uppercase tracking-wide mb-3">Fluxo Semanal de Acessos</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={conversionsChartData}>
                            <defs>
                              <linearGradient id="colorAcessos" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#003e7a" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#003e7a" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" style={{ fontSize: "10px" }} />
                            <YAxis style={{ fontSize: "10px" }} />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="acessos" stroke="#003e7a" fillOpacity={1} fill="url(#colorAcessos)" name="Acessos" />
                            <Area type="monotone" dataKey="compras" stroke="#006d38" fillOpacity={0} name="Compras finalizadas" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Product views details */}
                    <div className="bg-white p-4 rounded-xl border border-[#c2c6d3]/40 shadow-xs">
                      <h3 className="text-xs font-bold text-[#1b1c1c] uppercase tracking-wide mb-3">Engajamento de Produtos (Top 5)</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={viewsChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" style={{ fontSize: "10px" }} />
                            <YAxis style={{ fontSize: "10px" }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="views" fill="#003e7a" name="Visualizações" />
                            <Bar dataKey="searches" fill="#a8c8ff" name="Pesquisas" />
                            <Bar dataKey="cartAdds" fill="#006d38" name="Adições ao Carrinho" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Products Manager tab */}
              {activeTab === "products" && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#727783]" />
                      <input 
                        className="pl-9 pr-4 py-2 w-full border border-[#c2c6d3] rounded-lg text-xs bg-white outline-none focus:border-[#003e7a]" 
                        placeholder="Pesquisar produto pelo nome..."
                        value={prodSearch}
                        onChange={(e) => setProdSearch(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => handleOpenProdModal(null)}
                      className="px-4 py-2 bg-[#006d38] text-white rounded-lg text-xs font-bold hover:bg-[#005228] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Criar Produto
                    </button>
                  </div>

                  {/* List */}
                  <div className="bg-white rounded-xl border border-[#c2c6d3]/40 overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs md:text-sm">
                      <thead>
                        <tr className="bg-[#fbf9f8] border-b border-[#c2c6d3]/40 text-[#424751] font-bold">
                          <th className="p-3">Produto</th>
                          <th className="p-3">Categoria</th>
                          <th className="p-3">Preço Original</th>
                          <th className="p-3">Estoque</th>
                          <th className="p-3">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c2c6d3]/20">
                        {products
                          .filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase()))
                          .map((p) => (
                            <tr key={p.id} className="hover:bg-[#fbf9f8]/40 transition-colors">
                              <td className="p-3 flex items-center gap-2">
                                <img className="w-8 h-8 object-contain rounded border" src={p.imageUrls[0]} alt="" />
                                <div>
                                  <p className="font-bold text-[#1b1c1c]">{p.name}</p>
                                  {p.laboratory && <p className="text-[9px] text-[#727783] uppercase font-semibold">{p.laboratory}</p>}
                                </div>
                              </td>
                              <td className="p-3 text-[#424751] font-medium">{p.category}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-[#003e7a]">R$ </span>
                                  <input 
                                    className="w-16 border rounded px-1.5 py-0.5 font-bold text-[#003e7a] text-xs focus:border-[#003e7a] outline-none"
                                    defaultValue={p.price}
                                    onBlur={(e) => handleQuickPriceChange(p, e.target.value)}
                                  />
                                </div>
                              </td>
                              <td className="p-3 font-semibold">
                                <span className={p.stock === 0 ? "text-[#ba1a1a]" : "text-[#1b1c1c]"}>{p.stock} un</span>
                              </td>
                              <td className="p-3 flex items-center gap-2">
                                <button 
                                  onClick={() => handleOpenProdModal(p)}
                                  className="p-1 text-[#003e7a] hover:bg-[#d5e3ff]/30 rounded transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Categories manager */}
              {activeTab === "categories" && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <form onSubmit={handleAddCategory} className="bg-white border rounded-xl p-5 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm border-b pb-2 flex items-center gap-1.5">
                      <FolderTree className="w-4 h-4 text-[#003e7a]" /> Nova Categoria
                    </h3>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-[#424751]">Nome da Categoria</label>
                      <input 
                        className="rounded-lg border px-3 py-2 text-xs focus:border-[#003e7a] outline-none"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Ex: Primeiros Socorros"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-[#424751]">Ordem de Classificação</label>
                      <input 
                        className="rounded-lg border px-3 py-2 text-xs focus:border-[#003e7a] outline-none"
                        type="number"
                        value={newCatOrder}
                        onChange={(e) => setNewCatOrder(e.target.value)}
                        placeholder="Ex: 7"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-[#006d38] text-white text-xs font-bold rounded-lg hover:bg-[#005228] transition-colors">
                      Criar Categoria
                    </button>
                  </form>

                  <div className="bg-white border rounded-xl p-5 shadow-xs">
                    <h3 className="font-bold text-sm border-b pb-2 mb-4">Categorias Cadastradas</h3>
                    <div className="space-y-2">
                      {categories.map((c) => (
                        <div key={c.id} className="flex justify-between items-center p-3 border rounded-lg bg-[#fbf9f8]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#727783] bg-white border rounded px-1.5 py-0.5">{c.sortOrder}</span>
                            <span className="font-bold text-xs">{c.name}</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteCategory(c.id)}
                            className="text-[#ba1a1a] hover:bg-[#ffdad6]/40 p-1 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Promotions Manager */}
              {activeTab === "promotions" && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Create promotion form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <form onSubmit={handleAddPromotion} className="bg-white border rounded-xl p-5 shadow-xs space-y-4">
                      <h3 className="font-bold text-sm border-b pb-2 flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-[#003e7a]" /> Nova Promoção / Banner
                      </h3>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#424751]">Título da Campanha</label>
                        <input 
                          className="rounded-lg border px-3 py-2 text-xs focus:border-[#003e7a] outline-none"
                          value={promoTitle}
                          onChange={(e) => setPromoTitle(e.target.value)}
                          placeholder="Ex: Queima de Estoque"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#424751]">Banner Image URL</label>
                        <input 
                          className="rounded-lg border px-3 py-2 text-xs focus:border-[#003e7a] outline-none"
                          value={promoBannerUrl}
                          onChange={(e) => setPromoBannerUrl(e.target.value)}
                          placeholder="https://..."
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#424751]">Descrição Curta</label>
                        <textarea 
                          className="rounded-lg border px-3 py-2 text-xs focus:border-[#003e7a] outline-none h-16 resize-none"
                          value={promoDesc}
                          onChange={(e) => setPromoDesc(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="w-full py-2 bg-[#006d38] text-white text-xs font-bold rounded-lg hover:bg-[#005228] transition-colors">
                        Lançar Promoção
                      </button>
                    </form>

                    <form onSubmit={handleAddFlyer} className="bg-white border rounded-xl p-5 shadow-xs space-y-4">
                      <h3 className="font-bold text-sm border-b pb-2 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#003e7a]" /> Upload de Encarte Digital
                      </h3>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#424751]">Nome do Encarte</label>
                        <input 
                          className="rounded-lg border px-3 py-2 text-xs focus:border-[#003e7a] outline-none"
                          value={flyerTitle}
                          onChange={(e) => setFlyerTitle(e.target.value)}
                          placeholder="Ex: Ofertas Semanal de Inverno"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#424751]">Encarte Image URL (PDF/Foto)</label>
                        <input 
                          className="rounded-lg border px-3 py-2 text-xs focus:border-[#003e7a] outline-none"
                          value={flyerImg}
                          onChange={(e) => setFlyerImg(e.target.value)}
                          placeholder="https://..."
                          required
                        />
                      </div>
                      <button type="submit" className="w-full py-2 bg-[#006d38] text-white text-xs font-bold rounded-lg hover:bg-[#005228] transition-colors">
                        Carregar Encarte
                      </button>
                    </form>
                  </div>

                  {/* Active Lists */}
                  <div className="bg-white border rounded-xl p-5 shadow-xs">
                    <h3 className="font-bold text-sm border-b pb-2 mb-4">Campanhas Ativas</h3>
                    <div className="space-y-3">
                      {promotions.map(promo => (
                        <div key={promo.id} className="flex justify-between items-center p-3 border rounded-lg bg-[#fbf9f8]">
                          <div>
                            <p className="font-bold text-xs">{promo.title}</p>
                            <p className="text-[10px] text-[#727783] truncate max-w-sm">{promo.bannerUrl}</p>
                          </div>
                          <button 
                            onClick={() => handleDeletePromotion(promo.id)}
                            className="text-[#ba1a1a] hover:bg-[#ffdad6]/40 p-1 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {flyers.map(fly => (
                        <div key={fly.id} className="flex justify-between items-center p-3 border rounded-lg bg-[#74f9a0]/5 border-[#006d38]/20">
                          <div>
                            <p className="font-bold text-xs text-[#00210d] flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#006d38]" /> [ENCARTE] {fly.title}
                            </p>
                            <p className="text-[10px] text-[#005228] truncate max-w-sm">{fly.imageUrl}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteFlyer(fly.id)}
                            className="text-[#ba1a1a] hover:bg-[#ffdad6]/40 p-1 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Orders tab */}
              {activeTab === "orders" && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-base font-bold text-[#1b1c1c] border-b pb-2">Pedidos de Clientes</h3>
                  
                  {orders.length === 0 ? (
                    <div className="bg-white border rounded-xl p-8 text-center text-[#727783] text-sm">
                      Nenhum pedido realizado ainda.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="bg-white border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-xs transition-shadow">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#003e7a]">Pedido {order.id}</span>
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                order.status === "Concluído" ? "bg-[#74f9a0]/20 text-[#00391b]" :
                                order.status === "Cancelado" ? "bg-[#ffdad6] text-[#ba1a1a]" :
                                order.status === "Em Rota" ? "bg-[#d5e3ff] text-[#00210d]" :
                                "bg-[#efeded] text-[#424751]"
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs text-[#1b1c1c] font-semibold">Cliente: {order.userName}</p>
                            <p className="text-[10px] text-[#727783]">{order.address?.street} - {order.address?.city}</p>
                            
                            {/* Items list */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {order.items.map((item, idx) => (
                                <span key={idx} className="bg-[#fbf9f8] border px-2 py-0.5 rounded text-[10px] text-[#424751] font-semibold">
                                  {item.name} ({item.quantity}x)
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="text-right flex md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto border-t md:border-0 pt-3 md:pt-0 gap-3">
                            <div>
                              <p className="text-[10px] text-[#727783] font-bold uppercase">Total</p>
                              <p className="font-extrabold text-sm text-[#003e7a]">R$ {order.total.toFixed(2)}</p>
                            </div>

                            <div className="flex gap-1.5">
                              {order.status === "Pendente" && (
                                <button 
                                  onClick={() => handleUpdateStatus(order.id, order.status)}
                                  className="px-3 py-1 bg-[#003e7a] hover:bg-[#0055a4] text-white text-[10px] font-bold rounded-lg cursor-pointer"
                                >
                                  Despachar
                                </button>
                              )}
                              {order.status === "Em Rota" && (
                                <button 
                                  onClick={() => handleUpdateStatus(order.id, order.status)}
                                  className="px-3 py-1 bg-[#006d38] hover:bg-[#005228] text-white text-[10px] font-bold rounded-lg cursor-pointer"
                                >
                                  Entregue
                                </button>
                              )}
                              {order.status !== "Concluído" && order.status !== "Cancelado" && (
                                <button 
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="px-3 py-1 border border-[#ba1a1a]/40 text-[#ba1a1a] text-[10px] font-bold rounded-lg hover:bg-[#ffdad6]/20 cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Logs tab */}
              {activeTab === "logs" && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-base font-bold text-[#1b1c1c] border-b pb-2">Logs de Atividade Administrativa</h3>
                  <div className="bg-white rounded-xl border border-[#c2c6d3]/40 overflow-hidden shadow-xs divide-y">
                    {logs.map((log) => (
                      <div key={log.id} className="p-3.5 flex flex-col sm:flex-row justify-between gap-2 hover:bg-[#fbf9f8]/40 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-[#003e7a] uppercase tracking-wider">{log.action}</p>
                          <p className="text-xs text-[#1b1c1c] mt-0.5">{log.details}</p>
                          <p className="text-[10px] text-[#727783] mt-1 font-medium">Por: {log.adminName}</p>
                        </div>
                        <span className="text-[10px] text-[#727783] font-semibold flex-shrink-0">
                          {new Date(log.timestamp).toLocaleDateString("pt-BR", { hour: "numeric", minute: "numeric", second: "numeric" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Coupons tab */}
              {activeTab === "coupons" && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-6 rounded-xl border border-[#c2c6d3]/40 shadow-xs">
                    <h3 className="text-base font-bold text-[#1b1c1c] mb-1 flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-[#003e7a]" />
                      {editCoupon ? "Editar Cupom de Desconto" : "Criar Novo Cupom de Desconto"}
                    </h3>
                    <p className="text-[11px] text-[#727783] mb-4">
                      {editCoupon ? `Modifique as configurações do cupom "${editCoupon.code}" abaixo.` : "Adicione novos códigos de cupons para uso na finalização de compras."}
                    </p>
                    
                    <form onSubmit={handleAddCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#424751]">Código do Cupom</label>
                        <input 
                          type="text"
                          required
                          placeholder="Ex: PROMO20"
                          className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none uppercase font-bold" 
                          value={newCouponCode}
                          onChange={(e) => setNewCouponCode(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#424751]">Valor de Desconto (R$)</label>
                        <input 
                          type="number"
                          required
                          min="1"
                          step="0.01"
                          placeholder="Ex: 20.00"
                          className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                          value={newCouponDiscount}
                          onChange={(e) => setNewCouponDiscount(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#424751]">Compra Mínima (R$)</label>
                        <input 
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Ex: 100.00"
                          className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                          value={newCouponMinPurchase}
                          onChange={(e) => setNewCouponMinPurchase(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#424751]">Data de Validade</label>
                        <input 
                          type="date"
                          required
                          className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                          value={newCouponExpiry}
                          onChange={(e) => setNewCouponExpiry(e.target.value)}
                        />
                      </div>

                      {/* Targeted applicability options */}
                      <div className="sm:col-span-4 mt-2 border-t border-[#c2c6d3]/30 pt-3">
                        <label className="text-xs font-extrabold text-[#1b1c1c] block mb-2">Restrição de Aplicabilidade</label>
                        <div className="flex flex-wrap gap-4 mb-3">
                          <label className="flex items-center gap-1.5 text-xs text-[#424751] font-semibold cursor-pointer">
                            <input 
                              type="radio" 
                              name="couponTargetType" 
                              checked={couponTargetType === "all"} 
                              onChange={() => setCouponTargetType("all")} 
                              className="text-[#003e7a]"
                            />
                            Todo o Site
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-[#424751] font-semibold cursor-pointer">
                            <input 
                              type="radio" 
                              name="couponTargetType" 
                              checked={couponTargetType === "categories"} 
                              onChange={() => setCouponTargetType("categories")} 
                              className="text-[#003e7a]"
                            />
                            Categorias Específicas
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-[#424751] font-semibold cursor-pointer">
                            <input 
                              type="radio" 
                              name="couponTargetType" 
                              checked={couponTargetType === "products"} 
                              onChange={() => setCouponTargetType("products")} 
                              className="text-[#003e7a]"
                            />
                            Produtos Específicos
                          </label>
                        </div>

                        {/* Categories sub-form */}
                        {couponTargetType === "categories" && (
                          <div className="bg-[#fbf9f8] p-3 rounded-lg border border-[#c2c6d3]/40 max-h-40 overflow-y-auto space-y-1.5">
                            <p className="text-[10px] font-bold text-[#727783] mb-1 uppercase tracking-wider">Selecione as categorias aplicáveis:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {categories.map(cat => {
                                const checked = couponSelectedCategories.includes(cat.name);
                                return (
                                  <label key={cat.id} className="flex items-center gap-2 text-xs font-medium text-[#424751] cursor-pointer">
                                    <input 
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        if (checked) {
                                          setCouponSelectedCategories(couponSelectedCategories.filter(c => c !== cat.name));
                                        } else {
                                          setCouponSelectedCategories([...couponSelectedCategories, cat.name]);
                                        }
                                      }}
                                      className="rounded text-[#003e7a]"
                                    />
                                    {cat.name}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Products sub-form */}
                        {couponTargetType === "products" && (
                          <div className="bg-[#fbf9f8] p-3 rounded-lg border border-[#c2c6d3]/40 max-h-52 overflow-y-auto space-y-1.5">
                            <p className="text-[10px] font-bold text-[#727783] mb-1 uppercase tracking-wider">Selecione os produtos aplicáveis:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {products.map(prod => {
                                const checked = couponSelectedProducts.includes(prod.id);
                                return (
                                  <label key={prod.id} className="flex items-center gap-2 text-xs font-medium text-[#424751] cursor-pointer truncate" title={prod.name}>
                                    <input 
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        if (checked) {
                                          setCouponSelectedProducts(couponSelectedProducts.filter(id => id !== prod.id));
                                        } else {
                                          setCouponSelectedProducts([...couponSelectedProducts, prod.id]);
                                        }
                                      }}
                                      className="rounded text-[#003e7a]"
                                    />
                                    <span className="truncate">{prod.name} (R$ {prod.price.toFixed(2)})</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="sm:col-span-4 flex justify-end gap-2 mt-2">
                        {editCoupon && (
                          <button 
                            type="button"
                            onClick={handleCancelEditCoupon}
                            className="bg-[#efeded] hover:bg-[#e1e0e0] text-[#727783] font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        )}
                        <button 
                          type="submit"
                          className="bg-[#003e7a] hover:bg-[#002850] text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          {editCoupon ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          {editCoupon ? "Salvar Alterações" : "Adicionar Cupom"}
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="bg-white rounded-xl border border-[#c2c6d3]/40 overflow-hidden shadow-xs">
                    <div className="bg-[#fbf9f8] px-4 py-3 border-b border-[#c2c6d3]/40 flex justify-between items-center">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#424751]">Cupons Ativos ({coupons.length})</h4>
                    </div>

                    {coupons.length === 0 ? (
                      <div className="p-8 text-center text-[#727783] text-xs font-medium">
                        Nenhum cupom de desconto cadastrado.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#c2c6d3]/40">
                        {coupons.map((coupon) => (
                          <div key={coupon.id} className="p-4 flex justify-between items-center hover:bg-[#fbf9f8]/30 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="bg-[#d5e3ff] text-[#003e7a] text-xs font-extrabold px-2.5 py-0.5 rounded-lg border border-[#a8c8ff]">
                                  {coupon.code}
                                </span>
                                <span className="text-xs font-bold text-[#006d38]">
                                  Desconto: R$ {coupon.discountAmount.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#727783]">
                                <p>Compra Mínima: <span className="font-semibold text-[#1b1c1c]">R$ {coupon.minPurchase ? coupon.minPurchase.toFixed(2) : "Sem mínimo"}</span></p>
                                <p>Validade: <span className="font-semibold text-[#1b1c1c]">{coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString("pt-BR") : "Indeterminada"}</span></p>
                              </div>

                              {coupon.targetCategories && coupon.targetCategories.length > 0 && (
                                <p className="text-[11px] text-[#003e7a] font-medium">
                                  Aplicável às categorias: <span className="text-[#1b1c1c] font-semibold">{coupon.targetCategories.join(", ")}</span>
                                </p>
                              )}

                              {coupon.targetProducts && coupon.targetProducts.length > 0 && (
                                <p className="text-[11px] text-[#003e7a] font-medium">
                                  Aplicável a <span className="text-[#1b1c1c] font-semibold">{coupon.targetProducts.length} produto(s) específico(s)</span>:{" "}
                                  <span className="text-[#727783] text-[10px]">
                                    {coupon.targetProducts.map(id => products.find(p => p.id === id)?.name || id).join(", ")}
                                  </span>
                                </p>
                              )}

                              {(!coupon.targetCategories || coupon.targetCategories.length === 0) && (!coupon.targetProducts || coupon.targetProducts.length === 0) && (
                                <p className="text-[11px] text-[#555] font-medium">
                                  Aplicável a: <span className="text-gray-600">Todo o site</span>
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleEditCouponTrigger(coupon)}
                                className="text-[#003e7a] hover:bg-[#d5e3ff] p-2 rounded-lg transition-colors border border-transparent hover:border-[#a8c8ff] cursor-pointer"
                                title="Editar Cupom"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="text-[#ba1a1a] hover:bg-[#ffdad6] p-2 rounded-lg transition-colors border border-transparent hover:border-[#ffb4ab] cursor-pointer"
                                title="Excluir Cupom"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Settings Tab */}
              {activeTab === "settings" && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-6 rounded-xl border border-[#c2c6d3]/40 shadow-xs">
                    <h3 className="text-base font-bold text-[#1b1c1c] mb-1 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-[#003e7a]" />
                      Personalização da Loja / Farmácia
                    </h3>
                    <p className="text-[11px] text-[#727783] mb-6">
                      Altere o Nome da sua Loja e o Link do Logo que aparecem na tela de abertura (Splash), na tela de login e no cabeçalho do aplicativo do cliente.
                    </p>

                    {settingsSuccess && (
                      <div className="mb-4 bg-[#006d38]/10 text-[#006d38] border border-[#006d38]/20 px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        Configurações salvas e aplicadas com sucesso em toda a plataforma!
                      </div>
                    )}

                    {settingsError && (
                      <div className="mb-4 bg-[#ba1a1a]/10 text-[#ba1a1a] border border-[#ba1a1a]/20 px-4 py-3 rounded-lg text-xs font-bold">
                        {settingsError}
                      </div>
                    )}

                    <form onSubmit={handleSaveSettings} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-[#424751]">Nome da Loja</label>
                          <input 
                            type="text"
                            required
                            placeholder="Ex: Vitalidade Farmácia"
                            className="rounded-lg border bg-white px-3.5 py-2.5 text-xs focus:border-[#003e7a] outline-none font-medium" 
                            value={settingsName}
                            onChange={(e) => setSettingsName(e.target.value)}
                          />
                          <p className="text-[10px] text-[#727783]">Nome exibido em títulos, cabeçalhos e assistente virtual.</p>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-[#424751]">Link do Logo (URL da Imagem)</label>
                          <input 
                            type="url"
                            required
                            placeholder="https://exemplo.com/logo.png"
                            className="rounded-lg border bg-white px-3.5 py-2.5 text-xs focus:border-[#003e7a] outline-none" 
                            value={settingsLogoUrl}
                            onChange={(e) => setSettingsLogoUrl(e.target.value)}
                          />
                          <p className="text-[10px] text-[#727783]">Cole um link direto da imagem do seu logotipo (PNG ou SVG transparente preferencialmente).</p>
                        </div>
                      </div>

                      {/* Visual Preview Section */}
                      <div className="border-t pt-4 mt-2">
                        <label className="text-xs font-bold text-[#424751] block mb-2">Visualização Prévia</label>
                        <div className="bg-[#fbf9f8] rounded-xl p-6 border border-[#c2c6d3]/30 flex flex-col items-center justify-center gap-3">
                          <div className="h-14 flex items-center justify-center p-2 bg-white rounded-lg border shadow-xs max-w-full">
                            <img 
                              src={settingsLogoUrl || "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=200&auto=format&fit=crop"} 
                              alt="Logo Preview" 
                              className="h-full object-contain max-w-[280px]"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=200&auto=format&fit=crop";
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-extrabold text-[#003e7a] tracking-wide">{settingsName || "Nome da Loja"}</span>
                          <span className="text-[9px] text-[#727783] bg-[#efeded] px-2 py-0.5 rounded font-semibold uppercase">Como aparecerá no aplicativo</span>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t">
                        <button 
                          type="submit"
                          disabled={savingSettings}
                          className="bg-[#003e7a] hover:bg-[#002850] text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                        >
                          {savingSettings ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Salvar Alterações
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* Users & Insights Tab */}
              {activeTab === "users" && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-6 rounded-xl border border-[#c2c6d3]/40 shadow-xs">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-base font-bold text-[#1b1c1c] flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#003e7a]" />
                        Clientes e Insights de Compras
                      </h3>
                      <span className="bg-[#d5e3ff] text-[#003e7a] text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {usersList.length} cadastrados
                      </span>
                    </div>
                    <p className="text-[11px] text-[#727783] mb-4">
                      Veja a lista completa de clientes cadastrados, com históricos de buscas personalizadas e preferências de compras deduzidas pela Inteligência Artificial.
                    </p>

                    {loadingUsers ? (
                      <div className="py-12 text-center text-[#727783] flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-[#003e7a] animate-spin" />
                        <span className="text-xs">Carregando lista de clientes...</span>
                      </div>
                    ) : usersList.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#727783] font-medium border border-dashed rounded-xl">
                        Nenhum cliente cadastrado no sistema ainda.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-[#c2c6d3]/30 rounded-xl">
                        <table className="w-full text-left text-xs text-[#1b1c1c] border-collapse">
                          <thead>
                            <tr className="bg-[#f5f3f3] border-b text-[#424751] font-bold">
                              <th className="p-3">Nome / WhatsApp</th>
                              <th className="p-3">E-mail</th>
                              <th className="p-3">Endereço de Entrega</th>
                              <th className="p-3">Buscas Inteligentes</th>
                              <th className="p-3">Mais Comprado (IA)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {usersList.map((usr) => (
                              <tr key={usr.id} className="hover:bg-[#fbf9f8]/40 transition-colors">
                                <td className="p-3">
                                  <p className="font-bold text-[#003e7a]">{usr.name}</p>
                                  <p className="text-[10px] text-[#727783] font-semibold mt-0.5">{usr.whatsapp || "Sem WhatsApp"}</p>
                                </td>
                                <td className="p-3 text-[#424751] font-medium">{usr.email}</td>
                                <td className="p-3 text-[#424751] text-[11px] max-w-[200px] truncate" title={usr.address}>
                                  {usr.address || "Não informado"}
                                </td>
                                <td className="p-3">
                                  {usr.insights?.mostSearched ? (
                                    <span className="bg-[#efeded] text-[#1b1c1c] font-bold text-[10px] px-2 py-0.5 rounded-lg border">
                                      {usr.insights.mostSearched}
                                    </span>
                                  ) : (
                                    <span className="text-[#727783] text-[10px] italic">Sem dados de busca</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {usr.insights?.mostPurchased ? (
                                    <span className="bg-[#e8fbf0] text-[#006d38] font-bold text-[10px] px-2 py-0.5 rounded-lg border border-[#006d38]/20">
                                      {usr.insights.mostPurchased}
                                    </span>
                                  ) : (
                                    <span className="text-[#727783] text-[10px] italic">Nenhuma compra</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Create/Edit Product Modal */}
      {showProdModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.form 
            onSubmit={handleSaveProduct}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
          >
            <div className="p-4 bg-[#003e7a] text-white flex justify-between items-center flex-shrink-0">
              <h3 className="font-bold text-sm">{editProduct ? "Editar Produto" : "Criar Novo Produto"}</h3>
              <button 
                type="button"
                onClick={() => setShowProdModal(false)}
                className="text-white hover:text-red-200 text-xs font-bold"
              >
                Fechar [X]
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 bg-[#fbf9f8]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#424751]">Nome do Produto</label>
                  <input 
                    className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#424751]">Categoria</label>
                  <select 
                    className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none"
                    value={prodCat}
                    onChange={(e) => setProdCat(e.target.value)}
                  >
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#424751]">Laboratório</label>
                  <input 
                    className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                    value={prodLaboratory}
                    onChange={(e) => setProdLaboratory(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#424751]">Apresentação</label>
                  <input 
                    className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                    value={prodPresentation}
                    onChange={(e) => setProdPresentation(e.target.value)}
                    placeholder="Ex: 30 Comprimidos"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#424751]">Estoque</label>
                  <input 
                    className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#424751]">Preço Original (R$)</label>
                  <input 
                    className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                    type="number"
                    step="0.01"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#424751]">Preço Promocional (R$)</label>
                  <input 
                    className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                    type="number"
                    step="0.01"
                    value={prodPromoPrice}
                    onChange={(e) => setProdPromoPrice(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#424751]">Validade da Promoção</label>
                  <input 
                    className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                    type="date"
                    value={prodPromoExpiry}
                    onChange={(e) => setProdPromoExpiry(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#424751]">Data de Vencimento do Produto</label>
                  <input 
                    className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                    type="date"
                    value={prodExpiryDate}
                    onChange={(e) => setProdExpiryDate(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#424751]">URLs das Imagens (separadas por vírgula)</label>
                  <input 
                    className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                    value={prodImagesString}
                    onChange={(e) => setProdImagesString(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#424751]">Descrição Curta</label>
                  <textarea 
                    className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none h-16 resize-none" 
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#424751]">Indicações Clínicas</label>
                  <textarea 
                    className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none h-16 resize-none" 
                    value={prodIndications}
                    onChange={(e) => setProdIndications(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#424751]">Bula Simplificada</label>
                  <textarea 
                    className="rounded-lg border bg-white px-3 py-2 text-xs focus:border-[#003e7a] outline-none h-16 resize-none" 
                    value={prodLeaflet}
                    onChange={(e) => setProdLeaflet(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    id="featured" 
                    type="checkbox" 
                    checked={prodIsFeatured}
                    onChange={(e) => setProdIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-[#003e7a]"
                  />
                  <label htmlFor="featured" className="text-xs font-bold text-[#424751]">Produto em Destaque</label>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    id="promo" 
                    type="checkbox" 
                    checked={prodIsPromo}
                    onChange={(e) => setProdIsPromo(e.target.checked)}
                    className="w-4 h-4 text-[#003e7a]"
                  />
                  <label htmlFor="promo" className="text-xs font-bold text-[#424751]">Produto em Promoção</label>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-[#f5f3f3] flex justify-end gap-2 flex-shrink-0">
              <button 
                type="button" 
                onClick={() => setShowProdModal(false)}
                className="px-4 py-2 border rounded-lg text-xs font-bold bg-white hover:bg-[#efeded] transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-[#003e7a] text-white text-xs font-bold rounded-lg hover:bg-[#0055a4] transition-colors flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                {editProduct ? "Salvar Alterações" : "Criar Produto"}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
}
