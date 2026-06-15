import { useRef, useState } from 'react'
import {
  AlertTriangle,
  Coins,
  Download,
  Goal,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  Sparkles,
  Trophy,
  Upload,
  Users2,
} from 'lucide-react'
import { useStore } from '../store/store'
import { ConfirmButton, SectionTitle } from '../components/ui'
import { GROUP_LETTERS } from '../data/teams'
import { cx } from '../utils'

export default function SettingsView() {
  const { state, updateSettings, exportData, importData, resetAll } = useStore()
  const { settings } = state

  return (
    <div className="space-y-5">
      <SectionTitle
        icon={<SettingsIcon size={20} />}
        title="Configurações"
        subtitle="Valor da aposta, pontuação, prêmios e dados"
      />

      <PoolSection
        name={settings.name}
        buyIn={settings.buyIn}
        currency={settings.currency}
        onSave={(patch) => updateSettings(patch)}
      />

      <ScoringSection
        scoring={settings.scoring}
        onSave={(scoring) => updateSettings({ scoring })}
      />

      <PrizeSection
        split={settings.prizeSplit}
        onSave={(prizeSplit) => updateSettings({ prizeSplit })}
      />

      <GroupsSection />

      <DataSection
        onExport={exportData}
        onImport={importData}
        onReset={resetAll}
      />
    </div>
  )
}

function PoolSection({
  name,
  buyIn,
  currency,
  onSave,
}: {
  name: string
  buyIn: number
  currency: string
  onSave: (patch: { name?: string; buyIn?: number; currency?: string }) => void
}) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
        <Trophy size={18} className="text-gold-500" /> O bolão
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Nome do bolão</label>
          <input
            className="input"
            value={name}
            onChange={(e) => onSave({ name: e.target.value })}
            placeholder="Ex: Bolão da firma 2026"
          />
        </div>
        <div>
          <label className="label">Valor da aposta (por pessoa)</label>
          <div className="flex gap-2">
            <input
              className="input w-20 shrink-0 text-center"
              value={currency}
              onChange={(e) => onSave({ currency: e.target.value })}
              maxLength={4}
            />
            <input
              type="number"
              min={0}
              step="0.01"
              className="input"
              value={buyIn}
              onChange={(e) => onSave({ buyIn: Math.max(0, Number(e.target.value)) })}
            />
          </div>
        </div>
        <div className="flex items-end">
          <p className="text-sm text-slate-500">
            Esse é o valor que cada participante paga para entrar. O prêmio total
            é a soma de todos que pagaram.
          </p>
        </div>
      </div>
    </div>
  )
}

function ScoringSection({
  scoring,
  onSave,
}: {
  scoring: { exact: number; result: number; goals: number }
  onSave: (s: { exact: number; result: number; goals: number }) => void
}) {
  return (
    <div className="card p-5">
      <h3 className="mb-1 flex items-center gap-2 font-bold text-slate-900">
        <Goal size={18} className="text-pitch-600" /> Pontuação
      </h3>
      <p className="mb-4 text-sm text-slate-500">
        Defina quantos pontos vale cada tipo de acerto.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <ScoreRule
          label="Placar exato"
          hint="Cravou o placar"
          value={scoring.exact}
          onChange={(exact) => onSave({ ...scoring, exact })}
          accent="pitch"
        />
        <ScoreRule
          label="Resultado certo"
          hint="Acertou quem venceu / empate"
          value={scoring.result}
          onChange={(result) => onSave({ ...scoring, result })}
          accent="blue"
        />
        <ScoreRule
          label="Gols de um time (extra)"
          hint="Acertou os gols de um dos times"
          value={scoring.goals}
          onChange={(goals) => onSave({ ...scoring, goals })}
          accent="gold"
        />
      </div>
    </div>
  )
}

function ScoreRule({
  label,
  hint,
  value,
  onChange,
  accent,
}: {
  label: string
  hint: string
  value: number
  onChange: (v: number) => void
  accent: 'pitch' | 'blue' | 'gold'
}) {
  const ring = {
    pitch: 'focus-within:ring-pitch-500/20 focus-within:border-pitch-500',
    blue: 'focus-within:ring-blue-500/20 focus-within:border-blue-500',
    gold: 'focus-within:ring-gold-500/20 focus-within:border-gold-500',
  }[accent]
  return (
    <div
      className={cx(
        'rounded-xl border border-slate-200 p-3 transition focus-within:ring-2',
        ring,
      )}
    >
      <div className="text-sm font-bold text-slate-800">{label}</div>
      <div className="mb-2 text-xs text-slate-400">{hint}</div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 text-center text-2xl font-black text-slate-900 outline-none"
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        />
        <span className="text-xs font-semibold text-slate-400">pts</span>
      </div>
    </div>
  )
}

