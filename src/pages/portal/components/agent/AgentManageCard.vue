<template>
    <!-- 我的智能体 · 通用管理卡（v4.0：从 pages/portal/mine/agents/index.vue 抽出为公共组件）
         设计依据：AI-Agent-Latest-UI-Perfect-HTML/index.html 的 #mine「我的智能体」管理卡
         （manageTemplate 生成的 .card.manage-card / .card-body / .manage-top / .manage-main /
          .manage-name / .type / .status / .manage-desc / .meta.manage-meta / .manage-actions /
          .start / .action + .card:hover / .card:hover .avatar）；
         数值全部沿用设计稿原值（含 .manage-card / .manage-actions 对 .card 的覆盖），一字未改 ——
         仅头像 disc 兜底的纸色与主色借用门户 token（与 AgentCard.vue 同做法的例外），其余不换算门户 token。
         契约：组件不调接口、不弹确认，只回传事件（run / edit / publish / offline / toggle / delete）；
         整卡不挂 click、无 cursor:pointer（点按语义只落在按钮上，卡片语义与 AgentCard 一致）。
         忠实度例外清单见文末 <style> 头部注释。 -->
    <article class="amc-card" :class="{ 'is-busy': busy }" :aria-busy="busy ? 'true' : 'false'">
        <div class="amc-card-body">
            <!-- 顶行（设计稿 .manage-top）：头像 + 标题行（类型标 / 名称 / 状态标），垂直居中；
                 简介已下移为顶行之下、独占整卡宽的一行（见下） -->
            <div class="amc-manage-top">
                <!-- 头像三态（设计稿是 <img>）：image = 图片 ID 铺背景圆章 / icon = 图标类名圆内居中 /
                     disc = 名称首字（设计稿无 disc，登记为自定态） -->
                <span
                    v-if="avatarInfo.kind === 'image'"
                    class="amc-avatar"
                    role="img"
                    :aria-label="displayName + ' 头像'"
                    :style="avatarBgStyle(avatarInfo.value)"
                ></span>
                <span
                    v-else-if="avatarInfo.kind === 'icon'"
                    class="amc-avatar"
                    role="img"
                    :aria-label="displayName + ' 头像'"
                ><i :class="avatarInfo.value" aria-hidden="true"></i></span>
                <span v-else class="amc-avatar" aria-hidden="true">{{ avatarDisc }}</span>

                <!-- 主块只剩标题行（类型标 / 名称 / 状态标），与头像垂直居中对齐 -->
                <div class="amc-manage-main">
                    <div class="amc-manage-name">
                        <span class="amc-type" :class="item.appType === 'workflow' ? 'workflow' : 'standard'">{{ typeLabel }}</span>
                        <h3 :title="displayName">{{ displayName }}</h3>
                        <span class="amc-status" :class="{ draft: item.status !== 'published' }">{{ statusLabel }}</span>
                    </div>
                </div>
            </div>

            <!-- 简介行（顶行之下，独占整卡宽）：恒占三行（定高 59px，第 3 行自动省略）；空值走占位文
                 （与页面 DESC_PLACEHOLDER 同口径，绝不出现 undefined）。
                 仅当简介**实测**被截断（descOverflow）时才出 iView Tooltip 的全文气泡；
                 transfer 开 → 气泡挂到 body，不被卡片 / 栅格裁剪。 -->
            <Tooltip
                class="amc-desc-tooltip"
                :content="descText"
                placement="bottom"
                transfer
                :max-width="260"
                :disabled="!descOverflow"
            >
                <p ref="desc" class="amc-desc">{{ descText }}</p>
            </Tooltip>

            <!-- 元信息行（设计稿 .meta.manage-meta）：◷ 更新时间 + ♙ 使用次数；完整时间走原生 title -->
            <div class="amc-meta" :title="metaTitle">
                <span>◷ {{ metaTime }}</span>
                <span>♙ {{ usageCount }} 次使用</span>
            </div>

            <!-- 操作区：两行 —— 第一行主操作（开始对话独占），第二行管理操作
                 （编辑 / 发布·下线 / 启用·禁用 / 删除）；两行之间一道发丝虚线分隔（页面旧 .ma-act 语汇） -->
            <div class="amc-manage-act">
                <!-- 主操作：与状态解耦，永远可点（设计稿主钮无状态关联）；
                     实际是否可运行、要不要拦截，由父页面决定 -->
                <div class="amc-manage-actions">
                    <button type="button" class="amc-start" title="开始对话" @click="$emit('run', item)">◉ 开始对话</button>
                </div>
                <!-- 管理操作行：与后台 /ai/agent-app 操作列一一对应；发布钮在线时变「下线」（见例外 5） -->
                <div class="amc-manage-actions amc-manage-actions--tools">
                    <button type="button" class="amc-action" title="编辑" @click="$emit('edit', item)">✎<small>编辑</small></button>
                    <button
                        type="button"
                        class="amc-action"
                        :title="online ? '下线' : '发布'"
                        @click="$emit(online ? 'offline' : 'publish', item)"
                    >➤<small>{{ online ? '下线' : '发布' }}</small></button>
                    <button type="button" class="amc-action" :title="toggleLabel" @click="$emit('toggle', item)">◌<small>{{ toggleLabel }}</small></button>
                    <button type="button" class="amc-action amc-action--danger" title="删除" @click="$emit('delete', item)">♧<small>删除</small></button>
                </div>
            </div>
        </div>
    </article>
