<template>
    <div class="mimo-home">
        <header class="topbar">
            <a class="brand" href="#top">
                <span class="brand-mark" aria-hidden="true"></span>
                <span class="brand-name">赢科智能体<span>MIMO PORTAL</span></span>
            </a>
            <nav class="top-nav">
                <a href="#capabilities">能力</a>
                <a href="#flow">编排</a>
                <a href="#entries">入口</a>
                <a class="is-primary" href="#entries">进入工作台</a>
            </nav>
        </header>

        <main id="top">
            <section class="hero">
                <div class="hero-grid" aria-hidden="true"></div>
                <div class="hero-inner">
                    <p class="hero-eyebrow"><i aria-hidden="true"></i>AGENT · WORKFLOW · RAG</p>
                    <h1>把想法编排成<br /><em>可运行的智能体</em></h1>
                    <p class="hero-lead">
                        配置模型与提示词，串起知识库与工作流，发布可对话的智能体应用。
                        从灵感到一次可靠执行，只差一条清晰编排链。
                    </p>

                    <form class="command-bar" @submit.prevent="onCommand">
                        <label class="sr-only" for="command-input">描述你的任务</label>
                        <input
                            id="command-input"
                            v-model="command"
                            type="text"
                            autocomplete="off"
                            placeholder="描述你的任务，例如：生成一份实验课导学案…"
                        />
                        <button type="submit" aria-label="启动">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </form>

                    <div class="hero-actions">
                        <a class="btn btn-primary" href="#entries">创建智能体</a>
                        <a class="btn btn-ghost" href="#flow">编排工作流</a>
                    </div>
                </div>
            </section>

            <section class="chain" aria-label="智能体编排链">
                <div class="chain-head">
                    <h2>ORCHESTRATION CHAIN</h2>
                    <p>模型 → 知识库 → 智能体 → 工作流 → 对话</p>
                </div>
                <div class="chain-track">
                    <svg class="chain-svg" viewBox="0 0 1120 120" preserveAspectRatio="none" aria-hidden="true">
                        <defs>
                            <linearGradient id="chainLine" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#3D6DF2" stop-opacity="0.45"/>
                                <stop offset="50%" stop-color="#5EC8FF" stop-opacity="1"/>
                                <stop offset="100%" stop-color="#3D6DF2" stop-opacity="0.45"/>
                            </linearGradient>
                            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="3" result="b"/>
                                <feMerge>
                                    <feMergeNode in="b"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        <path d="M80 60 H1040" stroke="url(#chainLine)" stroke-width="2.5" fill="none" opacity="0.9"/>
                        <g filter="url(#softGlow)">
                            <circle class="chain-pulse" cx="80" cy="60" r="5" fill="#5EC8FF"/>
                            <circle class="chain-pulse" cx="320" cy="60" r="5" fill="#5EC8FF" style="animation-delay:.35s"/>
                            <circle class="chain-pulse" cx="560" cy="60" r="5" fill="#5EC8FF" style="animation-delay:.7s"/>
                            <circle class="chain-pulse" cx="800" cy="60" r="5" fill="#5EC8FF" style="animation-delay:1.05s"/>
                            <circle class="chain-pulse" cx="1040" cy="60" r="5" fill="#5EC8FF" style="animation-delay:1.4s"/>
                        </g>
                        <g fill="none" stroke="rgba(94,200,255,0.35)" stroke-width="1.2">
                            <circle cx="80" cy="60" r="14"/>
                            <circle cx="320" cy="60" r="14"/>
                            <circle cx="560" cy="60" r="14"/>
                            <circle cx="800" cy="60" r="14"/>
                            <circle cx="1040" cy="60" r="14"/>
                        </g>
                    </svg>
                    <div class="chain-nodes">
                        <div class="chain-node"><a href="#entries"><strong>模型</strong></a><span>多供应商网关</span></div>
                        <div class="chain-node"><a href="#entries"><strong>知识库</strong></a><span>文档切片 · RAG</span></div>
                        <div class="chain-node"><a href="#entries"><strong>智能体</strong></a><span>提示词 · 头像 · 欢迎词</span></div>
                        <div class="chain-node"><a href="#flow"><strong>工作流</strong></a><span>节点编排 · 调试</span></div>
                        <div class="chain-node"><a href="#entries"><strong>对话</strong></a><span>发布 · 运行</span></div>
                    </div>
                </div>
            </section>

            <section class="section" id="capabilities">
                <div class="section-head">
                    <p class="section-eyebrow">CAPABILITIES</p>
                    <h2>四件事，构成智能体全链路</h2>
                    <p>从模型接入到可运行应用，能力边界清晰，入口固定，不必在菜单里迷路。</p>
                </div>
                <div class="cap-grid">
                    <article v-for="cap in capabilities" :key="cap.code" class="cap-card">
                        <div class="cap-icon">{{ cap.code }}</div>
                        <h3>{{ cap.title }}</h3>
                        <p>{{ cap.desc }}</p>
                    </article>
                </div>
            </section>

            <section class="flow" id="flow">
                <div class="section">
                    <div class="section-head">
                        <p class="section-eyebrow">01 · 02 · 03</p>
                        <h2>配置 → 编排 → 运行</h2>
                        <p>把复杂流程收成三步，每一步只做一件事。</p>
                    </div>
                    <div class="flow-grid">
                        <div v-for="step in steps" :key="step.num" class="flow-step">
                            <div class="flow-num">{{ step.num }}</div>
                            <h3>{{ step.title }}</h3>
                            <ul>
                                <li v-for="item in step.items" :key="item.t">
                                    <strong>{{ item.t }}</strong>{{ item.d }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section class="section" id="entries">
                <div class="section-head">
                    <p class="section-eyebrow">WORKSPACE</p>
                    <h2>直接进入你要的那一页</h2>
                    <p>智能体配置与工作流相关页面已按职责收敛，下面是稳定入口。</p>
                </div>
                <div class="entries">
                    <a
                        v-for="entry in entries"
                        :key="entry.code"
                        class="entry"
                        href="javascript:void(0)"
                        @click="go(entry.route)"
                    >
                        <div class="entry-code">{{ entry.code }}</div>
                        <div>
                            <h3>{{ entry.title }}</h3>
                            <p>{{ entry.desc }}</p>
                        </div>
                        <span class="entry-go">打开</span>
                    </a>
                </div>
            </section>
        </main>

        <footer class="footer">
            <div class="footer-inner">
                <div><strong>赢科智能体门户</strong> · 配置 · 编排 · 对话</div>
                <div>统一主题 · Demo 预览</div>
            </div>
        </footer>
    </div>
</template>

<script>
// 智能体门户首页（统一主题）
// 契约：mimo/首页设计-mimo.md
export default {
    name: 'MimoHome',
    data () {
        return {
            command: '',
            capabilities: [
                {
                    code: 'AG',
                    title: '智能体配置',
                    desc: '标准模式（模型 + 提示词 + 知识库）或工作流模式，支持头像、欢迎词、逐字回复与思考过程。'
                },
                {
                    code: 'WF',
                    title: '工作流编排',
                    desc: '可视化拖拽节点，分支与 LLM 串联，支持 AI 生成工作流与执行历史回放。'
                },
                {
                    code: 'KB',
                    title: '知识增强',
                    desc: '知识库、文档与切片统一管理，对话时按库做 RAG 检索注入，答案可溯源。'
                },
                {
                    code: 'LLM',
                    title: '模型网关',
                    desc: '多供应商与模型管理、调用日志、对话调试，统一出入口，成本与限流可观测。'
                }
            ],
            steps: [
                {
                    num: '01 START',
                    title: '配置',
                    items: [
                        { t: '接入模型', d: '选择供应商与模型，设定温度与 Token 上限' },
                        { t: '写好提示词', d: '定义角色、边界与输出格式' },
                        { t: '挂上知识库', d: '可选 RAG，让回答有依据' }
                    ]
                },
                {
                    num: '02 RUN',
                    title: '编排',
                    items: [
                        { t: '拖出节点', d: 'LLM、条件、工具按需串联' },
                        { t: 'AI 生成草稿', d: '用自然语言描述直接生成工作流图' },
                        { t: '边调边改', d: 'SSE 执行调试，立即看到节点输出' }
                    ]
                },
                {
                    num: '03 REVIEW',
                    title: '运行',
                    items: [
                        { t: '发布应用', d: '一键启用，生成可对话智能体' },
                        { t: '对话调试', d: '欢迎词、头像、逐字流式一应俱全' },
                        { t: '执行历史', d: '回放每一次工作流运行，便于复盘' }
                    ]
                }
            ],
            entries: [
                {
                    code: 'APP',
                    title: '智能体应用',
                    desc: '新建 / 编辑 / 发布智能体，标准与工作流双模式配置',
                    route: 'ai-agent-app'
                },
                {
                    code: 'FLOW',
                    title: '工作流管理',
                    desc: '工作流列表、可视化编排编辑器、AI 生成与执行历史',
                    route: 'ai-workflow'
                },
                {
                    code: 'KB',
                    title: '知识库 · 文档 · 切片',
                    desc: '知识库管理、文档管理、切片管理与问答库',
                    route: 'ai-kb'
                },
                {
                    code: 'CHAT',
                    title: '模型与对话调试',
                    desc: '供应商 / 模型 / 调用日志，以及流式对话调试台',
                    route: 'ai-llm-chat'
                }
            ]
        }
    },
    methods: {
        onCommand () {
            // Demo：真实环境应携带 query 进入智能体对话
            const el = document.getElementById('entries')
            if (el) el.scrollIntoView({ behavior: 'smooth' })
        },
        go (name) {
            this.$router.push({ name }).catch(() => {})
        }
    }
}
</script>

<style lang="less" scoped>
.mimo-home {
    --ink: #0A0F1A;
    --ink-2: #121A2B;
    --paper: #F4F6FA;
    --card: #FFFFFF;
    --accent: #3D6DF2;
    --accent-2: #5EC8FF;
    --glow: rgba(61, 109, 242, 0.35);
    --muted: #7A8699;
    --line: #E2E7F0;
    --text: #1A2233;
    --text-on-ink: #E8EDF7;
    --radius: 14px;
    --shadow: 0 10px 40px rgba(10, 15, 26, 0.08);
    --font: "PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, -apple-system, sans-serif;
    --mono: "Cascadia Code", "SF Mono", "Consolas", "Menlo", monospace;
    --max: 1120px;

    min-height: 100vh;
    font-family: var(--font);
    font-size: 16px;
    line-height: 1.65;
    color: var(--text);
    background: var(--paper);

    a {
        color: inherit;
        text-decoration: none;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
    }
}

.topbar {
    position: absolute;
    inset: 0 0 auto;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: var(--max);
    margin: 0 auto;
    padding: 22px 24px;
    color: var(--text-on-ink);
}

.brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    letter-spacing: 0.02em;
}

