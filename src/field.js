/* 合成声场：两个游走的声源 + 本底噪声。
   后面接真实数据时，只要把 sample() 换成波束形成的输出即可。 */
export const GW = 64
export const GH = 48

const N = GW * GH

function gauss(dx, dy, sigma) {
  return Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma))
}

export function createMockField() {
  const buf = new Float32Array(N)

  return function sample(t) {
    /* 主声源：李萨如轨迹，看起来像有人在房间里走动 */
    const ax = GW * 0.5 + GW * 0.30 * Math.cos(t * 0.62)
    const ay = GH * 0.5 + GH * 0.26 * Math.sin(t * 0.88)

    /* 次声源：反相移动 */
    const bx = GW * 0.5 + GW * 0.27 * Math.cos(t * 1.05 + 2.1)
    const by = GH * 0.5 + GH * 0.29 * Math.sin(t * 0.71 + 1.3)

    /* 幅度缓慢起伏，像说话 / 音乐 */
    const ampA = 0.82 + 0.18 * Math.sin(t * 1.7)
    const ampB = 0.44 + 0.16 * Math.sin(t * 2.3 + 0.9)

    let i = 0
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        const dxa = x - ax, dya = y - ay
        const dxb = x - bx, dyb = y - by

        let v = 0.055
        v += ampA * gauss(dxa, dya, 6.2)
        v += ampB * gauss(dxb, dyb, 9.0)

        /* 细颗粒噪声，避免画面太平 */
        v += (Math.random() - 0.5) * 0.035

        buf[i++] = v < 0 ? 0 : v > 1 ? 1 : v
      }
    }
    return buf
  }
}

/* 峰值位置，用于读数标注 */
export function findPeak(f) {
  let k = 0, m = -1
  for (let i = 0; i < N; i++) if (f[i] > m) { m = f[i]; k = i }
  const x = k % GW
  const y = (k / GW) | 0
  return { x, y, value: m, u: x / (GW - 1), v: y / (GH - 1) }
}
