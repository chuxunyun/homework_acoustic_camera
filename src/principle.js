/* 原理分析：波束形成 (Delay & Sum) 可视化
   移植自 beamforming.html，去掉 Tailwind CDN，配色改用站点令牌 */

const MIC_SPACING = 20
const WAVE_SPEED = 2
const K_FACTOR = 0.12

const C_SRC = '#e05252'
const C_SCAN = '#185a95'
const C_SUM = '#1f8a53'
const C_GRID = '#eceef2'
const C_MUTE = '#5b6472'

let state = { sourceAngle: 30, scanAngle: 30, numMics: 8, playing: true }
let time = 0
let raf = null
let active = false
let bound = false
let els = null

function getMicPositions(count) {
  const total = (count - 1) * MIC_SPACING
  const startX = -total / 2
  const out = []
  for (let i = 0; i < count; i++) out.push(startX + i * MIC_SPACING)
  return out
}

function delays(angleDeg, mics) {
  const r = (angleDeg * Math.PI) / 180
  return mics.map((x) => x * Math.sin(r))
}

function drawPhysics(ctx, w, h) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2
  const cy = h - 50
  const mics = getMicPositions(state.numMics)

  ctx.fillStyle = '#333'
  ctx.strokeStyle = '#c9ced6'
  ctx.lineWidth = 2
  mics.forEach((x) => {
    ctx.beginPath()
    ctx.arc(cx + x, cy, 4, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.beginPath()
  ctx.moveTo(cx + mics[0], cy)
  ctx.lineTo(cx + mics[mics.length - 1], cy)
  ctx.stroke()

  const dist = 200
  const srad = (state.sourceAngle * Math.PI) / 180
  const sx = cx + dist * Math.sin(srad)
  const sy = cy - dist * Math.cos(srad)

  ctx.fillStyle = C_SRC
  ctx.beginPath()
  ctx.arc(sx, sy, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = C_MUTE
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('声源', sx + 12, sy + 4)

  ctx.strokeStyle = 'rgba(224, 82, 82, 0.45)'
  ctx.lineWidth = 2
  const dir = Math.atan2(cy - sy, cx - sx)
  const maxR = 300
  for (let r = 0; r < maxR; r += 20) {
    let cur = (r - time * WAVE_SPEED) % maxR
    if (cur < 0) cur += maxR
    ctx.beginPath()
    ctx.arc(sx, sy, cur, dir - 0.8, dir + 0.8)
    ctx.stroke()
  }

  const scrad = (state.scanAngle * Math.PI) / 180
  const len = 220
  const ex = cx + len * Math.sin(scrad)
  const ey = cy - len * Math.cos(scrad)
  ctx.strokeStyle = C_SCAN
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(ex, ey)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = C_SCAN
  ctx.fillText('扫描方向', ex, ey - 10)
}

function drawSignal(ctx, w, h) {
  ctx.clearRect(0, 0, w, h)
  const mics = getMicPositions(state.numMics)
  const real = delays(state.sourceAngle, mics)
  const steer = delays(state.scanAngle, mics)

  const SUM_H = 100
  const rowH = Math.min((h - SUM_H) / state.numMics, 50)
  const scaleY = Math.min(rowH * 0.4, 20)

  mics.forEach((_, i) => {
    const base = i * rowH + rowH / 2 + 10

    ctx.strokeStyle = C_GRID
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, base)
    ctx.lineTo(w, base)
    ctx.stroke()

    ctx.strokeStyle = C_SRC
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let px = 0; px < w; px++) {
      const xv = px - w / 2
      const ph = xv * K_FACTOR - time * 0.2 + real[i] * K_FACTOR
      const yv = Math.sin(ph) * scaleY
      if (px === 0) ctx.moveTo(px, base + yv)
      else ctx.lineTo(px, base + yv)
    }
    ctx.stroke()

    ctx.strokeStyle = C_SCAN
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let px = 0; px < w; px++) {
      const xv = px - w / 2
      const ph = xv * K_FACTOR - time * 0.2 + (real[i] - steer[i]) * K_FACTOR
      const yv = Math.sin(ph) * scaleY
      if (px === 0) ctx.moveTo(px, base + yv)
      else ctx.lineTo(px, base + yv)
    }
    ctx.stroke()
  })

  const sumBase = h - SUM_H / 2
  ctx.fillStyle = C_MUTE
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('波束形成输出 Σ', 10, h - SUM_H + 20)

  ctx.strokeStyle = C_SUM
  ctx.lineWidth = 3
  ctx.beginPath()
  const sumScale = Math.min(scaleY * 1.5, 35)
  for (let px = 0; px < w; px++) {
    const xv = px - w / 2
    let s = 0
    for (let i = 0; i < state.numMics; i++) {
      s += Math.sin(xv * K_FACTOR - time * 0.2 + (real[i] - steer[i]) * K_FACTOR)
    }
    const yv = (s / state.numMics) * sumScale
    if (px === 0) ctx.moveTo(px, sumBase + yv)
    else ctx.lineTo(px, sumBase + yv)
  }
  ctx.stroke()

  if (Math.abs(state.sourceAngle - state.scanAngle) < 5) {
    ctx.strokeStyle = 'rgba(31, 138, 83, 0.35)'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(w / 2, 0)
    ctx.lineTo(w / 2, h)
    ctx.stroke()
  }
}

