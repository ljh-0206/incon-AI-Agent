<template>
    <!-- 我的智能体（/portal/mine/agents）—— 门户列表页
         ① 页面壳退回门户常态：标准容器（--max 1440 版心 + 顶栏让位，与 /portal/kb 出口页同壳）
            + 页头（kicker / 栏目标题 / 新建主入口）+ 单行工具条（范围 chips / 计数 / 检索）；
            全幅绛红 banner、工具带与绛红页脚一并撤除；
         ② 卡片结构与视觉保持不变（缩略带 → 圆章头像 → 名称 → 描述三行 → 操作行，与同页「我的收藏」卡同构），
            栅格与知识库 .kb-grid 同规（auto-fill + min(280px, 100%)，版心约 1100px 时 3 列等宽），≤996 收 1 列；
         ③ 操作列对齐后台 /ai/agent-app：运行 / 编辑 / 发布 / 启用·停用 / 删除，
            每个动作成功后本地状态即刻更新，再静默回读服务端为准；
         ④ 只用既有门户 API（agentAppMine / Favorites / Favorite / Unfavorite / Publish / Toggle / Delete），
            不新增依赖，不改 components/** 与参考页；
         ⑤ 范围 chips 三档，第三档「我的工作流」（?type=workflow）：独立列表路由 /portal/workflows 已移除，
            改为内嵌 WorkflowList 组件，标题 / 新建入口由本页头承担（show-title / show-create 皆 false）。 -->
    <!-- 根节点：顶栏 + v3 主题层由 /portal 一级壳（PortalShell）渲染——独立路由 /portal/mine/agents
         与内嵌态（宿主 /portal/mine 工作台面板）都只出内容，embedded 只再管页内 chrome -->
        <main class="ma-page" :class="{ 'is-view': isView, 'is-embedded': embedded }">
            <a v-if="!embedded" class="ma-skip" href="#ma-grid">{{ skipText }}</a>

            <!-- ══ 页头：kicker + 栏目标题（随范围切换）；右端新建主入口，底缘发丝虚线收口 ══ -->
            <header class="ma-head ma-effect" data-delay="0">
                <div class="ma-head-main">
                    <p class="ma-kicker"><span aria-hidden="true">◈</span>{{ kickerText }}</p>
                    <h1 class="ma-title">{{ channelTitle }}</h1>
                </div>
                <button type="button" class="ma-create" @click="goCreate">{{ createLabel }}</button>
            </header>

            <!-- ══ 工具条：左「范围」三档（我的智能体 / 我的收藏 / 我的工作流）· 右 计数 + 检索（工作流档收起，检索由内嵌组件自带）；选中三重编码（实线 + ◈ + 反白） ══ -->
            <section class="ma-toolbar ma-effect" data-delay="1" aria-label="范围与检索">
                <div v-if="!embedded" class="ma-chips" role="group" aria-label="内容范围">
                    <button
                        v-for="t in tabs"
                        :key="t.key"
                        type="button"
                        class="ma-chip"
                        :aria-pressed="tab === t.key ? 'true' : 'false'"
                        @click="switchTab(t.key)"
                    ><span v-if="tab === t.key" class="ma-chip-mark" aria-hidden="true">◈</span>{{ t.label }}</button>
                </div>

                <div v-if="!isWorkflow" class="ma-toolbar-right">
                    <p class="ma-count" aria-live="polite">{{ countText }}</p>
                    <form class="ma-search" role="search" @submit="onSearchSubmit">
                        <label class="ma-sr-only" for="ma-search-input">搜索智能体</label>
                        <input
                            id="ma-search-input"
                            v-model="searchInput"
                            type="search"
                            autocomplete="off"
                            placeholder="搜索名称或简介"
                        />
                        <button type="submit">检索</button>
                    </form>
                </div>
            </section>

            <!-- 静默刷新失败提示条：动作已成功、但回读失败时的显式告知（不静默显示旧数据） -->
            <div v-if="stale && !isWorkflow" class="ma-notice" role="status">
                <span>列表刷新失败，当前显示的可能不是最新状态</span>
                <button type="button" @click="refresh">重试</button>
            </div>

            <!-- ══ 我的工作流：内嵌 WorkflowList 组件（/portal/workflows 列表路由已移除）══
                 标题与新建入口由本页头承担（kicker / 栏目标题 / 新建工作流主钮），
                 故 show-title / show-create 都关掉，组件只剩筛选工具条 + 卡片，不与页头重复。
                 不监听 nav / open-workflow → 编辑与新建由组件自行跳保留的 /portal/workflows/edit。
                 v-if 切换：切走即卸载、回来重新挂载，列表自然回读，无需宿主手动刷新
                 （组件内另有 activated 钩子兜底 keep-alive 场景）。 -->
            <!-- 模板标签仍写 WorkflowList，实际挂载的是本页本地的包装组件 WorkflowListWithResult
                 （extends 共享列表 + 覆盖 submitRun / openRunDialog，并在 components 里注册了一个
                 同名局部 Modal 顶掉全局解析）。「运行 → 执行中 → 执行结果」全程在它那一个
                 Modal 容器里切视图，宿主因此不再持有第二个结果弹框 —— 从前是「关掉运行弹框、
                 再开结果弹框」，两个 Modal DOM 交替换手，视觉上断开。
                 运行阶段只留输入参数 + 逐字回复 + 输出思考过程三项；执行走 SSE
                 （/ai/workflow/{id}/execute/stream），事件处理见脚本里的 submitRun。 -->
            <WorkflowList
                v-if="isWorkflow"
                id="ma-grid"
                ref="workflowList"
                class="ma-wf"
                role="region"
                aria-label="工作流列表"
                :show-title="false"
                :show-create="false"
            />

            <section
                v-else
                id="ma-grid"
                class="ma-grid-wrap"
                :aria-busy="loading ? 'true' : 'false'"
                aria-label="智能体列表"
            >
                <!-- 骨架：结构镜像真卡（缩略带 / 圆章 / 名称 / 三行描述 / 元信息 / 操作行）→ 等高无跳变；8 格 = 3 列三行 -->
                <div v-if="loading" class="ma-grid" aria-hidden="true">
                    <div v-for="i in 8" :key="'sk-' + i" class="ma-sk-card">
                        <div class="ma-sk-thumb"></div>
                        <div class="ma-sk-body">
                            <div class="ma-sk-avatar"></div>
                            <div class="ma-sk-name"></div>
                            <div class="ma-sk-desc">
                                <div class="ma-sk-sub"></div>
                                <div class="ma-sk-sub"></div>
                                <div class="ma-sk-sub"></div>
                            </div>
                            <div class="ma-sk-meta"></div>
                        </div>
                        <div class="ma-sk-act">
                            <div class="ma-sk-btn"></div>
                            <div class="ma-sk-btn"></div>
                            <div class="ma-sk-btn"></div>
                        </div>
                    </div>
                </div>

                <!-- 错误态：只出错误 + 重试，不回退任何演示数据 -->
                <div v-else-if="loadError" class="ma-state" role="alert">
                    <span class="ma-state-seal" aria-hidden="true">◈</span>
                    <p class="ma-state-title">列表加载失败</p>
                    <p class="ma-state-text">网络或服务异常，请稍后重试</p>
                    <div class="ma-state-actions">
                        <button type="button" class="ma-state-btn" @click="refresh">重试</button>
                    </div>
                </div>

                <!-- 空态：区分「筛选无结果」与「真空」；文案随范围切换 -->
                <div v-else-if="!visibleRows.length" class="ma-state ma-state--plain">
                    <span class="ma-state-seal" aria-hidden="true">◈</span>
                    <p class="ma-state-title">{{ emptyTitle }}</p>
                    <p class="ma-state-text">{{ emptyText }}</p>
                    <div class="ma-state-actions">
                        <button v-if="hasFilter" type="button" class="ma-state-btn" @click="clearFilters">清除筛选</button>
                        <button v-else-if="isFav" type="button" class="ma-state-btn" @click="goPlaza">去广场逛逛</button>
                        <button v-else type="button" class="ma-state-btn" @click="goCreate">去创建一个</button>
                    </div>
                </div>

                <!-- ══ 我的智能体：管理型卡（运行 / 编辑 / 发布 / 启用·停用 / 删除） ══ -->
                <div v-else-if="!isFav" :key="gridKey" class="ma-grid">
                    <article
                        v-for="(a, i) in visibleRows"
                        :key="'mine-' + a.id"
                        class="ma-slot ma-enter"
                        :class="{ 'is-busy': isBusy(a) }"
                        :style="{ animationDelay: ((i % 10) * 0.05) + 's' }"
                    >
                        <!-- 管理型卡改为独立通用组件（设计与数值见 components/agent/AgentManageCard.vue）；
                             组件只回传事件，确认弹框与接口仍由本页既有方法负责 -->
                        <AgentManageCard
                            :item="a"
                            :busy="isBusy(a)"
                            @run="goRun(a)"
                            @edit="goEdit(a)"
                            @publish="confirmPublish(a)"
                            @offline="confirmOffline(a)"
                            @toggle="confirmToggle(a)"
                            @delete="confirmDelete(a)"
                        />
                    </article>
                </div>

                <!-- ══ 我的收藏：改用公共组件 AgentCard（= 智能体广场现在用的那张卡，v4.0）——
                     收藏的可能是他人智能体，故只给「开始对话」+ 右上收藏★；
                     组件不调接口、无 cursor:pointer，收藏二次确认与运行跳转仍由本页既有方法负责；
                     外层 <article class="ma-slot ma-enter"> 包裹保留（入场动画与栅格落位不变） ══ -->
                <div v-else :key="gridKey" class="ma-grid">
                    <article
                        v-for="(a, i) in visibleRows"
                        :key="'fav-' + a.id"
                        class="ma-slot ma-enter"
                        :style="{ animationDelay: ((i % 10) * 0.05) + 's' }"
                    >
                        <AgentCard
                            :item="a"
                            :starred="isStarred(a)"
                            @favorite="confirmUnstar(a)"
                            @run="goRun(a)"
                        />
                    </article>
                </div>
            </section>

        <!-- 工作流「运行 → 执行结果」弹框已不在本页：
             它由内嵌列表的本地包装组件 WorkflowListWithResult 用同一个 Modal 容器承担
             （运行 → 执行中 → 执行结果 三段视图原地切换），
             避免「关掉运行弹框再打开结果弹框」造成的两个 Modal DOM 交替换手。
             统计归一 / 节点耗时 / 思考过程 / 输出结果的口径见脚本里的归一函数族。 -->

        <!-- 二次确认弹框（发布 / 启用·停用 / 删除 / 取消收藏 共用） -->
        <PortalConfirmModal
            v-model="confirm.visible"
            :title="confirm.title"
            :content="confirm.content"
            :confirm-text="confirm.confirmText"
            :confirm-type="confirm.confirmType"
            :loading="confirm.loading"
            @confirm="executeConfirmedAction"
        />
    </main>
</template>

<script>
    import PortalConfirmModal from '../../components/PortalConfirmModal.vue'
    import WorkflowList from '../../components/agent/workflow/WorkflowList.vue'
    import AgentManageCard from '../../components/agent/AgentManageCard.vue'
    // v4.0：收藏卡改用公共组件 AgentCard（与智能体广场同一张卡，路径写法同 AgentManageCard）
    import AgentCard from '../../components/agent/AgentCard.vue'
    import {
        agentAppMine,
        agentAppFavorites,
        agentAppFavorite,
        agentAppUnfavorite,
        agentAppDelete,
        agentAppPublish,
        agentAppToggle
    } from '@/api/agentApp'
    // 运行执行改走 SSE（/ai/workflow/{id}/execute/stream），逐字回复与思考过程都是流式事件：
    //   fetchEventSource —— 带自定义 header 发起 SSE（EventSource 本身带不了 Token）
    //   Setting          —— 接口基址（apiBaseURL 默认 /api）与 xmid（token 的 localStorage 键）
    // 两者与门户其它流式调用（portal/components/AgentAppRunCore.vue）同一口径，
    // 事件名与 URL 拼法对齐只读参考页 src/components/WorkflowManage.vue 的 execWorkflow。
    // 增量内容只累积不外显：output_delta / reasoning_delta 进本地缓冲，
    // 展示统一留给同一个弹框的「执行结果」阶段。
    import { fetchEventSource } from '@microsoft/fetch-event-source'
    import Setting from '@/setting'

    // 范围注册表：新增一档只加一项，取数 / 空态文案 / 卡片形态全由它驱动
    //   key      范围键；aliases 路由 query 可识别取值（第 0 个为写回规范值）
    // 工作流档（value = workflow）例外：它不取本页数据，列表由内嵌 WorkflowList 组件自取。
    const TABS = [
        { key: 'mine', label: '我的智能体', value: 'agent', aliases: ['agent', 'mine', 'my', 'agents'] },
        { key: 'favorites', label: '我的收藏', value: 'collect', aliases: ['collect', 'collection', 'favorite', 'favorites', 'fav', 'star'] },
        { key: 'workflow', label: '我的工作流', value: 'workflow', aliases: ['workflow', 'workflows', 'flow', 'flows', 'wf'] }
    ]
    // 路由 query 里承载范围的参数名（按顺序取第一个命中的）
    const TAB_QUERY_KEYS = ['type', 'page']
    const DEFAULT_TAB = 'mine'
    // 门户工作流编辑入口（列表路由已移除，仅剩此条）：编辑与新建共用，
    // WorkflowManage 按 query.id 加载详情、按 query.mode=create 开空白表单
    const WORKFLOW_EDIT_PATH = '/portal/workflows/edit'
    // 后端 status → 展示文案（与 components/agent/mock/agents.js 的 statusLabel 同口径）
    const STATUS_LABELS = { published: '已上线', draft: '草稿', disabled: '已停用' }

    // ---------- 工作流执行结果：字段兼容表 ----------
    // /ai/workflow/{id}/execute 的返回体在拦截器 code===200 时已被解包成 content，
    // 但各版本字段名不完全一致（output / finalOutput / result / outputData …），
    // 故按候选表逐个兜，避免出现「提示执行成功但结果内容是空的」。
    // 信封键：拦截器未解包时统一是 { code, data | content | payload | body }，需要下钻一层
    const WF_ENVELOPE_KEYS = ['data', 'content', 'payload', 'body']
    const WF_OUTPUT_KEYS = ['output', 'finalOutput', 'final_output', 'result', 'outputData', 'output_data', 'answer', 'text', 'response']
    const WF_REASONING_KEYS = ['reasoning', 'reasoningContent', 'reasoning_content', 'thinking', 'reasoningText']
    const WF_DURATION_KEYS = ['durationMs', 'duration', 'costMs', 'elapsedMs', 'elapsed', 'totalTime', 'total_time']
    const WF_ERROR_KEYS = ['errorMessage', 'error', 'errMsg', 'message', 'msg', 'failureReason']
    const WF_SUCCESS_KEYS = ['success', 'ok', 'succeeded']
    const WF_STATS_KEYS = ['stats', 'statistics', 'executionStats', 'execStats', 'stat']
    // 统计散字段（没有 stats 子对象、直接摊在同一层的口径）
    const WF_STAT_TOTAL_NODES = ['totalNodes', 'nodeCount', 'node_count', 'total_node_count']
    const WF_STAT_DONE_NODES = ['completedNodes', 'completed_nodes', 'finishedNodes', 'completed', 'done', 'successNodes']
    const WF_STAT_AVG = ['avgNodeTime', 'avg_node_time', 'avgNodeDuration', 'averageNodeTime', 'avgDuration', 'avgDurationMs', 'avg']
    const WF_STAT_TOTAL = ['totalTime', 'total_time', 'totalDuration', 'totalDurationMs']
    // 节点耗时详情：对象映射（nodeTimings / node_timings / timings / nodeCosts）
    const WF_STAT_TIMINGS = ['nodeTimings', 'node_timings', 'timings', 'nodeTiming', 'timing', 'nodeCosts', 'node_costs']
    // 退化数据源：后端有时不给耗时表，只给逐条节点日志（字段名与耗时表同源，故同一条解析）
    const WF_STAT_TIMING_LOG_KEYS = ['nodeLogs', 'node_logs', 'logs', 'executionLogs', 'nodeResults', 'steps']
    // 上面任一族出现任意一个键，就说明「这层就是业务体」，不再往下剥信封。
    // 只认 output / reasoning / stats / success / nodeTimings 这类结果键：
    // message、msg 是信封层的通用措辞（{ code:200, msg:'ok', data:{…} } 到处都是），
    // 把它算成业务键会让 { data: { output } } 这种真正的信封剥不开。
    const WF_BODY_KEYS = WF_OUTPUT_KEYS.concat(WF_REASONING_KEYS, WF_STATS_KEYS, WF_SUCCESS_KEYS, WF_STAT_TIMINGS)
    // 「执行结果整体缩在一层里」的容器键：{ result: { stats, nodeTimings } } / { outputData: {…} }
    const WF_NESTED_KEYS = WF_OUTPUT_KEYS.concat(WF_ENVELOPE_KEYS, ['execution', 'execResult', 'workflowResult', 'detail'])
    // 单节点字段口径：名称 / 耗时 / 起止时间对
    const WF_NODE_ID_KEYS = ['nodeId', 'node_id', 'id', 'key', 'name', 'nodeName', 'node_name']
    const WF_NODE_NAME_KEYS = ['name', 'nodeName', 'node_name', 'label', 'title', 'nodeId', 'id', 'key']
    const WF_NODE_TIME_KEYS = ['duration', 'durationMs', 'duration_ms', 'costMs', 'cost', 'time', 'elapsed', 'elapsedMs', 'usedTime', 'took']
    const WF_NODE_START_KEYS = ['startTime', 'start_time', 'startAt', 'startedAt', 'beginTime', 'start']
    const WF_NODE_END_KEYS = ['endTime', 'end_time', 'endAt', 'finishedAt', 'finishTime', 'end']

    // 纯对象判定（排除数组 / null / Date 之类的类实例）
    function isPlainResult (value) {
        return !!value && typeof value === 'object' && !Array.isArray(value)
    }

    // 键是否存在且非空（空串 / null / undefined 视为无值；0 与 false 是有效取值，不算缺失）
    function hasResultKey (obj, keys) {
        if (!isPlainResult(obj)) return false
        for (let i = 0; i < keys.length; i++) {
            const v = obj[keys[i]]
            if (v !== undefined && v !== null && v !== '') return true
        }
        return false
    }

    // 按候选表取第一个非空值
    function pickResultValue (obj, keys) {
        if (!isPlainResult(obj)) return undefined
        for (let i = 0; i < keys.length; i++) {
            const v = obj[keys[i]]
            if (v !== undefined && v !== null && v !== '') return v
        }
        return undefined
    }

    // 任意值 → 数值：数字串 '0' / '120' 正确转数值，布尔按 1 / 0 折算；
    // 关键点：0 是合法取值，绝不按「缺失」处理（旧实现用 `x || 0x` 兜底会把 0 吞成别的字段）
    function toResultNumber (value) {
        if (value === undefined || value === null || value === '' || value === '-') return null
        if (typeof value === 'boolean') return value ? 1 : 0
        if (typeof value === 'object') return null
        const n = Number(value)
        return isNaN(n) ? null : n
    }

    // 取不到给 0（展示口径：0 也照出，不隐藏）
    function numberOrZero (value) {
        const n = toResultNumber(value)
        return n === null ? 0 : n
    }

    // 按候选表取第一个「确实是数值」的值：字段缺失返回 null，0 原样返回
    function pickResultNumber (obj, keys) {
        if (!isPlainResult(obj)) return null
        for (let i = 0; i < keys.length; i++) {
            const n = toResultNumber(obj[keys[i]])
            if (n !== null) return n
        }
        return null
    }

    // 任意值 → 文本（对象 / 数组走 JSON 序列化）
    function pickResultText (obj, keys) {
        const v = pickResultValue(obj, keys)
        if (v === undefined) return ''
        return stringifyResult(v)
    }

    // 输出/思考过程统一成可展示文本：字符串原样、对象与数组 JSON pretty print
    function stringifyResult (value) {
        if (value === null || value === undefined) return ''
        if (typeof value === 'string') return value
        if (typeof value === 'number' || typeof value === 'boolean') return String(value)
        try {
            return JSON.stringify(value, null, 2)
        } catch (e) {
            return String(value)
        }
    }

    // 任意值 → 时间戳（数字直接用，ISO 串解析），取不到给 null
    function toResultTime (value) {
        if (value === undefined || value === null || value === '' || value === '-') return null
        if (typeof value === 'number') return isNaN(value) ? null : value
        const d = new Date(value)
        return isNaN(d.getTime()) ? null : d.getTime()
    }

    // 按候选表取第一个能解析成时间戳的值
    function pickFirstTime (obj, keys) {
        if (!isPlainResult(obj)) return null
        for (let i = 0; i < keys.length; i++) {
            const t = toResultTime(obj[keys[i]])
            if (t !== null) return t
        }
        return null
    }

    // 单节点 → { name, duration }；耗时字段全缺时用 end - start 兜（后端常只记起止时间戳）
    function resolveNodeTiming (raw, fallbackId) {
        if (!isPlainResult(raw)) return null
        const id = String(pickResultValue(raw, WF_NODE_ID_KEYS) || fallbackId || '')
        const name = String(pickResultValue(raw, WF_NODE_NAME_KEYS) || id)
        let duration = pickResultNumber(raw, WF_NODE_TIME_KEYS)
        if (duration === null) {
            const start = pickFirstTime(raw, WF_NODE_START_KEYS)
            const end = pickFirstTime(raw, WF_NODE_END_KEYS)
            if (start !== null && end !== null && end >= start) duration = end - start
        }
        return { name: name, duration: duration === null ? 0 : duration }
    }

    // 对象是否已经是「nodeId → 耗时」的映射：
    // 值要么是纯数字（{ node_1: 120 } 简写），要么是带节点字段的对象（{ node_1: { name, duration } }）。
    // 判定必须看值自身的字段 —— 否则 { timings: { node_1: … } } 这层容器会被误当成「一个叫 timings 的节点」。
    function looksLikeTimingMap (obj) {
        if (!isPlainResult(obj)) return false
        const keys = Object.keys(obj)
        if (!keys.length) return false
        const nodeKeys = WF_NODE_TIME_KEYS.concat(WF_NODE_NAME_KEYS, WF_NODE_ID_KEYS, WF_NODE_START_KEYS)
        let hit = 0
        for (let i = 0; i < keys.length; i++) {
            const v = obj[keys[i]]
            if (toResultNumber(v) !== null) hit++
            else if (isPlainResult(v) && hasResultKey(v, nodeKeys)) hit++
        }
        return hit >= keys.length
    }

    // 耗时容器可能再套一层（{ timings: { node_1: … } }），只在当前层还不是映射时才下钻，最多 3 层
    function unwrapTimingsSource (raw) {
        let cur = raw
        for (let i = 0; i < 3; i++) {
            if (looksLikeTimingMap(cur)) return cur
            const inner = pickResultValue(cur, WF_STAT_TIMINGS)
            if (inner === undefined) return cur
            cur = inner
        }
        return cur
    }

    // 节点耗时详情 → { [nodeId]: { name, duration } }
    // 三种口径都收：① { nodeId: { name, duration } } ② { nodeId: 120 } ③ [ { nodeId, nodeName, durationMs } ]
    // ③ 同时承接后端的「节点日志数组」——字段名与耗时表同源，故走同一条解析
    function normalizeNodeTimings (raw) {
        const out = {}
        if (raw === undefined || raw === null || raw === '') return out
        const source = unwrapTimingsSource(raw)
        if (Array.isArray(source)) {
            source.forEach((item, i) => {
                const timing = resolveNodeTiming(item, '节点 ' + (i + 1))
                if (!timing) return
                // 同一节点多轮（循环节点）以最后一次为准，与后台 executionStats.nodeTimings 口径一致
                out[timing.name] = timing
            })
            return out
        }
        if (!isPlainResult(source)) return out
        Object.keys(source).forEach(id => {
            const item = source[id]
            if (isPlainResult(item)) {
                out[id] = resolveNodeTiming(item, id)
            } else {
                // { node_1: 120 } 这种「值就是毫秒数」的简写
                out[id] = { name: id, duration: numberOrZero(item) }
            }
        })
        return out
    }

    // 从一层对象里挑「节点耗时详情」数据源：优先耗时表，没有则退到节点日志数组
    function pickTimingsSource (obj) {
        const direct = pickResultValue(obj, WF_STAT_TIMINGS)
        if (direct !== undefined) return direct
        const logs = pickResultValue(obj, WF_STAT_TIMING_LOG_KEYS)
        return logs === undefined ? null : logs
    }

    // 统计候选层：业务体自身 + 其下一层的业务对象（{ data: { result: { stats } } } 这类嵌套信封）
    function collectStatLayers (body) {
        const layers = []
        const push = o => {
            if (isPlainResult(o) && layers.indexOf(o) === -1) layers.push(o)
        }
        push(body)
        if (!isPlainResult(body)) return layers
        const keys = WF_NESTED_KEYS.concat(WF_STATS_KEYS, WF_STAT_TIMINGS)
        for (let i = 0; i < keys.length; i++) push(body[keys[i]])
        return layers
    }

    // 某一层里能不能读出统计：有 stats 子对象就用它，否则看该层是否摊了散字段 / 耗时详情
    function readStatsLayer (layer) {
        if (!isPlainResult(layer)) return null
        const container = pickResultValue(layer, WF_STATS_KEYS)
        if (isPlainResult(container)) return container
        const flatKeys = WF_STAT_TOTAL_NODES.concat(WF_STAT_DONE_NODES, WF_STAT_AVG, WF_STAT_TOTAL, WF_STAT_TIMINGS)
        for (let i = 0; i < flatKeys.length; i++) {
            if (hasResultKey(layer, [flatKeys[i]])) return layer
        }
        return null
    }

    // 节点耗时合计
    function sumNodeTimings (timings) {
        let sum = 0
        Object.keys(timings).forEach(id => {
            sum += numberOrZero(timings[id].duration)
        })
        return sum
    }

    // 组装统一 stats：读不到的项按节点耗时详情回填，保证四项都有数值可显示
    function buildWorkflowStats (src, body) {
        const nodeTimings = normalizeNodeTimings(pickTimingsSource(src))
        const timingCount = Object.keys(nodeTimings).length
        const sum = sumNodeTimings(nodeTimings)

        let totalNodes = pickResultNumber(src, WF_STAT_TOTAL_NODES)
        let completedNodes = pickResultNumber(src, WF_STAT_DONE_NODES)
        let avgNodeTime = pickResultNumber(src, WF_STAT_AVG)
        let totalTime = pickResultNumber(src, WF_STAT_TOTAL)

        // 缺失项按耗时详情回填（0 不算缺失，故这里只判 null）
        if (completedNodes === null) completedNodes = timingCount
        if (totalNodes === null) totalNodes = Math.max(completedNodes, timingCount)
        if (avgNodeTime === null) avgNodeTime = completedNodes > 0 ? Math.round(sum / completedNodes) : 0
        if (totalTime === null) {
            if (sum > 0) totalTime = sum
            else totalTime = pickResultNumber(body, WF_DURATION_KEYS) || 0
        }

        return {
            totalNodes: totalNodes,
            completedNodes: completedNodes,
            avgNodeTime: avgNodeTime,
            totalTime: totalTime,
            nodeTimings: nodeTimings
        }
    }

    // 执行统计归一：stats / executionStats 子对象、顶层散字段、嵌套业务体里的统计，任一口径都能读出；
    // 一层都没有但带了节点耗时详情时也照样出统计（四项缺失位显示 0，而不是整块不展示）
    function normalizeWorkflowStats (body) {
        if (!isPlainResult(body)) return null
        const layers = collectStatLayers(body)
        for (let i = 0; i < layers.length; i++) {
            const src = readStatsLayer(layers[i])
            if (src) return buildWorkflowStats(src, body)
        }
        for (let i = 0; i < layers.length; i++) {
            const timings = pickTimingsSource(layers[i])
            if (timings === null) continue
            if (Object.keys(normalizeNodeTimings(timings)).length) {
                return buildWorkflowStats(layers[i], body)
            }
        }
        return null
    }

    // 下一层的业务对象：{ result: { stats, nodeTimings } } 这类「执行结果内嵌一层」的形态
    function pickNestedBusinessBody (body) {
        if (!isPlainResult(body)) return null
        for (let i = 0; i < WF_NESTED_KEYS.length; i++) {
            const inner = body[WF_NESTED_KEYS[i]]
            if (isPlainResult(inner) && hasResultKey(inner, WF_BODY_KEYS)) return inner
        }
        return null
    }

    // 把执行结果（SSE 的 complete 事件体，或曾经的一次性 execute 返回体）收敛成统一形状：
    //   ① 已解包的 content（直接业务体）② 仍带 { data|content|payload|body } 信封
    //   ③ 字符串 / 数字 / 数组 ④ 字段名各版本（见上面的候选表）
    //   ⑤ 都不认识 → 整个业务体 JSON pretty print，绝不只弹一句「执行成功」把数据丢掉
    function normalizeExecuteResult (raw, elapsedMs) {
        let body = raw
        // 剥信封：外层已经带业务字段就停手，避免把 result.output 之类误当信封下钻
        for (let i = 0; i < WF_ENVELOPE_KEYS.length; i++) {
            if (!isPlainResult(body)) break
            const inner = body[WF_ENVELOPE_KEYS[i]]
            if (inner === undefined || inner === null || inner === '') continue
            if (hasResultKey(body, WF_BODY_KEYS)) break
            body = inner
            if (typeof body === 'string') break
        }
        // 剥完不是对象：字符串 / 数字 / 布尔 → 直接当输出；空值 → 空业务体
        if (body === null || body === undefined || body === '') body = {}
        else if (!isPlainResult(body)) body = { output: body }

        const flagRaw = pickResultValue(body, WF_SUCCESS_KEYS)
        const success = !(flagRaw === false || flagRaw === 0 || flagRaw === '0')
        const errorRaw = pickResultText(body, WF_ERROR_KEYS)

        // 业务对象可能整体缩在 result / outputData 里：统计与耗时从嵌套体读（见 collectStatLayers），
        // 展示层仍以最外层业务体为准 —— 嵌套体被原样 JSON 打出来，一个字段都不丢
        const inner = pickNestedBusinessBody(body)

        // 输出：先按候选表取；取不到就把整个业务体打出来（宁可多展示也不空着）
        const outputRaw = pickResultValue(body, WF_OUTPUT_KEYS)
        let output
        if (outputRaw !== undefined) output = stringifyResult(outputRaw)
        else output = Object.keys(body).length ? stringifyResult(body) : ''

        // 耗时：顶层 → 嵌套体 → 本地计时，任一处有值即用；0 也算有效取值（只是不再兜底覆盖）
        const topDuration = pickResultNumber(body, WF_DURATION_KEYS)
        const innerDuration = inner ? pickResultNumber(inner, WF_DURATION_KEYS) : null
        const stats = normalizeWorkflowStats(body)
        let durationMs
        if (topDuration !== null) durationMs = topDuration
        else if (innerDuration !== null) durationMs = innerDuration
        else if (stats && stats.totalTime > 0) durationMs = stats.totalTime
        else durationMs = numberOrZero(elapsedMs)
        if (durationMs < 0) durationMs = 0

        const reasoning = pickResultText(body, WF_REASONING_KEYS) ||
            (inner ? pickResultText(inner, WF_REASONING_KEYS) : '')

        return {
            success: success,
            output: output,
            reasoning: reasoning,
            durationMs: durationMs,
            errorMessage: success ? '' : (errorRaw || '服务端返回执行失败，但未给出错误信息'),
            stats: stats
        }
    }

    // 抛错内容 → 一行可读文案（axios 拦截器抛的可能是 Error / 响应体 / 纯串）
    function readExecuteError (e) {
        if (!e) return '执行失败，请稍后重试'
        if (typeof e === 'string') return e
        if (e.message) return String(e.message)
        const data = e.response && e.response.data
        if (data) {
            if (typeof data === 'string') return data
            const msg = pickResultText(data, WF_ERROR_KEYS)
            if (msg) return msg
        }
        return '执行失败，请稍后重试'
    }

    // ══════════════════════════════════════════════════════════════
    //  单弹框工作流运行：输入参数 → 执行中 → 执行结果，全程同一个 Modal
    // ══════════════════════════════════════════════════════════════
    //  做法（不碰共享 WorkflowList 文件，只在本页内改）：
    //  共享组件的模板里 <Modal> 只出现一次（运行输入弹框），且它没在自己的 components 里
    //  注册 Modal —— SFC 编译成 _resolveComponent('Modal')，运行时先查 instance.type.components、
    //  再退回全局注册（view-ui-plus）。于是在包装组件的 components 里塞一个同名局部组件
    //  WorkflowRunShell，就顶掉了全局解析：共享模板一行不改，拿到的却是「同一个 Modal
    //  容器里切视图」的弹框，页面上自始至终只有这一个工作流 Modal DOM。
    //
    //  视图三态由包装实例持有（runStage + running + runResult），弹框组件通过 inject 读它；
    //  inject 沿组件实例树解析，Modal 的 :transfer 只搬 DOM、不影响依赖注入。
    //
    //  内容顺序与语义对齐后台 /ai/workflow/edit/:id 的结果弹框：
    //    ① 状态 / 耗时 / 错误
    //    ② 执行统计：节点总数 · 完成节点 · 平均耗时 · 总耗时（stats 存在即四项齐出，为 0 也显示 0）
    //    ③ 节点耗时详情：按耗时降序的横条列表（名称 + 进度条 + 数值）
    //    ④ 思考过程（可折叠）
    //    ⑤ 输出结果（<pre> 纯文本，不引 markdown 依赖、不用 v-html）
    const WORKFLOW_RUN_SHELL_KEY = 'maWorkflowRunShell'
    const WORKFLOW_RUN_STAGE = { FORM: 'form', RUNNING: 'running', RESULT: 'result' }

    // 局部 Modal：同一个容器内的三段视图
    // - form    ：头沿用共享插槽（标题「运行工作流」+ 工作流名作副标题）；
    //              体是本地自绘的简洁表单 —— 只有三项：输入参数 + 逐字回复 + 输出思考过程，
    //              不再渲染共享模板那一整块工作流信息（名称 / 状态 / 触发方式 / 节点数 /
    //              历史运行 / 更新时间 / 说明），共享的默认插槽在运行阶段刻意不转交；
    // - running ：自绘执行中视图（同一个弹框内只留转环 + 状态文案；
    //              流式输出与思考过程一律不在这一段展示，只由 SSE 累积到包装实例的缓冲，
    //              等 complete / error 切到结果视图后由「思考过程 / 输出结果」两块承接）
    // - result  ：自绘执行结果视图（统计 / 耗时详情 / 思考过程 / 输出）
    // 三段的页脚都是本地写的，全部右对齐：输入与执行中 = 取消 + 开始执行，结果 = 关闭。
    // 执行中隐藏右上角 ✕（:closable），避免关掉弹框后结果无处可放。
    const WorkflowRunShell = {
        name: 'MaWorkflowRunShell',
        // 必须关掉自动透传：共享模板在 <Modal> 上写了静态 class-name="portal-wf-run"，
        // 而 Vue 3 的 fallthrough attrs 是「覆盖」根节点自身 props 的（mergeProps 后写者胜），
        // 不关掉的话它会把本组件动态的 :class-name 顶回固定值，阶段切换就不再换壳。
        // 关掉后根 Modal 的每个属性都在下面模板里显式绑定，不依赖透传。
        inheritAttrs: false,
        // 只声明 modelValue：共享模板的 v-model 传进来；关回去时用 update:modelValue 回写
        props: {
            modelValue: { type: Boolean, default: false }
        },
        emits: ['update:modelValue'],
        inject: {
            // 包装实例：阶段 / 结果 / 归一后的统计都在它身上
            shell: { from: WORKFLOW_RUN_SHELL_KEY, default: null }
        },
        computed: {
            visible () {
                return !!this.modelValue
            },
            stage () {
                return this.shell ? this.shell.runStage : WORKFLOW_RUN_STAGE.FORM
            },
            isForm () {
                return this.stage === WORKFLOW_RUN_STAGE.FORM
            },
            isRunning () {
                return this.stage === WORKFLOW_RUN_STAGE.RUNNING
            },
            isResult () {
                return this.stage === WORKFLOW_RUN_STAGE.RESULT
            },
            running () {
                return this.shell ? !!this.shell.running : false
            },
            result () {
                return (this.shell && this.shell.runResult) || null
            },
            success () {
                return !!(this.result && this.result.success)
            },
            // 思考过程展开态挂在包装实例上（每次出结果复位为展开）
            reasoningExpanded () {
                return this.shell ? !!this.shell.runReasoningExpanded : true
            },
            // 运行阶段三项表单的模型全部代理到包装实例（不落在这个局部组件上，
            // 免得同一份输入在两处各存一份）。inject 兜底 null，代理里先判空再读写。
            runInput: {
                get () {
                    return this.shell ? this.shell.runInput : ''
                },
                set (value) {
                    if (this.shell) this.shell.runInput = value
                }
            },
            streamingReply: {
                get () {
                    return !!(this.shell && this.shell.streamingReply)
                },
                set (value) {
                    if (this.shell) this.shell.streamingReply = !!value
                }
            },
            showReasoning: {
                get () {
                    return !!(this.shell && this.shell.showReasoning)
                },
                set (value) {
                    if (this.shell) this.shell.showReasoning = !!value
                }
            },
            // 执行中的一句话状态：随 SSE 事件推进（提交请求 → 开始执行 → 当前节点）。
            // 注意：这里只有状态文案。流式输出 / 思考过程虽然在 SSE 里逐块累积到包装实例的
            // 缓冲（runStreamOutput / runStreamReasoning），但一律不在「执行中」这段展示，
            // 等 complete / error 切到「执行结果」视图后，由结果阶段的思考过程 / 输出结果两块统一承接。
            streamStatus () {
                return (this.shell && this.shell.runStreamStatus) || '正在提交执行请求…'
            },
            // 弹框壳类名：输入 / 执行中沿用共享的 .portal-wf-run（1000px 单栏），
            // 结果阶段切到 .ma-wf-result（1000px 单栏）—— 两段同宽、同一个 Modal 容器，
            // 只换 class 不换 DOM，看上去始终是同一个弹框在原地换内容，没有任何宽度跳变；
            // 两套样式各自带祖先后缀、同一时刻只挂一个，
            // 故 .ivu-modal 的 width 不会被两处 !important 互相压制。
            shellClass () {
                return this.isResult ? 'ma-wf-result' : 'portal-wf-run'
            },
            // 副标题里的工作流名：结果未就绪时退回共享的运行对象名
            resultName () {
                const r = this.result
                if (r && r.workflowName) return r.workflowName
                return this.shell ? this.shell.runTargetName : '未命名工作流'
            },
            // 概要行耗时文案：先取本次耗时，再退回统计里的总耗时，最后给 0；
            // 0 也照出（与「值为 0 不判定缺失」口径一致，不用 v-if 藏掉整行）
            durationText () {
                const r = this.result || {}
                const d = numberOrZero(r.durationMs)
                if (d > 0) return d + ' ms'
                const stats = r.stats
                const total = stats ? numberOrZero(stats.totalTime) : 0
                return (total > 0 ? total : 0) + ' ms'
            },
            // 节点耗时详情：按耗时降序。必须是 computed —— 放 methods 里模板取到的是函数本身，
            // `timings.length` 会读成函数 arity（0）而恒假，整块列表永远不渲染。
            // 三种口径（对象映射 / 数组 / 节点日志数组）已由 normalizeNodeTimings 收成同一形状。
            timings () {
                const r = this.result || {}
                const raw = r.stats ? normalizeNodeTimings(r.stats.nodeTimings) : {}
                return Object.keys(raw).map(id => ({
                    id: id,
                    name: raw[id].name,
                    duration: raw[id].duration
                })).sort((a, b) => b.duration - a.duration)
            }
        },
        methods: {
            // 取消 / 关闭 / 点右上角 ✕ 走同一条路：执行中不关（等接口回来在同一个弹框里出结果），
            // 其余情况回写 false 让共享模板的 runDialog.visible 落位，并清掉阶段状态
            close () {
                if (this.running) return
                this.$emit('update:modelValue', false)
                if (this.shell) this.shell.resetRunStage()
            },
            submit () {
                if (!this.shell) return
                this.shell.submitRun()
            },
            toggleReasoning () {
                if (!this.shell) return
                this.shell.runReasoningExpanded = !this.shell.runReasoningExpanded
            },
            // 耗时横条宽度：按当前最慢节点归一化到 0–100%，全为 0 时给 0（防除零）
            timingWidth (duration) {
                const list = this.timings
                if (!list.length) return 0
                let max = 0
                list.forEach(t => {
                    if (t.duration > max) max = t.duration
                })
                if (max <= 0) return 0
                const n = Number(duration) || 0
                return Math.max(0, Math.min(100, Math.round((n / max) * 100)))
            }
        },
        // 模板用字符串内联：vue.config.js 开着 runtimeCompiler，vue$ 别名指向带编译器的
        // vue/dist/vue.esm-bundler.js（导出 compile 并在模块初始化时注册运行时编译器），
        // 组件选项里的 template 会被正常编译；本页不引新的构建期依赖。
        template: `
            <Modal
                :model-value="visible"
                :transfer="true"
                :mask-closable="false"
                :closable="!isRunning"
                width="1000"
                :class-name="shellClass"
                @on-cancel="close"
            >
                <!-- ══ 弹框头：三段各一套（输入沿用共享插槽） ══ -->
                <template #header>
                    <slot v-if="isForm" name="header" />
                    <div v-else-if="isRunning" class="portal-wf-run__header">
                        <span class="portal-wf-run__mark" aria-hidden="true">▶</span>
                        <div class="portal-wf-run__headtext">
                            <h2 class="portal-wf-run__title">执行中</h2>
                            <p class="portal-wf-run__subtitle" :title="resultName">{{ resultName }}</p>
                        </div>
                    </div>
                    <div v-else class="ma-wf-result__header">
                        <span class="ma-wf-result__mark" aria-hidden="true">◈</span>
                        <div class="ma-wf-result__headtext">
                            <h2 class="ma-wf-result__title">执行结果</h2>
                            <p class="ma-wf-result__subtitle" :title="resultName">{{ resultName }}</p>
                        </div>
                        <span class="ma-wf-result__state" :class="success ? 'is-ok' : 'is-fail'">
                            <span class="ma-wf-result__state-dot" aria-hidden="true"></span>
                            {{ success ? '执行成功' : '执行失败' }}
                        </span>
                    </div>
                </template>

                <!-- ══ 弹框体：运行阶段自绘（不转交共享的默认插槽，那块是列表元数据） ══ -->
                <div v-if="isForm" class="ma-wf-run__form">
                    <!-- ① 输入参数：唯一需要用户填的东西，作为 input 变量传给开始节点 -->
                    <section class="ma-wf-run__field">
                        <label class="ma-wf-run__label" for="ma-wf-run-input">输入参数</label>
                        <textarea
                            id="ma-wf-run-input"
                            v-model="runInput"
                            class="ma-wf-run__input"
                            rows="7"
                            maxlength="2000"
                            spellcheck="false"
                            aria-label="输入参数"
                            placeholder="请输入要交给工作流的文本内容"
                        ></textarea>
                    </section>

                    <!-- ② 逐字回复 / ③ 输出思考过程：两个开关，与后台运行弹框同一口径 -->
                    <section class="ma-wf-run__toggles">
                        <div class="ma-wf-run__toggle">
                            <Switch v-model="streamingReply" />
                            <span class="ma-wf-run__toggle-label">逐字回复</span>
                            <span class="ma-wf-run__toggle-hint">开启后 LLM 节点输出逐字流式展示</span>
                        </div>
                        <!-- 输出思考过程只在逐字回复下才有意义：逐字关闭时整行不渲染（后端 showReasoning 也仅在 streaming 下生效） -->
                        <div v-if="streamingReply" class="ma-wf-run__toggle">
                            <Switch v-model="showReasoning" />
                            <span class="ma-wf-run__toggle-label">输出思考过程</span>
                            <span class="ma-wf-run__toggle-hint">开启后透传推理模型思考过程（需模型支持）</span>
                        </div>
                    </section>
                </div>
                <div v-else-if="isRunning" class="ma-wf-run__busy" role="status">
                    <!-- 执行中只给加载与状态反馈：流式输出与思考过程不在这一段展示，
                         它们仍由 SSE 累积在包装实例的缓冲里，等 complete / error 切到结果视图后统一展示 -->
                    <span class="ma-wf-run__spinner" aria-hidden="true"></span>
                    <p class="ma-wf-run__busy-title">正在执行「{{ resultName }}」</p>
                    <p class="ma-wf-run__busy-hint">{{ streamStatus }}</p>
                    <p class="ma-wf-run__busy-hint">执行完成后本弹框会直接显示输出结果与思考过程。</p>
                </div>
                <div v-else class="ma-wf-result__body">
                    <!-- ① 概要：总耗时 + 错误信息（耗时为 0 也照出，不做 v-if 隐藏） -->
                    <p class="ma-wf-result__meta">总耗时：{{ durationText }}</p>
                    <p v-if="result && result.errorMessage" class="ma-wf-result__error" role="alert">
                        {{ result.errorMessage }}
                    </p>

                    <!-- ② 执行统计：stats 存在即四项齐出，取不到显示 0，不用 v-if 隐藏 -->
                    <section v-if="result && result.stats" class="ma-wf-result__panel">
                        <h3 class="ma-wf-result__panel-title">执行统计</h3>
                        <div class="ma-wf-result__stats">
                            <div class="ma-wf-result__stat">
                                <span class="ma-wf-result__stat-label">节点总数</span>
                                <span class="ma-wf-result__stat-value">{{ result.stats.totalNodes }}</span>
                            </div>
                            <div class="ma-wf-result__stat is-ok">
                                <span class="ma-wf-result__stat-label">完成节点</span>
                                <span class="ma-wf-result__stat-value is-ok">{{ result.stats.completedNodes }}</span>
                            </div>
                            <div class="ma-wf-result__stat">
                                <span class="ma-wf-result__stat-label">平均耗时</span>
                                <span class="ma-wf-result__stat-value">{{ result.stats.avgNodeTime }}<small class="ma-wf-result__unit">ms</small></span>
                            </div>
                            <div class="ma-wf-result__stat">
                                <span class="ma-wf-result__stat-label">总耗时</span>
                                <span class="ma-wf-result__stat-value">{{ result.stats.totalTime }}<small class="ma-wf-result__unit">ms</small></span>
                            </div>
                        </div>

                        <!-- ③ 节点耗时详情（横条按最慢节点归一化；只有确实有节点才出这一块） -->
                        <div v-if="timings.length" class="ma-wf-result__timings">
                            <h4 class="ma-wf-result__sub-title">节点耗时详情</h4>
                            <ul class="ma-wf-result__timing-list">
                                <li v-for="(t, i) in timings" :key="t.id" class="ma-wf-result__timing">
                                    <span class="ma-wf-result__timing-rank" aria-hidden="true">{{ i + 1 }}</span>
                                    <span class="ma-wf-result__timing-name" :title="t.name">{{ t.name }}</span>
                                    <span class="ma-wf-result__timing-track" aria-hidden="true">
                                        <span class="ma-wf-result__timing-bar" :style="{ width: timingWidth(t.duration) + '%' }"></span>
                                    </span>
                                    <span class="ma-wf-result__timing-value">{{ t.duration }} ms</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <!-- ④ 思考过程（可折叠） -->
                    <section v-if="result && result.reasoning" class="ma-wf-result__panel ma-wf-result__panel--reasoning">
                        <button
                            type="button"
                            class="ma-wf-result__reasoning-toggle"
                            :aria-expanded="reasoningExpanded ? 'true' : 'false'"
                            @click="toggleReasoning"
                        >
                            <span>思考过程</span>
                            <span class="ma-wf-result__reasoning-hint">{{ reasoningExpanded ? '收起' : '展开' }}</span>
                        </button>
                        <pre v-if="reasoningExpanded" class="ma-wf-result__pre">{{ result.reasoning }}</pre>
                    </section>

                    <!-- ⑤ 输出结果 -->
                    <section class="ma-wf-result__panel">
                        <h3 class="ma-wf-result__panel-title">输出结果</h3>
                        <pre v-if="result && result.output" class="ma-wf-result__pre ma-wf-result__pre--output">{{ result.output }}</pre>
                        <p v-else class="ma-wf-result__empty">本次执行没有返回输出内容。</p>
                    </section>
                </div>

                <!-- ══ 弹框页脚：三段都本地写，全部右对齐（共享模板那行左侧提示语不再渲染） ══ -->
                <template #footer>
                    <div v-if="!isResult" class="portal-wf-run__footer">
                        <Button class="portal-wf-run__cancel" :disabled="running" @click="close">取消</Button>
                        <Button class="portal-wf-run__submit" type="primary" :loading="running" @click="submit">{{ running ? '执行中…' : '开始执行' }}</Button>
                    </div>
                    <div v-else class="ma-wf-result__footer">
                        <button type="button" class="ma-wf-result__close" @click="close">关闭</button>
                    </div>
                </template>
            </Modal>
        `
    }

    // ---------- 本地包装组件：共享列表 + 单弹框三段视图 ----------
    // 用 extends 复用共享 WorkflowList 的模板 / 数据 / props / emits / 样式 / 其余业务逻辑，
    // 只覆盖 openRunDialog / closeRunDialog / submitRun：跑完不关弹框，改在同一容器里切到结果视图。
    // 注意：SFC 的模板编译产物 render 与 scoped 标识 __scopeId、局部组件注册 components
    // 都挂在 WorkflowList 组件对象上，选项合并（extends / mixins）不会带过来 ——
    // 而 instance.render 取的是 instance.type.render、scopeId 取的是 instance.type.__scopeId、
    // 模板里的组件解析也只认 instance.type.components。故这三项必须显式接过来；
    // components 再并一个同名 Modal（WorkflowRunShell）把全局解析顶掉，单弹框就成立。
    const WorkflowListWithResult = {
        name: 'WorkflowListWithResult',
        extends: WorkflowList,
        render: WorkflowList.render,
        __scopeId: WorkflowList.__scopeId,
        components: Object.assign({}, WorkflowList.components, { Modal: WorkflowRunShell }),
        emits: ['nav', 'open-workflow', 'run-result'],
        provide () {
            // 局部 Modal 组件 inject 到本实例，读阶段 / 结果并回调关闭与执行
            return { [WORKFLOW_RUN_SHELL_KEY]: this }
        },
        created () {
            // SSE 句柄刻意不放进 data：AbortController 不需要响应式，
            // 被 Vue 递归代理包一层反而会出怪问题
            this.runStreamAbort = null
            // 卸载标记：卸载后到达的 abort 报错不再往已销毁的实例上落状态
            this.runStreamDead = false
        },
        beforeUnmount () {
            // 离开页面时掐断仍在跑的流，避免后台继续推事件往已卸载的实例上写状态
            this.runStreamDead = true
            this.abortRunStream()
        },
        data () {
            return {
                // 弹框视图：输入 → 执行中 → 执行结果（三个阶段共用同一个 Modal 容器）
                runStage: WORKFLOW_RUN_STAGE.FORM,
                // 标准化后的执行结果（执行中阶段为 null，接口回来才落值）
                runResult: null,
                // 思考过程默认展开（与后台参考页一致）
                runReasoningExpanded: true,
                // 运行阶段三项表单的模型由本地持有（共享组件的 runInput 在此被同名覆盖；
                // 两个开关是本页独有的，共享组件根本没有这两个字段）
                runInput: '',
                streamingReply: false,
                showReasoning: false,
                // 流式缓冲 + 一句话状态：SSE 的 output_delta / reasoning_delta 只往这里累加，
                // 「执行中」阶段不展示任何内容，complete / error 后由结果阶段统一呈现
                runStreamOutput: '',
                runStreamReasoning: '',
                runStreamStatus: '正在提交执行请求…',
                // 从 node_start / node_complete 事件攒出的节点耗时，供结果阶段统计兜底
                runNodeTimings: {},
                runNodeCount: 0
            }
        },
        watch: {
            // 逐字回复关闭时连带把「输出思考过程」关掉：该开关只在流式下有效（后端 showReasoning
            // 仅在 streaming=true 时生效，见 buildStreamUrl），行也已经不渲染，
            // 若保留 true，隐藏状态会带着一个用户看不见的 showReasoning=true
            streamingReply (value) {
                if (!value) this.showReasoning = false
            }
        },
        methods: {
            // 覆盖共享实现：除了复位阶段，其余口径与共享版一致（每次打开都清空上次输入与两个开关）
            openRunDialog (w) {
                this.resetRunStage()
                this.runDialog.workflow = w
                this.runDialog.visible = true
            },

            // 覆盖共享实现：执行中不允许关闭；关掉时把运行输入与结果状态一起清干净
            closeRunDialog () {
                if (this.running) return
                this.resetRunStage()
                this.runDialog.visible = false
            },

            // 阶段复位：回输入视图、清输入 / 开关 / 流式缓冲 / 上次结果（关闭与重新打开共用）
            resetRunStage () {
                this.runStage = WORKFLOW_RUN_STAGE.FORM
                this.runResult = null
                this.runReasoningExpanded = true
                this.runInput = ''
                this.streamingReply = false
                this.showReasoning = false
                this.runStreamOutput = ''
                this.runStreamReasoning = ''
                this.runStreamStatus = '正在提交执行请求…'
                this.runNodeTimings = {}
                this.runNodeCount = 0
            },

            // 掐断进行中的 SSE（组件卸载时用；已结束则是空操作）
            abortRunStream () {
                if (!this.runStreamAbort) return
                try {
                    this.runStreamAbort.abort()
                } catch (e) {
                    // 忽略：句柄可能已随响应结束失效
                }
                this.runStreamAbort = null
            },

            // 执行地址：/ai/workflow/{id}/execute/stream?testRun=true
            //   streaming=true     —— 逐字回复（LLM 节点改流式，逐块推 output_delta）
            //   showReasoning=true —— 透传推理模型思考增量，仅在 streaming 下有意义（与参考页同口径）
            //   input=…            —— 输入参数，作为开始节点的 input 变量
            buildStreamUrl (id) {
                let url = `${Setting.apiBaseURL}/ai/workflow/${id}/execute/stream?testRun=true`
                if (this.streamingReply) url += '&streaming=true'
                if (this.streamingReply && this.showReasoning) url += '&showReasoning=true'
                const input = this.runText(this.runInput)
                if (input) url += `&input=${encodeURIComponent(input)}`
                return url
            },

            // SSE 事件的 data 段 → 对象；不是 JSON 就按纯文本兜（后端偶有裸串）
            parseStreamEvent (raw) {
                const text = typeof raw === 'string' ? raw : ''
                if (!text) return {}
                try {
                    const parsed = JSON.parse(text)
                    return isPlainResult(parsed) ? parsed : { output: parsed }
                } catch (e) {
                    return { output: text, error: text, message: text }
                }
            },

            // 执行期间从事件里攒的节点耗时 → 统计（后端 complete 事件不带 stats 时兜底）
            buildStreamStats (durationMs) {
                const src = { nodeTimings: this.runNodeTimings, durationMs: numberOrZero(durationMs) }
                return buildWorkflowStats(src, src)
            },

            // 覆盖共享实现（「只提示成功 + 关弹框 + 刷列表」）：
            // 改走 SSE 执行，弹框全程不关，事件到齐后在同一个容器里原地切到结果视图。
            // 成功 / 失败都不再飘 toast —— 弹框本身就是反馈，toast 会变成双重提示。
            async submitRun () {
                if (this.running) return
                const w = this.runDialog.workflow
                if (!w || w.id === null || w.id === undefined || w.id === '') {
                    this.$Message.error('缺少工作流 ID，无法运行')
                    return
                }
                const startedAt = Date.now()
                this.running = true
                // 关键：runDialog.visible 保持 true，弹框不关不换，只把容器内视图切成执行中
                this.runStage = WORKFLOW_RUN_STAGE.RUNNING
                this.runResult = null
                this.runStreamStatus = '正在提交执行请求…'

                // 本次运行的身份信息：事件回调里要用来落结果的 workflowId / workflowName
                const ctx = { id: w.id, name: w.name || '未命名工作流', startedAt: startedAt }
                // 收尾只允许发生一次：complete / error / 连接中断都汇到 finishRun
                let settled = false
                const finishRun = (payload) => {
                    if (settled || this.runStreamDead) return
                    settled = true
                    this.abortRunStream()
                    this.running = false
                    this.applyRunResult(payload)
                    this.runStage = WORKFLOW_RUN_STAGE.RESULT
                    this.$emit('run-result', payload)
                    // 运行会累加运行次数，弹框仍开着时静默回读，卡片数据与状态同步
                    this.load()
                }
                // 失败结果的统一形状：失败同样落在同一个弹框里展示，而不是只飘一条 toast；
                // 已经流出来的输出 / 思考保留，用户看过半截就别让它凭空消失
                const failResult = (message) => ({
                    workflowId: ctx.id,
                    workflowName: ctx.name,
                    success: false,
                    output: this.runStreamOutput,
                    reasoning: this.runStreamReasoning,
                    durationMs: Date.now() - ctx.startedAt,
                    errorMessage: message || '执行失败，请稍后重试',
                    stats: Object.keys(this.runNodeTimings).length
                        ? this.buildStreamStats(Date.now() - ctx.startedAt)
                        : null
                })

                const token = localStorage.getItem('token_' + Setting.xmid)
                const controller = new AbortController()
                this.runStreamAbort = controller

                try {
                    await fetchEventSource(this.buildStreamUrl(w.id), {
                        headers: token ? { Token: 'Inco-' + token } : {},
                        signal: controller.signal,
                        openWhenHidden: true,
                        async onopen (response) {
                            if (response.status >= 400) {
                                throw new Error('执行请求失败：HTTP ' + response.status)
                            }
                        },
                        onmessage: (ev) => {
                            const event = this.parseStreamEvent(ev.data)
                            const nodeLabel = event.nodeName || event.nodeId || '未知节点'
                            switch (ev.event) {
                                // 逐字回复：LLM 节点输出增量，只累积进缓冲（执行中不展示）
                                case 'output_delta':
                                    this.runStreamOutput += stringifyResult(event.delta)
                                    break
                                // 输出思考过程：推理增量，同样只累积进缓冲
                                case 'reasoning_delta':
                                    this.runStreamReasoning += stringifyResult(event.reasoning)
                                    break
                                // 节点开始：推进执行中的一句话状态（用户知道卡在哪一步）
                                case 'node_start':
                                    this.runStreamStatus = '正在执行节点：' + nodeLabel
                                    break
                                // 节点完成：攒节点耗时，后端 complete 不带 stats 时用它兜底
                                case 'node_complete':
                                    this.runNodeTimings = Object.assign({}, this.runNodeTimings, {
                                        [event.nodeId || ('node_' + (this.runNodeCount + 1))]: {
                                            name: nodeLabel,
                                            duration: numberOrZero(event.durationMs)
                                        }
                                    })
                                    this.runNodeCount += 1
                                    this.runStreamStatus = '已完成节点：' + nodeLabel
                                    break
                                // 节点出错：只推进状态行，最终成败仍以 complete / error 为准
                                case 'node_error':
                                    this.runStreamStatus = '节点「' + nodeLabel + '」执行失败'
                                    break
                                // 收尾：结果就位 → 同一个弹框切到结果视图
                                case 'complete': {
                                    const payload = Object.assign(
                                        { workflowId: ctx.id, workflowName: ctx.name },
                                        normalizeExecuteResult(event, Date.now() - ctx.startedAt)
                                    )
                                    // 逐字回复时，缓冲里那段就是用户要的最终输出，优先于
                                    // complete 事件的 finalOutput（与参考页同一口径）
                                    if (this.streamingReply && this.runStreamOutput) payload.output = this.runStreamOutput
                                    if (this.streamingReply && this.showReasoning && this.runStreamReasoning) {
                                        payload.reasoning = this.runStreamReasoning
                                    }
                                    if (!payload.stats) payload.stats = this.buildStreamStats(payload.durationMs)
                                    finishRun(payload)
                                    break
                                }
                                // 执行失败：同一个弹框展示失败结果
                                case 'error':
                                    finishRun(failResult(event.error || event.message || event.output))
                                    break
                                default:
                                    // start 等其余事件只作文案，不进结果
                                    if (ev.event === 'start') this.runStreamStatus = '工作流已开始执行…'
                                    break
                            }
                        },
                        onclose: () => {
                            // 服务端收流：正常一定有 complete 在前（参考页也只认它），
                            // 没等到就是半截执行 —— 判失败，但已流出来的内容照旧留在结果里
                            if (settled) return
                            finishRun(failResult('连接已中断，未收到执行完成事件'))
                        },
                        onerror: (err) => {
                            // 抛出以终止 fetchEventSource 的自动重连：重连会重复执行一次工作流
                            if (!settled) finishRun(failResult(readExecuteError(err)))
                            throw err
                        }
                    })
                } catch (e) {
                    // fetchEventSource 自身抛错（URL 非法 / 请求被拦等），同样落成失败结果
                    finishRun(failResult(readExecuteError(e)))
                }
            },

            // 结果落值：字段缺失一律补空串 / 0，模板直接取用不会出现 undefined
            applyRunResult (payload) {
                const r = payload || {}
                // stats 再归一一次：只要带了 stats 就一定出四项统计，识别不出字段也显示 0，而不是整块不展示
                let stats = null
                if (r.stats) {
                    const src = isPlainResult(r.stats) ? r.stats : {}
                    stats = normalizeWorkflowStats(src) || buildWorkflowStats(src, r)
                }
                this.runResult = {
                    workflowName: this.runText(r.workflowName) || '未命名工作流',
                    success: r.success !== false,
                    output: stringifyResult(r.output),
                    reasoning: stringifyResult(r.reasoning),
                    errorMessage: this.runText(r.errorMessage),
                    // 0 是合法展示值，不归一成 null（模板据此决定要不要出概要行）
                    durationMs: numberOrZero(r.durationMs),
                    stats: stats
                }
                this.runReasoningExpanded = true
            },

            // 任意值 → 去空白字符串（与本页 text() 同口径；共享列表组件上没有这个方法）
            runText (value) {
                if (value === null || value === undefined) return ''
                return String(value).trim()
            }
        }
    }

    export default {
        name: 'PortalMineAgents',

        components: {
            PortalConfirmModal,
            // 模板标签仍叫 WorkflowList，但真正挂载的是本页本地的包装组件 WorkflowListWithResult
            // （extends 上面 import 的共享 WorkflowList），单弹框三段视图就靠这层包装生效。
            // 写成 WorkflowList 就会挂回共享旧组件，运行结果仍是「关一个弹框再开一个」。
            WorkflowList: WorkflowListWithResult,
            AgentManageCard,
            AgentCard
        },

        // 内嵌模式（宿主 /portal/mine 工作台面板）：去掉页级 chrome，范围由 mode 决定且不读写路由
        // （顶栏与主题层统一由 /portal 一级壳持有）；
        // 独立路由 /portal/mine/agents 不传这两个 prop，行为与改造前完全一致
        props: {
            embedded: { type: Boolean, default: false },
            mode: { type: String, default: '' } // 'mine' | 'favorites' | 'workflow'
        },

        data () {
            return {
                // 入场族开关：挂载后下一帧一次性开启（降级由 CSS 媒体查询兜底）
                isView: false,

                // 当前范围（mine / favorites / workflow），首屏与后续均由路由 query 决定
                tab: DEFAULT_TAB,
                // 路由里承载范围的参数名（type / page）：切范围写回时沿用同一个键
                tabQueryKey: TAB_QUERY_KEYS[0],

                // 列表三态：loading / loadError / 正常；stale = 静默回读失败（数据可能是旧的）
                loading: false,
                loadError: false,
                stale: false,
                rows: [],

                // 检索：keyword 为已应用词（驱动过滤与网格重建），searchInput 为输入框模型
                keyword: '',
                searchInput: '',

                // 收藏 id 集合（收藏档的返回即收藏集合本身，无需二次请求）
                favIds: [],

                // 正在提交动作的 id 集合：同卡防重复点击
                busyIds: [],

                // 注：工作流执行结果（阶段 / 统计 / 输出）不在本页持有 ——
                // 它由内嵌列表的本地包装组件 WorkflowListWithResult 承担，
                // 与「输入参数」共用同一个 Modal 容器（见脚本里的单弹框一节）。

                // 统一二次确认弹框：只有确认回调才会调接口
                confirm: {
                    visible: false,
                    title: '',
                    content: '',
                    confirmText: '确认',
                    confirmType: 'primary',
                    loading: false,
                    action: null
                }
            }
        },

        computed: {
            tabs () {
                return TABS
            },

            currentTab () {
                const hit = TABS.filter(t => t.key === this.tab)[0]
                return hit || TABS[0]
            },

            isFav () {
                return this.tab === 'favorites'
            },

            // 工作流档：列表由内嵌 WorkflowList 组件承载，本页不取 agent-app 数据
            isWorkflow () {
                return this.tab === 'workflow'
            },

            // 跳过链接文案：随范围切换目标说明
            skipText () {
                return this.isWorkflow ? '跳到工作流列表' : '跳到智能体列表'
            },

            // 页头 kicker 的英文小标
            kickerText () {
                return this.isWorkflow ? '个人中心 · MY WORKFLOWS' : '个人中心 · MY AGENTS'
            },

            // 页头主钮文案：工作流档换「新建工作流」，去向由 goCreate 分流
            createLabel () {
                return this.isWorkflow ? '＋ 新建工作流' : '＋ 新建智能体'
            },

            hasFilter () {
                return !!(this.keyword || '').trim()
            },

            // 关键词过滤：名称 + 描述 + 创建人（描述口径与旧实现一致）
            visibleRows () {
                const kw = (this.keyword || '').trim().toLowerCase()
                if (!kw) return this.rows
                return this.rows.filter(a => {
                    const hay = (a.name + ' ' + a.description + ' ' + a.owner).toLowerCase()
                    return hay.indexOf(kw) !== -1
                })
            },

            // 栏目头标题：关键词优先，其次范围默认名
            // 工作流档例外 —— 它的检索与空态都在 WorkflowList 组件内，标题恒定，
            // 不能被本页残留的 q 检索词改成「搜索结果」
            channelTitle () {
                if (this.isWorkflow) return '我的工作流'
                if (this.hasFilter) return '搜索结果'
                return this.isFav ? '我的收藏' : '我的智能体'
            },

            // 栏目头计数：loading / 失败 / 正常；非默认筛选时追加「当前筛选 M 个」
            countText () {
                if (this.loading) return '加载中…'
                if (this.loadError) return '列表加载失败'
                const total = this.isFav ? '共 ' + this.rows.length + ' 个收藏' : '共 ' + this.rows.length + ' 个'
                if (!this.hasFilter) return total
                return total + ' · 当前筛选 ' + this.visibleRows.length + ' 个'
            },

            // 网格重建键：切范围 / 提交检索时重建 → 入场动画原地重放
            gridKey () {
                return this.tab + '|' + this.keyword
            },

            // 空态标题 / 说明：区分筛选无结果与真空，文案随范围切换
            emptyTitle () {
                if (this.hasFilter) return '没有符合条件的智能体'
                return this.isFav ? '还没有收藏的智能体' : '还没有智能体'
            },

            emptyText () {
                if (this.hasFilter) return '换个关键词或清除筛选条件试试'
                return this.isFav
                    ? '在智能体广场收藏感兴趣的智能体，之后可在这里快速找到'
                    : '创建第一个智能体，用于课程答疑或科研辅助'
            }
        },

        watch: {
            // 路由 query 变化（外链跳转 / 前进后退）→ 同步范围与检索词（内嵌实例不读路由）
            '$route.query' () {
                if (this.embedded) return
                this.syncFromRoute()
            },

            // 宿主 mode 变化（内嵌）→ 范围跟随 mode 重取；不写路由，路由 owner 是宿主页面
            mode () {
                if (!this.embedded) return
                const key = this.resolveTabKey(this.mode)
                if (key && key !== this.tab) {
                    this.tab = key
                    this.loadList()
                }
            }
        },

        mounted () {
            if (this.embedded) {
                // 内嵌：范围由宿主 mode 决定（无法识别则沿用默认档），不读路由、不写路由
                const key = this.resolveTabKey(this.mode)
                if (key) this.tab = key
                this.loadList()
            } else {
                // 首屏：先按路由 query 定位范围与检索词（静默定位，取数统一由下面这次 loadList 发起，
                // 避免「路由命中 + 首屏」两次请求），再拉列表
                this.syncFromRoute(false)
                this.loadList()
            }
            // 入场族：挂载后下一帧一次性加 is-view
            this.$nextTick(() => {
                this.isView = true
            })
        },

        methods: {
            // ---------- 路由同步 ----------
            // 路由 → 页面：范围按 type / page 顺序解析（兼容旧的 ?type=collect 深链），检索词取 q
            // shouldLoad = false 时只定位不发请求（首屏由 mounted 统一取数）
            syncFromRoute (shouldLoad) {
                // 内嵌实例不读路由：范围只由宿主 mode 驱动
                if (this.embedded) return
                const query = (this.$route && this.$route.query) || {}
                const hit = this.readRouteScope()
                if (hit) {
                    this.tabQueryKey = hit.queryKey
                    if (hit.key !== this.tab) {
                        this.tab = hit.key
                        if (shouldLoad !== false) this.loadList()
                    }
                }
                const q = query.q ? String(query.q) : ''
                if (q !== this.keyword) {
                    this.keyword = q
                    this.searchInput = q
                }
            },

            // 读路由范围：返回 { key, queryKey } 或 null
            readRouteScope () {
                const query = (this.$route && this.$route.query) || {}
                for (let i = 0; i < TAB_QUERY_KEYS.length; i++) {
                    const qk = TAB_QUERY_KEYS[i]
                    const raw = query[qk]
                    const value = Array.isArray(raw) ? raw[0] : raw
                    const key = this.resolveTabKey(value)
                    if (key) return { key: key, queryKey: qk }
                }
                return null
            },

            // 路由取值 → 范围 key：去空格 + 忽略大小写；无法识别返回 ''
            resolveTabKey (value) {
                const v = String(value === null || value === undefined ? '' : value).trim().toLowerCase()
                if (!v) return ''
                const hit = TABS.filter(t => t.aliases.indexOf(v) !== -1)[0]
                return hit ? hit.key : ''
            },

            // 页面 → 路由：范围写回 query（replace 不进历史，保留 q 等其它参数；
            // 先清掉另一套范围参数名，避免 ?type=collect&page=agent 自相矛盾；归一后与现状一致就不动）
            syncRouteFromTab () {
                // 内嵌实例不写路由：路由 owner 是宿主页面
                if (this.embedded) return
                if (!this.$router || !this.$route) return
                const query = Object.assign({}, this.$route.query)
                TAB_QUERY_KEYS.forEach(k => { delete query[k] })
                query[this.tabQueryKey || TAB_QUERY_KEYS[0]] = this.currentTab.value

                const cur = this.$route.query || {}
                const curKeys = Object.keys(cur)
                const same = curKeys.length === Object.keys(query).length &&
                    curKeys.every(k => String(cur[k]) === String(query[k]))
                if (same) return

                const result = this.$router.replace({ path: this.$route.path, query: query })
                if (result && typeof result.catch === 'function') result.catch(() => {})
            },

            // 切范围：重新取数 + 写回路由（内嵌实例只取数，不碰路由）
            switchTab (key) {
                if (!this.resolveTabKey(key) || this.tab === key) return
                this.tab = key
                this.loadList()
                if (!this.embedded) this.syncRouteFromTab()
            },

            // ---------- 列表取数 ----------
            // 拉当前范围的列表。silent = 动作后的静默回读：失败不置错误态、不清空，只亮 stale 提示条
            async loadList (silent) {
                // 工作流档：列表在 WorkflowList 组件内自取（workflowList 接口），本页不发请求，
                // 只把本页的三态复位，免得把 agent 档残留的 loading / error 带进这一档
                if (this.isWorkflow) {
                    this.rows = []
                    this.loading = false
                    this.loadError = false
                    this.stale = false
                    return
                }
                const fetch = this.isFav ? agentAppFavorites : agentAppMine
                this.loading = !silent
                if (!silent) this.loadError = false
                try {
                    const data = await fetch()
                    const list = Array.isArray(data)
                        ? data
                        : (data && (Array.isArray(data.list) ? data.list : (Array.isArray(data.rows) ? data.rows : [])))
                    this.rows = list.map((row, i) => this.mapRow(row, i))
                    // 收藏档的返回即收藏集合本身，直接灌进 favIds，无需再单独请求一次
                    if (this.isFav) this.favIds = this.rows.filter(x => x && x.id != null).map(x => String(x.id))
                    this.loadError = false
                    this.stale = false
                } catch (e) {
                    if (silent) {
                        // 静默回读失败：保留当前数据（动作已成功），只提示可能不是最新状态
                        this.stale = true
                    } else {
                        this.rows = []
                        this.loadError = true
                        this.$Message.error((this.isFav ? '收藏列表加载失败' : '智能体列表加载失败') + '，请稍后重试')
                    }
                } finally {
                    this.loading = false
                }
            },

            // 手动重试（错误态 / stale 提示条共用）
            refresh () {
                // 工作流档转交子组件回读（它的加载失败空态自带「重新加载」钮，这里是统一入口兜底）
                if (this.isWorkflow) {
                    const child = this.$refs.workflowList
                    if (child && typeof child.load === 'function') child.load()
                    return
                }
                this.loadList(false)
            },

            // ---------- 行映射（后端行 → 卡片模型） ----------
            // 名称 / 描述一律做「非字符串 → 空串」归一，杜绝 undefined 透传到界面
            mapRow (row, index) {
                const r = row || {}
                const name = this.text(r.name) || '未命名智能体'
                const description = this.text(r.description)
                const av = this.resolveAvatar(r.avatar || r.icon)
                // 展示状态：后端 /toggle 只翻 enabled、不改 status —— 对齐后台 AgentAppList 的启停列。
                // 故「已上线 / 已停用」以 enabled 为准，只有未发布的 draft 才算草稿；
                // 同时兼容后端直接把 status 写成 'disabled' 的返回（两种口径都判为已停用）。
                const rawStatus = this.text(r.status) || 'draft'
                const enabled = this.normalizeEnabled(r.enabled, true)
                const status = rawStatus === 'draft'
                    ? 'draft'
                    : ((rawStatus === 'disabled' || !enabled) ? 'disabled' : 'published')
                const stamp = r.cjsj || r.updatedAt || r.gxsj
                return {
                    id: r.id,
                    name: name,
                    description: description,
                    status: status,
                    enabled: enabled,
                    appType: r.appType === 'workflow' ? 'workflow' : 'standard',
                    usage: Number(r.usage) || 0,
                    owner: this.text(r.owner),
                    // AgentCard 读 item.avatar|icon 与 item.cjsj，故随行保留原字段（v4.0 换卡）
                    avatar: r.avatar,
                    icon: r.icon,
                    cjsj: stamp,
                    cjrxm: r.cjrxm,          // 创建人姓名（AgentCard 的 meta 第二项要展示作者）
                    updatedAt: this.formatDate(stamp),
                    updatedAtFull: this.formatTime(stamp),
                    // 头像三态（与广场 / 收藏卡同一判别式）
                    avatarKind: av.kind,
                    avatarValue: av.kind === 'disc' ? '' : av.value,
                    avatarDisc: name.slice(0, 1)
                }
            },

            // 任意值 → 去空白字符串（null / undefined / 数字 0 之外的非串都安全）
            text (value) {
                if (value === null || value === undefined) return ''
                return String(value).trim()
            },

            // 启停字段归一：后端 tinyint 会给出 0 / 1 或 '0' / '1'，布尔字段则直接给 true / false。
            // false / 0 / '0' 归一为 false，true / 1 / '1' 归一为 true；
            // null / undefined（字段缺失）与无法识别的取值一律走业务默认 defaultValue
            // （未显式停用即视为启用，与原「r.enabled !== false」同口径）
            normalizeEnabled (value, defaultValue) {
                if (value === null || value === undefined) return defaultValue
                if (value === false || value === 0 || value === '0') return false
                if (value === true || value === 1 || value === '1') return true
                return defaultValue
            },

            // 后端时间（ISO-8601）→ 本地日期 / 完整时间；取不到统一给 '-'
            formatDate (t) {
                if (!t) return '-'
                const d = new Date(t)
                return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('zh-CN')
            },

            formatTime (t) {
                if (!t) return '-'
                const d = new Date(t)
                return isNaN(d.getTime()) ? '-' : d.toLocaleString('zh-CN')
            },

            statusLabel (status) {
                return STATUS_LABELS[status] || '草稿'
            },

            // ---------- 头像三态 ----------
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

            // 图片态背景：commonsJs.getBackgroundImage(id, true) + 圆形铺满（纸色垫底，404 不透明）
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

            // ---------- 状态就地更新 ----------
            idKey (a) {
                return a && a.id !== null && a.id !== undefined && a.id !== '' ? String(a.id) : ''
            },

            isBusy (a) {
                return !!this.idKey(a) && this.busyIds.indexOf(this.idKey(a)) !== -1
            },

            // 动作成功后本地立即打补丁（状态角标与按钮当场变），patch 返回 null = 移除该行
            patchRow (a, patch) {
                const key = this.idKey(a)
                if (!key) return
                if (!patch) {
                    this.rows = this.rows.filter(x => this.idKey(x) !== key)
                    return
                }
                this.rows = this.rows.map(x => (this.idKey(x) === key ? Object.assign({}, x, patch) : x))
            },

            // 统一动作执行：确认回调内 await 接口 → 本地打补丁 → 静默回读对齐服务端
            // 返回 true 表示成功（关弹框），false 表示失败（保留弹框）
            async commit (a, patch, request, okText, errText) {
                const key = this.idKey(a)
                if (key && this.busyIds.indexOf(key) !== -1) return false
                if (key) this.busyIds = this.busyIds.concat([key])
                try {
                    await request()
                    this.patchRow(a, patch ? patch(a) : null)
                    this.$Message.success(okText)
                    // 回读失败也会被 loadList(silent) 收进 stale 提示条，不会清空刚打好的本地状态
                    await this.loadList(true)
                    return true
                } catch (e) {
                    this.$Message.error(errText)
                    return false
                } finally {
                    if (key) this.busyIds = this.busyIds.filter(x => x !== key)
                }
            },

            // ---------- 二次确认 ----------
            confirmAction (title, content, action, confirmType) {
                this.confirm.title = title
                this.confirm.content = content
                this.confirm.confirmText = '确认'
                this.confirm.confirmType = confirmType || 'primary'
                this.confirm.loading = false
                this.confirm.action = action
                this.confirm.visible = true
            },

            // 执行待确认操作：loading 防重复；成功关闭并清空回调，失败保留弹框并复位 loading
            async executeConfirmedAction () {
                if (!this.confirm.visible || this.confirm.loading) return
                const action = this.confirm.action
                if (!action) return
                this.confirm.loading = true
                try {
                    const ok = await action()
                    if (ok !== false) {
                        this.confirm.visible = false
                        this.confirm.action = null
                    }
                } catch (e) {
                    this.$Message.error('操作失败，请稍后重试')
                } finally {
                    this.confirm.loading = false
                }
            },

            // ---------- 操作：发布（发布只会在「非在线」时触发：草稿或已下线都会走到这里） ----------
            confirmPublish (a) {
                if (!a) return
                const name = a.name
                this.confirmAction(
                    '发布确认',
                    '发布后「' + name + '」将出现在智能体广场并默认启用，同事即可检索并与它对话。',
                    () => this.commit(
                        a,
                        // 后端 publish 同时置 status=published 与 enabled=true
                        () => ({ status: 'published', enabled: true }),
                        () => agentAppPublish(a.id),
                        '已发布「' + name + '」',
                        '发布失败，请稍后重试'
                    ),
                    'primary'
                )
            },

            // ---------- 操作：下线（后端无取消发布接口 —— 下线即停用，调 toggle(false)） ----------
            confirmOffline (a) {
                if (!a) return
                const name = a.name
                this.confirmAction(
                    '下线确认',
                    '下线后「' + name + '」将从智能体广场移除，无法再被检索；重新发布后即可恢复。',
                    () => this.commit(
                        a,
                        // 下线 = 停用：后端 /toggle 只翻 enabled；本地同时把状态标落到停用档，
                        // 避免静默回读前出现一帧「已发布」（与 confirmToggle 的禁用分支同款）
                        () => ({ enabled: false, status: 'disabled' }),
                        () => agentAppToggle(a.id, false),
                        '「' + name + '」已下线',
                        '下线失败，请稍后重试'
                    ),
                    'primary'
                )
            },

            // ---------- 操作：启用 / 禁用（按 enabled 翻转，措辞与状态标「已下线」一致） ----------
            confirmToggle (a) {
                if (!a) return
                const name = a.name
                const nextEnabled = !a.enabled
                this.confirmAction(
                    nextEnabled ? '启用确认' : '禁用确认',
                    nextEnabled
                        ? '启用后「' + name + '」恢复可运行；已发布时智能体广场同步恢复入口。'
                        : '禁用后「' + name + '」将下线，从智能体广场移除并无法运行。',
                    () => this.commit(
                        a,
                        // 后端 /toggle 只翻 enabled：启用只把 enabled 打回 true（草稿启用后仍是草稿，
                        // 不再强置 published）；禁用同时把状态标落到停用档
                        () => (nextEnabled ? { enabled: true } : { enabled: false, status: 'disabled' }),
                        () => agentAppToggle(a.id, nextEnabled),
                        '「' + name + '」已' + (nextEnabled ? '启用' : '禁用'),
                        nextEnabled ? '启用失败，请稍后重试' : '禁用失败，请稍后重试'
                    ),
                    'primary'
                )
            },

            // ---------- 操作：删除（二次确认，成功后该卡即时从列表移除） ----------
            confirmDelete (a) {
                if (!a) return
                const name = a.name
                this.confirmAction(
                    '删除确认',
                    '确定删除「' + name + '」？删除后不可恢复。',
                    () => this.commit(
                        a,
                        null,
                        () => agentAppDelete(a.id),
                        '已删除「' + name + '」',
                        '删除失败，请稍后重试'
                    ),
                    'error'
                )
            },

            // ---------- 收藏：取消收藏走二次确认（收藏档内恒为「已收藏 → 取消」） ----------
            confirmUnstar (a) {
                if (!a) return
                if (!this.isStarred(a)) {
                    this.addFavorite(a)
                    return
                }
                const name = a.name
                this.confirmAction(
                    '取消收藏确认',
                    '确定取消收藏「' + name + '」？之后可在智能体广场重新收藏。',
                    async () => {
                        try {
                            await agentAppUnfavorite(a.id)
                            this.favIds = this.favIds.filter(x => x !== this.idKey(a))
                            this.rows = this.rows.filter(x => this.idKey(x) !== this.idKey(a))
                            this.$Message.success('已取消收藏「' + name + '」')
                            await this.loadList(true)
                            return true
                        } catch (e) {
                            this.$Message.error('取消收藏失败，请稍后重试')
                            return false
                        }
                    },
                    'error'
                )
            },

            // 收藏（兜底分支：favIds 未同步时仍允许直接收藏）
            async addFavorite (a) {
                if (!a) return
                const key = this.idKey(a)
                if (!key) return
                try {
                    await agentAppFavorite(a.id)
                    if (this.favIds.indexOf(key) === -1) this.favIds = this.favIds.concat([key])
                    this.$Message.success('已收藏「' + a.name + '」')
                } catch (e) {
                    this.$Message.error('收藏失败，请稍后重试')
                }
            },

            isStarred (a) {
                return this.favIds.indexOf(this.idKey(a)) !== -1
            },

            // ---------- 运行 / 跳转 ----------
            // 运行不再按状态拦截（主钮与状态解耦，任何状态都直接进运行页）
            goRun (a) {
                if (!a) return
                this.navigate('/portal/agents/' + encodeURIComponent(this.idKey(a)) + '/run')
            },

            goEdit (a) {
                const id = this.idKey(a)
                this.navigate(id ? '/portal/create/agent/' + encodeURIComponent(id) : '/portal/create/agent')
            },

            goCreate () {
                // 工作流档：进保留的编辑路由的空白表单
                // （WorkflowManage 挂载后读 location.search 的 mode=create，开一张新画布）
                if (this.isWorkflow) {
                    this.navigate(WORKFLOW_EDIT_PATH, { mode: 'create' })
                    return
                }
                this.navigate('/portal/create/agent')
            },

            goPlaza () {
                this.navigate('/portal/agents')
            },

            // 跳转：同路径直接返回 + 吞重复导航错误（仓库既有 goPath 写法）
            // 带 query 时不做同路径短路 —— path 与目标串含 query 的一方无法直接比对，
            // 真重复也由下方 catch 吞掉，行为一致
            navigate (path, query) {
                if (!path) return
                if (!this.$router) return
                if (!query && this.$route && this.$route.path === path) return
                const target = query ? { path, query } : path
                const result = this.$router.push(target)
                if (result && typeof result.catch === 'function') result.catch(() => {})
            },

            // ---------- 检索 ----------
            // 提交（回车 / 检索钮）才把输入框内容写入 keyword → 网格只在提交时重建
            onSearchSubmit (e) {
                if (e && e.preventDefault) e.preventDefault()
                this.searchInput = (this.searchInput || '').trim()
                this.keyword = this.searchInput
            },

            clearFilters () {
                this.keyword = ''
                this.searchInput = ''
                this.$nextTick(() => {
                    const el = this.$el && this.$el.querySelector ? this.$el.querySelector('#ma-search-input') : null
                    if (el && el.focus) el.focus()
                })
            }
        }
    }
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════
   我的智能体 · 门户列表页（页壳退回门户常态，卡片语汇保持不变）
   token 全部来自 body.page-portal-v3（PortalLayout 持有）；
   ① 页壳 = 门户标准容器：--max(1440) 版心 + 顶栏让位 + 底部 --s16 收口，
      与 /portal/kb（.portal-kb-page）同壳——无全幅 banner / 工具带 / 绛红页脚；
   ② 页内 = 页头（kicker / 标题 / 新建主钮）+ 单行工具条（范围 chips / 计数 / 检索）；
   ③ 卡片语汇与同页「我的收藏」卡、以及智能体广场卡（--pg-*）同源：
      42px 渐变缩略带 + 右下 18px 切角 / 40px 圆章头像 / 居中单行名 /
      恒三行描述 / 发丝虚线分割的操作行（栅格与知识库 .kb-grid 同规：版心约 1100px 时 3 列等宽）。
   ④ 工作流档走内嵌 WorkflowList 组件（自带 --wf-* 绛红宣纸令牌与筛选工具条），
      本页只出页头与 chips，卡片区不套 .ma-grid —— 见模板 .ma-wf 注释。
   ══════════════════════════════════════════════════════════════ */

