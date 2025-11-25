## 目标
- 使用 Vue3 + TypeScript + Vite7 搭建可构建为浏览器插件（Manifest v3）的项目。

## 结构
- `extension/public/manifest.json`
- `extension/vite.config.ts`（多入口：popup、background、content）
- `extension/package.json`（vue、vite7、@vitejs/plugin-vue、typescript）
- `extension/tsconfig.json`
- `extension/popup.html`
- `extension/src/popup/App.vue`、`src/popup/main.ts`
- `extension/src/background/index.ts`
- `extension/src/content/index.ts`

## 构建
- Vite 多入口输出：`assets/background.js`、`assets/content.js`，`popup.html` 位于 dist 根。
- Manifest 引用上述文件。

## 最小链路
- Popup 发送消息 → Background 转发到活动标签页 → Content 接收并处理。

## 步骤
1) 停止当前本地服务并清理旧目录（demo、web-assistant-extension）。
2) 创建上述骨架文件。
3) 安装依赖并构建产物到 `extension/dist`。
4) 浏览器扩展管理中加载 `extension/dist` 验证。

## 交付
- 完整骨架与可构建配置，最小消息链路可运行。