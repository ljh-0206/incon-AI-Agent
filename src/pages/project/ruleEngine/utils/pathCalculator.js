/**
 * 连接线路径计算工具
 */

// 节点尺寸
const NODE_WIDTH = 150
const NODE_HEIGHT = 60

// 端口偏移量
const PORT_OFFSET = 8

/**
 * 获取节点端口位置
 * @param {Object} node - 节点对象
 * @param {string} port - 端口类型: input/output/true/false
 * @returns {Object} 端口坐标 {x, y}
 */
export function getPortPosition(node, port) {
  let x = node.x
  let y = node.y

  switch (port) {
    case 'input':
      x = node.x
      y = node.y + NODE_HEIGHT / 2
      break
    case 'output':
      x = node.x + NODE_WIDTH
      y = node.y + NODE_HEIGHT / 2
      break
    case 'true':
      x = node.x + NODE_WIDTH
      y = node.y + NODE_HEIGHT / 3
      break
    case 'false':
      x = node.x + NODE_WIDTH
      y = node.y + (NODE_HEIGHT * 2) / 3
      break
  }

  return { x, y }
}

/**
 * 计算两点之间的贝塞尔曲线路径
 * @param {Object} start - 起点坐标 {x, y}
 * @param {Object} end - 终点坐标 {x, y}
 * @param {number} curvature - 曲率 (0-1)，默认0.5
 * @returns {string} SVG路径字符串
 */
export function getBezierPath(start, end, curvature = 0.5) {
  const dx = Math.abs(end.x - start.x) * curvature
  const dy = Math.abs(end.y - start.y) * 0.1

  return `M ${start.x} ${start.y}
          C ${start.x + dx} ${start.y + dy},
            ${end.x - dx} ${end.y - dy},
            ${end.x} ${end.y}`
}

/**
 * 计算连接线的完整路径
 * @param {Object} conn - 连接线对象
 * @param {Array} nodes - 所有节点数组
 * @param {number} curvature - 曲率
 * @returns {string} SVG路径字符串
 */
export function getConnectionPath(conn, nodes, curvature = 0.5) {
  const sourceNode = nodes.find(n => n.id === conn.sourceNodeId)
  const targetNode = nodes.find(n => n.id === conn.targetNodeId)

  if (!sourceNode || !targetNode) {
    return ''
  }

  const start = getPortPosition(sourceNode, conn.sourcePort)
  const end = getPortPosition(targetNode, conn.targetPort)

  return getBezierPath(start, end, curvature)
}

/**
 * 计算标签位置（连接线中点）
 * @param {Object} conn - 连接线对象
 * @param {Array} nodes - 所有节点数组
 * @returns {Object} 标签坐标 {x, y}
 */
export function getLabelPosition(conn, nodes) {
  const sourceNode = nodes.find(n => n.id === conn.sourceNodeId)
  const targetNode = nodes.find(n => n.id === conn.targetNodeId)

  if (!sourceNode || !targetNode) {
    return { x: 0, y: 0 }
  }

  const start = getPortPosition(sourceNode, conn.sourcePort)
  const end = getPortPosition(targetNode, conn.targetPort)

  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  }
}

/**
 * 计算临时连接线（拖拽中）的路径
 * @param {Object} sourceNode - 源节点
 * @param {string} sourcePort - 源端口
 * @param {number} mouseX - 鼠标X坐标
 * @param {number} mouseY - 鼠标Y坐标
 * @param {number} zoom - 缩放比例
 * @param {number} canvasOffsetX - 画布X偏移
 * @param {number} canvasOffsetY - 画布Y偏移
 * @returns {string} SVG路径字符串
 */
export function getTempPath(sourceNode, sourcePort, mouseX, mouseY, zoom, canvasOffsetX = 0, canvasOffsetY = 0) {
  if (!sourceNode) return ''

  const start = getPortPosition(sourceNode, sourcePort)
  const end = {
    x: (mouseX - canvasOffsetX) / zoom,
    y: (mouseY - canvasOffsetY) / zoom
  }

  return getBezierPath(start, end, 0.5)
}

/**
 * 检测点是否在连接线上
 * @param {number} x - 鼠标X坐标
 * @param {number} y - 鼠标Y坐标
 * @param {Object} conn - 连接线对象
 * @param {Array} nodes - 所有节点数组
 * @param {number} threshold - 检测阈值
 * @returns {boolean}
 */
export function isPointOnConnection(x, y, conn, nodes, threshold = 10) {
  const sourceNode = nodes.find(n => n.id === conn.sourceNodeId)
  const targetNode = nodes.find(n => n.id === conn.targetNodeId)

  if (!sourceNode || !targetNode) return false

  const start = getPortPosition(sourceNode, conn.sourcePort)
  const end = getPortPosition(targetNode, conn.targetPort)

  // 计算点到线段的距离
  const dist = pointToLineDistance(x, y, start.x, start.y, end.x, end.y)
  return dist < threshold
}

/**
 * 计算点到线段的距离
 */
function pointToLineDistance(px, py, x1, y1, x2, y2) {
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  let xx, yy

  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }

  const dx = px - xx
  const dy = py - yy

  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 获取节点边界框
 * @param {Object} node - 节点对象
 * @returns {Object} 边界框 {x1, y1, x2, y2, width, height}
 */
export function getNodeBounds(node) {
  return {
    x1: node.x,
    y1: node.y,
    x2: node.x + NODE_WIDTH,
    y2: node.y + NODE_HEIGHT,
    width: NODE_WIDTH,
    height: NODE_HEIGHT
  }
}

/**
 * 检测节点是否被矩形框选
 * @param {Object} node - 节点对象
 * @param {Object} rect - 矩形框 {x, y, width, height}
 * @returns {boolean}
 */
export function isNodeInRect(node, rect) {
  const bounds = getNodeBounds(node)
  const nodeCenterX = bounds.x1 + bounds.width / 2
  const nodeCenterY = bounds.y1 + bounds.height / 2

  return (
    nodeCenterX >= rect.x &&
    nodeCenterX <= rect.x + rect.width &&
    nodeCenterY >= rect.y &&
    nodeCenterY <= rect.y + rect.height
  )
}

// 兼容旧代码的对象形式调用
export const pathCalculator = {
  NODE_WIDTH,
  NODE_HEIGHT,
  PORT_OFFSET,
  getPortPosition,
  getBezierPath,
  getConnectionPath,
  getLabelPosition,
  getTempPath,
  isPointOnConnection,
  getNodeBounds,
  isNodeInRect,
  calculateBezierPath(start, end) {
    const dx = Math.abs(end.x - start.x) * 0.5
    return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`
  }
}

export default pathCalculator