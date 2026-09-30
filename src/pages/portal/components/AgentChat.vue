<template>
    <!-- 自包含对话面板：对话头 + 折角提示条 + 消息区/骨架/空态 + AgentAppRunCore。
         不含返回链接 / footer / 玻璃 frame / PortalLayout（留在页面层），可脱离门户壳经 iframe 单独挂载 -->
    <div class="agent-chat">
        <!-- ══ ① 对话头（原 agentRun 页面自绘 .run-head 整段迁入） ══ -->
        <header class="run-head">
            <div class="head-id">
                <!-- 封面印章：按 avatar 数据三态渲染（图片 / fa 图标 / 「AI」圆章回退），
                     判别与背景样式取自 agent/avatarState.js（与广场卡 AgentCard 同口径）；
                     印章在名称左侧、纯装饰，故仍 aria-hidden（图片态不加 role=img 冗余播报） -->
                <div
                    class="head-seal"
                    :class="{ sk: appLoading }"
                    :style="!appLoading ? sealStyle : null"
                    aria-hidden="true"
                >
                    <template v-if="!appLoading">
                        <i v-if="sealAvatar.kind === 'icon'" :class="sealAvatar.value"></i>
                        <template v-else-if="sealAvatar.kind === 'disc'">AI</template>
                    </template>
                </div>
                <div class="head-meta">
                    <span v-if="appLoading" class="sk-name" aria-hidden="true"></span>
                    <h1 v-else class="head-name">{{ appName }}</h1>
                </div>
            </div>
            <div class="head-actions">
                <button
                    type="button"
                    class="btn-new"
                    :disabled="appLoading || appError || coreSending"
                    @click="onNewConversation"
                >新对话</button>
            </div>
        </header>

        <!-- 折角提示条：加载失败（§6.3） -->
        <div v-if="appError" class="run-notice" role="alert">
            <span>智能体加载失败，请稍后重试</span>
            <button type="button" @click="retryLoad">重试</button>
        </div>
        <!-- 折角提示条：断连/生成异常（§3.5/§6.4，可关闭纯告知条） -->
        <div v-else-if="coreNotice && !noticeDismissed" class="run-notice" role="alert">
            <span>生成中断或连接异常，可重新提问</span>
            <button type="button" @click="dismissNotice">关闭</button>
        </div>

        <!-- ══ ② 消息单列 ══ -->
        <div class="run-body">
            <div
                class="run-col"
                role="main"
                aria-label="对话区"
                :class="{ 'is-busy': appLoading || appError, 'is-flow': isFlow }"
                :aria-busy="appLoading ? 'true' : 'false'"
            >
                <!-- 对话核心（去路由化）：本组件接管头与空态，仅用 ref/:deep 交互 -->
                <AgentAppRunCore
                    ref="core"
                    :key="appId + '-' + coreReloadKey"
                    :app-id="appId"
                    @back="$emit('back')"
                    @loaded="onCoreLoaded"
                    @load-error="onCoreLoadError"
                />

                <!-- loading 骨架（自绘，§6.2） -->
                <div v-if="appLoading" class="run-skeleton" aria-hidden="true">
                    <div class="sk-row">
                        <div class="sk-av"></div>
                        <div class="sk-bub w60"></div>
                    </div>
                    <div class="sk-row rev">
                        <div class="sk-av"></div>
                        <div class="sk-bub w40"></div>
                    </div>
                </div>

                <!-- 空态覆盖层（自绘，§3.8/§6.1） -->
                <div v-if="showEmpty" class="run-empty">
                    <div class="empty-seal" aria-hidden="true">AI</div>
                    <h2 class="empty-title">开始与『{{ appName }}』对话</h2>
                    <p class="empty-sub">{{ emptySub }}</p>
                    <div class="empty-rule" aria-hidden="true">┈┈ ◈ ┈┈</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import AgentAppRunCore from './AgentAppRunCore.vue'
    // 头像三态判定 + 图片 ID → 背景样式（与广场卡 AgentCard 同口径的唯一实现，勿再本地另写一份）
    import { resolveAvatar, avatarBgStyle } from './agent/avatarState'

    export default {
        name: 'AgentChat',

        // 契约：props.appId 必传（对话应用 id）；back/loaded/load-error 转发 Core 事件给宿主页
        props: {
            appId: {
                type: [String, Number],
                required: true
            }
        },

        emits: ['back', 'loaded', 'load-error'],

        components: {
            AgentAppRunCore
        },

        data () {
            return {
                // ===== 应用数据（供对话头 / 空态）=====
                appLoading: true,
                appError: false,
                app: {
                    name: '',
                    appType: 'standard',
                    avatar: '',
                    icon: '',
                    welcomeText: ''
                },
                coreReloadKey: 0,

                // ===== Core 可观测状态（经 $refs.core 同步，null 守卫）=====
                coreReady: false,
                coreMessageCount: 0,
                coreSending: false,
                coreLoading: false,
                coreNotice: false,
                noticeDismissed: false
            }
        },

        computed: {
            appName () {
                return this.app && this.app.name ? this.app.name : '智能体应用'
            },

            // 模式标（标准助手 / 流程助手 tag）已按用户要求整段移除；isFlow 仍有他用——
            // 驱动消息列 .run-col.is-flow 的流程智能体金色左色条（见样式），故保留
            isFlow () {
                return !!(this.app && this.app.appType === 'workflow')
            },

            // 封面印章头像三态：app 行的 avatar（回退 icon 字段，口径同广场卡 AgentCard）
            sealAvatar () {
                const a = this.app || {}
                return resolveAvatar(a.avatar || a.icon)
            },

            // 图片态才有内联背景（icon / disc 态返回 null，样式走 .head-seal 既有规则）
            sealStyle () {
                return this.sealAvatar.kind === 'image'
                    ? avatarBgStyle(this.commonsJs, this.sealAvatar.value)
                    : null
            },

            emptySub () {
                const w = this.app && this.app.welcomeText
                return w && String(w).trim() ? w : '输入问题开始，支持流式输出与思考过程'
            },

            // 空态：应用加载结束、Core 就绪且消息为 0
            showEmpty () {
                return !this.appLoading && !this.appError && !this.coreLoading && this.coreReady && this.coreMessageCount === 0
            }
        },

        watch: {
            // 切换智能体（同组件复用，prop 变化）：重载应用数据并重建 Core 观察
            appId () {
                this.coreReady = false
                this.coreMessageCount = 0
                this.coreNotice = false
                this.noticeDismissed = false
                this.appLoading = true
                this.appError = false
                this.$nextTick(() => {
                    this.coreReady = true
                    this.wireCoreA11y()
                    this.syncCore()
                    this.bindCoreWatchers()
                })
            }
        },

        mounted () {
            this.appLoading = true
            this.appError = false
            this.$nextTick(() => {
                this.coreReady = true
                this.wireCoreA11y()
                this.syncCore()
                this.bindCoreWatchers()
            })
        },

        beforeUnmount () {
            if (this._coreUnwatchers) {
                this._coreUnwatchers.forEach(fn => {
                    try { fn() } catch (e) { /* 忽略清理异常 */ }
                })
                this._coreUnwatchers = null
            }
        },

        methods: {
            // ---------- 应用数据（由 Core 加载后回传，避免重复请求） ----------
            onCoreLoaded (data) {
                this.app = Object.assign({
                    name: '',
                    appType: 'standard',
                    avatar: '',
                    icon: '',
                    welcomeText: ''
                }, data || {})
                this.appError = false
                this.appLoading = false
                this.$emit('loaded', data)
                // Core 重建（重试）后重新补消息区语义
                this.$nextTick(() => this.wireCoreA11y())
            },

            onCoreLoadError () {
                this.appError = true
                this.appLoading = false
                this.app = {
                    name: '',
                    appType: 'standard',
                    avatar: '',
                    icon: '',
                    welcomeText: ''
                }
                this.$emit('load-error')
            },

            // 错误态「重试」：重建 Core（key 递增）触发其重新加载
            retryLoad () {
                this.appError = false
                this.appLoading = true
                this.coreReloadKey += 1
            },

            // ---------- Core 状态同步（$refs.core 非响应式，靠 watcher 订阅其内部 ref） ----------
            bindCoreWatchers () {
                if (this._coreUnwatchers) {
                    this._coreUnwatchers.forEach(fn => {
                        try { fn() } catch (e) { /* 忽略 */ }
                    })
                }
                this._coreUnwatchers = []
                // messages：深监听，驱动空态与错误/断连条
                this._coreUnwatchers.push(this.$watch(
                    () => (this.$refs.core ? this.$refs.core.messages : null),
                    () => this.syncCore(),
                    { deep: true }
                ))
                // sending：驱动新对话按钮禁用（名称后状态文案已移除）
                this._coreUnwatchers.push(this.$watch(
                    () => (this.$refs.core ? this.$refs.core.sending : false),
                    v => { this.coreSending = !!v },
                    { immediate: true }
                ))
                // loading：Core 自身加载中不显示空态
                this._coreUnwatchers.push(this.$watch(
                    () => (this.$refs.core ? this.$refs.core.loading : false),
                    v => { this.coreLoading = !!v },
                    { immediate: true }
                ))
            },

            syncCore () {
                const c = this.$refs.core
                if (!c) return
                const msgs = c.messages || []
                this.coreMessageCount = msgs.length
                const last = msgs[msgs.length - 1]
                // 末条消息对象变化时复位告知条关闭态（新错误可再次提醒）
                if (last !== this._lastNoticedMsg) {
                    this._lastNoticedMsg = last
                    this.noticeDismissed = false
                }
                this.coreNotice = !!(last && last.role === 'assistant' && (last.error || last.notice))
            },

            // Core 内部消息区补 A5 语义（消息列表 role=log / 键盘可滚）
            wireCoreA11y () {
                const c = this.$refs.core
                const box = c && c.$el ? c.$el.querySelector('.msg-box') : null
                if (!box) return
                box.setAttribute('role', 'log')
                box.setAttribute('aria-live', 'polite')
                box.setAttribute('aria-relevant', 'additions')
                box.setAttribute('aria-label', '消息列表')
                box.setAttribute('tabindex', '0')
            },

            // ---------- 交互（对话头按钮） ----------
            onNewConversation () {
                if (this.appLoading || this.appError || this.coreSending) return
                const c = this.$refs.core
                if (c && c.newConversation) c.newConversation()
            },

            dismissNotice () {
                this.noticeDismissed = true
            },

            // ---------- 对外方法（页面 skip-link / iframe 宿主调用，逐层转发到 Core） ----------
            // 聚焦输入框
            focusInput () {
                const c = this.$refs.core
                const inputRef = c && c.$refs ? c.$refs.inputRef : null
                if (inputRef && inputRef.focus) inputRef.focus()
            },

            // 新对话（等价对话头「新对话」钮，含加载/错误/生成中守卫）
            newConversation () {
                this.onNewConversation()
            },

            // 停止生成
            stop () {
                const c = this.$refs.core
                if (c && c.handleStop) c.handleStop()
            },

            // 发送：可选先回填输入文本再走 Core 发送（空应用 / 加载失败时不发）
            send (text) {
                const c = this.$refs.core
                if (!c || this.appLoading || this.appError) return
                if (typeof text === 'string' && text.trim()) c.input = text
                if (c.handleSend) c.handleSend()
            }
        }
    }
