import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  ClipboardList,
  Sparkles,
  UserCog,
  Users,
} from 'lucide-react'
import { useStore, STAGE_LABELS, STAGE_ORDER } from '../store/store'
import { Avatar, EmptyState, SectionTitle } from '../components/ui'
import { TeamPill } from '../components/TeamPill'
import { MatchSelect } from '../components/MatchSelect'
import { PalpiteList } from '../components/PalpiteList'
import { cx, getTeam, formatDateTime, teamMap } from '../utils'
import type { Match, ScoringRules, Stage } from '../types'

export default function PredictionsView() {
  const { state } = useStore()
  const { participants, matches } = state
  const [mode, setMode] = useState<'participante' | 'jogo'>('participante')

  if (participants.length === 0) {
    return (
      <div className="space-y-5">
        <SectionTitle
          icon={<ClipboardList size={20} />}
          title="Palpites"
          subtitle="Registre os palpites de cada participante"
        />
        <EmptyState
          icon={<Users size={28} />}
          title="Adicione participantes primeiro"
          description="Você precisa cadastrar os amigos na aba Participantes antes de registrar os palpites."
        />
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="space-y-5">
        <SectionTitle
          icon={<ClipboardList size={20} />}
          title="Palpites"
          subtitle="Registre os palpites de cada participante"
        />
        <EmptyState
          icon={<Sparkles size={28} />}
          title="Nenhum jogo cadastrado"
          description="Cadastre os jogos na aba Jogos para liberar os palpites."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={<ClipboardList size={20} />}
        title="Palpites"
        subtitle="Cada um pode dar quantos palpites quiser por jogo — vale o melhor"
        action={
          <div className="flex rounded-xl border border-slate-200 bg-white p-0.5">
            <ModeBtn
              active={mode === 'participante'}
              onClick={() => setMode('participante')}
              icon={<UserCog size={14} />}
            >
              Por pessoa
            </ModeBtn>
            <ModeBtn
              active={mode === 'jogo'}
              onClick={() => setMode('jogo')}
              icon={<ClipboardList size={14} />}
            >
              Por jogo
            </ModeBtn>
          </div>
        }
      />

      {mode === 'participante' ? <ByParticipant /> : <ByMatch />}
    </div>
  )
}

function ModeBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
        active ? 'bg-pitch-600 text-white' : 'text-slate-600 hover:bg-slate-100',
      )}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  )
}

// ===== Modo: por participante =====

