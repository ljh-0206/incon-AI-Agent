<template>
</template>
<script>
    import Setting from '@/setting';
    // 产品默认落地页：门户首页（/portal/home）
    const DEFAULT_HOME_ROUTE = 'portal-home'
    // 原配置平台的角色分流落地页：ht → 后台首页（dashboard-console）、qt → 前端壳（qt）。
    // 产品改造为智能体平台后不再作为默认落地页，命中即回落到门户首页。
    const LEGACY_HOME_ROUTES = ['dashboard-console', 'qt']
    export default {
        name: 'home',
        components: {},
        data () {
            return {
            }
        },
        computed: {},
        watch: {},
        methods: {},
        mounted () {},
        created () {
            const userinfoStr = localStorage.getItem('userinfo' + '_' + Setting.xmid);
            if (!userinfoStr) {
                // 未登录：回登录页（Setting.defaultRouteName）
                this.$router.push({
                    name: Setting.defaultRouteName
                })
                return
            }
            const userinfo = JSON.parse(userinfoStr);
            // 登录后默认落地门户首页 /portal/home。
            // Setting.afterlogin*（ht/qt）仍可由后端 pzxx 覆盖，用于指定其他落地页；
            // 但旧的角色分流值或未注册的路由名统一兜底到门户首页，保证默认页始终是 /portal/home。
            let name = Setting.afterloginHtRouteName
            if (userinfo && userinfo.role && userinfo.role.length > 0) {
                for (let i = 0; i < userinfo.role.length; i++) {
                    if (userinfo.jsdm == userinfo.role[i].jsdm && userinfo.role[i].fwlx == 'qt') {
                        name = Setting.afterloginQtRouteName
                        break;
                    }
                }
            }
            if (!name || LEGACY_HOME_ROUTES.indexOf(name) > -1 || !this.$router.hasRoute(name)) {
                name = DEFAULT_HOME_ROUTE
            }
            this.$router.push({
                name
            })
        }
    }
</script>
