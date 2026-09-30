<template>
    <!-- 智能体广场 · 通用单卡（v4.0：从 pages/portal/agents/index.vue 抽出为公共组件）
         设计依据：AI-Agent-Latest-UI-Perfect-HTML/index.html 第一套「智能体广场」通用用户卡
         （.card / .card-body / .avatar-row / .avatar / .favorite / h3 / .desc / .meta / .card-footer / .start
          + .card:hover / 收藏 pop）；数值全部沿用页面 v3.0 落定的设计稿原值，一字未改。
         v4.1（本轮，用户明示）：简介的全文浮层改用 View UI Plus <Tooltip> 的**默认效果**——
           不再自算 left/top/width、不再 teleport；位置/主题/延时全交组件默认（不设 placement/theme/delay/
           max-width/transfer）；仅当简介实测溢出（>3 行）才启用（:disabled="!descOverflow"）。
         <Tooltip> 在本仓库全局可用（sharedApp.js 里 app.use(ViewUIPlus) 已注册全部组件），无需局部引入。
         v4.2（本轮，用户明示）：meta 第二项由「流程助手 / 标准助手」类型文案改为**作者**——
           字段 item.cjrxm，前置 <Icon type="md-person" aria-hidden="true" />，作者为空则不渲染；
           原 metaSecond 的 author/creatorName/类型文案回退链整体作废（改由 computed authorName 承担）。
         契约：整卡不挂 click、无 cursor:pointer；收藏 / 进入对话由父页面处理（组件不调接口） -->
    <article class="pg-card">
        <div class="pg-card-body">
            <!-- 头像行（设计稿 .avatar-row，min-height 62 = 头像径 → 行高恒定）；
                 头像三态保留（v1.8 调整 2）——image = 图片 ID 铺背景圆章 / icon = 图标类名圆内居中
                 （均 role=img + aria-label）、disc = 名称首字（装饰 aria-hidden）。
                 三态由本组件按原始 row 派生（页面不再预计算 avatarKind/avatarValue/avatarDisc） -->
            <div class="pg-avatar-row">
                <span
                    v-if="avatar.kind === 'image'"
                    class="pg-avatar"
                    role="img"
                    :aria-label="displayName + ' 头像'"
                    :style="avatarBgStyle(avatar.value)"
                ></span>
                <span
                    v-else-if="avatar.kind === 'icon'"
                    class="pg-avatar"
                    role="img"
                    :aria-label="displayName + ' 头像'"
                ><i :class="avatar.value" aria-hidden="true"></i></span>
                <span v-else class="pg-avatar" aria-hidden="true">{{ avatarDisc }}</span>
                <!-- 收藏（设计稿 .favorite 移到头像行右端）：:class is-on / :aria-pressed / 收藏《名》aria-label /
                     ★☆ 四项契约原样保留；点击只回传 item，写接口由父页面负责 -->
                <button
                    type="button"
                    class="pg-star"
                    :class="{ 'is-on': starred }"
                    :aria-pressed="starred ? 'true' : 'false'"
                    :aria-label="(starred ? '取消收藏《' : '收藏《') + displayName + '》'"
                    @click="$emit('favorite', item)"
                >{{ starred ? '★' : '☆' }}</button>
            </div>
            <!-- 名称（设计稿 h3 15px/1.25 + 左对齐）；锁单行 clamp 防长名撑高 -->
            <h3 class="pg-name">{{ displayName }}</h3>
            <!-- 简介恒占 3 行（设计稿 height:59px）；全文本就在本段落里（line-clamp 只做视觉裁切），AT 仍可读全文。
                 v4.1：改用 <Tooltip> 包住 .pg-desc，位置/主题/延时走 iView 默认（不设任何属性）；
                 :disabled="!descOverflow" = 保留「只有简介实测超过 3 行才展示」的唯一开关——
                 不溢出（含空描述走占位文）时 Tooltip 不出现。Tooltip 仅作展示，内容不参与 tab 序。
                 v4.1 增补：内容改用 #content 插槽（官方「自定义内容」写法，替代 :content 属性）以承载长简介换行；
                 placement 经用户确认保持默认（本仓库 view-ui-plus@1.3.24 默认 bottom）。 -->
            <Tooltip class="pg-desc-host" :disabled="!descOverflow">
                <p ref="desc" class="pg-desc">{{ descText }}</p>
                <template #content>
                    <p class="pg-desc-text">{{ descText }}</p>
                </template>
            </Tooltip>
            <!-- meta（设计稿 .meta）：◷ 创建时间 + 作者（v4.2：原「类型文案（流程助手/标准助手）」已去除；
                 第二项改为作者 cjrxm + md-person 图标，作者为空则不渲染（含原 metaSecond 回退链一并作废）） -->
            <div class="pg-meta">
                <span>◷ {{ formatMetaTime(item.cjsj) }}</span>
                <span v-if="authorName"><Icon type="md-person" aria-hidden="true" /> {{ authorName }}</span>
            </div>
            <!-- 主操作常驻，不依赖 hover（设计稿 .start 胶囊钮，左对齐） -->
            <div class="pg-card-footer">
                <button type="button" class="pg-btn-chat" @click="$emit('run', item)">开始对话 →</button>
            </div>
        </div>
    </article>
