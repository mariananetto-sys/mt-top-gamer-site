export const cast = [
  ['Matheus', 'Apresentador', 'Pulso de impacto', '#ef8746'],
  ['RafaRL', 'Guardião', 'Escudo de energia', '#609cd5'],
  ['Babs Mary', 'Suporte', 'Cura da equipe', '#c887ef'],
  ['Miguel', 'Velocista', 'Impulso de corrida', '#74c379'],
  ['Jackson', 'Especialista em sinais', 'Dissipar projéteis', '#63d3cb'],
  ['Chainsaw Sam', 'Editor do canal', 'Marcar robôs', '#65beef'],
];
export const guns = ['Blaster', 'Blaster de rajada', 'Lançador de pulsos'];
export const missions = [
  [
    'Fora do ar',
    'Religue os transmissores e volte à recepção.',
    [
      ['Transmissor A', -8, -6],
      ['Transmissor B', 8, -8],
      ['Recepção', 0, 9],
    ],
  ],
  [
    'Apagão no palco',
    'Ligue os três refletores do palco.',
    [
      ['Refletor esquerdo', -8, -11],
      ['Refletor central', 0, -12],
      ['Refletor direito', 8, -11],
    ],
  ],
  [
    'Corrida da bateria',
    'Busque a bateria no depósito e leve-a ao palco.',
    [
      ['Bateria', -11, 3],
      ['Gerador do palco', 6, -11],
    ],
  ],
  [
    'Sinal do Jackson',
    'Siga o sinal da antena e aguarde a transmissão.',
    [
      ['Receptor', -8, 4],
      ['Antena', 9, -7],
    ],
  ],
  [
    'Último take',
    'Recupere a gravação e proteja a exportação.',
    [
      ['Gravação', -8, -9],
      ['Ilha de edição', 11, 3],
    ],
  ],
];
export const saveKey = 'mt.ultimoTake.v1';
export function progress() {
  try {
    return Math.max(0, Math.min(5, parseInt(localStorage.getItem(saveKey), 10) || 0));
  } catch {
    return 0;
  }
}
export function weaponLimit(done) {
  return done >= 4 ? 2 : done >= 2 ? 1 : 0;
}
export function complete(index) {
  const done = Math.max(progress(), index + 1);
  try {
    localStorage.setItem(saveKey, String(done));
  } catch {}
  return done;
}
