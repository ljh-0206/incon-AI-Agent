<template>
    <!-- 我的智能体（/portal/mine/agents）—— 门户列表页
         ① 页面壳退回门户常态：标准容器（--max 1440 版心 + 顶栏让位，与 /portal/kb 出口页同壳）
            + 页头（kicker / 栏目标题 / 新建主入口）+ 单行工具条（范围 chips / 计数 / 检索）；
            全幅绛红 banner、工具带与绛红页脚一并撤除；
         ② 卡片结构与视觉保持不变（缩略带 → 圆章头像 → 名称 → 描述三行 → 操作行，与同页「我的收藏」卡同构），
            栅格改 4 列并放开版心 → 卡片宽 273–333px，逐级降 3 / 2 / 1 列；
         ③ 操作列对齐后台 /ai/agent-app：运行 / 编辑 / 发布 / 启用·停用 / 删除，
            每个动作成功后本地状态即刻更新，再静默回读服务端为准；
         ④ 只用既有门户 API（agentAppMine / Favorites / Favorite / Unfavorite / Publish / Toggle / Delete），
            不新增依赖，不改 components/** 与参考页；
         ⑤ 范围 chips 三档，第三档「我的工作流」（?type=workflow）：独立列表路由 /portal/workflows 已移除，
            改为内嵌 WorkflowList 组件，标题 / 新建入口由本页头承担（show-title / show-create 皆 false）。 -->
    <PortalLayout :solid="true">
        <main class="ma-page" :class="{ 'is-view': isView }">
            <a class="ma-skip" href="#ma-grid">{{ skipText }}</a>

            <!-- ══ 页头：kicker + 栏目标题（随范围切换）；右端新建主入口，底缘发丝虚线收口 ══ -->
            <header class="ma-head ma-effect" data-delay="0">
                <div class="ma-head-main">
                    <p class="ma-kicker"><span aria-hidden="true">◈</span>{{ kickerText }}</p>
                    <h1 class="ma-title">{{ channelTitle }}</h1>
                </div>
                <button type="button" class="ma-create" @click="goCreate">{{ createLabel }}</button>
            </header>

            <!-- ══ 工具条：左「范围」三档（我的智能体 / 我的收藏 / 我的工作流）· 右 计数 + 检索（工作流档收起，检索由内嵌组件自带）；选中三重编码（实线 + ◈ + 反白） ══ -->
            <section class="ma-toolbar ma-effect" data-delay="1" aria-label="范围与检索">
                <div class="ma-chips" role="group" aria-label="内容范围">
                    <button
                        v-for="t in tabs"
                        :key="t.key"
                        type="button"
                        class="ma-chip"
                        :aria-pressed="tab === t.key ? 'true' : 'false'"
                        @click="switchTab(t.key)"
                    ><span v-if="tab === t.key" class="ma-chip-mark" aria-hidden="true">◈</span>{{ t.label }}</button>
                </div>

                <div v-if="!isWorkflow" class="ma-toolbar-right">
                    <p class="ma-count" aria-live="polite">{{ countText }}</p>
                    <form class="ma-search" role="search" @submit="onSearchSubmit">
                        <label class="ma-sr-only" for="ma-search-input">搜索智能体</label>
                        <input
                            id="ma-search-input"
                            v-model="searchInput"
                            type="search"
                            autocomplete="off"
                            placeholder="搜索名称或简介"
                        />
                        <button type="submit">检索</button>
                    </form>
                </div>
            </section>

            <!-- 静默刷新失败提示条：动作已成功、但回读失败时的显式告知（不静默显示旧数据） -->
            <div v-if="stale && !isWorkflow" class="ma-notice" role="status">
                <span>列表刷新失败，当前显示的可能不是最新状态</span>
                <button type="button" @click="refresh">重试</button>
            </div>

            <!-- ══ 我的工作流：内嵌 WorkflowList 组件（/portal/workflows 列表路由已移除）══
                 标题与新建入口由本页头承担（kicker / 栏目标题 / 新建工作流主钮），
                 故 show-title / show-create 都关掉，组件只剩筛选工具条 + 卡片，不与页头重复。
                 不监听 nav / open-workflow → 编辑与新建由组件自行跳保留的 /portal/workflows/edit。
                 v-if 切换：切走即卸载、回来重新挂载，列表自然回读，无需宿主手动刷新
                 （组件内另有 activated 钩子兜底 keep-alive 场景）。 -->
            <WorkflowList
                v-if="isWorkflow"
                id="ma-grid"
                ref="workflowList"
                class="ma-wf"
                role="region"
                aria-label="工作流列表"
                :show-title="false"
                :show-create="false"
            />

            <section
                v-else
                id="ma-grid"
                class="ma-grid-wrap"
                :aria-busy="loading ? 'true' : 'false'"
                aria-label="智能体列表"
            >
                <!-- 骨架：结构镜像真卡（缩略带 / 圆章 / 名称 / 三行描述 / 元信息 / 操作行）→ 等高无跳变；8 格 = 4 列两行 -->
                <div v-if="loading" class="ma-grid" aria-hidden="true">
                    <div v-for="i in 8" :key="'sk-' + i" class="ma-sk-card">
                        <div class="ma-sk-thumb"></div>
                        <div class="ma-sk-body">
                            <div class="ma-sk-avatar"></div>
                            <div class="ma-sk-name"></div>
                            <div class="ma-sk-desc">
                                <div class="ma-sk-sub"></div>
                                <div class="ma-sk-sub"></div>
                                <div class="ma-sk-sub"></div>
                            </div>
                            <div class="ma-sk-meta"></div>
                        </div>
                        <div class="ma-sk-act">
                            <div class="ma-sk-btn"></div>
                            <div class="ma-sk-btn"></div>
                            <div class="ma-sk-btn"></div>
                        </div>
                    </div>
                </div>

                <!-- 错误态：只出错误 + 重试，不回退任何演示数据 -->
                <div v-else-if="loadError" class="ma-state" role="alert">
                    <span class="ma-state-seal" aria-hidden="true">◈</span>
                    <p class="ma-state-title">列表加载失败</p>
                    <p class="ma-state-text">网络或服务异常，请稍后重试</p>
                    <div class="ma-state-actions">
                        <button type="button" class="ma-state-btn" @click="refresh">重试</button>
                    </div>
                </div>

                <!-- 空态：区分「筛选无结果」与「真空」；文案随范围切换 -->
                <div v-else-if="!visibleRows.length" class="ma-state ma-state--plain">
                    <span class="ma-state-seal" aria-hidden="true">◈</span>
                    <p class="ma-state-title">{{ emptyTitle }}</p>
                    <p class="ma-state-text">{{ emptyText }}</p>
                    <div class="ma-state-actions">
                        <button v-if="hasFilter" type="button" class="ma-state-btn" @click="clearFilters">清除筛选</button>
                        <button v-else-if="isFav" type="button" class="ma-state-btn" @click="goPlaza">去广场逛逛</button>
                        <button v-else type="button" class="ma-state-btn" @click="goCreate">去创建一个</button>
                    </div>
                </div>

                <!-- ══ 我的智能体：管理型卡（运行 / 编辑 / 发布 / 启用·停用 / 删除） ══ -->
                <div v-else-if="!isFav" :key="gridKey" class="ma-grid">
                    <article
                        v-for="(a, i) in visibleRows"
                        :key="'mine-' + a.id"
                        class="ma-slot ma-enter"
                        :class="{ 'is-busy': isBusy(a) }"
                        :style="{ animationDelay: ((i % 10) * 0.05) + 's' }"
                    >
                        <div class="ma-card">
                            <!-- 缩略带：四色渐变按 4n 循环（与广场同序列）+ 右下 18px 切角；
                                 左上类型标、右上状态标（带文字，不只靠颜色） -->
                            <div class="ma-thumb">
                                <span class="ma-tag" :class="{ flow: a.appType === 'workflow' }">{{ typeLabel(a) }}</span>
                                <span class="ma-state-mark" :class="'is-' + a.status">{{ statusLabel(a.status) }}</span>
                            </div>

                            <div class="ma-body">
                                <!-- 头像三态：image = 图片 ID 铺背景圆章 / icon = 图标类名圆内居中 / disc = 名称首字 -->
                                <span v-if="a.avatarKind === 'image'" class="ma-avatar" role="img"
                                    :aria-label="a.name + ' 头像'" :style="avatarBgStyle(a.avatarValue)"></span>
                                <span v-else-if="a.avatarKind === 'icon'" class="ma-avatar" role="img"
                                    :aria-label="a.name + ' 头像'"><i :class="a.avatarValue" aria-hidden="true"></i></span>
                                <span v-else class="ma-avatar" aria-hidden="true">{{ a.avatarDisc }}</span>

                                <h3 class="ma-name" :title="a.name">{{ a.name }}</h3>

                                <!-- 描述：后端 description，恒占三行；空值走占位文（绝不出现 undefined） -->
                                <p class="ma-desc" :class="{ 'is-empty': !a.description }" :title="a.description || null">{{ a.description || descPlaceholder }}</p>

                                <!-- 元信息行：使用次数 + 更新日期（完整时间走原生 title） -->
                                <p class="ma-meta" :title="a.updatedAtFull === '-' ? null : a.updatedAtFull">
                                    <span>{{ a.usage }} 次使用</span>
                                    <span class="ma-meta-dot" aria-hidden="true">·</span>
                                    <span>{{ a.updatedAt }}</span>
                                </p>
                            </div>

                            <!-- 操作行：与后台 /ai/agent-app 操作列一一对应（发布恒驻，运行按状态禁用而非隐藏） -->
                            <div class="ma-act">
                                <button
                                    type="button"
                                    class="ma-btn ma-btn--primary"
                                    :aria-disabled="canRun(a) ? 'false' : 'true'"
                                    :title="canRun(a) ? '开始对话' : runHint(a)"
                                    @click="goRun(a)"
                                >运行</button>
                                <button type="button" class="ma-btn" @click="goEdit(a)">编辑</button>
                                <button type="button" class="ma-btn" @click="confirmPublish(a)">发布</button>
                                <button type="button" class="ma-btn" @click="confirmToggle(a)">{{ a.enabled ? '停用' : '启用' }}</button>
                                <button type="button" class="ma-btn ma-btn--danger" @click="confirmDelete(a)">删除</button>
                            </div>
                        </div>
                    </article>
                </div>

                <!-- ══ 我的收藏：与广场同构（收藏的可能是他人智能体，只给「开始对话」+ 右上收藏★） ══ -->
                <div v-else :key="gridKey" class="ma-grid">
                    <article
                        v-for="(a, i) in visibleRows"
                        :key="'fav-' + a.id"
                        class="ma-slot ma-enter"
                        :style="{ animationDelay: ((i % 10) * 0.05) + 's' }"
                    >
                        <div class="ma-card">
                            <div class="ma-thumb">
                                <span class="ma-tag" :class="{ flow: a.appType === 'workflow' }">{{ typeLabel(a) }}</span>
                                <button
                                    type="button"
                                    class="ma-star"
                                    :class="{ 'is-on': isStarred(a) }"
                                    :aria-pressed="isStarred(a) ? 'true' : 'false'"
                                    :aria-label="(isStarred(a) ? '取消收藏《' : '收藏《') + a.name + '》'"
                                    @click="confirmUnstar(a)"
                                >{{ isStarred(a) ? '★' : '☆' }}</button>
                            </div>

                            <div class="ma-body">
                                <span v-if="a.avatarKind === 'image'" class="ma-avatar" role="img"
                                    :aria-label="a.name + ' 头像'" :style="avatarBgStyle(a.avatarValue)"></span>
                                <span v-else-if="a.avatarKind === 'icon'" class="ma-avatar" role="img"
                                    :aria-label="a.name + ' 头像'"><i :class="a.avatarValue" aria-hidden="true"></i></span>
                                <span v-else class="ma-avatar" aria-hidden="true">{{ a.avatarDisc }}</span>

                                <h3 class="ma-name" :title="a.name">{{ a.name }}</h3>
                                <p class="ma-desc" :class="{ 'is-empty': !a.description }" :title="a.description || null">{{ a.description || descPlaceholder }}</p>
                            </div>

                            <div class="ma-act">
                                <button type="button" class="ma-btn-chat" @click="goRun(a)">开始对话 →</button>
                            </div>
                        </div>
                    </article>
                </div>
            </section>
        </main>

        <!-- 二次确认弹框（发布 / 启用·停用 / 删除 / 取消收藏 共用） -->
        <PortalConfirmModal
            v-model="confirm.visible"
            :title="confirm.title"
            :content="confirm.content"
            :confirm-text="confirm.confirmText"
            :confirm-type="confirm.confirmType"
            :loading="confirm.loading"
            @confirm="executeConfirmedAction"
        />
    </PortalLayout>
</template>

<script>
    import PortalLayout from '../../components/PortalLayout.vue'
    import PortalConfirmModal from '../../components/PortalConfirmModal.vue'
    import WorkflowList from '../../components/agent/workflow/WorkflowList.vue'
    import {
        agentAppMine,
        agentAppFavorites,
        agentAppFavorite,
        agentAppUnfavorite,
        agentAppDelete,
        agentAppPublish,
        agentAppToggle
    } from '@/api/agentApp'

    // 范围注册表：新增一档只加一项，取数 / 空态文案 / 卡片形态全由它驱动
    //   key      范围键；aliases 路由 query 可识别取值（第 0 个为写回规范值）
    // 工作流档（value = workflow）例外：它不取本页数据，列表由内嵌 WorkflowList 组件自取。
    const TABS = [
        { key: 'mine', label: '我的智能体', value: 'agent', aliases: ['agent', 'mine', 'my', 'agents'] },
        { key: 'favorites', label: '我的收藏', value: 'collect', aliases: ['collect', 'collection', 'favorite', 'favorites', 'fav', 'star'] },
        { key: 'workflow', label: '我的工作流', value: 'workflow', aliases: ['workflow', 'workflows', 'flow', 'flows', 'wf'] }
    ]
    // 路由 query 里承载范围的参数名（按顺序取第一个命中的）
    const TAB_QUERY_KEYS = ['type', 'page']
    const DEFAULT_TAB = 'mine'
    // 描述占位文：空 description 时填充，杜绝 undefined / 空白
    const DESC_PLACEHOLDER = '这个智能体还没有简介'
    // 门户工作流编辑入口（列表路由已移除，仅剩此条）：编辑与新建共用，
    // WorkflowManage 按 query.id 加载详情、按 query.mode=create 开空白表单
    const WORKFLOW_EDIT_PATH = '/portal/workflows/edit'
    // 后端 status → 展示文案（与 components/agent/mock/agents.js 的 statusLabel 同口径）
    const STATUS_LABELS = { published: '已上线', draft: '草稿', disabled: '已停用' }

    export default {
        name: 'PortalMineAgents',

        components: {
            PortalLayout,
            PortalConfirmModal,
            WorkflowList
        },

        data () {
            return {
                // 入场族开关：挂载后下一帧一次性开启（降级由 CSS 媒体查询兜底）
                isView: false,

                // 当前范围（mine / favorites / workflow），首屏与后续均由路由 query 决定
                tab: DEFAULT_TAB,
                // 路由里承载范围的参数名（type / page）：切范围写回时沿用同一个键
                tabQueryKey: TAB_QUERY_KEYS[0],

                // 列表三态：loading / loadError / 正常；stale = 静默回读失败（数据可能是旧的）
                loading: false,
                loadError: false,
                stale: false,
                rows: [],

                // 检索：keyword 为已应用词（驱动过滤与网格重建），searchInput 为输入框模型
                keyword: '',
                searchInput: '',

                // 空描述占位文（挂到 data 供模板取用；常量名保持全大写仅在脚本内）
                descPlaceholder: DESC_PLACEHOLDER,

                // 收藏 id 集合（收藏档的返回即收藏集合本身，无需二次请求）
                favIds: [],

                // 正在提交动作的 id 集合：同卡防重复点击
                busyIds: [],

                // 统一二次确认弹框：只有确认回调才会调接口
                confirm: {
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
            tabs () {
                return TABS
            },

            currentTab () {
                const hit = TABS.filter(t => t.key === this.tab)[0]
                return hit || TABS[0]
            },

            isFav () {
                return this.tab === 'favorites'
            },

            // 工作流档：列表由内嵌 WorkflowList 组件承载，本页不取 agent-app 数据
            isWorkflow () {
                return this.tab === 'workflow'
            },

            // 跳过链接文案：随范围切换目标说明
            skipText () {
                return this.isWorkflow ? '跳到工作流列表' : '跳到智能体列表'
            },

            // 页头 kicker 的英文小标
            kickerText () {
                return this.isWorkflow ? '个人中心 · MY WORKFLOWS' : '个人中心 · MY AGENTS'
            },

            // 页头主钮文案：工作流档换「新建工作流」，去向由 goCreate 分流
            createLabel () {
                return this.isWorkflow ? '＋ 新建工作流' : '＋ 新建智能体'
            },

            hasFilter () {
                return !!(this.keyword || '').trim()
            },

            // 关键词过滤：名称 + 描述 + 创建人（描述口径与旧实现一致）
            visibleRows () {
                const kw = (this.keyword || '').trim().toLowerCase()
                if (!kw) return this.rows
                return this.rows.filter(a => {
                    const hay = (a.name + ' ' + a.description + ' ' + a.owner).toLowerCase()
                    return hay.indexOf(kw) !== -1
                })
            },

            // 栏目头标题：关键词优先，其次范围默认名
            // 工作流档例外 —— 它的检索与空态都在 WorkflowList 组件内，标题恒定，
            // 不能被本页残留的 q 检索词改成「搜索结果」
            channelTitle () {
                if (this.isWorkflow) return '我的工作流'
                if (this.hasFilter) return '搜索结果'
                return this.isFav ? '我的收藏' : '我的智能体'
            },

            // 栏目头计数：loading / 失败 / 正常；非默认筛选时追加「当前筛选 M 个」
            countText () {
                if (this.loading) return '加载中…'
                if (this.loadError) return '列表加载失败'
                const total = this.isFav ? '共 ' + this.rows.length + ' 个收藏' : '共 ' + this.rows.length + ' 个'
                if (!this.hasFilter) return total
                return total + ' · 当前筛选 ' + this.visibleRows.length + ' 个'
            },

            // 网格重建键：切范围 / 提交检索时重建 → 入场动画原地重放
            gridKey () {
                return this.tab + '|' + this.keyword
            },

            // 空态标题 / 说明：区分筛选无结果与真空，文案随范围切换
            emptyTitle () {
                if (this.hasFilter) return '没有符合条件的智能体'
                return this.isFav ? '还没有收藏的智能体' : '还没有智能体'
            },

            emptyText () {
                if (this.hasFilter) return '换个关键词或清除筛选条件试试'
                return this.isFav
                    ? '在智能体广场收藏感兴趣的智能体，之后可在这里快速找到'
                    : '创建第一个智能体，用于课程答疑或科研辅助'
            }
        },

        watch: {
            // 路由 query 变化（外链跳转 / 前进后退）→ 同步范围与检索词
            '$route.query' () {
                this.syncFromRoute()
            }
        },

        mounted () {
            // 首屏：先按路由 query 定位范围与检索词（静默定位，取数统一由下面这次 loadList 发起，
            // 避免「路由命中 + 首屏」两次请求），再拉列表
            this.syncFromRoute(false)
            this.loadList()
            // 入场族：挂载后下一帧一次性加 is-view
            this.$nextTick(() => {
                this.isView = true
            })
        },

        methods: {
            // ---------- 路由同步 ----------
            // 路由 → 页面：范围按 type / page 顺序解析（兼容旧的 ?type=collect 深链），检索词取 q
            // shouldLoad = false 时只定位不发请求（首屏由 mounted 统一取数）
            syncFromRoute (shouldLoad) {
                const query = (this.$route && this.$route.query) || {}
                const hit = this.readRouteScope()
                if (hit) {
                    this.tabQueryKey = hit.queryKey
                    if (hit.key !== this.tab) {
                        this.tab = hit.key
                        if (shouldLoad !== false) this.loadList()
                    }
                }
                const q = query.q ? String(query.q) : ''
                if (q !== this.keyword) {
                    this.keyword = q
                    this.searchInput = q
                }
            },

            // 读路由范围：返回 { key, queryKey } 或 null
            readRouteScope () {
                const query = (this.$route && this.$route.query) || {}
                for (let i = 0; i < TAB_QUERY_KEYS.length; i++) {
                    const qk = TAB_QUERY_KEYS[i]
                    const raw = query[qk]
                    const value = Array.isArray(raw) ? raw[0] : raw
                    const key = this.resolveTabKey(value)
                    if (key) return { key: key, queryKey: qk }
                }
                return null
            },

            // 路由取值 → 范围 key：去空格 + 忽略大小写；无法识别返回 ''
            resolveTabKey (value) {
                const v = String(value === null || value === undefined ? '' : value).trim().toLowerCase()
                if (!v) return ''
                const hit = TABS.filter(t => t.aliases.indexOf(v) !== -1)[0]
                return hit ? hit.key : ''
            },

            // 页面 → 路由：范围写回 query（replace 不进历史，保留 q 等其它参数；
            // 先清掉另一套范围参数名，避免 ?type=collect&page=agent 自相矛盾；归一后与现状一致就不动）
            syncRouteFromTab () {
                if (!this.$router || !this.$route) return
                const query = Object.assign({}, this.$route.query)
                TAB_QUERY_KEYS.forEach(k => { delete query[k] })
                query[this.tabQueryKey || TAB_QUERY_KEYS[0]] = this.currentTab.value

                const cur = this.$route.query || {}
                const curKeys = Object.keys(cur)
                const same = curKeys.length === Object.keys(query).length &&
                    curKeys.every(k => String(cur[k]) === String(query[k]))
                if (same) return

                const result = this.$router.replace({ path: this.$route.path, query: query })
                if (result && typeof result.catch === 'function') result.catch(() => {})
            },

            // 切范围：重新取数 + 写回路由
            switchTab (key) {
                if (!this.resolveTabKey(key) || this.tab === key) return
                this.tab = key
                this.loadList()
                this.syncRouteFromTab()
            },

            // ---------- 列表取数 ----------
            // 拉当前范围的列表。silent = 动作后的静默回读：失败不置错误态、不清空，只亮 stale 提示条
            async loadList (silent) {
                // 工作流档：列表在 WorkflowList 组件内自取（workflowList 接口），本页不发请求，
                // 只把本页的三态复位，免得把 agent 档残留的 loading / error 带进这一档
                if (this.isWorkflow) {
                    this.rows = []
                    this.loading = false
                    this.loadError = false
                    this.stale = false
                    return
                }
                const fetch = this.isFav ? agentAppFavorites : agentAppMine
                this.loading = !silent
                if (!silent) this.loadError = false
                try {
                    const data = await fetch()
                    const list = Array.isArray(data)
                        ? data
                        : (data && (Array.isArray(data.list) ? data.list : (Array.isArray(data.rows) ? data.rows : [])))
                    this.rows = list.map((row, i) => this.mapRow(row, i))
                    // 收藏档的返回即收藏集合本身，直接灌进 favIds，无需再单独请求一次
                    if (this.isFav) this.favIds = this.rows.filter(x => x && x.id != null).map(x => String(x.id))
                    this.loadError = false
                    this.stale = false
                } catch (e) {
                    if (silent) {
                        // 静默回读失败：保留当前数据（动作已成功），只提示可能不是最新状态
                        this.stale = true
                    } else {
                        this.rows = []
                        this.loadError = true
                        this.$Message.error((this.isFav ? '收藏列表加载失败' : '智能体列表加载失败') + '，请稍后重试')
                    }
                } finally {
                    this.loading = false
                }
            },

            // 手动重试（错误态 / stale 提示条共用）
            refresh () {
                // 工作流档转交子组件回读（它的加载失败空态自带「重新加载」钮，这里是统一入口兜底）
                if (this.isWorkflow) {
                    const child = this.$refs.workflowList
                    if (child && typeof child.load === 'function') child.load()
                    return
                }
                this.loadList(false)
            },

            // ---------- 行映射（后端行 → 卡片模型） ----------
            // 名称 / 描述一律做「非字符串 → 空串」归一，杜绝 undefined 透传到界面
            mapRow (row, index) {
                const r = row || {}
                const name = this.text(r.name) || '未命名智能体'
                const description = this.text(r.description)
                const av = this.resolveAvatar(r.avatar || r.icon)
                // 展示状态：后端 /toggle 只翻 enabled、不改 status —— 对齐后台 AgentAppList 的启停列。
                // 故「已上线 / 已停用」以 enabled 为准，只有未发布的 draft 才算草稿；
                // 同时兼容后端直接把 status 写成 'disabled' 的返回（两种口径都判为已停用）。
                const rawStatus = this.text(r.status) || 'draft'
                const enabled = this.normalizeEnabled(r.enabled, true)
                const status = rawStatus === 'draft'
                    ? 'draft'
                    : ((rawStatus === 'disabled' || !enabled) ? 'disabled' : 'published')
                const stamp = r.cjsj || r.updatedAt || r.gxsj
                return {
                    id: r.id,
                    name: name,
                    description: description,
                    status: status,
                    enabled: enabled,
                    appType: r.appType === 'workflow' ? 'workflow' : 'standard',
                    usage: Number(r.usage) || 0,
                    owner: this.text(r.owner),
                    updatedAt: this.formatDate(stamp),
                    updatedAtFull: this.formatTime(stamp),
                    // 头像三态（与广场 / 收藏卡同一判别式）
                    avatarKind: av.kind,
                    avatarValue: av.kind === 'disc' ? '' : av.value,
                    avatarDisc: name.slice(0, 1)
                }
            },

            // 任意值 → 去空白字符串（null / undefined / 数字 0 之外的非串都安全）
            text (value) {
                if (value === null || value === undefined) return ''
                return String(value).trim()
            },

            // 启停字段归一：后端 tinyint 会给出 0 / 1 或 '0' / '1'，布尔字段则直接给 true / false。
            // false / 0 / '0' 归一为 false，true / 1 / '1' 归一为 true；
            // null / undefined（字段缺失）与无法识别的取值一律走业务默认 defaultValue
            // （未显式停用即视为启用，与原「r.enabled !== false」同口径）
            normalizeEnabled (value, defaultValue) {
                if (value === null || value === undefined) return defaultValue
                if (value === false || value === 0 || value === '0') return false
                if (value === true || value === 1 || value === '1') return true
                return defaultValue
            },

            // 后端时间（ISO-8601）→ 本地日期 / 完整时间；取不到统一给 '-'
            formatDate (t) {
                if (!t) return '-'
                const d = new Date(t)
                return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('zh-CN')
            },

            formatTime (t) {
                if (!t) return '-'
                const d = new Date(t)
                return isNaN(d.getTime()) ? '-' : d.toLocaleString('zh-CN')
            },

            statusLabel (status) {
                return STATUS_LABELS[status] || '草稿'
            },

            typeLabel (a) {
                return a && a.appType === 'workflow' ? '流程助手' : '标准助手'
            },

            // ---------- 头像三态 ----------
            // 1) 空 → disc（名称首字）；2) 含空格或图标前缀 → icon（类名直用）；
            // 3) 长度 > 2 → image（图片 ID）；4) 其余短串 → disc，避免空圆章
            resolveAvatar (raw) {
                if (!raw) return { kind: 'disc', value: '' }
                const s = String(raw).trim()
                if (!s) return { kind: 'disc', value: '' }
                if (/\s/.test(s) || /^fa[-\s]/i.test(s) || /^icon/i.test(s) || /^(mdi|bi|ri|pi|ant|el)[-\s]/i.test(s)) {
                    return { kind: 'icon', value: s }
                }
                if (s.length > 2) return { kind: 'image', value: s }
                return { kind: 'disc', value: s }
            },

            // 图片态背景：commonsJs.getBackgroundImage(id, true) + 圆形铺满（纸色垫底，404 不透明）
            avatarBgStyle (id) {
                if (!id) return null
                const bg = this.commonsJs.getBackgroundImage(id, true) || {}
                return Object.assign({}, bg, {
                    backgroundColor: 'var(--c-paper)',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center'
                })
            },

            // ---------- 状态就地更新 ----------
            idKey (a) {
                return a && a.id !== null && a.id !== undefined && a.id !== '' ? String(a.id) : ''
            },

            isBusy (a) {
                return !!this.idKey(a) && this.busyIds.indexOf(this.idKey(a)) !== -1
            },

            // 动作成功后本地立即打补丁（状态角标与按钮当场变），patch 返回 null = 移除该行
            patchRow (a, patch) {
                const key = this.idKey(a)
                if (!key) return
                if (!patch) {
                    this.rows = this.rows.filter(x => this.idKey(x) !== key)
                    return
                }
                this.rows = this.rows.map(x => (this.idKey(x) === key ? Object.assign({}, x, patch) : x))
            },

            // 统一动作执行：确认回调内 await 接口 → 本地打补丁 → 静默回读对齐服务端
            // 返回 true 表示成功（关弹框），false 表示失败（保留弹框）
            async commit (a, patch, request, okText, errText) {
                const key = this.idKey(a)
                if (key && this.busyIds.indexOf(key) !== -1) return false
                if (key) this.busyIds = this.busyIds.concat([key])
                try {
                    await request()
                    this.patchRow(a, patch ? patch(a) : null)
                    this.$Message.success(okText)
                    // 回读失败也会被 loadList(silent) 收进 stale 提示条，不会清空刚打好的本地状态
                    await this.loadList(true)
                    return true
                } catch (e) {
                    this.$Message.error(errText)
                    return false
                } finally {
                    if (key) this.busyIds = this.busyIds.filter(x => x !== key)
                }
            },

            // ---------- 二次确认 ----------
            confirmAction (title, content, action, confirmType) {
                this.confirm.title = title
                this.confirm.content = content
                this.confirm.confirmText = '确认'
                this.confirm.confirmType = confirmType || 'primary'
                this.confirm.loading = false
                this.confirm.action = action
                this.confirm.visible = true
            },

            // 执行待确认操作：loading 防重复；成功关闭并清空回调，失败保留弹框并复位 loading
            async executeConfirmedAction () {
                if (!this.confirm.visible || this.confirm.loading) return
                const action = this.confirm.action
                if (!action) return
                this.confirm.loading = true
                try {
                    const ok = await action()
                    if (ok !== false) {
                        this.confirm.visible = false
                        this.confirm.action = null
                    }
                } catch (e) {
                    this.$Message.error('操作失败，请稍后重试')
                } finally {
                    this.confirm.loading = false
                }
            },

            // ---------- 操作：发布（对齐后台操作列，恒驻；已上线时为重新发布） ----------
            confirmPublish (a) {
                if (!a) return
                const name = a.name
                const again = a.status === 'published'
                this.confirmAction(
                    '发布确认',
                    again
                        ? '「' + name + '」已处于上线状态，重新发布会刷新它的上线信息。'
                        : '发布后「' + name + '」将出现在智能体广场，同事即可检索并与它对话。',
                    () => this.commit(
                        a,
                        // 后端 publish 同时置 status=published 与 enabled=true
                        () => ({ status: 'published', enabled: true }),
                        () => agentAppPublish(a.id),
                        again ? '已重新发布「' + name + '」' : '已发布「' + name + '」',
                        '发布失败，请稍后重试'
                    ),
                    'primary'
                )
            },

            // ---------- 操作：启用 / 停用（按 enabled 翻转，措辞与状态角标「已停用」一致） ----------
            confirmToggle (a) {
                if (!a) return
                const name = a.name
                const nextEnabled = !a.enabled
                this.confirmAction(
                    nextEnabled ? '启用确认' : '停用确认',
                    nextEnabled
                        ? '启用后「' + name + '」恢复可运行，智能体广场同步恢复入口。'
                        : '停用后「' + name + '」无法再运行，智能体广场也不再提供入口。',
                    () => this.commit(
                        a,
                        // 后端 /toggle 只翻 enabled；status 同步推导，停用后卡片状态即时变「已停用」
                        () => ({
                            enabled: nextEnabled,
                            status: nextEnabled ? 'published' : 'disabled'
                        }),
                        () => agentAppToggle(a.id, nextEnabled),
                        '「' + name + '」已' + (nextEnabled ? '启用' : '停用'),
                        nextEnabled ? '启用失败，请稍后重试' : '停用失败，请稍后重试'
                    ),
                    'primary'
                )
            },

            // ---------- 操作：删除（二次确认，成功后该卡即时从列表移除） ----------
            confirmDelete (a) {
                if (!a) return
                const name = a.name
                this.confirmAction(
                    '删除确认',
                    '确定删除「' + name + '」？删除后不可恢复。',
                    () => this.commit(
                        a,
                        null,
                        () => agentAppDelete(a.id),
                        '已删除「' + name + '」',
                        '删除失败，请稍后重试'
                    ),
                    'error'
                )
            },

            // ---------- 收藏：取消收藏走二次确认（收藏档内恒为「已收藏 → 取消」） ----------
            confirmUnstar (a) {
                if (!a) return
                if (!this.isStarred(a)) {
                    this.addFavorite(a)
                    return
                }
                const name = a.name
                this.confirmAction(
                    '取消收藏确认',
                    '确定取消收藏「' + name + '」？之后可在智能体广场重新收藏。',
                    async () => {
                        try {
                            await agentAppUnfavorite(a.id)
                            this.favIds = this.favIds.filter(x => x !== this.idKey(a))
                            this.rows = this.rows.filter(x => this.idKey(x) !== this.idKey(a))
                            this.$Message.success('已取消收藏「' + name + '」')
                            await this.loadList(true)
                            return true
                        } catch (e) {
                            this.$Message.error('取消收藏失败，请稍后重试')
                            return false
                        }
                    },
                    'error'
                )
            },

            // 收藏（兜底分支：favIds 未同步时仍允许直接收藏）
            async addFavorite (a) {
                if (!a) return
                const key = this.idKey(a)
                if (!key) return
                try {
                    await agentAppFavorite(a.id)
                    if (this.favIds.indexOf(key) === -1) this.favIds = this.favIds.concat([key])
                    this.$Message.success('已收藏「' + a.name + '」')
                } catch (e) {
                    this.$Message.error('收藏失败，请稍后重试')
                }
            },

            isStarred (a) {
                return this.favIds.indexOf(this.idKey(a)) !== -1
            },

            // ---------- 运行 / 跳转 ----------
            // 可运行 = 已发布且已启用（对齐后台「!row.enabled 禁用运行」并额外挡住草稿）
            canRun (a) {
                return !!a && a.status === 'published' && a.enabled !== false
            },

            runHint (a) {
                if (!a) return '请先发布并启用该智能体，再开始对话'
                if (a.status === 'draft') return '草稿状态不可运行，请先发布'
                return '已停用，请先启用再开始对话'
            },

            goRun (a) {
                if (!a) return
                if (!this.canRun(a)) {
                    this.$Message.info(this.runHint(a))
                    return
                }
                this.navigate('/portal/agents/' + encodeURIComponent(this.idKey(a)) + '/run')
            },

            goEdit (a) {
                const id = this.idKey(a)
                this.navigate(id ? '/portal/create/agent/' + encodeURIComponent(id) : '/portal/create/agent')
            },

            goCreate () {
                // 工作流档：进保留的编辑路由的空白表单
                // （WorkflowManage 挂载后读 location.search 的 mode=create，开一张新画布）
                if (this.isWorkflow) {
                    this.navigate(WORKFLOW_EDIT_PATH, { mode: 'create' })
                    return
                }
                this.navigate('/portal/create/agent')
            },

            goPlaza () {
                this.navigate('/portal/agents')
            },

            // 跳转：同路径直接返回 + 吞重复导航错误（仓库既有 goPath 写法）
            // 带 query 时不做同路径短路 —— path 与目标串含 query 的一方无法直接比对，
            // 真重复也由下方 catch 吞掉，行为一致
            navigate (path, query) {
                if (!path) return
                if (!this.$router) return
                if (!query && this.$route && this.$route.path === path) return
                const target = query ? { path, query } : path
                const result = this.$router.push(target)
                if (result && typeof result.catch === 'function') result.catch(() => {})
            },

            // ---------- 检索 ----------
            // 提交（回车 / 检索钮）才把输入框内容写入 keyword → 网格只在提交时重建
            onSearchSubmit (e) {
                if (e && e.preventDefault) e.preventDefault()
                this.searchInput = (this.searchInput || '').trim()
                this.keyword = this.searchInput
            },

            clearFilters () {
                this.keyword = ''
                this.searchInput = ''
                this.$nextTick(() => {
                    const el = this.$el && this.$el.querySelector ? this.$el.querySelector('#ma-search-input') : null
                    if (el && el.focus) el.focus()
                })
            }
        }
    }
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════
   我的智能体 · 门户列表页（页壳退回门户常态，卡片语汇保持不变）
   token 全部来自 body.page-portal-v3（PortalLayout 持有）；
   ① 页壳 = 门户标准容器：--max(1440) 版心 + 顶栏让位 + 底部 --s16 收口，
      与 /portal/kb（.portal-kb-page）同壳——无全幅 banner / 工具带 / 绛红页脚；
   ② 页内 = 页头（kicker / 标题 / 新建主钮）+ 单行工具条（范围 chips / 计数 / 检索）；
   ③ 卡片语汇与同页「我的收藏」卡、以及智能体广场卡（--pg-*）同源：
      42px 渐变缩略带 + 右下 18px 切角 / 40px 圆章头像 / 居中单行名 /
      恒三行描述 / 发丝虚线分割的操作行（栅格 4 列，卡片宽 273–333px）。
   ④ 工作流档走内嵌 WorkflowList 组件（自带 --wf-* 绛红宣纸令牌与筛选工具条），
      本页只出页头与 chips，卡片区不套 .ma-grid —— 见模板 .ma-wf 注释。
   ══════════════════════════════════════════════════════════════ */

