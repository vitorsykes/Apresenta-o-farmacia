import React, { useState, useEffect } from "react";
import { User, Product, Category, Promotion, Flyer, Order, AdminLog, DashboardStats } from "../types.js";
import { api } from "../lib/api.js";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area 
} from "recharts";
import { 
  LayoutDashboard, ShoppingBag, FolderTree, Tag, ClipboardList, Plus, Edit2, Trash2, 
  Search, ShieldAlert, Check, RefreshCw, Layers, Sparkles, Loader2, Save 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  adminUser: User;
  onNavigateBack: () => void;
}

type AdminTab = "dashboard" | "products" | "categories" | "promotions" | "orders" | "logs";

export default function AdminPanel({ adminUser, onNavigateBack }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Data lists
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);

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
        logsList
      ] = await Promise.all([
        api.getStats(),
        api.getProducts(),
        api.getCategories(),
        api.getPromotions(),
        api.getFlyers(),
        api.getOrders(),
        api.getLogs()
      ]);

      setStats(dashboardStats);
      setProducts(prodsList);
      setCategories(catsList);
      setPromotions(promosList);
      setFlyers(flysList);
      setOrders(ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLogs(logsList);
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

  // Prepare Recharts mock data based on actual product statistics
  const viewsChartData = products.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
    views: p.views || 0,
    searches: p.searches || 0,
    cartAdds: p.cartAdds || 0,
    favorites: p.favoritesCount || 0
  })).sort((a, b) => b.views - a.views).slice(0, 5); // top 5 most viewed

  const conversionsChartData = [
    { day: "Segunda", acessos: 150, compras: 8 },
    { day: "Terça", acessos: 220, compras: 12 },
    { day: "Quarta", acessos: 190, compras: 10 },
    { day: "Quinta", acessos: 340, compras: 18 },
    { day: "Sexta", acessos: 410, compras: 24 },
    { day: "Sábado", acessos: 320, compras: 15 },
    { day: "Domingo", acessos: stats?.accessCount ? stats.accessCount - 1630 : 250, compras: orders.length }
  ];

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