function PrizeSection({
  split,
  onSave,
}: {
  split: { first: number; second: number; third: number }
  onSave: (s: { first: number; second: number; third: number }) => void
}) {
  const total = split.first + split.second + split.third
  const valid = total === 100
  return (
    <div className="card p-5">
      <h3 className="mb-1 flex items-center gap-2 font-bold text-slate-900">
        <Coins size={18} className="text-gold-500" /> Divisão do prêmio
      </h3>
      <p className="mb-4 text-sm text-slate-500">
        Como o valor arrecadado será dividido entre os primeiros colocados (%).
      </p>
      <div className="grid grid-cols-3 gap-3">
        {(['first', 'second', 'third'] as const).map((key, i) => (
          <div key={key}>
            <label className="label">{i + 1}º lugar</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                className="input text-center text-lg font-bold"
                value={split[key]}
                onChange={(e) =>
                  onSave({
                    ...split,
                    [key]: Math.max(0, Math.min(100, Number(e.target.value))),
                  })
                }
              />
              <span className="text-sm font-semibold text-slate-400">%</span>
            </div>
          </div>
        ))}
      </div>
      <div
        className={cx(
          'mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
          valid
            ? 'bg-pitch-50 text-pitch-700'
            : 'bg-amber-50 text-amber-700',
        )}
      >
        {valid ? (
          <>Soma = 100% ✓</>
        ) : (
          <>
            <AlertTriangle size={15} /> A soma está em {total}% (precisa dar 100%)
          </>
        )}
      </div>
    </div>
  )
}

function GroupsSection() {
  const { state, regenerateGroupMatches } = useStore()
  const { teams, groups } = state
  const [draft, setDraft] = useState<Record<string, string[]>>(() =>
    structuredClone(groups),
  )
  const [saved, setSaved] = useState(false)

  const setSlot = (letter: string, idx: number, code: string) => {
    setDraft((d) => {
      const next = structuredClone(d)
      if (!next[letter]) next[letter] = ['', '', '', '']
      next[letter][idx] = code
      return next
    })
    setSaved(false)
  }

  const apply = () => {
    // remove slots vazios
    const clean: Record<string, string[]> = {}
    for (const letter of GROUP_LETTERS) {
      clean[letter] = (draft[letter] ?? []).filter(Boolean)
    }
    regenerateGroupMatches(clean)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="card p-5">
      <h3 className="mb-1 flex items-center gap-2 font-bold text-slate-900">
        <Users2 size={18} className="text-pitch-600" /> Grupos da Copa
      </h3>
      <p className="mb-4 text-sm text-slate-500">
        Ajuste as seleções de cada grupo. Ao salvar, os jogos da fase de grupos
        são gerados automaticamente (todos contra todos).
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GROUP_LETTERS.map((letter) => (
          <div key={letter} className="rounded-xl border border-slate-200 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-pitch-600 text-xs font-bold text-white">
                {letter}
              </span>
              <span className="text-sm font-bold text-slate-700">
                Grupo {letter}
              </span>
            </div>
            <div className="space-y-1.5">
              {[0, 1, 2, 3].map((idx) => (
                <select
                  key={idx}
                  className="input py-1.5 text-sm"
                  value={draft[letter]?.[idx] ?? ''}
                  onChange={(e) => setSlot(letter, idx, e.target.value)}
                >
                  <option value="">—</option>
                  {teams.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.flag} {t.name}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <ConfirmButton
          onConfirm={apply}
          className="btn-primary"
          confirmLabel="Gerar jogos? (apaga placares da fase de grupos)"
        >
          <Sparkles size={16} /> Salvar grupos e gerar jogos
        </ConfirmButton>
        {saved && (
          <span className="text-sm font-semibold text-pitch-600">
            Jogos gerados! ✓
          </span>
        )}
      </div>
    </div>
  )
}

function DataSection({
  onExport,
  onImport,
  onReset,
}: {
  onExport: () => void
  onImport: (json: string) => boolean
  onReset: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const ok = onImport(String(reader.result))
      setMsg(
        ok
          ? { ok: true, text: 'Bolão importado com sucesso!' }
          : { ok: false, text: 'Arquivo inválido. Verifique o backup.' },
      )
      setTimeout(() => setMsg(null), 3500)
    }
    reader.readAsText(file)
  }

  return (
    <div className="card p-5">
      <h3 className="mb-1 flex items-center gap-2 font-bold text-slate-900">
        <Save size={18} className="text-blue-500" /> Backup e dados
      </h3>
      <p className="mb-4 text-sm text-slate-500">
        Os dados ficam salvos neste navegador. Exporte um arquivo para guardar ou
        compartilhar com os amigos, e importe para restaurar.
      </p>
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={onExport}>
          <Download size={16} /> Exportar backup
        </button>
        <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
          <Upload size={16} /> Importar backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ''
          }}
        />
        <ConfirmButton
          onConfirm={onReset}
          className="btn-danger ml-auto"
          confirmLabel="Apagar tudo e recomeçar?"
        >
          <RotateCcw size={16} /> Resetar bolão
        </ConfirmButton>
      </div>
      {msg && (
        <div
          className={cx(
            'mt-3 rounded-lg px-3 py-2 text-sm font-semibold',
            msg.ok ? 'bg-pitch-50 text-pitch-700' : 'bg-red-50 text-red-600',
          )}
        >
          {msg.text}
        </div>
      )}
    </div>
  )
}