/* ── 入场族：挂载后下一帧加 .is-view；0.7s ease + data-delay 两档 ── */
@keyframes maIn {
    from {
        opacity: 0;
        transform: translateY(24px);
    }

    to {
        opacity: 1;
        transform: none;
    }
}

.ma-effect {
    opacity: 0;
}

.ma-page.is-view .ma-effect {
    animation: maIn .7s ease both;
}

.ma-page.is-view .ma-effect[data-delay='1'] {
    animation-delay: .08s;
}

/* ── 页面壳：门户标准容器（顶栏让位 + --max 版心；不加定位，跳过链接仍相对视口定位） ── */
.ma-page {
    width: 100%;
    max-width: var(--max);
    margin: 0 auto;
    padding: calc(var(--header-h) + var(--s8)) var(--s6) var(--s16);
}

/* ══ 跳过导航 ══ */
.ma-skip {
    position: absolute;
    left: var(--s4);
    top: -48px;
    z-index: 40;
    padding: var(--s2) var(--s4);
    background: var(--c-red-600);
    color: var(--c-white);
    border-radius: var(--r-sm);
    transition: top var(--t-fast);
}

.ma-skip:focus {
    top: var(--s4);
}

.ma-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* ══ 页头：kicker / 标题 + 右端「新建智能体」主钮；底缘发丝虚线收口 ══ */
.ma-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--s3) var(--s6);
    padding-bottom: var(--s5);
    border-bottom: 1px dashed rgba(153, 42, 24, .25);
}

