<template>
  <div class="workflow-module wf-canvas" data-module="workflow-canvas">
    <!-- 页头：返回入口 + 保存草稿 + 运行调试 -->
    <header class="wf-head">
      <div class="wf-head__text">
        <button type="button" class="wf-back" @click="$emit('nav', 'wf-edit')">返回编辑器</button>
        <h1 class="wf-head__title">工作流画布</h1>
        <p class="wf-head__sub">{{ titleText }}</p>
      </div>
      <div class="wf-head__actions">
        <Button size="small" ghost @click="$emit('nav', 'wf-list')">返回列表</Button>
        <Button size="small" :loading="saving" @click="saveDraft">保存草稿</Button>
        <Button v-if="!running" size="small" type="primary" @click="runDebug">运行调试</Button>
        <Button v-else size="small" type="error" ghost @click="cancelRun">停止调试</Button>
      </div>
    </header>

    <div class="wf-body">
      <!-- 左：节点列表 -->
      <aside class="wf-side wf-nodes">
        <div class="wf-side__head">
          <span class="wf-side__title">节点列表</span>
          <span class="wf-side__count">{{ nodes.length }}</span>
        </div>
        <div class="wf-nodes__add">
          <Select v-model="nextType" size="small">
            <Option v-for="t in nodeTypes" :key="t.value" :value="t.value">{{ t.label }}</Option>
          </Select>
          <Button size="small" type="primary" ghost icon="md-add" @click="addNode">添加节点</Button>
        </div>
        <ul class="wf-ncards">
          <li
            v-for="(n, i) in nodes"
            :key="n.id"
            class="wf-ncard"
            :class="{
              'is-active': n.id === selectedId,
              'is-off': n.enabled === false,
              'is-running': runState[n.id] === 'running',
              'is-done': runState[n.id] === 'done'
            }"
            @click="selectNode(n.id)"
          >
            <span class="wf-ncard__idx">{{ i + 1 }}</span>
            <span class="wf-ncard__body">
              <span class="wf-ncard__name">{{ n.name }}</span>
              <span class="wf-ncard__type">{{ typeLabel(n.type) }}</span>
            </span>
            <span v-if="runState[n.id] === 'running'" class="wf-ncard__state">执行中</span>
            <span v-else-if="runState[n.id] === 'done'" class="wf-ncard__state is-done">完成</span>
          </li>
        </ul>
        <p v-if="!nodes.length" class="wf-empty">暂无节点，点击上方「添加节点」开始编排。</p>
      </aside>

      <!-- 中：画布区域 -->
      <section class="wf-stage">
        <div class="wf-stage__bar">
          <span>节点 {{ nodes.length }}</span>
          <span>连线 {{ edges.length }}</span>
          <span v-if="selectedNode">选中：{{ selectedNode.name }}</span>
          <span v-if="running" class="wf-stage__run">调试运行中…</span>
          <span class="wf-stage__tip">按住节点可拖动位置</span>
        </div>
        <div class="wf-stage__view" @mousedown.self="clearSelection">
          <div class="wf-stage__world" :style="worldStyle">
            <!-- 连线层：贝塞尔曲线 + 箭头 -->
            <svg class="wf-edges" :width="world.width" :height="world.height">
              <defs>
                <!-- 箭头填色改由 CSS 类控制（presentation attribute 不支持 var()，
                     原硬编码的品牌外蓝色已移除） -->
                <marker id="wf-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path class="wf-edges__arrow" d="M0,0 L8,4 L0,8 z" />
                </marker>
                <marker id="wf-arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path class="wf-edges__arrow is-active" d="M0,0 L8,4 L0,8 z" />
                </marker>
              </defs>
              <g v-for="line in edgePaths" :key="line.id">
                <path
                  class="wf-edges__path"
                  :class="{ 'is-active': line.active }"
                  :d="line.d"
                  :marker-end="line.active ? 'url(#wf-arrow-active)' : 'url(#wf-arrow)'"
                />
                <text v-if="line.label" class="wf-edges__label" :x="line.mx" :y="line.my">{{ line.label }}</text>
              </g>
            </svg>
            <!-- 节点卡片层 -->
            <div
              v-for="n in nodes"
              :key="n.id"
              class="wf-node"
              :class="{
                'is-active': n.id === selectedId,
                'is-off': n.enabled === false,
                'is-running': runState[n.id] === 'running',
                'is-done': runState[n.id] === 'done'
              }"
              :style="nodeStyle(n)"
              @mousedown.stop="onNodeDown($event, n)"
            >
              <span class="wf-node__port is-in"></span>
              <span class="wf-node__body">
                <span class="wf-node__type">{{ typeLabel(n.type) }}</span>
                <span class="wf-node__name">{{ n.name }}</span>
              </span>
              <span class="wf-node__port is-out"></span>
            </div>
          </div>
          <div v-if="!nodes.length" class="wf-empty wf-empty--stage">
            画布为空，先在左侧添加节点，或从编辑器 / AI 生成带入图数据。
          </div>
        </div>
        <!-- 运行日志 -->
        <div v-if="runLogs.length" class="wf-logs">
          <div class="wf-logs__head">
            <span>运行日志</span>
            <button type="button" class="wf-logs__clear" @click="runLogs = []">清空</button>
          </div>
          <ul class="wf-logs__list">
            <li v-for="(log, i) in runLogs" :key="i" :class="'is-' + log.type">{{ log.time }} {{ log.text }}</li>
          </ul>
        </div>
      </section>

      <!-- 右：选中节点配置面板 -->
      <aside class="wf-side wf-config">
        <div class="wf-side__head">
          <span class="wf-side__title">节点配置</span>
        </div>
        <div v-if="!selectedNode" class="wf-empty">在画布或左侧列表中选择一个节点进行配置。</div>
        <template v-else>
          <div class="wf-field">
            <label class="wf-label" :for="'cfg-name-' + selectedNode.id">名称</label>
            <Input :id="'cfg-name-' + selectedNode.id" v-model.trim="selectedNode.name" size="small" placeholder="节点名称" />
          </div>
          <div class="wf-field">
            <label class="wf-label" :for="'cfg-type-' + selectedNode.id">类型</label>
            <Select :id="'cfg-type-' + selectedNode.id" v-model="selectedNode.type" size="small">
              <Option v-for="t in nodeTypes" :key="t.value" :value="t.value">{{ t.label }}</Option>
            </Select>
          </div>
          <div class="wf-field">
            <label class="wf-label" :for="'cfg-desc-' + selectedNode.id">说明</label>
            <Input
              :id="'cfg-desc-' + selectedNode.id"
              v-model="selectedNode.config.description"
              type="textarea"
              :rows="3"
              placeholder="该节点的职责说明（选填）"
            />
          </div>
          <div class="wf-field wf-field--row">
            <label class="wf-label">启用</label>
            <Switch v-model="selectedNode.enabled" size="small" />
          </div>
          <div class="wf-meta">
            <div class="wf-meta__row"><span>ID</span><code>{{ selectedNode.id }}</code></div>
            <div class="wf-meta__row"><span>坐标</span><code>{{ Math.round(selectedNode.positionX) }}, {{ Math.round(selectedNode.positionY) }}</code></div>
            <div class="wf-meta__row"><span>连线</span><code>入 {{ inCount }} / 出 {{ outCount }}</code></div>
          </div>
          <div class="wf-config__actions">
            <Button size="small" type="error" plain :disabled="deleteConfirm !== selectedNode.id" @click="removeSelected">
              {{ deleteConfirm === selectedNode.id ? '再次点击确认删除' : '删除该节点' }}
            </Button>
          </div>
        </template>
      </aside>
    </div>
  </div>
