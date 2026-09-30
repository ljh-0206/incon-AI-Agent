<template>
    <!-- 智能体广场：128px 全幅 banner + 全幅工具带（单行：筛选 chips 左 / 搜索右） + 内容列（栏目头/网格/分页）+ 绛红页脚 -->
    <!-- 设计依据：mimo/portal-agents设计计划-mimo.md（D1–D10；文末变更记录 v1.1–v1.8 为最新权威，v1.8 = 五条卡片调整）；功能契约与原实现一致 -->
    <PortalLayout :solid="true">
        <main class="pg-wrap">
            <!-- 跳过导航（v3 §6 A11y），直达列表锚点 -->
            <a class="pg-skip" href="#pg-grid">跳到智能体列表</a>

            <!-- ══ BANNER：全幅 128px，绛红渐变 + 左列 kicker/标题/副题（v1.1 调整 3：右侧统计列已去除），底缘 2px 金线 ══ -->
            <section class="pg-banner" aria-label="智能体广场横幅">
                <div class="pg-banner-inner">
                    <div class="pg-banner-main">
                        <div class="pg-kicker effect" data-delay="0"><span aria-hidden="true">◈</span>智能体服务门户 · AGENT PLAZA</div>
                        <h1 class="pg-banner-title effect" data-delay="1">智能体广场</h1>
                        <p class="pg-banner-sub effect" data-delay="2">浏览 · 筛选 · 一键进入对话</p>
                    </div>
                </div>
            </section>

            <!-- ══ 工具带：全幅白带 flush 贴 banner（无阴影无圆角），内衬左缘 3px 红条；单行 = 筛选左 / 搜索右（v1.1 调整 4） ══ -->
            <section class="pg-toolbar effect" aria-label="搜索与筛选">
                <div class="pg-toolbar-inner">
                    <!-- 左：筛选 chips（类型 + 排序）；容器必须可换行（ui-ux-pro-max High），DOM 序 = 视觉序 = Tab 序 -->
                    <div class="pg-controls">
                        <!-- 类型 chips：原生 button + aria-pressed，选中 = 实线 + ◈ + 底色（非仅颜色） -->
                        <div class="pg-chips" role="group" aria-label="类型筛选">
                            <button
                                v-for="t in typeOptions"
                                :key="'chip-' + t.value"
                                type="button"
                                class="pg-chip"
                                :aria-pressed="typeFilter === t.value ? 'true' : 'false'"
                                @click="setType(t.value)"
                            ><span v-if="typeFilter === t.value" class="pg-chip-mark" aria-hidden="true">◈</span>{{ t.label }}</button>
                        </div>
                        <!-- 排序：同 chip 的 aria-pressed + ◈ 编码 -->
                        <div class="pg-sorts" role="group" aria-label="排序方式">
                            <span class="pg-sorts-label">排序</span>
                            <button
                                v-for="s in sortOptions"
                                :key="'sort-' + s.value"
                                type="button"
                                class="pg-chip"
                                :aria-pressed="sortBy === s.value ? 'true' : 'false'"
                                @click="setSort(s.value)"
                            ><span v-if="sortBy === s.value" class="pg-chip-mark" aria-hidden="true">◈</span>{{ s.label }}</button>
                        </div>
                    </div>

                    <!-- 右：搜索表单（v1.3 调整 9：宽 400 保证 placeholder 桌面完整可见 · 2px 红框 + shadow-md）；O1：提交才写 keyword -->
                    <form class="pg-search-row" role="search" @submit="onSearchSubmit">
                        <label class="pg-sr-only" for="pg-agent-search">搜索智能体</label>
                        <input
                            id="pg-agent-search"
                            v-model="searchInput"
                            type="search"
                            autocomplete="off"
                            placeholder="搜索智能体名称或简介"
                        />
                        <button type="submit">检索</button>
                    </form>
                </div>
            </section>

            <!-- ══ 内容列（--pg-max 1200 内衬，与 banner/工具带内衬同线） ══ -->
            <div class="pg-col">
                <!-- 栏目头：动态标题（v1.3 调整 7：关键词优先） + ◈ + 计数（aria-live，含第 X/Y 页） -->
                <section class="pg-channel effect" aria-label="列表栏目头">
                    <h2 class="pg-channel-title">{{ channelTitle }}<span class="pg-sep" aria-hidden="true">◈</span></h2>
                    <p class="pg-channel-sub" aria-live="polite">{{ countText }}</p>
                </section>

                <!-- 折角提示条：加载失败即时 alert 通道 -->
                <div v-if="loadError" class="pg-notice" role="alert">
                    <span>列表加载失败，请稍后重试</span>
                    <button type="button" @click="loadList">重试</button>
                </div>

                <!-- ══ 卡片网格 / 骨架 / 空态 / 错误态（aria-busy 随 loading；加载期容器 aria-label 换「正在加载…」，§3.10） ══ -->
                <section
                    ref="gridSection"
                    id="pg-grid"
                    tabindex="-1"
                    class="pg-grid-wrap"
                    :aria-label="loading ? '正在加载智能体列表' : '智能体列表'"
                    :aria-busy="loading ? 'true' : 'false'"
                >
                    <!-- 骨架：10 格，结构镜像真卡 → 等高无跳变 -->
                    <div v-if="loading" class="pg-grid pg-skeleton" aria-hidden="true">
                        <div v-for="i in 10" :key="'sk-' + i" class="pg-sk-card">
                            <div class="pg-sk-thumb"></div>
                            <div class="pg-sk-body">
                                <div class="pg-sk-avatar"></div>
                                <div class="pg-sk-name"></div>
                                <div class="pg-sk-desc">
                                    <div class="pg-sk-sub"></div>
                                    <div class="pg-sk-sub"></div>
                                    <div class="pg-sk-sub"></div>
                                </div>
                            </div>
                            <div class="pg-sk-act">
                                <div class="pg-sk-btn"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 错误态：只出错误 + 重试，无任何演示数据（状态卡 role=alert，§3.11；壳本次不动） -->
                    <div v-else-if="loadError" class="pg-state" role="alert">
                        <span class="pg-state-seal" aria-hidden="true">◈</span>
                        <p class="pg-state-title">列表加载失败</p>
                        <p class="pg-state-text">网络或服务异常，请稍后重试</p>
                        <div class="pg-state-actions">
                            <button type="button" class="pg-state-btn" @click="loadList">重试</button>
                        </div>
                    </div>

                    <!-- 空态分两种：筛选无结果（v1.3 调整 8：透明壳 + 单钮「重置」） / 真空（接口成功但无已上线，壳不动） -->
                    <div v-else-if="filteredList.length === 0" class="pg-state pg-state--plain">
                        <span class="pg-state-seal" aria-hidden="true">◈</span>
                        <template v-if="onlineList.length > 0">
                            <p class="pg-state-title">没有匹配的智能体</p>
                            <p class="pg-state-text">换个关键词或类型试试，或点击「重置」</p>
                            <!-- 单一动作：重置 = 清关键词 + 类型 + 回第 1 页 + 焦点回检索框（clearFilters） -->
                            <div class="pg-state-actions">
                                <button type="button" class="pg-state-btn" @click="clearFilters">重置</button>
                            </div>
                        </template>
                        <template v-else>
                            <p class="pg-state-title">暂无已上线的智能体</p>
                            <p class="pg-state-text">新发布的智能体将出现在这里</p>
                            <!-- 主钮 + 次文字钮（§6.2 双通道出口） -->
                            <div class="pg-state-actions">
                                <button type="button" class="pg-state-btn" @click="goCreate">去配置一个</button>
                                <button type="button" class="pg-state-link" @click="goHome">← 返回首页</button>
                            </div>
                        </template>
                    </div>

                    <!-- 列表：key = 筛选状态，换页/筛选时重建 → 入场动画原地重放 -->
                    <div v-else :key="gridKey" class="pg-grid">
                        <article
                            v-for="(item, i) in pageItems"
                            :key="'card-' + item.id"
                            class="pg-slot effect"
                            :style="{ transitionDelay: (i % 10) * 0.05 + 's' }"
                        >
                            <!-- 整卡不挂 click（无 div[onclick]）；主操作 = 底部常驻按钮 -->
                            <div class="pg-card">
                                <!-- 缩略图：四色渐变按 4n 循环 + 左上类型标 + 右上收藏 + 右下 18px 切角（v1.3 调整 2 已去 glyph） -->
                                <div class="pg-thumb">
                                    <span :class="['pg-tag', { flow: item.appType === 'workflow' }]">{{ item.appType === 'workflow' ? '流程助手' : '标准助手' }}</span>
                                    <button
                                        type="button"
                                        class="pg-star"
                                        :class="{ 'is-on': isStarred(item) }"
                                        :aria-pressed="isStarred(item) ? 'true' : 'false'"
                                        :aria-label="(isStarred(item) ? '取消收藏《' : '收藏《') + displayName(item) + '》'"
                                        @click="toggleStar(item)"
                                    >{{ isStarred(item) ? '★' : '☆' }}</button>
                                </div>
                                <div class="pg-body">
                                    <!-- 智能体图片（v1.8 调整 2）：三态同门户首页头像范式——
                                         image = 图片 ID 铺背景圆章 / icon = 图标类名圆内居中（均 role=img + aria-label）；
                                         disc = 名称首字兜底，紧邻 h3 名称属装饰 → aria-hidden -->
                                    <span
                                        v-if="item.avatarKind === 'image'"
                                        class="pg-avatar"
                                        role="img"
                                        :aria-label="displayName(item) + ' 头像'"
                                        :style="avatarBgStyle(item.avatarValue)"
                                    ></span>
                                    <span
                                        v-else-if="item.avatarKind === 'icon'"
                                        class="pg-avatar"
                                        role="img"
                                        :aria-label="displayName(item) + ' 头像'"
                                    ><i :class="item.avatarValue" aria-hidden="true"></i></span>
                                    <span v-else class="pg-avatar" aria-hidden="true">{{ item.avatarDisc }}</span>
                                    <!-- 名称（v1.8 调整 3）：居中与头像同轴，仍锁单行 clamp -->
                                    <h3 class="pg-name">{{ displayName(item) }}</h3>
                                    <!-- 描述恒占 3 行（v1.3 调整 5）；空文案由占位文填充；
                                         v1.8 调整 4：有描述才挂原生 title 悬停看全文（.pg-card overflow:hidden 会裁自定义浮层） -->
                                    <p class="pg-desc" :title="item.description || null">{{ item.description || '这个智能体还没有简介' }}</p>
                                </div>
                                <!-- 主操作常驻，不依赖 hover（v1.3 调整 1：32 高小钮） -->
                                <div class="pg-act">
                                    <button type="button" class="pg-btn-chat" @click="goRun(item)">开始对话 →</button>
                                </div>
                            </div>
                        </article>
                    </div>
                </section>

                <!-- ══ 分页（v1.4 调整 1）：有结果即显示——单页显「‹ 1 ›」（两箭头 disabled、当前页高亮），多页省略号窗口不变；10 条/页、40px 圆钮 ══ -->
                <nav v-if="!loading && !loadError && filteredList.length > 0" class="pg-pager" aria-label="分页">
                    <button
                        type="button"
                        class="pg-page-btn arrow"
                        :disabled="page <= 1"
                        aria-label="上一页"
                        @click="setPage(page - 1)"
                    >‹</button>
                    <template v-for="(n, idx) in pageWindow" :key="'pw-' + idx">
                        <span v-if="n === '…'" class="pg-page-ellipsis" aria-hidden="true">…</span>
                        <button
                            v-else
                            type="button"
                            class="pg-page-btn"
                            :aria-current="n === page ? 'page' : null"
                            :aria-label="'第' + n + '页'"
                            @click="setPage(n)"
                        >{{ n }}</button>
                    </template>
                    <button
                        type="button"
                        class="pg-page-btn arrow"
                        :disabled="page >= totalPages"
                        aria-label="下一页"
                        @click="setPage(page + 1)"
                    >›</button>
                </nav>
            </div>

            <!-- ══ 页脚：共享组件 PortalFooter（v1.5：与门户首页一致——居中版权行；v1.6：去除 .effect——页脚低于入场观察器 85% 触发线，带 effect 会常驻 opacity:0 不可见） ══ -->
            <PortalFooter class="pg-foot" />
        </main>
    </PortalLayout>