/* ── 入场族：挂载后下一帧加 .is-view；0.7s ease + data-delay 两档 ── */
@keyframes maIn {
    from {
        opacity: 0;
        transform: translateY(24px);
    }

    to {
        opacity: 1;
        transform: none;
    }
}

.ma-effect {
    opacity: 0;
}

.ma-page.is-view .ma-effect {
    animation: maIn .7s ease both;
}

.ma-page.is-view .ma-effect[data-delay='1'] {
    animation-delay: .08s;
}

/* ── 页面壳：门户标准容器（顶栏让位 + --max 版心；不加定位，跳过链接仍相对视口定位） ── */
.ma-page {
    width: 100%;
    max-width: var(--max);
    margin: 0 auto;
    padding: calc(var(--header-h) + var(--s8)) var(--s6) var(--s16);
}

/* ── 内嵌模式：宿主面板自带版心与四周内衬，故撤掉 --max 居中与顶栏让位，
      并去掉自带底衬（否则叠加面板内衬，底部留白偏大）。左右内衬保留。
      双类选择器权重（0,2,0）高于 ≤900 断点的 .ma-page（0,1,0），
      断点里重设的顶部内衬会被本规则盖住，无需在媒体查询里重复覆盖 ── */
.ma-page.is-embedded {
    max-width: none;
    margin: 0;
    padding-top: 0;
    padding-bottom: 0;
}