</template>

<script>
    export default {
        name: 'AgentManageCard',

        props: {
            // 页面已映射好的行：
            // id / name / description / status('published'|'draft'|'disabled') / enabled / appType('standard'|'workflow') /
            // usage / owner / updatedAt / updatedAtFull / avatarKind('image'|'icon'|'disc') / avatarValue / avatarDisc
            item: {
                type: Object,
                required: true
            },
            // 该卡有动作在提交中：整卡降透明 + 按钮不可点（对应页面原 .ma-slot.is-busy 行为）
            busy: {
                type: Boolean,
                default: false
            }
        },

        // 全部管理动作都是父页面职责（组件不调接口、不弹确认，只回传 item）
        emits: ['run', 'edit', 'publish', 'offline', 'toggle', 'delete'],

        data () {
            return {
                // 简介是否**实测**被截断（三行 clamp 撑破 59px 定高）→ 决定 Tooltip 出不出
                descOverflow: false
            }
        },

        computed: {
            displayName () {
                return (this.item && this.item.name) || '未命名智能体'
            },

            // 简介文案（空值走占位文，口径与页面 DESC_PLACEHOLDER 一致）
            descText () {
                return (this.item && this.item.description) || '这个智能体还没有简介'
            },

            // 类型标文案：设计稿短文案（标准 / 工作流），不沿用页面原 typeLabel「标准助手 / 流程助手」
            typeLabel () {
                return this.item && this.item.appType === 'workflow' ? '工作流' : '标准'
            },

            // 状态标：设计稿两态样式映射三态文案（草稿 / 已下线都走 .status.draft 灰）
            statusLabel () {
                const s = this.item && this.item.status
                if (s === 'published') return '● 已发布'
                if (s === 'disabled') return '● 已下线'
                return '● 草稿'
            },

            usageCount () {
                return Number(this.item && this.item.usage) || 0
            },

            // 元信息首项：页面已格式化好的 updatedAt（'' / '-' 归一为 '-'，杜绝 undefined）
            metaTime () {
                const t = this.item && this.item.updatedAt
                return t && t !== '' ? t : '-'
            },

            // 完整时间（原生 title 用；'-' 视为无）
            metaTitle () {
                const t = this.item && this.item.updatedAtFull
                return t && t !== '-' ? t : null
            },

            // 启用·禁用钮文案：enabled 为 false 时是「启用」，其余（含缺字段）为「禁用」
            toggleLabel () {
                return this.item && this.item.enabled === false ? '启用' : '禁用'
            },

            // 在线（可被检索 / 可运行）= 已发布且未停用；在线时发布钮变「下线」（下线即停用，见例外 5）
            online () {
                return !!this.item && this.item.status === 'published' && this.item.enabled !== false
            },

            // 头像三态：优先用页面已算好的 avatarKind / avatarValue；缺失时按 avatar|icon 启发式推导
            avatarInfo () {
                const it = this.item || {}
                if (it.avatarKind) {
                    return {
                        kind: it.avatarKind,
                        value: it.avatarKind === 'disc' ? '' : (it.avatarValue || '')
                    }
                }
                return this.resolveAvatar(it.avatar || it.icon)
            },

            // disc 态首字：优先页面给的 avatarDisc，否则取显示名首字
            avatarDisc () {
                const it = this.item || {}
                return it.avatarDisc || this.displayName.slice(0, 1)
            }
        },

        mounted () {
            // 挂载后测一次溢出，并（若支持）观察 desc（列宽变化会改行数）；
            // 本组件不注册任何 document / 全局事件监听（无副作用）
            this._resizeObserver = null
            this._descEl = null
            this.$nextTick(() => {
                this.measureOverflow()
                this.observeDesc()
            })
        },

        updated () {
            // 重渲染后复测溢出（props / 文案 / 列宽变化）；只更新 descOverflow，不改可见态
            this.$nextTick(() => {
                this.measureOverflow()
                this.observeDesc()
            })
        },

        beforeUnmount () {
            if (this._resizeObserver) {
                this._resizeObserver.disconnect()
                this._resizeObserver = null
            }
            this._descEl = null
        },

        methods: {
            // ---------- 简介溢出实测（照抄 AgentCard.measureOverflow / observeDesc） ----------
            // 「真的超过三行」= 定高 59px 被内容撑破：scrollHeight > clientHeight（留 1px 容差）；
            // 空描述（走占位文）或不足三行 → false，Tooltip 保持 disabled
            measureOverflow () {
                const el = this.$refs.desc
                this.descOverflow = !!el && el.scrollHeight > el.clientHeight + 1
            },

            // 支持 ResizeObserver 则观察 desc（列宽变化会改行数），元素变化时重挂、避免重复 observe；
            // 不支持时不做额外降级：列宽变化仍会触发组件 updated，上面的复测照常发生
            observeDesc () {
                const el = this.$refs.desc
                if (!el || typeof ResizeObserver !== 'function') return
                if (!this._resizeObserver) {
                    this._resizeObserver = new ResizeObserver(() => this.measureOverflow())
                }
                if (this._descEl !== el) {
                    this._descEl = el
                    this._resizeObserver.observe(el)
                }
            },

            // ---------- 头像三态（判别逻辑照抄门户首页 / AgentCard.resolveAvatar） ----------
            // 1) 空 → disc（名称首字）；2) 含空格或图标前缀 → icon（类名直用）；
            // 3) 长度 > 2 → image（图片 ID）；4) 其余短串 → disc，避免空圆章
            resolveAvatar (raw) {
                if (!raw) return { kind: 'disc', value: '' }
                const s = String(raw).trim()
                if (!s) return { kind: 'disc', value: '' }
                if (/\s/.test(s) || /^fa[-\s]/i.test(s) || /^icon/i.test(s) || /^(mdi|bi|ri|pi|ant|el)[-\s]/i.test(s)) {
                    return { kind: 'icon', value: s }
                }
                if (s.length > 2) return { kind: 'image', value: s }
                return { kind: 'disc', value: s }
            },

            // 图片态背景：commonsJs.getBackgroundImage(id, true) + 圆形铺满
            //（commonsJs 为 sharedApp 注册的 app 全局属性，任何组件可用）；额外给纸色底，图片 404 时圆章不至于透明
            avatarBgStyle (id) {
                if (!id) return null
                const bg = this.commonsJs.getBackgroundImage(id, true) || {}
                return Object.assign({}, bg, {
                    backgroundColor: 'var(--c-paper)',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center'
                })
            }
        }
    }
