import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CalendarClock, MapPin, Users } from 'lucide-react'
import { useStore } from '../store/store'
import { Modal, Avatar, EmptyState } from './ui'
import { TeamPill } from './TeamPill'
import { PalpiteList } from './PalpiteList'
import { formatDateTime, getTeam, teamMap } from '../utils'

interface BetContextValue {
  /** Abre o modal de palpites para um jogo. */
  openBet: (matchId: string) => void
}

const BetContext = createContext<BetContextValue>({ openBet: () => {} })

export function useBet(): BetContextValue {
  return useContext(BetContext)
}

export function BetModalProvider({ children }: { children: ReactNode }) {
  const [matchId, setMatchId] = useState<string | null>(null)
  const openBet = useCallback((id: string) => setMatchId(id), [])
  const close = useCallback(() => setMatchId(null), [])

  return (
    <BetContext.Provider value={{ openBet }}>
      {children}
      {matchId && <BetModalContent matchId={matchId} onClose={close} />}
    </BetContext.Provider>
  )
}

function BetModalContent({
  matchId,
  onClose,
}: {
  matchId: string
  onClose: () => void
}) {
  const { state } = useStore()
  const tmap = useMemo(() => teamMap(state.teams), [state.teams])
  const match = state.matches.find((m) => m.id === matchId)

  if (!match) {
    return (
      <Modal open onClose={onClose} title="Palpites do jogo">
        <p className="py-6 text-center text-sm text-slate-400">
          Este jogo não existe mais.
        </p>
      </Modal>
    )
  }

  const home = getTeam(tmap, match.homeCode, match.homeLabel)
  const away = getTeam(tmap, match.awayCode, match.awayLabel)

  return (
    <Modal open onClose={onClose} title="Palpites do jogo">
      {/* Cabeçalho do jogo */}
      <div className="mb-4 rounded-xl bg-slate-50 p-3">
        <div className="flex items-center justify-center gap-3">
          <TeamPill team={home} align="right" className="flex-1" strong />
          <div className="shrink-0 text-center">
            {match.finished ? (
              <div className="rounded-lg bg-slate-900 px-2.5 py-1 text-lg font-black text-white">
                {match.homeScore} × {match.awayScore}
              </div>
            ) : (
              <div className="text-lg font-bold text-slate-300">×</div>
            )}
          </div>
          <TeamPill team={away} className="flex-1" strong />
        </div>
        <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <CalendarClock size={11} /> {formatDateTime(match.kickoff)}
          </span>
          {match.venue && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {match.venue.split(' — ')[0]}
            </span>
          )}
        </div>
      </div>

      {/* Palpites por participante */}
      {state.participants.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="Sem participantes"
          description="Cadastre os amigos na aba Amigos para poderem palpitar neste jogo."
        />
      ) : (
        <div className="space-y-3">
          {state.participants.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-slate-200 p-3"
            >
              <div className="flex items-center gap-2">
                <Avatar name={p.name} color={p.color} size={28} />
                <span className="truncate text-sm font-bold text-slate-800">
                  {p.name}
                </span>
              </div>
              <PalpiteList
                participantId={p.id}
                matchId={match.id}
                match={match}
                rules={state.settings.scoring}
              />
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
