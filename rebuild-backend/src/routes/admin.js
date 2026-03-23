const express = require('express')
const cacheService = require('../services/cache-service')
const assignmentService = require('../services/assignment-service')
const userSettingsService = require('../services/user-settings-service')
const sourceService = require('../services/source-service')
const deviceService = require('../services/device-service')
const userService = require('../services/user-service')
const incomeService = require('../services/income-service')
const syncLogService = require('../services/sync-log-service')
const syncService = require('../services/sync-service')
const {
  requireAdmin,
  setAdminCookie,
  clearAdminCookie,
  signAdminSession,
  verifyAdminCredentials
} = require('../middleware/admin-auth')

const router = express.Router()

function dt(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function n(v) {
  return Number(v || 0)
}

function stageLabel(item) {
  const s = String(item.minerState || item.state || '').toLowerCase()
  if (s === 'waitingforconfignetwork') return '待配置网络'
  if (s === 'waitingfortest') return '待测试'
  if (s === 'serving') return '服务中'
  if (s === 'waitingabandoned') return '验收未通过'
  return item.minerState || item.state || '--'
}

function netLabel(item) {
  const s = String(item.onlineStatus || item.status || '').toLowerCase()
  if (s === 'online' || s === '在线') return '在线'
  if (s === 'offline' || s === '离线') return '离线'
  return item.faultType || '网络异常'
}

function bindLabel(item) {
  return dt(item.bindTime || item.bindAt || item.createdAt || '')
}

function utilLabel(item) {
  const raw = item.realUseRate ?? item.realtimeUseRate ?? item.realTimeUseRate ?? item.utilizationRate ?? item.useRate
  const num = Number(raw)
  if (!Number.isFinite(num)) return '0.00%'
  return `${num.toFixed(2)}%`
}

function userPreview(userId) {
  const devices = cacheService.getDevicesByUuids(assignmentService.listAssignedUuids(userId))
  const rawYesterday = devices.reduce((s, x) => s + n(x.rawYesterdayIncome || x.yesterdayIncome), 0)
  const rawTotal = devices.reduce((s, x) => s + n(x.rawMonthIncome || x.totalIncome || x.accumulatedIncome), 0)
  const rate = incomeService.getUserAdjustRate(userId)
  return {
    rawTotalIncome: rawTotal.toFixed(2),
    rawYesterdayIncome: rawYesterday.toFixed(2),
    displayTotalIncome: incomeService.formatAmount(rawTotal, rate),
    displayYesterdayIncome: incomeService.formatAmount(rawYesterday, rate),
    assignedCount: devices.length
  }
}

function overview() {
  const users = userService.listUsers()
  const devices = cacheService.getAllLatestDevices()
  const source = sourceService.listSourceRecords()
  const latest = devices[0] || {}
  return {
    userCount: users.length,
    cachedDeviceCount: devices.length,
    sourceCount: source.length,
    syncLogCount: syncLogService.listLogs(50).length,
    upstreamTotalIncome: n(latest.rawSummaryTotalIncome).toFixed(2),
    upstreamYesterdayIncome: n(latest.rawSummaryYesterdayIncome).toFixed(2)
  }
}

function page() {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>中端运营后台</title><style>
body{font-family:Arial,Helvetica,sans-serif;margin:0;background:#f4f7fb;color:#101828}.page{padding:20px 24px 28px}.hero{background:linear-gradient(135deg,#1637c7,#4f6fff);color:#fff;border-radius:24px;padding:24px;display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.hero a{color:#fff;text-decoration:none;background:rgba(255,255,255,.14);padding:10px 14px;border-radius:12px;font-weight:700;transition:.2s}.hero a:hover{background:rgba(255,255,255,.22)}.grid{display:grid;gap:16px}.g4{grid-template-columns:repeat(4,minmax(0,1fr))}.top{grid-template-columns:1.1fr .9fr}.work{grid-template-columns:360px 1fr}.card{background:#fff;border-radius:20px;padding:18px;box-shadow:0 10px 30px rgba(15,23,42,.05)}.big{font-size:30px;font-weight:800}.title{color:#667085;margin-bottom:8px}.sub{color:#667085;line-height:1.7}.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.f{flex:1;min-width:170px}.f.narrow{max-width:210px}input,select,textarea{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #d0d5dd;border-radius:14px;font-size:14px;background:#fff}textarea{min-height:88px}button{border:0;border-radius:14px;padding:12px 16px;font-weight:700;cursor:pointer;transition:.18s transform,.18s box-shadow}.b1{background:#375dfb;color:#fff}.b2{background:#eef2ff;color:#375dfb}.b3{background:#fee4e2;color:#b42318}button:hover{transform:translateY(-1px);box-shadow:0 8px 18px rgba(55,93,251,.12)}.flash{margin:12px 0;padding:12px 14px;border-radius:14px}.ok{background:#ecfdf3;color:#027a48}.err{background:#fff1f2;color:#be123c}.users{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}.u{border:2px solid #dbe4ff;border-radius:18px;padding:16px;cursor:pointer;background:linear-gradient(180deg,#fff,#fafcff);transition:.18s}.u:hover{transform:translateY(-2px);box-shadow:0 14px 28px rgba(55,93,251,.08)}.u.a{border-color:#375dfb;background:#eef4ff}.name{font-size:22px;font-weight:800;margin-bottom:8px}.meta{color:#475467;line-height:1.6}.pill{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;background:#eef2ff;color:#375dfb}.preview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.mini{background:#f8faff;border-radius:16px;padding:14px}.mini .v{font-size:22px;font-weight:800;margin-top:6px}.devices{border:1px solid #e4e7ec;border-radius:18px;overflow:hidden;background:#fff}.dh,.dr{display:grid;grid-template-columns:42px 1.3fr 1.15fr .8fr .8fr .9fr .85fr .95fr .85fr;gap:10px;align-items:center}.dh{background:#fbfcfe;font-weight:700;padding:14px 16px}.rows{max-height:620px;overflow:auto}.dr{padding:14px 16px;border-top:1px solid #eef2f7;transition:.16s background}.dr:hover{background:#fafcff}.device-name{font-weight:700;line-height:1.4}.muted{color:#667085}.tag{display:inline-flex;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700}.stage{background:#eef2ff;color:#375dfb}.net-off{background:#fff1f3;color:#d92d20}.net-on{background:#ecfdf3;color:#027a48}.net-fault{background:#fff7ed;color:#c4320a}.source-item{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid #eef2f7}.source-item:first-child{border-top:0}@media(max-width:1400px){.g4,.top,.work,.preview{grid-template-columns:1fr}.dh,.dr{grid-template-columns:42px 1.4fr 1.2fr .9fr .9fr .9fr}}</style></head><body><div class="page">
<div class="hero"><div><h1 style="margin:0 0 8px">中端运营后台</h1><div class="sub" style="color:#e6ecff">固定流程：上游平台全量缓存 -> 中端统一授权池与缓存层 -> 前端账号按设备分配展示。前端查看的数据与收益只跟该账号已分配设备挂钩。</div></div><a href="/paiyun/logout">退出登录</a></div>
<div id="flash"></div><div class="grid g4" id="ov"></div>
<div class="grid top" style="margin-top:16px">
<div class="card"><div style="font-size:22px;font-weight:800;margin-bottom:8px">前端账号管理</div><div class="sub">账号卡片、备注、比例和分配设备都放在同一工作区，便于直接查看对应账号名下设备。</div>
<div class="row" style="margin-top:14px"><div class="f"><input id="newm" placeholder="手机号"/></div><div class="f"><input id="newn" placeholder="昵称"/></div><div class="f"><input id="newp" placeholder="密码"/></div></div>
<div class="row" style="margin-top:10px"><button class="b1" id="addUser">新增前端账号</button><button class="b3" id="delUser">删除当前账号</button></div>
<div style="margin-top:16px" id="users" class="users"></div></div>
<div class="card"><div style="font-size:22px;font-weight:800;margin-bottom:8px">上游授权池管理</div><div class="sub">主入口建议用上游快捷登录。magic 可留空，后台会优先使用服务器默认配置。</div>
<div class="row" style="margin-top:14px"><div class="f"><input id="uu" placeholder="上游账号"/></div><div class="f"><input id="up" type="password" placeholder="上游密码"/></div></div>
<div class="row" style="margin-top:10px"><div class="f"><input id="um" placeholder="magic，可空"/></div><div class="f"><input id="uc" placeholder="configId，可空"/></div></div>
<div class="row" style="margin-top:10px"><button class="b1" id="quickLogin">快捷登录并写入授权</button><button class="b1" id="sync">手动同步设备</button><button class="b2" id="showToken">手动 token</button><button class="b3" id="clearToken">清除默认授权</button></div>
<div id="tp" style="display:none;margin-top:10px"><textarea id="token" placeholder="粘贴上游 Bearer token，不带 Bearer 前缀"></textarea><div class="row" style="margin-top:10px"><button class="b1" id="saveToken">保存上游授权</button></div></div>
<div style="margin-top:14px" id="sourceState" class="meta">加载中...</div><div id="sourceList" style="margin-top:12px"></div></div>
</div>
<div class="card" style="margin-top:16px"><div style="font-size:22px;font-weight:800;margin-bottom:8px">账号设备分配</div>
<div class="row"><div class="f"><input id="note" placeholder="账号备注，直接展示在用户标签下"/></div><div class="f narrow"><input id="rate" type="number" min="1" step="1" placeholder="收益比例(%)"/></div><button class="b1" id="saveSetting">保存账号配置</button></div>
<div id="preview" class="preview" style="margin-top:14px"></div>
<div class="row" style="margin-top:14px"><div class="f"><input id="kw" placeholder="搜索节点 ID、备注、地区"/></div><div class="f narrow"><select id="sf"><option value="">全部阶段</option><option>待配置网络</option><option>待测试</option><option>服务中</option><option>验收未通过</option></select></div><div class="f narrow"><select id="nf"><option value="">全部网络</option><option>在线</option><option>离线</option><option>网络异常</option></select></div><button class="b2" id="filter">筛选查询</button><button class="b2" id="sel">本页全选</button><button class="b2" id="unsel">本页清空</button><button class="b1" id="saveAssign">保存设备分配</button></div>
<div class="devices" style="margin-top:14px"><div class="dh"><div>选</div><div>节点</div><div>UUID</div><div>阶段</div><div>网络</div><div>昨日收益</div><div>绑定时间</div><div>实时利用率</div><div>地区</div></div><div id="ds" class="rows"></div></div>
</div>
<script>
const S={users:[],devices:[],sources:[],userId:null,sel:new Set()}
const $=id=>document.getElementById(id)
const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[m]))
const flash=(m,ok)=>{$('flash').innerHTML='<div class="flash '+(ok?'ok':'err')+'">'+esc(m)+'</div>';setTimeout(()=>{$('flash').innerHTML=''},2500)}
async function api(p,o){const r=await fetch('/paiyun'+p,Object.assign({credentials:'same-origin',headers:{'Content-Type':'application/json'}},o||{}));if(r.status===401){location.href='/paiyun/login';throw new Error('请重新登录')}const t=await r.text();const d=t?JSON.parse(t):{};if(!r.ok)throw new Error(d.message||'请求失败');return d}
function cards(o){const list=[['前端账号数',o.userCount],['上游授权记录',o.sourceCount],['缓存设备数',o.cachedDeviceCount],['同步日志数',o.syncLogCount],['上游累计收益',o.upstreamTotalIncome],['上游昨日收益',o.upstreamYesterdayIncome]];$('ov').innerHTML=list.map(x=>'<div class="card"><div class="title">'+x[0]+'</div><div class="big">'+x[1]+'</div></div>').join('')}
function currentUser(){return S.users.find(x=>x.id===S.userId)||null}
function userCard(u){return '<div class="u '+(u.id===S.userId?'a':'')+'" onclick="pickUser('+u.id+')"><div class="name">'+esc(u.nickname)+'</div><div class="meta"><span class="pill">'+esc(u.mobile)+'</span><br>用户ID：'+u.id+'<br>备注：'+esc(u.setting.note||'未设置')+'<br>首次绑定：'+esc(u.firstAssignedAt||'-')+'<br>收益比例：'+(u.setting.incomeAdjustRate||100)+'%<br>分配设备：'+(u.preview.assignedCount||0)+' 台</div></div>'}
function renderUsers(){$('users').innerHTML=S.users.map(userCard).join('')}
function renderPreview(){const u=currentUser();if(!u){$('preview').innerHTML='<div class="mini">请先选择账号</div>';return}$('note').value=u.setting.note||'';$('rate').value=u.setting.incomeAdjustRate||100;const list=[['展示累计收益',u.preview.displayTotalIncome],['展示昨日收益',u.preview.displayYesterdayIncome],['原始累计收益',u.preview.rawTotalIncome],['已分配设备数',u.preview.assignedCount]];$('preview').innerHTML=list.map(x=>'<div class="mini"><div class="title">'+x[0]+'</div><div class="v">'+x[1]+'</div></div>').join('')}
function tag(type,text){return '<span class="tag '+type+'">'+esc(text)+'</span>'}
function match(d){const kw=$('kw').value.trim().toLowerCase();const sf=$('sf').value;const nf=$('nf').value;const hay=[d.uuid,d.name,d.remark,d.minerRemark,d.provinceName,d.cityName,d.bindTimeLabel].join(' ').toLowerCase();if(kw&&!hay.includes(kw))return false;if(sf&&d.stageLabel!==sf)return false;if(nf&&d.networkLabel!==nf)return false;return true}
function renderDevices(){const rows=S.devices.filter(match);$('ds').innerHTML=rows.length?rows.map(d=>'<label class="dr"><div><input type="checkbox" '+(S.sel.has(d.uuid)?'checked':'')+' onchange="toggleSel(\\''+d.uuid+'\\',this.checked)"></div><div><div class="device-name">'+esc(d.name||'-')+'</div><div class="muted">'+esc(d.id||d.deviceId||'-')+'</div></div><div class="muted">'+esc(d.uuid)+'</div><div>'+tag('stage',d.stageLabel)+'</div><div>'+(d.networkLabel==='在线'?tag('net-on',d.networkLabel):(d.networkLabel==='离线'?tag('net-off',d.networkLabel):tag('net-fault',d.networkLabel)))+'</div><div>'+esc(d.displayIncome||'0.00')+'</div><div>'+esc(d.bindTimeLabel||'-')+'</div><div>'+esc(d.utilizationLabel||'0.00%')+'</div><div>'+esc(d.regionLabel||'-')+'</div></label>').join(''):'<div class="dr"><div></div><div class="muted">暂无匹配设备</div></div>'}
function renderSources(){const cur=S.sources.find(x=>x.status==='active');$('sourceState').innerHTML=cur?('已绑定<br>账号：'+esc(cur.sourceUsername||'-')+'<br>更新时间：'+esc(cur.updatedAt)):'未绑定';$('sourceList').innerHTML=S.sources.length?S.sources.map(x=>'<div class="source-item"><div>'+esc(x.sourceUsername||'-')+'<div class="muted">用户ID：'+x.userId+'，更新时间：'+esc(x.updatedAt)+'</div></div><button class="b3" onclick="delSource('+x.userId+')">删除</button></div>').join(''):'<div class="muted">暂无授权记录</div>'}
function pickUser(id){S.userId=id;const u=currentUser();S.sel=new Set((u&&u.assignments)||[]);renderUsers();renderPreview();renderDevices()}
function toggleSel(id,on){if(on)S.sel.add(id);else S.sel.delete(id)}
async function load(){const [o,s,u,d]=await Promise.all([api('/api/overview'),api('/api/source-auth'),api('/api/users'),api('/api/devices')]);cards(o);S.sources=s.records||[];renderSources();S.users=(u.users||[]);S.devices=(d.devices||[]);if(!S.userId&&S.users.length)S.userId=S.users[0].id;renderUsers();renderPreview();renderDevices()}
$('showToken').onclick=()=>{$('tp').style.display=$('tp').style.display==='none'?'block':'none'}
$('saveToken').onclick=async()=>{try{await api('/api/source-auth',{method:'POST',body:JSON.stringify({token:$('token').value.trim()})});$('token').value='';await load();flash('上游授权已保存并已同步设备',true)}catch(e){flash(e.message,false)}}
$('quickLogin').onclick=async()=>{try{await api('/api/source-auth/login',{method:'POST',body:JSON.stringify({username:$('uu').value.trim(),password:$('up').value.trim(),magic:$('um').value.trim(),configId:$('uc').value.trim()})});await load();flash('上游登录成功，授权已写入并已同步设备',true)}catch(e){flash(e.message,false)}}
$('sync').onclick=async()=>{try{const r=await api('/api/sync-devices',{method:'POST'});await load();flash('设备同步完成：'+(r.cached||0)+' 台',true)}catch(e){flash(e.message,false)}}
$('clearToken').onclick=async()=>{try{await api('/api/source-auth',{method:'DELETE'});await load();flash('默认授权已清除',true)}catch(e){flash(e.message,false)}}
$('addUser').onclick=async()=>{try{await api('/api/users',{method:'POST',body:JSON.stringify({mobile:$('newm').value.trim(),nickname:$('newn').value.trim(),password:$('newp').value.trim()})});$('newm').value='';$('newn').value='';$('newp').value='';await load();flash('前端账号已新增',true)}catch(e){flash(e.message,false)}}
$('delUser').onclick=async()=>{try{if(!S.userId)throw new Error('请先选择账号');await api('/api/users/'+S.userId,{method:'DELETE'});S.userId=null;await load();flash('前端账号已删除',true)}catch(e){flash(e.message,false)}}
$('saveSetting').onclick=async()=>{try{if(!S.userId)throw new Error('请先选择账号');await api('/api/user-settings',{method:'POST',body:JSON.stringify({userId:S.userId,note:$('note').value.trim(),incomeAdjustRate:$('rate').value.trim()})});await load();flash('账号配置已保存',true)}catch(e){flash(e.message,false)}}
$('filter').onclick=()=>renderDevices()
$('sel').onclick=()=>{S.devices.filter(match).forEach(x=>S.sel.add(x.uuid));renderDevices()}
$('unsel').onclick=()=>{S.devices.filter(match).forEach(x=>S.sel.delete(x.uuid));renderDevices()}
$('saveAssign').onclick=async()=>{try{if(!S.userId)throw new Error('请先选择账号');await api('/api/assignments/replace',{method:'POST',body:JSON.stringify({userId:S.userId,deviceUuids:Array.from(S.sel)})});await load();flash('设备分配已保存',true)}catch(e){flash(e.message,false)}}
window.pickUser=pickUser;window.toggleSel=toggleSel;window.delSource=async id=>{try{await api('/api/source-auth/'+id,{method:'DELETE'});await load();flash('授权记录已删除',true)}catch(e){flash(e.message,false)}}
load().catch(e=>flash(e.message,false))
</script></body></html>`
}

router.use(express.urlencoded({ extended: false }))

router.get('/login', (req, res) => res.send(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>平台后台登录</title><style>body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#f5f7fb}.w{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.c{width:100%;max-width:420px;background:#fff;border-radius:20px;padding:28px;box-shadow:0 20px 60px rgba(29,78,216,.12)}input{width:100%;box-sizing:border-box;padding:14px 16px;border:1px solid #d0d5dd;border-radius:14px;margin-bottom:14px}button{width:100%;border:0;border-radius:14px;background:#375dfb;color:#fff;padding:14px 16px;font-weight:700}.m{margin-bottom:12px;padding:12px;border-radius:12px;background:#fff1f2;color:#be123c}</style></head><body><div class="w"><form class="c" method="post" action="/paiyun/login"><h1 style="margin:0 0 8px">平台后台登录</h1><div style="color:#667085;margin-bottom:18px">路径已切换为 /paiyun/login</div>${req.query.error ? '<div class="m">账号或密码错误</div>' : ''}<input name="username" placeholder="管理员账号"/><input name="password" type="password" placeholder="管理员密码"/><button type="submit">登录后台</button></form></div></body></html>`))
router.post('/login', (req, res) => {
  const username = String(req.body?.username || '').trim()
  const password = String(req.body?.password || '').trim()
  if (!verifyAdminCredentials(username, password)) return res.redirect('/paiyun/login?error=1')
  setAdminCookie(res, signAdminSession(username))
  return res.redirect('/paiyun')
})
router.get('/logout', (req, res) => {
  clearAdminCookie(res)
  res.redirect('/paiyun/login')
})

