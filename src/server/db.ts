import fs from "fs";
import path from "path";
import { 
  User, 
  Product, 
  Category, 
  Promotion, 
  Flyer, 
  Order, 
  Coupon, 
  AdminLog, 
  DashboardStats,
  UserRole 
} from "../types";

const isVercel = process.env.VERCEL === "1" || !!process.env.NOW_REGION;
const LOCAL_DB_DIR = path.join(process.cwd(), "data");
const LOCAL_DB_FILE = path.join(LOCAL_DB_DIR, "db.json");

const DB_DIR = isVercel ? "/tmp" : LOCAL_DB_DIR;
const DB_FILE = isVercel ? "/tmp/db.json" : LOCAL_DB_FILE;

interface DatabaseSchema {
  users: User[];
  products: Product[];
  categories: Category[];
  promotions: Promotion[];
  flyers: Flyer[];
  orders: Order[];
  coupons: Coupon[];
  logs: AdminLog[];
  stats: DashboardStats;
  favorites: { [userId: string]: string[] };
  cart: { [userId: string]: { productId: string; quantity: number }[] };
  searchHistory: { [userId: string]: { term: string; timestamp: string }[] };
  viewHistory: { [userId: string]: { productId: string; timestamp: string; duration: number }[] };
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Medicamentos", sortOrder: 1, icon: "pill", gradientIndex: 1 },
  { id: "cat-2", name: "Higiene", sortOrder: 2, icon: "soap", gradientIndex: 2 },
  { id: "cat-3", name: "Infantil", sortOrder: 3, icon: "child_care", gradientIndex: 3 },
  { id: "cat-4", name: "Dermocosméticos", sortOrder: 4, icon: "face_retouching_natural", gradientIndex: 4 },
  { id: "cat-5", name: "Fitness", sortOrder: 5, icon: "fitness_center", gradientIndex: 5 },
  { id: "cat-6", name: "Melhor Idade", sortOrder: 6, icon: "elderly", gradientIndex: 6 }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Ibuprofeno 400mg 10 Cápsulas Genérico",
    description: "Indicado para alívio temporário de dores leves a moderadas e redução da febre. Rápida absorção para alívio imediato.",
    category: "Medicamentos",
    price: 15.90,
    promoPrice: 12.72,
    promoExpiry: "2026-12-31",
    imageUrls: ["https://lh3.googleusercontent.com/aida-public/AB6AXuC3klTwNOwbYHBbv-3ChhuOUrIXza2BK0hI_m6gfXvTz11Y0uXQetDE_SM3EM01-aBDoKOSDhJzRMxFoM4AIGDQIfiHFOIa5_S9TrNUw9WZfZxahOysPBebsYv9CIvFopKip4UeeuWn1JmoF5XZF3nhsq7WNhIF_Z5JAQ8PTjsDRsi1zNIuwWWEYEHMOM-3ex_7ayc4OvvOY9IkQ_5W3cz6ik4qEhMxunLFmEMmS_C0aHrzbwejRav-"],
    stock: 45,
    isFeatured: true,
    isPromo: true,
    laboratory: "Prati-Donaduzzi",
    presentation: "10 Cápsulas Gelatinosas Moles",
    indications: "Alívio de dores de cabeça, dores musculares, cólicas menstruais, dor de dente e redução de febre.",
    simplifiedLeaflet: "Uso adulto e pediátrico acima de 12 anos. Não utilizar em caso de úlcera gástrica ou problemas cardíacos graves sem orientação médica.",
    expiryDate: "2027-08-15",
    views: 120,
    searches: 85,
    averageViewTime: 12,
    cartAdds: 34,
    favoritesCount: 15
  },
  {
    id: "prod-2",
    name: "Vitamina C 1g + Zinco 30 Comprimidos",
    description: "Suplemento alimentar de Vitamina C e Zinco que auxilia no funcionamento do sistema imune e atua como antioxidante.",
    category: "Medicamentos",
    price: 45.90,
    promoPrice: 29.90,
    promoExpiry: "2026-08-30",
    imageUrls: ["https://lh3.googleusercontent.com/aida-public/AB6AXuBZ6Q14iijyrQsYtT1KBlkxHMCCiZ9bKV-sr1qSqZ4u3bFv1VbFHpVN-UAjssyrJahnEcAlSrnogR8zju5rFBQ5A7TN-phHKwCC1x_Bp6CSoYOpyNjkHJFWXtZsgkKAtDc68knekdUqI2DrxkYfsAvU16ACOyftOMRZ81FRXYc_-ov6S-tRkaLvp4y9jS9mFUVN-tlVE9oZrQVLDUa8ChaCSo5B9XySL_hodKjDNDeexdU_t_9i12Du"],
    stock: 60,
    isFeatured: true,
    isPromo: true,
    laboratory: "Ems",
    presentation: "30 Comprimidos Efervescentes",
    indications: "Reforço do sistema imunológico, prevenção de gripes e resfriados, ação antioxidante na proteção das células.",
    simplifiedLeaflet: "Dissolver um comprimido em um copo com água e consumir imediatamente. Recomenda-se um comprimido ao dia para adultos.",
    expiryDate: "2027-04-10",
    views: 98,
    searches: 74,
    averageViewTime: 8,
    cartAdds: 21,
    favoritesCount: 18
  },
  {
    id: "prod-3",
    name: "Protetor Solar Facial FPS 70 Toque Seco",
    description: "Alta proteção contra raios UVA/UVB com controle de oleosidade e efeito mate ao longo do dia. Fórmula toque seco ultra leve.",
    category: "Dermocosméticos",
    price: 89.90,
    promoPrice: 76.41,
    promoExpiry: "2026-09-15",
    imageUrls: ["https://lh3.googleusercontent.com/aida-public/AB6AXuCNljos7iNzI4S1P1PCg_g4sncXvoecY-9toKAanhOXb56IP3MMTRthG0i2a2UPX-lKKbgMEishbQJIWD6C7yQnAHTtArc1FGFRgSm6kciD83FuUB_LrVQZM_Sqoo4GCHvK5frWOdecf40TcZV8Jj7qIdKM895fgVP-jcuD2ViGYai17xurDDTbb-vWOz0CqepdMTBC3lrbbtELYrg-MjJL_4qT0I4aGqbAlcUriGe2yppaVV_K9W2X"],
    stock: 25,
    isFeatured: true,
    isPromo: true,
    laboratory: "La Roche-Posay",
    presentation: "Bisnaga 50g",
    indications: "Prevenção do envelhecimento precoce da pele e manchas solares. Indicado para peles mistas a oleosas.",
    simplifiedLeaflet: "Aplicar abundantemente antes da exposição ao sol. Reaplicar sempre, após sudorese intensa, nadar ou secar-se com a toalha.",
    expiryDate: "2028-01-20",
    views: 180,
    searches: 130,
    averageViewTime: 18,
    cartAdds: 48,
    favoritesCount: 32
  },
  {
    id: "prod-4",
    name: "Amoxicilina 500mg 21 Cápsulas Duras",
    description: "Medicamento antibiótico indicado para o tratamento de infecções bacterianas comuns, sob prescrição médica obrigatória.",
    category: "Medicamentos",
    price: 25.50,
    promoPrice: 18.90,
    promoExpiry: "2026-12-31",
    imageUrls: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA9wWTNWwC16ebbNTE4vl5LWazENbI6N3owVhb0RPnuT64vBzrXQg-GAVmlbIcUlBVvhFNpMILEgUwRD_wUcPrAWVIhqUG46m3oNHLj6xU4PWRMlNzvm0itbruZjWqM-OgyjJ_zRVrUv9W1WaDc3UuHwzjmMIzMpmIVzIOG7KOQfRzoZyBvT-W8GBKDlOoMcHTDUTs9tuq8_zy81FRKLZipiCIy9jNgOwxFNBfJNdQdbDTEQ2lJNMdm",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDamXxiotJ8SRS0NX2ESHje8wbDLycoBdNQ62MuVy3JokupKzUzIILL7kLGq3lq57eznFjJAPKZTDSdMlL4Sf0gnent8MHNtkTJA5hfyYS7pghjzUIZ1DWH6Svewjxami-Kk93aGk4tQYViHHTPLVq70_SnYqXUixpt5v_HaJ7Y1HEEWiLWHgcspCs-FBF9Za1Pj2sO6t9r_qRx5fDltb7jyoRMTpQGkxEugW_6xEeNGrhRAMc6WSA4",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDgu_5fasAQ1u1EsHLvhMpnC3UEKSyfWBTZxKmLpYfX5rCqA7gDuZFDQQRJW01_Q9Ivq7I3kkkDwYyq8A5icSzV0OatPeQSj6gnH9JdTNfiLCo4FXPbp5EcD1UeH6ykehnjyyAnn80-_5U1SOjTNWqlG7-63F8gLclhUEscsaFI0srx2rNUP1NAeGqImy8RcvckRFQyHK5Qu0uBRVi-9Nv_yy_cSdAH0tsQS8fyDgW-3HwG3DZZVYPC"
    ],
    stock: 12,
    isFeatured: false,
    isPromo: true,
    laboratory: "Medley Genéricos",
    presentation: "21 Cápsulas Duras",
    indications: "Infecções do trato respiratório (amigdalite, sinusite, pneumonia), infecções do trato urinário e de pele.",
    simplifiedLeaflet: "VENDA SOB PRESCRIÇÃO MÉDICA. RETENÇÃO DA RECEITA. Siga rigorosamente as doses e horários prescritos pelo médico.",
    expiryDate: "2027-11-30",
    views: 240,
    searches: 190,
    averageViewTime: 25,
    cartAdds: 65,
    favoritesCount: 28
  },
  {
    id: "prod-5",
    name: "Sabonete Líquido Dove Hidratação Profunda 250ml",
    description: "Fórmula de limpeza suave combinada com 1/4 de creme hidratante que ajuda a nutrir a pele durante o banho.",
    category: "Higiene",
    price: 18.90,
    imageUrls: ["https://lh3.googleusercontent.com/aida-public/AB6AXuDamXxiotJ8SRS0NX2ESHje8wbDLycoBdNQ62MuVy3JokupKzUzIILL7kLGq3lq57eznFjJAPKZTDSdMlL4Sf0gnent8MHNtkTJA5hfyYS7pghjzUIZ1DWH6Svewjxami-Kk93aGk4tQYViHHTPLVq70_SnYqXUixpt5v_HaJ7Y1HEEWiLWHgcspCs-FBF9Za1Pj2sO6t9r_qRx5fDltb7jyoRMTpQGkxEugW_6xEeNGrhRAMc6WSA4"],
    stock: 120,
    isFeatured: false,
    isPromo: false,
    laboratory: "Unilever",
    presentation: "Frasco Pump 250ml",
    indications: "Higienização diária corporal com hidratação intensa, mantendo a barreira de hidratação natural da pele.",
    simplifiedLeaflet: "Aplicar uma pequena quantidade nas mãos ou em uma esponja de banho, massagear sobre o corpo úmido e enxaguar bem.",
    expiryDate: "2028-06-15",
    views: 45,
    searches: 30,
    averageViewTime: 5,
    cartAdds: 12,
    favoritesCount: 8
  },
  {
    id: "prod-6",
    name: "Fralda Pampers Confort Sec G 40 Unidades",
    description: "Fralda Pampers Confort Sec com canais de gel que garantem até 12 horas de sono sequinho para o seu bebê.",
    category: "Infantil",
    price: 54.90,
    promoPrice: 48.90,
    promoExpiry: "2026-07-20",
    imageUrls: ["https://lh3.googleusercontent.com/aida-public/AB6AXuDyT29-NQE_libaRCpj1TBdlgoz2ZYG3wx8KJN1FTz8iR0EUyry0crXzKMcXTMyN8ZG3cf5rr3LXivlp8c8tk24F8CMXkkrmHbSZjwAIrdsYQ4pu7noyQgJxrsLJEDpxyYGu2s6ylEMHNrXhZUNH19ca7iogSJsZB6F9BlXEtDVQWiGiavWZrxQC7K6KcCu-dkFe95QBcUaJrKZKddflKYwVUDy1QrhccvKuBX6zouI_pIvWbqlAfPI"], // re-using avatar since we need safe URL, or let's use standard placeholders
    stock: 35,
    isFeatured: true,
    isPromo: true,
    laboratory: "P&G",
    presentation: "Pacote G - 40 Unidades",
    indications: "Proteção diária do bebê contra vazamentos, mantendo a pele seca e confortável.",
    simplifiedLeaflet: "Ajustar as fitas adesivas laterais nas perninhas e na cintura do bebê de forma confortável e segura.",
    expiryDate: "2029-01-01",
    views: 68,
    searches: 42,
    averageViewTime: 9,
    cartAdds: 15,
    favoritesCount: 11
  }
];

