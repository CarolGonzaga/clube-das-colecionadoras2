import React, { useState, useEffect } from "react";
import { Donation, Sticker, UserSticker } from "@/lib/types";
import { useUI } from "@/components/UIProvider";
import { useRouter } from "@tanstack/react-router";
import { generateDonationAction, triggerDonationExpirationAction } from "@/lib/actions";
import Stamp from "./Stamp";
import { HeartHandshake } from "lucide-react";

interface DoarClientProps {
  stickers: Sticker[];
  initialUserStickers: UserSticker[];
  profileId: string;
}

export default function DoarClient({ stickers, initialUserStickers, profileId }: DoarClientProps) {
  const ui = useUI();
  const router = useRouter();
  const [userStickers, setUserStickers] = useState<UserSticker[]>(initialUserStickers);
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    // Return any expired donations immediately on page load from the client
    const expireDonations = async () => {
      try {
        await triggerDonationExpirationAction();
        router.invalidate();
      } catch (err) {
        console.error("Error expiring donations on load:", err);
      }
    };
    expireDonations();
  }, []);

  useEffect(() => {
    setUserStickers(initialUserStickers);
  }, [initialUserStickers]);

  // Filter stickers that are duplicates (copies > 1)
  const duplicates = stickers
    .filter((s) => {
      const us = userStickers.find((u) => u.sticker_number === s.number);
      return us && us.copies > 1;
    })
    .map((s) => {
      const us = userStickers.find((u) => u.sticker_number === s.number)!;
      return {
        sticker: s,
        copies: us.copies,
        isRare: us.is_rare,
      };
    });

  const handleGenerate = async (stickerNumber: number, title: string) => {
    if (loading[stickerNumber]) return;

    setLoading((prev) => ({ ...prev, [stickerNumber]: true }));

    const res = await generateDonationAction(stickerNumber);

    setLoading((prev) => ({ ...prev, [stickerNumber]: false }));

    if (res.success && res.code) {
      const generatedCode = res.code;
      const donation: Donation = {
        code: generatedCode,
        sticker_number: stickerNumber,
        status: "active",
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // Keep an immediate per-user history while the database query refreshes.
      const storageKey = `outgoing_donations:${profileId}`;
      try {
        const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const previous = Array.isArray(stored) ? stored : [];
        localStorage.setItem(
          storageKey,
          JSON.stringify([donation, ...previous.filter((item) => item.code !== donation.code)]),
        );
        window.dispatchEvent(new Event("outgoing_donations_change"));
      } catch (error) {
        console.error("Error saving outgoing donation history:", error);
      }

      // Update local state instantly
      setUserStickers((prev) =>
        prev.map((us) => {
          if (us.sticker_number === stickerNumber) {
            return { ...us, copies: Math.max(us.copies - 1, 0) };
          }
          return us;
        }),
      );

      // Open Modal to show the generated code
      ui.openModal(
        <div style={{ textAlign: "center" }}>
          <h2 style={{ textAlign: "center" }}>Código de doação</h2>
          <p style={{ textAlign: "center", margin: "4px 0 12px" }}>
            Figurinha: <b>{title}</b>
          </p>
          <div
            style={{
              background: "var(--blush)",
              border: "2px dashed var(--magenta)",
              borderRadius: "16px",
              padding: "16px",
              textAlign: "center",
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 800,
              fontSize: "26px",
              color: "var(--wine)",
              letterSpacing: "2px",
              margin: "12px 0",
            }}
          >
            {generatedCode}
          </div>
          <button
            className="btn"
            id="cp-don"
            onClick={async () => {
              if (navigator.clipboard) {
                await navigator.clipboard.writeText(generatedCode);
                ui.toast("Código copiado! 💝");
              } else {
                ui.toast("Erro ao copiar.");
              }
            }}
          >
            Copiar código
          </button>
          <button
            className="btn soft"
            style={{ marginTop: "8px" }}
            onClick={() => {
              ui.closeModal();
              router.invalidate();
            }}
          >
            Fechar
          </button>
          <p className="note" style={{ marginTop: "10px" }}>
            Expira em 24h. Envie pra quem você quer presentear.
          </p>
        </div>,
      );
    } else {
      ui.toast(res.message || "Erro ao gerar código de doação.");
    }
  };

  return (
    <div className="screen">
      <div className="section-title">Minhas repetidas</div>
      <div className="section-sub">
        gere um código e doe pra outra colecionadora{" "}
        <HeartHandshake className="w-3.5 h-3.5 inline-block align-text-top text-[#C2185B] ml-1" />
      </div>

      {duplicates.length === 0 ? (
        <div className="empty">Você ainda não tem repetidas.</div>
      ) : (
        <div className="duplicates-grid">
          {duplicates.map(({ sticker, copies, isRare }) => {
            const qty = copies - 1;

            return (
              <div className="row duplicate-card" key={sticker.number}>
                <div className="thumb duplicate-card-thumb">
                  <Stamp number={sticker.number} owned={true} auto={isRare} cover={sticker.slug} />
                </div>
                <div className="info duplicate-card-info">
                  <b>
                    #{String(sticker.number).padStart(3, "0")} · {sticker.name}
                  </b>
                  <span>{qty} repetida(s)</span>
                </div>
                <button
                  className="btn sm duplicate-card-button"
                  disabled={loading[sticker.number]}
                  onClick={() => handleGenerate(sticker.number, sticker.name)}
                >
                  {loading[sticker.number] ? "Gerando..." : "Gerar código"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="note" style={{ marginTop: "16px" }}>
        Doação, não troca: ao gerar o código você &quot;segura&quot; 1 repetida. Quem resgatar ganha
        a figurinha. Se ninguém usar em 24h, ela volta pra você.
      </div>
    </div>
  );
}
