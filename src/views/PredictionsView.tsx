import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  ClipboardList,
  Lock,
  Sparkles,
  UserCog,
  Users,
} from 'lucide-react'
import { useStore, STAGE_LABELS, STAGE_ORDER } from '../store/store'
import { Avatar, EmptyState, SectionTitle } from '../components/ui'
import { TeamPill } from '../components/TeamPill'
import { scorePrediction, type HitType } from '../store/scoring'
import { cx, getTeam, formatDateTime, teamMap } from '../utils'
import type { Match, Stage } from '../types'

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
        subtitle="Registre o placar que cada um cravou"
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
  const { state, setPrediction, getPrediction } = useStore()
  const { participants, matches, settings } = state
  const tmap = useMemo(() => teamMap(state.teams), [state.teams])
  const [pid, setPid] = useState(participants[0]?.id ?? '')

  const participant = participants.find((p) => p.id === pid) ?? participants[0]

  const byStage = useMemo(() => groupByStage(matches), [matches])

  const progress = useMemo(() => {
    const total = matches.length
    const done = matches.filter(
      (m) => getPrediction(participant.id, m.id) !== undefined,
    ).length
    return { done, total }
  }, [matches, participant.id, getPrediction])

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
            {progress.done}/{progress.total} palpites
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
                  <PredictionRow
                    key={m.id}
                    match={m}
                    tmap={tmap}
                    prediction={getPrediction(participant.id, m.id)}
                    rules={settings.scoring}
                    onChange={(h, a) => setPrediction(participant.id, m.id, h, a)}
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

