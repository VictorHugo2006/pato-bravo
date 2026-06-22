export interface Question {
  id: number;
  pergunta: string;
  resposta: number;
  categoria: string;
}

/**
 * Banco de perguntas próprio (respostas numéricas) — inspirado na mecânica de
 * "chutar números", mas com conteúdo autoral para ficar seguro pra publicar.
 * Sinta-se livre pra adicionar mais: basta seguir o formato.
 */
export const QUESTIONS: Question[] = [
  { id: 1, pergunta: "Quantos ossos tem o corpo humano adulto?", resposta: 206, categoria: "Corpo" },
  { id: 2, pergunta: "Quantos jogadores de um time ficam em campo no futebol?", resposta: 11, categoria: "Esporte" },
  { id: 3, pergunta: "Quantos estados tem o Brasil?", resposta: 26, categoria: "Brasil" },
  { id: 4, pergunta: "Quantas cartas tem um baralho tradicional (sem coringas)?", resposta: 52, categoria: "Curiosidade" },
  { id: 5, pergunta: "Quantos minutos dura um jogo de futebol no tempo normal (sem acréscimos)?", resposta: 90, categoria: "Esporte" },
  { id: 6, pergunta: "Quantos planetas tem o Sistema Solar?", resposta: 8, categoria: "Ciência" },
  { id: 7, pergunta: "Quantas casas tem um tabuleiro de xadrez?", resposta: 64, categoria: "Jogos" },
  { id: 8, pergunta: "Quantos dias tem fevereiro em ano bissexto?", resposta: 29, categoria: "Calendário" },
  { id: 9, pergunta: "Quantos oceanos existem no planeta?", resposta: 5, categoria: "Geografia" },
  { id: 10, pergunta: "Quantas teclas tem um piano tradicional?", resposta: 88, categoria: "Música" },
  { id: 11, pergunta: "Quantos anos tem um século?", resposta: 100, categoria: "Curiosidade" },
  { id: 12, pergunta: "Quantos lados tem um hexágono?", resposta: 6, categoria: "Matemática" },
  { id: 13, pergunta: "Quantos zeros tem o número um milhão?", resposta: 6, categoria: "Matemática" },
  { id: 14, pergunta: "Quantas cordas tem um violão tradicional?", resposta: 6, categoria: "Música" },
  { id: 15, pergunta: "Em que ano o Brasil foi 'descoberto' pelos portugueses?", resposta: 1500, categoria: "História" },
  { id: 16, pergunta: "Quantos jogadores de um time ficam em quadra no vôlei?", resposta: 6, categoria: "Esporte" },
  { id: 17, pergunta: "Quantas letras tem o alfabeto português oficial (com K, W e Y)?", resposta: 26, categoria: "Curiosidade" },
  { id: 18, pergunta: "Quantos graus tem um ângulo reto?", resposta: 90, categoria: "Matemática" },
  { id: 19, pergunta: "Quanto soma os ângulos internos de um triângulo (em graus)?", resposta: 180, categoria: "Matemática" },
  { id: 20, pergunta: "Quantas faces tem um dado comum?", resposta: 6, categoria: "Jogos" },
  { id: 21, pergunta: "Quantos segundos tem um minuto?", resposta: 60, categoria: "Curiosidade" },
  { id: 22, pergunta: "Quantas horas têm dois dias inteiros?", resposta: 48, categoria: "Curiosidade" },
  { id: 23, pergunta: "Quantos dedos há nas duas mãos juntas?", resposta: 10, categoria: "Corpo" },
  { id: 24, pergunta: "Quantos signos tem o zodíaco?", resposta: 12, categoria: "Curiosidade" },
  { id: 25, pergunta: "Quantas Copas do Mundo o Brasil já ganhou?", resposta: 5, categoria: "Esporte" },
  { id: 26, pergunta: "Quantos anéis tem o símbolo olímpico?", resposta: 5, categoria: "Esporte" },
  { id: 27, pergunta: "Em que ano o homem pisou na Lua pela primeira vez?", resposta: 1969, categoria: "História" },
  { id: 28, pergunta: "Quantos jogadores de um time ficam em quadra no basquete?", resposta: 5, categoria: "Esporte" },
  { id: 29, pergunta: "Quantas patas tem uma aranha?", resposta: 8, categoria: "Natureza" },
  { id: 30, pergunta: "Quantas vidas tem o gato, segundo o ditado popular?", resposta: 7, categoria: "Cultura" },
  { id: 31, pergunta: "Quantos quilômetros tem uma maratona (arredondado)?", resposta: 42, categoria: "Esporte" },
  { id: 32, pergunta: "Quantos elementos tem a tabela periódica atualmente?", resposta: 118, categoria: "Ciência" },
  { id: 33, pergunta: "Quantos dentes tem um adulto, contando os sisos?", resposta: 32, categoria: "Corpo" },
  { id: 34, pergunta: "Quantas estrelas tem a bandeira do Brasil?", resposta: 27, categoria: "Brasil" },
  { id: 35, pergunta: "Quantas estrelas tem a bandeira dos Estados Unidos?", resposta: 50, categoria: "Geografia" },
  { id: 36, pergunta: "Quantos meses do ano têm pelo menos 28 dias?", resposta: 12, categoria: "Pegadinha" },
  { id: 37, pergunta: "Quantos lados tem um octógono?", resposta: 8, categoria: "Matemática" },
  { id: 38, pergunta: "Quantas horas tem uma semana inteira?", resposta: 168, categoria: "Curiosidade" },
  { id: 39, pergunta: "Quantos dias tem um ano não bissexto?", resposta: 365, categoria: "Calendário" },
  { id: 40, pergunta: "A que temperatura a água ferve ao nível do mar (em °C)?", resposta: 100, categoria: "Ciência" },
  { id: 41, pergunta: "Quantos jogadores jogam uma partida de truco em duplas?", resposta: 4, categoria: "Jogos" },
  { id: 42, pergunta: "Quantas teclas de função (F1 a F12) tem um teclado comum?", resposta: 12, categoria: "Tecnologia" },
  { id: 43, pergunta: "Quantos minutos tem meia hora?", resposta: 30, categoria: "Curiosidade" },
  { id: 44, pergunta: "Quantas semanas tem um ano (aproximadamente)?", resposta: 52, categoria: "Calendário" },
  { id: 45, pergunta: "Quantos bytes tem 1 kilobyte (KB)?", resposta: 1024, categoria: "Tecnologia" },
  { id: 46, pergunta: "Quantos jogadores entram em campo no total numa partida de futebol (os dois times)?", resposta: 22, categoria: "Esporte" },
  { id: 47, pergunta: "Quantas cores tem o arco-íris?", resposta: 7, categoria: "Natureza" },
  { id: 48, pergunta: "Quantos anos durou a Guerra dos Cem Anos?", resposta: 116, categoria: "Pegadinha" },
  { id: 49, pergunta: "Quantas seleções disputam a Copa do Mundo a partir de 2026?", resposta: 48, categoria: "Esporte" },
  { id: 50, pergunta: "Quantos quilômetros tem a volta completa ao Equador da Terra (em milhares, arredondado)?", resposta: 40, categoria: "Geografia" },
  { id: 51, pergunta: "Quantas teclas pretas tem um piano?", resposta: 36, categoria: "Música" },
  { id: 52, pergunta: "Quantos jogadores titulares tem um time de futebol americano em campo?", resposta: 11, categoria: "Esporte" },
  { id: 53, pergunta: "Quantos lados tem um triângulo?", resposta: 3, categoria: "Matemática" },
  { id: 54, pergunta: "Quantos continentes existem (modelo usado no Brasil)?", resposta: 6, categoria: "Geografia" },
  { id: 55, pergunta: "Quantos jogadores tem um time de futsal em quadra?", resposta: 5, categoria: "Esporte" },
];
