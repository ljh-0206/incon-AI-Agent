import '@babel/polyfill';
import 'default-passive-events';

// Vue 3
import { createApp } from 'vue';
import App from './App.vue';

// ============ 样式文件（只在主入口引入一次）============
import './styles/index.less';
import './libs/iview-pro/iview-pro.css';
import 'vant/lib/index.css';
import 'vxe-table/lib/style.css';

// 共享配置（router、i18n、mixinApp 已在 sharedApp.js 中自动注入）
import { useSharedApp, store, commonsJs, i18n } from '@/plugins/shared/sharedApp';
import { initSetting } from '@/setting';
import { refershSider } from '@/menu/sider';

// 创建 Vue 应用实例
const app = createApp(App);

// 全局 window $t 函数
if (window) window.$t = (key, value) => i18n.global.t(key, value);

/**
 * 处理路由及菜单function
 * 注意：动态路由的恢复在 router/index.js 的 restoreDynamicRoutes 函数中处理
 */
function extractedMenuList (noAuthMenu, menulist_noAuth) {
    const routerlist_noAuth = [];
    if (noAuthMenu && noAuthMenu.length > 0) {
        const routerTreeList = commonsJs.listToTree(noAuthMenu, 'qxdm', 'fqxdm', 'qxmc', '-1');
        routerTreeList.map(item => {
            routerlist_noAuth.push(item);
            // 处理不需要登录的后台菜单
            if (item.fwlx == 'ht' && item.sfcd == '1') menulist_noAuth.push(recursion_noAuth_menu({ ...item }));
        });

        // 处理不需要登录的后台菜单
        function recursion_noAuth_menu (data) {
            if (data.children) {
                for (let i = 0; i < data.children.length; i++) {
                    const item = data.children[i];
                    if (item.fwlx == 'ht' && item.sfcd == '1') recursion_noAuth_menu(item);
                    else data.children.splice(i, 1);
                }
            }
            return data;
        }
    }

    // 将不需要登录的后台菜单添加到菜单并放入到localStorage
    localStorage.setItem('routerlist_noAuth' + '_' + commonsJs.setting.xmid, commonsJs.encrypt_aes(JSON.stringify(routerlist_noAuth)));
    localStorage.setItem('menulist_noAuth' + '_' + commonsJs.setting.xmid, commonsJs.encrypt_aes(JSON.stringify(menulist_noAuth)));
}
(async () => {
    // 先异步加载远程配置（不阻塞页面加载）
    // 查询其他信息
    try {
        const queryRes = await commonsJs.multiquery([
            { sqlid: '1678164546575b315a8f954a7264eafe28765cacaad18', blm: 'noAuthMenu', type: 'querylist', param: {} }, // 无需登录的路由
            { sqlid: '1684899254231f734f5f3592b6d418dafdfc1b334d417', blm: 'getSeting', type: 'queryone', param: {} }// 查询setting配置信息
        ]);
        initSetting(queryRes.getSeting);
        // 处理不需要登录的路由及后台菜单
        const menulist_noAuth = [];
        extractedMenuList(queryRes.noAuthMenu, menulist_noAuth);
        // 配置加载完成后刷新菜单（此时 Setting.xmid 已就绪）
        refershSider();
    } catch (e) {
        console.warn('noAuthMenu 加载失败，跳过:', e.message);
    }

    // 处理系统配置信息，布局的一些配置
    for (const key in commonsJs.setting.layout) {
        store.commit('admin/layout/updateLayoutSetting', { key, value: commonsJs.setting.layout[key] });
    }
    // 注入所有共享配置
    useSharedApp(app);
    // 挂载应用
    const appInstance = app.mount('#app');

    // 挂载到 window 供独立子应用访问
    window.__vueRootInstance__ = appInstance;
})();

// 导出 app 实例供全局组件注册使用
// export { app };
