<template>
  <div class="ai-llm-chat">
    <!-- 顶部标题 + 模式切换 + 操作 -->
    <div class="sub-title-row">
      <h3 class="sub-title">大模型对话调试</h3>
      <div class="sub-title-actions">
        <Button size="small" @click="openKbManage">知识库管理</Button>
        <RadioGroup v-model="mode" type="button" size="small" @on-change="onModeChange">
          <Radio label="stream">流式 SSE</Radio>
          <Radio label="block">阻塞</Radio>
        </RadioGroup>
        <Button size="small" :type="showAdvanced ? 'primary' : 'default'" @click="showAdvanced = !showAdvanced">高级参数</Button>
        <Button size="small" @click="handleClear" :disabled="sending">清空</Button>
      </div>
    </div>

    <!-- 供应商 / 模型选择（始终可见；清空即走网关缺省路由） -->
    <div class="select-row">
      <span class="select-label">供应商</span>
      <Select
        v-model="selectedProviderId"
        :loading="providerLoading"
        clearable
        transfer
        placeholder="默认路由（网关缺省）"
        style="width: 220px"
        @on-change="onProviderChange"
      >
        <Option v-for="p in providerOptions" :key="p.value" :value="p.value" :label="p.label">{{ p.label }}</Option>
      </Select>
      <span class="select-label">模型</span>
      <Select
        v-model="selectedModelId"
        :loading="modelLoading"
        :disabled="!selectedProviderId"
        clearable
        transfer
        placeholder="默认模型"
        style="width: 260px"
      >
        <Option v-for="m in modelOptions" :key="m.value" :value="m.value" :label="m.label">{{ m.label }}</Option>
      </Select>
      <Button size="small" type="text" :disabled="providerLoading" @click="loadProviders">
        <Icon type="md-refresh" />刷新
      </Button>
      <span class="select-label">知识库</span>
      <Select
        v-model="selectedKbid"
        :loading="kbLoading"
        clearable
        transfer
        placeholder="不关联知识库"
        style="width: 220px"
      >
        <Option v-for="k in kbOptions" :key="k.value" :value="k.value" :label="k.label">{{ k.label }}</Option>
      </Select>
      <span class="select-hint">{{ routeHint }}</span>
      <!-- 思考过程开关（仅流式 SSE 生效：透传后台 thinking 参数控制是否输出 reasoning_content）；置于该行最右侧 -->
      <div v-if="mode === 'stream'" class="thinking-inline">
        <i-switch v-model="advanced.thinking" size="small">
          <span slot="open">开</span>
          <span slot="close">关</span>
        </i-switch>
        <span class="thinking-label">输出思考过程</span>
      </div>
    </div>

    <!-- 高级参数（可选，留空用模型默认值） -->
    <Card v-if="showAdvanced" class="advanced-card" :bordered="true" :padding="12" dis-hover>
      <Form :label-width="90" inline>
        <FormItem label="温度">
          <Input v-model="advanced.temperature" placeholder="0~2" style="width: 110px" />
        </FormItem>
        <FormItem label="最大输出">
          <Input v-model="advanced.maxTokens" placeholder="如 2048" style="width: 110px" />
        </FormItem>
        <FormItem label="Top P">
          <Input v-model="advanced.topP" placeholder="0~1" style="width: 110px" />
        </FormItem>
      </Form>
      <p class="advanced-tip">
        供应商用于筛选模型；选中模型后按 modelId 精确调用（清空走网关缺省路由）。温度 / 最大输出 / Top P 留空用模型默认值。
        对话带历史上下文：服务端按会话标识续接上下文，清空即开启新会话。计量（token / 成本 / 耗时）写入「调用日志」，不在界面展示。
      </p>
    </Card>

    <!-- 消息列表 -->
    <div ref="msgBox" class="msg-box">
      <div v-if="!messages.length" class="empty-tip">
        <Icon type="md-chatbubbles" size="44" color="#c5c8ce" />
        <p>输入问题开始对话</p>
        <p class="empty-endpoint">接口：POST {{ mode === 'stream' ? '/sse/chat' : '/chat/ai/chat' }}</p>
      </div>

      <div v-for="(m, i) in messages" :key="i" :class="['msg-item', m.role]">
        <div class="avatar">{{ m.role === 'user' ? '我' : 'AI' }}</div>
        <div class="msg-main">
          <div :class="['msg-bubble', { error: m.error }]">
            <!-- 助手：思考过程 + markdown 渲染 -->
            <template v-if="m.role === 'assistant'">
              <div v-if="m.reasoning" class="reasoning-block">
                <div class="reasoning-summary" @click="toggleReasoning(i)">
                  <Icon type="md-bulb" /> 思考过程
                  <span class="reasoning-toggle-hint">{{ m.reasoningExpanded ? '收起' : '展开' }}</span>
                </div>
                <div v-if="m.reasoningExpanded" class="reasoning-content">{{ m.reasoning }}<span v-if="m.streaming && !m.content" class="cursor-blink inline"></span></div>
              </div>
              <div v-if="m.content" class="markdown-body" v-html="renderMd(m.content)"></div>
              <span v-if="m.streaming && !m.content && !m.reasoning" class="cursor-blink"></span>
              <span v-if="m.streaming && m.content" class="cursor-blink inline"></span>
              <div v-if="m.notice" class="notice-text"><Icon type="md-alert" /> {{ m.notice }}</div>
            </template>
            <!-- 用户：纯文本 -->
            <template v-else>
              <pre class="user-text">{{ m.content }}</pre>
            </template>
          </div>
          <!-- 计量 / 操作 -->
          <div v-if="m.role === 'assistant' && (m.meta || m.error) && !m.streaming" class="msg-meta">
            <template v-if="m.meta">
              <span v-if="m.meta.modelId" class="meta-item"><Icon type="md-cube" /> {{ m.meta.modelId }}</span>
              <span v-if="m.meta.totalTokens != null" class="meta-item">
                Token {{ m.meta.totalTokens }}<span class="meta-sub">（入 {{ m.meta.promptTokens || 0 }} / 出 {{ m.meta.completionTokens || 0 }}）</span>
              </span>
              <span v-if="m.meta.cost != null && Number(m.meta.cost) > 0" class="meta-item">成本 ¥{{ formatCost(m.meta.cost) }}</span>
              <span v-if="m.meta.latencyMs != null" class="meta-item">耗时 {{ m.meta.latencyMs }}ms</span>
            </template>
            <span v-if="m.error" class="meta-item err-text"><Icon type="md-alert" /> 调用失败</span>
            <a v-if="m.content" class="meta-copy" @click="copyText(m.content)"><Icon type="md-copy" /> 复制</a>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="input-area">
      <Input
        ref="inputRef"
        v-model="input"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 6 }"
        placeholder="输入问题，Enter 发送，Shift+Enter 换行"
        :disabled="sending"
        @keydown="onKeydown"
      />
      <div class="input-actions">
        <Button v-if="mode === 'stream' && sending" type="error" ghost @click="handleStop">
          <Icon type="md-square" /> 停止
        </Button>
        <Button type="primary" :loading="sending" :disabled="!input.trim()" @click="handleSend">
          {{ sending ? '生成中' : '发送' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script>
    // 本组件保存在组件库中、由页面动态注册（经平台 loadComponent 解析 <script>/<style>），
    // 不能使用 ES import 指令——所需依赖一律取自全局 this.commonsJs（MarkdownIt / hljs / mila /
    // mdKatex / incoRequest / request / aiChatSend 等，见 @/api/common.js 与 sharedApp.js）。
    // highlight.js 的 github 主题样式自包含（纯颜色、无字体引用），直接内联到下方 <style>。
    // KaTeX 样式因引用字体文件无法内联，由 mounted 动态注入 <link>（资源已拷至 public/static/katex）。

    export default {
        name: 'AiLlmChatPlayground',
        data () {
            return {
                mode: 'stream', // stream | block
                showAdvanced: false,
                input: '',
                sending: false,
                messages: [], // { role, content, streaming, error, meta }
                chatCode: null, // 带历史上下文会话标识（startMessageId）；null 时由发送方法生成，清空即重置
                advanced: {
                    temperature: '',
                    maxTokens: '',
                    topP: '',
                    thinking: true // 流式时是否输出思考过程（透传后台 thinking 参数）；阻塞模式不生效
                },
                // 供应商 / 模型下拉（null = 走网关缺省路由 / 该供应商默认模型）
                selectedProviderId: null,
                selectedModelId: null,
                providerOptions: [], // [{ value, label }]
                modelOptions: [],
                providerLoading: false,
                modelLoading: false,
                // 知识库下拉（null = 不关联知识库，对话不走 RAG 检索）
                selectedKbid: null,
                kbOptions: [],
                kbLoading: false,
                // SQL ID（真实值，见 DATA_MAPPING.md，与 provider 管理页同源）
                // 对话页专用 SQL：仅返回已配 api_key 且存在模型的可用供应商（管理页仍用 59FF70BC80B6... 显示全部）
                providerListId: '59FF70BC80C18429E0631E01A8C079B5',
                modelListId: '59FF70BC80BB8429E0631E01A8C079B5',
                streamController: null,
                mdi: null
            };
        },
        computed: {
            // 当前路由说明：帮助理解网关将如何 resolve 供应商/模型
            routeHint () {
                if (!this.selectedProviderId) return '当前路由：网关缺省（is_default=1）';
                const p = this.providerOptions.find(x => x.value === this.selectedProviderId);
                const pLabel = p ? p.label : this.selectedProviderId;
                if (!this.selectedModelId) return `当前路由：${pLabel} · 默认模型`;
                const m = this.modelOptions.find(x => x.value === this.selectedModelId);
                const mLabel = m ? m.label : this.selectedModelId;
                return `当前路由：${pLabel} / ${mLabel}`;
            }
        },
        created () {
            const _this = this;
            this.mdi = new this.commonsJs.MarkdownIt({
                html: false, // 禁止原始 HTML 直通，规避 XSS
                linkify: true,
                breaks: true,
                highlight (code, language) {
                    const validLang = !!(language && _this.commonsJs.hljs.getLanguage(language));
                    try {
                        const html = validLang
                            ? _this.commonsJs.hljs.highlight(code, { language }).value
                            : _this.commonsJs.hljs.highlightAuto(code).value;
                        return `<pre class="code-block-wrapper"><div class="code-block-header"><span class="code-block-lang">${language || 'text'}</span><span class="code-block-copy" data-copy>复制代码</span></div><code class="hljs code-block-body">${html}</code></pre>`;
                    } catch (e) {
                        return `<pre class="code-block-wrapper"><div class="code-block-header"><span class="code-block-lang">${language || 'text'}</span><span class="code-block-copy" data-copy>复制代码</span></div><code class="hljs code-block-body">${_this.escapeHtml(code)}</code></pre>`;
                    }
                }
            });
            this.mdi.use(this.commonsJs.mila, { attrs: { target: '_blank', rel: 'noopener' } });
            // 数学公式渲染（行内 $...$ / 块级 $$...$$），与 aichat/Text.vue 同源
            this.mdi.use(this.commonsJs.mdKatex, { blockClass: 'katexmath-block', errorColor: '#cc0000' });
        },
        mounted () {
            this.loadProviders();
            this.loadKbList();
            this.bindCodeCopy();
            this.ensureKatexCss();
        },
        beforeUnmount () {
            // 离开页面时若仍在流式，主动中止
            if (this.streamController) {
                this.streamController.abort();
                this.streamController = null;
            }
            this.unbindCodeCopy();
        },
        methods: {
            // ============ 渲染 ============
            renderMd (text) {
                if (!text) return '';
                try {
                    return this.mdi.render(this.maybeWrapJson(text));
                } catch (e) {
                    return this.escapeHtml(text);
                }
            },
            // 检测纯 JSON 文本（AI 返回的裸 JSON），包裹为 ```json 代码块走 hljs 高亮，
            // 避免 markdown 段落打散丢失缩进。流式不完整 JSON 也按 { / [ 开头判定即包裹，保持等宽对齐。
            maybeWrapJson (text) {
                if (!text) return text;
                const t = text.trim();
                if (!t) return text;
                if (t.charAt(0) === '{' || t.charAt(0) === '[') {
                    try {
                        const parsed = JSON.parse(t);
                        return '```json\n' + (typeof parsed === 'string' ? t : JSON.stringify(parsed, null, 2)) + '\n```';
                    } catch (e) {
                        return '```json\n' + t + '\n```';
                    }
                }
                return text;
            },
            escapeHtml (s) {
                return String(s)
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            },
            formatCost (c) {
                const n = Number(c);
                if (isNaN(n)) return c;
                return n.toFixed(6);
            },
            scrollToBottom () {
                this.$nextTick(() => {
                    const box = this.$refs.msgBox;
                    if (box) box.scrollTop = box.scrollHeight;
                });
            },

            // ============ 交互 ============
            onModeChange () {
                // 切换模式仅影响下一次发送
            },
            onKeydown (e) {
                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                    this.handleSend();
                }
            },
            handleClear () {
                if (this.sending) return;
                this.messages = [];
                this.chatCode = null; // 重置会话标识，下次发送开启新的历史上下文
            },

            // 以应用内新标签页打开知识库管理（/ai/kb → KbList.vue）
            openKbManage () {
                this.$router.push({ path: '/ai/kb' });
            },

            // ============ 供应商 / 模型下拉 ============
            // 加载启用中的供应商（与 provider 管理页同源 SQL）
            async loadProviders () {
                this.providerLoading = true;
                try {
                    const res = await this.commonsJs.incoRequest('querylist', this.providerListId, {});
                    const list = Array.isArray(res) ? res : [];
                    const enabled = list.filter(p => p.status === 'enabled');
                    this.providerOptions = enabled.map(p => ({
                        value: p.id,
                        label: (p.provider_label || p.provider_name || p.id) + (p.is_default === '1' ? '（默认）' : '')
                    }));
                    // 当前所选供应商已不在启用列表（如被禁用），则清空并级联清空模型
                    if (this.selectedProviderId && !this.providerOptions.find(x => x.value === this.selectedProviderId)) {
                        this.onProviderChange(null);
                    }
                    // 进入页面（未选供应商）时自动选中默认供应商，并级联加载其默认模型
                    if (!this.selectedProviderId) {
                        const def = enabled.find(p => p.is_default === '1');
                        if (def) {
                            this.onProviderChange(def.id);
                        }
                    }
                } catch (e) {
                    this.providerOptions = [];
                    this.$Message.error('加载供应商列表失败，请确认配置 SQL 已入库');
                } finally {
                    this.providerLoading = false;
                }
            },
            // ============ 知识库下拉 ============
            // 加载启用中的知识库，供对话时按 kbid 关联 RAG 检索（与知识库管理同源 /kb/list）
            // async loadKbList () {
            //     this.kbLoading = true;
            //     try {
            //         const res = await kbList();
            //         const list = Array.isArray(res) ? res : (res && res.list) || [];
            //         this.kbOptions = list
            //             .filter(k => k.status === 'enabled' || k.status == null)
            //             .map(k => ({ value: k.id, label: k.kbmc || k.id }));
            //     } catch (e) {
            //         this.kbOptions = [];
            //         this.$Message.error('加载知识库列表失败');
            //     } finally {
            //         this.kbLoading = false;
            //     }
            // },
          // ============ 知识库下拉 ============
          // 加载启用中的知识库，供对话时按 kbid 关联 RAG 检索（与知识库管理同源 /kb/list）
          async loadKbList () {
            this.kbLoading = true;
            try {
              // 下拉要全量，pageSize 取大值；后端 KbPage 支持 pageNum / pageSize / kbmc / status
              const res = await this.commonsJs.request({ url: '/kb/listPage', method: 'get', params: { pageNum: 1, pageSize: 1000 } });
              // listPage 返回 PageHelper 的 PageInfo：{ list, total, pageNum, pageSize, pages, ... }
              const list = (res && Array.isArray(res.list)) ? res.list : (Array.isArray(res) ? res : []);
              // 模板 Option 绑定的是 k.value / k.label，必须映射成 { value, label }
              this.kbOptions = list
                  .filter(k => k.status === 'enabled' || k.status == null)
                  .map(k => ({ value: k.id, label: k.kbmc || k.id }));
            } catch (e) {
              this.kbOptions = [];
              this.$Message.error('加载知识库列表失败');
            } finally {
              this.kbLoading = false;
            }
          },
            // 切换供应商：重置模型选择并加载该供应商下可对话的模型
            onProviderChange (val) {
                this.selectedProviderId = val || null;
                this.selectedModelId = null;
                this.modelOptions = [];
                if (this.selectedProviderId) {
                    this.loadModels(this.selectedProviderId);
                }
            },
            // 加载该供应商下启用中的对话类模型（model_type=llm）
            async loadModels (providerId) {
                this.modelLoading = true;
                try {
                    const res = await this.commonsJs.incoRequest('querylist', this.modelListId, { provider_id: providerId });
                    const list = Array.isArray(res) ? res : [];
                    const enabled = list.filter(m => m.status === 'enabled' && m.model_type === 'llm');
                    this.modelOptions = enabled.map(m => ({
                        value: m.id,
                        name: m.model_name, // model_name：作为 modelType 传给带历史上下文对话接口
                        label: (m.model_label || m.model_name || m.id)
                            + (m.is_default === '1' ? '（默认）' : '')
                            + (m.support_stream === '1' ? '' : ' · 不支持流式')
                    }));
                    // 切换供应商后（模型已重置为 null）自动选中该供应商的默认模型
                    if (!this.selectedModelId) {
                        const def = enabled.find(m => m.is_default === '1');
                        if (def) {
                            this.selectedModelId = def.id;
                        }
                    }
                } catch (e) {
                    this.modelOptions = [];
                    this.$Message.error('加载模型列表失败');
                } finally {
                    this.modelLoading = false;
                }
            },

            // ============ 发送 ============
            // 发送逻辑封装在公共方法 commonsJs.aiChatSend（见 @/api/common.js）：不绑定具体页面，
            // 所需状态显式传入，回写的响应式状态一律通过回调通知调用方。
            //   opts 读：input / sending / mode / messages / advanced / selectedModelId /
            //            modelOptions / selectedKbid / chatCode
            //   回调写：onScroll / onSending / onInput / onChatCode / onStreamController
            // 故这里必须传这个平铺对象；若传组件实例 this，会因取不到 opts.onSending 等回调而报错。
            // handleStop / beforeUnmount 仍通过 this.streamController 中止流式。
            handleSend () {
                this.commonsJs.aiChatSend({
                    input: this.input,
                    sending: this.sending,
                    mode: this.mode,
                    messages: this.messages,
                    advanced: this.advanced,
                    selectedModelId: this.selectedModelId,
                    modelOptions: this.modelOptions,
                    selectedKbid: this.selectedKbid,
                    chatCode: this.chatCode,
                    onScroll: () => this.scrollToBottom(),
                    onSending: (v) => { this.sending = v; },
                    onInput: (v) => { this.input = v; },
                    onChatCode: (v) => { this.chatCode = v; },
                    onStreamController: (c) => { this.streamController = c; }
                });
            },

            handleStop () {
                if (this.streamController) {
                    this.streamController.abort();
                    this.streamController = null;
                }
                const last = this.messages[this.messages.length - 1];
                if (last && last.role === 'assistant' && last.streaming) {
                    last.streaming = false;
                    if (!last.content) {
                        last.content = '[已停止]';
                        last.error = true;
                    }
                }
                this.sending = false;
            },

            // 折叠/展开思考过程
            toggleReasoning (i) {
                const m = this.messages[i];
                if (m) m.reasoningExpanded = !m.reasoningExpanded;
            },

            copyText (text) {
                this.copyToClip(text).then(() => {
                    this.$Message.success('已复制');
                }).catch(() => {
                    this.$Message.error('复制失败');
                });
            },

            // 复制到剪贴板（原 @/utils/copy.js 的 copyToClip；动态注册组件不能用 import，内联于此）
            copyToClip (text) {
                return new Promise((resolve, reject) => {
                    try {
                        const input = document.createElement('textarea');
                        input.setAttribute('readonly', 'readonly');
                        input.value = text;
                        document.body.appendChild(input);
                        input.select();
                        if (document.execCommand('copy')) { document.execCommand('copy'); }
                        document.body.removeChild(input);
                        resolve(text);
                    } catch (error) {
                        reject(error);
                    }
                });
            },

            // KaTeX 样式：组件动态注册、不能 import CSS，运行时注入 <link>（资源已拷至 public/static/katex）
            ensureKatexCss () {
                if (document.getElementById('ai-chat-katex-css')) return;
                const link = document.createElement('link');
                link.id = 'ai-chat-katex-css';
                link.rel = 'stylesheet';
                const base = (this.sysConfig && this.sysConfig.routerBase) || '/';
                link.href = base + 'static/katex/katex.min.css';
                document.head.appendChild(link);
            },

            // ============ 代码块复制（事件委托） ============
            // v-html 每次重渲染会替换按钮节点，逐个绑定会随流式增量失效；
            // 故在消息容器上做事件委托，点击命中 [data-copy] 时复制同块 .code-block-body 文本。
            bindCodeCopy () {
                const box = this.$refs.msgBox;
                if (!box) return;
                this._onCodeCopyClick = (e) => {
                    const btn = e.target && e.target.closest('[data-copy]');
                    if (!btn) return;
                    const wrapper = btn.closest('.code-block-wrapper');
                    const codeEl = wrapper && wrapper.querySelector('.code-block-body');
                    if (!codeEl) return;
                    this.copyToClip(codeEl.textContent).then(() => {
                        btn.textContent = '复制成功';
                        clearTimeout(this._codeCopyTimer);
                        this._codeCopyTimer = setTimeout(() => { btn.textContent = '复制代码'; }, 1000);
                    }).catch(() => {
                        this.$Message.error('复制失败');
                    });
                };
                box.addEventListener('click', this._onCodeCopyClick);
            },
            unbindCodeCopy () {
                const box = this.$refs.msgBox;
                if (box && this._onCodeCopyClick) box.removeEventListener('click', this._onCodeCopyClick);
                clearTimeout(this._codeCopyTimer);
                this._onCodeCopyClick = null;
            }
        }
    };
</script>

<style scoped>
/*
  本组件经平台 loadComponent 动态注册：scoped 块只放「作用于本组件模板节点」的规则。
  凡是 v-html 生成的元素、子组件内部元素（ivu-*）、@keyframes 步进选择器，
  一律放到下面那个不带 scoped 的块里——平台 applyScoped 加的 data-style 属性加不到那些节点上，
  且 :deep() 在平台自定义作用域改写器里会被拆成无效选择器，故不使用。
*/
.ai-llm-chat {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: #fff;
}

.ai-llm-chat .sub-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    flex-shrink: 0;
}
.ai-llm-chat .sub-title {
    font-size: 15px;
    font-weight: 600;
    color: #17233d;
    margin: 0;
    padding-left: 12px;
    border-left: 4px solid #2d8cf0;
}
.ai-llm-chat .sub-title-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 思考过程开关（内联在供应商/模型选择行最右侧） */
.ai-llm-chat .thinking-inline {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    flex-shrink: 0;
}
.ai-llm-chat .thinking-label {
    font-size: 13px;
    color: #515a6e;
    white-space: nowrap;
}