const DEFAULT_USERS: User[] = [
  {
    id: "user-client-1",
    email: "joao.silva@exemplo.com.br",
    name: "João da Silva",
    role: UserRole.CLIENT,
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOTJF9BDj3cbHUIo5z425NXtv-6jab9X0me8Cg7SvnJxaecC3g2nFEs_AyTfy_5OX6dIFCs5rfi-46cR21-QpH0fXw8wTOW9Ylvt4L5YpZOrAL5S1hftzg2X_S7XkTE9gmetub5hgpVHAGJbm1HFmydP2SaMvMTBJPQd56l3ywx8Iqm_tioBOcgIxUGfbY69HELEDGqVVG7R7-YKBz4TT1uLL0MNlhUZtsTrDOHpCoqpGI9dPIH23a",
    ordersCount: 12,
    couponsCount: 3
  },
  {
    id: "user-admin-1",
    email: "admin@admin.com",
    name: "Admin Central",
    role: UserRole.ADMIN,
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbGxXPKa2qwX32b7l-H4YFSp9nLbNhyU57wKvvGI-9MM3MzHjYvpdjPNPbmV5jtvr3TmJRVqo8QV0RwUS0fBM_aWsz60wRbqTA2EySgLxSVB2eZWDVsOyXKr6Dvjt0r3vNd43Y4Dem2CyDuzBZiuVztGMZS8gXbx2FT8oFiU9klCdOnmcLRujSCx2bHgyIeGl9wPXicycxe9PR0cmz4pWCKqwIoWvbuupiAC7WAag387MuCIj-WjIp"
  }
];

