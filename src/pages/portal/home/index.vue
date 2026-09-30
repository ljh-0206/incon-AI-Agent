<template>
    <!-- v3 主题正式首页：四屏分屏 + v3 交互契约（原设计稿 js/v3.js 已删除）；主题层与顶栏由 PortalLayout 持有 -->
    <div class="portal-v3-home">
        <a class="skip-link" href="#panel-home">跳到主要内容</a>

        <!-- 通用壳（顶栏 / 主导航 / 用户下拉）与 v3 主题层由 /portal 一级壳（PortalShell）渲染；
             顶栏实底态原先由本页 :solid="index !== 0" 传入，现改为经 portalShell 注入回传（见 syncSolid） -->

            <!-- 右侧分屏圆点导航 -->
            <nav class="dots-nav" id="dots-nav" aria-label="分屏导航">
                <button
                    v-for="d in dots"
                    :key="'dot-' + d.go"
                    type="button"
                    :data-go="d.go"
                    :data-tone="d.tone"
                    :class="{ 'is-active': index === d.go }"
                    :aria-label="d.aria"
                    :aria-current="index === d.go ? 'true' : 'false'"
                >
                    <span class="label">{{ d.label }}</span><span class="dot" aria-hidden="true"></span>
                </button>
            </nav>

            <main class="stage" id="stage">
                <div class="stage-track" id="stage-track" :style="trackStyle">

                    <!-- ═ 0 · 首屏剧场（分页器底部居中，避开右侧导航） ═ -->
                    <section class="panel panel-banner is-active" id="panel-banner" data-tone="dark" aria-label="焦点">
                        <div class="slides" id="slides">
                            <div
                                v-for="(s, i) in slides"
                                :key="'slide-' + i"
                                class="slide"
                                :class="{ 'is-active': slideIndex === i }"
                            >
                                <div class="slide-bg" :style="{ backgroundImage: s.bg }"></div>
                                <div class="slide-shade"></div>
                                <div class="slide-art" aria-hidden="true">
                                    <div class="mountain"></div>
                                    <div class="rings"><span></span><span></span><span></span></div>
                                </div>
                                <div class="slide-copy">
                                    <div class="kicker">{{ s.kicker }}</div>
                                    <h1>{{ s.title }}</h1>
                                    <p>{{ s.text }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- 底部横排分页 + 受众链，远离右侧 dots-nav -->
                        <div class="banner-bottom">
                            <div class="banner-links">
                                <a v-for="l in bannerLinks" :key="'blink-' + l.label" href="#" :data-go="l.go" @click="onBannerLink(l, $event)">{{ l.label }}</a>
                            </div>
                            <div class="bullets bullets--footer" id="bullets" role="tablist" aria-label="焦点图">
                                <button
                                    v-for="(s, i) in slides"
                                    :key="'bullet-' + i"
                                    type="button"
                                    :class="{ 'is-active': slideIndex === i }"
                                    role="tab"
                                    :aria-selected="slideIndex === i ? 'true' : 'false'"
                                    @click="onBullet(i)"
                                >{{ s.bullet }}</button>
                            </div>
                        </div>
                    </section>

                    <!-- ═ 1 · 上段搜索 + 下段我的三栏目（合一屏，上下两段） ═
                         登录态由 computed.isLoggedIn 判定：未登录给 .is-guest（只留上段搜索并整屏居中） -->
                    <section class="panel panel-light panel-home" id="panel-home" data-tone="light" aria-label="问候与我的内容">
                        <div class="panel-scroll">
                            <div class="panel-inner home-stack" :class="{ 'is-guest': !isLoggedIn }">
                                <div class="home-top">
                                    <div class="panel-head effect">
                                        <h1 class="greet">{{ greetText }}</h1>
                                        <p class="greet-sub">今天想让 AI 帮你做什么？</p>
                                    </div>
                                    <!-- 搜索独立成行：占满上段整行宽度，与问候语、热词各占一行（原 quick-ribbon 快捷动作区已整体下线） -->
                                    <form class="search-row effect" data-delay="1" id="search-form" role="search" @submit="onSearchSubmit">
                                        <label class="sr-only" for="search-input">搜索 AI 助手</label>
                                        <input
                                            id="search-input"
                                            v-model="searchWord"
                                            name="q"
                                            type="search"
                                            autocomplete="off"
                                            placeholder="搜索 AI 助手，例如「论文润色」「出题」"
                                        />
                                        <button type="submit">检索</button>
                                    </form>
                                    <div v-if="hotWords.length" class="hot-words effect" data-delay="2">
                                        <span>大家在搜</span>
                                        <a
                                            v-for="w in hotWords"
                                            :key="'hot-' + w"
                                            href="#"
                                            :data-hot="w"
                                            @click="onHotClick($event, w)"
                                        >{{ w }}</a>
                                    </div>
                                </div>

                                <!-- 未登录（!isLoggedIn）整体不渲染「我的」段：tab 行 / 入口 / 卡片一并隐藏 -->
                                <div v-if="isLoggedIn" class="home-mine effect" data-delay="1">
                                    <!-- tab 行即该栏栏头（原「我的」主标题 + 行内 ◈ 已下线）：两端各一枚装饰 ◈ 夹住
                                         「智能体 / 工作流 / 知识库」，居中排布（hover 切换，点击/键盘同样可用），
                                         选中态仍为墨色加粗 + 朱红下划线；只换内容区，本行不动 -->
                                    <div class="mine-tabs-row channel-title">
                                        <!-- 两端 ◈ 放在 tablist 之外（tablist 内只允许 tab 子节点），纯视觉分隔、不进无障碍树 -->
                                        <span class="sep" aria-hidden="true">◈</span>
                                        <div class="mine-tabs" role="tablist" aria-label="我的栏目" @keydown="onMineTabKey">
                                            <button
                                                v-for="t in mineTabs"
                                                :key="'mtab-' + t.key"
                                                :id="'mtab-' + t.key"
                                                type="button"
                                                role="tab"
                                                class="channel-title mine-tab"
                                                :class="{ 'is-active': mineTab === t.key }"
                                                :aria-selected="mineTab === t.key ? 'true' : 'false'"
                                                aria-controls="mine-body"
                                                :tabindex="mineTab === t.key ? 0 : -1"
                                                @mouseenter="mineTab = t.key"
                                                @focus="mineTab = t.key"
                                                @click="mineTab = t.key"
                                            >{{ t.name }}</button>
                                        </div>
                                        <span class="sep" aria-hidden="true">◈</span>
                                    </div>
                                    <!-- 入口随当前类别切换：智能体「管理 →」/ 工作流、知识库「更多 →」；
                                         落在 tab 行下方、内容区之上并右对齐，从属于当前类别内容 -->
                                    <div class="mine-more">
                                        <a class="channel-link" href="#" @click.prevent="goMineTabLink">{{ mineTabCfg.linkText }}</a>
                                    </div>
                                    <!-- 当前类别的卡片列表：共享同一卡片骨架，仅内容与图标区分 -->
                                    <div class="mine-body" id="mine-body" role="tabpanel" :aria-labelledby="'mtab-' + mineTab">
                                        <!-- 我的智能体：沿用 .fav-seal 圆章卡，最多 6 张；不足 6 张时末位补「添加智能体」（见 loadFavList） -->
                                        <div v-if="mineTab === 'agent'" class="fav-row">
                                            <button
                                                v-for="(f, i) in favList"
                                                :key="'fav-' + i"
                                                type="button"
                                                class="fav-seal"
                                                :class="{ add: f.add }"
                                                @click="onFavClick(f)"
                                            >
                                                <!-- 头像三态：图片 ID → 背景圆章；图标类名 → 圆章内居中 <i>；否则名称首字兜底 -->
                                                <span
                                                    v-if="f.avatarKind === 'image'"
                                                    class="disc"
                                                    role="img"
                                                    :aria-label="f.name + ' 头像'"
                                                    :style="avatarBgStyle(f.avatar)"
                                                ></span>
                                                <span
                                                    v-else-if="f.avatarKind === 'icon'"
                                                    class="disc"
                                                    role="img"
                                                    :aria-label="f.name + ' 头像'"
                                                ><i :class="f.avatar" aria-hidden="true"></i></span>
                                                <span v-else class="disc">{{ f.disc }}</span>
                                                <span class="name">{{ f.name }}</span>
                                            </button>
                                            <p v-if="!favList.length" class="mine-empty">
                                                暂无智能体 <a href="#" @click.prevent="goAgentCreate">去创建 →</a>
                                            </p>
                                        </div>

                                        <!-- 我的工作流：名称 / 状态 / 节点数 / 更新时间；整卡点击 → 流程列表页（不进编辑器） -->
                                        <div v-else-if="mineTab === 'workflow'" class="mine-cards">
                                            <button
                                                v-for="w in workflows"
                                                :key="'wf-' + w.id"
                                                type="button"
                                                class="mine-card"
                                                @click="goWorkflows"
                                            >
                                                <span class="mine-card-ic" aria-hidden="true"><i class="fa-solid fa-diagram-project"></i></span>
                                                <span class="mine-card-main">
                                                    <span class="mine-card-top">
                                                        <span class="mine-card-name">{{ w.name }}</span>
                                                        <em class="mine-pill" :class="'is-' + w.status">{{ w.statusText }}</em>
                                                    </span>
                                                    <span class="mine-card-meta">
                                                        <span class="mine-card-sub">{{ w.nodeCount }} 个节点</span>
                                                        <span class="mine-card-date">更新 {{ w.updatedAt }}</span>
                                                    </span>
                                                </span>
                                            </button>
                                            <p v-if="!workflows.length" class="mine-empty">
                                                暂无工作流 <a href="#" @click.prevent="goWorkflowCreate">去创建 →</a>
                                            </p>
                                        </div>

                                        <!-- 我的知识库：名称 / 状态 / 简介 / 创建时间；整卡点击 → 知识库列表页 -->
                                        <div v-else class="mine-cards">
                                            <button
                                                v-for="k in kbList"
                                                :key="'kb-' + k.id"
                                                type="button"
                                                class="mine-card"
                                                @click="goKbList"
                                            >
                                                <span class="mine-card-ic" aria-hidden="true"><i class="fa-solid fa-book-open"></i></span>
                                                <span class="mine-card-main">
                                                    <span class="mine-card-top">
                                                        <span class="mine-card-name">{{ k.name }}</span>
                                                        <em class="mine-pill" :class="'is-' + k.status">{{ k.statusText }}</em>
                                                    </span>
                                                    <span class="mine-card-meta">
                                                        <span class="mine-card-sub">{{ k.summary }}</span>
                                                        <span class="mine-card-date">{{ k.date }}</span>
                                                    </span>
                                                </span>
                                            </button>
                                            <p v-if="!kbList.length" class="mine-empty">
                                                暂无知识库 <a href="#" @click.prevent="goKbList">去创建 →</a>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- ═ 2 · 大家都在用 ═ -->
                    <section class="panel panel-light" id="panel-hot" data-tone="light" aria-label="大家都在用">
                        <div class="panel-scroll">
                            <div class="panel-inner">
                                <div class="panel-head effect">
                                    <div class="channel-title">大家<span class="sep" aria-hidden="true">◈</span>都在用</div>
                                    <p class="channel-text">聚焦校园高频智能体</p>
                                    <a class="channel-link" href="#" @click.prevent="goAgents">查看全部 →</a>
                                </div>
                                <div class="news-list effect" data-delay="1">
                                    <article v-for="(item, i) in newsList" :key="'news-' + i" class="news-item">
                                        <!-- 缩略图头像三态（同「我的智能体」圆章卡）：图片 → avatarBgStyle 铺满；图标 → 居中 <i>；否则名称首字 + 四色渐变兜底 -->
                                        <div
                                            class="news-thumb"
                                            aria-hidden="true"
                                            :style="item.avatarKind === 'image' ? avatarBgStyle(item.avatar) : null"
                                        >
                                            <i v-if="item.avatarKind === 'icon'" :class="item.avatar" class="thumb-icon"></i>
                                            <span v-else class="glyph">{{ item.glyph }}</span>
                                        </div>
                                        <div class="news-body">
                                            <h3>{{ item.name }} <span :class="['tag', { flow: item.flow }]">{{ item.tag }}</span></h3>
                                            <p>{{ item.desc }}</p>
                                            <div class="news-meta">{{ item.meta }}</div>
                                        </div>
                                        <!-- 右列仅「开始对话」，随 grid align-items 垂直居中 -->
                                        <div class="news-act">
                                            <button type="button" class="btn-chat" @click="onRunAgent(item)">开始对话</button>
                                        </div>
                                        <!-- 收藏：单图标绝对定位卡片右上角（避开左侧缩略图） -->
                                        <button
                                            type="button"
                                            class="star"
                                            :class="{ 'is-on': item.starred }"
                                            :aria-label="item.starred ? '取消收藏' : '收藏'"
                                            @click="toggleStar(item)"
                                        >{{ item.starred ? '★' : '☆' }}</button>
                                    </article>
                                    <p v-if="!newsList.length" class="news-empty">暂无推荐智能体</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- ═ 3 · 合并末屏：能力光谱（上）+ 按用途（下）+ 页脚（底） ═ -->
                    <section class="panel panel-light panel-combo" id="panel-spectrum" data-tone="light" aria-label="能力与用途">
                        <div class="panel-scroll" style="display:flex;flex-direction:column">
                            <div class="panel-inner" style="flex:1">
                                <!-- 合并屏唯一栏目头 -->
                                <div class="panel-head effect">
                                    <div class="channel-title">能力<span class="sep" aria-hidden="true">◈</span>用途</div>
                                    <p class="channel-text">模型 · 知识库 · 智能体 · 工作流 · 对话</p>
                                </div>
                                <div class="combo-split">
                                    <!-- 上：能力光谱舞台 -->
                                    <div
                                        class="spectrum-stage effect"
                                        data-delay="1"
                                        id="spectrum-stage"
                                        ref="spectrumStage"
                                        @mousemove="onStageMove"
                                        @mouseleave="onStageLeave"
                                    >
                                        <div class="spectrum-arc" aria-hidden="true" ref="spectrumArc"></div>
                                        <button
                                            v-for="n in spectrumNodes"
                                            :key="'node-' + n.name"
                                            type="button"
                                            class="spectrum-node"
                                            :class="{ 'is-hot': hotNodeName === n.name }"
                                            :style="{ left: n.left, top: n.top }"
                                            :data-name="n.name"
                                            :data-desc="n.desc"
                                            @mouseenter="onNodeEnter"
                                            @focus="onNodeEnter"
                                            @click="onNodeEnter"
                                            @mouseleave="onNodeLeave"
                                            @blur="onNodeLeave"
                                        >{{ n.name }}<small>{{ n.en }}</small></button>
                                        <!-- 默认态不显示提示；悬停/聚焦节点时展示名称与说明 -->
                                        <div class="spectrum-tip" id="spectrum-tip" ref="spectrumTip" v-show="spectrumTipName">
                                            <strong>{{ spectrumTipName }}</strong> · {{ spectrumTipDesc }}
                                        </div>
                                    </div>

                                    <!-- 下：按用途丝带 -->
                                    <div class="ribbon-track effect" data-delay="2">
                                        <button
                                            v-for="r in ribbonList"
                                            :key="'rib-' + r.name"
                                            type="button"
                                            class="ribbon-item"
                                            @click="onRibbon(r)"
                                        >{{ r.name }}<small>{{ r.sub }}</small></button>
                                    </div>
                                </div>
                            </div>
                            <!-- 页脚：共享组件 PortalFooter（margin-top:auto 把它钉到最后一屏底部） -->
                            <PortalFooter class="panel-footer-bar" />
                        </div>
                    </section>

                </div>
            </main>
    </div>
</template>

<script>
    import PortalFooter from '../components/PortalFooter.vue'
    // 未登录（游客）时受限操作（收藏 / 开始对话）统一唤起门户登录弹窗
    // （全局状态，弹窗由门户壳 PortalLayout 渲染；见 loginModalState.js）
    import { openLoginModal } from '../components/loginModalState'
    import { mapState } from 'vuex'
    import Setting from '@/setting'
    import { agentAppPublished, agentAppMine, agentAppFavorite, agentAppUnfavorite } from '@/api/agentApp'
    import { workflowList } from '@/api/workflow'
    import { kbListPage } from '@/api/kb'

    // 工作流状态文案（与 WorkflowList.vue 的 STATUS_LABEL 对齐）
    const FLOW_STATUS_TEXT = { enabled: '已启用', disabled: '已停用', draft: '草稿' }
    // 知识库状态文案（KbList.vue 仅 enabled / disabled 两态）
    const KB_STATUS_TEXT = { enabled: '启用', disabled: '停用' }

    export default {
        name: 'PortalV3Home',

        components: {
            PortalFooter
        },

        // 门户壳接口（/portal 一级壳 PortalShell 提供）：顶栏实底态随分屏 index 回传
        inject: {
            portalShell: { default: null }
        },

        data () {
            return {
                // ===== 分屏状态 =====
                index: 0, // 当前屏 0-3
                panelTotal: 4, // 总屏数
                lock: false, // 切屏节流锁
                LOCK_MS: 750, // 节流时长（说明书 §4）
                touchStartY: 0, // 触摸起点 Y

                // ===== SQL ID 常量（留空 = 跳过后端低代码接口，改走下方真实数据源或内置静态内容）=====
                bannerSqlid: '', // TODO: 待后台菜单/功能表配置真实 sqlid（Banner 3 帧）
                favListSqlid: '', // 我的智能体；留空时改走 agentAppMine()，配置后优先走低代码 SQL
                newsListSqlid: '', // 留空时「大家都在用」改走 agentAppPublished()；配置后优先走低代码 SQL
                ribbonListSqlid: '', // TODO: 待后台菜单/功能表配置真实 sqlid（按用途）
                spectrumSqlid: '', // TODO: 待后台菜单/功能表配置真实 sqlid（能力光谱）

                // ===== 屏 0 · Banner 演示数据（3 帧）=====
                slideIndex: 0,
                slides: [
                    {
                        bg: 'linear-gradient(135deg,#5c1a10 0%,#992a18 40%,#c45c2a 100%)',
                        kicker: '智能体服务门户',
                        title: '守正创新 · 智启教学',
                        text: '配置 · 编排 · 对话',
                        bullet: '壹'
                    },
                    {
                        bg: 'linear-gradient(135deg,#1e3a2f 0%,#2e5a4a 45%,#992a18 100%)',
                        kicker: '知识增强 · RAG',
                        title: '有据可依 · 答有所本',
                        text: '知识库 / 文档 / 切片',
                        bullet: '贰'
                    },
                    {
                        bg: 'linear-gradient(135deg,#3a2040 0%,#5a2e6e 50%,#992a18 100%)',
                        kicker: '工作流编排',
                        title: '节点成章 · 流程可复用',
                        text: '可视化拖拽 · AI 生成',
                        bullet: '叁'
                    }
                ],

                // ===== 屏 1 · 问候 + 我的三栏目 =====
                searchWord: '',
                // 「大家在搜」：复用智能体列表前 4 条名称（见 syncHotWordsFromNews）；列表为空时整块隐藏
                hotWords: [],
                // 我的三栏目：tab 行（智能体 / 工作流 / 知识库，两端 ◈ 装饰、居中排布，
                // 该行即栏头，原「我的」主标题已下线）+ 随类别切换的入口（tab 行下方右对齐；hover / 点击 / 键盘切换，见 onMineTabKey）
                // 入口目标改为「我的工作台」对应栏目（/portal/mine?tab=…，左导航 + 右内嵌同构），
                // 不再指向独立的 /portal/mine/agents、/portal/workflows、/portal/kb 列表页
                mineTabs: [
                    { key: 'agent', name: '智能体', linkText: '管理 →', path: '/portal/mine?tab=agents' },
                    { key: 'workflow', name: '工作流', linkText: '更多 →', path: '/portal/mine?tab=workflows' },
                    { key: 'kb', name: '知识库', linkText: '更多 →', path: '/portal/mine?tab=kb' }
                ],
                mineTab: 'agent',
                // 「我的」三栏目数据只请求一次（仅登录后触发，见 watch.isLoggedIn / loadMineData）
                mineLoaded: false,
                // 我的智能体：登录后由 loadFavList 装载；不足 6 个时末位补「添加智能体」；失败或空返回时保持空态
                favList: [],
                // 我的工作流：登录后由 loadWorkflows 装载（字段同映射）；失败或空返回时保持空态
                workflows: [],
                // 我的知识库：登录后由 loadKb 装载（字段同映射）；失败或空返回时保持空态
                kbList: [],

                // ===== 屏 3 · 能力光谱演示数据（5 节点）=====
                spectrumNodes: [
                    { name: '模型', desc: '多供应商网关，统一出入口与调用日志', en: 'LLM', left: '12%', top: '58%' },
                    { name: '知识库', desc: '文档切片与 RAG 注入，回答可溯源', en: 'RAG', left: '31%', top: '36%' },
                    { name: '智能体', desc: '提示词 · 头像 · 欢迎词 · 逐字回复', en: 'APP', left: '50%', top: '28%' },
                    { name: '工作流', desc: '节点编排 · AI 生成 · 执行历史', en: 'FLOW', left: '69%', top: '36%' },
                    { name: '对话', desc: '发布后即刻运行，支持思考过程透出', en: 'CHAT', left: '88%', top: '58%' }
                ],
                spectrumTipName: '',
                spectrumTipDesc: '',
                hotNodeName: '',

                // ===== 屏 2 · 大家都在用 =====
                // 大家都在用：由 loadNewsList 装载；失败或空返回时保持空态（面板内展示空态文案）
                newsList: [],

                // ===== 屏 3 · 按用途 + 页脚演示数据（与能力光谱合并末屏）=====
                ribbonList: [
                    { name: '教学备课', sub: '导学案 · 课件提纲' },
                    { name: '科研写作', sub: '润色 · 综述 · 翻译' },
                    { name: '办公文书', sub: '通知 · 纪要 · 函件' },
                    { name: '学生学习', sub: '答疑 · 出题 · 复习' },
                    { name: '数据分析', sub: '表格 · 统计 · 报告' }
                ],

                // ===== 分屏导航数据 =====
                // 智能体广场列表页路由（/portal/agents 注册在 src/router/portal.js；
                // 顶栏导航已迁入 PortalLayout）
                agentsListPath: '/portal/agents',
                dots: [
                    { go: 0, label: '首屏', aria: '首屏', tone: 'dark' },
                    { go: 1, label: '问候', aria: '问候与我的内容', tone: 'light' },
                    { go: 2, label: '推荐', aria: '大家都在用', tone: 'light' },
                    { go: 3, label: '能力与用途', aria: '能力与用途', tone: 'light' }
                ],
                bannerLinks: [
                    // auth:true = 需登录（未登录点它改唤起登录弹窗，见 onBannerLink），
                    // 登录态则滚动到「问候 + 我的三栏目」段
                    { label: '我的智能体', go: 1, auth: true },
                    // 与顶栏同一动作：跳智能体列表页（兼容路由已挂到新 agent 模块）
                    { label: '智能体广场', action: 'plaza' },
                    { label: '能力与用途', go: 3 }
                ]
            }
        },

        computed: {
            // 用户信息：响应式读取 store（同 PortalLayout 的 mapState 写法）。
            // 说明：store 恢复（admin/account/load）晚于本组件挂载，computed 会在数据晚到后自动回填
            ...mapState('admin/user', ['info']),

            // 登录态：主信号与路由守卫同一口径（src/router/index.js beforeEach：
            // localStorage.getItem('token_' + Setting.xmid) 存在且 !== 'undefined'），
            // store 用户信息作兜底（logout 时 token 与 info 同步清空，两者不会互相矛盾）。
            // 未登录 → 不渲染「我的」段（模板 v-if）、不发三栏目请求（watch.isLoggedIn）
            isLoggedIn () {
                let token = ''
                try {
                    token = localStorage.getItem('token_' + Setting.xmid) || ''
                } catch (e) {
                    token = ''
                }
                if (token && token !== 'undefined') return true
                const info = this.info || {}
                // 兜底需有真实用户标识，避免残留空对象被判为已登录
                return !!(info && typeof info === 'object' && (info.id || info.xm))
            },

            // 分屏位移：恒为分屏切换
            trackStyle () {
                return { transform: 'translateY(' + (-this.index * 100) + 'vh)' }
            },

            // 问候语：登录态读 store 用户名（姓氏 + 老师）；未登录给访客问候语，
            // 登录但无姓名时给中性问候「您好，下午好」，绝不回落「张老师」这类编造姓名
            greetText () {
                if (!this.isLoggedIn) return '您好，欢迎来到赢科智能体平台'
                let xm = ''
                try {
                    xm = (this.$store && this.$store.state.admin.user.info && this.$store.state.admin.user.info.xm) || ''
                } catch (e) {
                    xm = ''
                }
                if (!xm) return '您好，下午好'
                return String(xm).charAt(0) + '老师，下午好'
            },

            // 当前选中栏目（入口行文案随类别切换：管理 → / 更多 →，位于 tab 行下方右对齐）
            mineTabCfg () {
                return this.mineTabs.find(t => t.key === this.mineTab) || this.mineTabs[0]
            }
        },

        // 登录态 → 「我的」三栏目数据：immediate 先按挂载时的 token 判一次；
        // 刷新时 store 用户信息晚于挂载（App.vue 的 account/load），isLoggedIn 由 false 翻 true 时再补一次。
        // 未登录时 handler 不执行 → loadFavList / loadWorkflows / loadKb 全程不发请求
        watch: {
            isLoggedIn: {
                immediate: true,
                handler (val) {
                    if (val) this.loadMineData()
                }
            },
            // 分屏切换 → 顶栏实底态回传门户壳（等价于改造前的 :solid="index !== 0"）
            index () {
                this.syncSolid()
            }
        },

        mounted () {
            // 定时器与绑定句柄（非响应式，deactivated / beforeUnmount 统一清理）
            this._bannerTimer = null
            this._lockTimer = null
            this._bound = false // 页级监听/body 类的绑定态标志（幂等，见 activatePortal）
            // 事件句柄只创建一次，keep-alive 复用同一批引用，保证解绑精确且幂等
            this._handlers = {
                wheel: this.onWheel.bind(this),
                touchstart: this.onTouchStart.bind(this),
                touchend: this.onTouchEnd.bind(this),
                keydown: this.onKeyDown.bind(this),
                click: this.onClickGo.bind(this)
            }

            // 首次进入即激活：绑定页级监听 + 挂 body 专属类 + 同步分屏态 + 启动轮播
            this.activatePortal()

            // 数据：设计类内置静态内容（Banner / 按用途 / 能力光谱）+ 记录类真实接口 + 预留 commonsJs 调用位（sqlid 为空则跳过）
            // 「我的」三栏目（loadFavList / loadWorkflows / loadKb）改由 watch.isLoggedIn 触发：
            // 未登录时不发请求；已登录时 watch 的 immediate 已在挂载前执行过，此处不重复调用
            this.loadBannerList()
            this.loadNewsList()
            this.loadRibbonList()
            this.loadSpectrum()
        },

        // ---------- keep-alive 生命周期 ----------
        // 首次进入 mounted 只触发一次；此后离开/返回只触发 deactivated / activated。
        // 故页级监听与 body 类迁移到 activatePortal / deactivatePortal：
        //   离开时释放监听，否则在其它页仍会劫持滚轮翻屏 / 方向键；
        //   离开时移除 body 类，否则残留 overflow 锁定导致其它页无法滚动。
        // 组件实例与内部滚动容器、分屏 index 均被 keep-alive 保留，返回即复原浏览位置。
        activated () {
            // mounted 已激活时此处幂等（_bound 为 true 直接返回）
            this.activatePortal()
        },

        deactivated () {
            this.deactivatePortal()
        },

        beforeUnmount () {
            // 双保险：正常 keep-alive 流程已由 deactivated 释放；
            // 真正销毁（缓存被清理 / 应用卸载）时再兜底一次（activate/deactivate 均幂等）
            this.deactivatePortal()
            // 清除定时器
            this.stopAutoplay()
            if (this._lockTimer) {
                clearTimeout(this._lockTimer)
                this._lockTimer = null
            }
            this._handlers = null
        },

        methods: {
            // ---------- keep-alive：页级监听的绑定 / 释放（幂等，双保险）----------
            // 绑定 window 监听、$el 点击委托、body 专属类与轮播；重复调用无副作用
            activatePortal () {
                if (this._bound) return
                const h = this._handlers
                if (!h || !this.$el) return
                window.addEventListener('wheel', h.wheel, { passive: false })
                window.addEventListener('touchstart', h.touchstart, { passive: true })
                window.addEventListener('touchend', h.touchend, { passive: true })
                window.addEventListener('keydown', h.keydown)
                this.$el.addEventListener('click', h.click)
                // body.page-portal-v3 类的挂载/卸载由 PortalLayout 持有；
                // 本页另挂首页专属类 page-portal-home（100vh 分屏的 overflow 锁定按页生效）
                document.body.classList.add('page-portal-home')
                this._bound = true
                // 顶栏实底态回传（壳在 /portal 父路由，本页无法再以 prop 传入）
                this.syncSolid()
                this.syncEffects()
                this.startAutoplay()
            },

            // 释放页级监听、移除 body 专属类并停掉轮播；未绑定/重复调用均无害
            deactivatePortal () {
                if (!this._bound) return
                const h = this._handlers
                if (h) {
                    window.removeEventListener('wheel', h.wheel)
                    window.removeEventListener('touchstart', h.touchstart)
                    window.removeEventListener('touchend', h.touchend)
                    window.removeEventListener('keydown', h.keydown)
                    if (this.$el && this.$el.removeEventListener) {
                        this.$el.removeEventListener('click', h.click)
                    }
                }
                document.body.classList.remove('page-portal-home')
                this.stopAutoplay()
                this._bound = false
            },

            // 顶栏实底态回传门户壳：首屏（index === 0）透明，其余屏实底。
            // 脱离门户壳（如被单独挂载预览）时静默跳过，不报错。
            syncSolid () {
                const shell = this.portalShell
                if (shell && typeof shell.setSolid === 'function') shell.setSolid(this.index !== 0)
            },

            // ---------- 动效偏好 ----------
            reduceMotion () {
                if (window.matchMedia) {
                    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
                }
                return false
            },

            // 同步当前屏状态：panel is-active + 入场 .effect.isView
            syncEffects () {
                if (!this.$el || !this.$el.querySelectorAll) return
                const panels = this.$el.querySelectorAll('.panel')
                panels.forEach((p, i) => {
                    p.classList.toggle('is-active', i === this.index)
                    if (i === this.index) {
                        p.querySelectorAll('.effect').forEach(el => el.classList.add('isView'))
                    }
                })
            },

            // ---------- 分屏 ----------
            go (i) {
                const target = Math.max(0, Math.min(this.panelTotal - 1, i))
                if (target === this.index || this.lock) return
                this.lock = true
                this.index = target
                this.syncEffects()
                if (this._lockTimer) clearTimeout(this._lockTimer)
                this._lockTimer = setTimeout(() => {
                    this.lock = false
                    this._lockTimer = null
                }, this.LOCK_MS)
            },

            next () {
                this.go(this.index + 1)
            },

            prev () {
                this.go(this.index - 1)
            },

            // 滚轮：|deltaY| > 4 翻屏；由内向外检查指针下的可滚动层
            // （.mine-body 内滚区 → .panel-scroll），任一层未滚到对应端就不劫持、先让它自己滚
            onWheel (e) {
                const panels = this.$el.querySelectorAll('.panel')
                const panel = panels[this.index]
                if (panel) {
                    const inside = e.target && panel.contains(e.target)
                    let node = inside ? e.target : panel.querySelector('.panel-scroll')
                    while (node && panel.contains(node)) {
                        const ov = window.getComputedStyle(node).overflowY
                        if ((ov === 'auto' || ov === 'scroll') && node.scrollHeight > node.clientHeight + 4) {
                            const atTop = node.scrollTop <= 0
                            const atEnd = node.scrollTop + node.clientHeight >= node.scrollHeight - 2
                            if (e.deltaY > 0 && !atEnd) return
                            if (e.deltaY < 0 && !atTop) return
                        }
                        node = node.parentElement
                    }
                }
                e.preventDefault()
                if (this.lock) return
                if (e.deltaY > 4) this.next()
                else if (e.deltaY < -4) this.prev()
            },

            onTouchStart (e) {
                if (!e.touches || !e.touches.length) return
                this.touchStartY = e.touches[0].clientY
            },

            // 触摸：|dy| ≥ 40 切屏
            onTouchEnd (e) {
                if (!e.changedTouches || !e.changedTouches.length) return
                const dy = this.touchStartY - e.changedTouches[0].clientY
                if (Math.abs(dy) < 40) return
                if (dy > 0) this.next()
                else this.prev()
            },

            // 键盘：Arrow / Page / Home / End（输入态不劫持；Esc 关下拉由 PortalLayout 处理）
            onKeyDown (e) {
                if (e.ctrlKey || e.metaKey || e.altKey) return
                const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : ''
                if (tag === 'input' || tag === 'textarea' || tag === 'select') return
                if (e.key === 'ArrowDown' || e.key === 'PageDown') {
                    e.preventDefault()
                    this.next()
                } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                    e.preventDefault()
                    this.prev()
                } else if (e.key === 'Home') {
                    e.preventDefault()
                    this.go(0)
                } else if (e.key === 'End') {
                    e.preventDefault()
                    this.go(this.panelTotal - 1)
                }
            },

            // 委托点击：dots-nav / banner-links 等 [data-go] 统一切屏
            onClickGo (e) {
                const t = e.target && e.target.closest ? e.target.closest('[data-go]') : null
                if (!t || !this.$el.contains(t)) return
                e.preventDefault()
                this.go(Number(t.getAttribute('data-go')))
            },

            // 首屏受众链点击：智能体广场与顶栏同一动作语义（顶栏在 PortalLayout 内）。
            // 「我的智能体」（auth 标记项）需登录：未登录不发跳转、唤起登录弹窗并 stopPropagation，
            // 否则事件继续冒泡到 $el 的 [data-go] 委托处理器、仍会滚到（游客无内容的）「我的」段
            onBannerLink (l, e) {
                if (!l) return
                if (l.action === 'plaza') {
                    e.preventDefault()
                    this.goPlaza()
                    return
                }
                if (l.auth && !this.isLoggedIn) {
                    e.preventDefault()
                    e.stopPropagation()
                    openLoginModal('/portal/mine')
                }
            },

            // 跳转智能体列表展示页；
            // /portal/agents 已注册（src/router/portal.js），直接跳转
            goPlaza () {
                this.$router.push(this.agentsListPath)
            },

            // ---------- Banner 轮播 ----------
            goSlide (i) {
                if (!this.slides.length) return
                this.slideIndex = (i + this.slides.length) % this.slides.length
            },

            startAutoplay () {
                this.stopAutoplay()
                if (this.reduceMotion()) return // reduceMotion 时不自动播
                this._bannerTimer = setInterval(() => {
                    this.goSlide(this.slideIndex + 1)
                }, 5000)
            },

            stopAutoplay () {
                if (this._bannerTimer) {
                    clearInterval(this._bannerTimer)
                    this._bannerTimer = null
                }
            },

            // 点击分页切帧并重启计时
            onBullet (i) {
                this.goSlide(i)
                this.startAutoplay()
            },

            // ---------- 能力光谱 ----------
            setTip (el) {
                if (!el) return
                this.spectrumTipName = el.getAttribute('data-name') || ''
                this.spectrumTipDesc = el.getAttribute('data-desc') || ''
                this.hotNodeName = this.spectrumTipName
            },

            // 复原说明条与高亮态
            resetTip () {
                this.spectrumTipName = ''
                this.spectrumTipDesc = ''
                this.hotNodeName = ''
            },

            onNodeEnter (e) {
                this.setTip(e.currentTarget)
            },

            onNodeLeave () {
                this.resetTip()
            },

            // 光谱弧随鼠标轻微倾斜（reduceMotion 时不倾斜）
            onStageMove (e) {
                if (this.reduceMotion()) return
                const stage = this.$refs.spectrumStage
                const arc = this.$refs.spectrumArc
                if (!stage || !arc) return
                const r = stage.getBoundingClientRect()
                if (!r.width) return
                const t = (e.clientX - r.left) / r.width - 0.5
                arc.style.transform = 'rotate(' + (t * 3).toFixed(2) + 'deg)'
            },

            onStageLeave () {
                const arc = this.$refs.spectrumArc
                if (arc) arc.style.transform = ''
            },

            // ---------- 表单 / 热词 / 收藏 ----------
            // 检索提交 → 智能体广场（/portal/agents 兼容路由 → 新 agent 模块列表）；
            // 空关键词则不带 q（进广场看全部）；q 经兼容路由以 query 透传保留
            onSearchSubmit (e) {
                e.preventDefault()
                const word = (this.searchWord || '').trim()
                const query = word ? { q: word } : {}
                this.$router.push({ path: '/portal/agents', query: query })
            },

            // 热词：回填输入框后同跳智能体广场（经 /portal/agents 兼容路由进新 agent 模块，q 透传）
            onHotClick (e, word) {
                e.preventDefault()
                this.searchWord = word
                this.$router.push({ path: '/portal/agents', query: { q: word } })
            },

            // 收藏星标：调后端收藏/取消收藏（参考 AgentAppHome.vue 的 handleFavorite 入参：仅 id），
            // 成功后就地更新该条 item.starred（乐观更新，「我的收藏」已下线、不再同步任何列表）；
            // 失败保持原星态、轻提示不抛错。
            // 未登录：不发鉴权收藏请求（否则弹「操作失败」错误条），改唤起登录弹窗、就地留在本页
            async toggleStar (item) {
                if (!this.isLoggedIn) {
                    openLoginModal()
                    return
                }
                if (!item || !item.id) {
                    this.$Message.info('「' + ((item && item.name) || '该智能体') + '」缺少 id，暂无法收藏')
                    return
                }
                try {
                    if (item.starred) {
                        await agentAppUnfavorite(item.id)
                        item.starred = false
                    } else {
                        await agentAppFavorite(item.id)
                        item.starred = true
                    }
                } catch (e) {
                    // 静默降级：保持原星态（同 AgentAppHome.vue 的失败提示）
                    this.$Message.error('操作失败')
                }
            },

            // 我的智能体卡片：「添加智能体」→ 创建智能体页（portal-agent-create），其余跳对应智能体运行页
            onFavClick (f) {
                if (!f || f.add) {
                    this.$router.push('/portal/create/agent')
                    return
                }
                this.onRunAgent(f)
            },

            // ---------- 我的三栏目（tab：hover 切换 + 点击/键盘可用）----------
            // tab 行键盘导航：←/→ 循环、Home/End 首尾，移动焦点即触发 @focus 切换；
            // stopPropagation 阻断冒泡到窗口级翻屏监听，避免 Home/End 被分屏逻辑劫持
            onMineTabKey (e) {
                const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
                if (keys.indexOf(e.key) === -1) return
                const btns = Array.prototype.slice.call(e.currentTarget.querySelectorAll('[role="tab"]'))
                const cur = btns.indexOf(document.activeElement)
                if (cur === -1) return
                let next = cur
                if (e.key === 'ArrowLeft') next = (cur - 1 + btns.length) % btns.length
                else if (e.key === 'ArrowRight') next = (cur + 1) % btns.length
                else if (e.key === 'Home') next = 0
                else next = btns.length - 1
                e.preventDefault()
                e.stopPropagation()
                if (btns[next]) btns[next].focus()
            },

            // ---------- 已接入页面的入口跳转（均已挂到新 agent 模块，优先经兼容 portal 路由进入）----------
            // 「查看全部」→ 智能体广场（/portal/agents → /agent/list → /agent?view=list）
            goAgents () {
                this.$router.push('/portal/agents')
            },

            // 入口行（tab 行下方右对齐）随类别切换（智能体 / 工作流 / 知识库各自列表页，路径见 mineTabs）
            goMineTabLink () {
                this.$router.push(this.mineTabCfg.path)
            },

            // 我的工作流卡片 / 「更多 →」→ 我的工作台「工作流管理」栏（内嵌流程列表，不跳独立列表路由，也不进编辑器）
            goWorkflows () {
                this.$router.push('/portal/mine?tab=workflows')
            },

            // 工作流空态「去创建 →」→ 直达新建编辑器：
            // /portal/workflows/create 实际渲染的是流程列表页（workflows/index.vue 只渲染 PortalWorkflowList），
            // 故沿用 PortalWorkflowList.vue 的 WORKFLOW_CREATE_PAGE_ID 约定，进编辑页并置 mode=create
            goWorkflowCreate () {
                this.$router.push('/portal/workflows/edit/2103011122522561?mode=create')
            },

            // 我的知识库卡片 / 空态「去创建 →」→ 我的工作台「知识库」栏（内嵌列表，新建入口在该栏内）
            goKbList () {
                this.$router.push('/portal/mine?tab=kb')
            },

            // 我的智能体空态「去创建 →」→ 创建智能体页（同 onFavClick 的「添加智能体」卡目标）
            goAgentCreate () {
                this.$router.push('/portal/create/agent')
            },

            // 「开始对话」/ 我的智能体圆章卡 → 智能体运行页
            // （/portal/agents/:id/run 兼容路由 → /agent/run/:id → 新 agent 模块运行视图，保留 query）；
            // 数据项缺 id 时给轻提示（装载位映射处已不再兜底演示 id，空 id 直接提示，不进对话）
            onRunAgent (item) {
                const id = item && item.id
                if (!id) {
                    this.$Message.info('「' + ((item && item.name) || '该智能体') + '」缺少 id，暂无法进入对话')
                    return
                }
                // 未登录：对话页是 auth:true 路由，直接唤起登录弹窗并带上目标地址
                // （不交给守卫，避免「首页 → 对话 → 守卫弹回首页」的同页跳转与进度条闪烁）
                if (!this.isLoggedIn) {
                    openLoginModal('/portal/agents/' + id + '/run')
                    return
                }
                this.$router.push('/portal/agents/' + id + '/run')
            },

            // 按用途丝带 → 智能体广场（带分类 query，经 /portal/agents 兼容路由透传进新 agent 模块）
            onRibbon (r) {
                if (!r) return
                this.$router.push({ path: '/portal/agents', query: { cat: r.name } })
            },

            // ---------- 数据加载（真实接口 + 预留 commonsJs 调用位）----------
            // 统一约定：sqlid 为空跳过；异常或空返回 → 记录类保持空态（不注入演示数据），设计类保留内置静态内容，不抛错

            // 「我的」三栏目数据：仅登录后拉取一次（未登录不请求；由 watch.isLoggedIn 触发）
            async loadMineData () {
                if (!this.isLoggedIn || this.mineLoaded) return
                this.mineLoaded = true
                await Promise.all([this.loadFavList(), this.loadWorkflows(), this.loadKb()])
            },

            async loadBannerList () {
                if (!this.bannerSqlid) return
                try {
                    const res = await this.commonsJs.incoRequest('querylist', this.bannerSqlid, {})
                    if (Array.isArray(res) && res.length) {
                        const bullets = ['壹', '贰', '叁']
                        const fallback = [
                            'linear-gradient(135deg,#5c1a10 0%,#992a18 40%,#c45c2a 100%)',
                            'linear-gradient(135deg,#1e3a2f 0%,#2e5a4a 45%,#992a18 100%)',
                            'linear-gradient(135deg,#3a2040 0%,#5a2e6e 50%,#992a18 100%)'
                        ]
                        this.slides = res.slice(0, 3).map((row, i) => ({
                            bg: row.bg || row.background || fallback[i % fallback.length],
                            kicker: row.kicker || row.ft || '智能体服务门户',
                            title: row.title || row.bt || '守正创新 · 智启教学',
                            text: row.text || row.nr || '配置 · 编排 · 对话',
                            bullet: bullets[i] || String(i + 1)
                        }))
                        this.slideIndex = 0
                    }
                } catch (e) {
                    // 静默降级：保留 Banner 演示数据
                }
            },

            // ---------- 头像判别（图片 ID / 图标类名 / 首字兜底），「我的智能体」「大家都在用」两处复用 ----------
            // 后端 avatar 无类型字段，按形态启发式判别：
            //   1) 空 / undefined → kind 'disc'（模板回落名称首字 disc）；
            //   2) 含空格，或以 fa-/fa /icon（及 mdi、bi、ri、pi 等常见图标前缀）开头 → kind 'icon'（FontAwesome 类名直用）；
            //   3) 其余且长度 > 2 → kind 'image'（图片 ID，与门户 AgentList.vue 启发一致，短串不当 ID）；
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

            // 图片头像背景：commonsJs.getBackgroundImage(id, true) + 圆形铺满（同 AgentList.vue avatarStyle）；
            // 额外给纸色底，图片 404 时圆章不至于透明
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

            async loadFavList () {
                // 未登录不发请求（登录态判定见 computed isLoggedIn；正常路径由 loadMineData 收口）
                if (!this.isLoggedIn) return
                if (!this.favListSqlid) {
                    // 无 sqlid：接「我的智能体」（agentAppMine），最多取 6 个；不足 6 个时末位补「添加智能体」；
                    // 失败或空返回时保持空态（favList 维持 []）
                    try {
                        const res = await agentAppMine()
                        const rows = Array.isArray(res) ? res.filter(row => row && row.id) : []
                        if (rows.length) {
                            const list = rows.slice(0, 6).map(row => {
                                const nm = row.name || '智能体'
                                const av = this.resolveAvatar(row.avatar || row.icon)
                                return {
                                    id: row.id,
                                    disc: nm.slice(0, 1),
                                    name: nm,
                                    avatar: av.kind === 'disc' ? '' : av.value,
                                    avatarKind: av.kind,
                                    add: false
                                }
                            })
                            // 恰好 6 个不渲染「添加智能体」，保证整卡数不超过 6、一行版式稳定
                            if (list.length < 6) {
                                list.push({ disc: '＋', name: '添加智能体', add: true })
                            }
                            this.favList = list
                        }
                    } catch (e) {
                        // 静默降级：保持空态（不注入演示数据）
                    }
                    return
                }
                try {
                    const res = await this.commonsJs.incoRequest('querylist', this.favListSqlid, {})
                    if (Array.isArray(res) && res.length) {
                        const list = res.slice(0, 6).map(row => {
                            const nm = row.name || row.mc || '智能体'
                            const av = this.resolveAvatar(row.avatar || row.icon)
                            return {
                                id: row.id || '',
                                disc: row.disc || nm.slice(0, 1),
                                name: nm,
                                avatar: av.kind === 'disc' ? '' : av.value,
                                avatarKind: av.kind,
                                add: false
                            }
                        })
                        // 末位固定「添加智能体」（整卡数不超过 6）
                        if (list.length < 6) {
                            list.push({ disc: '＋', name: '添加智能体', add: true })
                        }
                        this.favList = list
                    }
                } catch (e) {
                    // 静默降级：保持空态（不注入演示数据）
                }
            },

            // 我的工作流：workflowList() → GET /ai/workflow/list（后端已按当前用户过滤，前端不再过滤）；
            // 兼容数组 / {list} 返回，精简映射后最多 4 张卡片；
            // 返回结构异常 / 成功但为空 / 异常 → 均保持空态（workflows 维持 []），不抛错
            async loadWorkflows () {
                // 未登录不发请求（同 loadFavList 的收口）
                if (!this.isLoggedIn) return
                try {
                    const res = await workflowList()
                    const rows = Array.isArray(res) ? res : (res && Array.isArray(res.list) ? res.list : null)
                    if (!rows) return
                    this.workflows = rows.filter(row => row && row.id).slice(0, 4).map(raw => {
                        const status = this.deriveFlowStatus(raw)
                        return {
                            id: raw.id,
                            name: raw.name || '未命名工作流',
                            status: status,
                            statusText: FLOW_STATUS_TEXT[status] || status,
                            nodeCount: this.countFlowNodes(raw.graphData) || raw.nodeCount || 0,
                            updatedAt: this.flowDay(raw.updateTime || raw.cjsj)
                        }
                    })
                } catch (e) {
                    // 静默降级：保持空态（workflows 维持 []）
                }
            },

            // 我的知识库：kbListPage({pageNum,pageSize}) → GET /kb/listPage（后端已按当前用户过滤）；
            // 取 PageInfo.list 前 4 条，兜底约定同 loadWorkflows（异常 / 空返回均保持空态）
            async loadKb () {
                // 未登录不发请求（同 loadFavList 的收口）
                if (!this.isLoggedIn) return
                try {
                    const res = await kbListPage({ pageNum: 1, pageSize: 4 })
                    const rows = Array.isArray(res) ? res : (res && Array.isArray(res.list) ? res.list : null)
                    if (!rows) return
                    this.kbList = rows.filter(row => row && row.id).slice(0, 4).map(raw => {
                        // KbList.vue 口径：status 仅 enabled / disabled 两态
                        const status = raw.status === 'enabled' ? 'enabled' : 'disabled'
                        return {
                            id: raw.id,
                            name: raw.kbmc || '未命名知识库',
                            summary: raw.kbms || '暂无简介',
                            status: status,
                            statusText: KB_STATUS_TEXT[status] || status,
                            date: raw.cjsj ? String(raw.cjsj).slice(0, 10) : '—'
                        }
                    })
                } catch (e) {
                    // 静默降级：保持空态（kbList 维持 []）
                }
            },

            // 工作流三态：同 WorkflowList.vue 的 deriveStatus（draft > disabled > enabled 字段 > status 字段）
            deriveFlowStatus (raw) {
                if (raw.status === 'draft') return 'draft'
                if (raw.status === 'disabled') return 'disabled'
                if (raw.enabled === false || raw.enabled === 0 || raw.enabled === '0') return 'disabled'
                if (raw.enabled === true || raw.enabled === 1 || raw.enabled === '1') return 'enabled'
                if (raw.status === 'published' || raw.status === 'enabled') return 'enabled'
                return 'draft'
            },

            // 节点数：优先解析 graphData.nodes.length（同 WorkflowList.vue），解析不出回退行内 nodeCount
            countFlowNodes (graphData) {
                if (!graphData) return 0
                let graph = graphData
                if (typeof graph === 'string') {
                    try {
                        graph = JSON.parse(graph)
                    } catch (e) {
                        return 0
                    }
                }
                return (graph && Array.isArray(graph.nodes)) ? graph.nodes.length : 0
            },

            // 时间归一化 yyyy-MM-dd（同 WorkflowList.vue 的 formatDate，空值给占位）
            flowDay (val) {
                if (!val) return '—'
                return String(val).slice(0, 10)
            },

            // 「大家在搜」复用智能体列表：取前 4 条名称填充，避免重复请求
            syncHotWordsFromNews () {
                const names = (this.newsList || [])
                    .slice(0, 4)
                    .map(item => (item && item.name) || '')
                    .filter(name => !!name)
                if (names.length) {
                    this.hotWords = names
                }
            },

            async loadNewsList () {
                if (!this.newsListSqlid) {
                    // 无 sqlid：接已发布应用（agentAppPublished）；接口实测会带回草稿，故仅取 status === published；失败或空返回时保持空态
                    try {
                        const res = await agentAppPublished()
                        const published = Array.isArray(res) ? res.filter(row => row && row.status === 'published') : []
                        if (published.length) {
                            this.newsList = published.slice(0, 4).map(row => {
                                const nm = row.name || '智能体'
                                const isFlow = row.appType === 'workflow'
                                const av = this.resolveAvatar(row.avatar || row.icon)
                                return {
                                    id: row.id || '',
                                    glyph: nm.slice(0, 1),
                                    avatar: av.kind === 'disc' ? '' : av.value,
                                    avatarKind: av.kind,
                                    name: nm,
                                    tag: isFlow ? '流程助手' : '标准助手',
                                    flow: isFlow,
                                    desc: row.description || '这个智能体还没有简介',
                                    meta: row.cjsj ? String(row.cjsj).slice(0, 10) : '',
                                    starred: false
                                }
                            })
                            // 同步填充「大家在搜」：取智能体前 4 条名称
                            this.syncHotWordsFromNews()
                        }
                    } catch (e) {
                        // 静默降级：保持空态（newsList 维持 []）
                    }
                    return
                }
                try {
                    const res = await this.commonsJs.incoRequest('querylist', this.newsListSqlid, {})
                    if (Array.isArray(res) && res.length) {
                        this.newsList = res.slice(0, 4).map((row, i) => {
                            const nm = row.name || row.mc || '智能体'
                            const tagName = row.tag || row.lxmc || '标准助手'
                            const av = this.resolveAvatar(row.avatar || row.icon)
                            return {
                                id: row.id || '',
                                glyph: row.glyph || nm.slice(0, 1),
                                avatar: av.kind === 'disc' ? '' : av.value,
                                avatarKind: av.kind,
                                name: nm,
                                tag: tagName,
                                flow: tagName === '流程助手',
                                desc: row.desc || row.ms || '',
                                meta: row.meta || row.sxr || '',
                                starred: i === 0
                            }
                        })
                        // 同步填充「大家在搜」：取智能体前 4 条名称
                        this.syncHotWordsFromNews()
                    }
                } catch (e) {
                    // 静默降级：保持空态（newsList 维持 []）
                }
            },

            async loadRibbonList () {
                if (!this.ribbonListSqlid) return
                try {
                    const res = await this.commonsJs.incoRequest('querylist', this.ribbonListSqlid, {})
                    if (Array.isArray(res) && res.length) {
                        this.ribbonList = res.slice(0, 5).map(row => ({
                            name: row.name || row.mc || '用途分类',
                            sub: row.sub || row.sm || ''
                        }))
                    }
                } catch (e) {
                    // 静默降级：保留按用途演示数据
                }
            },

            async loadSpectrum () {
                if (!this.spectrumSqlid) return
                try {
                    const res = await this.commonsJs.incoRequest('querylist', this.spectrumSqlid, {})
                    if (Array.isArray(res) && res.length) {
                        // 桌面默认五点位置（说明书 §5.10）
                        const posList = [
                            { left: '12%', top: '58%' },
                            { left: '31%', top: '36%' },
                            { left: '50%', top: '28%' },
                            { left: '69%', top: '36%' },
                            { left: '88%', top: '58%' }
                        ]
                        this.spectrumNodes = res.slice(0, 5).map((row, i) => ({
                            name: row.name || row.mc || '能力',
                            desc: row.desc || row.ms || '',
                            en: row.en || row.ywmc || '',
                            left: row.left || (posList[i] ? posList[i].left : '50%'),
                            top: row.top || (posList[i] ? posList[i].top : '40%')
                        }))
                        // 换数据后复原说明条
                        this.resetTip()
                    }
                } catch (e) {
                    // 静默降级：保留能力光谱演示数据
                }
            }
        }
    }
