<template>
    <!-- 智能体广场：128px 全幅 banner + 全幅工具带（单行：筛选 chips 左 / 搜索右） + 内容列（栏目头/网格/分页）+ 绛红页脚 -->
    <!-- 设计依据：mimo/portal-agents设计计划-mimo.md（D1–D10；文末变更记录 v1.1–v1.8 为最新权威，v1.8 = 五条卡片调整）；功能契约与原实现一致 -->
    <!-- v2.0 卡片改版依据：AI-Agent-Latest-UI-Perfect-HTML/index.html 第一套「智能体广场」通用用户卡
         （cardTemplate → .card / .card-body / .avatar-row / .avatar / .favorite / h3 / .desc / .desc-tip /
          .meta / .card-footer / .start + .card:hover / .card.featured / 收藏 pop / 浮层 hover）；
         **不取**第二套「我的智能体」管理卡（.manage-* 属别页需求）。
         筛选区同步改版：类型 chips（standard/workflow）→ 视图 chips（全部/推荐/使用排名），
         原「类型标」信息迁入卡片 meta 第二项；检索表单样式与提交行为不动 -->
    <!-- v3.0（本轮，用户明示）：卡片区与内容列面板 **100% 照搬设计稿 HTML 原值**——上一轮的
         「设计稿 hex → 门户 --c-* token 换算」约束对这两块作废，直接写设计稿数值/颜色/曲线/关键帧；
         设计稿 :root 那批变量（--red/--paper/--ink/--shadow…）按原名局部声明在 .pg-wrap 上（与门户
         --c-* ／ --s* ／ --text-* 不撞名），只服务卡与面板，不外溢到 banner/工具带/页脚。
         本轮只改「值」与内容列面板壳，**不动页面结构**（banner / 工具带 / 栏目头 / 错误态 / 两种空态 /
         分页 / 页脚 / 检索 / 视图 chips / 全部功能与动效降级一律保留）：
           ① --pg-max 1200 → var(--max, 1440px)（banner / 工具带 / 内容列仍共用同一条内容线）；
           ② 内容列 .pg-col 加设计稿 #market 的 .panel 壳 + 山纹 ::after，内距按 .hero-row/.grid/.pager 节奏；
           ③ 卡片 CSS 全量换回设计稿原值，网格改设计稿 5 列（≤1180 4 列）；骨架按新数值重算等高。 -->
    <!-- v4.0（本轮，用户明示）：
            ① 「单卡」抽成公共组件 components/agent/AgentCard.vue（props item/starred，emits favorite/run；
               卡片全部 CSS 与展示派生 displayName/resolveAvatar/avatarBgStyle/formatMetaTime/metaSecond 随迁）。
               本页只留 .pg-slot 网格项与 .pg-grid 列规则，模板改为 <AgentCard :item :starred @favorite @run>；
            ② 全文浮层作废「有描述就渲染 + 卡内 top:72px」→ 改「实测溢出（scrollHeight > clientHeight + 1）
               才显示 + teleport 到 body + 卡外下方（top = 卡底 + 8）」（实现见 AgentCard.vue）；
            ③ 网格改「一行 4 个」、每页 10 → 8（骨架同 8；冗余的 ≤1180 4 列断点删除）；
            ④ 栏目头可见文字 {{ channelTitle }} 移除，只留 ◈ 图标，文案放 .pg-sr-only 兜底可访问名；
            ⑤ 移除「首卡默认红边」(.pg-card.featured)，选中 / 强调只由 hover 提供。 -->
    <!-- 顶栏 + v3 主题层由 /portal 一级壳（PortalShell）渲染，本页只出内容（正文缩进未整体重排） -->
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
                    <!-- 左：筛选 chips（视图 + 排序）；容器必须可换行（ui-ux-pro-max High），DOM 序 = 视觉序 = Tab 序 -->
                    <div class="pg-controls">
                        <!-- 视图 chips（v2.0，原类型 chips）：原生 button + aria-pressed，选中 = 实线 + ◈ + 底色（非仅颜色）；
                             三态 = 全部 all / 推荐 recommended / 使用排名 rank，chip 视觉编码方式保持现状不改 -->
                        <div class="pg-chips" role="group" aria-label="视图筛选">
                            <button
                                v-for="t in viewOptions"
                                :key="'chip-' + t.value"
                                type="button"
                                class="pg-chip"
                                :aria-pressed="viewMode === t.value ? 'true' : 'false'"
                                @click="setView(t.value)"
                            ><span v-if="viewMode === t.value" class="pg-chip-mark" aria-hidden="true">◈</span>{{ t.label }}</button>
                        </div>
                        <!-- 排序：同 chip 的 aria-pressed + ◈ 编码。
                             v2.0：「使用排名」已内置排序源（接口无使用次数，按推荐+时间降级，见 filteredList），
                             激活时整组隐藏，避免两个排序源并存；切回其它视图时排序组按原 sortBy 恢复显示 -->
                        <div v-if="viewMode !== 'rank'" class="pg-sorts" role="group" aria-label="排序方式">
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

            <!-- ══ 内容列（--pg-max 1440 内衬，与 banner/工具带内衬同线；v3.0：本体 = 设计稿 #market 的 .panel
                 纸纹面板，栏目头/网格/分页按设计稿 #market 节奏做面板内距，面板外框落在内容线上） ══ -->
            <div class="pg-col">
                <!-- 栏目头：v4.0 可见文字按用户要求移除，只留 ◈ 图标——动态标题（关键词优先）收进 .pg-sr-only 兜底可访问名
                     （channelTitle 计算与 countText 计数行为均不动） + ◈ + 计数（aria-live） -->
                <section class="pg-channel effect" aria-label="列表栏目头">
                    <h2 class="pg-channel-title"><span class="pg-sr-only">{{ channelTitle }}</span><span class="pg-sep" aria-hidden="true">◈</span></h2>
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
                    <!-- 骨架：8 格（v4.0：10 → 8，对齐每页 8 条），结构镜像新卡（头像行 / 名称 / 3 行描述 / meta / 按钮）→ 逐段等高、整卡同高无跳变 -->
                    <div v-if="loading" class="pg-grid pg-skeleton" aria-hidden="true">
                        <div v-for="i in 8" :key="'sk-' + i" class="pg-sk-card">
                            <div class="pg-sk-body">
                                <!-- 头像行镜像：62 头像 + 32 收藏位，行高由 .pg-sk-avatar-row min-height 锁 62 -->
                                <div class="pg-sk-avatar-row">
                                    <div class="pg-sk-avatar"></div>
                                    <div class="pg-sk-star"></div>
                                </div>
                                <div class="pg-sk-name"></div>
                                <div class="pg-sk-desc">
                                    <div class="pg-sk-sub"></div>
                                    <div class="pg-sk-sub"></div>
                                    <div class="pg-sk-sub"></div>
                                </div>
                                <!-- meta 与按钮行占位（v2.0 新增，随卡片 .meta / .card-footer 同构） -->
                                <div class="pg-sk-meta"></div>
                                <div class="pg-sk-footer">
                                    <div class="pg-sk-btn"></div>
                                </div>
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
                            <p class="pg-state-text">换个关键词或视图试试，或点击「重置」</p>
                            <!-- 单一动作：重置 = 清关键词 + 视图/排序归位 + 回第 1 页 + 焦点回检索框（clearFilters） -->
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
                            <!-- 整卡（v4.0：抽为公共组件 AgentCard，卡片 CSS 与展示派生随之迁移）——
                                 不挂 click（无 div[onclick] / 无 cursor:pointer）；主操作 = 底部常驻按钮；
                                 收藏 / 进入对话只回传 item，写接口由页面处理（与 AgentList 的 @open-agent 风格一致） -->
                            <AgentCard
                                :item="item"
                                :starred="isStarred(item)"
                                @favorite="toggleStar"
                                @run="goRun"
                            />
                        </article>
                    </div>
                </section>

                <!-- ══ 分页（v1.4 调整 1）：有结果即显示——单页显「‹ 1 ›」（两箭头 disabled、当前页高亮），多页省略号窗口不变；8 条/页（v4.0：10→8）、40px 圆钮 ══ -->
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
</template>

