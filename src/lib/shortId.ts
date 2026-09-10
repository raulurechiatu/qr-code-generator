const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function randomShortId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  let id = ''
  for (const b of bytes) id += ALPHABET[b % ALPHABET.length]
  return id
}
