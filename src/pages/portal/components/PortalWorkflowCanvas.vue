<template>
    <!-- 门户工作流画布：复用叶子组件，路由只负责恢复 id、图数据和生成草稿 -->
    <WorkflowCanvas
        :workflow="workflow"
        :generated-workflow="generatedWorkflowForCanvas"
        :graph-data="graphData"
        @nav="onNav"
        @save="onSave"
        @run="onRun"
    />
</template>

<script>
    import WorkflowCanvas from '@/pages/portal/components/agent/workflow/WorkflowCanvas.vue'

    const WORKFLOWS_PATH = '/portal/workflows'
    const EDIT_SEED_KEY = 'portal-workflow-edit-seed'
    const GENERATED_WORKFLOW_KEY = 'portal-workflow-generated-draft'
    const CANVAS_PAYLOAD_KEY = 'portal-workflow-canvas-payload'
    const GRAPH_STORAGE_KEY = 'agent-generated-workflow'

    function readStorage (key) {
        try {
            const value = sessionStorage.getItem(key)
            if (!value) return null
            try {
                return JSON.parse(value)
            } catch (e) {
                return null
            }
        } catch (e) {
            return null
        }
    }

    function writeStorage (key, value) {
        try {
            sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
        } catch (e) {
            // 存储不可用时画布仍可使用当前 props
        }
    }

    function getRouteId (route) {
        const params = (route && route.params) || {}
        if (params.id !== null && params.id !== undefined && params.id !== '') {
            return params.id
        }
        const query = (route && route.query) || {}
        const id = Array.isArray(query.id) ? query.id[0] : query.id
        if (id !== null && id !== undefined && id !== '') return id
        return null
    }

    function sameId (a, b) {
        return a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b)
    }

    export default {
        name: 'PortalWorkflowCanvas',

        components: {
            WorkflowCanvas
        },

        data () {
            return {
                routeId: getRouteId(this.$route),
                canvasPayload: readStorage(CANVAS_PAYLOAD_KEY),
                workflowSeed: readStorage(EDIT_SEED_KEY),
                generatedWorkflow: readStorage(GENERATED_WORKFLOW_KEY)
            }
        },

        computed: {
            workflow () {
                const payload = this.canvasPayload
                if (payload && payload.workflow && (this.routeId === null || sameId(payload.workflow.id, this.routeId))) {
                    return payload.workflow
                }
                if (this.workflowSeed && (this.routeId === null || sameId(this.workflowSeed.id, this.routeId))) {
                    return this.workflowSeed
                }
                // 直接打开深链时由画布按 id 保存 / 运行，详情仍由业务叶子组件负责
                if (this.routeId !== null && String(this.routeId) !== 'create') return { id: this.routeId }
                return null
            },

            generatedWorkflowForCanvas () {
                const payload = this.canvasPayload
                if (payload && payload.generatedWorkflow) return payload.generatedWorkflow
                return this.generatedWorkflow
            },

            graphDataForCanvas () {
                const payload = this.canvasPayload
                if (payload && payload.graphData) return payload.graphData
                if (this.workflowSeed && this.workflowSeed.graphData) return this.workflowSeed.graphData
                return readStorage(GRAPH_STORAGE_KEY)
            }
        },

        watch: {
            $route (to) {
                const id = getRouteId(to)
                if (String(id) === String(this.routeId)) return
                this.routeId = id
                this.canvasPayload = readStorage(CANVAS_PAYLOAD_KEY)
                this.workflowSeed = readStorage(EDIT_SEED_KEY)
                this.generatedWorkflow = readStorage(GENERATED_WORKFLOW_KEY)
            }
        },

        methods: {
            navigate (path, query, replace) {
                if (!this.$router) return
                const target = query ? { path, query } : path
                const result = replace ? this.$router.replace(target) : this.$router.push(target)
                if (result && typeof result.catch === 'function') result.catch(() => {})
            },

            onNav (view) {
                if (view === 'wf-list' || view === 'list' || view === 'back') {
                    this.navigate(WORKFLOWS_PATH)
                    return
                }
                if (view === 'wf-gen' || view === 'generate') {
                    // AI 生成已并入流程编辑（WorkflowManage 内置入口）
                    this.navigate('/portal/workflows/edit')
                    return
                }
                if (view === 'wf-edit' || view === 'edit' || view === 'create') {
                    if (this.routeId !== null && String(this.routeId) !== 'create') {
                        this.navigate('/portal/workflows/edit/' + encodeURIComponent(String(this.routeId)))
                    } else {
                        this.navigate('/portal/workflows/create', { mode: 'edit' })
                    }
                }
            },

            onSave (payload) {
                if (!payload) return
                const id = payload.id !== null && payload.id !== undefined && payload.id !== '' ? payload.id : this.routeId
                const nextPayload = {
                    workflow: Object.assign({}, this.workflow || {}, payload.workflow || {}, { id: id }),
                    generatedWorkflow: this.generatedWorkflowForCanvas,
                    graphData: payload.graphData || this.graphDataForCanvas
                }
                if (id === null || id === undefined || id === '') {
                    delete nextPayload.workflow.id
                }
                writeStorage(CANVAS_PAYLOAD_KEY, nextPayload)
                if (nextPayload.graphData) writeStorage(GRAPH_STORAGE_KEY, nextPayload.graphData)

                // 新画布保存后补齐 id，避免刷新时仍停留在 create 模式
                if (id !== null && id !== undefined && id !== '' && String(this.routeId) !== String(id)) {
                    this.routeId = id
                    this.canvasPayload = nextPayload
                    this.navigate('/portal/workflows/' + encodeURIComponent(String(id)) + '/canvas', null, true)
                }
            },

            onRun () {
                // 运行由 WorkflowCanvas 叶子组件执行，这里不重复 API 逻辑
            }
        }
    }
</script>