</template>

<script>
    import { Message } from 'view-ui-plus'
    import { workflowCreate, workflowSaveGraph, workflowExecute } from '@/api/workflow'

    // 画布内节点卡片的固定尺寸（连线锚点计算依赖，须与样式一致）
    const NODE_W = 176
    const NODE_H = 64
    // sessionStorage key：与 WorkflowGenerator / WorkflowEditor 写入的图数据保持一致
    const GRAPH_STORAGE_KEY = 'agent-generated-workflow'

    // 可选节点类型（与生成器草稿的 type 对齐，另补充常用处理类型）
    const NODE_TYPES = [
        { value: 'start', label: '开始' },
        { value: 'condition', label: '分支' },
        { value: 'tool', label: '处理' },
        { value: 'llm', label: '模型' },
        { value: 'code', label: '代码' },
        { value: 'http', label: 'HTTP' },
        { value: 'end', label: '结束' }
    ]

    export default {
        name: 'WorkflowCanvas',
        // 可嵌入约定：宿主传入 workflow / generatedWorkflow / graphData，
        // 通过 nav 切页、save 持久化草稿、run 上报调试开始
        props: {
            workflow: {
                type: Object,
                default: null
            },
            generatedWorkflow: {
                type: Object,
                default: null
            },
            // 宿主 canvasPayload.graphData（对象或 JSON 字符串均可）
            graphData: {
                type: [Object, String],
                default: null
            }
        },
        emits: ['nav', 'save', 'run'],
        data () {
            return {
                nodes: [], // { id, type, name, positionX, positionY, enabled, config }
                edges: [], // { id, source, target, sourceHandle }
                selectedId: null,
                nextType: 'tool', // 添加节点时使用的类型
                nodeTypes: NODE_TYPES,
                saving: false,
                running: false,
                runState: {}, // 节点运行状态：running / done
                runLogs: [],
                runTimer: null,
                deleteConfirm: null, // 两步删除：记录待确认的节点 id
                moveHandler: null,
                upHandler: null
            }
        },
        computed: {
            // 页头副标题：优先工作流名称，回退 AI 草稿名称
            titleText () {
                const name = (this.workflow && this.workflow.name) ||
                    (this.generatedWorkflow && this.generatedWorkflow.name) ||
                    '未命名工作流'
                const tip = this.lastSaved ? '　已保存 ' + this.lastSaved : ''
                return name + ' · 共 ' + this.nodes.length + ' 个节点' + tip
            },
            lastSaved () {
                return this._lastSaved || ''
            },
            selectedNode () {
                return this.nodes.find(n => n.id === this.selectedId) || null
            },
            // 选中节点的入边 / 出边数量
            inCount () {
                if (!this.selectedNode) return 0
                return this.edges.filter(e => e.target === this.selectedNode.id).length
            },
            outCount () {
                if (!this.selectedNode) return 0
                return this.edges.filter(e => e.source === this.selectedNode.id).length
            },
            // 画布世界尺寸：包住全部节点并留出边距，供滚动容器使用
            world () {
                let w = 640
                let h = 360
                this.nodes.forEach(n => {
                    w = Math.max(w, n.positionX + NODE_W + 80)
                    h = Math.max(h, n.positionY + NODE_H + 60)
                })
                return { width: w, height: h }
            },
            worldStyle () {
                return { width: this.world.width + 'px', height: this.world.height + 'px' }
            },
            // 连线路径：源节点右侧中点 → 目标节点左侧中点，三次贝塞尔
            edgePaths () {
                const map = {}
                this.nodes.forEach(n => { map[n.id] = n })
                return this.edges.map(e => {
                    const s = map[e.source]
                    const t = map[e.target]
                    if (!s || !t) return null
                    // 条件分支的 true/false 出口在纵向错开，便于区分
                    const handleOffset = e.sourceHandle === 'true' ? -12 : (e.sourceHandle === 'false' ? 12 : 0)
                    const sx = s.positionX + NODE_W
                    const sy = s.positionY + NODE_H / 2 + handleOffset
                    const tx = t.positionX
                    const ty = t.positionY + NODE_H / 2
                    const dx = Math.max(48, Math.abs(tx - sx) / 2)
                    const dir = tx >= sx ? 1 : -1
                    const d = 'M ' + sx + ' ' + sy +
                        ' C ' + (sx + dx * dir) + ' ' + sy + ', ' +
                        (tx - dx * dir) + ' ' + ty + ', ' +
                        tx + ' ' + ty
                    return {
                        id: e.id,
                        d,
                        label: this.handleLabel(e.sourceHandle),
                        mx: (sx + tx) / 2,
                        my: (sy + ty) / 2 - 6,
                        active: this.selectedId === e.source || this.selectedId === e.target
                    }
                }).filter(Boolean)
            }
        },
        watch: {
            // 宿主切换 payload 时重新载入图（对象引用变化即触发）
            graphData () {
                this.loadGraph()
            },
            generatedWorkflow () {
                if (!this.graphData) this.loadGraph()
            },
            // 切换选中节点时清除两步删除确认
            selectedId () {
                this.deleteConfirm = null
            }
        },
        mounted () {
            // 首次进入：优先 props.graphData，其次 sessionStorage
            this.loadGraph()
        },
        beforeUnmount () {
            this.unbindDrag()
            if (this.runTimer) {
                clearTimeout(this.runTimer)
                this.runTimer = null
            }
        },
        methods: {
            // —— 数据载入 ——
            // 解析图数据：兼容对象与 JSON 字符串，也兼容 { graphData: '...' } 包装形态
            parseGraph (input) {
                if (!input) return null
                let data = input
                if (typeof data === 'string') {
                    try {
                        data = JSON.parse(data)
                    } catch (e) {
                        return null
                    }
                }
                if (data && typeof data === 'object') {
                    if (Array.isArray(data.nodes)) {
                        return { nodes: data.nodes, edges: Array.isArray(data.edges) ? data.edges : [] }
                    }
                    // 生成器草稿整包（含 graphData 字符串）再剥一层
                    if (data.graphData) return this.parseGraph(data.graphData)
                }
                return null
            },
            // 载入图数据：props.graphData → sessionStorage → generatedWorkflow.graphData → 空画布
            loadGraph () {
                let parsed = this.parseGraph(this.graphData)
                if (!parsed) {
                    let stored = null
                    try {
                        stored = sessionStorage.getItem(GRAPH_STORAGE_KEY)
                    } catch (e) {
                        // sessionStorage 不可用时跳过
                    }
                    parsed = this.parseGraph(stored)
                }
                if (!parsed && this.generatedWorkflow) {
                    parsed = this.parseGraph(this.generatedWorkflow)
                }
                this.applyGraph(parsed || { nodes: [], edges: [] })
            },
            // 归一化节点 / 边并写入本地状态（补默认坐标、config 对象，过滤悬空边）
            applyGraph (graph) {
                const nodes = (graph.nodes || []).map((n, i) => ({
                    id: n.id != null ? String(n.id) : 'node-' + (i + 1),
                    type: n.type || 'tool',
                    name: n.name || ('节点 ' + (i + 1)),
                    positionX: typeof n.positionX === 'number' ? n.positionX : 60 + i * 220,
                    positionY: typeof n.positionY === 'number' ? n.positionY : 160,
                    enabled: n.enabled !== false,
                    config: Object.assign({}, n.config)
                }))
                const idSet = {}
                nodes.forEach(n => { idSet[n.id] = true })
                const edges = (graph.edges || []).filter(e => e && idSet[e.source] && idSet[e.target])
                    .map((e, i) => ({
                        id: e.id != null ? String(e.id) : 'edge-' + (i + 1),
                        source: String(e.source),
                        target: String(e.target),
                        sourceHandle: e.sourceHandle || null
                    }))
                this.nodes = nodes
                this.edges = edges
                this.selectedId = null
                this.runState = {}
            },
            // 序列化为与原画布一致的 graphData 结构
            serializeGraph () {
                return {
                    nodes: this.nodes.map(n => ({
                        id: n.id,
                        type: n.type,
                        name: n.name,
                        positionX: Math.round(n.positionX),
                        positionY: Math.round(n.positionY),
                        enabled: n.enabled !== false,
                        config: n.config || {}
                    })),
                    edges: this.edges.map(e => ({
                        id: e.id,
                        source: e.source,
                        target: e.target,
                        sourceHandle: e.sourceHandle
                    }))
                }
            },

            // —— 选择与配置 ——
            selectNode (id) {
                this.selectedId = id
            },
            clearSelection () {
                this.selectedId = null
            },
            typeLabel (type) {
                const hit = NODE_TYPES.find(t => t.value === type)
                return hit ? hit.label : type
            },
            handleLabel (handle) {
                if (handle === 'true') return '是'
                if (handle === 'false') return '否'
                return ''
            },

            // —— 节点增删 ——
            // 添加节点：接在最右侧节点之后，并自动与上一节点连一条边
            addNode () {
                const seq = this.nodes.length + 1
                const maxX = this.nodes.reduce((m, n) => Math.max(m, n.positionX), 40)
                const baseY = this.nodes.length ? this.nodes[this.nodes.length - 1].positionY : 160
                const node = {
                    id: 'node-' + Date.now(),
                    type: this.nextType,
                    name: this.typeLabel(this.nextType) + '节点 ' + seq,
                    positionX: maxX + 220,
                    positionY: baseY,
                    enabled: true,
                    config: {}
                }
                const prev = this.nodes[this.nodes.length - 1]
                this.nodes.push(node)
                if (prev) {
                    // 自动串联：上一节点 → 新节点，便于快速搭建线性流程
                    this.edges.push({
                        id: 'edge-' + Date.now(),
                        source: prev.id,
                        target: node.id,
                        sourceHandle: prev.type === 'condition' ? 'true' : null
                    })
                }
                this.selectedId = node.id
                Message.success('已添加节点')
            },
            // 两步删除：第一次点击进入确认，再次点击执行删除
            removeSelected () {
                if (!this.selectedNode) return
                if (this.deleteConfirm !== this.selectedNode.id) {
                    this.deleteConfirm = this.selectedNode.id
                    return
                }
                const id = this.selectedNode.id
                this.nodes = this.nodes.filter(n => n.id !== id)
                this.edges = this.edges.filter(e => e.source !== id && e.target !== id)
                this.selectedId = null
                this.deleteConfirm = null
                Message.success('已删除节点')
            },

            // —— 画布拖拽 ——
            onNodeDown (event, node) {
                if (event.button !== 0) return
                this.selectedId = node.id
                const startX = event.clientX
                const startY = event.clientY
                const origX = node.positionX
                const origY = node.positionY
                // 拖动位移按原始坐标累加，避免监听器间状态丢失
                this.moveHandler = (ev) => {
                    node.positionX = Math.max(0, origX + (ev.clientX - startX))
                    node.positionY = Math.max(0, origY + (ev.clientY - startY))
                }
                this.upHandler = () => this.unbindDrag()
                window.addEventListener('mousemove', this.moveHandler)
                window.addEventListener('mouseup', this.upHandler)
                event.preventDefault()
            },
            // 解绑拖拽监听（mouseup 与组件卸载时均需调用）
            unbindDrag () {
                if (this.moveHandler) window.removeEventListener('mousemove', this.moveHandler)
                if (this.upHandler) window.removeEventListener('mouseup', this.upHandler)
                this.moveHandler = null
                this.upHandler = null
            },
            nodeStyle (n) {
                return { left: n.positionX + 'px', top: n.positionY + 'px' }
            },

            // —— 保存草稿 ——
            // sessionStorage 仅作 UI 中转；真实持久化：有 id 保存图数据，无 id 先创建再回写
            async saveDraft () {
                if (this.saving) return
                this.saving = true
                const graphData = this.serializeGraph()
                try {
                    sessionStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(graphData))
                } catch (e) {
                    // 存储失败不阻断接口保存
                }
                try {
                    const wfId = this.workflow && this.workflow.id != null ? this.workflow.id : null
                    if (wfId == null) {
                        // 无 id：先 workflowCreate，再把真实 id 回写给宿主
                        const created = await workflowCreate({
                            name: (this.workflow && this.workflow.name) ||
                                (this.generatedWorkflow && this.generatedWorkflow.name) ||
                                '未命名工作流',
                            description: (this.workflow && (this.workflow.summary || this.workflow.description)) || '',
                            graphData: JSON.stringify(graphData)
                        })
                        const id = created && created.id != null ? created.id : null
                        if (id == null) throw new Error('创建工作流未返回 id')
                        this._lastSaved = new Date().toLocaleTimeString('zh-CN')
                        this.$emit('save', {
                            id,
                            workflow: Object.assign({}, this.workflow || {}, { id }),
                            graphData,
                            data: created
                        })
                    } else {
                        // 有 id：保存图数据（序列化为 JSON 字符串，与创建口径一致）
                        await workflowSaveGraph(wfId, JSON.stringify(graphData))
                        this._lastSaved = new Date().toLocaleTimeString('zh-CN')
                        this.$emit('save', { id: wfId, workflow: this.workflow, graphData })
                    }
                    Message.success('草稿已保存')
                } catch (e) {
                    Message.error('保存失败，请稍后重试')
                } finally {
                    this.saving = false
                }
            },

            // —— 运行调试 ——
            // 真实执行：有 id 调 workflowExecute(id, input, true)，无 id 提示先保存
            async runDebug () {
                if (this.running) return
                if (!this.nodes.length) {
                    Message.warning('画布为空，无法运行')
                    return
                }
                const wfId = this.workflow && this.workflow.id != null ? this.workflow.id : null
                if (wfId == null) {
                    Message.warning('请先保存工作流，再运行调试')
                    return
                }
                this.running = true
                this.runState = {}
                this.runLogs = []
                const input = {}
                this.$emit('run', { id: wfId, graphData: this.serializeGraph(), input })
                this.pushLog('info', '开始调试，工作流 ID：' + wfId)
                try {
                    await workflowExecute(wfId, input, true)
                    // 执行成功：按本地拓扑顺序点亮节点并记录日志
                    if (!this.running) {
                        this.pushLog('warn', '执行已返回，但调试已被手动停止')
                        return
                    }
                    const order = this.buildRunOrder()
                    const doneState = {}
                    order.forEach(n => { doneState[n.id] = 'done' })
                    this.runState = doneState
                    this.pushLog('success', '调试完成，共 ' + order.length + ' 个节点')
                    Message.success('运行调试完成')
                } catch (e) {
                    if (this.running) {
                        this.pushLog('error', '执行失败，请检查工作流配置')
                        Message.error('运行调试失败')
                    }
                } finally {
                    this.running = false
                    this.runTimer = null
                }
            },
            // 停止调试：中断计时链并复位运行状态
            cancelRun () {
                this.running = false
                if (this.runTimer) {
                    clearTimeout(this.runTimer)
                    this.runTimer = null
                }
                this.runState = {}
                this.pushLog('warn', '调试已手动停止')
            },
            // 构建运行顺序：从开始节点（或首节点）沿连线深度优先，孤立节点按数组序补入
            buildRunOrder () {
                const start = this.nodes.find(n => n.type === 'start') || this.nodes[0]
                const visited = {}
                const order = []
                const walk = (id) => {
                    if (!id || visited[id]) return
                    visited[id] = true
                    const node = this.nodes.find(n => n.id === id)
                    if (node) order.push(node)
                    this.edges.filter(e => e.source === id).forEach(e => walk(e.target))
                }
                if (start) walk(start.id)
                this.nodes.forEach(n => {
                    if (!visited[n.id]) order.push(n)
                })
                return order
            },
            // 追加一条运行日志（带时间戳，最多保留 50 条）
            pushLog (type, text) {
                const d = new Date()
                const pad = v => (v < 10 ? '0' + v : '' + v)
                this.runLogs.push({
                    type,
                    text,
                    time: pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
                })
                if (this.runLogs.length > 50) this.runLogs.shift()
            }
        }
    }
