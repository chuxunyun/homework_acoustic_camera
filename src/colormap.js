/* 铁红（ironbow）色标，热成像仪经典配色 */
const STOPS = [
  [0.00,   8,   8,  26],
  [0.11,  30,  18,  96],
  [0.23,  84,  22, 132],
  [0.36, 156,  28, 108],
  [0.49, 214,  48,  62],
  [0.62, 242,  96,  26],
  [0.75, 251, 152,  30],
  [0.87, 253, 206,  74],
  [0.95, 255, 238, 150],
  [1.00, 255, 253, 238]
]

const LUT = new Uint8ClampedArray(256 * 3)

;(function build() {
  let s = 0
  for (let i = 0; i < 256; i++) {
    const t = i / 255
    while (s < STOPS.length - 2 && t > STOPS[s + 1][0]) s++
    const a = STOPS[s]
    const b = STOPS[s + 1]
    let f = (t - a[0]) / Math.max(1e-6, b[0] - a[0])
    f = f < 0 ? 0 : f > 1 ? 1 : f
    LUT[i * 3]     = a[1] + (b[1] - a[1]) * f
    LUT[i * 3 + 1] = a[2] + (b[2] - a[2]) * f
    LUT[i * 3 + 2] = a[3] + (b[3] - a[3]) * f
  }
})()

export function lutColor(t) {
  const i = Math.max(0, Math.min(255, Math.round(t * 255)))
  return 'rgb(' + LUT[i * 3] + ',' + LUT[i * 3 + 1] + ',' + LUT[i * 3 + 2] + ')'
}

export function gradientCss(steps = 12, dir = 'to top') {
  const parts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    parts.push(lutColor(t) + ' ' + (t * 100).toFixed(2) + '%')
  }
  return 'linear-gradient(' + dir + ', ' + parts.join(', ') + ')'
}

export { LUT }
