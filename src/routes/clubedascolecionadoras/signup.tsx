import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { signupAction } from "../../lib/actions";
import { z } from "zod";
import { AlertCircle, Heart, Mail, CheckCircle2 } from "lucide-react";
import PasswordField from "../../components/PasswordField";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/clubedascolecionadoras/signup")({
  ssr: false,
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    // If already logged in, redirect to index or redirect param
    const user = await import("../../lib/db").then((m) => m.dbService.getCurrentUser());
    if (user) {
      throw redirect({ to: search.redirect || "/clubedascolecionadoras" });
    }
  },
  component: SignupComponent,
});

function SignupComponent() {
  const router = useRouter();
  const search = Route.useSearch();
  const [nick, setNick] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [muralOptIn, setMuralOptIn] = useState(true);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nick || !email || !pin) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const isNumeric = /^\d+$/.test(pin);
    if (isNumeric) {
      if (pin.length < 4) {
        setError("O PIN deve ter no mínimo 4 números.");
        return;
      }
      // Check for same digit repeated 4+ times (e.g. 1111)
      let hasRepetition = false;
      for (let i = 0; i <= pin.length - 4; i++) {
        if (pin[i] === pin[i + 1] && pin[i] === pin[i + 2] && pin[i] === pin[i + 3]) {
          hasRepetition = true;
          break;
        }
      }
      if (hasRepetition) {
        setError("O PIN não pode ter mais de 3 repetições sequenciais (ex: 1111).");
        return;
      }

      // Check for sequential numbers (ascending or descending)
      let hasSequence = false;
      for (let i = 0; i <= pin.length - 4; i++) {
        const d1 = parseInt(pin[i]);
        const d2 = parseInt(pin[i + 1]);
        const d3 = parseInt(pin[i + 2]);
        const d4 = parseInt(pin[i + 3]);
        if (
          (d2 === d1 + 1 && d3 === d2 + 1 && d4 === d3 + 1) ||
          (d2 === d1 - 1 && d3 === d2 - 1 && d4 === d3 - 1)
        ) {
          hasSequence = true;
          break;
        }
      }
      if (hasSequence) {
        setError("O PIN não pode ser uma sequência numérica (ex: 1234).");
        return;
      }
    } else {
      if (pin.length < 6) {
        setError("A senha deve ter no mínimo 6 caracteres.");
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const res = await signupAction(nick, email, pin, muralOptIn);
      if (res.success) {
        setRegisteredEmail(email);
        setSignupSuccess(true);
      } else {
        const errorMsg =
          typeof res.message === "object" ? JSON.stringify(res.message) : res.message;
        setError(errorMsg || "Erro ao criar conta. Tente novamente.");
      }
    } catch (err: any) {
      const errorMsg =
        err && typeof err.message === "string"
          ? err.message
          : "Erro ao tentar cadastrar. Tente novamente.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="mx-auto w-full max-w-[460px] min-h-[100svh] flex flex-col justify-center px-6 py-8 relative overflow-x-hidden bg-rose-soft/20">
        <span className="absolute top-20 right-10 text-primary opacity-30 select-none pointer-events-none text-2xl">
          ✦
        </span>
        <span className="absolute bottom-24 left-12 text-primary opacity-30 select-none pointer-events-none text-3xl">
          ✦
        </span>

        <div className="surface-card p-8 shadow-[var(--shadow-soft)] flex flex-col items-center text-center gap-5">
          <img
            src="/logo_text.png"
            alt="Clube das Colecionadoras"
            className="w-36 mx-auto drop-shadow-[0_4px_10px_rgba(220,80,140,0.18)]"
          />

          {/* Icon */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-[var(--shadow-soft)]"
            style={{ background: "var(--gradient-berry)" }}
          >
            <Mail size={30} className="text-white" />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-berry font-bold text-lg tracking-tight">Confirme seu e-mail ✨</h2>
            <p className="text-berry/70 text-xs mt-1 leading-relaxed">
              Enviamos um link de confirmação para:
            </p>
            <p className="text-primary font-bold text-sm mt-0.5 break-all">{registeredEmail}</p>
          </div>

          {/* Steps */}
          <div className="w-full bg-rose-soft/30 rounded-2xl p-4 text-left flex flex-col gap-3">
            {[
              "Abra seu e-mail e procure a mensagem do Clube das Colecionadoras",
              "Clique no link de confirmação para ativar sua conta",
              "Volte aqui e faça login para começar a colecionar!",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5"
                  style={{ background: "var(--gradient-berry)" }}
                >
                  {i + 1}
                </div>
                <p className="text-xs text-berry/80 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className="w-full flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <CheckCircle2 size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Não encontrou? Verifique sua pasta de <b>spam</b> ou lixo eletrônico.
            </p>
          </div>

          {/* Back to login */}
          <Link
            to="/clubedascolecionadoras/login"
            className="w-full py-3 rounded-2xl text-xs font-bold text-white shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98] flex items-center justify-center gap-1.5"
            style={{ background: "var(--gradient-berry)" }}
          >
            Ir para o Login <Heart size={13} fill="currentColor" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[460px] min-h-[100svh] flex flex-col justify-center px-6 py-8 relative overflow-x-hidden bg-rose-soft/20">
      {/* Decorative Sparkles */}
      <span className="absolute top-20 right-0 z-10 text-primary text-5xl animate-pulse select-none pointer-events-none">
        ✦
      </span>
      <span className="absolute bottom-24 left-12 text-primary text-3xl animate-sparkle-delayed select-none pointer-events-none">
        ✦
      </span>

      <div className="surface-card p-6 shadow-[var(--shadow-soft)] flex flex-col items-center">
        <header className="text-center mb-8">
          <img
            src="/logo_text.png"
            alt="Clube das Colecionadoras"
            className="w-48 mx-auto mb-2 drop-shadow-[0_4px_10px_rgba(220,80,140,0.18)]"
          />
          <h2 className="text-berry font-bold text-sm tracking-[0.2em] uppercase mt-2">
            Criar sua conta
          </h2>
        </header>

        {error && (
          <div className="w-full p-3 mb-4 rounded-xl bg-red-100 border border-red-200 text-red-700 text-xs flex items-center justify-center gap-1.5 font-medium">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-bold text-berry uppercase tracking-wider mb-1.5">
              Apelido (Nick)
            </label>
            <input
              type="text"
              placeholder="Ex: LeitoraSafica"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              className="w-full p-3 rounded-xl border border-rose-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white/70"
              maxLength={20}
              required
            />
          </div>

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
              PIN ou Senha
            </label>
            <PasswordField
              placeholder="Digite seu PIN ou senha"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputClassName="w-full p-3 rounded-xl border border-rose-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white/70"
              required
            />
            <div className="mt-2 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium leading-relaxed text-emerald-700">
              <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
              <span>
                Sua senha fica protegida com segurança. Use um PIN ou senha que seja fácil para você
                lembrar e difícil para outras pessoas adivinharem.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 mt-1">
            <input
              id="mural-opt"
              type="checkbox"
              checked={muralOptIn}
              onChange={(e) => setMuralOptIn(e.target.checked)}
              className="mt-1 size-4 rounded text-primary focus:ring-primary accent-primary"
            />
            <label
              htmlFor="mural-opt"
              className="text-xs text-berry/80 leading-normal font-medium cursor-pointer"
            >
              Quero participar do <b>Mural das Colecionadoras</b> (mostra seu progresso para outros
              usuários).
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl text-xs font-bold text-white shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98] mt-2 cursor-pointer"
            style={{ background: "var(--gradient-berry)" }}
          >
            {loading ? (
              "Criando..."
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Criar Conta e Jogar <Heart size={14} fill="currentColor" />
              </span>
            )}
          </button>
        </form>

        <footer className="mt-8 text-center">
          <p className="text-xs text-berry/70">
            Já tem uma conta?{" "}
            <Link
              to="/clubedascolecionadoras/login"
              search={{ redirect: search.redirect }}
              className="font-bold text-primary hover:underline"
            >
              Entre aqui
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
