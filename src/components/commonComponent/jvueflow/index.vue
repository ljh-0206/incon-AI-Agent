<template>
  <div class="jvueflow-wrapper" :style="wrapperStyle">
    <!-- 左侧：节点面板 -->
    <div class="jvueflow-panel">
      <div class="panel-title">节点类型</div>
      <div class="panel-items">
        <div
          v-for="item in nodeTypes"
          :key="item.type"
          class="panel-item"
          draggable="true"
          @dragstart="onDragStart($event, item)"
          @click="addNodeByClick(item)"
        >
          <span class="node-icon" :style="{ background: item.color }"></span>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- 中间：VueFlow 画布 -->
    <div
      class="jvueflow-canvas"
      @dragover.prevent
      @dragenter.prevent
    >
      <!-- 画布内浮动工具栏 -->
      <div class="jvueflow-toolbar">
        <div class="toolbar-title">流程配置</div>
        <div class="toolbar-actions">
          <Button size="small" @click="clearFlow">清空画布</Button>
          <Button size="small" @click="exportFlow">导出数据</Button>
          <Button size="small" @click="importFlow">导入数据</Button>
        </div>
      </div>

      <VueFlow
        ref="vueFlowRef"
        v-model:nodes="nodes"
        v-model:edges="edges"
        :node-types="nodeTypeMap"
        :connection-line-style="lineStyle"
        :default-edge-options="defaultEdgeOpts"
        :edges-updatable="true"
        fit-view-on-init
        @node-click="onNodeClick"
        @pane-click="onPaneClick"
        @connect="onConnect"
        @edge-click="onEdgeClick"
        @nodes-change="emitChange"
        @edges-change="emitChange"
      >
        <VueFlowBackground :gap="16" />
        <VueFlowControls />
      </VueFlow>
      <!-- 右侧浮动属性面板 -->
      <div class="jvueflow-props" v-if="selectedNode || selectedEdge">
      <div class="panel-title">
        {{ selectedNode ? '节点属性' : '连线属性' }}
        <span class="close-btn" @click="clearSelection">x</span>
      </div>

      <template v-if="selectedNode">
        <div class="prop-item">
          <label>节点ID</label>
          <Input :value="selectedNode.id" disabled />
        </div>
        <div class="prop-item">
          <label>名称</label>
          <Input v-model="selectedNode.data.label" @on-change="emitChange" />
        </div>
        <div class="prop-item">
          <label>描述</label>
          <Input v-model="selectedNode.data.description" type="textarea" :rows="3" @on-change="emitChange" />
        </div>
        <div class="prop-item">
          <label>X 坐标</label>
          <InputNumber v-model="selectedNode.position.x" :min="0" @on-change="emitChange" />
        </div>
        <div class="prop-item">
          <label>Y 坐标</label>
          <InputNumber v-model="selectedNode.position.y" :min="0" @on-change="emitChange" />
        </div>
        <div class="prop-actions">
          <Button type="error" size="small" long @click="deleteSelected">删除节点</Button>
        </div>
      </template>

      <template v-if="selectedEdge">
        <div class="prop-item">
          <label>连线ID</label>
          <Input :value="selectedEdge.id" disabled />
        </div>
        <div class="prop-item">
          <label>标签</label>
          <Input v-model="selectedEdge.label" @on-change="emitChange" />
        </div>
        <div class="prop-item">
          <label>条件表达式</label>
          <Input v-model="selectedEdge.data.condition" type="textarea" :rows="2" placeholder="如: approved == true" @on-change="emitChange" />
        </div>
        <div class="prop-actions">
          <Button type="error" size="small" long @click="deleteSelected">删除连线</Button>
        </div>
      </template>
    </div>
    </div>

    <!-- 导入弹窗 -->
    <Modal v-model="importModal" title="导入流程数据" @on-ok="doImport">
      <Input v-model="importJson" type="textarea" :rows="10" placeholder="粘贴 JSON 数据..." />
    </Modal>

    <!-- 底部拖拽条 -->
    <div class="jvueflow-resize-handle" @mousedown.prevent="onResizeStart"></div>
  </div>
</template>

