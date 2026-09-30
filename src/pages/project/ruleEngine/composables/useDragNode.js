import { ref } from 'vue'

export function useDragNode() {
  const isDragging = ref(false)
  const draggedNodeType = ref(null)
  const dragOffset = ref({ x: 0, y: 0 })

  function startDrag(nodeType) {
    isDragging.value = true
    draggedNodeType.value = nodeType
  }

  function endDrag() {
    isDragging.value = false
    draggedNodeType.value = null
    dragOffset.value = { x: 0, y: 0 }
  }

  function setDragOffset(offset) {
    dragOffset.value = offset
  }

  function getDraggedType() {
    return draggedNodeType.value
  }

  return {
    isDragging,
    draggedNodeType,
    dragOffset,
    startDrag,
    endDrag,
    setDragOffset,
    getDraggedType
  }
}