import type { AppState, Match, PoolSettings } from '../types'
import { TEAMS, GROUPS, GROUP_LETTERS } from './teams'
import { VENUES } from './venues'

export const SCHEMA_VERSION = 1

export const DEFAULT_SETTINGS: PoolSettings = {
  name: 'Bolão da Copa 2026',
  buyIn: 50,
  currency: 'R$',
  scoring: {
    exact: 10,
    result: 5,
    goals: 2,
  },
  prizeSplit: {
    first: 70,
    second: 20,
    third: 10,
  },
}

/** Gera um id curto e único */
export function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
}

/**
 * Gera os 6 jogos de um grupo (todos contra todos).
 * Ordem das rodadas baseada no esquema clássico de 4 times.
 */
function roundRobin(teams: string[]): [string, string][] {
  const [t1, t2, t3, t4] = teams
  return [
    [t1, t2],
    [t3, t4],
    [t1, t3],
    [t4, t2],
    [t4, t1],
    [t2, t3],
  ]
}

/** Gera todos os jogos da fase de grupos a partir do mapa de grupos. */
export function generateGroupMatches(
  groups: Record<string, string[]> = GROUPS,
): Match[] {
  const matches: Match[] = []
  // A fase de grupos da Copa 2026 vai de 11/06 a ~27/06.
  const startDay = new Date('2026-06-11T13:00:00')
  let venueIndex = 0
  let dayOffset = 0

  GROUP_LETTERS.forEach((letter, gi) => {
    const teams = groups[letter]
    if (!teams || teams.length < 4) return
    const pairs = roundRobin(teams)
    pairs.forEach((pair, pi) => {
      const kickoff = new Date(startDay)
      // espalha os jogos pelos dias da fase de grupos
      kickoff.setDate(startDay.getDate() + dayOffset)
      kickoff.setHours(13 + ((gi + pi) % 3) * 3, 0, 0, 0)
      dayOffset = (dayOffset + 1) % 16

      matches.push({
        id: uid('m_'),
        homeCode: pair[0],
        awayCode: pair[1],
        stage: 'grupos',
        group: letter,
        kickoff: kickoff.toISOString(),
        venue: VENUES[venueIndex % VENUES.length],
        homeScore: null,
        awayScore: null,
        finished: false,
      })
      venueIndex++
    })
  })

  return matches
}

export function createInitialState(): AppState {
  return {
    settings: DEFAULT_SETTINGS,
    teams: TEAMS,
    groups: structuredClone(GROUPS),
    participants: [],
    matches: generateGroupMatches(),
    predictions: {},
    version: SCHEMA_VERSION,
  }
}

/** Paleta de cores para identidade visual dos participantes. */
export const AVATAR_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#d946ef',
  '#ec4899',
  '#14b8a6',
]