</script>

<style lang="less">
/* ═══ 页面级主题补丁（挂在 body.page-portal-home，首页专属）═════════════
   v3 主题层（token / body 字体背景 / * 重置 / :focus-visible）已迁入
   src/pages/portal/components/PortalLayout.vue，本页不再定义 token。
   overflow:hidden 属首页 100vh 分屏锁定页面滚动的页面级需求，留在本页；
   仅挂在首页专属 body 类 page-portal-home 上（keep-alive 下 activated 添加、deactivated 移除，beforeUnmount 兜底），
   避免全局常驻后误伤其他同样挂 page-portal-v3 的门户页面滚动。 */
body.page-portal-home {
    overflow: hidden;
}
</style>

<style scoped lang="less">
/* ═══ v3 组件样式（scoped）来源：v3 设计稿组件段（design-02-bucm/css/v3.css，设计稿已删除），原样搬运 ═══ */

.sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

.skip-link {
    position: absolute;
    left: var(--s4);
    top: -48px;
    z-index: 100;
    padding: var(--s2) var(--s4);
    background: var(--c-red-600);
    color: var(--c-white);
    border-radius: var(--r-sm);
    transition: top var(--t-fast);
}
.skip-link:focus { top: var(--s4); }

/* ══ 分屏舞台：一屏一功能栏 ═══════════════════ */
.stage {
    height: 100vh;
    overflow: hidden;
    position: relative;
}

