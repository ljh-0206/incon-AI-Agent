<template>
    <div class="ag-run">
        <!-- 页头 -->
        <header class="ag-run__head">
            <button type="button" class="ag-back" @click="$emit('nav', 'list')">← 返回列表</button>
            <!-- 页头头像：avatar 图片 ID 走背景图；空值回退占位字 -->
            <span v-if="currentAgent.id" class="ag-glyph ag-glyph--avatar" :class="'ag-glyph--' + currentAgent.tone"
                role="img" :aria-label="(currentAgent.name || '智能体') + ' 头像'"
                :style="avatarStyle(currentAgent.avatar)"><span v-if="!currentAgent.avatar" class="ag-glyph__text">{{
                    currentAgent.glyph }}</span></span>
            <div class="ag-run__head-body">
                <h1 class="ag-run__title">{{ currentAgent.name || '未找到智能体' }}</h1>
            </div>
            <div class="ag-run__head-actions">
                <Button class="ag-run__share-btn" type="default" size="small" @click="handleShare">分享</Button>
                <!-- 调整智能体：触发 nav/edit-agent 事件，由入口组件切到编辑视图 -->
                <Button class="ag-run__adjust-btn" size="small" type="primary" ghost @click="adjustAgent">调整智能体</Button>
            </div>
        </header>

        <div class="ag-run__body">
            <!-- 会话列表：初始为空，不预置任何演示会话 -->
            <aside class="ag-run__sessions">
                <div class="ag-run__sessions-head">
                    <span class="ag-run__sessions-title">会话记录</span>
                    <button type="button" class="ag-link" @click="startNewSession">新对话</button>
                </div>
                <!-- 当前智能体标识：切换后同步更新 -->
                <div v-if="currentAgent.id" class="ag-run__current-agent">
                    <span class="ag-glyph ag-glyph--xs ag-glyph--avatar" :class="'ag-glyph--' + currentAgent.tone"
                        role="img" :aria-label="(currentAgent.name || '智能体') + ' 头像'"
                        :style="avatarStyle(currentAgent.avatar)"><span v-if="!currentAgent.avatar"
                            class="ag-glyph__text">{{ currentAgent.glyph }}</span></span>
                    <span class="ag-run__current-agent-name" :title="currentAgent.name">{{ currentAgent.name }}</span>
                </div>
                <ul class="ag-session-list">
                    <li v-for="s in sessions" :key="s.id" class="ag-session"
                        :class="{ 'is-active': s.id === activeSessionId }" @click="switchSession(s.id)">
                        <div class="ag-session__title">{{ s.title }}</div>
                        <div class="ag-session__meta">{{ s.count }} 条消息 · {{ s.updatedAt }}</div>
                    </li>
                </ul>
                <p class="ag-run__sessions-note">会话仅保存在本地，刷新后清空。</p>
            </aside>

            <!-- 对话区 -->
            <main class="ag-run__chat">
                <div ref="chatBody" class="ag-chat-body">
                    <!-- 空状态：未获取到真实智能体（接口失败/深链无效），不回退演示数据 -->
                    <div v-if="!currentAgent.id" class="ag-welcome">
                        <h2 class="ag-welcome__title">未找到智能体</h2>
                        <p class="ag-welcome__intro">接口未返回可用的智能体数据，请返回列表重新选择。</p>
                        <Button size="small" @click="$emit('nav', 'list')">返回列表</Button>
                    </div>

                    <!-- 空状态：欢迎语 + 建议提问（随当前智能体切换；无建议时不渲染快捷入口） -->
                    <div v-else-if="!currentMessages.length" class="ag-welcome">
                        <span class="ag-glyph ag-glyph--lg ag-glyph--avatar" :class="'ag-glyph--' + currentAgent.tone"
                            role="img" :aria-label="(currentAgent.name || '智能体') + ' 头像'"
                            :style="avatarStyle(currentAgent.avatar)"><span v-if="!currentAgent.avatar"
                                class="ag-glyph__text">{{ currentAgent.glyph }}</span></span>
                        <h2 class="ag-welcome__title">{{ currentAgent.name }}</h2>
                        <p class="ag-welcome__intro">{{ currentAgent.intro }}</p>
                        <p class="ag-welcome__hello">{{ currentAgent.welcome }}</p>
                        <div class="ag-welcome__chips">
                            <button v-for="(s, i) in currentAgent.suggestions" :key="i" type="button" class="ag-chip"
                                :disabled="sending" @click="send(s)">{{ s }}</button>
                        </div>
                    </div>

                    <!-- 消息列表 -->
                    <template v-else>
                        <div v-for="(m, i) in currentMessages" :key="i" class="ag-msg-row" :class="m.role">
                            <template v-if="m.role === 'assistant'">
                                <span class="ag-glyph ag-glyph--avatar" :class="'ag-glyph--' + currentAgent.tone"
                                    role="img" :aria-label="(currentAgent.name || '智能体') + ' 头像'"
                                    :style="avatarStyle(currentAgent.avatar)"><span v-if="!currentAgent.avatar"
                                        class="ag-glyph__text">{{ currentAgent.glyph }}</span></span>
                                <div class="ag-msg-main">
                                    <div class="ag-msg-bubble" :class="{ 'is-error': m.error }">
                                        <!-- 思考过程 -->
                                        <div v-if="m.thinking" class="ag-thinking">
                                            <button type="button" class="ag-thinking__head" @click="toggleThinking(m)">
                                                <span class="ag-thinking__label">思考过程</span>
                                                <span class="ag-thinking__state">{{ m.streaming ? '推理中' :
                                                    (m.thinkingOpen ? '收起' : '展开') }}</span>
                                            </button>
                                            <div v-if="m.thinkingOpen || m.streaming" class="ag-thinking__body">{{
                                                m.thinking }}<span v-if="m.streaming && !m.content"
                                                    class="ag-cursor"></span></div>
                                        </div>

                                        <!-- Markdown 结构：按空行分段渲染，保留标题/列表/代码等基础块语义 -->
                                        <div class="ag-msg-text">
                                            <template v-for="(block, bi) in renderBlocks(m.content)">
                                                <h4 v-if="block.type === 'h'" :key="'h-' + bi" class="ag-md-h">{{
                                                    block.text }}</h4>
                                                <ul v-else-if="block.type === 'ul'" :key="'ul-' + bi" class="ag-md-ul">
                                                    <li v-for="(li, lii) in block.items" :key="lii">{{ li }}</li>
                                                </ul>
                                                <pre v-else-if="block.type === 'code'" :key="'code-' + bi"
                                                    class="ag-md-code">{{ block.text }}</pre>
                                                <p v-else :key="'p-' + bi" class="ag-md-p">{{ block.text }}</p>
                                            </template>
                                            <span v-if="m.streaming" class="ag-cursor"></span>
                                        </div>

                                        <!-- 引用 -->
                                        <div v-if="m.citations && m.citations.length && !m.streaming" class="ag-cites">
                                            <div class="ag-cites__title">引用出处</div>
                                            <div v-for="(c, ci) in m.citations" :key="ci" class="ag-cite">
                                                <span class="ag-cite__src">{{ c.source }}</span>
                                                <span class="ag-cite__quote">「{{ c.quote }}」</span>
                                            </div>
                                        </div>

                                        <div v-if="m.error" class="ag-msg-error">
                                            调用失败：本次请求未能返回结果。您可以重试，或检查智能体的知识库配置。
                                        </div>
                                    </div>

                                    <!-- 消息操作 -->
                                    <div v-if="!m.streaming" class="ag-msg-meta">
                                        <span>{{ m.time }}</span>
                                        <button v-if="!m.error" type="button" class="ag-link"
                                            @click="copy(m.content)">复制</button>
                                        <button v-if="!m.error" type="button" class="ag-link"
                                            @click="regenerate">重新生成</button>
                                        <button v-if="m.error" type="button" class="ag-link"
                                            @click="retry(i)">重试</button>
                                    </div>
                                    <div v-else class="ag-msg-meta">
                                        <span>正在生成…</span>
                                    </div>
                                </div>
                            </template>

                            <template v-else>
                                <div class="ag-msg-main">
                                    <div class="ag-msg-bubble ag-msg-bubble--user">{{ m.content }}</div>
                                    <div class="ag-msg-meta"><span>{{ m.time }}</span></div>
                                </div>
                            </template>
                        </div>
                    </template>
                </div>

                <!-- 输入区 -->
                <div class="ag-run__input">
                    <div class="ag-run__input-row">
                        <!-- 智能体快捷切换：真实 agentAppList 选项，切换后更新欢迎语与流式请求的 agentId -->
                        <div class="ag-run__agent-switch">
                            <Select :model-value="activeAgentId" class="ag-run__agent-select" :transfer="false"
                                aria-label="切换智能体" @on-change="switchAgent">
                                <Option v-for="a in agents" :key="a.id" :value="a.id" :label="a.name">
                                    <span v-if="a.avatar" class="ag-run__option-avatar" :style="avatarStyle(a.avatar)"
                                        aria-hidden="true"></span>
                                    <span class="ag-run__option-name">{{ a.name }}</span>
                                </Option>
                            </Select>
                            <span class="ag-run__agent-now">当前：{{ currentAgent.name }}</span>
                        </div>
                        <div class="ag-run__input-actions">
                            <button v-if="sending" type="button" class="ag-btn-ghost-danger" @click="stop">停止</button>
                            <button type="button" class="ag-btn-primary" :disabled="sending || !input"
                                @click="send()">{{ sending ?
                                '生成中' : '发送' }}</button>
                        </div>
                    </div>
                    <textarea v-model.trim="input" class="ag-input ag-run__textarea"
                        placeholder="输入问题，Enter 发送，Shift + Enter 换行" :disabled="sending"
                        @keydown="onKeydown"></textarea>
                </div>
            </main>

            <!-- 智能体说明 -->
            <aside class="ag-run__info">
                <section class="ag-run__info-sec">
                    <h3 class="ag-run__info-title">智能体说明</h3>
                    <p class="ag-run__info-text">{{ currentAgent.intro }}</p>
                </section>
                <section class="ag-run__info-sec">
                    <h3 class="ag-run__info-title">关联知识库</h3>
                    <ul class="ag-run__info-list">
                        <li v-for="kb in currentAgent.kbRefs" :key="kb" class="ag-run__info-item">{{ kb }}</li>
                    </ul>
                </section>
                <section class="ag-run__info-sec">
                    <h3 class="ag-run__info-title">模型与能力</h3>
                    <ul class="ag-run__info-list ag-run__info-list--flat">
                        <li class="ag-run__info-item">模型：{{ currentAgent.modelLabel }}</li>
                        <li class="ag-run__info-item">引用标注：开启</li>
                        <li class="ag-run__info-item">多轮记忆：8 轮</li>
                        <li class="ag-run__info-item">联网检索：开启</li>
                    </ul>
                </section>
                <section class="ag-run__info-sec">
                    <Button long size="small" @click="adjustAgent">调整智能体</Button>
                </section>
            </aside>
        </div>
    </div>
