// Maintenance configuration
export const MAINTENANCE_MODE = true; // Set to false to disable maintenance mode globally

export const ALLOWED_MAINTENANCE_USER_IDS = [
  "483f4e4b-20b0-4340-a1bb-4666acd54b32",
  "a2c66f5b-6cba-4984-a256-c189051e6630",
];

export function isUserAllowedInMaintenance(userId?: string | null): boolean {
  if (!MAINTENANCE_MODE) return true;
  if (!userId) return false;
  return ALLOWED_MAINTENANCE_USER_IDS.includes(userId);
}
