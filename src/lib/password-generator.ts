/**
 * Meaningful pronounceable password generator.
 *
 * Generates passwords using alternating consonant-vowel (CV) syllable patterns.
 * The result is pronounceable, memorable, and meets complexity requirements:
 *   - Uppercase letter (first char)
 *   - Lowercase letters (syllable body)
 *   - At least one digit
 *   - At least one special character
 *
 * Example outputs (length 12): "Baxo7Kemi@2x", "Tiru3Pova#9m"
 *
 * Uses crypto.getRandomValues() for cryptographically secure randomness,
 * making collisions statistically negligible even within large organisations.
 */

const CONSONANTS = "bcdfghjklmnprstvwxz";
const VOWELS = "aeiou";
const DIGITS = "23456789"; // exclude 0 and 1 (visually ambiguous)
const SYMBOLS = "@#$!%&*";

/**
 * Pick a cryptographically random item from a string or array.
 */
function pick(chars: string): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return chars[array[0] % chars.length];
}

/**
 * Generate a pronounceable password of the given length.
 *
 * Structure:
 *   - Syllables fill the bulk of the password (consonant + vowel pairs)
 *   - One digit is injected after the 2nd syllable
 *   - One symbol is injected after the 4th syllable (or at the end)
 *   - First character is uppercased
 *   - Remaining length is filled with more syllables
 *
 * @param length - Desired password length (min 8, max 32). Defaults to 12.
 */
export function generateMeaningfulPassword(length: number = 12): string {
  const clampedLength = Math.max(8, Math.min(32, length));

  // We need at least 1 digit and 1 symbol in the output.
  // Reserve 2 positions for them; fill the rest with syllables.
  const syllableLength = clampedLength - 2;

  const chars: string[] = [];

  // Build syllable body
  for (let i = 0; i < syllableLength; i++) {
    chars.push(i % 2 === 0 ? pick(CONSONANTS) : pick(VOWELS));
  }

  // Inject digit at position 4 (after 2 syllables), or at end if too short
  const digitPos = Math.min(4, syllableLength - 1);
  chars.splice(digitPos, 0, pick(DIGITS));

  // Inject symbol at position 8 (after 4 syllables), or at end if too short
  const symbolPos = Math.min(8, chars.length);
  chars.splice(symbolPos, 0, pick(SYMBOLS));

  // Trim to exact length (splice may have added 1 extra)
  while (chars.length > clampedLength) chars.pop();

  // Uppercase the first character
  chars[0] = chars[0].toUpperCase();

  return chars.join("");
}

/**
 * Calculate password strength score (0–4) and label.
 * Used for the strength meter in the UI.
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  textColor: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[@#$!%&*^()_\-+=]/.test(password)) score++;

  // Normalise to 0–4
  const normalised = Math.min(4, score);

  const map = [
    { label: "Very weak", color: "bg-destructive", textColor: "text-destructive" },
    { label: "Weak",      color: "bg-destructive", textColor: "text-destructive" },
    { label: "Fair",      color: "bg-yellow-500",  textColor: "text-yellow-500"  },
    { label: "Good",      color: "bg-blue-500",    textColor: "text-blue-500"    },
    { label: "Strong",    color: "bg-green-500",   textColor: "text-green-500"   },
  ];

  return { score: normalised, ...map[normalised] };
}