const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    id: "promo-banner-1",
    title: "Especiais para Você - Até 50% OFF em Cosméticos e Saúde",
    type: "banner",
    bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgU8H1tZez79F5xWkb1aS74v5i8H7sx3Ytiz6ZiypFf-IXIjjxmXLqCKZ2WlDFd0B8-6WVtGPRs3XYwtl29dfTHkrgSWoG5Y8Vw2GxF4qfDWFChxzHNRzexcimASgCbB7lLBWHVN9ZvDVVQgul6uucojQ_G_apuCr23vK-8ZshWHHz7kmTvhryv5j436nWLD1HDVY_nuJphsShcqtwTQ7bODM4KbRXbZb1a0xyyiZ3pwN70_yuxhvt",
    displayStart: "2026-07-01",
    displayEnd: "2026-07-31",
    description: "Grande queima de estoque em dermocosméticos, higiene e vitaminas de marcas nacionais e internacionais."
  }
];

const DEFAULT_FLYERS: Flyer[] = [
  {
    id: "flyer-1",
    title: "Encarte Semanal - Ofertas de Inverno",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgU8H1tZez79F5xWkb1aS74v5i8H7sx3Ytiz6ZiypFf-IXIjjxmXLqCKZ2WlDFd0B8-6WVtGPRs3XYwtl29dfTHkrgSWoG5Y8Vw2GxF4qfDWFChxzHNRzexcimASgCbB7lLBWHVN9ZvDVVQgul6uucojQ_G_apuCr23vK-8ZshWHHz7kmTvhryv5j436nWLD1HDVY_nuJphsShcqtwTQ7bODM4KbRXbZb1a0xyyiZ3pwN70_yuxhvt",
    displayStart: "2026-07-10",
    displayEnd: "2026-07-17"
  }
];

