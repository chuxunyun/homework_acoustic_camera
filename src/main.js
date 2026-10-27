import './style.css'
import { createMockField } from './field.js'
import { createRenderer } from './renderer.js'
import { initPrinciple, setPrincipleActive } from './principle.js'

const $ = (id) => document.getElementById(id)

const sidebar = $('sidebar')
const collapseBtn = $('btn-collapse')
const canvas = $('heat')
const renderer = createRenderer(canvas)
const sample = createMockField()

const VIEW_EL = {
  live: document.querySelector('.view[data-view="live"]'),
  principle: document.querySelector('.view[data-view="principle"]'),
  empty: document.querySelector('.view[data-view="empty"]'),
}

const TITLES = {
  live: '实时显示',
  record: '录制回放',
  calib: '阵列标定',
  device: '设备设置',
  principle: '原理分析',
}

const STORE_KEY = 'acoustic-sidebar-collapsed'

let running = true
let live = true
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

/* ---------- 视图切换 ---------- */
function show(name) {
  const key = (name === 'live' || name === 'principle') ? name : 'empty'

  Object.keys(VIEW_EL).forEach((k) => { VIEW_EL[k].hidden = k !== key })

  if (key === 'empty') $('empty-title').textContent = TITLES[name] || name

  live = key === 'live'
  setPrincipleActive(key === 'principle')

  if (live) requestAnimationFrame(fit)
}

function setActiveNav(name) {
  document.querySelectorAll('.nav-item').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === name)
  })
}

function navigate(name) {
  setActiveNav(name)
  show(name)
  /* 用 replaceState 避免再触发 hashchange */
  if (location.hash.slice(1) !== name) {
    history.replaceState(null, '', '#' + name)
  }
}

document.querySelectorAll('.nav-item').forEach((el) => {
  el.addEventListener('click', () => navigate(el.dataset.view))
})

/* 支持 /#principle 直接打开某一页 */
window.addEventListener('hashchange', () => {
  navigate(location.hash.slice(1) || 'live')
})

/* ---------- 屏幕尺寸 ---------- */
function fit() {
  if (!live) return
  const r = VIEW_EL.live.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return
  renderer.resize(r.width, r.height)
}

new ResizeObserver(fit).observe(VIEW_EL.live)
window.addEventListener('resize', fit)

/* ---------- 主循环 ---------- */
function loop(now) {
  requestAnimationFrame(loop)

  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if (running) simT += dt

  if (live) renderer.draw(sample(simT))
  frames++

  if (now - fpsAt >= 400) {
    const fps = frames * 1000 / (now - fpsAt)
    frames = 0
    fpsAt = now
    $('fps-side').textContent = fps > 0 ? fps.toFixed(0) + ' fps' : '—'
  }
}

/* ---------- 采集开关 ---------- */
const btn = $('btn-toggle')
const btnLabel = btn.querySelector('.btn-label')
btn.addEventListener('click', () => {
  running = !running
  btnLabel.textContent = running ? '暂停采集' : '开始采集'
  btn.classList.toggle('paused', !running)
})

/* ---------- 启动 ---------- */
initPrinciple()
navigate(location.hash.slice(1) || 'live')
fit()
requestAnimationFrame(loop)
