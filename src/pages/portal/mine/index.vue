<template>
    <!-- 我的聚合页 /portal/mine：190px 浅色 banner（头像 + 问候 + 角色）+ 工作台（左栏目导航〔含管理员「更多入口」组〕/ 右内嵌内容面板）+ 绛红页脚 -->
    <!-- 规格：mimo/portal-mine设计计划-mimo.md v1.3（D1–D10 / §1–§9；计数位 §3.5⑤′、头像回退 §5-S3、同路径守卫 §5-S10） -->
    <!-- v1.2：覆盖式整卡主链接（§3.5）、「更多入口」系统管理员专属三链（§3.6）、banner 去说明行（§2.2/§3.3） -->
    <!-- v1.3：「我的收藏」入口整体移除（原卡 1 动作行提示钮）——覆盖式主链接结构保留，缘由见设计稿 D4 -->
    <!-- v2.0：三卡栅格改为工作台（旧版面留存于同目录 old_index.vue）——左 4 栏栏目导航 + 右内嵌原组件；
         切栏只更新 ?tab= 查询（不换路由路径），计数由原三卡计数槽位迁到对应导航项徽标 -->
    <!-- v2.1：banner 压到 190px、栏目头说明行删除；「更多入口」三链由工作台下方迁入左栏，
         以发丝分隔线隔开、仅系统管理员可见（数据与跳转逻辑不变，仅视觉降一级） -->
    <div class="pm-page">
        <!-- 跳过导航：置于公共壳之前，保证「首焦点即现」（§3.1 / §8.1 A2） -->
        <a class="pm-skip" href="#pm-work">跳到工作台入口</a>

        <!-- header 由 /portal 一级壳（PortalShell → PortalLayout）持有：实底态 + v3 token 层 -->
            <div class="pm-body" :class="{ 'is-view': isView }">
                <!-- ══ BANNER：全幅 190px 浅色渐变（宣纸暖白系，零深色绛红），底缘 3px 绛红装订线 ══ -->
                <section class="pm-banner" aria-label="用户与问候" @mousemove="onBannerMove" @mouseleave="onBannerLeave">
                    <!-- 装饰组（浅色化环组 + 山峦 + 巨型图记），纯装饰不朗读 -->
                    <span class="pm-art" ref="pmArt" aria-hidden="true">
                        <span class="pm-art-inner">
                            <span class="pm-rings"><span></span><span></span><span></span></span>
                            <span class="pm-mount"></span>
                            <span class="pm-mark">◈</span>
                        </span>
                    </span>

                    <div class="pm-banner-inner">
                        <div class="pm-user">
                            <!-- 头像三态：image（预载成功）/ icon（图标类名）/ disc（姓名首字，含图片失败回退） -->
                            <span class="pm-avatar">
                                <span
                                    v-if="avatarKind === 'image'"
                                    class="pm-avatar-img"
                                    role="img"
                                    :aria-label="avatarLabel"
                                    :style="avatarBg"
                                ></span>
                                <span
                                    v-else-if="avatarKind === 'icon'"
                                    class="pm-avatar-img"
                                    role="img"
                                    :aria-label="avatarLabel"
                                ><i :class="avatarValue" aria-hidden="true"></i></span>
                                <span v-else class="pm-avatar-disc" aria-hidden="true">{{ userChar }}</span>
                            </span>

                            <div class="pm-uinfo">
                                <p class="pm-kicker pm-effect"><span aria-hidden="true">◈</span>我的 · PERSONAL CENTER</p>
                                <h1 class="pm-greet pm-effect" data-delay="1">{{ greetText }}</h1>
                                <p v-if="roleName" class="pm-role-wrap pm-effect" data-delay="2">
                                    <span class="pm-role">{{ roleName }}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ══ 主功能区：栏目头 + 工作台（主角），统一 --max 内衬（「更多入口」组已随 v2.1 移入左栏）══ -->
                <main class="pm-main">
                    <section class="pm-inner" aria-labelledby="pm-hub-title">
                        <div class="pm-channel pm-effect">
                            <h2 id="pm-hub-title" class="pm-h2">我的<span class="pm-sep" aria-hidden="true">◈</span>工作台</h2>
                        </div>

                        <!-- 工作台（v2.0）：左侧栏目导航 + 右侧内容面板；切栏目只换 ?tab=，不做路由页跳转。
                             视觉对齐新 UI 设计稿（warm 宣纸底 + 朱砂红药丸激活项 + 圆角半透面板）。
                             #pm-work 即跳过链接落点（tabindex="-1" 保证可聚焦） -->
                        <div class="pm-work" id="pm-work" tabindex="-1">
                            <nav class="pm-nav pm-effect" data-delay="1" aria-label="工作台栏目">
                                <button
                                    v-for="t in tabs"
                                    :key="t.key"
                                    type="button"
                                    class="pm-nav-btn"
                                    :class="{ 'is-active': tab === t.key }"
                                    :aria-pressed="tab === t.key ? 'true' : 'false'"
                                    :aria-current="tab === t.key ? 'true' : null"
                                    @click="switchTab(t.key)"
                                >
                                    <span class="pm-nav-icon" aria-hidden="true">{{ t.icon }}</span>
                                    <span class="pm-nav-label">{{ t.label }}</span>
                                    <!-- 计数徽标：仅 status==='ok' 时出现（loading / fail 彻底不占位） -->
                                    <span v-if="navBadge(t.key)" class="pm-nav-badge">{{ navBadge(t.key) }}</span>
                                </button>

                                <!-- 「更多入口」组（v2.1 由工作台下方迁入左栏）：系统管理员专属的后台三链。
                                     发丝分隔线（.pm-nav-more 的 border-top）把常规栏目与后台入口分开；
                                     非管理员整组不渲染 —— 分隔线与条目一并消失，不留空档。
                                     条目沿用 .pm-nav-btn 的悬停 / 按下红染语言（.pm-nav-link 只降字号与常态色），
                                     故键盘焦点环与 44px 触摸高度与主栏目一致。 -->
                                <div v-if="isAdmin" class="pm-nav-more" role="group" aria-label="更多入口">
                                    <p class="pm-nav-more-title">更多入口<span aria-hidden="true">◈</span></p>
                                    <!-- 「更多入口」后台页：原生整页链接，新开标签打开（不再走 SPA 跳转、不再弹「即将跳转」提示）；
                                         ctrl/中键点击等新标签语义由浏览器原生支持 -->
                                    <a
                                        v-for="m in moreLinks"
                                        :key="m.path"
                                        class="pm-nav-btn pm-nav-link"
                                        :href="m.path"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    ><span class="pm-nav-label">{{ m.label }}</span></a>
                                </div>
                            </nav>

                            <!-- 内容面板：v-if 分栏 → 切走即卸载、切回重新挂载（各内嵌组件自行回读数据）；
                                 面板内不再加标题 / 检索，内嵌组件自带的头与工具条就是面板内容 -->
                            <div class="pm-panel pm-effect" data-delay="2">
                                <div class="pm-panel-body">
                                    <MineAgents v-if="tab === 'agents'" embedded mode="mine" />
                                    <MineAgents v-else-if="tab === 'workflows'" embedded mode="workflow" />
                                    <KbPage v-else-if="tab === 'kb'" embedded />
                                    <MineAgents v-else embedded mode="favorites" />
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <!-- 页脚：共享组件 PortalFooter（全幅绛红 + 居中版权行，无虚线边、无内衬容器） -->
                <PortalFooter />
            </div>
    </div>