/* ══ 跳过导航 ══ */
.ma-skip {
    position: absolute;
    left: var(--s4);
    top: -48px;
    z-index: 40;
    padding: var(--s2) var(--s4);
    background: var(--c-red-600);
    color: var(--c-white);
    border-radius: var(--r-sm);
    transition: top var(--t-fast);
}

.ma-skip:focus {
    top: var(--s4);
}

.ma-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* ══ 页头：kicker / 标题 + 右端「新建智能体」主钮；底缘发丝虚线收口 ══ */
.ma-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--s3) var(--s6);
    padding-bottom: var(--s5);
    border-bottom: 1px dashed rgba(153, 42, 24, .25);
}

.ma-head-main {
    min-width: 0;
}

.ma-kicker {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xs);
    line-height: 1;
    letter-spacing: var(--tracking-wider);
    color: var(--c-red-600);
}

.ma-kicker span {
    color: var(--c-gold-500);
    margin-right: var(--s1);
}

.ma-title {
    margin: var(--s2) 0 0;
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 700;
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

/* 新建主钮：绛红实底 + --r-sm（与 .ma-state-btn 同语汇），44 触点 */
.ma-create {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 var(--s5);
    border: 1px solid var(--c-red-600);
    border-radius: var(--r-sm);
    background: var(--c-red-600);
    color: var(--c-white);
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    white-space: nowrap;
    cursor: pointer;
    transition: background var(--t-fast), border-color var(--t-fast);
}

.ma-create:hover {
    background: var(--c-red-500);
    border-color: var(--c-red-500);
}

.ma-create:active {
    background: var(--c-red-700);
    border-color: var(--c-red-700);
}

/* ══ 工具条：单行 = 左范围 chips / 右 计数 + 检索（宣纸底，无白带无阴影） ══ */
.ma-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--s3) var(--s5);
    margin-top: var(--s5);
}

