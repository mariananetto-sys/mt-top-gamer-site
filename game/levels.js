'use strict';
// =====================================================================
//  FASES — o mapa tem 14 linhas (y = 0 no topo, chão na linha 12).
//  Legenda dos blocos:
//   #  chão            B  tijolo           ?  bloco com ficha
//   M  bloco com power-up (controle ou disco)   1  bloco com vida
//   *  tijolo com estrela   X  bloco duro   =  plataforma vazada
//   [ ]  cartucho gigante   ^  espinhos      ~  lava       o  ficha
//  Inimigos/objetos: g bug, k cartucho, f controle voador, s glitch,
//   b bola de metal (pisar só deixa tonta), mph/mpv plataforma móvel, fall plataforma que cai, spring mola,
//   K checkpoint, G fim de fase, fb barra de fogo, boss chefão.
// =====================================================================
window.LEVELS = (() => {
  function builder(w, theme, name, song) {
    const rows = [];
    for (let y = 0; y < 14; y++) rows.push(new Array(w).fill('.'));
    const L = { w, theme, name, song, rows, ents: [], start: { x: 3, y: 11 }, time: 300 };
    L.set = (x, y, c) => { if (x >= 0 && x < w && y >= 0 && y < 14) rows[y][x] = c; };
    L.fill = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) L.set(x, y, c); };
    L.ground = (x0, x1, top = 12) => L.fill(x0, top, x1, 13, '#');
    L.put = (x, y, s) => { [...s].forEach((c, i) => { if (c !== ' ') L.set(x + i, y, c); }); };
    L.pillar = (x, h, base = 12) => { for (let i = 0; i < h; i++) { L.set(x, base - 1 - i, '['); L.set(x + 1, base - 1 - i, ']'); } };
    L.stairs = (x, hs, base = 12) => hs.forEach((h, i) => { for (let j = 0; j < h; j++) L.set(x + i, base - 1 - j, 'X'); });
    L.lava = (x0, x1) => L.fill(x0, 12, x1, 13, '~');
    L.e = (type, x, y, o = {}) => { L.ents.push({ type, x, y, ...o }); if (type === 'fb') L.set(x, y, 'F'); };
    return L;
  }

  // ---------------------------------------------------- FASE 1
  function fase1() {
    const L = builder(212, 'tropical', 'COLINAS TROPICAIS', 'grass');
    L.intro = 'O BUGSOFT espalhou bugs pelo Universo 100% Gamer!';
    L.ground(0, 68); L.ground(72, 90); L.ground(94, 140); L.ground(144, 211);
    L.put(16, 8, '?');
    L.put(20, 8, 'BMB?B'); L.put(22, 4, '?');
    L.e('g', 23, 11);
    L.pillar(28, 2); L.put(32, 9, 'ooo'); L.pillar(38, 3); L.pillar(46, 4); L.pillar(57, 4);
    L.e('g', 42, 11); L.e('g', 51, 11); L.e('g', 53, 11);
    L.put(62, 8, '1');
    L.e('g', 65, 11);
    L.put(69, 9, 'ooo');
    L.put(77, 8, 'BBBBBBBB'); L.put(81, 4, 'BB?BBB'); L.put(78, 7, 'oo');
    L.e('g', 80, 7); L.e('g', 83, 7); L.e('f', 88, 7);
    L.put(91, 9, 'ooo');
    L.put(98, 8, '?'); L.put(100, 8, '*');
    L.e('K', 104, 11);
    L.put(106, 8, 'B?B'); L.e('k', 110, 11);
    L.put(113, 8, '?'); L.put(116, 8, '?'); L.put(116, 4, 'M'); L.put(119, 8, '?');
    L.e('g', 112, 11); L.e('g', 114, 11);
    L.stairs(124, [1, 2, 3, 4]); L.stairs(130, [4, 3, 2, 1]);
    L.e('g', 128, 11);
    L.stairs(135, [1, 2, 3, 4, 4, 4]); L.put(141, 6, 'ooo'); L.stairs(144, [4, 3, 2, 1]);
    L.e('b', 152, 11);
    L.e('spring', 158, 11); L.put(156, 2, 'ooooo');
    L.pillar(162, 3); L.e('k', 167, 11);
    L.put(170, 8, '?M?'); L.e('f', 176, 7); L.e('g', 180, 11); L.e('g', 182, 11);
    L.stairs(186, [1, 2, 3, 4, 5, 6, 7, 8, 8]);
    L.e('G', 200, 11);
    return L;
  }

  // ---------------------------------------------------- FASE 2
  function fase2() {
    const L = builder(200, 'cave', 'CAVERNA DOS CARTUCHOS', 'cave');
    L.intro = 'Os cartuchos do canal foram parar no fundo da caverna...';
    L.fill(0, 0, 199, 1, '#');
    L.ground(0, 40); L.ground(44, 70); L.ground(81, 150); L.ground(154, 199);
    L.put(8, 8, '?');
    L.put(12, 8, 'BBMBBB'); L.put(12, 7, 'oooooo');
    L.e('g', 18, 11);
    L.put(20, 8, '?B?B?'); L.e('g', 24, 11);
    L.put(27, 11, '^^^');
    L.pillar(37, 2); L.put(41, 9, 'ooo');
    L.e('g', 46, 11);
    L.pillar(48, 3);
    L.put(52, 8, 'BBBBBBBBB'); L.put(53, 5, 'ooooooo');
    L.e('g', 54, 7); L.e('g', 57, 7);
    L.e('s', 62, 11);
    L.pillar(66, 4);
    L.e('mph', 71, 9, { range: 6 }); L.put(73, 6, 'oooo');
    L.e('K', 84, 11);
    L.e('k', 88, 11); L.e('g', 91, 11); L.e('g', 93, 11);
    L.put(94, 8, 'BB1BB');
    L.e('s', 120, 11);
    L.put(104, 11, '^^^^^'); L.put(103, 8, '======='); L.put(105, 7, 'ooo');
    L.e('b', 112, 11);
    L.put(114, 8, '?M?');
    L.fill(124, 2, 146, 6, '#');
    L.put(126, 10, 'oooooooooooooooooo');
    L.e('g', 130, 11); L.e('g', 134, 11); L.e('s', 139, 11); L.e('g', 143, 11);
    L.put(151, 9, 'ooo');
    L.e('k', 158, 11);
    L.put(160, 8, 'B*B');
    L.e('s', 166, 11); L.e('g', 170, 11);
    L.stairs(176, [1, 2, 3, 4, 4]);
    L.e('f', 183, 7);
    L.e('G', 190, 11);
    return L;
  }

  // ---------------------------------------------------- FASE 3
  function fase3() {
    const L = builder(212, 'sky', 'NUVENS DO LAG', 'sky');
    L.intro = 'Cuidado com o lag: as nuvens não seguram por muito tempo!';
    L.ground(0, 12);
    L.put(6, 8, '?');
    L.put(16, 10, '===='); L.put(22, 8, '====='); L.put(23, 7, 'ooo'); L.put(29, 6, '====');
    L.e('f', 31, 4);
    L.ground(34, 44); L.e('g', 38, 11); L.put(39, 8, '?M');
    L.e('mph', 46, 10, { range: 7 }); L.put(48, 8, 'oooo');
    L.ground(58, 64, 10); L.e('g', 61, 9);
    L.e('fall', 67, 9); L.e('fall', 71, 8); L.e('fall', 75, 9);
    L.ground(79, 92); L.e('K', 81, 11); L.e('k', 86, 11); L.e('f', 89, 7);
    L.e('spring', 91, 11);
    L.put(94, 3, '======'); L.put(95, 2, 'oooo');
    L.put(102, 9, '=====');
    L.e('mpv', 108, 4, { range: 6 });
    L.ground(113, 125, 9); L.e('f', 119, 5); L.e('g', 121, 8); L.put(116, 5, '?B?');
    L.put(128, 10, '==='); L.put(133, 8, '==='); L.put(138, 6, '==='); L.put(143, 8, '==='); L.put(148, 10, '===');
    L.put(138, 5, 'ooo'); L.e('f', 141, 3);
    L.ground(152, 165); L.e('g', 158, 11); L.e('s', 161, 11); L.put(156, 8, '?*?');
    L.e('mph', 167, 10, { range: 5 });
    L.e('fall', 176, 9); L.e('fall', 180, 8);
    L.ground(184, 211); L.e('b', 196, 11);
    L.stairs(188, [1, 2, 3, 4, 5]);
    L.e('G', 202, 11);
    return L;
  }

  // ---------------------------------------------------- FASE 4
  function fase4() {
    const L = builder(190, 'castle', 'FÁBRICA BUGSOFT', 'castle');
    L.intro = 'A fábrica de bugs! O chefão está logo ali...';
    L.fill(0, 0, 189, 1, 'X');
    L.ground(0, 15); L.lava(16, 19); L.ground(20, 40); L.lava(41, 45); L.ground(46, 70); L.lava(71, 78);
    L.ground(79, 110); L.lava(111, 116); L.ground(117, 150); L.lava(151, 156); L.ground(157, 189);
    L.put(10, 8, 'M');
    L.put(16, 9, 'oooo');
    L.e('fb', 26, 8, { len: 5 });
    L.put(22, 8, '?');
    L.e('g', 34, 11);
    L.put(43, 10, 'X');
    L.e('K', 48, 11);
    L.fill(52, 10, 52, 11, 'X'); L.e('fb', 52, 9, { len: 4, speed: 0.04 });
    L.put(58, 11, '^^^');
    L.put(64, 8, 'B?B');
    L.e('g', 63, 11); L.e('g', 66, 11);
    L.e('mph', 72, 9, { range: 4 }); L.put(74, 6, 'ooo');
    L.fill(84, 2, 100, 6, 'X');
    L.e('fb', 92, 6, { len: 6, speed: -0.035 });
    L.put(86, 10, 'ooo'); L.put(96, 10, 'ooo');
    L.e('s', 97, 11); L.e('k', 104, 11);
    L.put(113, 9, 'X');
    L.put(120, 8, '?M?');
    L.e('g', 125, 11);
    L.fill(130, 10, 130, 11, 'X'); L.e('fb', 130, 9, { len: 4, speed: -0.04 });
    L.stairs(137, [1, 2, 3]); L.put(140, 11, '^^^^'); L.stairs(144, [3, 2, 1]);
    L.e('k', 148, 11);
    L.e('fall', 152, 10); L.e('fall', 155, 10);
    L.e('s', 165, 11); L.e('b', 170, 11);
    L.put(172, 8, '?');
    L.e('G', 182, 11);
    return L;
  }

  // ---------------------------------------------------- CHEFÃO
  function chefe() {
    const L = builder(24, 'boss', 'BUGSOFT, O BUG SUPREMO', 'boss');
    L.intro = 'Derrote o BUGSOFT e salve a gameplay!';
    L.boss = true;
    L.fill(0, 0, 23, 1, 'X'); L.ground(0, 23);
    L.fill(0, 2, 0, 11, 'X'); L.fill(23, 2, 23, 11, 'X');
    L.put(3, 8, '===='); L.put(17, 8, '====');
    L.put(11, 8, 'M');
    L.start = { x: 3, y: 11 };
    L.e('boss', 15, 11);
    return L;
  }

  const list = [fase1, fase2, fase3, fase4, chefe];
  const labels = ['1', '2', '3', '4', 'CHEFE'];
  return { list, labels };
})();
