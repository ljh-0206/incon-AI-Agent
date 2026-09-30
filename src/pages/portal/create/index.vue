<template>
    <!-- 顶栏 + v3 主题层由 /portal 一级壳（PortalShell）渲染，本页只出内容 -->
    <main class="portal-agent-page">
        <PortalAgentEditor :id="agentId" />
    </main>
</template>

<script>
    import PortalAgentEditor from '../components/PortalAgentEditor.vue'

    export default {
        name: 'PortalCreate',

        components: {
            PortalAgentEditor
        },

        computed: {
            agentId () {
                if (!this.$route || !this.$route.params) return null
                const id = this.$route.params.id
                return id === null || id === undefined || id === '' ? null : id
            }
        }
    }
</script>

<style scoped>
.portal-agent-page {
    max-width: var(--max);
    margin: 0 auto;
    padding: calc(var(--header-h) + var(--s8)) var(--s6) var(--s16);
}
</style>