.ma-toolbar-right {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s3) var(--s5);
}

.ma-chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s3);
}

/* 范围 chip：44 触点；选中三重编码（底色 + 实线 + ◈），非仅颜色 */
.ma-chip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 var(--s4);
    border: 1px dashed var(--c-red-600);
    border-radius: var(--r-full);
    background: var(--c-white);
    color: var(--c-ink);
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    cursor: pointer;
    transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
}

.ma-chip:hover {
    background: var(--c-red-100);
}

.ma-chip:active {
    background: var(--c-red-700);
    color: var(--c-white);
}

.ma-chip[aria-pressed='true'] {
    border-style: solid;
    border-color: var(--c-red-600);
    background: var(--c-red-600);
    color: var(--c-white);
}

.ma-chip-mark {
    margin-right: var(--s1);
}

/* 检索表单：2px 红框 + 圆钮（同广场语汇） */
.ma-search {
    display: flex;
    width: 360px;
    max-width: 100%;
    height: var(--s12);
    border: 2px solid var(--c-red-600);
    background: var(--c-white);
    box-shadow: var(--shadow-md);
    border-radius: var(--r-full);
}

.ma-search input {
    flex: 1;
    min-width: 0;
    padding: 0 var(--s4);
    border: 0;
    background: transparent;
    color: var(--c-ink);
    font-size: var(--text-base);
    border-radius: var(--r-full) 0 0 var(--r-full);
}

