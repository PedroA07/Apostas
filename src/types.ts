// ===== Modelos de dados do Bolão da Copa 2026 =====

export interface Team {
  /** Código curto único, ex: "BRA" */
  code: string
  /** Nome exibido, ex: "Brasil" */
  name: string
  /** Bandeira em emoji */
  flag: string
}

/** Fases do torneio */
export type Stage =
  | 'grupos'
  | '32avos'
  | 'oitavas'
  | 'quartas'
  | 'semis'
  | 'terceiro'
  | 'final'

export interface Match {
  id: string
  /** Código do time mandante (ou null se ainda indefinido) */
  homeCode: string | null
  /** Código do time visitante (ou null se ainda indefinido) */
  awayCode: string | null
  /** Rótulo do mandante quando o time ainda é indefinido, ex: "1º Grupo A" */
  homeLabel?: string
  awayLabel?: string
  stage: Stage
  /** Letra do grupo (A-L) quando stage === 'grupos' */
  group?: string
  /** Data/hora ISO do jogo */
  kickoff: string
  venue: string
  /** Placar real (null = ainda não jogado) */
  homeScore: number | null
  awayScore: number | null
  /** Jogo encerrado (resultado oficial lançado) */
  finished: boolean
  /** ID do jogo na API de futebol (usado para atualização automática do placar) */
  externalId?: number
}

export interface Participant {
  id: string
  name: string
  /** Cor de identidade visual (hex) */
  color: string
  /** Pagou o valor da aposta? */
  paid: boolean
  /** Valor apostado por esta pessoa. Se ausente, usa o valor padrão do bolão. */
  betValue?: number
  /** Chave Pix para receber o prêmio caso vença. */
  pixKey?: string
  createdAt: number
}

export interface Prediction {
  /** id único do palpite (um jogador pode ter vários palpites no mesmo jogo) */
  id: string
  participantId: string
  matchId: string
  homeScore: number
  awayScore: number
  updatedAt: number
}

export interface ScoringRules {
  /** Pontos por acertar o placar exato */
  exact: number
  /** Pontos por acertar o resultado (vencedor ou empate) */
  result: number
  /** Pontos extra por acertar o nº de gols de pelo menos um time */
  goals: number
}

export interface PrizeSplit {
  first: number
  second: number
  third: number
}

export interface AutoUpdateSettings {
  /** Buscar placares reais automaticamente */
  enabled: boolean
  /** Intervalo entre sincronizações (minutos) */
  intervalMin: number
  /** Timestamp da última sincronização */
  lastSync?: number
  /** Status da última tentativa (ex: "ok", "sem chave", "erro") */
  lastStatus?: string
  /** Quantos jogos foram atualizados na última sincronização */
  lastCount?: number
}

export interface PoolSettings {
  /** Nome do bolão */
  name: string
  /** Valor da aposta por participante */
  buyIn: number
  /** Símbolo da moeda */
  currency: string
  scoring: ScoringRules
  /** Divisão do prêmio em % (deve somar 100) */
  prizeSplit: PrizeSplit
  /** Atualização automática de placares via API de futebol */
  autoUpdate: AutoUpdateSettings
}

export interface AppState {
  settings: PoolSettings
  teams: Team[]
  /** mapa letra do grupo (A-L) -> lista de códigos de time */
  groups: Record<string, string[]>
  participants: Participant[]
  matches: Match[]
  /** mapa "participantId:matchId" -> lista de palpites (vários por jogo) */
  predictions: Record<string, Prediction[]>
  /** versão do schema para migrações futuras */
  version: number
}