</template>

<script>
    import PortalLayout from '../components/PortalLayout.vue'
    import PortalFooter from '../components/PortalFooter.vue'
    import {
        agentAppList,
        agentAppFavorites,
        agentAppFavorite,
        agentAppUnfavorite
    } from '@/api/agentApp'

    export default {
        name: 'PortalAgents',

        components: {
            PortalLayout,
            PortalFooter
        },

        data () {
            return {
                // ===== 列表加载态（无演示数据：异常只出错误态） =====
                loading: false,
                loadError: false,
                rawList: [],

                // ===== 搜索 / 筛选 / 排序 / 分页（全前端管线） =====
                keyword: '', // 已应用的检索词（提交时写入；gridKey 只认它，键入不触发重建）
                searchInput: '', // 输入框本地模型（O1：回车/检索提交才落到 keyword）
                typeFilter: 'all',
                sortBy: 'cjsj',
                page: 1,
                pageSize: 10,

                // ===== 收藏（v1.4 调整 3：服务端收藏集合，mounted 与列表并行加载；存 id 字符串） =====
                favIds: [],

                // ===== chips / 排序选项 =====
                typeOptions: [
                    { value: 'all', label: '全部' },
                    { value: 'standard', label: '标准' },
                    { value: 'workflow', label: '流程' }
                ],
                sortOptions: [
                    { value: 'cjsj', label: '最新发布' },
                    { value: 'name', label: '名称' }
                ]
            }
        },

        computed: {
            // 上线列表：唯一口径 status === 'published'（不叠加 enabled）
            onlineList () {
                return this.rawList.filter(item => this.isOnline(item))
            },

            // 过滤管线：搜索 → 类型 → 排序
            filteredList () {
                const kw = (this.keyword || '').trim().toLowerCase()
                let list = this.onlineList.filter(item => {
                    if (this.typeFilter !== 'all' && item.appType !== this.typeFilter) return false
                    if (kw) {
                        const name = String(item.name || '').toLowerCase()
                        const desc = String(item.description || '').toLowerCase()
                        if (name.indexOf(kw) === -1 && desc.indexOf(kw) === -1) return false
                    }
                    return true
                })
                if (this.sortBy === 'name') {
                    list = list.slice().sort((a, b) => {
                        return String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans-CN')
                    })
                } else {
                    // 最新发布：cjsj 倒序（非法日期按 0 处理）
                    list = list.slice().sort((a, b) => {
                        const tb = new Date(b.cjsj).getTime() || 0
                        const ta = new Date(a.cjsj).getTime() || 0
                        return tb - ta
                    })
                }
                return list
            },

            // 当前页 10 条
            pageItems () {
                const start = (this.page - 1) * this.pageSize
                return this.filteredList.slice(start, start + this.pageSize)
            },

            totalPages () {
                return Math.max(1, Math.ceil(this.filteredList.length / this.pageSize))
            },

            // 分页省略号窗口：≤7 全显，否则 1 … p-1 p p+1 … N
            pageWindow () {
                const total = this.totalPages
                const cur = this.page
                if (total <= 7) {
                    const all = []
                    for (let n = 1; n <= total; n++) all.push(n)
                    return all
                }
                const win = [1]
                if (cur > 3) win.push('…')
                const from = Math.max(2, cur - 1)
                const to = Math.min(total - 1, cur + 1)
                for (let n = from; n <= to; n++) win.push(n)
                if (cur < total - 2) win.push('…')
                win.push(total)
                return win
            },

            // 网格重建键：换页 / 筛选 / 搜索时触发入场动画原地重放
            gridKey () {
                return this.page + '|' + this.typeFilter + '|' + this.sortBy + '|' + this.keyword
            },

            // 栏目头标题（v1.3 调整 7）：关键词优先，其次类型；默认「全部智能体」
            channelTitle () {
                if ((this.keyword || '').trim()) return '搜索结果'
                if (this.typeFilter === 'standard') return '标准助手'
                if (this.typeFilter === 'workflow') return '流程助手'
                return '全部智能体'
            },

            // 栏目头计数（v1.3 调整 7 + v1.9 调整 2）：默认态不展示「当前筛选 M 个」；**不再追加分页信息**
            countText () {
                if (this.loading) return '加载中…'
                if (this.loadError) return '列表加载失败'
                const kw = (this.keyword || '').trim()
                const isDefault = !kw && this.typeFilter === 'all'
                let t = '共 ' + this.onlineList.length + ' 个已上线'
                if (!isDefault) t += ' · 当前筛选 ' + this.filteredList.length + ' 个'
                return t
            }
        },

        watch: {
            // 筛选/搜索变化 → 回第 1 页
            keyword () {
                this.page = 1
            },
            typeFilter () {
                this.page = 1
            },
            sortBy () {
                this.page = 1
            },
            // 首页 ?q= 同路由跳转回填（keyword 生效 + 输入框回显）
            '$route.query.q' (q) {
                this.keyword = q ? String(q) : ''
                this.searchInput = this.keyword
            },
            // 列表数据变化后重新激活入场观察
            pageItems () {
                this.$nextTick(() => this.setupObserver())
            }
        },

        mounted () {
            this._effectObserver = null
            // 接收首页 ?q=（keyword 生效 + 输入框 searchInput 回显）
            const q = this.$route.query.q ? String(this.$route.query.q) : ''
            this.keyword = q
            this.searchInput = q
            this.loadFavorites()
            this.loadList()
            this.$nextTick(() => this.setupObserver())
        },

        beforeUnmount () {
            if (this._effectObserver) {
                this._effectObserver.disconnect()
                this._effectObserver = null
            }
        },

        methods: {
            // ---------- 上线判定：唯一口径 ----------
            isOnline (item) {
                return !!item && item.status === 'published'
            },

            // ---------- 数据加载（异常 → 错误态；空数组 → 真空空态；无演示数据） ----------
            async loadList () {
                this.loading = true
                this.loadError = false
                try {
                    const data = await agentAppList()
                    const list = Array.isArray(data) ? data : []
                    // v1.8 调整 2：入列前预判头像三态（字段 avatar || icon，判别式照抄首页 resolveAvatar）；
                    // 首字兜底走本页 displayName（占位名「未命名智能体」），保证圆章首字与显示名一致
                    this.rawList = list.map(row => {
                        const av = this.resolveAvatar(row && (row.avatar || row.icon))
                        const nm = this.displayName(row)
                        return Object.assign({}, row, {
                            avatarKind: av.kind,
                            avatarValue: av.kind === 'disc' ? '' : av.value,
                            avatarDisc: nm.slice(0, 1)
                        })
                    })
                } catch (e) {
                    this.loadError = true
                    this.rawList = []
                } finally {
                    this.loading = false
                }
            },

            // ---------- 搜索 / 筛选 / 排序 ----------
            // O1：提交（回车/检索钮）才把输入框内容写入 keyword → 网格只在提交/筛选/换页时重建重放
            onSearchSubmit (e) {
                if (e && e.preventDefault) e.preventDefault()
                this.searchInput = (this.searchInput || '').trim()
                this.keyword = this.searchInput
                this.page = 1
            },

            // 筛选空态唯一动作「重置」（v1.3 调整 8）：清关键词 + 类型 + 回第 1 页；焦点交还检索框
            clearFilters () {
                this.keyword = ''
                this.searchInput = ''
                this.typeFilter = 'all'
                this.page = 1
                this.$nextTick(() => this.focusEl('#pg-agent-search'))
            },

            // 焦点管理辅助：在本组件 DOM 内查找并聚焦（找不到则静默）
            focusEl (sel) {
                const el = this.$el && this.$el.querySelector ? this.$el.querySelector(sel) : null
                if (el && el.focus) el.focus()
            },

            setType (t) {
                this.typeFilter = t
            },

            setSort (s) {
                this.sortBy = s
            },

            // ---------- 分页 ----------
            setPage (n) {
                const target = Math.min(Math.max(1, n), this.totalPages)
                if (target === this.page) return
                this.page = target
                // v1.9 调整 1：仅当网格顶部已滚出视口上方时才锚回网格顶——
                // 修复「页面未滚到底时点击分页被强制向下滚动」；网格仍在视口内则不动滚动条
                this.$nextTick(() => {
                    const el = this.$refs.gridSection
                    if (!el || !el.scrollIntoView) return
                    const cs = window.getComputedStyle(document.body)
                    const headerH = parseInt(cs.getPropertyValue('--header-h'), 10) || 0
                    const gap = parseInt(cs.getPropertyValue('--s4'), 10) || 0
                    if (el.getBoundingClientRect().top < headerH + gap) {
                        el.scrollIntoView({
                            behavior: this.reduceMotion() ? 'auto' : 'smooth',
                            block: 'start'
                        })
                    }
                })
            },

            // ---------- 跳转 ----------
            goRun (item) {
                if (!item || !item.id) return
                this.$router.push('/portal/agents/' + item.id + '/run')
            },

            goCreate () {
                this.$router.push('/portal/create/agent')
            },

            // 返回首页走 router（避免整页刷新），href 保留语义
            goHome () {
                this.$router.push('/portal/home')
            },

            // ---------- 收藏（v1.4 调整 3：服务端实现，对齐参照页 AgentAppHome.vue） ----------
            // 加载收藏集合：与列表并行；失败静默降级为空集合（不阻塞列表、不显示假状态）
            async loadFavorites () {
                try {
                    const fav = await agentAppFavorites()
                    const list = Array.isArray(fav) ? fav : []
                    this.favIds = list.filter(x => x && x.id != null).map(x => String(x.id))
                } catch (e) {
                    this.favIds = []
                }
            },

            isStarred (item) {
                return this.favIds.indexOf(String(item.id)) !== -1
            },

            // 收藏切换：await 接口成功后才更新本地集合 + 成功提示；失败提示且不改本地状态
            async toggleStar (item) {
                if (!item || !item.id) return
                const id = String(item.id)
                try {
                    if (this.isStarred(item)) {
                        await agentAppUnfavorite(item.id)
                        this.favIds = this.favIds.filter(x => x !== id)
                        this.$Message.success('已取消收藏')
                    } else {
                        await agentAppFavorite(item.id)
                        this.favIds = this.favIds.concat([id])
                        this.$Message.success('已收藏')
                    }
                } catch (e) {
                    this.$Message.error('操作失败')
                }
            },

            // ---------- 头像三态（v1.8 调整 2：判别逻辑照抄门户首页 resolveAvatar） ----------
            // 后端 avatar 无类型字段，按形态启发式判别：
            //   1) 空 / undefined → kind 'disc'（模板回落名称首字）；
            //   2) 含空格，或以 fa-/fa /icon（及 mdi、bi、ri、pi、ant、el 等前缀）开头 → kind 'icon'（类名直用）；
            //   3) 其余且长度 > 2 → kind 'image'（图片 ID，短串不当 ID）；
            //   4) 长度 ≤ 2 的非图标串（如旧单字 avatar）→ kind 'disc'，避免空圆章。
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

            // 图片态背景：commonsJs.getBackgroundImage(id, true) + 圆形铺满（同门户首页 avatarBgStyle；
            // commonsJs 为 sharedApp 注册的 app 全局属性，与首页同源可用）；
            // 额外给纸色底，图片 404 时圆章不至于透明
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

            // ---------- 展示辅助 ----------
            displayName (item) {
                return (item && item.name) || '未命名智能体'
            },

            // ---------- 动效 ----------
            reduceMotion () {
                if (window.matchMedia) {
                    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
                }
                return false
            },

            // 入场：≥996 用 IntersectionObserver（视口 85% 显形）；≤996 / reduce 直接全显
            setupObserver () {
                const root = this.$el
                if (!root || !root.querySelectorAll) return
                const nodes = root.querySelectorAll('.effect')
                if (this.reduceMotion() || window.innerWidth <= 996 || !('IntersectionObserver' in window)) {
                    nodes.forEach(n => n.classList.add('isView'))
                    return
                }
                if (this._effectObserver) this._effectObserver.disconnect()
                this._effectObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (!entry.isIntersecting) return
                        entry.target.classList.add('isView')
                        this._effectObserver.unobserve(entry.target)
                    })
                }, { rootMargin: '0px 0px -15% 0px' })
                nodes.forEach(n => {
                    if (!n.classList.contains('isView')) this._effectObserver.observe(n)
                })
            }
        }
    }
