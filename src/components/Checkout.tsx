import { useState, useEffect } from "react";
import { Product, Order, User, Coupon, StoreSettings } from "../types.js";
import { api } from "../lib/api.js";
import { ArrowLeft, CreditCard, QrCode, FileText, CheckCircle, ShieldCheck, Loader2, Copy, Check, Banknote, Ticket } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CheckoutProps {
  storeSettings: StoreSettings;
  user: User;
  cartItems: { productId: string; quantity: number }[];
  products: Product[];
  onOrderSuccess: (order: Order) => void;
  onCancel: () => void;
}

export default function Checkout({
  storeSettings,
  user,
  cartItems,
  products,
  onOrderSuccess,
  onCancel
}: CheckoutProps) {
  const [street, setStreet] = useState("Rua das Flores, 123 - Apto 45");
  const [city, setCity] = useState("São Paulo - SP");
  const [zipCode, setZipCode] = useState("01234-567");
  const [addressLabel, setAddressLabel] = useState("Casa");

  const [deliveryType, setDeliveryType] = useState<"Expressa" | "Padrão">("Expressa");
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "Cartão" | "Dinheiro">("PIX");

  // Cash / Dinheiro inputs
  const [needsChange, setNeedsChange] = useState<boolean | null>(null);
  const [changeAmount, setChangeAmount] = useState("");

  // Credit Card inputs
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState("1");

  // Copy state helper
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Coupon states
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccessMsg, setCouponSuccessMsg] = useState("");

  useEffect(() => {
    api.getCoupons().then(setCoupons).catch(err => console.error("Erro ao buscar cupons:", err));
  }, []);

  // calculate totals
  const mappedItems = cartItems.map((item) => {
    const prod = products.find((p) => p.id === item.productId);
    return {
      productId: item.productId,
      name: prod ? prod.name : "",
      quantity: item.quantity,
      price: prod ? (prod.promoPrice || prod.price) : 0,
      imageUrl: prod ? prod.imageUrls[0] : ""
    };
  }).filter((x) => x.name !== "");

  const subtotal = mappedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  // Dynamic scoped coupon calculation
  let discount = 0;
  let activeCouponLabel = "";

  if (appliedCoupon) {
    const applicableSubtotal = mappedItems.reduce((acc, curr) => {
      const prod = products.find(p => p.id === curr.productId);
      const isProductAllowed = !appliedCoupon.targetProducts || appliedCoupon.targetProducts.length === 0 || appliedCoupon.targetProducts.includes(curr.productId);
      const isCategoryAllowed = !appliedCoupon.targetCategories || appliedCoupon.targetCategories.length === 0 || (prod && appliedCoupon.targetCategories.includes(prod.category));
      
      if (isProductAllowed && isCategoryAllowed) {
        return acc + (curr.price * curr.quantity);
      }
      return acc;
    }, 0);

    discount = Math.min(appliedCoupon.discountAmount, applicableSubtotal);
    activeCouponLabel = appliedCoupon.code;
  } else {
    // default auto discount
    discount = subtotal > 100 ? 10.00 : 0.00;
    const codePrefix = storeSettings.name.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 10);
    activeCouponLabel = `${codePrefix}10`;
  }

  const freight = deliveryType === "Expressa" ? 14.90 : 7.90;
  const total = Math.max(0, subtotal - discount) + freight;

  const handleApplyCoupon = () => {
    setCouponError("");
    setCouponSuccessMsg("");
    
    if (!couponInput.trim()) {
      setAppliedCoupon(null);
      return;
    }

    const code = couponInput.trim().toUpperCase();
    const found = coupons.find(c => c.code === code);
    
    if (!found) {
      setCouponError("Cupom inválido ou não encontrado.");
      setAppliedCoupon(null);
      return;
    }

    // Check expiration
    if (found.expiryDate) {
      const today = new Date().toISOString().split("T")[0];
      if (today > found.expiryDate) {
        setCouponError("Este cupom já está expirado.");
        setAppliedCoupon(null);
        return;
      }
    }

    // Check minimum purchase
    if (found.minPurchase && subtotal < found.minPurchase) {
      setCouponError(`Este cupom exige uma compra mínima de R$ ${found.minPurchase.toFixed(2)}.`);
      setAppliedCoupon(null);
      return;
    }

    // Check if there are applicable products in cart
    const applicableItems = mappedItems.filter(curr => {
      const prod = products.find(p => p.id === curr.productId);
      const isProductAllowed = !found.targetProducts || found.targetProducts.length === 0 || found.targetProducts.includes(curr.productId);
      const isCategoryAllowed = !found.targetCategories || found.targetCategories.length === 0 || (prod && found.targetCategories.includes(prod.category));
      return isProductAllowed && isCategoryAllowed;
    });

    if (applicableItems.length === 0) {
      setCouponError("Este cupom não se aplica aos itens no carrinho.");
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(found);
    setCouponSuccessMsg(`Cupom ${found.code} aplicado com sucesso!`);
  };

  const handleCopyPix = () => {
    const cleanName = storeSettings.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9 ]/g, "").substring(0, 25);
    const nameLengthStr = cleanName.length.toString().padStart(2, '0');
    const pixString = `00020126580014BR.GOV.BCB.PIX0136dee57c98-8533-48c8-b1ba-c93fd1cd89f85204000053039865405101.755802BR59${nameLengthStr}${cleanName}6009SAO PAULO62070503***6304D1B0`;
    navigator.clipboard.writeText(pixString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitCheckout = async () => {
    setLoading(true);
    try {
      const order = await api.createOrder({
        items: mappedItems,
        subtotal,
        discount,
        freight,
        total,
        status: "Pendente",
        deliveryType,
        paymentMethod,
        address: {
          label: addressLabel,
          street,
          city,
          zipCode
        }
      });
      
      // wait a tiny bit to simulate processing
      setTimeout(() => {
        // Format WhatsApp Message with full purchase details
        const itemsText = mappedItems
          .map((item) => `• *${item.name}* (${item.quantity}x) - R$ ${(item.price * item.quantity).toFixed(2)}`)
          .join("\n");

        let paymentDetail = paymentMethod;
        if (paymentMethod === "Dinheiro") {
          if (needsChange === true) {
            paymentDetail = `Dinheiro (Precisa de troco para: R$ ${changeAmount})`;
          } else if (needsChange === false) {
            paymentDetail = `Dinheiro (Não precisa de troco - levar valor exato)`;
          } else {
            paymentDetail = `Dinheiro`;
          }
        }

        const msg = `🛒 *NOVO PEDIDO - ${storeSettings.name.toUpperCase()}*\n\n` +
          `*Código do Pedido:* #${order.id}\n` +
          `*Cliente:* ${user.name} (${user.email})\n\n` +
          `📍 *Endereço de Entrega:*\n` +
          `• ${addressLabel}: ${street}\n` +
          `• Cidade/UF: ${city}\n` +
          `• CEP: ${zipCode}\n\n` +
          `🚚 *Método de Entrega:* ${deliveryType}\n` +
          `💳 *Forma de Pagamento:* ${paymentDetail}\n\n` +
          `📦 *Produtos:*\n${itemsText}\n\n` +
          `💵 *Resumo dos Valores:*\n` +
          `• Subtotal: R$ ${subtotal.toFixed(2)}\n` +
          (discount > 0 ? `• Desconto: -R$ ${discount.toFixed(2)}\n` : "") +
          `• Frete: R$ ${freight.toFixed(2)}\n` +
          `• *Total Geral:* R$ ${total.toFixed(2)}`;

        const encodedMsg = encodeURIComponent(msg);
        const whatsappUrl = `https://wa.me/5521985196315?text=${encodedMsg}`;
        
        // Open WhatsApp in a new tab / window
        window.open(whatsappUrl, "_blank");

        onOrderSuccess(order);
        setLoading(false);
      }, 1800);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <main className="max-w-[1200px] mx-auto p-4 md:p-6 font-sans text-[#1b1c1c]">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onCancel} className="p-1 hover:bg-[#efeded] rounded-full transition-colors cursor-pointer">
          <ArrowLeft className="w-6 h-6 text-[#003e7a]" />
        </button>
        <h1 className="text-xl md:text-2xl font-bold">Finalizar Pedido</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forms column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <section className="bg-white rounded-xl p-5 shadow-sm border border-[#c2c6d3]/40 flex flex-col gap-4">
            <h2 className="text-base font-bold border-b border-[#c2c6d3]/20 pb-2">1. Endereço de Entrega</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#424751]">Apelido do Endereço</label>
                <input 
                  className="rounded-lg border border-[#c2c6d3] px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                  value={addressLabel}
                  onChange={(e) => setAddressLabel(e.target.value)}
                  placeholder="Ex: Minha Casa"
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-bold text-[#424751]">Rua, Número e Complemento</label>
                <input 
                  className="rounded-lg border border-[#c2c6d3] px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Rua, número, apto..."
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#424751]">CEP</label>
                <input 
                  className="rounded-lg border border-[#c2c6d3] px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-bold text-[#424751]">Cidade e Estado</label>
                <input 
                  className="rounded-lg border border-[#c2c6d3] px-3 py-2 text-xs focus:border-[#003e7a] outline-none" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Delivery Options */}
          <section className="bg-white rounded-xl p-5 shadow-sm border border-[#c2c6d3]/40 flex flex-col gap-4">
            <h2 className="text-base font-bold border-b border-[#c2c6d3]/20 pb-2">2. Opção de Entrega</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button 
                onClick={() => setDeliveryType("Expressa")}
                className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between cursor-pointer transition-all ${
                  deliveryType === "Expressa" ? "border-[#003e7a] bg-[#d5e3ff]/10" : "border-[#c2c6d3]/60 bg-white hover:bg-[#efeded]"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-bold text-[#003e7a] uppercase">Entrega Expressa</span>
                  <span className="font-extrabold text-sm text-[#003e7a]">R$ 14,90</span>
                </div>
                <p className="text-xs text-[#1b1c1c] font-bold mt-2">Em até 1 hora</p>
                <p className="text-[10px] text-[#727783] mt-0.5">Ideal para urgências e medicamentos.</p>
              </button>

              <button 
                onClick={() => setDeliveryType("Padrão")}
                className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between cursor-pointer transition-all ${
                  deliveryType === "Padrão" ? "border-[#003e7a] bg-[#d5e3ff]/10" : "border-[#c2c6d3]/60 bg-white hover:bg-[#efeded]"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-bold text-[#424751] uppercase">Entrega Padrão</span>
                  <span className="font-extrabold text-sm text-[#424751]">R$ 7,90</span>
                </div>
                <p className="text-xs text-[#1b1c1c] font-bold mt-2">No mesmo dia (até as 20h)</p>
                <p className="text-[10px] text-[#727783] mt-0.5">Para compras programadas e bem-estar.</p>
              </button>
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-white rounded-xl p-5 shadow-sm border border-[#c2c6d3]/40 flex flex-col gap-4">
            <h2 className="text-base font-bold border-b border-[#c2c6d3]/20 pb-2">3. Forma de Pagamento</h2>
            
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button"
                onClick={() => setPaymentMethod("PIX")}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  paymentMethod === "PIX" ? "border-[#003e7a] bg-[#d5e3ff]/15 text-[#003e7a]" : "border-[#c2c6d3]/60 bg-white text-[#727783]"
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs font-bold">PIX</span>
              </button>

              <button 
                type="button"
                onClick={() => setPaymentMethod("Cartão")}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  paymentMethod === "Cartão" ? "border-[#003e7a] bg-[#d5e3ff]/15 text-[#003e7a]" : "border-[#c2c6d3]/60 bg-white text-[#727783]"
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-bold">Cartão</span>
              </button>

              <button 
                type="button"
                onClick={() => setPaymentMethod("Dinheiro")}
                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  paymentMethod === "Dinheiro" ? "border-[#003e7a] bg-[#d5e3ff]/15 text-[#003e7a]" : "border-[#c2c6d3]/60 bg-white text-[#727783]"
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs font-bold">Dinheiro</span>
              </button>
            </div>

            {/* Interactive Payment Forms */}
            <AnimatePresence mode="wait">
              {paymentMethod === "PIX" && (
                <motion.div 
                  key="pix"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#fbf9f8] p-4 rounded-xl border border-[#c2c6d3]/30 flex flex-col items-center text-center gap-2 overflow-hidden"
                >
                  <p className="text-xs text-[#003e7a] font-bold">Pagamento via PIX selecionado</p>
                  <p className="text-xs text-[#424751] font-medium leading-relaxed">Você receberá os dados da chave Pix e instruções de envio do comprovante diretamente no nosso WhatsApp após finalizar o pedido.</p>
                </motion.div>
              )}

              {paymentMethod === "Cartão" && (
                <motion.div 
                  key="card"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#fbf9f8] p-4 rounded-xl border border-[#c2c6d3]/30 flex flex-col items-center text-center gap-2 overflow-hidden"
                >
                  <p className="text-xs text-[#003e7a] font-bold">Pagamento via Cartão selecionado</p>
                  <p className="text-xs text-[#424751] font-medium leading-relaxed">Nossa equipe irá combinar os detalhes da cobrança do cartão com você de forma prática e totalmente segura diretamente via WhatsApp após finalizar o pedido.</p>
                </motion.div>
              )}

              {paymentMethod === "Dinheiro" && (
                <motion.div 
                  key="cash"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#fbf9f8] p-4 rounded-xl border border-[#c2c6d3]/30 flex flex-col gap-3 overflow-hidden"
                >
                  <p className="text-xs text-[#003e7a] font-bold text-center">Pagamento em Dinheiro selecionado</p>
                  
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-[#424751] text-center sm:text-left">Você precisa de troco?</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setNeedsChange(true);
                        }}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-all text-center ${
                          needsChange === true ? "border-[#003e7a] bg-[#d5e3ff]/15 text-[#003e7a]" : "border-[#c2c6d3]/60 bg-white text-[#727783]"
                        }`}
                      >
                        Sim, preciso de troco
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setNeedsChange(false);
                          setChangeAmount("");
                        }}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-all text-center ${
                          needsChange === false ? "border-[#003e7a] bg-[#d5e3ff]/15 text-[#003e7a]" : "border-[#c2c6d3]/60 bg-white text-[#727783]"
                        }`}
                      >
                        Não, valor exato
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {needsChange === true && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-1.5 mt-1 overflow-hidden"
                      >
                        <label className="text-xs font-bold text-[#424751]">Troco para quanto?</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs text-[#727783] font-bold">R$</span>
                          <input 
                            className="w-full rounded-lg border border-[#c2c6d3] pl-8 pr-3 py-2 text-xs focus:border-[#003e7a] outline-none bg-white" 
                            placeholder="Ex: 50,00 ou 100,00"
                            value={changeAmount}
                            onChange={(e) => setChangeAmount(e.target.value)}
                          />
                        </div>
                        <p className="text-[10px] text-[#727783]">Nossos entregadores levam o troco certinho para você.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Sidebar recap */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md border border-[#c2c6d3]/40 p-6 sticky top-24 flex flex-col gap-4">
            <h3 className="text-base font-bold border-b border-[#c2c6d3]/20 pb-2">Sacola de Compras</h3>

            {/* mini items list */}
            <div className="max-h-48 overflow-y-auto divide-y divide-[#c2c6d3]/20 pr-1">
              {mappedItems.map((item) => (
                <div key={item.productId} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <img className="w-8 h-8 object-contain rounded bg-[#fbf9f8]" src={item.imageUrl} alt={item.name} />
                    <div className="text-xs">
                      <p className="font-bold text-[#1b1c1c] line-clamp-1">{item.name}</p>
                      <p className="text-[#727783]">{item.quantity}x</p>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-[#003e7a]">R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Cupom de Desconto Section */}
            <div className="border-t border-[#c2c6d3]/40 pt-3 flex flex-col gap-2">
              <label className="text-xs font-bold text-[#424751] flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-[#003e7a]" />
                Possui cupom de desconto?
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ex: PROMO20" 
                  className="flex-1 rounded-lg border border-[#c2c6d3] px-3 py-1.5 text-xs focus:border-[#003e7a] outline-none uppercase font-bold bg-white"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-[#003e7a] hover:bg-[#002850] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Aplicar
                </button>
              </div>
              {couponError && (
                <p className="text-[10px] text-[#ba1a1a] font-bold">{couponError}</p>
              )}
              {couponSuccessMsg && (
                <p className="text-[10px] text-[#006d38] font-bold">{couponSuccessMsg}</p>
              )}
            </div>

            {/* Recalculate totals view */}
            <div className="border-t border-[#c2c6d3]/40 pt-3 space-y-2 text-xs md:text-sm text-[#424751]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#00723a] font-semibold">
                  <span>Desconto ({activeCouponLabel})</span>
                  <span>- R$ {discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Frete ({deliveryType})</span>
                <span>R$ {freight.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end border-t border-[#c2c6d3]/40 pt-3 text-[#1b1c1c]">
                <span className="font-bold text-sm">Valor Total</span>
                <span className="font-extrabold text-xl text-[#003e7a]">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleSubmitCheckout}
              disabled={loading}
              className="w-full py-4 bg-[#006d38] text-white rounded-xl font-bold hover:bg-[#005228] transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando pedido...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Confirmar e Finalizar
                </>
              )}
            </button>

            <p className="text-[10px] text-[#727783] text-center mt-2 flex items-center justify-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-[#006d38]" /> Pedido enviado com criptografia SSL.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