</script>

<style scoped lang="less">
/* ══ 我的智能体 · 管理卡（v4.0：整块自 pages/portal/mine/agents/index.vue 迁入，成为公共管理卡组件）
   结构 = .amc-card > .amc-card-body > [顶行（头像 + 标题行）/ 简介行 / meta 行 / 操作区（主操作行 + 管理操作行）]；
   设计稿数值一律照抄（含 .manage-card 对 .card、.manage-actions .start 对 .start 的覆盖），不换算门户 token；
   仅头像 disc 兜底的纸色（--c-paper）与主色（--c-red-600）借用门户 token —— 与 AgentCard.vue 同做法。
   :before = 设计稿 .card:before 的暖金径向光斑（圆角与卡同步 10px，pointer-events:none）。
   **整卡无 cursor:pointer、不挂 click**；组件不注册任何 document / 全局监听。

   ══ 忠实度例外登记（与设计稿的有意差异，逐条） ══
   1) .action 设计稿 width:25px 装不下「✎编辑」这类图标+文字（给定截图可见文字溢出、竖排顶到相邻按钮）。
      本组件改为 min-width:25px; width:auto; height:25px + padding 0 6px + inline-flex 横排，
      让每个按钮都完整可读；**颜色 / 圆角 / 字号 / hover 一律保持设计稿原值**。
   2) 状态标 3 态：published→● 已发布、draft→● 草稿、disabled→● 已下线；
      设计稿只有 2 态（已发布 / 未发布），样式仍用 .amc-status / .amc-status.draft（草稿与已下线都走 draft 灰）。
   3) 类型标文案用设计稿短文案「标准 / 工作流」（页面原 typeLabel 是「标准助手 / 流程助手」，此处不沿用）。
   4) meta 内容按本项目现有数据：第一项 ◷ 更新时间、第二项 ♙ 使用次数
      （设计稿是「日期 + 作者」，mine 接口作者字段通常为空）。
   5) 「发布 / 下线」：设计稿是「发布 ↔ 取消发布」一对；本项目后端只有 publish（置 published + enabled）
      与 toggle（只切 enabled），没有取消发布接口 —— 故**下线 = 停用**（页面调 toggle(false)），
      按钮文案在线时为「下线」、否则「发布」（图标同为 ➤），事件为 offline / publish。
   6) 简介三行 + Tooltip：设计稿管理卡是两行 / 高 39px、且没有浮层；按用户要求改三行
      （高 59px = 12px × 1.65 × 3，与设计稿广场卡 .desc 同款定高），并**仅在实测被截断时**用
      iView Tooltip 出全文（placement top / transfer 到 body / max-width 260 / 默认暗色气泡）；
      这不是设计稿的 .desc-tip，气泡观感由 ViewUI 主题决定。
      简介已由「顶行主块内」下移为**顶行之下、独占整卡宽的一行**（顶行只剩头像 + 标题行）；
      Tooltip / ref="desc" / descOverflow 实测逻辑原样随元素搬移，行为不变。
   7) 操作区两行 + 发丝分隔：设计稿主钮与 4 个图标钮在同一行；按用户要求拆成
      「开始对话」独占第一行、4 个管理钮第二行，两行之间加 1px dashed rgba(153,42,24,.25)
      （页面旧 .ma-act 的语汇，非设计稿数值）。
   8) 主钮与状态解耦：设计稿主钮本就无状态关联，但本项目 v4.0 初版曾加过「不可运行」的禁用视觉；
      本轮按要求**全部移除**（aria-disabled / title 提示 / 纸色虚线禁用样式 / reduce 里相关项），
      按钮永远可点并一律 emit run —— 实际是否可运行、要不要拦截由父页面决定。
   9) kebab / 更多操作菜单**已按用户要求移除**（暂时用不到，可从 git 历史恢复）：模板里的 ⋮ 按钮
      与抽屉菜单、脚本里的菜单状态 / document 与 $Bus 监听、样式里的 .amc-kebab / .amc-menu* 一并删除。
   10) 卡片 min-height 由设计稿的 154px（= .manage-card 对 .card 202px 的覆盖值）调高到 248px，
      以容纳「顶行 + 三行简介 + 两行操作」，并与工作流 .wf-card（定高 248）/ 知识库 .kb-card（min-height 248）
      三面板等高 —— 切栏时卡片高度不变；height:100% 保留，卡片仍撑满网格单元格。
      卡内内容定高有界（顶行 = 头像 46、简介三行 clamp 59px、名称单行省略、操作两行），
      内容栈合计约 221px（含内衬 20px）< 248，248 恒有余量，故高度恒等于栅格行高，
      不会因内容撑开而与另外两栏不等。

   ══ 结构性对齐（非设计数值改动） ══
   - 头像设计稿是 <img object-fit:cover>，本组件沿用 AgentCard 的 <span> 三态外壳 → object-fit 不适用，
     图片态改用 background 铺满（background-size:cover，avatarBgStyle 提供），语义等价；
     并补 display:grid / place-items:center / overflow:hidden / flex-shrink:0（span 外壳所需，<img> 无需）。
     disc 态 46 圆取 --text-lg(18)、icon 态取 --text-xl(22)：设计稿无此两态，为自定值（登记）。
   - 设计稿全局 *{box-sizing:border-box} / button,input{font:inherit}：本卡在按钮上显式补
     box-sizing:border-box + font-family:inherit 等价复现（宿主无对应全局规则）。
   - .amc-manage-name h3 补 min-width:0（令设计稿的 text-overflow:ellipsis 在 flex 行内真正生效）、
     显式补 font-weight:700（防宿主 h1–h6 重置改变设计稿走 UA 粗体的观感）。
   - .amc-manage-actions 补 flex-wrap:wrap：4 列版心最窄处（约 273px 卡宽）管理行的 4 钮可能略超一行，
     允许换行不撑破卡片；工作台单列（约 353px 卡宽 / ≤996 满栏）下 4 钮实测同排一行，
     即便换行也只多一行约 30px（内容仍 < min-height 248），卡片高度不因此变化。
   - .start 设计稿无 :active，本卡补 --red3 最深档作按下反馈（与 AgentCard 的处理一致）。
   - 设计稿 .desc 的 position:relative 仅为 .desc-tip（卡内简介浮层）定位服务，本卡改用 iView Tooltip，未迁入。
   - 设计稿 #manageGrid 的分页 / 筛选壳、.count、.pager、.manage-search、.card.featured 首卡红边
     均不属单卡，未迁入。 ══ */
