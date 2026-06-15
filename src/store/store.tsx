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

/** Garante que todos os campos (inclusive os novos) existam, mesclando com os padrões. */
function normalizeState(parsed: Partial<AppState>): AppState {
  const base = createInitialState()
  const settings = parsed.settings ?? base.settings
  return {
    ...base,
    ...parsed,
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
  /** Cria outro palpite (bilhete) para a mesma pessoa, copiando nome/cor/Pix. */
  duplicateParticipant: (id: string) => void
  // teams & groups
  setTeams: (teams: Team[]) => void
  setGroups: (groups: Record<string, string[]>) => void
  regenerateGroupMatches: (groups: Record<string, string[]>) => void
  // matches
  addMatch: (match: Omit<Match, 'id'>) => void
  updateMatch: (id: string, patch: Partial<Match>) => void
  removeMatch: (id: string) => void
  setResult: (id: string, home: number | null, away: number | null) => void
  // predictions
  setPrediction: (
    participantId: string,
    matchId: string,
    home: number,
    away: number,
  ) => void
  getPrediction: (
    participantId: string,
    matchId: string,
  ) => Prediction | undefined
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
        const validExternal = new Set(
          data.matches.map((m) => m.externalId).filter((x) => x != null),
        )
        const oldById = new Map(s.matches.map((m) => [m.id, m]))
        const predictions: Record<string, Prediction> = {}
        for (const pred of Object.values(s.predictions)) {
          const old = oldById.get(pred.matchId)
          if (old?.externalId != null && validExternal.has(old.externalId)) {
            // re-mapeia o palpite para o novo id do mesmo jogo
            const novo = data.matches.find(
              (m) => m.externalId === old.externalId,
            )
            if (novo) {
              predictions[`${pred.participantId}:${novo.id}`] = {
                ...pred,
                matchId: novo.id,
              }
            }
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

  const duplicateParticipant = useCallback((id: string) => {
    setState((s) => {
      const original = s.participants.find((p) => p.id === id)
      if (!original) return s
      // nome base sem sufixo " (n)" e próximo número livre
      const base = original.name.replace(/\s*\(\d+\)\s*$/, '').trim()
      let n = 2
      const taken = new Set(s.participants.map((p) => p.name))
      while (taken.has(`${base} (${n})`)) n++
      const copy: Participant = {
        id: uid('p_'),
        name: `${base} (${n})`,
        color: original.color,
        paid: false,
        betValue: original.betValue,
        pixKey: original.pixKey,
        createdAt: Date.now(),
      }
      return { ...s, participants: [...s.participants, copy] }
    })
  }, [])

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
        const predictions: Record<string, Prediction> = {}
        for (const [key, pred] of Object.entries(s.predictions)) {
          if (validIds.has(pred.matchId)) predictions[key] = pred
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

  const setPrediction = useCallback(
    (participantId: string, matchId: string, home: number, away: number) => {
      setState((s) => ({
        ...s,
        predictions: {
          ...s.predictions,
          [predKey(participantId, matchId)]: {
            participantId,
            matchId,
            homeScore: home,
            awayScore: away,
            updatedAt: Date.now(),
          },
        },
      }))
    },
    [],
  )

  const getPrediction = useCallback(
    (participantId: string, matchId: string) =>
      state.predictions[predKey(participantId, matchId)],
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
      duplicateParticipant,
      setTeams,
      setGroups,
      regenerateGroupMatches,
      addMatch,
      updateMatch,
      removeMatch,
      setResult,
      setPrediction,
      getPrediction,
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
      duplicateParticipant,
      setTeams,
      setGroups,
      regenerateGroupMatches,
      addMatch,
      updateMatch,
      removeMatch,
      setResult,
      setPrediction,
      getPrediction,
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
