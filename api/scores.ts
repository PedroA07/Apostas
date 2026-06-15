// Função serverless (Vercel) que busca os jogos da Copa na API football-data.org
// e devolve um formato normalizado para o app.
//
// A chave da API fica APENAS no servidor (variável de ambiente), nunca no
// navegador. Configure na Vercel:
//   FOOTBALL_DATA_API_KEY = sua-chave   (grátis em football-data.org)
//   FOOTBALL_DATA_COMPETITION = WC      (opcional, padrão "WC")
//
// Responde sempre com HTTP 200 e um campo `ok` para o cliente tratar erros
// de forma amigável.

type AnyReq = { method?: string }
type AnyRes = {
  status: (code: number) => AnyRes
  setHeader: (k: string, v: string) => void
  json: (body: unknown) => void
}

interface NormalizedMatch {
  externalId: number
  utcDate: string
  status: string
  stage: string
  group: string | null
  home: { name: string | null; tla: string | null }
  away: { name: string | null; tla: string | null }
  homeScore: number | null
  awayScore: number | null
}

// Acessa as variáveis de ambiente sem depender dos tipos do Node
// (mantém a função compilável com a config de TypeScript do front-end).
const env: Record<string, string | undefined> =
  (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env ?? {}

export default async function handler(_req: AnyReq, res: AnyRes) {
  const key = env.FOOTBALL_DATA_API_KEY
  const competition = env.FOOTBALL_DATA_COMPETITION || 'WC'

  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120')

  if (!key) {
    return res.status(200).json({
      ok: false,
      error: 'sem_chave',
      message:
        'Configure FOOTBALL_DATA_API_KEY nas variáveis de ambiente da Vercel.',
      matches: [],
    })
  }

  try {
    const url = `https://api.football-data.org/v4/competitions/${encodeURIComponent(
      competition,
    )}/matches`
    const r = await fetch(url, { headers: { 'X-Auth-Token': key } })

    if (!r.ok) {
      return res.status(200).json({
        ok: false,
        error: `api_${r.status}`,
        message:
          r.status === 429
            ? 'Limite de requisições da API atingido. Tente novamente em instantes.'
            : `A API respondeu com status ${r.status}.`,
        matches: [],
      })
    }

    const data = (await r.json()) as { matches?: unknown[] }
    const list = Array.isArray(data.matches) ? data.matches : []

    const matches: NormalizedMatch[] = list.map((raw) => {
      const m = raw as Record<string, any>
      return {
        externalId: m.id,
        utcDate: m.utcDate,
        status: m.status,
        stage: m.stage,
        group: m.group ?? null,
        home: {
          name: m.homeTeam?.name ?? null,
          tla: m.homeTeam?.tla ?? null,
        },
        away: {
          name: m.awayTeam?.name ?? null,
          tla: m.awayTeam?.tla ?? null,
        },
        homeScore: m.score?.fullTime?.home ?? null,
        awayScore: m.score?.fullTime?.away ?? null,
      }
    })

    return res.status(200).json({ ok: true, matches })
  } catch {
    return res.status(200).json({
      ok: false,
      error: 'falha_requisicao',
      message: 'Não foi possível contatar a API de futebol.',
      matches: [],
    })
  }
}
