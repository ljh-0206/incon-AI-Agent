<template>
    <div class="workflow-module wf-list" data-module="workflow-list">
        <!-- 模块头：标题与「新建工作流」各自可关。宿主（如「我的工作流」Tab）已自带
             栏目标题或新建入口时传 show-title / show-create = false，此处只剩另一侧的内容；
             两者都关时整块不渲染，列表直接顶到筛选工具条。 -->
        <header v-if="showTitle || showCreate" class="wf-head" :class="{ 'is-bar': !showTitle }">
            <div v-if="showTitle" class="wf-head__text">
                <h1 class="wf-head__title">{{ title }}</h1>
            </div>
            <div v-if="showCreate" class="wf-head__actions">
                <Button type="primary" icon="md-add" @click="createWorkflow">新建工作流</Button>
            </div>
        </header>

        <!-- 筛选工具条：组件自持的关键词 + 状态筛选，独立于宿主页面的检索框 -->
        <section class="wf-toolbar" aria-label="工作流筛选">
            <Input v-model.trim="keyword" class="wf-toolbar__search" clearable placeholder="搜索名称或说明" />
            <Select v-model="status" class="wf-toolbar__select">
                <Option value="all">全部状态</Option>
                <Option value="enabled">已启用</Option>
                <Option value="disabled">已停用</Option>
                <Option value="draft">草稿</Option>
            </Select>
            <span class="wf-toolbar__count">筛选结果 {{ filtered.length }} 项</span>
        </section>

        <!-- 加载 -->
        <div v-if="loading" class="wf-loading">
            <Spin size="large" />
        </div>

        <!-- 卡片列表 -->
        <div v-else-if="filtered.length" class="wf-cards">
            <Card v-for="(w, i) in filtered" :key="w.id" class="wf-card wf-enter" :class="'is-' + w.status"
                :style="{ animationDelay: ((i % 10) * 0.05) + 's' }">
                <!-- 状态角标：卡片右上角主展示，替代左侧色条 -->
                <span class="wf-card__badge" :class="'is-' + w.status">{{ statusLabel(w.status) }}</span>
                <div class="wf-card__head">
                    <span class="wf-card__name" :title="w.name || ''">{{ w.name }}</span>
                </div>
                <p class="wf-card__summary" :title="w.summary || ''">{{ w.summary }}</p>
                <div class="wf-card__meta">
                    <div class="wf-card__meta-tags">
                        <Tag size="small">{{ w.nodeCount }} 节点</Tag>
                        <Tag size="small" v-show="w.cjrxm">创建人：{{ w.cjrxm }} </Tag>
                        <!-- <Tag size="small" v-show="w.version">版本号：{{ w.version }} </Tag> -->
                    </div>
                    <div class="wf-card__meta-stats">
                        <span class="wf-card__stat">更新 {{ w.updatedAt }}</span>
                        <span class="wf-card__stat">运行 {{ w.runs }} 次</span>
                    </div>
                </div>
                <div class="wf-card__actions">
                    <!-- 编辑：进入工作流编辑器入口 -->
                    <Button size="small" @click="editWorkflow(w)">编辑</Button>

                    <!-- 运行：仅已启用可直接运行；点击后由「运行工作流」弹框收集输入参数再执行 -->
                    <Button size="small" type="primary" ghost @click="openRunDialog(w)">运行</Button>

                    <!-- 发布：仅草稿可发布 -->
                    <Button v-if="w.status === 'draft'" size="small" type="success" ghost
                        @click="publish(w)">发布</Button>

                    <!-- 启停：按状态条件显示 -->
                    <Button v-if="w.status === 'enabled'" size="small" @click="toggle(w, 'disabled')">停用</Button>
                    <Button v-if="w.status === 'disabled'" size="small" type="warning" ghost
                        @click="toggle(w, 'enabled')">启用</Button>

                    <!-- 复制：沿用参考页复制逻辑，仅带 name / description / graphData 三个合法字段 -->
                    <Button size="small" :loading="copyingId === w.id" @click="copyWorkflow(w)">复制</Button>

                    <!-- 删除：弹框确认 -->
                    <Button size="small" type="error" ghost @click="confirmDelete(w)">删除</Button>
                </div>
            </Card>
        </div>

        <!-- 空状态：区分「加载失败」「无数据」与「筛选无结果」 -->
        <div v-else class="wf-empty">
            <p class="wf-empty__title">{{ loadFailed ? '加载失败' : (hasFilter ? '没有符合条件的工作流' : '还没有工作流') }}</p>
            <p class="wf-empty__desc">
                {{ loadFailed ? '接口请求失败，可稍后重试。' : (hasFilter ? '调整关键词或状态筛选后再试。' : '手动新建一个工作流，开始配置流程。') }}
            </p>
            <div class="wf-empty__actions">
                <template v-if="loadFailed">
                    <Button type="primary" ghost @click="load">重新加载</Button>
                </template>
                <template v-else-if="hasFilter">
                    <Button @click="resetFilter">清除筛选</Button>
                </template>
                <template v-else>
                    <Button type="primary" @click="createWorkflow">新建工作流</Button>
                </template>
            </div>
        </div>

        <PortalConfirmModal v-model="confirmation.visible" :title="confirmation.title" :content="confirmation.content"
            :confirm-text="confirmation.confirmText" :confirm-type="confirmation.confirmType"
            :loading="confirmation.loading" @confirm="executeConfirmedAction" />

        <!-- 运行工作流：交互与接口调用搬运自参考页 src/components/WorkflowManage.vue 的运行弹框，
             主题按门户（绛红宣纸）重写；宽 1000px 内部为「信息 + 输入参数」两栏 -->
        <Modal v-model="runDialog.visible" :transfer="true" :mask-closable="false" width="1000"
            class-name="portal-wf-run">
            <template #header>
                <div class="portal-wf-run__header">
                    <span class="portal-wf-run__mark" aria-hidden="true">▶</span>
                    <div class="portal-wf-run__headtext">
                        <h2 class="portal-wf-run__title">运行工作流</h2>
                        <p class="portal-wf-run__subtitle" :title="runTargetName">{{ runTargetName }}</p>
                    </div>
                </div>
            </template>

            <div class="portal-wf-run__body">

                <!-- 右栏：输入参数（用户实际填写值，作为 input 传给执行接口） -->
                <section class="portal-wf-run__panel portal-wf-run__panel--input" aria-label="输入参数">
                    <h3 class="portal-wf-run__panel-title">
                        <span>输入参数</span>
                        <span class="portal-wf-run__label-hint"></span>
                    </h3>
                    <textarea v-model="runInput" class="portal-wf-run__input" rows="9" maxlength="2000"
                        spellcheck="false" aria-label="输入参数" placeholder="请输入内容"></textarea>
                </section>
            </div>

            <template #footer>
                <div class="portal-wf-run__footer">
                    <span class="portal-wf-run__foot-tip">运行结果以服务端执行为准，完成后列表会刷新运行次数。</span>
                    <Button class="portal-wf-run__cancel" :disabled="running" @click="closeRunDialog">取消</Button>
                    <Button class="portal-wf-run__submit" type="primary" :loading="running" @click="submitRun">{{
                        running ? '执行中…' : '开始执行' }}</Button>
                </div>
            </template>
        </Modal>
    </div>
