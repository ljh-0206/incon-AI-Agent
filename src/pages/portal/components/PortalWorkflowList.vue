<template>
    <!-- 门户工作流列表：复用智能体模块的列表叶子组件，仅负责门户路由桥接 -->
    <WorkflowList
        @nav="onNav"
        @open-workflow="onOpenWorkflow"
    />
</template>

<script>
    import WorkflowList from '@/pages/portal/components/agent/workflow/WorkflowList.vue'

    const WORKFLOWS_PATH = '/portal/workflows'
    const WORKFLOW_EDIT_PAGE_ID = '2102669333437534209'
    const WORKFLOW_CREATE_PAGE_ID = '2103011122522562561'
    const EDIT_SEED_KEY = 'portal-workflow-edit-seed'

    export default {
        name: 'PortalWorkflowList',

        components: {
            WorkflowList
        },

        data () {
            return {
                // WorkflowList 的编辑按钮会先 emit nav，再 emit open-workflow
                editNavPending: false,
                openWorkflowPending: false
            }
        },

        methods: {
            // 统一走门户路径，避免把智能体模块的本地 view 状态带到门户路由
            navigate (path, query) {
                if (!this.$router) return
                const target = query ? { path, query } : path
                const result = this.$router.push(target)
                if (result && typeof result.catch === 'function') result.catch(() => {})
            },

            // 列表页的内部导航：AI 生成已并入流程编辑（WorkflowManage），统一进入编辑视图
            onNav (view) {
                if (view === 'wf-gen' || view === 'generate') {
                    this.navigate('/portal/workflows/edit')
                    return
                }
                if (view === 'wf-edit' || view === 'edit') {
                    // editWorkflow 会紧接着 emit open-workflow，延迟一拍避免先跳新建页
                    this.editNavPending = true
                    this.$nextTick(() => {
                        if (!this.editNavPending || this.openWorkflowPending) {
                            this.editNavPending = false
                            return
                        }
                        this.editNavPending = false
                        this.navigate('/portal/workflows/edit/' + WORKFLOW_CREATE_PAGE_ID, { mode: 'create' })
                    })
                    return
                }
                this.navigate(WORKFLOWS_PATH)
            },

            // 列表行编辑：编辑器自身会按 id 加载详情；行数据仅作为快速首屏缓存
            onOpenWorkflow (workflow) {
                this.editNavPending = false
                this.openWorkflowPending = true
                const id = workflow && workflow.id
                if (id === null || id === undefined || id === '') {
                    this.navigate('/portal/workflows/edit/' + WORKFLOW_CREATE_PAGE_ID, { mode: 'create' })
                    this.$nextTick(() => { this.openWorkflowPending = false })
                    return
                }

                try {
                    if (workflow) sessionStorage.setItem(EDIT_SEED_KEY, JSON.stringify(workflow))
                } catch (e) {
                    // 浏览器存储不可用时仍按 id 进入编辑器
                }
                this.navigate('/portal/workflows/edit/' + WORKFLOW_EDIT_PAGE_ID, { id: String(id) })
                this.$nextTick(() => { this.openWorkflowPending = false })
            }
        }
    }
</script>
