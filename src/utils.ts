import type { Team } from './types'

export function formatMoney(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`
}

/** Converte ISO para o formato aceito por <input type="datetime-local">. */
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

export function localInputToIso(local: string): string {
  const d = new Date(local)
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

/** Mapa rápido código -> time para lookups. */
export function teamMap(teams: Team[]): Map<string, Team> {
  return new Map(teams.map((t) => [t.code, t]))
}

export const UNKNOWN_TEAM: Team = { code: '???', name: 'A definir', flag: '🏳️' }

export function getTeam(
  map: Map<string, Team>,
  code: string | null | undefined,
  label?: string,
): Team {
  if (code && map.has(code)) return map.get(code)!
  if (label) return { code: '???', name: label, flag: '🏳️' }
  return UNKNOWN_TEAM
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Junta classes condicionalmente. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
