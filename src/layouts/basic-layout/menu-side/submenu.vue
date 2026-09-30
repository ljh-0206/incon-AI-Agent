<template>
    <Submenu :name="menu.path">
        <template #title>
            <i-menu-side-title :menu="menu" />
            <!-- <Badge class="i-layout-menu-side-badge" v-if="badgeData" v-bind="badgeData" /> -->
        </template>
        <template v-for="(item, index) in menu.children">
            <i-menu-side-item v-if="item.children === undefined || !item.children.length" :menu="item" :key="'item-' + index"
                :style="checkMenu(item.path)<0?'display: none;':''" />
            <i-menu-side-submenu v-else :menu="item" :key="'submenu-' + index" :style="checkMenu(item.path)<0?'display: none;':''" />
        </template>
    </Submenu>
</template>
<script>
    import iMenuSideItem from './menu-item';
    import iMenuSideTitle from './menu-title';
    import menuBadge from '../mixins/menu-badge';

    import {
        mapState,
        mapGetters
    } from 'vuex';

    export default {
        name: 'iMenuSideSubmenu',
        components: {
            iMenuSideItem,
            iMenuSideTitle
        },
        mixins: [menuBadge],
        props: {
            menu: {
                type: Object,
                default () {
                    return {}
                }
            }
        },
        computed: {
            ...mapState('admin/user', [
                'info'
            ])
        },
        data () {
            return {

            }
        },
        created () {

        },
        methods: {
            // 获取菜单列表
            checkMenu (item) {
                // 暂时注释掉
                return 1;
            },
            handleUpdateMenuState () {
                this.$nextTick(() => {
                    if (this.$refs.menu) {
                        this.$refs.menu.updateActiveName();
                        if (this.menuAccordion) this.$refs.menu.updateOpened();
                        // 聚焦当前项
                        this.$nextTick(() => {
                            const $activeMenu = document.getElementsByClassName(
                                'ivu-menu-item ivu-menu-item-active ivu-menu-item-selected');
                            if ($activeMenu && $activeMenu.length && !isElementInViewport($activeMenu[
                                0])) {
                                const activeMenuTop = $activeMenu[0].getBoundingClientRect().top;
                                const $menu = this.$refs.menu.$el;
                                setTimeout(() => {
                                    this.$ScrollTop($menu, {
                                        to: activeMenuTop,
                                        time: 0
                                    });
                                }, 300);
                            }
                        });
                    }
                });
            }
        }
    }
</script>
