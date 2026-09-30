<template>
    <div class="portal-agent-run">
        <AgentRun
            v-bind="$attrs"
            :agent="resolvedAgent"
            @nav="onNav"
            @edit-agent="onEdit"
        />
    </div>
</template>

<script>
    import AgentRun from '@/pages/portal/components/agent/AgentRun.vue'

    export default {
        name: 'PortalAgentRun',
        inheritAttrs: false,

        components: {
            AgentRun
        },

        props: {
            // 门户运行页从路径参数传入智能体 id
            id: {
                type: [String, Number],
                default: null
            },
            // 同时透传叶子组件的 agent prop，便于其它宿主复用
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

            goEditor (agent) {
                const id = this.agentId(agent || this.resolvedAgent)
                this.navigate(id ? '/portal/create/agent/' + encodeURIComponent(id) : '/portal/create/agent')
            },

            onEdit (agent) {
                this.goEditor(agent)
            },

            onNav (view) {
                // adjustAgent 会同时发出 edit-agent 与 nav(edit)，编辑事件已完成跳转
                if (view === 'edit') return
                if (view === 'home') {
                    this.navigate('/portal/home')
                    return
                }
                this.navigate('/portal/agents')
            }
        }
    }
</script>

<style scoped>
.portal-agent-run {
    width: 100%;
}
</style>
