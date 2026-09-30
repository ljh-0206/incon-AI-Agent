import { ref } from 'vue'

export function useNodeConfig() {
  // 节点类型到默认配置的映射
  const configTemplates = {
    'SQL_QUERY': {
      id: '',
      sqlId: '',
      params: {}
    },
    'BEAN_CALL': {
      id: '',
      beanClass: '',
      beanMethod: '',
      params: {}
    },
    'EXPR': {
      expression: '',
      left: { source: 'params', path: '' },
      operator: '==',
      right: { source: 'fixed', value: '' }
    },
    'AND': {
      type: 'AND',
      conditions: []
    },
    'OR': {
      type: 'OR',
      conditions: []
    },
    'SWITCH': {
      switchKey: '',
      switchValue: 'ON'
    },
    'TIME_RANGE': {
      startField: '',
      endField: ''
    },
    'SET_FIELD': {
      fields: [
        { target: 'params.', operation: 'set', value: '' }
      ]
    },
    'CALL_SQLID': {
      sqlId: '',
      params: {}
    },
    'CALL_BEAN': {
      beanClass: '',
      beanMethod: '',
      params: {}
    },
    'LOG': {
      message: '',
      level: 'info'
    },
    'SEND_MSG': {
      msgType: '',
      receivers: '',
      content: ''
    },
    'RULE_CHAIN': {
      chainRules: [],
      stopOnFail: true
    },
    'PRE_EXEC': {
      id: '',
      items: []
    },
    'END_PASS': {},
    'END_FAIL': {
      block: true,
      message: '',
      errorCode: ''
    }
  }

  // 节点类型到标签的映射
  const labelTemplates = {
    'START': '开始',
    'END_PASS': '通过',
    'END_FAIL': '失败',
    'SQL_QUERY': 'SQL查询',
    'BEAN_CALL': 'Bean调用',
    'EXPR': '表达式',
    'AND': 'AND条件',
    'OR': 'OR条件',
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

  function getDefaultConfig(type) {
    return JSON.parse(JSON.stringify(configTemplates[type] || {}))
  }

  function getLabel(type) {
    return labelTemplates[type] || type
  }

  function createNode(type, x, y) {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      id,
      type,
      label: getLabel(type),
      x,
      y,
      config: getDefaultConfig(type)
    }
  }

  function validateNode(node) {
    const errors = []

    switch (node.type) {
      case 'SQL_QUERY':
        if (!node.config.sqlId) {
          errors.push('请选择SQL')
        }
        if (!node.config.id) {
          errors.push('请输入变量名')
        }
        break
      case 'BEAN_CALL':
        if (!node.config.beanClass) {
          errors.push('请输入Bean类名')
        }
        if (!node.config.beanMethod) {
          errors.push('请输入方法名')
        }
        break
      case 'EXPR':
        if (!node.config.expression) {
          errors.push('请输入表达式')
        }
        break
      case 'AND':
      case 'OR':
        if (!node.config.conditions || node.config.conditions.length === 0) {
          errors.push('请添加至少一个条件')
        }
        break
      case 'RULE_CHAIN':
        if (!node.config.chainRules || node.config.chainRules.length === 0) {
          errors.push('请添加至少一个子规则')
        }
        break
    }

    return errors
  }

  return {
    configTemplates,
    labelTemplates,
    getDefaultConfig,
    getLabel,
    createNode,
    validateNode
  }
}