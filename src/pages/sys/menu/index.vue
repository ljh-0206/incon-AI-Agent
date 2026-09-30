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
                routerProps: { initData_props: '1684489142454466399c9ab5556eee4c36fcc5336381' }
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