.ai-llm-chat .select-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    flex-shrink: 0;
    flex-wrap: wrap;
}
.ai-llm-chat .select-label {
    font-size: 13px;
    color: #515a6e;
    white-space: nowrap;
}
.ai-llm-chat .select-hint {
    font-size: 12px;
    color: #808695;
    margin-left: 4px;
}

.ai-llm-chat .advanced-card {
    flex-shrink: 0;
    margin-bottom: 12px;
    background: #fafafa;
}
.ai-llm-chat .advanced-tip {
    margin: 4px 0 0;
    font-size: 12px;
    color: #808695;
    line-height: 1.6;
}

/* 消息列表 */
.ai-llm-chat .msg-box {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 8px 4px 16px;
    border: 1px solid #efefef;
    border-radius: 6px;
    background: #f7f8fa;
}
.ai-llm-chat .empty-tip {
    text-align: center;
    color: #808695;
    padding: 60px 0;
}
.ai-llm-chat .empty-tip p { margin: 8px 0 0; font-size: 14px; }
.ai-llm-chat .empty-tip .empty-endpoint { font-size: 12px; color: #c5c8ce; margin-top: 4px; }

.ai-llm-chat .msg-item {
    display: flex;
    gap: 10px;
    margin: 12px 10px;
}
.ai-llm-chat .msg-item.user { flex-direction: row-reverse; }
.ai-llm-chat .avatar {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    line-height: 32px;
    text-align: center;
    font-size: 13px;
    color: #fff;
    background: #2d8cf0;
}
.ai-llm-chat .user .avatar { background: #19be6b; }

.ai-llm-chat .msg-main {
    max-width: 80%;
    display: flex;
    flex-direction: column;
}
.ai-llm-chat .user .msg-main { align-items: flex-end; }

.ai-llm-chat .msg-bubble {
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.7;
    word-break: break-word;
    background: #fff;
    border: 1px solid #ebeef5;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}
.ai-llm-chat .msg-bubble.error { border-color: #ffd6d6; background: #fff5f5; }
.ai-llm-chat .user .msg-bubble { background: #e8f7ed; border-color: #d6efe0; }
.ai-llm-chat .user-text {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: inherit;
    font-size: 14px;
}

/* 闪烁光标（@keyframes 见下方非作用域块） */
.ai-llm-chat .cursor-blink {
    display: inline-block;
    width: 7px;
    height: 16px;
    vertical-align: middle;
    background: #2d8cf0;
    animation: blink 1s step-end infinite;
}
.ai-llm-chat .cursor-blink.inline { margin-left: 2px; }

/* 思考过程（可折叠） */
.ai-llm-chat .reasoning-block {
    margin-bottom: 8px;
    border: 1px dashed #dcdfe6;
    border-radius: 6px;
    background: #fafafa;
    overflow: hidden;
}
.ai-llm-chat .reasoning-summary {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    font-size: 12px;
    color: #515a6e;
    cursor: pointer;
    user-select: none;
}
.ai-llm-chat .reasoning-summary .reasoning-toggle-hint { margin-left: auto; color: #b0b3b8; }
.ai-llm-chat .reasoning-content {
    padding: 8px 12px;
    font-size: 13px;
    line-height: 1.6;
    color: #7a8088;
    white-space: pre-wrap;
    word-break: break-word;
    border-top: 1px solid #efefef;
}
.ai-llm-chat .notice-text {
    margin-top: 6px;
    font-size: 12px;
    color: #ed9b2e;
    display: flex;
    align-items: center;
    gap: 3px;
}

/* 计量行 */
.ai-llm-chat .msg-meta {
    margin-top: 6px;
    font-size: 12px;
    color: #909399;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
}
.ai-llm-chat .msg-meta .meta-item { display: inline-flex; align-items: center; gap: 3px; }
.ai-llm-chat .msg-meta .meta-sub { color: #c0c4cc; }
.ai-llm-chat .msg-meta .err-text { color: #ed4014; }
.ai-llm-chat .msg-meta .meta-copy { cursor: pointer; color: #2d8cf0; }
.ai-llm-chat .msg-meta .meta-copy:hover { opacity: 0.8; }

/* 输入区 */
.ai-llm-chat .input-area {
    flex-shrink: 0;
    display: flex;
    gap: 10px;
    align-items: flex-end;
    margin-top: 12px;
}
.ai-llm-chat .input-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

/* markdown 容器 .markdown-body 在模板里（模板节点），其子元素由 v-html 生成 → 见下方非作用域块 */
.ai-llm-chat .markdown-body {
    font-size: 14px;
    line-height: 1.7;
    color: #17233d;
}
</style>

<style>
/*
  非 scoped 块：v-html 渲染出的子元素（p / table / code / .hljs*）、子组件内部元素（ivu-*）、
  @keyframes、代码块复制按钮、KaTeX 公式块、highlight.js 主题。
  统一加 .ai-llm-chat 前缀，避免外泄影响其他页面。
*/
.ai-llm-chat .advanced-card .ivu-form-item { margin-bottom: 8px; }
.ai-llm-chat .input-area .ivu-input { border-radius: 6px; }
.ai-llm-chat .input-actions button { white-space: nowrap; }

/* keyframes 必须放在非作用域块：0%,50% 这类步进选择器会被平台作用域改写器拆坏 */
@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}

.ai-llm-chat .markdown-body p { margin: 6px 0; }
.ai-llm-chat .markdown-body ul, .ai-llm-chat .markdown-body ol { padding-left: 22px; margin: 6px 0; }
.ai-llm-chat .markdown-body li { margin: 2px 0; }
.ai-llm-chat .markdown-body h1, .ai-llm-chat .markdown-body h2, .ai-llm-chat .markdown-body h3, .ai-llm-chat .markdown-body h4 { margin: 12px 0 6px; font-weight: 600; }
.ai-llm-chat .markdown-body h1 { font-size: 20px; }
.ai-llm-chat .markdown-body h2 { font-size: 17px; }
.ai-llm-chat .markdown-body h3 { font-size: 15px; }
.ai-llm-chat .markdown-body blockquote {
    margin: 6px 0;
    padding: 4px 12px;
    border-left: 3px solid #ddd;
    color: #5c6b77;
    background: #fafafa;
}
.ai-llm-chat .markdown-body a { color: #2d8cf0; }
.ai-llm-chat .markdown-body table { border-collapse: collapse; margin: 8px 0; }
.ai-llm-chat .markdown-body table th, .ai-llm-chat .markdown-body table td { border: 1px solid #e0e0e0; padding: 6px 10px; }
.ai-llm-chat .markdown-body table th { background: #f5f7fa; }
.ai-llm-chat .markdown-body .code-block-wrapper {
    margin: 8px 0;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid #eaecef;
}
.ai-llm-chat .markdown-body .code-block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2px 10px;
    background: #f6f8fa;
    border-bottom: 1px solid #eaecef;
}
.ai-llm-chat .markdown-body .code-block-lang { font-size: 12px; color: #808695; }
.ai-llm-chat .markdown-body .code-block-copy {
    cursor: pointer;
    font-size: 12px;
    color: #2d8cf0;
    user-select: none;
}
.ai-llm-chat .markdown-body .code-block-copy:hover { opacity: 0.8; }
.ai-llm-chat .markdown-body .code-block-body { display: block; padding: 10px 12px; font-size: 13px; line-height: 1.5; overflow-x: auto; }
.ai-llm-chat .markdown-body .katexmath-block {
    margin: 8px 0;
    padding: 10px;
    border-radius: 4px;
    background: #f6f8fa;
    overflow-x: auto;
}
.ai-llm-chat .markdown-body code:not(.hljs) {
    padding: 1px 5px;
    border-radius: 3px;
    background: #f1f3f5;
    font-size: 13px;
    font-family: Consolas, Monaco, Menlo, monospace;
}

/* highlight.js github 主题（原 import 'highlight.js/styles/github.css'；自包含、无字体引用，内联于此）。
   仅取颜色规则，布局由 .code-block-body 提供；选择器统一加 .ai-llm-chat .markdown-body 前缀防外泄。 */
.ai-llm-chat .markdown-body .hljs { color: #24292e; background: #ffffff; }
.ai-llm-chat .markdown-body .hljs-doctag,
.ai-llm-chat .markdown-body .hljs-keyword,
.ai-llm-chat .markdown-body .hljs-meta .hljs-keyword,
.ai-llm-chat .markdown-body .hljs-template-tag,
.ai-llm-chat .markdown-body .hljs-template-variable,
.ai-llm-chat .markdown-body .hljs-type,
.ai-llm-chat .markdown-body .hljs-variable.language_ { color: #d73a49; }
.ai-llm-chat .markdown-body .hljs-title,
.ai-llm-chat .markdown-body .hljs-title.class_,
.ai-llm-chat .markdown-body .hljs-title.class_.inherited__,
.ai-llm-chat .markdown-body .hljs-title.function_ { color: #6f42c1; }
.ai-llm-chat .markdown-body .hljs-attr,
.ai-llm-chat .markdown-body .hljs-attribute,
.ai-llm-chat .markdown-body .hljs-literal,
.ai-llm-chat .markdown-body .hljs-meta,
.ai-llm-chat .markdown-body .hljs-number,
.ai-llm-chat .markdown-body .hljs-operator,
.ai-llm-chat .markdown-body .hljs-variable,
.ai-llm-chat .markdown-body .hljs-selector-attr,
.ai-llm-chat .markdown-body .hljs-selector-class,
.ai-llm-chat .markdown-body .hljs-selector-id { color: #005cc5; }
.ai-llm-chat .markdown-body .hljs-regexp,
.ai-llm-chat .markdown-body .hljs-string,
.ai-llm-chat .markdown-body .hljs-meta .hljs-string { color: #032f62; }
.ai-llm-chat .markdown-body .hljs-built_in,
.ai-llm-chat .markdown-body .hljs-symbol { color: #e36209; }
.ai-llm-chat .markdown-body .hljs-comment,
.ai-llm-chat .markdown-body .hljs-code,
.ai-llm-chat .markdown-body .hljs-formula { color: #6a737d; }
.ai-llm-chat .markdown-body .hljs-name,
.ai-llm-chat .markdown-body .hljs-quote,
.ai-llm-chat .markdown-body .hljs-selector-tag,
.ai-llm-chat .markdown-body .hljs-selector-pseudo { color: #22863a; }
.ai-llm-chat .markdown-body .hljs-subst { color: #24292e; }
.ai-llm-chat .markdown-body .hljs-section { color: #005cc5; font-weight: bold; }
.ai-llm-chat .markdown-body .hljs-bullet { color: #735c0f; }
.ai-llm-chat .markdown-body .hljs-emphasis { color: #24292e; font-style: italic; }
.ai-llm-chat .markdown-body .hljs-strong { color: #24292e; font-weight: bold; }
.ai-llm-chat .markdown-body .hljs-addition { color: #22863a; background-color: #f0fff4; }
.ai-llm-chat .markdown-body .hljs-deletion { color: #b31d28; background-color: #ffeef0; }
</style>
