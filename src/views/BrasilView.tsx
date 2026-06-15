import { useMemo } from 'react'
import {
  CalendarClock,
  ClipboardList,
  Crown,
  Flag,
  MapPin,
  Target,
  Trophy,
} from 'lucide-react'
import { useStore, STAGE_LABELS } from '../store/store'
import { bestScore, computeStandings } from '../store/scoring'
import { Avatar, EmptyState, SectionTitle } from '../components/ui'
import { TeamPill } from '../components/TeamPill'
import { Flag as CountryFlag } from '../components/Flag'
import { hitChip } from '../components/PalpiteList'
import { useBet } from '../components/BetModal'
import { cx, formatDateTime, getTeam, teamMap } from '../utils'
import type { Match, Participant, Prediction, Team } from '../types'

const BRA = 'BRA'

function findBrazil(teams: Team[]): Team | undefined {
  return (
    teams.find((t) => t.code === BRA) ??
    teams.find((t) => t.name.toLowerCase().includes('brasil'))
  )
}

export default function BrasilView({ go }: { go: (tab: string) => void }) {
  const { state, setResult } = useStore()
  const { teams, matches, participants, predictions, settings, groups } = state
  const tmap = useMemo(() => teamMap(teams), [teams])

  const brazil = useMemo(() => findBrazil(teams), [teams])
  const code = brazil?.code ?? BRA

  const brMatches = useMemo(
    () =>
      [...matches]
        .filter((m) => m.homeCode === code || m.awayCode === code)
        .sort(
          (a, b) =>
            new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
        ),
    [matches, code],
  )

  const record = useMemo(() => computeRecord(brMatches, code), [brMatches, code])

  // grupo do Brasil
  const groupLetter = useMemo(() => {
    for (const [letter, codes] of Object.entries(groups)) {
      if (codes.includes(code)) return letter
    }
    return undefined
  }, [groups, code])
  const groupRivals = groupLetter
    ? (groups[groupLetter] ?? []).filter((c) => c !== code)
    : []

  // ranking apenas dos jogos do Brasil
  const brStandings = useMemo(
    () => computeStandings(participants, brMatches, predictions, settings.scoring),
    [participants, brMatches, predictions, settings.scoring],
  )
  const anyFinished = brMatches.some((m) => m.finished)

  if (!brazil) {
    return (
      <div className="space-y-5">
        <SectionTitle icon={<Flag size={20} />} title="Brasil" subtitle="Jogos da Seleção" />
        <EmptyState
          icon={<Flag size={28} />}
          title="Seleção do Brasil não encontrada"
          description="Adicione o Brasil em algum grupo (aba Configurações) para acompanhar os jogos da Seleção por aqui."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Hero verde-amarelo */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pitch-600 via-pitch-500 to-gold-400 p-5 text-white shadow-card sm:p-6">
        <div className="absolute -right-6 -top-6 opacity-15">
          <CountryFlag
            emoji={brazil.flag}
            name={brazil.name}
            size={120}
            className="ring-0"
          />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
            <CountryFlag emoji={brazil.flag} name={brazil.name} size={22} /> Seleção
            Brasileira
          </div>
          <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
            Brasil na Copa 2026
          </h2>
          {groupLetter && (
            <p className="mt-1 text-sm text-white/85">
              Grupo {groupLetter}
              {groupRivals.length > 0 && (
                <>
                  {' · '}
                  {groupRivals
                    .map((c) => getTeam(tmap, c).name)
                    .join(', ')}
                </>
              )}
            </p>
          )}

          {/* Retrospecto */}
          <div className="mt-4 flex flex-wrap gap-2">
            <RecordPill label="Vitórias" value={record.wins} />
            <RecordPill label="Empates" value={record.draws} />
            <RecordPill label="Derrotas" value={record.losses} />
            <RecordPill
              label="Gols"
              value={`${record.gf}–${record.ga}`}
            />
          </div>
        </div>
      </div>

      {brMatches.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={28} />}
          title="Nenhum jogo do Brasil ainda"
          description="Gere os jogos da fase de grupos em Configurações ou adicione partidas do Brasil na aba Jogos."
          action={
            <button className="btn-primary" onClick={() => go('jogos')}>
              Ir para Jogos
            </button>
          }
        />
      ) : (
        <>
          {/* Ranking do Brasil */}
          {participants.length > 0 && anyFinished && (
            <div className="card p-5">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                <Trophy size={18} className="text-gold-500" />
                Ranking dos jogos do Brasil
              </h3>
              <div className="space-y-1.5">
                {brStandings.slice(0, 5).map((row, i) => {
                  const p = participants.find((pp) => pp.id === row.participantId)!
                  return (
                    <div
                      key={row.participantId}
                      className="flex items-center gap-3 rounded-xl px-1 py-1"
                    >
                      <span
                        className={cx(
                          'grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold',
                          i === 0
                            ? 'bg-gold-100 text-gold-700'
                            : i === 1
                              ? 'bg-slate-200 text-slate-600'
                              : i === 2
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-slate-100 text-slate-400',
                        )}
                      >
                        {i === 0 ? <Crown size={13} /> : i + 1}
                      </span>
                      <Avatar name={p.name} color={p.color} size={28} />
                      <span className="flex-1 truncate text-sm font-semibold text-slate-700">
                        {p.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {row.exacts} exatos
                      </span>
                      <span className="flex items-center gap-1 text-sm font-bold text-slate-900">
                        <Target size={13} className="text-pitch-500" />
                        {row.points}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Jogos do Brasil */}
          <SectionTitle
            icon={<Flag size={20} />}
            title="Jogos do Brasil"
            subtitle="Lance o resultado e veja os palpites de cada um"
          />
          <div className="space-y-3">
            {brMatches.map((m) => (
              <BrazilMatchCard
                key={m.id}
                match={m}
                code={code}
                tmap={tmap}
                participants={participants}
                predictions={predictions}
                rules={settings.scoring}
                onResult={setResult}
              />
            ))}
          </div>

          {participants.length > 0 && (
            <button
              className="btn-ghost w-full"
              onClick={() => go('palpites')}
            >
              <ClipboardList size={16} /> Editar os palpites
            </button>
          )}
        </>
      )}
    </div>
  )
}

function RecordPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
      <div className="text-lg font-black leading-none">{value}</div>
      <div className="mt-0.5 text-[11px] font-semibold text-white/80">{label}</div>
    </div>
  )
}

function BrazilMatchCard({
  match,
  code,
  tmap,
  participants,
  predictions,
  rules,
  onResult,
}: {
  match: Match
  code: string
  tmap: ReturnType<typeof teamMap>
  participants: Participant[]
  predictions: Record<string, Prediction[]>
  rules: { exact: number; result: number; goals: number }
  onResult: (id: string, home: number | null, away: number | null) => void
}) {
  const { openBet } = useBet()
  const home = getTeam(tmap, match.homeCode, match.homeLabel)
  const away = getTeam(tmap, match.awayCode, match.awayLabel)
  const brazilIsHome = match.homeCode === code

  // resultado pela ótica do Brasil
  let outcome: 'win' | 'draw' | 'loss' | null = null
  if (match.finished && match.homeScore !== null && match.awayScore !== null) {
    const brG = brazilIsHome ? match.homeScore : match.awayScore
    const opG = brazilIsHome ? match.awayScore : match.homeScore
    outcome = brG > opG ? 'win' : brG === opG ? 'draw' : 'loss'
  }

  const onScore = (side: 'home' | 'away', raw: string) => {
    const val =
      raw === '' ? null : Math.max(0, Math.min(99, parseInt(raw, 10) || 0))
    if (side === 'home') onResult(match.id, val, match.awayScore)
    else onResult(match.id, match.homeScore, val)
  }

  return (
    <div
      onClick={() => openBet(match.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') openBet(match.id)
      }}
      title="Palpitar neste jogo"
      className={cx(
        'card cursor-pointer p-3 transition hover:shadow-card-hover sm:p-4',
        outcome === 'win' && 'ring-1 ring-pitch-300',
        outcome === 'loss' && 'ring-1 ring-red-200',
        outcome === 'draw' && 'ring-1 ring-slate-200',
        !outcome && 'hover:ring-1 hover:ring-pitch-200',
      )}
    >
      <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-slate-400">
        <span className="flex items-center gap-1">
          <CalendarClock size={12} /> {formatDateTime(match.kickoff)}
        </span>
        <span className="font-semibold">
          {STAGE_LABELS[match.stage]}
          {match.group ? ` · Grupo ${match.group}` : ''}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <TeamPill team={home} align="right" className="flex-1" strong />
        <div
          className="flex shrink-0 items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <ScoreBox value={match.homeScore} onChange={(v) => onScore('home', v)} />
          <span className="text-sm font-bold text-slate-300">×</span>
          <ScoreBox value={match.awayScore} onChange={(v) => onScore('away', v)} />
        </div>
        <TeamPill team={away} className="flex-1" strong />
      </div>

      <div className="mt-2 flex items-center justify-center gap-2 text-[11px]">
        {outcome && (
          <span
            className={cx(
              'chip',
              outcome === 'win'
                ? 'bg-pitch-100 text-pitch-700'
                : outcome === 'draw'
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-red-50 text-red-600',
            )}
          >
            {outcome === 'win'
              ? 'Vitória do Brasil'
              : outcome === 'draw'
                ? 'Empate'
                : 'Derrota'}
          </span>
        )}
        <span className="flex items-center gap-1 text-slate-400">
          <MapPin size={11} /> {match.venue || 'Estádio a definir'}
        </span>
      </div>

      {/* Palpites dos participantes */}
      {participants.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <ClipboardList size={12} /> Palpites
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {participants.map((p) => {
              const list = predictions[`${p.id}:${match.id}`] ?? []
              const scored = match.finished
                ? bestScore(list, match, rules)
                : null
              const palpitesText =
                list.length > 0
                  ? list.map((pr) => `${pr.homeScore}×${pr.awayScore}`).join(', ')
                  : '—'
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1.5"
                >
                  <Avatar name={p.name} color={p.color} size={20} />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600">
                    {p.name}
                  </span>
                  <span className="shrink-0 truncate text-xs font-bold text-slate-800" title={palpitesText}>
                    {palpitesText}
                  </span>
                  {scored && scored.type !== 'pending' && (
                    <span
                      className={cx(
                        'shrink-0 rounded px-1 text-[10px] font-bold',
                        hitChip(scored.type),
                      )}
                    >
                      {scored.points}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreBox({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: string) => void
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="-"
      className="h-11 w-11 rounded-xl border border-slate-300 bg-white text-center text-lg font-extrabold text-slate-900 outline-none transition focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/20"
    />
  )
}

function computeRecord(matches: Match[], code: string) {
  let wins = 0
  let draws = 0
  let losses = 0
  let gf = 0
  let ga = 0
  for (const m of matches) {
    if (!m.finished || m.homeScore === null || m.awayScore === null) continue
    const isHome = m.homeCode === code
    const brG = isHome ? m.homeScore : m.awayScore
    const opG = isHome ? m.awayScore : m.homeScore
    gf += brG
    ga += opG
    if (brG > opG) wins++
    else if (brG === opG) draws++
    else losses++
  }
  return { wins, draws, losses, gf, ga }
}
