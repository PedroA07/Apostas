import { useMemo } from 'react'
import {
  Banknote,
  CalendarClock,
  Crown,
  Medal,
  Target,
  Trophy,
  Users,
} from 'lucide-react'
import { useStore } from '../store/store'
import { computeStandings } from '../store/scoring'
import { Avatar, StatCard } from '../components/ui'
import { Flag } from '../components/Flag'
import { useBet } from '../components/BetModal'
import {
  cx,
  formatDateTime,
  formatMoney,
  getTeam,
  potSummary,
  teamMap,
} from '../utils'
import type { Match } from '../types'

export default function Dashboard({ go }: { go: (tab: string) => void }) {
  const { state } = useStore()
  const { settings, participants, matches, predictions } = state
  const tmap = useMemo(() => teamMap(state.teams), [state.teams])

  const { collected: totalPot, expected: expectedPot, paidCount } = potSummary(
    participants,
    settings,
  )

  const standings = useMemo(
    () => computeStandings(participants, matches, predictions, settings.scoring),
    [participants, matches, predictions, settings.scoring],
  )

  const finishedCount = matches.filter((m) => m.finished).length

  const upcoming = useMemo(() => {
    return [...matches]
      .filter((m) => !m.finished)
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
      .slice(0, 5)
  }, [matches])

  const leader = standings[0]
  const leaderName =
    leader && leader.points > 0
      ? participants.find((p) => p.id === leader.participantId)?.name ?? '—'
      : '—'

  const prizes = useMemo(() => {
    const { first, second, third } = settings.prizeSplit
    return [
      { place: '1º', pct: first, value: (totalPot * first) / 100 },
      { place: '2º', pct: second, value: (totalPot * second) / 100 },
      { place: '3º', pct: third, value: (totalPot * third) / 100 },
    ].filter((p) => p.pct > 0)
  }, [settings.prizeSplit, totalPot])

  return (
    <div className="space-y-5">
      {/* Hero do prêmio */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pitch-700 via-pitch-600 to-emerald-500 p-5 text-white shadow-card sm:p-6">
        <div className="absolute -right-8 -top-8 opacity-10">
          <Trophy size={150} />
        </div>
        <div className="relative">
          <p className="text-sm font-medium text-pitch-50/90">
            Prêmio acumulado
          </p>
          <p className="mt-1 text-4xl font-black tracking-tight sm:text-5xl">
            {formatMoney(totalPot, settings.currency)}
          </p>
          <p className="mt-1 text-sm text-pitch-50/80">
            {paidCount} de {participants.length} pagaram
            {expectedPot > totalPot && (
              <> · previsto {formatMoney(expectedPot, settings.currency)}</>
            )}
          </p>

          {prizes.length > 0 && totalPot > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {prizes.map((p) => (
                <div
                  key={p.place}
                  className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm"
                >
                  <div className="text-xs font-semibold text-pitch-50/80">
                    {p.place} lugar ({p.pct}%)
                  </div>
                  <div className="text-base font-bold">
                    {formatMoney(p.value, settings.currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Participantes"
          value={participants.length}
          sub={`${paidCount} pagaram`}
          icon={<Users size={16} />}
          accent="blue"
        />
        <StatCard
          label="Jogos"
          value={matches.length}
          sub={`${finishedCount} encerrados`}
          icon={<CalendarClock size={16} />}
          accent="violet"
        />
        <StatCard
          label="Líder"
          value={<span className="text-xl">{leaderName}</span>}
          sub={leader && leader.points > 0 ? `${leader.points} pts` : 'sem pontos ainda'}
          icon={<Crown size={16} />}
          accent="gold"
        />
        <StatCard
          label="Valor padrão"
          value={formatMoney(settings.buyIn, settings.currency)}
          sub="por participante"
          icon={<Banknote size={16} />}
          accent="pitch"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Próximos jogos */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-slate-900">
              <CalendarClock size={18} className="text-pitch-600" />
              Próximos jogos
            </h3>
            <button
              onClick={() => go('jogos')}
              className="text-sm font-semibold text-pitch-600 hover:text-pitch-700"
            >
              Ver todos
            </button>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Nenhum jogo agendado.
            </p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((m) => (
                <UpcomingRow key={m.id} match={m} tmap={tmap} />
              ))}
            </div>
          )}
        </div>

        {/* Mini ranking */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-slate-900">
              <Medal size={18} className="text-gold-500" />
              Ranking
            </h3>
            <button
              onClick={() => go('ranking')}
              className="text-sm font-semibold text-pitch-600 hover:text-pitch-700"
            >
              Ver completo
            </button>
          </div>
          {participants.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-400">
                Adicione participantes para começar.
              </p>
              <button
                onClick={() => go('participantes')}
                className="btn-primary mt-3"
              >
                <Users size={16} /> Adicionar amigos
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {standings.slice(0, 5).map((row) => {
                const p = participants.find(
                  (pp) => pp.id === row.participantId,
                )!
                return (
                  <div
                    key={row.participantId}
                    className="flex items-center gap-3 rounded-xl px-2 py-1.5"
                  >
                    <span
                      className={cx(
                        'grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold',
                        row.position === 1
                          ? 'bg-gold-100 text-gold-700'
                          : row.position === 2
                            ? 'bg-slate-200 text-slate-600'
                            : row.position === 3
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-400',
                      )}
                    >
                      {row.position}
                    </span>
                    <Avatar name={p.name} color={p.color} size={28} />
                    <span className="flex-1 truncate text-sm font-semibold text-slate-700">
                      {p.name}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-bold text-slate-900">
                      <Target size={13} className="text-pitch-500" />
                      {row.points}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function UpcomingRow({
  match,
  tmap,
}: {
  match: Match
  tmap: ReturnType<typeof teamMap>
}) {
  const { openBet } = useBet()
  const home = getTeam(tmap, match.homeCode, match.homeLabel)
  const away = getTeam(tmap, match.awayCode, match.awayLabel)
  return (
    <button
      type="button"
      onClick={() => openBet(match.id)}
      title="Palpitar neste jogo"
      className="flex w-full items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-left transition hover:bg-pitch-50 hover:ring-1 hover:ring-pitch-200">
      <div className="flex flex-1 items-center justify-end gap-2 text-right">
        <span className="truncate text-sm font-semibold text-slate-700">
          {home.name}
        </span>
        <Flag emoji={home.flag} name={home.name} size={18} />
      </div>
      <span className="shrink-0 rounded-lg bg-white px-2 py-0.5 text-xs font-bold text-slate-400">
        ×
      </span>
      <div className="flex flex-1 items-center gap-2">
        <Flag emoji={away.flag} name={away.name} size={18} />
        <span className="truncate text-sm font-semibold text-slate-700">
          {away.name}
        </span>
      </div>
      <div className="ml-1 hidden shrink-0 text-right text-[11px] leading-tight text-slate-400 sm:block">
        {formatDateTime(match.kickoff)}
      </div>
    </button>
  )
}