.amc-card {
    /* ── 设计稿局部变量（随卡片自包含；原声明在页面 :root）──
       卡片 CSS 实际引用到的只有这三个：--red（.start 底 / .action:hover 变红）、
       --red2（.start:hover 底）、--shadow2（.card:hover 大影）；
       --red3 为设计稿未给的 :active 档，沿用红系最深档（见上方说明）。 ── */
    --red: #a82d1c;
    --red2: #c54228;
    --red3: #8d2417;
    --shadow2: 0 18px 44px rgba(111, 57, 29, .16);

    position: relative;
    height: 100%;
    /* 设计稿 .card min-height:202px 由 .manage-card 154px 覆盖；本轮因三行简介 + 两行操作调到 248px，
       与工作流 .wf-card（定高 248）/ 知识库 .kb-card（min-height 248）三面板取齐（见例外 10）——
       切栏时卡片高度不变。卡内内容定高有界，248 恒有余量，故高度恒等于栅格行高 */
    min-height: 248px;
    border: 1px solid rgba(100, 72, 51, .13);
    border-radius: 10px;
    background: linear-gradient(145deg, rgba(255, 253, 250, .95), rgba(250, 241, 230, .92));
    box-shadow: 0 5px 15px rgba(84, 55, 34, .055);
    overflow: visible;
    transition: transform .32s cubic-bezier(.2, .75, .2, 1), box-shadow .32s, border-color .28s, background .28s;
    will-change: transform;
}