router.use(requireAdmin)

router.get('/api/overview', (req, res) => res.json(overview()))
router.get('/api/source-auth', (req, res) => res.json({ records: sourceService.listSourceRecords().map(x => ({ ...x, createdAt: dt(x.createdAt), updatedAt: dt(x.updatedAt), lastVerifyAt: dt(x.lastVerifyAt) })) }))
router.post('/api/source-auth', async (req, res, next) => {
  try {
    const token = String(req.body?.token || '').trim()
    if (!token) return res.status(400).json({ message: 'token is required' })
    const profile = await sourceService.verifySourceToken(token)
    const record = sourceService.saveSourceRecord(0, token, profile)
    const syncResult = await syncService.syncUpstreamDevicesToCache('save-token')
    res.json({ record, syncResult })
  } catch (err) { next(err) }
})
router.post('/api/source-auth/login', async (req, res, next) => {
  try {
    const result = await sourceService.loginWithPassword({ username: req.body?.username, password: req.body?.password, magic: req.body?.magic, configId: req.body?.configId })
    const record = sourceService.saveSourceRecord(0, result.token, result.profile)
    const syncResult = await syncService.syncUpstreamDevicesToCache('quick-login')
    res.json({ record, syncResult })
  } catch (err) { next(err) }
})
router.post('/api/sync-devices', async (req, res, next) => {
  try {
    res.json({ ok: true, ...(await syncService.syncUpstreamDevicesToCache('manual-sync')) })
  } catch (err) { next(err) }
})
router.delete('/api/source-auth', (req, res) => { sourceService.clearSourceRecord(0); res.json({ ok: true }) })
router.delete('/api/source-auth/:userId', (req, res) => { sourceService.clearSourceRecord(Number(req.params.userId)); res.json({ ok: true }) })
router.get('/api/users', (req, res) => {
  const users = userService.listUsers().map(user => ({
    id: user.id,
    mobile: user.mobile,
    nickname: user.nickname,
    createdAt: dt(user.createdAt),
    updatedAt: dt(user.updatedAt),
    firstAssignedAt: dt(assignmentService.getFirstAssignedAt(user.id)),
    setting: userSettingsService.getUserSetting(user.id),
    assignments: assignmentService.listAssignedUuids(user.id),
    preview: userPreview(user.id)
  }))
  res.json({ users })
})
router.post('/api/users', (req, res, next) => {
  try { res.json({ user: userService.createUser(req.body || {}) }) } catch (err) { next(err) }
})
router.delete('/api/users/:id', (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    userService.deleteUser(userId)
    assignmentService.clearAssignments(userId)
    userSettingsService.deleteUserSetting(userId)
    incomeService.deleteUserIncomeHistory(userId)
    sourceService.clearSourceRecord(userId)
    res.json({ ok: true })
  } catch (err) { next(err) }
})
router.get('/api/devices', (req, res) => res.json({
  devices: cacheService.getAllLatestDevices().map(d => ({
    ...d,
    stageLabel: stageLabel(d),
    networkLabel: netLabel(d),
    regionLabel: [d.provinceName, d.cityName || d.operatorName].filter(Boolean).join(' / '),
    bindTimeLabel: bindLabel(d),
    utilizationLabel: utilLabel(d),
    displayIncome: Number(d.rawYesterdayIncome || d.yesterdayIncome || 0).toFixed(2)
  }))
}))
router.post('/api/assignments/replace', (req, res, next) => {
  try {
    const userId = Number(req.body?.userId)
    const deviceUuids = Array.isArray(req.body?.deviceUuids) ? req.body.deviceUuids.map(String) : []
    res.json({ rows: assignmentService.replaceAssignments(userId, deviceUuids) })
  } catch (err) { next(err) }
})
router.post('/api/user-settings', (req, res, next) => {
  try {
    const userId = Number(req.body?.userId)
    const setting = userSettingsService.updateUserSetting(userId, { note: req.body?.note, incomeAdjustRate: req.body?.incomeAdjustRate })
    res.json({ setting, preview: userPreview(userId) })
  } catch (err) { next(err) }
})
router.get('/', (req, res) => res.send(page()))

module.exports = router
