import { dbService, validatePasswordOrPin } from "./db";

// Helper centralizado para traduzir e amigabilizar mensagens de erro
function translateError(err: any): string {
  if (!err) return "Ocorreu um erro inesperado.";
  const msg = typeof err === "string" ? err : err.message || "";
  
  // Autenticação
  if (msg.includes("Invalid login credentials")) return "E-mail ou PIN/senha incorretos.";
  if (msg.includes("Email not confirmed")) return "E-mail não verificado. Por favor, confirme seu e-mail através do link enviado.";
  if (msg.includes("User not found")) return "Nenhuma colecionadora encontrada com este e-mail.";
  if (msg.includes("Signup disabled")) return "O cadastro de novas usuárias está desativado.";
  if (msg.includes("Password should be at least")) return "A senha/PIN deve ter pelo menos 6 caracteres.";
  if (msg.includes("User already registered")) return "Este e-mail já está cadastrado. Tente fazer login!";
  if (msg.includes("Too many requests")) return "Muitas solicitações seguidas. Aguarde alguns minutos antes de tentar novamente.";
  if (msg.includes("OTP has expired") || msg.includes("Verify OTP failed")) return "O código de verificação ou link expirou. Por favor, solicite um novo.";
  if (msg.includes("Invalid grant")) return "E-mail ou código inválido.";
  if (msg.includes("Unauthorized")) return "Acesso não autorizado. Faça login novamente.";
  
  // Restrições de Banco de Dados
  if (msg.includes("profiles_nick_format")) return "O apelido deve conter apenas letras minúsculas e números (sem espaços, acentos ou símbolos).";
  if (msg.includes("profiles_nick_unique") || msg.includes("duplicate key")) return "Este apelido já está em uso por outra colecionadora. Escolha outro!";
  if (msg.includes("violates check constraint")) return "Os dados informados não seguem as regras de segurança.";
  
  // Quiz
  if (msg.includes("no quiz attempts left")) return "Você já usou todas as suas 4 tentativas de quiz de hoje! Tente novamente amanhã.";
  if (msg.includes("timer expired")) return "Tempo esgotado para responder a esta pergunta.";
  if (msg.includes("Active quiz session already exists")) return "Você já tem uma sessão de quiz iniciada.";
  
  // Resgate de Códigos / Doações / Missões
  if (msg.includes("Invalid code")) return "Código inválido ou não encontrado.";
  if (msg.includes("already been redeemed")) return "Este código já foi resgatado por você ou outra colecionadora!";
  if (msg.includes("Code has expired") || msg.includes("code has expired")) return "Este código expirou.";
  if (msg.includes("cannot redeem your own donation")) return "Você não pode resgatar uma figurinha que você mesma doou.";
  if (msg.includes("Sticker already exists in album")) return "Você já tem esta figurinha colada no seu álbum.";
  if (msg.includes("Mission already completed")) return "Você já concluiu esta missão!";
  if (msg.includes("Mission not found")) return "Esta missão não foi encontrada.";

  // Sistema de Trocas
  if (msg.includes("Apenas trocas concluídas podem ser resgatadas")) return "Apenas trocas concluídas podem ser resgatadas.";
  if (msg.includes("Você já resgatou esta figurinha")) return "Você já resgatou esta figurinha.";
  if (msg.includes("Você não faz parte desta troca")) return "Você não faz parte desta proposta de troca.";
  if (msg.includes("User has not unlocked nicks")) return "Seu apelido ainda não foi cadastrado ou validado.";
  if (msg.includes("Receiver does not have the sticker")) return "A colecionadora destinatária não possui essa figurinha para troca.";
  if (msg.includes("Sender does not have the sticker")) return "Você não possui a figurinha repetida escolhida para a troca.";
  if (msg.includes("Target user not found")) return "Colecionadora não encontrada. Verifique se digitou o apelido corretamente.";
  if (msg.includes("You cannot trade with yourself")) return "Você não pode propor uma troca com você mesma!";
  if (msg.includes("Active trade request already exists")) return "Você já possui uma proposta de troca ativa com esta colecionadora para estas figurinhas.";
  if (msg.includes("Trade request expired")) return "Esta proposta de troca expirou.";
  if (msg.includes("Trade request not pending")) return "Esta proposta de troca não está mais pendente.";
  if (msg.includes("No stickers left to exchange")) return "Você não possui figurinhas repetidas suficientes desse tipo.";
  if (msg.includes("Only shop duplicates can be exchanged")) return "Apenas figurinhas repetidas da loja (201-360) podem ser vendidas por pontos.";

  return msg;
}