</template>

<script>
    export default {
        name: 'AgentCard',

        props: {
            // 单条智能体原始行（id / name / description / avatar|icon / appType / cjsj / cjrxm…）
            item: {
                type: Object,
                required: true
            },
            // 是否已收藏（父页面按收藏集合判定后传入，组件只做展示）
            starred: {
                type: Boolean,
                default: false
            }
        },

        // 收藏 / 进入对话均为父页面职责（组件不调接口）；与 AgentList.vue 的 @open-agent 风格一致
        emits: ['favorite', 'run'],

        data () {
            return {
                // ===== 简介溢出实测（v4.1：仍由本组件实测，作为 <Tooltip> 的 :disabled 开关）=====
                descOverflow: false // 实测：简介是否真的超过 3 行（撑破 59px 定高）
            }
        },

        computed: {
            displayName () {
                return (this.item && this.item.name) || '未命名智能体'
            },

            // 简介文案（空值走占位文；占位文不足 3 行 → 不回溢出、Tooltip 保持 disabled）
            descText () {
                return (this.item && this.item.description) || '这个智能体还没有简介'
            },

            // 头像三态：由原始 row 派生（判别逻辑照抄门户首页 resolveAvatar）
            avatar () {
                return this.resolveAvatar(this.item && (this.item.avatar || this.item.icon))
            },

            // disc 态圆章首字（与显示名一致）
            avatarDisc () {
                return this.displayName.slice(0, 1)
            },

            // 作者名（v4.2：meta 第二项）——只取 item.cjrxm，去首尾空白；空 / null / undefined → ''
            //（不再回退 author / creatorName，也不再回落「流程助手 / 标准助手」类型文案；空则不渲染该 span）
            authorName () {
                const raw = this.item && this.item.cjrxm
                return raw ? String(raw).trim() : ''
            }
        },

        mounted () {
            this._resizeObserver = null
            this._descEl = null
            // 挂载后测一次溢出，并（若支持）观察 desc（列宽变化会改行数）
            this.$nextTick(() => {
                this.measureOverflow()
                this.observeDesc()
            })
            // 回落：不支持 ResizeObserver 时，窗口尺寸变化后重新实测（只复测、不定位——位置由 Tooltip 负责）
            window.addEventListener('resize', this.onWindowResize)
        },

        updated () {
            // 重渲染后复测溢出（props / 文案 / 列宽变化）；descOverflow 直接驱动 <Tooltip> 的 :disabled
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
            window.removeEventListener('resize', this.onWindowResize)
        },

        methods: {
            // ---------- 头像三态（v1.8 调整 2：判别逻辑照抄门户首页 resolveAvatar；v4.0 从页面迁入） ----------
            // 后端 avatar 无类型字段，按形态启发式判别：
            //   1) 空 / undefined → kind 'disc'（模板回落名称首字）；
            //   2) 含空格，或以 fa-/fa /icon（及 mdi、bi、ri、pi、ant、el 等前缀）开头 → kind 'icon'（类名直用）；
            //   3) 其余且长度 > 2 → kind 'image'（图片 ID，短串不当 ID）；
            //   4) 长度 ≤ 2 的非图标串（如旧单字 avatar）→ kind 'disc'，避免空圆章。
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
            },

            // meta 时间（设计稿「◷ 时间」→ YYYY-MM-DD HH:mm）：后端 cjsj 是 Jackson 默认 ISO-8601 序列化
            //（如 2026-09-21T06:59:59.000+00:00），new Date 可解析并落到本地时区，按需补零；
            // 空值回 '-'、非法日期回落原串（与既有 formatTime「解析失败返回原串」兜底口径一致）
            formatMetaTime (t) {
                if (!t) return '-'
                const d = new Date(t)
                if (isNaN(d.getTime())) return String(t)
                const p = n => (n < 10 ? '0' + n : '' + n)
                return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
                    ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
            },

            // （v4.2 删）metaSecond(item)：旧实现先取 author/creatorName、否则回落「流程助手 / 标准助手」
            // 类型文案。用户要求去掉该类型文案、meta 第二项改展示作者 cjrxm，此回退链整体作废；
            // 现由 computed authorName 承担（只认 cjrxm，空则不渲染）。

            // ---------- 简介溢出实测（v4.1：只判定、不定位；结果驱动 Tooltip 的 :disabled） ----------
            hasDesc () {
                return !!(this.item && this.item.description)
            },

            // 「真的超过 3 行」= 定高 59px 被内容撑破：scrollHeight > clientHeight（留 1px 容差）；
            // 空描述（走占位文）或不足 3 行 → false → <Tooltip :disabled> 生效、不展示
            measureOverflow () {
                const el = this.$refs.desc
                this.descOverflow = this.hasDesc() && !!el &&
                    el.scrollHeight > el.clientHeight + 1
            },

            // 支持 ResizeObserver 则观察 desc（列宽变化会改行数），元素变化时重挂、避免重复 observe；
            // 不支持时退回 window 的 resize 监听（见 onWindowResize）
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

            // 窗口尺寸变化：重新实测一次（不支持 ResizeObserver 时的回落路径；只复测，不涉及定位）
            onWindowResize () {
                this.measureOverflow()
            }
        }
    }
