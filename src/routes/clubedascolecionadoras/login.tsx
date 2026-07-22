import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  loginAction,
  requestPasswordResetAction,
  verifyResetCodeAction,
  updatePasswordAction,
} from "../../lib/actions";
import { z } from "zod";
import { AlertCircle, Heart, ArrowLeft, KeyRound, Mail, CheckCircle2 } from "lucide-react";
import PasswordField from "../../components/PasswordField";

const searchSchema = z.object({
  redirect: z.string().optional(),
  step: z.string().optional(),
  maintenance_test: z.coerce.string().optional(),
});

export const Route = createFileRoute("/clubedascolecionadoras/login")({
  ssr: false,
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    // If already logged in, redirect to index or redirect param (UNLESS resetting password)
    if (search.step === "forgot_reset") return;

    const user = await import("../../lib/db").then((m) => m.dbService.getCurrentUser());
    if (user) {
      throw redirect({ to: search.redirect || "/clubedascolecionadoras" });
    }
  },
  component: LoginComponent,
});

type LoginStep = "login" | "forgot_request" | "forgot_verify" | "forgot_reset" | "success";

function LoginComponent() {
  const router = useRouter();
  const search = Route.useSearch();

  const [step, setStep] = useState<LoginStep>((search.step as LoginStep) || "login");

  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pin) {
      setError("Por favor, preencha todos os campos.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await loginAction(email, pin);
      if (res.success) {
        router.invalidate();
        await router.navigate({ to: search.redirect || "/clubedascolecionadoras" });
      } else {
        setError(res.message || "Credenciais inválidas. Verifique seu e-mail e PIN.");
      }
    } catch (err) {
      setError("Erro ao tentar fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor, informe seu e-mail para receber o código.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await requestPasswordResetAction(email);
      if (res.success) {
        setStep("forgot_verify");
      } else {
        setError(res.message || "Erro ao solicitar recuperação.");
      }
    } catch (err) {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError("Digite o código de 6 dígitos que enviamos para o seu e-mail.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await verifyResetCodeAction(email, otpCode);
      if (res.success) {
        setStep("forgot_reset");
      } else {
        setError(res.message || "Código inválido ou expirado.");
      }
    } catch (err) {
      setError("Erro ao verificar código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setError("A nova senha/PIN deve ter pelo menos 4 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await updatePasswordAction(newPassword);
      if (res.success) {
        setStep("success");
        setTimeout(() => {
          router.invalidate();
          router.navigate({ to: search.redirect || "/clubedascolecionadoras" });
        }, 2000);
      } else {
        setError(res.message || "Erro ao atualizar senha.");
      }
    } catch (err) {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[460px] min-h-[100svh] flex flex-col justify-center px-6 py-8 relative overflow-x-hidden bg-rose-soft/20">
      {/* Decorative Sparkles */}
      <span className="absolute top-24 left-10 text-primary select-none pointer-events-none text-2xl animate-sparkle">
        ✦
      </span>
      <span className="absolute bottom-32 right-12 text-primary select-none pointer-events-none text-3xl animate-sparkle-delayed">
        ✦
      </span>

      <div className="surface-card p-6 shadow-[var(--shadow-soft)] flex flex-col items-center relative overflow-hidden">
        <header className="text-center mb-6">
          <img
            src="/logo_text.png"
            alt="Clube das Colecionadoras"
            className="w-48 mx-auto mb-2 drop-shadow-[0_4px_10px_rgba(220,80,140,0.18)]"
          />
          {step === "login" && (
            <h2 className="text-berry font-bold text-sm tracking-[0.2em] uppercase mt-2">
              Entrar na sua conta
            </h2>
          )}
          {step === "forgot_request" && (
            <h2 className="text-berry font-bold text-sm tracking-[0.2em] uppercase mt-2">
              Recuperar Senha
            </h2>
          )}
          {step === "forgot_verify" && (
            <h2 className="text-berry font-bold text-sm tracking-[0.2em] uppercase mt-2">
              Link Enviado
            </h2>
          )}
          {step === "forgot_reset" && (
            <h2 className="text-berry font-bold text-sm tracking-[0.2em] uppercase mt-2">
              Nova Senha
            </h2>
          )}
        </header>

        {error && (
          <div className="w-full p-3 mb-4 rounded-xl bg-red-100 border border-red-200 text-red-700 text-xs flex items-center justify-center gap-1.5 font-medium animate-in slide-in-from-top-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: LOGIN */}
        {step === "login" && (
          <form
            onSubmit={handleLogin}
            className="w-full flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300"
          >
            <div>
              <label className="block text-[11px] font-bold text-berry uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl border border-rose-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white/70"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-berry uppercase tracking-wider mb-1.5">
                PIN (Senha)
              </label>
              <PasswordField
                placeholder="Digite seu PIN de 4 dígitos ou senha"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                inputClassName="w-full p-3 rounded-xl border border-rose-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white/70"
                required
              />
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("forgot_request");
                }}
                className="text-[11px] font-medium text-primary hover:underline mt-1.5 block ml-auto"
              >
                Esqueceu o PIN?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl text-xs font-bold text-white shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98] mt-2 cursor-pointer"
              style={{ background: "var(--gradient-berry)" }}
            >
              {loading ? (
                "Entrando..."
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  Entrar <Heart size={14} fill="currentColor" />
                </span>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: REQUEST OTP */}
        {step === "forgot_request" && (
          <form
            onSubmit={handleRequestOtp}
            className="w-full flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300"
          >
            <p className="text-xs text-berry/80 text-center px-2 mb-2 leading-relaxed">
              Vamos enviar um link de recuperação seguro para o seu e-mail. Ao clicar no link, você
              poderá criar uma nova senha.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-berry uppercase tracking-wider mb-1.5">
                E-mail cadastrado
              </label>
              <input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl border border-rose-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white/70"
                required
              />
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl text-xs font-bold text-white shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                style={{ background: "var(--gradient-berry)" }}
              >
                <Mail size={14} />
                {loading ? "Enviando..." : "Enviar Código"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep("login");
                }}
                className="w-full py-2.5 rounded-2xl text-xs font-bold text-berry/70 hover:bg-berry/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} /> Voltar para o Login
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: VERIFY OTP (Now Magic Link Sent state) */}
        {step === "forgot_verify" && (
          <div className="w-full flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300 items-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-[var(--shadow-soft)] mb-2"
              style={{ background: "var(--gradient-berry)" }}
            >
              <Mail size={30} className="text-white" />
            </div>
            <p className="text-xs text-berry/80 text-center px-2 leading-relaxed">
              Enviamos um link de recuperação para <strong>{email}</strong>.
            </p>
            <p className="text-[11px] text-berry/70 text-center px-4 mb-2">
              Abra seu e-mail e clique no link para redefinir sua senha. Caso não encontre,
              verifique a caixa de spam.
            </p>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep("forgot_request");
              }}
              className="w-full py-2.5 rounded-2xl text-xs font-bold text-berry/70 hover:bg-berry/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              Tentar outro e-mail
            </button>
          </div>
        )}

        {/* STEP 4: DEFINE NEW PASSWORD */}
        {step === "forgot_reset" && (
          <form
            onSubmit={handleResetPassword}
            className="w-full flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300"
          >
            <div className="bg-primary/10 p-3 rounded-xl flex items-start gap-2 border border-primary/20 mb-2">
              <CheckCircle2 size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-primary font-medium leading-relaxed">
                Acesso confirmado! Agora defina a sua nova senha ou PIN para acessar futuramente.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-berry uppercase tracking-wider mb-1.5">
                Novo PIN ou Senha
              </label>
              <PasswordField
                placeholder="Digite a nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                inputClassName="w-full p-3 rounded-xl border border-rose-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white/70"
                required
                minLength={4}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl text-xs font-bold text-white shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2 cursor-pointer"
              style={{ background: "var(--gradient-berry)" }}
            >
              <KeyRound size={14} />
              {loading ? "Salvando..." : "Salvar Nova Senha"}
            </button>
          </form>
        )}

        {/* SUCCESS */}
        {step === "success" && (
          <div className="w-full py-10 flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-500 mb-2">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-berry font-bold text-lg">Senha alterada!</h3>
            <p className="text-xs text-berry/70 text-center">
              Você será redirecionada para o seu álbum em instantes...
            </p>
          </div>
        )}

        {step === "login" && (
          <footer className="mt-8 text-center">
            <p className="text-xs text-berry/70">
              Ainda não tem uma conta?{" "}
              <Link
                to="/clubedascolecionadoras/signup"
                search={{ redirect: search.redirect }}
                className="font-bold text-primary hover:underline"
              >
                Cadastre-se aqui
              </Link>
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}
