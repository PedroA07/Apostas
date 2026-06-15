import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppState,
  Match,
  Participant,
  PoolSettings,
  Prediction,
  Stage,
  Team,
} from '../types'
import {
  AVATAR_COLORS,
  SCHEMA_VERSION,
  createInitialState,
  generateGroupMatches,
  uid,
} from '../data/seed'

const STORAGE_KEY = 'bolao-copa-2026'

/**
 * Migra os palpites do formato antigo (um objeto por jogo) para o novo
 * (lista de palpites por jogo) e garante que cada palpite tenha id.
 */
function migratePredictions(raw: unknown): Record<string, Prediction[]> {
  const out: Record<string, Prediction[]> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    const arr = Array.isArray(val) ? val : val ? [val] : []
    const list = arr
      .filter((pr): pr is Record<string, unknown> => !!pr && typeof pr === 'object')
      .map((pr) => ({
        id: typeof pr.id === 'string' ? pr.id : uid('g_'),
        participantId: String(pr.participantId ?? ''),
        matchId: String(pr.matchId ?? ''),
        homeScore: Number(pr.homeScore ?? 0),
        awayScore: Number(pr.awayScore ?? 0),
        updatedAt: typeof pr.updatedAt === 'number' ? pr.updatedAt : Date.now(),
      }))
    if (list.length > 0) out[key] = list
  }
  return out
}

/** Garante que todos os campos (inclusive os novos) existam, mesclando com os padrões. */
function normalizeState(parsed: Partial<AppState>): AppState {
  const base = createInitialState()
  const settings = parsed.settings ?? base.settings
  return {
    ...base,
    ...parsed,
    predictions: migratePredictions(parsed.predictions),
    settings: {
      ...base.settings,
      ...settings,
      scoring: { ...base.settings.scoring, ...settings.scoring },
      prizeSplit: { ...base.settings.prizeSplit, ...settings.prizeSplit },
      autoUpdate: { ...base.settings.autoUpdate, ...settings.autoUpdate },
    },
    version: SCHEMA_VERSION,
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    return normalizeState(JSON.parse(raw) as Partial<AppState>)
  } catch {
    return createInitialState()
  }
}

function predKey(participantId: string, matchId: string) {
  return `${participantId}:${matchId}`
}

