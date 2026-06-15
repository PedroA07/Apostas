import { useMemo } from 'react'
import { Crown, Medal, Target, TrendingUp, Trophy, Users } from 'lucide-react'
import { useStore } from '../store/store'
import { computeStandings } from '../store/scoring'
import { Avatar, EmptyState, SectionTitle } from '../components/ui'
import { cx, formatMoney, potSummary } from '../utils'

export default function RankingView() {
  const { state } = useStore()
  const { participants, matches, predictions, settings } = state

  const standings = useMemo(
    () => computeStandings(participants, matches, predictions, settings.scoring),
    [participants, matches, predictions, settings.scoring],
  )

  const { collected: totalPot } = potSummary(participants, settings)
  const prizeFor = (i: number): number => {
    const { first, second, third } = settings.prizeSplit
    const pct = i === 0 ? first : i === 1 ? second : i === 2 ? third : 0
    return (totalPot * pct) / 100
  }

  if (participants.length === 0) {
    return (
      <div className="space-y-5">
        <SectionTitle
          icon={<Trophy size={20} />}
          title="Ranking"
          subtitle="Classificação geral do bolão"
        />
        <EmptyState
          icon={<Users size={28} />}
          title="Sem participantes"
          description="Cadastre os amigos e registre os palpites para ver o ranking ganhar vida."
        />
      </div>
    )
  }

  const top3 = standings.slice(0, 3)
  const rest = standings.slice(3)
  const podiumOrder = [1, 0, 2] // 2º, 1º, 3º para o pódio

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={<Trophy size={20} />}
        title="Ranking"
        subtitle="Classificação geral e premiação"
      />

      {/* Pódio */}
      {top3.some((r) => r.points > 0) && (
        <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
          {podiumOrder.map((idx) => {
            const row = top3[idx]
            if (!row) return <div key={idx} />
            const p = participants.find((pp) => pp.id === row.participantId)!
            const heights = ['h-24', 'h-32', 'h-20']
            const place = idx
            return (
              <div key={row.participantId} className="flex flex-col items-center">
                <div className="relative mb-2">
                  <Avatar name={p.name} color={p.color} size={place === 0 ? 64 : 52} />
                  {place === 0 && (
                    <Crown
                      className="absolute -top-3 left-1/2 -translate-x-1/2 text-gold-500"
                      size={22}
                      fill="currentColor"
                    />
                  )}
                </div>
                <div className="text-center">
                  <div className="truncate text-sm font-bold text-slate-900">
                    {p.name}
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    {row.points} pts
                  </div>
                </div>
                <div
                  className={cx(
                    'mt-2 flex w-full flex-col items-center justify-start rounded-t-xl pt-2 text-white',
                    heights[place],
                    place === 0
                      ? 'bg-gradient-to-b from-gold-400 to-gold-500'
                      : place === 1
                        ? 'bg-gradient-to-b from-slate-300 to-slate-400'
                        : 'bg-gradient-to-b from-orange-300 to-orange-400',
                  )}
                >
                  <span className="text-2xl font-black">{place + 1}º</span>
                  {prizeFor(place) > 0 && (
                    <span className="mt-1 px-1 text-center text-[11px] font-bold leading-tight">
                      {formatMoney(prizeFor(place), settings.currency)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabela completa */}
      <div className="card overflow-hidden">
        <div className="hidden grid-cols-[2.5rem_1fr_repeat(4,3.5rem)] gap-2 border-b border-slate-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 sm:grid">
          <span className="text-center">#</span>
          <span>Participante</span>
          <span className="text-center" title="Placares exatos">
            Exatos
          </span>
          <span className="text-center" title="Acertos de resultado">
            Result.
          </span>
          <span className="text-center" title="Jogos pontuados">
            Jogos
          </span>
          <span className="text-center">Pontos</span>
        </div>

        <div className="divide-y divide-slate-50">
          {standings.map((row, i) => {
            const p = participants.find((pp) => pp.id === row.participantId)!
            const prize = prizeFor(i)
            return (
              <div
                key={row.participantId}
                className={cx(
                  'flex items-center gap-3 px-4 py-3 sm:grid sm:grid-cols-[2.5rem_1fr_repeat(4,3.5rem)] sm:gap-2',
                  i < 3 && 'bg-gradient-to-r from-transparent to-transparent',
                )}
              >
                <div className="flex items-center justify-center">
                  <span
                    className={cx(
                      'grid h-7 w-7 place-items-center rounded-full text-xs font-bold',
                      i === 0
                        ? 'bg-gold-100 text-gold-700'
                        : i === 1
                          ? 'bg-slate-200 text-slate-600'
                          : i === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-50 text-slate-400',
                    )}
                  >
                    {i + 1}
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Avatar name={p.name} color={p.color} size={32} />
                  <div className="min-w-0">
                    <div className="truncate font-bold text-slate-900">
                      {p.name}
                    </div>
                    {prize > 0 && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-gold-600">
                        <Medal size={11} />
                        {formatMoney(prize, settings.currency)}
                      </div>
                    )}
                    {/* métricas em telas pequenas */}
                    <div className="mt-0.5 flex gap-3 text-[11px] text-slate-400 sm:hidden">
                      <span>{row.exacts} exatos</span>
                      <span>{row.results} result.</span>
                      <span>{row.played} jogos</span>
                    </div>
                  </div>
                </div>

                <span className="hidden text-center text-sm font-semibold text-slate-600 sm:block">
                  {row.exacts}
                </span>
                <span className="hidden text-center text-sm font-semibold text-slate-600 sm:block">
                  {row.results}
                </span>
                <span className="hidden text-center text-sm font-semibold text-slate-600 sm:block">
                  {row.played}
                </span>
                <span className="flex items-center justify-end gap-1 sm:justify-center">
                  <Target size={13} className="text-pitch-500 sm:hidden" />
                  <span className="text-lg font-black text-slate-900">
                    {row.points}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        <TrendingUp size={13} />
        Pontos: placar exato = {settings.scoring.exact}, resultado certo ={' '}
        {settings.scoring.result}, gols de um time = +{settings.scoring.goals}
      </p>

      {rest.length === 0 && standings.every((r) => r.points === 0) && (
        <p className="text-center text-sm text-slate-400">
          Os pontos aparecem assim que você lançar os resultados dos jogos.
        </p>
      )}
    </div>
  )
}