<script>
    import PortalFooter from '../components/PortalFooter.vue'
    // v4.0：单卡抽为公共组件（卡片 CSS / 展示派生 / 全文浮层均在组件内，本页只喂 item 与收藏态）
    import AgentCard from '../components/agent/AgentCard.vue'
    import { mapState } from 'vuex'
    import Setting from '@/setting'
    // 未登录（游客）时受限操作（收藏 / 进入对话 / 创建）统一唤起门户登录弹窗
    // （全局状态，弹窗由门户壳 PortalLayout 渲染；见 loginModalState.js）
    import { openLoginModal } from '../components/loginModalState'
    import {
        agentAppList,
        agentAppFavorites,
        agentAppFavorite,
        agentAppUnfavorite
    } from '@/api/agentApp'

    export default {
        name: 'PortalAgents',

        components: {
            PortalFooter,
            AgentCard
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
                // v2.0：typeFilter(all/standard/workflow) → viewMode(all/recommended/rank)
                // 三态视图（全部 / 推荐 / 使用排名）；类型信息改由卡片 meta 第二项承载
                viewMode: 'all',
                sortBy: 'cjsj',
                page: 1,
                pageSize: 8, // v4.0：10 → 8（每页 8 条 = 4×2 整两行）

                // ===== 收藏（v1.4 调整 3：服务端收藏集合，mounted 与列表并行加载；存 id 字符串） =====
                favIds: [],

                // ===== 视图 / 排序 chips（v2.0：类型组三 chip 换「全部 / 推荐 / 使用排名」，chip 视觉编码不动） =====
                viewOptions: [
                    { value: 'all', label: '全部' },
                    { value: 'recommended', label: '推荐' },
                    { value: 'rank', label: '使用排名' }
                ],
                sortOptions: [
                    { value: 'cjsj', label: '最新发布' },
                    { value: 'name', label: '名称' }
                ]
            }
        },

        computed: {
            // 用户信息：响应式读取 store（镜像 PortalLayout / 首页的 mapState 写法）；仅作登录态兜底
            ...mapState('admin/user', ['info']),

            // 登录态：与路由守卫同一口径（src/router/index.js beforeEach：
            // localStorage.getItem('token_' + Setting.xmid) 存在且 !== 'undefined'），
            // store 用户信息作兜底（logout 时 token 与 info 同步清空，两者不会互相矛盾）。
            // 镜像 src/pages/portal/home/index.vue 的同名 computed：
            // 未登录不请求当前用户私有接口（收藏集合），收藏 / 进入对话 / 创建改唤起登录弹窗
            isLoggedIn () {
                let token = ''
                try {
                    token = localStorage.getItem('token_' + Setting.xmid) || ''
                } catch (e) {
                    token = ''
                }
                if (token && token !== 'undefined') return true
                const info = this.info || {}
                // 兜底需有真实用户标识，避免残留空对象被判为已登录
                return !!(info && typeof info === 'object' && (info.id || info.xm))
            },

            // 上线列表：唯一口径 status === 'published'（不叠加 enabled）
            onlineList () {
                return this.rawList.filter(item => this.isOnline(item))
            },

            // 过滤管线（v2.0）：搜索 → 视图筛选 → 排序
            filteredList () {
                const kw = (this.keyword || '').trim().toLowerCase()
                let list = this.onlineList.filter(item => {
                    // 推荐：只留 isRecommended === true（按接口布尔真值口径，不放宽到 '1' / 1）
                    if (this.viewMode === 'recommended' && item.isRecommended !== true) return false
                    if (kw) {
                        const name = String(item.name || '').toLowerCase()
                        const desc = String(item.description || '').toLowerCase()
                        if (name.indexOf(kw) === -1 && desc.indexOf(kw) === -1) return false
                    }
                    return true
                })
                // 使用排名：接口 /ai/agent-app/list 无使用次数 / 热度字段（仅 id / name / description /
                // avatar|icon / appType / status / enabled / isRecommended / cjsj），用户已确认前端降级——
                // 按「isRecommended 优先 + cjsj 倒序」暂代排名；待后端补使用次数字段后再切真实排序。
                // 该分支内置排序：忽略 sortBy，模板在 rank 态隐藏排序组避免两个排序源并存
                if (this.viewMode === 'rank') {
                    return list.slice().sort((a, b) => {
                        const ra = a.isRecommended === true ? 1 : 0
                        const rb = b.isRecommended === true ? 1 : 0
                        if (ra !== rb) return rb - ra
                        const tb = new Date(b.cjsj).getTime() || 0
                        const ta = new Date(a.cjsj).getTime() || 0
                        return tb - ta
                    })
                }
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

            // 当前页 8 条（v4.0：pageSize 10 → 8）
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

            // 网格重建键：换页 / 视图筛选 / 排序 / 搜索时触发入场动画原地重放（v2.0 认 viewMode）
            gridKey () {
                return this.page + '|' + this.viewMode + '|' + this.sortBy + '|' + this.keyword
            },

            // 栏目头标题（v1.3 调整 7 + v2.0 改值）：关键词 → 推荐 → 使用排名 → 默认「全部智能体」
            channelTitle () {
                if ((this.keyword || '').trim()) return '搜索结果'
                if (this.viewMode === 'recommended') return '推荐智能体'
                if (this.viewMode === 'rank') return '使用排名'
                return '全部智能体'
            },

            // 栏目头计数（v1.3 调整 7 + v1.9 调整 2）：默认态不展示「当前筛选 M 个」；**不再追加分页信息**
            countText () {
                if (this.loading) return '加载中…'
                if (this.loadError) return '列表加载失败'
                const kw = (this.keyword || '').trim()
                // v2.0 默认态口径：all 不过滤、rank 只重排不过滤 → 两者都算默认态，不追加「当前筛选 M 个」；
                // 只有 recommended 是真筛选（会缩小集合），才补计数
                const isDefault = !kw && this.viewMode !== 'recommended'
                let t = '共 ' + this.onlineList.length + ' 个已上线'
                if (!isDefault) t += ' · 当前筛选 ' + this.filteredList.length + ' 个'
                return t
            }
        },

        watch: {
            // 登录态由 false → true（路由守卫 / 登录弹窗成功）：补拉收藏集合——
            // 未登录时已跳过（见 loadFavorites），否则登录后星标状态会一直是空。
            // 不用 immediate：已登录用户在 mounted 里已显式加载过一次，避免重复请求
            isLoggedIn (val) {
                if (val) this.loadFavorites()
            },
            // 筛选/搜索变化 → 回第 1 页
            keyword () {
                this.page = 1
            },
            viewMode () {
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
                    // v4.0：直接存原始 row——头像三态（avatarKind/avatarValue/avatarDisc）不再预计算，
                    // 由 AgentCard.vue 按原始 avatar|icon 内部判别（原 v1.8 调整 2 的预判已随卡片迁入组件）
                    this.rawList = Array.isArray(data) ? data : []
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

            // 筛选空态唯一动作「重置」（v1.3 调整 8 + v2.0）：清关键词 + 视图归位 all + 排序归位 cjsj +
            // 回第 1 页；焦点交还检索框（rank 态可能隐藏了排序组，归位后排序选项必然回到「最新发布」）
            clearFilters () {
                this.keyword = ''
                this.searchInput = ''
                this.viewMode = 'all'
                this.sortBy = 'cjsj'
                this.page = 1
                this.$nextTick(() => this.focusEl('#pg-agent-search'))
            },

            // 焦点管理辅助：在本组件 DOM 内查找并聚焦（找不到则静默）
            focusEl (sel) {
                const el = this.$el && this.$el.querySelector ? this.$el.querySelector(sel) : null
                if (el && el.focus) el.focus()
            },

            // 视图切换（v2.0，原 setType）：all 不过滤 / recommended 过滤 / rank 内置排序；
            // 排序组只在非 rank 时渲染（模板 v-if），rank 期间 sortBy 保持原值、切回后原样恢复
            setView (v) {
                this.viewMode = v
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
            // 未登录：对话页 / 创建页均为 auth:true 路由，直接唤起登录弹窗并带上目标地址，
            // 避免被路由守卫弹回首页、丢失广场浏览位置；登录成功后由弹窗跳回目标
            goRun (item) {
                if (!item || !item.id) return
                if (!this.isLoggedIn) {
                    openLoginModal('/portal/agents/' + item.id + '/run')
                    return
                }
                this.$router.push('/portal/agents/' + item.id + '/run')
            },

            goCreate () {
                if (!this.isLoggedIn) {
                    openLoginModal('/portal/create/agent')
                    return
                }
                this.$router.push('/portal/create/agent')
            },

            // 返回首页走 router（避免整页刷新），href 保留语义
            goHome () {
                this.$router.push('/portal/home')
            },

            // ---------- 收藏（v1.4 调整 3：服务端实现，对齐参照页 AgentAppHome.vue） ----------
            // 加载收藏集合：与列表并行；失败静默降级为空集合（不阻塞列表、不显示假状态）。
            // 未登录不请求：/favorites 属当前用户私有接口，游客调用会 401 并弹全局错误条
            async loadFavorites () {
                if (!this.isLoggedIn) {
                    this.favIds = []
                    return
                }
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

            // 收藏切换：await 接口成功后才更新本地集合 + 成功提示；失败提示且不改本地状态。
            // 未登录：不发鉴权收藏请求（否则弹「操作失败」错误条），改唤起登录弹窗、就地留在广场
            async toggleStar (item) {
                if (!this.isLoggedIn) {
                    openLoginModal()
                    return
                }
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

            // （v4.0 迁出）displayName / resolveAvatar / avatarBgStyle / formatMetaTime / metaSecond
            // 已随「单卡抽成公共组件」迁入 components/agent/AgentCard.vue：卡片的头像三态判别、
            // 图片背景、名称与 meta 派生，均由组件按原始 row 内部计算，本页不再保留这些方法

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
   --pg-max 页面级内容线（v1.3 调整 6 原为 1200；**v3.0 本轮改为 var(--max, 1440px)**——门户壳
   body.page-portal-v3 上的通用 token --max = 1440px，banner / 工具带 / 内容列三段仍共用这同一条线；
   末尾保留 1440px 兜底值，万一某处没继承到 --max 也不会退化成 auto）；
   v1.4 调整 2（sticky footer）：flex column + min-height 视口高（全局 border-box 保证含 padding）——
   内容不足时页脚贴窗口底、内容超出自然下推
   ══ 设计稿局部变量（v3.0 声明在 .pg-wrap 上）已随卡片迁入 AgentCard.vue（v4.0）：
      卡片 CSS 实际只用 --red/--red2/--red3/--shadow2 四个，现由该组件的 .pg-card 自持；
      面板用的是内联原值、不依赖任何设计稿变量 —— 故本页 v4.0 起不再声明这批变量，
      只保留内容线 --pg-max ══ */
.pg-wrap {
    --pg-max: var(--max, 1440px);
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

/* 单列左对齐（v1.1 调整 3：统计胶囊列去除后不再需要两端对齐）；内衬 --pg-max（v3.0 = 1440） */
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

/* 单行 flex：左筛选 / 右搜索；内衬左缘留出 3px 红条的偏移；内衬 --pg-max（v3.0 = 1440） */
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

/* 筛选组（左）：视图 + 排序并排（v2.0：类型 chips → 视图 chips，样式不变）；必须可换行（ui-ux-pro-max High）；v1.1 调整 4：行间发丝分隔线已删除 */
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

/* ══ 内容列 = 设计稿 #market 的 .panel 纸纹面板（v3.0 本轮，用户要求 100% 照搬设计稿原值）══
   逐条照抄 index.html 的 .panel / .panel:after：
     position:relative; overflow:hidden; border:1px solid rgba(102,73,50,.12); border-radius:12px;
     background:linear-gradient(135deg,rgba(255,252,247,.88),rgba(248,237,224,.78));
     box-shadow:0 5px 22px rgba(93,61,36,.04);
   面板内距（v3.0）：由原来 .pg-col 自身的左右 --s6 内衬，改成三段各按设计稿 #market 节奏自带内距——
     栏目头 17/14/12（.hero-row）、网格 0/12/12（.grid）、分页 0/14/14（.pager），
     故 .pg-col 自身 padding:0，卡片靠 .pg-grid-wrap 的 12px 内距不贴面板边。
   面板外框落「内容线」：max-width 取 --pg-max 减两侧 --s6、width 取 100% 减两侧 --s6 ——
     与设计稿 .page{padding:0 18px 38px} 的页边距同义（数值按本页 --s6=24，保证面板外框与 banner/工具带
     的内容线同线、且窄屏下圆角面板不顶到视口边）；margin auto 仍居中，max-width 仍受 --pg-max 约束。
   v1.4 调整 2：flex 1 0 auto 纵向撑满——把页脚推到窗口底（面板随之长高，报错/空态同享） ══ */
.pg-col {
    flex: 1 0 auto;
    position: relative;
    width: calc(100% - var(--s6) * 2);
    max-width: calc(var(--pg-max) - var(--s6) * 2);
    margin: var(--s8) auto 0;
    padding: 0;
    overflow: hidden;
    border: 1px solid rgba(102, 73, 50, .12);
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(255, 252, 247, .88), rgba(248, 237, 224, .78));
    box-shadow: 0 5px 22px rgba(93, 61, 36, .04);
}

/* 面板右上角山纹（设计稿 .panel:after 原值）：260 见方贴右上，.055 低透 + multiply 融进纸底。
   资源：设计稿 assets/mountain-texture.jpg 已原样拷入 src/assets/images/（哈希一致，未新增别的资源）。
   overflow:hidden 由面板承担裁切，故 -50/-60 的出血量不外溢；z-index 不设（=auto，压在正片内容之下，
   见紧随其后的「面板内容分层」） */
.pg-col::after {
    content: '';
    position: absolute;
    right: -50px;
    top: -60px;
    width: 260px;
    height: 260px;
    background: url('~@/assets/images/mountain-texture.jpg') center/cover;
    opacity: .055;
    mix-blend-mode: multiply;
    pointer-events: none;
}

/* ══ 面板内容分层（v3.0）：设计稿 .grid{z-index:1} 的推广——面板内四块内容统一抬到山纹之上，
   纹理只在四块之间的留白里显形、不压字不压卡（.pg-col::after 是 z-index:auto 的绝对定位层，
   内容带 z-index:1 即整体压过它；也保证卡片 hover 的 z-index:5 仍在内容层内生效）。
   错误提示条（.pg-notice）在面板内横向收进 12px、与 .grid 同线——否则它自带的 3px 左红条会正好压在
   面板左描边上；.pg-notice 自身规格（底/边/字/内距）一字未动 ══ */
.pg-channel,
.pg-notice,
.pg-grid-wrap,
.pg-pager {
    position: relative;
    z-index: 1;
}

.pg-col > .pg-notice {
    margin-left: var(--s3);
    margin-right: var(--s3);
}

/* ══ 栏目头：动态大标题（v1.3 调整 7 + v2.0 取值：关键词 → 推荐 → 使用排名 → 默认） + ◈ + 计数（北中医范式） ══
   v3.0：面板内距按设计稿 .hero-row（padding:17px 14px 12px；左对齐标题 + 右侧计数 = 设计稿 .title-wrap 的
   h1 + .sub 同构）；原来的 margin-top:var(--s8) 已上移到 .pg-col 的 margin-top（面板外框与工具带之间留白） */
.pg-channel {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--s3) var(--s4);
    margin-top: 0;
    padding: 17px 14px 12px;
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

/* ══ 网格容器：固定两行 min-height（v1.8 调整 5：消分页翻页抖动）+ 锚定滚动补偿顶栏 +
   设计稿 .grid 的 0/12/12 内距（v3.0；12px 横向保证卡片不贴面板边，底部 12 为面板下缘留白）══
   卡高算式（v3.0 按设计稿原值重算，真卡与骨架同式同值）：
   整卡 241.75 = 边框 2（1+1，设计稿 .card border 1）
               + body pad 上 12 + 下 13 = 25（设计稿 .card-body 12/14/13）
               + 头像行 62（.pg-avatar-row min-height = 头像径 62）
               + 名称 [margin-top 10 + 行盒 15×1.25=18.75 + margin-bottom 6] = 34.75（设计稿 h3 15/1.25）
               + 描述 59（设计稿 .desc height:59px —— 上一轮的 token 换算 12×1.65×3=59.4 作废）
               + meta [margin-top 7 + 行盒 10×1.5=15 + margin-bottom 9] = 31（设计稿 10px，行高显式 1.5）
               + 按钮 28（设计稿 .start height:28px —— 上一轮取 --s8(32) 作废，相应 a11y 取舍见 .pg-btn-chat）
               = 241.75
   两行下限 = 2×241.75 + 行距 12（设计稿 .grid gap:12px）= 483.5 + 12 + 底部内距 12 = 507.5 → 1 行页与
   2 行页内容区等高，翻页不抖；设计稿 min-height 202 < 241.75，不参与取值（实际不生效，仅登记）；
   空态 / 错误态同落此下限（壳自身 min-height 320 不变）；≤996 自适应多行时该值仅作下限（v4.0：≤1180 的 4 列断点已删，4 列改为基础规则）。
   栏目头与网格之间的 --s5 间距保留：设计稿此处原有一整行筛选 chips（.filters 0/14/12，本页 chips 在工具带），
   用原 margin-top 补足这段节奏，避免 12px 底内距直接顶到卡片 */
.pg-grid-wrap {
    --pg-card-h: 241.75px;
    min-height: calc(2 * var(--pg-card-h) + var(--s3) + var(--s3));
    margin-top: var(--s5);
    padding: 0 12px 12px;
    scroll-margin-top: calc(var(--header-h) + var(--s4));
}

/* 栅格（v4.0：一行 4 个，取代上轮的设计稿 5 列）：
   面板内容线 1392 − 两侧 12 内距 = 1368，减 3 个 12 行距 → 单卡 ≈333px（8 条 = 4×2 整两行）；
   minmax(0,1fr) 让卡片可被压窄不溢出；≤996 回落自适应（见文末断点，唯一主动偏离设计稿处） */
.pg-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
}

.pg-slot {
    min-width: 0;
}

/* ══ 卡片样式已随「单卡抽成公共组件」迁出本页（v4.0）：全部 .pg-card 一族（.pg-card / ::before /
   .pg-card-body / .pg-avatar-row / .pg-avatar / .pg-avatar i / .pg-star / .pg-name / .pg-desc /
   .pg-desc-tip / .pg-meta / .pg-card-footer / .pg-btn-chat 及其 hover/active、@keyframes pop、reduce 降级）
   与设计稿局部变量（--red/--red2/--red3/--shadow2）均已迁入 components/agent/AgentCard.vue，本页不再保留。
   v4.0 同时移除「首卡默认红边」(.pg-card.featured / .pg-card.featured:hover)：选中 / 强调只由 hover 提供。 */

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

/* ══ 骨架屏（v2.0 镜像新卡；v3.0 按设计稿原值重算）：8 格（v4.0：10 → 8），结构 = 真卡（头像行 / 名称 / 描述 3 行 / meta / 按钮行）
   → 逐段等高，整卡同高无跳变 ══
   高度构成（与真卡同式同值，逐段对应 .pg-card；容器均用块级排版，margin 不叠 gap）：
   边框 1+1 = 2
   body = pad 上 12 + 下 13 = 25（.pg-card-body 同式 12/14/13）
        + 头像行 62（.pg-sk-avatar-row min-height = 头像 62 圆，行右端 32 收藏位占位不加高）
        + 名称 margin(10 + 6) + 行盒 15×1.25 = 34.75（.pg-name 同式）
        + 描述 59（.pg-desc 同式 height:59px —— 上一轮的 12×1.65×3=59.4 作废）
        + meta margin(7 + 9) + 行盒 10×1.5 = 31（.pg-meta 同式）
        + 按钮 28（.pg-btn-chat 同高，设计稿 .start height:28px）
   合计 = 241.75px（真卡同式同值；两行 + 行距 12 + 底内距 12 = 507.5 = .pg-grid-wrap 的 min-height 算式，
   加载态恰好铺满该下限）
   配色：骨架壳沿用新卡的暖纸底 / 描边 / 圆角 10（消「加载 → 成卡」的形色跳变）；占位条仍用本页红-100 系
   （骨架不属于「卡片样式」，未被要求照搬设计稿，与卡片保持同暖色系即可） */
.pg-sk-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 202px; /* 与 .pg-card 同（设计稿 202，实际不生效但保持同源） */
    border: 1px solid rgba(100, 72, 51, .13);
    border-radius: 10px;
    background: linear-gradient(145deg, rgba(255, 253, 250, .95), rgba(250, 241, 230, .92));
}

.pg-sk-body {
    flex: 1;
    padding: 12px 14px 13px; /* 与 .pg-card-body 同式（设计稿 12/14/13） */
}

/* 头像行占位：与 .pg-avatar-row 同构（min-height 62 + 两端对齐） */
.pg-sk-avatar-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 62px;
}

/* 头像占位：与 .pg-avatar 同径（62 圆，设计稿取值，非 token） */
.pg-sk-avatar {
    width: 62px;
    height: 62px;
    flex-shrink: 0;
    border-radius: var(--r-full);
    background: var(--c-red-100);
    animation: pgPulse 1.2s ease-in-out infinite;
}

/* 收藏位占位：与 .pg-star 同径（32 圆，设计稿 .favorite 值），撑起头像行右端（不参与等高，行高由 62 主导） */
.pg-sk-star {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--c-red-100);
    animation: pgPulse 1.2s ease-in-out infinite;
}

/* 名称占位：与 .pg-name 行盒同高（15×1.25 = 18.75）+ 同外距（10 / 6） */
.pg-sk-name {
    width: 70%;
    height: calc(15px * 1.25);
    margin: 10px 0 6px;
    background: var(--c-red-100);
    border-radius: var(--r-sm);
    animation: pgPulse 1.2s ease-in-out infinite;
}

/* 简介占位：恒占三行高 59（与 .pg-desc 的 height:59px 逐像素相等），内分三条 */
.pg-sk-desc {
    display: flex;
    flex-direction: column;
    gap: var(--s1);
    width: 90%;
    height: 59px;
}

.pg-sk-sub {
    flex: 1;
    min-height: 0;
    background: var(--c-red-100);
    border-radius: var(--r-sm);
    animation: pgPulse 1.2s ease-in-out infinite;
}

/* meta 占位：与 .pg-meta 行盒同高（10×1.5 = 15）+ 同外距（7 / 9） */
.pg-sk-meta {
    width: 62%;
    height: calc(10px * 1.5);
    margin: 7px 0 9px;
    background: var(--c-red-100);
    border-radius: var(--r-sm);
    animation: pgPulse 1.2s ease-in-out infinite;
}

/* 按钮行占位：与 .pg-card-footer 同构（flex 左对齐）+ 28 高胶囊钮（与 .pg-btn-chat 同高，设计稿 .start 值） */
.pg-sk-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.pg-sk-btn {
    width: 94px; /* ≈「开始对话 →」内容宽（11px 字 ×4 + 空格箭头 + 左右内距 14×2），非等高因素 */
    height: 28px;
    background: var(--c-red-100);
    border-radius: 15px; /* 与 .pg-btn-chat 的圆角同式（设计稿 15） */
    animation: pgPulse 1.2s ease-in-out infinite;
}

/* 全页唯一 infinite：仅加载态出现 */
@keyframes pgPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .45; }
}

