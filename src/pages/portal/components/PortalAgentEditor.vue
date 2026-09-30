<template>
    <div class="portal-agent-editor">
        <AgentEditor
            v-bind="$attrs"
            :agent="resolvedAgent"
            @nav="onNav"
        />
    </div>
</template>

<script>
    import AgentEditor from '@/pages/portal/components/agent/AgentEditor.vue'

    export default {
        name: 'PortalAgentEditor',
        inheritAttrs: false,

        components: {
            AgentEditor
        },

        props: {
            // 门户配置页的可选路径参数 id
            id: {
                type: [String, Number],
                default: null
            },
            // 透传叶子组件的 agent prop
            agent: {
                type: Object,
                default: null
            }
        },

        computed: {
            resolvedAgent () {
                if (this.agent) return this.agent
                if (this.id !== null && this.id !== undefined && this.id !== '') {
                    return { id: this.id }
                }
                return null
            }
        },

        methods: {
            agentId (agent) {
                if (!agent || agent.id === null || agent.id === undefined || agent.id === '') return ''
                return String(agent.id)
            },

            navigate (path) {
                if (!this.$router || this.$route && this.$route.path === path) return
                const result = this.$router.push(path)
                if (result && typeof result.catch === 'function') result.catch(() => {})
            },

            onNav (view) {
                if (view === 'list') {
                    // 返回列表固定回到「我的智能体」工作台栏目，避免依赖历史来源
                    this.navigate('/portal/mine?tab=agents')
                    return
                }
                if (view === 'edit') {
                    const id = this.agentId(this.resolvedAgent)
                    this.navigate(id ? '/portal/create/agent/' + encodeURIComponent(id) : '/portal/create/agent')
                    return
                }
                this.navigate('/portal/agents')
            }
        }
    }
</script>

<style scoped>
.portal-agent-editor {
    width: 100%;
}
</style>