.ma-head-main {
    min-width: 0;
}

.ma-kicker {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xs);
    line-height: 1;
    letter-spacing: var(--tracking-wider);
    color: var(--c-red-600);
}

.ma-kicker span {
    color: var(--c-gold-500);
    margin-right: var(--s1);
}

.ma-title {
    margin: var(--s2) 0 0;
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 700;
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

/* 新建主钮：绛红实底 + --r-sm（与 .ma-state-btn / .ma-btn-chat 同语汇），44 触点 */
.ma-create {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 var(--s5);
    border: 1px solid var(--c-red-600);
    border-radius: var(--r-sm);
    background: var(--c-red-600);
    color: var(--c-white);
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    white-space: nowrap;
    cursor: pointer;
    transition: background var(--t-fast), border-color var(--t-fast);
}

.ma-create:hover {
    background: var(--c-red-500);
    border-color: var(--c-red-500);
}

.ma-create:active {
    background: var(--c-red-700);
    border-color: var(--c-red-700);
}

/* ══ 工具条：单行 = 左范围 chips / 右 计数 + 检索（宣纸底，无白带无阴影） ══ */
.ma-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--s3) var(--s5);
    margin-top: var(--s5);
}

.ma-toolbar-right {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s3) var(--s5);
}

.ma-chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s3);
}