<script>
    import { markRaw, h } from 'vue'
    import { Handle, Position, MarkerType } from '@vue-flow/core'
    // import { Button, Input, InputNumber, Modal } from 'view-ui-plus'

    /* ======== 节点渲染配置 ======== */
    const NODE_CONFIG = {
        start: { icon: '\u25B6', label: '\u5F00\u59CB', cls: 'flow-node--start', hideTarget: true, hideSource: false, condition: false },
        end: { icon: '\u23F9', label: '\u7ED3\u675F', cls: 'flow-node--end', hideTarget: false, hideSource: true, condition: false },
        task: { icon: '\uD83D\uDCCB', label: '\u4EFB\u52A1', cls: 'flow-node--task', hideTarget: false, hideSource: false, condition: false },
        condition: { icon: '\u25C7', label: '\u6761\u4EF6', cls: 'flow-node--condition', hideTarget: false, hideSource: false, condition: true },
        gateway: { icon: '\u2B21', label: '\u7F51\u5173', cls: 'flow-node--gateway', hideTarget: false, hideSource: false, condition: false }
    }

    function createFlowNode (type) {
        return {
            props: ['type', 'data', 'selected', 'style'],
            setup (p) {
                return function () {
                    const config = NODE_CONFIG[type]
                    const label = (p.data && p.data.label) ? p.data.label : config.label
                    const desc = (p.data && p.data.description) ? p.data.description : ''
                    const direction = (p.data && p.data.direction === 'vertical') ? 'vertical' : 'horizontal'
                    const children = []

                    // target handle
                    if (!config.hideTarget) {
                        children.push(h(Handle, {
                            type: 'target',
                            position: direction === 'vertical' ? Position.Top : Position.Left
                        }))
                    }

                    // 内容区
                    const contentChildren = [
                        h('div', { class: 'flow-node__icon' }, config.icon),
                        h('div', { class: 'flow-node__label' }, label)
                    ]
                    if (desc) {
                        contentChildren.push(h('div', { class: 'flow-node__desc' }, desc))
                    }
                    children.push(h('div', { class: 'flow-node__content' }, contentChildren))

                    // source handle
                    if (!config.hideSource) {
                        children.push(h(Handle, {
                            type: 'source',
                            position: direction === 'vertical' ? Position.Bottom : Position.Right
                        }))
                    }

                    // 条件节点：额外 handle（"不满足"分支）
                    if (config.condition) {
                        children.push(h(Handle, {
                            id: 'false',
                            type: 'source',
                            position: direction === 'vertical' ? Position.Right : Position.Bottom,
                            style: direction === 'vertical'
                                ? { top: '50%', right: '-4px' }
                                : { left: '50%', bottom: '-4px' }
                        }))
                    }

                    return h('div', {
                        class: ['flow-node', config.cls, { 'flow-node--selected': p.selected }],
                        style: p.style
                    }, children)
                }
            }
        }
    }

    const FlowNodeStart = createFlowNode('start')
    const FlowNodeEnd = createFlowNode('end')
    const FlowNodeTask = createFlowNode('task')
    const FlowNodeCondition = createFlowNode('condition')
    const FlowNodeGateway = createFlowNode('gateway')

    /* ======== 默认标签 ======== */
    const DEFAULT_LABELS = {
        start: '\u5F00\u59CB',
        end: '\u7ED3\u675F',
        task: '\u65B0\u4EFB\u52A1',
        condition: '\u6761\u4EF6\u5224\u65AD',
        gateway: '\u7F51\u5173'
    }

    export default {
        name: 'JVueFlow',
        components: { },
        props: {
            modelValue: { type: [Object, String], default: function () { return '{"nodes":[],"edges":[]}' } },
            readonly: { type: Boolean, default: false },
            nodesDraggable: { type: Boolean, default: true },
            nodesConnectable: { type: Boolean, default: true },
            height: { type: [Number, String], default: 500 },
            direction: { type: String, default: 'horizontal' }
        },
        emits: ['update:modelValue', 'change'],
        mounted: function () {
            const self = this
            this.$nextTick(function () {
                self._bindDropEvents()
            })
            this._keyHandler = function (e) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    // 忽略在 input/textarea 内按的删除键
                    const tag = e.target.tagName
                    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
                    self.deleteSelected()
                }
            }
            document.addEventListener('keydown', this._keyHandler)
        },
        beforeUnmount: function () {
            this._unbindDropEvents()
            if (this._keyHandler) {
                document.removeEventListener('keydown', this._keyHandler)
            }
        },
        data: function () {
            return {
                // 可拖拽调整的高度
                currentHeight: null,
                // 画布数据
                nodes: [],
                edges: [],
                // 选中状态
                selectedNode: null,
                selectedEdge: null,
                // 导入弹窗
                importModal: false,
                importJson: '',
                // ID 计数器
                idCounter: 0,
                // 节点类型列表（左侧面板用）
                nodeTypes: [
                    { type: 'start', label: '\u5F00\u59CB', color: '#52c41a' },
                    { type: 'end', label: '\u7ED3\u675F', color: '#ff4d4f' },
                    { type: 'task', label: '\u4EFB\u52A1', color: '#1890ff' },
                    { type: 'condition', label: '\u6761\u4EF6', color: '#fa8c16' },
                    { type: 'gateway', label: '\u7F51\u5173', color: '#722ed1' }
                ],
                // 静态配置
                lineStyle: { stroke: '#1890ff', strokeWidth: 2 },
                defaultEdgeOpts: {
                    type: 'smoothstep',
                    animated: false,
                    markerEnd: MarkerType.ArrowClosed,
                    style: { stroke: '#b1b1b7', strokeWidth: 1.5 },
                    interactionWidth: 20
                },
                nodeTypeMap: {
                    start: markRaw(FlowNodeStart),
                    end: markRaw(FlowNodeEnd),
                    task: markRaw(FlowNodeTask),
                    condition: markRaw(FlowNodeCondition),
                    gateway: markRaw(FlowNodeGateway)
                }
            }
        },
        computed: {
            wrapperStyle: function () {
                const h = this.currentHeight || this.height
                const px = typeof h === 'number' ? h + 'px' : h
                return { height: px }
            }
        },
        watch: {
            modelValue: {
                handler: function (val) {
                    const data = this._parseValue(val)
                    if (data && data.nodes) {
                        this.nodes = JSON.parse(JSON.stringify(data.nodes))
                        this.edges = JSON.parse(JSON.stringify(data.edges || []))
                        this.idCounter = this.nodes.length
                    }
                },
                deep: true,
                immediate: true
            }
        },
        methods: {
            /* ======== 拖拽事件绑定（直接绑 DOM，绕过 VueFlow 内部拦截）======== */
            _bindDropEvents: function () {
                const self = this
                this._dropPane = this.$el.querySelector('.vue-flow__pane')
                if (this._dropPane) {
                    this._boundDragOver = function (e) { e.preventDefault() }
                    this._boundDrop = function (e) {
                        // 只有从面板拖入的才处理（nodeType 数据仅在 drop 阶段可读取）
                        const raw = e.dataTransfer && e.dataTransfer.getData('nodeType')
                        if (!raw) return
                        e.preventDefault()
                        e.stopPropagation()
                        self.onDrop(e)
                    }
                    this._dropPane.addEventListener('dragover', this._boundDragOver)
                    this._dropPane.addEventListener('drop', this._boundDrop)
                }
            },
            _unbindDropEvents: function () {
                if (this._dropPane) {
                    if (this._boundDragOver) this._dropPane.removeEventListener('dragover', this._boundDragOver)
                    if (this._boundDrop) this._dropPane.removeEventListener('drop', this._boundDrop)
                }
            },

            /* ======== 解析 modelValue（兼容对象和 JSON 字符串）======== */
            _parseValue: function (val) {
                if (!val) return null
                if (typeof val === 'string') {
                    try {
                        return JSON.parse(val)
                    } catch (e) {
                        console.warn('JVueFlow: modelValue JSON 解析失败', e)
                        return null
                    }
                }
                return val
            },

            /* ======== 添加节点 ======== */
            makeNode: function (item, position) {
                const id = 'node_' + Date.now() + '_' + (++this.idCounter)
                const defaults = {}
                defaults[item.type] = { label: DEFAULT_LABELS[item.type] }
                return {
                    id,
                    type: item.type,
                    position: position || { x: 250 + Math.random() * 200, y: 200 + Math.random() * 200 },
                    data: {
                        label: DEFAULT_LABELS[item.type],
                        color: item.color,
                        description: '',
                        direction: this.direction
                    }
                }
            },

            addNode: function (item, position) {
                this.nodes = this.nodes.concat([this.makeNode(item, position)])
                this.emitChange()
            },

            addNodeByClick: function (item) {
                this.addNode(item)
            },

            /* ======== 拖拽 ======== */
            onDragStart: function (event, item) {
                event.dataTransfer.setData('nodeType', JSON.stringify(item))
                event.dataTransfer.effectAllowed = 'move'
            },

            onDrop: function (event) {
                const raw = event.dataTransfer.getData('nodeType')
                if (!raw) return
                const item = JSON.parse(raw)

                // 转换为 flow 坐标系
                const vueFlow = this.$refs.vueFlowRef
                let position
                if (vueFlow && typeof vueFlow.screenToFlowCoordinate === 'function') {
                    position = vueFlow.screenToFlowCoordinate({ x: event.clientX, y: event.clientY })
                } else {
                    // 降级方案：手动计算
                    const pane = this.$el.querySelector('.vue-flow__viewport')
                    if (pane) {
                        const rect = pane.getBoundingClientRect()
                        position = { x: event.clientX - rect.left, y: event.clientY - rect.top }
                    } else {
                        position = { x: event.clientX - 300, y: event.clientY - 200 }
                    }
                }
                this.addNode(item, position)
            },

            /* ======== 连线 ======== */
            onConnect: function (connection) {
                this.edges = this.edges.concat([{
                    id: 'edge_' + connection.source + '_' + connection.target + '_' + Date.now(),
                    source: connection.source,
                    target: connection.target,
                    sourceHandle: connection.sourceHandle || null,
                    targetHandle: connection.targetHandle || null,
                    label: '',
                    markerEnd: MarkerType.ArrowClosed,
                    data: { condition: '' }
                }])
                this.emitChange()
            },

            /* ======== 选择 ======== */
            onNodeClick: function (event) {
                this.selectedEdge = null
                this.selectedNode = event.node
            },

            onEdgeClick: function (event) {
                this.selectedNode = null
                this.selectedEdge = event.edge
            },

            onPaneClick: function () {
                this.clearSelection()
            },

            clearSelection: function () {
                this.selectedNode = null
                this.selectedEdge = null
            },

            /* ======== 删除选中元素 ======== */
            deleteSelected: function () {
                if (this.selectedNode) {
                    const id = this.selectedNode.id
                    this.nodes = this.nodes.filter(function (n) { return n.id !== id })
                    this.edges = this.edges.filter(function (e) { return e.source !== id && e.target !== id })
                    this.clearSelection()
                    this.emitChange()
                } else if (this.selectedEdge) {
                    const edgeId = this.selectedEdge.id
                    this.edges = this.edges.filter(function (e) { return e.id !== edgeId })
                    this.clearSelection()
                    this.emitChange()
                }
            },

            /* ======== 数据通知 ======== */
            emitChange: function () {
                const data = {
                    nodes: JSON.parse(JSON.stringify(this.nodes)),
                    edges: JSON.parse(JSON.stringify(this.edges))
                }
                this.$emit('update:modelValue', JSON.stringify(data))
                this.$emit('change', data)
            },

            /* ======== 清空 ======== */
            clearFlow: function () {
                this.nodes = []
                this.edges = []
                this.idCounter = 0
                this.clearSelection()
                this.emitChange()
            },

            /* ======== 导出 ======== */
            exportFlow: function () {
                const data = {
                    nodes: JSON.parse(JSON.stringify(this.nodes)),
                    edges: JSON.parse(JSON.stringify(this.edges))
                }
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = 'flow_' + Date.now() + '.json'
                a.click()
                URL.revokeObjectURL(a.href)
            },

            /* ======== 导入 ======== */
            importFlow: function () {
                this.importJson = ''
                this.importModal = true
            },

            doImport: function () {
                try {
                    const data = JSON.parse(this.importJson)
                    if (data.nodes && Array.isArray(data.nodes)) {
                        this.nodes = data.nodes
                        this.edges = data.edges || []
                        this.idCounter = this.nodes.length
                        this.clearSelection()
                        this.emitChange()
                    }
                    this.importModal = false
                } catch (e) {
                    this.$Message ? this.$Message.error('JSON 格式错误: ' + e.message) : alert('JSON 格式错误: ' + e.message)
                }
            },

            /* ======== 拖拽调整高度 ======== */
            onResizeStart: function (e) {
                const self = this
                const startY = e.clientY
                const startHeight = this.$el.getBoundingClientRect().height
                this._resizing = true

                const onMove = function (ev) {
                    if (!self._resizing) return
                    const dy = ev.clientY - startY
                    self.currentHeight = Math.max(300, startHeight + dy)
                }
                const onUp = function () {
                    self._resizing = false
                    document.removeEventListener('mousemove', onMove)
                    document.removeEventListener('mouseup', onUp)
                    document.body.style.cursor = ''
                    document.body.style.userSelect = ''
                }
                document.addEventListener('mousemove', onMove)
                document.addEventListener('mouseup', onUp)
                document.body.style.cursor = 'ns-resize'
                document.body.style.userSelect = 'none'
            },

            /* ======== 对外方法 ======== */
            getFlowData: function () {
                return {
                    nodes: JSON.parse(JSON.stringify(this.nodes)),
                    edges: JSON.parse(JSON.stringify(this.edges))
                }
            }
        }
    }
