import React, { useState, useRef, useEffect } from "react";
import { useRouter, Link } from "@tanstack/react-router";
import { Profile, Style, UserStyle } from "@/lib/types";
import { getPublicAlbumUrl } from "@/lib/urls";
import { useUI } from "@/components/UIProvider";
import {
  updateNicknameAction,
  updatePasswordAction,
  updateAvatarEmojiAction,
  updateAvatarPhotoAction,
  toggleMuralAction,
  toggleStyleAction,
  logoutAction,
  loadTestUserCompleteAction,
  loadTestUserBeginnerAction,
} from "@/lib/actions";
import PasswordField from "@/components/PasswordField";
import { dbService } from "@/lib/db";

const DEFAULT_AVATARS = Array.from({ length: 12 }, (_, i) => `/avatar/${i + 1}.png`);
const BONUS_AVATARS = Array.from({ length: 4 }, (_, i) => `/avatar/${i + 13}.png`);

interface ConfigClientProps {
  profile: Profile;
  styles: Style[];
  userStyles: UserStyle[];
}

export default function ConfigClient({ profile, styles, userStyles }: ConfigClientProps) {
  const ui = useUI();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nick, setNick] = useState(profile.nick);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [publicAlbumUrl, setPublicAlbumUrl] = useState("");

  // Local optimistic avatar states
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [selectedAvatarEmoji, setSelectedAvatarEmoji] = useState<string | null>(
    profile.avatar_emoji,
  );

  useEffect(() => {
    setSelectedAvatarUrl(profile.avatar_url);
    setSelectedAvatarEmoji(profile.avatar_emoji);
    localStorage.removeItem("has_unseen_styles");
  }, [profile]);

  useEffect(() => {
    setPublicAlbumUrl(getPublicAlbumUrl(profile.id));
  }, [profile.id]);

  // Filter unlocked styles
  const unlockedStyles = styles.filter((s) => {
    const us = userStyles.find((u) => u.style_id === s.id);
    return us && us.unlocked;
  });

  const isNewIconUnlocked = userStyles.find((u) => u.style_id === "new-icon")?.unlocked || false;
  const getStyleEnabled = (styleId: string) => {
    return userStyles.find((u) => u.style_id === styleId)?.enabled || false;
  };

  const handleSaveNick = async () => {
    if (!nick.trim()) {
      ui.toast("Digite um nome.");
      return;
    }
    setLoading(true);
    const res = await updateNicknameAction(nick.trim());
    setLoading(false);
    if (res.success) {
      ui.toast("Nome atualizado! ✦");
      router.invalidate();
    } else {
      ui.toast(res.message || "Erro ao atualizar nome.");
    }
  };

  const handleSavePassword = async () => {
    if (!password) {
      ui.toast("Preencha a senha ou PIN.");
      return;
    }
    const isNumeric = /^\d+$/.test(password);
    if (isNumeric) {
      if (password.length < 4) {
        ui.toast("O PIN deve ter no mínimo 4 números.");
        return;
      }
      let hasRepetition = false;
      for (let i = 0; i <= password.length - 4; i++) {
        if (
          password[i] === password[i + 1] &&
          password[i] === password[i + 2] &&
          password[i] === password[i + 3]
        ) {
          hasRepetition = true;
          break;
        }
      }
      if (hasRepetition) {
        ui.toast("O PIN não pode ter mais de 3 repetições sequenciais.");
        return;
      }
      let hasSequence = false;
      for (let i = 0; i <= password.length - 4; i++) {
        const d1 = parseInt(password[i]);
        const d2 = parseInt(password[i + 1]);
        const d3 = parseInt(password[i + 2]);
        const d4 = parseInt(password[i + 3]);
        if (
          (d2 === d1 + 1 && d3 === d2 + 1 && d4 === d3 + 1) ||
          (d2 === d1 - 1 && d3 === d2 - 1 && d4 === d3 - 1)
        ) {
          hasSequence = true;
          break;
        }
      }
      if (hasSequence) {
        ui.toast("O PIN não pode ser uma sequência numérica.");
        return;
      }
    } else {
      if (password.length < 6) {
        ui.toast("A senha deve ter no mínimo 6 caracteres.");
        return;
      }
    }
    setLoading(true);
    const res = await updatePasswordAction(password);
    setLoading(false);
    if (res.success) {
      ui.toast("Senha atualizada! 🔒");
      setPassword("");
    } else {
      ui.toast(res.message || "Erro ao atualizar senha.");
    }
  };

  const handleSelectEmoji = async (emoji: string) => {
    // Instant optimistic update
    setSelectedAvatarUrl(null);
    setSelectedAvatarEmoji(emoji);

    const res = await updateAvatarEmojiAction(emoji);
    if (res.success) {
      ui.toast("Avatar atualizado! ✦");
      router.invalidate();
    } else {
      // Revert if error
      setSelectedAvatarUrl(profile.avatar_url);
      setSelectedAvatarEmoji(profile.avatar_emoji);
      ui.toast(res.message || "Erro ao atualizar avatar.");
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    ui.toast("Processando foto...");
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const sz = 160;
        const canvas = document.createElement("canvas");
        canvas.width = sz;
        canvas.height = sz;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const m = Math.min(img.width, img.height);
          const sx = (img.width - m) / 2;
          const sy = (img.height - m) / 2;
          ctx.drawImage(img, sx, sy, m, m, 0, 0, sz, sz);
          const photoBase64 = canvas.toDataURL("image/jpeg", 0.82);

          // Instant optimistic update
          setSelectedAvatarUrl(photoBase64);
          setSelectedAvatarEmoji(null);

          const res = await updateAvatarPhotoAction(photoBase64);
          if (res.success) {
            ui.toast("Avatar foto atualizado! ✦");
            router.invalidate();
          } else {
            // Revert if error
            setSelectedAvatarUrl(profile.avatar_url);
            setSelectedAvatarEmoji(profile.avatar_emoji);
            ui.toast(res.message || "Erro ao salvar foto.");
          }
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleToggleMural = async () => {
    const nextVal = !profile.mural_opt_in;
    const res = await toggleMuralAction(nextVal);
    if (res.success) {
      ui.toast(nextVal ? "Inscrita no mural! 🏆" : "Removida do mural.");
      router.invalidate();
    } else {
      ui.toast(res.message || "Erro ao alterar mural.");
    }
  };

  const handleToggleStyle = async (styleId: string) => {
    const currentEnabled = getStyleEnabled(styleId);
    const nextEnabled = !currentEnabled;

    if (nextEnabled) {
      if (styleId === "lilac" && getStyleEnabled("theme-dark")) {
        await toggleStyleAction("theme-dark", false);
      } else if (styleId === "theme-dark" && getStyleEnabled("lilac")) {
        await toggleStyleAction("lilac", false);
      }
    }

    const res = await toggleStyleAction(styleId, nextEnabled);
    if (res.success) {
      ui.toast(!currentEnabled ? "Estilização ativada!" : "Estilização desativada.");
      router.invalidate();
    } else {
      ui.toast(res.message || "Erro ao alterar estilo.");
    }
  };

  const handleLogout = async () => {
    const res = await logoutAction();
    if (res.success) {
      localStorage.removeItem("recent_stickers");
      window.location.href = "/clubedascolecionadoras/login";
    } else {
      ui.toast("Erro ao sair da conta.");
    }
  };

  const handleDeleteAccount = () => {
    let confirmPassword = "";
    ui.openModal(
      <div style={{ textAlign: "center", padding: "10px" }} className="flex flex-col gap-4">
        <h2 className="text-[#C2185B] font-extrabold text-lg">Excluir Conta</h2>
        <p className="text-xs text-gray-600 leading-relaxed">
          Esta ação é irreversível. Todas as suas figurinhas, progresso e dados serão
          permanentemente excluídos.
        </p>
        <div>
          <input
            type="password"
            placeholder="Confirme sua senha ou PIN"
            className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            onChange={(e) => {
              confirmPassword = e.target.value;
            }}
          />
        </div>
        <div className="flex gap-2">
          <button
            className="btn font-bold flex-1"
            style={{ background: "#ccc", color: "#333", borderRadius: "20px" }}
            onClick={() => ui.closeModal()}
          >
            Cancelar
          </button>
          <button
            className="btn font-bold flex-1 bg-red-600 text-white"
            style={{ borderRadius: "20px" }}
            onClick={async () => {
              if (!confirmPassword) {
                ui.toast("Por favor, digite sua senha.");
                return;
              }
              ui.closeModal();
              ui.toast("Processando exclusão... ⏳");
              try {
                const verified = await dbService.verifyPassword(confirmPassword);
                if (!verified) {
                  ui.toast("Senha incorreta. Não foi possível excluir a conta.");
                  return;
                }
                await dbService.deleteUserAccount();
                ui.toast("Conta excluída com sucesso!");
                localStorage.removeItem("recent_stickers");
                localStorage.removeItem(`recent_stickers:${profile.id}`);
                localStorage.removeItem(`outgoing_donations:${profile.id}`);
                localStorage.removeItem("pending_pack");
                localStorage.removeItem("reveals_queue");
                window.location.replace("/clubedascolecionadoras/login");
              } catch (err: any) {
                ui.toast(err.message || "Erro ao excluir conta.");
              }
            }}
          >
            Excluir
          </button>
        </div>
      </div>,
    );
  };



  const handleLoadComplete = async () => {
    setLoading(true);
    const res = await loadTestUserCompleteAction();
    setLoading(false);
    if (res.success) {
      ui.toast("Simulação: Usuário Completo Carregado! 👑");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      ui.toast("Erro ao carregar simulação.");
    }
  };

  const handleLoadBeginner = async () => {
    setLoading(true);
    const res = await loadTestUserBeginnerAction();
    setLoading(false);
    if (res.success) {
      ui.toast("Simulação: Usuário Iniciante Carregado! 🐣");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      ui.toast("Erro ao carregar simulação.");
    }
  };

  const hasPhotoAvatar = profile.avatar_url && profile.avatar_url.startsWith("http");

  return (
    <div className="screen">
      <div className="section-title">Ajustes</div>
      <div className="section-sub">deixe o app com a sua cara ✦</div>

      {/* Nickname Section */}
      <div className="set-block">
        <h3>👤 Nome de exibição</h3>
        <div className="field" style={{ margin: 0 }}>
          <input
            id="cfg-nick"
            type="text"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            maxLength={24}
            disabled={loading}
          />
        </div>
        <button
          className="btn sm"
          id="save-nick"
          style={{ marginTop: "10px", width: "100%" }}
          onClick={handleSaveNick}
          disabled={loading}
        >
          Salvar nome
        </button>
      </div>

      {/* Password Section */}
      <div className="set-block">
        <h3>🔒 Senha de acesso</h3>
        <div className="field" style={{ margin: 0 }}>
          <PasswordField
            id="cfg-pin"
            placeholder="nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            inputClassName="w-full"
          />
        </div>
        <button
          className="btn sm"
          id="save-pin"
          style={{ marginTop: "10px", width: "100%" }}
          onClick={handleSavePassword}
          disabled={loading}
        >
          Salvar senha
        </button>
      </div>

      {/* Avatar Presets & Custom Upload */}
      <div className="set-block">
        <h3>✦ Avatar</h3>
        <div className="avatar-grid">
          {/* Photo Avatar Render if present */}
          {selectedAvatarUrl && (
            <div className="av sel" style={{ overflow: "hidden" }}>
              <img
                src={selectedAvatarUrl}
                alt={profile.nick}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          {/* Image Preset Options */}
          {(isNewIconUnlocked ? [...DEFAULT_AVATARS, ...BONUS_AVATARS] : DEFAULT_AVATARS).map(
            (a) => {
              const isSelected = !selectedAvatarUrl && selectedAvatarEmoji === a;
              return (
                <div
                  key={a}
                  className={`av ${isSelected ? "sel" : ""}`}
                  style={{ overflow: "hidden" }}
                  onClick={() => handleSelectEmoji(a)}
                >
                  <img
                    src={a}
                    alt="Avatar Preset"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              );
            },
          )}

          {/* Custom Photo upload trigger */}
          <div className="av up" id="av-upload" onClick={() => fileInputRef.current?.click()}>
            ＋📷
          </div>
        </div>

        <input
          type="file"
          id="av-file"
          accept="image/*"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handlePhotoUpload}
        />
        <div className="note" style={{ textAlign: "left", marginTop: "8px" }}>
          Toque em ＋📷 para usar uma foto sua.
        </div>
      </div>

      {/* Mural Option */}
      <div className="set-block">
        <h3>👥 Mural das colecionadoras</h3>
        <div className="style-row" style={{ border: "none", padding: "4px 0" }}>
          <div className="si">🏆</div>
          <div className="st">
            <b>Aparecer no mural</b>
            <span>mostra seu apelido e progresso no ranking geral</span>
          </div>
          <div
            className={`switch ${profile.mural_opt_in ? "on" : "off"}`}
            onClick={handleToggleMural}
          >
            <i></i>
          </div>
        </div>
      </div>

      {/* Style Cosmetics Section */}
      <div className="set-block">
        <h3>🎨 Estilizações</h3>
        {unlockedStyles.filter((s) => s.id !== "new-icon").length ===
        0 ? (
          <div className="note" style={{ textAlign: "left", margin: "2px 0" }}>
            Você ainda não liberou estilizações. Resgate o <b>elemento do dia</b> na página inicial
            para desbloqueá-las, uma a uma ✦
          </div>
        ) : (
          unlockedStyles
            .filter((s) => s.id !== "new-icon")
            .map((s) => {
              const isEnabled = getStyleEnabled(s.id);
              let displayIcon = s.icon;
              let displayName = s.name;
              if (s.id === "new-icon") {
                displayIcon = "🖼️";
                displayName = "Avatares extras";
              }
              return (
                <div className="style-row" key={s.id}>
                  <div className="si">{displayIcon}</div>
                  <div className="st">
                    <b>{displayName}</b>
                    <span>{s.description}</span>
                  </div>
                  <div
                    className={`switch ${isEnabled ? "on" : "off"}`}
                    onClick={() => handleToggleStyle(s.id)}
                  >
                    <i></i>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Logout button */}
      <button
        className="btn soft"
        id="logout"
        onClick={handleLogout}
        style={{ marginBottom: "8px" }}
      >
        Sair da conta
      </button>

      {/* Delete Account button */}
      <button
        className="btn soft bg-red-50 text-red-600 hover:bg-red-100"
        id="delete-account"
        onClick={handleDeleteAccount}
        style={{ marginBottom: "16px", borderColor: "#fecaca" }}
      >
        Excluir conta
      </button>

      <div className="note">
        Seu link individual: {publicAlbumUrl}
      </div>

      <Link to="/clubedascolecionadoras/termos" className="usage-rules-link">
        Termos de uso
      </Link>
    </div>
  );
}