/* 范围 chip：44 触点；选中三重编码（底色 + 实线 + ◈），非仅颜色 */
.ma-chip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 var(--s4);
    border: 1px dashed var(--c-red-600);
    border-radius: var(--r-full);
    background: var(--c-white);
    color: var(--c-ink);
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    cursor: pointer;
    transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
}

.ma-chip:hover {
    background: var(--c-red-100);
}

.ma-chip:active {
    background: var(--c-red-700);
    color: var(--c-white);
}

.ma-chip[aria-pressed='true'] {
    border-style: solid;
    border-color: var(--c-red-600);
    background: var(--c-red-600);
    color: var(--c-white);
}

.ma-chip-mark {
    margin-right: var(--s1);
}

/* 检索表单：2px 红框 + 圆钮（同广场语汇） */
.ma-search {
    display: flex;
    width: 360px;
    max-width: 100%;
    height: var(--s12);
    border: 2px solid var(--c-red-600);
    background: var(--c-white);
    box-shadow: var(--shadow-md);
    border-radius: var(--r-full);
}

.ma-search input {
    flex: 1;
    min-width: 0;
    padding: 0 var(--s4);
    border: 0;
    background: transparent;
    color: var(--c-ink);
    font-size: var(--text-base);
    border-radius: var(--r-full) 0 0 var(--r-full);
}

