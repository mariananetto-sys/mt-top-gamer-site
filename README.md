# Matheus Top Gamer Entretenimentos — site

Site do canal [@MT-TOP-GAMER.2006](https://www.youtube.com/@MT-TOP-GAMER.2006). HTML, CSS e JavaScript puros, sem build.

## Publicar na Vercel

1. Entre em [vercel.com/new](https://vercel.com/new) e importe este repositório.
2. Framework Preset: **Other**. Não precisa de comando de build nem de pasta de saída.
3. Clique em **Deploy**.

## Vídeos e shorts (atualizam sozinhos)

A função `api/videos.js` roda na Vercel e lê as páginas públicas de vídeos e shorts do canal no YouTube (sem chave de API). Ao abrir o site, ele busca essa lista e mostra os vídeos mais novos; a resposta fica guardada em cache por 15 minutos.

Se a função falhar (ou se o site for aberto direto do computador, sem a Vercel), aparecem as listas fixas `VIDEOS` e `SHORTS` no topo do `script.js`, que dá para editar à mão.

Os números de inscritos e vídeos do topo também vêm da função (os de `index.html` são só a reserva).

## Jogo: Matheus Top Gamer — A Aventura

Jogo de plataforma 2D em `jogo.html` (link no menu do site e na seção "O jogo do Matheus").

- Mundo 1: Colinas Tropicais, Caverna dos Cartuchos, Nuvens do Lag, Fábrica Bugsoft + chefão BUGSOFT.
- Mundo 2: Praia do Pixel, Feira Gamer, Fundo do Mar Digital (nadando), Ilha de Edição + chefão BUFFERÃO.
- Mundo 3: Pico Congelado, Festa dos Inscritos, Live do Jackson e o chefe final Matheus Larp Gamer Monotomias.
- Na fase 10, Matheus assume a forma do Sonic na zona do Miguel e vira uma bola ao ganhar velocidade. RafaRL tem uma zona de telhados medievais e Scott tem uma zona própria na cidade nevada.
- Antes do chefe final, escolha um ajudante. Jackson limpa projéteis, Babs Mary protege de um golpe, Miguel acelera Matheus, Scott pula sobre o chefe e RafaRL prolonga o tempo para contra-atacar.
- Mapa de mundos para escolher e rejogar fases; segredos por fase ficam salvos.
- Amigos: Axolote (dicas), PS2 Gordo (loja), Babs Mary ("É brincadeira, Matheus!"), Inscrito 500 e a galera do Discord escondida em casinhas secretas.
- Inimigos: bug do lag, cartucho bravo, controle voador, glitch espinhento, caranguejo pixel, rodinha de carregamento, peixe-controle, sininho spam, hater do comentário e a bola de metal (normal e turbo) (pisar só deixa tonta; CD, casco ou estrela destroem).
- Power-ups: Controle Turbo (fica grande), Disco (joga CDs) e Estrela 100% (invencível). 100 fichas = 1 vida.
- Teclado (setas, Z pular, X correr/CD, Enter pausa, M som), controle USB/Bluetooth e botões na tela do celular. Durante um diálogo, Z e Enter avançam a fala. No celular, toque na caixa ou aperte A.
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