function PredictionRow({
  match,
  tmap,
  prediction,
  onChange,
  rules,
}: {
  match: Match
  tmap: ReturnType<typeof teamMap>
  prediction: ReturnType<ReturnType<typeof useStore>['getPrediction']>
  onChange: (home: number, away: number) => void
  rules: { exact: number; result: number; goals: number }
}) {
  const home = getTeam(tmap, match.homeCode, match.homeLabel)
  const away = getTeam(tmap, match.awayCode, match.awayLabel)

  const [h, setH] = useState(prediction ? String(prediction.homeScore) : '')
  const [a, setA] = useState(prediction ? String(prediction.awayScore) : '')

  // sincroniza com mudança externa de participante/palpite
  const key = `${match.id}:${prediction?.updatedAt ?? 'none'}`
  const [lastKey, setLastKey] = useState(key)
  if (key !== lastKey) {
    setLastKey(key)
    setH(prediction ? String(prediction.homeScore) : '')
    setA(prediction ? String(prediction.awayScore) : '')
  }

  const commit = (hv: string, av: string) => {
    if (hv === '' || av === '') return
    const hn = clamp(hv)
    const an = clamp(av)
    onChange(hn, an)
  }

  const scored = match.finished
    ? scorePrediction(prediction, match, rules)
    : null

  return (
    <div
      className={cx(
        'card p-3',
        scored && scored.type !== 'pending' && hitBg(scored.type),
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <TeamPill team={home} align="right" className="flex-1" />
        <div className="flex shrink-0 items-center gap-1.5">
          <PredInput
            value={h}
            onChange={(v) => {
              setH(v)
              commit(v, a)
            }}
          />
          <span className="text-xs font-bold text-slate-300">×</span>
          <PredInput
            value={a}
            onChange={(v) => {
              setA(v)
              commit(h, v)
            }}
          />
        </div>
        <TeamPill team={away} className="flex-1" />
      </div>

      {match.finished && (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs">
          <span className="flex items-center gap-1 font-semibold text-slate-500">
            <Lock size={11} /> Resultado: {match.homeScore} × {match.awayScore}
          </span>
          {scored && (
            <span className={cx('chip', hitChip(scored.type))}>
              {hitLabel(scored.type)} · {scored.points} pts
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function PredInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="-"
      className="h-11 w-11 rounded-xl border border-slate-300 bg-white text-center text-lg font-extrabold text-slate-900 outline-none transition focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/20 disabled:bg-slate-100"
    />
  )
}

// ===== Modo: por jogo =====

function ByMatch() {
  const { state, setPrediction, getPrediction } = useStore()
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
        <select
          className="input"
          value={match.id}
          onChange={(e) => setMid(e.target.value)}
        >
          {sortedMatches.map((m) => {
            const mh = getTeam(tmap, m.homeCode, m.homeLabel)
            const ma = getTeam(tmap, m.awayCode, m.awayLabel)
            return (
              <option key={m.id} value={m.id}>
                {mh.flag} {mh.name} × {ma.name} {ma.flag} —{' '}
                {STAGE_LABELS[m.stage]}
                {m.group ? ` ${m.group}` : ''}
              </option>
            )
          })}
        </select>
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
        {participants.map((p) => {
          const pred = getPrediction(p.id, match.id)
          const scored = match.finished
            ? scorePrediction(pred, match, settings.scoring)
            : null
          return (
            <MatchPredEditor
              key={p.id}
              matchId={match.id}
              name={p.name}
              color={p.color}
              pred={pred}
              scored={scored}
              onChange={(h, a) => setPrediction(p.id, match.id, h, a)}
            />
          )
        })}
      </div>
    </div>
  )
}

function MatchPredEditor({
  matchId,
  name,
  color,
  pred,
  scored,
  onChange,
}: {
  matchId: string
  name: string
  color: string
  pred: ReturnType<ReturnType<typeof useStore>['getPrediction']>
  scored: ReturnType<typeof scorePrediction> | null
  onChange: (home: number, away: number) => void
}) {
  const [h, setH] = useState(pred ? String(pred.homeScore) : '')
  const [a, setA] = useState(pred ? String(pred.awayScore) : '')

  const key = `${matchId}:${pred?.updatedAt ?? 'none'}`
  const [lastKey, setLastKey] = useState(key)
  if (key !== lastKey) {
    setLastKey(key)
    setH(pred ? String(pred.homeScore) : '')
    setA(pred ? String(pred.awayScore) : '')
  }

  const commit = (hv: string, av: string) => {
    if (hv === '' || av === '') return
    onChange(clamp(hv), clamp(av))
  }

  return (
    <div className={cx('card flex items-center gap-3 p-3', scored && scored.type !== 'pending' && hitBg(scored.type))}>
      <Avatar name={name} color={color} size={34} />
      <span className="flex-1 truncate font-semibold text-slate-700">{name}</span>
      {scored && scored.type !== 'pending' && (
        <span className={cx('chip', hitChip(scored.type))}>
          {scored.points} pts
        </span>
      )}
      <div className="flex shrink-0 items-center gap-1.5">
        <PredInput
          value={h}
          onChange={(v) => {
            setH(v)
            commit(v, a)
          }}
        />
        <span className="text-xs font-bold text-slate-300">×</span>
        <PredInput
          value={a}
          onChange={(v) => {
            setA(v)
            commit(h, v)
          }}
        />
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

function clamp(v: string): number {
  return Math.max(0, Math.min(99, parseInt(v, 10) || 0))
}

function hitBg(type: HitType): string {
  switch (type) {
    case 'exact':
      return 'ring-1 ring-pitch-300 bg-pitch-50/50'
    case 'result':
      return 'ring-1 ring-blue-200 bg-blue-50/40'
    case 'goals':
      return 'ring-1 ring-gold-200 bg-gold-50/40'
    default:
      return ''
  }
}

function hitChip(type: HitType): string {
  switch (type) {
    case 'exact':
      return 'bg-pitch-100 text-pitch-700'
    case 'result':
      return 'bg-blue-100 text-blue-700'
    case 'goals':
      return 'bg-gold-100 text-gold-700'
    default:
      return 'bg-slate-100 text-slate-500'
  }
}

function hitLabel(type: HitType): string {
  switch (type) {
    case 'exact':
      return 'Placar exato'
    case 'result':
      return 'Resultado certo'
    case 'goals':
      return 'Gols de um time'
    default:
      return 'Errou'
  }
}