.ma-search input::placeholder {
    color: var(--c-muted);
}

.ma-search button {
    flex-shrink: 0;
    padding: 0 var(--s5);
    border: 0;
    background: var(--c-red-600);
    color: var(--c-white);
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    white-space: nowrap;
    cursor: pointer;
    border-radius: 0 var(--r-full) var(--r-full) 0;
    transition: background var(--t-fast);
}

.ma-search button:hover {
    background: var(--c-red-500);
}

.ma-search button:active {
    background: var(--c-red-700);
}

/* 计数：随 loading / 失败 / 筛选三态变化（aria-live 已挂模板），单行不折 */
.ma-count {
    margin: 0;
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--c-ink-2);
    white-space: nowrap;
}

/* 折角提示条（静默回读失败）：左 3px 红条 */
.ma-notice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s4);
    margin-top: var(--s4);
    padding: var(--s2) var(--s4);
    background: var(--c-paper-2);
    border-left: 3px solid var(--c-red-600);
    font-size: var(--text-sm);
    color: var(--c-ink-2);
}

.ma-notice button {
    min-height: 44px;
    padding: 0 var(--s4);
    border: 1px solid var(--c-red-600);
    border-radius: var(--r-sm);
    background: var(--c-white);
    color: var(--c-red-600);
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
    cursor: pointer;
    transition: background var(--t-fast), color var(--t-fast);
}

