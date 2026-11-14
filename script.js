// =====================================================================
//  Para atualizar o site: edite as listas VIDEOS e SHORTS abaixo.
//  O "id" é o código que aparece no link do YouTube:
//  https://www.youtube.com/watch?v=ESTE_CODIGO  ou  /shorts/ESTE_CODIGO
//  tipo: "mgp" (gameplay completa), "trailer" (trailer/intro) ou "outros"
// =====================================================================

const VIDEOS = [
  { id: "d9dSYj7ATVQ", tipo: "mgp", titulo: "MGP - O GRANDE E O ÚLTIMO JOGO DO URSO E DA PASSARA DA INFÂNCIA DE CAIXISTAS E NINTENDISTAS... BKNAB", duracao: "1:19:26", quando: "há 3 dias" },
  { id: "Uj8roZU8l1A", tipo: "trailer", titulo: "TRAILER/INTRO DO MGP DE BANJO-KAZOOIE NUTS & BOLTS!", duracao: "1:39", quando: "há 1 mês" },
  { id: "hvEaUfhV5lo", tipo: "outros", titulo: "CLIP DA MÚSICA DA INTRO COMPLETA/HOMENAGEM DO AMV DO STORMREDDESERT... Sonic Free Riders", duracao: "4:19", quando: "há 1 mês" },
  { id: "sUrTbAF1ymQ", tipo: "mgp", titulo: "MGP - NÃO EXISTE NENHUMA VERSÃO RECOMPILED VAI FAZER ESSE JOGO MELHOR... Sonic Free Riders", duracao: "1:19:17", quando: "há 1 mês" },
  { id: "8lKTIcT4fnk", tipo: "trailer", titulo: "MGP INTRO/TRAILER DE SONIC FREE RIDERS, ESPECIAL DE 500 INSCRITOS!", duracao: "3:55", quando: "há 1 mês" },
  { id: "d6YDNHXEqDg", tipo: "mgp", titulo: "MGP - ESSA SIM É QUASE A MELHOR VERSÃO DO BERINJELA ESQUECIDO DA \"BUGSOFT\"... Rayman Origins [WII]", duracao: "52:05", quando: "há 5 meses" },
  { id: "t-VJv2-Ic7Q", tipo: "trailer", titulo: "TRAILER/INTRO NOVA DO NOVO MGP DO CANAL... EM BREVE", duracao: "0:41", quando: "há 6 meses" },
  { id: "TiekoYdTD8I", tipo: "mgp", titulo: "MGP: MINHA PEPSI É PRETA, EU NÃO QUERO PIADA DE \"BlackManPepsi\" CARAI! (É piada kkk)... PepsiMan PS1", duracao: "27:19", quando: "há 8 meses" },
  { id: "sMmFDhMLFUQ", tipo: "outros", titulo: "VERSÃO COMPLETA DA MÚSICA DE INTRO DO NOVO MGP!", duracao: "2:36", quando: "há 9 meses" },
  { id: "7qcKZDKf3zM", tipo: "mgp", titulo: "MGP - O MELHOR JOGO DA FRANQUIA SONIC PARA UM ESPECIAL DE NATAL/ANO NOVO E CANAL!... Sonic Unleashed", duracao: "1:14:32", quando: "há 9 meses" },
  { id: "sMXYdC_y0dQ", tipo: "trailer", titulo: "TRAILER/INTRO DO NOVO MGP DO CANAL SOBRE, SONIC UNLEASHED... EM BREVE", duracao: "1:21", quando: "há 11 meses" },
  { id: "B0lOIRxiPf8", tipo: "outros", titulo: "TODAS AS GAMEPLAYS QUE EU FIZ DA BGS 2025! (pior que foi poucas kkk)", duracao: "7:37", quando: "há 1 ano" },
  { id: "YD14iPANmmY", tipo: "mgp", titulo: "MGP - EU, VCS E TODOS QUEREMOS A BANANA SLAMA DO DONKEY KONG COUNTRY 2!", duracao: "50:26", quando: "há 1 ano" },
  { id: "k4deSsZI5xU", tipo: "trailer", titulo: "MGP TRAILER/INTRO DE DONKEY KONG COUNTRY 2: CASAL DE MONKEYS FAZENDO SOPA LOCALMENTE!... EM BREVE", duracao: "0:47", quando: "há 1 ano" },
  { id: "pKaIVk1JE1Y", tipo: "mgp", titulo: "MGP - O AGENTE 001 ESTÁ DE VOLTA DEPOIS DE 4 FUDENDOS ANOS DO JOGO 007 QUANTUM OF SOLACE DE PS2!", duracao: "35:58", quando: "há 1 ano" },
  { id: "hBZbQPOCXfg", tipo: "mgp", titulo: "MGP - MADAGASCAR 3 THE GAME É TÃO BOSTA QUE UM PAÍS INTEIRO IA MORRER! MADAGASCAR 2 É UMA DELÍCIA!", duracao: "47:06", quando: "há 1 ano" },
  { id: "7SgNczgiAOw", tipo: "trailer", titulo: "MGP TRAILER 2/INTRO DE MADAGASCAR 2 THE VIDEO GAME!", duracao: "0:22", quando: "há 1 ano" },
  { id: "wxG2w-ZG5I0", tipo: "mgp", titulo: "MGP - DOIS UNIVERSOS SE REÚNEM PARA MAMAR O (segundo) MELHOR JOGO DE CORRIDA DO SONIC!", duracao: "1:15:20", quando: "há 1 ano" },
  { id: "OmHT0_iUFUk", tipo: "trailer", titulo: "MGP - SONIC RIDERS CROSSOVER... TRAILER", duracao: "1:01", quando: "há 1 ano" },
  { id: "jM_fQIE71EE", tipo: "outros", titulo: "SUPER RETROSPECTIVA/COMPILAÇÃO 2024 DE MATHEUS TOP GAMER ENTRETENIMENTOS!", duracao: "4:27:42", quando: "há 1 ano" },
  { id: "jsqb8uyFcZc", tipo: "trailer", titulo: "TRAILER/RETROSPECTIVA/SUPER COMPILADO 2024 DE \"MT GAMER ENTRETENIMENTOS\"", duracao: "0:32", quando: "há 1 ano" },
  { id: "0weYRxamSUU", tipo: "outros", titulo: "EU FUI PRÁ BGS PARA JOGAR DA GAME STATION, PARTE 2", duracao: "27:39", quando: "há 2 anos" },
];