</template>

<script>
import { camelize } from 'vue'
import { Message } from 'view-ui-plus'
import { workflowList, workflowDelete, workflowPublish, workflowToggle, workflowExecute, workflowCreate } from '@/api/workflow'
import PortalConfirmModal from '@/pages/portal/components/PortalConfirmModal.vue'

const STATUS_LABEL = { enabled: '已启用', disabled: '已停用', draft: '草稿' }
const STATUS_COLOR = { enabled: 'success', disabled: 'warning', draft: 'default' }
// 触发方式标签：后端无字段，本地推导后展示
// 门户工作流编辑入口：编辑与新建共用该路由，:id? 只是占位。
// WorkflowManage 挂载后读 window.location.search —— 有 id 按 id 加载详情，只有 mode=create 才开空白表单。
const WORKFLOW_EDIT_PATH = '/portal/workflows/edit'

export default {
    name: 'WorkflowList',
    components: {
        PortalConfirmModal
    },
    // 嵌入契约（宿主 = 「我的工作流」Tab 所在的 /portal/mine/agents）：
    //   props   show-title / show-create —— 宿主已自带栏目标题、新建入口时传 false，避免同页重复；
    //           title                  —— 标题文案，宿主想改成「我的工作流」以外的叫法时传。
    //   emits   nav(view)              —— 视图切换意图，当前只会发出 'wf-edit'；
    //           open-workflow(row)     —— 请求打开某条工作流，紧跟在 nav 之后。
    //   未监听上面任一事件时，组件自行跳 WORKFLOW_EDIT_PATH，
    //   因此直接 <WorkflowList /> 嵌进 Tab 也能保证「编辑 / 新建」可用；
    //   宿主若要接管跳转（如旧门户壳 PortalWorkflowList），监听这两个事件即可。
    //   方法     load()                —— 公开的回读入口，宿主可在切回 Tab 时调用刷新。
    props: {
        // 栏目标题是否渲染（宿主自带标题时关掉）
        showTitle: { type: Boolean, default: true },
        // 栏目标题文案
        title: { type: String, default: '我的工作流' },
        // 「新建工作流」按钮是否渲染（宿主自带新建入口时关掉）
        showCreate: { type: Boolean, default: true }
    },
    emits: ['nav', 'open-workflow'],
    data() {
        return {
            // 首次挂载是否已拉过列表：用于 keep-alive 下区分首帧与再次进入 Tab
            loadedOnce: false,
            loading: true,
            loadFailed: false,
            keyword: '',
            status: 'all',
            workflows: [],
            // —— 运行弹框：交互与入参组装搬运自参考页 WorkflowManage 的运行弹框 ——
            runDialog: {
                visible: false,
                // 当前待运行的工作流行（展示信息 + 执行 id 的唯一来源）
                workflow: null
            },
            // 「输入参数」文本域的用户输入值，作为 input 变量真实传给执行接口
            runInput: '',
            // 执行中：按钮 loading + 屏蔽重复提交
            running: false,
            // 正在复制的工作流 id（行内按钮 loading 防重复）
            copyingId: null,
            confirmation: {
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
        // 是否处于筛选态（用于区分空态文案与操作）
        hasFilter() {
            return !!(this.keyword || this.status !== 'all')
        },
        // 关键词 + 状态 联合筛选
        filtered() {
            const kw = this.keyword.toLowerCase()
            return this.workflows.filter(w => {
                if (this.status !== 'all' && w.status !== this.status) return false
                if (kw && (w.name + w.summary).toLowerCase().indexOf(kw) === -1) return false
                return true
            })
        },
        // 运行弹框展示对象（未打开时退化为空对象，模板按缺省值渲染）
        runTarget() {
            return this.runDialog.workflow || {}
        },
        // 运行弹框标题下方的对象名
        runTargetName() {
            return this.runTarget.name || '未命名工作流'
        },
        runTargetStatus() {
            return this.runTarget.status || ''
        }
    },
    mounted() {
        // 挂载后拉取真实列表（拦截器 code===200 时已解包 content）
        this.load()
    },
    // keep-alive 缓存下重新切回本 Tab 不会重跑 mounted，这里补一次回读，
    // 让「进编辑器改完 → 返回列表」后的发布状态 / 启停 / 节点数 / 运行次数保持最新。
    // 首次挂载已由 mounted 拉过，用 loadedOnce 挡住重复请求。
    activated() {
        if (this.loadedOnce) this.load()
    },
    methods: {
        // 宿主是否已接管该事件：接管了就只发事件、不再自行跳转；
        // 没接管（直接嵌进 Tab）则由组件兜底跳门户编辑路由。
        // 同时兼容 @nav 编译出的 onNav 与 v-on="{'nav': fn}" 这种裸事件名写法。
        hasListener(name) {
            const props = (this.$ && this.$.vnode && this.$.vnode.props) || {}
            return !!(props[camelize('on-' + name)] || props[name])
        },
        // 统一走门户工作流编辑路由，吞掉重复导航的 rejection（仓库既有 navigate 写法）
        navigate(path, query) {
            if (!this.$router) return
            const target = query ? { path, query } : path
            const result = this.$router.push(target)
            if (result && typeof result.catch === 'function') result.catch(() => { })
        },
        // 兜底打开编辑器：有 id 按 id 打开（WorkflowManage 会按 query.id 加载详情），
        // 无 id 视为新建（query.mode=create 让它开一张空白画布）。
        // 旧门户壳写 sessionStorage 缓存的那份首屏数据这里不再写：
        // 编辑路由挂的是 WorkflowManage，它只认 query，不读该缓存。
        openEditor(w) {
            const id = w && w.id
            if (id === null || id === undefined || id === '') {
                this.navigate(WORKFLOW_EDIT_PATH, { mode: 'create' })
                return
            }
            this.navigate(WORKFLOW_EDIT_PATH, { id: String(id) })
        },
        // 拉取工作流列表：成功则映射后端字段；失败置空 + 加载失败状态，页面走空态
        async load() {
            this.loading = true
            this.loadedOnce = true
            try {
                const data = await workflowList()
                const rows = Array.isArray(data) ? data : (data && Array.isArray(data.list) ? data.list : [])
                this.workflows = rows.map(r => this.mapRow(r))
                this.loadFailed = false
            } catch (e) {
                // 接口失败：列表为空并提示，不回退任何演示数据
                this.workflows = []
                this.loadFailed = true
                Message.error('工作流列表加载失败，请稍后重试')
            } finally {
                this.loading = false
            }
        },
        // 后端行 → 页面卡片字段：description→summary、enabled/status→三态、
        // cjsj/updateTime→updatedAt、graphData.nodes.length→nodeCount、executeCount→runs
        mapRow(raw) {
            const graph = this.parseGraph(raw.graphData)
            return {
                id: raw.id,
                name: raw.name || '未命名工作流',
                cjrxm: raw.cjrxm || raw.cjr || '',
                version: raw.version,
                summary: raw.description || '',
                status: this.deriveStatus(raw),
                nodeCount: graph ? graph.nodes.length : (raw.nodeCount || 0),
                runs: raw.executeCount || 0,
                updatedAt: this.formatDate(raw.updateTime || raw.cjsj),
                // graphData 随行携带，供编辑器 / 画布打开时透传
                graphData: raw.graphData || null
            }
        },
        // 解析 graphData（兼容对象与 JSON 字符串）
        parseGraph(input) {
            if (!input) return null
            let graph = input
            if (typeof graph === 'string') {
                try {
                    graph = JSON.parse(graph)
                } catch (e) {
                    return null
                }
            }
            if (graph && Array.isArray(graph.nodes)) return graph
            return null
        },
        // 后端 enabled/status → 页面三态（enabled / disabled / draft）
        // 优先级：draft > disabled > enabled 字段 > status 字段
        // 后端停用只翻转 enabled 字段，status 可能仍是 published，故 enabled 字段优先于 status 判定
        deriveStatus(raw) {
            // 草稿优先：即使带 enabled 标志也按草稿展示
            if (raw.status === 'draft') return 'draft'
            // 后端明确给出停用状态
            if (raw.status === 'disabled') return 'disabled'
            // enabled 字段为 false / 0 / '0' 一律视为停用（优先于 status）
            if (raw.enabled === false || raw.enabled === 0 || raw.enabled === '0') return 'disabled'
            if (raw.enabled === true || raw.enabled === 1 || raw.enabled === '1') return 'enabled'
            // 无 enabled 字段时退回 status 判定
            if (raw.status === 'published' || raw.status === 'enabled') return 'enabled'
            // 未知取值回退草稿
            return 'draft'
        },
        // 时间归一化为 yyyy-MM-dd
        formatDate(val) {
            if (!val) return '—'
            return String(val).slice(0, 10)
        },
        statusLabel(key) {
            return STATUS_LABEL[key] || key
        },
        statusColor(key) {
            return STATUS_COLOR[key] || 'default'
        },
        // 清除关键词与状态筛选
        resetFilter() {
            this.keyword = ''
            this.status = 'all'
        },
        // 新建：宿主接管时只发事件（事件即反馈），无人接管则自行跳编辑器空表单
        createWorkflow() {
            this.$emit('nav', 'wf-edit')
            if (this.hasListener('nav')) {
                Message.info('已打开工作流编辑器（新建）')
                return
            }
            this.openEditor(null)
        },
        // 编辑入口：携带整条数据；宿主接管时交由宿主处理，否则组件自行跳转
        editWorkflow(w) {
            this.$emit('nav', 'wf-edit')
            this.$emit('open-workflow', w)
            if (this.hasListener('nav') || this.hasListener('open-workflow')) return
            this.openEditor(w)
        },
        // 运行（第一步）：打开运行弹框，不直接触发接口
        // 与参考页一致：每次打开都清空上次输入，避免误用历史参数
        openRunDialog(w) {
            this.runDialog.workflow = w
            this.runInput = ''
            this.runDialog.visible = true
        },
        // 关闭运行弹框：执行中不允许关闭，防止重复触发
        closeRunDialog() {
            if (this.running) return
            this.runDialog.visible = false
        },
        // 组装运行入参：用户填写的「输入参数」文本 → { input }
        // 未填写时退化为空对象，与历史 workflowExecute(id, {}, true) 口径一致
        buildRunInput() {
            const text = (this.runInput || '').trim()
            return text ? { input: text } : {}
        },
        // 运行（第二步）：调执行接口（testRun=true 跳过启用检查），成功后关闭并刷新列表
        async submitRun() {
            if (this.running) return
            const w = this.runDialog.workflow
            if (!w || w.id === null || w.id === undefined || w.id === '') {
                Message.error('缺少工作流 ID，无法运行')
                return
            }
            this.running = true
            try {
                await workflowExecute(w.id, this.buildRunInput(), true)
                this.runDialog.visible = false
                Message.success('已触发「' + (w.name || '未命名工作流') + '」运行')
                // 运行会累加 executeCount，刷新后卡片运行次数与状态同步
                await this.load()
            } catch (e) {
                Message.error('运行「' + (w.name || '未命名工作流') + '」失败')
            } finally {
                this.running = false
            }
        },
        // 复制：沿用参考页 duplicateWorkflow 的合法字段（name / description / graphData），
        // 副本名为「原名 (副本)」，成功后重新拉列表
        async copyWorkflow(w) {
            if (this.copyingId !== null) return
            this.copyingId = w.id
            try {
                await workflowCreate({
                    name: (w.name || '未命名工作流') + ' (副本)',
                    description: w.summary || '',
                    // graphData 随行携带，原样透传（字符串或对象都兼容后端建图口径）
                    graphData: w.graphData || null
                })
                Message.success('已复制「' + (w.name || '未命名工作流') + '」')
                await this.load()
            } catch (e) {
                Message.error('复制失败')
            } finally {
                this.copyingId = null
            }
        },
        // 统一确认弹框：保存待执行操作，只有点击确认后才执行具体操作
        confirmAction(title, content, action, confirmType = 'primary') {
            this.confirmation.title = title
            this.confirmation.content = content
            this.confirmation.confirmText = '确认'
            this.confirmation.confirmType = confirmType
            this.confirmation.loading = false
            this.confirmation.action = action
            this.confirmation.visible = true
        },
        // 执行待确认操作：防止重复提交，操作失败时保留弹框并复位 loading
        async executeConfirmedAction() {
            if (!this.confirmation.visible || this.confirmation.loading) return
            const action = this.confirmation.action
            if (!action) return
            this.confirmation.loading = true
            try {
                const result = await action()
                if (result !== false) {
                    this.confirmation.visible = false
                    this.confirmation.action = null
                }
            } catch (e) {
                Message.error('操作失败')
            } finally {
                this.confirmation.loading = false
            }
        },
        // 发布草稿：确认后调发布接口，保留原有成功 / 失败提示与列表刷新
        publish(w) {
            const name = w.name || '未命名工作流'
            this.confirmAction(
                '发布确认',
                '确定发布「' + name + '」？',
                async () => {
                    try {
                        await workflowPublish(w.id)
                        Message.success('已发布「' + w.name + '」')
                        this.load()
                        return true
                    } catch (e) {
                        Message.error('发布失败')
                        return false
                    }
                },
                'primary'
            )
        },
        // 启用 / 停用：确认后调启停接口，保留原有成功 / 失败提示与列表刷新
        toggle(w, next) {
            const actionText = next === 'enabled' ? '启用' : '停用'
            const name = w.name || '未命名工作流'
            this.confirmAction(
                actionText + '确认',
                '确定' + actionText + '「' + name + '」？',
                async () => {
                    try {
                        await workflowToggle(w.id, next === 'enabled')
                        Message.success('「' + w.name + '」已' + actionText)
                        // 等待列表刷新完成，避免刷新前的旧状态被后续交互读取
                        await this.load()
                        return true
                    } catch (e) {
                        Message.error('操作失败')
                        return false
                    }
                },
                'primary'
            )
        },
        // 删除确认（workflowDelete 实际 method 为 POST /ai/workflow/delete/{id}）
        confirmDelete(w) {
            const name = w.name || '未命名工作流'
            this.confirmAction(
                '删除确认',
                '确定删除「' + name + '」？此操作不可恢复。',
                async () => {
                    try {
                        await workflowDelete(w.id)
                        Message.success('已删除「' + w.name + '」')
                        this.load()
                        return true
                    } catch (e) {
                        Message.error('删除失败')
                        return false
                    }
                },
                'error'
            )
        }
    }
}
</script>

<style lang="less" scoped>
@import (reference) '../styles/agent-theme.less';

// ============================================================
// 宿主适配：根节点 class="workflow-module" + data-module 标识。
// 颜色/圆角走 --wf-* 变量：.ag-wf-tokens() 把每个 --wf-* 映射到 --ag-theme-*
// （绛红宣纸默认回退），宿主可在任意祖先覆盖；
// 独立 iframe 嵌入时祖先未定义 --ag-theme-*，回退值即品牌主题，故主题始终正确。
// 布局 width:100% + 弹性网格，适配 iframe / 嵌入容器 / 窄屏。
// ============================================================
.workflow-module {
    .ag-wf-tokens();
    // iView 组件统一走品牌主题（按钮 / 输入 / 标签 / 加载 / 卡片）
    .ag-iview-theme();

    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: 4px 0;
    font-family: var(--wf-font);
    font-size: 14px;
    line-height: 1.6;
    color: var(--wf-text);
}

.wf-list *,
.wf-list *::before,
.wf-list *::after {
    box-sizing: border-box;
}

/* ══ 主按钮（type="primary"）背景 / 边框兜底 ═══════════════════════════════════
   全局样式 .ivu-btn-primary{ background-color:#79b3f9 !important; border-color:#79b3f9 !important }
   带 !important，本主题 mixin（.ag-iview-theme()）里的普通声明压不过它 —— 主按钮会显示成浅蓝。
   全局样式不可改，故仅在本模块作用域内用「同等 !important + 更高特异性」把颜色抢回来；
   只命中本组件子树，其他页面不受影响。solid 与 ghost 两个变体都要覆盖：
   ghost 主按钮（透明底 + 绛红描边）若不覆盖，同样会被全局实心蓝盖掉。
   颜色取主题令牌（@ag-accent 一族指向 var(--ag-theme-*)），与 mixin 完全一致，深浅主题都不写死。
   注意：hover / active 也要加 !important，否则常态被抢回后、悬停态又落回全局蓝。 */
:deep(.ivu-btn-primary:not(.ivu-btn-ghost)) {
    background-color: @ag-accent !important;
    border-color: @ag-accent-deep !important;
}

:deep(.ivu-btn-primary:not(.ivu-btn-ghost):hover:not([disabled])) {
    background-color: @ag-accent-hover !important;
    border-color: @ag-accent-hover !important;
}

:deep(.ivu-btn-primary:not(.ivu-btn-ghost):active:not([disabled])) {
    background-color: @ag-accent-deep !important;
    border-color: @ag-accent-deep !important;
}

:deep(.ivu-btn-ghost.ivu-btn-primary) {
    background-color: transparent !important;
    border-color: fade(@ag-accent-solid, 55%) !important;
}

:deep(.ivu-btn-ghost.ivu-btn-primary:hover:not([disabled])) {
    background-color: @ag-accent-weak !important;
    border-color: @ag-accent !important;
}

:deep(.ivu-btn-ghost.ivu-btn-primary:active:not([disabled])) {
    background-color: @ag-accent-weak !important;
    border-color: @ag-accent-deep !important;
}

/* 模块头：标题（展示体）+ 右侧操作。宿主关掉标题时（.is-bar）退化为单行右对齐操作条 */
.wf-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
    flex-wrap: wrap;

    &.is-bar {
        align-items: center;
        justify-content: flex-end;
        margin-bottom: 12px;
    }
}

.wf-head__title {
    margin: 0;
    font-family: var(--wf-serif);
    font-size: 18px;
    font-weight: 600;
    color: var(--wf-text);
}

.wf-head__actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

/* 触发类型标签样式已迁至 agent-theme.less 的 .wf-tag-trigger（宣纸底/绛红边框） */

/* 工具条 */
.wf-toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    flex-wrap: wrap;
}

