import crypto from "node:crypto";

// Base32 sem 0/O/I/L pra evitar ambiguidade visual.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateVerificationCode(): string {
  const buf = crypto.randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return `EC-${out}`;
}

export const VERIFICATION_CODE_REGEX = /^EC-[A-Z2-9]{8}$/;
