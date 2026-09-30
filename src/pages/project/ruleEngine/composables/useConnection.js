import { ref } from 'vue'

export function useConnection() {
  const isConnecting = ref(false)
  const tempConnection = ref(null)
  const connectionSourceNode = ref(null)
  const connectionSourcePort = ref(null)

  function startConnection(params) {
    isConnecting.value = true
    connectionSourceNode.value = params.nodeId
    connectionSourcePort.value = params.port
    tempConnection.value = {
      id: `temp_${Date.now()}`,
      sourceNodeId: params.nodeId,
      sourcePort: params.port,
      targetNodeId: null,
      targetPort: 'input'
    }
  }

  function updateTempConnection(targetNodeId, targetPort) {
    if (tempConnection.value) {
      tempConnection.value.targetNodeId = targetNodeId
      tempConnection.value.targetPort = targetPort || 'input'
    }
  }

  function endConnection(nodes, connections, addConnectionFn) {
    if (tempConnection.value && tempConnection.value.targetNodeId) {
      // 完成连接
      addConnectionFn({ ...tempConnection.value })
    }
    resetConnection()
  }

  function resetConnection() {
    isConnecting.value = false
    tempConnection.value = null
    connectionSourceNode.value = null
    connectionSourcePort.value = null
  }

  function getConnectionPath(conn, nodes) {
    const sourceNode = nodes.find(n => n.id === conn.sourceNodeId)
    const targetNode = nodes.find(n => n.id === conn.targetNodeId)
    if (!sourceNode || !targetNode) return ''

    const sourcePos = getPortPosition(sourceNode, conn.sourcePort)
    const targetPos = getPortPosition(targetNode, conn.targetPort)

    const dx = Math.abs(targetPos.x - sourcePos.x) * 0.5
    return `M ${sourcePos.x} ${sourcePos.y}
            C ${sourcePos.x + dx} ${sourcePos.y},
              ${targetPos.x - dx} ${targetPos.y},
              ${targetPos.x} ${targetPos.y}`
  }

  function getPortPosition(node, port) {
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
  }

  return {
    isConnecting,
    tempConnection,
    connectionSourceNode,
    connectionSourcePort,
    startConnection,
    updateTempConnection,
    endConnection,
    resetConnection,
    getConnectionPath,
    getPortPosition
  }
}