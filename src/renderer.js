import { LUT } from './colormap.js'
import { GW, GH } from './field.js'

/* 白场叠加声场：颜色 = 铁红色标，透明度 = 强度。
   冷区完全透明（透出白色），热区着色。
   网格按 cover 方式铺满屏幕，保证斑点不会被拉伸成椭圆。 */
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true })
  const off = document.createElement('canvas')
  off.width = GW
  off.height = GH
  const octx = off.getContext('2d')
  const img = octx.createImageData(GW, GH)
  const d = img.data

  const ALPHA = new Uint8ClampedArray(256)
  for (let i = 0; i < 256; i++) {
    const v = i / 255
    const a = Math.max(0, (v - 0.045) / 0.955)
    ALPHA[i] = Math.round(Math.pow(a, 0.82) * 238)
  }

  let W = 0, H = 0

  function resize(w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = Math.max(1, Math.round(w))
    H = Math.max(1, Math.round(h))
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function draw(buf) {
    for (let i = 0, j = 0; i < buf.length; i++, j += 4) {
      const c = (buf[i] * 255) | 0
      const k = c * 3
      d[j] = LUT[k]
      d[j + 1] = LUT[k + 1]
      d[j + 2] = LUT[k + 2]
      d[j + 3] = ALPHA[c]
    }
    octx.putImageData(img, 0, 0)

    ctx.clearRect(0, 0, W, H)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const s = Math.max(W / GW, H / GH)
    const dw = GW * s
    const dh = GH * s
    ctx.drawImage(off, (W - dw) / 2, (H - dh) / 2, dw, dh)
  }

  return { resize, draw }
}