.brand-mark {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 24px var(--glow);
    position: relative;

    &::after {
        content: "";
        position: absolute;
        inset: 8px;
        border-radius: 3px;
        border: 1.5px solid rgba(255, 255, 255, 0.9);
        border-right-color: transparent;
        border-bottom-color: transparent;
        transform: rotate(45deg);
    }
}

.brand-name {
    font-size: 15px;

    span {
        color: rgba(232, 237, 247, 0.55);
        font-weight: 400;
        margin-left: 8px;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-family: var(--mono);
    }
}

.top-nav {
    display: flex;
    align-items: center;
    gap: 8px;

    a {
        padding: 8px 12px;
        border-radius: 999px;
        font-size: 13px;
        color: rgba(232, 237, 247, 0.72);
        transition: color 0.2s, background 0.2s;

        &:hover,
        &:focus-visible {
            color: #fff;
            background: rgba(255, 255, 255, 0.06);
            outline: none;
        }

        &.is-primary {
            background: var(--accent);
            color: #fff;

            &:hover,
            &:focus-visible {
                background: #2f5de0;
                box-shadow: 0 0 0 3px rgba(61, 109, 242, 0.28);
            }
        }
    }
}

.hero {
    position: relative;
    min-height: 92vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 120px 24px 80px;
    background:
        radial-gradient(ellipse 80% 55% at 50% 0%, rgba(61, 109, 242, 0.18), transparent 60%),
        radial-gradient(ellipse 50% 40% at 80% 70%, rgba(94, 200, 255, 0.08), transparent 55%),
        var(--ink);
    color: var(--text-on-ink);
    overflow: hidden;
}