const DEFAULT_COUPONS: Coupon[] = [
  { id: "coup-1", code: "VITALIDADE10", discountAmount: 10, minPurchase: 50, expiryDate: "2026-12-31" },
  { id: "coup-2", code: "PROMO50", discountAmount: 50, minPurchase: 200, expiryDate: "2026-08-31" },
  { id: "coup-3", code: "FRETEGRATIS", discountAmount: 15, minPurchase: 80, expiryDate: "2026-07-31" }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: "PD-1042",
    userId: "user-client-1",
    userName: "João da Silva",
    items: [
      {
        productId: "prod-1",
        name: "Ibuprofeno 400mg 10 Cápsulas Genérico",
        quantity: 2,
        price: 12.72,
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC3klTwNOwbYHBbv-3ChhuOUrIXza2BK0hI_m6gfXvTz11Y0uXQetDE_SM3EM01-aBDoKOSDhJzRMxFoM4AIGDQIfiHFOIa5_S9TrNUw9WZfZxahOysPBebsYv9CIvFopKip4UeeuWn1JmoF5XZF3nhsq7WNhIF_Z5JAQ8PTjsDRsi1zNIuwWWEYEHMOM-3ex_7ayc4OvvOY9IkQ_5W3cz6ik4qEhMxunLFmEMmS_C0aHrzbwejRav-"
      },
      {
        productId: "prod-3",
        name: "Protetor Solar Facial FPS 70 Toque Seco",
        quantity: 1,
        price: 76.41,
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNljos7iNzI4S1P1PCg_g4sncXvoecY-9toKAanhOXb56IP3MMTRthG0i2a2UPX-lKKbgMEishbQJIWD6C7yQnAHTtArc1FGFRgSm6kciD83FuUB_LrVQZM_Sqoo4GCHvK5frWOdecf40TcZV8Jj7qIdKM895fgVP-jcuD2ViGYai17xurDDTbb-vWOz0CqepdMTBC3lrbbtELYrg-MjJL_4qT0I4aGqbAlcUriGe2yppaVV_K9W2X"
      }
    ],
    subtotal: 101.85,
    discount: 10.00,
    freight: 9.90,
    total: 101.75,
    status: "Concluído",
    deliveryType: "Expressa",
    paymentMethod: "Cartão",
    address: {
      label: "Casa",
      street: "Rua das Flores, 123 - Apto 45",
      city: "São Paulo - SP",
      zipCode: "01234-567"
    },
    createdAt: "2026-07-12T10:00:00Z"
  }
];

