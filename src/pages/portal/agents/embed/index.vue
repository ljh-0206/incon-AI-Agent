<template>
    <!-- iframe 嵌入专用对话页：满屏无壳（无 PortalLayout / 返回行 / footer / 玻璃 frame），
         供其他项目经 <iframe src="/portal/agents/embed?agentId=<智能体id>"> 单独挂载 -->
    <div class="agent-embed">
        <!-- 缺参态：不挂载 AgentChat（空 id 会发起注定失败的请求并弹出误导性错误条），改给用法说明 -->
        <div v-if="!agentId" class="miss-state">
            <div class="miss-seal" aria-hidden="true">AI</div>
            <h1 class="miss-title">缺少 agentId 参数</h1>
            <p class="miss-sub">本页为智能体对话的嵌入入口，请在地址后携带智能体 id，示例：</p>
            <code class="miss-url">/portal/agents/embed?agentId=123</code>
            <div class="miss-rule" aria-hidden="true">┈┈ ◈ ┈┈</div>
        </div>

        <!-- 正常态：自包含对话面板直挂；back 事件在 iframe 内无跳转目标，刻意不接（no-op） -->
        <AgentChat v-else :app-id="agentId" />
    </div>
</template>

<script>
    import AgentChat from '@/pages/portal/components/AgentChat.vue'

    export default {
        name: 'PortalAgentEmbed',

        components: {
            AgentChat
        },

        computed: {
            // URL query 取参：?agentId=<智能体id>；缺参 / 空白归一为空串（模板 v-if 走缺参态）。
            // 无需自设 watcher：AgentChat 已 watch 其 appId prop 并重建 Core 重载数据，
            // computed 随 $route.query 变化触发该既有逻辑即可（见 AgentChat watch 块）。
            agentId () {
                const raw = this.$route.query ? this.$route.query.agentId : ''
                if (raw === undefined || raw === null) return ''
                return String(raw).trim()
            }
        }
    }
</script>

<style scoped lang="less">
/* ═══════════ v3 token 自足声明（值抄 PortalLayout 的 body.page-portal-v3，同 AgentChat 模式）═══════════
   token 定义在 body 类上而非 :root，本页不用 PortalLayout，故根节点自行再声明一份
   （color/type/space/radius/shadow/motion 全集；header-h / max 属门户壳层，不随、不用）
   ——缺参态与文本基线因此不依赖 body.page-portal-v3，独立挂载样式不塌。 */
.agent-embed {
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

    /* ── 独立挂载文本基线（与 body.page-portal-v3 同值）── */
    box-sizing: border-box;
    font-family: var(--font-body);
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--c-ink-2);
    -webkit-font-smoothing: antialiased;

    /* ── 高度链：整视口填充（无壳、无 --header-h 顶距），为 AgentChat 的
          height:100%; flex:1; min-height:0 提供确定高度的父级，仅消息区内滚 ── */
    width: 100%;
    height: 100vh;
    height: 100dvh;
    margin: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    /* 替代 body.page-portal-v3 的宣纸底（本页不挂 PortalLayout，body 底色不可依赖） */
    background: var(--c-paper);
}

/* ══ 缺参态：居中单列，视觉语言对齐 AgentChat 空态（印章 + 标题 + 说明 + 分隔符），类名本文件自持 ══ */
.miss-state {
    box-sizing: border-box;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--s3);
    padding: var(--s6);
    /* 与 AgentChat 空态同底，两态切换观感连续 */
    background: var(--c-paper-2);
    text-align: center;
    animation: missIn .7s ease both;
}

.miss-seal {
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
    flex-shrink: 0;
}

.miss-seal::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: var(--r-full);
    border: 1px dashed var(--c-red-600);
}

.miss-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 700;
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

.miss-sub {
    margin: 0;
    max-width: 32em;
    font-size: var(--text-sm);
    color: var(--c-ink-2);
}

/* 用法示例：白底红字细框 code 芯片，可整段选中复制；窄 iframe 内换行不断版 */
.miss-url {
    box-sizing: border-box;
    display: block;
    max-width: 100%;
    padding: var(--s2) var(--s4);
    background: var(--c-white);
    border: 1px dashed rgba(153, 42, 24, .35);
    border-radius: var(--r-sm);
    color: var(--c-red-700);
    font-family: Consolas, "Courier New", monospace;
    font-size: var(--text-sm);
    line-height: var(--leading-tight);
    word-break: break-all;
}

.miss-rule {
    margin-top: var(--s2);
    color: var(--c-gold-500);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wider);
}

/* ══ 动效 keyframes（scoped 按文件改名，本组件引用故自带定义） ══ */
@keyframes missIn {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: none; }
}

/* ══ 唯一宽度断点：996（沿用 AgentChat 约定；小 iframe 内收窄内距、印章缩号） ══ */
@media (max-width: 996px) {
    .miss-state {
        gap: var(--s2);
        padding: var(--s4);
    }

    .miss-seal {
        width: 72px;
        height: 72px;
        font-size: var(--text-xl);
    }

    .miss-title {
        font-size: var(--text-lg);
    }
}

/* ══ reduced-motion：全量降级 ══ */
@media (prefers-reduced-motion: reduce) {
    .miss-state {
        animation: none;
    }
}
</style>
