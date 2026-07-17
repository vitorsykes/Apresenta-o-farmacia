import React, { useState, useEffect } from "react";
import { Product, Category, Promotion, Flyer, User, StoreSettings } from "../types.js";
import { api } from "../lib/api.js";
import { Search, Sparkles, Heart, ShoppingCart, ArrowRight, Flame, ArrowLeft, Loader2, ChevronRight, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ClientHomeProps {
  storeSettings: StoreSettings;
  user: User;
  onProductSelect: (productId: string) => void;
  onCartSelect: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onAddToCart: (id: string) => void;
  cartCount: number;
}

export default function ClientHome({
  storeSettings,
  user,
  onProductSelect,
  onCartSelect,
  favorites,
  onToggleFavorite,
  onAddToCart,
  cartCount
}: ClientHomeProps) {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFilter, setSelectedCategoryFilter] = useState<string>("all"); // all, featured, promo, topSellers
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [currentFlyer, setCurrentFlyer] = useState<Flyer | null>(null);

  // Smart Search Gemini state
  const [smartAnswer, setSmartAnswer] = useState<string | null>(null);
  const [smartRecs, setSmartRecommendations] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    // load initial data
    const loadData = async () => {
      try {
        const [cats, prods, promos, flys] = await Promise.all([
          api.getCategories(),
          api.getProducts(),
          api.getPromotions(),
          api.getFlyers()
        ]);
        setCategories(cats.sort((a, b) => a.sortOrder - b.sortOrder));
        setProducts(prods);
        setPromotions(promos);
        setFlyers(flys);
      } catch (err) {
        console.error("Erro ao carregar dados do cliente", err);
      }
    };
    loadData();
  }, []);

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!search.trim()) {
      setSmartAnswer(null);
      setSmartRecommendations([]);
      const prods = await api.getProducts(undefined, selectedCategory || undefined);
      setProducts(prods);
      return;
    }

    setAiLoading(true);
    setSmartAnswer(null);
    try {
      // 1. Fetch standard search matches
      const standardMatches = await api.getProducts(search, selectedCategory || undefined);
      setProducts(standardMatches);

      // 2. Query Gemini for Smart Search AI Pharmacy assistant
      const aiResponse = await api.smartSearch(search);
      setSmartAnswer(aiResponse.answer);
      setSmartRecommendations(aiResponse.recommendations);
    } catch (err) {
      console.error("Erro ao realizar busca inteligente", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCategorySelect = async (catName: string | null) => {
    setSelectedCategory(catName);
    setSmartAnswer(null);
    setSmartRecommendations([]);
    const prods = await api.getProducts(search || undefined, catName || undefined, selectedFilter !== "all" ? selectedFilter : undefined);
    setProducts(prods);
  };

  const handleFilterSelect = async (filter: string) => {
    setSelectedCategoryFilter(filter);
    const prods = await api.getProducts(search || undefined, selectedCategory || undefined, filter !== "all" ? filter : undefined);
    setProducts(prods);
  };

  const handleViewFlyer = (fly: Flyer) => {
    setCurrentFlyer(fly);
    setShowFlyerModal(true);
  };

  return (
    <div className="bg-[#fbf9f8] text-[#1b1c1c] min-h-screen font-sans pb-24">
      {/* Search and Smart Header */}
      <section className="bg-gradient-to-b from-[#d5e3ff]/30 to-[#fbf9f8] px-4 py-6 border-b border-[#c2c6d3]/20">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img 
                alt={`${storeSettings.name} Logo`} 
                className="h-9 object-contain" 
                src={storeSettings.logoUrl}
              />
            </div>
            <button 
              onClick={onCartSelect}
              className="relative p-2 text-[#003e7a] hover:bg-white/50 rounded-full transition-colors flex items-center justify-center cursor-pointer"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ba1a1a] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full shadow-sm rounded-full overflow-hidden border border-[#c2c6d3] bg-white group focus-within:ring-2 focus-within:ring-[#003e7a]/20 transition-all">
            <input 
              className="w-full h-12 pl-12 pr-12 rounded-full bg-white text-[#1b1c1c] placeholder-[#727783] outline-none font-sans text-sm focus:border-transparent" 
              placeholder="O que você procura hoje? (Remédios, sintomas, bem-estar...)" 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#727783] group-focus-within:text-[#003e7a] transition-colors" />
            
            <button 
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#003e7a] text-white p-1.5 rounded-full hover:bg-[#0055a4] transition-colors cursor-pointer"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
          </form>

          {/* Smart AI suggestion result */}
          <AnimatePresence>
            {smartAnswer && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#0055a4]/5 border-2 border-[#003e7a]/20 rounded-xl p-4 flex flex-col gap-2 relative mt-1"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-[#003e7a]">
                  <Sparkles className="w-4 h-4" />
                  Farmacêutico Inteligente {storeSettings.name}
                </div>
                <p className="text-sm text-[#424751] leading-relaxed">
                  {smartAnswer}
                </p>
                {smartRecs.length > 0 && (
                  <div className="text-xs font-semibold text-[#003e7a] mt-1 flex items-center gap-1">
                    <span>Recomendações destacadas abaixo!</span>
                  </div>
                )}
                <button 
                  onClick={() => { setSmartAnswer(null); setSmartRecommendations([]); setSearch(""); }}
                  className="text-xs font-bold text-[#ba1a1a] self-end hover:underline"
                >
                  Limpar Inteligência
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Hero promo banners */}
      {promotions.length > 0 && (
        <section className="px-4 py-4 max-w-[1200px] mx-auto">
          <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden shadow-md">
            <img 
              className="w-full h-full object-cover" 
              src={promotions[0].bannerUrl}
              alt={promotions[0].title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 md:p-6 text-white">
              <h2 className="text-base md:text-xl font-bold tracking-tight">{promotions[0].title}</h2>
              <p className="text-xs md:text-sm text-white/90 line-clamp-1 mt-1">{promotions[0].description}</p>
            </div>
          </div>
        </section>
      )}

      {/* Flyers and Digital Catalogues */}
      {flyers.length > 0 && (
        <section className="px-4 py-3 max-w-[1200px] mx-auto">
          <div className="bg-[#74f9a0]/10 border border-[#006d38]/20 rounded-xl p-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#006d38] text-white rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#00210d]">Visualizar Encarte Digital</h3>
                <p className="text-xs text-[#005228]">Confira as ofertas válidas do encarte físico!</p>
              </div>
            </div>
            <button 
              onClick={() => handleViewFlyer(flyers[0])}
              className="bg-[#006d38] hover:bg-[#005228] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              Abrir Encarte
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}

      {/* Category Horizontal scroll chips */}
      <section className="py-4 pl-4 overflow-hidden max-w-[1200px] mx-auto">
        <h2 className="text-base font-bold text-[#1b1c1c] mb-2 px-1">Compre por Categoria</h2>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 pr-4">
          <button 
            onClick={() => handleCategorySelect(null)}
            className={`flex-shrink-0 flex items-center justify-center font-bold text-xs px-4 py-2.5 rounded-full border transition-all cursor-pointer ${
              selectedCategory === null 
                ? "bg-[#003e7a] text-white border-[#003e7a] shadow-sm" 
                : "bg-white hover:bg-[#efeded] text-[#1b1c1c] border-[#c2c6d3]"
            }`}
          >
            Todas as Categorias
          </button>
          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => handleCategorySelect(cat.name)}
              className={`flex-shrink-0 flex items-center gap-1.5 font-bold text-xs px-4 py-2.5 rounded-full border transition-all cursor-pointer ${
                selectedCategory === cat.name 
                  ? "bg-[#003e7a] text-white border-[#003e7a] shadow-sm" 
                  : "bg-white hover:bg-[#efeded] text-[#1b1c1c] border-[#c2c6d3]"
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Filter Selection Grid */}
      <section className="px-4 py-2 max-w-[1200px] mx-auto flex flex-wrap gap-1.5">
        <button 
          onClick={() => handleFilterSelect("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            selectedFilter === "all" ? "bg-[#efeded] text-[#003e7a]" : "bg-transparent text-[#727783] hover:text-[#1b1c1c]"
          }`}
        >
          Todos os produtos
        </button>
        <button 
          onClick={() => handleFilterSelect("featured")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            selectedFilter === "featured" ? "bg-[#efeded] text-[#003e7a]" : "bg-transparent text-[#727783] hover:text-[#1b1c1c]"
          }`}
        >
          Produtos em destaque
        </button>
        <button 
          onClick={() => handleFilterSelect("promo")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            selectedFilter === "promo" ? "bg-[#efeded] text-[#003e7a]" : "bg-transparent text-[#727783] hover:text-[#1b1c1c]"
          }`}
        >
          Em promoção
        </button>
        <button 
          onClick={() => handleFilterSelect("topSellers")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            selectedFilter === "topSellers" ? "bg-[#efeded] text-[#003e7a]" : "bg-transparent text-[#727783] hover:text-[#1b1c1c]"
          }`}
        >
          Mais vendidos
        </button>
      </section>

      {/* Products Grid */}
      <section className="px-4 py-4 max-w-[1200px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[#1b1c1c] flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#ba1a1a]" />
            {selectedCategory || "Ofertas do Dia"}
          </h2>
          <span className="text-xs text-[#727783] font-semibold">{products.length} itens encontrados</span>
        </div>

        {products.length === 0 ? (
          <div className="bg-white border border-[#c2c6d3]/40 rounded-xl p-8 text-center text-[#727783] text-sm">
            Nenhum produto correspondente encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((p) => {
              const isFav = favorites.includes(p.id);
              const isAIRecommended = smartRecs.includes(p.id);
              return (
                <motion.div 
                  layout
                  key={p.id}
                  className={`relative bg-white rounded-xl border p-3 flex flex-col justify-between transition-all group overflow-hidden ${
                    isAIRecommended 
                      ? "border-[#003e7a] ring-2 ring-[#003e7a]/15 shadow-md scale-[1.01]" 
                      : "border-[#c2c6d3]/60 shadow-[0px_2px_8px_rgba(0,62,122,0.05)] hover:shadow-md"
                  }`}
                >
                  {isAIRecommended && (
                    <div className="absolute top-2 left-2 bg-[#003e7a] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full z-10 flex items-center gap-1 shadow">
                      <Sparkles className="w-2.5 h-2.5" /> RECOMENDADO
                    </div>
                  )}

                  <button 
                    onClick={() => onToggleFavorite(p.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm text-[#727783] hover:text-[#ba1a1a] transition-all z-10 cursor-pointer"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? "fill-[#ba1a1a] text-[#ba1a1a]" : ""}`} />
                  </button>

                  <div 
                    onClick={() => onProductSelect(p.id)}
                    className="relative w-full aspect-square bg-[#fbf9f8] rounded-lg mb-2 flex items-center justify-center overflow-hidden cursor-pointer"
                  >
                    {p.isPromo && p.promoPrice && (
                      <span className="absolute top-2 left-2 bg-[#ba1a1a] text-white font-bold text-[10px] px-2 py-0.5 rounded z-10">
                        {Math.round(((p.price - p.promoPrice) / p.price) * 100)}% OFF
                      </span>
                    )}
                    <img 
                      className="w-3/4 h-3/4 object-contain group-hover:scale-105 transition-transform" 
                      src={p.imageUrls[0]}
                      alt={p.name}
                    />
                  </div>

                  <div 
                    onClick={() => onProductSelect(p.id)}
                    className="cursor-pointer flex-grow flex flex-col justify-between"
                  >
                    <h3 className="font-sans text-xs md:text-sm font-semibold text-[#1b1c1c] line-clamp-2 leading-snug mb-1">
                      {p.name}
                    </h3>
                    
                    {p.laboratory && (
                      <p className="text-[10px] text-[#727783] uppercase font-bold tracking-wider mb-2">
                        {p.laboratory}
                      </p>
                    )}

                    <div className="mt-auto">
                      {p.isPromo && p.promoPrice ? (
                        <>
                          <p className="text-[#727783] line-through text-[11px]">R$ {p.price.toFixed(2)}</p>
                          <p className="font-extrabold text-lg text-[#003e7a] tracking-tight">R$ {p.promoPrice.toFixed(2)}</p>
                        </>
                      ) : (
                        <p className="font-extrabold text-lg text-[#003e7a] tracking-tight">R$ {p.price.toFixed(2)}</p>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => onAddToCart(p.id)}
                    disabled={p.stock === 0}
                    className={`w-full font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all mt-3 cursor-pointer ${
                      p.stock === 0
                        ? "bg-[#efeded] text-[#727783] cursor-not-allowed"
                        : "bg-[#74f9a0]/20 hover:bg-[#006d38] text-[#00723a] hover:text-white border border-[#00723a]/30"
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {p.stock === 0 ? "Sem estoque" : "Adicionar"}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Flyer viewer Modal */}
      {showFlyerModal && currentFlyer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative"
          >
            <div className="p-4 bg-[#003e7a] text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">{currentFlyer.title}</h3>
              <button 
                onClick={() => setShowFlyerModal(false)}
                className="text-white hover:text-red-200 text-xs font-bold"
              >
                Fechar [X]
              </button>
            </div>
            <div className="p-4 flex flex-col items-center gap-4 bg-[#fbf9f8]">
              <p className="text-xs text-[#727783]">Válido de {currentFlyer.displayStart} até {currentFlyer.displayEnd}</p>
              <img 
                src={currentFlyer.imageUrl} 
                alt="Imagem do Encarte" 
                className="max-h-[60vh] object-contain rounded border border-[#c2c6d3]"
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
