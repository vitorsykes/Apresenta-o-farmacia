import React, { useState } from "react";
import { api } from "../lib/api.js";
import { User } from "../types.js";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, Eye, EyeOff, Key, User as UserIcon, LogIn, ArrowLeft, Phone, MapPin } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

type AuthMode = "login" | "register" | "forgotPassword";

export default function Login({ onLoginSuccess }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Google login states forcing WhatsApp
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("eufui.turismo.contato@gmail.com");
  const [googleName, setGoogleName] = useState("Eufui Turismo");
  const [googleWhatsapp, setGoogleWhatsapp] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "login") {
        if (!email || !password) {
          throw new Error("Preencha todos os campos.");
        }
        const response = await api.login(email, password);
        onLoginSuccess(response.user);
      } else if (mode === "register") {
        if (!email || !name || !whatsapp || !address) {
          throw new Error("Preencha todos os campos obrigatórios.");
        }
        const response = await api.register(email, name, whatsapp, address);
        onLoginSuccess(response.user);
      } else if (mode === "forgotPassword") {
        if (!email) {
          throw new Error("Preencha seu e-mail.");
        }
        // Simulated recovery
        setSuccessMsg("Instruções de recuperação de senha enviadas para o seu e-mail.");
        setEmail("");
        setTimeout(() => setMode("login"), 4000);
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    setSuccessMsg(null);
    setShowGooglePrompt(true);
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleWhatsapp.trim()) {
      setError("O número do WhatsApp é obrigatório.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await api.login(googleEmail, undefined, "google-mock-token", googleWhatsapp, googleName);
      onLoginSuccess(response.user);
    } catch (err: any) {
      setError(err.message || "Erro no login com Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fbf9f8] min-h-screen flex items-center justify-center p-4 font-sans text-[#1b1c1c]">
      <main className="w-full max-w-md bg-white rounded-xl shadow-lg border border-[#c2c6d3]/30 p-6 md:p-8 flex flex-col gap-6 overflow-hidden relative">
        <div className="flex flex-col items-center justify-center space-y-4">
          <img 
            alt="PharmaCare Logo" 
            className="h-16 object-contain" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6i7zlH0ucNVZqyQTI4kAbRn88Nay0-Xb7uNMDNj4gBGdRRYCZndzvuuDZq_difdf81jjJLBsQZwY8vZH61S28d91z2xvNEH5T9WQfc3Xr1o1Z8qPHEGLswjYnYaMNEs0Il7E8dTkpIQ8TjacNq1SkgxtAeECAdDHZZkJcusluJU7xkUw6R3-kd1BV1NWma9nLv5nASikysOsVscfpQ-L22Sm3iu2Gi8oPuu4bJAfUf8Bq5QluPkB0"
          />
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-[#003e7a] tracking-tight">
              {mode === "login" && "Bem-vindo de volta"}
              {mode === "register" && "Criar nova conta"}
              {mode === "forgotPassword" && "Recuperar senha"}
            </h1>
            <p className="text-sm text-[#424751] mt-1">
              {mode === "login" && "Acesse sua conta para continuar."}
              {mode === "register" && "Preencha os dados para se cadastrar."}
              {mode === "forgotPassword" && "Insira seu e-mail para receber o link de redefinição."}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#93000a] px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-[#74f9a0]/20 border border-[#006d38]/20 text-[#00210d] px-4 py-3 rounded-lg text-sm font-medium">
            {successMsg}
          </div>
        )}

        {showGooglePrompt ? (
          <form onSubmit={handleGoogleSubmit} className="flex flex-col gap-4">
            <div className="bg-[#e8f0fe] rounded-lg p-3.5 border border-[#1a73e8]/20 flex items-center gap-3">
              <svg aria-hidden="true" className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <div>
                <p className="text-xs font-bold text-[#003e7a]">Cadastro com Google</p>
                <p className="text-[10px] text-[#424751]">Conclua os dados abaixo para criar sua conta.</p>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#1b1c1c]" htmlFor="g-email">E-mail do Google</label>
              <input 
                className="w-full px-4 py-2.5 rounded-lg border border-[#c2c6d3] bg-[#f5f3f3] outline-none text-sm text-[#727783] cursor-not-allowed" 
                id="g-email" 
                type="email" 
                value={googleEmail}
                readOnly
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#1b1c1c]" htmlFor="g-name">Seu Nome</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727783] w-5 h-5" />
                <input 
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#c2c6d3] bg-[#fbf9f8] focus:border-[#003e7a] focus:ring-1 focus:ring-[#003e7a] outline-none transition-colors text-sm text-[#1b1c1c]" 
                  id="g-name" 
                  placeholder="Seu nome completo" 
                  type="text" 
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-[#1b1c1c]" htmlFor="g-whatsapp">WhatsApp (Obrigatório)</label>
                <span className="text-[10px] font-bold text-[#ba1a1a]">Campo Obrigatório</span>
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727783] w-5 h-5" />
                <input 
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#c2c6d3] bg-[#fbf9f8] focus:border-[#003e7a] focus:ring-1 focus:ring-[#003e7a] outline-none transition-colors text-sm text-[#1b1c1c]" 
                  id="g-whatsapp" 
                  placeholder="(99) 99999-9999" 
                  type="tel" 
                  value={googleWhatsapp}
                  onChange={(e) => setGoogleWhatsapp(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-[#1a73e8] text-white py-3 rounded-lg font-bold hover:bg-[#1557b0] active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 mt-2 text-sm disabled:opacity-50" 
              type="submit"
            >
              {loading ? "Processando..." : "Confirmar e Cadastrar"}
            </button>

            <button 
              onClick={() => { setShowGooglePrompt(false); setError(null); }}
              className="w-full text-xs text-[#727783] font-bold hover:underline py-2 text-center"
              type="button"
            >
              Voltar ao Login
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === "register" && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#1b1c1c]" htmlFor="name">Nome Completo</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727783] w-5 h-5" />
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#c2c6d3] bg-[#fbf9f8] focus:border-[#003e7a] focus:ring-1 focus:ring-[#003e7a] outline-none transition-colors text-sm text-[#1b1c1c]" 
                        id="name" 
                        placeholder="Seu nome completo" 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#1b1c1c]" htmlFor="whatsapp">WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727783] w-5 h-5" />
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#c2c6d3] bg-[#fbf9f8] focus:border-[#003e7a] focus:ring-1 focus:ring-[#003e7a] outline-none transition-colors text-sm text-[#1b1c1c]" 
                        id="whatsapp" 
                        placeholder="(99) 99999-9999" 
                        type="tel" 
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#1b1c1c]" htmlFor="address">Endereço de Entrega</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727783] w-5 h-5" />
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#c2c6d3] bg-[#fbf9f8] focus:border-[#003e7a] focus:ring-1 focus:ring-[#003e7a] outline-none transition-colors text-sm text-[#1b1c1c]" 
                        id="address" 
                        placeholder="Rua, Número, Bairro, Cidade - UF" 
                        type="text" 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#1b1c1c]" htmlFor="email">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727783] w-5 h-5" />
                  <input 
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#c2c6d3] bg-[#fbf9f8] focus:border-[#003e7a] focus:ring-1 focus:ring-[#003e7a] outline-none transition-colors text-sm text-[#1b1c1c]" 
                    id="email" 
                    placeholder="seu@email.com" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {(mode === "login" || mode === "register") && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[#1b1c1c]" htmlFor="password">Senha</label>
                    {mode === "login" && (
                      <button 
                        type="button" 
                        onClick={() => setMode("forgotPassword")}
                        className="text-xs font-semibold text-[#003e7a] hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727783] w-5 h-5" />
                    <input 
                      className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-[#c2c6d3] bg-[#fbf9f8] focus:border-[#003e7a] focus:ring-1 focus:ring-[#003e7a] outline-none transition-colors text-sm text-[#1b1c1c]" 
                      id="password" 
                      placeholder="••••••••" 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      aria-label="Toggle password visibility" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727783] hover:text-[#003e7a] transition-colors focus:outline-none" 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              <button 
                disabled={loading}
                className="w-full bg-[#003e7a] text-white py-3 rounded-lg font-bold hover:bg-[#0055a4] active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 mt-2 text-sm disabled:opacity-50" 
                type="submit"
              >
                {loading ? "Processando..." : (
                  <>
                    {mode === "login" && "Entrar"}
                    {mode === "register" && "Cadastrar"}
                    {mode === "forgotPassword" && "Enviar Código"}
                    <LogIn className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {mode !== "forgotPassword" && (
              <>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-[#c2c6d3]"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-semibold text-[#727783]">ou</span>
                  <div className="flex-grow border-t border-[#c2c6d3]"></div>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-[#ffffff] border border-[#c2c6d3] text-[#1b1c1c] py-2.5 rounded-lg font-bold hover:bg-[#f5f3f3] transition-colors flex items-center justify-center gap-3 text-sm disabled:opacity-50" 
                  type="button"
                >
                  <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  Entrar com Google
                </button>
              </>
            )}

            <div className="text-center text-sm text-[#424751] mt-2">
              {mode === "login" ? (
                <p>
                  Não tem uma conta?{" "}
                  <button onClick={() => { setMode("register"); setError(null); }} className="text-[#003e7a] hover:underline font-bold">
                    Criar conta
                  </button>
                </p>
              ) : (
                <button onClick={() => { setMode("login"); setError(null); }} className="text-[#003e7a] hover:underline font-bold flex items-center justify-center gap-1 mx-auto">
                  <ArrowLeft className="w-4 h-4" /> Voltar para o login
                </button>
              )}
            </div>
          </>
        )}

        {/* Demo Hints helper */}
        <div className="border-t border-[#c2c6d3]/50 pt-3 text-[11px] text-[#727783] leading-relaxed flex flex-col gap-0.5">
          <p className="font-bold">Dicas de demonstração:</p>
          <p>• Admin: <span className="font-semibold text-xs text-[#003e7a]">admin@vitalidade.com.br</span> (senha: admin)</p>
          <p>• Cliente: <span className="font-semibold text-xs text-[#003e7a]">joao.silva@exemplo.com.br</span> (senha: 123)</p>
        </div>
      </main>
    </div>
  );
}
