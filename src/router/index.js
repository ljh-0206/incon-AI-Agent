import { createRouter, createWebHistory } from 'vue-router';
import ViewUIPlus from 'view-ui-plus';

import util from '@/libs/util';

import Setting from '@/setting';
import { decrypt_aes } from '@/utils/aesEncrypt';
import * as commonsJs from '@/api/common';

import store from '@/store/index';

// 门户登录弹窗状态（未登录访问受保护页面时回首页并自动弹出）
import { openLoginModal } from '@/pages/portal/components/loginModalState';

// 路由数据
import routes from './routes';

// 创建路由实例
const router = createRouter({
    history: createWebHistory(Setting.routerBase),
    routes
});

// 标记动态路由是否已恢复
let dynamicRoutesRestored = false;

// 递归创建路由对象
function createRouteObj (data, auth) {
    const router_props = {};
    if (data.router_props) {
        const propsArr = data.router_props.split('&');
        for (const props of propsArr) {
            router_props[props.split('=')[0]] = props.split('=')[1];
        }
    }
    const routerObj = {
        path: data.url,
        name: data.router_name,
        // props: { routerProps: router_props },
        meta: {
            auth,
            title: data.qxmc,
            cache: true
        },
        children: [],
        component: () => import(/* webpackExclude: /\.html$/ */ '@/pages' + data.zjurl)
    };

    if (Object.keys(router_props).length > 0) {
        routerObj.props = { routerProps: router_props }
    }

    if (data.children) {
        data.children.map(item => {
            if (item.router_type == 'child') {
                routerObj.children.push(createRouteObj(item, auth));
            } else {
                addDynamicRoute(item, auth);
            }
        });
    }
    return routerObj;
}

// 添加动态路由
function addDynamicRoute (item, auth) {
    const routerObj = createRouteObj(item, auth);

    if (item.fwlx == 'kjw') {
        router.addRoute(routerObj);
        // 同时添加到 routes 用于标签页显示
        if (!routes.find(r => r.path === routerObj.path)) {
            routes.push(routerObj);
        }
    } else if (item.fwlx == 'ht') {
        router.addRoute('ht', routerObj);
        // 同时添加到 routes[0].children 用于标签页显示
        if (!routes[0].children.find(r => r.path === routerObj.path)) {
            routes[0].children.push(routerObj);
        }
    } else if (item.fwlx == 'qt') {
        router.addRoute('qt', routerObj);
        // 同时添加到 routes[1].children 用于标签页显示
        if (!routes[1].children.find(r => r.path === routerObj.path)) {
            routes[1].children.push(routerObj);
        }
    }
}
/**
 * 恢复动态路由
 * 页面刷新后从 localStorage 中恢复动态路由
 */
function restoreDynamicRoutes () {
    if (dynamicRoutesRestored) return true;

    // 直接从 Setting 获取 xmid，避免模块加载顺序问题
    const xmid = Setting.xmid;
    if (!xmid) {
        return false;
    }

    const routerlist_noAuth_Str = localStorage.getItem('routerlist_noAuth_' + xmid);
    // 兼容之前浏览器的缓存
    let decryptedNoAuthStr = routerlist_noAuth_Str;
    if (decryptedNoAuthStr && !decryptedNoAuthStr.startsWith('[')) {
        decryptedNoAuthStr = decrypt_aes(routerlist_noAuth_Str);
        const routerlist_noAuth = JSON.parse(decryptedNoAuthStr);
        // 遍历添加无需权限的动态路由
        routerlist_noAuth.map(item => {
            addDynamicRoute(item, false);
        });
    }

    const token = localStorage.getItem('token_' + xmid);

    if (!routerlist_noAuth_Str && (!token || token === 'undefined')) return false;

    const routerlistStr = localStorage.getItem('routerlist_' + xmid);

    if (!routerlist_noAuth_Str && !routerlistStr) return false;

    try {
        if (routerlistStr) {
            let decryptedStr = routerlistStr;
            if (!routerlistStr.startsWith('[')) {
                decryptedStr = decrypt_aes(routerlistStr);
            }
            const routerlist = JSON.parse(decryptedStr);
            // 遍历添加动态路由
            routerlist.map(item => {
                addDynamicRoute(item, true);
            });
        }

        dynamicRoutesRestored = true;
        return true;
    } catch (e) {
        console.error('恢复动态路由失败:', e);
        return false;
    }
}