.ma-search input::placeholder {
    color: var(--c-muted);
}

.ma-search button {
    flex-shrink: 0;
    padding: 0 var(--s5);
    border: 0;
    background: var(--c-red-600);
    color: var(--c-white);
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    white-space: nowrap;
    cursor: pointer;
    border-radius: 0 var(--r-full) var(--r-full) 0;
    transition: background var(--t-fast);
}

.ma-search button:hover {
    background: var(--c-red-500);
}

.ma-search button:active {
    background: var(--c-red-700);
}

/* 计数：随 loading / 失败 / 筛选三态变化（aria-live 已挂模板），单行不折 */
.ma-count {
    margin: 0;
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--c-ink-2);
    white-space: nowrap;
}

/* 折角提示条（静默回读失败）：左 3px 红条 */
.ma-notice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s4);
    margin-top: var(--s4);
    padding: var(--s2) var(--s4);
    background: var(--c-paper-2);
    border-left: 3px solid var(--c-red-600);
    font-size: var(--text-sm);
    color: var(--c-ink-2);
}

.ma-notice button {
    min-height: 44px;
    padding: 0 var(--s4);
    border: 1px solid var(--c-red-600);
    border-radius: var(--r-sm);
    background: var(--c-white);
    color: var(--c-red-600);
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
    cursor: pointer;
    transition: background var(--t-fast), color var(--t-fast);
}

