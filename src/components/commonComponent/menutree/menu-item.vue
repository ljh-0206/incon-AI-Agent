<template>
    <div>
        <Menu-Item :name="menu.name">
            <i-menu-side-title-tree :configdata="configdata" :menu="menu"></i-menu-side-title-tree>
        </Menu-Item>
    </div>
</template>
<script>
    import iMenuSideTitleTree from './menu-title';

    export default {
        name: 'iMenuSideItemTree',
        components: {
            iMenuSideTitleTree
        },
        props: {
            menu: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: () => ({}) }
        },
        data () {
            return {

            };
        },
        mounted () {

        }
    }
</script>