.wf-toolbar__search {
    flex: 1 1 200px;
    width: 280px;
    max-width: 100%;
    min-width: 0;
}

.wf-toolbar__select {
    flex: 0 0 auto;
    width: 132px;
}

.wf-toolbar__count {
    margin-left: auto;
    font-size: 12px;
    color: var(--wf-text-3);
    white-space: nowrap;
}

/* 加载 */
.wf-loading {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 180px;
    border: 1px dashed var(--wf-border);
    border-radius: var(--wf-radius);
    background: var(--wf-fill);
}

/* 卡片网格：与知识库 .kb-grid / 我的智能体 .ma-grid 同规 —— auto-fill + min(280px, 100%)，
   版心约 1100px 时 3 列等宽（三面板切换时列宽 / 列距逐像素对齐），≤996 一律一行一卡 */
.wf-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
    gap: var(--s5);
}

/* 列表项入场：与门户「我的智能体 / 我的收藏」同规格 —— 16px 上移归位 + 逐个落位，
   逐个延迟由模板内联 animation-delay 给出（(i % 10) * 0.05s，最迟第 10 项 0.45s）。
   时长/缓动走本模块 Less 令牌（不依赖 --t-base，独立 iframe 嵌入时同样生效）。
   填充用 backwards 而非 both：延迟期维持首帧（透明 + 偏移，后续项不会提前闪出），
   动画结束即交还元素自身样式，不与 .wf-card:hover 的描边/阴影反馈抢优先级。 */