.ma-notice button:hover {
    background: var(--c-red-600);
    color: var(--c-white);
}

/* ══ 栅格：桌面 4 列（固定列数 → 卡片 273–333px，稀疏结果不被拉伸变形）；
   卡片等高由栅格拉伸保证（.ma-card height:100%）；断点 1200 / 900 / 600 逐级降 3 / 2 / 1 列 ══ */
.ma-grid-wrap {
    margin-top: var(--s5);
    scroll-margin-top: calc(var(--header-h) + var(--s4));
}

/* ══ 工作流档落位：内嵌 WorkflowList 的根节点。
   卡片栅格、主题令牌、筛选工具条全由组件自带（其 --wf-* 走 --ag-theme-* 回落即绛红宣纸），
   本页只对齐 .ma-grid-wrap 的外距与锚点偏移，不改组件内部任何样式。 ══ */
.ma-wf {
    margin-top: var(--s5);
    scroll-margin-top: calc(var(--header-h) + var(--s4));
}

.ma-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--s5);
}

.ma-slot {
    min-width: 0;
}

/* 列表项入场：切范围 / 提交检索后逐个落位（16px 上移归位） */
@keyframes maSlotIn {
    from {
        opacity: 0;
        transform: translateY(16px);
    }

    to {
        opacity: 1;
        transform: none;
    }
}