</script>

<style scoped lang="less">
/* ═══════════ v3 token 自足声明（值抄 PortalLayout 的 body.page-portal-v3）═══════════
   token 定义在 body 类上而非 :root，故本组件根节点自行再声明一份（color/type/space/
   radius/shadow/motion 全集；header-h / max 属门户壳层，不随）——脱离 PortalLayout
   单独挂载（iframe 页）时 var() 不丢、样式不塌；门户内挂载值相同，无视觉差异。 */
.agent-chat {
    /* ── Color（绛红校色 + 宣纸）── */
    --c-red-700: #7E2214;
    --c-red-600: #992A18;
    --c-red-500: #A31A0B;
    --c-red-100: rgba(153, 42, 24, .12);
    --c-red-glass: rgba(191, 52, 30, .25);
    --c-gold-500: #F69C20;
    --c-gold-300: #E2A93B;
    --c-paper: #EFE3D7;
    --c-paper-2: #F7EBDF;
    --c-ink: #1A1410;
    --c-ink-2: #3D342C;
    --c-muted: #8C847E;
    --c-white: #FFFFFF;
    --c-border: rgba(26, 20, 16, .12);
    --c-ring: rgba(246, 156, 32, .55);

    /* ── Type ── */
    --font-display: "Noto Serif SC", "Songti SC", "SimSun", Georgia, serif;
    --font-body: "Microsoft YaHei", "微软雅黑", "PingFang SC", "Segoe UI", sans-serif;
    --text-xs: 12px;
    --text-sm: 14px;
    --text-base: 16px;
    --text-lg: 18px;
    --text-xl: 22px;
    --text-2xl: 30px;
    --text-3xl: 40px;
    --text-4xl: 52px;
    --leading-tight: 1.2;
    --leading-body: 1.65;
    --tracking-wide: .12em;
    --tracking-wider: .2em;

    /* ── Space (base-8) ── */
    --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px; --s5: 20px;
    --s6: 24px; --s8: 32px; --s10: 40px; --s12: 48px; --s16: 64px; --s20: 80px;

    /* ── Radius / Shadow / Motion ── */
    --r-sm: 4px;
    --r-md: 8px;
    --r-lg: 16px;
    --r-full: 999px;
    --shadow-sm: 0 1px 3px rgba(26, 20, 16, .08);
    --shadow-md: 0 8px 24px rgba(26, 20, 16, .12);
    --shadow-lg: 0 16px 40px rgba(26, 20, 16, .16);
    --t-fast: 150ms ease;
    --t-base: 250ms ease;
    --t-scene: 700ms ease-in-out;

    /* ── 独立挂载文本基线（与 body.page-portal-v3 同值，门户内无视觉变化）── */
    box-sizing: border-box;
    font-family: var(--font-body);
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--c-ink-2);

    /* ── 高度链：填满宿主容器（页面玻璃 frame 或 iframe 挂载点），纵向分区 ── */
    height: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

