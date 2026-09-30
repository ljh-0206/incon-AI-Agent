<template>
  <div class="rule-canvas-container">
    <!-- 保存中的加载层 -->
    <div v-if="saving" class="saving-overlay">
      <Spin size="large">保存中...</Spin>
    </div>
    <!-- 顶部工具栏 -->
    <div class="canvas-toolbar">
      <div class="toolbar-left">
        <Button size="small" @click="handleUndo" :disabled="!canUndo">
          <Icon type="ios-undo" />撤销
        </Button>
        <Button size="small" @click="handleRedo" :disabled="!canRedo">
          <Icon type="ios-redo" />重做
        </Button>
        <div class="toolbar-divider"></div>
        <Button size="small" @click="handleZoomIn">
          <Icon type="ios-add" />放大
        </Button>
        <Button size="small" @click="handleZoomOut">
          <Icon type="ios-remove" />缩小
        </Button>
        <Button size="small" @click="handleZoomReset">
          <Icon type="ios-contract" />适应
        </Button>
        <div class="toolbar-divider"></div>
        <Button size="small" @click="handleToggleGrid">
          <Icon :type="showGrid ? 'md-grid' : 'md-grid-outline'" />网格
        </Button>
      </div>
      <div class="toolbar-right">
        <Input v-model="localRuleName" placeholder="规则名称" style="width: 180px;" />
        <div class="toolbar-divider"></div>
        <span class="prop-label">优先级</span>
        <InputNumber v-model="localPriority" size="small" :min="1" :max="999" style="width: 70px;" />
        <div class="toolbar-divider"></div>
        <Checkbox v-model="localBlockWhenFail" size="small">失败阻断</Checkbox>
        <div class="toolbar-divider"></div>
        <Select v-model="localStatus" size="small" style="width: 80px;">
          <Option value="1">启用</Option>
          <Option value="0">禁用</Option>
        </Select>
        <div class="toolbar-divider"></div>
        <Button size="small" @click="handleTemplate">
          <Icon type="ios-folder-outline" />使用模板
        </Button>
        <Button size="small" @click="handleImportJson">
          <Icon type="ios-download-outline" />导入JSON
        </Button>
        <Button size="small" @click="handleExportJson">
          <Icon type="ios-upload-outline" />导出JSON
        </Button>
        <Button size="small" @click="handleTest">
          <Icon type="ios-play-outline" />测试
        </Button>
        <div class="toolbar-divider"></div>
        <Button type="primary" size="small" @click="handleSave">
          <Icon type="ios-save-outline" />保存
        </Button>
      </div>
    </div>

    <!-- 主体内容区 -->
    <div class="canvas-main">
      <!-- 左侧节点面板 -->
      <RuleNodePanel :nodes="nodes" @drag-start="onDragStart" @node-click="onNodePanelClick" />

      <!-- 画布区域 -->
      <div
        ref="canvasRef"
        class="canvas-area"
        :class="{ 'grid-visible': showGrid, 'canvas-panning': isPanning }"
        @dragover.prevent="onDragOver"
        @drop="onDrop"
        @click="onCanvasClick"
        @mouseup="onCanvasMouseUp"
        @mousedown="onCanvasMouseDown"
        @mousemove="onCanvasMouseMove"
      >
        <!-- 画布内容层（应用缩放和偏移） -->
        <div
          class="canvas-content"
          :style="{
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }"
        >
          <!-- 节点层 -->
          <div
            v-for="node in nodes"
            :key="node.id"
            class="canvas-node"
            :class="[node.type, { selected: (selectedNodeId?.value ?? selectedNodeId) === node.id }]"
            :style="{ left: node.x + 'px', top: node.y + 'px' }"
            @mousedown.stop="onNodeMouseDown($event, node)"
            @click.stop="onNodeClick(node)"
            @dblclick.stop="onNodeDoubleClick(node)"
            @mouseup.stop="onNodeMouseUp($event, node)"
          >
            <NodeTypes
              :node="node"
              :selected="(selectedNodeId?.value ?? selectedNodeId) === node.id"
              @port-mousedown="onPortMouseDown"
            />
          </div>

          <!-- SVG连接线层 -->
          <RuleCanvasSvg
            ref="svgRef"
            :connections="connections"
            :temp-connection="tempConnection"
            :nodes="nodes"
            :selected-connection-id="selectedConnectionId?.value ?? selectedConnectionId"
            @connection-click="onConnectionClick"
          />
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <RuleNodeProps
        v-if="selectedNode"
        :node="selectedNode"
        :available-variables="availableVariables"
        :sql-list="sqlList"
        @update="onNodeUpdate"
        @delete="onNodeDelete"
      />

      <!-- 未选中时的预览面板 -->
      <RulePreview
        v-else
        :nodes="nodes"
        :connections="connections"
        :canvas-expr="currentJson"
      />
    </div>

    <!-- 底部状态栏 -->
    <div class="canvas-status">
      <span>节点数: {{ nodes.length }}</span>
      <span>|</span>
      <span>连接数: {{ connections.length }}</span>
      <span>|</span>
      <span>缩放: {{ Math.round(zoom * 100) }}%</span>
      <span>|</span>
      <span>{{ selectedNodeId ? '已选中节点' : '未选中节点' }}</span>
    </div>

    <!-- 模板选择弹窗 -->
    <RuleTemplate
      v-model="templateModalVisible"
      @select="onTemplateSelect"
    />

    <!-- 导入JSON弹窗 -->
    <Modal v-model="importModalVisible" title="导入JSON" width="600" footer-hide>
      <div class="import-content">
        <Alert type="info" show-icon>粘贴JSON内容到下方文本框</Alert>
        <Input
          v-model="importJsonContent"
          type="textarea"
          :rows="10"
          placeholder="请粘贴JSON内容..."
        />
        <Alert type="warning" show-icon v-if="importWarning" class="ivu-mt-8">
          {{ importWarning }}
        </Alert>
      </div>
      <div slot="footer" style="text-align: right;">
        <Button @click="importModalVisible = false">取消</Button>
        <Button type="primary" style="margin-left: 10px;" @click="confirmImportJson">导入</Button>
      </div>
    </Modal>
    <!-- 测试规则弹窗 -->
    <RuleTest
      v-model="testModalVisible"
      :rule-id="ruleId"
      :rule-expr="canvasExpr"
    />
  </div>
