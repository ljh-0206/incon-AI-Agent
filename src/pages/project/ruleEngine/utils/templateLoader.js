/**
 * 模板加载器 - 预设规则模板
 */

// 预设模板定义
export const Templates = {
  // 开关判断模板
  SWITCH: {
    type: 'TPL_SWITCH',
    name: '开关判断',
    icon: '🔌',
    description: '判断业务开关是否开启',
    category: 'datasource',
    preExec: [
      {
        id: '开关查询',
        type: 'SQL',
        sqlId: 'SWITCH_QUERY_BY_BIZTYPE',
        params: {
          businessType: { source: 'params', path: 'businessType' }
        }
      }
    ],
    condition: {
      type: 'AND',
      rules: [
        { type: 'EXPR', expr: "${preExec.开关查询.status} == 'ON'" }
      ]
    },
    onFailure: {
      block: true,
      message: '业务开关未开启，请联系管理员开启后再试'
    }
  },

  // 越权判断模板
  AUTH: {
    type: 'TPL_AUTH',
    name: '越权判断',
    icon: '🔒',
    description: '判断用户是否有权操作数据',
    category: 'condition',
    preExec: [
      {
        id: '数据归属查询',
        type: 'SQL',
        sqlId: 'DATA_OWNER_QUERY',
        params: {
          dataId: { source: 'params', path: 'dataId' }
        }
      }
    ],
    condition: {
      type: 'OR',
      rules: [
        { type: 'EXPR', expr: "${preExec.数据归属查询.ownerDept} == '${user.yxdm}'" },
        { type: 'EXPR', expr: "${user.jsdm} == 'ADMIN'" }
      ]
    },
    onFailure: {
      block: true,
      message: '您没有权限操作此数据'
    }
  },

  // 时间范围模板
  TIME_RANGE: {
    type: 'TPL_TIME',
    name: '时间范围',
    icon: '⏰',
    description: '判断当前时间是否在业务时间范围内',
    category: 'condition',
    preExec: [
      {
        id: '时间范围查询',
        type: 'SQL',
        sqlId: 'TIME_RANGE_QUERY',
        params: {
          businessType: { source: 'params', path: 'businessType' }
        }
      }
    ],
    condition: {
      type: 'AND',
      rules: [
        { type: 'EXPR', expr: "${sys.currentTime} >= ${preExec.时间范围查询.startTime}" },
        { type: 'EXPR', expr: "${sys.currentTime} <= ${preExec.时间范围查询.endTime}" }
      ]
    },
    onFailure: {
      block: true,
      message: '当前不在业务允许的时间范围内'
    }
  },

  // 综合业务规则模板
  BIZ_RULE: {
    type: 'TPL_BIZ',
    name: '综合业务规则',
    icon: '⚙️',
    description: '开关 + 时间 + 权限 多条件组合',
    category: 'complex',
    preExec: [
      {
        id: '业务综合查询',
        type: 'SQL',
        sqlId: 'BIZ_RULE_CHECK_QUERY',
        params: {
          businessType: { source: 'params', path: 'businessType' },
          dataId: { source: 'params', path: 'dataId' }
        }
      }
    ],
    condition: {
      type: 'AND',
      rules: [
        { type: 'EXPR', expr: "${preExec.业务综合查询.switchStatus} == 'ON'" },
        { type: 'EXPR', expr: "${sys.currentTime} >= ${preExec.业务综合查询.startTime}" },
        { type: 'EXPR', expr: "${sys.currentTime} <= ${preExec.业务综合查询.endTime}" },
        { type: 'EXPR', expr: "(${preExec.业务综合查询.ownerDept} == '${user.yxdm}' OR '${user.jsdm}' == 'ADMIN')" }
      ]
    },
    onFailure: {
      block: true,
      message: '不满足业务规则，请检查开关、时间范围或权限'
    }
  },

  // SQL动态映射转换模板
  PARAM_SQL: {
    type: 'TPL_PARAM_SQL',
    name: '参数转换',
    subName: 'SQL动态映射',
    icon: '🔄',
    description: '通过SQL查询映射表进行参数转换',
    category: 'action',
    preExec: [
      {
        id: '参数映射查询',
        type: 'SQL',
        sqlId: 'PARAM_MAPPING_QUERY',
        params: {
          originalValue: '${params.status}'
        }
      }
    ],
    condition: {
      type: 'AND',
      rules: [
        { type: 'EXPR', expr: "${preExec.参数映射查询.mappedValue} != null" }
      ]
    },
    actions: [
      {
        type: 'SET_FIELD',
        target: 'params.status',
        value: '${preExec.参数映射查询.mappedValue}'
      }
    ],
    onFailure: {
      block: false,
      message: '未找到参数映射'
    }
  },

  // 固定映射转换模板（简化版：无条件判断）
  PARAM_FIXED: {
    type: 'TPL_PARAM_FIXED',
    name: '参数转换',
    subName: '固定映射',
    icon: '📝',
    description: '使用固定值或表达式进行转换（如 0->OFF, 1->ON）',
    category: 'action',
    actions: [
      {
        type: 'SET_FIELD',
        target: 'params.status',
        value: "${params.status} == '0' ? 'OFF' : 'ON'"
      }
    ]
  },

  // 结果过滤模板（POST规则用：对SQL执行后的result进行过滤）
  RESULT_FILTER: {
    type: 'TPL_RESULT_FILTER',
    name: '结果处理',
    subName: '结果过滤',
    icon: '🔍',
    description: '根据条件过滤SQL查询结果列表',
    category: 'result',
    actions: [
      {
        type: 'FILTER_RESULT',
        expr: "${item.status} == 'ACTIVE'"
      }
    ]
  },

  // 批量设置字段模板（POST规则用：对SQL执行后的result批量设置字段）
  RESULT_BATCH_SET: {
    type: 'TPL_RESULT_BATCH_SET',
    name: '结果处理',
    subName: '批量设置',
    icon: '📝',
    description: '对SQL查询结果列表中每条数据执行字段设置',
    category: 'result',
    actions: [
      {
        type: 'SET_FIELD',
        target: 'result.status',
        value: "'PROCESSED'"
      }
    ]
  }
}

