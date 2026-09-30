<template>
    <!-- 门户应用对话页：顶栏由 /portal 一级壳（PortalShell）渲染；本页 = 满屏工作台（返回行 + frame + footer） -->
    <!-- A2：跳过链接置于 .run-shell 内作首个可聚焦元素（自身 fixed 定位，不受父级 overflow 影响），
         最短路径直达输入框（经 AgentChat 暴露的 focusInput 转发到 Core 输入框） -->
    <!-- 满屏工作台：shell 纵向 flex = 返回行 + frame(flex:1) + footer(auto)，仅消息区内部滚动，footer 常驻可见 -->
    <div class="run-shell">
            <a class="skip-link" href="#" @click.prevent="focusInput">跳到输入框</a>

            <!-- 页面级返回行（frame 外、顶栏之下）：左对齐 · 无背景 · 纯文字链接，与玻璃内容框明确分隔 -->
            <div class="run-topbar">
                <button type="button" class="btn-back" @click="goBack">
                    <span class="back-full">← 返回</span>
                    <span class="back-short">← 返回</span>
                </button>
            </div>

            <!-- 唯一容器玻璃卡：对话面板（对话头/消息/空态/输入）整体内嵌，对话头从 frame 顶开始 -->
            <div class="run-frame">
                <AgentChat ref="chat" :app-id="$route.params.id" @back="goBack" />
            </div>

            <!-- 页级 footer（§5.13）：绛红底单行版权条；无链接无圆章快捷（无数据源不编造） -->
            <footer class="run-footer">
                <div class="footer-inner">
                    <span class="foot-mark" aria-hidden="true">◈</span>
                    <span class="foot-copy">© 北京赢科天地电子有限公司 · AI 智能问答</span>
                </div>
            </footer>
        </div>
</template>

<script>
    import AgentChat from '../components/AgentChat.vue'

    export default {
        name: 'PortalAgentRun',

        components: {
            AgentChat
        },

        methods: {
            // 返回上级路由：本页有多个入口（智能体广场卡片 / 首页「大家都在用」卡片 / 我创建的列表…），
            // 因此不做固定跳转，优先回退浏览器历史；直接打开链接（无历史）时兜底回门户首页
            goBack () {
                const history = this.$router && this.$router.options ? this.$router.options.history : null
                const backPath = history && history.state ? history.state.back : null
                if (backPath || (typeof window !== 'undefined' && window.history.length > 1)) {
                    this.$router.back()
                    return
                }
                this.$router.push('/portal/home')
            },

            // A2 跳过链接：转发到 AgentChat 的 focusInput（→ Core $refs.inputRef）
            focusInput () {
                const chat = this.$refs.chat
                if (chat && chat.focusInput) chat.focusInput()
            }
        }
    }
</script>

<style scoped lang="less">
/* ══ A2 跳过链接：聚焦滑入 ══ */
.skip-link {
    position: fixed;
    left: var(--s4);
    top: -48px;
    z-index: 40;
    padding: var(--s2) var(--s4);
    background: var(--c-red-600);
    color: var(--c-white);
    border-radius: var(--r-sm);
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
    transition: top var(--t-fast);
}

.skip-link:focus {
    top: var(--s4);
}

/* ══ 满屏工作台：shell 纵向 flex（返回行 + frame + footer），无 window 滚动 ══ */
.run-shell {
    height: 100vh;
    height: 100dvh;
    padding-top: var(--header-h);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* ══ 页面级返回行：frame 外独立一行，左对齐 · 无背景 · 纯文字链接（宽度/缩进对齐 frame 内容） ══ */
.run-topbar {
    flex-shrink: 0;
    width: 100%; /* 纵向 flex 交叉轴上 auto margin 会禁用 stretch，需显式撑满再由 max-width+auto 收窄居中 */
    max-width: var(--max);
    margin: 0 auto;
    padding: var(--s3) var(--s5) 0;
    display: flex;
    align-items: center;
    animation: runIn .7s ease both;
}

.btn-back {
    min-height: 44px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    border: 0;
    background: transparent;
    color: var(--c-red-600);
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    cursor: pointer;
    transition: color var(--t-fast);
}

.btn-back:hover {
    color: var(--c-gold-500);
}

.back-short {
    display: none;
}

/* ══ 唯一容器玻璃卡：模糊透明 + 与返回行留间隔；内嵌 AgentChat，高度由 flex 分配 ══ */
.run-frame {
    flex: 1;
    width: 100%;
    max-width: var(--max);
    min-height: 0;
    margin: var(--s3) auto 0;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, .72);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid var(--c-border);
    border-radius: var(--r-sm);
    box-shadow: var(--shadow-md);
    overflow: hidden;
}

/* ══ 页级 footer：绛红底单行版权条（--text-xs · 白 50% + 金色 ◈ 点缀），贴 shell 底缘常驻 ══ */
.run-footer {
    flex-shrink: 0;
    margin-top: var(--s3);
    background: var(--c-red-600);
}

.footer-inner {
    max-width: var(--max);
    margin: 0 auto;
    padding: var(--s2) var(--s5);
    display: flex;
    align-items: center;
    gap: var(--s2);
    font-size: var(--text-xs);
    line-height: var(--leading-tight);
    letter-spacing: .04em;
}

.foot-mark {
    color: var(--c-gold-300);
    font-size: var(--text-xs);
}

.foot-copy {
    color: var(--c-white);
    opacity: .5;
}

/* ══ 动效 keyframes（scoped 按文件改名，返回行引用故本文件自带定义） ══ */
@keyframes runIn {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: none; }
}

/* ══ 唯一宽度断点：996（≤996 收窄内距，返回钮文案缩写切换） ══ */
@media (max-width: 996px) {
    .run-topbar {
        padding: var(--s2) var(--s3) 0;
    }

    .back-full {
        display: none;
    }

    .back-short {
        display: inline;
    }

    .footer-inner {
        padding: var(--s2) var(--s3);
    }
}

/* ══ reduced-motion：全量降级 ══ */
@media (prefers-reduced-motion: reduce) {
    .run-topbar {
        animation: none;
    }

    .skip-link {
        transition: none;
    }
}
</style>
