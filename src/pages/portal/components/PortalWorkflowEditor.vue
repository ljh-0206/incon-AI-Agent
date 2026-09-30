<template>
    <!-- 门户工作流编辑器：只桥接路由和数据，不重复调用工作流接口 -->
    <WorkflowEditor
        :workflow="workflow"
        :generated-workflow="generatedWorkflowForEditor"
        @nav="onNav"
        @open-canvas="onOpenCanvas"
        @save="onSave"
    />
</template>

<script>
    import WorkflowEditor from '@/pages/portal/components/agent/workflow/WorkflowEditor.vue'

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
            // 存储不可用不影响编辑器打开；叶子组件仍会按自身逻辑处理接口
        }
    }

    function firstQueryValue (value) {
        return Array.isArray(value) ? value[0] : value
    }

    function getRouteId (route) {
        const params = (route && route.params) || {}
        if (params.id !== null && params.id !== undefined && params.id !== '') {
            return params.id
        }
        const query = (route && route.query) || {}
        const id = firstQueryValue(query.id)
        if (id !== null && id !== undefined && id !== '') return id
        return null
    }

    export default {
        name: 'PortalWorkflowEditor',

        components: {
            WorkflowEditor
        },

        data () {
            const routeId = getRouteId(this.$route)
            return {
                routeId,
                // 列表行缓存用于先展示，编辑器仍会按 id 拉取后端详情
                workflowSeed: readStorage(EDIT_SEED_KEY),
                // 生成器采用结果；只在新工作流模式下传给叶子组件
                generatedWorkflow: readStorage(GENERATED_WORKFLOW_KEY)
            }
        },

        computed: {
            workflow () {
                const seed = this.workflowSeed
                if (seed && this.routeId !== null && String(seed.id) === String(this.routeId)) {
                    return seed
                }
                if (this.routeId !== null) return { id: this.routeId }
                return null
            },

            generatedWorkflowForEditor () {
                if (this.routeId !== null) return null
                const mode = firstQueryValue(this.$route && this.$route.query && this.$route.query.mode)
                if (mode === 'create' || mode === 'new') return null
                return this.generatedWorkflow
            }
        },

        watch: {
            $route (to) {
                const id = getRouteId(to)
                if (String(id) === String(this.routeId)) return
                this.routeId = id
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

            workflowId (payload) {
                const fromPayload = payload && payload.workflow && payload.workflow.id
                if (fromPayload !== null && fromPayload !== undefined && fromPayload !== '') {
                    return fromPayload
                }
                const direct = payload && payload.id
                if (direct !== null && direct !== undefined && direct !== '') return direct
                return this.routeId
            },

            onNav (view) {
                if (view === 'wf-list' || view === 'list' || view === 'back') {
                    this.navigate(WORKFLOWS_PATH)
                    return
                }
                if (view === 'wf-gen' || view === 'generate') {
                    this.navigate('/portal/workflows/edit')
                    return
                }
                if (view === 'wf-edit' || view === 'edit' || view === 'create') {
                    if (this.routeId !== null) {
                        this.navigate('/portal/workflows/edit/' + encodeURIComponent(String(this.routeId)))
                    } else {
                        this.navigate('/portal/workflows/create', { mode: 'edit' })
                    }
                }
            },

            onOpenCanvas (payload) {
                const data = payload || {}
                const id = this.workflowId(data)
                const canvasPayload = {
                    workflow: data.workflow || (this.workflow ? Object.assign({}, this.workflow) : null),
                    generatedWorkflow: data.generatedWorkflow || this.generatedWorkflowForEditor,
                    graphData: data.graphData || null
                }
                writeStorage(CANVAS_PAYLOAD_KEY, canvasPayload)
                if (canvasPayload.graphData) writeStorage(GRAPH_STORAGE_KEY, canvasPayload.graphData)

                if (id !== null && id !== undefined && id !== '') {
                    this.navigate('/portal/workflows/' + encodeURIComponent(String(id)) + '/canvas')
                } else {
                    // 新草稿尚无 id，使用 create + mode 供门户入口选择画布组件
                    this.navigate('/portal/workflows/create', { mode: 'canvas' })
                }
            },

            onSave (payload) {
                if (!payload) return
                const id = this.workflowId(payload)
                const savedWorkflow = Object.assign(
                    {},
                    this.workflow || {},
                    payload.workflow || {},
                    payload.data || {}
                )
                if (id !== null && id !== undefined && id !== '') {
                    savedWorkflow.id = id
                    writeStorage(EDIT_SEED_KEY, savedWorkflow)
                }
                if (payload.graphData) {
                    const canvasPayload = {
                        workflow: savedWorkflow,
                        generatedWorkflow: this.generatedWorkflowForEditor,
                        graphData: payload.graphData
                    }
                    writeStorage(CANVAS_PAYLOAD_KEY, canvasPayload)
                    writeStorage(GRAPH_STORAGE_KEY, payload.graphData)
                }

                // 新建保存拿到真实 id 后切到规范的编辑深链，刷新仍能正确加载详情
                if (this.routeId === null && id !== null && id !== undefined && id !== '') {
                    this.routeId = id
                    this.workflowSeed = savedWorkflow
                    this.navigate('/portal/workflows/edit/' + encodeURIComponent(String(id)), null, true)
                }
            }
        }
    }
</script>
