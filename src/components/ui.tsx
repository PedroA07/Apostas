import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import { cx, initials } from '../utils'

export function SectionTitle({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pitch-50 text-pitch-600">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-slate-900 leading-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-slate-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  )
}

export function Avatar({
  name,
  color,
  size = 36,
}: {
  name: string
  color: string
  size?: number
}) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        fontSize: size * 0.38,
      }}
      title={name}
    >
      {initials(name)}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-800">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className={cx(
          'card w-full animate-fade-in rounded-b-none sm:rounded-2xl',
          maxWidth,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmButton({
  onConfirm,
  children,
  className = 'btn-danger',
  confirmLabel = 'Confirmar?',
}: {
  onConfirm: () => void
  children: ReactNode
  className?: string
  confirmLabel?: string
}) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])

  return (
    <button
      className={armed ? 'btn bg-red-600 text-white hover:bg-red-700' : className}
      onClick={() => {
        if (armed) {
          onConfirm()
          setArmed(false)
        } else {
          setArmed(true)
        }
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  )
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = 'pitch',
}: {
  label: string
  value: ReactNode
  sub?: string
  icon: ReactNode
  accent?: 'pitch' | 'gold' | 'blue' | 'violet'
}) {
  const accents: Record<string, string> = {
    pitch: 'bg-pitch-50 text-pitch-600',
    gold: 'bg-gold-50 text-gold-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
  }
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <div
          className={cx(
            'grid h-8 w-8 place-items-center rounded-lg',
            accents[accent],
          )}
        >
          {icon}
        </div>
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  )
}