</script>

<style scoped lang="less">
/* ══ 卡片（v4.0：整块自 pages/portal/agents/index.vue 迁入，成为公共单卡组件；数值 = v3.0 落定的设计稿原值，一字未改）
   结构 = .pg-card > .pg-card-body > [头像行 / 名称 / 简介（由 <Tooltip> 包裹）/ meta / 按钮行]。
   **整卡无 cursor:pointer、不挂 click**（§3.6 整卡语义不变）；主操作 = 底部常驻「开始对话」。
   :before = 设计稿 .card:before 的暖金径向光斑（圆角与卡同步 10px，pointer-events:none）══ */
.pg-card {
    /* ── 设计稿局部变量（随卡片自包含；原声明在页面 .pg-wrap，v4.0 一并迁入本组件作用域）──
       设计稿 :root 那批里，卡片 CSS **实际引用到的**只有这 4 个：
         --red     = .start 主按钮常态底 / .favorite:hover 变红；
         --red2    = .start:hover 底；
         --red3    = .pg-btn-chat:active 底（设计稿未给 active，沿用红系最深档）；
         --shadow2 = .card:hover 大影。
       其余（--paper*、--ink、--muted、--line、--gold、--green、--blue、--shadow）卡片并未引用，未随迁（页面侧同批删除）。
       本组件样式不依赖 .pg-wrap 作用域的任何变量（只吃门户全局 token：--c-*／--font-display／--text-*／--tracking-wide）。 */
    --red: #a82d1c;
    --red2: #c54228;
    --red3: #8d2417;
    --shadow2: 0 18px 44px rgba(111, 57, 29, .16);

    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 202px;
    border: 1px solid rgba(100, 72, 51, .13);
    border-radius: 10px;
    background: linear-gradient(145deg, rgba(255, 253, 250, .95), rgba(250, 241, 230, .92));
    box-shadow: 0 5px 15px rgba(84, 55, 34, .055);
    overflow: visible;
    transition: transform .32s cubic-bezier(.2, .75, .2, 1), box-shadow .32s, border-color .28s, background .28s;
    will-change: transform;
}

