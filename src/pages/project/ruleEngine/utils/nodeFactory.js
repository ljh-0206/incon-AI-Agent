/**
 * 节点工厂 - 根据类型创建节点实例
 */

// 节点类型定义（与后端 RuleHandler.java 保持一致）
export const NodeTypes = {
  START: 'START',
  END_PASS: 'END_PASS',
  END_FAIL: 'END_FAIL',
  SQL_QUERY: 'SQL_QUERY',
  BEAN_CALL: 'BEAN_CALL',
  AND: 'AND',
  OR: 'OR',
  EXPR: 'EXPR',
  SET_FIELD: 'SET_FIELD',
  FILTER_RESULT: 'FILTER_RESULT',
  CALL_SQLID: 'CALL_SQLID',
  CALL_BEAN: 'CALL_BEAN',
  LOG: 'LOG',
  CALL_RULE: 'CALL_RULE'
}

// 节点图标映射
export const NodeIcons = {
  'START': '🟢',
  'END_PASS': '✅',
  'END_FAIL': '❌',
  'SQL_QUERY': '📊',
  'BEAN_CALL': '🔧',
  'AND': '🔗',
  'OR': '🔀',
  'EXPR': '📝',
  'SET_FIELD': '📝',
  'FILTER_RESULT': '🔍',
  'CALL_SQLID': '📤',
  'CALL_BEAN': '🔧',
  'LOG': '📋',
  'CALL_RULE': '🔗'
}

// 节点分类
export const NodeCategories = {
  datasource: ['SQL_QUERY', 'BEAN_CALL'],
  condition: ['AND', 'OR', 'EXPR'],
  action: ['SET_FIELD', 'FILTER_RESULT', 'CALL_SQLID', 'CALL_BEAN', 'LOG', 'CALL_RULE'],
  terminal: ['START', 'END_PASS', 'END_FAIL']
}

// 获取节点图标
export function getNodeIcon(type) {
  return NodeIcons[type] || '📦'
}

// 获取节点分类
export function getNodeCategory(type) {
  for (const [category, types] of Object.entries(NodeCategories)) {
    if (types.includes(type)) {
      return category
    }
  }
  return 'other'
}

// 节点是否有输入端口
export function hasInputPort(type) {
  return type !== 'START'
}

// 节点是否有输出端口
export function hasOutputPort(type) {
  return type !== 'END_PASS' && type !== 'END_FAIL'
}

// 节点是否有条件输出端口
export function hasConditionPorts(type) {
  return type === 'AND' || type === 'OR'
}

// 创建节点实例
export function createNodeInstance(type, x, y, config = {}) {
  const id = `${type}_${Date.now()}_${generateId()}`
  const label = getDefaultLabel(type)

  return {
    id,
    type,
    label,
    x,
    y,
    config: { ...getDefaultConfig(type), ...config }
  }
}

// 获取默认标签
function getDefaultLabel(type) {
  const labels = {
    'START': '开始',
    'END_PASS': '通过',
    'END_FAIL': '失败',
    'SQL_QUERY': 'SQL查询',
    'BEAN_CALL': 'Bean调用',
    'AND': 'AND条件',
    'OR': 'OR条件',
    'EXPR': '表达式',
    'SET_FIELD': '设置字段',
    'FILTER_RESULT': '结果过滤',
    'CALL_SQLID': '调用SQL',
    'CALL_BEAN': '调用Bean',
    'LOG': '记录日志',
    'CALL_RULE': '调用规则'
  }
  return labels[type] || type
}

// 获取默认配置
function getDefaultConfig(type) {
  const configs = {
    'SQL_QUERY': { id: '', sqlId: '', params: {} },
    'BEAN_CALL': { id: '', bean: '', method: '', params: {} },
    'EXPR': { expression: '' },
    'AND': { conditions: [] },
    'OR': { conditions: [] },
    'SET_FIELD': {
      fields: [
        { prefix: 'params.', fieldName: '', target: 'params.', operation: 'set', value: '', quickValue: '' }
      ]
    },
    'FILTER_RESULT': { expr: '' },
    'CALL_SQLID': { sqlId: '', params: {} },
    'CALL_BEAN': { bean: '', method: '', params: {} },
    'LOG': { message: '', level: 'INFO' },
    'CALL_RULE': { ruleId: '' },
    'END_FAIL': { block: true, message: '', errorCode: '' }
  }
  return JSON.parse(JSON.stringify(configs[type] || {}))
}

// 生成唯一ID
function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

// 克隆节点
export function cloneNode(node) {
  return {
    ...JSON.parse(JSON.stringify(node)),
    id: `${node.type}_${Date.now()}_${generateId()}`
  }
}

// 验证节点配置
export function validateNode(node) {
  const errors = []

  switch (node.type) {
    case 'SQL_QUERY':
      if (!node.config.sqlId) errors.push('请选择SQL')
      if (!node.config.id) errors.push('请输入变量名')
      break
    case 'BEAN_CALL':
      if (!node.config.bean) errors.push('请输入Bean类名')
      if (!node.config.method) errors.push('请输入方法名')
      break
    case 'EXPR':
      if (!node.config.expression) errors.push('请输入表达式')
      break
    case 'AND':
    case 'OR':
      if (!node.config.conditions?.length) errors.push('请添加至少一个条件')
      break
    case 'CALL_RULE':
      if (!node.config.ruleId) errors.push('请输入规则ID')
      break
    case 'SET_FIELD':
      if (!node.config.fields?.length) {
        errors.push('请添加至少一个字段')
      } else {
        node.config.fields.forEach((field, index) => {
          if (!field.target || !field.target.includes('.')) {
            errors.push(`请输入第${index + 1}个字段的目标(格式: params.字段名)`)
          }
          if (field.operation === 'set' && (field.value === undefined || field.value === '')) {
            errors.push(`请输入第${index + 1}个字段的值`)
          }
        })
      }
      break
    case 'FILTER_RESULT':
      if (!node.config.expr) errors.push('请输入过滤表达式')
      break
    case 'LOG':
      if (!node.config.message) errors.push('请输入日志内容')
      break
    case 'CALL_SQLID':
      if (!node.config.sqlId) errors.push('请输入SQL ID')
      break
    case 'CALL_BEAN':
      if (!node.config.bean) errors.push('请输入Bean类名')
      if (!node.config.method) errors.push('请输入方法名')
      break
  }

  return errors
}

export default {
  NodeTypes,
  NodeIcons,
  NodeCategories,
  getNodeIcon,
  getNodeCategory,
  hasInputPort,
  hasOutputPort,
  hasConditionPorts,
  createNodeInstance,
  cloneNode,
  validateNode
}