.ma-enter {
    animation: maSlotIn var(--t-base) backwards;
}

.ma-slot.is-busy .ma-card {
    opacity: .6;
}

.ma-slot.is-busy .ma-btn {
    pointer-events: none;
}

/* ══ 卡片：与「我的收藏」卡同构（直角 + 发丝描边 + 发丝分割操作行） ══ */
.ma-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: 0;
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    transition: transform var(--t-base), box-shadow var(--t-base), opacity var(--t-base);
}

/* 缩略带：42px 高 + 右下 18px 切角；四色渐变按 4n 循环（与广场同序列） */
.ma-thumb {
    position: relative;
    flex-shrink: 0;
    height: 42px;
    overflow: hidden;
    background: linear-gradient(135deg, var(--c-red-600), var(--c-gold-500));
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
}

.ma-grid .ma-slot:nth-child(4n+2) .ma-thumb {
    background: linear-gradient(135deg, #2e5a4a, var(--c-gold-500));
}

.ma-grid .ma-slot:nth-child(4n+3) .ma-thumb {
    background: linear-gradient(135deg, var(--c-red-500), #5a2e6e);
}

.ma-grid .ma-slot:nth-child(4n) .ma-thumb {
    background: linear-gradient(135deg, #1e4a7a, var(--c-red-600));
}

/* 类型标：白底压图，左上角 */
.ma-tag {
    position: absolute;
    left: var(--s2);
    top: var(--s2);
    padding: 2px var(--s2);
    background: var(--c-white);
    border: 1px solid var(--c-red-600);
    color: var(--c-red-600);
    font-family: var(--font-body);
    font-size: var(--text-xs);
    line-height: var(--leading-tight);
}

.ma-tag.flow {
    border-color: var(--c-gold-500);
    color: #B36A10;
}

/* 状态标：右上角白底压图，带文字（非仅颜色）；三态各有文字 + 描边差异 */
.ma-state-mark {
    position: absolute;
    right: var(--s2);
    top: var(--s2);
    padding: 2px var(--s2);
    background: var(--c-white);
    border: 1px solid var(--c-border);
    color: var(--c-muted);
    font-family: var(--font-body);
    font-size: var(--text-xs);
    line-height: var(--leading-tight);
}

.ma-state-mark.is-published {
    border-color: var(--c-red-600);
    color: var(--c-red-600);
}

.ma-state-mark.is-draft {
    border-color: var(--c-gold-500);
    color: #B36A10;
}

.ma-state-mark.is-disabled {
    border-color: var(--c-ink-2);
    color: var(--c-ink-2);
}

/* 收藏★：缩略带右上角；已收藏转金色并翻转一次 */
.ma-star {
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

.ma-star.is-on {
    color: var(--c-gold-500);
    opacity: 1;
    animation: maStarFlip .5s ease;
}

@keyframes maStarFlip {
    0% { transform: rotateY(0); }
    50% { transform: rotateY(180deg); }
    100% { transform: rotateY(360deg); }
}

/* 卡体：头像 / 名称 / 描述 / 元信息，flex:1 把操作行压到卡底 */
.ma-body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: var(--s2);
    min-width: 0;
    padding: var(--s3) var(--s4) var(--s3);
}

/* 圆章头像：40px，水平居中；三态共用此外壳 */
.ma-avatar {
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

.ma-avatar i {
    font-size: var(--text-lg);
    line-height: 1;
}

/* 名称：与头像同中轴居中，锁单行 */
.ma-name {
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

/* 描述：恒占三行（clamp 3 + 最小高），左对齐（多行居中会产生锯齿边） */
.ma-desc {
    margin: 0;
    font-size: var(--text-xs);
    line-height: var(--leading-body);
    color: var(--c-ink-2);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: calc(var(--text-xs) * var(--leading-body) * 3);
    overflow-wrap: anywhere;
}

/* 空描述：占位文走次文色，与真实描述一眼可辨 */
.ma-desc.is-empty {
    color: var(--c-muted);
}

/* 元信息行：使用次数 · 更新日期，单行省略，完整时间走 title */
.ma-meta {
    display: flex;
    align-items: center;
    gap: var(--s2);
    margin: auto 0 0;
    font-size: var(--text-xs);
    line-height: var(--leading-body);
    color: var(--c-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.ma-meta-dot {
    color: var(--c-border);
}

/* ══ 操作行：发丝虚线分割（同收藏卡），按钮可换行成 2×3 ══ */
.ma-act {
    flex-shrink: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--s2);
    padding: var(--s2) var(--s4) var(--s3);
    border-top: 1px dashed rgba(153, 42, 24, .25);
}

.ma-btn {
    flex: 0 1 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    padding: 0 var(--s3);
    border: 1px solid var(--c-border);
    border-radius: var(--r-sm);
    background: var(--c-white);
    color: var(--c-ink-2);
    font-family: var(--font-body);
    font-size: var(--text-xs);
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    transition: background var(--t-fast), border-color var(--t-fast), color var(--t-fast);
}

.ma-btn:hover {
    background: var(--c-red-100);
    border-color: var(--c-red-600);
    color: var(--c-red-600);
}

.ma-btn:active {
    background: var(--c-red-600);
    border-color: var(--c-red-600);
    color: var(--c-white);
}

/* 主操作（运行）：实底绛红；不可运行时保持可聚焦 + aria-disabled，三通道给出原因 */
.ma-btn--primary {
    border-color: var(--c-red-600);
    background: var(--c-red-600);
    color: var(--c-white);
}

.ma-btn--primary:hover {
    background: var(--c-red-500);
    border-color: var(--c-red-500);
    color: var(--c-white);
}

.ma-btn--primary:active {
    background: var(--c-red-700);
    border-color: var(--c-red-700);
    color: var(--c-white);
}

.ma-btn--primary[aria-disabled='true'] {
    background: var(--c-paper-2);
    border-color: var(--c-border);
    border-style: dashed;
    color: var(--c-muted);
    cursor: default;
}

.ma-btn--primary[aria-disabled='true']:hover,
.ma-btn--primary[aria-disabled='true']:active {
    background: var(--c-paper-2);
    border-color: var(--c-border);
    color: var(--c-muted);
}

/* 危险操作（删除）：常态红字红边，hover 反白 */
.ma-btn--danger {
    color: var(--c-red-600);
    border-color: rgba(153, 42, 24, .4);
}

.ma-btn--danger:hover {
    background: var(--c-red-600);
    border-color: var(--c-red-600);
    color: var(--c-white);
}

.ma-btn--danger:active {
    background: var(--c-red-700);
    border-color: var(--c-red-700);
    color: var(--c-white);
}

/* 收藏卡主操作：整宽「开始对话 →」 */
.ma-btn-chat {
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

.ma-btn-chat:hover {
    background: var(--c-red-500);
}

.ma-btn-chat:active {
    background: var(--c-red-700);
}

/* ══ 空态 / 错误态 ══ */
.ma-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--s3);
    min-height: 320px;
    padding: var(--s10) var(--s6);
    background: var(--c-white);
    border: 1px dashed var(--c-border);
    text-align: center;
}

.ma-state--plain {
    background: transparent;
    border: 0;
}

.ma-state-seal {
    position: relative;
    width: 88px;
    height: 88px;
    display: grid;
    place-items: center;
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    line-height: 1;
    color: var(--c-red-600);
    background: linear-gradient(160deg, #fff8ef, var(--c-paper));
    box-shadow: inset 0 0 0 4px var(--c-red-100);
    border-radius: var(--r-full);
}

.ma-state-seal::after {
    content: '';
    position: absolute;
    inset: calc(var(--s2) * -1);
    border: 1px dashed var(--c-red-600);
    border-radius: var(--r-full);
    pointer-events: none;
    transition: transform .5s ease;
}

.ma-state-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xl);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

.ma-state-text {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--c-ink-2);
}

.ma-state-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: var(--s3);
    margin-top: var(--s2);
}

.ma-state-btn {
    min-height: 44px;
    padding: 0 var(--s6);
    border: 0;
    border-radius: var(--r-sm);
    background: var(--c-red-600);
    color: var(--c-white);
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
    cursor: pointer;
    transition: background var(--t-fast);
}

.ma-state-btn:hover {
    background: var(--c-red-500);
}

.ma-state-btn:active {
    background: var(--c-red-700);
}

/* ══ 骨架屏：结构镜像真卡 → 与真卡同高，加载结束零跳变 ══ */
.ma-sk-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--c-white);
    border: 1px solid var(--c-border);
    overflow: hidden;
}

.ma-sk-thumb {
    height: 42px;
    background: var(--c-paper);
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
    animation: maPulse 1.2s ease-in-out infinite;
}

.ma-sk-body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: var(--s2);
    padding: var(--s3) var(--s4);
}

