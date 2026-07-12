import React, { useState, useEffect } from "react";
import { User, Order, Coupon } from "../types.js";
import { api } from "../lib/api.js";
import { User as UserIcon, LogOut, Package, Tag, Clock, Edit2, Shield, Check, Copy, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProfileProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  onNavigateToAdmin: () => void;
}

export default function Profile({
  user,
  onLogout,
  onUpdateUser,
  onNavigateToAdmin
}: ProfileProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Edit details
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || "");
  const [address, setAddress] = useState(user.address || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setWhatsapp(user.whatsapp || "");
    setAddress(user.address || "");

    const loadProfileData = async () => {
      try {
        const [ordersList, couponsList] = await Promise.all([
          api.getOrders(),
          api.getCoupons()
        ]);
        setOrders(ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setCoupons(couponsList);
      } catch (err) {
        console.error("Erro ao carregar dados do perfil", err);
      }
    };
    loadProfileData();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateProfile(name, email, whatsapp, address);
      onUpdateUser(updated);
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar dados.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  return (
    <main className="max-w-[1200px] mx-auto p-4 md:p-6 font-sans text-[#1b1c1c] pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-md border border-[#c2c6d3]/40 p-6 flex flex-col items-center text-center relative overflow-hidden">
            {user.role === "Administrador" && (
              <span className="absolute top-3 right-3 bg-[#003e7a]/10 text-[#003e7a] font-bold text-[9px] px-2.5 py-1 rounded-full border border-[#003e7a]/20 flex items-center gap-1">
                <Shield className="w-3 h-3" /> ADMIN
              </span>
            )}

            <div className="w-24 h-24 rounded-full bg-[#d5e3ff] border-2 border-white shadow-md overflow-hidden mb-4 relative flex items-center justify-center">
              {user.avatar ? (
                <img className="w-full h-full object-cover" src={user.avatar} alt={user.name} />
              ) : (
                <UserIcon className="w-12 h-12 text-[#003e7a]" />
              )}
            </div>

            <h2 className="font-bold text-lg text-[#1b1c1c]">{user.name}</h2>
            <p className="text-xs text-[#727783] font-semibold mb-2">{user.email}</p>

            {user.whatsapp && (
              <p className="text-xs text-[#424751] font-medium flex items-center gap-1 mt-0.5">
                <span className="font-bold text-[#003e7a]">WhatsApp:</span> {user.whatsapp}
              </p>
            )}
            {user.address && (
              <p className="text-xs text-[#424751] font-medium mt-0.5 max-w-[240px] text-center">
                <span className="font-bold text-[#003e7a]">Endereço:</span> {user.address}
              </p>
            )}
            <div className="mb-4" />

            {/* Quick counters */}
            <div className="grid grid-cols-2 gap-4 w-full border-t border-b border-[#c2c6d3]/20 py-4 mb-6">
              <div className="text-center">
                <p className="font-extrabold text-lg text-[#003e7a]">{orders.length}</p>
                <p className="text-[10px] font-bold text-[#727783] uppercase tracking-wide">Pedidos</p>
              </div>
              <div className="text-center border-l border-[#c2c6d3]/20">
                <p className="font-extrabold text-lg text-[#003e7a]">{coupons.length}</p>
                <p className="text-[10px] font-bold text-[#727783] uppercase tracking-wide">Cupons ativos</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="w-full flex flex-col gap-2.5">
              {!editMode ? (
                <button 
                  onClick={() => setEditMode(true)}
                  className="w-full py-2.5 bg-[#efeded] hover:bg-[#e9e8e7] text-[#003e7a] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar Informações
                </button>
              ) : (
                <button 
                  onClick={() => setEditMode(false)}
                  className="w-full py-2.5 bg-[#efeded] hover:bg-[#e9e8e7] text-[#ba1a1a] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  Cancelar Edição
                </button>
              )}

              {user.role === "Administrador" && (
                <button 
                  onClick={onNavigateToAdmin}
                  className="w-full py-2.5 bg-[#003e7a] hover:bg-[#0055a4] text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" /> Painel de Controle
                </button>
              )}

              <button 
                onClick={onLogout}
                className="w-full py-2.5 border border-[#ba1a1a]/30 hover:bg-[#ffdad6]/10 text-[#ba1a1a] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sair da Conta
              </button>
            </div>
          </div>

          {/* Edit Profile Form */}
          <AnimatePresence>
            {editMode && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleUpdateProfile}
                className="bg-white rounded-xl border border-[#c2c6d3]/40 p-5 shadow-sm space-y-3.5"
              >
                <h3 className="text-sm font-bold text-[#1b1c1c] border-b border-[#c2c6d3]/10 pb-2">Atualizar Perfil</h3>
                {error && <div className="text-xs text-[#93000a] bg-[#ffdad6] p-2 rounded">{error}</div>}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#424751]">Nome Completo</label>
                  <input 
                    className="rounded-lg border border-[#c2c6d3] px-3 py-2 text-xs focus:border-[#003e7a] outline-none w-full" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#424751]">E-mail</label>
                  <input 
                    className="rounded-lg border border-[#c2c6d3] px-3 py-2 text-xs focus:border-[#003e7a] outline-none w-full" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#424751]">WhatsApp</label>
                  <input 
                    className="rounded-lg border border-[#c2c6d3] px-3 py-2 text-xs focus:border-[#003e7a] outline-none w-full" 
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(99) 99999-9999"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#424751]">Endereço</label>
                  <input 
                    className="rounded-lg border border-[#c2c6d3] px-3 py-2 text-xs focus:border-[#003e7a] outline-none w-full" 
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                    required
                  />
                </div>
                <button 
                  disabled={saving}
                  type="submit"
                  className="w-full py-2 bg-[#006d38] text-white text-xs font-bold rounded-lg hover:bg-[#005228] transition-colors flex items-center justify-center gap-1"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Salvar Alterações
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Orders History & Active Coupons */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Coupons */}
          <section className="bg-white rounded-xl shadow-md border border-[#c2c6d3]/40 p-5 flex flex-col gap-4">
            <h3 className="text-base font-bold text-[#1b1c1c] flex items-center gap-2 border-b border-[#c2c6d3]/20 pb-2">
              <Tag className="w-5 h-5 text-[#003e7a]" /> Seus Cupons Ativos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {coupons.map((c) => (
                <div 
                  key={c.id}
                  className="bg-[#74f9a0]/10 border border-[#006d38]/20 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute -right-4 -top-4 w-12 h-12 bg-[#006d38]/5 rounded-full" />
                  
                  <div>
                    <span className="font-extrabold text-sm text-[#00210d] block">R$ {c.discountAmount} de Desconto</span>
                    <span className="text-[10px] text-[#005228]">Compra mínima R$ {c.minPurchase}</span>
                  </div>

                  <div className="mt-3 flex justify-between items-center gap-1">
                    <span className="font-mono font-bold text-xs bg-white border px-2 py-1 rounded text-[#003e7a] select-all shadow-xs">{c.code}</span>
                    <button 
                      onClick={() => handleCopyCoupon(c.code)}
                      className="p-1 bg-[#003e7a]/5 text-[#003e7a] hover:bg-[#003e7a] hover:text-white rounded transition-all cursor-pointer"
                    >
                      {copiedCoupon === c.code ? <Check className="w-3.5 h-3.5 text-[#006d38]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Orders History */}
          <section className="bg-white rounded-xl shadow-md border border-[#c2c6d3]/40 p-5 flex flex-col gap-4">
            <h3 className="text-base font-bold text-[#1b1c1c] flex items-center gap-2 border-b border-[#c2c6d3]/20 pb-2">
              <Package className="w-5 h-5 text-[#003e7a]" /> Histórico de Pedidos
            </h3>

            {orders.length === 0 ? (
              <div className="p-8 text-center text-[#727783] text-sm bg-[#fbf9f8] rounded-xl border border-dashed border-[#c2c6d3]">
                Você ainda não realizou nenhuma compra.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div 
                    key={order.id}
                    className="border border-[#c2c6d3]/60 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-xs transition-shadow bg-white"
                  >
                    <div>
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
                      
                      <p className="text-[10px] text-[#727783] mt-1 flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-1 bg-[#fbf9f8] px-2 py-1 rounded border text-xs">
                            <img className="w-5 h-5 object-contain" src={item.imageUrl} alt={item.name} />
                            <span className="font-bold text-[#1b1c1c] max-w-[80px] truncate">{item.name}</span>
                            <span className="text-[#727783]">({item.quantity}x)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5 border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto">
                      <p className="text-[10px] text-[#727783] font-bold uppercase tracking-wider">Valor Pago</p>
                      <p className="font-extrabold text-base text-[#003e7a]">R$ {order.total.toFixed(2)}</p>
                      <span className="text-[9px] text-[#006d38] font-bold bg-[#74f9a0]/10 px-2 py-0.5 rounded border border-[#006d38]/20">
                        {order.paymentMethod}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