function ByParticipant() {
  const { state, getPredictions } = useStore()
  const { participants, matches, settings } = state
  const tmap = useMemo(() => teamMap(state.teams), [state.teams])
  const [pid, setPid] = useState(participants[0]?.id ?? '')

  const participant = participants.find((p) => p.id === pid) ?? participants[0]
  const byStage = useMemo(() => groupByStage(matches), [matches])

  const progress = useMemo(() => {
    const total = matches.length
    const done = matches.filter(
      (m) => getPredictions(participant.id, m.id).length > 0,
    ).length
    return { done, total }
  }, [matches, participant.id, getPredictions])

  return (
    <div className="space-y-4">
      {/* Seletor de participante */}
      <div className="card p-3">
        <label className="label px-1">Palpites de</label>
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <button
              key={p.id}
              onClick={() => setPid(p.id)}
              className={cx(
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition',
                p.id === participant.id
                  ? 'border-pitch-500 bg-pitch-50 text-pitch-700 ring-1 ring-pitch-500'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              <Avatar name={p.name} color={p.color} size={22} />
              {p.name}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 px-1">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-pitch-500 transition-all"
              style={{
                width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {progress.done}/{progress.total} jogos
          </span>
        </div>
      </div>

      {byStage.map(([stage, list]) => (
        <StageSection key={stage} stage={stage}>
          {list.map(({ group, matches: ms }) => (
            <div key={stage + group}>
              {group && (
                <div className="mb-1.5 mt-3 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Grupo {group}
                </div>
              )}
              <div className="space-y-2">
                {ms.map((m) => (
                  <MatchPalpiteCard
                    key={m.id}
                    match={m}
                    tmap={tmap}
                    participantId={participant.id}
                    rules={settings.scoring}
                  />
                ))}
              </div>
            </div>
          ))}
        </StageSection>
      ))}
    </div>
  )
}

function MatchPalpiteCard({
  match,
  tmap,
  participantId,
  rules,
}: {
  match: Match
  tmap: ReturnType<typeof teamMap>
  participantId: string
  rules: ScoringRules
}) {
  const home = getTeam(tmap, match.homeCode, match.homeLabel)
  const away = getTeam(tmap, match.awayCode, match.awayLabel)

  return (
    <div className="card p-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <TeamPill team={home} align="right" className="flex-1" />
        {match.finished ? (
          <span className="shrink-0 rounded-lg bg-slate-900 px-2 py-1 text-sm font-black text-white">
            {match.homeScore} × {match.awayScore}
          </span>
        ) : (
          <span className="shrink-0 text-xs font-bold text-slate-300">×</span>
        )}
        <TeamPill team={away} className="flex-1" />
      </div>

      <PalpiteList
        participantId={participantId}
        matchId={match.id}
        match={match}
        rules={rules}
      />
    </div>
  )
}

// ===== Modo: por jogo =====

function ByMatch() {
  const { state } = useStore()
  const { participants, matches, settings } = state
  const tmap = useMemo(() => teamMap(state.teams), [state.teams])
  const [mid, setMid] = useState(matches[0]?.id ?? '')

  const sortedMatches = useMemo(
    () =>
      [...matches].sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
      ),
    [matches],
  )
  const match = matches.find((m) => m.id === mid) ?? sortedMatches[0]
  const home = getTeam(tmap, match.homeCode, match.homeLabel)
  const away = getTeam(tmap, match.awayCode, match.awayLabel)

  return (
    <div className="space-y-4">
      <div className="card p-3">
        <label className="label px-1">Escolha o jogo</label>
        <MatchSelect
          matches={sortedMatches}
          value={match.id}
          onChange={setMid}
          tmap={tmap}
        />
      </div>

      {/* Cartão do jogo */}
      <div className="card p-4">
        <div className="flex items-center justify-center gap-3 text-center">
          <TeamPill team={home} align="right" className="flex-1" strong />
          <div className="shrink-0 text-center">
            {match.finished ? (
              <div className="text-2xl font-black text-slate-900">
                {match.homeScore} × {match.awayScore}
              </div>
            ) : (
              <div className="text-lg font-bold text-slate-300">×</div>
            )}
          </div>
          <TeamPill team={away} className="flex-1" strong />
        </div>
        <div className="mt-1 text-center text-xs text-slate-400">
          {formatDateTime(match.kickoff)} · {match.venue}
        </div>
      </div>

      {/* Palpites de cada um */}
      <div className="space-y-2">
        {participants.map((p) => (
          <div key={p.id} className="card p-3">
            <div className="flex items-center gap-2">
              <Avatar name={p.name} color={p.color} size={30} />
              <span className="flex-1 truncate font-semibold text-slate-700">
                {p.name}
              </span>
            </div>
            <PalpiteList
              participantId={p.id}
              matchId={match.id}
              match={match}
              rules={settings.scoring}
            />
          </div>
        ))}
      </div>
    </div>
  )
}


// ===== Auxiliares de layout =====

function StageSection({
  stage,
  children,
}: {
  stage: Stage
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 px-1 text-sm font-extrabold text-slate-700">
        <CheckCircle2 size={16} className="text-pitch-500" />
        {STAGE_LABELS[stage]}
      </h3>
      {children}
    </div>
  )
}

function groupByStage(
  matches: Match[],
): [Stage, { group?: string; matches: Match[] }[]][] {
  const byStage = new Map<Stage, Match[]>()
  for (const m of matches) {
    if (!byStage.has(m.stage)) byStage.set(m.stage, [])
    byStage.get(m.stage)!.push(m)
  }
  const result: [Stage, { group?: string; matches: Match[] }[]][] = []
  for (const stage of STAGE_ORDER) {
    const list = byStage.get(stage)
    if (!list) continue
    const sorted = [...list].sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
    )
    if (stage === 'grupos') {
      const byGroup = new Map<string, Match[]>()
      for (const m of sorted) {
        const g = m.group ?? '?'
        if (!byGroup.has(g)) byGroup.set(g, [])
        byGroup.get(g)!.push(m)
      }
      const groups = [...byGroup.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([group, matches]) => ({ group, matches }))
      result.push([stage, groups])
    } else {
      result.push([stage, [{ matches: sorted }]])
    }
  }
  return result
}