.stage-track {
    height: 100%;
    transition: transform var(--t-scene);
    will-change: transform;
}

.panel {
    height: 100vh;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.panel-scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
}

.panel-inner {
    max-width: var(--max);
    margin: 0 auto;
    width: 100%;
    padding: calc(var(--header-h) + var(--s8)) var(--s6) var(--s10);
    box-sizing: border-box;
}

/* 当前屏入场 */
.panel.is-active .effect {
    opacity: 1;
    transform: none;
}

.effect {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity .7s ease, transform .7s ease;
}
.effect.isView,
.panel.is-active .effect { opacity: 1; transform: none; }
.effect[data-delay="1"] { transition-delay: .08s; }
.effect[data-delay="2"] { transition-delay: .16s; }
.effect[data-delay="3"] { transition-delay: .24s; }

@media (prefers-reduced-motion: reduce) {
    .stage-track { transition: none; }
    .effect { opacity: 1; transform: none; transition: none; }
    .slide.is-active .slide-bg { animation: none !important; }
}

/* ══ 右侧分屏导航（一屏一档） ═══════════════ */
.dots-nav {
    position: fixed;
    right: var(--s6);
    top: 50%;
    transform: translateY(-50%);
    z-index: 25;
    display: flex;
    flex-direction: column;
    gap: var(--s3);
    align-items: flex-end;
}

