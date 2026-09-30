<template>
    <div class="portal-agent-list">
        <AgentList
            ref="agentList"
            v-bind="$attrs"
            :scope="scope"
            :keyword="keyword"
            @create-agent="goCreate"
            @edit-agent="goEdit"
            @open-agent="goRun"
        />
    </div>
</template>

<script>
    import AgentList from '@/pages/portal/components/agent/AgentList.vue'

    export default {
        name: 'PortalAgentList',
        inheritAttrs: false,

        components: {
            AgentList
        },

        props: {
            // 与 AgentList 内部筛选状态保持同步；mine 页面默认使用「全部范围」
            scope: {
                type: String,
                default: 'all'
            },
            // 支持门户首页搜索词透传
            keyword: {
                type: String,
                default: ''
            }
        },

        watch: {
            scope: {
                immediate: true,
                handler () {
                    this.syncFilters()
                }
            },
            keyword () {
                this.syncFilters()
            }
        },

        mounted () {
            this.syncFilters()
        },

        methods: {
            // AgentList 当前没有对外 props，门户通过包装层同步其筛选状态而不改动叶子组件 API
            syncFilters () {
                this.$nextTick(() => {
                    const list = this.$refs.agentList
                    if (!list) return
                    list.scope = this.scope || 'all'
                    list.keyword = this.keyword || ''
                })
            },

            agentId (agent) {
                if (!agent || agent.id === null || agent.id === undefined || agent.id === '') return ''
                return String(agent.id)
            },

            navigate (path) {
                if (!this.$router || this.$route && this.$route.path === path) return
                const result = this.$router.push(path)
                if (result && typeof result.catch === 'function') result.catch(() => {})
            },

            goCreate () {
                this.navigate('/portal/create/agent')
            },

            goEdit (agent) {
                const id = this.agentId(agent)
                this.navigate(id ? '/portal/create/agent/' + encodeURIComponent(id) : '/portal/create/agent')
            },

            goRun (agent) {
                const id = this.agentId(agent)
                if (!id) return
                this.navigate('/portal/agents/' + encodeURIComponent(id) + '/run')
            }
        }
    }
</script>

<style scoped>
.portal-agent-list {
    width: 100%;
}
</style>