.hero-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 20%, transparent 75%);
    pointer-events: none;
}

.hero-inner {
    position: relative;
    width: min(720px, 100%);
    text-align: center;
}

.hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 22px;
    padding: 6px 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.04);
    color: rgba(232, 237, 247, 0.7);
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.06em;

    i {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #1FA97A;
        box-shadow: 0 0 10px #1FA97A;
    }
}

.hero h1 {
    margin: 0 0 18px;
    font-size: clamp(36px, 6vw, 56px);
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: -0.02em;

    em {
        font-style: normal;
        background: linear-gradient(90deg, #fff, var(--accent-2));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
    }
}

.hero-lead {
    margin: 0 auto 36px;
    max-width: 34em;
    color: rgba(232, 237, 247, 0.62);
    font-size: 16px;
}

.command-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(560px, 100%);
    margin: 0 auto 18px;
    padding: 8px 8px 8px 18px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    box-shadow: 0 0 0 1px rgba(61, 109, 242, 0.08), 0 20px 50px rgba(0, 0, 0, 0.25);
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus-within {
        border-color: rgba(61, 109, 242, 0.55);
        box-shadow: 0 0 0 4px rgba(61, 109, 242, 0.18), 0 20px 50px rgba(0, 0, 0, 0.25);
    }

    input {
        flex: 1;
        min-width: 0;
        border: 0;
        background: transparent;
        color: var(--text-on-ink);
        outline: none;
        font-size: 15px;

        &::placeholder {
            color: rgba(232, 237, 247, 0.38);
        }
    }

    button {
        flex-shrink: 0;
        width: 42px;
        height: 42px;
        border: 0;
        border-radius: 50%;
        background: var(--accent);
        color: #fff;
        cursor: pointer;
        display: grid;
        place-items: center;
        transition: background 0.2s, transform 0.15s;

        &:hover {
            background: #2f5de0;
            transform: scale(1.04);
        }

        &:focus-visible {
            outline: 2px solid var(--accent-2);
            outline-offset: 2px;
        }
    }
}

.hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
    margin-top: 8px;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 22px;
    border-radius: 999px;
    border: 1px solid transparent;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.15s;

    &:focus-visible {
        outline: 2px solid var(--accent-2);
        outline-offset: 2px;
    }
}

.btn-primary {
    background: var(--accent);
    color: #fff;

    &:hover {
        background: #2f5de0;
        box-shadow: 0 8px 24px var(--glow);
        transform: translateY(-1px);
    }
}

.btn-ghost {
    background: transparent;
    color: var(--text-on-ink);
    border-color: rgba(255, 255, 255, 0.16);

    &:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.28);
    }
}

.chain {
    position: relative;
    padding: 56px 24px 28px;
    background: var(--ink);
    color: var(--text-on-ink);
    overflow: hidden;
}

.chain-head {
    max-width: var(--max);
    margin: 0 auto 28px;
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 16px;

    h2 {
        margin: 0;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(232, 237, 247, 0.45);
        font-family: var(--mono);
    }

    p {
        margin: 0;
        font-size: 13px;
        color: rgba(232, 237, 247, 0.4);
    }
}

.chain-track {
    max-width: var(--max);
    margin: 0 auto;
    position: relative;
    padding: 28px 0 12px;
}

.chain-svg {
    width: 100%;
    height: 120px;
}

.chain-nodes {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    margin-top: -72px;
    position: relative;
    z-index: 1;
}

.chain-node {
    text-align: center;
    padding: 0 4px;

    strong {
        display: block;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 4px;
    }

    span {
        display: block;
        font-size: 12px;
        color: rgba(232, 237, 247, 0.45);
        line-height: 1.4;
    }

    a:hover strong,
    a:focus-visible strong {
        color: var(--accent-2);
    }
}

.section {
    max-width: var(--max);
    margin: 0 auto;
    padding: 80px 24px;
}

.section-head {
    margin-bottom: 36px;
}

