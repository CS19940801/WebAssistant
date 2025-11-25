<template>
  <div style="padding:0;width:360px">
    <el-container>
      <el-header height="48px" style="display:flex;align-items:center;justify-content:space-between;padding:0 12px">
        <div style="font-weight:600">网站助手</div>
        <div style="display:flex;gap:8px">
          <el-button size="small" @click="openSidePanel">打开侧边栏</el-button>
          <el-button v-if="authed" size="small" @click="logout">退出</el-button>
        </div>
      </el-header>
      <el-main style="padding:12px">
        <div v-if="!authed">
          <el-card shadow="never">
            <el-form :model="login" label-width="72px">
              <el-form-item label="用户名">
                <el-input :model-value="login.username" @input="v=>login.username=v" placeholder="请输入" />
              </el-form-item>
              <el-form-item label="令牌">
                <el-input :model-value="login.token" @input="v=>login.token=v" placeholder="可留空模拟登录" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="doLogin" style="width:100%">登录</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
        <div v-else>
          <el-tabs :model-value="tab" @update:modelValue="v=>tab=v">
            <el-tab-pane label="助手" name="assistant">
              <el-card shadow="never">
                <el-form label-width="72px">
                  <el-form-item label="意图">
                    <el-input :model-value="intent" @input="v=>intent=v" placeholder="例如：新建员工" />
                  </el-form-item>
                  <el-form-item label="模式">
                    <el-radio-group :model-value="mode" @change="v=>mode=v">
                      <el-radio label="guided">引导</el-radio>
                      <el-radio label="visible_automation">可见自动化</el-radio>
                      <el-radio label="api">接口直连</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item label="姓名">
                    <el-input :model-value="name" @input="v=>name=v" placeholder="例如：张三" />
                  </el-form-item>
                  <el-form-item label="部门">
                    <el-input :model-value="dept" @input="v=>dept=v" placeholder="例如：人事部" />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="run" style="width:100%">发送</el-button>
                  </el-form-item>
                </el-form>
                <el-divider />
                <el-scrollbar height="140px">
                  <div v-for="(l,i) in logs" :key="i" style="font-size:12px">{{ l }}</div>
                </el-scrollbar>
              </el-card>
            </el-tab-pane>
          <el-tab-pane label="网站指南" name="guide">
            <el-card shadow="never">
              <div style="margin-bottom:8px">上传网站 RSS/Atom Feed 文件</div>
              <el-upload drag :auto-upload="false" :show-file-list="false" :on-change="handleFeedChange">
                <el-icon><UploadFilled /></el-icon>
                <div class="el-upload__text">拖拽到此或点击上传</div>
              </el-upload>
              <div style="display:flex;gap:8px;margin-top:8px">
                <el-button size="small" @click="saveFeed">保存</el-button>
                <el-button size="small" @click="loadFeed">读取</el-button>
                <el-button size="small" type="danger" @click="clearFeed">清空</el-button>
              </div>
              <el-divider />
              <el-form label-width="84px">
                <el-form-item label="网站地址">
                  <el-input :model-value="siteUrl" @input="v=>siteUrl=v" placeholder="https://example.com" />
                </el-form-item>
                <el-form-item label="候选RSS">
                  <div style="display:flex;gap:8px">
                    <el-button :loading="discovering" size="small" @click="discoverFeeds">发现RSS</el-button>
                    <el-button size="small" :disabled="candidateFeeds.length===0" @click="pullFirstFeed">拉取第一个</el-button>
                  </div>
                </el-form-item>
              </el-form>
              <div v-if="candidateFeeds.length>0" style="margin-bottom:8px">
                <div style="font-size:12px;color:#666">发现 {{ candidateFeeds.length }} 个候选：</div>
                <div v-for="(u,i) in candidateFeeds" :key="i" style="display:flex;justify-content:space-between;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid #eee">
                  <div style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px">{{ u }}</div>
                  <div>
                    <el-button size="small" @click="pullFeed(u)">拉取</el-button>
                  </div>
                </div>
              </div>
              <el-alert v-if="summary" :title="summary" type="info" show-icon style="margin-bottom:8px" />
              <el-scrollbar height="180px">
                <el-empty v-if="feedItems.length===0" description="暂无功能项" />
                <div v-else>
                  <div v-for="(it,idx) in feedItems" :key="idx" style="padding:8px;border-bottom:1px solid #eee">
                    <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
                      <div style="overflow:hidden">
                        <div style="font-weight:600;font-size:13px">{{ it.title }}</div>
                        <div style="font-size:12px;color:#666">{{ it.link }}</div>
                        <div style="font-size:12px;color:#444">{{ it.description }}</div>
                      </div>
                      <div style="display:flex;gap:6px">
                        <el-button size="small" @click="navigate(it.link)">打开页面</el-button>
                        <el-button size="small" @click="intent=it.title">作为意图</el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </el-scrollbar>
            </el-card>
          </el-tab-pane>
          </el-tabs>
        </div>
      </el-main>
    </el-container>
  </div>
  
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
const authed = ref(false)
const login = ref({ username: '', token: '' })
const tab = ref<'assistant'|'guide'>('assistant')
const intent = ref('')
const mode = ref<'guided'|'visible_automation'|'api'>('guided')
const name = ref('')
const dept = ref('')
const logs = ref<string[]>([])
const feedItems = ref<{title:string,link:string,description:string}[]>([])
const summary = ref('')
const siteUrl = ref('')
const candidateFeeds = ref<string[]>([])
const discovering = ref(false)
function log(s: string) { logs.value.push(s) }
async function loadAuth() {
  const data = await chrome.storage.local.get(['assistantAuth'])
  if (data && data.assistantAuth) {
    authed.value = true
    login.value = data.assistantAuth
  } else {
    authed.value = false
  }
}
async function doLogin() {
  await chrome.storage.local.set({ assistantAuth: login.value })
  authed.value = true
}
async function logout() {
  await chrome.storage.local.remove(['assistantAuth'])
  authed.value = false
}
async function run() {
  log('发送: ' + intent.value + ' 模式: ' + mode.value)
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab) { log('没有活动标签页'); return }
  await chrome.runtime.sendMessage({
    type: 'RUN_INTENT',
    tabId: tab.id,
    intent: intent.value,
    mode: mode.value,
    inputs: { name: name.value, dept: dept.value }
  })
}
onMounted(loadAuth)

