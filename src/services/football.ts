// Integração com a API de futebol (via função serverless /api/scores).
// Faz a importação da tabela real e a sincronização automática dos placares.

import type { Match, Stage, Team } from '../types'
import { resolveCountry } from '../data/countries'
import { VENUES } from '../data/venues'
import { uid } from '../data/seed'

/** Jogo no formato normalizado devolvido por /api/scores */
export interface ApiMatch {
  externalId: number
  utcDate: string
  status: string
  stage: string
  group: string | null
  home: { name: string | null; tla: string | null }
  away: { name: string | null; tla: string | null }
  homeScore: number | null
  awayScore: number | null
}

export interface ScoresResponse {
  ok: boolean
  error?: string
  message?: string
  matches: ApiMatch[]
}

/** Busca os jogos na função serverless. Nunca lança — devolve ok:false em erro. */
export async function fetchApiMatches(): Promise<ScoresResponse> {
  try {
    const res = await fetch('/api/scores', { headers: { Accept: 'application/json' } })
    if (!res.ok) {
      return { ok: false, error: `http_${res.status}`, matches: [] }
    }
    const data = (await res.json()) as ScoresResponse
    if (!data || !Array.isArray(data.matches)) {
      return { ok: false, error: 'resposta_invalida', matches: [] }
    }
    return data
  } catch {
    return { ok: false, error: 'sem_conexao', matches: [] }
  }
}

const STAGE_MAP: Record<string, Stage> = {
  GROUP_STAGE: 'grupos',
  LAST_32: '32avos',
  ROUND_OF_32: '32avos',
  LAST_16: 'oitavas',
  ROUND_OF_16: 'oitavas',
  QUARTER_FINALS: 'quartas',
  QUARTER_FINAL: 'quartas',
  SEMI_FINALS: 'semis',
  SEMI_FINAL: 'semis',
  THIRD_PLACE: 'terceiro',
  '3RD_PLACE_FINAL': 'terceiro',
  FINAL: 'final',
}

function mapStage(apiStage: string): Stage {
  return STAGE_MAP[apiStage] ?? 'grupos'
}

function mapGroup(apiGroup: string | null): string | undefined {
  if (!apiGroup) return undefined
  const m = apiGroup.match(/([A-L])\s*$/i)
  return m ? m[1].toUpperCase() : undefined
}

/** Considera o jogo "encerrado" quando a API marca como finalizado. */
function isFinished(status: string): boolean {
  return status === 'FINISHED' || status === 'AWARDED'
}

interface ResolveResult {
  code: string | null
  label?: string
}

/**
 * Resolve o time da API para um código do app, criando o time se necessário.
 * `teamsByCode` é mutado para acumular times novos.
 */
function resolveApiTeam(
  apiTeam: { name: string | null; tla: string | null },
  teamsByCode: Map<string, Team>,
): ResolveResult {
  // sem time definido ainda (mata-mata por definir)
  if (!apiTeam.name && !apiTeam.tla) return { code: null }

  const country = resolveCountry(apiTeam.name, apiTeam.tla)
  if (country) {
    if (!teamsByCode.has(country.code)) {
      teamsByCode.set(country.code, {
        code: country.code,
        name: country.name,
        flag: country.flag,
      })
    }
    return { code: country.code }
  }

  // não reconhecido: cria com a sigla disponível e bandeira branca
  const code = (apiTeam.tla || apiTeam.name || '???').toUpperCase().slice(0, 6)
  if (!teamsByCode.has(code)) {
    teamsByCode.set(code, {
      code,
      name: apiTeam.name ?? code,
      flag: '🏳️',
    })
  }
  return { code }
}

export interface ImportResult {
  teams: Team[]
  groups: Record<string, string[]>
  matches: Match[]
  count: number
}

/**
 * Constrói times, grupos e jogos a partir dos dados da API.
 * Mantém os times atuais e adiciona os que faltarem.
 */
export function buildScheduleFromApi(
  apiMatches: ApiMatch[],
  currentTeams: Team[],
): ImportResult {
  const teamsByCode = new Map<string, Team>(
    currentTeams.map((t) => [t.code, t]),
  )
  const groups: Record<string, string[]> = {}
  const matches: Match[] = []

  const sorted = [...apiMatches].sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
  )

  sorted.forEach((m, i) => {
    const home = resolveApiTeam(m.home, teamsByCode)
    const away = resolveApiTeam(m.away, teamsByCode)
    const stage = mapStage(m.stage)
    const group = stage === 'grupos' ? mapGroup(m.group) : undefined

    if (group && home.code) {
      groups[group] = groups[group] ?? []
      if (!groups[group].includes(home.code)) groups[group].push(home.code)
    }
    if (group && away.code) {
      groups[group] = groups[group] ?? []
      if (!groups[group].includes(away.code)) groups[group].push(away.code)
    }

    const finished = isFinished(m.status)
    matches.push({
      id: uid('m_'),
      externalId: m.externalId,
      homeCode: home.code,
      awayCode: away.code,
      homeLabel: home.code ? undefined : m.home.name ?? undefined,
      awayLabel: away.code ? undefined : m.away.name ?? undefined,
      stage,
      group,
      kickoff: m.utcDate,
      venue: VENUES[i % VENUES.length],
      homeScore: finished ? m.homeScore : null,
      awayScore: finished ? m.awayScore : null,
      finished,
    })
  })

  return {
    teams: [...teamsByCode.values()],
    groups,
    matches,
    count: matches.length,
  }
}

export interface SyncResult {
  matches: Match[]
  updated: number
}

/**
 * Aplica os placares da API aos jogos atuais, casando por externalId.
 * Só altera jogos finalizados na API; preserva o resto (e os palpites).
 */
export function applyApiScores(
  apiMatches: ApiMatch[],
  currentMatches: Match[],
): SyncResult {
  const byId = new Map<number, ApiMatch>()
  for (const m of apiMatches) byId.set(m.externalId, m)

  let updated = 0
  const matches = currentMatches.map((match) => {
    if (match.externalId == null) return match
    const api = byId.get(match.externalId)
    if (!api || !isFinished(api.status)) return match
    if (api.homeScore == null || api.awayScore == null) return match
    // já está igual? não conta como atualização
    if (
      match.finished &&
      match.homeScore === api.homeScore &&
      match.awayScore === api.awayScore
    ) {
      return match
    }
    updated++
    return {
      ...match,
      homeScore: api.homeScore,
      awayScore: api.awayScore,
      finished: true,
    }
  })

  return { matches, updated }
}