</template>

<script>
    import { mapState } from 'vuex'
    import PortalFooter from '../components/PortalFooter.vue'
    // 工作台右栏内嵌组件：内嵌态（embedded=true）由组件自身去掉页级 chrome（banner / 页脚 / 版心内衬），
    // 顶栏统一由 /portal 一级壳持有，本页只做面板包裹
    import MineAgents from './agents/index.vue'
    import KbPage from '@/pages/portal/kb/index.vue'
    // 动态计数（v1.1 O1）：仅此三个既有只读接口，失败一律静默（§7-6 禁超范围请求）
    import { agentAppMine } from '@/api/agentApp'
    import { workflowList } from '@/api/workflow'
    import { kbListPage } from '@/api/kb'

    export default {
        name: 'PortalMine',

        components: {
            PortalFooter,
            MineAgents,
            KbPage
        },

        data () {
            return {
                // 入场族开关：挂载后下一帧一次性开启（§4.1①，不用 IntersectionObserver）
                isView: false,

                // 头像三态：image（图片预载成功）/ icon（图标类名）/ disc（姓名首字，含 O8 失败回退）
                avatarKind: 'disc',
                avatarValue: '',
                avatarBg: null,

                // 动态计数三态（§3.5⑤′）：loading / ok / fail —— fail 槽位留空，不提示不重试
                counts: {
                    agents: { status: 'loading', value: 0 },
                    workflows: { status: 'loading', value: 0 },
                    kb: { status: 'loading', value: 0 }
                },

                // 当前栏目：与 ?tab= 一一对应（agents / workflows / kb / favorites），
                // 未知或缺失一律回落 agents（见 syncTabFromRoute）
                tab: 'agents',

                // 左侧栏目标签（页面结构文案，非业务数据）：count 指向 counts 的槽位，收藏（favorites）无计数
                tabs: [
                    { key: 'agents', icon: '♙', label: '我的智能体', count: 'agents' },
                    { key: 'workflows', icon: '⊞', label: '工作流管理', count: 'workflows' },
                    { key: 'kb', icon: '▣', label: '知识库', count: 'kb' },
                    { key: 'favorites', icon: '☆', label: '我的收藏', count: null }
                ],

                // 次级入口（「更多入口」= 系统管理员专属后台链；原「模型支撑三链」之后增补「推荐管理」）
                moreLinks: [
                    { label: '供应商管理', path: '/ai/llm/provider' },
                    { label: '模型管理', path: '/ai/llm/model' },
                    { label: '调用日志', path: '/ai/llm/calllog' },
                    { label: '推荐管理', path: '/ai/agent-app/recommend' }
                ]
            }
        },

        computed: {
            ...mapState('admin/user', ['info']),

            // 姓名：取不到留空（不编造姓名；问候语由 userChar 兜底中性称谓）
            userName () {
                const info = this.info || {}
                return info.xm ? String(info.xm) : ''
            },

            // 首字（头像 disc 与问候共用）：无姓名时用中性字「用」，绝不编造真人姓氏
            userChar () {
                return this.userName ? this.userName.charAt(0) : '用'
            },

            // 问候：有姓名给「{姓}老师，下午好」；无姓名给中性问候「您好，下午好」（§3.3，口径同 home greetText）
            greetText () {
                if (!this.userName) return '您好，下午好'
                return this.userChar + '老师，下午好'
            },

            // 角色：trim 后为空则整枚胶囊不渲染（§3.3 / §5-S4）
            roleName () {
                const info = this.info || {}
                return info.jsmc ? String(info.jsmc).trim() : ''
            },

            // 「更多入口」可见性：系统管理员专属（§3.6，v1.2）
            // 判定口径 = 当前角色 info.jsmc 或角色集 info.role[].jsmc 任一**包含**「系统管理员」即真
            // （仓库无既有先例，按用户口径 + 实测数据实现；如需改为精确相等 / 补编码判定，改这里即可）
            isAdmin () {
                const info = this.info || {}
                const key = '系统管理员'
                const own = info.jsmc ? String(info.jsmc) : ''
                if (own.indexOf(key) > -1) return true
                const roles = Array.isArray(info.role) ? info.role : []
                for (let i = 0; i < roles.length; i++) {
                    const name = roles[i] && roles[i].jsmc ? String(roles[i].jsmc) : ''
                    if (name.indexOf(key) > -1) return true
                }
                return false
            },

            // 头像原始值（watch 用函数路径，避免 info 为空时的取值风险）
            avatarRaw () {
                const info = this.info || {}
                return info.avatar ? String(info.avatar) : ''
            },

            avatarLabel () {
                return (this.userName || '用户') + ' 头像'
            },

            // 合法栏目键集（路由 query 与点击入参的唯一校验口径）
            tabKeys () {
                return this.tabs.map(t => t.key)
            }
        },

        watch: {
            // store 恢复晚于挂载：info.avatar 回填后重判头像三态（§5-S1）
            avatarRaw: 'initAvatar',

            // 内外一致：地址栏 ?tab= 变化（前进/后退、外部改写）反向同步到当前栏目
            '$route.query': 'syncTabFromRoute'
        },

        mounted () {
            this._pmAlive = true
            // 首屏栏目取地址栏 ?tab=（未知 / 缺失 → agents）
            this.syncTabFromRoute()
            this.initAvatar()
            // 三个只读计数并发发出，各自独立静默降级（§3.5⑤′：不重试、不轮询）
            this.loadCounts()
            // 入场族：挂载后下一帧一次性加 is-view（§4.1①）
            this.$nextTick(() => {
                this.isView = true
            })
        },

        beforeUnmount () {
            // 预载回调的存活闸门（头像回退是单向切换，卸载后不再写状态）
            this._pmAlive = false
        },

        methods: {
            // 注：「更多入口」后台页改为原生整页新开标签（<a target="_blank">），
            // 原 goPath / onMoreLink（SPA 跳转 + 「即将跳转到后台页面」轻提示）一并下线

            // ---------- 工作台栏目（v2.0）：只动 ?tab=，路由路径恒为 /portal/mine ----------
            // 路由 query → 当前栏目（串 / 数组两种形态都兜住；未知值静默回落 agents）
            syncTabFromRoute () {
                const q = (this.$route && this.$route.query) || {}
                const raw = Array.isArray(q.tab) ? q.tab[0] : q.tab
                const key = raw === undefined || raw === null ? '' : String(raw)
                const next = this.tabKeys.indexOf(key) > -1 ? key : 'agents'
                if (this.tab !== next) this.tab = next
            },

            // 栏目点击：先切本地 tab（面板 v-if 立即换柱），再 replace 同步地址栏（不写历史、不换 path）
            switchTab (key) {
                if (this.tabKeys.indexOf(key) === -1) return
                const q = (this.$route && this.$route.query) || {}
                // 已是当前栏目且地址栏已带上同一 tab：不重复导航（同址 replace 无意义）
                if (this.tab === key && String(q.tab || '') === key) return
                this.tab = key
                if (!this.$router) return
                const result = this.$router.replace({
                    path: '/portal/mine',
                    query: Object.assign({}, q, { tab: this.tab })
                })
                // 吞掉重复导航等拒绝（仓库既有写法）
                if (result && typeof result.catch === 'function') result.catch(() => {})
            },

            // 导航项计数徽标：仅 status==='ok' 显示数字；loading / fail 返回空串（不渲染、不占位）
            navBadge (key) {
                const t = this.tabs.filter(x => x.key === key)[0]
                if (!t || !t.count) return ''
                const c = this.counts[t.count]
                return c && c.status === 'ok' ? String(c.value) : ''
            },

            // ---------- 动效偏好 ----------
            reduceMotion () {
                if (window.matchMedia) {
                    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
                }
                return false
            },

            // banner 装饰跟随视差：指针横移 → 装饰组 ≤8px，350ms（§4.1③b；reduce / 窄屏不写）
            onBannerMove (e) {
                if (this.reduceMotion() || window.innerWidth <= 996) return
                const art = this.$refs.pmArt
                if (!art || !e.currentTarget) return
                const r = e.currentTarget.getBoundingClientRect()
                if (!r.width) return
                const t = (e.clientX - r.left) / r.width - 0.5
                const x = Math.max(-8, Math.min(8, t * 16))
                art.style.transform = 'translateX(' + Number(x.toFixed(2)) + 'px)'
            },

            onBannerLeave () {
                const art = this.$refs.pmArt
                if (art) art.style.transform = ''
            },

            // ---------- 头像三态 + 图片失败回退（§5-S3 / O8）----------
            // 背景图不派发 error 事件 → 用 new Image() 预载监听 onerror；
            // 预载期间先显示首字圆章，成功后切换为图片（不闪空圆），失败静默保持首字。
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

            // 图片态背景：与首页 avatarBgStyle 同源（纸色垫底，避免图片未到时透明）
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

            // 从 getBackgroundImage 的 { 'background-image': "url('…')" } 中取出 URL
            extractBgUrl (bg) {
                const raw = (bg && bg['background-image']) || ''
                const m = String(raw).match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/)
                return m ? m[1] : ''
            },

            initAvatar () {
                const r = this.resolveAvatar(this.avatarRaw)
                if (r.kind === 'disc') {
                    // 无头像 / 非图片值 → 首字圆章（§5-S2）
                    this.avatarKind = 'disc'
                    this.avatarValue = ''
                    return
                }
                if (r.kind === 'icon') {
                    this.avatarKind = 'icon'
                    this.avatarValue = r.value
                    return
                }
                const bg = this.avatarBgStyle(r.value)
                const url = this.extractBgUrl(bg)
                if (!url) {
                    // 拿不到 URL：静默回落首字（不显示空圆）
                    this.avatarKind = 'disc'
                    this.avatarValue = ''
                    return
                }
                const img = new Image()
                img.onload = () => {
                    // 卸载后不再写状态（_pmAlive 未初始化视为存活）
                    if (this._pmAlive === false) return
                    this.avatarBg = bg
                    this.avatarKind = 'image'
                }
                img.onerror = () => {
                    // 图片加载失败：静默保持首字圆章（O8，不提示不重试）
                }
                img.src = url
            },

            // ---------- 动态计数（§3.5⑤′）----------
            loadCounts () {
                this.loadAgentCount()
                this.loadWorkflowCount()
                this.loadKbCount()
            },

            // 卡1：我创建的智能体 —— agentAppMine() 返回数组长度（home 同用法 Array.isArray 判定）
            async loadAgentCount () {
                try {
                    const res = await agentAppMine()
                    this.counts.agents = Array.isArray(res)
                        ? { status: 'ok', value: res.length }
                        : { status: 'fail', value: 0 }
                } catch (e) {
                    this.counts.agents = { status: 'fail', value: 0 }
                }
            },

            // 卡2：工作流 —— 兼容写法照 WorkflowList.vue:157（数组或 { list }）；失败静默
            async loadWorkflowCount () {
                try {
                    const data = await workflowList()
                    const rows = Array.isArray(data) ? data : (data && Array.isArray(data.list) ? data.list : [])
                    this.counts.workflows = { status: 'ok', value: rows.length }
                } catch (e) {
                    this.counts.workflows = { status: 'fail', value: 0 }
                }
            },

            // 卡3：知识库 —— kbListPage({ pageNum:1, pageSize:1 }) 的 total（KbList.vue:151-166 同源口径）
            async loadKbCount () {
                try {
                    const res = await kbListPage({ pageNum: 1, pageSize: 1 })
                    let total = null
                    if (res && typeof res.total === 'number') total = res.total
                    else if (res && Array.isArray(res.list)) total = res.list.length
                    else if (Array.isArray(res)) total = res.length
                    this.counts.kb = total === null
                        ? { status: 'fail', value: 0 }
                        : { status: 'ok', value: total }
                } catch (e) {
                    this.counts.kb = { status: 'fail', value: 0 }
                }
            }
        }
    }
