<template>
    <!-- 顶栏 + v3 主题层由 /portal 一级壳（PortalShell）渲染，本页只出内容 -->
    <main class="portal-kb-qak-page">
        <!-- QakList 自带「问答库管理」标题行，壳页不重复加大标题 -->
        <QakList />
    </main>
</template>

<script>
    import QakList from '@/pages/project/ai/qak/QakList.vue'

    export default {
        name: 'PortalKbQak',

        components: {
            QakList
        }
    }
</script>

<style scoped lang="less">
/* 容器：仅做固定顶栏让位 + 宽度对齐（对齐既有门户页 .portal-agent-page）。
   QakList 根节点无自身内边距，故沿用标准内边距，不存在双重留白、无需缩减 */
.portal-kb-qak-page {
    max-width: var(--max);
    margin: 0 auto;
    padding: calc(var(--header-h) + var(--s8)) var(--s6) var(--s16);
}
</style>
