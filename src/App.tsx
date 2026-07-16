import {
  BadgeCheck,
  BookOpen,
  Check,
  CreditCard,
  Gift,
  Heart,
  LogIn,
  PackageOpen,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { demoDuplicates, demoPacks, demoStoreItems } from "./mockData";
import { isSupabaseConfigured } from "./supabase";
import type { AccessStatus, StickerPack, StoreItem } from "./types";

type Page = "home" | "album" | "pacotes" | "repetidas" | "trocas" | "compras";
type StoreFilter = "all" | "pack" | "common" | "rare";
type PackAnimationState = "idle" | "opening" | "ready" | "revealing" | "complete";

const V1_END_DATE = "24/07/2026";
const TOTAL_FRAMES = 9;
const FRAME_DURATION_MS = 65;

const navItems: Array<{ page: Page; label: string; icon: string }> = [
  { page: "home", label: "home", icon: "/icons/home.png" },
  { page: "album", label: "album", icon: "/icons/album.png" },
  { page: "pacotes", label: "registro", icon: "/icons/registro.png" },
  { page: "repetidas", label: "repetidas", icon: "/icons/repetidas.png" },
  { page: "trocas", label: "trocas", icon: "/icons/codigos.png" },
  { page: "compras", label: "compras", icon: "/icons/shop.png" },
];

class SoundEffects {
  private ctx: AudioContext | null = null;

  private init() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.ctx && AudioCtx) this.ctx = new AudioCtx();
      if (this.ctx?.state === "suspended") this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  playTear() {
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    noise.buffer = buffer;
    filter.type = "bandpass";
    filter.Q.value = 6;
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  playSparkle() {
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    [987.77, 1174.66, 1318.51, 1567.98, 1975.53].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.04);
      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + idx * 0.04 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.04 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.04);
      osc.stop(ctx.currentTime + idx * 0.04 + 0.2);
    });
  }

  playFlip() {
    this.init();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }
}

const sfx = new SoundEffects();

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
    if (page === "compras") return <PurchasePage />;

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
        <PackOpener
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
            <b>Registro de pacotes</b>
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
      <p className="section-sub">registro de compras e abertura com animacao da V1</p>
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