/* 卡片暖金光斑（设计稿 .card:before 原值）：60% 12% 处 rgba(226,190,147,.12) → 35% 处透明 */
.pg-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 10px;
    pointer-events: none;
    background: radial-gradient(circle at 60% 12%, rgba(226, 190, 147, .12), transparent 35%);
}

/* 说明：设计稿 .card.featured「首卡红边高亮」在 v4.0 按用户要求移除（模板不再加类），
   选中 / 强调只由 hover 提供（见文末 @media (hover: hover) 的红边 + 抬升）。 */

/* 卡体（设计稿 .card-body padding 原值 12px 14px 13px）；
   flex:1 让 body 撑满卡，块级排版使 h3 / meta 外距按设计稿直接生效 */
.pg-card-body {
    flex: 1;
    padding: 12px 14px 13px;
}

/* 头像行（设计稿 .avatar-row）：min-height 62 = 头像径 → 行高恒 62；两端对齐 = 左头像 / 右收藏钮 */
.pg-avatar-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 62px;
}

/* ══ 头像（设计稿 .avatar 62 圆；描边 / 影 / 过渡为设计稿原值）：
   62×62 / border 2px solid rgba(255,255,255,.95) / border-radius 50% / 影 0 5px 13px rgba(60,43,31,.14) /
   transition transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s。
   设计稿是 <img object-fit:cover>，本组件是 <span> 三态外壳 → object-fit 不适用，图片态改用
   background 铺满（background-size:cover，avatarBgStyle 提供），语义等价。
   disc 首字 --text-xl(22)：设计稿无 disc 态，沿用页面既有 62 圆比例（登记在案）═══ */
.pg-avatar {
    display: grid;
    place-items: center;
    width: 62px;
    height: 62px;
    flex-shrink: 0;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, .95);
    border-radius: 50%;
    background: linear-gradient(180deg, #fff8ef, var(--c-paper));
    color: var(--c-red-600);
    font-family: var(--font-display);
    font-size: var(--text-xl);
    line-height: 1;
    box-shadow: 0 5px 13px rgba(60, 43, 31, .14);
    transition: transform .35s cubic-bezier(.2, .8, .2, 1), box-shadow .35s;
}

/* icon 态：随 62 圆放大一档 */
.pg-avatar i {
    font-size: var(--text-2xl);
    line-height: 1;
}

/* 收藏钮（设计稿 .favorite，位于头像行右端；全部回设计稿原值）：
   32×32 / border-radius 50% / background rgba(255,255,255,.5) / color #a77b67 / font-size 18px / transition .22s。
   :class is-on / :aria-pressed / 收藏《名》aria-label 三项契约原样保留（点击由父页面接管）。
   a11y 登记：32px 触点 < 44px，按「100% 还原设计稿」采用 32；常态 #a77b67 on 半透白底对比约 3.0:1，同样按还原登记 */
.pg-star {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, .5);
    color: #a77b67;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    transition: .22s;
}

/* 已收藏（设计稿 .favorite.active）：红字 #bd2c1b + 一次性 pop 反馈（设计稿原值、原名） */
.pg-star.is-on {
    color: #bd2c1b;
    animation: pop .34s ease;
}

