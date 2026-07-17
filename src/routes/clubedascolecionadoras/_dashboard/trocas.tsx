import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { Coins, Repeat2, UsersRound } from "lucide-react";
import { useMemo } from "react";
import { useUI } from "@/components/UIProvider";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/trocas")({
  component: TrocasPage,
});

function TrocasPage() {
  const parentData = useLoaderData({ from: "/clubedascolecionadoras/_dashboard" });
  const ui = useUI();

  const duplicates = useMemo(() => {
    return parentData.userStickers
      .filter((item) => item.copies > 1 && !item.is_rare)
      .map((item) => {
        const sticker = parentData.stickers.find((s) => s.number === item.sticker_number);
        return {
          number: item.sticker_number,
          copies: item.copies - 1,
          name: sticker?.name || `Figurinha ${item.sticker_number}`,
          cover: sticker?.cover_url ? `/covers/${sticker.cover_url}` : "/verso-card.png",
        };
      });
  }, [parentData.stickers, parentData.userStickers]);

  return (
    <main className="screen trade-screen">
      <h1 className="section-title">Trocas</h1>
      <p className="section-sub">Gerencie suas repetidas comuns sem sistema de doacao.</p>

      <section className="trade-actions">
        <article className="trade-action-card">
          <Coins size={22} />
          <div>
            <b>Trocar por pontos</b>
            <span>Converta repetidas em creditos para novos pacotes.</span>
          </div>
          <button type="button" className="btn muted" onClick={() => ui.toast("Fluxo de creditos sera conectado ao banco V2.")}>
            Usar
          </button>
        </article>
        <article className="trade-action-card">
          <UsersRound size={22} />
          <div>
            <b>Trocar com usuaria</b>
            <span>Uma figurinha sai e outra entra nas duas contas ao mesmo tempo.</span>
          </div>
          <button type="button" className="btn muted" onClick={() => ui.toast("Troca entre usuarias sera liberada na camada V2.")}>
            Criar
          </button>
        </article>
      </section>

      <section className="surface-card trade-list-card">
        <div className="trade-list-head">
          <div>
            <h2>Figurinhas repetidas</h2>
            <p>Raras e figurinhas coladas nao entram em trocas.</p>
          </div>
          <Repeat2 size={20} />
        </div>

        {duplicates.length === 0 ? (
          <div className="trade-empty">
            <img src="/icons/repetidas.png" alt="" />
            <p>Voce ainda nao tem repetidas comuns disponiveis.</p>
          </div>
        ) : (
          <div className="trade-duplicates-grid">
            {duplicates.map((item) => (
              <article className="trade-duplicate-card" key={item.number}>
                <img src={item.cover} alt={item.name} />
                <b>{item.number}</b>
                <span>{item.copies} disponivel</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