/* ══ 分页：40px 虚线圆钮（v3 触点豁免；居中不变）══
   v3.0：面板内距按设计稿 .pager{padding:0 14px 14px}（设计稿是 flex-end 右对齐，本页保持居中——分页逻辑与
   视觉不动）；原来的 margin-top:var(--s6) 保留，与 .pg-grid-wrap 的 12px 底内距合成卡与分页的留白 */
.pg-pager {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: var(--s2);
    margin-top: var(--s6);
    padding: 0 14px 14px;
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

/* ══ 动效 ③：hover / press 反馈（触屏不误触发位移） ══
   卡片 hover（上浮 / 头像缩放 / 收藏旋转 / 按钮上浮）已随单卡迁入 AgentCard.vue（v4.0）；
   本页仅保留状态卡印章的 hover（卡片 hover 的红边与抬升 = 用户要的「鼠标移入才出现」） */
@media (hover: hover) {
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

/* ══ ≤1180 的 4 列断点已在 v4.0 删除：4 列改为 .pg-grid 的基础规则，该媒体查询随之冗余 ══ */

/* ══ ≤996（唯一断点下半）：副题隐藏省垂直预算（§7）；工具带纵向堆叠、chips 换行；
   banner / 工具带 / 页脚内衬同收 --s4，守住 §2.1「全页一条左内容线」；
   v3.0：面板 .pg-col 的页边距同收 --s4（面板内距 12/14 不动——那是设计稿面板节奏） ══ */
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
        width: calc(100% - var(--s4) * 2);
    }

    /* **唯一一处对设计稿的主动偏离**：设计稿没有移动端规则（v4.0 起 4 列即基础规则），
       手机上 4 列会把 333px 级卡片压成 ~80px 不可用 → 断点上改自适应
       repeat(auto-fill, minmax(190px,1fr))：宽度不足自然降 3/2/1 列，1 条时也不被拉伸变形
       （沿用本页 v1.2 的 auto-fill 语义；190 为上一版验过的可读下限） */
    .pg-grid {
        grid-template-columns: repeat(auto-fill, minmax(min(190px, 100%), 1fr));
    }
}

/* ══ 动效降级：reduce 全量直出 ══ */
@media (prefers-reduced-motion: reduce) {
    .effect {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
    }

    /* 卡片相关降级（.pg-card hover 位移 / 头像缩放与曲线 / 浮层位移 / 收藏 pop / 按钮上浮）
       已随单卡迁入 AgentCard.vue（v4.0），本页不再列出 */
    .pg-state-seal::after {
        transition: none;
    }

    .pg-state:hover .pg-state-seal::after {
        transform: none;
    }

    .pg-sep {
        transition: none;
    }

    .pg-channel:hover .pg-sep {
        transform: none;
    }

    .pg-sk-avatar,
    .pg-sk-star,
    .pg-sk-name,
    .pg-sk-sub,
    .pg-sk-meta,
    .pg-sk-btn {
        animation: none;
    }

    .pg-skip {
        transition: none;
    }
}
</style>