.dots-nav button {
    display: flex;
    align-items: center;
    gap: var(--s2);
    border: 0;
    background: transparent;
    cursor: pointer;
    padding: var(--s1) 0;
    color: var(--c-white);
    min-height: 36px;
}

.header.is-solid ~ .stage .dots-nav button,
.panel[data-tone="light"] ~ * .dots-nav button {
    color: var(--c-ink-2);
}

.dots-nav .label {
    font-family: var(--font-display);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    opacity: 0;
    transform: translateX(6px);
    transition: opacity var(--t-fast), transform var(--t-fast);
    white-space: nowrap;
    background: rgba(26, 20, 16, .55);
    color: var(--c-white);
    padding: 2px var(--s2);
    border-radius: var(--r-sm);
}

.dots-nav button:hover .label,
.dots-nav button:focus-visible .label,
.dots-nav button.is-active .label {
    opacity: 1;
    transform: none;
}

.dots-nav .dot {
    width: 10px;
    height: 10px;
    border-radius: var(--r-full);
    border: 1.5px solid currentColor;
    background: transparent;
    transition: background var(--t-fast), transform var(--t-fast), border-color var(--t-fast);
}

.dots-nav button.is-active .dot {
    background: var(--c-gold-500);
    border-color: var(--c-gold-500);
    transform: scale(1.25);
}

