<template>
    <!-- 我的聚合页 /portal/mine：260px 浅色 banner（头像 + 问候 + 角色）+ 三卡主功能区（含动态计数）+ 次级入口带 + 绛红页脚 -->
    <!-- 规格：mimo/portal-mine设计计划-mimo.md v1.3（D1–D10 / §1–§9；计数位 §3.5⑤′、头像回退 §5-S3、同路径守卫 §5-S10） -->
    <!-- v1.2：覆盖式整卡主链接（§3.5）、「更多入口」系统管理员专属三链（§3.6）、banner 去说明行（§2.2/§3.3） -->
    <!-- v1.3：「我的收藏」入口整体移除（原卡 1 动作行提示钮）——覆盖式主链接结构保留，缘由见设计稿 D4 -->
    <div class="pm-page">
        <!-- 跳过导航：置于公共壳之前，保证「首焦点即现」（§3.1 / §8.1 A2） -->
        <a class="pm-skip" href="#pm-cards">跳到工作台入口</a>

        <!-- header 由公共壳 PortalLayout 持有（v1.1 决定 1）：实底态 + v3 token 层 -->
        <PortalLayout :solid="true">
            <div class="pm-body" :class="{ 'is-view': isView }">
                <!-- ══ BANNER：全幅 260px 浅色渐变（宣纸暖白系，零深色绛红），底缘 3px 绛红装订线 ══ -->
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

                <!-- ══ 主功能区：栏目头 + 三卡（主角） + 次级入口带，统一 --max 内衬 ══ -->
                <main class="pm-main">
                    <section class="pm-inner" aria-labelledby="pm-hub-title">
                        <div class="pm-channel pm-effect">
                            <h2 id="pm-hub-title" class="pm-h2">我的<span class="pm-sep" aria-hidden="true">◈</span>工作台</h2>
                            <p class="pm-sub">智能体 · 工作流 · 知识库，三处一键直达</p>
                        </div>

                        <!-- 三卡：div 卡体 + 首子元素「覆盖式主链接」——整卡点击 = 进入（含「进入」文字处）、整卡 :focus-visible 金环，
                             主链接是第一 tab 停靠点（v1.3 移除次级件后结构仍保留，缘由见设计稿 D4） -->
                        <div class="pm-cards" id="pm-cards" tabindex="-1">
                            <div
                                v-for="(c, i) in cards"
                                :key="c.path"
                                class="pm-card pm-effect"
                                :data-delay="i + 1"
                            >
                                <a
                                    class="pm-card-cover"
                                    :href="c.path"
                                    :aria-label="c.title + ' · 进入'"
                                    @click.prevent="goPath(c.path)"
                                ></a>
                                <div class="pm-card-head">
                                    <span class="pm-no">{{ c.no }}</span>
                                    <span class="pm-en">{{ c.en }}</span>
                                </div>
                                <span class="pm-wm" aria-hidden="true">{{ c.no }}</span>
                                <h3 class="pm-card-title">{{ c.title }}</h3>
                                <p class="pm-card-desc">{{ c.desc }}</p>
                                <!-- 能力行 + 右端计数位（同 baseline，槽位恒在 → 三态零布局跳动） -->
                                <div class="pm-skillrow">
                                    <span class="pm-skills">
                                        <span v-for="s in c.skills" :key="s" class="pm-skill"><span
                                            class="pm-ico"
                                            aria-hidden="true"
                                        >◈</span>{{ s }}</span>
                                    </span>
                                    <span class="pm-count">
                                        <template v-if="counts[c.count].status === 'loading'"><span
                                            class="pm-count-loading"
                                            aria-hidden="true"
                                        >···</span></template>
                                        <span v-else-if="counts[c.count].status === 'ok'">{{ counts[c.count].value }} 个</span>
                                    </span>
                                </div>
                                <div class="pm-card-act">
                                    <span class="pm-act-text">进入</span>
                                    <span aria-hidden="true">→</span>
                                </div>
                            </div>
                        </div>

                        <!-- 次级入口：发丝虚线上的 chips 行（非卡片，不与三卡抢戏）；系统管理员专属三链 -->
                        <nav v-if="isAdmin" class="pm-more pm-effect" data-delay="3" aria-label="更多入口">
                            <div class="pm-more-head">
                                <p class="pm-more-title">更多入口<span class="pm-sep" aria-hidden="true">◈</span></p>
                            </div>
                            <div class="pm-chips">
                                <a
                                    v-for="m in moreLinks"
                                    :key="m.path"
                                    class="pm-chip"
                                    :href="m.path"
                                    @click.prevent="onMoreLink(m)"
                                >{{ m.label }}</a>
                            </div>
                        </nav>
                    </section>
                </main>

                <!-- 页脚：共享组件 PortalFooter（全幅绛红 + 居中版权行，无虚线边、无内衬容器） -->
                <PortalFooter />
            </div>
        </PortalLayout>
    </div>
