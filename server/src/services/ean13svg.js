// Bağımlılıksız EAN-13 → SVG (demo barkod sayfası için)
const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

export function ean13Bits(code) {
  const d = code.split('').map(Number);
  const par = PARITY[d[0]];
  let bits = '101';
  for (let i = 1; i <= 6; i++) bits += (par[i - 1] === 'L' ? L : G)[d[i]];
  bits += '01010';
  for (let i = 7; i <= 12; i++) bits += R[d[i]];
  return bits + '101';
}

export function ean13Svg(code, module = 3, height = 90) {
  const bits = ean13Bits(code);
  const quiet = 11 * module;
  const w = bits.length * module + quiet * 2;
  let rects = '';
  for (let i = 0; i < bits.length; i++) if (bits[i] === '1') rects += `<rect x="${quiet + i * module}" y="0" width="${module}" height="${height}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height + 22}" viewBox="0 0 ${w} ${height + 22}">
<rect width="100%" height="100%" fill="#fff"/><g fill="#000" shape-rendering="crispEdges">${rects}</g>
<text x="${w / 2}" y="${height + 18}" font-family="monospace" font-size="16" text-anchor="middle">${code}</text></svg>`;
}