</script>

<style scoped lang="less">
/* ══ 页面容器：只让位固定顶栏（v1.7：移除 padding-bottom——footer 直接触底）；
   --pg-max = 1200 页面级内衬（v1.3 调整 6，用户要求）——只作用本页四内衬，不动 PortalLayout 的 --max；
   v1.4 调整 2（sticky footer）：flex column + min-height 视口高（全局 border-box 保证含 padding）——
   内容不足时页脚贴窗口底、内容超出自然下推 ══ */
.pg-wrap {
    --pg-max: 1200px;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-height: 100dvh;
    padding-top: var(--header-h);
}

/* 三段固定件不参与收缩；内容列弹性撑满（.pg-col 规则处） */
.pg-banner,
.pg-toolbar,
.pg-foot {
    flex-shrink: 0;
}

/* ══ 无障碍隐藏（搜索 label） ══ */
.pg-sr-only {
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

/* 跳过导航：默认藏于视口上方，聚焦滑入 */
.pg-skip {
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

.pg-skip:focus {
    top: var(--s4);
}

/* ══ BANNER：全幅 128px，红系 token 渐变 + 金发丝线收边（计划 §2.2；v1.1 调整 3 去右侧列） ══ */
.pg-banner {
    position: relative;
    height: 128px;
    overflow: hidden;
    color: var(--c-white);
    background: linear-gradient(135deg, var(--c-red-700) 0%, var(--c-red-600) 55%, var(--c-red-500) 100%);
    border-bottom: 2px solid var(--c-gold-500);
}

/* 宣纸感发丝斜纹（授权：北中医解析 §2 材质，白 .04） */
.pg-banner::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(115deg, transparent 0 14px, rgba(255, 255, 255, .04) 14px 15px);
    pointer-events: none;
}

/* 单列左对齐（v1.1 调整 3：统计胶囊列去除后不再需要两端对齐）；内衬 --pg-max 1200（v1.3 调整 6） */
.pg-banner-inner {
    position: relative;
    z-index: 1;
    max-width: var(--pg-max);
    height: 100%;
    margin: 0 auto;
    padding: var(--s3) var(--s6);
    display: flex;
    align-items: center;
}

.pg-banner-main {
    min-width: 0;
}

.pg-kicker {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    line-height: 1;
    letter-spacing: var(--tracking-wider);
    color: var(--c-white);
}

.pg-kicker span {
    color: var(--c-gold-500);
    margin-right: var(--s1);
}

.pg-banner-title {
    margin: var(--s1) 0;
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 700;
    letter-spacing: var(--tracking-wide);
    line-height: var(--leading-tight);
    color: var(--c-white);
}

.pg-banner-sub {
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1;
    letter-spacing: var(--tracking-wide);
    color: var(--c-white);
}

/* ══ 工具带（v1.9 调整 3）：去白底与底边框——背景与内容区一致（宣纸），与页面融合；
   flush 贴金线、无阴影无圆角、左缘 3px 红条均保留（计划 §3.4 + v1.1 调整 4 单行化） ══ */
.pg-toolbar {
    background: transparent;
}

/* 单行 flex：左筛选 / 右搜索；内衬左缘留出 3px 红条的偏移；内衬 --pg-max 1200（v1.3 调整 6） */
.pg-toolbar-inner {
    position: relative;
    max-width: var(--pg-max);
    margin: 0 auto;
    padding: var(--s5) var(--s6) var(--s5) calc(var(--s6) + var(--s3));
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--s4) var(--s5);
}

