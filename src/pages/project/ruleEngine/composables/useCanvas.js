import { ref, computed } from 'vue'

export function useCanvas() {
  const nodes = ref([])
  const connections = ref([])
  const selectedNodeId = ref(null)
  const selectedConnectionId = ref(null)
  const zoom = ref(1)
  const canvasRef = ref(null)

  // 历史记录（用于撤销重做）
  const history = ref([])
  const historyIndex = ref(-1)

  const selectedNode = computed(() => {
    return nodes.value.find(n => n.id === selectedNodeId.value)
  })

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  function saveHistory() {
    // 移除当前位置之后的历史
    history.value = history.value.slice(0, historyIndex.value + 1)
    // 添加新历史
    history.value.push({
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      connections: JSON.parse(JSON.stringify(connections.value))
    })
    historyIndex.value = history.value.length - 1
    // 限制历史记录数量
    if (history.value.length > 50) {
      history.value.shift()
      historyIndex.value--
    }
  }

  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--
      const state = history.value[historyIndex.value]
      nodes.value = JSON.parse(JSON.stringify(state.nodes))
      connections.value = JSON.parse(JSON.stringify(state.connections))
    }
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      const state = history.value[historyIndex.value]
      nodes.value = JSON.parse(JSON.stringify(state.nodes))
      connections.value = JSON.parse(JSON.stringify(state.connections))
    }
  }

  function selectNode(nodeId) {
    selectedNodeId.value = nodeId
    selectedConnectionId.value = null
  }

  function selectConnection(connId) {
    selectedConnectionId.value = connId
    selectedNodeId.value = null
  }

  function clearSelection() {
    selectedNodeId.value = null
    selectedConnectionId.value = null
  }

  function addNode(node) {
    nodes.value.push(node)
    saveHistory()
  }

  function updateNode(nodeId, updatedNode) {
    const index = nodes.value.findIndex(n => n.id === nodeId)
    if (index > -1) {
      nodes.value[index] = { ...updatedNode }
      saveHistory()
    }
  }

  function removeNode(nodeId) {
    nodes.value = nodes.value.filter(n => n.id !== nodeId)
    connections.value = connections.value.filter(
      c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
    )
    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null
    }
    saveHistory()
  }

  function addConnection(conn) {
    connections.value.push(conn)
    saveHistory()
  }

  function removeConnection(connId) {
    connections.value = connections.value.filter(c => c.id !== connId)
    if (selectedConnectionId.value === connId) {
      selectedConnectionId.value = null
    }
    saveHistory()
  }

  function clearCanvas() {
    nodes.value = []
    connections.value = []
    selectedNodeId.value = null
    selectedConnectionId.value = null
    saveHistory()
  }

  return {
    // 状态
    nodes,
    connections,
    selectedNodeId,
    selectedConnectionId,
    selectedNode,
    zoom,
    canvasRef,
    canUndo,
    canRedo,
    // 方法
    saveHistory,
    undo,
    redo,
    selectNode,
    selectConnection,
    clearSelection,
    addNode,
    updateNode,
    removeNode,
    addConnection,
    removeConnection,
    clearCanvas
  }
}