/* ══ ① 对话头：72px，底发丝虚线 ══ */
.run-head {
    flex-shrink: 0;
    height: 72px;
    padding: 0 var(--s5);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s4);
    border-bottom: 1px dashed rgba(153, 42, 24, .25);
    animation: runIn .7s ease both;
}

.head-id {
    display: flex;
    align-items: center;
    gap: var(--s3);
    min-width: 0;
}

/* 封面印章：圆章 + 金边（尺寸 48 不变）。
   icon 态由模板渲染 <i :class>（字号继承 var(--text-lg)）；disc/空 态由模板渲染「AI」两字母
   （网格居中 + 下方 font-display/700/var(--text-lg) 即为原 AI 章观感）；
   image 态吃模板内联背景（avatarBgStyle：纸色垫底 + cover 铺满）→ overflow 裁圆，图片不越界 */
.head-seal {
    width: 48px;
    height: 48px;
    border-radius: var(--r-full);
    border: 2px solid var(--c-gold-500);
    background: var(--c-red-glass);
    display: grid;
    place-items: center;
    overflow: hidden;
    color: var(--c-gold-500);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: var(--text-lg);
    flex-shrink: 0;
}

.head-meta {
    display: flex;
    align-items: center;
    gap: var(--s2);
    min-width: 0;
}

