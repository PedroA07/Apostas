import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import {
  applyApiScores,
  buildScheduleFromApi,
  fetchApiMatches,
  type ScoresResponse,
} from '../services/football'

export interface FootballMessage {
  ok: boolean
  text: string
}

function messageForError(resp: ScoresResponse): string {
  if (resp.message) return resp.message
  switch (resp.error) {
    case 'sem_chave':
      return 'Configure a chave da API (FOOTBALL_DATA_API_KEY) nas variáveis de ambiente da Vercel.'
    case 'sem_conexao':
      return 'Sem conexão com o servidor de placares. Em desenvolvimento local, rode com "vercel dev".'
    case 'http_404':
      return 'Função de placares não encontrada. Publique o projeto na Vercel para ativar.'
    case 'api_429':
      return 'Limite de requisições da API atingido. Tente novamente em alguns minutos.'
    default:
      return 'Não foi possível atualizar os placares agora.'
  }
}

/** Ações de integração com a API: sincronizar placares e importar a tabela. */
export function useFootball() {
  const { state, setMatches, setAutoUpdate, importSchedule } = useStore()
  const matchesRef = useRef(state.matches)
  matchesRef.current = state.matches
  const teamsRef = useRef(state.teams)
  teamsRef.current = state.teams

  const [busy, setBusy] = useState<null | 'sync' | 'import'>(null)
  const [message, setMessage] = useState<FootballMessage | null>(null)

  const syncNow = useCallback(async () => {
    setBusy('sync')
    const resp = await fetchApiMatches()
    if (!resp.ok) {
      setAutoUpdate({
        lastSync: Date.now(),
        lastStatus: resp.error ?? 'erro',
        lastCount: 0,
      })
      setMessage({ ok: false, text: messageForError(resp) })
      setBusy(null)
      return
    }
    const { matches, updated } = applyApiScores(resp.matches, matchesRef.current)
    if (updated > 0) setMatches(matches)
    setAutoUpdate({ lastSync: Date.now(), lastStatus: 'ok', lastCount: updated })
    setMessage({
      ok: true,
      text:
        updated > 0
          ? `${updated} placar(es) atualizado(s) automaticamente!`
          : 'Tudo em dia — nenhum placar novo.',
    })
    setBusy(null)
  }, [setMatches, setAutoUpdate])

  const importNow = useCallback(async () => {
    setBusy('import')
    const resp = await fetchApiMatches()
    if (!resp.ok) {
      setMessage({ ok: false, text: messageForError(resp) })
      setBusy(null)
      return
    }
    if (resp.matches.length === 0) {
      setMessage({
        ok: false,
        text: 'A API não retornou jogos para esta competição ainda.',
      })
      setBusy(null)
      return
    }
    const built = buildScheduleFromApi(resp.matches, teamsRef.current)
    importSchedule({
      teams: built.teams,
      groups: built.groups,
      matches: built.matches,
    })
    setAutoUpdate({
      lastSync: Date.now(),
      lastStatus: 'ok',
      lastCount: built.matches.filter((m) => m.finished).length,
    })
    setMessage({
      ok: true,
      text: `Tabela importada da API: ${built.count} jogos.`,
    })
    setBusy(null)
  }, [importSchedule, setAutoUpdate])

  return { syncNow, importNow, busy, message, setMessage }
}

/** Dispara a sincronização periódica enquanto a atualização automática estiver ativa. */
export function useAutoSyncTimer(syncNow: () => void) {
  const { state } = useStore()
  const { enabled, intervalMin } = state.settings.autoUpdate
  const ref = useRef(syncNow)
  ref.current = syncNow

  useEffect(() => {
    if (!enabled) return
    ref.current() // sincroniza imediatamente ao ativar/abrir
    const ms = Math.max(1, intervalMin) * 60_000
    const id = setInterval(() => ref.current(), ms)
    return () => clearInterval(id)
  }, [enabled, intervalMin])
}
