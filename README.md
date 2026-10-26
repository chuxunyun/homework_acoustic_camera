# 声学相机 · 前端

8 麦圆阵声源定位的显示端。摄像头画面 + 声场热力图叠加成像。

## 技术栈

- Vite 7 + 原生 JS（无框架、无 UI 库）
- Canvas 2D 渲染，64 × 48 声场网格放大绘制
- 铁红（ironbow）色标，透明度随声压变化

## 运行

```bash
npm install
npm run dev
```

打开 http://127.0.0.1:8502

## 目录

```
index.html          页面骨架
src/main.js         主循环、侧栏折叠、尺寸自适应
src/renderer.js     Canvas 2D 绘制声场
src/field.js        合成声场（后面换成真实波束形成输出）
src/colormap.js     铁红色标 LUT
src/style.css       全部样式
public/logo.png     侧边栏图标（裁切自 bb_png/IMG_4828.PNG）
```

## 当前进度

- [x] 左侧可折叠侧边栏（216px ↔ 64px，状态持久化）
- [x] 右侧全屏显示区（白场占位）
- [x] 声场热力图叠加渲染
- [ ] 接入真实摄像头
- [ ] 接入 WebSocket 实时数据
- [ ] 阵列标定 / 录制回放 / 设备设置

## 说明

摄像头未接入时用纯白占位。热力图按 `cover` 方式铺满，
冷区完全透明（透出白色），热区着色 —— 换成分贝量纲的热成像效果。
