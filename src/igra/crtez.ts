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
export function figure(placed: number, k: string): string {
  const on = new Set(ORDER.slice(0, placed));
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