.section-eyebrow {
    margin: 0 0 10px;
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
}

.section-head h2 {
    margin: 0 0 10px;
    font-size: clamp(26px, 3.5vw, 34px);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.25;
}

.section-head p {
    margin: 0;
    max-width: 40em;
    color: var(--muted);
    font-size: 15px;
}

.cap-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}

.cap-card {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    padding: 24px 22px;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;

    &:hover {
        border-color: rgba(61, 109, 242, 0.35);
        box-shadow: var(--shadow);
        transform: translateY(-2px);
    }

    h3 {
        margin: 0 0 8px;
        font-size: 17px;
        font-weight: 600;
    }

    p {
        margin: 0;
        color: var(--muted);
        font-size: 13.5px;
        line-height: 1.55;
    }
}

.cap-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    margin-bottom: 16px;
    background: linear-gradient(135deg, rgba(61, 109, 242, 0.12), rgba(94, 200, 255, 0.12));
    color: var(--accent);
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 600;
}

.flow {
    background: var(--card);
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
}

.flow-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
}

.flow-step {
    position: relative;
    padding-top: 8px;

    h3 {
        margin: 0 0 12px;
        font-size: 20px;
        font-weight: 600;
    }

    ul {
        margin: 0;
        padding: 0;
        list-style: none;
    }

    li {
        position: relative;
        padding: 10px 0 10px 18px;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 14px;

        &::before {
            content: "";
            position: absolute;
            left: 0;
            top: 18px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--accent);
            opacity: 0.55;
        }

        strong {
            display: block;
            color: var(--text);
            font-weight: 550;
            margin-bottom: 2px;
        }
    }
}

.flow-num {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.14em;
    color: var(--accent);
    margin-bottom: 14px;
}

.entries {
    display: grid;
    gap: 12px;
}

.entry {
    display: grid;
    grid-template-columns: 56px 1fr auto;
    align-items: center;
    gap: 18px;
    padding: 20px 22px;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    transition: border-color 0.2s, box-shadow 0.2s;

    &:hover,
    &:focus-visible {
        border-color: rgba(61, 109, 242, 0.4);
        box-shadow: var(--shadow);
        outline: none;
    }

    h3 {
        margin: 0 0 4px;
        font-size: 17px;
        font-weight: 600;
    }

    p {
        margin: 0;
        color: var(--muted);
        font-size: 13.5px;
    }
}

.entry-code {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: var(--ink);
    color: var(--accent-2);
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
}

.entry-go {
    color: var(--accent);
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;

    &::after {
        content: " →";
    }
}

.footer {
    background: var(--ink);
    color: rgba(232, 237, 247, 0.55);
    padding: 40px 24px;
}

.footer-inner {
    max-width: var(--max);
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    font-size: 13px;

    strong {
        color: var(--text-on-ink);
        font-weight: 550;
    }
}

@media (prefers-reduced-motion: no-preference) {
    .chain-pulse {
        animation: chainPulse 2.8s ease-in-out infinite;
    }

    @keyframes chainPulse {
        0%, 100% { opacity: 0.55; }
        50% { opacity: 1; }
    }
}

@media (max-width: 960px) {
    .cap-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .flow-grid {
        grid-template-columns: 1fr;
        gap: 36px;
    }

    .chain-nodes {
        grid-template-columns: repeat(5, 1fr);
        margin-top: -56px;
    }

    .chain-node span {
        display: none;
    }
}

@media (max-width: 720px) {
    .top-nav a:not(.is-primary) {
        display: none;
    }

    .brand-name span {
        display: none;
    }

    .hero {
        min-height: auto;
        padding: 110px 20px 64px;
    }

    .hero-lead {
        font-size: 14.5px;
    }

    .cap-grid {
        grid-template-columns: 1fr;
    }

    .entry {
        grid-template-columns: 48px 1fr;
    }

    .entry-go {
        grid-column: 2;
    }

    .chain-svg {
        height: 88px;
    }

    .chain-nodes {
        margin-top: -48px;
    }

    .chain-node strong {
        font-size: 12px;
    }

    .section {
        padding: 56px 20px;
    }
}
</style>
