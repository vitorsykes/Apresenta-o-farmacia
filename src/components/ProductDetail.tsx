import { useState, useEffect } from "react";
import { Product } from "../types.js";
import { api } from "../lib/api.js";
import { ArrowLeft, Plus, Minus, ShoppingCart, ShieldCheck, Truck, Award, ChevronDown, Camera, FileText } from "lucide-react";
import { motion } from "motion/react";

interface ProductDetailProps {
  productId: string;
  onBack: () => void;
  onAddToCart: (id: string, quantity: number) => void;
}

export default function ProductDetail({ productId, onBack, onAddToCart }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeThumb, setActiveThumb] = useState(0);
  const [accordionOpen, setActiveAccordionOpen] = useState({ indications: true, leaflet: false });
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadProd = async () => {
      try {
        const data = await api.getProductById(productId);
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProd();
  }, [productId]);

  const handleSimulatedUpload = () => {
    setUploading(true);
    setTimeout(() => {
      // simulate uploading a photo of medical recipe
      setRecipeImage("https://lh3.googleusercontent.com/aida-public/AB6AXuDwqBLHSYoZ3z5XrozLx6B9WVJcUJKCejJBBqEEETJ7olTEDbxqAcr1rSwOH2MH5ti4yd_N6p7RdxrOUy4jWxU1JR1iBWFB-1qrNLRVpRNlrOVXJ4CXlByJetK3RkLEOjewnqzUIiwK_GDg6FIyM1NR67nrdEYkfS2F1emOC6dvueNbgvvpcrdhhJfv4Av2OV2ToqTbe98tCYxrNqfVzNVMsZQmEYU5XC23F9ibIgkeaGJaPATOw-RJ");
      setUploading(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#727783]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Truck className="w-8 h-8 text-[#003e7a]" />
        </motion.div>
        <span className="text-xs font-semibold mt-2">Carregando detalhes do produto...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center text-sm text-[#727783] bg-white border border-[#c2c6d3]/30 rounded-xl max-w-md mx-auto mt-12">
        <p>Produto não encontrado.</p>
        <button onClick={onBack} className="text-[#003e7a] font-bold mt-4 hover:underline">Voltar</button>
      </div>
    );
  }

  const isGeneric = product.category === "Medicamentos" && (product.laboratory?.toLowerCase().includes("medley") || product.laboratory?.toLowerCase().includes("prati") || product.name.toLowerCase().includes("genérico"));
  const requiresRecipe = product.indications?.toLowerCase().includes("antibiótico") || product.name.toLowerCase().includes("amoxicilina") || product.simplifiedLeaflet?.toLowerCase().includes("venda sob prescrição");

  return (
    <main className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 px-4 py-4 font-sans text-[#1b1c1c]">
      {/* Back button */}
      <div className="md:col-span-12 py-1">
        <button 
          onClick={onBack} 
          className="flex items-center text-[#003e7a] font-bold text-xs hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Resultados
        </button>
      </div>

      {/* Product Image section with thumbnails */}
      <div className="md:col-span-6 lg:col-span-7 bg-white rounded-2xl shadow-sm border border-[#c2c6d3]/40 p-4 flex flex-col items-center justify-center relative overflow-hidden h-[400px] md:h-[500px]">
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {isGeneric && (
            <span className="bg-[#006d38] text-white font-bold text-[10px] px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
              Genérico
            </span>
          )}
          {requiresRecipe && (
            <span className="bg-[#af000a] text-white font-bold text-[10px] px-3 py-1 rounded-full shadow-sm border border-[#ba1a1a] uppercase tracking-wider">
              Receita Obrigatória
            </span>
          )}
        </div>

        <img 
          className="max-w-full max-h-[75%] object-contain mix-blend-multiply" 
          src={product.imageUrls[activeThumb] || product.imageUrls[0]}
          alt={product.name}
        />

        {/* Thumbnails */}
        {product.imageUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {product.imageUrls.map((url, i) => (
              <button 
                key={i}
                onClick={() => setActiveThumb(i)}
                className={`w-12 h-12 rounded border-2 bg-white flex items-center justify-center p-1 cursor-pointer transition-all ${
                  activeThumb === i ? "border-[#003e7a]" : "border-[#c2c6d3]/60 opacity-60 hover:opacity-100"
                }`}
              >
                <img className="w-full h-full object-contain" src={url} alt={`Miniatura ${i}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="md:col-span-6 lg:col-span-5 flex flex-col gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-[#c2c6d3]/40 p-6 flex flex-col gap-3">
          {product.laboratory && (
            <p className="text-[#424751] font-bold text-[10px] uppercase tracking-widest">{product.laboratory}</p>
          )}
          <h1 className="text-xl md:text-2xl font-bold text-[#1b1c1c] tracking-tight">{product.name}</h1>
          <p className="text-[#424751] text-xs md:text-sm">{product.presentation}</p>
          
          <div className="flex items-baseline gap-2 mt-2">
            {product.isPromo && product.promoPrice ? (
              <>
                <span className="font-extrabold text-2xl text-[#003e7a]">R$ {product.promoPrice.toFixed(2)}</span>
                <span className="text-[#727783] line-through text-sm">R$ {product.price.toFixed(2)}</span>
              </>
            ) : (
              <span className="font-extrabold text-2xl text-[#003e7a]">R$ {product.price.toFixed(2)}</span>
            )}
          </div>

          {product.isPromo && product.promoPrice && (
            <div className="bg-[#ffdad6] text-[#ba1a1a] font-bold text-xs px-3 py-1 rounded inline-block w-fit mt-1">
              Economia de R$ {(product.price - product.promoPrice).toFixed(2)} ({Math.round(((product.price - product.promoPrice) / product.price) * 100)}% OFF)
            </div>
          )}

          {/* Quantity and Action */}
          <div className="mt-4 flex flex-col gap-2">
            <label className="text-xs font-bold text-[#424751]">Quantidade:</label>
            <div className="flex items-center border border-[#c2c6d3] rounded-lg w-fit overflow-hidden bg-white shadow-sm">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 hover:bg-[#efeded] text-[#003e7a] focus:outline-none transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-4 py-2 font-bold text-sm border-x border-[#c2c6d3]">{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-4 py-2 hover:bg-[#efeded] text-[#003e7a] focus:outline-none transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Prescription Upload helper if required */}
          {requiresRecipe && (
            <div className="mt-4 border-2 border-dashed border-[#003e7a] bg-[#d5e3ff]/10 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-[#d5e3ff]/20 transition-all select-none">
              {recipeImage ? (
                <div className="flex flex-col items-center gap-1 text-[#006d38] font-bold text-xs">
                  <FileText className="w-8 h-8 text-[#006d38]" />
                  <span>Receita Anexada com sucesso!</span>
                  <button onClick={(e) => { e.stopPropagation(); setRecipeImage(null); }} className="text-[#ba1a1a] font-normal hover:underline mt-1">Remover</button>
                </div>
              ) : (
                <div onClick={handleSimulatedUpload} className="flex flex-col items-center gap-1.5">
                  <Camera className="w-8 h-8 text-[#003e7a]" />
                  <h3 className="text-sm font-bold text-[#003e7a]">Anexar Receita Médica</h3>
                  <p className="text-xs text-[#424751]">
                    {uploading ? "Carregando arquivo..." : "Tire uma foto ou faça upload do arquivo."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Big add to cart button */}
          <button 
            onClick={() => onAddToCart(product.id, quantity)}
            disabled={product.stock === 0}
            className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-4 cursor-pointer shadow-md ${
              product.stock === 0
                ? "bg-[#efeded] text-[#727783] cursor-not-allowed"
                : "bg-[#003e7a] hover:bg-[#0055a4] text-white"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {product.stock === 0 ? "Sem estoque disponível" : `Adicionar R$ ${((product.promoPrice || product.price) * quantity).toFixed(2)}`}
          </button>
        </div>

        {/* Safety trust badges */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#c2c6d3]/40 p-3.5 flex justify-around items-center text-center text-[10px] text-[#424751] font-bold">
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-5 h-5 text-[#006d38]" />
            <span>Compra Segura</span>
          </div>
          <div className="w-px h-8 bg-[#c2c6d3]" />
          <div className="flex flex-col items-center gap-1">
            <Truck className="w-5 h-5 text-[#006d38]" />
            <span>Entrega Rápida</span>
          </div>
          <div className="w-px h-8 bg-[#c2c6d3]" />
          <div className="flex flex-col items-center gap-1">
            <Award className="w-5 h-5 text-[#006d38]" />
            <span>Produto Original</span>
          </div>
        </div>

        {/* Accordions */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#c2c6d3]/40 overflow-hidden">
          <div className="border-b border-[#c2c6d3]/40">
            <button 
              onClick={() => setActiveAccordionOpen({ ...accordionOpen, indications: !accordionOpen.indications })}
              className="flex justify-between items-center w-full p-4 font-bold text-sm bg-[#fbf9f8] hover:bg-[#efeded] transition-colors cursor-pointer text-[#003e7a]"
            >
              <span>Indicações</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${accordionOpen.indications ? "rotate-180" : ""}`} />
            </button>
            {accordionOpen.indications && (
              <div className="p-4 text-xs md:text-sm text-[#424751] leading-relaxed border-t border-[#c2c6d3]/20 bg-white">
                {product.indications || "Indicações detalhadas do laboratório farmacêutico para este produto."}
              </div>
            )}
          </div>

          <div>
            <button 
              onClick={() => setActiveAccordionOpen({ ...accordionOpen, leaflet: !accordionOpen.leaflet })}
              className="flex justify-between items-center w-full p-4 font-bold text-sm bg-[#fbf9f8] hover:bg-[#efeded] transition-colors cursor-pointer text-[#003e7a]"
            >
              <span>Bula Simplificada</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${accordionOpen.leaflet ? "rotate-180" : ""}`} />
            </button>
            {accordionOpen.leaflet && (
              <div className="p-4 text-xs md:text-sm text-[#424751] leading-relaxed border-t border-[#c2c6d3]/20 bg-white">
                {product.simplifiedLeaflet || "Consulte as instruções simplificadas de administração descritas na embalagem do fabricante."}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
