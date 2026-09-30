<template>
    <div class="ag-list">
        <!-- 页头：范围切换（我的智能体 / 我的收藏）+ 新建入口 -->
        <header class="ag-list__head">
            <!-- 范围 tab：由 TAB_DEFS 注册表驱动 —— 新增 tab 只加注册表一项，模板无需改动 -->
            <div class="ag-tabs" role="tablist" aria-label="智能体范围">
                <button v-for="t in tabs" :key="t.key" type="button" class="ag-tab" role="tab"
                    :class="{ 'is-active': tab === t.key }" :aria-selected="tab === t.key ? 'true' : 'false'"
                    @click="switchTab(t.key)">{{ t.label }}</button>
            </div>
            <Button type="primary" icon="md-add" @click="$emit('create-agent')">新建智能体</Button>
        </header>

        <!-- 筛选工具条（iView） -->
        <div class="ag-toolbar">
            <Input v-model.trim="keyword" class="ag-toolbar__search" clearable placeholder="搜索名称或说明，如：课程答疑" />
            <span class="ag-toolbar__count">筛选结果 {{ filtered.length }} 项</span>
        </div>

        <!-- 加载骨架：由真实请求状态驱动 -->
        <Spin v-if="loading" size="large" class="ag-list__spin" fix />

        <!-- 管理型卡片布局（layout = 'manage'：编辑 / 运行 / 发布 / 停用 / 删除） -->
        <div v-else-if="currentTab.layout === 'manage' && filtered.length" class="ag-cards">
            <Card v-for="(a, i) in filtered" :key="a.id" class="ag-card ag-enter" :class="'is-' + a.status"
                :style="{ animationDelay: ((i % 10) * 0.05) + 's' }">
                <!-- 状态角标：卡片右上角主展示，替代左侧色条 -->
                <span class="ag-card__badge" :class="'is-' + a.status">{{ statusLabel(a.status) }}</span>
                <div class="ag-card__body">
                    <div class="ag-card__top">
                        <!-- 头像：avatar 为图片 ID 时走背景图；空/旧单字回退首字占位 -->
                        <span v-if="a.avatar" class="ag-glyph ag-glyph--avatar" :class="'ag-glyph--' + a.tone"
                            role="img" :aria-label="a.name + ' 头像'" :style="avatarStyle(a.avatar)"></span>
                        <span v-else class="ag-glyph" :class="'ag-glyph--' + a.tone" role="img"
                            :aria-label="a.name + ' 头像占位'">{{ a.glyph }}</span>
                        <div class="ag-card__head">
                            <div class="ag-card__name" :title="a.name || ''">
                                <span class="ag-card__name-text">{{ a.name }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="ag-card__meta">
                        <div class="ag-card__meta-main">
                            <span class="ag-card__stat">{{ a.usage }} 次使用</span>
                        </div>
                        <div class="ag-card__updated">更新于 {{ a.updatedAt || '-' }}</div>
                    </div>

                    <!-- 按状态条件显示操作按钮 -->
                    <div class="ag-card__actions">
                        <!-- 编辑：始终可用 -->
                        <Button size="small" @click="$emit('edit-agent', a)">编辑</Button>

                        <!-- 运行：仅已上线可运行 -->
                        <Button v-if="a.status === 'published'" size="small" type="primary" ghost
                            @click="$emit('open-agent', a)">运行</Button>

                        <!-- 发布：仅草稿可发布 -->
                        <Button v-if="a.status === 'draft'" size="small" type="success" ghost
                            @click="publish(a)">发布</Button>

                        <!-- 启停：已上线→停用；已停用→启用 -->
                        <Button v-if="a.status === 'published'" size="small"
                            @click="toggleStatus(a, 'disabled')">停用</Button>
                        <Button v-if="a.status === 'disabled'" size="small" type="warning" ghost
                            @click="toggleStatus(a, 'published')">启用</Button>

                        <!-- 删除：统一确认弹框 -->
                        <Button size="small" type="error" ghost @click="confirmDelete(a)">删除</Button>
                    </div>
                </div>
            </Card>
        </div>

        <!-- 广场卡片布局（layout = 'plaza'，样式移植自 pages/portal/agents/index.vue）；
             收藏的可能是他人的智能体，故不提供任何管理操作按钮 —— 仅保留「开始对话」+ 右上角收藏★ -->
        <div v-else-if="currentTab.layout === 'plaza' && filtered.length" class="ag-cards">
            <article v-for="(a, i) in filtered" :key="'fav-' + a.id" class="pg-card ag-enter"
                :style="{ animationDelay: ((i % 10) * 0.05) + 's' }">
                <!-- 缩略带：四色渐变 + 左上类型标 + 右上收藏★（点击即取消/恢复收藏） -->
                <div class="pg-thumb">
                    <span :class="['pg-tag', { flow: a.appType === 'workflow' }]">{{ a.appType === 'workflow' ? '流程助手' : '标准助手' }}</span>
                    <button type="button" class="pg-star" :class="{ 'is-on': isStarred(a) }"
                        :aria-pressed="isStarred(a) ? 'true' : 'false'"
                        :aria-label="(isStarred(a) ? '取消收藏《' : '收藏《') + a.name + '》'"
                        @click="toggleStar(a)">{{ isStarred(a) ? '★' : '☆' }}</button>
                </div>
                <div class="pg-body">
                    <!-- 头像三态：image = 图片 ID 铺背景圆章 / icon = 图标类名圆内居中 / disc = 名称首字 -->
                    <span v-if="a.avatarKind === 'image'" class="pg-avatar" role="img"
                        :aria-label="a.name + ' 头像'" :style="avatarStyle(a.avatarValue)"></span>
                    <span v-else-if="a.avatarKind === 'icon'" class="pg-avatar" role="img"
                        :aria-label="a.name + ' 头像'"><i :class="a.avatarValue" aria-hidden="true"></i></span>
                    <span v-else class="pg-avatar" aria-hidden="true">{{ a.avatarDisc }}</span>
                    <h3 class="pg-name">{{ a.name }}</h3>
                    <!-- summary 即后端 description（由 mapRow 映射），空值走占位文 -->
                    <p class="pg-desc" :title="a.summary || null">{{ a.summary || '这个智能体还没有简介' }}</p>
                </div>
                <div class="pg-act">
                    <button type="button" class="pg-btn-chat" @click="$emit('open-agent', a)">开始对话 →</button>
                </div>
            </article>
        </div>

        <!-- 空状态：区分「加载失败」「筛选无结果」「无数据」；无数据文案随范围（我的智能体 / 我的收藏）切换 -->
        <Card v-else class="ag-list__empty">
            <div class="ag-empty">
                <span class="ag-empty__glyph">{{ emptyGlyph }}</span>
                <p class="ag-empty__title">{{ emptyTitle }}</p>
                <p class="ag-empty__desc">{{ emptyDesc }}</p>
                <Button v-if="loadFailed" type="primary" ghost @click="fetchList">重新加载</Button>
                <Button v-else-if="hasFilter" @click="resetFilter">清除筛选</Button>
                <Button v-else-if="canCreate" type="primary" @click="$emit('create-agent')">新建智能体</Button>
            </div>
        </Card>

        <PortalConfirmModal v-model="confirmation.visible" :title="confirmation.title" :content="confirmation.content"
            :confirm-text="confirmation.confirmText" :confirm-type="confirmation.confirmType"
            :loading="confirmation.loading" @confirm="executeConfirmedAction" />
    </div>
</template>

<script>
import { Message } from 'view-ui-plus'
import {
    agentAppMine,
    agentAppFavorites,
    agentAppFavorite,
    agentAppUnfavorite,
    agentAppDelete,
    agentAppPublish,
    agentAppToggle
} from '@/api/agentApp'
import PortalConfirmModal from '@/pages/portal/components/PortalConfirmModal.vue'
// 纯 UI 静态配置（分类下拉 / 标签文案），不含任何演示数据
import {
    statusLabel
} from './mock/agents'

// ══ 范围 tab 注册表 ═══════════════════════════════════════════════════════════
// 页头按钮、数据源、空态文案、卡片布局、「新建」按钮显隐全部由本表驱动；
// 新增一个 tab = 往 TAB_DEFS 追加一项（必要时给它一个已有的 layout），模板与 computed 都不用改。
//   key       tab 唯一键（也是 class/状态判定用值）
//   label     页头按钮文案
//   aliases   路由 query 可识别的取值，**第 0 个为规范值**（切 tab 回写路由时写它）
//   fetch     取数接口（无参，返回数组或 { list }）
//   layout    卡片布局：'manage' 管理型 / 'plaza' 广场型（v-if 链按此分流）
//   canCreate 空态是否给「新建」入口
//   syncFavIds 返回结果是否即收藏集合（用于刷新收藏★状态，无需二次请求）
//   errorText 取数失败提示
//   empty     空态文案（glyph / title / desc）
const TAB_DEFS = [
    {
        key: 'mine',
        label: '我的智能体',
        // ?type=agent / ?page=agent（兼容 my / mine / agents）
        aliases: ['agent', 'mine', 'my', 'agents'],
        fetch: agentAppMine,
        layout: 'manage',
        canCreate: true,
        syncFavIds: false,
        errorText: '智能体列表加载失败',
        empty: {
            glyph: '空',
            title: '还没有智能体',
            desc: '创建第一个智能体，用于课程答疑或科研辅助。'
        }
    },
    {
        key: 'favorites',
        label: '我的收藏',
        // ?type=collect / ?page=collect（兼容 collection / favorite(s) / fav / star）
        aliases: ['collect', 'collection', 'favorite', 'favorites', 'fav', 'star'],
        fetch: agentAppFavorites,
        layout: 'plaza',
        canCreate: false,
        syncFavIds: true,
        errorText: '收藏列表加载失败',
        empty: {
            glyph: '藏',
            title: '还没有收藏的智能体',
            desc: '在智能体广场收藏感兴趣的智能体，之后可在这里快速找到。'
        }
    }
]

// 路由 query 里承载范围的参数名（按顺序取第一个命中的；要再加参数名往这里补即可）
const TAB_QUERY_KEYS = ['type', 'page']
// 默认 tab 与默认参数名（URL 没带范围参数时，切 tab 写回用默认参数名）
const DEFAULT_TAB = 'mine'
const DEFAULT_TAB_QUERY_KEY = TAB_QUERY_KEYS[0]

// 头像占位字备选：后端 avatar 缺失（或旧单字非图片 ID）时按序号兜底
const FALLBACK_GLYPHS = ['答', '文', '研', '批', '析', '办', '译', '绩']
// 卡片头像底色调色板（与 mock tone 对齐：绿 / 藏青 / 金 / 墨）
const TONES = ['green', 'indigo', 'ochre', 'sand']

export default {
    name: 'AgentList',

    components: {
        PortalConfirmModal
    },

    data() {
        return {
            // 当前范围 tab（key 取自 TAB_DEFS）；初值由 mounted 按路由 query 决定
            tab: DEFAULT_TAB,
            // 路由里承载范围的参数名（type / page）：切 tab 回写时沿用同一个键，避免 URL 出现两套参数
            tabQueryKey: DEFAULT_TAB_QUERY_KEY,
            // 已收藏 id 集合（String），供收藏卡片的★状态与取消收藏使用
            favIds: [],
            loading: true,
            loadFailed: false,
            keyword: '',
            agents: [],
            confirmation: {
                visible: false,
                title: '',
                content: '',
                confirmText: '确认',
                confirmType: 'primary',
                loading: false,
                action: null
            }
        }
    },
    computed: {
        // 页头 tab 列表（注册表即数据源，新增 tab 不用改模板）
        tabs() {
            return TAB_DEFS
        },
        // 当前 tab 的注册项；key 意外失配时兜底第一项，保证模板读取 layout / empty 不做空判断
        currentTab() {
            return this.findTab(this.tab) || TAB_DEFS[0]
        },
        // 当前 tab 的空态是否给「新建」入口（收藏 tab 为 false：收藏的可能是他人的智能体）
        canCreate() {
            return !!this.currentTab.canCreate
        },
        hasFilter() {
            return !!(this.keyword)
        },
        // 空态文案：加载失败 / 筛选无结果 / 无数据（无数据文案取当前 tab 的注册项）
        emptyGlyph() {
            if (this.loadFailed) return '误'
            if (this.hasFilter) return '搜'
            return this.currentTab.empty.glyph
        },
        emptyTitle() {
            if (this.loadFailed) return '加载失败'
            if (this.hasFilter) return '没有符合条件的智能体'
            return this.currentTab.empty.title
        },
        emptyDesc() {
            if (this.loadFailed) return '接口请求失败，可稍后重试。'
            if (this.hasFilter) return '试试更换关键词或放宽筛选条件。'
            return this.currentTab.empty.desc
        },
        filtered() {
            const kw = this.keyword.toLowerCase()
            return this.agents.filter(a => {
                if (kw) {
                    const hay = (a.name + a.summary + (a.owner || '')).toLowerCase()
                    if (hay.indexOf(kw) === -1) return false
                }
                return true
            })
        }
    },
    mounted() {
        // 先按路由 query 定位 tab（深链 / 刷新保持），再首屏拉取 ——
        // 这里不调 switchTab，避免「路由命中一次 + 首屏一次」重复请求
        const hit = this.readRouteScope()
        if (hit) {
            this.tab = hit.key
            this.tabQueryKey = hit.queryKey
        }
        this.fetchList()
    },

    watch: {
        // 路由 query 变化（外链跳转 / 前进后退）→ 同步 tab；没带可识别范围时保持当前 tab 不动
        '$route.query'() {
            this.syncTabFromRoute()
        },
        // 取消确认时清理待执行回调，避免后续误触发
        'confirmation.visible'(visible) {
            if (!visible && !this.confirmation.loading) {
                this.confirmation.action = null
            }
        }
    },

    methods: {
        statusLabel,
        // 头像背景样式：commonsJs.getBackgroundImage(id, true) + 圆形铺满
        avatarStyle(id) {
            if (!id) return null
            const bg = this.commonsJs.getBackgroundImage(id, true) || {}
            return Object.assign({}, bg, {
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
            })
        },
        // 后端时间（ISO-8601）→ 本地可读时间
        formatTime(t) {
            if (!t) return '-'
            const d = new Date(t)
            return isNaN(d.getTime()) ? String(t) : d.toLocaleString('zh-CN')
        },
        // 头像三态判别（与智能体广场 / 门户首页一致）：收藏卡片按此渲染展示字段
        //   1) 空 → disc（名称首字）；2) 含空格或图标前缀 → icon（类名直用）；
        //   3) 长度 > 2 → image（图片 ID）；4) 其余短串 → disc，避免空圆章
        resolveAvatar(raw) {
            if (!raw) return { kind: 'disc', value: '' }
            const s = String(raw).trim()
            if (!s) return { kind: 'disc', value: '' }
            if (/\s/.test(s) || /^fa[-\s]/i.test(s) || /^icon/i.test(s) || /^(mdi|bi|ri|pi|ant|el)[-\s]/i.test(s)) {
                return { kind: 'icon', value: s }
            }
            if (s.length > 2) return { kind: 'image', value: s }
            return { kind: 'disc', value: s }
        },
        // 后端行 → 页面卡片模型：name/description/status/appType/enabled/cjsj/avatar 映射；
        // avatar 仅在长度 > 2（图片 ID）时保留；旧单字当占位字，不注入任何演示数据
        mapRow(row, index) {
            const name = row.name || '未命名智能体'
            const rawAvatar = row.avatar ? String(row.avatar) : ''
            const isImageId = rawAvatar.length > 2
            const av = this.resolveAvatar(rawAvatar)
            // 展示状态（驱动状态角标与操作按钮）：
            // 后端 /toggle 只翻 enabled、不改 status —— 对齐后台 AgentAppList 的启停列
            //（它按 row.enabled 显示「禁用 / 启用」，status 是独立的一列）。
            // 故「已上线 / 已停用」必须以 enabled 为准，只有未发布的 draft 才算草稿；
            // 同时兼容后端直接把 status 写成 'disabled' 的返回（两种口径都判为已停用）。
            // 不这样叠加的话，停用/启用后 status 仍是 published，刷新列表也看不出变化。
            const rawStatus = row.status || 'draft'
            const enabled = row.enabled !== false
            const status = rawStatus === 'draft'
                ? 'draft'
                : ((rawStatus === 'disabled' || !enabled) ? 'disabled' : 'published')
            return {
                id: row.id,
                name,
                summary: row.description || '',
                status,
                appType: row.appType || 'standard',
                enabled,
                updatedAt: this.formatTime(row.cjsj || row.updatedAt),
                avatar: isImageId ? rawAvatar : '',
                glyph: (!isImageId && rawAvatar) ? rawAvatar : FALLBACK_GLYPHS[index % FALLBACK_GLYPHS.length],
                tone: TONES[index % TONES.length],
                // 收藏卡片（广场样式）用的头像三态字段
                avatarKind: av.kind,
                avatarValue: av.kind === 'disc' ? '' : av.value,
                avatarDisc: name.slice(0, 1),
                usage: row.usage || 0,
                owner: row.owner || ''
            }
        },
        // 按 key 取注册项（不存在返回 null）
        findTab(key) {
            const hit = TAB_DEFS.filter(t => t.key === key)[0]
            return hit || null
        },
        // 路由取值 → tab key：去空格 + 忽略大小写；无法识别返回 ''（调用方保持当前 tab）
        resolveTabKey(value) {
            const v = String(value === null || value === undefined ? '' : value).trim().toLowerCase()
            if (!v) return ''
            const hit = TAB_DEFS.filter(t => t.aliases.indexOf(v) !== -1)[0]
            return hit ? hit.key : ''
        },
        // 读路由里的范围参数：按 TAB_QUERY_KEYS 顺序取第一个命中的参数名；都没有则返回 null
        readRouteScope() {
            const query = (this.$route && this.$route.query) || {}
            for (let i = 0; i < TAB_QUERY_KEYS.length; i++) {
                const qk = TAB_QUERY_KEYS[i]
                const raw = query[qk]
                // 同名参数重复出现时（?type=agent&type=collect）取第一个
                const value = Array.isArray(raw) ? raw[0] : raw
                const key = this.resolveTabKey(value)
                if (key) return { key: key, queryKey: qk }
            }
            return null
        },
        // 路由 → 页面：命中且与当前 tab 不同才切（切 tab 会重新取数，故只在真变化时调用）
        syncTabFromRoute() {
            const hit = this.readRouteScope()
            if (!hit) return
            this.tabQueryKey = hit.queryKey
            if (hit.key !== this.tab) this.switchTab(hit.key)
        },
        // 页面 → 路由：把当前 tab 写回 query。
        // replace（不进历史）；保留 q 等其它参数；先清掉另一套范围参数名，
        // 避免出现 ?type=collect&page=agent 这种自相矛盾的 URL；归一后与现状一致就不动。
        syncRouteFromTab(key) {
            if (!this.$router || !this.$route) return
            const def = this.findTab(key) || this.currentTab
            const qk = this.tabQueryKey || DEFAULT_TAB_QUERY_KEY
            const value = def.aliases[0]
            const query = Object.assign({}, this.$route.query)
            TAB_QUERY_KEYS.forEach(k => { delete query[k] })
            query[qk] = value

            const cur = this.$route.query || {}
            const curKeys = Object.keys(cur)
            const same = curKeys.length === Object.keys(query).length &&
                curKeys.every(k => String(cur[k]) === String(query[k]))
            if (same) return

            const result = this.$router.replace({ path: this.$route.path, query: query })
            if (result && typeof result.catch === 'function') result.catch(() => {})
        },
        // 切换范围：注册表驱动取数；同时写回路由 query，刷新 / 分享后仍停在同一个 tab
        switchTab(tab) {
            if (!this.findTab(tab) || this.tab === tab) return
            this.tab = tab
            this.fetchList()
            this.syncRouteFromTab(tab)
        },
        // 拉取当前 tab 的列表；失败时列表置空并提示，不回退任何演示数据
        async fetchList() {
            const def = this.currentTab
            const fetch = def && def.fetch
            if (typeof fetch !== 'function') return
            this.loading = true
            try {
                const data = await fetch()
                const rows = Array.isArray(data) ? data : ((data && (data.list || data.rows)) || [])
                this.agents = rows.map((row, i) => this.mapRow(row, i))
                // 收藏 tab 的返回即收藏集合本身（同一份数据），直接灌进 favIds，无需再单独请求一次
                if (def.syncFavIds) this.favIds = this.agents.map(x => String(x.id))
                this.loadFailed = false
            } catch (e) {
                // 接口失败：列表为空 + 加载失败状态 + 明确提示
                this.agents = []
                this.loadFailed = true
                Message.error((def.errorText || '列表加载失败') + '，请稍后重试')
            } finally {
                this.loading = false
            }
        },
        // 是否已收藏（收藏卡片的★状态）
        isStarred(a) {
            return this.favIds.indexOf(String(a && a.id)) !== -1
        },
        // 收藏★点击：取消收藏走二次确认弹框（复用本页统一确认弹框 PortalConfirmModal）；
        // 本页即收藏列表，正常都走「已收藏 → 取消」分支
        toggleStar(a) {
            if (!a || !a.id) return
            if (!this.isStarred(a)) {
                // 兜底：favIds 未同步时仍允许直接收藏（本页正常不会出现）
                this.addFavorite(a)
                return
            }
            const name = a.name || '未命名智能体'
            this.confirmAction(
                '取消收藏确认',
                '确定取消收藏「' + name + '」？取消后可在智能体广场重新收藏。',
                async () => {
                    try {
                        await agentAppUnfavorite(a.id)
                        Message.success('已取消收藏「' + name + '」')
                        // 取消收藏后重新拉取收藏列表，让该卡片随之从收藏列表移除
                        await this.fetchList()
                        return true
                    } catch (e) {
                        Message.error('取消收藏失败，请稍后重试')
                        return false
                    }
                },
                'error'
            )
        },
        // 收藏（兜底分支用，接口成功后才更新本地集合）
        async addFavorite(a) {
            if (!a || !a.id) return
            const id = String(a.id)
            try {
                await agentAppFavorite(a.id)
                this.favIds = this.favIds.concat([id])
                Message.success('已收藏')
            } catch (e) {
                Message.error('操作失败，请稍后重试')
            }
        },
        // 状态 → iView Tag 颜色
        statusColor(status) {
            return { published: 'success', draft: 'default', disabled: 'warning' }[status] || 'default'
        },
        resetFilter() {
            this.keyword = ''
        },
        // 统一确认弹框：保存待执行操作，只有确认回调才会调用接口
        confirmAction(title, content, action, confirmType = 'primary') {
            this.confirmation.title = title
            this.confirmation.content = content
            this.confirmation.confirmText = '确认'
            this.confirmation.confirmType = confirmType
            this.confirmation.loading = false
            this.confirmation.action = action
            this.confirmation.visible = true
        },
        // 执行待确认操作：loading 防重复；成功关闭，失败保留弹框并复位 loading
        async executeConfirmedAction() {
            if (!this.confirmation.visible || this.confirmation.loading) return
            const action = this.confirmation.action
            if (!action) return
            this.confirmation.loading = true
            try {
                const result = await action()
                if (result !== false) {
                    this.confirmation.visible = false
                    this.confirmation.action = null
                }
            } catch (e) {
                Message.error('操作失败，请稍后重试')
            } finally {
                this.confirmation.loading = false
            }
        },
        // 发布草稿：仅在确认回调中调发布接口，成功后保留原有提示与列表刷新
        publish(a) {
            const name = a.name || '未命名智能体'
            this.confirmAction(
                '发布确认',
                '确定发布「' + name + '」？',
                async () => {
                    try {
                        await agentAppPublish(a.id)
                        Message.success('已发布「' + a.name + '」')
                        await this.fetchList()
                        return true
                    } catch (e) {
                        Message.error('发布失败，请稍后重试')
                        return false
                    }
                },
                'primary'
            )
        },
        // 启用 / 停用切换：仅在确认回调中调启停接口，成功后保留原有提示与列表刷新
        toggleStatus(a, next) {
            const actionText = next === 'disabled' ? '停用' : '启用'
            const name = a.name || '未命名智能体'
            this.confirmAction(
                actionText + '确认',
                '确定' + actionText + '「' + name + '」？',
                async () => {
                    try {
                        await agentAppToggle(a.id, next !== 'disabled')
                        Message.success('「' + a.name + '」已' + actionText)
                        await this.fetchList()
                        return true
                    } catch (e) {
                        Message.error('操作失败，请稍后重试')
                        return false
                    }
                },
                'primary'
            )
        },
        // 删除确认：仅在确认回调中调删除接口，成功后保留原有提示与列表刷新
        confirmDelete(a) {
            const name = a.name || '未命名智能体'
            this.confirmAction(
                '删除确认',
                '确定删除「' + name + '」？此操作不可恢复。',
                async () => {
                    try {
                        await agentAppDelete(a.id)
                        Message.success('已删除「' + a.name + '」')
                        await this.fetchList()
                        return true
                    } catch (e) {
                        Message.error('删除失败，请稍后重试')
                        return false
                    }
                },
                'error'
            )
        }
    }
}
</script>

<style lang="less" scoped>
@import (reference) './styles/agent-theme.less';

.ag-list {
    .ag-root();
    position: relative;
    // iView 组件统一走绛红宣纸主题（按钮 / 输入 / 标签 / 加载 / 卡片）
    .ag-iview-theme();
}

// ══ 主按钮（type="primary"）背景 / 边框兜底 ══════════════════════════════════
// 全局样式 .ivu-btn-primary{ background-color:#79b3f9 !important; border-color:#79b3f9 !important }
// 带 !important，本主题 mixin（.ag-iview-theme()）里的普通声明压不过它 —— 主按钮会显示成浅蓝。
// 全局样式不可改，故仅在本页作用域内用「同等 !important + 更高特异性」把颜色抢回来；
// 只命中 .ag-list 子树，其他页面不受影响。solid 与 ghost 两个变体都要覆盖：
// ghost 主按钮（透明底 + 绛红描边）若不覆盖，同样会被全局实心蓝盖掉。
// 颜色仍取主题令牌（@ag-accent 一族指向 var(--ag-theme-*)），深浅两主题都不会被写死。
// 注意：hover / active 也要加 !important，否则常态被抢回后、悬停态又落回全局蓝。
:deep(.ivu-btn-primary:not(.ivu-btn-ghost)) {
    background-color: @ag-accent !important;
    border-color: @ag-accent-deep !important;
}

:deep(.ivu-btn-primary:not(.ivu-btn-ghost):hover:not([disabled])) {
    background-color: @ag-accent-hover !important;
    border-color: @ag-accent-hover !important;
}

:deep(.ivu-btn-primary:not(.ivu-btn-ghost):active:not([disabled])) {
    background-color: @ag-accent-deep !important;
    border-color: @ag-accent-deep !important;
}

:deep(.ivu-btn-ghost.ivu-btn-primary) {
    background-color: transparent !important;
    border-color: fade(@ag-accent-solid, 55%) !important;
}

:deep(.ivu-btn-ghost.ivu-btn-primary:hover:not([disabled])) {
    background-color: @ag-accent-weak !important;
    border-color: @ag-accent !important;
}

:deep(.ivu-btn-ghost.ivu-btn-primary:active:not([disabled])) {
    background-color: @ag-accent-weak !important;
    border-color: @ag-accent-deep !important;
}

// —— 页头 ——
.ag-list__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

// —— 范围切换 tab：我的智能体 / 我的收藏 ——
// 选中态 = 绛红主色 + 加粗（用户要求）；未选中 = 次文灰 + 常规字重
.ag-tabs {
    display: flex;
    align-items: baseline;
    gap: 20px;
    flex-wrap: wrap;
}

.ag-tab {
    padding: 0 0 4px;
    border: none;
    background: none;
    .font-serif();
    font-size: 26px;
    font-weight: 400;
    line-height: 1.2;
    color: @ag-ink-3;
    letter-spacing: 0.03em;
    cursor: pointer;
    transition: color @ag-motion-fast @ag-ease;

    &:hover {
        color: @ag-ink-2;
    }

    &:focus-visible {
        outline: 2px solid @ag-focus-ring;
        outline-offset: 2px;
    }

    &.is-active {
        color: @ag-accent;
        font-weight: 600;
    }
}

// —— 工具条 ——
.ag-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}