@keyframes wfCardIn {
    from {
        opacity: 0;
        transform: translateY(16px);
    }

    to {
        opacity: 1;
        transform: none;
    }
}

.wf-enter {
    animation: wfCardIn @ag-motion-base @ag-ease backwards;
}

/* 动效降级：reduce 直接关掉动画（连带去掉延迟期的隐藏态，内容立即可见） */
@media (prefers-reduced-motion: reduce) {
    .wf-enter {
        animation: none;
    }
}

/* 卡片：定高 248px = 头部 24 + 描述三行 60 + 元信息 48 + 操作区 46 + 3 段 gap 30 + 上下内衬 28
   （窄视口下 clamp() 取小值，实占约 219px，余量被操作区的 margin-top:auto 吸收成描述与操作区之间的留白）。
   定高是刻意的：同栅格所有卡等高，操作区恒在同一基线，与「我的智能体」卡的等高栅格同口径。
   248 同时是三面板的公共高度锚点（知识库 .kb-card / 我的智能体 .amc-card 亦取 248），切栏时卡片高度不变。 */
.wf-card {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 248px;
    min-height: 248px;
    max-height: 248px;
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--wf-border);
    border-radius: var(--wf-radius);
    background: var(--wf-surface);
    transition: border-color 150ms @ag-ease;

    &:hover {
        border-color: var(--wf-border-strong);
        box-shadow: var(--wf-shadow-1);
    }

    :deep(.ivu-card-body) {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        gap: clamp(8px, 0.9vw, 10px);
        min-height: 0;
        height: 100%;
        padding: clamp(12px, 1.1vw, 14px);
    }
}

