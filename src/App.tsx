import { useState } from 'react'
import {
  ClipboardList,
  Home,
  CalendarDays,
  Flag,
  Settings as SettingsIcon,
  Trophy,
  Users,
} from 'lucide-react'
import { useStore } from './store/store'
import { useAutoSyncTimer, useFootball } from './store/useFootball'
import { cx } from './utils'
import { Flag as CountryFlag } from './components/Flag'
import Dashboard from './views/Dashboard'
import MatchesView from './views/MatchesView'
import BrasilView from './views/BrasilView'
import PredictionsView from './views/PredictionsView'
import RankingView from './views/RankingView'
import ParticipantsView from './views/ParticipantsView'
import SettingsView from './views/SettingsView'

type Tab =
  | 'painel'
  | 'jogos'
  | 'brasil'
  | 'palpites'
  | 'ranking'
  | 'participantes'
  | 'config'

interface NavItem {
  id: Tab
  label: string
  icon: typeof Home
  /** emoji opcional usado no lugar do ícone (ex: bandeira) */
  emoji?: string
}

const NAV: NavItem[] = [
  { id: 'painel', label: 'Painel', icon: Home },
  { id: 'jogos', label: 'Jogos', icon: CalendarDays },
  { id: 'brasil', label: 'Brasil', icon: Flag, emoji: '🇧🇷' },
  { id: 'palpites', label: 'Palpites', icon: ClipboardList },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
  { id: 'participantes', label: 'Amigos', icon: Users },
  { id: 'config', label: 'Config', icon: SettingsIcon },
]

export default function App() {
  const { state } = useStore()
  const [tab, setTab] = useState<Tab>('painel')

  // sincronização automática de placares (quando ativada nas Configurações)
  const { syncNow } = useFootball()
  useAutoSyncTimer(syncNow)

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-pitch-600 to-emerald-500 text-white shadow-sm">
              <Trophy size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold leading-tight text-slate-900">
                {state.settings.name}
              </h1>
              <p className="text-xs font-medium text-slate-400">
                Copa do Mundo 2026 🇺🇸🇨🇦🇲🇽
              </p>
            </div>
          </div>

          {/* Navegação desktop */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={tab === item.id}
                onClick={() => setTab(item.id)}
              />
            ))}
          </nav>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-5xl animate-fade-in px-4 py-5">
        {tab === 'painel' && <Dashboard go={(t) => setTab(t as Tab)} />}
        {tab === 'jogos' && <MatchesView />}
        {tab === 'brasil' && <BrasilView go={(t) => setTab(t as Tab)} />}
        {tab === 'palpites' && <PredictionsView />}
        {tab === 'ranking' && <RankingView />}
        {tab === 'participantes' && <ParticipantsView />}
        {tab === 'config' && <SettingsView />}
      </main>

      {/* Navegação inferior (mobile) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-lg lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-5xl items-stretch justify-around">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={cx(
                  'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition',
                  active ? 'text-pitch-600' : 'text-slate-400',
                )}
              >
                <span
                  className={cx(
                    'grid place-items-center rounded-lg px-3 py-1 transition',
                    active && 'bg-pitch-50',
                  )}
                >
                  {item.emoji ? (
                    <CountryFlag emoji={item.emoji} name={item.label} size={18} />
                  ) : (
                    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  )}
                </span>
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition',
        active
          ? 'bg-pitch-50 text-pitch-700'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
      )}
    >
      {item.emoji ? (
        <CountryFlag emoji={item.emoji} name={item.label} size={16} />
      ) : (
        <Icon size={17} />
      )}
      {item.label}
    </button>
  )
}