.ag-toolbar__search {
    width: clamp(180px, 24vw, 260px);
    max-width: 100%;
}

.ag-toolbar__select {
    width: clamp(120px, 14vw, 140px);
}

.ag-toolbar__count {
    margin-left: auto;
    font-size: 12px;
    color: @ag-ink-3;
}

.ag-list__spin {
    position: relative;
    height: 200px;
}

// —— 卡片栅格：桌面默认一行 5 个，中宽降 3/2 列，小屏 1 列 ——
.ag-cards {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: clamp(10px, 1.2vw, 16px);
}

// —— 列表项入场：切换范围（我的智能体 / 我的收藏）后逐个落位 ——
// 对齐智能体广场「切换时列表项挨个展示」的规格：16px 上移 → 归位，时长随门户 --t-base；
// 逐个延迟由模板内联 animation-delay 给出（(i % 10) * 0.05s，最迟第 10 项 0.45s）。
// 填充用 backwards 而非 both：延迟期保持首帧（透明 + 偏移，避免后续项提前闪出），
// 动画结束即把 transform 交还元素自身 —— 否则 .pg-card:hover 的 translateY(-4px) 会上浮失效。
@keyframes agCardIn {
    from {
        opacity: 0;
        transform: translateY(16px);
    }

    to {
        opacity: 1;
        transform: none;
    }
}