.ma-notice button:hover {
    background: var(--c-red-600);
    color: var(--c-white);
}

/* ══ 栅格：与知识库 .kb-grid 完全同规（auto-fill + min(280px, 100%)，版心约 1100px 时 3 列等宽，
   稀疏结果不被拉伸变形）；卡片等高由栅格拉伸保证（管理卡 .amc-card / 收藏卡 .pg-card 根节点皆 height:100%，v4.0）；
   断点与知识库一致：≤996 一律一行一卡 ══ */
.ma-grid-wrap {
    margin-top: var(--s5);
    scroll-margin-top: calc(var(--header-h) + var(--s4));
}

/* ══ 工作流档落位：内嵌 WorkflowList 的根节点。
   卡片栅格、主题令牌、筛选工具条全由组件自带（其 --wf-* 走 --ag-theme-* 回落即绛红宣纸），
   本页只对齐 .ma-grid-wrap 的外距与锚点偏移，不改组件内部任何样式。 ══ */
.ma-wf {
    margin-top: var(--s5);
    scroll-margin-top: calc(var(--header-h) + var(--s4));
}

.ma-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
    /* 列距与知识库 .kb-grid 统一 --s5（20px）；三面板切换时列宽 / 列距逐像素对齐 */
    gap: var(--s5);
}

.ma-slot {
    min-width: 0;
}

/* 列表项入场：切范围 / 提交检索后逐个落位（16px 上移归位） */
@keyframes maSlotIn {
    from {
        opacity: 0;
        transform: translateY(16px);
    }

    to {
        opacity: 1;
        transform: none;
    }
}

.ma-enter {
    animation: maSlotIn var(--t-base) backwards;
}

/* 状态标：右上角白底压图，带文字（非仅颜色）；三态各有文字 + 描边差异 */
.ma-state-mark {
    position: absolute;
    right: var(--s2);
    top: var(--s2);
    padding: 2px var(--s2);
    background: var(--c-white);
    border: 1px solid var(--c-border);
    color: var(--c-muted);
    font-family: var(--font-body);
    font-size: var(--text-xs);
    line-height: var(--leading-tight);
}

.ma-state-mark.is-published {
    border-color: var(--c-red-600);
    color: var(--c-red-600);
}

.ma-state-mark.is-draft {
    border-color: var(--c-gold-500);
    color: #B36A10;
}

.ma-state-mark.is-disabled {
    border-color: var(--c-ink-2);
    color: var(--c-ink-2);
}

/* 元信息行：使用次数 · 更新日期，单行省略，完整时间走 title */
.ma-meta {
    display: flex;
    align-items: center;
    gap: var(--s2);
    margin: auto 0 0;
    font-size: var(--text-xs);
    line-height: var(--leading-body);
    color: var(--c-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.ma-meta-dot {
    color: var(--c-border);
}

/* ══ 空态 / 错误态 ══ */
.ma-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--s3);
    min-height: 320px;
    padding: var(--s10) var(--s6);
    background: var(--c-white);
    border: 1px dashed var(--c-border);
    text-align: center;
}

.ma-state--plain {
    background: transparent;
    border: 0;
}

.ma-state-seal {
    position: relative;
    width: 88px;
    height: 88px;
    display: grid;
    place-items: center;
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    line-height: 1;
    color: var(--c-red-600);
    background: linear-gradient(160deg, #fff8ef, var(--c-paper));
    box-shadow: inset 0 0 0 4px var(--c-red-100);
    border-radius: var(--r-full);
}

.ma-state-seal::after {
    content: '';
    position: absolute;
    inset: calc(var(--s2) * -1);
    border: 1px dashed var(--c-red-600);
    border-radius: var(--r-full);
    pointer-events: none;
    transition: transform .5s ease;
}

.ma-state-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xl);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

.ma-state-text {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--c-ink-2);
}

.ma-state-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: var(--s3);
    margin-top: var(--s2);
}

