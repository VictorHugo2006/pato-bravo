# Pato Bravo 🦆

Jogo de cartas **online multiplayer** de chutar números, blefe e desafio — inspirado na mecânica de "Nem a Pato!", com nome e perguntas próprias (seguro pra publicar).

**Stack:** Next.js (App Router) + TypeScript + Tailwind v4 + Supabase Realtime (PWA instalável).

## Como funciona o multiplayer
Sem banco de dados nem RLS: usa **Supabase Realtime** (presence + broadcast). O criador da sala é o **host autoritativo** — mantém o estado do jogo, recebe as ações dos outros jogadores e re-transmite o estado para todos. Só precisa de URL + anon key.

## Configurar (rodar localmente)
1. Crie um projeto no [Supabase](https://supabase.com) (free).
2. Em **Project Settings → API**, copie a *Project URL* e a *anon public key*.
3. Preencha o `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```
   > Não precisa criar tabelas. Só confira que **Realtime** está habilitado (vem ligado por padrão).
4. `npm install` e `npm run dev` → http://localhost:3008

## Como jogar
1. Um jogador clica **Criar sala** e compartilha o código de 4 letras.
2. Os outros entram pelo código (ou link).
3. A cada rodada aparece uma pergunta de resposta numérica. Na sua vez, **chute um número maior** que o anterior — ou grite **"Pato Bravo!"** pra desafiar o último palpite.
4. Revela-se a resposta: palpite ≤ resposta → quem desafiou leva a carta; palpite > resposta → quem chutou leva.
5. No fim, **quem tiver mais cartas perde**.

## Adicionar perguntas
Edite `lib/questions.ts` — basta seguir o formato `{ id, pergunta, resposta, categoria }`.

## Testar a lógica
```
npx tsx scripts/test-logic.ts
```
