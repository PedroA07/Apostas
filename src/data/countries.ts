// Base de seleções para casar os dados vindos da API de futebol com o app.
// Cada país tem: code (FIFA/3 letras), nome em PT, bandeira e apelidos em
// inglês (como a API costuma nomear) para o casamento por nome.

export interface Country {
  code: string
  name: string
  flag: string
  /** nomes em inglês/variações usados pela API (em minúsculas, sem acento) */
  en: string[]
}

export const COUNTRY_DB: Country[] = [
  { code: 'BRA', name: 'Brasil', flag: '🇧🇷', en: ['brazil'] },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷', en: ['argentina'] },
  { code: 'FRA', name: 'França', flag: '🇫🇷', en: ['france'] },
  { code: 'ENG', name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', en: ['england'] },
  { code: 'ESP', name: 'Espanha', flag: '🇪🇸', en: ['spain'] },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹', en: ['portugal'] },
  { code: 'GER', name: 'Alemanha', flag: '🇩🇪', en: ['germany'] },
  { code: 'NED', name: 'Holanda', flag: '🇳🇱', en: ['netherlands', 'holland'] },
  { code: 'BEL', name: 'Bélgica', flag: '🇧🇪', en: ['belgium'] },
  { code: 'CRO', name: 'Croácia', flag: '🇭🇷', en: ['croatia'] },
  { code: 'ITA', name: 'Itália', flag: '🇮🇹', en: ['italy'] },
  { code: 'URU', name: 'Uruguai', flag: '🇺🇾', en: ['uruguay'] },
  { code: 'COL', name: 'Colômbia', flag: '🇨🇴', en: ['colombia'] },
  { code: 'ECU', name: 'Equador', flag: '🇪🇨', en: ['ecuador'] },
  { code: 'PAR', name: 'Paraguai', flag: '🇵🇾', en: ['paraguay'] },
  { code: 'PER', name: 'Peru', flag: '🇵🇪', en: ['peru'] },
  { code: 'CHI', name: 'Chile', flag: '🇨🇱', en: ['chile'] },
  { code: 'VEN', name: 'Venezuela', flag: '🇻🇪', en: ['venezuela'] },
  { code: 'BOL', name: 'Bolívia', flag: '🇧🇴', en: ['bolivia'] },
  { code: 'MEX', name: 'México', flag: '🇲🇽', en: ['mexico'] },
  { code: 'USA', name: 'Estados Unidos', flag: '🇺🇸', en: ['united states', 'usa', 'united states of america'] },
  { code: 'CAN', name: 'Canadá', flag: '🇨🇦', en: ['canada'] },
  { code: 'CRC', name: 'Costa Rica', flag: '🇨🇷', en: ['costa rica'] },
  { code: 'PAN', name: 'Panamá', flag: '🇵🇦', en: ['panama'] },
  { code: 'JAM', name: 'Jamaica', flag: '🇯🇲', en: ['jamaica'] },
  { code: 'HON', name: 'Honduras', flag: '🇭🇳', en: ['honduras'] },
  { code: 'MAR', name: 'Marrocos', flag: '🇲🇦', en: ['morocco'] },
  { code: 'SEN', name: 'Senegal', flag: '🇸🇳', en: ['senegal'] },
  { code: 'EGY', name: 'Egito', flag: '🇪🇬', en: ['egypt'] },
  { code: 'ALG', name: 'Argélia', flag: '🇩🇿', en: ['algeria'] },
  { code: 'TUN', name: 'Tunísia', flag: '🇹🇳', en: ['tunisia'] },
  { code: 'CIV', name: 'Costa do Marfim', flag: '🇨🇮', en: ['ivory coast', "cote d'ivoire", 'cote divoire'] },
  { code: 'GHA', name: 'Gana', flag: '🇬🇭', en: ['ghana'] },
  { code: 'RSA', name: 'África do Sul', flag: '🇿🇦', en: ['south africa'] },
  { code: 'NGA', name: 'Nigéria', flag: '🇳🇬', en: ['nigeria'] },
  { code: 'CMR', name: 'Camarões', flag: '🇨🇲', en: ['cameroon'] },
  { code: 'MLI', name: 'Mali', flag: '🇲🇱', en: ['mali'] },
  { code: 'CPV', name: 'Cabo Verde', flag: '🇨🇻', en: ['cape verde', 'cabo verde'] },
  { code: 'JPN', name: 'Japão', flag: '🇯🇵', en: ['japan'] },
  { code: 'KOR', name: 'Coreia do Sul', flag: '🇰🇷', en: ['south korea', 'korea republic', 'korea'] },
  { code: 'IRN', name: 'Irã', flag: '🇮🇷', en: ['iran', 'ir iran'] },
  { code: 'AUS', name: 'Austrália', flag: '🇦🇺', en: ['australia'] },
  { code: 'KSA', name: 'Arábia Saudita', flag: '🇸🇦', en: ['saudi arabia'] },
  { code: 'QAT', name: 'Catar', flag: '🇶🇦', en: ['qatar'] },
  { code: 'UZB', name: 'Uzbequistão', flag: '🇺🇿', en: ['uzbekistan'] },
  { code: 'JOR', name: 'Jordânia', flag: '🇯🇴', en: ['jordan'] },
  { code: 'IRQ', name: 'Iraque', flag: '🇮🇶', en: ['iraq'] },
  { code: 'UAE', name: 'Emirados Árabes', flag: '🇦🇪', en: ['united arab emirates', 'uae'] },
  { code: 'NZL', name: 'Nova Zelândia', flag: '🇳🇿', en: ['new zealand'] },
  { code: 'SUI', name: 'Suíça', flag: '🇨🇭', en: ['switzerland'] },
  { code: 'SRB', name: 'Sérvia', flag: '🇷🇸', en: ['serbia'] },
  { code: 'AUT', name: 'Áustria', flag: '🇦🇹', en: ['austria'] },
  { code: 'DEN', name: 'Dinamarca', flag: '🇩🇰', en: ['denmark'] },
  { code: 'NOR', name: 'Noruega', flag: '🇳🇴', en: ['norway'] },
  { code: 'POL', name: 'Polônia', flag: '🇵🇱', en: ['poland'] },
  { code: 'TUR', name: 'Turquia', flag: '🇹🇷', en: ['turkey', 'turkiye', 'türkiye'] },
  { code: 'SWE', name: 'Suécia', flag: '🇸🇪', en: ['sweden'] },
  { code: 'CZE', name: 'Tchéquia', flag: '🇨🇿', en: ['czechia', 'czech republic'] },
  { code: 'WAL', name: 'País de Gales', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', en: ['wales'] },
  { code: 'SCO', name: 'Escócia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', en: ['scotland'] },
  { code: 'UKR', name: 'Ucrânia', flag: '🇺🇦', en: ['ukraine'] },
  { code: 'GRE', name: 'Grécia', flag: '🇬🇷', en: ['greece'] },
  { code: 'HUN', name: 'Hungria', flag: '🇭🇺', en: ['hungary'] },
  { code: 'SVK', name: 'Eslováquia', flag: '🇸🇰', en: ['slovakia'] },
  { code: 'SVN', name: 'Eslovênia', flag: '🇸🇮', en: ['slovenia'] },
  { code: 'ROU', name: 'Romênia', flag: '🇷🇴', en: ['romania'] },
]

function norm(s: string): string {
  // NFD separa os acentos; o filtro [^a-z ] remove acentos e pontuação
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z ]/g, '')
    .trim()
}

const BY_CODE = new Map(COUNTRY_DB.map((c) => [c.code.toUpperCase(), c]))
const BY_NAME = new Map<string, Country>()
for (const c of COUNTRY_DB) {
  BY_NAME.set(norm(c.name), c)
  for (const e of c.en) BY_NAME.set(norm(e), c)
}

/** Resolve um país a partir da sigla (tla) e/ou do nome vindos da API. */
export function resolveCountry(
  name?: string | null,
  tla?: string | null,
): Country | undefined {
  if (tla) {
    const byTla = BY_CODE.get(tla.toUpperCase())
    if (byTla) return byTla
  }
  if (name) {
    const byName = BY_NAME.get(norm(name))
    if (byName) return byName
  }
  return undefined
}