</template>

<script>
    import { mapState } from 'vuex'
    import PortalLayout from '../components/PortalLayout.vue'
    import PortalFooter from '../components/PortalFooter.vue'
    // 动态计数（v1.1 O1）：仅此三个既有只读接口，失败一律静默（§7-6 禁超范围请求）
    import { agentAppMine } from '@/api/agentApp'
    import { workflowList } from '@/api/workflow'
    import { kbListPage } from '@/api/kb'

    export default {
        name: 'PortalMine',

        components: {
            PortalLayout,
            PortalFooter
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

                // 三卡（页面结构文案，非业务数据；目标唯一，见 §1.2.1；v1.3 起三卡动作行一致 = 「进入 →」右对齐）
                cards: [
                    {
                        no: '壹',
                        en: 'MY AGENTS',
                        title: '我的智能体',
                        desc: '查看并管理你创建的智能体：提示词、头像与发布状态。',
                        skills: ['创建', '编辑', '发布状态'],
                        count: 'agents',
                        path: '/portal/mine/agents'
                    },
                    {
                        no: '贰',
                        en: 'WORKFLOWS',
                        title: '工作流',
                        desc: '用可视化画布编排节点，测试运行后保存上线。',
                        skills: ['流程列表', '画布编排', '测试运行'],
                        count: 'workflows',
                        // 工作流列表已不再独立成页，改从「我的智能体」页的「我的工作流」Tab 进入
                        path: '/portal/mine/agents?type=workflow'
                    },
                    {
                        no: '叁',
                        en: 'KNOWLEDGE BASE',
                        title: '知识库',
                        desc: '把讲义与文档入库切片，让回答有据可依。',
                        skills: ['知识库', '文档切片', '问答库'],
                        count: 'kb',
                        path: '/portal/kb'
                    }
                ],

                // 次级入口 chips（§3.6：「更多入口」= 系统管理员专属的模型支撑三链；kb 三子链与账号说明行已按 v1.2 删除）
                moreLinks: [
                    { label: '供应商管理', path: '/ai/llm/provider' },
                    { label: '模型管理', path: '/ai/llm/model' },
                    { label: '调用日志', path: '/ai/llm/calllog' }
                ]
            }
        },

        computed: {
            ...mapState('admin/user', ['info']),

            // 姓名：取不到留空（由 userChar 兜底「张」，口径同首页 greetText）
            userName () {
                const info = this.info || {}
                return info.xm ? String(info.xm) : ''
            },

            // 首字（头像 disc 与问候共用）
            userChar () {
                return this.userName ? this.userName.charAt(0) : '张'
            },

            // 问候：{xm首字}老师，下午好；缺失兜底「张老师，下午好」（§3.3，口径同 home greetText）
            greetText () {
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
            }
        },

        watch: {
            // store 恢复晚于挂载：info.avatar 回填后重判头像三态（§5-S1）
            avatarRaw: 'initAvatar'
        },

        mounted () {
            this._pmAlive = true
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
            // ---------- 跳转（仓库既有 goPath 写法：同目标直接返回 + 吞重复导航错误）----------
            goPath (path) {
                if (!path) return
                if (!this.$router) return
                // path 可能自带 ?query（工作流卡指向 /portal/mine/agents?type=workflow）：
                // 路由对象的 path 不含 query，直接比永远不命中，故按目标串形态选比对字段
                const cur = this.$route || {}
                const same = path.indexOf('?') === -1 ? cur.path === path : cur.fullPath === path
                if (same) return
                const result = this.$router.push(path)
                if (result && typeof result.catch === 'function') result.catch(() => {})
            },

            // 「更多入口」三链（后台页面）：先轻提示、再跳转（提示文案可按需调整）
            onMoreLink (m) {
                this.$Message.info('即将跳转到后台页面')
                this.goPath(m.path)
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
   用 animation 而非 transition：transition-delay 会连带拖慢卡片 hover 的 250ms 反馈，
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

/* 让 flex 列链路穿过公共壳（Vue 会把本页 scope-id 打到子组件根节点，故可命中 .portal-layout） */
.pm-page>.portal-layout {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
}

/* 壳内主体：banner / main / foot 的纵向容器；min-height 为满窗账兜底（88 + 主体 = 100dvh） */
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
    min-height: 260px;
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
    /* 卡片行吃满富余（≤420 封顶），残余由本层上下均分（§2.4 / D5） */
    justify-content: center;
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

.pm-sub {
    margin: var(--s3) 0 0;
    font-family: var(--font-display);
    font-size: var(--text-base);
    line-height: var(--leading-body);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink-2);
}

/* ── 三卡栅格（§3.5）── */
.pm-cards {
    flex: 1 1 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
    gap: var(--s6);
    min-height: 260px;
    max-height: 420px;
    scroll-margin-top: calc(var(--header-h) + var(--s4));
}

/* 整卡容器（v1.2 起为 div）：本体不设 clip-path / overflow，切角交给底板层（§8.1 A1：保焦点金环不被裁） */
.pm-card {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: var(--s6);
    color: inherit;
    /* 阴影挂本体（本体无 clip-path → 不被裁）；切角处 ≤18px 三角伪影为已知可接受 */
    box-shadow: var(--shadow-sm);
    transition: translate var(--t-base), box-shadow var(--t-base);
}

/* 底板：白底 + 1px 描边 + 直角 + 右下 18px 折角（§2.6 授权值） */
.pm-card::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: 0;
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
}