/* 卡片暖金光斑（设计稿 .card:before 原值）：60% 12% 处 rgba(226,190,147,.12) → 35% 处透明 */
.amc-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 10px;
    pointer-events: none;
    background: radial-gradient(circle at 60% 12%, rgba(226, 190, 147, .12), transparent 35%);
}

/* 提交中（对应页面原 .ma-slot.is-busy）：整卡降透明 + 按钮不可点（键盘路径由父页面流程兜底） */
.amc-card.is-busy {
    opacity: .6;
}

.amc-card.is-busy .amc-start,
.amc-card.is-busy .amc-action {
    pointer-events: none;
}

/* 卡体（设计稿 .card-body padding:12px 14px 13px 由 .manage-card .card-body 10px 12px 覆盖 → 取最终值）：
   改为纵向 flex + 满高，配合下方操作区的 margin-top:auto，把操作区压到卡底；
   卡高于内容时多出的高度落在 meta 行与操作区之间的留白（不留生硬的底部空档） */
.amc-card-body {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 10px 12px;
}

/* 顶行（设计稿 .manage-top 原值）：头像 + 标题行，垂直居中（简介已移出本行，见 .amc-desc） */
.amc-manage-top {
    display: flex;
    align-items: center;
    gap: 9px;
}

/* 头像（设计稿 .avatar 62 圆由 .manage-avatar 46 覆盖 → 取 46）：
   描边 / 影 / 过渡为设计稿原值；span 外壳补 grid 居中 / overflow / flex-shrink（见上方结构性对齐） */
