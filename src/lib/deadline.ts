export const PICKS_LOCK_DATE = "2026-03-15T18:00:00-06:00";

export function isPicksLocked() {
  return new Date() >= new Date(PICKS_LOCK_DATE);
}

export function getPicksLockDate() {
  return new Date(PICKS_LOCK_DATE);
}