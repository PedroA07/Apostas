import { useState } from 'react'
import { Lock, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store/store'
import { bestScore, scorePrediction, type HitType } from '../store/scoring'
import { cx } from '../utils'
import type { Match, Prediction, ScoringRules } from '../types'

/** Lista de palpites de um (participante, jogo): vários palpites, vale o melhor. */
export function PalpiteList({
  participantId,
  matchId,
  match,
  rules,
}: {
  participantId: string
  matchId: string
  match: Match
  rules: ScoringRules
}) {
  const { getPredictions, addPrediction, updatePrediction, removePrediction } =
    useStore()
  const preds = getPredictions(participantId, matchId)
  const best = match.finished ? bestScore(preds, match, rules) : null

  return (
    <div className="mt-2.5 border-t border-slate-100 pt-2.5">
      {preds.length === 0 && (
        <p className="mb-2 text-center text-xs text-slate-400">
          Sem palpite ainda
        </p>
      )}

      <div className="space-y-1.5">
        {preds.map((pred, i) => (
          <PalpiteRow
            key={pred.id}
            index={i}
            pred={pred}
            match={match}
            rules={rules}
            isBest={!!best && best.bestId === pred.id && best.points > 0}
            onChange={(h, a) =>
              updatePrediction(participantId, matchId, pred.id, h, a)
            }
            onRemove={() => removePrediction(participantId, matchId, pred.id)}
          />
        ))}
      </div>

      <button
        onClick={() => addPrediction(participantId, matchId, 0, 0)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-500 transition hover:border-pitch-400 hover:bg-pitch-50 hover:text-pitch-600"
      >
        <Plus size={14} /> Adicionar palpite
      </button>

      {match.finished && best && best.type !== 'pending' && (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs">
          <span className="flex items-center gap-1 font-semibold text-slate-500">
            <Lock size={11} /> Resultado {match.homeScore}×{match.awayScore}
          </span>
          <span className={cx('chip', hitChip(best.type))}>
            melhor: {best.points} pts
          </span>
        </div>
      )}
    </div>
  )
}

function PalpiteRow({
  index,
  pred,
  match,
  rules,
  isBest,
  onChange,
  onRemove,
}: {
  index: number
  pred: Prediction
  match: Match
  rules: ScoringRules
  isBest: boolean
  onChange: (home: number, away: number) => void
  onRemove: () => void
}) {
  const [h, setH] = useState(String(pred.homeScore))
  const [a, setA] = useState(String(pred.awayScore))

  // sincroniza com mudança externa do palpite
  const key = `${pred.id}:${pred.updatedAt}`
  const [lastKey, setLastKey] = useState(key)
  if (key !== lastKey) {
    setLastKey(key)
    setH(String(pred.homeScore))
    setA(String(pred.awayScore))
  }

  const commit = (hv: string, av: string) => {
    if (hv === '' || av === '') return
    onChange(clamp(hv), clamp(av))
  }

  const scored = match.finished ? scorePrediction(pred, match, rules) : null

  return (
    <div
      className={cx(
        'flex items-center gap-2 rounded-xl px-2 py-1.5',
        isBest ? 'bg-pitch-50 ring-1 ring-pitch-200' : 'bg-slate-50',
      )}
    >
      <span className="w-5 shrink-0 text-center text-[11px] font-bold text-slate-400">
        {index + 1}
      </span>
      <div className="flex flex-1 items-center justify-center gap-1.5">
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
      {scored && scored.type !== 'pending' && (
        <span className={cx('chip shrink-0', hitChip(scored.type))}>
          {scored.points}
        </span>
      )}
      <button
        onClick={onRemove}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
        aria-label="Remover palpite"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function PredInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="-"
      className="h-10 w-10 rounded-lg border border-slate-300 bg-white text-center text-base font-extrabold text-slate-900 outline-none transition focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/20"
    />
  )
}

export function clamp(v: string): number {
  return Math.max(0, Math.min(99, parseInt(v, 10) || 0))
}

export function hitChip(type: HitType): string {
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
