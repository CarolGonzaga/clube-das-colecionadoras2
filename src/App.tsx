import {
  BadgeCheck,
  BookOpen,
  CreditCard,
  Gift,
  History,
  Lock,
  LogIn,
  PackageOpen,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { demoDuplicates, demoPacks } from "./mockData";
import { isSupabaseConfigured } from "./supabase";
import type { AccessStatus, StickerPack } from "./types";

const V1_END_DATE = "24/07/2026";

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [access, setAccess] = useState<AccessStatus>("none");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentEmail, setPaymentEmail] = useState("");
  const [migrationClaimed, setMigrationClaimed] = useState(false);
  const [packs, setPacks] = useState(demoPacks);
  const [selectedPack, setSelectedPack] = useState<StickerPack | null>(null);

  const readyPacks = useMemo(() => packs.filter((pack) => pack.status === "ready_to_open"), [packs]);
  const openedPacks = useMemo(() => packs.filter((pack) => pack.status === "opened"), [packs]);

  const unlockV2 = () => {
    if (!paymentEmail.includes("@")) return;
    setIsLoggedIn(true);
    setAccess("v2");
  };

  const markPackOpened = (packId: string) => {
    setPacks((current) =>
      current.map((pack) => (pack.id === packId ? { ...pack, status: "opened" } : pack)),
    );
    setSelectedPack(null);
  };

  return (
    <main className="app-shell">
      <section className="top-strip">
        <div>
          <p className="eyebrow">Clube das Colecionadoras 2.0</p>
          <h1>Entrada unica, album 1-300 e economia V2 isolada.</h1>
        </div>
        <StatusPill isLoggedIn={isLoggedIn} access={access} />
      </section>

      <section className="gateway-grid">
        <GatewayPanel
          isLoggedIn={isLoggedIn}
          access={access}
          termsAccepted={termsAccepted}
          setIsLoggedIn={setIsLoggedIn}
          setAccess={setAccess}
          setTermsAccepted={setTermsAccepted}
        />

        {isLoggedIn && access === "v2" ? (
          <V2Dashboard
            migrationClaimed={migrationClaimed}
            setMigrationClaimed={setMigrationClaimed}
            readyPacks={readyPacks}
            openedPacks={openedPacks}
            setSelectedPack={setSelectedPack}
          />
        ) : (
          <PurchasePanel
            paymentEmail={paymentEmail}
            setPaymentEmail={setPaymentEmail}
            unlockV2={unlockV2}
          />
        )}
      </section>

      {isLoggedIn && access === "v2" && (
        <section className="work-grid">
          <DuplicatesPanel />
          <TradePanel />
          <RareStorePanel />
        </section>
      )}

      {!isSupabaseConfigured && (
        <section className="notice">
          <ShieldCheck size={18} />
          <span>
            Supabase ainda esta em modo configuracao. Adicione a anon key em <b>.env</b> para
            conectar ao projeto informado.
          </span>
        </section>
      )}

      {selectedPack && (
        <PackModal
          pack={selectedPack}
          onClose={() => setSelectedPack(null)}
          onConfirm={() => markPackOpened(selectedPack.id)}
        />
      )}
    </main>
  );
}

function StatusPill({ isLoggedIn, access }: { isLoggedIn: boolean; access: AccessStatus }) {
  const label = !isLoggedIn ? "Nao logada" : access === "v2" ? "V2 ativa" : "V1 / upgrade";
  return (
    <div className="status-pill">
      <UserRound size={16} />
      {label}
    </div>
  );
}

function GatewayPanel({
  isLoggedIn,
  access,
  termsAccepted,
  setIsLoggedIn,
  setAccess,
  setTermsAccepted,
}: {
  isLoggedIn: boolean;
  access: AccessStatus;
  termsAccepted: boolean;
  setIsLoggedIn: (value: boolean) => void;
  setAccess: (value: AccessStatus) => void;
  setTermsAccepted: (value: boolean) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <LogIn size={20} />
        <div>
          <h2>Gateway /clubedascolecionadoras</h2>
          <p>Simula a decisao automatica entre login, V1 e V2.</p>
        </div>
      </div>

      <label className="check-row">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}
        />
        <span>
          Li e aceito os <a href="#termos">termos de uso e regras gerais</a>.
        </span>
      </label>

      <div className="button-row">
        <button
          className="primary-button"
          disabled={!termsAccepted}
          onClick={() => {
            setIsLoggedIn(true);
            setAccess("v1");
          }}
        >
          Entrar como V1
        </button>
        <button
          className="secondary-button"
          disabled={!termsAccepted}
          onClick={() => {
            setIsLoggedIn(true);
            setAccess("v2");
          }}
        >
          Entrar como pagante V2
        </button>
      </div>

      <div className="flow-box">
        <p>
          <b>Regra futura:</b> apos {V1_END_DATE}, novas contas so entram no fluxo de compra V2.
          A V1 permanece como visita/arquivo para contas antigas.
        </p>
        <p>
          Estado atual: <b>{!isLoggedIn ? "login" : access === "v2" ? "renderV2" : "renderV1_or_Upsell"}</b>
        </p>
      </div>
    </section>
  );
}

