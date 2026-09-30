<template>
  <div
    class="node-types"
    :class="[node.type, { selected }]"
  >
    <div class="node-header">
      <span class="node-icon">{{ getNodeIcon(node.type) }}</span>
      <span class="node-label">{{ node.label }}</span>
    </div>
    <div class="node-body">
      {{ getNodeSummary(node) }}
    </div>

    <!-- 输入端口 -->
    <div
      v-if="hasInputPort(node.type)"
      class="node-port input"
      @mousedown.stop="$emit('port-mousedown', { nodeId: node.id, port: 'input' })"
    />

    <!-- 输出端口 -->
    <div
      v-if="hasOutputPort(node.type)"
      class="node-port output"
      @mousedown.stop="$emit('port-mousedown', { nodeId: node.id, port: 'output' })"
    />

    <!-- 条件输出端口 -->
    <template v-if="hasConditionPorts(node.type)">
      <div
        class="node-port output true-port"
        @mousedown.stop="$emit('port-mousedown', { nodeId: node.id, port: 'true' })"
      >
        <span class="port-label">T</span>
      </div>
      <div
        class="node-port output false-port"
        @mousedown.stop="$emit('port-mousedown', { nodeId: node.id, port: 'false' })"
      >
        <span class="port-label">F</span>
      </div>
    </template>
  </div>
</template>

<script>
import { getNodeIcon, hasInputPort, hasOutputPort, hasConditionPorts } from '../utils/nodeFactory.js'

export default {
  name: 'NodeTypes',
  props: {
    node: {
      type: Object,
      required: true
    },
    selected: {
      type: Boolean,
      default: false
    }
  },
  emits: ['port-mousedown'],
  methods: {
    getNodeIcon(type) {
      return getNodeIcon(type)
    },
    hasInputPort(type) {
      return hasInputPort(type)
    },
    hasOutputPort(type) {
      return hasOutputPort(type)
    },
    hasConditionPorts(type) {
      return hasConditionPorts(type)
    },
    getNodeSummary(node) {
      if (!node.config) return ''
      switch (node.type) {
        case 'SQL_QUERY':
          return node.config.sqlId || ''
        case 'BEAN_CALL':
          return node.config.beanMethod || ''
        case 'EXPR':
          return node.config.expression ? node.config.expression.substring(0, 30) + '...' : ''
        case 'AND':
        case 'OR':
          return `${node.config.conditions?.length || 0} 个条件`
        case 'SWITCH':
          return node.config.switchKey || ''
        case 'RULE_CHAIN':
          return `${node.config.chainRules?.length || 0} 个子规则`
        default:
          return ''
      }
    }
  }
}
</script>

<style lang="less" scoped>
.node-types {
  width: 150px;
  min-height: 60px;
  background: #3a3a3a;
  border: 2px solid #555;
  border-radius: 8px;
  cursor: move;
  user-select: none;
  position: relative;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
  }

  &.selected {
    border-color: #57a3f3;
    box-shadow: 0 0 10px rgba(45, 140, 240, 0.5);
  }

  .node-header {
    display: flex;
    align-items: center;
    padding: 8px;
    background: #4a4a4a;
    border-radius: 6px 6px 0 0;

    .node-icon {
      margin-right: 6px;
      font-size: 16px;
    }

    .node-label {
      font-size: 13px;
      font-weight: 500;
      color: #fff;
    }
  }

  .node-body {
    padding: 8px;
    font-size: 12px;
    color: #aaa;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .node-port {
    position: absolute;
    width: 16px;
    height: 16px;
    background: #666;
    border: 2px solid #888;
    border-radius: 50%;
    cursor: crosshair;
    z-index: 10;
    transition: all 0.2s;

    &:hover {
      background: #57a3f3;
      border-color: #57a3f3;
    }

    &.input {
      left: -9px;
      top: 50%;
      transform: translateY(-50%);
    }

    &.output {
      right: -9px;
      top: 50%;
      transform: translateY(-50%);
    }

    &.true-port {
      right: -9px;
      top: 30%;
      transform: translateY(-50%);
    }

    &.false-port {
      right: -9px;
      top: 70%;
      transform: translateY(-50%);
    }

    .port-label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 10px;
      font-weight: bold;
      color: #fff;
    }
  }
}
</style>