/* 内容左缘 3px 红条：高度覆满单行内容区，与下方卡片列同线（内衬同线保证） */
.pg-toolbar-inner::before {
    content: '';
    position: absolute;
    left: var(--s6);
    top: var(--s5);
    bottom: var(--s5);
    width: 3px;
    background: var(--c-red-600);
}

/* 筛选组（左）：类型 + 排序并排；必须可换行（ui-ux-pro-max High）；v1.1 调整 4：行间发丝分隔线已删除 */
.pg-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s3) var(--s5);
}

.pg-chips,
.pg-sorts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s3);
}

.pg-sorts-label {
    font-size: var(--text-sm);
    color: var(--c-muted);
}

/* chip：44 触点，选中三重编码（底色 + 实线 + ◈） */
.pg-chip {
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

.pg-chip:hover {
    background: var(--c-red-100);
}

.pg-chip:active {
    background: var(--c-red-700);
    color: var(--c-white);
}

.pg-chip[aria-pressed="true"] {
    border-style: solid;
    border-color: var(--c-red-600);
    background: var(--c-red-600);
    color: var(--c-white);
}

.pg-chip-mark {
    margin-right: var(--s1);
}

/* 搜索表单（右）：v3 §5.4 语汇 2px 红框 + shadow-md 保留；
   v1.3 调整 9：宽 360 → 400，配缩短 placeholder 保证桌面完整可见（≤996 仍 max-width:100% 收口） */
.pg-search-row {
    display: flex;
    width: 400px;
    max-width: 100%;
    height: var(--s12);
    border: 2px solid var(--c-red-600);
    background: var(--c-white);
    box-shadow: var(--shadow-md);
    border-radius: var(--r-full);
}

/* input 左圆角与外框胶囊同步；内高 44 = 总高 48 − 上下边框 2×2 */
.pg-search-row input {
    flex: 1;
    min-width: 0;
    padding: 0 var(--s4);
    border: 0;
    background: transparent;
    color: var(--c-ink);
    font-size: var(--text-base);
    border-radius: var(--r-full) 0 0 var(--r-full);
}

.pg-search-row input::placeholder {
    color: var(--c-muted);
}

/* 检索钮右圆角同步；高随行 44（≥44 触点，A3） */
.pg-search-row button {
    flex-shrink: 0;
    padding: 0 var(--s5);
    border: 0;
    background: var(--c-red-600);
    color: var(--c-white);
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wider);
    cursor: pointer;
    border-radius: 0 var(--r-full) var(--r-full) 0;
    transition: background var(--t-fast);
}