function PurchasePanel({
  paymentEmail,
  setPaymentEmail,
  unlockV2,
}: {
  paymentEmail: string;
  setPaymentEmail: (value: string) => void;
  unlockV2: () => void;
}) {
  return (
    <section className="panel accent-panel">
      <div className="panel-header">
        <CreditCard size={20} />
        <div>
          <h2>Compra e verificacao de pagamento</h2>
          <p>Fluxo inicial sem depender de email transacional.</p>
        </div>
      </div>

      <div className="price-box">
        <span>Album completo 2.0</span>
        <strong>300 figurinhas</strong>
      </div>

      <label className="input-group">
        Email usado na compra
        <input
          type="email"
          value={paymentEmail}
          onChange={(event) => setPaymentEmail(event.target.value)}
          placeholder="seuemail@exemplo.com"
        />
      </label>

      <button className="primary-button full" onClick={unlockV2}>
        Verificar pagamento aprovado
      </button>

      <p className="tiny-copy">
        No backend real, o Mercado Pago grava a compra aprovada e esta tela vincula o acesso V2 ao
        mesmo email.
      </p>
    </section>
  );
}

function V2Dashboard({
  migrationClaimed,
  setMigrationClaimed,
  readyPacks,
  openedPacks,
  setSelectedPack,
}: {
  migrationClaimed: boolean;
  setMigrationClaimed: (value: boolean) => void;
  readyPacks: StickerPack[];
  openedPacks: StickerPack[];
  setSelectedPack: (pack: StickerPack) => void;
}) {
  return (
    <section className="panel wide-panel">
      <div className="panel-header">
        <BookOpen size={20} />
        <div>
          <h2>Album V2</h2>
          <p>V1 1-100 + V2 101-300, com inventario proprio.</p>
        </div>
      </div>

      <div className="stats-grid">
        <Metric label="Figurinhas" value="118/300" />
        <Metric label="Creditos" value="42" />
        <Metric label="Raras" value="3/20" />
      </div>

      <div className="migration-box">
        <div>
          <h3>Resgate V1</h3>
          <p>Coladas entram na V2. Repetidas viram creditos. Executa uma unica vez.</p>
        </div>
        <button
          className="secondary-button"
          disabled={migrationClaimed}
          onClick={() => setMigrationClaimed(true)}
        >
          {migrationClaimed ? "Resgate concluido" : "Resgatar progresso"}
        </button>
      </div>

      <div className="pack-columns">
        <PackList title="Pacotes para abrir" packs={readyPacks} action="Abrir" onSelect={setSelectedPack} />
        <PackList title="Historico" packs={openedPacks} action="Ver" onSelect={setSelectedPack} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PackList({
  title,
  packs,
  action,
  onSelect,
}: {
  title: string;
  packs: StickerPack[];
  action: string;
  onSelect: (pack: StickerPack) => void;
}) {
  return (
    <div className="pack-list">
      <h3>{title}</h3>
      {packs.length === 0 ? (
        <p className="empty-state">Nenhum pacote aqui.</p>
      ) : (
        packs.map((pack) => (
          <button key={pack.id} className="pack-row" onClick={() => onSelect(pack)}>
            <PackageOpen size={18} />
            <span>
              <b>{pack.title}</b>
              <small>{pack.items.length} figurinhas registradas</small>
            </span>
            <em>{action}</em>
          </button>
        ))
      )}
    </div>
  );
}

function DuplicatesPanel() {
  return (
    <section className="panel compact">
      <div className="panel-header">
        <RefreshCcw size={20} />
        <div>
          <h2>Repetidas</h2>
          <p>Somente sobras podem virar troca ou credito.</p>
        </div>
      </div>

      {demoDuplicates.map((item) => (
        <div className="duplicate-row" key={item.number}>
          <span>#{String(item.number).padStart(3, "0")}</span>
          <b>{item.name}</b>
          <em>{item.copies}x</em>
        </div>
      ))}
    </section>
  );
}

function TradePanel() {
  return (
    <section className="panel compact">
      <div className="panel-header">
        <Gift size={20} />
        <div>
          <h2>Trocas</h2>
          <p>Uma figurinha sai e outra entra simultaneamente.</p>
        </div>
      </div>

      <div className="rule-list">
        <span>Raras nao entram em troca.</span>
        <span>Coladas nao saem do album.</span>
        <span>A troca real sera uma RPC transacional.</span>
      </div>
    </section>
  );
}

function RareStorePanel() {
  return (
    <section className="panel compact">
      <div className="panel-header">
        <Lock size={20} />
        <div>
          <h2>Raras</h2>
          <p>Compra separada, no maximo uma por usuaria.</p>
        </div>
      </div>

      <div className="rare-card">
        <Sparkles size={22} />
        <span>Rara #287</span>
        <button disabled>Ja adquirida</button>
      </div>
      <div className="rare-card">
        <Sparkles size={22} />
        <span>Rara #291</span>
        <button>Comprar</button>
      </div>
    </section>
  );
}

function PackModal({
  pack,
  onClose,
  onConfirm,
}: {
  pack: StickerPack;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="pack-modal">
        <div className="panel-header">
          <BadgeCheck size={22} />
          <div>
            <h2>{pack.title}</h2>
            <p>Itens ja registrados no backend antes da animacao.</p>
          </div>
        </div>

        <div className="sticker-reveal-grid">
          {pack.items.map((item) => (
            <div className={item.isRare ? "sticker-card rare" : "sticker-card"} key={item.number}>
              <span>#{String(item.number).padStart(3, "0")}</span>
              <b>{item.name}</b>
              <small>{item.isRare ? "Rara" : item.isNew ? "Nova" : "Repetida"}</small>
            </div>
          ))}
        </div>

        <div className="button-row right">
          <button className="secondary-button" onClick={onClose}>
            Fechar
          </button>
          {pack.status === "ready_to_open" && (
            <button className="primary-button" onClick={onConfirm}>
              Marcar como visto
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