</script>

<style scoped lang="less">
/* ══════════════════════════════════════════════════════════════
   我的聚合页 · v1.1 规格实现
   token 全部来自 body.page-portal-v3（PortalLayout 持有）；
   .pm-* 为本页私有前缀；非 token 值均见设计计划 §2.6 白名单。
   ══════════════════════════════════════════════════════════════ */

/* ── 入场族（§4.1①）：挂载后下一帧加 .is-view 触发；0.7s ease + data-delay 四档 ──
   用 animation 而非 transition：transition-delay 会连带拖慢导航项 hover 的 250ms 反馈，
   动画参数（0.7s ease / 0·.08·.16·.24s / opacity+translateY 28px）与规格逐项一致。 */
@keyframes pmIn {
    from {
        opacity: 0;
        transform: translateY(28px);
    }

    to {
        opacity: 1;
        transform: none;
    }
}

.pm-effect {
    opacity: 0;
}

.pm-body.is-view .pm-effect {
    animation: pmIn .7s ease both;
}

.pm-body.is-view .pm-effect[data-delay='1'] {
    animation-delay: .08s;
}

.pm-body.is-view .pm-effect[data-delay='2'] {
    animation-delay: .16s;
}

.pm-body.is-view .pm-effect[data-delay='3'] {
    animation-delay: .24s;
}