.ag-enter {
    animation: agCardIn var(--t-base) backwards;
}

// 动效降级：reduce 直接关掉动画（连带去掉延迟期的隐藏态，内容立即可见）
@media (prefers-reduced-motion: reduce) {
    .ag-enter {
        animation: none;
    }
}

.ag-card {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 200px;
    max-height: 200px;
    min-height: 200px;
    min-width: 0;
    overflow: hidden;
    border: 1px solid @ag-line;
    border-radius: @ag-radius;
    background: @ag-surface;
    transition: border-color @ag-motion-fast @ag-ease, box-shadow @ag-motion-fast @ag-ease;

    &:hover {
        border-color: @ag-line-strong;
        box-shadow: @ag-shadow-2;
    }

    :deep(.ivu-card-body) {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        min-height: 0;
        box-sizing: border-box;
        padding: clamp(12px, 1.1vw, 16px);
    }
}

// —— 状态角标：贴合卡片右上角，左上折角突出、左下圆角 ——
.ag-card__badge {
    --badge-bg: @ag-ink-3;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
    padding: 4px 10px 5px 12px;
    font-size: 11px;
    line-height: 1.3;
    color: #fff;
    letter-spacing: 0.02em;
    pointer-events: none;
    background: var(--badge-bg);
    border-radius: 0 @ag-radius 0 9px;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -8px;
        width: 0;
        height: 0;
        border-right: 8px solid var(--badge-bg);
        border-bottom: 8px solid transparent;
    }

    &.is-published {
        --badge-bg: @ag-accent;
    }

    &.is-draft {
        --badge-bg: @ag-warn;
    }

    // 已停用：主墨系灰（白字可读），不用冷灰
    &.is-disabled {
        --badge-bg: @ag-ink-2;
    }
}