function PurchasePage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StoreFilter>("all");

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return demoStoreItems.filter((item) => {
      const matchesFilter = filter === "all" || item.kind === filter;
      const matchesQuery =
        !normalized ||
        item.name.toLowerCase().includes(normalized) ||
        String(item.number || "").includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  return (
    <main className="screen">
      <h1 className="section-title">Compras</h1>
      <p className="section-sub">pacotes, comuns por creditos e raras individuais</p>

      <section className="set-block">
        <div className="set-head">
          <ShoppingBag size={19} />
          <div>
            <b>Loja V2</b>
            <span>filtre por nome, numero, raras ou comuns</span>
          </div>
        </div>
        <label className="shop-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="buscar por nome ou numero"
          />
        </label>
        <div className="filters">
          <button className={filter === "all" ? "chip active" : "chip"} onClick={() => setFilter("all")}>
            tudo <b>{demoStoreItems.length}</b>
          </button>
          <button className={filter === "pack" ? "chip active" : "chip"} onClick={() => setFilter("pack")}>
            pacotes <b>2</b>
          </button>
          <button
            className={filter === "common" ? "chip active" : "chip"}
            onClick={() => setFilter("common")}
          >
            comuns <b>3</b>
          </button>
          <button className={filter === "rare" ? "chip active" : "chip"} onClick={() => setFilter("rare")}>
            raras <b>3</b>
          </button>
        </div>
      </section>

      {filteredItems.map((item) => (
        <StoreItemRow item={item} key={item.id} />
      ))}
    </main>
  );
}

function StoreItemRow({ item }: { item: StoreItem }) {
  const isRare = item.kind === "rare";
  const isPack = item.kind === "pack";
  return (
    <section className={isRare ? "rare-row" : "shop-row"}>
      <div className={isRare ? "rare-thumb" : "shop-thumb"}>
        {isPack ? <PackageOpen size={22} /> : isRare ? <Sparkles size={22} /> : <BookOpen size={22} />}
      </div>
      <div>
        <b>{item.number ? `#${item.number} · ${item.name}` : item.name}</b>
        <span>
          {isPack
            ? "gera pacote no registro"
            : isRare
              ? item.unavailable
                ? "ja adquirida"
                : "rara individual"
              : "figurinha comum por credito"}
        </span>
      </div>
      <button className="btn sm" disabled={item.unavailable}>
        {item.unavailable ? "Indisponivel" : item.price}
      </button>
    </section>
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

function PackOpener({
  pack,
  onClose,
  onConfirm,
}: {
  pack: StickerPack;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [animState, setAnimState] = useState<PackAnimationState>(
    pack.status === "opened" ? "complete" : "idle",
  );
  const [currentFrame, setCurrentFrame] = useState(1);
  const [revealedCount, setRevealedCount] = useState(pack.status === "opened" ? pack.items.length : 0);

  useEffect(() => {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/frames/${i}.png`;
    }
  }, []);

  const startOpening = () => {
    if (animState !== "idle") return;
    setAnimState("opening");
    setCurrentFrame(1);
    sfx.playFlip();

    let frame = 1;
    const interval = window.setInterval(() => {
      frame++;
      setCurrentFrame(frame);
      if (frame === 2) sfx.playTear();
      if (frame >= TOTAL_FRAMES) {
        window.clearInterval(interval);
        setAnimState("ready");
        sfx.playSparkle();
      }
    }, FRAME_DURATION_MS);
  };

  const revealNext = () => {
    if (animState !== "ready" && animState !== "revealing") return;
    sfx.playFlip();
    setAnimState("revealing");
    setRevealedCount((count) => {
      const next = Math.min(count + 1, pack.items.length);
      if (pack.items[next - 1]?.isRare) window.setTimeout(() => sfx.playSparkle(), 160);
      if (next >= pack.items.length) window.setTimeout(() => setAnimState("complete"), 250);
      return next;
    });
  };

  return (
    <div className="pack-opener-bg">
      <section className="pack-opener">
        <div className="pack-title">
          <h2>{pack.title}</h2>
          <p>som e animacao da abertura original, com itens ja registrados</p>
        </div>

        <div className={animState === "opening" ? "pack-animation-stage opening" : "pack-animation-stage"}>
          <div className={animState !== "idle" ? "pack-glow active" : "pack-glow"} />
          <img
            src={`/frames/${animState === "idle" ? 1 : animState === "complete" ? 9 : currentFrame}.png`}
            alt="Pacote"
            className="pack-frame"
            onClick={startOpening}
          />
          {animState !== "idle" && (
            <div className="reveal-shelf">
              {pack.items.map((item, index) => {
                const isRevealed = index < revealedCount;
                return (
                  <div
                    className={item.isRare && isRevealed ? "mini-reveal rare" : "mini-reveal"}
                    key={item.number}
                  >
                    {isRevealed ? `#${String(item.number).padStart(3, "0")}` : "?"}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {revealedCount > 0 && (
          <div className="active-reveal-card-wrap">
            {pack.items.slice(0, revealedCount).map((item, index) => (
              <div
                className={item.isRare ? "reveal-card foil pop-card" : "reveal-card pop-card"}
                key={`${item.number}-${index}`}
              >
                <span>#{String(item.number).padStart(3, "0")}</span>
                <b>{item.name}</b>
                <small>{item.isRare ? "rara" : item.isNew ? "nova" : "repetida"}</small>
              </div>
            ))}
          </div>
        )}

        <div className="two-actions">
          <button className="btn ghost" onClick={onClose}>
            Fechar
          </button>
          {animState === "idle" && <button className="btn" onClick={startOpening}>Abrir pacote</button>}
          {(animState === "ready" || animState === "revealing") && (
            <button className="btn" onClick={revealNext}>
              {revealedCount === 0 ? "Revelar figurinha" : "Proxima"}
            </button>
          )}
          {animState === "complete" && pack.status === "ready_to_open" && (
            <button className="btn" onClick={onConfirm}>Marcar como visto</button>
          )}
        </div>
      </section>
    </div>
  );
}