.pg-search-row button:hover {
    background: var(--c-red-500);
}

.pg-search-row button:active {
    background: var(--c-red-700);
}

/* ══ 内容列：--pg-max 1200 内衬（v1.3 调整 6），与 banner/工具带同线；
   v1.4 调整 2：flex 1 0 auto 纵向撑满——把页脚推到窗口底 ══ */
.pg-col {
    flex: 1 0 auto;
    max-width: var(--pg-max);
    width: 100%;
    margin: 0 auto;
    padding: 0 var(--s6);
}

/* ══ 栏目头：动态大标题（v1.3 调整 7：关键词 → 类型 → 默认 三级取值） + ◈ + 计数（北中医范式） ══ */
.pg-channel {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--s3) var(--s4);
    margin-top: var(--s8);
}

.pg-channel-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 700;
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

.pg-sep {
    display: inline-block;
    margin-left: var(--s2);
    color: var(--c-red-600);
    transition: transform .5s ease;
}

.pg-channel:hover .pg-sep {
    transform: rotateY(180deg);
}

.pg-channel-sub {
    margin: 0;
    font-size: var(--text-base);
    color: var(--c-ink-2);
}

/* ══ 折角提示条（错误）：左 3px 红条 ══ */
.pg-notice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s4);
    margin-top: var(--s4);
    padding: var(--s2) var(--s4);
    background: var(--c-paper);
    border-left: 3px solid var(--c-red-600);
    font-size: var(--text-sm);
    color: var(--c-ink-2);
}

