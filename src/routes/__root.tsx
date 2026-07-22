import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { supabase } from "../integrations/supabase/client";

// Operational switch used while the production database is being repaired.
// Keep this explicit so reopening the application requires a reviewed deploy.
const MAINTENANCE_MODE = true;
const MAINTENANCE_TEST_USERS = new Set([
  "483f4e4b-20b0-4340-a1bb-4666acd54b32",
  "9d974c54-e1a2-47ed-a1cb-c9afe9ba5b97",
]);

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  // Automatically refresh page if a dynamic import/chunk loading fails (typical after redeploys)
  useEffect(() => {
    const errorMsg = error?.message || "";
    const isChunkError =
      errorMsg.includes("Failed to fetch dynamically imported module") ||
      errorMsg.toLowerCase().includes("chunk") ||
      errorMsg.toLowerCase().includes("dynamically imported");

    if (isChunkError && typeof window !== "undefined") {
      const lastReload = sessionStorage.getItem("last-chunk-reload");
      const now = Date.now();
      // Wait at least 10s between reloads to prevent infinite reload loops
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem("last-chunk-reload", now.toString());
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Clube das Colecionadoras - LS" },
      { name: "description", content: "Colecione seus surtos literários." },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/logo-ls.png" },
      { rel: "shortcut icon", type: "image/png", href: "/logo-ls.png" },
      { rel: "apple-touch-icon", href: "/logo-ls.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700;800&family=Dancing+Script:wght@400;500;600;700&family=Montserrat:wght@800&family=Baloo+2:wght@700;800&family=Nunito:wght@400;700&family=Fredoka:wght@400;700;800&family=Pacifico&display=swap",
      },
      { rel: "preload", href: "/logo_text.png", as: "image" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-2GBJCHQHDQ" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-2GBJCHQHDQ');
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  const application = (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );

  if (MAINTENANCE_MODE) {
    return <MaintenanceAccessGate>{application}</MaintenanceAccessGate>;
  }

  return application;
}

function MaintenanceAccessGate({ children }: { children: ReactNode }) {
  const location = useRouterState({ select: (state) => state.location });
  const [access, setAccess] = useState<"checking" | "allowed" | "blocked">("checking");
  const maintenanceTest = (location.search as Record<string, unknown>)?.maintenance_test;
  const isTestLoginRoute =
    location.pathname === "/clubedascolecionadoras/login" &&
    String(maintenanceTest ?? "") === "1";

  useEffect(() => {
    let active = true;

    const evaluate = (userId?: string) => {
      if (!active) return;
      const allowed = Boolean(userId && MAINTENANCE_TEST_USERS.has(userId));
      setAccess(allowed ? "allowed" : "blocked");

      if (userId && !allowed) {
        window.setTimeout(() => {
          void supabase.auth.signOut({ scope: "local" }).catch((error) => {
            console.warn("Não foi possível encerrar a sessão local durante a manutenção.", error);
          });
        }, 0);
      }
    };

    void supabase.auth.getSession().then(({ data }) => evaluate(data.session?.user.id));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      evaluate(session?.user.id);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // The login route remains reachable so approved testers can authenticate.
  // Every other route stays blocked until the authenticated ID is allowlisted.
  if (isTestLoginRoute || access === "allowed") return children;

  return <MaintenanceScreen checking={access === "checking"} />;
}

function MaintenanceScreen({ checking = false }: { checking?: boolean }) {
  return (
    <main className="maintenance-screen">
      <section className="maintenance-card" role="status" aria-live="polite">
        <img className="maintenance-logo" src="/logo_text.png" alt="Clube das Colecionadoras" />
        <span className="maintenance-kicker">
          {checking ? "Verificando acesso" : "Manutenção em andamento"}
        </span>
        <h1>{checking ? "Só um instante" : "Estamos cuidando de tudo por aqui"}</h1>
        <p>
          O Clube está temporariamente indisponível enquanto realizamos ajustes de segurança e
          estabilidade. Seu álbum e seu progresso permanecem preservados.
        </p>
        <div className="maintenance-note">Volte em breve para continuar sua coleção.</div>
      </section>
    </main>
  );
}
