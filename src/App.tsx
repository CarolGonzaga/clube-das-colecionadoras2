import {
  BookOpen,
  Check,
  Copy,
  CreditCard,
  Gift,
  Heart,
  Image as ImageIcon,
  LogIn,
  PackageOpen,
  Search,
  Settings,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { demoDuplicates, demoPacks, demoStoreItems } from "./mockData";
import type { AccessStatus, StickerPack, StoreItem } from "./types";

type Page = "home" | "album" | "pacotes" | "troca" | "compras" | "config";
type StoreFilter = "all" | "pack" | "common" | "rare";
type PackAnimationState = "idle" | "opening" | "ready" | "revealing" | "complete";

const V1_END_DATE = "24/07/2026";
const TOTAL_FRAMES = 9;
const FRAME_DURATION_MS = 65;

const navItems: Array<{ page: Page; label: string; icon: string }> = [
  { page: "home", label: "home", icon: "/icons/home.png" },
  { page: "album", label: "album", icon: "/icons/album.png" },
  { page: "pacotes", label: "registro", icon: "/icons/registro.png" },
  { page: "troca", label: "troca", icon: "/icons/repetidas.png" },
  { page: "compras", label: "compras", icon: "/icons/shop.png" },
  { page: "config", label: "ajustes", icon: "/icons/config.png" },
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
    if (page === "troca") return <ExchangePage />;
    if (page === "compras") return <PurchasePage />;
    if (page === "config") return <ConfigPage />;

    return (
      <HomePage
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
  const label = !isLoggedIn ? "login" : "acesso";

  return (
    <header className="topbar">
      <img src="/logo_text.png" alt="Clube das Colecionadoras" className="topbar-logo" />
      <div className="sp" />
      <div className="mini-stat">
        {label}
        <small>album</small>
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
        <div className="hero-badge">300</div>
        <h1 className="section-title">Clube das Colecionadoras</h1>
        <p className="section-sub">colecione, compre pacotes e complete seu album</p>
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
            <div className="pc-name">minha conta</div>
            <div className="pc-count">
              {!isLoggedIn
                ? "Entre para continuar"
                : access === "v2"
                  ? "Acesso liberado"
                  : "Acesso pendente"}
            </div>
            <div className="pc-progress-row">
              <div className="bar">
                <i style={{ width: isLoggedIn ? "66%" : "28%" }} />
              </div>
              <span className="bar-pct">{isLoggedIn ? "ok" : "login"}</span>
            </div>
            <div className="status-tag">
              <Sparkles size={13} fill="currentColor" /> disponivel ate {V1_END_DATE}
            </div>
          </div>
        </div>
      </section>

      <section className="set-block">
        <div className="set-head">
          <LogIn size={19} />
          <div>
            <b>Entrar no clube</b>
            <span>use seu e-mail e senha cadastrados</span>
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
            Entrar
          </button>
          <button
            className="btn"
            disabled={!termsAccepted}
            onClick={() => {
              setIsLoggedIn(true);
              setAccess("v2");
            }}
          >
            Acessar album
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
  readyPacks,
  setPage,
}: {
  readyPacks: StickerPack[];
  setPage: (page: Page) => void;
}) {
  const [adWatched, setAdWatched] = useState(false);
  const ownedCount = 118;
  const rareCount = 3;
  const duplicatesCount = 7;
  const pct = Math.round((ownedCount / 300) * 100);

  const shareText = `Ja tenho ${ownedCount}/300 figurinhas no meu album do Clube das Colecionadoras.`;
  const publicAlbumUrl = "https://lendosaficos.com.br/clubedascolecionadoras/album/u/colecionadora";

  const shareStatus = () => {
    const shareUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, "_blank");
  };

  const copyPublicLink = async () => {
    await navigator.clipboard?.writeText(publicAlbumUrl);
  };

  return (
    <main className="screen">
      <h1 className="section-title">Meu clube</h1>
      <p className="section-sub">acompanhe seu progresso e seus pacotes</p>

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
            <div className="pc-count">{ownedCount} de 300 figurinhas</div>
            <div className="pc-progress-row">
              <div className="bar">
                <i style={{ width: `${pct}%` }} />
              </div>
              <span className="bar-pct">{pct}%</span>
            </div>
            <div className="status-tag">
              <Star size={13} fill="currentColor" /> 42 creditos disponiveis
            </div>
          </div>
        </div>
      </section>

      <section className="stat-circles">
        <StatBadge id="coladas" label="COLADAS" value={ownedCount} />
        <StatBadge id="repetidas" label="REPETIDAS" value={duplicatesCount} />
        <StatBadge id="raras" label="RARAS" value={rareCount} />
      </section>

      <section className="set-block">
        <div className="set-head">
          <Sparkles size={19} />
          <div>
            <b>Propaganda do dia</b>
            <span>assista uma propaganda para ganhar uma figurinha</span>
          </div>
        </div>
        <button
          className={adWatched ? "btn soft" : "btn"}
          disabled={adWatched}
          onClick={() => setAdWatched(true)}
        >
          {adWatched ? "Figurinha recebida" : "Assistir propaganda"}
        </button>
      </section>

      <section className="set-block">
        <div className="set-head">
          <PackageOpen size={19} />
          <div>
            <b>Registro de pacotes</b>
            <span>seus pacotes ficam salvos para abrir quando quiser</span>
          </div>
        </div>
        <button className="btn ghost" onClick={() => setPage("pacotes")}>
          Ver meus pacotes
        </button>
      </section>

      <section className="home-share-panel">
        <h3>Compartilhar progresso</h3>
        <p>{ownedCount} coladas · {pct}% completo</p>

        <div className="home-share-preview">
          <div className="share-card">
            <div className="share-card-head">
              <span>LENDO SAFICOS</span>
              <b>Colecionadora</b>
            </div>
            <div className="share-card-user">
              <div className="share-avatar">CG</div>
              <div>
                <strong>colecionadora</strong>
                <div className="share-bar"><i style={{ width: `${pct}%` }} /></div>
              </div>
              <em>{pct}%</em>
            </div>
            <div className="share-card-stats">
              <span>{ownedCount} coladas</span>
              <span>{rareCount} raras</span>
            </div>
          </div>
        </div>

        <div className="home-share-buttons">
          <button className="share-outline" onClick={shareStatus}>
            <Smartphone size={14} /> Compartilhar status
          </button>
          <button className="share-outline" onClick={copyPublicLink}>
            <Copy size={14} /> Copiar link publico
          </button>
        </div>
      </section>
    </main>
  );
}

function getSealPath(cx: number, cy: number, Rout: number, Rin: number, N: number) {
  let path = "";
  const step = (2 * Math.PI) / N;
  const halfStep = step / 2;

  for (let i = 0; i < N; i++) {
    const angle = i * step;
    const v1Angle = angle - halfStep;
    const v2Angle = angle + halfStep;

    const xV1 = cx + Rin * Math.cos(v1Angle);
    const yV1 = cy + Rin * Math.sin(v1Angle);
    const xP = cx + Rout * Math.cos(angle);
    const yP = cy + Rout * Math.sin(angle);
    const xV2 = cx + Rin * Math.cos(v2Angle);
    const yV2 = cy + Rin * Math.sin(v2Angle);

    if (i === 0) path += `M ${xV1} ${yV1}`;
    path += ` Q ${xP} ${yP} ${xV2} ${yV2}`;
  }

  return `${path} Z`;
}

function StatBadge({ id, value, label }: { id: string; value: number | string; label: string }) {
  return (
    <div className="stat-c">
      <svg viewBox="0 0 200 200" width="100%" aria-hidden="true">
        <defs>
          <path id={`st-path-top-${id}`} d="M 46 100 A 54 54 0 0 1 154 100" fill="none" />
          <path id={`st-path-bottom-${id}`} d="M 34 100 A 66 66 0 0 0 166 100" fill="none" />
        </defs>
        <path d={getSealPath(100, 100, 98, 85, 24)} fill="#FEB4C4" />
        <circle cx="100" cy="100" r="76" fill="none" stroke="white" strokeWidth="1.2" />
        <circle cx="34" cy="100" r="3" fill="#6e1638" />
        <circle cx="166" cy="100" r="3" fill="#6e1638" />
        <text
          fontFamily="'Fredoka', sans-serif"
          fontWeight="800"
          fontSize="14.5"
          letterSpacing="1.5"
          fill="#6e1638"
        >
          <textPath href={`#st-path-top-${id}`} startOffset="50%" textAnchor="middle">
            FIGURINHAS
          </textPath>
        </text>
        <text
          x="100"
          y="105"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'Pacifico', cursive"
          fontWeight="400"
          fontSize="62"
          fill="#ffcddc"
          stroke="#6e1638"
          strokeWidth="2"
        >
          {value}
        </text>
        <text
          fontFamily="'Fredoka', sans-serif"
          fontWeight="800"
          fontSize="14.5"
          letterSpacing="1.2"
          fill="#6e1638"
        >
          <textPath href={`#st-path-bottom-${id}`} startOffset="50%" textAnchor="middle">
            {label}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

function AlbumPage() {
  const owned = new Set([1, 2, 3, 4, 5, 14, 18, 53, 77, 108, 112, 144, 155, 188, 203, 231, 287]);

  return (
    <main className="screen">
      <h1 className="section-title">Meu album</h1>
      <p className="section-sub">300 figurinhas para completar</p>
      <div className="filters">
        <button className="chip active">todas <b>300</b></button>
        <button className="chip">iniciais <b>100</b></button>
        <button className="chip">novas <b>200</b></button>
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
      <p className="section-sub">abra seus pacotes e veja o historico</p>
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
              <span>{pack.items.length} figurinhas</span>
            </div>
            <em>{action}</em>
          </button>
        ))
      )}
    </section>
  );
}