function parseRSS(xml: string) {
  const d = new DOMParser().parseFromString(xml, 'text/xml')
  const items: {title:string,link:string,description:string}[] = []
  const rssItems = Array.from(d.getElementsByTagName('item'))
  rssItems.forEach(it => {
    const t = it.getElementsByTagName('title')[0]?.textContent || ''
    const l = it.getElementsByTagName('link')[0]?.textContent || ''
    const desc = it.getElementsByTagName('description')[0]?.textContent || ''
    items.push({ title: t, link: l, description: desc })
  })
  if (items.length === 0) {
    const entries = Array.from(d.getElementsByTagName('entry'))
    entries.forEach(e => {
      const t = e.getElementsByTagName('title')[0]?.textContent || ''
      const linkEl = e.getElementsByTagName('link')[0]
      const l = linkEl?.getAttribute('href') || ''
      const desc = e.getElementsByTagName('summary')[0]?.textContent || e.getElementsByTagName('content')[0]?.textContent || ''
      items.push({ title: t, link: l || '', description: desc })
    })
  }
  return items
}

async function handleFeedChange(file: any) {
  const raw = file.raw as File
  if (!raw) return
  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result || '')
    feedItems.value = parseRSS(text)
    summary.value = summarize(feedItems.value)
  }
  reader.readAsText(raw)
}