.ag-card__body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: clamp(8px, 0.9vw, 12px);
    min-width: 0;
    min-height: 0;
    height: 100%;
}

.ag-card__top {
    display: flex;
    align-items: center;
    gap: clamp(8px, 0.9vw, 12px);
    flex-wrap: nowrap;
    min-width: 0;
    // 为右上角状态角标让出空间
    padding-right: 25px;
}

.ag-card__top .ag-glyph {
    flex-shrink: 0;
}

.ag-card__head {
    flex: 1 1 120px;
    min-width: 0;
}

.ag-card__name {
    display: flex;
    align-items: center;
    gap: clamp(4px, 0.5vw, 8px);
    height: 22px;
    min-height: 22px;
    max-height: 22px;
    min-width: 0;
    font-size: clamp(13px, 1vw, 15px);
    font-weight: 600;
    color: @ag-ink;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-wrap: nowrap;
}

.ag-card__name-text {
    display: block;
    flex: 1 1 auto;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.ag-card__name :deep(.ivu-tag) {
    flex: 0 0 auto;
}

.ag-card__meta {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    height: 48px;
    min-height: 48px;
    max-height: 48px;
    padding: 2px 0;
    box-sizing: border-box;
    overflow: hidden;
    font-size: clamp(11px, 0.85vw, 12px);
    color: @ag-ink-3;
    min-width: 0;
}

.ag-card__meta-main {
    display: flex;
    align-items: center;
    gap: clamp(6px, 0.7vw, 10px);
    height: 20px;
    min-height: 20px;
    max-height: 20px;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
}

.ag-card__meta-main :deep(.ivu-tag),
.ag-card__stat {
    flex: 0 0 auto;
}

.ag-card__stat {
    white-space: nowrap;
}

.ag-card__updated {
    display: block;
    flex: 0 0 20px;
    height: 20px;
    min-height: 20px;
    max-height: 20px;
    min-width: 0;
    overflow: hidden;
    font-size: 11px;
    line-height: 20px;
    color: @ag-ink-3;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.ag-card__actions {
    display: flex;
    align-items: flex-start;
    gap: clamp(6px, 0.6vw, 8px);
    flex: 0 0 auto;
    height: 44px;
    min-height: 44px;
    max-height: 44px;
    margin-top: auto;
    flex-wrap: nowrap;
    overflow: hidden;
    padding-top: clamp(8px, 0.8vw, 10px);
    border-top: 1px solid @ag-line;
    min-width: 0;
}

// ══ 我的收藏卡片 ═══════════════════════════════════════════════════════════
// 样式移植自智能体广场 pages/portal/agents/index.vue 的列表项（.pg-card 一族），规格逐项对齐；
// 只做一处删减：操作行只留「开始对话」——收藏的可能是他人智能体，不提供 编辑/发布/停用/删除。
// 缩略图右上角收藏★保留（样式 + 点击切换照搬广场，便于随时取消收藏）。
// 取色走门户全局 token（--c-* / --s* / --text-* / --font-*，定义在 PortalLayout 的 body.page-portal-v3 上）。
.pg-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: 0;
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    transition: transform var(--t-base), box-shadow var(--t-base);
}

// 缩略带：42px 高 + 右下 18px 切角；四色渐变按 4n 循环（与广场一致）
.pg-thumb {
    position: relative;
    height: 42px;
    overflow: hidden;
    background: linear-gradient(135deg, var(--c-red-600), var(--c-gold-500));
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
}

.ag-cards .pg-card:nth-child(4n+2) .pg-thumb {
    background: linear-gradient(135deg, #2e5a4a, var(--c-gold-500));
}

.ag-cards .pg-card:nth-child(4n+3) .pg-thumb {
    background: linear-gradient(135deg, var(--c-red-500), #5a2e6e);
}

.ag-cards .pg-card:nth-child(4n) .pg-thumb {
    background: linear-gradient(135deg, #1e4a7a, var(--c-red-600));
}

// 类型标：白底压图，左上角（右上角让位收藏★）
.pg-tag {
    position: absolute;
    left: var(--s2);
    top: var(--s2);
    padding: 2px var(--s2);
    background: var(--c-white);
    border: 1px solid var(--c-red-600);
    color: var(--c-red-600);
    font-family: var(--font-body);
    font-size: var(--text-xs);
}

.pg-tag.flow {
    border-color: var(--c-gold-500);
    color: #B36A10;
}

// 收藏★：缩略带右上角，透明底 + 白星压暗晕（四色渐变上均 ≥3:1）；已收藏转金色并翻转一次
.pg-star {
    position: absolute;
    right: var(--s2);
    top: var(--s2);
    width: var(--s8);
    height: var(--s8);
    display: grid;
    place-items: center;
    padding: 0;
    background: transparent;
    border: 0;
    color: var(--c-white);
    opacity: .85;
    font-size: var(--text-lg);
    cursor: pointer;
    text-shadow: 0 1px 2px rgba(26, 20, 16, .55);
    transition: color var(--t-fast), opacity var(--t-fast);
}

.pg-star.is-on {
    color: var(--c-gold-500);
    opacity: 1;
    // 收藏反馈：一次性 rotateY 翻转
    animation: pgStarFlip .5s ease;
}

@keyframes pgStarFlip {
    0% { transform: rotateY(0); }
    50% { transform: rotateY(180deg); }
    100% { transform: rotateY(360deg); }
}

// 头像圆章：40px，位于缩略带之下、名称之上，水平居中；三态共用此外壳
.pg-avatar {
    display: grid;
    place-items: center;
    width: var(--s10);
    height: var(--s10);
    margin: 0 auto;
    flex-shrink: 0;
    overflow: hidden;
    border: 1px solid var(--c-border);
    border-radius: var(--r-full);
    background: linear-gradient(180deg, #fff8ef, var(--c-paper));
    color: var(--c-red-600);
    font-family: var(--font-display);
    font-size: var(--text-base);
    line-height: 1;
}

// icon 态：图标类名直用，字号略大于首字
.pg-avatar i {
    font-size: var(--text-lg);
    line-height: 1;
}

.pg-body {
    display: flex;
    flex-direction: column;
    gap: var(--s2);
    flex: 1;
    padding: var(--s3) var(--s4) var(--s2);
}

// 名称：与头像同中轴居中，锁单行
.pg-name {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-base);
    font-weight: 700;
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

// 简介：恒占 3 行，悬停看全文走原生 title
.pg-desc {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--c-ink-2);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: calc(var(--text-xs) * var(--leading-body) * 3);
}

// 操作行：发丝分割 + 常驻主操作
.pg-act {
    padding: var(--s2) var(--s4) var(--s2);
    border-top: 1px dashed rgba(153, 42, 24, .25);
}

.pg-btn-chat {
    width: 100%;
    height: var(--s8);
    padding: 0 var(--s3);
    border: 0;
    border-radius: var(--r-sm);
    background: var(--c-red-600);
    color: var(--c-white);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    cursor: pointer;
    transition: background var(--t-fast);
}

.pg-btn-chat:hover {
    background: var(--c-red-500);
}

.pg-btn-chat:active {
    background: var(--c-red-700);
}

// 卡面 hover 上浮（触屏不误触发位移）
@media (hover: hover) {
    .pg-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
    }
}

// 动效降级：reduce 取消上浮与星标翻转
@media (prefers-reduced-motion: reduce) {
    .pg-card:hover {
        transform: none;
    }

    .pg-star.is-on {
        animation: none;
    }
}

// —— 空状态卡片 ——
.ag-list__empty {
    border: 1px solid @ag-line;
    border-radius: @ag-radius;
    background: @ag-surface;

    :deep(.ivu-card-body) {
        padding: 0;
    }
}

// —— 头像（品牌四态：绛红 / 金 / 深绛 / 墨）——
.ag-glyph {
    .ag-glyph();
}

// 图片头像：圆形裁切，背景由内联 background-image 铺满
.ag-glyph--avatar {
    border-radius: 50%;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center;
    overflow: hidden;
}

.ag-glyph--green {
    background: @ag-accent;
}

.ag-glyph--ochre {
    background: @ag-gold;
    color: @ag-ink;
}

.ag-glyph--indigo {
    background: @ag-accent-deep;
}

.ag-glyph--sand {
    background: @ag-ink-2;
}

.ag-empty {
    .ag-empty();
}

// 无障碍：尊重系统「减少动态效果」
.ag-reduced-motion();

// —— 断点：中宽 3/2 列，小屏 1 列（避免横向溢出）——
@media (max-width: 1440px) {
    .ag-cards {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 1100px) {
    .ag-cards {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 720px) {
    .ag-cards {
        grid-template-columns: minmax(0, 1fr);
    }

    .ag-toolbar__search,
    .ag-toolbar__select {
        width: 100%;
    }

    .ag-toolbar__count {
        margin-left: 0;
    }
}
</style>
