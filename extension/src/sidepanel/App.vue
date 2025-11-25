<template>
  <div style="width:100%;height:100%;padding:0">
    <el-container>
      <el-header height="52px" style="display:flex;align-items:center;justify-content:space-between;padding:0 16px">
        <div style="font-weight:600">网站指南</div>
        <el-space>
          <el-input :model-value="siteUrl" @input="v=>siteUrl=v" placeholder="输入网站地址" style="width:320px" />
          <el-button :loading="discovering" @click="discoverFeeds">发现RSS</el-button>
          <el-button :disabled="candidateFeeds.length===0" @click="pullFirstFeed">拉取第一个</el-button>
        </el-space>
      </el-header>
      <el-main style="padding:0">
        <el-tabs :model-value="tab" @update:modelValue="v=>tab=v">
          <el-tab-pane label="Playground" name="playground">
            <div style="padding:16px">
              <el-card shadow="never">
                <template #header>
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span>Playground</span>
                    <el-space>
                      <el-radio-group :model-value="mode" @change="v=>mode=v" size="small">
                        <el-radio-button label="Action" />
                        <el-radio-button label="Tap" />
                        <el-radio-button label="Query" />
                        <el-radio-button label="Assert" />
                        <el-radio-button label="Ask" />
                      </el-radio-group>
                    </el-space>
                  </div>
                </template>
                <el-scrollbar height="420px">
                  <div v-for="(m,i) in messages" :key="i" style="padding:8px">
                    <div :style="m.role==='user'? 'text-align:right' : 'text-align:left'">
                      <el-tag :type="m.role==='user' ? 'primary' : 'info'" effect="plain">{{ m.role==='user' ? 'You' : 'Assistant' }}</el-tag>
                    </div>
                    <div style="font-size:13px;padding:6px 8px;border:1px solid #eee;border-radius:6px">{{ m.text }}</div>
                  </div>
                </el-scrollbar>
                <div style="display:flex;gap:8px;margin-top:8px">
                  <el-input :model-value="input" @input="v=>input=v" placeholder="请输入指令或选择器" />
                  <el-button type="primary" @click="runChat">Run</el-button>
                </div>
              </el-card>
            </div>
          </el-tab-pane>
          <el-tab-pane label="Guide" name="guide">
            <el-row :gutter="12" style="padding:16px">
          <el-col :span="24">
            <el-card shadow="never">
              <template #header>
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span>候选RSS</span>
                  <el-button size="small" @click="saveRecord" :disabled="feedItems.length===0">保存记录</el-button>
                </div>
              </template>
              <el-empty v-if="candidateFeeds.length===0" description="尚未发现候选" />
              <el-timeline v-else>
                <el-timeline-item v-for="(u,i) in candidateFeeds" :key="i" :timestamp="''">
                  <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
                    <div style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:520px">{{ u }}</div>
                    <div>
                      <el-button size="small" @click="pullFeed(u)">拉取</el-button>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </el-card>
          </el-col>
          <el-col :span="24" v-if="summary">
            <el-alert :title="summary" type="info" show-icon />
          </el-col>
          <el-col :span="24">
            <el-card shadow="never">
              <template #header>
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span>功能项</span>
                  <el-space>
                    <el-input :model-value="search" @input="v=>search=v" placeholder="搜索功能" style="width:220px" />
                    <el-button size="small" @click="clearFeed">清空</el-button>
                  </el-space>
                </div>
              </template>
              <el-empty v-if="filtered.length===0" description="暂无数据" />
              <el-row v-else :gutter="12">
                <el-col v-for="(it,idx) in filtered" :key="idx" :span="24">
                  <el-card shadow="hover" body-style="padding:12px">
                    <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
                      <div style="flex:1;min-width:0">
                        <div style="font-weight:600;font-size:14px;margin-bottom:4px">{{ it.title }}</div>
                        <div style="font-size:12px;color:#666;margin-bottom:6px">{{ it.link }}</div>
                        <div style="font-size:12px;color:#444">{{ it.description }}</div>
                      </div>
                      <div>
                        <el-space>
                          <el-button size="small" @click="navigate(it.link)">打开</el-button>
                          <el-button size="small" @click="setIntent(it.title)">作为意图</el-button>
                        </el-space>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </el-card>
          </el-col>
          <el-col :span="24">
            <el-card shadow="never">
              <template #header>
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span>记录管理</span>
                  <el-button size="small" @click="loadRecords">刷新</el-button>
                </div>
              </template>
              <el-empty v-if="records.length===0" description="暂无记录" />
              <el-row v-else :gutter="12">
                <el-col v-for="(r,i) in records" :key="i" :span="24">
                  <el-card body-style="padding:12px">
                    <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
                      <div>
                        <div style="font-weight:600;font-size:13px">{{ r.site }}</div>
                        <div style="font-size:12px;color:#666">{{ new Date(r.time).toLocaleString() }}</div>
                      </div>
                      <el-space>
                        <el-button size="small" @click="loadRecord(r)">载入</el-button>
                        <el-button size="small" type="danger" @click="deleteRecord(i)">删除</el-button>
                      </el-space>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </el-card>
          </el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