function ExchangePage() {
  return (
    <main className="screen">
      <h1 className="section-title">Troca</h1>
      <p className="section-sub">use suas figurinhas repetidas</p>
      <section className="exchange-actions">
        <button className="exchange-action-card">
          <div className="exchange-action-icon">
            <Star size={23} />
          </div>
          <b>Trocar por pontos</b>
          <span>converta repetidas em pontos para novos pacotes</span>
        </button>
        <button className="exchange-action-card">
          <div className="exchange-action-icon">
            <Gift size={23} />
          </div>
          <b>Trocar com usuaria</b>
          <span>uma repetida sai e outra figurinha entra ao mesmo tempo</span>
        </button>
      </section>
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
            <button className="btn sm duplicate-card-button">Usar na troca</button>
          </section>
        ))}
      </div>
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
      <p className="section-sub">pacotes, figurinhas comuns e raras</p>

      <section className="set-block">
        <div className="set-head">
          <ShoppingBag size={19} />
          <div>
            <b>Loja</b>
            <span>buscar por nome ou numero</span>
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
            ? "pacote de figurinhas"
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

function ConfigPage() {
  return (
    <main className="screen">
      <h1 className="section-title">Ajustes</h1>
      <p className="section-sub">deixe o app com a sua cara</p>

      <section className="set-block">
        <div className="set-head">
          <UserRound size={19} />
          <div>
            <b>Nome de exibicao</b>
            <span>aparece no seu perfil e no mural</span>
          </div>
        </div>
        <input className="club-input" defaultValue="colecionadora" />
        <button className="btn sm config-full-button">Salvar nome</button>
      </section>

      <section className="set-block">
        <div className="set-head">
          <ImageIcon size={19} />
          <div>
            <b>Avatar</b>
            <span>escolha uma imagem para sua conta</span>
          </div>
        </div>
        <div className="avatar-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <button className={index === 0 ? "av sel" : "av"} key={index}>
              <img src={`/avatar/${index + 1}.png`} alt="" />
            </button>
          ))}
          <button className="av up">+ foto</button>
        </div>
      </section>

      <section className="set-block">
        <div className="set-head">
          <Sparkles size={19} />
          <div>
            <b>Estilizacoes</b>
            <span>itens visuais liberados na conta</span>
          </div>
        </div>
        <StyleToggle icon="tema" label="Tema lilas" active />
        <StyleToggle icon="lua" label="Tema dark" />
        <StyleToggle icon="story" label="Layout de story premium" active />
      </section>

      <section className="set-block">
        <div className="set-head">
          <Trash2 size={19} />
          <div>
            <b>Excluir conta</b>
            <span>solicitacao com prazo de seguranca</span>
          </div>
        </div>
        <button className="btn soft">Solicitar exclusao</button>
      </section>
    </main>
  );
}

function StyleToggle({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) {
  return (
    <div className="style-row">
      <div className="si">{icon}</div>
      <div className="st">
        <b>{label}</b>
        <span>{active ? "ativado" : "desativado"}</span>
      </div>
      <div className={active ? "switch on" : "switch"}>
        <i />
      </div>
    </div>
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
          <p>toque no pacote para abrir</p>
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
