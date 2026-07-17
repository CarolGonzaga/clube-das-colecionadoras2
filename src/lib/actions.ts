import { dbService, validatePasswordOrPin } from "./db";

export async function loginAction(email: string, pin: string) {
  try {
    const res = await dbService.login(email, pin);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
export async function requestPasswordResetAction(email: string) {
  try {
    const res = await dbService.requestPasswordReset(email);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function verifyResetCodeAction(email: string, token: string) {
  try {
    const res = await dbService.verifyResetCode(email, token);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function signupAction(nick: string, email: string, pin: string, muralOptIn: boolean) {
  try {
    const validationError = validatePasswordOrPin(pin);
    if (validationError) return { success: false, message: validationError };
    const res = await dbService.signup(nick, email, pin, muralOptIn);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function logoutAction() {
  try {
    await dbService.logout();
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
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
    return { success: false, message: err.message };
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
    return { success: false, message: err.message };
  }
}

export async function redeemCodeAction(codeRaw: string) {
  try {
    const res = await dbService.redeemCode(codeRaw);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function generateDonationAction(stickerNumber: number) {
  try {
    const code = await dbService.generateDonation(stickerNumber);
    return { success: true, code };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function redeemDonationAction(codeRaw: string) {
  try {
    const res = await dbService.redeemDonation(codeRaw);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function completeMissionAction(missionId: string) {
  try {
    const res = await dbService.completeMission(missionId);
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function claimDailyElementAction() {
  try {
    const res = await dbService.claimDailyElement();
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updateNicknameAction(nick: string) {
  try {
    await dbService.updateNickname(nick);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updatePasswordAction(pin: string) {
  try {
    const validationError = validatePasswordOrPin(pin);
    if (validationError) return { success: false, message: validationError };
    await dbService.updatePassword(pin);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updateAvatarEmojiAction(emoji: string) {
  try {
    await dbService.updateAvatarEmoji(emoji);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updateAvatarPhotoAction(photoBase64: string) {
  try {
    await dbService.updateAvatarPhoto(photoBase64);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function toggleMuralAction(optIn: boolean) {
  try {
    await dbService.toggleMural(optIn);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function toggleStyleAction(styleId: string, enabled: boolean) {
  try {
    await dbService.toggleStyle(styleId, enabled);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function loadTestUserCompleteAction() {
  try {
    await dbService.loadTestUserComplete();
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function loadTestUserBeginnerAction() {
  try {
    await dbService.loadTestUserBeginner();
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function triggerDonationExpirationAction() {
  try {
    const res = await dbService.expireDonations();
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// ── TRADE SYSTEM ──────────────────────────────────────────────────────────────

export async function lookupUserByNickAction(nick: string) {
  try {
    const data = await dbService.lookupUserByNick(nick);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: err.message };
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
    return { success: false, message: err.message };
  }
}

export async function getIncomingTradesAction() {
  try {
    const data = await dbService.getIncomingTrades();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function getOutgoingTradesAction() {
  try {
    const data = await dbService.getOutgoingTrades();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function respondToTradeAction(tradeId: string, accept: boolean) {
  try {
    const data = await dbService.respondToTrade(tradeId, accept);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function cancelTradeAction(tradeId: string) {
  try {
    const data = await dbService.cancelTrade(tradeId);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function getPointsBalanceAction() {
  try {
    const balance = await dbService.getPointsBalance();
    return { success: true, balance };
  } catch (err: any) {
    return { success: false, message: err.message, balance: 0 };
  }
}

export async function exchangeForPointsAction(stickerNumber: number) {
  try {
    const data = await dbService.exchangeForPoints(stickerNumber);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function getResolvedTradesAction() {
  try {
    const data = await dbService.getResolvedTrades();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function validateAndUpdateNickAction(nick: string) {
  try {
    const data = await dbService.validateAndUpdateNick(nick);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
