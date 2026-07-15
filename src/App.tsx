import {
  BadgeCheck,
  BookOpen,
  Check,
  CreditCard,
  Gift,
  Heart,
  History,
  Lock,
  LogIn,
  PackageOpen,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { demoDuplicates, demoPacks } from "./mockData";
import { isSupabaseConfigured } from "./supabase";
import type { AccessStatus, StickerPack } from "./types";

type Page = "home" | "album" | "pacotes" | "repetidas" | "trocas" | "raras";

const V1_END_DATE = "24/07/2026";

const navItems: Array<{ page: Page; label: string; icon: string }> = [
  { page: "home", label: "home", icon: "/icons/home.png" },
  { page: "album", label: "album", icon: "/icons/album.png" },
  { page: "pacotes", label: "pacotes", icon: "/icons/ticket.png" },
  { page: "repetidas", label: "repetidas", icon: "/icons/repetidas.png" },
  { page: "trocas", label: "trocas", icon: "/icons/codigos.png" },
  { page: "raras", label: "raras", icon: "/icons/star.png" },
];

export function App() {
  const [page, setPage] = useState<Page>("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [access, setAccess] = useState<AccessStatus>("none");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentEmail, setPaymentEmail] = useState("");
  const [migrationClaimed, setMigrationClaimed] = useState(false);
  const [packs, setPacks] = useState(demoPacks);
  const [selectedPack, setSelectedPack] = useState<StickerPack | null>(null);

  const readyPacks = useMemo(() => packs.filter((pack) => pack.status === "ready_to_open"), [packs]);
  const openedPacks = useMemo(() => packs.filter((pack) => pack.status === "opened"), [packs]);
  const isV2 = isLoggedIn && access === "v2";

  const unlockV2 = () => {
    if (!paymentEmail.includes("@")) return;
    setIsLoggedIn(true);
    setAccess("v2");
    setPage("home");
  };

  const markPackOpened = (packId: string) => {
    setPacks((current) =>
      current.map((pack) => (pack.id === packId ? { ...pack, status: "opened" } : pack)),
    );
    setSelectedPack(null);
  };

  const renderPage = () => {
    if (!isV2) {
      return (
        <GatewayPage
          isLoggedIn={isLoggedIn}
          access={access}
          termsAccepted={termsAccepted}
          paymentEmail={paymentEmail}
          setTermsAccepted={setTermsAccepted}
          setIsLoggedIn={setIsLoggedIn}
          setAccess={setAccess}
          setPaymentEmail={setPaymentEmail}
          unlockV2={unlockV2}
        />
      );
    }

    if (page === "album") return <AlbumPage />;
    if (page === "pacotes") {
      return (
        <PacksPage
          readyPacks={readyPacks}
          openedPacks={openedPacks}
          setSelectedPack={setSelectedPack}
        />
      );
    }
    if (page === "repetidas") return <DuplicatesPage />;
    if (page === "trocas") return <TradesPage />;
    if (page === "raras") return <RareStorePage />;

    return (
      <HomePage
        migrationClaimed={migrationClaimed}
        setMigrationClaimed={setMigrationClaimed}
        readyPacks={readyPacks}
        setPage={setPage}
      />
    );
  };

  return (
    <div id="app" className="club-v2-app">
      <TopBar isLoggedIn={isLoggedIn} access={access} />
      {renderPage()}

      {isV2 && <Navigation page={page} setPage={setPage} />}

      {!isSupabaseConfigured && (
        <div className="screen">
          <div className="notice-card">
            <ShieldCheck size={18} />
            <span>
              Supabase configurado parcialmente. A URL ja esta salva; a anon key foi adicionada no
              ambiente local.
            </span>
          </div>
        </div>
      )}

      {selectedPack && (
        <PackModal
          pack={selectedPack}
          onClose={() => setSelectedPack(null)}
          onConfirm={() => markPackOpened(selectedPack.id)}
        />
      )}
    </div>
  );
}

function TopBar({ isLoggedIn, access }: { isLoggedIn: boolean; access: AccessStatus }) {
  const label = !isLoggedIn ? "login" : access === "v2" ? "V2 ativa" : "V1";

  return (
    <header className="topbar">
      <img src="/logo_text.png" alt="Clube das Colecionadoras" className="topbar-logo" />
      <div className="sp" />
      <div className="mini-stat">
        {label}
        <small>album 2.0</small>
      </div>
    </header>
  );
}

function GatewayPage({
  isLoggedIn,
  access,
  termsAccepted,
  paymentEmail,
  setTermsAccepted,
  setIsLoggedIn,
  setAccess,
  setPaymentEmail,
  unlockV2,
}: {
  isLoggedIn: boolean;
  access: AccessStatus;
  termsAccepted: boolean;
  paymentEmail: string;
  setTermsAccepted: (value: boolean) => void;
  setIsLoggedIn: (value: boolean) => void;
  setAccess: (value: AccessStatus) => void;
  setPaymentEmail: (value: string) => void;
  unlockV2: () => void;
}) {
  return (
    <main className="screen">
      <section className="hero-card">
        <div className="hero-badge">2.0</div>
        <h1 className="section-title">Clube das Colecionadoras</h1>
        <p className="section-sub">mesmo link, novo album com 300 figurinhas</p>
        <div className="hero-pack">
          <img src="/frames/1.png" alt="Pacote de figurinhas" />
        </div>
      </section>

      <section className="progress-card">
        <div className="pc-layout">
          <div className="pc-left">
            <div className="avatar">
              <UserRound size={30} />
              <span className="heart">
                <Heart size={13} fill="currentColor" />
              </span>
            </div>
          </div>
          <div className="pc-right">
            <div className="pc-name">gateway inteligente</div>
            <div className="pc-count">
              {!isLoggedIn
                ? "Aguardando login"
                : access === "v2"
                  ? "Direciona para V2"
                  : "Mostra V1 + upgrade"}
            </div>
            <div className="pc-progress-row">
              <div className="bar">
                <i style={{ width: isLoggedIn ? "66%" : "28%" }} />
              </div>
              <span className="bar-pct">{isLoggedIn ? "ok" : "login"}</span>
            </div>
            <div className="status-tag">
              <Sparkles size={13} fill="currentColor" /> V1 encerra em {V1_END_DATE}
            </div>
          </div>
        </div>
      </section>

      <section className="set-block">
        <div className="set-head">
          <LogIn size={19} />
          <div>
            <b>Entrada unica</b>
            <span>lendosaficos.com.br/clubedascolecionadoras</span>
          </div>
        </div>

        <label className="terms-row">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
          />
          <span>
            Li e aceito os <a href="#termos">termos de uso e regras gerais</a>.
          </span>
        </label>

        <div className="two-actions">
          <button
            className="btn ghost"
            disabled={!termsAccepted}
            onClick={() => {
              setIsLoggedIn(true);
              setAccess("v1");
            }}
          >
            Entrar V1
          </button>
          <button
            className="btn"
            disabled={!termsAccepted}
            onClick={() => {
              setIsLoggedIn(true);
              setAccess("v2");
            }}
          >
            Simular V2
          </button>
        </div>
      </section>

      <section className="set-block">
        <div className="set-head">
          <CreditCard size={19} />
          <div>
            <b>Verificar pagamento</b>
            <span>use o email informado no Mercado Pago</span>
          </div>
        </div>
        <input
          className="club-input"
          type="email"
          value={paymentEmail}
          onChange={(event) => setPaymentEmail(event.target.value)}
          placeholder="seuemail@exemplo.com"
        />
        <button className="btn" onClick={unlockV2}>
          Liberar acesso aprovado
        </button>
      </section>
    </main>
  );
}

function HomePage({
  migrationClaimed,
  setMigrationClaimed,
  readyPacks,
  setPage,
}: {
  migrationClaimed: boolean;
  setMigrationClaimed: (value: boolean) => void;
  readyPacks: StickerPack[];
  setPage: (page: Page) => void;
}) {
  return (
    <main className="screen">
      <h1 className="section-title">Album 2.0</h1>
      <p className="section-sub">continue da V1 e avance ate 300 figurinhas</p>

      <section className="progress-card">
        <div className="pc-layout">
          <div className="pc-left">
            <div className="avatar">
              CG
              <span className="heart">
                <Heart size={13} fill="currentColor" />
              </span>
            </div>
          </div>
          <div className="pc-right">
            <div className="pc-name">colecionadora</div>
            <div className="pc-count">118 de 300 figurinhas</div>
            <div className="pc-progress-row">
              <div className="bar">
                <i style={{ width: "39%" }} />
              </div>
              <span className="bar-pct">39%</span>
            </div>
            <div className="status-tag">
              <Star size={13} fill="currentColor" /> 42 creditos disponiveis
            </div>
          </div>
        </div>
      </section>

      <section className="stat-circles">
        <Metric label="pacotes" value={String(readyPacks.length)} />
        <Metric label="raras" value="3/20" />
        <Metric label="repetidas" value="7" />
      </section>

      <section className="set-block">
        <div className="set-head">
          <BadgeCheck size={19} />
          <div>
            <b>Resgate V1</b>
            <span>coladas entram na V2, repetidas viram creditos</span>
          </div>
        </div>
        <button
          className={migrationClaimed ? "btn soft" : "btn"}
          disabled={migrationClaimed}
          onClick={() => setMigrationClaimed(true)}
        >
          {migrationClaimed ? "Progresso resgatado" : "Resgatar progresso da V1"}
        </button>
      </section>

      <section className="set-block">
        <div className="set-head">
          <PackageOpen size={19} />
          <div>
            <b>Pacotes seguros</b>
            <span>o backend registra tudo antes da animacao</span>
          </div>
        </div>
        <button className="btn ghost" onClick={() => setPage("pacotes")}>
          Ver meus pacotes
        </button>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-c">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function AlbumPage() {
  const owned = new Set([1, 2, 3, 4, 5, 14, 18, 53, 77, 108, 112, 144, 155, 188, 203, 231, 287]);

  return (
    <main className="screen">
      <h1 className="section-title">Meu album</h1>
      <p className="section-sub">V1 1-100 + novas figurinhas 101-300</p>
      <div className="filters">
        <button className="chip active">todas <b>300</b></button>
        <button className="chip">V1 <b>100</b></button>
        <button className="chip">V2 <b>200</b></button>
        <button className="chip">raras <b>20</b></button>
      </div>
      <div className="album">
        {Array.from({ length: 24 }, (_, index) => {
          const number = index < 12 ? index + 1 : 100 + index - 11;
          const hasSticker = owned.has(number);
          return (
            <div className={hasSticker ? "cell new" : "cell locked"} key={number}>
              {hasSticker ? (
                <div className="ph">#{String(number).padStart(3, "0")}</div>
              ) : (
                <img src="/verso-card.png" alt={`Figurinha ${number}`} />
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}

function PacksPage({
  readyPacks,
  openedPacks,
  setSelectedPack,
}: {
  readyPacks: StickerPack[];
  openedPacks: StickerPack[];
  setSelectedPack: (pack: StickerPack) => void;
}) {
  return (
    <main className="screen">
      <h1 className="section-title">Meus pacotes</h1>
      <p className="section-sub">historico preservado mesmo se a animacao falhar</p>
      <PackList title="Pacotes para abrir" packs={readyPacks} action="Abrir" onSelect={setSelectedPack} />
      <PackList title="Historico de pacotes" packs={openedPacks} action="Ver" onSelect={setSelectedPack} />
    </main>
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
    <section className="set-block">
      <div className="grid-head">
        <h3>{title}</h3>
        <span className="tag">{packs.length}</span>
      </div>
      {packs.length === 0 ? (
        <p className="empty">Nenhum pacote aqui.</p>
      ) : (
        packs.map((pack) => (
          <button key={pack.id} className="mission" onClick={() => onSelect(pack)}>
            <div className="ic">
              <PackageOpen size={22} />
            </div>
            <div className="t">
              <b>{pack.title}</b>
              <span>{pack.items.length} figurinhas ja registradas</span>
            </div>
            <em>{action}</em>
          </button>
        ))
      )}
    </section>
  );
}

function DuplicatesPage() {
  return (
    <main className="screen">
      <h1 className="section-title">Repetidas</h1>
      <p className="section-sub">somente sobras podem virar credito ou troca</p>
      <div className="duplicates-grid">
        {demoDuplicates.map((item) => (
          <section className="duplicate-card" key={item.number}>
            <div className="duplicate-card-thumb">
              <div className="cell">
                <div className="ph">#{String(item.number).padStart(3, "0")}</div>
              </div>
            </div>
            <div className="duplicate-card-info">
              <b>{item.name}</b>
              <span>{item.copies} repetidas disponiveis</span>
            </div>
            <button className="btn sm duplicate-card-button">Converter em creditos</button>
          </section>
        ))}
      </div>
    </main>
  );
}

function TradesPage() {
  return (
    <main className="screen">
      <h1 className="section-title">Trocas</h1>
      <p className="section-sub">uma sai e outra entra simultaneamente</p>
      <section className="set-block">
        <div className="set-head">
          <Gift size={19} />
          <div>
            <b>Nova troca</b>
            <span>raras e figurinhas coladas nao aparecem aqui</span>
          </div>
        </div>
        <div className="trade-rule"><Check size={15} /> usa apenas repetidas</div>
        <div className="trade-rule"><Check size={15} /> executa em transacao no banco</div>
        <div className="trade-rule"><Check size={15} /> nao permite troca de rara</div>
        <button className="btn">Criar oferta de troca</button>
      </section>
    </main>
  );
}

function RareStorePage() {
  return (
    <main className="screen">
      <h1 className="section-title">Raras</h1>
      <p className="section-sub">20 figurinhas vendidas separadamente</p>
      {[287, 291, 294].map((number, index) => (
        <section className="rare-row" key={number}>
          <div className="rare-thumb">
            <Sparkles size={22} />
          </div>
          <div>
            <b>Rara #{number}</b>
            <span>{index === 0 ? "ja adquirida" : "disponivel para compra"}</span>
          </div>
          <button className="btn sm" disabled={index === 0}>
            {index === 0 ? "Indisponivel" : "Comprar"}
          </button>
        </section>
      ))}
    </main>
  );
}

function Navigation({ page, setPage }: { page: Page; setPage: (page: Page) => void }) {
  return (
    <nav className="club-navigation">
      <div className="club-navigation-inner">
        {navItems.map((item) => {
          const active = item.page === page;
          return (
            <button
              key={item.page}
              className={`club-navigation-item ${active ? "club-navigation-item-active" : ""}`}
              onClick={() => setPage(item.page)}
            >
              <div className="club-navigation-icon">
                <img src={item.icon} alt="" />
              </div>
              <span className={`nav-label ${active ? "nav-label-active" : ""}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
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
    <div className="modal-bg">
      <section className="modal pack-open-modal">
        <div className="pack-stage">
          <img src={pack.status === "ready_to_open" ? "/frames/1.png" : "/frames/9.png"} alt="Pacote" />
        </div>
        <h2>{pack.title}</h2>
        <p className="section-sub">as figurinhas ja foram registradas com seguranca</p>
        <div className="reveal-grid">
          {pack.items.map((item) => (
            <div className={item.isRare ? "reveal-card foil" : "reveal-card"} key={item.number}>
              <span>#{String(item.number).padStart(3, "0")}</span>
              <b>{item.name}</b>
              <small>{item.isRare ? "rara" : item.isNew ? "nova" : "repetida"}</small>
            </div>
          ))}
        </div>
        <div className="two-actions">
          <button className="btn ghost" onClick={onClose}>
            Fechar
          </button>
          {pack.status === "ready_to_open" && (
            <button className="btn" onClick={onConfirm}>
              Marcar como visto
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