.head-name {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    letter-spacing: .06em;
    color: var(--c-ink);
    max-width: 12em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 模式标（标准助手 / 流程助手）已整段移除：模板与样式（.head-tag / .head-tag.flow）一并删除 */

.head-actions {
    display: flex;
    align-items: center;
    gap: var(--s3);
    flex-shrink: 0;
}

/* 新对话：低调小尺寸细边文字钮（红字红细边，hover 金；::after 扩触点至 44px 不增视觉体量） */
.btn-new {
    position: relative;
    height: 34px;
    padding: 0 var(--s3);
    border: 1px solid var(--c-red-600);
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--c-red-600);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    cursor: pointer;
    transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast), opacity var(--t-fast);
}

/* 触点扩至 44px 的透明层（视觉体量不变） */
.btn-new::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 44px;
}

.btn-new:hover:not([disabled]) {
    border-color: var(--c-gold-500);
    color: var(--c-gold-500);
}

.btn-new[disabled] {
    opacity: .4;
    cursor: default;
}

/* ══ 折角提示条（失败 / 断连） ══ */
.run-notice {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--s4);
    padding: var(--s2) var(--s5);
    background: var(--c-paper);
    border-bottom: 1px dashed rgba(153, 42, 24, .25);
    border-left: 3px solid var(--c-red-600);
    font-size: var(--text-sm);
    color: var(--c-ink-2);
}

.run-notice button {
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

.run-notice button:hover {
    background: var(--c-red-600);
    color: var(--c-white);
}

/* ══ ② 消息单列：占满面板全宽 ══ */
.run-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    padding: 0 var(--s5) var(--s5);
}

.run-col {
    position: relative;
    min-width: 0;
    min-height: 0;
}

/* ═══════════ Core 覆盖（:deep 刻意多套一层祖先 class 提高特异性，全部自 index.vue 迁入） ═══════════ */

/* 隐藏 Core 自带头与空态（本组件接管） */
:deep(.ai-agent-app-run) .run-header {
    display: none;
}

:deep(.ai-agent-app-run) .empty-tip {
    display: none;
}

/* 高度链：Core 填满单列，仅消息区内滚 */
:deep(.ai-agent-app-run) {
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0;
    background: transparent;
}

:deep(.ai-agent-app-run) .msg-box {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    margin: 0;
    padding: var(--s5) var(--s4);
    background: var(--c-paper-2);
    border: 0;
    border-bottom: 1px dashed rgba(153, 42, 24, .25);
    border-radius: 0;
}

/* ══ 滚动条：消息区 / 代码块 pre / 输入 textarea 自绘（9px 细轨 + 红玻璃胶囊滑块，FF thin 兜底，替换浏览器初始样式） ══ */
:deep(.ai-agent-app-run) .msg-box,
:deep(.ai-agent-app-run) .input-area textarea,
:deep(.ai-agent-app-run) .markdown-body pre.code-block-wrapper,
:deep(.ai-agent-app-run) .markdown-body code.code-block-body {
    scrollbar-width: thin;
    scrollbar-color: var(--c-red-glass) transparent;
}

:deep(.ai-agent-app-run) .msg-box::-webkit-scrollbar,
:deep(.ai-agent-app-run) .input-area textarea::-webkit-scrollbar,
:deep(.ai-agent-app-run) .markdown-body pre.code-block-wrapper::-webkit-scrollbar,
:deep(.ai-agent-app-run) .markdown-body code.code-block-body::-webkit-scrollbar {
    width: 9px;
    height: 9px;
}

:deep(.ai-agent-app-run) .msg-box::-webkit-scrollbar-track,
:deep(.ai-agent-app-run) .input-area textarea::-webkit-scrollbar-track,
:deep(.ai-agent-app-run) .markdown-body pre.code-block-wrapper::-webkit-scrollbar-track,
:deep(.ai-agent-app-run) .markdown-body code.code-block-body::-webkit-scrollbar-track {
    background: transparent;
}

:deep(.ai-agent-app-run) .msg-box::-webkit-scrollbar-thumb,
:deep(.ai-agent-app-run) .input-area textarea::-webkit-scrollbar-thumb,
:deep(.ai-agent-app-run) .markdown-body pre.code-block-wrapper::-webkit-scrollbar-thumb,
:deep(.ai-agent-app-run) .markdown-body code.code-block-body::-webkit-scrollbar-thumb {
    background: var(--c-red-glass);
    background-clip: padding-box;
    border: 2px solid transparent;
    border-radius: var(--r-full);
}

:deep(.ai-agent-app-run) .msg-box::-webkit-scrollbar-thumb:hover,
:deep(.ai-agent-app-run) .input-area textarea::-webkit-scrollbar-thumb:hover,
:deep(.ai-agent-app-run) .markdown-body pre.code-block-wrapper::-webkit-scrollbar-thumb:hover,
:deep(.ai-agent-app-run) .markdown-body code.code-block-body::-webkit-scrollbar-thumb:hover {
    background: var(--c-red-700);
    background-clip: padding-box;
}

