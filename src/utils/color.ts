export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(num)) return [122, 21, 48];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

export function mixWithWhite([r, g, b]: [number, number, number], amount: number): string {
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `${mix(r)}, ${mix(g)}, ${mix(b)}`;
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

// Muted, jewel-toned hues that suit a saree swatch background — avoids
// neon/pastel extremes so a random pick still looks intentional.
export function randomPleasantHex(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 35 + Math.random() * 30;
  const lightness = 28 + Math.random() * 24;
  return hslToHex(hue, saturation, lightness);
}