/* 左 3px 色条（丝带语汇）：hover 以 transform 加宽到 6px，不触布局 */
.pm-card::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    z-index: 1;
    background: var(--c-red-600);
    transform-origin: left;
    transition: transform var(--t-base);
}

/* 内容层抬到 0 层底板之上 */
.pm-card>* {
    position: relative;
    z-index: 1;
}

/* 覆盖式主链接（§3.5）：必须置于 .pm-card>* 之后以覆盖其 position:relative；
   盖满整卡 → 整卡点击 = 进入（含「进入」文字处）、整卡 :focus-visible 金环（cover 框即整卡） */
.pm-card-cover {
    position: absolute;
    inset: 0;
    z-index: 2;
}

.pm-card-head {
    display: flex;
    align-items: center;
    gap: var(--s3);
}

/* 序号方章（直角） */
.pm-no {
    width: var(--s8);
    height: var(--s8);
    flex-shrink: 0;
    display: inline-grid;
    place-items: center;
    background: var(--c-red-600);
    color: var(--c-white);
    font-family: var(--font-display);
    font-size: var(--text-base);
    transition: background var(--t-fast);
}

.pm-en {
    font-size: var(--text-xs);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wider);
    color: var(--c-muted);
}

/* 右上水印字（翻转图记语汇） */
.pm-wm {
    position: absolute;
    right: var(--s5);
    top: var(--s4);
    font-family: var(--font-display);
    font-size: var(--text-4xl);
    line-height: 1;
    color: var(--c-red-100);
    pointer-events: none;
    transition: transform .5s ease;
}

.pm-card-title {
    margin: var(--s3) 0 0;
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 700;
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

/* 说明恒占 2 行（与骨架式等高思路一致，卡高稳定） */
.pm-card-desc {
    margin: var(--s2) 0 0;
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--c-ink-2);
    min-height: calc(var(--text-sm) * var(--leading-body) * 2);
}

/* 能力行 + 计数位（同 baseline，§3.5⑤ / ⑤′） */
.pm-skillrow {
    display: flex;
    align-items: baseline;
    gap: var(--s3);
    margin-top: var(--s4);
}

