import './style.css'
import { createMockField } from './field.js'
import { createRenderer } from './renderer.js'

const $ = (id) => document.getElementById(id)

const sidebar = $('sidebar')
const collapseBtn = $('btn-collapse')
const screenEl = document.querySelector('.screen')
const canvas = $('heat')
const renderer = createRenderer(canvas)
const sample = createMockField()

const STORE_KEY = 'acoustic-sidebar-collapsed'

let running = true
let simT = 0
let last = performance.now()
let frames = 0
let fpsAt = last

/* ---------- 侧边栏折叠 ---------- */
function applyCollapsed(v) {
  sidebar.classList.toggle('collapsed', v)

  const tip = v ? '展开侧边栏' : '收起侧边栏'
  collapseBtn.title = tip
  collapseBtn.setAttribute('aria-label', tip)

  /* 收起后图标没有文字，靠 title 提示 */
  document.querySelectorAll('.nav-item').forEach((el) => {
    if (v) el.title = el.dataset.label
    else el.removeAttribute('title')
  })
}

let collapsed = false
try { collapsed = localStorage.getItem(STORE_KEY) === '1' } catch (e) { collapsed = false }
applyCollapsed(collapsed)

collapseBtn.addEventListener('click', () => {
  collapsed = !collapsed
  try { localStorage.setItem(STORE_KEY, collapsed ? '1' : '0') } catch (e) { /* 隐私模式忽略 */ }
  applyCollapsed(collapsed)
})

/* ---------- 屏幕尺寸 ---------- */
function fit() {
  const r = screenEl.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return
  renderer.resize(r.width, r.height)
}

new ResizeObserver(fit).observe(screenEl)
window.addEventListener('resize', fit)

/* ---------- 主循环 ---------- */
function loop(now) {
  requestAnimationFrame(loop)

  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if (running) simT += dt

  renderer.draw(sample(simT))
  frames++

  if (now - fpsAt >= 400) {
    const fps = frames * 1000 / (now - fpsAt)
    frames = 0
    fpsAt = now
    $('fps-side').textContent = fps > 0 ? fps.toFixed(0) + ' fps' : '—'
  }
}

/* 导航：目前只切选中态，右侧内容接进来之前不换页 */
document.querySelectorAll('.nav-item').forEach((el) => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.remove('active'))
    el.classList.add('active')
  })
})

/* 采集开关 */
const btn = $('btn-toggle')
const btnLabel = btn.querySelector('.btn-label')
btn.addEventListener('click', () => {
  running = !running
  btnLabel.textContent = running ? '暂停采集' : '开始采集'
  btn.classList.toggle('paused', !running)
})

fit()
requestAnimationFrame(loop)
