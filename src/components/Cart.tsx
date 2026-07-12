import { useState, useEffect } from "react";
import { Product } from "../types.js";
import { api } from "../lib/api.js";
import { ShoppingCart, Delete, Trash, Plus, Minus, Calculator, Lock, ShieldCheck, Heart } from "lucide-react";
import { motion } from "motion/react";

interface CartProps {
  cartItems: { productId: string; quantity: number }[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedToCheckout: () => void;
  products: Product[];
  onProductSelect: (id: string) => void;
}

export default function Cart({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  products,
  onProductSelect
}: CartProps) {
  const [zipCode, setZipCode] = useState("");
  const [freightCost, setFreightCost] = useState(0);
  const [freightChecked, setFreightChecked] = useState(false);

  // calculate values
  const mappedItems = cartItems.map((item) => {
    const prod = products.find((p) => p.id === item.productId);
    return {
      product: prod,
      quantity: item.quantity,
      price: prod ? (prod.promoPrice || prod.price) : 0,
      originalPrice: prod ? prod.price : 0
    };
  }).filter((x) => x.product !== undefined) as { product: Product; quantity: number; price: number; originalPrice: number }[];

  const subtotal = mappedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const originalSubtotal = mappedItems.reduce((acc, curr) => acc + (curr.originalPrice * curr.quantity), 0);
  const discount = Math.max(0, originalSubtotal - subtotal);
  const total = subtotal + freightCost;

  const handleCalculateFreight = () => {
    if (!zipCode.trim() || zipCode.length < 8) return;
    // mock freight calculation based on zip
    const sum = zipCode.split("").reduce((a, b) => a + (parseInt(b) || 0), 0);
    const cost = sum % 2 === 0 ? 9.90 : 0; // standard or free
    setFreightCost(cost);
    setFreightChecked(true);
  };

  if (cartItems.length === 0) {
    return (
      <main className="max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center select-none font-sans">
        <ShoppingCart className="w-16 h-16 text-[#727783] mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-[#1a1c1c] mb-1">Seu Carrinho está vazio</h2>
        <p className="text-sm text-[#424751] mb-6">Que tal adicionar alguns medicamentos ou cosméticos?</p>
        <button 
          onClick={onProceedToCheckout} // Proceed goes back to catalog when empty
          className="bg-[#003e7a] hover:bg-[#0055a4] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all cursor-pointer"
        >
          Voltar para Loja
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-[1200px] mx-auto p-4 md:p-6 font-sans text-[#1b1c1c]">
      <h1 className="text-xl md:text-2xl font-bold text-[#1b1c1c] mb-6 flex items-center gap-2">
        <ShoppingCart className="w-6 h-6 text-[#003e7a] fill-[#003e7a]" />
        Seu Carrinho
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart list */}
        <div className="lg:col-span-2 space-y-4">
          {mappedItems.map(({ product, quantity, price, originalPrice }) => {
            const hasRecipe = product.indications?.toLowerCase().includes("antibiótico") || product.name.toLowerCase().includes("amoxicilina") || product.simplifiedLeaflet?.toLowerCase().includes("venda sob prescrição");
            return (
              <div 
                key={product.id}
                className="bg-white rounded-xl p-4 flex flex-col sm:flex-row gap-4 shadow-sm border border-[#c2c6d3]/40 relative overflow-hidden group"
              >
                {hasRecipe && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#af000a]" />
                )}

                <div 
                  onClick={() => onProductSelect(product.id)}
                  className="w-full sm:w-28 h-28 bg-[#fbf9f8] rounded-lg flex-shrink-0 flex items-center justify-center p-2 cursor-pointer"
                >
                  <img className="w-20 h-20 object-contain" src={product.imageUrls[0]} alt={product.name} />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        {hasRecipe && (
                          <span className="inline-block px-2 py-0.5 bg-[#ffdad6] text-[#93000a] font-bold text-[9px] rounded mb-1">
                            RECEITA OBRIGATÓRIA
                          </span>
                        )}
                        <h2 
                          onClick={() => onProductSelect(product.id)}
                          className="font-bold text-sm md:text-base text-[#1b1c1c] hover:text-[#003e7a] cursor-pointer line-clamp-2 leading-tight"
                        >
                          {product.name}
                        </h2>
                        {product.presentation && (
                          <p className="text-xs text-[#727783] mt-1">{product.presentation}</p>
                        )}
                      </div>
                      <button 
                        onClick={() => onRemoveItem(product.id)}
                        aria-label="Remover item" 
                        className="text-[#727783] hover:text-[#ba1a1a] transition-colors p-1 cursor-pointer"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-4">
                    <div className="flex items-center border border-[#c2c6d3] rounded-lg bg-white shadow-sm">
                      <button 
                        onClick={() => onUpdateQuantity(product.id, Math.max(1, quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center text-[#003e7a] hover:bg-[#efeded] transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                      <button 
                        disabled={quantity >= product.stock}
                        onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#003e7a] hover:bg-[#efeded] transition-colors cursor-pointer disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      {product.isPromo && product.promoPrice && (
                        <p className="text-[#727783] line-through text-[11px]">R$ {(product.price * quantity).toFixed(2)}</p>
                      )}
                      <div className="font-extrabold text-lg text-[#003e7a] tracking-tight">
                        R$ {(price * quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button 
            onClick={() => onProceedToCheckout()} // Goes back to browse catalog or other
            className="w-full py-3.5 border-2 border-dashed border-[#a8c8ff] rounded-xl text-[#003e7a] font-bold hover:bg-[#d5e3ff]/10 transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
          >
            <Plus className="w-4 h-4" /> Adicionar mais produtos
          </button>
        </div>

        {/* Totals Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md border border-[#c2c6d3]/40 p-6 sticky top-24">
            <h3 className="text-base font-bold text-[#1b1c1c] border-b border-[#c2c6d3]/40 pb-3 mb-4">Resumo do pedido</h3>
            
            <div className="space-y-3 text-xs md:text-sm text-[#424751] mb-6">
              <div className="flex justify-between">
                <span>Subtotal ({cartItems.reduce((acc, curr) => acc + curr.quantity, 0)} itens)</span>
                <span className="font-semibold">R$ {(subtotal + discount).toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#00723a]">
                  <span>Descontos</span>
                  <span className="font-bold">- R$ {discount.toFixed(2)}</span>
                </div>
              )}


            </div>

            <div className="border-t border-[#c2c6d3]/40 pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-[#1b1c1c]">Total</span>
                <span className="font-extrabold text-2xl text-[#003e7a] leading-none">R$ {total.toFixed(2)}</span>
              </div>
              <div className="text-right text-[11px] text-[#424751] mt-1.5">
                Em até 3x de R$ {(total / 3).toFixed(2)} sem juros
              </div>
            </div>

            <button 
              onClick={onProceedToCheckout}
              className="w-full py-3.5 bg-[#006d38] text-white rounded-xl text-sm font-bold hover:bg-[#005228] transition-colors shadow flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" /> Finalizar Compra
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[#727783] text-[11px] font-semibold">
              <Lock className="w-3.5 h-3.5" /> Compra 100% segura
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