:deep(.ai-agent-app-run) .msg-box::-webkit-scrollbar-corner,
:deep(.ai-agent-app-run) .input-area textarea::-webkit-scrollbar-corner,
:deep(.ai-agent-app-run) .markdown-body pre.code-block-wrapper::-webkit-scrollbar-corner,
:deep(.ai-agent-app-run) .markdown-body code.code-block-body::-webkit-scrollbar-corner {
    background: transparent;
}

/* ══ 消息行 / 头像 / 气泡 ══ */
:deep(.ai-agent-app-run) .msg-item {
    margin: 0;
    gap: var(--s3);
    animation: msgIn .25s ease both;
}

:deep(.ai-agent-app-run) .msg-item + .msg-item {
    margin-top: var(--s5);
}

:deep(.ai-agent-app-run) .msg-main {
    max-width: min(80%, 720px);
}

:deep(.ai-agent-app-run) .avatar {
    width: 40px;
    height: 40px;
    border-radius: var(--r-full);
    flex-shrink: 0;
    overflow: hidden; /* 图片态（内联背景 cover）裁圆，不越出金边 */
    font-size: var(--text-sm);
    background: var(--c-red-glass);
    border: 2px solid var(--c-gold-500);
    color: var(--c-gold-500);
}

:deep(.ai-agent-app-run) .avatar.user {
    background: var(--c-red-600);
    border-color: var(--c-red-600);
    color: var(--c-white);
    font-family: var(--font-body);
}

/* 智能体消息头像：三态（图片 / fa 图标 / 「AI」圆章）自本组件模板层撤出，
   改由 AgentAppRunCore 模板按 avatar 数据自行渲染（判别复用 agent/avatarState.js）。
   这里只保留圆尺寸 / 金边 / 底色 / 字色，不再用 ::after 强制「AI」、也不再隐藏 <i>
   ——图标的字号由 Core 侧 .avatar.assistant i 给定，「AI」字由 Core 侧 .av-disc 给定。 */

:deep(.ai-agent-app-run) .msg-bubble {
    padding: var(--s3) var(--s4);
    border-radius: 0;
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    word-break: break-word;
    background: var(--c-white);
    color: var(--c-ink-2);
    border: 1px solid var(--c-border);
    border-left: 3px solid var(--c-red-600);
    transition: box-shadow var(--t-base);
}

/* 用户：浅红底深红字（--c-red-100 上叠 1px --c-red-600 细边保留识别，字色 --c-red-700 对比约 8:1）+ 右下 14px 切角 */
:deep(.ai-agent-app-run) .msg-item.user .msg-bubble {
    background: var(--c-red-100);
    color: var(--c-red-700);
    border: 1px solid var(--c-red-600);
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%);
}

/* 流程智能体：左色条换金 */
.run-col.is-flow :deep(.ai-agent-app-run) .msg-item.assistant .msg-bubble {
    border-left-color: var(--c-gold-500);
}

/* 错误气泡（放最后，压过 AI 白底） */
:deep(.ai-agent-app-run) .msg-bubble.error {
    background: var(--c-red-100);
    border: 1px solid var(--c-red-600);
    border-left: 3px solid var(--c-red-600);
    color: var(--c-ink-2);
}

:deep(.ai-agent-app-run) .user-text {
    margin: 0;
    font-family: var(--font-body);
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    white-space: pre-wrap;
    word-break: break-word;
    color: inherit;
}

/* 流式光标：金 */
:deep(.ai-agent-app-run) .cursor-blink {
    width: 7px;
    height: 16px;
    background: var(--c-gold-500);
    animation: agent-blink 1s step-end infinite;
}

/* ══ 思考折叠卡 ══ */
:deep(.ai-agent-app-run) .reasoning-block {
    margin-bottom: var(--s2);
    border: 1px dashed var(--c-gold-500);
    border-radius: var(--r-sm);
    background: var(--c-paper);
    overflow: hidden;
}

:deep(.ai-agent-app-run) .reasoning-summary {
    display: flex;
    align-items: center;
    gap: var(--s2);
    min-height: 44px;
    padding: var(--s2) var(--s3);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 400;
    color: var(--c-red-700);
    cursor: pointer;
    user-select: none;
}

:deep(.ai-agent-app-run) .reasoning-summary > i {
    display: none;
}

:deep(.ai-agent-app-run) .reasoning-summary::before {
    content: '◈';
    color: var(--c-gold-500);
}

:deep(.ai-agent-app-run) .reasoning-toggle-hint {
    margin-left: auto;
    color: var(--c-muted);
    font-weight: 400;
    font-size: var(--text-xs);
}

:deep(.ai-agent-app-run) .reasoning-toggle-hint::after {
    content: ' ▾';
}

:deep(.ai-agent-app-run) .reasoning-block:has(.reasoning-content) .reasoning-toggle-hint::after {
    content: ' ▴';
}

