<template>
  <svg
    ref="svgRef"
    class="connections-svg"
    width="100%"
    height="100%"
  >
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
      </marker>
      <marker
        id="arrowhead-selected"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#57a3f3" />
      </marker>
    </defs>

    <!-- 已有的连接线 -->
    <g v-for="conn in connections" :key="conn.id">
      <path
        :d="getConnectionPath(conn)"
        class="connection-path"
        :class="{ selected: selectedConnectionId === conn.id }"
        :marker-end="selectedConnectionId === conn.id ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'"
        @click.stop="handleConnectionClick(conn.id)"
      />
    </g>

    <!-- 临时连接线 -->
    <path
      v-if="tempConnection"
      :d="getTempConnectionPath()"
      class="connection-path temp"
    />
  </svg>
</template>

<script>
import { pathCalculator } from '../utils/pathCalculator.js'

export default {
  name: 'RuleCanvasSvg',
  props: {
    connections: {
      type: Array,
      default: () => []
    },
    tempConnection: {
      type: Object,
      default: null
    },
    nodes: {
      type: Array,
      default: () => []
    },
    zoom: {
      type: Number,
      default: 1
    },
    selectedConnectionId: {
      type: String,
      default: null
    }
  },
  methods: {
    getConnectionPath(conn) {
      const sourceNode = this.nodes.find(n => n.id === conn.sourceNodeId)
      const targetNode = this.nodes.find(n => n.id === conn.targetNodeId)
      if (!sourceNode || !targetNode) return ''

      const sourcePos = this.getPortPosition(sourceNode, conn.sourcePort)
      const targetPos = this.getPortPosition(targetNode, conn.targetPort)

      return pathCalculator.calculateBezierPath(sourcePos, targetPos)
    },
    getTempConnectionPath() {
      if (!this.tempConnection) return ''
      // 如果有鼠标坐标，使用鼠标坐标作为终点
      if (this.tempConnection._mouseX !== undefined && this.tempConnection._mouseY !== undefined) {
        const sourceNode = this.nodes.find(n => n.id === this.tempConnection.sourceNodeId)
        if (!sourceNode) return ''
        const sourcePos = this.getPortPosition(sourceNode, this.tempConnection.sourcePort)
        const targetPos = { x: this.tempConnection._mouseX, y: this.tempConnection._mouseY }
        return pathCalculator.calculateBezierPath(sourcePos, targetPos)
      }
      return this.getConnectionPath(this.tempConnection)
    },
    getPortPosition(node, port) {
      const nodeWidth = 150
      const nodeHeight = 60

      let x = node.x
      let y = node.y

      if (port === 'input') {
        x = node.x
        y = node.y + nodeHeight / 2
      } else if (port === 'output') {
        x = node.x + nodeWidth
        y = node.y + nodeHeight / 2
      } else if (port === 'true') {
        x = node.x + nodeWidth
        y = node.y + nodeHeight / 3
      } else if (port === 'false') {
        x = node.x + nodeWidth
        y = node.y + (nodeHeight * 2) / 3
      }

      return { x, y }
    },
    handleConnectionClick(connId) {
      this.$emit('connection-click', connId)
    }
  }
}
</script>

<style lang="less" scoped>
.connections-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: visible;

  .connection-path {
    fill: none;
    stroke: #666;
    stroke-width: 2;
    pointer-events: stroke;
    cursor: pointer;
    transition: stroke 0.2s;

    &.selected {
      stroke: #57a3f3;
      stroke-width: 3;
    }

    &.temp {
      stroke: #57a3f3;
      stroke-dasharray: 5, 5;
    }

    &:hover {
      stroke: #888;
    }
  }
}
</style>