.dots-nav button:hover .dot { transform: scale(1.15); }

.dots-nav button[data-tone="light"] { color: var(--c-ink-2); }
.dots-nav button[data-tone="dark"] { color: var(--c-white); }

/* ══ Panel 0 · Banner 剧场 ═════════════════ */
.panel-banner { background: var(--c-red-600); }

.slides {
    position: absolute;
    inset: 0;
}

.slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    visibility: hidden;
    transition: opacity .6s ease, visibility .6s;
}

.slide.is-active {
    opacity: 1;
    visibility: visible;
}

.slide-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    transform: scale(1);
}

.slide.is-active .slide-bg {
    animation: scaleBig 10s linear both;
}

@keyframes scaleBig {
    from { transform: scale(1); }
    to { transform: scale(1.1); }
}

.slide-shade {
    position: absolute;
    inset: 0;
    background:
        linear-gradient(to bottom, rgba(0, 0, 0, .4), transparent 32%),
        linear-gradient(to top, rgba(126, 34, 20, .55), transparent 45%);
}

.slide-art {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
}

.slide-art .mountain {
    position: absolute;
    left: -4%;
    bottom: 0;
    width: 52%;
    height: 58%;
    background:
        radial-gradient(ellipse 60% 45% at 30% 80%, rgba(46, 90, 74, .5), transparent 70%),
        radial-gradient(ellipse 50% 50% at 65% 95%, rgba(30, 70, 55, .35), transparent 70%);
}