</script>

<style lang="less" scoped>
    @import (reference) '../styles/agent-theme.less';

    // ============================================================
    // 宿主适配：根节点 class="workflow-module" + data-module 标识。
    // 颜色/圆角走 --wf-* 变量：.ag-wf-tokens() 映射到 --ag-theme-*（绛红宣纸回退），
    // 宿主可在祖先覆盖；宽度 100% 不锁门户定宽，随 iframe / 嵌入容器自适应。
    // 画布语义：选中态=绛红、运行态=金色、完成态=主题成功色、日志走语义 token。
    // ============================================================
    .workflow-module {
        .ag-wf-tokens();
        // iView 组件统一走品牌主题（按钮 / 输入 / 开关 / 下拉）
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

    .wf-canvas *,
    .wf-canvas *::before,
    .wf-canvas *::after {
        box-sizing: border-box;
    }

    /* 页头 */
    .wf-head {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 14px;
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

    /* 三栏主体：节点列表 | 画布 | 配置面板 */
    .wf-body {
        display: grid;
        grid-template-columns: minmax(200px, 232px) minmax(0, 1fr) minmax(220px, 260px);
        gap: 14px;
        align-items: stretch;
    }
    .wf-side {
        min-width: 0;
        padding: 12px 14px;
        border: 1px solid var(--wf-border);
        border-radius: var(--wf-radius);
        background: var(--wf-surface);
    }
    .wf-side__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 10px;
    }
    .wf-side__title {
        font-size: 14px;
        font-weight: 600;
        color: var(--wf-text);
    }
    .wf-side__count {
        font-size: 12px;
        color: var(--wf-text-3);
    }

    /* 节点列表 */
    .wf-nodes__add {
        display: flex;
        gap: 8px;
        margin-bottom: 10px;

        .ivu-select { flex: 1; min-width: 0; }
    }
    .wf-ncards {
        list-style: none;
        margin: 0;
        padding: 0;
        max-height: 320px;
        overflow: auto;
    }
    .wf-ncard {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border: 1px solid transparent;
        border-radius: var(--wf-radius);
        cursor: pointer;
        transition: background-color 150ms @ag-ease, border-color 150ms @ag-ease;

        & + & { margin-top: 4px; }
        &:hover { background: var(--wf-fill); }
        // 选中态：绛红
        &.is-active {
            border-color: var(--wf-accent);
            background: var(--wf-accent-weak);
        }
        &.is-off { opacity: 0.55; }
        // 运行态：金色；完成态：主题成功色
        &.is-running { border-color: var(--wf-gold); background: var(--wf-gold-weak); }
        &.is-done { border-color: var(--wf-success); }
    }
    .wf-ncard__idx {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--wf-fill);
        color: var(--wf-text-2);
        font-size: 11px;
    }
    .wf-ncard__body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
    }
    .wf-ncard__name {
        font-size: 13px;
        color: var(--wf-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .wf-ncard__type {
        font-size: 11px;
        color: var(--wf-text-3);
    }
    .wf-ncard__state {
        flex-shrink: 0;
        font-size: 11px;
        // 执行中：纸面上可读的深金（纯金 #F69C20 文字对比不足）
        color: var(--wf-gold-text);

        &.is-done { color: var(--wf-success); }
    }

    /* 画布区 */
    .wf-stage {
        display: flex;
        flex-direction: column;
        min-width: 0;
        border: 1px solid var(--wf-border);
        border-radius: var(--wf-radius);
        background: var(--wf-surface);
        overflow: hidden;
    }
    .wf-stage__bar {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 8px 12px;
        border-bottom: 1px solid var(--wf-border);
        font-size: 12px;
        color: var(--wf-text-2);
        flex-wrap: wrap;
    }
    // 调试运行中：金色（与选中绛红区分）
    .wf-stage__run { color: var(--wf-gold-text); font-weight: 600; }
    .wf-stage__tip {
        margin-left: auto;
        color: var(--wf-text-3);
    }
    .wf-stage__view {
        position: relative;
        flex: 1;
        min-height: 380px;
        max-height: 60vh;
        overflow: auto;
        background:
            linear-gradient(var(--wf-fill) 1px, transparent 1px) 0 0 / 100% 24px,
            linear-gradient(90deg, var(--wf-fill) 1px, transparent 1px) 0 0 / 24px 100%,
            var(--wf-paper);
    }
    .wf-stage__world {
        position: relative;
    }

    /* 连线层 */
    .wf-edges {
        position: absolute;
        left: 0;
        top: 0;
        pointer-events: none;
    }
    // 箭头：默认随次文灰，选中连线随绛红（由 CSS 类驱动，替代 SVG fill 属性）
    .wf-edges__arrow {
        fill: var(--wf-text-3);

        &.is-active { fill: var(--wf-accent); }
    }
    .wf-edges__path {
        fill: none;
        // 默认连线用主题边框强色（原冷灰已移除）
        stroke: var(--wf-border-strong);
        stroke-width: 1.6;

        &.is-active { stroke: var(--wf-accent); stroke-width: 2; }
    }
    .wf-edges__label {
        font-size: 11px;
        fill: var(--wf-text-2);
        text-anchor: middle;
    }

    /* 节点卡片（固定 176x64，与连线锚点计算一致） */
    .wf-node {
        position: absolute;
        width: 176px;
        height: 64px;
        display: flex;
        align-items: center;
        padding: 0 10px;
        border: 1px solid var(--wf-border-strong);
        border-radius: var(--wf-radius);
        background: var(--wf-surface);
        box-shadow: var(--wf-shadow-1);
        cursor: grab;
        user-select: none;
        transition: border-color 150ms @ag-ease, box-shadow 150ms @ag-ease;

        &:active { cursor: grabbing; }
        // 选中态：绛红描边 + 绛红弱环
        &.is-active {
            border-color: var(--wf-accent);
            box-shadow: 0 0 0 2px var(--wf-accent-weak);
        }
        &.is-off { opacity: 0.55; }
        // 运行态：金色描边 + 金色弱环；完成态：主题成功色
        &.is-running {
            border-color: var(--wf-gold);
            box-shadow: 0 0 0 2px var(--wf-gold-weak);
        }
        &.is-done { border-color: var(--wf-success); }
    }
    .wf-node__body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        pointer-events: none;
    }
    .wf-node__type {
        font-size: 11px;
        color: var(--wf-text-3);
    }
    .wf-node__name {
        max-width: 100%;
        font-size: 13px;
        font-weight: 600;
        color: var(--wf-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .wf-node__port {
        flex-shrink: 0;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--wf-border-strong);

        &.is-out { background: var(--wf-accent); }
    }

    /* 配置面板 */
    .wf-field { margin-bottom: 12px; }
    .wf-field--row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .wf-label {
        display: block;
        margin-bottom: 4px;
        font-size: 12px;
        color: var(--wf-text-2);
    }
    .wf-meta {
        margin-top: 4px;
        padding: 8px 10px;
        border: 1px dashed var(--wf-border);
        border-radius: var(--wf-radius);
        background: var(--wf-paper);
    }
    .wf-meta__row {
        display: flex;
        gap: 8px;
        font-size: 12px;
        line-height: 1.9;

        span { flex-shrink: 0; color: var(--wf-text-3); }
        code {
            font-family: Consolas, Menlo, monospace;
            color: var(--wf-text-2);
            word-break: break-all;
        }
    }
    .wf-config__actions { margin-top: 12px; }

    /* 运行日志 */
    .wf-logs {
        border-top: 1px solid var(--wf-border);
        background: var(--wf-paper);
    }
    .wf-logs__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 600;
        color: var(--wf-text-2);
    }
    .wf-logs__clear {
        padding: 0;
        border: none;
        background: none;
        font-size: 12px;
        color: var(--wf-text-3);
        cursor: pointer;

        &:hover { color: var(--wf-accent); }
    }
    .wf-logs__list {
        list-style: none;
        margin: 0;
        padding: 0 12px 8px;
        max-height: 120px;
        overflow: auto;
        font-size: 12px;
        line-height: 1.8;

        li { color: var(--wf-text-2); }
        li.is-success { color: var(--wf-success); }
        li.is-warn { color: var(--wf-warn); }
        li.is-error { color: var(--wf-danger); }
    }

    /* 空状态 */
    .wf-empty {
        padding: 18px 8px;
        text-align: center;
        font-size: 12.5px;
        color: var(--wf-text-3);
        line-height: 1.7;
    }
    .wf-empty--stage {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 80%;
        padding: 0;
    }

    /* 窄屏（iframe / 移动端）：三栏折叠 */
    @media (max-width: 1100px) {
        .wf-body {
            grid-template-columns: minmax(0, 1fr);
        }
        .wf-stage__view {
            min-height: 320px;
            max-height: 50vh;
        }
    }

    // 无障碍：尊重系统「减少动态效果」（关闭节点/连线过渡）
    .ag-reduced-motion();
</style>