async function saveFeed() {
  await chrome.storage.local.set({ assistantFeed: feedItems.value })
}
async function loadFeed() {
  const data = await chrome.storage.local.get(['assistantFeed'])
  feedItems.value = data.assistantFeed || []
  summary.value = summarize(feedItems.value)
}
async function clearFeed() {
  feedItems.value = []
  await chrome.storage.local.remove(['assistantFeed'])
  summary.value = ''
}
async function navigate(url: string) {
  const [tabInfo] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tabInfo) return
  if (url) await chrome.tabs.update(tabInfo.id!, { url })
}

async function openSidePanel() {
  await chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' })
}

function summarize(items: {title:string,link:string,description:string}[]) {
  if (!items || items.length === 0) return ''
  const total = items.length
  const keywords = {
    创建: [/新建|创建|添加/],
    管理: [/管理|维护|配置/],
    审批: [/审批|审核|流程/],
    报表: [/报表|统计|分析|导出/],
    用户: [/用户|员工|账号|权限/],
    集成: [/集成|API|接口|Webhook/]
  } as Record<string, RegExp[]>
  const counts: Record<string, number> = {}
  Object.keys(keywords).forEach(k => counts[k] = 0)
  items.forEach(it => {
    const text = (it.title + ' ' + it.description).toLowerCase()
    Object.entries(keywords).forEach(([k, regs]) => {
      if (regs.some(r => r.test(text))) counts[k]++
    })
  })
  const features = Object.entries(counts).filter(([,c]) => c>0).map(([k,c]) => `${k}${c>1?'等':''}`)
  const whenUse = features.includes('审批') ? '适合需要流程与权限控制的业务场景' : features.includes('报表') ? '适合数据分析与导出场景' : '适合常规业务操作与导航引导'
  return `检测到 ${total} 个功能项，包含 ${features.join('、')} 等模块；${whenUse}`
}

function toAbsolute(base: string, href: string) {
  try { return new URL(href, base).toString() } catch { return href }
}
function extractFeedLinks(html: string, base: string) {
  const d = new DOMParser().parseFromString(html, 'text/html')
  const links = Array.from(d.querySelectorAll('link[rel="alternate"]')).filter(el => {
    const t = (el.getAttribute('type') || '').toLowerCase()
    return t.includes('rss') || t.includes('atom') || t.includes('xml')
  }).map(el => toAbsolute(base, el.getAttribute('href') || ''))
  const aLinks = Array.from(d.querySelectorAll('a')).filter(el => {
    const href = (el.getAttribute('href') || '').toLowerCase()
    return href.includes('rss') || href.includes('atom') || href.endsWith('.xml')
  }).map(el => toAbsolute(base, el.getAttribute('href') || ''))
  const set = new Set<string>([...links, ...aLinks].filter(u => !!u))
  return Array.from(set)
}
async function discoverFeeds() {
  if (!siteUrl.value) return
  discovering.value = true
  candidateFeeds.value = []
  try {
    const res = await fetch(siteUrl.value)
    const html = await res.text()
    const base = siteUrl.value
    const found = extractFeedLinks(html, base)
    const common = ['feed', 'rss.xml', 'atom.xml', 'index.xml', 'blog/rss.xml', 'feeds/posts/default?alt=rss']
      .map(p => toAbsolute(base, base.endsWith('/') ? p : '/' + p))
    candidateFeeds.value = Array.from(new Set<string>([...found, ...common]))
  } catch {}
  discovering.value = false
}
async function pullFirstFeed() {
  if (candidateFeeds.value.length === 0) return
  await pullFeed(candidateFeeds.value[0])
}
async function pullFeed(url: string) {
  try {
    const res = await fetch(url)
    const xml = await res.text()
    const items = parseRSS(xml)
    if (items.length > 0) {
      feedItems.value = items
      summary.value = summarize(items)
    }
  } catch {}
}
</script>