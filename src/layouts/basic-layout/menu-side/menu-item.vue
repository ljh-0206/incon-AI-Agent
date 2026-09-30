<template>
    <div>
        <Menu-Item v-if="!query" :replace="menu.replace" :target="menu.target" :name="menu.path"
            @click.native="handleClick(menu)">
        <i-menu-side-title :menu="menu" :hide-title="hideTitle" />
        <Badge class="i-layout-menu-side-badge" v-if="badgeData" v-bind="badgeData" />
        </Menu-Item>
        <Menu-Item v-else :replace="menu.replace" :target="menu.target" :name="path" @click.native="handleClick(menu)">
        <a :href="menu.path" style="color:rgba(255, 255, 255, 0.7);">
            <i-menu-side-title :menu="menu" :hide-title="hideTitle" />
            <Badge class="i-layout-menu-side-badge" v-if="badgeData" v-bind="badgeData" />
        </a>
        </Menu-Item>

    </div>
</template>
<script>
    import iMenuSideTitle from './menu-title';
    import clickItem from '../mixins/click-item';
    import menuBadge from '../mixins/menu-badge';

    export default {
        name: 'iMenuSideItem',
        components: {
            iMenuSideTitle
        },
        mixins: [clickItem, menuBadge],
        props: {
            menu: {
                type: Object,
                default () {
                    return {}
                }
            },
            hideTitle: {
                type: Boolean,
                default: false
            }
        },
        data () {
            return {
                path: '',
                query: ''
            };
        },
        mounted () {
            if (this.menu.path && this.menu.path.split('?').length == 2) {
                this.path = this.menu.path.split('?')[0];
                this.query = this.menu.path.split('?')[1];
            }
        }
    }
</script>