export async function loginAction(email: string, pin: string) {
  try {
    const res = await dbService.login(email, pin);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function requestPasswordResetAction(email: string) {
  try {
    const res = await dbService.requestPasswordReset(email);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function verifyResetCodeAction(email: string, token: string) {
  try {
    const res = await dbService.verifyResetCode(email, token);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function signupAction(nick: string, email: string, pin: string, muralOptIn: boolean): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const trimmedNick = nick.trim();
    if (trimmedNick.length < 3) {
      return { success: false, message: "O apelido deve ter pelo menos 3 caracteres." };
    }
    if (trimmedNick.length > 20) {
      return { success: false, message: "O apelido deve ter no máximo 20 caracteres." };
    }
    const formatRegex = /^[a-z0-9]+$/;
    if (!formatRegex.test(trimmedNick)) {
      return { 
        success: false, 
        message: "O apelido deve conter apenas letras minúsculas e números (sem espaços, acentos ou caracteres especiais)." 
      };
    }

    const validationError = validatePasswordOrPin(pin);
    if (validationError) return { success: false, message: validationError };
    const res = await dbService.signup(trimmedNick, email, pin, muralOptIn);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function logoutAction() {
  try {
    await dbService.logout();
    return { success: true };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function answerQuizAction(formData: {
  stickerNumber: number;
  qIndex: number;
  chosenIndex: number;
}) {
  try {
    const res = await dbService.answerQuiz(
      formData.stickerNumber,
      formData.qIndex,
      formData.chosenIndex,
    );
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function startQuizQuestionTimerAction(formData: {
  stickerNumber: number;
  qIndex: number;
}) {
  try {
    const res = await dbService.startQuizQuestionTimer(formData.stickerNumber, formData.qIndex);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function redeemCodeAction(codeRaw: string) {
  try {
    const res = await dbService.redeemCode(codeRaw);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function generateDonationAction(stickerNumber: number) {
  try {
    const code = await dbService.generateDonation(stickerNumber);
    return { success: true, code };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function redeemDonationAction(codeRaw: string) {
  try {
    const res = await dbService.redeemDonation(codeRaw);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function getOutgoingDonationsAction() {
  try {
    const user = await dbService.getCurrentUser();
    if (!user) throw new Error("Não autenticado");
    const donations = await dbService.getOutgoingDonations(user.id);
    return { success: true, data: donations };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function completeMissionAction(missionId: string) {
  try {
    const res = await dbService.completeMission(missionId);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function claimDailyElementAction() {
  try {
    const res = await dbService.claimDailyElement();
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function updateNicknameAction(nick: string) {
  try {
    const trimmed = nick.trim();
    if (!trimmed) {
      return { success: false, message: "O apelido não pode estar em branco." };
    }
    if (trimmed.length < 3) {
      return { success: false, message: "O apelido deve ter pelo menos 3 caracteres." };
    }
    if (trimmed.length > 20) {
      return { success: false, message: "O apelido deve ter no máximo 20 caracteres." };
    }
    const formatRegex = /^[a-z0-9]+$/;
    if (!formatRegex.test(trimmed)) {
      return { 
        success: false, 
        message: "O apelido deve conter apenas letras minúsculas e números (sem espaços, acentos ou caracteres especiais)." 
      };
    }

    await dbService.updateNickname(trimmed);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function updatePasswordAction(pin: string) {
  try {
    const validationError = validatePasswordOrPin(pin);
    if (validationError) return { success: false, message: validationError };
    await dbService.updatePassword(pin);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function updateAvatarEmojiAction(emoji: string) {
  try {
    await dbService.updateAvatarEmoji(emoji);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function updateAvatarPhotoAction(photoBase64: string) {
  try {
    await dbService.updateAvatarPhoto(photoBase64);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function toggleMuralAction(optIn: boolean) {
  try {
    await dbService.toggleMural(optIn);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function toggleStyleAction(styleId: string, enabled: boolean) {
  try {
    await dbService.toggleStyle(styleId, enabled);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function loadTestUserCompleteAction() {
  try {
    await dbService.loadTestUserComplete();
    return { success: true };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function loadTestUserBeginnerAction() {
  try {
    await dbService.loadTestUserBeginner();
    return { success: true };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function triggerDonationExpirationAction() {
  try {
    const res = await dbService.expireDonations();
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

// ── SISTEMA DE TROCAS ─────────────────────────────────────────────────────────

export async function lookupUserByNickAction(nick: string) {
  try {
    const data = await dbService.lookupUserByNick(nick);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function createTradeRequestAction(
  receiverNick: string,
  mySticker: number,
  desiredSticker: number,
  category: "free" | "shop",
) {
  try {
    const data = await dbService.createTradeRequest(receiverNick, mySticker, desiredSticker, category);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function getIncomingTradesAction() {
  try {
    const data = await dbService.getIncomingTrades();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function getOutgoingTradesAction() {
  try {
    const data = await dbService.getOutgoingTrades();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function respondToTradeAction(tradeId: string, accept: boolean) {
  try {
    const data = await dbService.respondToTrade(tradeId, accept);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function cancelTradeAction(tradeId: string) {
  try {
    const data = await dbService.cancelTrade(tradeId);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function getPointsBalanceAction() {
  try {
    const balance = await dbService.getPointsBalance();
    return { success: true, balance };
  } catch (err: any) {
    return { success: false, message: translateError(err), balance: 0 };
  }
}

export async function exchangeForPointsAction(stickerNumber: number) {
  try {
    const data = await dbService.exchangeForPoints(stickerNumber);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function getResolvedTradesAction() {
  try {
    const data = await dbService.getResolvedTrades();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function claimTradeRewardAction(tradeId: string) {
  try {
    const data = await dbService.claimTradeReward(tradeId);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}

export async function validateAndUpdateNickAction(nick: string) {
  try {
    const data = await dbService.validateAndUpdateNick(nick);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: translateError(err) };
  }
}
