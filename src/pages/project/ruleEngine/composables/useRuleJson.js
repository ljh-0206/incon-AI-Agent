import { ref } from 'vue'

export function useRuleJson() {
  const currentJson = ref('')
  const jsonError = ref(null)

  /**
   * 从画布节点和连接线导出JSON格式的规则表达式
   * 直接返回 {nodes, connections} 格式
   */
  function exportCanvasToJson(nodes, connections) {
    return {
      nodes: JSON.parse(JSON.stringify(nodes)),
      connections: JSON.parse(JSON.stringify(connections || []))
    }
  }

  /**
   * 从JSON解析到画布，返回 {nodes, connections}
   */
  function parseJsonToCanvas(jsonStr) {
    jsonError.value = null
    try {
      const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
      const nodes = []
      const connections = []

      // 如果是新格式 {nodes, connections}，直接使用（深拷贝）
      if (data.nodes && Array.isArray(data.nodes)) {
        return {
          nodes: JSON.parse(JSON.stringify(data.nodes)),
          connections: JSON.parse(JSON.stringify(data.connections || []))
        }
      }

      // 旧格式 {preExec, condition} 需要转换
      let xOffset = 100
      let yOffset = 100

      // 解析 preExec
      if (data.preExec && Array.isArray(data.preExec)) {
        data.preExec.forEach((exec, index) => {
          const nodeType = exec.type === 'SQL' ? 'SQL_QUERY' : 'BEAN_CALL'
          const node = {
            id: `${nodeType}_${Date.now()}_${index}`,
            type: nodeType,
            label: exec.id || `数据源${index + 1}`,
            x: xOffset,
            y: yOffset + index * 100,
            config: {
              id: exec.id,
              sqlId: exec.sqlId,
              beanClass: exec.beanClass,
              beanMethod: exec.beanMethod,
              params: exec.params || {}
            }
          }
          nodes.push(node)
        })
        xOffset += 250
      }

      // 解析 condition
      if (data.condition) {
        const condNode = {
          id: `condition_${Date.now()}`,
          type: data.condition.type === 'AND' ? 'AND' : 'OR',
          label: data.condition.type === 'AND' ? 'AND条件' : 'OR条件',
          x: xOffset,
          y: yOffset + 100,
          config: {
            conditions: (data.condition.rules || []).map((r, i) => ({
              id: `cond_${i}`,
              type: 'EXPR',
              expr: r.expr || ''
            }))
          }
        }
        nodes.push(condNode)
        xOffset += 250

        // 创建从preExec到condition的连接
        const preExecNodes = nodes.filter(n => n.type === 'SQL_QUERY' || n.type === 'BEAN_CALL')
        preExecNodes.forEach((node, index) => {
          connections.push({
            id: `conn_${node.id}_to_condition`,
            sourceNodeId: node.id,
            sourcePort: 'output',
            targetNodeId: condNode.id,
            targetPort: 'input'
          })
        })
      }

      // 解析 onFailure
      if (data.onFailure) {
        const failNode = {
          id: `END_FAIL_${Date.now()}`,
          type: 'END_FAIL',
          label: '失败',
          x: xOffset,
          y: yOffset + 150,
          config: {
            block: data.onFailure.block !== false,
            message: data.onFailure.message || '',
            errorCode: data.onFailure.errorCode || ''
          }
        }
        nodes.push(failNode)

        if (data.condition) {
          connections.push({
            id: `conn_condition_to_fail`,
            sourceNodeId: nodes.find(n => n.type === 'AND' || n.type === 'OR').id,
            sourcePort: 'false',
            targetNodeId: failNode.id,
            targetPort: 'input'
          })
        }
      }

      // 添加成功节点
      const passNode = {
        id: `END_PASS_${Date.now()}`,
        type: 'END_PASS',
        label: '通过',
        x: xOffset,
        y: yOffset + 50,
        config: {}
      }
      nodes.push(passNode)

      if (data.condition) {
        connections.push({
          id: `conn_condition_to_pass`,
          sourceNodeId: nodes.find(n => n.type === 'AND' || n.type === 'OR').id,
          sourcePort: 'true',
          targetNodeId: passNode.id,
          targetPort: 'input'
        })
      }

      return { nodes, connections }
    } catch (error) {
      jsonError.value = error.message
      return { nodes: [], connections: [] }
    }
  }

  /**
   * 验证JSON格式
   */
  function validateJson(jsonStr) {
    try {
      JSON.parse(jsonStr)
      jsonError.value = null
      return { valid: true, error: null }
    } catch (error) {
      jsonError.value = error.message
      return { valid: false, error: error.message }
    }
  }

  /**
   * 格式化JSON
   */
  function formatJson(jsonStr) {
    try {
      const obj = JSON.parse(jsonStr)
      return JSON.stringify(obj, null, 2)
    } catch {
      return jsonStr
    }
  }

  return {
    currentJson,
    jsonError,
    exportCanvasToJson,
    parseJsonToCanvas,
    validateJson,
    formatJson
  }
}