function drawResponse(ctx, w, h) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2
  const by = h - 20
  const radius = Math.min(w, h) - 40
  const mics = getMicPositions(state.numMics)
  const real = delays(state.sourceAngle, mics)

  ctx.beginPath()
  ctx.strokeStyle = '#e3e6ea'
  ctx.arc(cx, by, radius, Math.PI, 0)
  ctx.stroke()

  ctx.beginPath()
  ctx.strokeStyle = 'rgba(24, 90, 149, 0.85)'
  ctx.fillStyle = 'rgba(24, 90, 149, 0.18)'
  ctx.lineWidth = 2

  for (let deg = -90; deg <= 90; deg += 2) {
    const steer = delays(deg, mics)
    let re = 0
    let im = 0
    for (let i = 0; i < state.numMics; i++) {
      const pd = (real[i] - steer[i]) * K_FACTOR
      re += Math.cos(pd)
      im += Math.sin(pd)
    }
    const mag = Math.sqrt(re * re + im * im) / state.numMics
    const pr = mag * radius
    const rad = (deg * Math.PI) / 180
    const px = cx + pr * Math.sin(rad)
    const py = by - pr * Math.cos(rad)
    if (deg === -90) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.lineTo(cx, by)
  ctx.closePath()
  ctx.stroke()
  ctx.fill()

  const srad = (state.sourceAngle * Math.PI) / 180
  ctx.strokeStyle = C_SRC
  ctx.beginPath()
  ctx.moveTo(cx, by)
  ctx.lineTo(cx + radius * Math.sin(srad), by - radius * Math.cos(srad))
  ctx.stroke()
  ctx.fillStyle = C_SRC
  ctx.fillText('真实声源', cx + radius * Math.sin(srad) + 5, by - radius * Math.cos(srad) - 5)

  const scrad = (state.scanAngle * Math.PI) / 180
  ctx.strokeStyle = '#9aa3af'
  ctx.setLineDash([2, 2])
  ctx.beginPath()
  ctx.moveTo(cx, by)
  ctx.lineTo(cx + radius * 0.8 * Math.sin(scrad), by - radius * 0.8 * Math.cos(scrad))
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = C_MUTE
  ctx.fillText('扫描方向', cx + radius * 0.7 * Math.sin(scrad), by - radius * 0.7 * Math.cos(scrad))
}

function syncUI() {
  if (!els) return
  els.sourceVal.textContent = state.sourceAngle
  els.scanVal.textContent = state.scanAngle
  els.micsVal.textContent = state.numMics
  els.sourceInput.value = state.sourceAngle
  els.scanInput.value = state.scanAngle
  els.micsInput.value = state.numMics
}

