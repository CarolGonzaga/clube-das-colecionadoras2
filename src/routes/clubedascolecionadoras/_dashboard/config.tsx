import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import ConfigClient from "../../../components/ConfigClient";

// Static styles catalog - these match the CSS cosmetic options
const STYLES_CATALOG = [
  {
    id: "lilac",
    name: "Tema Lilás",
    description: "Altera as cores do álbum para tons de lilás e roxo",
    icon: "💜",
  },
  {
    id: "avatar-neon-frame",
    name: "Moldura Arco-Íris",
    description: "Adiciona uma moldura brilhante arco-íris pro seu avatar",
    icon: "🌈",
  },
  {
    id: "new-icon",
    name: "Ícone Novo",
    description: "Ícone sortido exclusivo adicionado aos seus avatares",
    icon: "🎁",
  },
  {
    id: "theme-dark",
    name: "Modo Escuro (Dark)",
    description: "Altera o álbum para a versão dark",
    icon: "🌙",
  },
  {
    id: "story-layout",
    name: "Layout de Story Exclusivo",
    description: "Habilita um design exclusivo na geração de story",
    icon: "📱",
  },
  {
    id: "glitter",
    name: "Fundo Glitter",
    description: "Adiciona animação de glitter cintilante no fundo",
    icon: "✨",
  },
  {
    id: "goldframe",
    name: "Molduras Douradas",
    description: "Bordas douradas nas células do álbum",
    icon: "🏵️",
  },
];

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/config")({
  component: DashboardConfig,
});

function DashboardConfig() {
  const parentData = useLoaderData({ from: "/clubedascolecionadoras/_dashboard" });

  return (
    <ConfigClient
      profile={parentData.profile}
      styles={STYLES_CATALOG}
      userStyles={parentData.userStyles}
    />
  );
}