.ma-state-btn {
    min-height: 44px;
    padding: 0 var(--s6);
    border: 0;
    border-radius: var(--r-sm);
    background: var(--c-red-600);
    color: var(--c-white);
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
    cursor: pointer;
    transition: background var(--t-fast);
}

.ma-state-btn:hover {
    background: var(--c-red-500);
}

.ma-state-btn:active {
    background: var(--c-red-700);
}

/* ══ 骨架屏：结构镜像真卡 → 与真卡同高，加载结束零跳变 ══ */
.ma-sk-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--c-white);
    border: 1px solid var(--c-border);
    overflow: hidden;
}

.ma-sk-thumb {
    height: 42px;
    background: var(--c-paper);
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
    animation: maPulse 1.2s ease-in-out infinite;
}

.ma-sk-body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: var(--s2);
    padding: var(--s3) var(--s4);
}

.ma-sk-avatar {
    width: var(--s10);
    height: var(--s10);
    margin: 0 auto;
    border-radius: var(--r-full);
    background: var(--c-red-100);
    animation: maPulse 1.2s ease-in-out infinite;
}

.ma-sk-name {
    width: 70%;
    height: calc(var(--text-base) * var(--leading-body));
    margin: 0 auto;
    border-radius: var(--r-sm);
    background: var(--c-red-100);
    animation: maPulse 1.2s ease-in-out infinite;
}

.ma-sk-desc {
    display: flex;
    flex-direction: column;
    gap: var(--s1);
    width: 92%;
    height: calc(var(--text-xs) * var(--leading-body) * 3);
}

.ma-sk-sub {
    flex: 1;
    min-height: 0;
    border-radius: var(--r-sm);
    background: var(--c-red-100);
    animation: maPulse 1.2s ease-in-out infinite;
}

.ma-sk-meta {
    width: 60%;
    height: var(--text-xs);
    margin-top: auto;
    border-radius: var(--r-sm);
    background: var(--c-red-100);
    animation: maPulse 1.2s ease-in-out infinite;
}

.ma-sk-act {
    display: flex;
    flex-wrap: wrap;
    gap: var(--s2);
    padding: var(--s2) var(--s4) var(--s3);
    border-top: 1px dashed rgba(153, 42, 24, .25);
}

.ma-sk-btn {
    width: 46px;
    height: 30px;
    border-radius: var(--r-sm);
    background: var(--c-red-100);
    animation: maPulse 1.2s ease-in-out infinite;
}

/* 全页唯一 infinite：仅加载态出现 */
@keyframes maPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .45; }
}

/* ══ hover / press 反馈（触屏不误触发位移） ══ */
@media (hover: hover) {
    .ma-state:hover .ma-state-seal::after {
        transform: rotateY(180deg);
    }
}

/* ══ ≤996：栅格收 1 列（与知识库 .kb-grid 同步，三面板同宽降级一致） ══ */
@media (max-width: 996px) {
    .ma-grid {
        grid-template-columns: minmax(0, 1fr);
    }
}

/* ══ ≤900：工具条纵向堆叠（chips 一行、计数与检索一行）+ 内衬同收 --s4 ══ */
@media (max-width: 900px) {
    .ma-page {
        padding: calc(var(--header-h) + var(--s6)) var(--s4) var(--s12);
    }

    .ma-title {
        font-size: var(--text-xl);
    }

    /* 入场直出全显（等效 data-delay 全置 0）——须与 .ma-page.is-view 规则同权重才能盖过它 */
    .ma-effect,
    .ma-page.is-view .ma-effect {
        opacity: 1;
        animation: none;
    }

    .ma-toolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .ma-toolbar-right {
        justify-content: space-between;
    }

    .ma-search {
        flex: 1 1 auto;
        width: auto;
    }
}

/* ══ ≤600：页头纵向堆叠（新建钮整宽） ══ */
@media (max-width: 600px) {
    .ma-head {
        flex-direction: column;
        align-items: flex-start;
    }

    .ma-create {
        width: 100%;
        justify-content: center;
    }

    .ma-toolbar-right {
        flex-direction: column;
        align-items: stretch;
        gap: var(--s2);
    }
}

/* ══ 动效降级：reduce 全量直出，去上浮与翻转 ══ */
@media (prefers-reduced-motion: reduce) {
    .ma-effect,
    .ma-page.is-view .ma-effect {
        opacity: 1;
        animation: none;
    }

    .ma-enter {
        animation: none;
    }

    .ma-sk-thumb,
    .ma-sk-avatar,
    .ma-sk-name,
    .ma-sk-sub,
    .ma-sk-meta,
    .ma-sk-btn {
        animation: none;
    }

    .ma-state:hover .ma-state-seal::after {
        animation: none;
        transform: none;
    }

    .ma-state-seal::after,
    .ma-skip {
        transition: none;
    }
}

/* ══════════════════════════════════════════════════════════════
   工作流单弹框：.portal-wf-run（输入 / 执行中，1000px）⇄ .ma-wf-result（结果，1000px）
   ──────────────────────────────────────────────────────────────────────
   这不是两个弹框，是同一个 Modal 容器的两种外观：局部组件 MaWorkflowRunShell 在
   阶段切换时只换 :class-name（portal-wf-run ⇄ ma-wf-result），DOM 不重建、不闪烁。
   两段同为 1000px（与 Modal 的 width prop、.portal-wf-run .ivu-modal 三处一致），
   阶段切换不发生任何宽度跳变；两套样式各自带祖先前缀、同一时刻只挂一个，
   .ivu-modal 的 width 不存在两条 !important 互相压制。
   ══════════════════════════════════════════════════════════════ */

/* 阶段切换过渡：width 两段同值、无位移可演（留着以防日后单段再调宽），
   top 仍是 9vh → 6vh 的一次轻微上移；只挂 class 时同样生效（按「变更后的样式」取 transition） */
:global(.portal-wf-run .ivu-modal),
:global(.ma-wf-result .ivu-modal) {
    transition: width .26s ease, top .26s ease;
}

/* ══════════════════════════════════════════════════════════════
   工作流执行结果弹框（.ma-wf-result，宽 1000px，与运行阶段同宽）
   ① 内容顺序与语义对齐后台 /ai/workflow/edit/:id 的结果弹框：
      状态 / 耗时 / 错误 → 执行统计（四项）→ 节点耗时详情
      → 思考过程（可折叠）→ 输出结果；
   ② 外观沿用门户既有语汇（与 PortalConfirmModal / .portal-wf-run 同族）：
      宣纸底 + 绛红主色 + 展示体标题 + 金色点缀；统计卡与耗时表用发丝虚线收口，
      与本页卡片「发丝描边 + 发丝分割」同一套口吻；
   ③ Modal :transfer 到 body，样式落在本组件作用域之外，
      故全部用 :global() 书写（与 PortalConfirmModal 同一处理）——
      所有选择器都带 .ma-wf-result 祖先前缀，不会外溢到其它页面；
   ④ 输出 / 思考过程一律 <pre> 纯文本展示，不引 markdown 依赖、不用 v-html。
   ══════════════════════════════════════════════════════════════ */
:global(.ma-wf-result) {
    padding: 20px 16px;
    font-family: var(--font-body, "Microsoft YaHei", "微软雅黑", "PingFang SC", "Segoe UI", sans-serif);
}

/* 宽 1000px：与运行阶段（.portal-wf-run .ivu-modal）同宽，两段切换零跳变。
   仍保留 !important —— Modal 的 width prop 写的是行内样式，不加的话行内值会赢；
   两处声明值一致，命中哪条都是 1000px，不存在压制。
   max-width: 100% 让窄屏继续按视口收缩（壳内边距已吃掉 32px）。
   top 6vh 比运行段（9vh）更靠上：结果段内容更长（统计 + 耗时表 + 思考 + 输出），
   body 另有 66vh 内部滚动兜底，位置靠上给内容多留一屏。 */
:global(.ma-wf-result .ivu-modal) {
    width: 1000px !important;
    max-width: 100%;
    margin: 0 auto;
    top: 6vh;
}

