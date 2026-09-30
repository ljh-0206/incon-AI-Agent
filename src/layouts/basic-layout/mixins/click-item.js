import { findComponentUpward } from 'view-ui-plus/src/utils/assist';
import { mapState } from 'vuex';

export default {
    computed: {
        ...mapState('admin/layout', [
            'menuSiderReload',
            'menuHeaderReload'
        ])
    },
    methods: {
        handleClick (menu, type = 'sider') {
            // 处理路由参数
            const router_props = {};
            if (menu.click && menu.click.trim()) {
                this.commonsJs.funcEval(this, menu, menu.click)
                return
            }
            if (menu.sfxbqydk == '1') {
                this.commonsJs.openRouter(this, menu.path, router_props)
            } else {
                const current = this.$route.path;
                if (current === menu.path) {
                    if (type === 'sider' && this.menuSiderReload) this.handleReload();
                    else if (type === 'header' && this.menuHeaderReload) this.handleReload();
                } else {
                    this.commonsJs.openRouter(this, menu.path, router_props, false)
                }
            }
        },
        handleReload () {
            const $layout = findComponentUpward(this, 'BasicLayout');
            if ($layout) $layout.handleReload();
        }
    }
}