/**
 * 路由拦截
 */
router.beforeEach((to, from, next) => {
    if (Setting.showProgressBar) ViewUIPlus.LoadingBar.start();

    // 页面刷新后恢复动态路由
    if (!dynamicRoutesRestored) {
        const restored = restoreDynamicRoutes();
        // 如果恢复了路由，需要重新导航让路由重新匹配
        if (restored) {
            // 显式传递 query/params/hash 避免 to.fullPath 路径字符串丢失 query 参数
            next({ path: to.path, query: to.query, params: to.params, hash: to.hash, replace: true });
            return;
        }
    }

    // 判断是否需要登录才可以进入
    if (Setting.casEnable && !!to.query.path) {
        localStorage.setItem('path' + '_' + Setting.xmid, to.query.path);
    }

    if (to.matched && to.matched.length > 0) {
        const matchedRoute = to.matched[to.matched.length - 1];
        if (matchedRoute.meta && matchedRoute.meta.auth) {
            // 这里依据 token 判断是否登录，可视情况修改
            const token = localStorage.getItem('token' + '_' + Setting.xmid);
            if (token && token !== 'undefined') {
                const path = localStorage.getItem('path' + '_' + Setting.xmid);
                if (path) {
   localStorage.removeItem('path' + '_' + Setting.xmid);
                    next(path);
                } else {
                    next();
                }
            } else {
                if (!Setting.casEnable) {
                    // 未登录访问需鉴权路由：
                    // - 门户内页面（/portal、/portal/home、/portal/agents 等）：回门户首页并弹出登录弹窗
                    //   （弹窗成功后由弹窗自行跳回目标或门户首页）
                    // - 其它后台路由（如 /dashboard/console）：静默回门户首页，不弹窗、不记录跳转目标，
                    //   避免游客访问后台地址后在登录成功后被带回后台页面
                    if (to.path === '/portal/home' || to.path === '/portal/agents') {
                        // 防御：门户首页/智能体页本身免登录，理论上不会走到这里，避免重定向成环
                        next();
                    } else if (to.path === '/portal' || to.path.indexOf('/portal/') === 0) {
                        try {
                            openLoginModal(to.fullPath);
                        } catch (e) {
                            // 弹窗模块异常时不影响跳转
                        }
                        next({ path: '/portal/home' });
                    } else {
                        next({ path: '/portal/home' });
                    }
                }
                // 开启cas
                if (Setting.casEnable) {
                    window.location.href = Setting.casloginUrl
                }
            }
        } else {
            next();
        }
    } else {
        // 不需要身份校验 直接通过
        next();
    }
});

/**
 * 路由后置处理
 */
router.afterEach((to, from) => {
    if (Setting.showProgressBar) ViewUIPlus.LoadingBar.finish();
    // 记录访问日志
    // if (to.matched && to.matched.length > 0) {
    //     const matchedRoute = to.matched[to.matched.length - 1];
    //     const path = matchedRoute.path;
    //     util.log({
    //         content: `Open: ${path}`,
    //         type: 'page'
    //     });
    // }

    // 多页控制 打开新的页面
    store.dispatch('admin/page/open', to);
    // 更改标题
    util.title({
        title: to.meta.title
    });
    // 返回页面顶端：仅在真正「换页」时回顶；同路径仅 query 变化（如工作台切栏目、列表筛选）
    // 不重置滚动，避免切换时页面突兀跳回顶部（from 为空 = 首次进入，仍回顶）
    if (!from || to.path !== from.path) window.scrollTo(0, 0);
    // 记录访问日志
    if (Setting.lyfwrz) {
        const obj = {
            name: to.name,
            path: to.path,
            title: to.meta.title,
            fullpath: to.fullPath,
            params: JSON.stringify(to.query)
        }
        commonsJs.incoRequest('insert', '170493652509511374743efec2a716694f473ec8b1fe887f', obj).then(() => {

        })
    }
});

/**
 * 重新设置路由
 * 用于退出登录时重置路由状态
 */
export const resetRouter = () => {
    const newRouter = createRouter({
        history: createWebHistory(Setting.routerBase),
        routes: router.options.routes
    });
    router.matcher = newRouter.matcher;
    dynamicRoutesRestored = false; // 重置标记
}

export default router;