:global(.ma-wf-result .ivu-modal-content) {
    position: relative;
    overflow: hidden;
    background: var(--c-paper-2, #F7EBDF);
    border: 1px solid var(--c-border, rgba(26, 20, 16, .12));
    border-radius: var(--r-md, 8px);
    box-shadow: var(--shadow-md, 0 8px 24px rgba(26, 20, 16, .12));
}

/* 顶部一道绛红→金细线：宣纸卷轴的封口，与页头印章呼应 */
:global(.ma-wf-result .ivu-modal-content::before) {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--c-red-600, #992A18), var(--c-gold-500, #F69C20) 62%, var(--c-red-600, #992A18));
}

:global(.ma-wf-result .ivu-modal-header) {
    padding: 22px 24px 16px;
    margin: 0;
    border-bottom: 1px dashed var(--c-border, rgba(26, 20, 16, .14));
    background: transparent;
}

:global(.ma-wf-result .ma-wf-result__header) {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-right: 32px;
}

/* 印章：绛红圆底 + 金色印文，与门户「运行 / 确认」语义一致 */
:global(.ma-wf-result .ma-wf-result__mark) {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--c-red-600, #992A18);
    color: var(--c-gold-500, #F69C20);
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, .28);
    font-size: 15px;
    line-height: 1;
}

:global(.ma-wf-result .ma-wf-result__headtext) {
    flex: 1 1 auto;
    min-width: 0;
}

:global(.ma-wf-result .ma-wf-result__title) {
    margin: 0;
    color: var(--c-ink, #1A1410);
    font-family: var(--font-display, "Noto Serif SC", "Songti SC", SimSun, Georgia, serif);
    font-size: 18px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: .04em;
}

:global(.ma-wf-result .ma-wf-result__subtitle) {
    margin: 3px 0 0;
    overflow: hidden;
    color: var(--c-muted, #8C847E);
    font-size: 12.5px;
    line-height: 1.4;
    white-space: nowrap;
    text-overflow: ellipsis;
}

/* 状态胶囊：绿=成功 / 绛红=失败，带圆点 + 文字（非仅颜色） */
:global(.ma-wf-result .ma-wf-result__state) {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px 4px 10px;
    border: 1px solid transparent;
    border-radius: var(--r-full, 999px);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.6;
    white-space: nowrap;
}

:global(.ma-wf-result .ma-wf-result__state-dot) {
    width: 6px;
    height: 6px;
    flex: 0 0 6px;
    border-radius: 50%;
    background: currentColor;
}

:global(.ma-wf-result .ma-wf-result__state.is-ok) {
    background: rgba(46, 125, 91, .1);
    border-color: rgba(46, 125, 91, .3);
    color: #2E7D5B;
}

:global(.ma-wf-result .ma-wf-result__state.is-fail) {
    background: rgba(153, 42, 24, .1);
    border-color: rgba(153, 42, 24, .3);
    color: var(--c-red-600, #992A18);
}

:global(.ma-wf-result .ivu-modal-close) {
    top: 20px;
    right: 20px;
    color: var(--c-muted, #8C847E);
}

:global(.ma-wf-result .ivu-modal-close:hover) {
    color: var(--c-red-600, #992A18);
}

/* 弹框体：外层滚动兜底（66vh，弹框顶在 6vh，底部页脚与头始终留在视口内）。
   内层另有各自滚动：耗时表 220px、思考 / 输出 <pre> 320px（输出 40vh），
   两级滚动互不干扰（内层块是 flex 子项，宽度随 1000px 弹框自适应，不定高）。 */
:global(.ma-wf-result .ivu-modal-body) {
    max-height: 66vh;
    overflow-y: auto;
    padding: 18px 24px 4px;
}

:global(.ma-wf-result .ma-wf-result__body) {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

/* 概要行：总耗时（0 也照出）+ 小金点分隔 */
:global(.ma-wf-result .ma-wf-result__meta) {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--c-ink-2, #3D342C);
    font-size: 12.5px;
    line-height: 1.6;
}

:global(.ma-wf-result .ma-wf-result__meta::before) {
    content: '';
    width: 5px;
    height: 5px;
    flex: 0 0 5px;
    border-radius: 50%;
    background: var(--c-gold-500, #F69C20);
}

/* 错误条：左 3px 绛红竖条，替代参考页的纯文本 */
:global(.ma-wf-result .ma-wf-result__error) {
    margin: 0;
    padding: 10px 12px;
    background: rgba(153, 42, 24, .08);
    border-left: 3px solid var(--c-red-600, #992A18);
    border-radius: 0 var(--r-sm, 4px) var(--r-sm, 4px) 0;
    color: var(--c-red-700, #7E2214);
    font-size: 13px;
    line-height: 1.7;
    overflow-wrap: anywhere;
}

:global(.ma-wf-result .ma-wf-result__panel) {
    min-width: 0;
    padding: 14px 16px;
    background: var(--c-paper, #EFE3D7);
    border: 1px solid var(--c-border, rgba(26, 20, 16, .12));
    border-radius: var(--r-md, 8px);
}

/* 栏标题：绛红小方块 + 展示体 */
:global(.ma-wf-result .ma-wf-result__panel-title) {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px;
    color: var(--c-ink, #1A1410);
    font-family: var(--font-display, "Noto Serif SC", "Songti SC", SimSun, Georgia, serif);
    font-size: 14px;
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: .04em;
}

:global(.ma-wf-result .ma-wf-result__panel-title::before) {
    content: '';
    width: 3px;
    height: 14px;
    flex: 0 0 3px;
    background: var(--c-red-600, #992A18);
    border-radius: 1px;
}

/* 统计四宫格：宽屏 4 列（弹框 1000px 时每格约 220px），窄屏 ≤640px 降 2 列 */
:global(.ma-wf-result .ma-wf-result__stats) {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
}

/* 统计卡：白底 + 发丝描边 + 左 3px 绛红侧标；0 也出数字，不留空 */
:global(.ma-wf-result .ma-wf-result__stat) {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    padding: 10px 12px;
    background: var(--c-white, #fff);
    border: 1px dashed var(--c-border, rgba(26, 20, 16, .16));
    border-left: 3px solid var(--c-red-600, #992A18);
    border-radius: 0 var(--r-sm, 4px) var(--r-sm, 4px) 0;
}

:global(.ma-wf-result .ma-wf-result__stat.is-ok) {
    border-left-color: #2E7D5B;
}

:global(.ma-wf-result .ma-wf-result__stat-label) {
    overflow: hidden;
    color: var(--c-muted, #8C847E);
    font-size: 12px;
    line-height: 1.4;
    white-space: nowrap;
    text-overflow: ellipsis;
}

:global(.ma-wf-result .ma-wf-result__stat-value) {
    color: var(--c-ink, #1A1410);
    font-family: var(--font-display, "Noto Serif SC", "Songti SC", SimSun, Georgia, serif);
    font-size: 18px;
    font-weight: 700;
    line-height: 1.25;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}

:global(.ma-wf-result .ma-wf-result__stat-value.is-ok) {
    color: #2E7D5B;
}

/* 单位（ms）：跟数字走但字号与色相退一档，避免和数值抢视觉 */
:global(.ma-wf-result .ma-wf-result__unit) {
    margin-left: 2px;
    color: var(--c-muted, #8C847E);
    font-family: var(--font-body, "Microsoft YaHei", sans-serif);
    font-size: 11px;
    font-weight: 500;
}

/* 宽屏统计卡改横向一行：弹框放到 1000px 后每格约 220px，竖排（标在上、数在下）
   会在右侧留一大片空白，视觉重心偏左；改成「标签靠左 / 数值靠右」后，
   整条读起来就是一行数据，与下方耗时行的「名称 / 进度条 / 数值」同一口吻。
   对齐用 center 而不是 baseline —— 标签带 overflow: hidden（滚动容器），
   浏览器会拿边框盒合成基线，baseline 对齐会把小字标签顶到数字下面去。
   门限 641px —— 与下面 ≤640px 的两列竖排断点严格错开，两套规则不同时命中。 */
@media (min-width: 641px) {
    :global(.ma-wf-result .ma-wf-result__stat) {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
    }

    :global(.ma-wf-result .ma-wf-result__stat-label) {
        flex: 0 1 auto;
        min-width: 0;
    }

    :global(.ma-wf-result .ma-wf-result__stat-value) {
        flex: 0 0 auto;
        text-align: right;
    }
}

/* 节点耗时详情：与统计卡之间用发丝虚线分块 */
:global(.ma-wf-result .ma-wf-result__timings) {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px dashed var(--c-border, rgba(26, 20, 16, .16));
}

:global(.ma-wf-result .ma-wf-result__sub-title) {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 8px;
    color: var(--c-ink-2, #3D342C);
    font-size: 12.5px;
    font-weight: 600;
    line-height: 1.5;
}

:global(.ma-wf-result .ma-wf-result__sub-title::before) {
    content: '';
    width: 3px;
    height: 12px;
    flex: 0 0 3px;
    background: var(--c-gold-500, #F69C20);
    border-radius: 1px;
}

:global(.ma-wf-result .ma-wf-result__timing-list) {
    max-height: 220px;
    margin: 0;
    padding: 0 2px 0 0;
    overflow-y: auto;
    list-style: none;
}

/* 一行 = 名次 + 名称（限宽省略）+ 进度条 + 数值
   名称列由 120px 放宽到 200px：弹框 1000px 时内容区约 920px，120px 只放得下
   约 9 个汉字，节点名（"LLM 生成回答" / "条件分支判断" …）几乎总被截断；
   进度条是 minmax(0, 1fr)，多出来的宽度全给它，窄屏由下面的媒体查询整行改版。 */
:global(.ma-wf-result .ma-wf-result__timing) {
    display: grid;
    grid-template-columns: 20px 200px minmax(0, 1fr) 64px;
    gap: 10px;
    align-items: center;
    padding: 5px 0;
}

:global(.ma-wf-result .ma-wf-result__timing-rank) {
    width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(153, 42, 24, .1);
    color: var(--c-red-600, #992A18);
    font-family: var(--font-display, "Noto Serif SC", SimSun, Georgia, serif);
    font-size: 11px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
}

:global(.ma-wf-result .ma-wf-result__timing-name) {
    min-width: 0;
    overflow: hidden;
    color: var(--c-ink-2, #3D342C);
    font-size: 12.5px;
    line-height: 1.6;
    white-space: nowrap;
    text-overflow: ellipsis;
}

:global(.ma-wf-result .ma-wf-result__timing-track) {
    display: block;
    height: 6px;
    overflow: hidden;
    background: rgba(26, 20, 16, .08);
    border-radius: var(--r-full, 999px);
}

:global(.ma-wf-result .ma-wf-result__timing-bar) {
    display: block;
    height: 100%;
    min-width: 2px;
    background: linear-gradient(90deg, var(--c-red-600, #992A18), var(--c-gold-500, #F69C20));
    border-radius: var(--r-full, 999px);
}

:global(.ma-wf-result .ma-wf-result__timing-value) {
    color: var(--c-muted, #8C847E);
    font-size: 12px;
    line-height: 1.6;
    text-align: right;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}

/* 思考过程：整块可点，金底提示条；内容走 <pre> 纯文本 */
:global(.ma-wf-result .ma-wf-result__reasoning-toggle) {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 34px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #A86509;
    font-family: var(--font-body, "Microsoft YaHei", sans-serif);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.5;
    text-align: left;
    cursor: pointer;
}

:global(.ma-wf-result .ma-wf-result__reasoning-hint) {
    margin-left: auto;
    padding: 2px 12px;
    background: rgba(246, 156, 32, .18);
    border: 1px solid rgba(246, 156, 32, .45);
    border-radius: var(--r-full, 999px);
    color: #A86509;
    font-size: 12px;
    font-weight: 500;
}

:global(.ma-wf-result .ma-wf-result__reasoning-toggle:hover .ma-wf-result__reasoning-hint) {
    background: rgba(246, 156, 32, .3);
    border-color: var(--c-gold-500, #F69C20);
    color: var(--c-red-700, #7E2214);
}

:global(.ma-wf-result .ma-wf-result__reasoning-toggle:focus-visible) {
    outline: 2px solid var(--c-ring, rgba(246, 156, 32, .55));
    outline-offset: 2px;
}

/* 输出 / 思考内容：<pre> 保留换行与缩进，纯文本安全展示（不解析 HTML / Markdown） */
:global(.ma-wf-result .ma-wf-result__pre) {
    max-height: 320px;
    margin: 10px 0 0;
    padding: 12px 14px;
    overflow: auto;
    background: var(--c-white, #fff);
    border: 1px solid var(--c-border, rgba(26, 20, 16, .12));
    border-radius: var(--r-sm, 4px);
    color: var(--c-ink, #1A1410);
    font-family: Menlo, Consolas, "Courier New", monospace;
    font-size: 12.5px;
    line-height: 1.75;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: anywhere;
    -webkit-overflow-scrolling: touch;
}

/* 输出区给一道更明确的绛红边，视觉上压住「这是主结果」 */
:global(.ma-wf-result .ma-wf-result__pre--output) {
    max-height: 40vh;
    border-color: rgba(153, 42, 24, .28);
    box-shadow: inset 3px 0 0 var(--c-red-600, #992A18);
}

:global(.ma-wf-result .ma-wf-result__empty) {
    margin: 0;
    color: var(--c-muted, #8C847E);
    font-size: 13px;
    line-height: 1.7;
}

:global(.ma-wf-result .ivu-modal-footer) {
    padding: 0 24px 20px;
    border-top: 0;
}

:global(.ma-wf-result .ma-wf-result__footer) {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 14px;
    border-top: 1px dashed var(--c-border, rgba(26, 20, 16, .16));
}

:global(.ma-wf-result .ma-wf-result__close) {
    flex: 0 0 auto;
    min-width: 96px;
    min-height: 36px;
    margin: 0;
    border: 1px solid var(--c-ink-2, #3D342C);
    border-radius: var(--r-md, 8px);
    background: var(--c-paper, #EFE3D7);
    color: var(--c-ink-2, #3D342C);
    font-family: var(--font-body, "Microsoft YaHei", sans-serif);
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    transition: background var(--t-fast, 150ms ease), border-color var(--t-fast, 150ms ease), color var(--t-fast, 150ms ease);
}

:global(.ma-wf-result .ma-wf-result__close:hover) {
    background: var(--c-paper-2, #F7EBDF);
    border-color: var(--c-ink, #1A1410);
    color: var(--c-ink, #1A1410);
}

:global(.ma-wf-result .ma-wf-result__close:focus-visible) {
    outline: 2px solid var(--c-ring, rgba(246, 156, 32, .55));
    outline-offset: 2px;
}

/* 弹框响应式：窄屏统计降 2 列、耗时行改两段（名称独占一行） */
@media (max-width: 640px) {
    :global(.ma-wf-result) {
        padding: 12px;
    }

    :global(.ma-wf-result .ivu-modal) {
        top: 4vh;
    }

    :global(.ma-wf-result .ivu-modal-header) {
        padding: 16px 16px 12px;
    }

    :global(.ma-wf-result .ma-wf-result__header) {
        flex-wrap: wrap;
        padding-right: 28px;
    }

    :global(.ma-wf-result .ma-wf-result__headtext) {
        flex: 1 1 100%;
        order: 3;
    }

    :global(.ma-wf-result .ma-wf-result__state) {
        order: 2;
        margin-left: auto;
    }

    :global(.ma-wf-result .ivu-modal-body) {
        max-height: 70vh;
        padding: 14px 16px 4px;
    }

    :global(.ma-wf-result .ma-wf-result__panel) {
        padding: 12px;
    }

    :global(.ma-wf-result .ma-wf-result__stats) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    :global(.ma-wf-result .ma-wf-result__stat-value) {
        font-size: 16px;
    }

    /* 窄屏：名次 + 进度条同行，名称独占一行，数值跟在进度条后 */
    :global(.ma-wf-result .ma-wf-result__timing) {
        grid-template-columns: 20px minmax(0, 1fr) 62px;
        row-gap: 4px;
    }

    :global(.ma-wf-result .ma-wf-result__timing-name) {
        grid-column: 1 / -1;
        grid-row: 1;
        padding-left: 30px;
        text-indent: -30px;
    }

    :global(.ma-wf-result .ma-wf-result__timing-rank) {
        grid-row: 2;
    }

    :global(.ma-wf-result .ma-wf-result__timing-track) {
        grid-row: 2;
    }

    :global(.ma-wf-result .ma-wf-result__timing-value) {
        grid-row: 2;
    }

    :global(.ma-wf-result .ma-wf-result__timing-list) {
        max-height: 180px;
    }

    :global(.ma-wf-result .ma-wf-result__pre),
    :global(.ma-wf-result .ma-wf-result__pre--output) {
        max-height: 200px;
    }

    :global(.ma-wf-result .ivu-modal-footer) {
        padding: 0 16px 16px;
    }

    :global(.ma-wf-result .ma-wf-result__close) {
        width: 100%;
    }
}

/* ══ 单弹框页脚：全部右对齐 ═════════════════════════════════════════════
   共享组件的运行弹框 footer 原本是「左侧一句提示语 + 右侧两枚钮」。
   本页的页脚已由局部组件 MaWorkflowRunShell 自己写（不再转交共享插槽），
   所以左半边那行提示语根本不会被渲染；这里补一条 justify-content: flex-end
   把剩下的取消 / 开始执行推到右边，窄屏也保持同一行右对齐。
   .ma-wf-result__footer 本身已带 justify-content: flex-end（见上），无需再写。 */
:global(.portal-wf-run .portal-wf-run__footer) {
    justify-content: flex-end;
}

/* 共享组件在 560px 断点把 footer 折行、按钮拉满宽（那套是为左侧提示语让位的）。
   本页没有提示语，按钮不再折行，仍右对齐。 */
@media (max-width: 560px) {
    :global(.portal-wf-run .portal-wf-run__footer) {
        flex-wrap: nowrap;
    }

    :global(.portal-wf-run .portal-wf-run__footer .ivu-btn) {
        flex: 0 0 auto;
        width: auto;
    }
}

/* ══ 执行中视图（.ma-wf-run__*，只在同一个弹框的执行中阶段出现）══════════
   承「接口请求中」的视觉：纸底上一枚绛红→金的转环 + 短文案，
   高度留得比输入/结果两段略矮一点，阶段切换时弹框的呼吸幅度更小。 */
@keyframes maWfSpin {
    to {
        transform: rotate(360deg);
    }
}

:global(.ma-wf-run__busy) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 52px 24px 46px;
    text-align: center;
}

:global(.ma-wf-run__spinner) {
    width: 44px;
    height: 44px;
    box-sizing: border-box;
    border: 3px solid rgba(153, 42, 24, .16);
    border-top-color: var(--c-red-600, #992A18);
    border-right-color: var(--c-gold-500, #F69C20);
    border-radius: 50%;
    animation: maWfSpin .9s linear infinite;
}

:global(.ma-wf-run__busy-title) {
    margin: 4px 0 0;
    color: var(--c-ink, #1A1410);
    font-family: var(--font-display, "Noto Serif SC", "Songti SC", SimSun, Georgia, serif);
    font-size: 15px;
    font-weight: 700;
    line-height: 1.5;
    letter-spacing: .04em;
}

:global(.ma-wf-run__busy-hint) {
    max-width: 30em;
    margin: 0;
    color: var(--c-muted, #8C847E);
    font-size: 12.5px;
    line-height: 1.7;
}

/* ══ 运行阶段表单（.ma-wf-run__*）：单栏三件 —— 输入参数 + 两个开关 ══
   共享组件那块「工作流信息」（名称 / 状态 / 触发方式 / 节点数 / 历史运行 / 更新时间 +
   说明）在本页整块不渲染，运行阶段只剩真正要填与要选的东西。 */
:global(.portal-wf-run .ma-wf-run__form) {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

:global(.portal-wf-run .ma-wf-run__field) {
    min-width: 0;
}

/* 字段标题：绛红小方块 + 展示体，与共享面板标题同一套口吻 */
:global(.portal-wf-run .ma-wf-run__label) {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    color: var(--c-ink, #1A1410);
    font-family: var(--font-display, "Noto Serif SC", "Songti SC", SimSun, Georgia, serif);
    font-size: 14px;
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: .04em;
}

:global(.portal-wf-run .ma-wf-run__label::before) {
    content: '';
    width: 3px;
    height: 14px;
    flex: 0 0 3px;
    background: var(--c-red-600, #992A18);
    border-radius: 1px;
}

/* 输入参数文本域：暖纸底 + 绛红聚焦（沿用共享输入框的同一套反馈） */
:global(.portal-wf-run .ma-wf-run__input) {
    display: block;
    width: 100%;
    min-height: 148px;
    padding: 10px 12px;
    background: var(--c-paper-2, #F7EBDF);
    border: 1px solid rgba(26, 20, 16, .26);
    border-radius: var(--r-md, 8px);
    color: var(--c-ink, #1A1410);
    font-family: var(--font-body, "Microsoft YaHei", sans-serif);
    font-size: 14px;
    line-height: 1.7;
    resize: vertical;
    transition: border-color var(--t-fast, 150ms ease), box-shadow var(--t-fast, 150ms ease);
}

:global(.portal-wf-run .ma-wf-run__input::placeholder) {
    color: var(--c-muted, #8C847E);
}

:global(.portal-wf-run .ma-wf-run__input:hover) {
    border-color: var(--c-red-600, #992A18);
}

:global(.portal-wf-run .ma-wf-run__input:focus) {
    outline: none;
    border-color: var(--c-red-600, #992A18);
    box-shadow: 0 0 0 2px var(--c-ring, rgba(246, 156, 32, .55));
}

/* 两个开关：一张纸卡包住，每行「开关 · 名称 · 说明」三段 */
:global(.portal-wf-run .ma-wf-run__toggles) {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 18px;
    background: var(--c-paper, #EFE3D7);
    border: 1px solid var(--c-border, rgba(26, 20, 16, .12));
    border-radius: var(--r-md, 8px);
}

:global(.portal-wf-run .ma-wf-run__toggle) {
    display: grid;
    grid-template-columns: 40px 88px minmax(0, 1fr);
    align-items: center;
    gap: 14px;
}

:global(.portal-wf-run .ma-wf-run__toggle-label) {
    color: var(--c-ink, #1A1410);
    font-family: var(--font-display, "Noto Serif SC", "Songti SC", SimSun, Georgia, serif);
    font-size: 13.5px;
    font-weight: 700;
    line-height: 1.5;
    letter-spacing: .04em;
    white-space: nowrap;
}

:global(.portal-wf-run .ma-wf-run__toggle-hint) {
    min-width: 0;
    color: var(--c-muted, #8C847E);
    font-size: 12.5px;
    line-height: 1.6;
}

/* View UI Plus 的 Switch 归到门户主色（默认是 iview 蓝） */
:global(.portal-wf-run .ma-wf-run__toggle .ivu-switch) {
    margin: 0;
}

:global(.portal-wf-run .ma-wf-run__toggle .ivu-switch-checked) {
    background: var(--c-red-600, #992A18);
    border-color: var(--c-red-600, #992A18);
}

:global(.portal-wf-run .ma-wf-run__toggle .ivu-switch:focus-within .ivu-switch-inner) {
    box-shadow: 0 0 0 2px var(--c-ring, rgba(246, 156, 32, .55));
}

/* 窄屏：开关行折成两段（说明另起一行独占第二列） */
@media (max-width: 640px) {
    :global(.portal-wf-run .ma-wf-run__toggle) {
        grid-template-columns: 40px minmax(0, 1fr);
        row-gap: 2px;
    }

    :global(.portal-wf-run .ma-wf-run__toggle-hint) {
        grid-column: 2;
    }
}

/* 残留兜底：共享模板的提示语若在别处仍被渲染（本页不渲染），也不占位 */
:global(.portal-wf-run .portal-wf-run__foot-tip) {
    display: none !important;
}

/* ══ 动效降级：单弹框三段内的过渡与循环动画一并收回 ═══════════════════════
   必须放在文件最后：媒体查询不额外加权，声明顺序才是胜负手
   （放在 spinner 基础规则之前会被后面的 animation 覆盖掉）。
   弹框 :transfer 到 body，降级规则照样命中。 */
@media (prefers-reduced-motion: reduce) {
    :global(.ma-wf-result .ma-wf-result__close),
    :global(.ma-wf-result .ma-wf-result__reasoning-toggle),
    :global(.portal-wf-run .ma-wf-run__input),
    :global(.portal-wf-run .ivu-modal),
    :global(.ma-wf-result .ivu-modal) {
        transition: none;
    }

    :global(.ma-wf-run__spinner) {
        animation: none;
    }
}
</style>
