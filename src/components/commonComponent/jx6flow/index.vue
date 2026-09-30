<template>
  <div class="jx6flow-container" :style="{ border: '1px solid #dfe3e8' }">
<!--    <Button @click="test">test flow</Button>-->
    <div class="jx6flow-wrapper" :style="wrapperStyle">
      <!-- 左侧：Stencil 节点面板 -->
      <div v-show="opentype!='show'" ref="stencilContainer" class="jx6flow-stencil"></div>

      <!-- 中间：X6 画布 -->
      <div ref="container" class="jx6flow-canvas"></div>

      <!-- 右侧：属性编辑面板 -->
      <div v-if="opentype!='show' && (selectedNode|| selectedEdgeId)" class="jx6flow-props">
        <!-- 节点属性编辑 -->
        <div v-if="editingNode" class="props-content">
          <div class="props-header">
            <h4>节点属性</h4>
            <div class="props-close" @click="closePropsPanel">
              <Icon type="ios-close" size="20" />
            </div>
          </div>
          <Form :label-width="80">
            <FormItem label="节点ID">
              <Input v-model="editingNode.id" disabled size="small" />
            </FormItem>
            <FormItem label="节点标签">
              <Input v-model="editingNode.label" size="small" placeholder="输入节点标签" />
            </FormItem>
            <FormItem label="位置 X">
              <InputNumber v-model="editingNode.x" size="small" style="width: 100%;" />
            </FormItem>
            <FormItem label="位置 Y">
              <InputNumber v-model="editingNode.y" size="small" style="width: 100%;" />
            </FormItem>
          </Form>
          <div class="props-footer">
            <Button type="primary" size="small" @click="handleSaveNode" long>
              <Icon type="ios-save-outline" />保存修改
            </Button>
            <Button type="error" size="small" @click="handleDeleteNode" class="ivu-mt-8" long>
              <Icon type="ios-trash-outline" />删除节点
            </Button>
          </div>
        </div>

        <!-- 连线信息显示 -->
        <div v-else-if="selectedEdgeId" class="props-content">
          <div class="props-header">
            <h4>连线信息</h4>
            <div class="props-close" @click="closePropsPanel">
              <Icon type="ios-close" size="20" />
            </div>
          </div>
          <Form :label-width="80">
            <FormItem label="连线ID123">
              <Input :model-value="edgeInfoCache.id" disabled size="small" />
            </FormItem>
            <FormItem label="源节点">
              <Input :model-value="edgeInfoCache.source" disabled size="small" />
            </FormItem>
            <FormItem label="目标节点">
              <Input :model-value="edgeInfoCache.target" disabled size="small" />
            </FormItem>
          </Form>
          <div class="props-footer">
            <Button type="error" size="small" @click="handleDeleteEdge" long>
              <Icon type="ios-trash-outline" />删除连线
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部拖动条 -->
    <div v-if = "opentype!='show'"
      class="jx6flow-resize-handle"
      @mousedown="startResize"
      :class="{ resizing: isResizing }"
    >
      <div class="resize-icon">
        <Icon type="ios-menu" size="14" />
      </div>
    </div>
  </div>
</template>

<script>
import { Graph, Shape, Stencil, Selection, Snapline, Keyboard, Clipboard, Transform } from '@antv/x6'

