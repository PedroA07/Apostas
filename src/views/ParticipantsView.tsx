import { useEffect, useState } from 'react'
import {
  Banknote,
  Check,
  CircleDollarSign,
  Pencil,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { useStore } from '../store/store'
import { Avatar, ConfirmButton, EmptyState, Modal, SectionTitle } from '../components/ui'
import { AVATAR_COLORS } from '../data/seed'
import { cx, formatMoney, participantValue, potSummary } from '../utils'
import type { Participant } from '../types'

export default function ParticipantsView() {
  const { state, addParticipant, updateParticipant, removeParticipant, togglePaid } =
    useStore()
  const { participants, settings } = state
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [editing, setEditing] = useState<Participant | null>(null)

  const { collected, pending, paidCount } = potSummary(participants, settings)

  const submit = () => {
    if (!name.trim()) return
    const v = value.trim() === '' ? undefined : Math.max(0, Number(value))
    addParticipant(name, v)
    setName('')
    setValue('')
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={<Users size={20} />}
        title="Participantes"
        subtitle="Quem está no bolão, o valor de cada um e quem já pagou"
      />

      {/* Resumo financeiro */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <CircleDollarSign size={14} /> Arrecadado
          </div>
          <div className="mt-1 text-lg font-extrabold text-pitch-600 sm:text-xl">
            {formatMoney(collected, settings.currency)}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Banknote size={14} /> A receber
          </div>
          <div className="mt-1 text-lg font-extrabold text-gold-600 sm:text-xl">
            {formatMoney(pending, settings.currency)}
          </div>
        </div>
        <div className="card col-span-2 p-4 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Users size={14} /> Pagantes
          </div>
          <div className="mt-1 text-lg font-extrabold text-slate-900 sm:text-xl">
            {paidCount}
            <span className="text-base font-semibold text-slate-400">
              {' '}
              / {participants.length}
            </span>
          </div>
        </div>
      </div>

      {/* Adicionar */}
      <div className="card space-y-2.5 p-4">
        <input
          className="input"
          placeholder="Nome do amigo (ex: João)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          enterKeyHint="done"
        />
        <div className="flex gap-2">
          <MoneyInput
            value={value}
            onChange={setValue}
            currency={settings.currency}
            placeholder={String(settings.buyIn)}
            className="flex-1"
          />
          <button className="btn-primary shrink-0 px-4" onClick={submit}>
            <UserPlus size={16} />
            Adicionar
          </button>
        </div>
        <p className="px-0.5 text-xs text-slate-400">
          Deixe o valor em branco para usar o padrão do bolão (
          {formatMoney(settings.buyIn, settings.currency)}).
        </p>
      </div>

      {/* Lista */}
      {participants.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="Nenhum participante ainda"
          description="Adicione você e seus amigos para começarem a dar palpites nos jogos da Copa."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {participants.map((p) => {
            const v = participantValue(p, settings.buyIn)
            return (
              <div key={p.id} className="card flex items-center gap-3 p-3.5">
                <Avatar name={p.name} color={p.color} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-bold text-slate-900">
                      {p.name}
                    </span>
                    <span className="chip shrink-0 bg-slate-100 text-slate-600">
                      {formatMoney(v, settings.currency)}
                    </span>
                  </div>
                  <button
                    onClick={() => togglePaid(p.id)}
                    className={cx(
                      'chip mt-1.5',
                      p.paid
                        ? 'bg-pitch-100 text-pitch-700'
                        : 'bg-amber-50 text-amber-600',
                    )}
                  >
                    {p.paid ? (
                      <>
                        <Check size={12} /> Pago
                      </>
                    ) : (
                      <>Pendente · toque p/ marcar pago</>
                    )}
                  </button>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    onClick={() => setEditing(p)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <ConfirmButton
                    onConfirm={() => removeParticipant(p.id)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                    confirmLabel="X"
                  >
                    <Trash2 size={16} />
                  </ConfirmButton>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <EditModal
        participant={editing}
        defaultBuyIn={settings.buyIn}
        currency={settings.currency}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (editing) updateParticipant(editing.id, patch)
          setEditing(null)
        }}
      />
    </div>
  )
}

function MoneyInput({
  value,
  onChange,
  currency,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  currency: string
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cx('relative', className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
        {currency}
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        className="input pl-11 font-semibold"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function EditModal({
  participant,
  defaultBuyIn,
  currency,
  onClose,
  onSave,
}: {
  participant: Participant | null
  defaultBuyIn: number
  currency: string
  onClose: () => void
  onSave: (patch: Partial<Participant>) => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('')
  const [value, setValue] = useState('')

  // sincroniza os campos sempre que um novo participante é aberto
  useEffect(() => {
    if (participant) {
      setName(participant.name)
      setColor(participant.color)
      setValue(participant.betValue != null ? String(participant.betValue) : '')
    }
  }, [participant])

  const close = () => onClose()

  return (
    <Modal open={!!participant} onClose={close} title="Editar participante">
      <div className="space-y-4">
        <div>
          <label className="label">Nome</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="label">Valor apostado</label>
          <MoneyInput
            value={value}
            onChange={setValue}
            currency={currency}
            placeholder={`${defaultBuyIn} (padrão)`}
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Em branco = valor padrão do bolão (
            {formatMoney(defaultBuyIn, currency)}).
          </p>
        </div>
        <div>
          <label className="label">Cor</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cx(
                  'h-9 w-9 rounded-full transition',
                  color === c
                    ? 'ring-2 ring-slate-900 ring-offset-2'
                    : 'hover:scale-110',
                )}
                style={{ backgroundColor: c }}
                aria-label={`Cor ${c}`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-ghost" onClick={close}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={() =>
              onSave({
                name: name.trim() || participant!.name,
                color,
                betValue:
                  value.trim() === '' ? undefined : Math.max(0, Number(value)),
              })
            }
          >
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  )
}