.ma-sk-avatar {
    width: var(--s10);
    height: var(--s10);
    margin: 0 auto;
    border-radius: var(--r-full);
    background: var(--c-red-100);
    animation: maPulse 1.2s ease-in-out infinite;
}

.ma-sk-name {
    width: 70%;
    height: calc(var(--text-base) * var(--leading-body));
    margin: 0 auto;
    border-radius: var(--r-sm);
    background: var(--c-red-100);
    animation: maPulse 1.2s ease-in-out infinite;
}

.ma-sk-desc {
    display: flex;
    flex-direction: column;
    gap: var(--s1);
    width: 92%;
    height: calc(var(--text-xs) * var(--leading-body) * 3);
}

.ma-sk-sub {
    flex: 1;
    min-height: 0;
    border-radius: var(--r-sm);
    background: var(--c-red-100);
    animation: maPulse 1.2s ease-in-out infinite;
}

.ma-sk-meta {
    width: 60%;
    height: var(--text-xs);
    margin-top: auto;
    border-radius: var(--r-sm);
    background: var(--c-red-100);
    animation: maPulse 1.2s ease-in-out infinite;
}

.ma-sk-act {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s2);
    padding: var(--s2) var(--s4) var(--s3);
    border-top: 1px dashed rgba(153, 42, 24, .25);
}

.ma-sk-btn {
    width: 46px;
    height: 30px;
    border-radius: var(--r-sm);
    background: var(--c-red-100);
    animation: maPulse 1.2s ease-in-out infinite;
}

/* 全页唯一 infinite：仅加载态出现 */
@keyframes maPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .45; }
}

/* ══ hover / press 反馈（触屏不误触发位移） ══ */
@media (hover: hover) {
    .ma-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
    }

    .ma-state:hover .ma-state-seal::after {
        transform: rotateY(180deg);
    }
}

/* ══ ≤1200：栅格降 3 列（卡片 304–437px；操作行 5 钮整行不再换行） ══ */
@media (max-width: 1200px) {
    .ma-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

/* ══ ≤900：栅格降 2 列 + 工具条纵向堆叠（chips 一行、计数与检索一行）+ 内衬同收 --s4 ══ */
@media (max-width: 900px) {
    .ma-page {
        padding: calc(var(--header-h) + var(--s6)) var(--s4) var(--s12);
    }

    .ma-title {
        font-size: var(--text-xl);
    }

    .ma-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    /* 入场直出全显（等效 data-delay 全置 0）——须与 .ma-page.is-view 规则同权重才能盖过它 */
    .ma-effect,
    .ma-page.is-view .ma-effect {
        opacity: 1;
        animation: none;
    }

    .ma-toolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .ma-toolbar-right {
        justify-content: space-between;
    }

    .ma-search {
        flex: 1 1 auto;
        width: auto;
    }
}

/* ══ ≤600：栅格收 1 列 + 页头纵向堆叠（新建钮整宽），手机一屏一卡 ══ */
@media (max-width: 600px) {
    .ma-head {
        flex-direction: column;
        align-items: flex-start;
    }

    .ma-create {
        width: 100%;
        justify-content: center;
    }

    .ma-grid {
        grid-template-columns: minmax(0, 1fr);
    }

    .ma-toolbar-right {
        flex-direction: column;
        align-items: stretch;
        gap: var(--s2);
    }
}

/* ══ 动效降级：reduce 全量直出，去上浮与翻转 ══ */
@media (prefers-reduced-motion: reduce) {
    .ma-effect,
    .ma-page.is-view .ma-effect {
        opacity: 1;
        animation: none;
    }

    .ma-enter {
        animation: none;
    }

    .ma-sk-thumb,
    .ma-sk-avatar,
    .ma-sk-name,
    .ma-sk-sub,
    .ma-sk-meta,
    .ma-sk-btn {
        animation: none;
    }

    .ma-card,
    .ma-card:hover {
        transform: none;
    }

    .ma-state:hover .ma-state-seal::after,
    .ma-star.is-on {
        animation: none;
        transform: none;
    }

    .ma-state-seal::after,
    .ma-skip {
        transition: none;
    }
}
</style>