export default {
  name: 'JX6Flow',
  props: {
    modelValue: { type: [Object, String], default: () => '{"nodes":[],"edges":[]}' },
    readonly: { type: Boolean, default: false },
    height: { type: [Number, String], default: 500 },
    opentype:{type:String,default:'show'}
  },
  emits: ['update:modelValue', 'change', 'update:height'],
  data() {
    return {
      graph: null,
      stencil: null,
      currentHeight: null,
      canvasData: { cells: [] },  // 存放画布数据
      selectedNode: null,   // 当前选中的节点
      selectedEdgeId: null,   // 当前选中的连线ID（Vue 2 无法可靠追踪 X6 Edge 对象）
      editingNode: null,    // 正在编辑的节点数据
      lastSelectedEdge: null, // 上次选中的连线（用于样式恢复）
      isResizing: false, // 是否正在调整高度
      edgeInfoCache: {} // 缓存连线信息
    }
  },
  computed: {
    wrapperStyle() {
      const h = this.currentHeight || this.height
      const px = typeof h === 'number' ? h + 'px' : h
      return {
        height: px,
        minHeight: '300px' // 确保最小高度
      }
    }
  },
  watch: {
    // 监听父组件传入的数据
    modelValue: {
      handler(val) {
        const incoming = typeof val === 'string' ? JSON.parse(val) : val
        if (!incoming) return

        // 加载画布数据
        if (incoming.cells) {
          const currentStr = JSON.stringify(this.canvasData)
          const incomingCellsStr = JSON.stringify({ cells: incoming.cells })

          if (currentStr !== incomingCellsStr) {
            this.canvasData = { cells: incoming.cells }
            if (this.graph) {
              this.graph.fromJSON({ cells: incoming.cells })
            }
          }
        }

        // 加载高度（向后兼容：如果没有height字段，使用默认值）
        if (incoming.height) {
          this.currentHeight = incoming.height
        }
      },
      immediate: true
    },

    // 监听画布数据变化，同步给父组件
    canvasData: {
      handler(val, oldVal) {
        const valStr = JSON.stringify(val)
        const oldStr = JSON.stringify(oldVal || { cells: [] })

        if (valStr !== oldStr) {
          // 将高度信息包含在数据中
          const data = {
            cells: val.cells || [],
            height: this.currentHeight || this.height
          }
          this.$emit('update:modelValue', JSON.stringify(data))
          this.$emit('change', data)
        }
      },
      deep: true
    },

    // 监听高度变化，同步给父组件
    currentHeight(val) {
      if (val && val !== this.height) {
        // 高度变化时，触发 canvasData 更新（会自动 emit）
        const data = {
          cells: this.canvasData.cells || [],
          height: val
        }
        this.$emit('update:modelValue', JSON.stringify(data))
        this.$emit('change', data)
      }
    }
  },
  mounted() {
    this.init()
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('mousemove', this.onResizeMove)
    document.addEventListener('mouseup', this.onResizeEnd)
  },
  beforeUnmount() {
    // 清理防抖定时器
    if (this._changeTimer) {
      clearTimeout(this._changeTimer)
    }

    // 移除事件监听
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('mousemove', this.onResizeMove)
    document.removeEventListener('mouseup', this.onResizeEnd)

    if (this.graph) {
      this.graph.dispose()
    }
  },
  methods: {
    test() {
      console.log(this.edgeInfoCache,'this.edgeInfoCache')
      console.log(this.opentype,'this.opentype')
      console.log(this.selectedNode,'this.selectedNode')
    },
    init() {
      // #region 初始化画布 - 官方配置
      const graph = new Graph({
        container: this.$refs.container,
        grid: true,
        panning: {
          enabled: true,  // 启用画布平移
          modifiers: [],  // 不需要按任何键，直接拖动
        },
        mousewheel: {
          enabled: true,
          zoomAtMousePosition: true,
          modifiers: 'ctrl',
          minScale: 0.5,
          maxScale: 3,
        },
        connecting: {
          router: {
            name: 'manhattan',
            args: {
              padding: 1,
            },
          },
          connector: {
            name: 'rounded',
            args: {
              radius: 8,
            },
          },
          anchor: 'center',
          connectionPoint: 'anchor',
          allowBlank: false,
          snap: {
            radius: 20,
          },
          createEdge() {
            return new Shape.Edge({
              attrs: {
                line: {
                  stroke: '#A2B1C3',
                  strokeWidth: 2,
                  targetMarker: {
                    name: 'block',
                    width: 12,
                    height: 8,
                  },
                },
              },
              zIndex: 0,
              interactable: true, // 允许连线可交互（点击、选中）
              vertexAtVirtualPoint: true, // 在虚拟点上也可以点击，增加水平连线点击灵敏度
            })
          },
          validateConnection({ targetMagnet }) {
            return !!targetMagnet
          },
        },
        highlighting: {
          magnetAdsorbed: {
            name: 'stroke',
            args: {
              attrs: {
                fill: '#5F95FF',
                stroke: '#5F95FF',
              },
            },
          },
        },
      })

      graph.use(new Selection({
        enabled: true,
        rubberband: false, // 禁用框选功能，避免拖动画布时出现选择框
        showNodeSelectionBox: true,
        showEdgeSelectionBox: false, // 连线不显示选中框，只改变样式
      }))
      graph.use(new Snapline({ enabled: true }))
      graph.use(new Keyboard({ enabled: true }))
      graph.use(new Clipboard({ enabled: true }))
      graph.use(new Transform({ resizing: true, rotating: true }))
      // #endregion

      // #region 初始化 stencil - 官方配置
      const stencil = new Stencil({
        title: '流程图',
        target: graph,
        stencilGraphWidth: 200,
        stencilGraphHeight: 180,
        collapsable: true,
        groups: [
          {
            title: '基础流程图',
            name: 'group1',
          },
        ],
        layoutOptions: {
          columns: 2,
          columnWidth: 80,
          rowHeight: 55,
        },
      })
      this.$refs.stencilContainer.appendChild(stencil.container)
      // #endregion

      // #region 控制连接桩显示/隐藏 - 官方方式
      const showPorts = (ports, show) => {
        for (let i = 0, len = ports.length; i < len; i = i + 1) {
          ports[i].style.visibility = show ? 'visible' : 'hidden'
        }
      }
      graph.on('node:mouseenter', () => {
        const ports = this.$refs.container.querySelectorAll('.x6-port-body')
        showPorts(ports, true)
      })
      graph.on('node:mouseleave', () => {
        const ports = this.$refs.container.querySelectorAll('.x6-port-body')
        showPorts(ports, false)
      })
      // #endregion

      // #region 初始化图形 - 官方节点注册
      const ports = {
        groups: {
          top: {
            position: 'top',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#5F95FF',
                strokeWidth: 1,
                fill: '#fff',
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
          right: {
            position: 'right',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#5F95FF',
                strokeWidth: 1,
                fill: '#fff',
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
          bottom: {
            position: 'bottom',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#5F95FF',
                strokeWidth: 1,
                fill: '#fff',
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
          left: {
            position: 'left',
            attrs: {
              circle: {
                r: 4,
                magnet: true,
                stroke: '#5F95FF',
                strokeWidth: 1,
                fill: '#fff',
                style: {
                  visibility: 'hidden',
                },
              },
            },
          },
        },
        items: [
          {
            group: 'top',
          },
          {
            group: 'right',
          },
          {
            group: 'bottom',
          },
          {
            group: 'left',
          },
        ],
      }

      Graph.registerNode(
        'custom-rect',
        {
          inherit: 'rect',
          width: 66,
          height: 36,
          attrs: {
            body: {
              strokeWidth: 1,
              stroke: '#5F95FF',
              fill: '#EFF4FF',
            },
            text: {
              fontSize: 12,
              fill: '#262626',
            },
          },
          ports: { ...ports },
        },
        true,
      )

      Graph.registerNode(
        'custom-polygon',
        {
          inherit: 'polygon',
          width: 66,
          height: 36,
          attrs: {
            body: {
              strokeWidth: 1,
              stroke: '#5F95FF',
              fill: '#EFF4FF',
            },
            text: {
              fontSize: 12,
              fill: '#262626',
            },
          },
          ports: {
            ...ports,
            items: [
              {
                group: 'top',
              },
              {
                group: 'bottom',
              },
            ],
          },
        },
        true,
      )

      Graph.registerNode(
        'custom-circle',
        {
          inherit: 'circle',
          width: 45,
          height: 45,
          attrs: {
            body: {
              strokeWidth: 1,
              stroke: '#5F95FF',
              fill: '#EFF4FF',
            },
            text: {
              fontSize: 12,
              fill: '#262626',
            },
          },
          ports: { ...ports },
        },
        true,
      )

      const r1 = graph.createNode({
        shape: 'custom-rect',
        label: '开始',
        attrs: {
          body: {
            rx: 20,
            ry: 26,
          },
        },
      })
      const r2 = graph.createNode({
        shape: 'custom-rect',
        label: '过程',
      })
      const r3 = graph.createNode({
        shape: 'custom-rect',
        attrs: {
          body: {
            rx: 6,
            ry: 6,
          },
        },
        label: '可选过程',
      })
      const r4 = graph.createNode({
        shape: 'custom-polygon',
        attrs: {
          body: {
            refPoints: '0,10 10,0 20,10 10,20',
          },
        },
        label: '决策',
      })
      const r5 = graph.createNode({
        shape: 'custom-polygon',
        attrs: {
          body: {
            refPoints: '10,0 40,0 30,20 0,20',
          },
        },
        label: '数据',
      })
      const r6 = graph.createNode({
        shape: 'custom-circle',
        label: '连接',
      })
      stencil.load([r1, r2, r3, r4, r5, r6], 'group1')

      // 监听 Graph 变化事件，更新 canvasData
      this._changeTimer = null
      this._isLoading = false // 加载标志

      const onDataChange = () => {
        if (this._isLoading) return
        if (!this.graph) return

        const json = this.graph.toJSON()

        // 过滤掉无效连线（target 是坐标而不是节点的）
        json.cells = json.cells.filter(cell => {
          if (cell.shape === 'edge') {
            const isValid = cell.target && typeof cell.target === 'object' && cell.target.cell
            return isValid
          }
          return true
        })

        this.canvasData = json
      }

      const debouncedOnChange = () => {
        if (this._changeTimer) clearTimeout(this._changeTimer)
        this._changeTimer = setTimeout(() => {
          onDataChange()
          this._changeTimer = null
        }, 100)
      }

      // Stencil 的 drop 事件（拖拽节点进画布时触发）
      stencil.on('node:drop', (e) => {
        onDataChange()
      })

      // 监听节点添加
      graph.on('node:added', (e) => {
        onDataChange()
      })

      // 使用防抖监听位置变化
      graph.on('node:change:position', debouncedOnChange)
      // 监听节点删除
      graph.on('node:removed', onDataChange)
      // 监听连线连接完成（而不是 edge:added）
      graph.on('edge:connected', (e) => {
        onDataChange()
      })
      // 监听连线删除
      graph.on('edge:removed', onDataChange)

      this.graph = graph
      this.stencil = stencil

      // #region 添加节点和连线点击事件监听
      graph.on('node:click', ({ node }) => {
        // 如果之前有选中的连线，恢复其样式
        if (this.lastSelectedEdge) {
          this.lastSelectedEdge.attr('line/stroke', '#A2B1C3')
          this.lastSelectedEdge.attr('line/strokeWidth', 2)
          this.lastSelectedEdge = null
        }

        this.selectedNode = node
        this.selectedEdgeId = null
        this.editingNode = {
          id: node.id,
          label: node.attr('text/text') || '',
          x: node.position().x,
          y: node.position().y
        }
        this.edgeInfoCache = null
      })

      graph.on('edge:click', ({ edge }) => {
        // 恢复之前选中的连线样式
        if (this.lastSelectedEdge && this.lastSelectedEdge !== edge) {
          this.lastSelectedEdge.attr('line/stroke', '#A2B1C3')
          this.lastSelectedEdge.attr('line/strokeWidth', 2)
        }

        // 设置当前选中的连线样式
        edge.attr('line/stroke', '#1890ff')
        edge.attr('line/strokeWidth', 3)

        this.lastSelectedEdge = edge

        // 直接计算并缓存连线信息
        try {
          const sourceCell = edge.getSourceCell()
          const targetCell = edge.getTargetCell()

          this.edgeInfoCache = {
            id: edge.id || '未知',
            source: sourceCell ? (sourceCell.attr('text/text') || sourceCell.id) : '未知',
            target: targetCell ? (targetCell.attr('text/text') || targetCell.id) : '未知'
          }
        } catch (error) {
          console.error('获取连线信息失败:', error)
          this.edgeInfoCache = {
            id: '错误',
            source: '错误',
            target: '错误'
          }
        }

        this.selectedEdgeId = edge.id
        this.selectedNode = null
        this.editingNode = null
      })

      graph.on('blank:click', () => {
        // 恢复之前选中的连线样式
        if (this.lastSelectedEdge) {
          this.lastSelectedEdge.attr('line/stroke', '#A2B1C3')
          this.lastSelectedEdge.attr('line/strokeWidth', 2)
          this.lastSelectedEdge = null
        }

        this.selectedNode = null
        this.selectedEdgeId = null
        this.editingNode = null
        this.edgeInfoCache = null
      })
      // #endregion

      // 初始化时加载 canvasData
      if (this.canvasData && this.canvasData.cells && this.canvasData.cells.length > 0) {
        this._isLoading = true
        // 对 cells 排序：节点在前，连线在后
        const sortedCells = [...this.canvasData.cells].sort((a, b) => {
          const aIsNode = a.shape !== 'edge'
          const bIsNode = b.shape !== 'edge'
          if (aIsNode && !bIsNode) return -1
          if (!aIsNode && bIsNode) return 1
          return 0
        })
        graph.fromJSON({ cells: sortedCells })
        this._isLoading = false
      }
    },

    // ======== 对外方法 ========
    getFlowData() {
      return this.canvasData
    },

    // ======== 清空画布 ========
    clear() {
      if (!this.graph) return
      this.graph.clearCells()
      this.canvasData = { cells: [] }
      this.selectedNode = null
      this.selectedEdgeId = null
      this.lastSelectedEdge = null
      this.editingNode = null
      this.edgeInfoCache = null
    },

    // ======== 键盘事件处理 ========
    onKeyDown(e) {
      // 检查是否在输入框中,避免误删
      const target = e.target
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      // Delete 或 Backspace 键删除选中的节点/连线
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!this.graph) return

        const selectedCells = this.graph.getSelectedCells()
        if (selectedCells.length > 0) {
          this.graph.removeCells(selectedCells)
          this.selectedNode = null
          this.selectedEdgeId = null
          this.lastSelectedEdge = null
          this.editingNode = null
          this.edgeInfoCache = null
        }
      }
    },

    // ======== 保存节点修改 ========
    handleSaveNode() {
      if (!this.editingNode || !this.selectedNode) return

      // 更新节点标签
      this.selectedNode.attr('text/text', this.editingNode.label)

      // 更新节点位置
      this.selectedNode.position(this.editingNode.x, this.editingNode.y)

      // 清除选中状态
      this.$Message.success('节点已更新')
    },

    // ======== 删除节点 ========
    handleDeleteNode() {
      if (!this.selectedNode || !this.graph) return

      this.graph.removeCells([this.selectedNode])
      this.selectedNode = null
      this.selectedEdgeId = null
      this.editingNode = null
      this.$Message.success('节点已删除')
    },

    // ======== 删除连线 ========
    handleDeleteEdge() {
      if (!this.lastSelectedEdge || !this.graph) return

      this.graph.removeCells([this.lastSelectedEdge])
      this.selectedNode = null
      this.selectedEdgeId = null
      this.lastSelectedEdge = null
      this.editingNode = null
      this.edgeInfoCache = null
      this.$Message.success('连线已删除')
    },

    // ======== 获取连线标签 ========
    getEdgeLabel(type) {
      if (!this.lastSelectedEdge || !this.graph) return ''

      try {
        if (type === 'source') {
          const sourceCell = this.lastSelectedEdge.getSourceCell()
          if (sourceCell) {
            return sourceCell.attr('text/text') || sourceCell.id
          }
          return '未知'
        } else if (type === 'target') {
          const targetCell = this.lastSelectedEdge.getTargetCell()
          if (targetCell) {
            return targetCell.attr('text/text') || targetCell.id
          }
          return '未知'
        }
      } catch (error) {
        console.error('获取连线信息失败:', error)
        return '错误'
      }

      return ''
    },

    // ======== 获取连线ID ========
    getEdgeId() {
      if (!this.lastSelectedEdge) return ''

      try {
        return this.lastSelectedEdge.id || '未知'
      } catch (error) {
        console.error('获取连线ID失败:', error)
        return '错误'
      }
    },

    // ======== 关闭属性面板 ========
    closePropsPanel() {
      // 恢复连线的原始样式
      if (this.lastSelectedEdge && this.graph) {
        this.lastSelectedEdge.attr('line/stroke', '#A2B1C3')
        this.lastSelectedEdge.attr('line/strokeWidth', 2)
        this.lastSelectedEdge = null
      }

      this.selectedNode = null
      this.selectedEdgeId = null
      this.editingNode = null
      this.edgeInfoCache = null
    },

    // ======== 开始调整高度 ========
    startResize(e) {
      this.isResizing = true
      this._resizeStartY = e.clientY
      this._resizeStartHeight = this.currentHeight || this.height
      e.preventDefault()
    },

    // ======== 调整高度中 ========
    onResizeMove(e) {
      if (!this.isResizing) return

      const deltaY = e.clientY - this._resizeStartY
      const newHeight = Math.max(300, this._resizeStartHeight + deltaY)
      this.currentHeight = newHeight
    },

    // ======== 结束调整高度 ========
    onResizeEnd() {
      if (this.isResizing) {
        this.isResizing = false
        // 高度会通过 watch 自动同步到父组件
      }
    }
  }
}
</script>

<style scoped>
.jx6flow-container {
  position: relative;
  display: flex;
  flex-direction: column;
  background: #fff;
  width: 100%;
  height: auto;
}

.jx6flow-wrapper {
  display: flex;
  position: relative;
  overflow: hidden;
}

.jx6flow-stencil {
  width: 180px;
  position: relative;
  border-right: 1px solid #dfe3e8;
  flex-shrink: 0;
}

.jx6flow-canvas {
  flex: 1;
  min-width: 0;
  position: relative;
}

.jx6flow-resize-handle {
  height: 10px;
  background: #f5f5f5;
  border-top: 1px solid #dfe3e8;
  cursor: ns-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
  flex-shrink: 0;
  user-select: none;
}

.jx6flow-resize-handle:hover,
.jx6flow-resize-handle.resizing {
  background: #e8f4ff;
  border-color: #1890ff;
}

.jx6flow-resize-handle .resize-icon {
  color: #999;
  transform: rotate(90deg);
  transition: color 0.3s;
}

.jx6flow-resize-handle:hover .resize-icon {
  color: #1890ff;
}

.jx6flow-props {
  position: absolute;
  right: 0;
  top: 0;
  width: 280px;
  height: 100%;
  background: #fff;
  border-left: 1px solid #dfe3e8;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.jx6flow-props .props-header {
  padding: 12px 40px 12px 16px;
  border-bottom: 1px solid #dfe3e8;
  position: relative;
}

.jx6flow-props .props-close {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #999;
  transition: all 0.3s;
  border-radius: 50%;
}

.jx6flow-props .props-close:hover {
  color: #1890ff;
  background: #f0f0f0;
}

.jx6flow-props .props-header h4 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.jx6flow-props .props-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.jx6flow-props .props-footer {
  padding: 12px;
  border-top: 1px solid #dfe3e8;
}

/* 官方 Stencil 样式 */
.jx6flow-stencil .x6-widget-stencil {
  background-color: #fff;
}

.jx6flow-stencil .x6-widget-stencil-title {
  background-color: #fff;
}

.jx6flow-stencil .x6-widget-stencil-group-title {
  background-color: #fff !important;
}

/* 官方 Transform 样式 */
.jx6flow-canvas .x6-widget-transform {
  margin: -1px 0 0 -1px;
  padding: 0px;
  border: 1px solid #239edd;
}

.jx6flow-canvas .x6-widget-transform > div {
  border: 1px solid #239edd;
}

.jx6flow-canvas .x6-widget-transform > div:hover {
  background-color: #3dafe4;
}

.jx6flow-canvas .x6-widget-transform-active-handle {
  background-color: #3dafe4;
}

.jx6flow-canvas .x6-widget-transform-resize {
  border-radius: 0;
}

/* 官方 Selection 样式 */
.jx6flow-canvas .x6-widget-selection-inner {
  border: 2px solid #239edd;
  background-color: rgba(35, 158, 221, 0.1);
}

.jx6flow-canvas .x6-widget-selection-box {
  opacity: 0;
}

/* 隐藏连线的选中框 */
.jx6flow-canvas .x6-edge.x6-selected .x6-widget-selection-inner {
  display: none !important;
  border: none !important;
}

.jx6flow-canvas .x6-edge.x6-selected .x6-widget-selection-box {
  display: none !important;
}

/* 节点选中样式增强 */
.jx6flow-canvas .x6-node.x6-node-selected .x6-shape {
  stroke: #1890ff !important;
  stroke-width: 3 !important;
  filter: drop-shadow(0 0 8px rgba(24, 144, 255, 0.6));
}

/* 连线选中样式增强 */
.jx6flow-canvas .x6-edge.x6-edge-selected .x6-path {
  stroke: #1890ff !important;
  stroke-width: 3 !important;
  filter: drop-shadow(0 0 8px rgba(24, 144, 255, 0.6));
}

.jx6flow-canvas .x6-edge.x6-edge-selected .x6-arrow {
  fill: #1890ff !important;
}

/* X6 默认选中状态类名 */
.jx6flow-canvas .x6-node.selected .x6-shape {
  stroke: #1890ff !important;
  stroke-width: 3 !important;
  filter: drop-shadow(0 0 8px rgba(24, 144, 255, 0.6));
}

.jx6flow-canvas .x6-edge.selected .x6-path {
  stroke: #1890ff !important;
  stroke-width: 3 !important;
  filter: drop-shadow(0 0 8px rgba(24, 144, 255, 0.6));
}

.jx6flow-canvas .x6-edge.selected .x6-arrow {
  fill: #1890ff !important;
}

/* 兼容其他可能的类名 */
.jx6flow-canvas .x6-node.is-selected .x6-shape {
  stroke: #1890ff !important;
  stroke-width: 3 !important;
  filter: drop-shadow(0 0 8px rgba(24, 144, 255, 0.6));
}

.jx6flow-canvas .x6-edge.is-selected .x6-path {
  stroke: #1890ff !important;
  stroke-width: 3 !important;
  filter: drop-shadow(0 0 8px rgba(24, 144, 255, 0.6));
}

.jx6flow-canvas .x6-edge.is-selected .x6-arrow {
  fill: #1890ff !important;
}

/* 悬停效果 */
.jx6flow-canvas .x6-node:hover .x6-shape {
  stroke: #40a9ff !important;
  cursor: pointer;
}

.jx6flow-canvas .x6-edge:hover .x6-path {
  stroke: #40a9ff !important;
  cursor: pointer;
}
</style>