.slide-art .rings {
    position: absolute;
    left: 10%;
    top: 22%;
    width: 200px;
    height: 200px;
}

.slide-art .rings span {
    position: absolute;
    inset: 0;
    border: 1px solid rgba(255, 255, 255, .25);
    border-radius: var(--r-full);
    animation: ringPulse 4s ease-out infinite;
}

.slide-art .rings span:nth-child(2) { inset: 18%; animation-delay: .8s; }
.slide-art .rings span:nth-child(3) { inset: 36%; animation-delay: 1.6s; }

@keyframes ringPulse {
    0% { transform: scale(.88); opacity: .2; }
    50% { opacity: .55; }
    100% { transform: scale(1.12); opacity: .15; }
}

.slide-copy {
    position: absolute;
    left: 0; right: 0;
    top: 28%;
    text-align: center;
    color: var(--c-white);
    z-index: 2;
    padding: 0 var(--s6);
}

.slide-copy .kicker {
    font-family: var(--font-display);
    letter-spacing: .36em;
    font-size: var(--text-sm);
    color: var(--c-gold-500);
    margin-bottom: var(--s5);
}

.slide-copy h1 {
    font-family: var(--font-display);
    font-size: clamp(32px, 5.5vw, 56px);
    font-weight: 700;
    letter-spacing: .14em;
    line-height: var(--leading-tight);
    text-shadow: 0 4px 24px rgba(0, 0, 0, .35);
}

.slide-copy p {
    margin-top: var(--s4);
    font-family: var(--font-display);
    font-size: var(--text-lg);
    letter-spacing: var(--tracking-wider);
    color: rgba(255, 255, 255, .82);
}

.bullets {
    display: flex;
    flex-direction: row;
    gap: var(--s3);
}

.bullets--footer {
    position: static;
    transform: none;
    justify-content: center;
    z-index: 5;
}

/* v2 右侧竖排分页不再使用；保留节点以便兼容 */
.bullets:not(.bullets--footer) {
    position: absolute;
    right: var(--s10);
    top: 50%;
    transform: translateY(-50%);
    z-index: 5;
    flex-direction: column;
    gap: var(--s4);
}

.bullets button {
    width: 40px;
    height: 40px;
    border: 1px dashed var(--c-white);
    border-radius: var(--r-full);
    background: rgba(0, 0, 0, .2);
    color: var(--c-white);
    font-family: var(--font-display);
    cursor: pointer;
    transition: background var(--t-base), border-color var(--t-base), color var(--t-base);
}

.bullets button.is-active,
.bullets button:hover {
    background: var(--c-red-600);
    border-color: var(--c-red-600);
    border-style: solid;
}

.banner-links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s2) var(--s5);
    justify-content: center;
    margin-bottom: var(--s3);
}

.banner-bottom {
    position: absolute;
    left: 0; right: 72px;
    bottom: 0;
    z-index: 4;
    padding: var(--s6) var(--s10) var(--s8);
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(to top, rgba(0, 0, 0, .5), transparent);
}

.banner-links a {
    color: var(--c-white);
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    padding: var(--s2) var(--s2) var(--s2) var(--s5);
    position: relative;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    transition: color var(--t-fast), transform var(--t-fast);
}

.banner-links a::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 8px; height: 8px;
    border: 1px dotted var(--c-white);
    border-radius: var(--r-full);
    transform: translateY(-50%);
}

.banner-links a:hover {
    color: var(--c-gold-500);
    transform: translateX(8px);
}

/* ══ 内容面板通用 ═════════════════════════ */
.panel-light {
    background: var(--c-paper-2);
    color: var(--c-ink);
}

.panel-head {
    margin-bottom: var(--s8);
}

/* 「大家都在用」栏目头：「查看全部 →」贴最右侧，与「我的」段 .mine-more 内的
   「管理 → / 更多 →」同为右对齐入口（「我的」入口已不在标题行内）。
   仅作用于 #panel-hot：本页另有问候区（#panel-home 内 greet）与「能力·用途」（#panel-spectrum 内）
   两处 .panel-head，结构不同（无 channel-link），用 id 限定避免波及；flex-wrap + order 让
   副标题仍换行到第二行、链接与标题同占第一行，不改标题/副标题文案与字号 */
#panel-hot .panel-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0 var(--s3);
}

#panel-hot .panel-head .channel-link {
    order: 1;
    margin-top: 0;
    margin-left: auto;
}

#panel-hot .panel-head .channel-text {
    flex: 0 0 100%;
    order: 2;
}

.channel-title {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-weight: 700;
    line-height: 1;
    letter-spacing: .12em;
    display: flex;
    align-items: center;
    gap: var(--s3);
    flex-wrap: wrap;
}

.channel-title .sep {
    width: 28px;
    height: 28px;
    display: inline-grid;
    place-items: center;
    color: var(--c-red-600);
    font-size: var(--text-lg);
    transition: transform .5s ease;
}

.panel-head:hover .sep { transform: rotateY(180deg); }

.channel-text {
    margin-top: var(--s3);
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--c-muted);
    letter-spacing: var(--tracking-wide);
}

.channel-link {
    margin-top: var(--s5);
    display: inline-flex;
    align-items: center;
    gap: var(--s1);
    min-height: 44px;
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    color: var(--c-red-600);
    transition: color var(--t-fast);
}

.channel-link:hover { color: var(--c-gold-500); }