.pg-notice button {
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

.pg-notice button:hover {
    background: var(--c-red-600);
    color: var(--c-white);
}

/* ══ 网格容器：固定两行 min-height（v1.8 调整 5：消分页翻页抖动）+ 锚定滚动补偿顶栏 ══
   卡高算式（v1.8，真卡与骨架同式同值，换算自 token）：
   整卡 254.8 = 边框 2 + thumb 42
              + body[ pad(12+8) + 头像 40(--s10) + gap8 + name(16×1.65=26.4) + gap8 + desc(12×1.65×3=59.4) ] = 161.8
              + act [ pad(8+8) + border-top 1 + 钮 32(--s8) ] = 49
   两行下限 = 2×254.8 + 行距 20(--s5) = 529.6 → 1 行页与 2 行页内容区等高，翻页不抖；
   空态 / 错误态同落此下限（壳自身 min-height 320 不变）；≤996 自然多行时该值仅作下限 */
.pg-grid-wrap {
    --pg-card-h: 254.8px;
    min-height: calc(2 * var(--pg-card-h) + var(--s5));
    margin-top: var(--s5);
    scroll-margin-top: calc(var(--header-h) + var(--s4));
}

/* 栅格（v1.2：auto-fit → auto-fill，稀疏结果不拉伸变形；v1.3 调整 6 内衬 1200）：
   min 190 → 1200 内衬（内容 1152、gap 20）恰为 5 列，卡片 ≈214px，10 条 = 5×2 整两行；
   空轨道保留——1 条时卡片仍 ≈214px，不被折叠拉伸到整行；宽度不足自然降 4/3/2/1 列，≤996 不新增断点 */
.pg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(190px, 100%), 1fr));
    gap: var(--s5);
}

.pg-slot {
    min-width: 0;
}

/* ══ 卡片：直角 + 发丝描边（计划 D4；v1.1 紧凑化 + v1.3 调整 1/2/4/5 再收 + v1.8 头像/居中名/42 缩略带） ══ */
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

/* 缩略图（v1.8 调整 1）：高 64 → 42px（用户明示取值，非 token，变更记录登记例外）；
   四色渐变按 4n 循环（v3 §1.1 授权序列）、右下 18px 切角、类型标、收藏钮均保留
   （收藏钮 top 8 + 高 32 = 40 ≤ 42，仍完整落在带内） */
.pg-thumb {
    position: relative;
    height: 42px;
    overflow: hidden;
    background: linear-gradient(135deg, var(--c-red-600), var(--c-gold-500));
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
}