/* 状态角标：贴合卡片右上角，左上折角突出、左下圆角 */
.wf-card__badge {
    --badge-bg: var(--wf-text-3);
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
    padding: 4px 10px 5px 12px;
    font-size: 11px;
    line-height: 1.3;
    color: #fff;
    letter-spacing: 0.02em;
    pointer-events: none;
    background: var(--badge-bg);
    border-radius: 0 var(--wf-radius) 0 9px;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -8px;
        width: 0;
        height: 0;
        border-right: 8px solid var(--badge-bg);
        border-bottom: 8px solid transparent;
    }

    &.is-enabled {
        --badge-bg: var(--wf-accent);
    }

    &.is-draft {
        --badge-bg: var(--wf-warn);
    }

    // 已停用：主墨系灰（白字可读），不用冷灰
    &.is-disabled {
        --badge-bg: var(--wf-text-2);
    }
}

.wf-card__head {
    display: flex;
    align-items: center;
    flex: 0 0 24px;
    height: 24px;
    min-height: 24px;
    max-height: 24px;
    min-width: 0;
    overflow: hidden;
    // 为右上角状态角标让出空间
    padding-right: 56px;
}

.wf-card__name {
    display: block;
    flex: 1 1 auto;
    height: 24px;
    min-height: 24px;
    max-height: 24px;
    min-width: 0;
    overflow: hidden;
    font-size: clamp(13px, 1vw, 15px);
    font-weight: 600;
    line-height: 24px;
    color: var(--wf-text);
    white-space: nowrap;
    text-overflow: ellipsis;
}