/* 设计稿 @keyframes pop：.75 → 1.2（65%）→ 1，.34s ease 原值（scoped 会为关键帧名加作用域后缀，不与他处串味） */
@keyframes pop {
    0% { transform: scale(.75); }
    65% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

/* 名称（设计稿 h3：15px / 行高 1.25 / margin 10 0 6 / 左对齐）；锁单行 clamp 防长名撑高 → 卡高恒定 */
.pg-name {
    margin: 10px 0 6px;
    font-family: var(--font-display);
    font-size: 15px;
    line-height: 1.25;
    font-weight: 700;
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* 简介（设计稿 .desc 原值）：12px / 行高 1.65 / **height:59px** / 色 #8c8177 / 3 行 clamp。
   定高 59 与骨架逐像素等高；3 行行盒 59.4 多出的 0.4 由 overflow 裁掉（与设计稿同款表现）。
   margin:0（v4.1 复查）：宿主 .ivu-tooltip/.ivu-tooltip-rel 均无外距，段落外距保持 0，
   间距沿用「名称 mb6 + 描述 + meta mt7」，与迁卡前一致。
   颜色对比度登记：按「100% 还原设计稿」取设计稿灰 #8c8177，12px 灰字对暖白卡面约 3.6:1，低于 AA，偏离已登记 */
.pg-desc {
    margin: 0;
    color: #8c8177;
    font-size: 12px;
    line-height: 1.65;
    height: 59px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* ══ 简介宿主的布局守护（v4.1，本轮最重要的验收点）══
   变更记录 v4.1：简介的全文浮层改用 View UI Plus <Tooltip> 的默认效果（用户明示「位置还原 / 用 iview 组件 / 默认效果」）：
     · 原 v4.0 的自定义实现（<Teleport to="body"> + JS 计算 left/top/width + .pg-desc-tip 样式 + mouseenter/
       mouseleave/scroll/resize 定位 + requestAnimationFrame 节流）**整段作废**，位置回归 Tooltip 默认；
     · 仅当简介实测溢出（scrollHeight > clientHeight + 1，即 >3 行）才启用，由 :disabled="!descOverflow" 控制。
   `.pg-card` 的总高 241.75px（边框2 + body 12+13 + 头像行62 + 名称10+18.75+6 + 描述59 + meta 7+15+9 + 按钮28）
   是广场页骨架 .pg-sk-* 与 --pg-card-h 的取值依据，描述段必须仍然只占 59px。
   改用 <Tooltip> 后，iView 会把 slot 包进它自己的两层宿主（见 view-ui-plus/src/styles/components/tooltip.less）：
     .ivu-tooltip     { display: inline-block }
     .ivu-tooltip-rel { display: inline-block; position: relative; width: inherit }
   内联外壳进了 .pg-card-body 的 flex 列后，inline-block 的基线/行盒会给卡体添出行高（数 px），
   卡高就不再等于 241.75。故把两层宿主钉成块级：
     · .ivu-tooltip 作为 flex 项本已被 blockify，这里显式 block 双保险；
     · .ivu-tooltip-rel 必须转 block —— 去掉行盒后其高度恰等于 .pg-desc 的 59px。
   （Tooltip 弹出的浮层是 display:none 的兄弟节点，不占高；其视觉/动画全部由 iView 自带样式负责。） */
.pg-desc-host {
    display: block;
}

.pg-desc-host :deep(.ivu-tooltip-rel) {
    display: block;
}

/* Tooltip 内容自定义（v4.1 增补，用户要求用官方 #content 插槽承载长简介）：
   iView 默认 `.ivu-tooltip-inner{ max-width:250px; min-height:34px; padding:8px 12px; white-space:nowrap }`
   —— nowrap 会被内层插槽文本继承，长简介会渲染成一条不换行的长条。此处**只覆盖换行行为**：
   在插槽 `<p>` 上置 `white-space: normal`，让继承链在插槽层被改写，文本按 250px 内宽正常折行；
   宽度仍受内层 250px 约束（不设 max-width 属性——那会启用库自带的 -with-width 类，不是用户要的插槽自定义路线）。
   皮肤 / 位置 / 延时 / 主题全部保持 iView 默认；`<p>` 是块级、独立成行，符合文档「多行」语义。
   兼容性取舍：`word-break: break-word`（老内核友好）+ `overflow-wrap: break-word`（标准）并用，
   保证连串长英文/数字也不撑破 250px；不引入 `word-break: break-all`（会在任意字符间断，中文阅读更差）。 */
.pg-desc-text {
    margin: 0;
    white-space: normal;
    word-break: break-word;
    overflow-wrap: break-word;
}

/* meta（设计稿 .meta 原值）：flex / align-items center / gap 14px / 色 #9b9086 / 10px / margin 7 0 9。
   行高设计稿未给 → 显式 1.5（行盒 15px）供骨架等高取值（登记为自定项）；灰字对比度偏离已登记 */
.pg-meta {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 7px 0 9px;
    font-size: 10px;
    line-height: 1.5;
    color: #9b9086;
}

.pg-meta span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
}

/* 时间项不收缩：窄卡下优先保住 ◷ 时间，次项（作者）让位截断 */
.pg-meta span:first-child {
    flex-shrink: 0;
}

/* 作者项（v4.2）：md-person 图标与作者名的间距/基线微调。只作用于第二项里的图标，
   不动 .pg-meta 设计稿原值（gap/色/字号/行高/外距）与 .pg-meta span（ellipsis / min-width:0）；
   -1px 为 10px 字号下与文字视觉对齐的微调（非设计稿值，登记在案） */
.pg-meta span:last-child .ivu-icon {
    margin-right: var(--s1);
    vertical-align: -1px;
}

/* 按钮行（设计稿 .card-footer）：左对齐——space-between 单子项即贴左；无分割线、无自身内距
   （左右内距由 .pg-card-body 的 14px 承担） */
.pg-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

/* 主操作（设计稿 .start 原值）：height 28px / border-radius 15px / padding 0 14px / background var(--red) /
   color #fff / font-size 11px / 影 0 4px 10px rgba(168,45,28,.16) / transition .2s；hover 变色（--red2）留基础规则。
   文案「开始对话 →」不变、点击只回传 item（父页面 goRun）。
   **a11y 登记**：28px 触点在 44px 之下，按「100% 还原设计稿」采用 28（与 .pg-star 32px 同属已登记让位）；
   整卡仍无 cursor:pointer、不挂 click（§3.6 不变） */
.pg-btn-chat {
    height: 28px;
    padding: 0 14px;
    border: 0;
    border-radius: 15px;
    background: var(--red);
    color: #fff;
    font-family: var(--font-display);
    font-size: 11px;
    letter-spacing: var(--tracking-wide);
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(168, 45, 28, .16);
    transition: .2s;
}

.pg-btn-chat:hover {
    background: var(--red2);
}

.pg-btn-chat:active {
    background: var(--red3);
    transform: none;
}

/* ══ 动效：hover / press 反馈（触屏不误触发位移）══
   设计稿 .card:hover / .card:hover .avatar / .favorite:hover / .start:hover 的位移类项统一收在此媒体查询内
   （沿用页面既有约定）。简介浮层自 v4.1 起由 <Tooltip> 自己负责显隐与动画，此处不再有相关规则 */
@media (hover: hover) {
    /* 卡片 hover（设计稿 .card:hover 原值）：上浮 9 + scale 1.012 + --shadow2 大影 + 半透红边 + z 抬升。
       整卡不给 cursor:pointer——无整卡 click，光标不谎报可点（§3.6 整卡语义不变） */
    .pg-card:hover {
        transform: translate3d(0, -9px, 0) scale(1.012);
        box-shadow: var(--shadow2);
        border-color: rgba(180, 67, 40, .34);
        z-index: 5;
    }

    /* 头像 hover（设计稿 .card:hover .avatar 原值）：上浮 2 + 放大 1.06 + 影加深 rgba(80,46,29,.2) */
    .pg-card:hover .pg-avatar {
        transform: translateY(-2px) scale(1.06);
        box-shadow: 0 9px 18px rgba(80, 46, 29, .2);
    }

    /* 收藏 hover（设计稿 .favorite:hover 原值）：白底 #fff + 变红 var(--red) + scale(1.1) rotate(-7deg) */
    .pg-star:hover {
        background: #fff;
        color: var(--red);
        transform: scale(1.1) rotate(-7deg);
    }

    /* 主按钮 hover 上浮（设计稿 .start:hover 的 transform 项；变色在基础规则里） */
    .pg-btn-chat:hover {
        transform: translateY(-1px);
    }
}

/* ══ 动效降级：reduce 直出 ══ */
@media (prefers-reduced-motion: reduce) {
    /* 卡片 hover 位移 / 头像缩放与曲线 / 收藏 pop / 按钮上浮 全部关停；过渡一律 none（状态变化瞬时生效，不留运动）。
       简介浮层的动画自 v4.1 起由 iView <Tooltip> 自带样式负责，不再由本组件降级 */
    .pg-card {
        transition: none;
        will-change: auto;
    }

    .pg-card:hover {
        transform: none;
    }

    .pg-avatar {
        transition: none;
    }

    .pg-card:hover .pg-avatar {
        transform: none;
        transition: none;
    }

    .pg-star,
    .pg-btn-chat {
        transition: none;
    }

    .pg-star:hover,
    .pg-btn-chat:hover {
        transform: none;
    }

    /* 收藏 pop（设计稿 @keyframes pop）一次性反馈关停 */
    .pg-star.is-on {
        animation: none;
    }
}
</style>