.pg-grid .pg-slot:nth-child(4n+2) .pg-thumb {
    background: linear-gradient(135deg, #2e5a4a, var(--c-gold-500));
}

.pg-grid .pg-slot:nth-child(4n+3) .pg-thumb {
    background: linear-gradient(135deg, var(--c-red-500), #5a2e6e);
}

.pg-grid .pg-slot:nth-child(4n) .pg-thumb {
    background: linear-gradient(135deg, #1e4a7a, var(--c-red-600));
}

/* 类型标：白底压图，左上角（右上让位给收藏钮） */
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

/* 收藏钮（v1.3 调整 3）：32×32（--s8）纯图标，无底无边，右上常驻 + aria / 一次性翻转契约保留。
   对比依据（四色渐变，收藏位约在渐变轴 71–83% 处）：
   红→金 / 绿→金两组此区间为亮橙（L≈.30–.34）——金 ≈1.3:1、白（.85）≈2.7–2.9:1，均 < 3:1；
   深红→紫 / 蓝→红两组此区间为暗调（L≈.05–.07）——金 ≈4.2–4.6:1、白 ≈9–10:1，✓。
   单一平色无法四组全域 ≥3:1，故加墨色暗晕 text-shadow（rgba(26,20,16,.55)，登记授权）：
   暗晕邻接环 L≈.02–.09 → 白对其 ≈7.4–14:1、金对其 ≈3.4–6.6:1 → 全态满足 WCAG 1.4.11 图形 3:1 */
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
    /* 收藏反馈：一次性 rotateY 翻转 */
    animation: pgStarFlip .5s ease;
}

@keyframes pgStarFlip {
    0% { transform: rotateY(0); }
    50% { transform: rotateY(180deg); }
    100% { transform: rotateY(360deg); }
}

/* ══ 智能体图片（v1.8 调整 2）：40（--s10）圆章，位于缩略带之下、名称之上，水平居中；
   三态共用此外壳——image 态由 :style 铺图（纸色底防 404 透明）、icon 态圆内居中 <i>、disc 态名称首字；
   视觉语汇抄自门户首页圆章（1px 发丝边 + 宣纸渐变 + display 字体），类名本页私有（只抄语汇不引类） ══ */
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

/* icon 态：图标类名直用，字号 --text-lg 略大于首字（视觉等重，抄首页比例语汇） */
.pg-avatar i {
    font-size: var(--text-lg);
    line-height: 1;
}

/* 卡体（内距 s3/s4/s2；段落 = 头像 + 名称 + 描述，v1.8 调整 2/3） */
.pg-body {
    display: flex;
    flex-direction: column;
    gap: var(--s2);
    flex: 1;
    padding: var(--s3) var(--s4) var(--s2);
}

/* 名称（v1.8 调整 3）：--text-base · 水平居中（与头像同中轴）· 锁单行 clamp（防长名撑高 → 防骨架跳变） */
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

/* 简介（v1.3 调整 5 + v1.8 调整 4）：固定预留 3 行——clamp 3 + 恒占 3 行高（与骨架等高）；空文案由占位文填充；
   悬停看全文走原生 title（模板上有描述才设）——.pg-card overflow:hidden 为切角而设，会裁掉自定义 tooltip 浮层；
   对齐维持左对齐：多行长文本居中会产生两侧锯齿边、降低扫读效率，头像 + 名称已立起卡片居中中轴，描述不参与 */
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

/* 操作行（v1.3 调整 1：底距 s3 → s2，8/16/8）：发丝分割 + 常驻主操作 */
.pg-act {
    padding: var(--s2) var(--s4) var(--s2);
    border-top: 1px dashed rgba(153, 42, 24, .25);
}

/* 主操作（v1.3 调整 1）：高 32（--s8）· 字 --text-xs · 内距 s5 → s3；整宽常驻 + hover/active 反馈保留。
   触点 32 < 44 属用户明示取舍（变更记录登记 a11y 偏离），整行宽度补偿可达性 */
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

/* ══ 空态 / 错误态卡：直角、min-height 320、CSS 印章（计划 §3.11） ══ */
.pg-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--s3);
    min-height: 320px;
    padding: var(--s10) var(--s6);
    background: var(--c-white);
    border: 1px dashed var(--c-border);
    border-radius: 0;
    text-align: center;
}

/* 筛选空态壳（v1.3 调整 8）：透明露宣纸 + 无边框——去空框感；
   裁定：虚线框一并去除（印章 + 标题已足够体量，宣纸上的虚线框反显空）；错误态与真空态维持 .pg-state 原壳 */
.pg-state--plain {
    background: transparent;
    border: 0;
}

/* 88 圆章：纯 CSS（渐变 + inset 红环），零图片资源；外虚线环由 ::after 独立承载 */
.pg-state-seal {
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

/* 印章外虚线环（§3.11）：::after 悬于章外 8，hover 整环 rotateY 翻转（reduce 与触屏降级见文末） */
.pg-state-seal::after {
    content: '';
    position: absolute;
    inset: calc(var(--s2) * -1);
    border: 1px dashed var(--c-red-600);
    border-radius: var(--r-full);
    pointer-events: none;
    transition: transform .5s ease;
}

.pg-state-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xl);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

.pg-state-text {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--c-ink-2);
}

/* 动作行：筛选空态单钮「重置」/ 真空空态主钮+次文字钮 / 错误态重试，居中可换行 */
.pg-state-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: var(--s3);
    margin-top: var(--s2);
}

.pg-state-btn {
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

.pg-state-btn:hover {
    background: var(--c-red-500);
}

/* 次动作文字钮（§3.11/§6.2）：红字常态，hover 金（计划原文规格） */
.pg-state-link {
    min-height: 44px;
    padding: 0 var(--s3);
    border: 0;
    background: transparent;
    color: var(--c-red-600);
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
    cursor: pointer;
    transition: color var(--t-fast);
}

.pg-state-link:hover {
    color: var(--c-gold-500);
}

/* ══ 骨架屏：10 格，结构镜像真卡（v1.8：缩略带 42 / 头像 / 名称 / 描述 3 行 / 操作行）→ 逐段等高，整卡同高无跳变 ══
   高度构成（与真卡一致，均换算自 token）：
   边框 1+1=2 · thumb 42
   body = padding(12+8) + 头像 40(--s10) + gap8 + name(16×1.65=26.4) + gap8 + desc(12×1.65×3=59.4) = 161.8
   act  = padding(8+8) + border-top 1 + 钮 32（--s8） = 49
   合计 = 254.8px（真卡同式同值；两行 = 529.6 = .pg-grid-wrap 的 min-height，加载态恰好铺满该下限） */
.pg-sk-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: 0;
    overflow: hidden;
}

.pg-sk-thumb {
    height: 42px;
    background: var(--c-paper);
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
    animation: pgPulse 1.2s ease-in-out infinite;
}

.pg-sk-body {
    display: flex;
    flex-direction: column;
    gap: var(--s2);
    flex: 1;
    padding: var(--s3) var(--s4) var(--s2);
}

/* 头像占位：与 .pg-avatar 同径同轴（--s10 圆、水平居中） */
.pg-sk-avatar {
    width: var(--s10);
    height: var(--s10);
    margin: 0 auto;
    border-radius: var(--r-full);
    background: var(--c-red-100);
    animation: pgPulse 1.2s ease-in-out infinite;
}

