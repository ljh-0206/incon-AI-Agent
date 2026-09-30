<template>
    <!-- 门户 AI 生成器：复用叶子组件，生成结果通过 sessionStorage 交给编辑器 -->
    <WorkflowGenerator
        @nav="onNav"
        @use-workflow="onUseWorkflow"
        @use-agent="onUseAgent"
    />
</template>

<script>
    import WorkflowGenerator from '@/pages/portal/components/agent/workflow/WorkflowGenerator.vue'

    const GENERATED_WORKFLOW_KEY = 'portal-workflow-generated-draft'
    const GRAPH_STORAGE_KEY = 'agent-generated-workflow'

    export default {
        name: 'PortalWorkflowGenerator',

        components: {
            WorkflowGenerator
        },

        data () {
            return {
                // 叶子组件会先 emit use-workflow，再 emit nav；用标记避免同一结果重复 push
                pendingWorkflow: false,
                pendingAgent: false
            }
        },

        methods: {
            navigate (path, query) {
                if (!this.$router) return
                const target = query ? { path, query } : path
                const result = this.$router.push(target)
                if (result && typeof result.catch === 'function') result.catch(() => {})
            },

            writeStorage (key, value) {
                try {
                    sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
                } catch (e) {
                    // 存储不可用时仍可进入编辑器，生成器会在当前页显示结果
                }
            },

            onUseWorkflow (draft) {
                if (!draft) return
                this.pendingWorkflow = true
                this.pendingAgent = false
                this.writeStorage(GENERATED_WORKFLOW_KEY, draft)
                if (draft.graphData) this.writeStorage(GRAPH_STORAGE_KEY, draft.graphData)

                // 采用生成结果后进入同一路径的编辑器模式，草稿由 PortalWorkflowEditor 读取
                this.navigate('/portal/workflows/create', { mode: 'edit' })
            },

            onUseAgent () {
                this.pendingAgent = true
                this.pendingWorkflow = false
                // 智能体生成不在本页面内实现，交给门户智能体创建页继续处理
                this.navigate('/portal/create/agent', { mode: 'generated' })
            },

            onNav (view) {
                if (this.pendingAgent) {
                    this.pendingAgent = false
                    return
                }
                if (this.pendingWorkflow) {
                    this.pendingWorkflow = false
                    return
                }
                if (view === 'wf-list' || view === 'list' || view === 'back') {
                    this.navigate('/portal/workflows')
                    return
                }
                if (view === 'wf-gen' || view === 'generate') {
                    this.navigate('/portal/workflows/create', { mode: 'generate' })
                    return
                }
                if (view === 'wf-edit' || view === 'edit' || view === 'create') {
                    this.navigate('/portal/workflows/create', { mode: 'edit' })
                }
            }
        }
    }
</script>
