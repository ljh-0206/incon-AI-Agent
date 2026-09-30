<template>
  <div class="workflow-module wf-gen" data-module="workflow-generator">
    <!-- 页头 -->
    <header class="wf-head">
      <div class="wf-head__text">
        <button type="button" class="wf-back" @click="$emit('nav', 'wf-list')">返回工作流列表</button>
        <h1 class="wf-head__title">AI 生成工作流</h1>
      </div>
      <div class="wf-head__actions">
        <RadioGroup v-model="target" type="button">
          <Radio label="workflow">生成工作流</Radio>
          <Radio label="agent">生成智能体</Radio>
        </RadioGroup>
      </div>
    </header>

    <div class="wf-grid">
      <!-- 左：输入与生成 -->
      <div class="wf-grid__main">
        <section class="wf-sec">
          <h3 class="wf-sec__title">描述你的目标</h3>
          <div class="wf-row">
            <Input
              v-model.trim="prompt"
              type="textarea"
              :rows="6"
              placeholder="例如：每天定时汇总业务数据，清洗校验后生成日报，并推送给指定接收人。"
            />
            <p class="wf-hint">描述越具体（输入、处理步骤、输出形式），生成结果越可用。</p>
          </div>

          <div class="wf-row wf-row--split">
            <div class="wf-col">
              <label class="wf-label" for="gen-style">生成风格</label>
              <Select id="gen-style" v-model="style">
                <Option value="concise">精简（最少节点）</Option>
                <Option value="balanced">均衡（推荐）</Option>
                <Option value="detailed">详细（含异常分支）</Option>
              </Select>
            </div>
            <div class="wf-col">
              <label class="wf-label" for="gen-model">生成模型</label>
              <Select id="gen-model" v-model="model">
                <Option value="qwen-plus">通义千问 Plus</Option>
                <Option value="qwen-turbo">通义千问 Turbo</Option>
                <Option value="deepseek-r1">DeepSeek-R1</Option>
              </Select>
            </div>
          </div>

          <div class="wf-actions">
            <Button
              type="primary"
              icon="md-spark"
              :loading="generating"
              :disabled="!prompt"
              @click="generate"
            >{{ generating ? '生成中…' : '开始生成' }}</Button>
            <Button @click="clearAll">清空</Button>
          </div>
        </section>

        <!-- 生成结果 -->
        <section v-if="result" class="wf-sec">
          <h3 class="wf-sec__title">生成结果</h3>

          <template v-if="target === 'workflow'">
            <div class="wf-result">
              <div class="wf-result__head">
                <span class="wf-result__name">{{ result.name }}</span>
                <!-- 节点数标签：品牌绛红（原 color="blue" 已移除） -->
                <Tag size="small" class="wf-tag-accent">{{ result.nodes.length }} 节点</Tag>
              </div>
              <p class="wf-result__summary">{{ result.summary }}</p>
              <ol class="wf-result__nodes">
                <li v-for="(n, i) in result.nodes" :key="i" class="wf-result__node">
                  <span class="wf-result__idx">{{ i + 1 }}</span>
                  <span class="wf-result__node-name">{{ n.name }}</span>
                  <span class="wf-result__node-type">{{ n.typeLabel }}</span>
                </li>
              </ol>
            </div>
            <div class="wf-result__actions">
              <Button type="primary" @click="applyWorkflow">采用并进入编辑器</Button>
              <Button ghost @click="generate">重新生成</Button>
            </div>
          </template>

          <template v-else>
            <div class="wf-result">
              <div class="wf-result__head">
                <span class="wf-result__name">{{ result.name }}</span>
                <!-- 智能体草稿标签：无后端生成接口，明确标注「本地草稿」 -->
                <Tag size="small" class="wf-tag-success">本地草稿</Tag>
              </div>
              <p class="wf-result__summary">{{ result.summary }}</p>
              <div class="wf-result__fields">
                <div class="wf-result__field">
                  <span class="wf-result__field-label">欢迎词</span>
                  <p class="wf-result__field-value">{{ result.welcome }}</p>
                </div>
                <div class="wf-result__field">
                  <span class="wf-result__field-label">系统提示词</span>
                  <p class="wf-result__field-value">{{ result.prompt }}</p>
                </div>
              </div>
            </div>
            <div class="wf-result__actions">
              <Button type="primary" @click="applyAgent">采用并填充智能体表单</Button>
              <Button ghost @click="generate">重新生成</Button>
            </div>
          </template>
        </section>

        <!-- 空结果占位 -->
        <section v-else class="wf-sec wf-sec--placeholder">
          <div class="wf-placeholder">
            <p class="wf-placeholder__title">等待生成</p>
            <p class="wf-placeholder__desc">填写描述后点击「开始生成」，结果将展示在这里。</p>
          </div>
        </section>
      </div>

      <!-- 右：示例提示 -->
      <aside class="wf-grid__side">
        <div class="wf-side-card">
          <h3 class="wf-side-card__title">示例描述</h3>
          <ul class="wf-examples">
            <li v-for="(ex, i) in examples" :key="i">
              <button type="button" class="wf-example" @click="useExample(ex)">{{ ex }}</button>
            </li>
          </ul>
            <p class="wf-side-card__note">
              工作流走后端 AI 生成接口；智能体暂无生成接口，为「本地草稿」。
            </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
    import { Message } from 'view-ui-plus'
    import { workflowGenerate } from '@/api/workflow'

    // graphData 节点类型 → 展示标签
    const NODE_TYPE_LABEL = {
        start: '开始节点',
        condition: '分支节点',
        tool: '处理节点',
        llm: '模型节点',
        code: '代码节点',
        http: 'HTTP 节点',
        end: '结束节点'
    }

    // 生成风格 → 描述文本（接口只收 description，style/model 拼进文本）
    const STYLE_TEXT = {
        concise: '精简（最少节点）',
        balanced: '均衡（推荐）',
        detailed: '详细（含异常分支）'
    }

    export default {
        name: 'WorkflowGenerator',
        // 可嵌入约定：宿主监听 nav 切页、use-workflow / use-agent 接收草稿
        emits: ['nav', 'use-workflow', 'use-agent'],
        data () {
            return {
                target: 'workflow', // workflow | agent
                prompt: '',
                style: 'balanced',
                model: 'qwen-plus',
                generating: false,
                result: null,
                genTimer: null,
                // 通用场景示例（数据处理 / 内容审核 / 通知发送 / 资料归档）
                examples: [
                    '每天定时汇总业务数据，清洗校验后生成日报并推送给指定接收人',
                    '收到内容投稿后自动审核敏感信息，命中时转人工复核并记录原因',
                    '任务状态变更时组装通知消息，按渠道发送给相关负责人并回执留档',
                    '文件上传后提取元数据、按类别打标签，归档到对应目录并生成清单'
                ]
            }
        },
        beforeUnmount () {
            if (this.genTimer) clearTimeout(this.genTimer)
        },
        methods: {
            // 使用示例描述填充输入框
            useExample (text) {
                this.prompt = text
            },
            // 清空输入与已有结果
            clearAll () {
                this.prompt = ''
                this.result = null
            },
            // 生成：workflow 走后端 AI 接口；agent 无接口，保留本地生成并标注「本地草稿」
            async generate () {
                if (!this.prompt || this.generating) return
                if (this.target === 'agent') {
                    this.generateLocalAgent()
                    return
                }
                this.generating = true
                this.result = null
                // style / model 无独立字段，拼进 description 文本
                const description = this.prompt +
                    '\n生成风格：' + (STYLE_TEXT[this.style] || this.style) +
                    '\n生成模型：' + this.model
                try {
                    const data = await workflowGenerate(description)
                    const mapped = this.mapGeneratedWorkflow(data)
                    if (!mapped) {
                        Message.error('生成失败：返回的工作流数据不完整')
                        return
                    }
                    this.result = mapped
                    Message.success('生成完成')
                } catch (e) {
                    this.result = null
                    Message.error('生成失败，请稍后重试')
                } finally {
                    this.generating = false
                }
            },
            // 解析并映射后端生成结果（graphData / workflowName / workflowDescription）
            mapGeneratedWorkflow (data) {
                if (!data) return null
                let graph = data.graphData
                if (typeof graph === 'string') {
                    try {
                        graph = JSON.parse(graph)
                    } catch (e) {
                        graph = null
                    }
                }
                if (!graph || !Array.isArray(graph.nodes) || !graph.nodes.length) return null
                const nodes = graph.nodes.map((n, i) => ({
                    id: n.id != null ? String(n.id) : ('gen-' + (i + 1)),
                    name: n.name || ('节点 ' + (i + 1)),
                    type: n.type || 'tool',
                    typeLabel: n.typeLabel || NODE_TYPE_LABEL[n.type] || n.type || '处理节点',
                    enabled: n.enabled !== false,
                    positionX: typeof n.positionX === 'number' ? n.positionX : 100 + i * 220,
                    positionY: typeof n.positionY === 'number' ? n.positionY : 200,
                    config: Object.assign({}, n.config)
                }))
                const edges = (Array.isArray(graph.edges) ? graph.edges : []).map((e, i) => ({
                    id: e.id != null ? String(e.id) : ('gen-edge-' + (i + 1)),
                    source: String(e.source),
                    target: String(e.target),
                    sourceHandle: e.sourceHandle || null
                }))
                return {
                    name: data.workflowName || data.name || '生成的工作流',
                    summary: data.workflowDescription || data.description || this.prompt,
                    nodes,
                    edges,
                    // graphData：保持 JSON 字符串，供 sessionStorage / 画布 / 编辑器直接消费
                    graphData: typeof data.graphData === 'string'
                        ? data.graphData
                        : JSON.stringify({ nodes, edges })
                }
            },
            // 智能体无后端生成接口：保留本地草稿生成（界面已标注「本地草稿」）
            generateLocalAgent () {
                this.generating = true
                this.result = null
                this.genTimer = setTimeout(() => {
                    this.result = this.buildAgentDraft(this.prompt)
                    this.generating = false
                    Message.success('生成完成（本地草稿）')
                }, 700)
            },
            // 由描述拼装智能体草稿
            buildAgentDraft (text) {
                const brief = text.length > 20 ? text.slice(0, 20) + '…' : text
                return {
                    name: brief + '助手',
                    summary: text,
                    welcome: '您好，我是「' + brief + '助手」。请描述您的具体需求，我来协助处理。',
                    prompt: '你是一名通用业务助理。任务描述：' + text + '。请分步骤给出结构化、可执行的回答。'
                }
            },
            // 采用工作流草稿：完整 emit 生成结果，由 index.vue 保存后进入 WorkflowEditor
            applyWorkflow () {
                if (!this.result) return
                // 完整结果（含 nodes/edges/graphData）交给宿主，不停留在静态预览
                this.$emit('use-workflow', this.result)
                this.$emit('nav', 'wf-edit')
                Message.success('已采用草稿并进入编辑器')
            },
            // 采用智能体草稿：进入智能体编辑页
            applyAgent () {
                if (!this.result) return
                this.$emit('use-agent', this.result)
                this.$emit('nav', 'edit')
                Message.success('已采用草稿并填充智能体表单')
            }
        }
    }
