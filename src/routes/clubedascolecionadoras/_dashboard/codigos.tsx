import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useUI } from "../../../components/UIProvider";
import { redeemCodeAction, redeemDonationAction } from "../../../lib/actions";
import { Ticket, Gift, Clock, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/codigos")({
  component: DashboardCodigos,
});

function DashboardCodigos() {
  const ui = useUI();
  const router = useRouter();

  // Promo Code State
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Donation Code State
  const [donationCode, setDonationCode] = useState("");
  const [donationLoading, setDonationLoading] = useState(false);
  const [donationError, setDonationError] = useState<string | null>(null);

  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await redeemCodeAction(promoCode);
      if (res.success && res.data) {
        setPromoCode("");
        ui.triggerHearts();

        // Show reveals
        if (res.data.reveals && res.data.reveals.length > 0) {
          ui.showReveals(res.data.reveals, "Código resgatado! ✦");
        }

        // Unlocked styling element toast
        if (res.data.element) {
          const names: { [key: string]: string } = {
            lilac: "Tema lilás 💜",
            glitter: "Fundo glitter ✨",
            goldframe: "Molduras douradas 🏵️",
          };
          const name = names[res.data.element] || res.data.element;
          ui.toast(`Estilização liberada: ${name}! Ative em Ajustes.`);
        }

        // The global pack stage refreshes route-backed album data when the
        // reveal is closed. Invalidating here can remount the V2 dashboard
        // before React commits the package modal.
      } else {
        setPromoError(res.message || "Código inválido ou já utilizado.");
      }
    } catch (err) {
      setPromoError("Erro ao processar o código. Tente novamente.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRedeemDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationCode.trim()) return;

    setDonationLoading(true);
    setDonationError(null);
    try {
      const res = await redeemDonationAction(donationCode);
      if (res.success && res.data) {
        setDonationCode("");
        ui.triggerHearts();

        if (res.data.reveals && res.data.reveals.length > 0) {
          ui.showReveals(res.data.reveals, "Doação recebida! 💝");
        }

        router.invalidate();
      } else {
        setDonationError(res.message || "Código de doação inválido, expirado ou já resgatado.");
      }
    } catch (err) {
      setDonationError("Erro ao processar doação. Tente novamente.");
    } finally {
      setDonationLoading(false);
    }
  };

  return (
    <div className="screen">
      <div className="section-title">Resgatar Códigos</div>
      <div className="section-sub">Cole seu código e ganhe figurinhas para o álbum</div>

      <div className="flex flex-col gap-6 mt-6">
        {/* Promotional Codes Card */}
        <div className="surface-card codes-card p-5 relative overflow-hidden">
          {/* Sparkles */}
          <span className="absolute top-3 right-5 text-primary opacity-20 select-none pointer-events-none text-xl">
            ✦
          </span>

          <h3 className="font-bold text-berry text-base mb-1.5 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-berry" /> Códigos do Lendo Sáficos
          </h3>
          <p className="text-xs text-berry/70 mb-4 leading-relaxed">
            Os códigos são liberados pelo LS ao longo dos 5 dias do evento. Cada código pode ser
            usado uma única vez e tem o prazo de 24 horas para resgate. Fique de olho nas redes!
          </p>

          {promoError && (
            <div className="p-3 mb-4 rounded-xl bg-red-100 border border-red-200 text-red-700 text-xs flex items-center justify-center gap-1.5 font-semibold">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{promoError}</span>
            </div>
          )}

          <form onSubmit={handleRedeemPromo} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              placeholder="Digite o código (ex: SAFICAS)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 p-3 rounded-xl border border-rose-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder:text-[10px] placeholder:normal-case bg-white/70 dark:bg-black/20 uppercase font-bold tracking-wider"
              required
            />
            <button
              type="submit"
              disabled={promoLoading}
              className="py-3 px-6 rounded-2xl text-xs font-bold text-white shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98] cursor-pointer"
              style={{ background: "var(--gradient-berry)" }}
            >
              {promoLoading ? "Resgatando..." : "Resgatar Código"}
            </button>
          </form>
        </div>

        {/* Donation Codes Card */}
        <div className="surface-card codes-card p-5 relative overflow-hidden">
          {/* Sparkles */}
          <span className="absolute bottom-4 right-6 text-primary opacity-20 select-none pointer-events-none text-xl">
            ✦
          </span>

          <h3 className="font-bold text-berry text-base mb-1.5 flex items-center gap-2">
            <Gift className="w-5 h-5 text-berry" /> Resgatar Figurinha Doada
          </h3>
          <p className="text-xs text-berry/70 mb-4">
            Recebeu um código de doação de outra colecionadora? Cole o código de 8 caracteres abaixo para resgatar.
          </p>

          {donationError && (
            <div className="p-3 mb-4 rounded-xl bg-red-100 border border-red-200 text-red-700 text-xs flex items-center justify-center gap-1.5 font-semibold">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{donationError}</span>
            </div>
          )}

          <form onSubmit={handleRedeemDonation} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              placeholder="Cole o código da doação (8 caracteres)"
              value={donationCode}
              onChange={(e) => setDonationCode(e.target.value)}
              className="flex-1 p-3 rounded-xl border border-rose-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder:text-[10px] placeholder:normal-case bg-white/70 dark:bg-black/20 uppercase font-bold tracking-wider"
              maxLength={12}
              required
            />
            <button
              type="submit"
              disabled={donationLoading}
              className="py-3 px-6 rounded-2xl text-xs font-bold text-white shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98] cursor-pointer"
              style={{ background: "var(--gradient-berry)" }}
            >
              {donationLoading ? "Processando..." : "Receber figurinha"}
            </button>
          </form>

          <p className="note mt-3.5 text-center leading-relaxed">
            Códigos de doação expiram 24h após serem gerados. Não deixe pra depois!{" "}
            <Clock className="w-3.5 h-3.5 shrink-0 inline-block align-text-bottom text-pink-400" />
          </p>
        </div>
      </div>
    </div>
  );
}
