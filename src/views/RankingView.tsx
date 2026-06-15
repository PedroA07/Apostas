import { useMemo } from 'react'
import {
  Crown,
  Medal,
  PartyPopper,
  QrCode,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { useStore } from '../store/store'
import { computeStandings, type StandingRow } from '../store/scoring'
import { Avatar, CopyButton, EmptyState, SectionTitle } from '../components/ui'
import { cx, formatMoney, potSummary } from '../utils'

export default function RankingView() {
  const { state } = useStore()
  const { participants, matches, predictions, settings } = state

  const standings = useMemo(
    () => computeStandings(participants, matches, predictions, settings.scoring),
    [participants, matches, predictions, settings.scoring],
  )

  const { collected: totalPot } = potSummary(participants, settings)
  const pcts = [
    settings.prizeSplit.first,
    settings.prizeSplit.second,
    settings.prizeSplit.third,
  ]

  // prêmio de uma posição, dividindo entre empatados (e somando as faixas que o grupo ocupa)
  const prizeForRow = (row: StandingRow): number => {
    if (row.position > 3) return 0
    const tied = standings.filter((r) => r.position === row.position)
    const startIdx = row.position - 1
    let sumPct = 0
    for (let k = 0; k < tied.length; k++) sumPct += pcts[startIdx + k] ?? 0
    return (totalPot * sumPct) / 100 / tied.length
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
  const podiumOrder = [1, 0, 2] // 2º, 1º, 3º para o pódio

  // campeão(ões) — pode haver empate na liderança
  const allFinished = matches.length > 0 && matches.every((m) => m.finished)
  const leaders = standings.filter((r) => r.points > 0 && r.position === 1)
  const leaderCards = leaders.map((row) => ({
    row,
    p: participants.find((pp) => pp.id === row.participantId)!,
  }))
  const tie = leaders.length > 1

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={<Trophy size={20} />}
        title="Ranking"
        subtitle="Classificação geral e premiação"
      />

      {/* Banner do(s) campeão(ões) — trata empate na liderança */}
      {allFinished && leaders.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 p-5 text-white shadow-card">
          <PartyPopper className="absolute -right-3 -top-3 opacity-20" size={90} />
          <div className="relative">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-white/90">
              <Crown size={16} fill="currentColor" />
              {tie
                ? `Empate na liderança — ${leaders.length} campeões!`
                : 'Campeão do bolão'}
            </div>
            <div className="mt-2 space-y-2">
              {leaderCards.map(({ row, p }) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl bg-white/15 p-2.5 backdrop-blur-sm"
                >
                  <Avatar name={p.name} color={p.color} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-black">{p.name}</div>
                    <div className="text-xs text-white/90">
                      {row.points} pts · {formatMoney(prizeForRow(row), settings.currency)}
                    </div>
                  </div>
                  {p.pixKey ? (
                    <CopyButton
                      value={p.pixKey}
                      label="Copiar Pix"
                      copiedLabel="Pix copiado!"
                      className="btn shrink-0 bg-white/95 text-amber-700 hover:bg-white"
                    />
                  ) : (
                    <span className="shrink-0 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold">
                      Sem Pix — veja Amigos
                    </span>
                  )}
                </div>
              ))}
            </div>
            {tie && (
              <p className="mt-2 text-xs text-white/85">
                Prêmio dividido igualmente entre os empatados.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Pódio */}
      {top3.some((r) => r.points > 0) && (
        <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
          {podiumOrder.map((idx) => {
            const row = top3[idx]
            if (!row) return <div key={idx} />
            const p = participants.find((pp) => pp.id === row.participantId)!
            const heights = ['h-24', 'h-32', 'h-20']
            const place = idx
            const prize = prizeForRow(row)
            return (
              <div key={row.participantId} className="flex flex-col items-center">
                <div className="relative mb-2">
                  <Avatar name={p.name} color={p.color} size={place === 0 ? 64 : 52} />
                  {row.position === 1 && (
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
                  <span className="text-2xl font-black">{row.position}º</span>
                  {prize > 0 && (
                    <span className="mt-1 px-1 text-center text-[11px] font-bold leading-tight">
                      {formatMoney(prize, settings.currency)}
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
          {standings.map((row) => {
            const p = participants.find((pp) => pp.id === row.participantId)!
            const prize = prizeForRow(row)
            const pos = row.position
            return (
              <div
                key={row.participantId}
                className="flex items-center gap-3 px-4 py-3 sm:grid sm:grid-cols-[2.5rem_1fr_repeat(4,3.5rem)] sm:gap-2"
              >
                <div className="flex items-center justify-center">
                  <span
                    className={cx(
                      'grid h-7 w-7 place-items-center rounded-full text-xs font-bold',
                      pos === 1
                        ? 'bg-gold-100 text-gold-700'
                        : pos === 2
                          ? 'bg-slate-200 text-slate-600'
                          : pos === 3
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-50 text-slate-400',
                    )}
                  >
                    {pos}
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Avatar name={p.name} color={p.color} size={32} />
                  <div className="min-w-0">
                    <div className="truncate font-bold text-slate-900">
                      {p.name}
                    </div>
                    {prize > 0 && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-gold-600">
                          <Medal size={11} />
                          {formatMoney(prize, settings.currency)}
                        </span>
                        {p.pixKey ? (
                          <CopyButton
                            value={p.pixKey}
                            label="Pix"
                            iconSize={11}
                            className="inline-flex items-center gap-1 rounded-md bg-gold-100 px-1.5 py-0.5 text-[11px] font-bold text-gold-700 transition hover:bg-gold-200"
                          />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <QrCode size={11} /> sem Pix
                          </span>
                        )}
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

      {standings.every((r) => r.points === 0) && (
        <p className="text-center text-sm text-slate-400">
          Os pontos aparecem assim que você lançar os resultados dos jogos.
        </p>
      )}
    </div>
  )
}