/**
 * 获取所有模板列表
 */
export function getAllTemplates() {
  return Object.values(Templates)
}

/**
 * 根据类型获取模板
 */
export function getTemplate(type) {
  // 先尝试直接通过key查找
  if (Templates[type]) {
    return Templates[type]
  }
  // 再通过type属性查找
  return Object.values(Templates).find(t => t.type === type)
}

/**
 * 获取分类下的模板
 */
export function getTemplatesByCategory(category) {
  return Object.values(Templates).filter(t => t.category === category)
}

/**
 * 将模板转换为画布节点和连接线
 */
export function templateToCanvas(template) {
  const nodes = []
  const connections = []
  let xOffset = 100
  let yOffset = 150

  // 添加 START 节点
  const startNode = {
    id: `START_${Date.now()}`,
    type: 'START',
    label: '开始',
    x: xOffset,
    y: yOffset,
    config: {}
  }
  nodes.push(startNode)
  xOffset += 250

  // 添加preExec节点
  const hasPreExec = template.preExec && Array.isArray(template.preExec) && template.preExec.length > 0
  const hasCondition = template.condition && template.condition.rules?.length > 0
  const hasActions = template.actions && template.actions.length > 0

  if (hasPreExec) {
    template.preExec.forEach((exec, index) => {
      const nodeType = exec.type === 'SQL' ? 'SQL_QUERY' : 'BEAN_CALL'
      const preExecNode = {
        id: `${nodeType}_${Date.now()}_${index}`,
        type: nodeType,
        label: exec.id,
        x: xOffset,
        y: yOffset + index * 80,
        config: {
          id: exec.id,
          sqlId: exec.sqlId,
          beanClass: exec.beanClass,
          beanMethod: exec.beanMethod,
          params: exec.params || {}
        }
      }
      nodes.push(preExecNode)
      // 连接 START 到 preExec
      connections.push({
        id: `conn_start_to_${preExecNode.id}`,
        sourceNodeId: startNode.id,
        sourcePort: 'output',
        targetNodeId: preExecNode.id,
        targetPort: 'input'
      })
    })
    xOffset += 250
  }

  // 添加条件节点
  let condNode = null
  if (hasCondition) {
    condNode = {
      id: `condition_${Date.now()}`,
      type: template.condition.type,
      label: template.condition.type === 'AND' ? 'AND条件' : 'OR条件',
      x: xOffset,
      y: yOffset + 80,
      config: {
        conditions: template.condition.rules.map((r, i) => ({
          id: `cond_${i}`,
          type: r.type,
          expr: r.expr
        }))
      }
    }
    nodes.push(condNode)

    // 连接：START → preExec → condition，如果没有preExec则START直接连condition
    if (hasPreExec) {
      const preExecNodes = nodes.filter(n => n.type === 'SQL_QUERY' || n.type === 'BEAN_CALL')
      preExecNodes.forEach(node => {
        connections.push({
          id: `conn_${node.id}_to_cond`,
          sourceNodeId: node.id,
          sourcePort: 'output',
          targetNodeId: condNode.id,
          targetPort: 'input'
        })
      })
    } else {
      // START 直接连接到 condition
      connections.push({
        id: `conn_start_to_cond`,
        sourceNodeId: startNode.id,
        sourcePort: 'output',
        targetNodeId: condNode.id,
        targetPort: 'input'
      })
    }
    xOffset += 250
  }

  // 添加动作节点（如参数转换）
  if (hasActions) {
    template.actions.forEach((action, index) => {
      // 构建节点配置
      const nodeConfig = {}

      // SET_FIELD 使用新多字段格式
      if (action.type === 'SET_FIELD') {
        // 解析 target 获取 prefix 和 fieldName
        let prefix = 'params.'
        let fieldName = ''
        if (action.target) {
          if (action.target.startsWith('params.')) {
            prefix = 'params.'
            fieldName = action.target.substring(7)
          } else if (action.target.startsWith('result.')) {
            prefix = 'result.'
            fieldName = action.target.substring(8)
          } else if (action.target.startsWith('extra.')) {
            prefix = 'extra.'
            fieldName = action.target.substring(7)
          } else {
            fieldName = action.target
          }
        }
        nodeConfig.fields = [{
          prefix: prefix,
          fieldName: fieldName,
          target: action.target,
          operation: action.operation || 'set',
          value: action.value || ''
        }]
      } else {
        // 其他动作类型保持原样
        Object.assign(nodeConfig, action)
      }

      const actionNode = {
        id: `action_${Date.now()}_${index}`,
        type: action.type,
        label: action.type === 'SET_FIELD' ? '设置字段' : action.type === 'FILTER_RESULT' ? '结果过滤' : action.type,
        x: xOffset,
        y: yOffset + index * 80,
        config: nodeConfig
      }
      nodes.push(actionNode)

      // 连接：如果有condition则从condition连，否则START或preExec直接连
      if (condNode) {
        connections.push({
          id: `conn_cond_to_action_${index}`,
          sourceNodeId: condNode.id,
          sourcePort: 'true',
          targetNodeId: actionNode.id,
          targetPort: 'input'
        })
      } else if (hasPreExec) {
        // 从最后一个preExec节点连接
        const preExecNodes = nodes.filter(n => n.type === 'SQL_QUERY' || n.type === 'BEAN_CALL')
        const lastPreExec = preExecNodes[preExecNodes.length - 1]
        connections.push({
          id: `conn_preexec_to_action_${index}`,
          sourceNodeId: lastPreExec.id,
          sourcePort: 'output',
          targetNodeId: actionNode.id,
          targetPort: 'input'
        })
      } else {
        // START 直接连接到 action
        connections.push({
          id: `conn_start_to_action_${index}`,
          sourceNodeId: startNode.id,
          sourcePort: 'output',
          targetNodeId: actionNode.id,
          targetPort: 'input'
        })
      }
    })
    xOffset += 250
  }

  // 添加失败节点
  if (template.onFailure) {
    nodes.push({
      id: `END_FAIL_${Date.now()}`,
      type: 'END_FAIL',
      label: '失败',
      x: xOffset,
      y: yOffset + 130,
      config: {
        block: template.onFailure.block,
        message: template.onFailure.message
      }
    })

    if (template.condition) {
      const condNode = nodes.find(n => n.type === 'AND' || n.type === 'OR')
      if (condNode) {
        connections.push({
          id: `conn_cond_to_fail`,
          sourceNodeId: condNode.id,
          sourcePort: 'false',
          targetNodeId: nodes[nodes.length - 1].id,
          targetPort: 'input'
        })
      }
    }
  }

  // 添加成功节点
  nodes.push({
    id: `END_PASS_${Date.now()}`,
    type: 'END_PASS',
    label: '通过',
    x: xOffset,
    y: yOffset + 30,
    config: {}
  })

  if (template.actions && template.actions.length > 0) {
    // 如果有动作节点，从最后一个动作节点连接到成功节点
    const actionNodes = nodes.filter(n => n.type === 'SET_FIELD' || n.type === 'CALL_SQLID' || n.type === 'CALL_BEAN' || n.type === 'FILTER_RESULT')
    if (actionNodes.length > 0) {
      const lastActionNode = actionNodes[actionNodes.length - 1]
      connections.push({
        id: `conn_action_to_pass`,
        sourceNodeId: lastActionNode.id,
        sourcePort: 'output',
        targetNodeId: nodes[nodes.length - 1].id,
        targetPort: 'input'
      })
    }
  } else if (template.condition) {
    // 如果没有动作但有条件，从条件节点连接到成功节点
    const condNode = nodes.find(n => n.type === 'AND' || n.type === 'OR')
    if (condNode) {
      connections.push({
        id: `conn_cond_to_pass`,
        sourceNodeId: condNode.id,
        sourcePort: 'true',
        targetNodeId: nodes[nodes.length - 1].id,
        targetPort: 'input'
      })
    }
  } else {
    // 如果没有条件节点，连接 START 到 END_PASS
    connections.push({
      id: `conn_start_to_pass`,
      sourceNodeId: startNode.id,
      sourcePort: 'output',
      targetNodeId: nodes[nodes.length - 1].id,
      targetPort: 'input'
    })
  }

  return { nodes, connections }
}

export default {
  Templates,
  getAllTemplates,
  getTemplate,
  getTemplatesByCategory,
  templateToCanvas
}