const DEFAULT_LOGS: AdminLog[] = [
  {
    id: "log-1",
    adminId: "user-admin-1",
    adminName: "Admin Central",
    action: "Criação de Produto",
    details: "Produto Amoxicilina 500mg criado com sucesso.",
    timestamp: "2026-07-12T09:15:00Z"
  }
];

const DEFAULT_STATS: DashboardStats = {
  accessCount: 1450,
  loginsCount: 380,
  salesConversionRate: 4.8,
  usersCount: 2,
  outOfStockCount: 0,
  nearExpiryCount: 1
};

export class JSONDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
    } catch (err) {
      console.error("Erro ao criar diretório do banco de dados:", err);
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        return JSON.parse(raw);
      } catch (err) {
        console.error("Erro ao ler banco de dados JSON. Inicializando padrões.", err);
      }
    }

    // On Vercel, if the ephemeral /tmp/db.json doesn't exist, we try to load the bundled data/db.json first
    if (isVercel && fs.existsSync(LOCAL_DB_FILE)) {
      try {
        const raw = fs.readFileSync(LOCAL_DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        this.save(parsed);
        return parsed;
      } catch (err) {
        console.error("Erro ao ler banco de dados empacotado no Vercel:", err);
      }
    }

    const initial: DatabaseSchema = {
      users: DEFAULT_USERS,
      products: DEFAULT_PRODUCTS,
      categories: DEFAULT_CATEGORIES,
      promotions: DEFAULT_PROMOTIONS,
      flyers: DEFAULT_FLYERS,
      orders: DEFAULT_ORDERS,
      coupons: DEFAULT_COUPONS,
      logs: DEFAULT_LOGS,
      stats: DEFAULT_STATS,
      favorites: { "user-client-1": ["prod-1", "prod-3"] },
      cart: { "user-client-1": [] },
      searchHistory: {},
      viewHistory: {}
    };

    this.save(initial);
    return initial;
  }

  private save(dataState: DatabaseSchema = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataState, null, 2), "utf-8");
    } catch (err) {
      console.error("Erro ao persistir banco de dados JSON", err);
    }
  }

  // API Methods
  public getUsers() { return this.data.users; }
  public addUser(user: User) {
    this.data.users.push(user);
    this.data.stats.usersCount = this.data.users.length;
    this.save();
    return user;
  }
  public updateUser(user: User) {
    let idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx === -1) {
      idx = this.data.users.findIndex(u => u.email === user.email);
    }
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...user };
      this.save();
    }
  }

  public getProducts() { return this.data.products; }
  public addProduct(product: Product) {
    this.data.products.push(product);
    this.recalculateStats();
    this.save();
    return product;
  }
  public updateProduct(product: Product) {
    const idx = this.data.products.findIndex(p => p.id === product.id);
    if (idx !== -1) {
      this.data.products[idx] = { ...this.data.products[idx], ...product };
      this.recalculateStats();
      this.save();
    }
  }
  public deleteProduct(id: string) {
    this.data.products = this.data.products.filter(p => p.id !== id);
    this.recalculateStats();
    this.save();
  }

  private recalculateStats() {
    this.data.stats.outOfStockCount = this.data.products.filter(p => p.stock === 0).length;
    // products with expiry near (arbitrary check: if expiryDate exists and is in next 6 months)
    let nearExpiry = 0;
    const now = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(now.getMonth() + 6);

    this.data.products.forEach(p => {
      if (p.expiryDate) {
        const d = new Date(p.expiryDate);
        if (d >= now && d <= sixMonthsLater) {
          nearExpiry++;
        }
      }
    });
    this.data.stats.nearExpiryCount = nearExpiry;
  }

  public getCategories() { return this.data.categories; }
  public saveCategories(cats: Category[]) {
    this.data.categories = cats;
    this.save();
  }

  public getPromotions() { return this.data.promotions; }
  public addPromotion(promo: Promotion) {
    this.data.promotions.push(promo);
    this.save();
    return promo;
  }
  public deletePromotion(id: string) {
    this.data.promotions = this.data.promotions.filter(p => p.id !== id);
    this.save();
  }

  public getFlyers() { return this.data.flyers; }
  public addFlyer(flyer: Flyer) {
    this.data.flyers.push(flyer);
    this.save();
    return flyer;
  }
  public deleteFlyer(id: string) {
    this.data.flyers = this.data.flyers.filter(f => f.id !== id);
    this.save();
  }

  public getOrders() { return this.data.orders; }
  public addOrder(order: Order) {
    this.data.orders.push(order);
    // increment stats
    this.data.stats.accessCount += 5; // simulate real conversion flow action
    // calculate actual conversion
    const salesCount = this.data.orders.filter(o => o.status !== "Cancelado").length;
    this.data.stats.salesConversionRate = parseFloat(((salesCount / (this.data.stats.accessCount || 1)) * 100).toFixed(1));
    this.save();
    return order;
  }
  public updateOrderStatus(id: string, status: Order["status"]) {
    const o = this.data.orders.find(ord => ord.id === id);
    if (o) {
      o.status = status;
      this.save();
    }
  }

  public getCoupons() { return this.data.coupons; }
  public addCoupon(coupon: Coupon) {
    this.data.coupons.push(coupon);
    this.save();
    return coupon;
  }
  public updateCoupon(id: string, updated: Partial<Coupon>) {
    const idx = this.data.coupons.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.coupons[idx] = { ...this.data.coupons[idx], ...updated };
      this.save();
      return this.data.coupons[idx];
    }
    return null;
  }
  public deleteCoupon(id: string) {
    this.data.coupons = this.data.coupons.filter(c => c.id !== id);
    this.save();
  }

  public getLogs() { return this.data.logs; }
  public addLog(adminId: string, adminName: string, action: string, details: string) {
    const log: AdminLog = {
      id: "log-" + Math.random().toString(36).substr(2, 9),
      adminId,
      adminName,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.logs.unshift(log); // newest first
    this.save();
  }

  public getStats() {
    this.recalculateStats();
    this.data.stats.usersCount = this.data.users.length;
    const salesCount = this.data.orders.filter(o => o.status !== "Cancelado").length;
    this.data.stats.salesConversionRate = parseFloat(((salesCount / (this.data.stats.accessCount || 1)) * 100).toFixed(1));
    this.save();
    return this.data.stats;
  }
  public resetStats() {
    this.data.stats.accessCount = 0;
    this.data.stats.loginsCount = 0;
    this.data.stats.salesConversionRate = 0;
    this.data.orders = [];
    this.data.products.forEach(p => {
      p.views = 0;
      p.searches = 0;
      p.cartAdds = 0;
      p.favoritesCount = 0;
      p.averageViewTime = 0;
    });
    this.data.users.forEach(u => {
      u.ordersCount = 0;
    });
    this.data.searchHistory = {};
    this.data.viewHistory = {};
    this.save();
  }
  public incrementAccessCount() {
    this.data.stats.accessCount++;
    this.save();
  }
  public incrementLoginsCount() {
    this.data.stats.loginsCount++;
    this.save();
  }

  public getFavorites(userId: string) { return this.data.favorites[userId] || []; }
  public toggleFavorite(userId: string, productId: string) {
    if (!this.data.favorites[userId]) {
      this.data.favorites[userId] = [];
    }
    const idx = this.data.favorites[userId].indexOf(productId);
    const prod = this.data.products.find(p => p.id === productId);
    if (idx !== -1) {
      this.data.favorites[userId].splice(idx, 1);
      if (prod) prod.favoritesCount = Math.max(0, (prod.favoritesCount || 1) - 1);
    } else {
      this.data.favorites[userId].push(productId);
      if (prod) prod.favoritesCount = (prod.favoritesCount || 0) + 1;
    }
    this.save();
    return this.data.favorites[userId];
  }

  public getCart(userId: string) { return this.data.cart[userId] || []; }
  public saveCart(userId: string, items: { productId: string; quantity: number }[]) {
    this.data.cart[userId] = items;
    this.save();
  }

  public addSearchTerm(userId: string, term: string) {
    if (!userId) userId = "anonymous";
    if (!this.data.searchHistory[userId]) {
      this.data.searchHistory[userId] = [];
    }
    this.data.searchHistory[userId].push({ term, timestamp: new Date().toISOString() });
    
    // track search count on product matching
    const searchLower = term.toLowerCase();
    this.data.products.forEach(p => {
      if (p.name.toLowerCase().includes(searchLower) || p.description.toLowerCase().includes(searchLower)) {
        p.searches = (p.searches || 0) + 1;
      }
    });

    this.save();
  }

  public getSearchHistory(userId: string) {
    return this.data.searchHistory[userId] || [];
  }

  public addViewHistory(userId: string, productId: string, duration: number = 5) {
    if (!userId) userId = "anonymous";
    if (!this.data.viewHistory[userId]) {
      this.data.viewHistory[userId] = [];
    }
    this.data.viewHistory[userId].push({ productId, timestamp: new Date().toISOString(), duration });

    const prod = this.data.products.find(p => p.id === productId);
    if (prod) {
      const prevTotalTime = (prod.views || 0) * (prod.averageViewTime || 0);
      prod.views = (prod.views || 0) + 1;
      prod.averageViewTime = Math.round((prevTotalTime + duration) / prod.views);
    }
    this.save();
  }

  public trackCartAdd(productId: string) {
    const prod = this.data.products.find(p => p.id === productId);
    if (prod) {
      prod.cartAdds = (prod.cartAdds || 0) + 1;
      this.save();
    }
  }
}

export const db = new JSONDatabase();