.pm-skills {
    display: flex;
    flex-wrap: wrap;
    min-width: 0;
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--c-ink-2);
}

.pm-skill {
    display: inline-flex;
    align-items: center;
}

.pm-skill .pm-ico {
    margin-right: var(--s1);
    font-size: var(--text-xs);
    color: var(--c-red-600);
}

/* 项间分隔「·」（CSS content，零额外 DOM） */
.pm-skill+.pm-skill::before {
    content: '·';
    margin: 0 var(--s2);
    color: var(--c-muted);
}

/* 计数槽位：恒在 + 定宽右对齐 → loading / 成功 / 失败全程零布局跳动（§2.5-11） */
.pm-count {
    flex-shrink: 0;
    margin-left: auto;
    min-width: 4.5em;
    text-align: right;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: var(--text-xs);
    line-height: var(--leading-body);
    color: var(--c-red-600);
}

.pm-count-loading {
    font-family: var(--font-body);
    font-weight: 400;
    color: var(--c-muted);
}

/* 动作行（压到卡底）：右端「进入 →」成簇右对齐（文字与箭头相邻，gap var(--s2)）；
   层级沿用 .pm-card>* 的 z-index:1，低于覆盖链接(2) → 整行点击仍落到 cover = 进入 */
.pm-card-act {
    margin-top: auto;
    padding-top: var(--s3);
    border-top: 1px dashed rgba(153, 42, 24, .25);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--s2);
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    color: var(--c-red-600);
    transition: color var(--t-fast);
}

/* 金下划线只走图形通道（A8-⑤：金不做小字） */
.pm-act-text {
    border-bottom: 2px solid transparent;
    transition: border-color var(--t-fast);
}

@media (hover: hover) {
    .pm-card:hover {
        cursor: pointer;
        /* 位移用 translate（个体变换属性），与入场动画的 transform 互不抢占 */
        translate: 0 -4px;
        box-shadow: var(--shadow-md);
    }

    .pm-card:hover::after {
        transform: scaleX(2);
    }

    .pm-card:hover .pm-wm {
        transform: rotateY(180deg);
    }

    .pm-card:hover .pm-card-act {
        color: var(--c-red-500);
    }

    .pm-card:hover .pm-act-text {
        border-bottom-color: var(--c-gold-500);
    }
}

/* 按下即时反馈（§4.1②） */
.pm-card:active {
    translate: 0 -2px;
    box-shadow: var(--shadow-sm);
}

.pm-card:active .pm-no {
    background: var(--c-red-700);
}

/* ── 次级入口带（§3.6）── */
.pm-more {
    flex: 0 0 auto;
    margin-top: var(--s8);
    padding-top: var(--s6);
    border-top: 1px dashed rgba(153, 42, 24, .25);
}

.pm-more-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--s3);
}

.pm-more-title {
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--s2);
    font-family: var(--font-display);
    font-size: var(--text-base);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

/* chips：全断点强制可换行，禁止单行裁切（§6） */
.pm-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s3);
    margin-top: var(--s3);
}

.pm-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--s2);
    min-height: 44px;
    padding: 0 var(--s4);
    background: var(--c-white);
    border: 1px dashed var(--c-red-600);
    border-radius: var(--r-full);
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
    white-space: nowrap;
    text-decoration: none;
    cursor: pointer;
    transition: background var(--t-fast), border-color var(--t-fast), color var(--t-fast);
}

.pm-chip:hover {
    background: var(--c-red-100);
    border-style: solid;
}

.pm-chip:active {
    background: var(--c-red-700);
    border-color: var(--c-red-700);
    color: var(--c-white);
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

    /* hover 保留颜色反馈，去掉位移与翻转 */
    .pm-card,
    .pm-card:hover,
    .pm-card:active {
        translate: 0;
        transition: box-shadow var(--t-fast);
    }

    .pm-card::after,
    .pm-card .pm-wm,
    .pm-sep {
        transition: none;
    }

    .pm-card:hover::after,
    .pm-card:hover .pm-wm,
    .pm-channel:hover .pm-sep {
        transform: none;
    }
}
</style>
