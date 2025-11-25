function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
function createContainer() {
  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.top = '0'
  host.style.right = '0'
  host.style.width = '380px'
  host.style.height = '100vh'
  host.style.zIndex = '2147483647'
  host.style.pointerEvents = 'auto'
  const shadow = host.attachShadow({ mode: 'open' })
  const root = document.createElement('div')
  root.style.all = 'initial'
  shadow.appendChild(root)
  const style = document.createElement('style')
  style.textContent = `
    .panel{box-shadow:0 0 0 1px rgba(0,0,0,.06),0 12px 16px rgba(0,0,0,.12);background:#fff;border-radius:8px;margin:12px;pointer-events:auto;display:flex;flex-direction:column;height:calc(100vh - 24px)}
    .header{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #eee;font-family:system-ui;-webkit-font-smoothing:antialiased}
    .title{font-weight:600}
    .body{padding:12px;overflow:auto;flex:1}
    .row{margin-bottom:8px}
    .btn{background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:8px 10px;cursor:pointer}
    .btn.secondary{background:#e5e7eb;color:#111}
    .item{border:1px solid #eee;border-radius:6px;padding:8px;margin-bottom:8px}
    .item-title{font-weight:600;font-size:13px}
    .item-link{font-size:12px;color:#666}
    .item-desc{font-size:12px;color:#444}
  `
  root.appendChild(style)
  const panel = document.createElement('div')
  panel.className = 'panel'
  const header = document.createElement('div')
  header.className = 'header'
  const title = document.createElement('div')
  title.className = 'title'
  title.textContent = '网站助手'
  const actions = document.createElement('div')
  const closeBtn = document.createElement('button')
  closeBtn.className = 'btn secondary'
  closeBtn.textContent = '关闭'
  closeBtn.onclick = () => { host.remove() }
  const sideBtn = document.createElement('button')
  sideBtn.className = 'btn'
  sideBtn.textContent = '打开侧边栏'
  sideBtn.onclick = () => { chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' }) }
  actions.appendChild(sideBtn)
  actions.appendChild(closeBtn)
  header.appendChild(title)
  header.appendChild(actions)
  const body = document.createElement('div')
  body.className = 'body'
  panel.appendChild(header)
  panel.appendChild(body)
  root.appendChild(panel)
  document.documentElement.appendChild(host)
  return { host, body }
}
async function loadFeedData() {
  const data = await chrome.storage.local.get(['assistantFeed','assistantFeedRecords'])
  const list = Array.isArray(data.assistantFeed) ? data.assistantFeed : []
  const records = Array.isArray(data.assistantFeedRecords) ? data.assistantFeedRecords : []
  const origin = location.origin
  const matchedRecord = records.find((r: any) => r && typeof r.site === 'string' && origin.includes(new URL(r.site, origin).host))
  const items = list.length>0 ? list : matchedRecord ? matchedRecord.items || [] : []
  return items as { title: string, link: string, description: string }[]
}
function renderItems(body: HTMLElement, items: { title: string, link: string, description: string }[], intent?: string) {
  body.innerHTML = ''
  const intentRow = document.createElement('div')
  intentRow.className = 'row'
  if (intent) intentRow.textContent = '意图: ' + intent
  body.appendChild(intentRow)
  if (!items || items.length === 0) {
    const empty = document.createElement('div')
    empty.textContent = '暂无功能项'
    body.appendChild(empty)
    return
  }
  items.forEach(it => {
    const card = document.createElement('div')
    card.className = 'item'
    const t = document.createElement('div')
    t.className = 'item-title'
    t.textContent = it.title
    const l = document.createElement('div')
    l.className = 'item-link'
    l.textContent = it.link
    const d = document.createElement('div')
    d.className = 'item-desc'
    d.textContent = it.description
    const actions = document.createElement('div')
    const openBtn = document.createElement('button')
    openBtn.className = 'btn'
    openBtn.textContent = '打开'
    openBtn.onclick = () => { if (it.link) location.href = it.link }
    const setBtn = document.createElement('button')
    setBtn.className = 'btn secondary'
    setBtn.textContent = '设为意图'
    setBtn.onclick = () => { chrome.runtime.sendMessage({ type: 'SET_INTENT', intent: it.title }) }
    actions.appendChild(openBtn)
    actions.appendChild(setBtn)
    card.appendChild(t)
    card.appendChild(l)
    card.appendChild(d)
    card.appendChild(actions)
    body.appendChild(card)
  })
}
async function showPanel(intent?: string) {
  const { body } = createContainer()
  const items = await loadFeedData()
  renderItems(body, items, intent)
}
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'RUN_FEATURE') {
    showPanel().catch(() => {})
    sendResponse({ ok: true })
    return true
  }
  if (msg && msg.type === 'SHOW_INTENT') {
    showPanel(msg.intent).catch(() => {})
    sendResponse({ ok: true })
    return true
  }
  if (msg && msg.type === 'CHAT_RUN') {
    runChat(msg).then(res => sendResponse({ ok: true, result: res })).catch(() => sendResponse({ ok: false }))
    return true
  }
})

function visible(el: Element) {
  const r = (el as HTMLElement).getBoundingClientRect()
  return r.width > 0 && r.height > 0
}
function firstClickable() {
  const sels = ['button', 'a[href]', '[role="button"]', 'input[type="submit"]', 'input[type="button"]']
  for (const s of sels) {
    const els = Array.from(document.querySelectorAll(s)).filter(visible)
    if (els.length > 0) return els[0] as HTMLElement
  }
  return null
}
async function runChat({ mode, text }: any) {
  if (mode === 'Query') {
    const info = {
      title: document.title,
      url: location.href,
      links: document.querySelectorAll('a').length,
      buttons: document.querySelectorAll('button').length,
      inputs: document.querySelectorAll('input,select,textarea').length
    }
    return `标题: ${info.title}\nURL: ${info.url}\n链接: ${info.links} 按钮: ${info.buttons} 输入: ${info.inputs}`
  }
  if (mode === 'Tap') {
    const el = firstClickable()
    if (!el) return '未找到可点击元素'
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const { body } = createContainer()
    const card = document.createElement('div')
    card.className = 'item'
    const t = document.createElement('div')
    t.className = 'item-title'
    t.textContent = '已定位到一个可点击元素'
    const l = document.createElement('div')
    l.className = 'item-link'
    l.textContent = el.innerText || el.getAttribute('href') || ''
    card.appendChild(t)
    card.appendChild(l)
    body.innerHTML = ''
    body.appendChild(card)
    return '已定位元素'
  }
  if (mode === 'Action') {
    const el = firstClickable()
    if (!el) return '未找到可点击元素'
    el.click()
    return '已尝试点击第一个按钮'
  }
  if (mode === 'Assert') {
    const selector = (text || '').trim()
    if (!selector) return '请提供选择器'
    const el = document.querySelector(selector)
    return el ? '断言通过：元素存在' : '断言失败：元素不存在'
  }
  return '已记录请求'
}