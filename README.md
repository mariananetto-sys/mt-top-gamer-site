# Matheus Top Gamer Entretenimentos — site

Site do canal [@MT-TOP-GAMER.2006](https://www.youtube.com/@MT-TOP-GAMER.2006). HTML, CSS e JavaScript puros, sem build.

## Publicar na Vercel

1. Entre em [vercel.com/new](https://vercel.com/new) e importe este repositório.
2. Framework Preset: **Other**. Não precisa de comando de build nem de pasta de saída.
3. Clique em **Deploy**.

## Atualizar vídeos

Abra `script.js` e edite as listas `VIDEOS` e `SHORTS` no topo do arquivo. O `id` é o código do link do YouTube (`watch?v=CODIGO` ou `/shorts/CODIGO`).

Os números de inscritos e vídeos ficam em `index.html` (procure por `inscritos`).

## Jogo: Matheus Top Gamer — A Aventura

Jogo de plataforma 2D em `jogo.html` (link no menu do site e na seção "O jogo do Matheus").

- Mundo 1: Colinas Tropicais, Caverna dos Cartuchos, Nuvens do Lag, Fábrica Bugsoft + chefão BUGSOFT.
- Mundo 2: Praia do Pixel, Feira Gamer, Fundo do Mar Digital (nadando), Ilha de Edição + chefão BUFFERÃO.
- Mapa de mundos para escolher e rejogar fases; segredos por fase ficam salvos.
- Amigos: Axolote (dicas), PS2 Gordo (loja), Babs Mary ("É brincadeira, Matheus!"), Inscrito 500 e a galera do Discord escondida em casinhas secretas.
- Inimigos: bug do lag, cartucho bravo, controle voador, glitch espinhento, caranguejo pixel, rodinha de carregamento, peixe-controle, sininho spam, hater do comentário e a bola de metal (normal e turbo) (pisar só deixa tonta; CD, casco ou estrela destroem).
- Power-ups: Controle Turbo (fica grande), Disco (joga CDs) e Estrela 100% (invencível). 100 fichas = 1 vida.
- Teclado (setas, Z pular, X correr/CD, Enter pausa, M som), controle USB/Bluetooth e botões na tela do celular.
- O progresso (fase liberada e recorde) fica salvo no navegador de quem joga.
- Toda a arte e as músicas são geradas por código, sem arquivos extras.

Arquivos em `game/`:

| Arquivo | O que tem |
| --- | --- |
| `levels.js` | O mapa de cada fase (tem uma legenda no topo explicando cada letra). É aqui que se mexe para mudar fases. |
| `art.js` | Personagens, inimigos, blocos e cenários em pixel art. |
| `audio.js` | Efeitos sonoros e músicas. |
| `main.js` | Física, inimigos, chefão, telas e controles. |
| `game.css` | Visual da página do jogo. |

## Rodar localmente

Abra o `index.html` no navegador ou rode:

```bash
npx serve .
```