interface StoreContextValue {
  state: AppState
  // settings
  updateSettings: (patch: Partial<PoolSettings>) => void
  setAutoUpdate: (patch: Partial<AppState['settings']['autoUpdate']>) => void
  // integração com a API de futebol
  importSchedule: (data: {
    teams: Team[]
    groups: Record<string, string[]>
    matches: Match[]
  }) => void
  setMatches: (matches: Match[]) => void
  // participants
  addParticipant: (name: string, betValue?: number, pixKey?: string) => void
  updateParticipant: (id: string, patch: Partial<Participant>) => void
  removeParticipant: (id: string) => void
  togglePaid: (id: string) => void
  // teams & groups
  setTeams: (teams: Team[]) => void
  setGroups: (groups: Record<string, string[]>) => void
  regenerateGroupMatches: (groups: Record<string, string[]>) => void
  // matches
  addMatch: (match: Omit<Match, 'id'>) => void
  updateMatch: (id: string, patch: Partial<Match>) => void
  removeMatch: (id: string) => void
  setResult: (id: string, home: number | null, away: number | null) => void
  // predictions (vários por jogo)
  addPrediction: (
    participantId: string,
    matchId: string,
    home: number,
    away: number,
  ) => void
  updatePrediction: (
    participantId: string,
    matchId: string,
    predId: string,
    home: number,
    away: number,
  ) => void
  removePrediction: (
    participantId: string,
    matchId: string,
    predId: string,
  ) => void
  getPredictions: (participantId: string, matchId: string) => Prediction[]
  // data management
  exportData: () => void
  importData: (json: string) => boolean
  resetAll: () => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)
  const saveTimer = useRef<number | undefined>(undefined)

  // persiste no localStorage (com debounce leve)
  useEffect(() => {
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        /* armazenamento cheio ou indisponível */
      }
    }, 200)
    return () => window.clearTimeout(saveTimer.current)
  }, [state])

  const updateSettings = useCallback((patch: Partial<PoolSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }, [])

  const setAutoUpdate = useCallback(
    (patch: Partial<AppState['settings']['autoUpdate']>) => {
      setState((s) => ({
        ...s,
        settings: {
          ...s.settings,
          autoUpdate: { ...s.settings.autoUpdate, ...patch },
        },
      }))
    },
    [],
  )

  const importSchedule = useCallback(
    (data: {
      teams: Team[]
      groups: Record<string, string[]>
      matches: Match[]
    }) => {
      setState((s) => {
        // mantém apenas palpites de jogos que ainda existem (por externalId)
        const oldById = new Map(s.matches.map((m) => [m.id, m]))
        const byExternal = new Map<number, Match>()
        for (const m of data.matches) {
          if (m.externalId != null) byExternal.set(m.externalId, m)
        }
        const predictions: Record<string, Prediction[]> = {}
        for (const list of Object.values(s.predictions)) {
          for (const pred of list) {
            const old = oldById.get(pred.matchId)
            const novo =
              old?.externalId != null ? byExternal.get(old.externalId) : undefined
            if (!novo) continue
            // re-mapeia o palpite para o novo id do mesmo jogo
            const key = `${pred.participantId}:${novo.id}`
            ;(predictions[key] ??= []).push({ ...pred, matchId: novo.id })
          }
        }
        return {
          ...s,
          teams: data.teams,
          groups: data.groups,
          matches: data.matches,
          predictions,
        }
      })
    },
    [],
  )

  const setMatches = useCallback((matches: Match[]) => {
    setState((s) => ({ ...s, matches }))
  }, [])

  const addParticipant = useCallback(
    (name: string, betValue?: number, pixKey?: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      setState((s) => {
        const color = AVATAR_COLORS[s.participants.length % AVATAR_COLORS.length]
        const participant: Participant = {
          id: uid('p_'),
          name: trimmed,
          color,
          paid: false,
          betValue:
            betValue != null && !Number.isNaN(betValue) ? betValue : undefined,
          pixKey: pixKey?.trim() ? pixKey.trim() : undefined,
          createdAt: Date.now(),
        }
        return { ...s, participants: [...s.participants, participant] }
      })
    },
    [],
  )

  const updateParticipant = useCallback(
    (id: string, patch: Partial<Participant>) => {
      setState((s) => ({
        ...s,
        participants: s.participants.map((p) =>
          p.id === id ? { ...p, ...patch } : p,
        ),
      }))
    },
    [],
  )

  const removeParticipant = useCallback((id: string) => {
    setState((s) => {
      const predictions = { ...s.predictions }
      for (const key of Object.keys(predictions)) {
        if (key.startsWith(`${id}:`)) delete predictions[key]
      }
      return {
        ...s,
        participants: s.participants.filter((p) => p.id !== id),
        predictions,
      }
    })
  }, [])

  const togglePaid = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      participants: s.participants.map((p) =>
        p.id === id ? { ...p, paid: !p.paid } : p,
      ),
    }))
  }, [])

  const setTeams = useCallback((teams: Team[]) => {
    setState((s) => ({ ...s, teams }))
  }, [])

  const setGroups = useCallback((groups: Record<string, string[]>) => {
    setState((s) => ({ ...s, groups }))
  }, [])

  const regenerateGroupMatches = useCallback(
    (groups: Record<string, string[]>) => {
      setState((s) => {
        // mantém jogos de mata-mata, regenera apenas fase de grupos
        const knockout = s.matches.filter((m) => m.stage !== 'grupos')
        const newGroupMatches = generateGroupMatches(groups)
        // limpa palpites/placares órfãos da fase de grupos
        const validIds = new Set([
          ...knockout.map((m) => m.id),
          ...newGroupMatches.map((m) => m.id),
        ])
        const predictions: Record<string, Prediction[]> = {}
        for (const [key, list] of Object.entries(s.predictions)) {
          const kept = list.filter((p) => validIds.has(p.matchId))
          if (kept.length > 0) predictions[key] = kept
        }
        return {
          ...s,
          groups,
          matches: [...newGroupMatches, ...knockout],
          predictions,
        }
      })
    },
    [],
  )

  const addMatch = useCallback((match: Omit<Match, 'id'>) => {
    setState((s) => ({
      ...s,
      matches: [...s.matches, { ...match, id: uid('m_') }],
    }))
  }, [])

  const updateMatch = useCallback((id: string, patch: Partial<Match>) => {
    setState((s) => ({
      ...s,
      matches: s.matches.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }))
  }, [])

  const removeMatch = useCallback((id: string) => {
    setState((s) => {
      const predictions = { ...s.predictions }
      for (const key of Object.keys(predictions)) {
        if (key.endsWith(`:${id}`)) delete predictions[key]
      }
      return {
        ...s,
        matches: s.matches.filter((m) => m.id !== id),
        predictions,
      }
    })
  }, [])

  const setResult = useCallback(
    (id: string, home: number | null, away: number | null) => {
      setState((s) => ({
        ...s,
        matches: s.matches.map((m) =>
          m.id === id
            ? {
                ...m,
                homeScore: home,
                awayScore: away,
                finished: home !== null && away !== null,
              }
            : m,
        ),
      }))
    },
    [],
  )

  const addPrediction = useCallback(
    (participantId: string, matchId: string, home: number, away: number) => {
      setState((s) => {
        const key = predKey(participantId, matchId)
        const list = s.predictions[key] ?? []
        const pred: Prediction = {
          id: uid('g_'),
          participantId,
          matchId,
          homeScore: home,
          awayScore: away,
          updatedAt: Date.now(),
        }
        return {
          ...s,
          predictions: { ...s.predictions, [key]: [...list, pred] },
        }
      })
    },
    [],
  )

  const updatePrediction = useCallback(
    (
      participantId: string,
      matchId: string,
      predId: string,
      home: number,
      away: number,
    ) => {
      setState((s) => {
        const key = predKey(participantId, matchId)
        const list = s.predictions[key]
        if (!list) return s
        return {
          ...s,
          predictions: {
            ...s.predictions,
            [key]: list.map((p) =>
              p.id === predId
                ? { ...p, homeScore: home, awayScore: away, updatedAt: Date.now() }
                : p,
            ),
          },
        }
      })
    },
    [],
  )

  const removePrediction = useCallback(
    (participantId: string, matchId: string, predId: string) => {
      setState((s) => {
        const key = predKey(participantId, matchId)
        const list = s.predictions[key]
        if (!list) return s
        const next = list.filter((p) => p.id !== predId)
        const predictions = { ...s.predictions }
        if (next.length === 0) delete predictions[key]
        else predictions[key] = next
        return { ...s, predictions }
      })
    },
    [],
  )

  const getPredictions = useCallback(
    (participantId: string, matchId: string): Prediction[] =>
      state.predictions[predKey(participantId, matchId)] ?? [],
    [state.predictions],
  )

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `bolao-copa-2026-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [state])

  const importData = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as Partial<AppState>
      if (!parsed.matches || !parsed.settings) return false
      setState(normalizeState(parsed))
      return true
    } catch {
      return false
    }
  }, [])

  const resetAll = useCallback(() => {
    setState(createInitialState())
  }, [])

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      updateSettings,
      setAutoUpdate,
      importSchedule,
      setMatches,
      addParticipant,
      updateParticipant,
      removeParticipant,
      togglePaid,
      setTeams,
      setGroups,
      regenerateGroupMatches,
      addMatch,
      updateMatch,
      removeMatch,
      setResult,
      addPrediction,
      updatePrediction,
      removePrediction,
      getPredictions,
      exportData,
      importData,
      resetAll,
    }),
    [
      state,
      updateSettings,
      setAutoUpdate,
      importSchedule,
      setMatches,
      addParticipant,
      updateParticipant,
      removeParticipant,
      togglePaid,
      setTeams,
      setGroups,
      regenerateGroupMatches,
      addMatch,
      updateMatch,
      removeMatch,
      setResult,
      addPrediction,
      updatePrediction,
      removePrediction,
      getPredictions,
      exportData,
      importData,
      resetAll,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore deve ser usado dentro de StoreProvider')
  return ctx
}

// ===== Helpers de domínio =====

export const STAGE_LABELS: Record<Stage, string> = {
  grupos: 'Fase de Grupos',
  '32avos': '32 avos de final',
  oitavas: 'Oitavas de final',
  quartas: 'Quartas de final',
  semis: 'Semifinais',
  terceiro: 'Disputa de 3º lugar',
  final: 'Final',
}

export const STAGE_ORDER: Stage[] = [
  'grupos',
  '32avos',
  'oitavas',
  'quartas',
  'semis',
  'terceiro',
  'final',
]
