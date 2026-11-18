// Original line drawings of the game (SVG): the priest, the six vestments in the order of the Missal, the sticker of a day,
// and the outline of a chasuble for the printed sheet. Simple shapes in the calendar's colours; no face detail beyond two eyes.

/** fill and trim of the vestments by liturgical colour */
const BOJA: Record<string, [string, string]> = {
  w: ['#f6efd9', '#b8901c'], r: ['#b3261e', '#e2c15a'], v: ['#6a3d9a', '#e2c15a'], g: ['#2f7d3b', '#e2c15a'], b: ['#2b2b2b', '#bdbdbd'], p: ['#d98aa5', '#f3e3a2'],
};
const INK = 'var(--crta, #3a332b)';
const s = (w = 1.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

const LAYER: Record<string, (k: string) => string> = {
  amikt: () => `<path d="M82 86 Q110 70 138 86 L146 100 Q110 112 74 100 Z" fill="#fffdf6" ${s()}/><path d="M96 84 Q110 94 124 84" fill="none" ${s(1.2)}/>`,
  alba: () => `<path d="M78 92 L62 292 Q110 304 158 292 L142 92 Q110 104 78 92 Z" fill="#fffdf6" ${s()}/>
    <path d="M80 94 L44 178 L60 188 L84 132 Z" fill="#fffdf6" ${s()}/><path d="M140 94 L176 178 L160 188 L136 132 Z" fill="#fffdf6" ${s()}/>
    <path d="M64 276 Q110 288 156 276" fill="none" ${s(1)} stroke-dasharray="2 4"/>`,
  pojas: () => `<path d="M72 172 Q110 182 148 172" fill="none" stroke="#b9a05a" stroke-width="4.5" stroke-linecap="round"/><path d="M72 172 Q110 182 148 172" fill="none" ${s(0.8)} stroke-dasharray="3 3"/>
    <path d="M96 177 L92 226 M102 178 L104 232" fill="none" stroke="#b9a05a" stroke-width="3.5" stroke-linecap="round"/><path d="M89 226 l6 0 l1 12 l-8 0 Z M101 232 l6 0 l1 12 l-8 0 Z" fill="#b9a05a" ${s(0.8)}/>`,
  narucnik: k => `<path d="M157 166 L171 160 L183 204 L165 212 Z" fill="${BOJA[k][0]}" ${s()}/><path d="M166 210 l-1 8 M171 208 l0 8 M176 206 l1 8 M181 204 l2 7" ${s(1.1)} stroke="${BOJA[k][1]}"/><path d="M167 180 l8 -3 M171 176 l1 9" stroke="${BOJA[k][1]}" stroke-width="1.8" stroke-linecap="round"/>`,
  stola: k => `<path d="M92 92 L104 90 L132 176 L138 250 L124 252 L118 180 Z" fill="${BOJA[k][0]}" ${s()}/><path d="M128 92 L116 90 L88 176 L82 250 L96 252 L102 180 Z" fill="${BOJA[k][0]}" ${s()}/>
    <path d="M125 240 l12 -1 M83 239 l12 1" stroke="${BOJA[k][1]}" stroke-width="2"/>`,
  misnica: k => `<path d="M88 90 Q110 104 132 90 L172 150 Q178 232 110 268 Q42 232 48 150 Z" fill="${BOJA[k][0]}" ${s()}/>
    <path d="M104 99 L116 99 L116 262 Q110 266 104 262 Z" fill="${BOJA[k][1]}" ${s(0.9)}/><path d="M92 136 L128 136 L128 147 L92 147 Z" fill="${BOJA[k][1]}" ${s(0.9)}/>`,
};
/** drawing order differs from the order of vesting: the maniple stays visible over the chasuble */
const DRAW = ['alba', 'amikt', 'pojas', 'stola', 'misnica', 'narucnik'];
const ORDER = ['amikt', 'alba', 'pojas', 'narucnik', 'stola', 'misnica'];

/** The priest with the first `placed` vestments on, the coloured ones in the colour of the day. */
export function figure(placed: number, k: string): string { return figureSet(ORDER.slice(0, placed), k); }
/** The priest wearing the vestments in `ima`. */
export function figureSet(ima: string[], k: string): string {
  const on = new Set(ima);
  const cassock = `<path d="M80 92 L66 296 Q110 306 154 296 L140 92 Q110 102 80 92 Z" fill="#33302c" ${s()}/><path d="M82 94 L48 176 L62 186 L86 130 Z" fill="#33302c" ${s()}/><path d="M138 94 L172 176 L158 186 L134 130 Z" fill="#33302c" ${s()}/><path d="M100 86 h20 v8 h-20 Z" fill="#fffdf6" ${s(1)}/>`;
  const shoes = `<ellipse cx="94" cy="302" rx="13" ry="5" fill="#33302c" ${s(1)}/><ellipse cx="126" cy="302" rx="13" ry="5" fill="#33302c" ${s(1)}/>`;
  const hands = `<ellipse cx="52" cy="186" rx="8" ry="7" fill="#eccfae" ${s(1.3)}/><ellipse cx="168" cy="186" rx="8" ry="7" fill="#eccfae" ${s(1.3)}/>`;
  const head = `<path d="M102 70 h16 v18 h-16 Z" fill="#eccfae" ${s(1.3)}/><circle cx="110" cy="50" r="25" fill="#eccfae" ${s()}/><path d="M86 46 Q88 22 110 22 Q132 22 134 46 Q124 34 110 34 Q96 34 86 46 Z" fill="#6b4a2b" ${s(1.2)}/><circle cx="101" cy="52" r="2" fill="${INK}"/><circle cx="119" cy="52" r="2" fill="${INK}"/><path d="M104 63 Q110 66 116 63" fill="none" ${s(1.2)}/>`;
  return `<svg viewBox="30 16 160 296" class="svecenik-crtez" aria-hidden="true" focusable="false">${shoes}${cassock}${head}${DRAW.filter(id => on.has(id)).map(id => LAYER[id](k)).join('')}${hands}</svg>`;
}
const BOX: Record<string, string> = { amikt: '66 66 88 52', alba: '36 84 148 224', pojas: '62 160 96 92', narucnik: '146 152 48 72', stola: '70 82 80 178', misnica: '38 82 144 194' };
/** One vestment alone, for the tray. */
export function icon(id: string, k: string): string { return `<svg viewBox="${BOX[id]}" class="ruho-crtez" aria-hidden="true" focusable="false">${LAYER[id](k)}</svg>`; }

/** Sticker of a finished round: the liturgical colour with a cross; the practice mark is only a quiet ring. */
export function sticker(k: string, full: boolean, size: number): string {
  const [fill, trim] = BOJA[k] ?? BOJA.g;
  const cross = 'M50 46 39 24h22L50 46Zm4 4 22-11v22L54 50Zm-4 4 11 22H39l11-22Zm-4-4L24 61V39l22 11Z';
  return full
    ? `<svg viewBox="0 0 100 100" width="${size}" height="${size}" class="slicica" aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="46" fill="${fill}" stroke="${trim}" stroke-width="4"/><circle cx="50" cy="50" r="38" fill="none" stroke="${trim}" stroke-width="1.5" stroke-dasharray="2 5"/><path d="${cross}" fill="${trim}"/></svg>`
    : `<svg viewBox="0 0 100 100" width="${size}" height="${size}" class="slicica vjezba" aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="44" fill="none" stroke="${fill === '#f6efd9' ? trim : fill}" stroke-width="5" stroke-dasharray="9 7" opacity=".75"/><path d="${cross}" fill="${fill === '#f6efd9' ? trim : fill}" opacity=".45"/></svg>`;
}
/** Outline of a chasuble to colour in (printed sheet). */
export function outline(): string {
  return `<svg viewBox="36 80 148 196" class="bojanka" aria-hidden="true" focusable="false"><g fill="none" stroke="#000" stroke-width="1.6" stroke-linejoin="round"><path d="M88 90 Q110 104 132 90 L172 150 Q178 232 110 268 Q42 232 48 150 Z"/><path d="M104 99 L116 99 L116 262 Q110 266 104 262 Z"/><path d="M104 136 L92 136 L92 147 L104 147 M116 136 L128 136 L128 147 L116 147"/><path d="M60 156 Q66 222 110 250 Q154 222 160 156" stroke-dasharray="3 5" stroke-width="1"/></g></svg>`;
}

// ---------- the chalice (Ritus servandus I, 1): the pieces drawn one above the other with a small gap, so that each stays visible
const GOLD = '#d8b04a', GOLD2 = '#9c7a1c', LINEN = '#fffdf6';
const KALEZ: Record<string, (k: string, y: number) => string> = {
  calix: (_k, y) => `<g transform="translate(0 ${y})"><path d="M70 40 Q70 82 100 90 Q130 82 130 40 Z" fill="${GOLD}" ${s()}/><path d="M96 90 h8 v22 h-8 Z" fill="${GOLD}" ${s()}/><ellipse cx="100" cy="100" rx="10" ry="5" fill="${GOLD2}" ${s(1)}/><path d="M74 128 Q100 108 126 128 Z" fill="${GOLD}" ${s()}/><ellipse cx="100" cy="40" rx="30" ry="5" fill="${GOLD2}" ${s(1)}/></g>`,
  purif: (_k, y) => `<g transform="translate(0 ${y})"><path d="M66 34 L134 34 L130 42 L136 64 L124 60 L120 42 L80 42 L76 60 L64 64 L70 42 Z" fill="${LINEN}" ${s()}/><path d="M96 34 v8 M104 34 v8" ${s(0.8)}/></g>`,
  patena: (_k, y) => `<g transform="translate(0 ${y})"><ellipse cx="100" cy="34" rx="36" ry="6" fill="${GOLD}" ${s()}/><ellipse cx="100" cy="30" rx="16" ry="3.5" fill="${LINEN}" ${s(1)}/><path d="M97 30 h6 M100 28 v4" stroke="#b8901c" stroke-width="1"/></g>`,
  palla: (_k, y) => `<g transform="translate(0 ${y})"><path d="M68 30 L132 30 L140 38 L60 38 Z" fill="${LINEN}" ${s()}/><path d="M96 34 h8 M100 31.5 v5" stroke="#b8901c" stroke-width="1.4"/></g>`,
  velum: (k, y) => `<g transform="translate(0 ${y})"><path d="M60 26 Q100 16 140 26 L150 92 Q100 100 50 92 Z" fill="${BOJA[k][0]}" ${s()}/><path d="M92 70 h16 M100 62 v16" stroke="${BOJA[k][1]}" stroke-width="2.5"/><path d="M50 92 Q100 100 150 92" fill="none" stroke="${BOJA[k][1]}" stroke-width="1.5"/></g>`,
  bursa: (k, y) => `<g transform="translate(0 ${y})"><path d="M64 14 L136 14 L136 30 L64 30 Z" fill="${BOJA[k][0]}" ${s()}/><path d="M92 22 h16 M100 17 v10" stroke="${BOJA[k][1]}" stroke-width="2"/><path d="M68 30 L132 30" stroke="${LINEN}" stroke-width="2"/></g>`,
};
const KALEZ_ORDER = ['calix', 'purif', 'patena', 'palla', 'velum', 'bursa'];
/** The chalice with the pieces in `ima` (in the order of the Missal), each above the one before it. */
export function chalice(ima: string[], k: string): string {
  const Y: Record<string, number> = { calix: 120, purif: 84, patena: 62, palla: 40, velum: 0, bursa: -36 };
  const on = KALEZ_ORDER.filter(id => ima.includes(id));
  return `<svg viewBox="40 70 120 190" class="kalez-crtez" aria-hidden="true" focusable="false">${on.filter(id => id !== 'velum').map(id => KALEZ[id](k, Y[id])).join('')}${on.includes('velum') ? `<g opacity=".92">${KALEZ.velum(k, Y.velum + 104)}</g>` : ''}</svg>`;
}
const KBOX: Record<string, string> = { calix: '62 154 76 104', purif: '58 112 84 44', patena: '58 84 84 22', palla: '54 66 92 16', velum: '44 116 112 92', bursa: '58 72 84 26' };
export function chaliceIcon(id: string, k: string): string { const y: Record<string, number> = { calix: 120, purif: 84, patena: 62, palla: 40, velum: 104, bursa: 64 }; return `<svg viewBox="${KBOX[id]}" class="ruho-crtez" aria-hidden="true" focusable="false">${KALEZ[id](k, y[id])}</svg>`; }

// ---------- the altar from the front (Code of Rubrics nn. 526-528): Gospel side on the left, Epistle side on the right
const OLTAR: Record<string, (k: string) => string> = {
  stolnjaci: () => `<path d="M30 150 L270 150 L270 160 L30 160 Z" fill="${LINEN}" ${s()}/><path d="M30 160 L30 236 L40 236 L40 160 M270 160 L270 236 L260 236 L260 160" fill="${LINEN}" ${s(1.2)}/><path d="M34 154 L266 154" ${s(0.6)} stroke-dasharray="2 3"/>`,
  raspelo: () => `<path d="M146 60 h8 v84 h-8 Z M134 76 h32 v7 h-32 Z" fill="#7a5a3a" ${s(1.2)}/><path d="M150 82 l-1 22 l-3 14 M150 82 l1 22 l3 14 M138 79 l12 5 l12 -5" fill="none" stroke="#eccfae" stroke-width="2.4" stroke-linecap="round"/><path d="M140 144 h20 l-4 6 h-12 Z" fill="#7a5a3a" ${s(1)}/>`,
  svijece: () => [96, 204].map(x => `<path d="M${x - 3} 100 h6 v28 h-6 Z" fill="${LINEN}" ${s(1)}/><path d="M${x} 92 q4 4 0 8 q-4 -4 0 -8 Z" fill="#f2b83b"/><path d="M${x - 8} 128 h16 l-3 6 h-10 Z M${x - 2} 134 h4 v10 h-4 Z M${x - 10} 144 h20 l-2 6 h-16 Z" fill="${GOLD}" ${s(1)}/>`).join(''),
  misal: () => `<path d="M222 140 L250 140 L246 150 L226 150 Z" fill="#7a5a3a" ${s(1)}/><path d="M220 124 L236 128 L252 124 L252 140 L236 144 L220 140 Z" fill="#a33" ${s(1)}/><path d="M236 128 v16" ${s(0.8)}/>`,
  kalez: k => `<path d="M140 132 Q150 112 160 132 Z" fill="${BOJA[k][0]}" ${s(1)}/><path d="M138 132 h24 l-2 18 h-20 Z" fill="${BOJA[k][0]}" ${s(1)}/><path d="M146 141 h8 M150 136 v10" stroke="${BOJA[k][1]}" stroke-width="1.6"/><path d="M128 150 h44" stroke="${LINEN}" stroke-width="2"/>`,
  bursa: k => `<path d="M58 134 L78 130 L82 148 L62 150 Z" fill="${BOJA[k][0]}" ${s(1)}/><path d="M66 140 h8 M70 136 v9" stroke="${BOJA[k][1]}" stroke-width="1.4"/>`,
  tabelle: () => `<path d="M112 130 h24 v18 h-24 Z M164 130 h24 v18 h-24 Z" fill="${LINEN}" ${s(1)}/>`,
  gostarice: () => `<path d="M292 128 q-3 8 0 16 h8 q3 -8 0 -16 Z" fill="#e8f1f7" ${s(1)}/><path d="M304 128 q-3 8 0 16 h8 q3 -8 0 -16 Z" fill="#c9a3b8" ${s(1)}/>`,
  manutergium: () => `<ellipse cx="324" cy="144" rx="9" ry="3" fill="${GOLD}" ${s(1)}/><path d="M314 136 h18 v5 h-18 Z" fill="${LINEN}" ${s(0.8)}/>`,
  campanula: () => `<path d="M338 144 q0 -12 6 -12 q6 0 6 12 Z" fill="${GOLD}" ${s(1)}/><path d="M344 132 v-5" ${s(1.4)}/>`,
};
/** The altar with the items in `ima`; the small table at the Epistle side appears when one of its items is shown. */
export function altar(ima: string[], k: string): string {
  const stol = ['gostarice', 'manutergium', 'campanula'].some(x => ima.includes(x));
  const base = `<path d="M24 236 h252 v12 h-252 Z M12 248 h276 v12 h-276 Z" fill="#cfc4b4" ${s(1)}/><path d="M36 150 h228 v86 h-228 Z" fill="#e7dccb" ${s()}/>${stol ? `<path d="M284 150 h72 v6 h-72 Z M290 156 v80 M350 156 v80" fill="#b99b72" ${s(1.2)}/>` : ''}`;
  const order = ['stolnjaci', 'tabelle', 'raspelo', 'svijece', 'misal', 'bursa', 'kalez', 'gostarice', 'manutergium', 'campanula'];
  return `<svg viewBox="0 50 ${stol ? 370 : 300} 216" class="oltar-crtez" aria-hidden="true" focusable="false">${base}${order.filter(id => ima.includes(id)).map(id => OLTAR[id](k)).join('')}<text x="40" y="276" font-size="11" fill="currentColor" opacity=".7"></text></svg>`;
}
const OBOX: Record<string, string> = { stolnjaci: '24 144 252 100', raspelo: '126 54 48 100', svijece: '80 86 140 70', misal: '214 118 44 36', kalez: '124 106 52 48', bursa: '52 124 36 30', tabelle: '106 124 88 30', gostarice: '286 122 32 26', manutergium: '310 130 26 20', campanula: '332 122 22 26' };
export function altarIcon(id: string, k: string): string { return `<svg viewBox="${OBOX[id]}" class="ruho-crtez" aria-hidden="true" focusable="false">${OLTAR[id](k)}</svg>`; }
