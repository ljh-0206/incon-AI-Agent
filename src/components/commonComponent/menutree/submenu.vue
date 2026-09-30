<template>
    <Submenu :name="menu.name">
        <template slot="title">
            <i-menu-side-title-tree :configdata="configdata" :menu="menu"></i-menu-side-title-tree>
        </template>
        <template v-for="(item, index) in menu.children">
            <i-menu-side-item-tree v-if="!item.children || item.children.length==0" :configdata="configdata" :menu="item" :key="index"></i-menu-side-item-tree>
            <i-menu-side-submenu-tree v-else :configdata="configdata" :menu="item" :key="index+'_submenu'"></i-menu-side-submenu-tree>
        </template>
    </Submenu>
</template>
<script>
    import iMenuSideItemTree from './menu-item';
    import iMenuSideTitleTree from './menu-title';

    export default {
        name: 'iMenuSideSubmenuTree',
        components: {
            iMenuSideItemTree,
            iMenuSideTitleTree
        },
        props: {
            menu: {
                type: Object,
                default () {
                    return {}
                }
            },
            configdata: { type: Object, default: () => ({}) }
        },
        computed: { },
        data () {
            return { }
        },
        created () { }
    }
</script>