/* 描述：恒占三行 —— line-clamp 3 封顶（超出省略号），min-height 4.8em 托底。
   4.8em = line-height 1.6 × 3 行，用 em 是为了跟随 clamp() 后的实际字号走
   （字号随视口变，行高随之变，px 写死会在窄屏留缝、在宽屏又不够）。
   一行文字也照样留满三行的空白：卡片正文区是 flex 定高布局，描述若随行数塌高，
   同栅格里长短不一的卡会把操作区顶得忽上忽下。三行占位是刻意留白，不是 bug。
   文案侧 mapRow 已把 description 归一成字符串（缺省 ''），不会出现 undefined。 */
.wf-card__summary {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    flex: 0 0 auto;
    min-height: 4.8em;
    max-height: 4.8em;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    font-size: clamp(11px, 0.85vw, 12.5px);
    line-height: 1.6;
    color: var(--wf-text-2);
    // 三行是正常换行的结果，不是单行截断：恢复默认换行 + 任意位置断词
    white-space: normal;
    word-break: break-word;
    overflow-wrap: anywhere;
}

.wf-card__meta {
    display: flex;
    flex: 0 0 48px;
    flex-direction: column;
    gap: 4px;
    height: 48px;
    min-height: 48px;
    max-height: 48px;
    min-width: 0;
    padding: 2px 0;
    overflow: hidden;
    box-sizing: border-box;
    font-size: clamp(11px, 0.85vw, 12px);
    color: var(--wf-text-3);
}

.wf-card__meta-tags,
.wf-card__meta-stats {
    display: flex;
    align-items: center;
    gap: clamp(6px, 0.7vw, 10px);
    flex: 0 0 20px;
    height: 20px;
    min-height: 20px;
    max-height: 20px;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
}

.wf-card__meta-tags :deep(.ivu-tag) {
    flex: 0 0 auto;
}

.wf-card__meta-stats .wf-card__stat {
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}

.wf-card__stat {
    white-space: nowrap;
}

/* 操作区：固定在卡片底部（margin-top:auto 吃掉正文区余量，恒在同一条基线上）。
   —— 单行是硬约束：flex-wrap: nowrap，任何档位下都不允许某个按钮单独折到第二行。
   同卡内所有按钮 flex:1 1 0 等宽平分（草稿 4 个 / 已启用 5 个 / 已停用 4 个）：
   按钮数量只改变「单个按钮的宽度」，不改变「同卡等宽」这条不变式，
   状态间的显隐逻辑（v-if）照旧，运行时按钮数量变化也不会让别的按钮重排。
   容器只留一行的高度：1px 上边线 + 7px 上内距 + 32px 钮高 = 40px，另留 6px 余量。 */
.wf-card__actions {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: clamp(4px, 0.35vw, 6px);
    flex: 0 0 46px;
    height: 46px;
    min-height: 46px;
    max-height: 46px;
    margin-top: auto;
    padding-top: 7px;
    overflow: hidden;
    border-top: 1px solid var(--wf-border);
    min-width: 0;

    :deep(.ivu-btn) {
        // 0 基准 = 等宽平分，与内容宽度无关；min-width:0 允许窄到装下两个字而不撑破行
        flex: 1 1 0;
        min-width: 0;
        max-width: none;
        // iView 按钮默认靠 line-height 定位文字，改用 flex 居中后 32px 定高才是真居中
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 32px;
        // 收窄水平内距：5 个按钮同排时（3 列单卡约 353px，单个按钮约 65px）中文仍不挤
        padding: 0 3px;
        font-size: 12px;
        white-space: nowrap;
    }
}

/* 断点：与知识库 .kb-grid / 我的智能体 .ma-grid 同步 —— ≤996 一律一行一卡，
   三面板在同一宽度下永远同列数。 */
@media (max-width: 996px) {
    .wf-cards {
        grid-template-columns: minmax(0, 1fr);
    }
}

/* 空态 / 筛选无结果 */
.wf-empty {
    padding: 48px 20px;
    text-align: center;
    border: 1px dashed var(--wf-border-strong);
    border-radius: var(--wf-radius);
    background: var(--wf-fill);
}

.wf-empty__title {
    margin: 0 0 6px;
    font-size: 14px;
    font-weight: 600;
    color: var(--wf-text-2);
}

.wf-empty__desc {
    margin: 0 0 16px;
    font-size: 13px;
    color: var(--wf-text-3);
}

.wf-empty__actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
}

/* 窄屏（iframe / 移动端） */
@media (max-width: 640px) {
    .wf-head {
        align-items: flex-start;
        flex-direction: column;
    }

    // 宿主关掉标题后只剩「新建工作流」：窄屏改为整行主按钮，触点更足
    .wf-head.is-bar {
        align-items: stretch;

        :deep(.ivu-btn) {
            width: 100%;
        }
    }

    .wf-toolbar__count {
        margin-left: 0;
        width: 100%;
    }

    .wf-toolbar__select {
        flex: 1 1 auto;
        width: auto;
    }
}

