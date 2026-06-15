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
import { cx, formatMoney } from '../utils'
import type { Participant } from '../types'

export default function ParticipantsView() {
  const { state, addParticipant, updateParticipant, removeParticipant, togglePaid } =
    useStore()
  const { participants, settings } = state
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<Participant | null>(null)

  const paidCount = participants.filter((p) => p.paid).length
  const collected = paidCount * settings.buyIn
  const pending = (participants.length - paidCount) * settings.buyIn

  const submit = () => {
    if (!name.trim()) return
    addParticipant(name)
    setName('')
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={<Users size={20} />}
        title="Participantes"
        subtitle="Quem está no bolão e quem já pagou a aposta"
      />

      {/* Resumo financeiro */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <CircleDollarSign size={14} /> Arrecadado
          </div>
          <div className="mt-1 text-xl font-extrabold text-pitch-600">
            {formatMoney(collected, settings.currency)}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Banknote size={14} /> A receber
          </div>
          <div className="mt-1 text-xl font-extrabold text-gold-600">
            {formatMoney(pending, settings.currency)}
          </div>
        </div>
        <div className="card col-span-2 p-4 sm:col-span-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Users size={14} /> Pagantes
          </div>
          <div className="mt-1 text-xl font-extrabold text-slate-900">
            {paidCount}
            <span className="text-base font-semibold text-slate-400">
              {' '}
              / {participants.length}
            </span>
          </div>
        </div>
      </div>

      {/* Adicionar */}
      <div className="card p-4">
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Nome do amigo (ex: João)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <button className="btn-primary shrink-0" onClick={submit}>
            <UserPlus size={16} /> Adicionar
          </button>
        </div>
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
          {participants.map((p) => (
            <div key={p.id} className="card flex items-center gap-3 p-4">
              <Avatar name={p.name} color={p.color} size={44} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-slate-900">{p.name}</div>
                <button
                  onClick={() => togglePaid(p.id)}
                  className={cx(
                    'chip mt-1',
                    p.paid
                      ? 'bg-pitch-100 text-pitch-700'
                      : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {p.paid ? (
                    <>
                      <Check size={12} /> Pagou {formatMoney(settings.buyIn, settings.currency)}
                    </>
                  ) : (
                    <>Pendente · toque para marcar pago</>
                  )}
                </button>
              </div>
              <div className="flex shrink-0 gap-1">
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
                  confirmLabel="Excluir?"
                >
                  <Trash2 size={16} />
                </ConfirmButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <EditModal
        participant={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (editing) updateParticipant(editing.id, patch)
          setEditing(null)
        }}
      />
    </div>
  )
}

function EditModal({
  participant,
  onClose,
  onSave,
}: {
  participant: Participant | null
  onClose: () => void
  onSave: (patch: Partial<Participant>) => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('')

  // sincroniza os campos sempre que um novo participante é aberto
  useEffect(() => {
    if (participant) {
      setName(participant.name)
      setColor(participant.color)
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
              onSave({ name: name.trim() || participant!.name, color })
            }
          >
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  )
}
