import { useEffect, useMemo, useState } from 'react'
import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Trophy,
} from 'lucide-react'
import { useStore, STAGE_LABELS, STAGE_ORDER } from '../store/store'
import { ConfirmButton, EmptyState, Modal, SectionTitle } from '../components/ui'
import { TeamPill } from '../components/TeamPill'
import { VENUES } from '../data/venues'
import {
  cx,
  formatDateTime,
  getTeam,
  isoToLocalInput,
  localInputToIso,
  teamMap,
} from '../utils'
import { GROUP_LETTERS } from '../data/teams'
import type { Match, Stage } from '../types'

type Filter = 'todos' | Stage

export default function MatchesView() {
  const { state, setResult, removeMatch } = useStore()
  const { matches } = state
  const tmap = useMemo(() => teamMap(state.teams), [state.teams])
  const [filter, setFilter] = useState<Filter>('grupos')
  const [groupFilter, setGroupFilter] = useState<string>('todos')
  const [editing, setEditing] = useState<Match | 'new' | null>(null)

  const stagesPresent = useMemo(() => {
    const set = new Set(matches.map((m) => m.stage))
    return STAGE_ORDER.filter((s) => set.has(s))
  }, [matches])

  const filtered = useMemo(() => {
    let list = matches
    if (filter !== 'todos') list = list.filter((m) => m.stage === filter)
    if (filter === 'grupos' && groupFilter !== 'todos')
      list = list.filter((m) => m.group === groupFilter)
    return [...list].sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
    )
  }, [matches, filter, groupFilter])

  // agrupa por grupo quando estiver na fase de grupos
  const grouped = useMemo(() => {
    if (filter !== 'grupos') return null
    const map = new Map<string, Match[]>()
    for (const m of filtered) {
      const key = m.group ?? '?'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered, filter])

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={<CalendarClock size={20} />}
        title="Jogos"
        subtitle="Calendário da Copa e lançamento dos resultados oficiais"
        action={
          <button className="btn-primary" onClick={() => setEditing('new')}>
            <Plus size={16} /> <span className="hidden sm:inline">Novo jogo</span>
          </button>
        }
      />

      {/* Filtros de fase */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <FilterTab active={filter === 'todos'} onClick={() => setFilter('todos')}>
          Todos
        </FilterTab>
        {stagesPresent.map((s) => (
          <FilterTab
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
          >
            {STAGE_LABELS[s]}
          </FilterTab>
        ))}
      </div>

      {/* Sub-filtro de grupos */}
      {filter === 'grupos' && (
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <FilterTab
            small
            active={groupFilter === 'todos'}
            onClick={() => setGroupFilter('todos')}
          >
            Todos
          </FilterTab>
          {GROUP_LETTERS.map((g) => (
            <FilterTab
              small
              key={g}
              active={groupFilter === g}
              onClick={() => setGroupFilter(g)}
            >
              Grupo {g}
            </FilterTab>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarPlus size={28} />}
          title="Nenhum jogo nesta fase"
          description="Adicione um novo jogo ou gere a fase de grupos nas Configurações."
          action={
            <button className="btn-primary" onClick={() => setEditing('new')}>
              <Plus size={16} /> Adicionar jogo
            </button>
          }
        />
      ) : grouped ? (
        <div className="space-y-6">
          {grouped.map(([letter, list]) => (
            <div key={letter}>
              <h3 className="mb-2 flex items-center gap-2 px-1 text-sm font-extrabold uppercase tracking-wide text-slate-500">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-pitch-600 text-xs text-white">
                  {letter}
                </span>
                Grupo {letter}
              </h3>
              <div className="space-y-2.5">
                {list.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    tmap={tmap}
                    onResult={setResult}
                    onEdit={() => setEditing(m)}
                    onDelete={() => removeMatch(m.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              tmap={tmap}
              showStage={filter === 'todos'}
              onResult={setResult}
              onEdit={() => setEditing(m)}
              onDelete={() => removeMatch(m.id)}
            />
          ))}
        </div>
      )}

      <MatchFormModal
        target={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  )
}

function FilterTab({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  small?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'shrink-0 whitespace-nowrap rounded-full font-semibold transition',
        small ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm',
        active
          ? 'bg-slate-900 text-white shadow-sm'
          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200',
      )}
    >
      {children}
    </button>
  )
}

function MatchCard({
  match,
  tmap,
  onResult,
  onEdit,
  onDelete,
  showStage,
}: {
  match: Match
  tmap: ReturnType<typeof teamMap>
  onResult: (id: string, home: number | null, away: number | null) => void
  onEdit: () => void
  onDelete: () => void
  showStage?: boolean
}) {
  const home = getTeam(tmap, match.homeCode, match.homeLabel)
  const away = getTeam(tmap, match.awayCode, match.awayLabel)

  const onScore = (side: 'home' | 'away', raw: string) => {
    const val = raw === '' ? null : Math.max(0, Math.min(99, parseInt(raw, 10) || 0))
    if (side === 'home') onResult(match.id, val, match.awayScore)
    else onResult(match.id, match.homeScore, val)
  }

  return (
    <div
      className={cx(
        'card group p-3 transition hover:shadow-card-hover sm:p-4',
        match.finished && 'ring-1 ring-pitch-200',
      )}
    >
      <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-slate-400">
        <span className="flex items-center gap-1.5">
          {match.finished ? (
            <span className="chip bg-pitch-100 text-pitch-700">
              <CheckCircle2 size={11} /> Encerrado
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <CalendarClock size={12} /> {formatDateTime(match.kickoff)}
            </span>
          )}
          {showStage && (
            <span className="hidden sm:inline">
              · {STAGE_LABELS[match.stage]}
              {match.group ? ` ${match.group}` : ''}
            </span>
          )}
        </span>
        <div className="flex items-center gap-0.5 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Editar jogo"
          >
            <Pencil size={13} />
          </button>
          <ConfirmButton
            onConfirm={onDelete}
            className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500"
            confirmLabel="?"
          >
            <Trash2 size={13} />
          </ConfirmButton>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <TeamPill team={home} align="right" className="flex-1" strong />
        <div className="flex shrink-0 items-center gap-1.5">
          <ScoreBox
            value={match.homeScore}
            onChange={(v) => onScore('home', v)}
          />
          <span className="text-sm font-bold text-slate-300">×</span>
          <ScoreBox
            value={match.awayScore}
            onChange={(v) => onScore('away', v)}
          />
        </div>
        <TeamPill team={away} className="flex-1" strong />
      </div>

      <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-slate-400">
        <MapPin size={11} /> {match.venue || 'Estádio a definir'}
      </div>
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

// ===== Modal de novo/editar jogo =====

function MatchFormModal({
  target,
  onClose,
}: {
  target: Match | 'new' | null
  onClose: () => void
}) {
  const { state, addMatch, updateMatch } = useStore()
  const match = target && target !== 'new' ? target : null

  const [form, setForm] = useState(() => emptyForm())

  // reinicializa o formulário sempre que o jogo-alvo muda (novo ou edição)
  useEffect(() => {
    if (!target) return
    setForm(
      match
        ? {
            homeCode: match.homeCode ?? '',
            awayCode: match.awayCode ?? '',
            homeLabel: match.homeLabel ?? '',
            awayLabel: match.awayLabel ?? '',
            stage: match.stage,
            group: match.group ?? '',
            kickoff: isoToLocalInput(match.kickoff),
            venue: match.venue,
          }
        : emptyForm(),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  const set = (patch: Partial<ReturnType<typeof emptyForm>>) =>
    setForm((f) => ({ ...f, ...patch }))

  const save = () => {
    const payload = {
      homeCode: form.homeCode || null,
      awayCode: form.awayCode || null,
      homeLabel: form.homeCode ? undefined : form.homeLabel || undefined,
      awayLabel: form.awayCode ? undefined : form.awayLabel || undefined,
      stage: form.stage,
      group: form.stage === 'grupos' ? form.group || undefined : undefined,
      kickoff: localInputToIso(form.kickoff),
      venue: form.venue,
    }
    if (match) {
      updateMatch(match.id, payload)
    } else {
      addMatch({
        ...payload,
        homeScore: null,
        awayScore: null,
        finished: false,
      })
    }
    onClose()
  }

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title={match ? 'Editar jogo' : 'Novo jogo'}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <TeamSelect
            label="Mandante"
            value={form.homeCode}
            labelValue={form.homeLabel}
            onCode={(homeCode) => set({ homeCode })}
            onLabel={(homeLabel) => set({ homeLabel })}
            teams={state.teams}
          />
          <TeamSelect
            label="Visitante"
            value={form.awayCode}
            labelValue={form.awayLabel}
            onCode={(awayCode) => set({ awayCode })}
            onLabel={(awayLabel) => set({ awayLabel })}
            teams={state.teams}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fase</label>
            <select
              className="input"
              value={form.stage}
              onChange={(e) => set({ stage: e.target.value as Stage })}
            >
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          {form.stage === 'grupos' && (
            <div>
              <label className="label">Grupo</label>
              <select
                className="input"
                value={form.group}
                onChange={(e) => set({ group: e.target.value })}
              >
                <option value="">—</option>
                {GROUP_LETTERS.map((g) => (
                  <option key={g} value={g}>
                    Grupo {g}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="label">Data e hora</label>
          <input
            type="datetime-local"
            className="input"
            value={form.kickoff}
            onChange={(e) => set({ kickoff: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Estádio</label>
          <input
            className="input"
            list="venues-list"
            value={form.venue}
            onChange={(e) => set({ venue: e.target.value })}
            placeholder="Selecione ou digite"
          />
          <datalist id="venues-list">
            {VENUES.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={save}>
            <Trophy size={16} /> {match ? 'Salvar' : 'Adicionar jogo'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function emptyForm() {
  return {
    homeCode: '',
    awayCode: '',
    homeLabel: '',
    awayLabel: '',
    stage: 'grupos' as Stage,
    group: '',
    kickoff: isoToLocalInput(new Date('2026-06-20T16:00:00').toISOString()),
    venue: VENUES[0],
  }
}

function TeamSelect({
  label,
  value,
  labelValue,
  onCode,
  onLabel,
  teams,
}: {
  label: string
  value: string
  labelValue: string
  onCode: (code: string) => void
  onLabel: (label: string) => void
  teams: { code: string; name: string; flag: string }[]
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select
        className="input"
        value={value}
        onChange={(e) => onCode(e.target.value)}
      >
        <option value="">A definir…</option>
        {teams.map((t) => (
          <option key={t.code} value={t.code}>
            {t.flag} {t.name}
          </option>
        ))}
      </select>
      {!value && (
        <input
          className="input mt-2"
          placeholder='Rótulo (ex: "1º Grupo A")'
          value={labelValue}
          onChange={(e) => onLabel(e.target.value)}
        />
      )}
    </div>
  )
}
