const VND_FORMATTER = new Intl.NumberFormat('vi-VN')

export function formatVnd(amount: number): string {
  return `${VND_FORMATTER.format(Math.round(amount))} ₫`
}

export function formatVndCompact(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) return `${trimZero(amount / 1_000_000)} tr`
  if (abs >= 1_000) return `${trimZero(amount / 1_000)}k`
  return String(Math.round(amount))
}

export function parseAmount(input: string): number {
  const digits = input.replace(/[^\d]/g, '')
  return digits ? Number.parseInt(digits, 10) : 0
}

export function groupDigits(value: number): string {
  return VND_FORMATTER.format(Math.round(value))
}

function trimZero(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '')
}
