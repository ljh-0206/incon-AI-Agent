<template>
  <div class="rule-node-panel">
    <div class="panel-header">
      <h4>节点面板</h4>
    </div>
    <div class="node-list">
      <!-- 数据源分类 -->
      <div class="node-category">
        <div class="category-header" @click="toggleCategory('datasource')">
          <Icon :type="expandedCategories.datasource ? 'ios-arrow-down' : 'ios-arrow-forward'" />
          <span>数据源</span>
        </div>
        <div class="category-content" v-show="expandedCategories.datasource">
          <div
            v-for="node in datasourceNodes"
            :key="node.type"
            class="node-item"
            draggable="true"
            @dragstart="onDragStart($event, node.type)"
            @dblclick="onNodeDoubleClick(node.type)"
          >
            <span class="node-icon">{{ node.icon }}</span>
            <span class="node-name">{{ node.name }}</span>
          </div>
        </div>
      </div>

      <!-- 条件分类 -->
      <div class="node-category">
        <div class="category-header" @click="toggleCategory('condition')">
          <Icon :type="expandedCategories.condition ? 'ios-arrow-down' : 'ios-arrow-forward'" />
          <span>条件</span>
        </div>
        <div class="category-content" v-show="expandedCategories.condition">
          <div
            v-for="node in conditionNodes"
            :key="node.type"
            class="node-item"
            draggable="true"
            @dragstart="onDragStart($event, node.type)"
            @dblclick="onNodeDoubleClick(node.type)"
          >
            <span class="node-icon">{{ node.icon }}</span>
            <span class="node-name">{{ node.name }}</span>
          </div>
        </div>
      </div>

      <!-- 动作分类 -->
      <div class="node-category">
        <div class="category-header" @click="toggleCategory('action')">
          <Icon :type="expandedCategories.action ? 'ios-arrow-down' : 'ios-arrow-forward'" />
          <span>动作</span>
        </div>
        <div class="category-content" v-show="expandedCategories.action">
          <div
            v-for="node in actionNodes"
            :key="node.type"
            class="node-item"
            draggable="true"
            @dragstart="onDragStart($event, node.type)"
            @dblclick="onNodeDoubleClick(node.type)"
          >
            <span class="node-icon">{{ node.icon }}</span>
            <span class="node-name">{{ node.name }}</span>
          </div>
        </div>
      </div>

      <!-- 终止分类 -->
      <div class="node-category">
        <div class="category-header" @click="toggleCategory('terminal')">
          <Icon :type="expandedCategories.terminal ? 'ios-arrow-down' : 'ios-arrow-forward'" />
          <span>起始/终止</span>
        </div>
        <div class="category-content" v-show="expandedCategories.terminal">
          <div
            v-for="node in terminalNodes"
            :key="node.type"
            class="node-item"
            :class="{ disabled: node.type === 'START' && hasStartNode }"
            :draggable="node.type !== 'START' || !hasStartNode"
            @dragstart="node.type !== 'START' || !hasStartNode ? onDragStart($event, node.type) : null"
            @dblclick="node.type !== 'START' || !hasStartNode ? onNodeDoubleClick(node.type) : null"
          >
            <span class="node-icon">{{ node.icon }}</span>
            <span class="node-name">{{ node.name }}</span>
            <span v-if="node.type === 'START' && hasStartNode" class="node-badge">已有</span>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <Alert type="info" class="tips">
        拖拽节点到画布<br/>
        或双击直接添加
      </Alert>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RuleNodePanel',
  emits: ['drag-start', 'node-click'],
  props: {
    nodes: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    hasStartNode() {
      return this.nodes.some(n => n.type === 'START')
    }
  },
  data() {
    return {
      expandedCategories: {
        datasource: true,
        condition: true,
        action: false,
        terminal: true
      },
      datasourceNodes: [
        { type: 'SQL_QUERY', name: 'SQL查询', icon: '📊' },
        { type: 'BEAN_CALL', name: 'Bean调用', icon: '🔧' }
      ],
      conditionNodes: [
        { type: 'AND', name: 'AND条件', icon: '🔗' },
        { type: 'OR', name: 'OR条件', icon: '🔀' },
        { type: 'EXPR', name: '表达式', icon: '📝' }
      ],
      actionNodes: [
        { type: 'SET_FIELD', name: '设置字段', icon: '📝' },
        { type: 'FILTER_RESULT', name: '结果过滤', icon: '🔍' },
        { type: 'CALL_SQLID', name: '调用SQL', icon: '📤' },
        { type: 'CALL_BEAN', name: '调用Bean', icon: '🔧' },
        { type: 'LOG', name: '记录日志', icon: '📋' },
        { type: 'CALL_RULE', name: '调用规则', icon: '🔗' }
      ],
      terminalNodes: [
        { type: 'START', name: '开始', icon: '🟢' },
        { type: 'END_PASS', name: '通过', icon: '✅' },
        { type: 'END_FAIL', name: '失败', icon: '❌' }
      ]
    }
  },
  methods: {
    toggleCategory(category) {
      this.expandedCategories[category] = !this.expandedCategories[category]
    },
    onDragStart(e, nodeType) {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('text/plain', nodeType)
      this.$emit('drag-start', nodeType)
    },
    onNodeDoubleClick(nodeType) {
      this.$emit('node-click', nodeType)
    }
  }
}
</script>

<style lang="less" scoped>
.rule-node-panel {
  width: 200px;
  background: #2d2d2d;
  border-right: 1px solid #404040;
  display: flex;
  flex-direction: column;

  .panel-header {
    padding: 12px 16px;
    border-bottom: 1px solid #404040;

    h4 {
      margin: 0;
      font-size: 14px;
      color: #fff;
    }
  }

  .node-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;

    .node-category {
      .category-header {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        cursor: pointer;
        color: #aaa;
        font-size: 13px;
        user-select: none;

        &:hover {
          background: #3a3a3a;
        }

        i {
          margin-right: 8px;
        }
      }

      .category-content {
        padding: 4px 8px;

        .node-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          margin: 4px 0;
          background: #3a3a3a;
          border-radius: 4px;
          cursor: grab;
          transition: all 0.2s;

          &:hover {
            background: #4a4a4a;
            transform: translateX(4px);
          }

          &:active {
            cursor: grabbing;
          }

          .node-icon {
            margin-right: 8px;
            font-size: 16px;
          }

          .node-name {
            font-size: 12px;
            color: #ddd;
          }

          &.template {
            background: #3d3d5c;
            border: 1px dashed #666;

            &:hover {
              background: #4d4d6c;
            }
          }

          &.disabled {
            opacity: 0.5;
            cursor: not-allowed;

            &:hover {
              background: #3a3a3a;
              transform: none;
            }
          }

          .node-badge {
            margin-left: auto;
            font-size: 10px;
            color: #888;
            background: #2a2a2a;
            padding: 2px 6px;
            border-radius: 3px;
          }
        }
      }
    }
  }

  .panel-footer {
    padding: 12px;

    .tips {
      font-size: 11px;
      line-height: 1.5;
    }
  }
}

// 深色主题 - 覆盖 iView 组件默认样式
::v-deep {
  .ivu-alert {
    background-color: #2d2d2d !important;
    border-color: #404040 !important;
    color: #e0e0e0 !important;

    &-info {
      border-color: #57a3f3 !important;
      background-color: rgba(87, 163, 243, 0.1) !important;
    }
  }
}
</style>