</template>

<script>
import { Message } from 'view-ui-plus'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import Setting from '@/setting'
import request from '@/plugins/request'
import { agentAppGet, agentAppList, agentAppChatStreamUrl } from '@/api/agentApp'

// 头像占位字 / 底色兜底：后端 avatar 缺失（或旧单字非图片 ID）时按序号取
const FALLBACK_GLYPHS = ['答', '文', '研', '批', '析', '办', '译', '绩']
const TONES = ['green', 'indigo', 'ochre', 'sand']

// 工具：当前时间（HH:mm）
function nowText() {
    const d = new Date()
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return h + ':' + m
}

// 工具：后端时间（ISO-8601）→ 本地可读时间
function formatTimeText(t) {
    if (!t) return '-'
    const d = new Date(t)
    return isNaN(d.getTime()) ? String(t) : d.toLocaleString('zh-CN')
}

export default {
    name: 'AgentRun',
    props: {
        // 运行的智能体；由入口/列表传入，未传入时页面走空态（不回退演示数据）
        agent: {
            type: Object,
            default: null
        }
    },
    emits: ['nav', 'edit-agent'],
    data() {
        return {
            input: '',
            sending: false,
            // 后端详情（welcome→welcomeText、streaming、showReasoning 等）
            appDetail: null,
            // 标准模式会话标识（SSE chatCode 事件回传，续接上下文）
            chatCode: null,
            // 流式请求中止器：停止生成时 abort
            abortController: null,
            // 会话列表 / 消息：初始为空，不加载任何演示会话
            sessions: [],
            activeSessionId: null,
            messagesBySession: {},
            // 快捷切换下拉：仅真实 agentAppList 映射结果，失败/为空时为 []
            agentOptions: [],
            // 当前选中的智能体 id：仅取 prop；无传入时为空，不默认 mock 首项
            activeAgentId: (this.agent && this.agent.id) || null
        }
    },
    computed: {
        // 可切换的智能体全集（下拉数据源）：仅真实 agentAppList 结果；
        // 请求失败或为空时返回 []，不回退本地演示数据
        agents() {
            return (this.agentOptions && this.agentOptions.length) ? this.agentOptions : []
        },
        // 当前智能体：基础数据（列表映射/prop）合并后端详情（欢迎语等以详情为准），
        // 并对后端原始行补齐 glyph/tone 等 UI 兜底字段；suggestions 仅真实详情提供时展示，否则空数组
        currentAgent() {
            const list = this.agents
            const base = list.find(a => String(a.id) === String(this.activeAgentId)) ||
                this.agent || list[0] || {}
            const d = this.appDetail
            const merged = Object.assign({}, base)
            if (d && String(d.id) === String(this.activeAgentId)) {
                Object.assign(merged, {
                    id: d.id,
                    name: d.name || merged.name,
                    summary: d.description || merged.summary,
                    intro: d.description || merged.intro,
                    // 欢迎语：后端 welcomeText 优先
                    welcome: d.welcomeText || merged.welcome || '',
                    // 详情头像为空时保留列表/入口已拿到的真实图片 ID，避免异步详情覆盖已显示头像
                    avatar: d.avatar || merged.avatar,
                    status: d.status || merged.status
                })
                const rawTime = d.updatedAt || d.cjsj
                if (rawTime) merged.updatedAt = formatTimeText(rawTime)
            }
            // UI 字段兜底：后端行没有 glyph/tone/category 等展示字段时避免模板渲染 undefined
            // avatar 仅图片 ID（长度 > 2）走背景图；旧单字并入 glyph 占位
            const rawAvatar = merged.avatar ? String(merged.avatar) : ''
            const isImageId = rawAvatar.length > 2
            if (!isImageId && rawAvatar) merged.glyph = rawAvatar
            if (!isImageId) merged.avatar = ''
            if (!merged.glyph) {
                merged.glyph = FALLBACK_GLYPHS[0]
            }
            if (!merged.tone) merged.tone = TONES[0]
            if (!merged.modelLabel) merged.modelLabel = '默认模型'
            if (!merged.updatedAt) merged.updatedAt = '-'
            if (!merged.intro) merged.intro = merged.summary || ''
            if (!merged.welcome) merged.welcome = ''
            // 建议提问：仅真实数据（详情/列表）提供时展示，否则空数组
            if (!Array.isArray(merged.suggestions)) merged.suggestions = []
            if (!Array.isArray(merged.kbRefs)) merged.kbRefs = []
            return merged
        },
        currentMessages() {
            const list = this.messagesBySession[this.activeSessionId]
            return list || []
        },
        // 对外公开对话页链接：凭 appId + key 免登录访问（与「智能体配置」页的对外接口同源）
        publicChatUrl() {
            const d = this.appDetail
            if (!d || !d.id || !d.apiKey) return ''
            return `${window.location.origin}${Setting.routerBase || '/'}agent/chat?appId=${d.id}&key=${d.apiKey}`
        }
    },
    watch: {
        // 外部通过 agent prop 传入新智能体时同步本地选中项（初始值也走这里）
        agent: {
            handler(val) {
                const nextId = val && val.id !== null && val.id !== undefined && val.id !== ''
                    ? val.id
                    : null
                if (String(this.activeAgentId) !== String(nextId)) {
                    // 切换目标前先清空旧详情，避免旧智能体头像在新详情返回前短暂沿用
                    this.appDetail = null
                    this.activeAgentId = nextId
                }
            },
            immediate: true
        },
        // 切换智能体后拉取后端详情（欢迎语 / streaming 配置）
        activeAgentId: {
            handler(id) {
                this.loadDetail(id)
            },
            immediate: true
        }
    },
    beforeUnmount() {
        // 组件卸载时中止进行中的流式请求
        if (this.abortController) {
            this.abortController.abort()
            this.abortController = null
        }
    },
    mounted() {
        // 快捷切换下拉：拉取真实列表（失败置空，页面走空态/无选项）
        this.loadAgentOptions()
    },
    methods: {

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

        // ============ 详情与列表加载 ============
        // agentAppGet 拉取详情；welcomeText 映射为 currentAgent.welcome 做欢迎语
        async loadDetail(id) {
            // 切换或重新加载前清空旧详情，防止上一智能体的头像残留
            this.appDetail = null
            if (!id) return
            try {
                const d = await agentAppGet(id)
                if (d && String(d.id) === String(this.activeAgentId)) {
                    // 详情返回后由 currentAgent 合并 avatar，页头/会话栏/欢迎区/消息区同步更新
                    this.appDetail = d
                }
            } catch (e) {
                // 已切换到其它智能体时，忽略旧请求错误；详情失败不阻断当前会话展示
                if (String(id) === String(this.activeAgentId)) {
                    Message.error('加载智能体详情失败')
                }
            }
        },
        // 快捷切换下拉数据源：真实 agentAppList；失败/为空时置 []
        async loadAgentOptions() {
            try {
                const data = await agentAppList()
                const rows = Array.isArray(data) ? data : ((data && (data.list || data.rows)) || [])
                this.agentOptions = rows.map((row, i) => {
                    // avatar 仅图片 ID（长度 > 2）保留；旧单字当占位字
                    const rawAvatar = row.avatar ? String(row.avatar) : ''
                    const isImageId = rawAvatar.length > 2
                    return {
                        id: row.id,
                        name: row.name || '未命名智能体',
                        avatar: isImageId ? rawAvatar : '',
                        glyph: (!isImageId && rawAvatar) ? rawAvatar : FALLBACK_GLYPHS[i % FALLBACK_GLYPHS.length],
                        tone: TONES[i % TONES.length],
                        status: row.status || 'draft'
                    }
                })
            } catch (e) {
                // 接口失败：agentOptions 置空，不回退本地演示数据
                this.agentOptions = []
            }
        },

        // ============ 调整智能体 ============
        // 触发 nav/edit-agent：入口组件监听 edit-agent 后切到编辑视图
        adjustAgent() {
            this.$emit('edit-agent', this.currentAgent)
            this.$emit('nav', 'edit')
        },

        // ============ Markdown 轻量分块 ============
        // 不引入渲染依赖：按空行拆段，识别标题 / 无序列表 / 代码块 / 普通段落
        renderBlocks(content) {
            const text = String(content || '')
            if (!text.trim()) return []
            const parts = text.split(/\n{2,}/)
            return parts.map(part => {
                const p = part.trim()
                if (!p) return null
                if (/^#{1,6}\s+/.test(p)) {
                    return { type: 'h', text: p.replace(/^#{1,6}\s+/, '') }
                }
                if (/^```/.test(p)) {
                    return { type: 'code', text: p.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim() }
                }
                const lines = p.split('\n')
                const isList = lines.length > 0 && lines.every(l => /^[-*•]\s+/.test(l.trim()) || /^\d+[.、)]\s+/.test(l.trim()))
                if (isList) {
                    return { type: 'ul', items: lines.map(l => l.trim().replace(/^[-*•]\s+/, '').replace(/^\d+[.、)]\s+/, '')) }
                }
                return { type: 'p', text: p }
            }).filter(Boolean)
        },

        // ============ 智能体快捷切换 ============
        // 下拉切换：停止发送中生成、清空/新建当前会话并提示
        switchAgent(id) {
            if (!id || id === this.activeAgentId) return
            this.activeAgentId = id
            // 停止进行中的流式生成
            if (this.sending) this.stop()
            // 切换应用后会话标识失效
            this.chatCode = null
            // 隔离上下文：新建空会话
            this.startNewSession()
            // 名称取真实列表/prop 映射结果
            const hit = this.agents.find(a => String(a.id) === String(id))
            Message.success('已切换到「' + (hit ? hit.name : id) + '」，已为你新建对话')
        },

        // ============ 会话 ============
        startNewSession() {
            // 无真实智能体时不建立会话（不以 mock 数据占位）
            if (!this.currentAgent.id) {
                Message.error('未找到可对话的智能体')
                return
            }
            if (this.sending) this.stop()
            const id = 's-' + Date.now()
            this.sessions.unshift({ id, agentId: this.currentAgent.id, title: '新会话', count: 0, updatedAt: '刚刚' })
            this.messagesBySession[id] = []
            this.activeSessionId = id
            // 新会话：重置流式会话标识
            this.chatCode = null
        },
        switchSession(id) {
            if (this.sending) this.stop()
            this.activeSessionId = id
        },

        // ============ 发送 / 真实接口 ============
        send(question) {
            if (this.sending) return
            // 无真实智能体：阻止发送，不以 mock 回退
            if (!this.currentAgent.id) {
                Message.error('未找到可对话的智能体')
                return
            }
            const text = (question || this.input).trim()
            if (!text) return
            this.input = ''
            // 初始无会话时，首条消息自动建立当前会话（此前不预置演示会话）
            if (!this.activeSessionId || !this.messagesBySession[this.activeSessionId]) {
                this.startNewSession()
            }
            this.currentMessages.push({ role: 'user', content: text, time: nowText() })

            // 首条消息时更新会话标题
            const session = this.sessions.find(s => s.id === this.activeSessionId)
            if (session) {
                if (session.title === '新会话') {
                    session.title = text.slice(0, 12)
                }
                session.count += 1
            }

            this.requestReply(text)
        },
        // 统一回复入口：streaming=false 走阻塞 POST，否则走 SSE 流式
        requestReply(question) {
            const agentId = this.currentAgent && this.currentAgent.id
            if (!agentId) {
                this.currentMessages.push({
                    role: 'assistant',
                    content: '',
                    error: true,
                    streaming: false,
                    time: nowText()
                })
                return
            }
            const msg = {
                role: 'assistant',
                content: '',
                thinking: '',
                thinkingOpen: false,
                streaming: true,
                error: false,
                time: nowText()
            }
            this.currentMessages.push(msg)
            this.sending = true
            this.scrollToBottom()

            const d = this.appDetail
            const useStream = !(d && d.streaming === false)
            if (useStream) {
                this.streamReply(agentId, question, msg)
            } else {
                this.blockReply(agentId, question, msg)
            }
        },
        // 非流式：POST /ai/agent-app/{id}/chat
        blockReply(agentId, question, msg) {
            const body = { question }
            if (this.chatCode) body.startMessageId = this.chatCode
            request({ url: `/ai/agent-app/${agentId}/chat`, method: 'post', data: body })
                .then(res => {
                    msg.content = (typeof res === 'string' ? res : (res && res.content)) || ''
                })
                .catch(e => {
                    // 失败必须可见：写入错误态，不回退 mock
                    msg.error = true
                    msg.content = '[错误] ' + ((e && e.message) || '调用失败')
                    Message.error('对话请求失败')
                })
                .finally(() => {
                    msg.streaming = false
                    this.sending = false
                    this.scrollToBottom()
                })
        },
        // 流式：fetchEventSource 直连 agentAppChatStreamUrl；
        // 事件 chatCode/reasoning/notice/message/complete/error → chatCode / m.thinking / m.content
        streamReply(agentId, question, msg) {
            const token = localStorage.getItem('token_' + Setting.xmid)
            const controller = new AbortController()
            this.abortController = controller
            const body = { question }
            if (this.chatCode) body.startMessageId = this.chatCode
            let finished = false
            const finish = () => {
                if (finished) return
                finished = true
                msg.streaming = false
                this.sending = false
                this.abortController = null
                this.scrollToBottom()
            }
            fetchEventSource(agentAppChatStreamUrl(agentId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Token: token ? 'Inco-' + token : '',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(body),
                signal: controller.signal,
                openWhenHidden: true,
                async onopen(response) {
                    if (response.status >= 400) throw new Error('对话流请求失败：HTTP ' + response.status)
                },
                onmessage: (ev) => {
                    if (ev.event === 'chatCode') {
                        // 会话标识：供后续消息 startMessageId 续接上下文
                        if (ev.data) this.chatCode = ev.data
                        return
                    }
                    if (ev.event === 'complete') {
                        finish()
                        return
                    }
                    if (ev.event === 'error') {
                        msg.error = true
                        const errText = ev.data || '未知错误'
                        msg.content = msg.content ? (msg.content + '\n\n[错误] ' + errText) : ('[错误] ' + errText)
                        finish()
                        return
                    }
                    if (ev.event === 'reasoning') {
                        // 推理增量 → 思考过程
                        if (ev.data) {
                            msg.thinking += ev.data
                            this.scrollToBottom()
                        }
                        return
                    }
                    if (ev.event === 'notice') {
                        // 提示类事件 → 思考过程（带前缀，不打断正文）
                        if (ev.data) {
                            msg.thinking += (msg.thinking ? '\n' : '') + '[提示] ' + ev.data
                            this.scrollToBottom()
                        }
                        return
                    }
                    // 默认 message 事件 = 正文增量
                    if (ev.data) {
                        msg.content += ev.data
                        this.scrollToBottom()
                    }
                },
                onclose: () => finish(),
                onerror: (err) => {
                    if (!finished) {
                        msg.error = true
                        if (!msg.content) {
                            msg.content = '[连接异常] ' + ((err && err.message) || '网络错误')
                        }
                        Message.error('对话流连接失败')
                    }
                    finish()
                    throw err // 停止自动重连
                }
            }).catch(() => {
                // AbortError（用户停止）与其他异常均已在 onerror/finish 处理
                finish()
            })
        },
        // 停止生成：AbortController 中止流式请求并落定消息状态
        stop() {
            if (this.abortController) {
                this.abortController.abort()
                this.abortController = null
            }
            const last = this.currentMessages[this.currentMessages.length - 1]
            if (last && last.role === 'assistant' && last.streaming) {
                last.streaming = false
                if (!last.content) last.content = '[已停止生成]'
            }
            this.sending = false
        },
        // 重新生成：移除最后一条助手消息，对同一问题再次请求
        regenerate() {
            if (this.sending) return
            const msgs = this.currentMessages
            const lastUser = msgs.slice().reverse().find(m => m.role === 'user')
            if (!lastUser) return
            const last = msgs[msgs.length - 1]
            if (last && last.role === 'assistant') msgs.pop()
            this.requestReply(lastUser.content)
        },
        retry() {
            if (this.sending) return
            const msgs = this.currentMessages
            const lastUser = msgs.slice().reverse().find(m => m.role === 'user')
            const last = msgs[msgs.length - 1]
            if (last && last.role === 'assistant' && last.error) msgs.pop()
            if (lastUser) this.requestReply(lastUser.content)
        },

        toggleThinking(m) {
            m.thinkingOpen = !m.thinkingOpen
        },
        onKeydown(e) {
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault()
                this.send()
            }
        },
        scrollToBottom() {
            this.$nextTick(() => {
                const el = this.$refs.chatBody
                if (el) el.scrollTop = el.scrollHeight
            })
        },

        // ============ 其他 ============
        copy(text, silent) {
            // 剪贴板：优先 Clipboard API，回退 execCommand；silent 时不弹「已复制」提示
            const done = () => {
                if (!silent) Message.success('已复制')
            }
            const fail = () => {
                if (!silent) Message.error('复制失败，请手动选择复制')
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done).catch(fail)
                return
            }
            try {
                const ta = document.createElement('textarea')
                ta.value = text
                ta.setAttribute('readonly', 'readonly')
                document.body.appendChild(ta)
                ta.select()
                document.execCommand('copy')
                document.body.removeChild(ta)
                done()
            } catch (err) {
                fail()
            }
        },
        handleShare() {
            // 分享 = 复制该智能体的对外公开对话页链接（凭 apiKey 免登录访问）；
            // 详情未就绪或后端未生成密钥时如实提示，不再输出本地占位地址
            const url = this.publicChatUrl
            if (!url) {
                Message.error('暂无可分享链接，请先在「配置智能体」中保存并生成 API Key')
                return
            }
            this.copy(url)
        }
    }
}
</script>

<style lang="less" scoped>
@import (reference) './styles/agent-theme.less';

.ag-run {
    .ag-root();
    // 运行页的 view-ui-plus 控件统一复用绛红宣纸主题（含按钮、选择器与无障碍态）
    .ag-iview-theme();
    display: flex;
    flex-direction: column;
    height: calc(100vh - 210px);
    min-height: 560px;
}

// —— 页头 ——
.ag-run__head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 14px;
    border-bottom: 1px solid @ag-line;
    flex-wrap: wrap;
}

.ag-back {
    .ag-link();
    flex-shrink: 0;
}

.ag-run__head-body {
    min-width: 0;
    flex: 1;
}

.ag-run__title {
    margin: 0;
    .font-serif();
    font-size: 20px;
    font-weight: 600;
    color: @ag-ink;
    letter-spacing: 0.03em;
}

.ag-run__meta {
    margin: 2px 0 0;
    font-size: 12px;
    color: @ag-ink-3;
}

.ag-run__head-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;

    // 保留 view-ui-plus 的 default / primary+ghost 语义；状态变化继续由
    // .ag-iview-theme() 统一处理，这里只锁定运行页两种按钮的主题表面。
    :deep(.ag-run__share-btn) {
        background: @ag-surface;
        border-color: @ag-line-strong;
        color: @ag-ink-2;
    }

    :deep(.ag-run__adjust-btn) {
        background: transparent;
        border-color: fade(@ag-accent-solid, 55%);
        color: @ag-accent;
    }
}

// —— 主体三栏 ——
.ag-run__body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr) 260px;
    gap: 16px;
    margin-top: 16px;
}

// —— 会话栏 ——
.ag-run__sessions {
    .ag-panel();
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 14px;
}

.ag-run__sessions-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.ag-run__sessions-title {
    font-size: 13px;
    font-weight: 600;
    color: @ag-ink;
}

// 会话栏顶部：当前智能体标识
.ag-run__current-agent {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    padding: 6px 8px;
    border: 1px solid @ag-line;
    border-radius: @ag-radius;
    background: @ag-surface-2;
    min-width: 0;
}

.ag-run__current-agent-name {
    font-size: 12px;
    font-weight: 600;
    color: @ag-ink;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ag-glyph--xs {
    width: 20px;
    height: 20px;
    font-size: 11px;
    flex-shrink: 0;
}

.ag-session-list {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
}

.ag-session {
    padding: 10px 10px;
    border-radius: @ag-radius;
    border: 1px solid transparent;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;

    &:hover {
        background: #faf8f3;
    }

    &.is-active {
        background: @ag-accent-weak;
        border-color: transparent;
    }
}

.ag-session__title {
    font-size: 13px;
    color: @ag-ink;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ag-session__meta {
    margin-top: 2px;
    font-size: 11px;
    color: @ag-ink-3;
}

.ag-run__sessions-note {
    margin: 10px 0 0;
    padding-top: 10px;
    border-top: 1px solid @ag-line;
    font-size: 11px;
    color: @ag-ink-3;
    line-height: 1.6;
}

// —— 对话区 ——
.ag-run__chat {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    .ag-panel();
    overflow: hidden;
}

.ag-chat-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 20px 24px;
}

// 空状态（欢迎）
.ag-welcome {
    max-width: 640px;
    margin: 40px auto 0;
    text-align: center;
}

.ag-glyph--lg {
    width: 52px;
    height: 52px;
    font-size: 22px;
}

.ag-welcome__title {
    margin: 14px 0 6px;
    .font-serif();
    font-size: 22px;
    font-weight: 600;
    color: @ag-ink;
}

.ag-welcome__intro {
    margin: 0 auto 10px;
    max-width: 480px;
    font-size: 13px;
    color: @ag-ink-2;
    line-height: 1.7;
}

.ag-welcome__hello {
    margin: 0 auto 18px;
    max-width: 520px;
    padding: 10px 14px;
    font-size: 13px;
    color: @ag-ink;
    background: @ag-surface;
    border: 1px solid @ag-line;
    border-radius: @ag-radius;
    text-align: left;
    line-height: 1.7;
}

.ag-welcome__chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
}

.ag-chip {
    .ag-link();
    padding: 6px 12px;
    border: 1px solid @ag-line-strong;
    border-radius: 999px;
    font-size: 12px;
    color: @ag-ink-2;
    background: @ag-surface;
    transition: border-color 0.15s ease, color 0.15s ease;

    &:hover {
        border-color: @ag-accent;
        color: @ag-accent;
    }

    &[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
    }
}

// 消息
.ag-msg-row {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;

    &.user {
        flex-direction: row-reverse;
    }
}

.ag-msg-main {
    max-width: 78%;
    display: flex;
    flex-direction: column;
}

.ag-msg-row.user .ag-msg-main {
    align-items: flex-end;
}

.ag-msg-bubble {
    padding: 10px 14px;
    border: 1px solid @ag-line;
    border-radius: @ag-radius;
    background: @ag-surface;
    font-size: 14px;
    line-height: 1.75;
    color: @ag-ink;
    word-break: break-word;
    white-space: pre-wrap;

    &.is-error {
        border-color: #e5c8c0;
        background: @ag-danger-weak;
    }

    &.ag-msg-bubble--user {
        background: @ag-accent-weak;
        border-color: transparent;
    }
}

.ag-msg-text {
    white-space: pre-wrap;
    word-break: break-word;
}

// Markdown 分块结构
.ag-md-h {
    margin: 8px 0 6px;
    font-size: 15px;
    font-weight: 600;
    color: @ag-ink;
    white-space: normal;
}

.ag-md-p {
    margin: 0 0 6px;
    white-space: pre-wrap;

    &:last-child {
        margin-bottom: 0;
    }
}

.ag-md-ul {
    margin: 0 0 6px;
    padding-left: 18px;
    white-space: normal;

    li {
        margin-bottom: 2px;
    }
}

.ag-md-code {
    margin: 6px 0;
    padding: 8px 10px;
    background: @ag-surface-2;
    border-radius: @ag-radius;
    font-size: 12.5px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
}

// 思考过程
.ag-thinking {
    margin-bottom: 8px;
    border: 1px dashed @ag-line-strong;
    border-radius: @ag-radius;
    background: @ag-paper;
}

.ag-thinking__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 5px 10px;
    border: none;
    background: none;
    font-family: @ag-sans;
    font-size: 12px;
    color: @ag-ink-2;
    cursor: pointer;
    text-align: left;
}

.ag-thinking__label {
    color: @ag-accent;
    letter-spacing: 0.06em;
}

.ag-thinking__state {
    color: @ag-ink-3;
}

.ag-thinking__body {
    padding: 8px 10px;
    border-top: 1px solid @ag-line;
    font-size: 12px;
    line-height: 1.7;
    color: @ag-ink-2;
    white-space: pre-wrap;
}

// 光标
.ag-cursor {
    display: inline-block;
    width: 7px;
    height: 15px;
    margin-left: 2px;
    vertical-align: -2px;
    background: @ag-accent;
    animation: ag-blink 1s step-end infinite;
}

// 引用
.ag-cites {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid @ag-line;
}

.ag-cites__title {
    font-size: 11px;
    letter-spacing: 0.1em;
    color: @ag-ink-3;
    margin-bottom: 6px;
}

.ag-cite {
    display: flex;
    gap: 8px;
    margin-bottom: 4px;
    font-size: 12px;
    line-height: 1.6;
}

.ag-cite__src {
    flex-shrink: 0;
    color: @ag-accent;
}

.ag-cite__quote {
    color: @ag-ink-2;
}

// 错误
.ag-msg-error {
    margin-top: 8px;
    padding: 8px 10px;
    border-radius: @ag-radius;
    background: @ag-danger-weak;
    font-size: 12px;
    color: @ag-danger;
}

// 消息操作
.ag-msg-meta {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-top: 6px;
    font-size: 12px;
    color: @ag-ink-3;
}

.ag-msg-row.user .ag-msg-meta {
    justify-content: flex-end;
}

// —— 输入区 ——
.ag-run__input {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border-top: 1px solid @ag-line;
    background: @ag-surface;
}

// 输入区上排：智能体切换 + 发送按钮（窄屏可换行，不挤压按钮）
.ag-run__input-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    min-width: 0;
}

.ag-run__agent-switch {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
    flex: 1 1 auto;
}

.ag-run__agent-select {
    width: clamp(140px, 22vw, 200px);
    max-width: 100%;

    // 单页只补选择器表面与下拉层；文字、箭头、状态和 Option 交互
    // 继续复用 .ag-iview-theme() 的 token 规则。
    :deep(.ivu-select-selection) {
        background: @ag-surface;
        border-color: @ag-line-strong;
        color: @ag-ink;
    }

    :deep(.ivu-select-dropdown) {
        background: @ag-surface;
        border-color: @ag-line;
    }

    // Option 有真实图片时才显示小头像；无图时只保留名称。
    :deep(.ag-run__option-avatar) {
        display: inline-block;
        width: 20px;
        height: 20px;
        margin-right: 6px;
        border: 1px solid @ag-line;
        border-radius: 50%;
        background-color: @ag-surface-2;
        background-size: 100% 100%;
        background-repeat: no-repeat;
        background-position: center;
        vertical-align: middle;
        flex-shrink: 0;
    }

    :deep(.ag-run__option-name) {
        display: inline-block;
        color: inherit;
        vertical-align: middle;
        white-space: nowrap;
    }

    // 选中与悬停只改变选项状态，不覆盖头像的背景图。
    :deep(.ivu-select-item:hover .ag-run__option-avatar),
    :deep(.ivu-select-item-selected .ag-run__option-avatar) {
        opacity: 1;
        filter: none;
    }
}

.ag-run__agent-now {
    font-size: 12px;
    color: @ag-ink-3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
}

.ag-input {
    .ag-field();
}

.ag-run__textarea {
    width: 100%;
    min-height: 38px;
    max-height: 140px;
    padding: 8px 10px;
    resize: none;
    line-height: 1.6;
}

.ag-run__input-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
}

// —— 智能体说明栏 ——
.ag-run__info {
    .ag-panel();
    padding: 16px;
    overflow-y: auto;
}

.ag-run__info-sec {
    padding: 12px 0;
    border-top: 1px solid @ag-line;

    &:first-child {
        padding-top: 0;
        border-top: none;
    }

    &:last-child {
        padding-bottom: 0;
    }
}

.ag-run__info-title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: @ag-ink;
}

.ag-run__info-text {
    margin: 0;
    font-size: 13px;
    color: @ag-ink-2;
    line-height: 1.7;
}

.ag-run__info-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.ag-run__info-item {
    position: relative;
    padding-left: 12px;
    margin-bottom: 4px;
    font-size: 13px;
    color: @ag-ink-2;
    line-height: 1.6;

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 9px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: @ag-accent;
    }
}

.ag-run__info-list--flat .ag-run__info-item {
    padding-left: 0;

    &::before {
        display: none;
    }
}

// —— 通用 ——
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

// 占位字：包一层 span 以便有图时隐藏
.ag-glyph__text {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-family: @ag-serif;
    color: #F7EBDF;
    line-height: 1;
}

.ag-glyph--green {
    background: @ag-accent;
}

.ag-glyph--ochre {
    background: #8a6a2c;
}

.ag-glyph--indigo {
    background: #2c4a63;
}

.ag-glyph--sand {
    background: #7d6a4d;
}

.ag-btn-primary {
    .ag-btn-primary();
}

.ag-btn-ghost {
    .ag-btn-ghost();
}

.ag-btn-ghost-danger {
    .ag-btn-ghost-danger();
}

.ag-link {
    .ag-link();
}

@media (max-width: 1100px) {
    .ag-run__body {
        grid-template-columns: 190px minmax(0, 1fr);
    }

    .ag-run__info {
        display: none;
    }
}

@media (max-width: 760px) {
    .ag-run {
        height: calc(100vh - 190px);
    }

    .ag-run__body {
        grid-template-columns: 1fr;
    }

    .ag-run__sessions {
        display: none;
    }

    .ag-msg-main {
        max-width: 88%;
    }

    // 窄屏：切换器独占一行，发送按钮不被挤压
    .ag-run__input-row {
        flex-direction: column;
        align-items: stretch;
    }

    .ag-run__agent-select {
        width: 100%;
    }

    .ag-run__agent-now {
        max-width: none;
    }

    .ag-run__input-actions {
        justify-content: flex-end;
    }
}
</style>

<style lang="less">
// 光标闪烁关键帧：scoped 块中的 @keyframes 会被 vue-loader 改写，
// 为稳妥起见放在非 scoped 块（名称带模块前缀避免外泄）。
@keyframes ag-blink {

    0%,
    50% {
        opacity: 1;
    }

    51%,
    100% {
        opacity: 0;
    }
}
</style>
