<template>
    <!-- 顶栏 + v3 主题层由 /portal 一级壳（PortalShell）渲染，本页只出内容容器 -->
    <main class="portal-workflows">
        <PortalWorkflowList />
    </main>
</template>

<script>
import PortalWorkflowList from '../components/PortalWorkflowList.vue'

const WORKFLOWS_PATH = '/portal/workflows'

function firstQueryValue(value) {
    return Array.isArray(value) ? value[0] : value
}

function normalizedRouteMode(route) {
    const query = (route && route.query) || {}
    const mode = firstQueryValue(query.mode)
    return mode ? String(mode).toLowerCase() : ''
}

function redirectLegacyWorkflowGeneration(to) {
    const path = to.path || ''
    const isListPath = path === WORKFLOWS_PATH || path === WORKFLOWS_PATH + '/'
    const isCreatePath = path.indexOf('/portal/workflows/create') === 0
    const mode = normalizedRouteMode(to)
    if ((isListPath || isCreatePath) && (mode === 'generate' || mode === 'generator')) {
        return { path: WORKFLOWS_PATH, replace: true }
    }
}

export default {
    name: 'PortalWorkflows',

    components: {
        PortalWorkflowList,
    },

    beforeRouteEnter: redirectLegacyWorkflowGeneration,
    beforeRouteUpdate: redirectLegacyWorkflowGeneration
}
</script>

<style scoped lang="less">
/* 页面只提供一级壳下方的内容容器，具体布局由工作流叶子组件负责 */
.portal-workflows {
    width: 100%;
    max-width: 1400px;
    min-width: 0;
    margin: 0 auto;
    padding: calc(var(--header-h) + var(--s6)) var(--s6) var(--s16);
    box-sizing: border-box;
}
</style>
