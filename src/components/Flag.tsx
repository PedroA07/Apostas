import { cx } from '../utils'

/**
 * Converte uma bandeira em emoji para o código usado pela CDN flagcdn:
 * - pares de indicadores regionais (🇧🇷) -> "br"
 * - sequências de subdivisão (🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra) -> "gb-eng"
 * Retorna null quando não dá para converter (ex.: 🏳️).
 */
function emojiToFlagCode(emoji: string): string | null {
  const cps = [...emoji].map((c) => c.codePointAt(0) ?? 0)
  const ri = cps.filter((cp) => cp >= 0x1f1e6 && cp <= 0x1f1ff)
  if (ri.length === 2) {
    return ri.map((cp) => String.fromCharCode(cp - 0x1f1e6 + 0x61)).join('')
  }
  if (cps[0] === 0x1f3f4) {
    const tags = cps
      .slice(1)
      .filter((cp) => cp >= 0xe0061 && cp <= 0xe007a)
      .map((cp) => String.fromCharCode(cp - 0xe0061 + 0x61))
      .join('')
    if (tags.length >= 4) return `${tags.slice(0, 2)}-${tags.slice(2)}`
  }
  return null
}

/**
 * Mostra a bandeira do país como IMAGEM (funciona em qualquer sistema,
 * inclusive Windows, que não renderiza emoji de bandeira).
 * Cai no emoji apenas quando não há código de país (ex.: "a definir").
 */
export function Flag({
  emoji,
  name,
  size = 16,
  className,
}: {
  emoji: string
  name?: string
  size?: number
  className?: string
}) {
  const code = emojiToFlagCode(emoji)
  if (!code) {
    return (
      <span
        className={cx('inline-block leading-none', className)}
        style={{ fontSize: size }}
        aria-hidden
      >
        {emoji}
      </span>
    )
  }
  const width = Math.round(size * 1.4)
  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt={name ? `Bandeira: ${name}` : ''}
      loading="lazy"
      width={width}
      height={size}
      className={cx(
        'inline-block shrink-0 rounded-[3px] object-cover ring-1 ring-black/10',
        className,
      )}
      style={{ width, height: size }}
    />
  )
}