:deep(.ai-agent-app-run) .reasoning-content {
    padding: var(--s2) var(--s3);
    border-top: 1px dashed var(--c-gold-500);
    font-size: var(--text-sm);
    line-height: 1.6;
    color: var(--c-ink-2);
    white-space: pre-wrap;
    word-break: break-word;
}

/* notice 行 */
:deep(.ai-agent-app-run) .notice-text {
    margin-top: var(--s2);
    padding-top: var(--s2);
    border-top: 1px dashed rgba(153, 42, 24, .25);
    font-size: var(--text-xs);
    color: var(--c-ink-2);
}

:deep(.ai-agent-app-run) .notice-text > i {
    display: none;
}

:deep(.ai-agent-app-run) .notice-text::before {
    content: '◈ ';
    color: var(--c-gold-500);
}

/* ══ markdown 正文（v-html 子元素覆盖） ══ */
:deep(.ai-agent-app-run) .markdown-body {
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--c-ink-2);
}

:deep(.ai-agent-app-run) .markdown-body p {
    margin: 6px 0;
}

:deep(.ai-agent-app-run) .markdown-body ul,
:deep(.ai-agent-app-run) .markdown-body ol {
    padding-left: 22px;
    margin: 6px 0;
}

:deep(.ai-agent-app-run) .markdown-body li {
    margin: 2px 0;
}

:deep(.ai-agent-app-run) .markdown-body h1,
:deep(.ai-agent-app-run) .markdown-body h2,
:deep(.ai-agent-app-run) .markdown-body h3,
:deep(.ai-agent-app-run) .markdown-body h4 {
    margin: var(--s3) 0 var(--s2);
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--c-ink);
}

:deep(.ai-agent-app-run) .markdown-body h1 { font-size: var(--text-lg); }
:deep(.ai-agent-app-run) .markdown-body h2 { font-size: var(--text-base); }
:deep(.ai-agent-app-run) .markdown-body h3,
:deep(.ai-agent-app-run) .markdown-body h4 { font-size: var(--text-sm); }

/* 链接：红 → hover 金（替换原蓝） */
:deep(.ai-agent-app-run) .markdown-body a {
    color: var(--c-red-600);
    transition: color var(--t-fast);
}

:deep(.ai-agent-app-run) .markdown-body a:hover {
    color: var(--c-gold-500);
}

/* 引用：左红条 + 宣纸底 */
:deep(.ai-agent-app-run) .markdown-body blockquote {
    margin: 6px 0;
    padding: var(--s1) var(--s3);
    border-left: 3px solid var(--c-red-600);
    background: var(--c-paper);
    color: var(--c-ink-2);
}

:deep(.ai-agent-app-run) .markdown-body table {
    border-collapse: collapse;
    margin: var(--s2) 0;
    display: block;
    overflow-x: auto;
}

:deep(.ai-agent-app-run) .markdown-body th,
:deep(.ai-agent-app-run) .markdown-body td {
    border: 1px solid var(--c-border);
    padding: var(--s2) var(--s3);
}

:deep(.ai-agent-app-run) .markdown-body th {
    background: var(--c-paper);
}

:deep(.ai-agent-app-run) .markdown-body pre.code-block-wrapper {
    margin: var(--s2) 0;
    border: 1px solid var(--c-border);
    border-radius: var(--r-sm);
    background: var(--c-paper);
    max-height: 420px;
    overflow: auto;
}

:deep(.ai-agent-app-run) .markdown-body code.code-block-body {
    display: block;
    padding: var(--s3);
    font-size: 13px;
    line-height: 1.5;
    overflow-x: auto;
    background: var(--c-white);
}

:deep(.ai-agent-app-run) .markdown-body code:not(.hljs) {
    padding: 1px var(--s1);
    border-radius: var(--r-sm);
    background: var(--c-red-100);
    color: var(--c-red-700);
    font-size: 13px;
}

:deep(.ai-agent-app-run) .markdown-body .katexmath-block {
    margin: var(--s2) 0;
    padding: var(--s3);
    border: 1px solid var(--c-border);
    border-radius: var(--r-sm);
    background: var(--c-paper);
    overflow-x: auto;
}

:deep(.ai-agent-app-run) .markdown-body img {
    max-width: 100%;
    border: 1px solid var(--c-border);
}

/* ══ 停止悬浮钮：生成中浮于消息区底缘、输入框上方（负 margin 上提压住消息区，z-index 盖过消息，距输入框 = input-area 自带 margin-top s3） ══ */
:deep(.ai-agent-app-run) .stop-float {
    position: relative;
    z-index: 2;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    margin-top: calc(var(--s6) * -1);
    pointer-events: none; /* 仅钮本身可点，不挡下方消息选择 */
    animation: msgIn .25s ease both;
}

:deep(.ai-agent-app-run) .stop-float-btn {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    gap: var(--s2);
    height: 36px;
    padding: 0 var(--s4);
    border: 1px solid var(--c-red-600);
    border-radius: var(--r-full);
    background: var(--c-white);
    color: var(--c-red-600);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    box-shadow: var(--shadow-md);
    cursor: pointer;
    transition: background var(--t-fast), color var(--t-fast);
}