/* ── 页面骨架（§2.1）：100dvh + flex column + 让位固定顶栏 ── */
.pm-page {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding-top: var(--header-h);
}

/* 门户壳上提为 /portal 父路由后，本页根节点 .pm-page 直接挂在 .portal-layout 之下：
   原先「让 flex 列链路穿过公共壳」的 .pm-page > .portal-layout 规则已不再需要
   （.pm-body 现在是 .pm-page 的直接 flex 子项，min-height 兜底保持不变） */

/* 主体：banner / main / foot 的纵向容器；min-height 为满窗账兜底（88 + 主体 = 100dvh） */
.pm-body {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - var(--header-h));
    min-height: calc(100dvh - var(--header-h));
}

/* ── 跳过链接（§3.1）── */
.pm-skip {
    position: absolute;
    left: var(--s4);
    top: -48px;
    z-index: 100;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: var(--s2) var(--s4);
    background: var(--c-red-600);
    color: var(--c-white);
    border-radius: var(--r-sm);
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
    text-decoration: none;
    transition: top var(--t-fast);
}

.pm-skip:focus {
    top: var(--s4);
}

/* ══ BANNER（§2.2 / §3.2 / §3.3）══════════════════════════ */
.pm-banner {
    position: relative;
    overflow: hidden;
    flex: 0 0 auto;
    display: flex;
    min-height: 190px;
    /* 浅色 135deg 多段渐变：色标全为宣纸 / 白 token，零深色绛红 */
    background: linear-gradient(135deg, var(--c-white) 0%, var(--c-paper-2) 58%, var(--c-paper) 100%);
    /* 装订线：浅 banner 与宣纸正文之间的唯一强分界 */
    border-bottom: 3px solid var(--c-red-600);
}

