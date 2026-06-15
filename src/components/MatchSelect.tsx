import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import {
  CalendarClock,
  Check,
  ChevronsUpDown,
  MapPin,
  Search,
  X,
} from 'lucide-react'
import type { Match, Team } from '../types'
import { STAGE_LABELS } from '../store/store'
import { cx, formatDateTime, getTeam, normalizeText } from '../utils'
import { Flag } from './Flag'

/**
 * Seletor de jogo com busca personalizada e bandeiras dos países.
 * Filtra por time, fase, grupo ou estádio.
 */
export function MatchSelect({
  matches,
  value,
  onChange,
  tmap,
}: {
  matches: Match[]
  value: string
  onChange: (id: string) => void
  tmap: Map<string, Team>
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = matches.find((m) => m.id === value)

  const filtered = useMemo(() => {
    const q = normalizeText(query)
    if (!q) return matches
    const terms = q.split(/\s+/).filter(Boolean)
    return matches.filter((m) => {
      const h = getTeam(tmap, m.homeCode, m.homeLabel)
      const a = getTeam(tmap, m.awayCode, m.awayLabel)
      const hay = normalizeText(
        `${h.name} ${a.name} ${STAGE_LABELS[m.stage]} grupo ${m.group ?? ''} ${m.venue}`,
      )
      return terms.every((t) => hay.includes(t))
    })
  }, [matches, query, tmap])

  useEffect(() => setActive(0), [query])

  // fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  // foca a busca ao abrir; limpa ao fechar
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 10)
      return () => clearTimeout(t)
    }
    setQuery('')
  }, [open])

  // mantém o item ativo visível
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector(
      `[data-idx="${active}"]`,
    ) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const choose = (m: Match) => {
    onChange(m.id)
    setOpen(false)
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const m = filtered[active]
      if (m) choose(m)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cx(
          'flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-left outline-none transition',
          open
            ? 'border-pitch-500 ring-2 ring-pitch-500/20'
            : 'border-slate-300 hover:border-slate-400',
        )}
      >
        {selected ? (
          <TeamsLine match={selected} tmap={tmap} />
        ) : (
          <span className="text-sm text-slate-400">Escolha o jogo…</span>
        )}
        <ChevronsUpDown size={16} className="shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card-hover animate-fade-in">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKey}
              placeholder="Buscar time, fase, grupo…"
              className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  inputRef.current?.focus()
                }}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100"
                aria-label="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-1 sm:max-h-80">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                Nenhum jogo encontrado
              </div>
            ) : (
              filtered.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  data-idx={i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(m)}
                  className={cx(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition',
                    i === active ? 'bg-pitch-50' : 'hover:bg-slate-50',
                  )}
                >
                  <Option match={m} tmap={tmap} selected={m.id === value} />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TeamsLine({
  match,
  tmap,
}: {
  match: Match
  tmap: Map<string, Team>
}) {
  const h = getTeam(tmap, match.homeCode, match.homeLabel)
  const a = getTeam(tmap, match.awayCode, match.awayLabel)
  return (
    <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-semibold text-slate-800">
      <Flag emoji={h.flag} name={h.name} size={16} />
      <span className="truncate">{h.name}</span>
      <span className="shrink-0 text-slate-300">×</span>
      <Flag emoji={a.flag} name={a.name} size={16} />
      <span className="truncate">{a.name}</span>
    </span>
  )
}

function Option({
  match,
  tmap,
  selected,
}: {
  match: Match
  tmap: Map<string, Team>
  selected: boolean
}) {
  const h = getTeam(tmap, match.homeCode, match.homeLabel)
  const a = getTeam(tmap, match.awayCode, match.awayLabel)
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-right">
            <span className="truncate text-sm font-semibold text-slate-800">
              {h.name}
            </span>
            <Flag emoji={h.flag} name={h.name} size={18} />
          </div>
          {match.finished ? (
            <span className="shrink-0 rounded bg-slate-900 px-1.5 py-0.5 text-xs font-bold text-white">
              {match.homeScore}×{match.awayScore}
            </span>
          ) : (
            <span className="shrink-0 text-xs font-bold text-slate-300">×</span>
          )}
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <Flag emoji={a.flag} name={a.name} size={18} />
            <span className="truncate text-sm font-semibold text-slate-800">
              {a.name}
            </span>
          </div>
        </div>
        <div className="mt-0.5 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-500">
            {STAGE_LABELS[match.stage]}
            {match.group ? ` · Grupo ${match.group}` : ''}
          </span>
          <span className="flex items-center gap-0.5">
            <CalendarClock size={10} /> {formatDateTime(match.kickoff)}
          </span>
          {match.venue && (
            <span className="hidden items-center gap-0.5 sm:flex">
              <MapPin size={10} /> {match.venue.split(' — ')[0]}
            </span>
          )}
        </div>
      </div>
      {selected && <Check size={16} className="shrink-0 text-pitch-600" />}
    </div>
  )
}
