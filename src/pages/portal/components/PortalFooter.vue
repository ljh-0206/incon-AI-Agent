<template>
    <!-- 门户页脚（视觉-only）：全幅绛红收口带 + 居中版权行，规格同首页 .panel-footer-bar -->
    <footer class="portal-footer">
        <!-- 默认插槽可整体覆盖版权行正文；不传时回落到 text 属性 -->
        <p class="portal-footer__copy">
            <slot>{{ text }}</slot>
        </p>
    </footer>
</template>

<script>
    export default {
        name: 'PortalFooter',

        props: {
            // 版权行文案；token（--c-* / --s* / --text-*）取自祖先 body.page-portal-v3
            text: {
                type: String,
                default: '版权所有 © 北京赢科天地电子有限公司'
            }
        }
    }
</script>

<style scoped lang="less">
    /* 页脚条：flex-shrink:0 防窄视口被压掉；页面自带布局类（如 margin-top）由父页挂到根节点上 */
    .portal-footer {
        flex-shrink: 0;
        width: 100%;
        background: var(--c-red-600);
        color: rgba(255, 255, 255, .75);
        padding: var(--s6) var(--s6) var(--s4);
    }

    /* 版权行：居中、--text-xs、白 50% */
    .portal-footer__copy {
        margin: 0;
        text-align: center;
        font-size: var(--text-xs);
        color: rgba(255, 255, 255, .5);
    }
</style>