</script>

<style lang="less" scoped>
    @import (reference) '../styles/agent-theme.less';

    // ============================================================
    // 宿主适配：根节点 class="workflow-module" + data-module 标识。
    // 颜色/圆角走 --wf-* 变量：.ag-wf-tokens() 映射到 --ag-theme-*（绛红宣纸回退），
    // 宿主可在祖先覆盖；宽度 100% 不锁门户定宽，网格随 iframe / 嵌入容器自适应。
    // ============================================================
    .workflow-module {
        .ag-wf-tokens();
        // iView 组件统一走品牌主题（按钮 / 输入 / 单选组 / 标签 / 卡片）
        .ag-iview-theme();

        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        padding: 4px 0;
        font-family: var(--wf-font);
        font-size: 14px;
        line-height: 1.6;
        color: var(--wf-text);
    }

    .wf-gen *,
    .wf-gen *::before,
    .wf-gen *::after {
        box-sizing: border-box;
    }

    /* 页头：主标题明确为「AI 生成工作流」（展示体），不做装饰性大字 */
    .wf-head {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 16px;
        flex-wrap: wrap;
    }
    .wf-back {
        display: inline-flex;
        align-items: center;
        min-height: 44px;
        margin-bottom: 0;
        padding: 0;
        border: none;
        background: none;
        font-size: 13px;
        color: var(--wf-text-2);
        cursor: pointer;
        transition: color 150ms @ag-ease;

        &:hover { color: var(--wf-accent); }
        &:focus-visible { outline: 2px solid var(--wf-focus-ring); outline-offset: 2px; border-radius: 2px; }
    }
    .wf-head__title {
        margin: 0;
        font-family: var(--wf-serif);
        font-size: 18px;
        font-weight: 600;
        color: var(--wf-text);
    }
    .wf-head__actions {
        padding-bottom: 2px;
    }

    /* 结果标签：品牌绛红 / 主题成功色（替代 iView 蓝绿 Tag） */
    .wf-tag-accent {
        background: var(--wf-accent) !important;
        border-color: var(--wf-accent-deep) !important;
        color: #f7ebdf !important;
    }
    .wf-tag-success {
        background: var(--wf-success) !important;
        border-color: var(--wf-success) !important;
        color: #f7ebdf !important;
    }

    /* 主体两栏：随容器宽度折叠为单栏 */
    .wf-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(240px, 280px);
        gap: 18px;
        align-items: start;
    }
    .wf-grid__main {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 0;
    }

    /* 分区：仅用普通标题，不带编号 */
    .wf-sec {
        padding: 18px 20px 20px;
        border: 1px solid var(--wf-border);
        border-radius: var(--wf-radius);
        background: var(--wf-surface);

        &.wf-sec--placeholder {
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
    .wf-sec__title {
        margin: 0 0 14px;
        font-size: 15px;
        font-weight: 600;
        color: var(--wf-text);
    }
    .wf-row {
        margin-bottom: 14px;

        &:last-child { margin-bottom: 0; }
    }
    .wf-row--split {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
    }
    .wf-label {
        display: block;
        margin-bottom: 6px;
        font-size: 13px;
        color: var(--wf-text-2);
    }
    .wf-hint {
        margin: 6px 0 0;
        font-size: 12px;
        color: var(--wf-text-3);
        line-height: 1.6;
    }
    .wf-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }

    /* 结果区 */
    .wf-result {
        padding: 14px 16px;
        border: 1px solid var(--wf-border);
        border-radius: var(--wf-radius);
        background: var(--wf-paper);
    }
    .wf-result__head {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 6px;
    }
    .wf-result__name {
        font-size: 14px;
        font-weight: 600;
        color: var(--wf-text);
    }
    .wf-result__summary {
        margin: 0 0 12px;
        font-size: 12.5px;
        color: var(--wf-text-2);
        line-height: 1.65;
    }
    .wf-result__nodes {
        list-style: none;
        margin: 0;
        padding: 0;
    }
    .wf-result__node {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 7px 0;
        border-top: 1px solid var(--wf-border);
        font-size: 13px;

        &:first-child { border-top: none; }
    }
    .wf-result__idx {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--wf-accent-weak);
        color: var(--wf-accent);
        font-size: 11px;
    }
    .wf-result__node-name {
        flex: 1;
        min-width: 0;
        color: var(--wf-text);
        word-break: break-word;
    }
    .wf-result__node-type {
        flex-shrink: 0;
        font-size: 12px;
        color: var(--wf-text-3);
    }
    .wf-result__fields {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .wf-result__field {
        padding-top: 10px;
        border-top: 1px solid var(--wf-border);
    }
    .wf-result__field-label {
        display: block;
        margin-bottom: 4px;
        font-size: 12px;
        font-weight: 600;
        color: var(--wf-text-2);
    }
    .wf-result__field-value {
        margin: 0;
        font-size: 13px;
        color: var(--wf-text-2);
        line-height: 1.65;
        white-space: pre-wrap;
        word-break: break-word;
    }
    .wf-result__actions {
        display: flex;
        gap: 10px;
        margin-top: 14px;
        flex-wrap: wrap;
    }

    /* 占位 */
    .wf-placeholder {
        text-align: center;
        color: var(--wf-text-3);
    }
    .wf-placeholder__title {
        margin: 0 0 4px;
        font-size: 14px;
        font-weight: 600;
        color: var(--wf-text-2);
    }
    .wf-placeholder__desc {
        margin: 0;
        font-size: 13px;
    }

    /* 侧栏示例 */
    .wf-grid__side {
        position: sticky;
        top: 16px;
        min-width: 0;
    }
    .wf-side-card {
        padding: 16px 18px;
        border: 1px solid var(--wf-border);
        border-radius: var(--wf-radius);
        background: var(--wf-surface);
    }
    .wf-side-card__title {
        margin: 0 0 10px;
        font-size: 15px;
        font-weight: 600;
        color: var(--wf-text);
    }
    .wf-examples {
        list-style: none;
        margin: 0;
        padding: 0;
    }
    .wf-examples li {
        border-top: 1px solid var(--wf-border);

        &:first-child { border-top: none; }
    }
    .wf-example {
        display: block;
        width: 100%;
        min-height: 44px;
        padding: 10px 0;
        border: none;
        background: none;
        text-align: left;
        font-size: 12.5px;
        line-height: 1.55;
        color: var(--wf-text-2);
        cursor: pointer;
        transition: color 150ms @ag-ease;

        &:hover { color: var(--wf-accent); }
        &:focus-visible { outline: 2px solid var(--wf-focus-ring); outline-offset: 2px; border-radius: 2px; }
    }
    .wf-side-card__note {
        margin: 12px 0 0;
        padding-top: 12px;
        border-top: 1px solid var(--wf-border);
        font-size: 12px;
        color: var(--wf-text-3);
        line-height: 1.6;
    }

    /* 嵌入容器 / 窄屏 */
    @media (max-width: 900px) {
        .wf-grid {
            grid-template-columns: 1fr;
        }
        .wf-grid__side {
            position: static;
        }
    }
    @media (max-width: 640px) {
        .wf-head {
            align-items: flex-start;
            flex-direction: column;
        }
        .wf-row--split {
            grid-template-columns: 1fr;
        }
    }

    // 无障碍：尊重系统「减少动态效果」
    .ag-reduced-motion();
</style>