/* 暖调晕（淡朱砂，--c-red-100） */
.pm-banner::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 62% 130% at 86% 12%, var(--c-red-100), transparent 64%);
    pointer-events: none;
}

/* 纸纹发丝斜线（§2.6 授权：北中医宣纸材质） */
.pm-banner::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(115deg, transparent 0 14px, rgba(153, 42, 24, .05) 14px 15px);
    pointer-events: none;
}

.pm-banner-inner {
    position: relative;
    z-index: 2;
    flex: 1 1 auto;
    max-width: var(--max);
    margin: 0 auto;
    padding: 0 var(--s6);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s6);
}

/* ── 装饰组：一次性入场漂移 1400ms + 指针视差 350ms（§4.1③）── */
.pm-art {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    /* 装饰组宽度取版心一半（token 派生，不引入手写 px）；>996 下恒 < 视口宽，不会越出 banner 左缘 */
    width: calc(var(--max) / 2);
    z-index: 1;
    pointer-events: none;
    transition: transform 350ms ease;
}

.pm-art-inner {
    position: absolute;
    inset: 0;
    opacity: 0;
    transform: translate3d(24px, 0, 0) scale(1.04);
    transition: opacity 1400ms ease-out, transform 1400ms ease-out;
    transition-delay: .2s;
}

.pm-body.is-view .pm-art-inner {
    opacity: 1;
    transform: none;
}