/* ══ Panel 1 · 上段问候搜索 + 下段我的三栏目（上下两段堆叠） ═══
   上段（搜索栏目）固定为内容自然高、不参与上下分配；下段（我的三栏目）占满剩余高度，
   内容区在剩余空间内布局 → 切换 tab 时外框高度恒定、首屏不产生位移与额外滚动条。
   未登录（.is-guest）只留上段，并在本屏内垂直居中 */
.home-stack {
    display: flex;
    flex-direction: column;
    gap: var(--s8);
    /* 固定首屏高 = 视口 − 顶栏 − .panel-inner 上下内边距（s8 / s10）：
       高度恒定即高度基准，登录态两段布局与未登录单段居中都以它起算，均不超出 100vh */
    height: calc(100vh - var(--header-h) - var(--s8) - var(--s10));
}

/* 未登录：单段居中 —— 高度沿用基准（见上 .home-stack：视口 − 顶栏 − s8 − s10，
   与 .panel-inner 内容盒等高，整屏不产生滚动），justify-content:center 让
   「问候 + 搜索 + 热词」落在顶栏以下整屏的垂直中线上。
   注：原 height:calc(100vh − s8) 比 .panel-inner 内容盒高出 header-h + s8 = 128px，
   会在 .panel-scroll 内多出一条纵向滚动条并把内容整体下移，故不再覆盖高度
   （padding-bottom 本就是 0，一并去掉） */
.home-stack.is-guest {
    justify-content: center;
}

/* 上段：问候 → 搜索（整行）→ 热词，三行同宽，由 gap 统一给节奏；
   flex:0 0 auto = 恒按内容自然高参与布局（不被下段挤压、不随下段变化） */
.home-top {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--s6);
    padding-top: var(--s4);
}

/* 上段问候块不再另占 s8 下距（间距交由 .home-top 的 gap），压缩纵向占用 */
.home-top .panel-head {
    margin-bottom: 0;
}

/* 下段：我的三栏目，横贯整行、占满剩余高度；上边框替代原左右分栏的竖分割线。
   flex:1 吃掉上段之外的全部余量，min-height:0 允许矮视口压缩，
   余量的伸缩全部由内容区 .mine-body 吸收（tab 行 / 入口行恒高） */
.home-mine {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding-top: var(--s6);
    border-top: 1px solid var(--c-border);
}

/* tab 行（该栏栏头，原「我的」主标题已下线）：两端各一枚装饰 ◈ 夹住中间 tab 组，
   构成「◈ 智能体 工作流 知识库 ◈」居中整体。外层带 channel-title 类只为沿用其视觉语言：
   .sep 的 28px 尺寸 / 朱红 / transform 过渡取自 .channel-title .sep（本行不在 .panel-head 内，
   不参与其 rotateY 悬停翻转，与原主标题的 ◈ 一致）。gap 与 tab 组内距同为 s4，节奏统一。
   margin-top 由原 s3 提到 s4 补偿被删标题的纵向占位（叠加 .home-mine 自带 s6 顶距：
   border → tab 行 40px、→ tab 文字 48px，去掉标题后不贴边突兀） */
.mine-tabs-row {
    flex: 0 0 auto;
    justify-content: center;
    gap: var(--s4);
    margin-top: var(--s4);
    min-width: 0;
}

/* 两端 ◈ 与 tab 文字同中线：tab 按钮上下内边距不等（s2 / s3），文字中线比按钮盒中线高
   (s3 − s2)/2，给 ◈ 一个等量下边距把它的盒中线抬回文字中线（行高由更高的 tab 组决定，不变） */
.mine-tabs-row .sep { margin-bottom: calc(var(--s3) - var(--s2)); }

/* tab 组：三个 tab 居中排布（装饰 ◈ 已移到组外）；
   flex:0 0 auto，高度恒定、不随内容区伸缩 */
.mine-tabs {
    flex: 0 0 auto;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--s4);
    min-width: 0;
}

/* 入口行（管理 → / 更多 →）：落在 tab 行下方、内容区之上并右对齐，
   从属于当前类别内容；文案仍取 mineTabCfg.linkText，联动逻辑不变 */
.mine-more {
    flex: 0 0 auto;
    display: flex;
    justify-content: flex-end;
    margin-top: var(--s2);
}

.mine-more .channel-link {
    margin-top: 0;
    min-height: 36px;
}

/* 内容区：恒占下段剩余高度（flex:1 = 「剩余高度」基准），外框高度不随 tab 变化。
   三个 tab 的卡片行（.fav-row 6 圆章 / .mine-cards 卡片墙）都以这同一个固定高度为基准：
   自然高不足时按内容顶对齐留白，超出时仅在本区内滚动 —— 外框高度恒定、切换不跳动。
   min-height 是矮视口兜底（防止内容区被压成 0 后三个 tab 全都看不见）：
   1080p / 常规笔电下 flex 剩余高度远大于该值，兜底不参与，仍是一屏无滚动条 */
.mine-body {
    flex: 1 1 0;
    min-height: min(200px, 18vh);
    margin-top: var(--s4);
    overflow-y: auto;
}

/* 选中态：墨色加粗 + 朱红下划线；未选中克制（灰字）。
   hover 即切换（@mouseenter），点击与焦点（@focus）同样可切换，键盘 ←/→/Home/End 见 onMineTabKey */
.channel-title.mine-tab {
    position: relative;
    font-size: var(--text-xl);
    font-weight: 400;
    gap: var(--s2);
    padding: var(--s2) 0 var(--s3);
    border: 0;
    background: none;
    color: var(--c-muted);
    white-space: nowrap;
    cursor: pointer;
    transition: color var(--t-fast);
}

.channel-title.mine-tab::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background: transparent;
    transition: background var(--t-fast);
}

.channel-title.mine-tab:not(.is-active):hover { color: var(--c-ink-2); }

.channel-title.mine-tab.is-active {
    color: var(--c-ink);
    font-weight: 700;
}

.channel-title.mine-tab.is-active::after { background: var(--c-red-600); }

.greet {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    letter-spacing: .1em;
    line-height: var(--leading-tight);
}

.greet-sub {
    margin: var(--s3) 0 0;
    font-family: var(--font-display);
    color: var(--c-muted);
    letter-spacing: var(--tracking-wide);
    font-size: var(--text-base);
}

/* 搜索独立成行：横贯上段整行宽度（原 640px 上限已放开），视觉重心清楚 */
.search-row {
    display: flex;
    border: 2px solid var(--c-red-600);
    background: var(--c-white);
    box-shadow: var(--shadow-md);
}

.search-row input {
    flex: 1;
    min-width: 0;
    padding: var(--s4) var(--s5);
    border: 0;
    outline: none;
    font-size: var(--text-base);
    background: transparent;
    min-height: 52px;
}

.search-row input::placeholder { color: var(--c-muted); }

.search-row button {
    padding: 0 var(--s8);
    background: var(--c-red-600);
    color: var(--c-white);
    border: 0;
    cursor: pointer;
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wider);
    transition: background var(--t-fast);
    min-height: 52px;
}

.search-row button:hover { background: var(--c-red-500); }

/* 热词行：与搜索行同宽分行排布，上距由 .home-top 的 gap 统一给 */
.hot-words {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s3) var(--s5);
    align-items: center;
    font-family: var(--font-display);
    color: var(--c-muted);
}

.hot-words a {
    color: var(--c-ink-2);
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    border-bottom: 1px solid transparent;
    transition: color var(--t-fast), border-color var(--t-fast);
}

.hot-words a:hover {
    color: var(--c-red-600);
    border-bottom-color: var(--c-gold-500);
}

/* ══ 合并末屏 · 单栏目头 + 能力光谱（上）+ 按用途（下）+ 页脚（底） ══
   上下堆叠同屏收口：panel-head 仅一个（用通用 s8 下距），页脚仍钉在屏底 */
.combo-split {
    display: flex;
    flex-direction: column;
    gap: var(--s6);
}

/* ══ 能力光谱（合并屏内） ═══════════════════ */
.spectrum-stage {
    position: relative;
    /* 单标题腾出空间后回调舞台高度（曾压至 min(200px,26vh)）；非 token
       270~280px 下 5 个 88px 节点按 left/top 定位仍完整落于舞台内且互不压叠 */
    height: min(280px, 30vh);
    margin-top: var(--s2);
}

.spectrum-arc {
    position: absolute;
    left: 6%; right: 6%;
    top: 32%;
    height: 110px;
    border-radius: 50% 50% 0 0 / 100% 100% 0 0;
    background: linear-gradient(90deg, #3d6bd9, #3d9e6e 25%, var(--c-gold-500) 50%, var(--c-red-600) 75%, #7a3d9e);
    opacity: .35;
    mask-image: linear-gradient(to bottom, #000 45%, transparent);
    -webkit-mask-image: linear-gradient(to bottom, #000 45%, transparent);
    transition: transform .35s ease;
}

.spectrum-arc::after {
    content: '';
    position: absolute;
    inset: 8px 10px 0;
    border-radius: 50% 50% 0 0 / 100% 100% 0 0;
    border-top: 2px solid rgba(255, 255, 255, .4);
}

.spectrum-node {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 88px;
    height: 88px;
    border-radius: var(--r-full);
    border: 1px dashed rgba(153, 42, 24, .35);
    background: var(--c-white);
    display: grid;
    place-items: center;
    text-align: center;
    font-family: var(--font-display);
    font-size: var(--text-base);
    font-weight: 700;
    letter-spacing: .06em;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: transform var(--t-base), background var(--t-base), color var(--t-base), box-shadow var(--t-base);
    min-width: 44px;
    min-height: 44px;
}

.spectrum-node small {
    display: block;
    font-family: var(--font-body);
    font-size: 10px;
    font-weight: 400;
    color: var(--c-muted);
    letter-spacing: 0;
    margin-top: 2px;
}

.spectrum-node:hover,
.spectrum-node.is-hot,
.spectrum-node:focus-visible {
    transform: translate(-50%, -50%) scale(1.1);
    background: var(--c-red-600);
    color: var(--c-white);
    border-style: solid;
    border-color: var(--c-gold-500);
    box-shadow: var(--shadow-md);
}

.spectrum-node:hover small,
.spectrum-node.is-hot small,
.spectrum-node:focus-visible small {
    color: rgba(255, 255, 255, .75);
}

.spectrum-tip {
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    min-width: 280px;
    max-width: 560px;
    padding: var(--s3) var(--s6);
    background: var(--c-red-600);
    color: var(--c-white);
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: .04em;
    text-align: center;
    line-height: 1.55;
    clip-path: polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%);
}

.spectrum-tip strong { color: var(--c-gold-500); }

/* ══ Panel 1 · 我的智能体（圆章，非卡片墙） ═
   6 圆章单行铺在 .mine-body 的固定高度内：高度基准即内容区基准，切换 tab 外框不动 */
.fav-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s6) var(--s8);
    padding-top: var(--s2);
}

.fav-seal {
    width: 120px;
    text-align: center;
    cursor: pointer;
    background: none;
    border: 0;
    padding: 0;
    transition: transform var(--t-base);
}

.fav-seal:hover { transform: translateY(-4px); }