/* ══ 运行工作流弹框（1000px）═════════════════════════════════════
   交互与入参来自参考页 src/components/WorkflowManage.vue 的运行弹框；
   外观按门户风格重写：宣纸底 / 绛红主色 / 展示体标题 / 金色点缀，
   内部改「信息 + 输入参数」两栏，宽屏并排、窄屏堆叠。
   Modal 默认 transfer 到 body，样式落在 body 之下，
   故全部用 :global() 书写（与 PortalConfirmModal 同一处理）。 */
:global(.portal-wf-run) {
    padding: 24px 16px;
    font-family: var(--font-body, "Microsoft YaHei", "微软雅黑", "PingFang SC", "Segoe UI", sans-serif);
}

:global(.portal-wf-run .ivu-modal) {
    width: 1000px !important;
    max-width: 100%;
    margin: 0 auto;
    top: 9vh;
}

:global(.portal-wf-run .ivu-modal-content) {
    overflow: hidden;
    background: var(--c-paper-2, #F7EBDF);
    border: 1px solid var(--c-border, rgba(26, 20, 16, .12));
    border-radius: var(--r-md, 8px);
    box-shadow: var(--shadow-md, 0 8px 24px rgba(26, 20, 16, .12));
}

:global(.portal-wf-run .ivu-modal-header) {
    padding: 20px 24px 16px;
    margin: 0;
    border-bottom: 1px solid var(--c-border, rgba(26, 20, 16, .12));
    background: transparent;
}

:global(.portal-wf-run .portal-wf-run__header) {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-right: 32px;
}

/* 播放图标：金色三角 + 绛红圆底，与门户「运行」语义一致 */
:global(.portal-wf-run .portal-wf-run__mark) {
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    display: grid;
    place-items: center;
    padding-left: 2px;
    border-radius: 50%;
    background: var(--c-red-600, #992A18);
    color: var(--c-gold-500, #F69C20);
    font-size: 13px;
    line-height: 1;
}

:global(.portal-wf-run .portal-wf-run__headtext) {
    min-width: 0;
}

:global(.portal-wf-run .portal-wf-run__title) {
    margin: 0;
    color: var(--c-ink, #1A1410);
    font-family: var(--font-display, "Noto Serif SC", "Songti SC", SimSun, Georgia, serif);
    font-size: 18px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: .04em;
}

/* 副标题承载工作流名，超长省略 */
:global(.portal-wf-run .portal-wf-run__subtitle) {
    margin: 3px 0 0;
    overflow: hidden;
    color: var(--c-muted, #8C847E);
    font-size: 12.5px;
    line-height: 1.4;
    white-space: nowrap;
    text-overflow: ellipsis;
}

:global(.portal-wf-run .ivu-modal-close) {
    top: 18px;
    right: 20px;
    color: var(--c-muted, #8C847E);
}

:global(.portal-wf-run .ivu-modal-close:hover) {
    color: var(--c-red-600, #992A18);
}

:global(.portal-wf-run .ivu-modal-body) {
    padding: 20px 24px 8px;
}

/* 两栏：左信息（固定 300px） / 右输入参数（自适应） */
:global(.portal-wf-run .portal-wf-run__body) {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    gap: 20px;
    align-items: start;
}

:global(.portal-wf-run .portal-wf-run__panel) {
    min-width: 0;
    padding: 16px 18px;
    background: var(--c-paper, #EFE3D7);
    border: 1px solid var(--c-border, rgba(26, 20, 16, .12));
    border-radius: var(--r-md, 8px);
}

/* 栏标题：绛红小方块 + 展示体 */
:global(.portal-wf-run .portal-wf-run__panel-title) {
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

:global(.portal-wf-run .portal-wf-run__panel-title::before) {
    content: '';
    width: 3px;
    height: 14px;
    flex: 0 0 3px;
    background: var(--c-red-600, #992A18);
    border-radius: 1px;
}

/* 输入参数栏标题：标题左置，说明右置 */
:global(.portal-wf-run .portal-wf-run__panel--input .portal-wf-run__panel-title) {
    justify-content: space-between;
    gap: 12px;
}

:global(.portal-wf-run .portal-wf-run__label-hint) {
    color: var(--c-muted, #8C847E);
    font-family: var(--font-body, "Microsoft YaHei", sans-serif);
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0;
}

/* 左栏事实列表：dt / dd 两列，dd 溢出省略 */
:global(.portal-wf-run .portal-wf-run__facts) {
    margin: 0;
    padding: 0;
}

:global(.portal-wf-run .portal-wf-run__fact) {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 12px;
    align-items: baseline;
    padding: 7px 0;
    border-bottom: 1px dashed var(--c-border, rgba(26, 20, 16, .12));
}

:global(.portal-wf-run .portal-wf-run__fact:last-child) {
    border-bottom: 0;
}

:global(.portal-wf-run .portal-wf-run__fact dt) {
    color: var(--c-muted, #8C847E);
    font-size: 12.5px;
    line-height: 1.6;
}

:global(.portal-wf-run .portal-wf-run__fact dd) {
    margin: 0;
    min-width: 0;
    overflow: hidden;
    color: var(--c-ink-2, #3D342C);
    font-size: 13px;
    line-height: 1.6;
    white-space: nowrap;
    text-overflow: ellipsis;
}

/* 状态胶囊：与卡片角标同一套语义色 */
:global(.portal-wf-run .portal-wf-run__state) {
    display: inline-block;
    padding: 1px 9px 2px;
    border-radius: var(--r-full, 999px);
    font-size: 12px;
    line-height: 1.6;
    white-space: nowrap;
}

:global(.portal-wf-run .portal-wf-run__state.is-enabled) {
    background: rgba(46, 125, 91, .12);
    color: #2E7D5B;
}

:global(.portal-wf-run .portal-wf-run__state.is-disabled) {
    background: rgba(26, 20, 16, .07);
    color: #6E665F;
}

:global(.portal-wf-run .portal-wf-run__state.is-draft) {
    background: rgba(246, 156, 32, .18);
    color: #A86509;
}

/* 提示条：金底 + 左侧竖线，替代参考页的灯泡提示 */
:global(.portal-wf-run .portal-wf-run__note) {
    margin: 14px 0 0;
    padding: 10px 12px;
    background: rgba(246, 156, 32, .12);
    border-left: 3px solid var(--c-gold-500, #F69C20);
    border-radius: 0 var(--r-sm, 4px) var(--r-sm, 4px) 0;
    color: var(--c-ink-2, #3D342C);
    font-size: 12.5px;
    line-height: 1.7;
}

:global(.portal-wf-run .portal-wf-run__note code) {
    padding: 1px 5px;
    border-radius: 3px;
    background: rgba(26, 20, 16, .07);
    color: var(--c-red-600, #992A18);
    font-family: Menlo, Consolas, monospace;
    font-size: 12px;
}

/* 右栏文本域：暖纸底 + 绛红聚焦，与工具条输入框同一套反馈 */
:global(.portal-wf-run .portal-wf-run__input) {
    display: block;
    width: 100%;
    min-height: 168px;
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

:global(.portal-wf-run .portal-wf-run__input::placeholder) {
    color: var(--c-muted, #8C847E);
}

:global(.portal-wf-run .portal-wf-run__input:hover) {
    border-color: var(--c-red-600, #992A18);
}

:global(.portal-wf-run .portal-wf-run__input:focus) {
    outline: none;
    border-color: var(--c-red-600, #992A18);
    box-shadow: 0 0 0 2px var(--c-ring, rgba(246, 156, 32, .55));
}

:global(.portal-wf-run .portal-wf-run__hint) {
    margin: 8px 0 0;
    color: var(--c-muted, #8C847E);
    font-size: 12px;
    line-height: 1.7;
}

:global(.portal-wf-run .ivu-modal-footer) {
    padding: 0 24px 20px;
    border-top: 0;
}

:global(.portal-wf-run .portal-wf-run__footer) {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 16px;
    border-top: 1px solid var(--c-border, rgba(26, 20, 16, .12));
}

:global(.portal-wf-run .portal-wf-run__foot-tip) {
    flex: 1 1 auto;
    min-width: 0;
    color: var(--c-muted, #8C847E);
    font-size: 12px;
    line-height: 1.6;
}

:global(.portal-wf-run .portal-wf-run__footer .ivu-btn) {
    flex: 0 0 auto;
    min-width: 96px;
    min-height: 36px;
    margin: 0;
    border-radius: var(--r-md, 8px);
    font-weight: 600;
}

:global(.portal-wf-run .portal-wf-run__cancel.ivu-btn) {
    background: var(--c-paper, #EFE3D7);
    border-color: var(--c-ink-2, #3D342C);
    color: var(--c-ink-2, #3D342C);
}

:global(.portal-wf-run .portal-wf-run__cancel.ivu-btn:hover:not([disabled])),
:global(.portal-wf-run .portal-wf-run__cancel.ivu-btn:focus-visible:not([disabled])) {
    background: var(--c-paper-2, #F7EBDF);
    border-color: var(--c-ink, #1A1410);
    color: var(--c-ink, #1A1410);
}

/* 提交按钮：同 PortalConfirmModal 口径，用 !important 压掉全局 .ivu-btn-primary 蓝 */
:global(.portal-wf-run .portal-wf-run__submit.ivu-btn.ivu-btn-primary) {
    background: var(--c-red-600, #992A18) !important;
    border-color: var(--c-red-600, #992A18) !important;
    color: var(--c-paper-2, #F7EBDF);
}

:global(.portal-wf-run .portal-wf-run__submit.ivu-btn.ivu-btn-primary:hover:not([disabled])),
:global(.portal-wf-run .portal-wf-run__submit.ivu-btn.ivu-btn-primary:focus-visible:not([disabled])) {
    background: var(--c-red-700, #7E2214) !important;
    border-color: var(--c-red-700, #7E2214) !important;
}

:global(.portal-wf-run .portal-wf-run__footer .ivu-btn:focus-visible) {
    outline: 2px solid var(--c-ring, rgba(246, 156, 32, .55));
    outline-offset: 2px;
}

/* 弹框响应式：窄屏两栏堆叠为单栏，文本域与按钮行自适应 */
@media (max-width: 900px) {
    :global(.portal-wf-run .portal-wf-run__body) {
        grid-template-columns: minmax(0, 1fr);
    }

    :global(.portal-wf-run .portal-wf-run__facts) {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0 20px;
    }
}

@media (max-width: 560px) {
    :global(.portal-wf-run) {
        padding: 12px;
    }

    :global(.portal-wf-run .ivu-modal) {
        top: 5vh;
    }

    :global(.portal-wf-run .ivu-modal-header) {
        padding: 18px 18px 14px;
    }

    :global(.portal-wf-run .ivu-modal-body) {
        padding: 16px 18px 8px;
    }

    :global(.portal-wf-run .ivu-modal-footer) {
        padding: 0 18px 18px;
    }

    :global(.portal-wf-run .portal-wf-run__facts) {
        grid-template-columns: minmax(0, 1fr);
    }

    :global(.portal-wf-run .portal-wf-run__footer) {
        flex-wrap: wrap;
    }

    :global(.portal-wf-run .portal-wf-run__foot-tip) {
        flex: 1 0 100%;
    }

    :global(.portal-wf-run .portal-wf-run__footer .ivu-btn) {
        flex: 1 1 0;
        width: 100%;
    }
}

// 无障碍：尊重系统「减少动态效果」
.ag-reduced-motion();
</style>