.amc-avatar {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    flex-shrink: 0;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, .95);
    border-radius: 50%;
    background: linear-gradient(180deg, #fff8ef, var(--c-paper));
    color: var(--c-red-600);
    font-family: var(--font-display);
    font-size: var(--text-lg);
    line-height: 1;
    box-shadow: 0 5px 13px rgba(60, 43, 31, .14);
    transition: transform .35s cubic-bezier(.2, .8, .2, 1), box-shadow .35s;
}

/* icon 态：随 46 圆取 --text-xl(22)（设计稿无 icon 态，自定值） */
.amc-avatar i {
    font-size: var(--text-xl);
    line-height: 1;
}

/* 主块：顶行内只剩标题行；min-width:0 令内部名称单行省略真正生效，flex:1 吃掉头像余宽 */
.amc-manage-main {
    min-width: 0;
    flex: 1;
}

/* 名称行（设计稿 .manage-name 原值）：类型标 + 名称 + 状态标，单行不换行 */
.amc-manage-name {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
}

/* 名称（设计稿 .manage-name h3 原值：margin 0 / 13px / 单行省略；min-width 与粗体见上方结构性对齐） */
.amc-manage-name h3 {
    min-width: 0;
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 类型标（设计稿 .type 原值）：标准 #bd4c37 / 工作流 #2d6ea7 */
.amc-type {
    padding: 2px 7px;
    border-radius: 7px;
    background: #bd4c37;
    color: #fff;
    font-size: 9px;
    white-space: nowrap;
}

.amc-type.workflow {
    background: #2d6ea7;
}

/* 状态标（设计稿 .status 原值）：已发布绿底绿字；draft = 草稿 / 已下线共用灰档 */
.amc-status {
    padding: 2px 6px;
    border-radius: 8px;
    background: #e8f6ec;
    color: #3b9560;
    font-size: 9px;
    white-space: nowrap;
}

.amc-status.draft {
    background: #f1eee9;
    color: #8e8175;
}

/* Tooltip 外壳（例外 6 的新增件，非设计稿元素）：iView 默认给 .ivu-tooltip / .ivu-tooltip-rel 加
   display:inline-block，包住块级简介会在行内多出基线间隙；这里把两层壳改成块级，
   让简介保持设计稿的块级流排布（只影响外壳，teleport 到 body 的气泡不受影响）。
   简介下移为独立行后本壳即 .amc-card-body 的直接子项（display:block → 占满整卡宽） */
.amc-desc-tooltip {
    display: block;
}

.amc-desc-tooltip :deep(.ivu-tooltip-rel) {
    display: block;
}

/* 简介（设计稿 .desc 12px / 1.65 / #8c8177 + margin-top:6px；高度与行数见例外 6 改为三行 59px）：
   现为 .amc-card-body（纵向 flex）的直接子项 → 顶行之下独占整卡宽的一行；margin-top:6px 即与顶行的间距
   （flex 列内不与上方塌陷）。第 3 行由 -webkit-line-clamp 出省略号；overflow:hidden 同时是「是否被截断」的实测依据 */
.amc-desc {
    margin: 6px 0 0;
    height: 59px;
    color: #8c8177;
    font-size: 12px;
    line-height: 1.65;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* meta（设计稿 .meta gap:14px / #9b9086 / 10px，由 .manage-meta 覆盖 margin:5px 0 7px → 取最终 margin） */
.amc-meta {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 5px 0 7px;
    color: #9b9086;
    font-size: 10px;
}

.amc-meta span {
    white-space: nowrap;
}

/* 操作区（例外 7）：主操作行 + 管理操作行，两行各自一行 flex 排布；
   margin-top:auto 令整组贴卡底（与知识库 .kb-card-act / 工作流操作区同口径） */
.amc-manage-act {
    display: block;
    margin-top: auto;
}

/* 行（设计稿 .manage-actions 原值：flex / align-items center / gap 5px + flex-wrap 见结构性对齐） */
.amc-manage-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
}

/* 管理操作行：与上面的主操作行之间一道发丝虚线（页面旧 .ma-act 语汇 1px dashed rgba(153,42,24,.25)） */
.amc-manage-actions--tools {
    margin-top: 7px;
    padding-top: 7px;
    border-top: 1px dashed rgba(153, 42, 24, .25);
}

/* 主钮（设计稿 .start height:28 / padding 0 14 由 .manage-actions .start 25 / 11 覆盖 → 取最终值） */
.amc-start {
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    height: 25px;
    padding: 0 11px;
    border: 0;
    border-radius: 15px;
    background: var(--red);
    color: #fff;
    font-family: inherit;
    font-size: 11px;
    white-space: nowrap;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(168, 45, 28, .16);
    transition: .2s;
}

/* 主钮按下（设计稿无 :active，取红系最深档，与 AgentCard 一致） */
.amc-start:active {
    background: var(--red3);
}

/* 图标文字钮（设计稿 .action 原值；宽度 / 内距 / inline-flex 横排为例外 1） */
.amc-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    box-sizing: border-box;
    min-width: 25px;
    height: 25px;
    padding: 0 6px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #6f645c;
    font-family: inherit;
    font-size: 11px;
    white-space: nowrap;
    cursor: pointer;
    transition: .18s;
}

