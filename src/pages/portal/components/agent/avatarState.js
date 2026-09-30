// ═══════════════════════════════════════════════════════════════════════════
// 智能体头像三态（本任务新增，仅 AgentChat.vue / AgentAppRunCore.vue 复用）
//
// 用途：对话头「封面印章」与消息列表里的智能体头像，都按后端 app 行的 avatar
//       字段渲染，规则与智能体广场卡 AgentCard.vue **完全一致**；两处原先各写一份
//       判别逻辑易走样，故抽成这里的纯函数（无组件依赖、无状态），各自 import。
//
// 三态口径（逐行照抄 AgentCard.resolveAvatar / avatarBgStyle，未改判定）：
//   1) 空 / 全空白            → kind 'disc'（模板回退「AI」两字母圆章）
//   2) 含空格，或以 fa-/fa /icon（及 mdi|bi|ri|pi|ant|el）前缀开头 → kind 'icon'（类名直用 <i :class>）
//   3) 其余且长度 > 2          → kind 'image'（图片 ID，短串不当 ID）
//   4) 长度 ≤ 2 的非图标串     → kind 'disc'（避免空圆章）
// 说明：displayName 不参与判定——本任务两处都是「智能体头像」，disc 态固定回退
//       「AI」两字母（用户上一轮确认的默认头像），故不取名称首字（与广场卡不同点仅此）。
// ═══════════════════════════════════════════════════════════════════════════

// disc / 空值回退文案：圆章内固定「AI」两字母（字号字重由各组件圆尺寸侧自理）
export const AVATAR_DISC_TEXT = 'AI'

// 头像三态判定：raw 为后端 avatar（或 icon）原串
export function resolveAvatar (raw) {
    if (!raw) return { kind: 'disc', value: '' }
    const s = String(raw).trim()
    if (!s) return { kind: 'disc', value: '' }
    if (/\s/.test(s) || /^fa[-\s]/i.test(s) || /^icon/i.test(s) || /^(mdi|bi|ri|pi|ant|el)[-\s]/i.test(s)) {
        return { kind: 'icon', value: s }
    }
    if (s.length > 2) return { kind: 'image', value: s }
    return { kind: 'disc', value: s }
}

// 图片态背景：commonsJs.getBackgroundImage(id, true) + 圆形铺满
//（commonsJs 为 sharedApp 注册的 app 全局属性，故由调用方传入 this.commonsJs；
//  额外给纸色底，图片 404 时圆章不至于透明——同 AgentCard.avatarBgStyle）
export function avatarBgStyle (commonsJs, id) {
    if (!id) return null
    if (!commonsJs || typeof commonsJs.getBackgroundImage !== 'function') return null
    const bg = commonsJs.getBackgroundImage(id, true) || {}
    return Object.assign({}, bg, {
        backgroundColor: 'var(--c-paper)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
    })
}
