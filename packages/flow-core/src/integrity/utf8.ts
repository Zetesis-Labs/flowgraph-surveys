const bytesForCodePoint = (input: number): readonly number[] => {
  const codePoint = input >= 0xd800 && input <= 0xdfff ? 0xfffd : input
  if (codePoint <= 0x7f) return [codePoint]
  if (codePoint <= 0x7ff) {
    return [0xc0 | (codePoint >>> 6), 0x80 | (codePoint & 0x3f)]
  }
  if (codePoint <= 0xffff) {
    return [0xe0 | (codePoint >>> 12), 0x80 | ((codePoint >>> 6) & 0x3f), 0x80 | (codePoint & 0x3f)]
  }
  return [
    0xf0 | (codePoint >>> 18),
    0x80 | ((codePoint >>> 12) & 0x3f),
    0x80 | ((codePoint >>> 6) & 0x3f),
    0x80 | (codePoint & 0x3f),
  ]
}

export const utf8Encode = (value: string): readonly number[] =>
  Array.from(value).flatMap((character) => bytesForCodePoint(character.codePointAt(0) as number))
