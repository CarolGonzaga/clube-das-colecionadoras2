export const POINTS_BALANCE_CHANGED = "points_balance_changed";

export function emitPointsBalanceChanged(balance?: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(POINTS_BALANCE_CHANGED, { detail: { balance } }));
}

export function readPointsBalanceFromEvent(event: Event) {
  return (event as CustomEvent<{ balance?: number }>).detail?.balance;
}