.fav-seal .disc {
    width: 88px;
    height: 88px;
    margin: 0 auto var(--s3);
    border-radius: var(--r-full);
    border: 1px solid var(--c-border);
    background: linear-gradient(180deg, #fff8ef, var(--c-paper));
    box-shadow: inset 0 0 0 4px var(--c-red-100);
    display: grid;
    place-items: center;
    font-family: var(--font-display);
    font-size: 28px;
    color: var(--c-red-600);
    position: relative;
}

/* 卡片版图标头像：88px 圆章内居中，略大于首字字号以视觉等重 */
.fav-seal .disc i {
    font-size: 32px;
    line-height: 1;
}

.fav-seal .disc::after {
    content: '';
    position: absolute;
    inset: -6px;
    border: 1px dashed rgba(153, 42, 24, .25);
    border-radius: var(--r-full);
    transition: transform .5s ease;
}

.fav-seal:hover .disc::after { transform: rotateY(180deg); }

.fav-seal.add .disc {
    border-style: dashed;
    background: transparent;
    color: var(--c-muted);
    box-shadow: none;
    font-size: 32px;
}

.fav-seal .name {
    font-family: var(--font-display);
    font-size: var(--text-base);
    font-weight: 700;
    letter-spacing: .08em;
}

.fav-seal .time {
    display: inline-block;
    margin-top: var(--s1);
    background: var(--c-red-600);
    color: var(--c-white);
    font-size: 11px;
    line-height: 22px;
    padding: 0 var(--s3) 0 18px;
    border-radius: 0 var(--r-full) var(--r-full) 0;
    position: relative;
}

.fav-seal .time::before {
    content: '';
    position: absolute;
    left: 28px;
    top: 50%;
    width: 1px;
    height: 10px;
    background: rgba(255, 255, 255, .55);
    transform: translateY(-50%);
}

/* ══ Panel 1 · 我的工作流 / 我的知识库（与圆章行同节奏的共享卡片骨架） ══
   横贯整行时按行宽均分（4 张各约 1/4 行宽），窄屏自动换行；
   与圆章行同一高度基准铺在 .mine-body 的固定高度内，放不下时由 .mine-body 内滚 */
.mine-cards {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s4);
    padding-top: var(--s2);
}

/* 卡片骨架：三类共享圆角 / 边框 / 左朱红竖条 / hover 反馈，仅内容与图标区分 */
.mine-card {
    flex: 1 1 280px;
    max-width: 460px;
    display: flex;
    align-items: center;
    gap: var(--s4);
    padding: var(--s4) var(--s5);
    background: linear-gradient(180deg, #fff8ef, var(--c-paper));
    border: 1px solid var(--c-border);
    border-left: 3px solid var(--c-red-600);
    border-radius: var(--r-sm);
    text-align: left;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: transform var(--t-base), box-shadow var(--t-base), border-color var(--t-base);
}

.mine-card:hover,
.mine-card:focus-visible {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
    border-color: var(--c-red-600);
}

/* 图标圆章：与 .fav-seal 圆章同色系（纸底 + 朱红），尺寸收敛以控下段总高 */
.mine-card-ic {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: var(--r-full);
    background: var(--c-red-100);
    box-shadow: inset 0 0 0 1px rgba(153, 42, 24, .28);
    display: grid;
    place-items: center;
    color: var(--c-red-600);
    font-size: 18px;
    line-height: 1;
}

.mine-card-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--s1);
    font-family: var(--font-display);
}

.mine-card-top {
    display: flex;
    align-items: center;
    gap: var(--s3);
}

.mine-card-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--text-base);
    font-weight: 700;
    letter-spacing: .06em;
    color: var(--c-ink);
}

/* 状态徽标：启用（朱红）/ 停用（灰）/ 草稿（金），三态共用同一胶囊骨架 */
.mine-pill {
    flex-shrink: 0;
    font-style: normal;
    font-family: var(--font-body);
    font-size: var(--text-xs);
    line-height: 18px;
    padding: 0 var(--s2);
    border: 1px solid currentColor;
    border-radius: var(--r-sm);
}

.mine-pill.is-enabled {
    color: var(--c-red-600);
    background: var(--c-red-100);
}

.mine-pill.is-disabled {
    color: var(--c-muted);
    background: transparent;
    border-color: var(--c-border);
}

.mine-pill.is-draft {
    color: #B36A10;
    background: rgba(246, 156, 32, .14);
}

/* 次要信息行：左字段、右时间，两端对齐并各自省略号截断 */
.mine-card-meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--s4);
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--c-muted);
    letter-spacing: .04em;
}

.mine-card-sub {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.mine-card-date { flex-shrink: 0; }

/* 空态：暂无工作流 / 暂无知识库 + 去创建入口 */
.mine-empty {
    flex: 1 1 100%;
    margin: 0;
    padding: var(--s6) 0;
    text-align: center;
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    color: var(--c-muted);
}

.mine-empty a {
    margin-left: var(--s2);
    color: var(--c-red-600);
    text-decoration: none;
    transition: color var(--t-fast);
}

.mine-empty a:hover { color: var(--c-gold-500); }

/* 切换类别时内容区淡入：v-if 分支重建即触发，栏头（tab 行 / 入口行）不动。
   起始位移取 −8px（向上）而非 +8px：向下起始会把内容压向 .mine-body 下缘，
   矮视口下（内容区只剩 130~150px）瞬时多出的 8px 会闪出内容区滚动条；
   向上起始属“起始缘”溢出，浏览器不为其生成滚动条，且刚好落在
   .fav-row / .mine-cards 的 padding-top 内，不会裁到内容 */
.mine-body > div {
    animation: mineIn .28s ease both;
}

@keyframes mineIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
    .mine-body > div { animation: none; }
}

/* ══ Panel 2 · 大家都在用（新闻列表） ═════ */
.news-list { display: flex; flex-direction: column; }

/* 「大家都在用」空态：无推荐数据时占位，沿用「我的」空态视觉语言（居中 / 纸色弱化文字） */
.news-empty {
    margin: 0;
    padding: var(--s8) 0;
    text-align: center;
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    color: var(--c-muted);
}

.news-item {
    /* relative：供右上角收藏星绝对定位；顶部内边距给星标留出独立区，避免压住居中的按钮 */
    position: relative;
    display: grid;
    grid-template-columns: 160px 1fr auto;
    gap: var(--s5);
    padding: var(--s6) 0 var(--s5);
    border-bottom: 1px dashed rgba(153, 42, 24, .25);
    align-items: center;
    cursor: pointer;
    transition: transform var(--t-base), background var(--t-base);
}

.news-item:hover {
    transform: translateX(8px);
    background: linear-gradient(90deg, var(--c-red-100), transparent 70%);
}

.news-thumb {
    height: 96px;
    background: linear-gradient(135deg, var(--c-red-600), var(--c-gold-500));
    position: relative;
    overflow: hidden;
}

.news-thumb .glyph {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-family: var(--font-display);
    font-size: 36px;
    color: rgba(255, 255, 255, .9);
    transition: transform .5s ease;
}

.news-item:hover .news-thumb .glyph {
    transform: scale(1.12) rotateY(180deg);
}

/* 图标头像：96px thumb 内绝对居中（同 .glyph 位置与字号），hover 动效与首字一致；
   不改 thumb 尺寸/圆角与 nth-child 渐变，渐变仍作无 avatar 时的兜底视觉 */
.news-thumb .thumb-icon {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 36px;
    line-height: 1;
    color: rgba(255, 255, 255, .9);
    transition: transform .5s ease;
}

.news-item:hover .news-thumb .thumb-icon {
    transform: scale(1.12) rotateY(180deg);
}

.news-item:nth-child(2) .news-thumb { background: linear-gradient(135deg, #2e5a4a, var(--c-gold-500)); }
.news-item:nth-child(3) .news-thumb { background: linear-gradient(135deg, var(--c-red-500), #5a2e6e); }
.news-item:nth-child(4) .news-thumb { background: linear-gradient(135deg, #1e4a7a, var(--c-red-600)); }

.news-body h3 {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xl);
    letter-spacing: .06em;
    display: flex;
    align-items: center;
    gap: var(--s3);
    flex-wrap: wrap;
}

.tag {
    font-family: var(--font-body);
    font-size: 11px;
    letter-spacing: 0;
    padding: 2px var(--s2);
    border: 1px solid var(--c-red-600);
    color: var(--c-red-600);
}

.tag.flow {
    border-color: var(--c-gold-500);
    color: #B36A10;
}

.news-body p {
    margin: var(--s2) 0 0;
    color: var(--c-muted);
    font-size: var(--text-sm);
}

.news-meta {
    margin-top: var(--s2);
    font-size: var(--text-xs);
    color: var(--c-muted);
}

/* 右列仅「开始对话」：随卡片 grid align-items 垂直居中，收藏星已移至卡片右上角 */
.news-act {
    display: flex;
    align-items: center;
    min-width: 128px;
}

.btn-chat {
    min-height: 44px;
    padding: 0 var(--s5);
    background: var(--c-red-600);
    color: var(--c-white);
    border: 0;
    cursor: pointer;
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
    transition: background var(--t-fast);
}

.btn-chat:hover { background: var(--c-red-500); }

/* 收藏：卡片右上角单图标（★/☆ 两态，is-on 金色高亮） */
.star {
    position: absolute;
    top: var(--s3);
    right: var(--s3);
    width: 32px;
    height: 32px;
    min-height: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--c-muted);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    transition: color var(--t-fast), transform var(--t-fast);
}

.star:hover { transform: scale(1.15); color: var(--c-gold-500); }

.star.is-on {
    color: var(--c-gold-500);
}

/* ══ 合并末屏 · 按用途（折角丝带，下栏单行） ═══ */
.ribbon-track {
    display: flex;
    flex-wrap: wrap;
    margin-top: var(--s4);
}

.ribbon-item {
    flex: 1 1 160px;
    /* 单行收口 + 纵向回调（曾压至 80/s3）：全宽 1072px 下 5 项一行放下 */
    min-height: 88px;
    padding: var(--s4) var(--s6);
    background: var(--c-paper);
    border: 0;
    border-left: 3px solid var(--c-red-600);
    color: var(--c-ink);
    font-family: var(--font-display);
    font-size: var(--text-lg);
    letter-spacing: var(--tracking-wider);
    text-align: left;
    cursor: pointer;
    position: relative;
    transition: background var(--t-base), color var(--t-base), transform var(--t-base);
    clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%);
}

.ribbon-item:not(:first-child) {
    margin-left: -10px;
    padding-left: var(--s8);
}

.ribbon-item small {
    display: block;
    margin-top: var(--s2);
    font-family: var(--font-body);
    font-size: var(--text-xs);
    letter-spacing: 0;
    color: var(--c-muted);
}

.ribbon-item:hover {
    background: var(--c-red-600);
    color: var(--c-white);
    transform: translateY(-3px);
    z-index: 1;
}

.ribbon-item:hover small { color: rgba(255, 255, 255, .75); }

/* 页脚条（挂在最后一屏底部）：视觉规格已抽到共享组件 PortalFooter，本页只留布局 */
.panel-footer-bar {
    margin-top: auto;
}
</style>
