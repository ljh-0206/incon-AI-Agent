<template>
  <div class="expression-builder">
    <div class="builder-tabs">
      <RadioGroup v-model="currentMode" size="small">
        <Radio label="gui">图形化</Radio>
        <Radio label="code">代码</Radio>
      </RadioGroup>
    </div>

    <!-- 图形化模式 -->
    <div v-show="currentMode === 'gui'" class="gui-mode">
      <div class="condition-list">
        <div v-for="(condition, index) in conditions" :key="index" class="condition-item">
          <!-- 逻辑运算符（第一个条件前不显示） -->
          <Select v-if="index > 0" v-model="condition.logic" class="logic-select" size="small" @on-change="onLogicChange">
            <Option value="&&">并且</Option>
            <Option value="||">或者</Option>
          </Select>

          <!-- 条件内容 -->
          <div class="condition-content">
            <!-- 左括号（分组用） -->
            <span v-if="condition.lparen" class="paren paren-left">{{ condition.lparen }}</span>

            <!-- 变量选择 -->
            <Select v-model="condition.varType" class="var-type-select" size="small" placeholder="变量" @on-change="(val) => onVarTypeChange(condition, val)">
              <Option v-for="v in varTypes" :key="v.value" :value="v.value">{{ v.label }}</Option>
            </Select>

            <!-- 变量字段 -->
            <Input
              v-if="condition.varType !== 'item.index' && condition.varType !== 'preExec'"
              v-model="condition.field"
              class="field-input"
              size="small"
              placeholder="字段"
              @on-blur="onConditionChange"
            />

            <!-- preExec 特殊处理：节点ID.字段名 -->
            <Input
              v-if="condition.varType === 'preExec'"
              v-model="condition.field"
              class="field-input preExec-field"
              size="small"
              placeholder="节点.字段"
              @on-blur="onConditionChange"
            />

            <!-- 运算符 -->
            <Select v-model="condition.operator" class="operator-select" size="small" @on-change="onConditionChange">
              <Option v-for="op in operators" :key="op.value" :value="op.value">{{ op.label }}</Option>
            </Select>

            <!-- 比较值 -->
            <Input
              v-if="condition.operator !== 'isEmpty' && condition.operator !== 'isNotEmpty'"
              v-model="condition.value"
              class="value-input"
              size="small"
              placeholder="值"
              @on-blur="onConditionChange"
            />

            <!-- 右括号 -->
            <span v-if="condition.rparen" class="paren paren-right">{{ condition.rparen }}</span>

            <!-- 删除条件 -->
            <Button type="text" size="small" @click="removeCondition(index)" class="delete-btn">
              <Icon type="ios-close-circle" />
            </Button>
          </div>
        </div>
      </div>

      <div class="builder-actions">
        <Button type="dashed" size="small" @click="addCondition" class="action-btn">
          <Icon type="ios-add" />添加条件
        </Button>
        <Button type="dashed" size="small" @click="addGroup" class="action-btn">
          <Icon type="ios-add" />添加分组
        </Button>
      </div>
    </div>

    <!-- 代码模式 -->
    <div v-show="currentMode === 'code'" class="code-mode">
      <Input
        v-model="codeExpression"
        type="textarea"
        :rows="3"
        :placeholder="placeholder"
        @on-change="onCodeChange"
      />
    </div>

    <!-- 表达式预览 -->
    <div class="expression-preview" v-if="finalExpression">
      <span class="preview-label">表达式：</span>
      <code class="preview-code">{{ finalExpression }}</code>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ExpressionBuilder',

  props: {
    value: {
      type: String,
      default: ''
    },
    mode: {
      type: String,
      default: 'gui'
    },
    placeholder: {
      type: String,
      default: "输入表达式，如: ${params.status} == '0'"
    },
    varTypes: {
      type: Array,
      default: () => [
        { value: 'params', label: '请求参数', hasExtraField: false },
        { value: 'result', label: '执行结果', hasExtraField: false },
        { value: 'user', label: '当前用户', hasExtraField: false },
        { value: 'sys', label: '系统变量', hasExtraField: false },
        { value: 'preExec', label: '前置查询', hasExtraField: true, extraLabel: '节点.字段' },
        { value: 'item', label: '列表元素', hasExtraField: false },
        { value: 'item.index', label: '元素索引', hasExtraField: false }
      ]
    },
    operators: {
      type: Array,
      default: () => [
        { value: '==', label: '等于' },
        { value: '!=', label: '不等于' },
        { value: '>', label: '大于' },
        { value: '<', label: '小于' },
        { value: '>=', label: '大于等于' },
        { value: '<=', label: '小于等于' },
        { value: 'contains', label: '包含' },
        { value: 'startsWith', label: '开头是' },
        { value: 'endsWith', label: '结尾是' },
        { value: 'isEmpty', label: '为空' },
        { value: 'isNotEmpty', label: '不为空' }
      ]
    }
  },

  data() {
    return {
      currentMode: this.mode,
      conditions: [],
      codeExpression: ''
    }
  },

  computed: {
    finalExpression() {
      if (this.currentMode === 'code') {
        return this.codeExpression
      }
      return this.buildExpression()
    }
  },

  watch: {
    value: {
      immediate: true,
      handler(val) {
        if (val !== undefined && val !== null && val !== '') {
          // 只有在图形化模式或值确实变化时才解析
          if (this.currentMode === 'gui' || this.conditions.length === 0) {
            this.parseExpression(val)
          }
          // 代码模式直接更新codeExpression
          this.codeExpression = val
        }
      }
    },
    currentMode(newMode, oldMode) {
      if (newMode === 'code') {
        // 切换到代码模式，同步表达式
        this.codeExpression = this.buildExpression()
      } else if (newMode === 'gui' && oldMode === 'code') {
        // 从代码切换到图形化，解析代码表达式
        this.parseExpression(this.codeExpression)
      }
    }
  },

  methods: {
    // 添加条件
    addCondition() {
      this.conditions.push({
        logic: '&&',
        varType: 'params',
        field: '',
        operator: '==',
        value: '',
        lparen: '',
        rparen: ''
      })
      this.emitExpression()
    },

    // 添加分组（括号）
    addGroup() {
      if (this.conditions.length > 0) {
        // 给最后一个条件加右括号
        this.conditions[this.conditions.length - 1].rparen = ')'
      }
      // 添加新条件带左括号
      this.conditions.push({
        logic: '&&',
        varType: 'params',
        field: '',
        operator: '==',
        value: '',
        lparen: '(',
        rparen: ''
      })
      this.emitExpression()
    },

    // 删除条件
    removeCondition(index) {
      const wasLeftParen = this.conditions[index].lparen
      const wasRightParen = this.conditions[index].rparen

      this.conditions.splice(index, 1)

      // 处理括号的衔接
      if (wasLeftParen && this.conditions.length > 0) {
        this.conditions[0].lparen = '('
      }
      if (wasRightParen && this.conditions.length > 0) {
        this.conditions[this.conditions.length - 1].rparen = ')'
      }

      this.emitExpression()
    },

    // 逻辑运算符变化
    onLogicChange() {
      this.emitExpression()
    },

    // 变量类型变化
    onVarTypeChange(condition, val) {
      if (val === 'item.index') {
        condition.field = 'index'
        condition.operator = '=='
        condition.value = ''
      } else if (condition.field === 'index') {
        condition.field = ''
      }
      this.emitExpression()
    },

    // 条件变化
    onConditionChange() {
      this.emitExpression()
    },

    // 代码模式变化
    onCodeChange() {
      // 不再这里解析，直接发送代码表达式
      // 解析会在 watch 中或切换回图形化时进行
      this.emitExpression()
    },

    // 构建表达式
    buildExpression() {
      const parts = []

      this.conditions.forEach((cond, index) => {
        // 跳过空条件
        if (!cond.varType) return

        // 逻辑运算符
        if (index > 0 && parts.length > 0) {
          parts.push(cond.logic === '&&' ? '&&' : '||')
        }

        // 左括号
        if (cond.lparen) {
          parts.push(cond.lparen)
        }

        // 构建表达式
        if (cond.varType === 'item.index') {
          parts.push('${item.index}')
        } else if (cond.operator === 'isEmpty' || cond.operator === 'isNotEmpty') {
          const varRef = cond.field ? `\${${cond.varType}.${cond.field}}` : `\${${cond.varType}}`
          if (cond.operator === 'isEmpty') {
            parts.push(`(${varRef} == null || ${varRef} == '')`)
          } else {
            parts.push(`(${varRef} != null && ${varRef} != '')`)
          }
        } else if (cond.operator === 'contains' || cond.operator === 'startsWith' || cond.operator === 'endsWith') {
          const varRef = cond.field ? `\${${cond.varType}.${cond.field}}` : `\${${cond.varType}}`
          parts.push(`${varRef}.${cond.operator}('${cond.value || ''}')`)
        } else {
          const varRef = cond.field ? `\${${cond.varType}.${cond.field}}` : `\${${cond.varType}}`
          let value = cond.value
          // 判断值是否需要加引号
          if (value && !this.isNumeric(value) && value !== 'null' && value !== 'true' && value !== 'false') {
            // 如果值是 ${xxx} 格式的变量引用，不加引号
            if (!value.startsWith('${')) {
              value = `'${value}'`
            }
          }
          parts.push(`${varRef} ${cond.operator} ${value}`)
        }

        // 右括号
        if (cond.rparen) {
          parts.push(cond.rparen)
        }
      })

      return parts.join(' ')
    },

    // 解析表达式到图形化
    parseExpression(expr) {
      if (!expr || !expr.trim()) {
        this.conditions = []
        this.codeExpression = ''
        return
      }

      try {
        this.codeExpression = expr
        this.conditions = []

        // 使用正则表达式分割表达式
        // 匹配模式: ${xxx} OP 'value' 或 ${xxx}.method('value')
        // 支持 && || 分隔多个条件

        // 首先按 && || 分割，注意不在引号内分割
        const tokens = this.splitByLogicalOperators(expr)

        for (const token of tokens) {
          const trimmed = token.trim()
          if (!trimmed) continue

          const cond = this.parseSingleCondition(trimmed)
          if (cond) {
            this.conditions.push(cond)
          }
        }
      } catch (e) {
        console.error('Parse expression error:', e)
        this.conditions = []
      }
    },

    // 按 && || 分割表达式（不在引号内分割）
    splitByLogicalOperators(expr) {
      const result = []
      let current = ''
      let inQuote = false
      let quoteChar = ''
      let depth = 0

      for (let i = 0; i < expr.length; i++) {
        const c = expr[i]

        // 处理引号
        if ((c === "'" || c === '"') && (i === 0 || expr[i - 1] !== '\\')) {
          if (!inQuote) {
            inQuote = true
            quoteChar = c
          } else if (c === quoteChar) {
            inQuote = false
            quoteChar = ''
          }
        }

        // 不在引号内时处理括号和逻辑运算符
        if (!inQuote) {
          if (c === '(' || c === ')') {
            depth += (c === '(' ? 1 : -1)
          }

          // 检查 && 或 ||
          if (depth === 0) {
            if (expr.substring(i, i + 2) === '&&' || expr.substring(i, i + 2) === '||') {
              if (current.trim()) {
                result.push(current.trim())
              }
              current = ''
              i++ // 跳过下一个字符
              continue
            }
          }
        }

        current += c
      }

      if (current.trim()) {
        result.push(current.trim())
      }

      return result
    },

    // 解析单个条件
    parseSingleCondition(expr) {
      let trimmed = expr.trim()

      const cond = {
        logic: '&&',
        varType: 'params',
        field: '',
        operator: '==',
        value: '',
        lparen: '',
        rparen: ''
      }

      // 提取括号
      if (trimmed.startsWith('(')) {
        cond.lparen = '('
        trimmed = trimmed.substring(1).trim()
      }
      if (trimmed.endsWith(')')) {
        cond.rparen = ')'
        trimmed = trimmed.substring(0, trimmed.length - 1).trim()
      }

      // 检查 isEmpty / isNotEmpty
      if (trimmed.includes('== null') || trimmed.includes("== ''")) {
        cond.operator = 'isEmpty'
        // 提取变量
        const varMatch = trimmed.match(/\$\{(\w+)(?:\.(\w+))?\}/)
        if (varMatch) {
          cond.varType = varMatch[1]
          cond.field = varMatch[2] || ''
        }
        return cond
      }

      if (trimmed.includes('!= null') && trimmed.includes('!= \'\'')) {
        cond.operator = 'isNotEmpty'
        const varMatch = trimmed.match(/\$\{(\w+)(?:\.(\w+))?\}/)
        if (varMatch) {
          cond.varType = varMatch[1]
          cond.field = varMatch[2] || ''
        }
        return cond
      }

      // 检查 .contains( .startsWith( .endsWith(
      const methodMatch = trimmed.match(/\$\{(\w+)(?:\.(\w+))?\}\.(contains|startsWith|endsWith)\('([^']*)'\)/)
      if (methodMatch) {
        cond.varType = methodMatch[1]
        cond.field = methodMatch[2] || ''
        cond.operator = methodMatch[3]
        cond.value = methodMatch[4]
        return cond
      }

      // 解析标准格式: ${var.field} OP value
      // 支持格式: ${params.field} == 'value' 或 ${params.field}== 'value' 或 ${params.field} =='value'
      const opMatch = trimmed.match(/^\$\{(\w+)(?:\.([^}]+))?\}\s*(==|!=|>|<|>=|<=)\s*['"]?(.+?)['"]?\s*$/)
      if (opMatch) {
        cond.varType = opMatch[1]
        cond.field = opMatch[2] || ''
        cond.operator = opMatch[3]
        // 去掉值的引号
        let value = opMatch[4]
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1)
        }
        cond.value = value.trim()
        return cond
      }

      // 尝试解析 preExec 格式: ${preExec.节点.字段}
      const preExecMatch = trimmed.match(/^\$\{preExec\.([^}]+)\}\s*(==|!=|>|<|>=|<=)\s*['"]?(.+?)['"]?\s*$/)
      if (preExecMatch) {
        cond.varType = 'preExec'
        cond.field = preExecMatch[1]
        cond.operator = preExecMatch[2]
        let value = preExecMatch[3]
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1)
        }
        cond.value = value.trim()
        return cond
      }

      // 尝试解析带括号的条件: (${params.field} == 'value')
      const parenMatch = trimmed.match(/^\(\s*\$\{(\w+)(?:\.([^}]+))?\}\s*(==|!=|>|<|>=|<=)\s*['"]?(.+?)['"]?\s*\)$/)
      if (parenMatch) {
        cond.lparen = '('
        cond.rparen = ')'
        cond.varType = parenMatch[1]
        cond.field = parenMatch[2] || ''
        cond.operator = parenMatch[3]
        let value = parenMatch[4]
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1)
        }
        cond.value = value.trim()
        return cond
      }

      return null
    },

    // 判断是否为数字
    isNumeric(value) {
      if (!value) return false
      return !isNaN(parseFloat(value)) && isFinite(value)
    },

    // 发送表达式
    emitExpression() {
      const expr = this.finalExpression
      this.$emit('input', expr)
      this.$emit('change', expr)
    }
  },

  mounted() {
    // 初始解析
    if (this.value) {
      this.parseExpression(this.value)
    }
  }
}
</script>

<style scoped>
.expression-builder {
  font-size: 12px;
}

.builder-tabs {
  margin-bottom: 8px;
}

.gui-mode {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 8px;
  background: #fafafa;
}

.condition-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.condition-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.logic-select {
  width: 70px;
}

.condition-content {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 300px;
}

.var-type-select {
  width: 90px;
}

.field-input {
  width: 100px;
}

.field-input.preExec-field {
  width: 120px;
}

.operator-select {
  width: 80px;
}

.value-input {
  width: 120px;
}

.paren {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 24px;
  font-weight: bold;
  color: #1890ff;
}

.paren-left {
  margin-right: 2px;
}

.paren-right {
  margin-left: 2px;
}

.delete-btn {
  color: #999;
  padding: 0 4px;
}

.delete-btn:hover {
  color: #ed4014;
}

.builder-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #ddd;
}

.action-btn {
  color: #1890ff;
}

.code-mode {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 8px;
  background: #fff;
}

.expression-preview {
  margin-top: 8px;
  padding: 6px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
}

.preview-label {
  color: #666;
}

.preview-code {
  color: #d4380d;
  word-break: break-all;
}
</style>