const SHORTS = [
  { id: "WXapc7gVV4g", titulo: "TENHO 3 AVISOS IMPORTANTES DO QUE VAI ACONTECER COM O MEU CANAL!", views: "1,5 mil visualizações" },
  { id: "6FxHQIanBoQ", titulo: "NOVIDADE E NOTÍCIA URGENTE PARA 15/01!", views: "518 visualizações" },
  { id: "fPXIR1ygJds", titulo: "Destaque ao PS2 GORDO KKKK", views: "515 visualizações" },
  { id: "sgVME2yFbBk", titulo: "QUE BELOS AXOLOTE👌👌", views: "506 visualizações" },
  { id: "uFpzi42IwG0", titulo: "É ESSE TIPO DE EDIT QUE UM FÃ FAZ PARA O YOUTUBER QUE GOSTA (ou pelo menos acho que é kk)", views: "380 visualizações" },
  { id: "qPOQ0x9CazM", titulo: "MGP TRAILER/INTRO: CASAL DE MONKEYS FAZENDO SOPA LOCALMENTE!... EM BREVE", views: "273 visualizações" },
  { id: "F0F5ixMokaU", titulo: "TRAILER/INTRO DO NOVO MGP DO CANAL SOBRE, SONIC UNLEASHED... EM BREVE", views: "234 visualizações" },
  { id: "R5G6MReaLHE", titulo: "ISSO SIM QUE É MATAR ALGUÉM DO SUSTO KKKKK (sorry gabs)", views: "229 visualizações" },
  { id: "DemxQS31kgo", titulo: "GOSTA DE CARLOS EL TOPO QUE GIRA CLÁSSICO? OF THE TITANS DE DS É PRA VOCÊ🫵", views: "217 visualizações" },
  { id: "OukaoqG691U", titulo: "EU ODEIO A ROCKSTAR!", views: "126 visualizações" },
  { id: "XL2cHVsG2Jk", titulo: "PRA MIM, O PS2 É MUITO MELHOR DO QUE O PS5! KKKKKK", views: "121 visualizações" },
  { id: "w-NHOb-ESJQ", titulo: "QUE FOOOODAAAAAA MEEEUUUUU IRMAAAAAAAAAAAAAAÃOOOOOO!", views: "71 visualizações" },
];

// ---------------------------------------------------------------------

const $ = (sel) => document.querySelector(sel);
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const BADGE = { mgp: "MGP", trailer: "TRAILER" };

function renderVideos(filter = "all") {
  const list = filter === "all" ? VIDEOS : VIDEOS.filter((v) => v.tipo === filter);
  $("#video-grid").innerHTML = list.map((v) => `
    <button class="video" data-id="${v.id}" aria-label="Assistir: ${esc(v.titulo)}">
      <div class="thumb">
        <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" loading="lazy">
        ${BADGE[v.tipo] ? `<span class="badge ${v.tipo}">${BADGE[v.tipo]}</span>` : ""}
        ${v.duracao ? `<span class="dur">${v.duracao}</span>` : ""}
        <span class="play"></span>
      </div>
      <div class="video-info">
        <h3>${esc(v.titulo)}</h3>
        <p>${v.quando}</p>
      </div>
    </button>`).join("");
}

