/** Strips separators and optional Colombian country code, returning a 10-digit mobile number. */
export function normalizePhone(input: string): string | null {
  if (!input) return null;

  let digits = String(input).replace(/\D/g, '');

  if (digits.startsWith('57') && digits.length === 12) {
    digits = digits.slice(2);
  }

  if (digits.length !== 10) return null;

  return digits;
}

/** Maps a guest type to the gift tier they are allowed to see and reserve. */
export function tierForGuestType(type: 'familia' | 'amigos'): 'costoso' | 'economico' {
  return type === 'familia' ? 'costoso' : 'economico';
}
