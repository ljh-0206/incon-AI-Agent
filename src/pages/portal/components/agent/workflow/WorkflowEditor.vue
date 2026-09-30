<template>
  <div class="workflow-module wf-editor" data-module="workflow-editor">
    <!-- 页头 -->
    <header class="wf-head">
      <div class="wf-head__text">
        <button type="button" class="wf-back" @click="$emit('nav', 'wf-list')">返回工作流列表</button>
        <h1 class="wf-head__title">{{ isEdit ? '编辑工作流' : '新建工作流' }}</h1>
        <p class="wf-head__sub">
          {{ isEdit ? '正在编辑：' + form.name : '填写基本信息与节点，保存后可在列表中运行。' }}
        </p>
      </div>
      <div class="wf-head__actions">
        <!-- 打开原画布：把生成草稿 graphData 写入 sessionStorage 后通知宿主切换画布视图 -->
        <Button type="success" ghost @click="openOriginalCanvas">打开原画布</Button>
        <Button @click="saveDraft">保存草稿</Button>
        <Button type="primary" @click="saveAndPublish">保存并发布</Button>
      </div>
    </header>

    <!-- 打开原画布后的就绪提示 -->
    <p v-if="canvasReady" class="wf-canvas-ready">已准备好画布数据</p>

    <div class="wf-grid">
      <!-- 左：表单 -->
      <div class="wf-grid__main">
        <section class="wf-sec">
          <h3 class="wf-sec__title">基本信息</h3>

          <div class="wf-row">
            <label class="wf-label" for="wf-name">名称<span class="wf-req">*</span></label>
            <Input id="wf-name" v-model.trim="form.name" placeholder="如：数据同步与清洗" />
            <p v-if="errors.name" class="wf-error">{{ errors.name }}</p>
          </div>

          <div class="wf-row">
            <label class="wf-label" for="wf-summary">说明<span class="wf-req">*</span></label>
            <Input
              id="wf-summary"
              v-model.trim="form.summary"
              type="textarea"
              :rows="3"
              placeholder="一句话描述该工作流从输入到输出做了什么。"
            />
            <p v-if="errors.summary" class="wf-error">{{ errors.summary }}</p>
          </div>

          <div class="wf-row wf-row--split">
            <div class="wf-col">
              <label class="wf-label" for="wf-trigger">触发方式</label>
              <Select id="wf-trigger" v-model="form.trigger">
                <Option value="manual">手动触发</Option>
                <Option value="cron">定时触发</Option>
                <Option value="webhook">Webhook</Option>
              </Select>
            </div>
            <div class="wf-col">
              <label class="wf-label" for="wf-owner">负责人</label>
              <Input id="wf-owner" v-model.trim="form.owner" placeholder="如：张三" />
            </div>
          </div>

          <div class="wf-row">
            <label class="wf-label">状态</label>
            <RadioGroup v-model="form.status" type="button">
              <Radio label="draft">草稿</Radio>
              <Radio label="enabled">启用</Radio>
              <Radio label="disabled">停用</Radio>
            </RadioGroup>
          </div>
        </section>

        <section class="wf-sec">
          <h3 class="wf-sec__title">节点</h3>
          <p class="wf-sec__desc">
            以下为节点入口列表；点击「打开画布」进入完整编排（由宿主挂载画布组件，本页只负责配置）。
          </p>
          <ul class="wf-nodes">
            <li v-for="(n, i) in form.nodes" :key="n.id" class="wf-node">
              <span class="wf-node__idx">{{ i + 1 }}</span>
              <div class="wf-node__body">
                <div class="wf-node__name">{{ n.name }}</div>
                <div class="wf-node__type">{{ n.typeLabel }}</div>
              </div>
              <Tag size="small" :color="n.enabled ? 'success' : 'default'">{{ n.enabled ? '启用' : '停用' }}</Tag>
            </li>
          </ul>
          <div class="wf-nodes__actions">
            <Button size="small" ghost icon="md-add" @click="addNode">添加节点</Button>
            <Button size="small" type="primary" ghost @click="openOriginalCanvas">打开画布</Button>
          </div>
        </section>
      </div>

      <!-- 右：运行预览 -->
      <aside class="wf-grid__side">
        <div class="wf-side-card">
          <header class="wf-side-card__head">
            <h3 class="wf-side-card__title">运行预览</h3>
            <span class="wf-side-card__badge">本地模拟</span>
          </header>

          <ol class="wf-flow">
            <li v-for="(n, i) in form.nodes" :key="n.id" class="wf-flow__step">
              <span class="wf-flow__dot"></span>
              <div class="wf-flow__text">
                <div class="wf-flow__name">{{ n.name }}</div>
                <div class="wf-flow__type">{{ n.typeLabel }}</div>
              </div>
              <span v-if="i < form.nodes.length - 1" class="wf-flow__arrow">↓</span>
            </li>
          </ol>

          <p class="wf-side-card__note">
            触发方式：{{ triggerLabel }}；当前共 {{ form.nodes.length }} 个节点。
            {{ form.status === 'enabled' ? '发布后可在列表页直接运行。' : '保存为草稿后可在列表页继续编辑。' }}
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
    import { Message } from 'view-ui-plus'
    import { workflowGet, workflowCreate, workflowUpdate, workflowPublish } from '@/api/workflow'

    const DEFAULT_FORM = {
        id: null,
        name: '',
        summary: '',
        trigger: 'manual',
        owner: '',
        status: 'draft',
        nodes: [
            { id: 'n-1', name: '接收输入', typeLabel: '开始节点', enabled: true },
            { id: 'n-2', name: '读取数据源', typeLabel: '数据读取', enabled: true },
            { id: 'n-3', name: '处理与判断', typeLabel: '处理节点', enabled: true },
            { id: 'n-4', name: '输出结果', typeLabel: '结束节点', enabled: true }
        ]
    }

    const TRIGGER_LABEL = { manual: '手动触发', cron: '定时触发', webhook: 'Webhook' }

    // 后端 status → 表单三态（draft / enabled / disabled）
    const BACKEND_STATUS_MAP = { draft: 'draft', published: 'enabled', disabled: 'disabled' }

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

    export default {
        name: 'WorkflowEditor',
        // 可嵌入约定：由宿主传入待编辑工作流（列表 open-workflow 事件携带）
        // 与 AI 生成草稿（generator 的 use-workflow → index.vue 保存后传入），
        // 本组件通过 nav / open-canvas / save 事件把导航与数据交还宿主。
        props: {
            workflow: {
                type: Object,
                default: null
            },
            // AI 生成的工作流草稿，打开原画布前写入 sessionStorage 供画布使用
            generatedWorkflow: {
                type: Object,
                default: null
            }
        },
        emits: ['nav', 'open-canvas', 'save'],
        data () {
            return {
                form: this.clone(DEFAULT_FORM),
                errors: {},
                nodeSeq: 4,
                // 是否已把画布数据写入 sessionStorage（界面就绪提示）
                canvasReady: false,
                // 是否正在按 id 拉取详情
                loadingDetail: false
            }
        },
        computed: {
            // 是否为编辑既有工作流（有 id 即视为编辑）
            isEdit () {
                return !!(this.workflow && this.workflow.id)
            },
            // 触发方式的展示文案
            triggerLabel () {
                return TRIGGER_LABEL[this.form.trigger] || this.form.trigger
            }
        },
        watch: {
            // 宿主传入 workflow 变化时重建表单（空则回到新建默认态）
            workflow: {
                handler (val) {
                    if (val && val.id) {
                        // 列表行字段映射为编辑表单结构（保留 id 供打开画布时透传）；
                        // 行内已有 graphData 则先本地转节点，随后按 id 拉详情覆盖
                        const graph = this.parseGraph(val.graphData)
                        const nodes = this.nodesFromGraph(graph) || this.clone(DEFAULT_FORM.nodes)
                        this.form = this.clone(Object.assign({}, DEFAULT_FORM, {
                            id: val.id,
                            name: val.name || '',
                            summary: val.summary || val.description || '',
                            status: BACKEND_STATUS_MAP[val.status] || val.status || (val.enabled ? 'enabled' : 'draft'),
                            trigger: val.trigger || 'manual',
                            owner: val.owner || '',
                            nodes
                        }))
                        this.nodeSeq = nodes.length
                        // 编辑态按 id 载入后端详情
                        this.loadDetail(val.id)
                    } else {
                        this.form = this.clone(DEFAULT_FORM)
                        this.nodeSeq = 4
                    }
                    this.errors = {}
                },
                immediate: true
            },
            // AI 生成草稿传入时填充表单（无既有 workflow 时生效，保留通用表单预览）
            generatedWorkflow: {
                handler (val) {
                    if (val && !(this.workflow && this.workflow.id)) {
                        this.applyGeneratedToForm(val)
                    }
                },
                immediate: true
            }
        },
        methods: {
            // 深拷贝（表单与默认值隔离，避免 mock 被意外共享引用）
            clone (obj) {
                return JSON.parse(JSON.stringify(obj))
            },
            // 解析 graphData（兼容对象与 JSON 字符串）
            parseGraph (input) {
                if (!input) return null
                let graph = input
                if (typeof graph === 'string') {
                    try {
                        graph = JSON.parse(graph)
                    } catch (e) {
                        return null
                    }
                }
                if (graph && Array.isArray(graph.nodes)) return graph
                return null
            },
            // graphData.nodes → 表单节点列表（无节点时返回 null）
            nodesFromGraph (graph) {
                if (!graph || !Array.isArray(graph.nodes) || !graph.nodes.length) return null
                return graph.nodes.map((n, i) => ({
                    id: n.id != null ? String(n.id) : ('n-' + (i + 1)),
                    name: n.name || ('节点 ' + (i + 1)),
                    type: n.type || 'code',
                    typeLabel: n.typeLabel || NODE_TYPE_LABEL[n.type] || n.type || '处理节点',
                    enabled: n.enabled !== false
                }))
            },
            // 编辑态按 id 从后端载入详情，用 graphData 重建节点列表（拦截器已解包 content）
            async loadDetail (id) {
                this.loadingDetail = true
                try {
                    const detail = await workflowGet(id)
                    if (!detail) return
                    const graph = this.parseGraph(detail.graphData)
                    const nodes = this.nodesFromGraph(graph) || this.form.nodes
                    this.form = this.clone(Object.assign({}, this.form, {
                        id: detail.id != null ? detail.id : id,
                        name: detail.name || this.form.name,
                        summary: detail.description || detail.summary || this.form.summary,
                        status: BACKEND_STATUS_MAP[detail.status] ||
                            (detail.enabled ? 'enabled' : this.form.status),
                        nodes
                    }))
                    this.nodeSeq = nodes.length
                } catch (e) {
                    Message.error('工作流详情加载失败')
                } finally {
                    this.loadingDetail = false
                }
            },
            // 校验必填项，返回是否通过
            validate () {
                const errors = {}
                if (!this.form.name) errors.name = '请输入工作流名称'
                if (!this.form.summary) errors.summary = '请填写工作流说明'
                this.errors = errors
                return Object.keys(errors).length === 0
            },
            // 追加一个默认节点（本地模拟）
            addNode () {
                this.nodeSeq += 1
                this.form.nodes.push({
                    id: 'n-' + Date.now(),
                    name: '新节点 ' + this.nodeSeq,
                    typeLabel: '处理节点',
                    enabled: true
                })
                Message.success('已添加节点（本地模拟）')
            },
            // 把 AI 生成草稿映射为表单结构（名称/说明/节点），保留通用表单预览
            applyGeneratedToForm (draft) {
                const nodes = Array.isArray(draft.nodes) && draft.nodes.length
                    ? draft.nodes.map((n, i) => ({
                        id: n.id || ('gen-' + (i + 1)),
                        name: n.name || ('节点 ' + (i + 1)),
                        typeLabel: n.typeLabel || '处理节点',
                        enabled: n.enabled !== false
                    }))
                    : this.clone(DEFAULT_FORM.nodes)
                this.form = this.clone(Object.assign({}, DEFAULT_FORM, {
                    name: draft.name || '',
                    summary: draft.summary || '',
                    status: 'draft',
                    nodes
                }))
                this.nodeSeq = nodes.length
                this.errors = {}
            },
            // 由当前表单/生成草稿构造 graphData（{ nodes, edges }，可 JSON 序列化给画布）
            buildGraphData () {
                // 优先取生成草稿自带的 graphData（结构已与画布对齐）
                if (this.generatedWorkflow && this.generatedWorkflow.graphData) {
                    try {
                        const parsed = typeof this.generatedWorkflow.graphData === 'string'
                            ? JSON.parse(this.generatedWorkflow.graphData)
                            : this.generatedWorkflow.graphData
                        if (parsed && Array.isArray(parsed.nodes)) return parsed
                    } catch (e) {
                        // 解析失败则回退到表单转换
                    }
                }
                // 回退：把表单节点按顺序排布并串联成边（由现有 nodes 转换）
                const nodes = this.form.nodes.map((n, i) => ({
                    id: n.id || ('n-' + (i + 1)),
                    type: n.type || 'code',
                    name: n.name,
                    positionX: 100 + i * 220,
                    positionY: 200,
                    enabled: n.enabled !== false,
                    config: {}
                }))
                const edges = []
                for (let i = 0; i < nodes.length - 1; i++) {
                    edges.push({ id: 'e_' + (i + 1), source: nodes[i].id, target: nodes[i + 1].id, sourceHandle: null })
                }
                return { nodes, edges }
            },
            // 打开原画布：把生成结果 graphData 以 JSON 写入 sessionStorage，
            // 并 emit open-canvas（携带当前工作流表单 + 生成草稿）通知宿主切换画布视图
            openOriginalCanvas () {
                const graphData = this.buildGraphData()
                try {
                    sessionStorage.setItem('agent-generated-workflow', JSON.stringify(graphData))
                    this.canvasReady = true
                } catch (e) {
                    // sessionStorage 不可用时仍允许打开画布，仅提示失败
                    this.canvasReady = false
                }
                this.$emit('open-canvas', {
                    workflow: this.clone(this.form),
                    generatedWorkflow: this.generatedWorkflow ? this.clone(this.generatedWorkflow) : null,
                    graphData
                })
                Message.success(this.canvasReady ? '已准备好画布数据' : '已打开画布（数据未能写入本地存储）')
            },
            // 打开画布（兼容入口）：与 openOriginalCanvas 同一可用路径，避免只提示不切视图
            openCanvas () {
                this.openOriginalCanvas()
            },
            // 统一持久化：有 id 走更新、无 id 走创建；
            // payload 含 name / description / graphData（由现有 nodes 转换）；
            // 成功把真实 id 回写表单并 emit save 交宿主，返回真实 id（失败返回 null）
            async persist (action) {
                const payload = {
                    name: this.form.name,
                    description: this.form.summary,
                    graphData: JSON.stringify(this.buildGraphData())
                }
                try {
                    const saved = this.form.id != null
                        ? await workflowUpdate(Object.assign({ id: this.form.id }, payload))
                        : await workflowCreate(payload)
                    const id = saved && saved.id != null ? saved.id : this.form.id
                    if (id != null) this.form.id = id
                    this.$emit('save', {
                        action,
                        id,
                        payload: Object.assign({ id }, payload),
                        workflow: this.clone(this.form),
                        data: saved || null
                    })
                    return id
                } catch (e) {
                    Message.error('保存失败，请稍后重试')
                    return null
                }
            },
            // 保存草稿：仅要求名称，走真实创建 / 更新接口
            async saveDraft () {
                if (!this.form.name) {
                    this.errors = { name: '保存草稿至少需要填写名称' }
                    Message.error('请先填写工作流名称')
                    return
                }
                const id = await this.persist('draft')
                if (id != null) Message.success('草稿已保存')
            },
            // 保存并发布：先保存拿到真实 id，再调发布接口
            async saveAndPublish () {
                if (!this.validate()) {
                    Message.error('请补全带 * 的必填项')
                    return
                }
                const id = await this.persist('publish')
                if (id == null) return
                try {
                    await workflowPublish(id)
                    this.form.status = 'enabled'
                    Message.success('已保存并发布')
                    this.$emit('nav', 'wf-list')
                } catch (e) {
                    Message.error('发布失败')
                }
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

    .wf-editor *,
    .wf-editor *::before,
    .wf-editor *::after {
        box-sizing: border-box;
    }

    /* 页头：普通标题（展示体），不做装饰性大字 */
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
    .wf-head__sub {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--wf-text-2);
    }
    .wf-head__actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }
    /* 打开原画布后的就绪提示：主题成功色（原冷绿已移除） */
    .wf-canvas-ready {
        margin: -6px 0 12px;
        padding: 6px 12px;
        border: 1px solid var(--wf-success);
        border-radius: var(--wf-radius);
        background: var(--wf-success-weak);
        font-size: 12px;
        color: var(--wf-success);
    }

    /* 主体两栏：随容器宽度折叠为单栏 */
    .wf-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
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
    }
    .wf-sec__title {
        margin: 0 0 14px;
        font-size: 15px;
        font-weight: 600;
        color: var(--wf-text);
    }
    .wf-sec__desc {
        margin: -6px 0 12px;
        font-size: 12px;
        color: var(--wf-text-3);
        line-height: 1.6;
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
    .wf-req {
        margin-left: 2px;
        color: var(--wf-danger);
    }
    .wf-error {
        margin: 5px 0 0;
        font-size: 12px;
        color: var(--wf-danger);
    }

    /* 节点入口列表 */
    .wf-nodes {
        list-style: none;
        margin: 0;
        padding: 0;
        border: 1px solid var(--wf-border);
        border-radius: var(--wf-radius);
        background: var(--wf-paper);
    }
    .wf-node {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        border-top: 1px solid var(--wf-border);

        &:first-child { border-top: none; }
    }
    .wf-node__idx {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--wf-accent-weak);
        color: var(--wf-accent);
        font-size: 12px;
    }
    .wf-node__body {
        flex: 1;
        min-width: 0;
    }
    .wf-node__name {
        font-size: 13px;
        font-weight: 600;
        color: var(--wf-text);
    }
    .wf-node__type {
        font-size: 12px;
        color: var(--wf-text-3);
    }
    .wf-nodes__actions {
        display: flex;
        gap: 10px;
        margin-top: 12px;
        flex-wrap: wrap;
    }

    /* 右侧运行预览 */
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
    .wf-side-card__head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 12px;
    }
    .wf-side-card__title {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: var(--wf-text);
    }
    .wf-side-card__badge {
        flex-shrink: 0;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 11px;
        color: var(--wf-warn);
        background: var(--wf-warn-weak);
    }
    .wf-flow {
        list-style: none;
        margin: 0;
        padding: 0;
    }
    .wf-flow__step {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding-bottom: 16px;

        &:last-child { padding-bottom: 0; }
    }
    .wf-flow__dot {
        flex-shrink: 0;
        width: 10px;
        height: 10px;
        margin-top: 5px;
        border-radius: 50%;
        background: var(--wf-accent);
    }
    .wf-flow__text {
        flex: 1;
        min-width: 0;
    }
    .wf-flow__name {
        font-size: 13px;
        font-weight: 600;
        color: var(--wf-text);
    }
    .wf-flow__type {
        font-size: 12px;
        color: var(--wf-text-3);
    }
    .wf-flow__arrow {
        position: absolute;
        left: 1px;
        bottom: 2px;
        font-size: 10px;
        color: var(--wf-border-strong);
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