function renderShorts() {
  $("#shorts-row").innerHTML = SHORTS.map((s) => `
    <button class="short" data-id="${s.id}" data-vertical="1" aria-label="Assistir short: ${esc(s.titulo)}">
      <img src="https://i.ytimg.com/vi/${s.id}/oar2.jpg" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${s.id}/hqdefault.jpg'" alt="" loading="lazy">
      <div class="short-info">
        <h3>${esc(s.titulo)}</h3>
        <p>${s.views}</p>
      </div>
    </button>`).join("");
}

// Player (abre o vídeo dentro do site)
const player = $("#player");
const frame = player.querySelector(".player-frame");

function openPlayer(id, vertical) {
  player.classList.toggle("vertical", !!vertical);
  player.querySelector(".player-link").href = vertical
    ? `https://www.youtube.com/shorts/${id}`
    : `https://www.youtube.com/watch?v=${id}`;
  frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="Vídeo do YouTube" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  player.showModal();
}
function closePlayer() {
  player.close();
}
player.addEventListener("close", () => { frame.innerHTML = ""; });
player.querySelector(".player-close").addEventListener("click", closePlayer);
player.addEventListener("click", (e) => { if (e.target === player) closePlayer(); });

document.addEventListener("click", (e) => {
  const card = e.target.closest(".video, .short");
  if (card) openPlayer(card.dataset.id, card.dataset.vertical);
});

// Filtros
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    renderVideos(chip.dataset.filter);
  });
});

renderVideos();
renderShorts();
$("#year").textContent = new Date().getFullYear();

// ---------------------------------------------------------------------
// Atualização automática: o site pergunta à função /api/videos (Vercel)
// quais são os vídeos e shorts mais novos do canal. Se der qualquer erro
// (sem internet, arquivo aberto direto no PC...), fica a lista acima.
// ---------------------------------------------------------------------
function tipoDe(titulo) {
  const t = titulo.toUpperCase();
  if (/TRAILER|INTRO\/|\/INTRO/.test(t)) return "trailer";
  if (/^MGP/.test(t)) return "mgp";
  return "outros";
}
(async function atualizarVideos() {
  try {
    const r = await fetch("/api/videos", { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    if (Array.isArray(d.videos) && d.videos.length) {
      VIDEOS.splice(0, VIDEOS.length, ...d.videos.map((v) => ({ id: v.id, tipo: tipoDe(v.titulo), titulo: v.titulo, duracao: v.duracao, quando: v.quando })));
      const ativo = document.querySelector(".chip.is-active");
      renderVideos(ativo ? ativo.dataset.filter : "all");
    }
    if (Array.isArray(d.shorts) && d.shorts.length) {
      SHORTS.splice(0, SHORTS.length, ...d.shorts.map((s) => ({ id: s.id, titulo: s.titulo, views: s.views })));
      renderShorts();
    }
  } catch (e) { /* fica a lista fixa */ }
})();

// Prévia do jogo (cena em pixel art desenhada com a arte do próprio jogo)
(function drawGamePreview() {
  const cv = document.getElementById("game-preview");
  if (!cv || !window.ART) return;
  const W = 384, H = 224, S = 3;
  cv.width = W * S; cv.height = H * S;
  const x = cv.getContext("2d");
  x.imageSmoothingEnabled = false;
  x.scale(S, S);
  ART.background("tropical", W, H).draw(x, 140, 0);
  const t = ART.tiles("tropical");
  for (let i = 0; i < 24; i++) {
    if (i === 15 || i === 16) continue;
    x.drawImage(t.groundTop, i * 16, 192); x.drawImage(t.ground, i * 16, 208);
  }
  [[7, "brick"], [8, "q"], [9, "brick"], [10, "q"], [11, "brick"]].forEach(([c, k]) => x.drawImage(k === "q" ? t.q[0] : t.brick, c * 16, 128));
  x.drawImage(t.pillarCap[1][0], 19 * 16, 160); x.drawImage(t.pillarCap[1][1], 20 * 16, 160);
  x.drawImage(t.pillarBody[0], 19 * 16, 176); x.drawImage(t.pillarBody[1], 20 * 16, 176);
  [6, 7, 8].forEach((c, i) => x.drawImage(ART.ITEM.coin[i % 4], c * 16 + 8, 96 - i * 6));
  x.drawImage(ART.HERO.n.b.jump.r, 112, 112);
  x.drawImage(ART.ENEMY.bug[0].r, 200, 176);
  x.drawImage(ART.ENEMY.cart[1].r, 248, 176);
  x.drawImage(ART.ENEMY.pad.r, 290, 100);
  x.drawImage(ART.ITEM.turbo, 136, 113);
  x.font = '16px "Press Start 2P", monospace';
  x.textAlign = "center"; x.textBaseline = "top";
  const title = () => {
    x.fillStyle = "#1a1020"; x.fillText("A AVENTURA", W / 2 + 2, 26 + 2);
    x.fillStyle = "#ffd23f"; x.fillText("A AVENTURA", W / 2, 26);
  };
  if (document.fonts && document.fonts.load) document.fonts.load('16px "Press Start 2P"').then(title, title); else title();
})();