function toAbsolute(base: string, href: string) { try { return new URL(href, base).toString() } catch { return href } }
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
function summarize(items: {title:string,link:string,description:string}[]) {
  if (!items || items.length === 0) return ''
  const total = items.length
  const keywords = { 创建: [/新建|创建|添加/], 管理: [/管理|维护|配置/], 审批: [/审批|审核|流程/], 报表: [/报表|统计|分析|导出/], 用户: [/用户|员工|账号|权限/], 集成: [/集成|API|接口|Webhook/] } as Record<string, RegExp[]>
  const counts: Record<string, number> = {}; Object.keys(keywords).forEach(k => counts[k] = 0)
  items.forEach(it => { const text = (it.title + ' ' + it.description).toLowerCase(); Object.entries(keywords).forEach(([k, regs]) => { if (regs.some(r => r.test(text))) counts[k]++ }) })
  const features = Object.entries(counts).filter(([,c]) => c>0).map(([k,c]) => `${k}${c>1?'等':''}`)
  const whenUse = features.includes('审批') ? '适合需要流程与权限控制的业务场景' : features.includes('报表') ? '适合数据分析与导出场景' : '适合常规业务操作与导航引导'
  return `检测到 ${total} 个功能项，包含 ${features.join('、')} 等模块；${whenUse}`
}
const tab = ref<'playground'|'guide'>('playground')
const mode = ref<'Action'|'Tap'|'Query'|'Assert'|'Ask'>('Ask')
const input = ref('')
const messages = ref<{role:'user'|'assistant',text:string}[]>([])
const siteUrl = ref('')
const candidateFeeds = ref<string[]>([])
const discovering = ref(false)
const feedItems = ref<{title:string,link:string,description:string}[]>([])
const summary = ref('')
const search = ref('')
const records = ref<{site:string,time:number,items:{title:string,link:string,description:string}[]}[]>([])
const filtered = computed(() => { const q = search.value.trim().toLowerCase(); if (!q) return feedItems.value; return feedItems.value.filter(it => (it.title+' '+it.description).toLowerCase().includes(q)) })
async function discoverFeeds() { if (!siteUrl.value) return; discovering.value = true; candidateFeeds.value = []; try { const res = await fetch(siteUrl.value); const html = await res.text(); const base = siteUrl.value; const found = extractFeedLinks(html, base); const common = ['feed','rss.xml','atom.xml','index.xml','blog/rss.xml','feeds/posts/default?alt=rss'].map(p => toAbsolute(base, base.endsWith('/')?p:'/'+p)); candidateFeeds.value = Array.from(new Set<string>([...found, ...common])) } catch {} discovering.value = false }
async function pullFirstFeed() { if (candidateFeeds.value.length === 0) return; await pullFeed(candidateFeeds.value[0]) }
async function pullFeed(url: string) { try { const res = await fetch(url); const xml = await res.text(); const items = parseRSS(xml); if (items.length > 0) { feedItems.value = items; summary.value = summarize(items) } } catch {} }
async function navigate(url: string) { const [tabInfo] = await chrome.tabs.query({ active: true, currentWindow: true }); if (!tabInfo) return; if (url) await chrome.tabs.update(tabInfo.id!, { url }) }
function setIntent(t: string) { chrome.runtime.sendMessage({ type: 'SET_INTENT', intent: t }) }
async function saveRecord() { const rec = { site: siteUrl.value || '', time: Date.now(), items: feedItems.value }; const data = await chrome.storage.local.get(['assistantFeedRecords']); const arr = Array.isArray(data.assistantFeedRecords) ? data.assistantFeedRecords : []; arr.unshift(rec); await chrome.storage.local.set({ assistantFeedRecords: arr }); await loadRecords() }
async function loadRecords() { const data = await chrome.storage.local.get(['assistantFeedRecords']); records.value = Array.isArray(data.assistantFeedRecords) ? data.assistantFeedRecords : [] }
async function deleteRecord(i: number) { const arr = [...records.value]; arr.splice(i,1); await chrome.storage.local.set({ assistantFeedRecords: arr }); await loadRecords() }
async function clearFeed() { feedItems.value = []; summary.value = '' }
onMounted(loadRecords)

async function runChat() {
  messages.value.push({ role: 'user', text: input.value })
  const [tabInfo] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tabInfo) { messages.value.push({ role: 'assistant', text: '没有活动标签页' }); return }
  const resp = await new Promise<any>(resolve => chrome.tabs.sendMessage(tabInfo.id!, { type: 'CHAT_RUN', mode: mode.value, text: input.value }, r => resolve(r)))
  const text = resp && resp.result ? String(resp.result) : '已发送'
  messages.value.push({ role: 'assistant', text })
  input.value = ''
}
</script>