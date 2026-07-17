import { useState, useEffect, useRef } from "react";
import { User, Product, Order, StoreSettings } from "./types.js";
import { api } from "./lib/api.js";
import Splash from "./components/Splash.js";
import Login from "./components/Login.js";
import ClientHome from "./components/ClientHome.js";
import ProductDetail from "./components/ProductDetail.js";
import Cart from "./components/Cart.js";
import Checkout from "./components/Checkout.js";
import Profile from "./components/Profile.js";
import AdminPanel from "./components/AdminPanel.js";
import { Home, ShoppingCart, User as UserIcon, LogIn, Bell, Check, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type ActiveScreen = "splash" | "login" | "client" | "product_detail" | "cart" | "checkout" | "profile" | "admin";

interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "warning";
}

export default function App() {
  const [screen, setScreen] = useState<ActiveScreen>("splash");
  const [user, setUser] = useState<User | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Custom store settings (dynamic branding) with localStorage caching
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem("store_settings");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse store settings from localStorage", e);
    }
    return {
      name: "Vitalidade Farmácia",
      logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6i7zlH0ucNVZqyQTI4kAbRn88Nay0-Xb7uNMDNj4gBGdRRYCZndzvuuDZq_difdf81jjJLBsQZwY8vZH61S28d91z2xvNEH5T9WQfc3Xr1o1Z8qPHEGLswjYnYaMNEs0Il7E8dTkpIQ8TjacNq1SkgxtAeECAdDHZZkJcusluJU7xkUw6R3-kd1BV1NWma9nLv5nASikysOsVscfpQ-L22Sm3iu2Gi8oPuu4bJAfUf8Bq5QluPkB0"
    };
  });

  // Sync store settings with localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("store_settings", JSON.stringify(storeSettings));
    } catch (e) {
      console.error("Failed to save store settings to localStorage", e);
    }
  }, [storeSettings]);
  
  // Cart & Favorites states
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Bottom navigation tab
  const [activeTab, setActiveTab] = useState<"home" | "cart" | "profile">("home");

  // Notifications / toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prevOrdersRef = useRef<Order[] | null>(null);

  const addToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000); // 5 seconds for notifications to be well-readable
  };

  // 1. Initial Load & Session Recovery
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const [prods, settings] = await Promise.all([
          api.getProducts(),
          api.getStoreSettings().catch(err => {
            console.error("Failed to load store settings", err);
            return {
              name: "Vitalidade Farmácia",
              logoUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6i7zlH0ucNVZqyQTI4kAbRn88Nay0-Xb7uNMDNj4gBGdRRYCZndzvuuDZq_difdf81jjJLBsQZwY8vZH61S28d91z2xvNEH5T9WQfc3Xr1o1Z8qPHEGLswjYnYaMNEs0Il7E8dTkpIQ8TjacNq1SkgxtAeECAdDHZZkJcusluJU7xkUw6R3-kd1BV1NWma9nLv5nASikysOsVscfpQ-L22Sm3iu2Gi8oPuu4bJAfUf8Bq5QluPkB0"
            };
          })
        ]);
        setProducts(prods);
        setStoreSettings(settings);

        const token = localStorage.getItem("vitalidade_token");
        if (token) {
          try {
            const currentUser = await api.getMe();
            setUser(currentUser);
            // Load cart and favorites
            const [userCart, userFavs] = await Promise.all([
              api.getCart(),
              api.getFavorites()
            ]);
            setCart(userCart);
            setFavorites(userFavs);
          } catch (profileErr) {
            console.warn("Sessão inválida ou expirada, limpando token...", profileErr);
            localStorage.removeItem("vitalidade_token");
          }
        }
      } catch (err) {
        console.error("Erro ao inicializar aplicativo", err);
      }
    };
    initializeApp();
  }, []);

  // Request Notification permission on mount or login
  useEffect(() => {
    if (user && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [user]);

  // Periodic polling for notifications
  useEffect(() => {
    if (!user) {
      prevOrdersRef.current = null;
      return;
    }

    const pollOrders = async () => {
      try {
        const currentOrders = await api.getOrders();
        
        // If first load of orders, just cache them and return
        if (prevOrdersRef.current === null) {
          prevOrdersRef.current = currentOrders;
          return;
        }

        const prevOrders = prevOrdersRef.current;

        if (user.role === "Administrador") {
          // ADMIN: Check for new orders
          const newOrders = currentOrders.filter(
            (curr) => !prevOrders.some((prev) => prev.id === curr.id)
          );

          if (newOrders.length > 0) {
            newOrders.forEach((order) => {
              const msg = `🔔 Novo pedido recebido! Pedido #${order.id} por ${order.userName || "Cliente"}.`;
              addToast(msg, "success");
              
              if ("Notification" in window && Notification.permission === "granted") {
                try {
                  new Notification(`${storeSettings.name} - Novo Pedido`, {
                    body: `Pedido #${order.id} por ${order.userName || "Cliente"} no total de R$ ${order.total.toFixed(2)}`,
                    tag: `new-order-${order.id}`
                  });
                } catch (e) {
                  console.error(e);
                }
              }
            });
          }
        } else {
          // CLIENT: Check for status changes on my orders
          currentOrders.forEach((currOrder) => {
            const prevOrder = prevOrders.find((prev) => prev.id === currOrder.id);
            if (prevOrder && prevOrder.status !== currOrder.status) {
              // Status changed!
              if (currOrder.status === "Em Rota") {
                const msg = `🚚 Seu pedido #${currOrder.id} foi despachado e está em rota de entrega!`;
                addToast(msg, "info");
                
                if ("Notification" in window && Notification.permission === "granted") {
                  try {
                    new Notification(`${storeSettings.name} - Pedido Despachado`, {
                      body: `Seu pedido #${currOrder.id} está a caminho!`,
                      tag: `dispatch-order-${currOrder.id}`
                    });
                  } catch (e) {
                    console.error(e);
                  }
                }
              } else if (currOrder.status === "Concluído") {
                const msg = `🎉 Seu pedido #${currOrder.id} foi entregue com sucesso! Obrigado!`;
                addToast(msg, "success");
                
                if ("Notification" in window && Notification.permission === "granted") {
                  try {
                    new Notification(`${storeSettings.name} - Pedido Entregue`, {
                      body: `Seu pedido #${currOrder.id} foi entregue com sucesso!`,
                      tag: `done-order-${currOrder.id}`
                    });
                  } catch (e) {
                    console.error(e);
                  }
                }
              } else if (currOrder.status === "Cancelado") {
                const msg = `⚠️ Seu pedido #${currOrder.id} foi cancelado.`;
                addToast(msg, "warning");
                
                if ("Notification" in window && Notification.permission === "granted") {
                  try {
                    new Notification(`${storeSettings.name} - Pedido Cancelado`, {
                      body: `Seu pedido #${currOrder.id} foi cancelado.`,
                      tag: `cancel-order-${currOrder.id}`
                    });
                  } catch (e) {
                    console.error(e);
                  }
                }
              }
            }
          });
        }

        prevOrdersRef.current = currentOrders;
      } catch (err: any) {
        if (err?.message === "Rate exceeded") {
          console.warn("Monitoramento de pedidos pausado temporariamente: limite de requisições excedido.");
        } else {
          console.error("Erro ao buscar atualizações de pedidos", err);
        }
      }
    };

    // Run immediately and then every 25 seconds for a responsive yet rate-safe feel
    pollOrders();
    const intervalId = setInterval(pollOrders, 25000);

    return () => clearInterval(intervalId);
  }, [user]);

  const handleSplashComplete = () => {
    if (user) {
      setScreen("client");
      setActiveTab("home");
    } else {
      setScreen("login");
    }
  };

  const handleLoginSuccess = async (loggedInUser: User) => {
    setUser(loggedInUser);
    addToast(`Olá, ${loggedInUser.name.split(" ")[0]}! Login efetuado com sucesso.`);
    
    // Load fresh data
    try {
      const [userCart, userFavs, freshProds] = await Promise.all([
        api.getCart(),
        api.getFavorites(),
        api.getProducts()
      ]);
      setCart(userCart);
      setFavorites(userFavs);
      setProducts(freshProds);
    } catch (err) {
      console.error(err);
    }

    setScreen("client");
    setActiveTab("home");
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCart([]);
    setFavorites([]);
    setScreen("login");
    addToast("Você saiu da sua conta.", "info");
  };

  // Cart operations
  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      setScreen("login");
      addToast("Por favor, faça login para adicionar ao carrinho.", "info");
      return;
    }

    const updated = [...cart];
    const existing = updated.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      updated.push({ productId, quantity });
    }

    setCart(updated);
    addToast("Produto adicionado ao carrinho!");

    try {
      await api.saveCart(updated, productId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCartQuantity = async (productId: string, quantity: number) => {
    const updated = cart.map(item => item.productId === productId ? { ...item, quantity } : item);
    setCart(updated);
    try {
      await api.saveCart(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveCartItem = async (productId: string) => {
    const updated = cart.filter(item => item.productId !== productId);
    setCart(updated);
    addToast("Item removido do carrinho.", "info");
    try {
      await api.saveCart(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Favorites operations
  const handleToggleFavorite = async (productId: string) => {
    if (!user) {
      setScreen("login");
      addToast("Faça login para favoritar produtos.", "info");
      return;
    }

    try {
      const updatedFavs = await api.toggleFavorite(productId);
      setFavorites(updatedFavs);
      const isFav = updatedFavs.includes(productId);
      addToast(isFav ? "Produto favoritado!" : "Removido dos favoritos.", "info");
    } catch (err) {
      console.error(err);
    }
  };

  // Navigation controller for tab switches
  const handleTabChange = (tab: "home" | "cart" | "profile") => {
    setActiveTab(tab);
    if (tab === "home") {
      setScreen("client");
    } else if (tab === "cart") {
      setScreen("cart");
    } else if (tab === "profile") {
      setScreen("profile");
    }
  };

  const handleOrderSuccess = (newOrder: Order) => {
    setCart([]);
    addToast(`Pedido ${newOrder.id} finalizado com sucesso!`, "success");
    // navigate back to profile to track order
    setActiveTab("profile");
    setScreen("profile");
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] flex flex-col justify-between m-0 p-0 overflow-x-hidden select-none">
      
      {/* Toast notifications portal banner */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div 
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={`p-4 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-3 pointer-events-auto ${
                toast.type === "success" 
                  ? "bg-[#74f9a0] border-[#006d38]/20 text-[#00210d]" 
                  : toast.type === "warning"
                  ? "bg-[#ffdad6] border-[#ba1a1a]/20 text-[#ba1a1a]"
                  : "bg-[#d5e3ff] border-[#003e7a]/20 text-[#001b3d]"
              }`}
            >
              {toast.type === "success" ? (
                <Check className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Info className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex-1 w-full flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {screen === "splash" && (
            <Splash storeSettings={storeSettings} onComplete={handleSplashComplete} />
          )}

          {screen === "login" && (
            <Login storeSettings={storeSettings} onLoginSuccess={handleLoginSuccess} />
          )}

          {screen === "client" && user && (
            <ClientHome 
              storeSettings={storeSettings}
              user={user}
              onProductSelect={(id) => { setSelectedProductId(id); setScreen("product_detail"); }}
              onCartSelect={() => handleTabChange("cart")}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onAddToCart={handleAddToCart}
              cartCount={cart.reduce((acc, curr) => acc + curr.quantity, 0)}
            />
          )}

          {screen === "product_detail" && selectedProductId && (
            <ProductDetail 
              productId={selectedProductId}
              onBack={() => setScreen(activeTab === "home" ? "client" : (activeTab === "cart" ? "cart" : "profile"))}
              onAddToCart={(id, qty) => { handleAddToCart(id, qty); setScreen("client"); }}
            />
          )}

          {screen === "cart" && (
            <Cart 
              cartItems={cart}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveItem={handleRemoveCartItem}
              onProceedToCheckout={() => setScreen("checkout")}
              products={products}
              onProductSelect={(id) => { setSelectedProductId(id); setScreen("product_detail"); }}
            />
          )}

          {screen === "checkout" && user && (
            <Checkout 
              storeSettings={storeSettings}
              user={user}
              cartItems={cart}
              products={products}
              onOrderSuccess={handleOrderSuccess}
              onCancel={() => setScreen("cart")}
            />
          )}

          {screen === "profile" && user && (
            <Profile 
              user={user}
              onLogout={handleLogout}
              onUpdateUser={setUser}
              onNavigateToAdmin={() => setScreen("admin")}
            />
          )}

          {screen === "admin" && user && (
            <AdminPanel 
              storeSettings={storeSettings}
              onSettingsUpdate={(newSettings) => setStoreSettings(newSettings)}
              adminUser={user}
              onNavigateBack={() => { setScreen("profile"); setActiveTab("profile"); }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Customer bottom tab bar */}
      {screen !== "splash" && screen !== "login" && screen !== "admin" && screen !== "checkout" && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#c2c6d3]/40 py-2.5 px-6 flex justify-around items-center z-40 shadow-[0px_-2px_10px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => handleTabChange("home")}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === "home" && screen === "client" ? "text-[#003e7a]" : "text-[#727783] hover:text-[#1b1c1c]"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold">Início</span>
          </button>

          <button 
            onClick={() => handleTabChange("cart")}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer relative ${
              activeTab === "cart" || screen === "cart" ? "text-[#003e7a]" : "text-[#727783] hover:text-[#1b1c1c]"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute top-0 right-1.5 bg-[#ba1a1a] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cart.reduce((acc, curr) => acc + curr.quantity, 0)}
              </span>
            )}
            <span className="text-[10px] font-bold">Carrinho</span>
          </button>

          <button 
            onClick={() => handleTabChange("profile")}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === "profile" && (screen === "profile" || screen === "product_detail" && activeTab === "profile") ? "text-[#003e7a]" : "text-[#727783] hover:text-[#1b1c1c]"
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold">Perfil</span>
          </button>
        </nav>
      )}
    </div>
  );
}