:deep(.ai-agent-app-run) .stop-float-btn:hover {
    background: var(--c-red-600);
    color: var(--c-white);
}

/* ══ 输入区：2px 红框白底卡 ══ */
:deep(.ai-agent-app-run) .input-area {
    flex-shrink: 0;
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: var(--s1);
    position: relative;
    z-index: 1;
    margin-top: var(--s3);
    padding: var(--s3) var(--s4);
    background: var(--c-white);
    border: 2px solid var(--c-red-600);
    border-radius: var(--r-sm);
    box-shadow: var(--shadow-md);
    animation: runIn .7s ease .16s both;
}

/* 快捷键提示（Core 未渲染，用 ::after 补一行，容器底部；padding-right 让开右下角发送圆钮） */
:deep(.ai-agent-app-run) .input-area::after {
    content: 'Enter 发送 · Shift+Enter 换行';
    width: 100%;
    padding-right: 48px;
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--c-muted);
    line-height: var(--leading-tight);
}

:deep(.ai-agent-app-run) .input-area .ivu-input-wrapper {
    flex: 1;
    min-width: 0;
    /* 右侧留出 48px：正文不钻到右下角发送圆钮底下 */
    padding: 0 48px 0 0;
    background: transparent;
}

/* ══ 焦点路径全量归零（textarea 与外层红框融合为一体）══
   内层字段的所有可见描边通道一并压掉：基础 border / :hover / :focus /
   :focus-visible（含 body.page-portal-v3 的全局键盘焦点环）/ View UI 聚焦附加的
   .ivu-input-focus 类 / border-color / box-shadow / outline / radius / 内距。
   特异性靠 .ai-agent-app-run 祖先链抬高（[data-v] + .ai-agent-app-run +
   .input-area + …），压过 .ivu-input:focus 等库规则；焦点指示唯一来源 =
   外层 .run-composer:focus-within 金环（见下），防内层残留边框与双环 */
:deep(.ai-agent-app-run) .input-area textarea,
:deep(.ai-agent-app-run) .input-area textarea:hover,
:deep(.ai-agent-app-run) .input-area textarea:focus,
:deep(.ai-agent-app-run) .input-area textarea:focus-visible,
:deep(.ai-agent-app-run) .input-area textarea.ivu-input-focus,
:deep(.ai-agent-app-run) .input-area .ivu-input,
:deep(.ai-agent-app-run) .input-area .ivu-input:hover,
:deep(.ai-agent-app-run) .input-area .ivu-input:focus,
:deep(.ai-agent-app-run) .input-area .ivu-input:focus-visible,
:deep(.ai-agent-app-run) .input-area .ivu-input.ivu-input-focus {
    border: 0;
    border-color: transparent;
    border-radius: 0;
    box-shadow: none;
    outline: none;
    background: transparent;
    padding: 0;
    margin: 0;
}

/* 外层 wrapper 的焦点类：只清描边/光环，不碰布局（右让位 48px 规则见上，避免聚焦时文字位移） */
:deep(.ai-agent-app-run) .input-area .ivu-input-wrapper,
:deep(.ai-agent-app-run) .input-area .ivu-input-wrapper:focus-within,
:deep(.ai-agent-app-run) .input-area .ivu-input-wrapper.ivu-input-wrapper-focus,
:deep(.ai-agent-app-run) .input-area .ivu-input-wrapper-focus {
    border: 0;
    border-color: transparent;
    box-shadow: none;
    outline: none;
}

:deep(.ai-agent-app-run) .input-area textarea {
    /* 2 行起、5 行封顶精确高度贴合外框：min/max 与 2→5 行行高同源，去掉多余 min-height 空隙，外框随 autosize 同步长高；满 5 行后出滚动条 */
    min-height: calc(var(--text-sm) * var(--leading-body) * 2);
    max-height: calc(var(--text-sm) * var(--leading-body) * 5);
    overflow-y: auto;
    font-family: var(--font-body);
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--c-ink);
    resize: none;
}

/* 焦点指示落在外层容器：金环 2px + offset 3px（a11y 焦点不丢失，唯一焦点来源） */
:deep(.ai-agent-app-run) .input-area.run-composer:focus-within {
    outline: 2px solid var(--c-ring);
    outline-offset: 3px;
}

:deep(.ai-agent-app-run) .input-area textarea::placeholder {
    color: var(--c-muted);
}

:deep(.ai-agent-app-run) .input-area textarea[disabled] {
    background: var(--c-paper);
    color: var(--c-ink-2);
    -webkit-text-fill-color: var(--c-ink-2);
}

/* ══ 发送：右下角 32px 圆形红底白字图标钮（absolute 固定在输入框右下角内侧，offset 收至 --s2；提示行 padding-right 48px > 8+32 占位，不重叠） ══ */
:deep(.ai-agent-app-run) .send-round {
    position: absolute;
    right: var(--s2);
    bottom: var(--s2);
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: var(--r-full);
    background: var(--c-red-600);
    color: var(--c-white);
    font-size: var(--text-base);
    line-height: 1;
    cursor: pointer;
    z-index: 2;
    transition: background var(--t-fast), opacity var(--t-fast);
}

