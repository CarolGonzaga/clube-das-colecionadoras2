import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/clubedascolecionadoras/manutencao")({
  ssr: false,
  component: MaintenancePage,
});

function MaintenancePage() {
  return (
    <main className="maintenance-screen">
      <section className="maintenance-card">
        <img
          src="/logo_text.png"
          alt="Clube das Colecionadoras"
          className="maintenance-logo"
        />

        <div className="maintenance-kicker">Atualização em andamento</div>

        <h1>Estamos preparando o novo Clube das Colecionadoras V2</h1>

        <p>
          O álbum está temporariamente indisponível enquanto fazemos a migração para a nova
          versão. Seu progresso, figurinhas, quiz, repetidas e estilos permanecem seguros.
        </p>

        <div className="maintenance-note">
          Assim que a atualização terminar, você poderá acessar pelo mesmo link de sempre.
        </div>
      </section>
    </main>
  );
}
