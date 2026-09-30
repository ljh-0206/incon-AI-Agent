<template>
    <menucrud :routerProps="routerProps"></menucrud>
</template>
<script>
    import menucrud from '@/pages/common/commonLayoutCrud';

    export default {
        name: 'system-menu',
        components: { menucrud },
        data () {
            return {
                routerProps: { initData_props: '1684489102370295528631c167875fc756c817fc26f97' }
            }
        },
        computed: {

        },
        methods: {

        },
        mounted () {
        }
    }
</script>
