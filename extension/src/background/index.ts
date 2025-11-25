chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'RUN_INTENT') {
    handleRunIntent(msg).catch(() => {})
    sendResponse({ ok: true })
    return true
  }
  if (msg && msg.type === 'OPEN_SIDEPANEL') {
    openSidePanel().catch(() => {})
    sendResponse({ ok: true })
    return true
  }
  if (msg && msg.type === 'SET_INTENT') {
    setIntent(msg).catch(() => {})
    sendResponse({ ok: true })
    return true
  }
})

async function handleRunIntent({ tabId, intent, mode, inputs }: any) {
  await chrome.tabs.sendMessage(tabId, { type: 'RUN_FEATURE', intent, mode, inputs })
}

async function openSidePanel() {
  const [win] = await chrome.windows.getAll({ populate: false })
  await chrome.sidePanel.setOptions({ path: 'sidepanel.html', enabled: true })
  await chrome.sidePanel.open({ windowId: win.id! })
}

async function setIntent({ intent }: any) {
  await chrome.storage.local.set({ assistantIntent: intent })
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab) await chrome.tabs.sendMessage(tab.id!, { type: 'SHOW_INTENT', intent })
}