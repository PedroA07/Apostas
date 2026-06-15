import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import { cx, normalizeText } from '../utils'

export interface SelectOption {
  value: string
  label: string
  /** bandeira (emoji) exibida antes do nome */
  flag?: string
  /** texto secundário menor */
  sublabel?: string
}

/**
 * Seletor personalizado (combobox) — substitui o <select> nativo.
 * Mostra bandeira ao lado do nome, com busca opcional e navegação por teclado.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = 'Selecione…',
  searchable = false,
  searchPlaceholder = 'Buscar…',
  className,
  buttonClassName,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
  className?: string
  buttonClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    if (!searchable) return options
    const q = normalizeText(query)
    if (!q) return options
    const terms = q.split(/\s+/).filter(Boolean)
    return options.filter((o) => {
      const hay = normalizeText(`${o.label} ${o.sublabel ?? ''} ${o.value}`)
      return terms.every((t) => hay.includes(t))
    })
  }, [options, query, searchable])

  // ao abrir: posiciona no item selecionado e foca busca/painel
  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    const idx = filtered.findIndex((o) => o.value === value)
    setActive(idx >= 0 ? idx : 0)
    const t = setTimeout(() => {
      if (searchable) inputRef.current?.focus()
      else panelRef.current?.focus()
    }, 10)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

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

  // mantém o item ativo visível
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector(
      `[data-idx="${active}"]`,
    ) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const choose = (o: SelectOption) => {
    onChange(o.value)
    setOpen(false)
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const o = filtered[active]
      if (o) choose(o)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={cx('relative', className)} onKeyDown={onKey}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cx(
          'flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-base outline-none transition',
          open
            ? 'border-pitch-500 ring-2 ring-pitch-500/20'
            : 'border-slate-300 hover:border-slate-400',
          buttonClassName,
        )}
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            {selected.flag && (
              <span className="shrink-0 text-lg leading-none">{selected.flag}</span>
            )}
            <span className="truncate font-medium text-slate-800">
              {selected.label}
            </span>
          </span>
        ) : (
          <span className="truncate text-slate-400">{placeholder}</span>
        )}
        <ChevronsUpDown size={16} className="shrink-0 text-slate-400" />
      </button>

      {open && (
        <div
          ref={panelRef}
          tabIndex={-1}
          className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card-hover outline-none animate-fade-in"
        >
          {searchable && (
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
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
          )}

          <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-1 sm:max-h-72">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-400">
                Nada encontrado
              </div>
            ) : (
              filtered.map((o, i) => (
                <button
                  key={o.value || `__${i}`}
                  type="button"
                  data-idx={i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o)}
                  className={cx(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition',
                    i === active ? 'bg-pitch-50' : 'hover:bg-slate-50',
                  )}
                >
                  {o.flag !== undefined && (
                    <span className="w-6 shrink-0 text-center text-xl leading-none">
                      {o.flag}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span
                      className={cx(
                        'block truncate text-sm font-semibold',
                        o.value === value ? 'text-pitch-700' : 'text-slate-800',
                      )}
                    >
                      {o.label}
                    </span>
                    {o.sublabel && (
                      <span className="block truncate text-[11px] text-slate-400">
                        {o.sublabel}
                      </span>
                    )}
                  </span>
                  {o.value === value && (
                    <Check size={16} className="shrink-0 text-pitch-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
