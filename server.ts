import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { db } from "./src/server/db.js";
import { UserRole } from "./src/types.js";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Initialize Supabase safely
let supabase: ReturnType<typeof createClient> | null = null;
const supabaseUrl = process.env.SUPABASE_URL || "https://eygunisvclakxyetlwsf.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_i7b_hzFbK5Smwilj1aVFMA_nez4VSDm";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && (supabaseServiceKey || supabaseAnonKey)) {
  supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

const isProd = process.env.NODE_ENV === "production";
const PORT = 3000;

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Erro ao inicializar o SDK do Gemini", err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Synchronize/Create Admin in local database and Supabase Auth
  let localAdmin = db.getUsers().find(u => u.email === "admin@admin.com");
  if (!localAdmin) {
    const oldAdmin = db.getUsers().find(u => u.role === UserRole.ADMIN);
    if (oldAdmin) {
      console.log("Renaming existing admin in local database to admin@admin.com...");
      oldAdmin.email = "admin@admin.com";
      oldAdmin.name = "Admin Central";
      db.updateUser(oldAdmin);
      localAdmin = oldAdmin;
    } else {
      console.log("Adding default admin to local database...");
      localAdmin = db.addUser({
        id: "user-admin-1",
        email: "admin@admin.com",
        name: "Admin Central",
        role: UserRole.ADMIN,
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbGxXPKa2qwX32b7l-H4YFSp9nLbNhyU57wKvvGI-9MM3MzHjYvpdjPNPbmV5jtvr3TmJRVqo8QV0RwUS0fBM_aWsz60wRbqTA2EySgLxSVB2eZWDVsOyXKr6Dvjt0r3vNd43Y4Dem2CyDuzBZiuVztGMZS8gXbx2FT8oFiU9klCdOnmcLRujSCx2bHgyIeGl9wPXicycxe9PR0cmz4pWCKqwIoWvbuupiAC7WAag387MuCIj-WjIp"
      });
    }
  }

  if (supabase) {
    try {
      console.log("Ensuring admin@admin.com exists in Supabase Auth...");
      const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email: "admin@admin.com",
        password: "admin2759",
        email_confirm: true,
        user_metadata: { name: "Admin Central", role: "admin" }
      });
      
      if (adminError) {
        if (adminError.message.includes("already registered") || adminError.message.includes("already exists")) {
          console.log("Admin admin@admin.com already registered in Supabase. Updating credentials...");
          const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
          if (!listError && usersData?.users) {
            const existingAdmin = (usersData.users as any[]).find(u => u.email === "admin@admin.com");
            if (existingAdmin) {
              await supabase.auth.admin.updateUserById(existingAdmin.id, {
                password: "admin2759",
                user_metadata: { name: "Admin Central", role: "admin" }
              });
              if (localAdmin && localAdmin.id !== existingAdmin.id) {
                console.log(`Syncing local admin ID to Supabase UUID: ${existingAdmin.id}`);
                localAdmin.id = existingAdmin.id;
                db.updateUser(localAdmin);
              }
            }
          }
        } else {
          console.error("Failed to ensure admin in Supabase:", adminError.message);
        }
      } else if (adminData?.user) {
        console.log("Successfully created admin@admin.com in Supabase Auth.");
        if (localAdmin) {
          localAdmin.id = adminData.user.id;
          db.updateUser(localAdmin);
        }
      }
    } catch (err: any) {
      console.error("Error provisioning admin in Supabase:", err.message);
    }
  }

  // Track global views
  app.use((req, res, next) => {
    if (!req.path.startsWith("/api") && !req.path.includes(".")) {
      db.incrementAccessCount();
    }
    next();
  });

  // Auth Middleware Simulation
  const getSessionUser = (req: express.Request) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      // Simple header mock token: "Bearer user-client-1" or "Bearer user-admin-1"
      const token = authHeader.replace("Bearer ", "");
      return db.getUsers().find(u => u.id === token);
    }
    return null;
  };

  // --- REST API Endpoints ---

  // Auth
  app.post("/api/auth/login", async (req, res) => {
    const { email, password, googleToken, whatsapp, name } = req.body;
    db.incrementLoginsCount();

    if (googleToken) {
      // Simulating Google login
      // Check if user already exists
      let user = db.getUsers().find(u => u.email === email);
      if (!user) {
        if (!whatsapp) {
          return res.status(400).json({ error: "O número de WhatsApp é obrigatório para cadastro com Google." });
        }
        // Create new client user with WhatsApp
        user = db.addUser({
          id: "user-google-" + Math.random().toString(36).substr(2, 9),
          email,
          name: name || email.split("@")[0].replace(".", " "),
          role: UserRole.CLIENT,
          avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOTJF9BDj3cbHUIo5z425NXtv-6jab9X0me8Cg7SvnJxaecC3g2nFEs_AyTfy_5OX6dIFCs5rfi-46cR21-QpH0fXw8wTOW9Ylvt4L5YpZOrAL5S1hftzg2X_S7XkTE9gmetub5hgpVHAGJbm1HFmydP2SaMvMTBJPQd56l3ywx8Iqm_tioBOcgIxUGfbY69HELEDGqVVG7R7-YKBz4TT1uLL0MNlhUZtsTrDOHpCoqpGI9dPIH23a",
          ordersCount: 0,
          couponsCount: 1,
          whatsapp: whatsapp,
          address: ""
        });
      } else if (!user.whatsapp) {
        if (!whatsapp) {
          return res.status(400).json({ error: "O número de WhatsApp é obrigatório para sua conta." });
        }
        user.whatsapp = whatsapp;
        db.updateUser(user);
      }
      return res.json({ user, token: user.id });
    }

    if (supabase) {
      try {
        console.log(`Authenticating user with Supabase Auth: ${email}`);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          console.error("Supabase authentication failed:", error.message);
          return res.status(401).json({ error: "E-mail ou senha incorretos." });
        }

        if (data.user) {
          // Check if user exists in our local JSON db profile
          let user = db.getUsers().find(u => u.email === email || u.id === data.user.id);
          if (!user) {
            // User was created directly in Supabase console/admin
            console.log(`User ${email} exists in Supabase but not in local profiles. Syncing user...`);
            user = db.addUser({
              id: data.user.id,
              email: data.user.email || email,
              name: data.user.user_metadata?.name || email.split("@")[0],
              role: (email === "admin@admin.com" || email === "admin@farmacia.com" || data.user.user_metadata?.role === "admin") ? UserRole.ADMIN : UserRole.CLIENT,
              avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyT29-NQE_libaRCpj1TBdlgoz2ZYG3wx8KJN1FTz8iR0EUyry0crXzKMcXTMyN8ZG3cf5rr3LXivlp8c8tk24F8CMXkkrmHbSZjwAIrdsYQ4pu7noyQgJxrsLJEDpxyYGu2s6ylEMHNrXhZUNH19ca7iogSJsZB6F9BlXEtDVQWiGiavWZrxQC7K6KcCu-dkFe95QBcUaJrKZKddflKYwVUDy1QrhccvKuBX6zouI_pIvWbqlAfPI",
              ordersCount: 0,
              couponsCount: 2,
              whatsapp: data.user.user_metadata?.whatsapp || "",
              address: data.user.user_metadata?.address || ""
            });
          } else if (user.id !== data.user.id) {
            // Update local ID to match Supabase UUID
            console.log(`Syncing local user ID to match Supabase Auth UUID for ${email}`);
            user.id = data.user.id;
            db.updateUser(user);
          }

          return res.json({ user, token: user.id });
        }
      } catch (err: any) {
        console.error("Supabase authentication connection error:", err.message);
        return res.status(500).json({ error: "Erro na integração com Supabase: " + err.message });
      }
    }

    // Fallback if Supabase is disabled/not initialized
    const user = db.getUsers().find(u => u.email === email);
    if (user) {
      return res.json({ user, token: user.id });
    }

    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  });

  app.post("/api/auth/register", async (req, res) => {
    const { email, name, password, whatsapp, address } = req.body;
    const existing = db.getUsers().find(u => u.email === email);
    if (existing) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }

    let supabaseId = "user-client-" + Math.random().toString(36).substr(2, 9);

    if (supabase) {
      try {
        console.log(`Registering user in Supabase Auth: ${email}`);
        
        // We attempt to create a pre-confirmed user using Admin Auth API (since we have service role key)
        // to bypass SMTP email verification constraints, which is perfect for development!
        const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, whatsapp, address }
        });

        if (adminError) {
          console.warn("Supabase Auth admin creation failed, falling back to standard signUp:", adminError.message);
          // Standard signup fallback
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name, whatsapp, address }
            }
          });

          if (error) {
            console.error("Supabase signUp failed:", error.message);
            return res.status(400).json({ error: "Supabase: " + error.message });
          }

          if (data.user) {
            supabaseId = data.user.id;
          }
        } else if (adminData?.user) {
          supabaseId = adminData.user.id;
        }
      } catch (err: any) {
        console.error("Supabase registration connection error:", err.message);
        return res.status(500).json({ error: "Erro na integração com Supabase: " + err.message });
      }
    }

    const userRole = (email === "admin@admin.com" || email === "admin@farmacia.com" || email === "admin@vitalidade.com.br") ? UserRole.ADMIN : UserRole.CLIENT;

    const user = db.addUser({
      id: supabaseId,
      email,
      name,
      role: userRole,
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyT29-NQE_libaRCpj1TBdlgoz2ZYG3wx8KJN1FTz8iR0EUyry0crXzKMcXTMyN8ZG3cf5rr3LXivlp8c8tk24F8CMXkkrmHbSZjwAIrdsYQ4pu7noyQgJxrsLJEDpxyYGu2s6ylEMHNrXhZUNH19ca7iogSJsZB6F9BlXEtDVQWiGiavWZrxQC7K6KcCu-dkFe95QBcUaJrKZKddflKYwVUDy1QrhccvKuBX6zouI_pIvWbqlAfPI",
      ordersCount: 0,
      couponsCount: 2,
      whatsapp: whatsapp || "",
      address: address || ""
    });

    res.json({ user, token: user.id });
  });

  // Products
  app.get("/api/products", (req, res) => {
    const { search, category, filter } = req.query;
    let list = db.getProducts();

    if (search) {
      const q = (search as string).toLowerCase();
      db.addSearchTerm("anonymous", q);
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    if (category) {
      list = list.filter(p => p.category === category);
    }

    if (filter === "featured") {
      list = list.filter(p => p.isFeatured);
    } else if (filter === "promo") {
      list = list.filter(p => p.isPromo);
    } else if (filter === "topSellers") {
      list = list.sort((a, b) => (b.cartAdds || 0) - (a.cartAdds || 0));
    }

    res.json(list);
  });

  app.get("/api/products/:id", (req, res) => {
    const prod = db.getProducts().find(p => p.id === req.params.id);
    if (!prod) return res.status(404).json({ error: "Produto não encontrado." });

    // increment view count
    db.addViewHistory("anonymous", prod.id, 8);
    res.json(prod);
  });

  app.post("/api/products", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Não autorizado." });
    }

    const prodData = req.body;
    const newProd = db.addProduct({
      ...prodData,
      id: "prod-" + Math.random().toString(36).substr(2, 9),
      views: 0,
      searches: 0,
      averageViewTime: 0,
      cartAdds: 0,
      favoritesCount: 0
    });

    db.addLog(user.id, user.name, "Criação de Produto", `Produto ${newProd.name} criado com preço R$ ${newProd.price}.`);
    res.json(newProd);
  });

  app.put("/api/products/:id", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Não autorizado." });
    }

    const prodData = req.body;
    db.updateProduct({ ...prodData, id: req.params.id });
    db.addLog(user.id, user.name, "Alteração de Produto", `Produto ${prodData.name} editado/atualizado.`);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Não autorizado." });
    }

    const prod = db.getProducts().find(p => p.id === req.params.id);
    if (prod) {
      db.deleteProduct(req.params.id);
      db.addLog(user.id, user.name, "Exclusão de Produto", `Produto ${prod.name} excluído.`);
    }
    res.json({ success: true });
  });

  // Categories
  app.get("/api/categories", (req, res) => {
    res.json(db.getCategories());
  });

  app.post("/api/categories", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Não autorizado." });
    }
    db.saveCategories(req.body);
    db.addLog(user.id, user.name, "Ordenação de Categorias", "Categorias atualizadas e ordenadas.");
    res.json({ success: true });
  });

  // Promotions
  app.get("/api/promotions", (req, res) => {
    res.json(db.getPromotions());
  });

  app.post("/api/promotions", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Não autorizado." });
    }
    const newPromo = db.addPromotion({
      ...req.body,
      id: "promo-" + Math.random().toString(36).substr(2, 9)
    });
    db.addLog(user.id, user.name, "Criação de Promoção", `Promoção "${newPromo.title}" criada.`);
    res.json(newPromo);
  });

  app.delete("/api/promotions/:id", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Não autorizado." });
    }
    db.deletePromotion(req.params.id);
    db.addLog(user.id, user.name, "Exclusão de Promoção", `Promoção excluída: ${req.params.id}`);
    res.json({ success: true });
  });

  // Flyers
  app.get("/api/flyers", (req, res) => {
    res.json(db.getFlyers());
  });

  app.post("/api/flyers", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Não autorizado." });
    }
    const newFlyer = db.addFlyer({
      ...req.body,
      id: "flyer-" + Math.random().toString(36).substr(2, 9)
    });
    db.addLog(user.id, user.name, "Criação de Encarte", `Encarte "${newFlyer.title}" carregado.`);
    res.json(newFlyer);
  });

  app.delete("/api/flyers/:id", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Não autorizado." });
    }
    db.deleteFlyer(req.params.id);
    db.addLog(user.id, user.name, "Exclusão de Encarte", `Encarte excluído: ${req.params.id}`);
    res.json({ success: true });
  });

  // Orders
  app.get("/api/orders", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Não autorizado." });

    if (user.role === UserRole.ADMIN) {
      res.json(db.getOrders());
    } else {
      res.json(db.getOrders().filter(o => o.userId === user.id));
    }
  });

  app.post("/api/orders", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Não autorizado." });

    const orderData = req.body;
    const newOrder = db.addOrder({
      ...orderData,
      id: "PD-" + Math.floor(1000 + Math.random() * 9000),
      userId: user.id,
      userName: user.name,
      createdAt: new Date().toISOString()
    });

    // clear cart
    db.saveCart(user.id, []);

    // increment ordersCount
    user.ordersCount = (user.ordersCount || 0) + 1;
    db.updateUser(user);

    res.json(newOrder);
  });

  app.put("/api/orders/:id/status", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Não autorizado." });
    }

    const { status } = req.body;
    db.updateOrderStatus(req.params.id, status);
    db.addLog(user.id, user.name, "Alteração de Pedido", `Pedido #${req.params.id} alterado para "${status}".`);
    res.json({ success: true });
  });

  // Coupons
  app.get("/api/coupons", (req, res) => {
    res.json(db.getCoupons());
  });

  // Logs
  app.get("/api/logs", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Não autorizado." });
    }
    res.json(db.getLogs());
  });

  // Stats
  app.get("/api/stats", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Não autorizado." });
    }
    res.json(db.getStats());
  });

  app.post("/api/stats/reset", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Não autorizado." });
    }
    db.resetStats();
    db.addLog(user.id, user.name, "Reset de Estatísticas", "Todas as estatísticas do painel geral foram zeradas.");
    res.json({ success: true, stats: db.getStats() });
  });

  // Favorites
  app.get("/api/favorites", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.json([]);
    res.json(db.getFavorites(user.id));
  });

  app.post("/api/favorites/toggle", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Faça login para favoritar." });

    const { productId } = req.body;
    const list = db.toggleFavorite(user.id, productId);
    res.json(list);
  });

  // Cart
  app.get("/api/cart", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.json([]);
    res.json(db.getCart(user.id));
  });

  app.post("/api/cart", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Não autorizado." });

    const { items, productIdTracked } = req.body;
    db.saveCart(user.id, items);

    if (productIdTracked) {
      db.trackCartAdd(productIdTracked);
    }

    res.json({ success: true });
  });

  // Profile Edit
  app.put("/api/auth/profile", (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Não autorizado." });

    const { name, email, whatsapp, address } = req.body;
    user.name = name;
    user.email = email;
    if (whatsapp !== undefined) user.whatsapp = whatsapp;
    if (address !== undefined) user.address = address;
    db.updateUser(user);

    res.json(user);
  });

  // --- Smart Search / AI assistant ---
  app.post("/api/search/smart", async (req, res) => {
    const { term } = req.body;
    if (!term) return res.status(400).json({ error: "Falta o termo de busca." });

    // Track search
    db.addSearchTerm("anonymous", term);

    if (!ai) {
      // Fallback: search products in database manually
      const products = db.getProducts();
      const matched = products.filter(p => 
        p.name.toLowerCase().includes(term.toLowerCase()) || 
        p.description.toLowerCase().includes(term.toLowerCase()) ||
        p.category.toLowerCase().includes(term.toLowerCase())
      );
      return res.json({
        answer: `Encontrei ${matched.length} produtos que coincidem com sua busca em nosso estoque.`,
        recommendations: matched.map(m => m.id)
      });
    }

    try {
      const productsList = db.getProducts().map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        promoPrice: p.promoPrice,
        indications: p.indications,
        stock: p.stock
      }));

      // Generate smart response based on catalog using gemini-3.5-flash
      const prompt = `Você é o farmacêutico inteligente da "Vitalidade Farmácia".
Analise o termo de pesquisa do usuário: "${term}".
Aqui está nosso catálogo de produtos atual:
${JSON.stringify(productsList, null, 2)}

Responda em português de forma concisa (no máximo 3 frases), explicando se temos produtos adequados para o que ele procura, quais são os benefícios resumidos do principal produto correspondente, ou tirando dúvidas de saúde se ele estiver perguntando de um sintoma (como "dor de cabeça", "gripe").
Ao final, liste os IDs dos produtos recomendados no seguinte formato exato no fim da resposta: "RECOMENDADOS: [id1, id2]".`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      let recommendations: string[] = [];
      const match = text.match(/RECOMENDADOS:\s*\[(.*?)\]/);
      if (match && match[1]) {
        recommendations = match[1].split(",").map(s => s.trim().replace(/['"]/g, ""));
      }

      // Filter recommendations against actual product list
      recommendations = recommendations.filter(id => db.getProducts().some(p => p.id === id));

      // Clean the text to remove the RECOMENDADOS suffix from display if desired
      const cleanAnswer = text.replace(/RECOMENDADOS:\s*\[.*?\]/, "").trim();

      res.json({
        answer: cleanAnswer,
        recommendations: recommendations.length > 0 ? recommendations : db.getProducts().filter(p => p.name.toLowerCase().includes(term.toLowerCase())).map(p => p.id)
      });
    } catch (err) {
      console.error("Erro na busca inteligente com Gemini", err);
      res.status(500).json({ error: "Erro ao processar busca inteligente." });
    }
  });

  // --- Dev / Prod serving ---
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
