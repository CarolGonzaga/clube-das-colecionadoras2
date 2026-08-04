/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GameAlbumSticker = {
  id: number;
  title: string;
  author: string;
  frontImagePath: string;
  altText: string;
  amazonUrl: string | null;
  owned: boolean;
  sourceGame: string | null;
  unlockedAt: string | null;
};

export const getGameAlbum = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const [{ data: catalog, error: catalogError }, { data: owned, error: ownedError }] =
      await Promise.all([
        admin
          .from("memory_game_stickers")
          .select("id,title,author,front_image_path,alt_text,amazon_url")
          .eq("is_active", true)
          .order("id"),
        admin
          .from("user_game_stickers")
          .select("sticker_id,source_game,first_unlocked_at")
          .eq("user_id", context.userId),
      ]);
    if (catalogError || ownedError) throw new Error("Não foi possível carregar o álbum de jogos.");
    const ownedById = new Map((owned || []).map((item: any) => [item.sticker_id, item]));
    return (catalog || []).map((item: any) => {
      const acquisition = ownedById.get(item.id) as any;
      return {
        id: item.id,
        title: item.title,
        author: item.author,
        frontImagePath: item.front_image_path,
        altText: item.alt_text || `Capa do livro ${item.title}`,
        amazonUrl: item.amazon_url || null,
        owned: Boolean(acquisition),
        sourceGame: acquisition?.source_game || null,
        unlockedAt: acquisition?.first_unlocked_at || null,
      } satisfies GameAlbumSticker;
    });
  });
