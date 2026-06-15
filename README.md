# 🏆 Bolão da Copa 2026

Um sistema visual e organizado para você e seus amigos criarem um **bolão da Copa
do Mundo de 2026**: cadastrar participantes, definir o valor da aposta, registrar
os palpites de cada jogo e acompanhar o ranking e a premiação automaticamente.

![Stack](https://img.shields.io/badge/React-18-149eca) ![Stack](https://img.shields.io/badge/TypeScript-5-3178c6) ![Stack](https://img.shields.io/badge/Vite-5-646cff) ![Stack](https://img.shields.io/badge/Tailwind-3-38bdf8)

## ✨ O que dá pra fazer

- **Painel** com o prêmio total acumulado, próximos jogos e líder do bolão.
- **Participantes (amigos)**: adicione todo mundo com o **valor que cada um
  aposta** (com um valor padrão para agilizar), marque quem já pagou e acompanhe
  quanto foi arrecadado e quanto falta receber. Cada um cadastra a **chave Pix**
  para receber o prêmio.
- **Pix do vencedor**: ao fim do bolão aparece o campeão com um botão para
  **copiar a chave Pix do vencedor**, e as posições premiadas também têm botão de
  copiar Pix para facilitar o pagamento.
- **Placares automáticos** (opcional): busca os resultados reais da Copa em uma
  API de futebol e **atualiza os placares sozinho**, recalculando ranking e
  prêmios. Veja a configuração abaixo.
- **Feito para o celular**: layout responsivo de verdade, com navegação inferior,
  campos que não dão zoom indesejado no iOS e respeito à área segura (notch).
- **Jogos**: calendário organizado por **grupos e fases** (da fase de grupos até a
  final). Lance os resultados oficiais de cada partida. Os 72 jogos da fase de
  grupos já vêm gerados — e você pode editar tudo ou adicionar os jogos do
  mata-mata.
- **Brasil** 🇧🇷: uma aba só da Seleção, com o retrospecto (vitórias, empates,
  derrotas e gols), o grupo, todos os jogos do Brasil (com lançamento de
  resultado), os palpites de cada um nesses jogos e um **ranking específico dos
  jogos do Brasil**.
- **Palpites**: registre os placares, por pessoa ou por jogo. Cada apostador pode
  dar **quantos palpites quiser para o mesmo jogo** — vale o **melhor** deles na
  pontuação. No modo "por jogo" há um **seletor com busca** (por time, fase, grupo
  ou estádio) e **bandeiras** para achar a partida rapidinho.
- **Ranking**: classificação automática com pódio, pontos, placares exatos e a
  divisão do prêmio em dinheiro. **Trata empates**: quem empata divide a mesma
  posição, e se houver empate na liderança todos aparecem como campeões com o
  prêmio dividido (cada um com seu botão de Pix).
- **Pontuação configurável**: placar exato, resultado certo e acerto dos gols de
  um time — você define quantos pontos vale cada um.
- **Valor da aposta e prêmios**: defina o buy-in por pessoa, a moeda e como o
  bolo é dividido entre 1º, 2º e 3º lugares.
- **Backup**: exporte/importe o bolão em um arquivo para guardar ou compartilhar.

## 🧮 Como funciona a pontuação

Para cada jogo encerrado, o palpite de cada participante vale (valores padrão,
todos editáveis em **Configurações → Pontuação**):

| Acerto | Pontos | Exemplo (resultado real 2×1) |
| --- | --- | --- |
| **Placar exato** | 10 | palpitou 2×1 |
| **Resultado certo** (vencedor ou empate) | 5 | palpitou 3×0 |
| **+ Gols de um time** (bônus) | +2 | palpitou 2×0 → 5 + 2 = 7 |
| Só os gols de um time (errou o resultado) | 2 | palpitou 0×1 (acertou o 1 do visitante) |
| Errou tudo | 0 | palpitou 0×3 |

Quando alguém dá **vários palpites no mesmo jogo**, conta o **melhor** deles
naquele jogo. Empates do jogo (ex: 1×1) contam normalmente como "resultado".

O **prêmio total** é a soma do valor da aposta de todos que pagaram, dividido
entre os primeiros colocados conforme os percentuais configurados. Em caso de
**empate na classificação**, os empatados dividem igualmente o prêmio das
posições que ocupam.

## 🚀 Como rodar

Pré-requisito: [Node.js](https://nodejs.org) 18+ instalado.

```bash
# instalar as dependências
npm install

# rodar em modo de desenvolvimento (abre em http://localhost:5173)
npm run dev

# gerar a versão de produção (pasta dist/)
npm run build

# pré-visualizar a versão de produção
npm run preview
```

## ▲ Publicar na Vercel

O projeto já vem pronto para a Vercel (há um `vercel.json` configurado).

**Pelo site (mais fácil):**

1. Acesse [vercel.com](https://vercel.com) e faça login com o GitHub.
2. Clique em **Add New… → Project** e importe o repositório `pedroa07/apostas`.
3. A Vercel detecta o Vite sozinho (Build: `npm run build`, Output: `dist`).
   É só clicar em **Deploy**.
4. Em segundos você recebe um link público (ex: `seu-bolao.vercel.app`) para
   mandar no grupo dos amigos. 🎉

**Pelo terminal (CLI):**

```bash
npm i -g vercel
vercel          # primeira publicação (responda às perguntas)
vercel --prod   # publicar em produção
```

> ⚠️ **Importante sobre os dados:** publicar na Vercel deixa o app *acessível*
> por um link, mas **os dados continuam salvos no navegador de cada pessoa**
> (não há servidor compartilhado). Ou seja, o link é o mesmo, mas cada um vê o
> seu próprio bolão. Para um bolão de verdade compartilhado entre todos, o ideal
> é **uma pessoa ser a organizadora** e lançar os palpites/resultados (usando o
> *Exportar/Importar backup* para guardar), **ou** evoluir o app para um banco de
> dados online (ex: Supabase) com sincronização em tempo real.

## ⚡ Placares automáticos (API de futebol)

Para os placares atualizarem sozinhos com os resultados reais da Copa:

1. Crie uma **chave grátis** em
   [football-data.org/client/register](https://www.football-data.org/client/register).
2. No painel da Vercel, em **Settings → Environment Variables**, adicione:
   - `FOOTBALL_DATA_API_KEY` = a sua chave
   - `FOOTBALL_DATA_COMPETITION` = `WC` (opcional; padrão já é a Copa do Mundo)
3. Faça um novo deploy (a Vercel reimplanta sozinha a cada push).
4. No app, vá em **Configurações → Placares automáticos**:
   - Clique em **Importar tabela real da Copa** (uma vez) para trazer os jogos
     oficiais — isso substitui a tabela de exemplo e já casa cada jogo com a API.
   - Ligue a **Atualização automática** e escolha o intervalo. Pronto: enquanto o
     app estiver aberto, os placares finalizados entram sozinhos e o ranking e os
     prêmios se atualizam.

**Como funciona por baixo:** o app nunca fala direto com a API. Ele chama a
função serverless `api/scores.ts` (na Vercel), que guarda a chave **somente no
servidor** e devolve os jogos já normalizados — resolvendo segurança da chave e
CORS de uma vez. Sem a chave configurada, o app continua funcionando no modo
manual normalmente.

> 💡 Em desenvolvimento local, a função `/api/scores` só roda com
> `vercel dev` (o `npm run dev` comum não executa as funções serverless).

## 📲 Como usar com os amigos

1. Em **Configurações**, ajuste o nome do bolão, o **valor padrão da aposta** e a
   divisão do prêmio. Confira/edite os **grupos** da Copa (já vêm preenchidos) e
   clique em *Salvar grupos e gerar jogos*.
2. Na aba **Amigos**, adicione todo mundo. Digite o valor de cada um (ou deixe em
   branco para usar o padrão) e marque quem já pagou.
3. Na aba **Palpites**, registre o placar que cada um cravou para os jogos.
4. Conforme a Copa acontece, lance os resultados reais na aba **Jogos**.
5. Acompanhe a disputa na aba **Ranking** — os pontos e os prêmios são
   calculados sozinhos. 🥇

> 💡 **Onde ficam os dados?** Tudo é salvo no navegador do dispositivo (localStorage).
> Para compartilhar o mesmo bolão entre vários celulares/computadores, use
> **Configurações → Exportar backup** e envie o arquivo, ou hospede o app e
> combine de uma pessoa ser a organizadora dos lançamentos. Dá também para
> evoluir para um banco de dados online (ex: Supabase) caso queira sincronização
> em tempo real entre todos.

## 🗂️ Estrutura do projeto

```
src/
├── App.tsx                 # navegação e layout principal
├── types.ts                # modelos de dados (Jogo, Palpite, Participante…)
├── utils.ts                # formatação de datas, dinheiro, helpers
├── data/
│   ├── teams.ts            # 48 seleções + distribuição em 12 grupos
│   ├── venues.ts           # 16 cidades-sede da Copa 2026
│   └── seed.ts             # estado inicial e geração dos jogos de grupo
├── store/
│   ├── store.tsx           # estado global + persistência (localStorage)
│   └── scoring.ts          # cálculo de pontos e classificação
├── components/             # UI reutilizável (modal, avatar, cartões…)
└── views/                  # telas: Painel, Jogos, Palpites, Ranking, etc.
```

## ⚠️ Sobre os dados da Copa

As seleções, grupos, datas e estádios já vêm preenchidos como ponto de partida
e **podem ser totalmente editados** dentro do app (grupos em *Configurações*;
data, estádio e placar em cada jogo). Ajuste conforme o sorteio e a tabela
oficial da FIFA.

---

Feito para a torcida. Boa sorte no bolão! ⚽🏆