/* 环组（浅色化：发丝红虚线；200×200 为 §3.2 指定尺寸） */
.pm-rings {
    position: absolute;
    right: var(--s20);
    top: var(--s8);
    width: 200px;
    height: 200px;
}

.pm-rings span {
    position: absolute;
    inset: 0;
    border: 1px dashed rgba(153, 42, 24, .25);
    border-radius: var(--r-full);
}

.pm-rings span:nth-child(2) {
    inset: 18%;
}

.pm-rings span:nth-child(3) {
    inset: 36%;
}

/* 山峦 blush（转译首页 .mountain，浅色化） */
.pm-mount {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 60%;
    height: 58%;
    background:
        radial-gradient(ellipse 60% 45% at 30% 80%, var(--c-red-100), transparent 70%),
        radial-gradient(ellipse 50% 50% at 65% 95%, rgba(153, 42, 24, .08), transparent 70%);
}

/* 巨型图记 */
.pm-mark {
    position: absolute;
    right: calc(var(--s2) * -1);
    top: 50%;
    transform: translateY(-50%) scale(1.85);
    font-family: var(--font-display);
    font-size: var(--text-4xl);
    line-height: 1;
    color: var(--c-red-100);
    opacity: .6;
}

/* ── 用户信息块（§3.3）── */
.pm-user {
    display: flex;
    align-items: center;
    gap: var(--s5);
    min-width: 0;
}

.pm-avatar {
    position: relative;
    flex-shrink: 0;
    width: var(--s20);
    height: var(--s20);
    border-radius: var(--r-full);
    border: 2px solid var(--c-gold-500);
    background: linear-gradient(180deg, #fff8ef, var(--c-paper));
}

/* 外虚线环（v3 §5.7 圆章同构） */
.pm-avatar::after {
    content: '';
    position: absolute;
    inset: -6px;
    border: 1px dashed var(--c-red-600);
    border-radius: var(--r-full);
    pointer-events: none;
}

.pm-avatar>span {
    position: absolute;
    inset: 0;
    border-radius: var(--r-full);
    overflow: hidden;
    display: grid;
    place-items: center;
}

.pm-avatar-img {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    color: var(--c-red-600);
}

.pm-avatar-disc {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: var(--text-2xl);
    color: var(--c-red-600);
    background: linear-gradient(180deg, #fff8ef, var(--c-paper));
}

.pm-uinfo {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
}

.pm-kicker {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xs);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wider);
    color: var(--c-red-600);
}

/* 问候 h1：不截断（姓名属 essential text，§5-S5） */
.pm-greet {
    margin: var(--s2) 0 0;
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-weight: 700;
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

.pm-role-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s2);
    margin: var(--s3) 0 0;
}

.pm-role {
    padding: var(--s1) var(--s3);
    font-size: var(--text-xs);
    line-height: var(--leading-body);
    background: var(--c-white);
    border: 1px solid var(--c-red-600);
    border-radius: var(--r-full);
    color: var(--c-red-600);
}

/* ══ 主功能区（§2.3）══════════════════════════════════════ */
.pm-main {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    padding: var(--s10) 0 var(--s12);
}

/* 全页唯一内容内衬：max var(--max) + padding-inline --s6（§2.1 一条左内容线） */
.pm-inner {
    flex: 1 1 auto;
    width: 100%;
    max-width: var(--max);
    margin: 0 auto;
    padding-inline: var(--s6);
    display: flex;
    flex-direction: column;
    /* 工作台（v2.0）内容高度不定且远超一屏：顶层不再做垂直居中（居中会让超长内容向上溢出栏目头） */
    justify-content: flex-start;
}

/* ── 栏目头（§3.4）── */
.pm-channel {
    flex: 0 0 auto;
    margin-bottom: var(--s6);
}

.pm-h2 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--s3);
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 700;
    line-height: 1;
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

.pm-sep {
    width: 28px;
    height: 28px;
    display: inline-grid;
    place-items: center;
    flex-shrink: 0;
    font-size: var(--text-lg);
    color: var(--c-red-600);
    transition: transform .5s ease;
}

.pm-channel:hover .pm-sep {
    transform: rotateY(180deg);
}

/* ══ 工作台（v2.0）：左侧栏目导航 + 右侧内容面板 ══════════════════
   视觉对齐新 UI 设计稿 AI-Agent-Latest-UI-Perfect-HTML/index.html 的
   .sidebar / .nav / .nav button / .nav-icon / .panel：暖宣纸底 + 朱砂红药丸激活项 +
   圆角半透面板 + 柔影。设计稿色值以本区块私有变量 --wb-* 落在 .pm-work 上，
   页面级 --c-* 绛红 token（banner / 页脚 / 栏目头）一概不动。 */