</script>

<style scoped>
.jvueflow-wrapper {
  display: flex;
  height: 100%;
  min-height: 300px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.jvueflow-panel {
  width: 160px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: grab;
  font-size: 13px;
  transition: all 0.2s;
  background: #fafafa;
}
.panel-item:hover {
  border-color: #1890ff;
  background: #e6f7ff;
}
.panel-item:active {
  cursor: grabbing;
}

.node-icon {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
}

.jvueflow-canvas {
  flex: 1;
  min-width: 0;
  position: relative;
  touch-action: none;
}

/* 画布内浮动工具栏 */
.jvueflow-toolbar {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 6px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  pointer-events: auto;
}
.toolbar-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}
.toolbar-actions {
  display: flex;
  gap: 6px;
}

.jvueflow-props {
  position: absolute;
  top: 8px;
  right: 8px;
  bottom: 8px;
  width: 220px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.close-btn {
  cursor: pointer;
  color: #999;
  font-size: 16px;
}
.close-btn:hover {
  color: #333;
}

.prop-item {
  margin-bottom: 12px;
}
.prop-item label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.prop-actions {
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}

/* 底部拖拽调整高度 */
.jvueflow-resize-handle {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  cursor: ns-resize;
  background: transparent;
  z-index: 10;
  transition: background 0.2s;
}
.jvueflow-resize-handle:hover {
  background: rgba(24, 144, 255, 0.3);
}
</style>

<style>
/* 全局样式 - 自定义节点 */
.flow-node {
  position: relative;
  min-width: 120px;
  padding: 10px 16px;
  border: 2px solid #e8e8e8;
  background: #fff;
  font-size: 13px;
  text-align: center;
  transition: box-shadow 0.2s;
}
.flow-node:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.flow-node--selected {
  box-shadow: 0 0 0 2px #1890ff !important;
}

.flow-node--start {
  border-radius: 50%;
  min-width: 80px;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-color: #52c41a;
  background: #f6ffed;
}
.flow-node--end {
  border-radius: 50%;
  min-width: 80px;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-color: #ff4d4f;
  background: #fff2f0;
}
.flow-node--task {
  border-color: #1890ff;
  background: #e6f7ff;
}
.flow-node--condition {
  border-color: #fa8c16;
  background: #fff7e6;
}
.flow-node--gateway {
  border-color: #722ed1;
  background: #f9f0ff;
}

.flow-node__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.flow-node__icon {
  font-size: 16px;
}
.flow-node__label {
  font-weight: 500;
  white-space: nowrap;
}
.flow-node__desc {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.flow-node .vue-flow__handle {
  width: 10px;
  height: 10px;
  background: #1890ff;
  border: 2px solid #fff;
}

/* 连线选中高亮 */
.vue-flow__edge.selected .vue-flow__edge-path {
  stroke: #1890ff !important;
  stroke-width: 2.5 !important;
}
.vue-flow__edge:hover .vue-flow__edge-path {
  stroke: #1890ff !important;
  cursor: pointer;
}

/* 消除 passive event listener 警告 */
.vue-flow__pane {
  touch-action: none;
}

/* 连线可点击区域加大 */
.vue-flow__edge {
  cursor: pointer;
}
.vue-flow__edge .vue-flow__edge-interaction {
  stroke: transparent;
  stroke-width: 20;
}
</style>