/* ══ 动效：hover 反馈（触屏不误触发位移；沿用页面既有约定） ══ */
@media (hover: hover) {
    /* 卡片 hover（设计稿 .card:hover 原值）：上浮 9 + scale 1.012 + --shadow2 大影 + 半透红边 + z 抬升。
       整卡不给 cursor:pointer —— 无整卡 click，光标不谎报可点 */
    .amc-card:hover {
        transform: translate3d(0, -9px, 0) scale(1.012);
        box-shadow: var(--shadow2);
        border-color: rgba(180, 67, 40, .34);
        z-index: 5;
    }

    /* 头像 hover（设计稿 .card:hover .avatar 原值）：上浮 2 + 放大 1.06 + 影加深 rgba(80,46,29,.2) */
    .amc-card:hover .amc-avatar {
        transform: translateY(-2px) scale(1.06);
        box-shadow: 0 9px 18px rgba(80, 46, 29, .2);
    }

    /* 主钮 hover（设计稿 .start:hover 原值）：变色 + 上浮 1 */
    .amc-start:hover {
        background: var(--red2);
        transform: translateY(-1px);
    }

    /* 图标钮 hover（设计稿 .action:hover 原值）：淡红底 + 变红 + 上浮 1 */
    .amc-action:hover {
        background: rgba(168, 45, 28, .08);
        color: var(--red);
        transform: translateY(-1px);
    }

    /* 危险钮 hover（设计稿 .action.danger:hover 原值；位移沿用 .action:hover） */
    .amc-action--danger:hover {
        background: rgba(180, 40, 30, .1);
        color: #bd2b20;
    }
}

/* ══ 动效降级：reduce 直出（照抄 AgentCard 的降级写法） ══ */
@media (prefers-reduced-motion: reduce) {
    .amc-card {
        transition: none;
        will-change: auto;
    }

    .amc-card:hover {
        transform: none;
    }

    .amc-avatar {
        transition: none;
    }

    .amc-card:hover .amc-avatar {
        transform: none;
        transition: none;
    }

    .amc-start,
    .amc-action {
        transition: none;
    }

    .amc-start:hover,
    .amc-action:hover {
        transform: none;
    }
}
</style>