.pm-work {
    /* ── 设计稿取色（仅本区块作用域内使用）── */
    --wb-red: #a82d1c;
    --wb-red-deep: #9e2818;
    --wb-red-bright: #d05235;
    --wb-muted: #8c8177;
    --wb-line: rgba(91, 63, 44, .13);
    --wb-panel-line: rgba(102, 73, 50, .12);

    flex: 1 1 auto;
    display: grid;
    /* 左栏 236px（设计稿 .sidebar 栏宽）+ 右栏吃满余宽；minmax(0,…) 防内嵌表格撑破栅格 */
    grid-template-columns: 236px minmax(0, 1fr);
    gap: var(--s6);
    align-items: start;
    min-height: 260px;
    scroll-margin-top: calc(var(--header-h) + var(--s4));
}

/* ── 左栏：栏目导航（设计稿 .sidebar 的栏宽 / 暖色底 / 分隔线，收进圆角半透面板）── */
.pm-nav {
    position: sticky;
    top: calc(var(--header-h) + var(--s4));
    align-self: start;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 18px;
    border: 1px solid var(--wb-line);
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(250, 240, 229, .97), rgba(245, 232, 216, .92));
    box-shadow: 0 5px 22px rgba(93, 61, 36, .06);
}

/* 宣纸发丝斜纹（设计稿侧栏底纹图以同族纸纹替代，不引图片资源） */
.pm-nav::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: inherit;
    background: repeating-linear-gradient(115deg, transparent 0 14px, rgba(153, 42, 24, .05) 14px 15px);
    pointer-events: none;
}

/* 栏目按钮（设计稿 .nav button）：高度抬到 44px 以满足触摸目标下限 */
.pm-nav-btn {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 44px;
    padding: 0 14px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #5e534b;
    font-family: var(--font-body);
    font-size: var(--text-base);
    line-height: var(--leading-tight);
    text-align: left;
    cursor: pointer;
    transition: background .22s ease, color .22s ease, transform .22s ease, box-shadow .22s ease;
}

/* 非激活悬停：朱砂淡染 + 3px 右移（设计稿 .nav button:hover） */
@media (hover: hover) {
    .pm-nav-btn:not(.is-active):hover {
        background: rgba(170, 54, 33, .07);
        color: var(--wb-red);
        transform: translateX(3px);
    }
}

/* 激活项：朱砂渐变药丸 + 白字（设计稿 .nav button.active） */
.pm-nav-btn.is-active {
    color: #fff;
    background: linear-gradient(100deg, var(--wb-red-deep), var(--wb-red-bright));
    box-shadow: 0 8px 20px rgba(168, 45, 28, .2);
}

/* 按下即时反馈（非激活项只加深底色，不引入药丸投影） */
.pm-nav-btn:not(.is-active):active {
    background: rgba(170, 54, 33, .12);
}

.pm-nav-icon {
    width: 18px;
    flex-shrink: 0;
    text-align: center;
    font-size: 18px;
    line-height: 1;
}

/* 标签吃满余宽，把计数徽标顶到右端 */
.pm-nav-label {
    flex: 1 1 auto;
    min-width: 0;
    white-space: nowrap;
}

/* 计数徽标：仅 status==='ok' 时渲染数字（loading / fail 完全不占位，口径同 §3.5⑤′） */
.pm-nav-badge {
    flex-shrink: 0;
    min-width: 1.8em;
    padding: 1px var(--s1);
    text-align: center;
    font-family: var(--font-display);
    font-size: var(--text-xs);
    line-height: 1.5;
    color: var(--wb-muted);
    background: rgba(255, 255, 255, .62);
    border: 1px solid var(--wb-line);
    border-radius: var(--r-full);
    transition: color .22s ease, background .22s ease, border-color .22s ease;
}

.pm-nav-btn.is-active .pm-nav-badge {
    color: #fff;
    background: rgba(255, 255, 255, .18);
    border-color: rgba(255, 255, 255, .45);
}

/* ── 「更多入口」组（v2.1 由工作台下方迁入左栏）：系统管理员专属 ──
   发丝分隔线（--wb-line，比主菜单 gap 略重）把常规栏目与后台入口分开；
   整组视觉降一级：标题取 --text-xs + --wb-muted，条目字号 --text-sm、常态色 muted，
   但复用 .pm-nav-btn 的悬停红染 / 按下加深 / 44px 触摸高度，交互手感与主栏目一致。
   整组由 v-if="isAdmin" 控制 —— 非管理员时连同分隔线一起不渲染。 */
.pm-nav-more {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: var(--s2);
    padding-top: var(--s3);
    border-top: 1px solid var(--wb-line);
}

.pm-nav-more-title {
    margin: 0 0 2px;
    display: flex;
    align-items: center;
    gap: var(--s2);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wider);
    color: var(--wb-muted);
}

/* 次级链接：无图标，用一枚小圆点占住与主按钮图标同宽的位置（6 + 两侧 6 = 18px），
   标签左缘因此与上方栏目文字对齐；圆点取 currentColor，悬停随文字一起转朱砂。 */