:deep(.ai-agent-app-run) .send-round:hover:not([disabled]) {
    background: var(--c-red-500);
}

:deep(.ai-agent-app-run) .send-round[disabled] {
    opacity: .4;
    cursor: default;
}

/* loading/失败：输入区禁用观感 */
.run-col.is-busy :deep(.ai-agent-app-run) .input-area {
    opacity: .5;
    pointer-events: none;
}

/* ══ 气泡 hover：仅 shadow 不位移 ══ */
@media (hover: hover) {
    :deep(.ai-agent-app-run) .msg-bubble:hover {
        box-shadow: var(--shadow-sm);
    }
}

/* ══ loading 骨架（覆盖消息区，输入区仍在最上层） ══ */
.run-skeleton {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: flex;
    flex-direction: column;
    gap: var(--s5);
    padding: var(--s5) var(--s4);
    background: var(--c-paper-2);
    pointer-events: none;
}

.sk-row {
    display: flex;
    gap: var(--s3);
}

.sk-row.rev {
    flex-direction: row-reverse;
}

.sk-av {
    width: 40px;
    height: 40px;
    border-radius: var(--r-full);
    background: var(--c-red-100);
    flex-shrink: 0;
    animation: runPulse 1.2s ease-in-out infinite;
}

.sk-bub {
    height: 48px;
    border-radius: var(--r-sm);
    background: var(--c-red-100);
    animation: runPulse 1.2s ease-in-out infinite;
}

.sk-bub.w60 { width: 60%; }
.sk-bub.w40 { width: 40%; }

/* 骨架：名称占位条（原「模式标」占位条 .sk-tag 随模式标一并删除） */
.sk-name {
    display: inline-block;
    width: 160px;
    height: 18px;
    background: var(--c-red-100);
    border-radius: var(--r-sm);
    animation: runPulse 1.2s ease-in-out infinite;
}

.head-seal.sk {
    border-color: var(--c-border);
    background: var(--c-red-100);
    box-shadow: none;
    animation: runPulse 1.2s ease-in-out infinite;
}

/* ══ 空态覆盖层（落在消息区） ══ */
.run-empty {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--s3);
    min-height: 320px;
    padding: var(--s6) var(--s6) calc(var(--s16) + var(--s6));
    background: var(--c-paper-2);
    text-align: center;
    animation: runIn .7s ease both;
}

.empty-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 700;
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

.empty-sub {
    margin: 0;
    max-width: 32em;
    font-size: var(--text-sm);
    color: var(--c-ink-2);
}

.empty-rule {
    margin-top: var(--s2);
    color: var(--c-gold-500);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wider);
}

/* 88 印章（空态；外虚线环 hover 翻转） */
.empty-seal {
    position: relative;
    width: 88px;
    height: 88px;
    border-radius: var(--r-full);
    background: linear-gradient(180deg, #fff8ef, var(--c-paper));
    box-shadow: inset 0 0 0 4px var(--c-red-100);
    display: grid;
    place-items: center;
    color: var(--c-red-600);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: var(--text-2xl);
}

.empty-seal::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: var(--r-full);
    border: 1px dashed var(--c-red-600);
    transition: transform .5s ease;
}

/* ══ 动效 keyframes（scoped 按文件改名，本组件引用故须自带定义） ══ */
@keyframes msgIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: none; }
}

@keyframes runIn {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: none; }
}

@keyframes runPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .45; }
}

@keyframes agent-blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}

/* ══ 唯一宽度断点：996（≤996 收窄内距） ══ */
@media (max-width: 996px) {
    .run-head {
        padding: 0 var(--s3);
    }

    .head-name {
        max-width: 6em;
    }

    .head-actions {
        gap: var(--s2);
    }

    .run-body {
        padding: 0 var(--s3) var(--s3);
    }

    :deep(.ai-agent-app-run) .msg-box {
        padding: var(--s4) var(--s3);
    }

    :deep(.ai-agent-app-run) .msg-main {
        max-width: min(88%, 100%);
    }

    :deep(.ai-agent-app-run) .input-area {
        padding: var(--s3);
    }

    .run-empty {
        padding: var(--s4) var(--s4) calc(var(--s16) + var(--s4));
    }

    .run-notice {
        padding: var(--s2) var(--s3);
    }
}

/* 装饰性翻转：仅 hover 设备（置于 reduced-motion 之前，便于降级覆盖） */
@media (hover: hover) {
    .empty-seal:hover::after {
        transform: rotateY(180deg);
    }
}

/* ══ reduced-motion：全量降级 ══ */
@media (prefers-reduced-motion: reduce) {
    .run-head,
    .run-empty,
    :deep(.ai-agent-app-run) .stop-float,
    :deep(.ai-agent-app-run) .input-area {
        animation: none;
    }

    :deep(.ai-agent-app-run) .msg-item {
        animation: none;
    }

    :deep(.ai-agent-app-run) .cursor-blink {
        animation: none;
        opacity: 1;
    }

    .sk-av,
    .sk-bub,
    .sk-name,
    .head-seal.sk {
        animation: none;
    }

    .empty-seal:hover::after {
        transform: none;
    }
}
</style>