/* 名称占位：与 .pg-name 行盒同高（--text-base × --leading-body） */
.pg-sk-name {
    width: 70%;
    height: calc(var(--text-base) * var(--leading-body));
    background: var(--c-red-100);
    border-radius: var(--r-sm);
    animation: pgPulse 1.2s ease-in-out infinite;
}

/* 简介占位：恒占三行高（--text-xs × --leading-body × 3），内分三条 */
.pg-sk-desc {
    display: flex;
    flex-direction: column;
    gap: var(--s1);
    width: 90%;
    height: calc(var(--text-xs) * var(--leading-body) * 3);
}

.pg-sk-sub {
    flex: 1;
    min-height: 0;
    background: var(--c-red-100);
    border-radius: var(--r-sm);
    animation: pgPulse 1.2s ease-in-out infinite;
}

/* 操作行占位：与 .pg-act + 32px 主按钮同构等高 */
.pg-sk-act {
    padding: var(--s2) var(--s4) var(--s2);
    border-top: 1px dashed rgba(153, 42, 24, .25);
}

.pg-sk-btn {
    height: var(--s8);
    background: var(--c-red-100);
    border-radius: var(--r-sm);
    animation: pgPulse 1.2s ease-in-out infinite;
}

/* 全页唯一 infinite：仅加载态出现 */
@keyframes pgPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .45; }
}

/* ══ 分页：40px 虚线圆钮（v3 触点豁免） ══ */
.pg-pager {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: var(--s2);
    margin-top: var(--s6);
}

.pg-page-btn {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 1px dashed var(--c-red-600);
    border-radius: var(--r-full);
    background: var(--c-white);
    color: var(--c-ink);
    font-family: var(--font-display);
    font-size: var(--text-base);
    cursor: pointer;
    transition: background var(--t-fast), color var(--t-fast);
}

.pg-page-btn:hover:not([disabled]):not([aria-current="page"]) {
    background: var(--c-red-100);
}

.pg-page-btn[aria-current="page"] {
    border-style: solid;
    background: var(--c-red-600);
    color: var(--c-white);
}

/* 禁用态双编码（§3.9）：opacity .4 + cursor default + 虚线→实线（可用态为虚线） */
.pg-page-btn[disabled] {
    opacity: .4;
    cursor: default;
    border-style: solid;
}

.pg-page-ellipsis {
    width: var(--s6);
    text-align: center;
    color: var(--c-muted);
}

/* ══ 页脚：视觉规格在共享组件 PortalFooter（v1.5：对齐门户首页——同底色 / 同内距 / 居中版权行；无虚线边、无内衬容器），本页只留上间距 ══ */
.pg-foot {
    margin-top: var(--s12);
}

/* ══ 动效 ①：入场（.effect + .isView，0.7s，stagger data-delay；banner 三行 + 工具带/栏目头/页脚，§4.1①） ══ */
.effect {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity .7s ease, transform .7s ease;
}

.effect.isView {
    opacity: 1;
    transform: none;
}

.effect[data-delay="1"] { transition-delay: .08s; }

.effect[data-delay="2"] { transition-delay: .16s; }

/* 动效 ②：结果集切换（换页/筛选重放）——卡片自 16px 落位（§4.1②），
   --t-base 拆值只写属性列表，不追加 ease；isView 档需更高特异性覆盖 16px 初值 */
.pg-slot.effect {
    transition: opacity var(--t-base), transform var(--t-base);
    transform: translateY(16px);
}

.pg-slot.effect.isView {
    transform: none;
}

/* ══ 动效 ③：hover / press 反馈（触屏不误触发位移） ══ */
@media (hover: hover) {
    /* 卡片 hover：上浮 + 阴影保留（v1.1 调整 2：glyph 翻转已取消）；
       整卡不给 cursor:pointer——无整卡 click，光标不谎报可点（§3.6 整卡语义） */
    .pg-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
    }

    /* 状态卡印章：hover 时外虚线环 rotateY 翻转（§3.11） */
    .pg-state:hover .pg-state-seal::after {
        transform: rotateY(180deg);
    }
}

/* ══ 宽度断点 >996（唯一宽度断点 996 的上半） ══ */
@media (min-width: 997px) {
    .pg-banner-title {
        font-size: var(--text-3xl);
    }

    .pg-banner-sub {
        display: block;
    }
}

/* ══ ≤996（唯一断点下半）：副题隐藏省垂直预算（§7）；工具带纵向堆叠、chips 换行；
   banner / 工具带 / 内容列 / 页脚内衬同收 --s4，守住 §2.1「全页一条左内容线」与红条同线保证（--pg-max 规则不变） ══ */
@media (max-width: 996px) {
    .pg-banner-inner {
        padding: var(--s3) var(--s4);
    }

    .pg-banner-sub {
        display: none;
    }

    .pg-toolbar-inner {
        padding: var(--s4);
        padding-left: calc(var(--s4) + var(--s3));
        flex-direction: column;
        align-items: stretch;
        gap: var(--s4);
    }

    .pg-toolbar-inner::before {
        left: var(--s4);
        top: var(--s4);
        bottom: var(--s4);
    }

    .pg-col {
        padding: 0 var(--s4);
    }
}

/* ══ 动效降级：reduce 全量直出 ══ */
@media (prefers-reduced-motion: reduce) {
    .effect {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
    }

    .pg-card:hover {
        transform: none;
    }

    /* v1.1 调整 2：glyph hover 翻转已取消（v1.3 调整 2 连元素一并移除），对应降级条目无存留 */

    .pg-state-seal::after {
        transition: none;
    }

    .pg-state:hover .pg-state-seal::after {
        transform: none;
    }

    .pg-star.is-on {
        animation: none;
    }

    .pg-sep {
        transition: none;
    }

    .pg-channel:hover .pg-sep {
        transform: none;
    }

    .pg-sk-thumb,
    .pg-sk-avatar,
    .pg-sk-name,
    .pg-sk-sub,
    .pg-sk-btn {
        animation: none;
    }

    .pg-skip {
        transition: none;
    }
}
</style>