</template>

<script>
import RuleNodePanel from './RuleNodePanel.vue'
import RuleNodeProps from './RuleNodeProps.vue'
import RuleCanvasSvg from './RuleCanvasSvg.vue'
import RulePreview from './RulePreview.vue'
import RuleTemplate from './RuleTemplate.vue'
import RuleTest from './RuleTest.vue'
import NodeTypes from '../NodeTypes/index.vue'
import { useCanvas } from '../composables/useCanvas.js'
import { useRuleJson } from '../composables/useRuleJson.js'
import { templateToCanvas } from '../utils/templateLoader.js'
import { incoRequest } from '@/api/common.js'
import { reactive, computed, watch, toRefs } from 'vue'

export default {
  name: 'RuleCanvas',
  components: {
    RuleNodePanel,
    RuleNodeProps,
    RuleCanvasSvg,
    RulePreview,
    RuleTemplate,
    RuleTest,
    NodeTypes
  },
  props: {
    ruleId: {
      type: String,
      default: ''
    },
    initialExpr: {
      type: String,
      default: ''
    },
    ruleName: {
      type: String,
      default: ''
    },
    priority: {
      type: Number,
      default: 100
    },
    blockWhenFail: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      default: '1'
    }
  },
  setup(props) {
    // 使用 reactive 来包含所有状态，避免 refs 在 Options API 中的访问问题
    const state = reactive({
      nodes: [],
      connections: [],
      selectedNodeId: null,
      selectedConnectionId: null,
      zoom: 1,
      canvasOffset: { x: 0, y: 0 },
      history: [],
      historyIndex: -1
    })

    const jsonState = useRuleJson()

    // 历史记录相关方法
    function saveHistory() {
      // 如果当前状态和历史中最后一个状态一样，不保存
      const lastEntry = state.history[state.history.length - 1]
      if (lastEntry) {
        const lastNodesStr = JSON.stringify(lastEntry.nodes)
        const currentNodesStr = JSON.stringify(state.nodes)
        if (lastNodesStr === currentNodesStr) return
      }
      // 移除当前位置之后的历史（如果撤销过）
      if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1)
      }
      // 添加新历史
      state.history.push({
        nodes: JSON.parse(JSON.stringify(state.nodes)),
        connections: JSON.parse(JSON.stringify(state.connections))
      })
      state.historyIndex = state.history.length - 1
      // 限制历史记录数量
      if (state.history.length > 50) {
        state.history.shift()
        state.historyIndex--
      }
    }

    function undo() {
      if (state.historyIndex > 0) {
        const h = state.history[state.historyIndex - 1]
        state.historyIndex--
        // 使用 splice 替换，保持响应式
        state.nodes.splice(0, state.nodes.length, ...h.nodes)
        state.connections.splice(0, state.connections.length, ...h.connections)
      }
    }

    function redo() {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++
        const h = state.history[state.historyIndex]
        // 使用 splice 替换，保持响应式
        state.nodes.splice(0, state.nodes.length, ...h.nodes)
        state.connections.splice(0, state.connections.length, ...h.connections)
      }
    }

    const canUndo = computed(() => state.historyIndex > 0)
    const canRedo = computed(() => state.historyIndex < state.history.length - 1)

    // 创建默认 START 节点
    function createDefaultStartNode() {
      return {
        id: `START_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'START',
        label: '开始',
        x: 100,
        y: 200,
        config: {}
      }
    }

    // 监听 initialExpr 变化
    watch(() => props.initialExpr, (val) => {
      if (val) {
        const result = jsonState.parseJsonToCanvas(val)
        state.nodes.splice(0, state.nodes.length, ...(result.nodes || []))
        state.connections.splice(0, state.connections.length, ...(result.connections || []))
        state.selectedNodeId = null
        state.selectedConnectionId = null
        // 重置历史记录并保存初始状态
        state.history = []
        state.historyIndex = -1
        saveHistory()
      } else {
        // 新建规则时，自动添加一个 START 节点
        const startNode = createDefaultStartNode()
        state.nodes.splice(0, state.nodes.length, startNode)
        state.connections.splice(0, state.connections.length)
        state.history = []
        state.historyIndex = -1
        saveHistory()
      }
    }, { immediate: true })

    return {
      // 暴露 state 的属性
      nodes: state.nodes,
      connections: state.connections,
      selectedNodeId: computed(() => state.selectedNodeId),
      selectedConnectionId: computed(() => state.selectedConnectionId),
      zoom: computed(() => state.zoom),
      canvasOffset: computed(() => state.canvasOffset),
      canUndo,
      canRedo,
      // 暴露修改方法 - 使用 splice 替换数组以确保响应式更新
      setNodes: (nodes) => { state.nodes.splice(0, state.nodes.length, ...nodes) },
      setConnections: (conns) => { state.connections.splice(0, state.connections.length, ...conns) },
      setNodesAndSave: (nodes) => { state.nodes.splice(0, state.nodes.length, ...nodes); saveHistory() },
      setConnectionsAndSave: (conns) => { state.connections.splice(0, state.connections.length, ...conns); saveHistory() },
      setSelectedNodeId: (id) => { state.selectedNodeId = id },
      setSelectedConnectionId: (id) => { state.selectedConnectionId = id },
      setZoom: (z) => { state.zoom = z },
      setCanvasOffset: (o) => { state.canvasOffset = o },
      saveHistory,
      undo,
      redo,
      // JSON 方法
      ...jsonState
    }
  },
  data() {
    return {
      showGrid: true,
      templateModalVisible: false,
      importModalVisible: false,
      importJsonContent: '',
      importWarning: '',
      testModalVisible: false,
      availableVariables: [],
      sqlList: [],
      localRuleName: '',
      localPriority: 100,
      localBlockWhenFail: true,
      localStatus: '1',
      saving: false,
      // 拖拽状态
      isDragging: false,
      portDragging: false,
      draggedNodeType: null,
      dragOffset: { x: 0, y: 0 },
      dragStartPos: null, // 记录拖拽开始时的位置
      // 连接状态
      isConnecting: false,
      tempConnection: null,
      connectionSourceNode: null,
      connectionSourcePort: null,
      // 画布拖动状态
      isPanning: false,
      panStart: { x: 0, y: 0 },
      panOffsetStart: { x: 0, y: 0 }
    }
  },
  computed: {
    selectedNode() {
      const nodes = this.nodes || []
      return nodes.find(n => n.id === this.selectedNodeId)
    },
    currentJson() {
      const nodes = this.nodes || []
      const connections = this.connections || []
      const json = this.exportCanvasToJson(nodes, connections)
      return JSON.stringify(json, null, 2)
    },
    canvasExpr() {
      const nodes = this.nodes || []
      const connections = this.connections || []
      const json = this.exportCanvasToJson(nodes, connections)
      return typeof json === 'string' ? json : JSON.stringify(json, null, 2)
    }
  },
  watch: {
    ruleName: {
      immediate: true,
      handler(val) {
        this.localRuleName = val || ''
      }
    },
    priority: {
      immediate: true,
      handler(val) {
        this.localPriority = val || 100
      }
    },
    blockWhenFail: {
      immediate: true,
      handler(val) {
        this.localBlockWhenFail = val || false
      }
    },
    status: {
      immediate: true,
      handler(val) {
        this.localStatus = String(val) || '1'
      }
    }
  },
  mounted() {
    this.loadSqlList()
    document.addEventListener('keydown', this.onKeyDown)
    // 添加滚轮事件监听，使用 passive: false 以允许 preventDefault
    this.$refs.canvasRef.addEventListener('wheel', this.onCanvasWheel, { passive: false })
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.onKeyDown)
    if (this.$refs.canvasRef) {
      this.$refs.canvasRef.removeEventListener('wheel', this.onCanvasWheel)
    }
  },
  methods: {
    initCanvas() {
      this.setNodes([])
      this.setConnections([])
      this.setSelectedNodeId(null)
      this.setSelectedConnectionId(null)
      this.setZoom(1)
    },
    handleUndo() {
      this.undo()
    },
    handleRedo() {
      this.redo()
    },
    async loadSqlList() {
      try {
        const res = await incoRequest('queryList', 'SQL_LIST_FOR_BIND', {})
        if (res && res.list) {
          this.sqlList = res.list
        }
      } catch (error) {
        console.error('加载SQL列表失败', error)
      }
    },
    onDragStart(nodeType) {
      this.draggedNodeType = nodeType
    },
    onDragOver(e) {
      e.dataTransfer.dropEffect = 'copy'
    },
    onDrop(e) {
      const nodeType = e.dataTransfer.getData('text/plain')
      if (!nodeType) {
        if (!this.draggedNodeType) return
      }
      const finalType = nodeType || this.draggedNodeType

      const canvasRect = this.$refs.canvasRef.getBoundingClientRect()
      const x = (e.clientX - canvasRect.left) / this.zoom - 75
      const y = (e.clientY - canvasRect.top) / this.zoom - 30

      const newNode = this.createNode(finalType, x, y)
      this.nodes.push(newNode)
      this.setSelectedNodeId(newNode.id)
      this.draggedNodeType = null
      this.saveHistory()
    },
    onNodePanelClick(nodeType) {
      const newNode = this.createNode(nodeType, 300, 200)
      this.nodes.push(newNode)
      this.setSelectedNodeId(newNode.id)
      this.saveHistory()
    },
    createNode(type, x, y) {
      const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const labelMap = {
        'START': '开始',
        'END_PASS': '通过',
        'END_FAIL': '失败',
        'SQL_QUERY': 'SQL查询',
        'BEAN_CALL': 'Bean调用',
        'AND': 'AND条件',
        'OR': 'OR条件',
        'EXPR': '表达式',
        'SWITCH': '开关判断',
        'TIME_RANGE': '时间范围',
        'SET_FIELD': '设置字段',
        'CALL_SQLID': '调用SQL',
        'CALL_BEAN': '调用Bean',
        'LOG': '记录日志',
        'SEND_MSG': '发送消息',
        'RULE_CHAIN': '规则链',
        'PRE_EXEC': '预执行'
      }

      return {
        id,
        type,
        label: labelMap[type] || type,
        x,
        y,
        config: this.getDefaultConfig(type)
      }
    },
    getDefaultConfig(type) {
      const configMap = {
        'SQL_QUERY': { id: '', sqlId: '', params: {} },
        'BEAN_CALL': { id: '', beanClass: '', beanMethod: '', params: {} },
        'EXPR': { expression: '', left: {}, operator: '==', right: {} },
        'AND': { conditions: [] },
        'OR': { conditions: [] },
        'SWITCH': { switchKey: '', switchValue: 'ON' },
        'TIME_RANGE': { startField: '', endField: '' },
        'RULE_CHAIN': { chainRules: [], stopOnFail: true },
        'END_FAIL': { block: true, message: '', errorCode: '' }
      }
      return configMap[type] || {}
    },
    // 画布拖动开始
    onCanvasMouseDown(e) {
      // 左键拖动画布（不需要Ctrl键，但节点上的点击会通过 .stop 阻止冒泡）
      if (e.button === 0) {
        // 只有当没有在拖拽节点时才能拖动画布
        if (!this.isDragging && !this.portDragging) {
          e.preventDefault()
          this.isPanning = true
          this.panStart = { x: e.clientX, y: e.clientY }
          this.panOffsetStart = { x: this.canvasOffset.x, y: this.canvasOffset.y }
        }
      }
    },
    // 画布拖动移动
    onCanvasMouseMove(e) {
      if (this.isPanning) {
        const dx = e.clientX - this.panStart.x
        const dy = e.clientY - this.panStart.y
        this.setCanvasOffset({
          x: this.panOffsetStart.x + dx,
          y: this.panOffsetStart.y + dy
        })
      }
    },
    // 鼠标滚轮缩放
    onCanvasWheel(e) {
      // 直接使用滚轮缩放，不需要Ctrl键
      e.preventDefault()
      e.stopPropagation()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const newZoom = Math.min(Math.max(this.zoom + delta, 0.3), 3)
      this.setZoom(newZoom)
    },
    onCanvasClick() {
      this.setSelectedNodeId(null)
      this.setSelectedConnectionId(null)
    },
    onNodeClick(node) {
      this.setSelectedNodeId(node.id)
      this.setSelectedConnectionId(null)
    },
    onNodeDoubleClick(node) {
      this.setSelectedNodeId(node.id)
    },
    onNodeMouseDown(e, node) {
      // 只有在没有从端口开始拖动时才设置为true
      if (!this.portDragging) {
        this.isDragging = true
        // 记录拖拽开始时的位置
        this.dragStartPos = { x: node.x, y: node.y }
      }
      this.setSelectedNodeId(node.id)
      const rect = e.target.closest('.canvas-node').getBoundingClientRect()
      this.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      document.addEventListener('mousemove', this.onMouseMove)
      document.addEventListener('mouseup', this.onMouseUp)
    },
    onMouseMove(e) {
      // 处理节点拖拽
      const selectedId = this.selectedNodeId?.value ?? this.selectedNodeId
      if (this.isDragging && selectedId) {
        const canvasRect = this.$refs.canvasRef.getBoundingClientRect()
        const index = this.nodes.findIndex(n => n.id === selectedId)
        if (index > -1) {
          const node = this.nodes[index]
          const newX = (e.clientX - canvasRect.left - this.canvasOffset.x) / this.zoom - this.dragOffset.x
          const newY = (e.clientY - canvasRect.top - this.canvasOffset.y) / this.zoom - this.dragOffset.y
          // 使用 splice 替换整个节点对象以确保响应式更新
          this.nodes.splice(index, 1, { ...node, x: newX, y: newY })
        }
      }
      // 处理连接线拖拽 - 更新临时连接线的目标位置
      if (this.isConnecting && this.tempConnection) {
        const canvasRect = this.$refs.canvasRef.getBoundingClientRect()
        const targetX = (e.clientX - canvasRect.left - this.canvasOffset.x) / this.zoom
        const targetY = (e.clientY - canvasRect.top - this.canvasOffset.y) / this.zoom
        // 临时连接线的目标位置用于UI显示
        this.tempConnection._mouseX = targetX
        this.tempConnection._mouseY = targetY
      }
    },
    onMouseUp() {
      // 保存历史记录（只在位置有变化时）
      if (this.isDragging && this.dragStartPos) {
        const selectedId = this.selectedNodeId?.value ?? this.selectedNodeId
        const node = this.nodes.find(n => n.id === selectedId)
        if (node) {
          const hasMoved = node.x !== this.dragStartPos.x || node.y !== this.dragStartPos.y
          if (hasMoved) {
            this.saveHistory()
          }
        }
        this.isDragging = false
        this.dragStartPos = null
      }
      // 如果正在连接但没有在有效目标节点上释放，则取消连接
      if (this.isConnecting && !this.tempConnection?.targetNodeId) {
        this.resetConnection()
      }
      document.removeEventListener('mousemove', this.onMouseMove)
      document.removeEventListener('mouseup', this.onMouseUp)
    },
    onNodeMouseUp(e, node) {
      // 处理连接线创建
      if (this.isConnecting && this.tempConnection) {
        // 检查连接是否有效
        const validation = this.validateConnection(this.tempConnection, node)
        if (!validation.valid) {
          this.$Message.warning(validation.message)
          this.resetConnection()
          document.removeEventListener('mousemove', this.onMouseMove)
          document.removeEventListener('mouseup', this.onMouseUp)
          return
        }

        this.tempConnection.targetNodeId = node.id
        this.tempConnection.targetPort = 'input'
        const newConnection = { ...this.tempConnection }
        this.connections.push(newConnection)
        this.resetConnection()
        this.saveHistory()
      }
      // 处理节点拖拽 - 只有位置有变化时才保存历史
      if (this.isDragging && this.dragStartPos) {
        const hasMoved = node.x !== this.dragStartPos.x || node.y !== this.dragStartPos.y
        if (hasMoved) {
          this.saveHistory()
        }
        this.isDragging = false
        this.dragStartPos = null
      }
      document.removeEventListener('mousemove', this.onMouseMove)
      document.removeEventListener('mouseup', this.onMouseUp)
    },
    onCanvasMouseUp(e) {
      // 结束画布拖动
      if (this.isPanning) {
        this.isPanning = false
      }
      if (this.isConnecting) {
        this.resetConnection()
      }
      // 处理节点拖拽 - 只有位置有变化时才保存历史
      if (this.isDragging && this.dragStartPos) {
        const selectedId = this.selectedNodeId?.value ?? this.selectedNodeId
        const node = this.nodes.find(n => n.id === selectedId)
        if (node) {
          const hasMoved = node.x !== this.dragStartPos.x || node.y !== this.dragStartPos.y
          if (hasMoved) {
            this.saveHistory()
          }
        }
        this.isDragging = false
        this.dragStartPos = null
      }
      document.removeEventListener('mousemove', this.onMouseMove)
      document.removeEventListener('mouseup', this.onMouseUp)
    },
    resetConnection() {
      this.isConnecting = false
      this.portDragging = false
      this.tempConnection = null
      this.connectionSourceNode = null
      this.connectionSourcePort = null
      this.dragStartPos = null
    },
    onPortMouseDown(params) {
      this.portDragging = true
      this.isDragging = false
      this.isConnecting = true
      this.connectionSourceNode = params.nodeId
      this.connectionSourcePort = params.port
      this.tempConnection = {
        id: `temp_${Date.now()}`,
        sourceNodeId: params.nodeId,
        sourcePort: params.port,
        targetNodeId: null,
        targetPort: 'input'
      }
      // 注册鼠标移动监听以更新临时连接线
      document.addEventListener('mousemove', this.onMouseMove)
      document.addEventListener('mouseup', this.onMouseUp)
    },
    onConnectionClick(connId) {
      this.setSelectedConnectionId(connId)
      this.setSelectedNodeId(null)
    },
    onNodeUpdate(updatedNode) {
      const index = this.nodes.findIndex(n => n.id === updatedNode.id)
      if (index > -1) {
        // 使用 splice 触发 Vue 响应式更新
        this.nodes.splice(index, 1, { ...updatedNode })
        this.saveHistory()
        this.updateAvailableVariables()
      }
    },
    onNodeDelete(nodeId) {
      // 检查是否是开始节点，开始节点不允许删除
      const nodeToDelete = this.nodes.find(n => n.id === nodeId)
      if (nodeToDelete && nodeToDelete.type === 'START') {
        this.$Message.warning('开始节点不能删除')
        return
      }
      // 创建新的数组并设置
      const newNodes = this.nodes.filter(n => n.id !== nodeId)
      const newConnections = this.connections.filter(
        c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
      )
      this.setNodes(newNodes)
      this.setConnections(newConnections)
      this.setSelectedNodeId(null)
      this.saveHistory()
    },
    updateAvailableVariables() {
      this.availableVariables = []
      this.nodes.forEach(node => {
        if (node.type === 'SQL_QUERY' || node.type === 'BEAN_CALL') {
          this.availableVariables.push({
            id: node.config.id,
            type: node.type
          })
        }
      })
    },
    handleZoomIn() {
      this.setZoom(Math.min(this.zoom + 0.1, 2))
    },
    handleZoomOut() {
      this.setZoom(Math.max(this.zoom - 0.1, 0.5))
    },
    handleZoomReset() {
      // 计算所有节点的边界框
      const nodes = this.nodes || []
      if (nodes.length === 0) {
        this.setZoom(1)
        this.setCanvasOffset({ x: 0, y: 0 })
        return
      }

      const padding = 50
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

      nodes.forEach(node => {
        minX = Math.min(minX, node.x)
        minY = Math.min(minY, node.y)
        maxX = Math.max(maxX, node.x + 150) // 节点宽度
        maxY = Math.max(maxY, node.y + 60)  // 节点高度
      })

      const contentWidth = maxX - minX + padding * 2
      const contentHeight = maxY - minY + padding * 2

      const canvasRect = this.$refs.canvasRef.getBoundingClientRect()
      const scaleX = canvasRect.width / contentWidth
      const scaleY = canvasRect.height / contentHeight
      const scale = Math.min(scaleX, scaleY, 1) // 最大缩放为1

      const newZoom = Math.max(scale, 0.5) // 最小缩放为0.5
      this.setZoom(newZoom)

      // 调整画布偏移，使节点居中
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2
      this.setCanvasOffset({
        x: canvasRect.width / 2 - centerX * newZoom,
        y: canvasRect.height / 2 - centerY * newZoom
      })
    },
    handleToggleGrid() {
      this.showGrid = !this.showGrid
    },
    handleTemplate() {
      this.templateModalVisible = true
    },
    onTemplateSelect(template) {
      this.templateModalVisible = false
      this.applyTemplate(template)
    },
    applyTemplate(template) {
      // 应用模板到画布
      if (!template) {
        console.log('应用模板无效')
        return
      }
      const { nodes, connections } = templateToCanvas(template)
      // 使用 splice 替换数组内容，保持响应式
      this.nodes.splice(0, this.nodes.length, ...nodes)
      this.connections.splice(0, this.connections.length, ...connections)
      this.setSelectedNodeId(null)
      this.saveHistory()
    },
    handleImportJson() {
      this.importJsonContent = ''
      this.importWarning = ''
      this.importModalVisible = true
    },
    confirmImportJson() {
      try {
        JSON.parse(this.importJsonContent)
        this.importWarning = ''
        const result = this.parseJsonToCanvas(this.importJsonContent)
        const newNodes = result.nodes || []
        const newConnections = result.connections || []
        // 使用 splice 替换数组内容，保持响应式
        this.nodes.splice(0, this.nodes.length, ...newNodes)
        this.connections.splice(0, this.connections.length, ...newConnections)
        this.updateAvailableVariables()
        this.saveHistory()
        this.importModalVisible = false
        this.$Message.success('导入成功')
      } catch (error) {
        this.importWarning = 'JSON格式错误：' + error.message
      }
    },
    handleExportJson() {
      const nodes = this.nodes || []
      const connections = this.connections || []
      const json = this.exportCanvasToJson(nodes, connections)
      const jsonStr = typeof json === 'string' ? json : JSON.stringify(json, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rule_${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    },
    handleTest() {
      this.testModalVisible = true
    },
    handleSave() {
      if (!this.localRuleName || this.localRuleName.trim() === '') {
        this.$Message.warning('请输入规则名称')
        return
      }
      const nodes = this.nodes || []
      const connections = this.connections || []

      // 校验规则
      const validation = this.validateCanvas(nodes, connections)
      if (!validation.valid) {
        this.$Message.warning(validation.message)
        return
      }
      // 显示警告信息
      if (validation.warning) {
        this.$Message.warning(validation.warning)
        return
      }

      // 显示保存中状态
      this.saving = true

      const json = this.exportCanvasToJson(nodes, connections)
      const ruleExpr = typeof json === 'string' ? json : JSON.stringify(json, null, 2)
      this.$emit('save', {
        id: this.ruleId || '',
        rule_name: this.localRuleName,
        rule_expr: ruleExpr,
        priority: this.localPriority,
        block_when_fail: this.localBlockWhenFail ? '1' : '0',
        status: this.localStatus
      })

      // 延迟隐藏加载状态，防止短暂闪烁
      setTimeout(() => {
        this.saving = false
      }, 500)
    },
    // 验证连接是否有效
    validateConnection(tempConnection, targetNode) {
      const sourceNodeId = tempConnection.sourceNodeId
      const sourcePort = tempConnection.sourcePort
      const sourceNode = this.nodes.find(n => n.id === sourceNodeId)

      if (!sourceNode) {
        return { valid: false, message: '未找到源节点' }
      }

      // 如果目标是 END_FAIL 节点
      if (targetNode.type === 'END_FAIL') {
        // 只有具有失败状态的节点才能连接到 END_FAIL 的 fail 端口
        const nodesWithFailState = ['EXPR', 'AND', 'OR']
        if (!nodesWithFailState.includes(sourceNode.type)) {
          return {
            valid: false,
            message: `"${sourceNode.label || sourceNode.type}" 节点没有失败状态，无法连接到失败节点`
          }
        }
        // 当连接到 END_FAIL 的 input 端口时，实际上是表示失败路径
        // 这里主要是检查源节点是否有失败状态
      }

      // 如果目标是 END_PASS 节点
      if (targetNode.type === 'END_PASS') {
        // 大多数节点都可以连接到通过节点，表示成功路径
        // 但源节点至少应该有某种输出状态
        const nodesWithOutput = ['START', 'SQL_QUERY', 'BEAN_CALL', 'SET_FIELD', 'LOG', 'CALL_SQLID', 'CALL_BEAN', 'CALL_RULE', 'EXPR', 'AND', 'OR']
        if (!nodesWithOutput.includes(sourceNode.type)) {
          return {
            valid: false,
            message: `"${sourceNode.label || sourceNode.type}" 节点无法连接到通过节点`
          }
        }
      }

      return { valid: true }
    },
    validateCanvas(nodes, connections) {
      // 检查是否有 START 节点
      const startNodes = nodes.filter(n => n.type === 'START')
      if (startNodes.length === 0) {
        return { valid: false, message: '规则必须包含开始节点' }
      }
      if (startNodes.length > 1) {
        return { valid: false, message: '规则只能有一个开始节点，当前有 ' + startNodes.length + ' 个' }
      }

      // 检查是否有 END_PASS 和 END_FAIL 节点
      const endPassNodes = nodes.filter(n => n.type === 'END_PASS')
      const endFailNodes = nodes.filter(n => n.type === 'END_FAIL')
      if (endPassNodes.length === 0 && endFailNodes.length === 0) {
        return { valid: false, message: '规则必须包含通过节点（END_PASS）或失败节点（END_FAIL）' }
      }

      // 检查孤立节点（没有被任何连接引用的节点，除了 START）
      const connectedNodeIds = new Set()
      connections.forEach(conn => {
        connectedNodeIds.add(conn.sourceNodeId)
        connectedNodeIds.add(conn.targetNodeId)
      })
      const isolatedNodes = nodes.filter(n => n.type !== 'START' && !connectedNodeIds.has(n.id))
      if (isolatedNodes.length > 0) {
        return {
          valid: false,
          message: '以下节点没有连接，可能不会被执行：' + isolatedNodes.map(n => n.label || n.type).join(', ')
        }
      }

      return { valid: true }
    },
    onKeyDown(e) {
      // Ctrl+Z 撤销
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        this.undo()
        return
      }
      // Ctrl+Y 或 Ctrl+Shift+Z 重做
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault()
        this.redo()
        return
      }
      // 如果用户正在输入框中，不处理删除键
      const target = e.target
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      if (e.key === 'Delete') {
        const selectedId = this.selectedNodeId?.value ?? this.selectedNodeId
        const selectedConnId = this.selectedConnectionId?.value ?? this.selectedConnectionId
        if (selectedId) {
          this.onNodeDelete(selectedId)
        } else if (selectedConnId) {
          this.setConnections(this.connections.filter(c => c.id !== selectedConnId))
          this.setSelectedConnectionId(null)
          this.saveHistory()
        }
      }
    }
  }
}
</script>

<style lang="less" scoped>
.rule-canvas-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  background: #1e1e1e;
  border-radius: 4px;
  overflow: hidden;

  .canvas-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: #2d2d2d;
    border-bottom: 1px solid #404040;

    .toolbar-left,
    .toolbar-right {
      display: flex;
      gap: 4px;
      align-items: center;
      flex-wrap: wrap;
    }

    .toolbar-divider {
      width: 1px;
      height: 20px;
      background: #404040;
      margin: 0 8px;
    }

    .rule-props {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  }

  .canvas-main {
    display: flex;
    flex: 1;
    overflow: hidden;

    .canvas-area {
      flex: 1;
      position: relative;
      overflow: hidden;
      background: #1e1e1e;

      &.canvas-panning {
        cursor: grabbing;
      }

      &.grid-visible {
        background-image:
          linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        background-size: 20px 20px;
      }

      .canvas-content {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      .canvas-node {
        position: absolute;
        cursor: move;
        user-select: none;
        z-index: 2;
      }
    }
  }

  .canvas-status {
    display: flex;
    gap: 16px;
    padding: 8px 16px;
    background: #2d2d2d;
    border-top: 1px solid #404040;
    font-size: 12px;
    color: #888;
  }

  .saving-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    color: #fff;
  }
}

.import-content {
  padding: 8px 0;
}

// 深色主题 - 只在画布工具栏区域内覆盖 iView 组件默认样式
.canvas-toolbar {
  ::v-deep {
    .ivu-input {
      background-color: #3a3a3a !important;
      border-color: #555 !important;
      color: #e0e0e0 !important;

      &::placeholder {
        color: #888 !important;
      }

      &:focus {
        border-color: #57a3f3 !important;
      }
    }

    .ivu-input-number {
      background-color: #3a3a3a !important;
      border-color: #555 !important;
      color: #e0e0e0 !important;

      &-input {
        background-color: transparent !important;
        color: #e0e0e0 !important;
      }
    }

    .ivu-select {
      background-color: #3a3a3a !important;

      &-selection {
        background-color: #3a3a3a !important;
        border-color: #555 !important;
        color: #e0e0e0 !important;
      }

      &-dropdown {
        background-color: #2d2d2d !important;

        .ivu-select-item {
          color: #e0e0e0 !important;

          &:hover {
            background-color: #3a3a3a !important;
          }

          &.ivu-select-item-selected {
            background-color: #57a3f3 !important;
            color: #fff !important;
          }
        }
      }
    }

    .ivu-checkbox-wrapper {
      color: #e0e0e0 !important;

      .ivu-checkbox {
        &-inner {
          background-color: #3a3a3a !important;
          border-color: #555 !important;
        }
      }
    }

    .ivu-btn {
      background-color: #3a3a3a !important;
      border-color: #555 !important;
      color: #e0e0e0 !important;

      &:hover {
        background-color: #4a4a4a !important;
        border-color: #57a3f3 !important;
        color: #57a3f3 !important;
      }

      &-primary {
        background-color: #57a3f3 !important;
        border-color: #57a3f3 !important;
        color: #fff !important;

        &:hover {
          background-color: #6cb3f7 !important;
          border-color: #6cb3f7 !important;
        }
      }

      &-default {
        background-color: #3a3a3a !important;
        border-color: #555 !important;
        color: #e0e0e0 !important;
      }
    }

    .prop-label {
      font-size: 12px;
      color: #e0e0e0 !important;
      font-weight: 500;
    }
  }
}
</style>
