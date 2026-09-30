<template>
  <div class="rule-preview">
    <div class="preview-header">
      <h4>JSON预览</h4>
      <Button type="text" size="small" @click="handleCopy">
        <Icon type="ios-copy-outline" />复制
      </Button>
    </div>
    <div class="preview-content">
      <pre v-highlight><code class="json">{{ formattedJson }}</code></pre>
    </div>
    <div class="preview-footer">
      <span :class="['status', jsonValid ? 'valid' : 'invalid']">
        {{ jsonValid ? '✓ 有效JSON' : '✗ 无效JSON' }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RulePreview',
  props: {
    nodes: {
      type: Array,
      default: () => []
    },
    connections: {
      type: Array,
      default: () => []
    },
    canvasExpr: {
      type: String,
      default: ''
    }
  },
  computed: {
    formattedJson() {
      if (!this.canvasExpr) return '{}'
      try {
        const obj = typeof this.canvasExpr === 'string' ? JSON.parse(this.canvasExpr) : this.canvasExpr
        return JSON.stringify(obj, null, 2)
      } catch {
        return this.canvasExpr || '{}'
      }
    },
    jsonValid() {
      if (!this.canvasExpr) return true
      try {
        JSON.parse(this.canvasExpr)
        return true
      } catch {
        return false
      }
    }
  },
  methods: {
    handleCopy() {
      navigator.clipboard.writeText(this.formattedJson).then(() => {
        this.$Message.success('已复制到剪贴板')
      })
    }
  }
}
</script>

<style lang="less" scoped>
.rule-preview {
  width: 320px;
  background: #2d2d2d;
  border-left: 1px solid #404040;
  display: flex;
  flex-direction: column;

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #404040;

    h4 {
      margin: 0;
      font-size: 14px;
      color: #fff;
    }
  }

  .preview-content {
    flex: 1;
    padding: 12px;
    min-height: 0;

    pre {
      margin: 0;
      font-size: 12px;
      color: #abb2bf;
      background: #1e1e1e;
      border-radius: 4px;
      padding: 12px;
      overflow-x: auto;
      min-height: 200px;
      height: calc(100vh - 300px);
    }
  }

  .preview-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    border-top: 1px solid #404040;
    font-size: 12px;

    .status {
      &.valid {
        color: #67c23a;
      }
      &.invalid {
        color: #f56c6c;
      }
    }
  }
}

// 深色主题覆盖
::v-deep {
  .ivu-btn-text {
    color: #e0e0e0 !important;

    &:hover {
      color: #57a3f3 !important;
    }
  }

  .ivu-icon {
    color: #e0e0e0 !important;
  }
}
</style>