.pm-nav-link {
    min-height: 44px;
    font-size: var(--text-sm);
    color: var(--wb-muted);
    text-decoration: none;
}

.pm-nav-link::before {
    content: '';
    flex: 0 0 auto;
    width: 6px;
    height: 6px;
    margin: 0 6px;
    border-radius: var(--r-full);
    background: currentColor;
    opacity: .55;
}

/* ── 右栏：内容面板（设计稿 .panel）：圆角半透暖纸 + 柔影；
   只负责底色 / 描边 / 内衬与圆角，面板内不再加标题与检索，内嵌组件自带内容与内衬 ── */
.pm-panel {
    position: relative;
    min-height: 260px;
    padding: var(--s4);
    border: 1px solid var(--wb-panel-line);
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(255, 252, 247, .88), rgba(248, 237, 224, .78));
    box-shadow: 0 5px 22px rgba(93, 61, 36, .04);
}

/* 面板暖调纸纹（设计稿 .panel:after 的右上角纹理；改 inset 收敛，不裁剪内嵌内容） */
.pm-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: inherit;
    background:
        radial-gradient(circle at 82% 4%, rgba(210, 166, 116, .16), transparent 42%),
        repeating-linear-gradient(115deg, transparent 0 14px, rgba(153, 42, 24, .045) 14px 15px);
    pointer-events: none;
}

/* 内容层抬到纸纹之上 */
.pm-panel-body {
    position: relative;
    z-index: 1;
}

/* ══ 响应式：唯一断点 996（§6）═══════════════════════════ */
@media (max-width: 996px) {
    /* 内衬同收 --s4，守住「全页一条左内容线」 */
    .pm-banner-inner {
        padding-inline: var(--s4);
    }

    .pm-inner {
        padding-inline: var(--s4);
    }

    .pm-greet {
        font-size: var(--text-2xl);
    }

    /* 装饰整组隐藏（右侧让位） */
    .pm-art {
        display: none;
    }

    /* 入场直出全显（等效 data-delay 全置 0）——须与 .is-view 规则同权重才能盖过它 */
    .pm-effect,
    .pm-body.is-view .pm-effect {
        opacity: 1;
        animation: none;
    }

    /* 工作台：导航折到面板上方，横排单行可横滚（不换行、不塌成竖列） */
    .pm-work {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--s4);
    }

    .pm-nav {
        /* 折行后不再吸附；保留 relative 以兜住 ::before 纸纹的定位父级 */
        position: relative;
        flex-direction: row;
        gap: var(--s2);
        padding: var(--s2);
        overflow-x: auto;
        scrollbar-width: thin;
    }

    /* 横排按钮按内容宽收窄，44px 触摸高度不变 */
    .pm-nav-btn {
        width: auto;
        flex: 0 0 auto;
        min-height: 44px;
        padding: 0 var(--s3);
        white-space: nowrap;
    }

    /* 横滚容器内不做横移（位移会被裁掉，且横排方向语义相反） */
    .pm-nav-btn:not(.is-active):hover {
        transform: none;
    }

    /* 「更多入口」组横排跟进：分隔线由顶边改左边（竖线），标题与三链同排进横滚轴；
       整组不换行、不塌成竖列，非管理员时同为「无线无项」 */
    .pm-nav-more {
        flex-direction: row;
        align-items: center;
        gap: var(--s2);
        margin-top: 0;
        margin-left: var(--s2);
        padding-top: 0;
        padding-left: var(--s3);
        border-top: 0;
        border-left: 1px solid var(--wb-line);
    }

    .pm-nav-more-title {
        margin: 0;
        white-space: nowrap;
    }

    /* 横排下圆点不再需要撑满图标槽宽，右侧间距收到 --s1 */
    .pm-nav-link::before {
        margin: 0 var(--s1) 0 0;
    }
}

/* ══ prefers-reduced-motion（§4.3）：信息 100% 直出 ═══════ */
@media (prefers-reduced-motion: reduce) {
    .pm-effect,
    .pm-body.is-view .pm-effect {
        opacity: 1;
        animation: none;
    }

    .pm-art {
        transition: none;
    }

    .pm-art-inner {
        opacity: 1;
        transform: none;
        transition: none;
    }

    .pm-skip {
        transition: none;
    }

    /* hover 保留颜色 / 底色反馈，去掉位移（§4.3） */
    .pm-nav-btn {
        transition: background var(--t-fast), color var(--t-fast), box-shadow var(--t-fast);
    }

    .pm-nav-btn:not(.is-active):hover {
        transform: none;
    }

    .pm-nav-badge,
    .pm-sep {
        transition: none;
    }

    .pm-channel:hover .pm-sep {
        transform: none;
    }
}
</style>
