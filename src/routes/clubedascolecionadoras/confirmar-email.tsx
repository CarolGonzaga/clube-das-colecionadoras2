import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AlertCircle, Heart, CheckCircle2, Loader2, KeyRound } from "lucide-react";
import { supabase } from "../../lib/db";

const searchSchema = z.object({
  email: z.string().optional(),
  type: z.string().optional(),
});

const MIN_OTP_LENGTH = 6;
const MAX_OTP_LENGTH = 8;

export const Route = createFileRoute("/clubedascolecionadoras/confirmar-email")({
  ssr: false,
  validateSearch: searchSchema,
  component: ConfirmarEmailPage,
});

function ConfirmarEmailPage() {
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email || "");
  const type = search.type || "signup";
  const [code, setCode] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = code.replace(/\D/g, "");

    if (!email || !normalizedCode) {
      setError("Preencha o e-mail e o código de verificação.");
      return;
    }

    if (
      normalizedCode.length < MIN_OTP_LENGTH ||
      normalizedCode.length > MAX_OTP_LENGTH
    ) {
      setError("Digite o código completo de 6 a 8 dígitos enviado por e-mail.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: normalizedCode,
        type: type as any,
      });

      if (verifyError) {
        setError(verifyError.message || "Código inválido ou expirado.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          if (type === "recovery") {
            window.location.href = "/clubedascolecionadoras/login?step=forgot_reset";
          } else {
            window.location.href = "/clubedascolecionadoras";
          }
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "Erro inesperado ao confirmar e-mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen min-h-screen bg-pink-light flex flex-col justify-center items-center p-4">
      <div className="login-container max-w-[400px] w-full bg-white/90 backdrop-blur-md rounded-[32px] border border-pink-100 shadow-[0_16px_48px_rgba(158,27,74,0.08)] p-6 md:p-8 flex flex-col items-center">
        
        <header className="text-center mb-6">
          <img
            src="/logo_text.png"
            alt="Clube das Colecionadoras"
            className="w-48 mx-auto mb-2 drop-shadow-[0_4px_10px_rgba(220,80,140,0.18)]"
          />
          <h2 className="text-berry font-bold text-sm tracking-[0.2em] uppercase mt-2">
            Confirmação de Conta
          </h2>
        </header>

        {error && (
          <div className="w-full p-4 mb-4 rounded-xl bg-red-100 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium leading-relaxed">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="w-full text-center flex flex-col items-center gap-4 py-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 size={32} className="text-emerald-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-emerald-800 font-extrabold text-sm uppercase tracking-wider">
                E-mail Confirmado! 🎉
              </h3>
              <p className="text-xs text-emerald-600/80 font-semibold mt-1">
                Sua conta foi validada com sucesso. Redirecionando você para o jogo...
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#fce4ec] flex items-center justify-center border border-pink-200/60 animate-bounce">
              <KeyRound className="w-8 h-8 text-[#C2185B]" />
            </div>

            <p className="text-xs text-[#bf2a5e] font-semibold leading-relaxed px-2 mb-2">
              Enviamos um código de confirmação para o seu e-mail. Digite os
              6 a 8 dígitos abaixo para confirmar sua conta.
            </p>

            <form onSubmit={handleConfirm} className="w-full flex flex-col gap-3">
              {!search.email && (
                <div>
                  <input
                    type="email"
                    placeholder="Seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-rose-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white/70"
                    required
                  />
                </div>
              )}
              
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Código"
                  value={code}
                  onChange={(e) =>
                    setCode(
                      e.target.value.replace(/\D/g, "").slice(0, MAX_OTP_LENGTH),
                    )
                  }
                  minLength={MIN_OTP_LENGTH}
                  maxLength={MAX_OTP_LENGTH}
                  pattern={`\\d{${MIN_OTP_LENGTH},${MAX_OTP_LENGTH}}`}
                  className="w-full p-3 rounded-xl border border-rose-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-center text-xl tracking-[0.3em] font-mono font-bold bg-white/70 text-berry"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  !email ||
                  code.length < MIN_OTP_LENGTH ||
                  code.length > MAX_OTP_LENGTH
                }
                className="w-full py-3.5 rounded-2xl text-xs font-bold text-white shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98] mt-2 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--gradient-berry)" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Verificando...
                  </>
                ) : (
                  <>
                    Confirmar meu e-mail <Heart size={14} fill="currentColor" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <footer className="mt-8 text-center border-t border-pink-50 w-full pt-4">
          <Link
            to="/clubedascolecionadoras/login"
            className="text-xs font-bold text-berry hover:text-primary transition-colors cursor-pointer"
          >
            Voltar para o Login
          </Link>
        </footer>
      </div>
    </div>
  );
}
