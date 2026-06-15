import type { Match, Prediction, ScoringRules } from '../types'

export type HitType = 'exact' | 'result' | 'goals' | 'miss' | 'pending'

export interface ScoredPrediction {
  points: number
  type: HitType
}

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0)

/**
 * Calcula os pontos de um palpite frente ao resultado real do jogo.
 *
 * - placar exato  -> scoring.exact
 * - resultado certo (vencedor/empate) -> scoring.result
 *   (+ scoring.goals se também acertou o nº de gols de pelo menos um time)
 * - acertou só o nº de gols de um time -> scoring.goals
 * - errou tudo -> 0
 *
 * Empates do jogo (ex: 1×1) são tratados normalmente: contam como "resultado".
 */
export function scorePrediction(
  prediction: Prediction | undefined,
  match: Match,
  rules: ScoringRules,
): ScoredPrediction {
  if (!match.finished || match.homeScore === null || match.awayScore === null) {
    return { points: 0, type: 'pending' }
  }
  if (!prediction) {
    return { points: 0, type: 'miss' }
  }

  const exactHome = prediction.homeScore === match.homeScore
  const exactAway = prediction.awayScore === match.awayScore

  if (exactHome && exactAway) {
    return { points: rules.exact, type: 'exact' }
  }

  const predResult = sign(prediction.homeScore - prediction.awayScore)
  const realResult = sign(match.homeScore - match.awayScore)
  const oneTeamGoals = exactHome || exactAway

  if (predResult === realResult) {
    return {
      points: rules.result + (oneTeamGoals ? rules.goals : 0),
      type: 'result',
    }
  }

  if (oneTeamGoals) {
    return { points: rules.goals, type: 'goals' }
  }

  return { points: 0, type: 'miss' }
}

/**
 * Quando um jogador faz vários palpites no mesmo jogo, vale o MELHOR deles.
 * Retorna também qual palpite venceu (para destacar na interface).
 */
export function bestScore(
  predictions: Prediction[] | undefined,
  match: Match,
  rules: ScoringRules,
): ScoredPrediction & { bestId?: string } {
  if (!match.finished || match.homeScore === null || match.awayScore === null) {
    return { points: 0, type: 'pending' }
  }
  if (!predictions || predictions.length === 0) {
    return { points: 0, type: 'miss' }
  }
  let best: ScoredPrediction & { bestId?: string } = { points: -1, type: 'miss' }
  for (const pred of predictions) {
    const s = scorePrediction(pred, match, rules)
    if (s.points > best.points) {
      best = { ...s, bestId: pred.id }
    }
  }
  return best
}

export interface StandingRow {
  participantId: string
  points: number
  exacts: number
  results: number
  played: number
  /** posição com empates (1, 2, 2, 4…) */
  position: number
}

function sameRank(a: StandingRow, b: StandingRow): boolean {
  return (
    a.points === b.points &&
    a.exacts === b.exacts &&
    a.results === b.results
  )
}

/** Calcula a classificação geral do bolão (considerando o melhor palpite por jogo). */
export function computeStandings(
  participants: { id: string }[],
  matches: Match[],
  predictions: Record<string, Prediction[]>,
  rules: ScoringRules,
): StandingRow[] {
  const rows: StandingRow[] = participants.map((p) => ({
    participantId: p.id,
    points: 0,
    exacts: 0,
    results: 0,
    played: 0,
    position: 0,
  }))
  const byId = new Map(rows.map((r) => [r.participantId, r]))

  for (const match of matches) {
    if (!match.finished) continue
    for (const p of participants) {
      const row = byId.get(p.id)!
      const preds = predictions[`${p.id}:${match.id}`]
      const scored = bestScore(preds, match, rules)
      if (scored.type === 'pending') continue
      row.played++
      row.points += scored.points
      if (scored.type === 'exact') row.exacts++
      if (scored.type === 'exact' || scored.type === 'result') row.results++
    }
  }

  // ordena por pontos, depois placares exatos, depois acertos de resultado
  rows.sort(
    (a, b) =>
      b.points - a.points || b.exacts - a.exacts || b.results - a.results,
  )

  // atribui posições, com empate compartilhando a mesma posição
  rows.forEach((row, i) => {
    row.position = i > 0 && sameRank(row, rows[i - 1]) ? rows[i - 1].position : i + 1
  })

  return rows
}