function loop() {
  if (!active) return
  if (state.playing) time += 1
  drawPhysics(els.ctxPhys, els.phys.width, els.phys.height)
  drawSignal(els.ctxSig, els.sig.width, els.sig.height)
  drawResponse(els.ctxResp, els.resp.width, els.resp.height)
  raf = requestAnimationFrame(loop)
}

export function initPrinciple() {
  if (bound) return
  bound = true

  const $ = (id) => document.getElementById(id)
  const phys = $('physicsCanvas')
  const sig = $('signalCanvas')
  const resp = $('responseCanvas')

  els = {
    phys, sig, resp,
    ctxPhys: phys.getContext('2d'),
    ctxSig: sig.getContext('2d'),
    ctxResp: resp.getContext('2d'),
    sourceInput: $('sourceAngleInput'),
    scanInput: $('scanAngleInput'),
    micsInput: $('numMicsInput'),
    sourceVal: $('sourceAngleVal'),
    scanVal: $('scanAngleVal'),
    micsVal: $('numMicsVal'),
    autoBtn: $('autoLockBtn'),
    playBtn: $('togglePlayBtn'),
  }

  els.sourceInput.addEventListener('input', (e) => {
    state.sourceAngle = parseInt(e.target.value, 10)
    syncUI()
  })
  els.scanInput.addEventListener('input', (e) => {
    state.scanAngle = parseInt(e.target.value, 10)
    syncUI()
  })
  els.micsInput.addEventListener('input', (e) => {
    state.numMics = parseInt(e.target.value, 10)
    syncUI()
  })
  els.autoBtn.addEventListener('click', () => {
    state.scanAngle = state.sourceAngle
    syncUI()
  })
  els.playBtn.addEventListener('click', () => {
    state.playing = !state.playing
    els.playBtn.textContent = state.playing ? '暂停动画' : '播放动画'
  })

  syncUI()
  fitCanvases()
}

/* 画布尺寸：左列「物理场景」占满宽度；
   右列「信号处理 + 波束图」共用一份高度预算，取相同宽度，
   保证两张卡片在常见分辨率下一屏装得下，又不会把图压得太窄。 */
export function fitCanvases() {
  if (!els) return

  function setWidth(cv, w) {
    const ar = cv.width / cv.height
    cv.style.width = Math.round(w) + 'px'
    cv.style.height = Math.round(w / ar) + 'px'
  }

  const boxP = els.phys.parentElement
  if (boxP && boxP.clientWidth > 0) setWidth(els.phys, boxP.clientWidth)

  const boxS = els.sig.parentElement
  const boxR = els.resp.parentElement
  if (!boxS || !boxR || !boxS.clientWidth) return

  /* 卡片除画布之外的固定高度（内边距 + 标题 + 边框） */
  function chromeOf(cv) {
    const card = cv.closest('.pcard')
    if (!card) return 93
    const h = card.getBoundingClientRect().height - cv.getBoundingClientRect().height
    return h > 20 ? h : 93
  }

  const grid = document.querySelector('.pgrid')
  const H = grid ? grid.clientHeight : 0
  const GAP = 16
  const cardW = Math.min(boxS.clientWidth, boxR.clientWidth)

  const arS = els.sig.width / els.sig.height
  const arR = els.resp.width / els.resp.height

  /* 右列：两张卡片 + 间距正好等于列高 */
  let budget = H - GAP - chromeOf(els.sig) - chromeOf(els.resp)
  if (!(budget > 100)) budget = Math.max(240, window.innerHeight - 250)
  const w = Math.min(cardW, budget / (1 / arS + 1 / arR))
  setWidth(els.sig, w)
  setWidth(els.resp, w)
}

window.addEventListener('resize', function () { fitCanvases() })

export function setPrincipleActive(v) {
  if (!els) return
  active = v
  if (v) {
    fitCanvases()
    if (raf === null) raf = requestAnimationFrame(loop)
  } else {
    if (raf !== null) cancelAnimationFrame(raf)
    raf = null
  }
}
