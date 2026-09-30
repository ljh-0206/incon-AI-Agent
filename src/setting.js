/**
 * iView Admin Pro 业务配置
 * */
import { encrypt_aes, decrypt_aes } from '@/utils/aesEncrypt'

const env = process.env.NODE_ENV;
// 生产环境后台地址
export const baseUrl = 'http://cas.incons.com.cn:19070/xmpzpt';
// cas服务地址
export const casUrl = 'http://cas.incons.com.cn:19012/cas';
const Setting = {
    frameLx: 'web',
    /**
     * 基础配置
     * */
    // 网页标题的后缀
    loginWithCaptcha: true,
    titleSuffix: '赢科智能体平台',
    // 路由模式，可选值为 history 或 hash
    routerMode: 'history',
    // 应用的基路径
    routerBase: '/',
    // 页面切换时，是否显示模拟的进度条
    showProgressBar: true,
    // 接口请求地址
    apiBaseURL: '/api',
    // 接口请求返回错误时，弹窗的持续时间，单位：秒
    modalDuration: 3,
    // 接口请求返回错误时，弹窗的类型，可选值为 Message 或 Notice
    errorModalType: 'Message',
    // Cookies 默认保存时间，单位：天
    cookiesExpires: 1,
    // 上传下载服务地址
    uploadBaseURL: 'http://cas.incons.com.cn:19053/inco-filesystem',
    // 静态资源服务地址（如前后端部署在同一台机器，可将此地址配置为前端访问地址/json/，否则请配置为单独映射的地址）
    staticResourceUrl: 'http://localhost:8083/json/',
    // 开启cas
    casEnable: false,
    // 单点登录后台跳转url
    casloginUrl: baseUrl + '/cas',
    // 单点登出url
    caslogoutUrl: casUrl + '/logout?service=' + baseUrl + '/cas',
    // 默认路由
    defaultRouteName: 'login',
    // 登录后默认落地页：门户首页 /portal/home（产品默认页）
    // 说明：原为角色分流（qt → 前端壳 qt；ht → 后台首页 dashboard-console），
    // 现统一改为门户首页；后台首页仍可从门户顶栏用户下拉「跳转后台」进入。
    // 这两个键仍可由后端 pzxx 配置覆盖，但非门户首页的旧值会被 home.vue 兜底回 /portal/home。
    afterloginQtRouteName: 'portal-home',
    afterloginHtRouteName: 'portal-home',
    qt_main_page_id: '1678173445747a1fed36c3c4a977642d1eff74c9342c29',
    xmid: '',
    xtdm: 'pzpt',
    dashboard_id: '',
    // 路由访问日志
    lyfwrz: false,
    /**
     * 多语言配置
     * */
    i18n: {
        // 默认语言
        default: 'zh-CN',
        // 是否根据用户电脑配置自动设置语言（仅第一次有效）
        auto: false
    },
    /**
     * 布局配置
     * */
    // 侧边菜单宽度，单位 px，不可动态修改，需与 setting.less 中 @menuSideWidth 保持一致
    menuSideWidth: 256,
    layout: {
        // 侧边栏风格，可选值为 dark 或 light
        siderTheme: 'dark',
        // 顶栏风格，可选值为 light、dark 或 primary
        headerTheme: 'light',
        // 顶栏是否置顶，开启后会覆盖侧边栏，需开启 headerFix
        headerStick: false,
        // 是否开启多 Tabs 页签
        tabs: true,
        // 与 Tabs 页签是否显示图标，开启 tabs 时有效
        showTabsIcon: true,
        // 是否固定 Tabs 多页签
        tabsFix: true,
        // 再次点击 Tabs 页签时，是否重载当前页面
        tabsReload: false,
        // 页签是否支持拖拽排序
        tabsOrder: true,
        // 是否固定侧边栏
        siderFix: true,
        // 是否固定顶栏
        headerFix: true,
        // 是否在下滑时隐藏顶栏，需开启 headerFix，如果开启了 tabsFix，Tabs 也会被隐藏
        headerHide: false,
        // 是否显示顶部菜单？
        // 一般来说，侧边的菜单栏足以满足大部分业务，如需动态切换侧边栏，可开启此选项启用顶部一级菜单，此时侧边栏将作为二级菜单
        headerMenu: false,
        // 侧边菜单栏是否开启手风琴模式
        menuAccordion: true,
        // 是否显示折叠侧边栏按钮，移动端下会自动强制开启
        showSiderCollapse: false,
        // 侧边菜单栏是否默认折叠
        menuCollapse: false,
        // 再次点击当前侧边菜单时，是否重载当前页面
        menuSiderReload: false,
        // 再次点击当前顶部菜单时，是否重载当前页面
        menuHeaderReload: false,
        // 侧边菜单折起时，是否在子菜单前显示父级菜单名称
        showCollapseMenuTitle: false,
        // 是否显示重载按钮
        showReload: true,
        // 是否显示搜索
        showSearch: false,
        // 是否显示通知
        showNotice: false,
        // 是否显示全屏
        showFullscreen: true,
        // 在手机访问时，是否在顶部显示小尺寸 logo
        showMobileLogo: false,
        // 是否显示全局面包屑，开启 headerMenu 时不可用
        showBreadcrumb: false,
        // 全局面包屑是否显示图标，开启 showBreadcrumb 时有效
        showBreadcrumbIcon: false,
        // 是否显示日志入口，开启与否，不影响日志记录，如不希望用户看到可关闭
        showLog: false,
        // 是否显示多语言
        showI18n: false,
        // 是否支持动态修改布局配置，移动端下会自动强制关闭
        enableSetting: true,
        // 退出登录时，是否二次确认
        logoutConfirm: true,
        // 显示设置是否允许多设备登录
        showDsbdl: true
    },
    /**
     * 多页 Tabs
     * */
    page: {
        // 默认打开的页面
        opened: []
    },
    /**
     * 功能配置
     * */
    // 相同路由，不同参数间进行切换，是否强力更新
    sameRouteForceUpdate: false,
    // 是否使用动态侧边菜单
    dynamicSiderMenu: false,
    /**
     * 版本信息
     * */
    // 前端版本号
    version: '4.0_20260512',
    // 前后端对比版本号
    compareVersion: '20260512_001'
};

export function initSetting (res) {
    const pzxxsj = res;
    if (pzxxsj && pzxxsj.pzxx) {
        let pzxx = pzxxsj.pzxx;
        if (pzxx.indexOf('return') === -1) {
            pzxx = decrypt_aes(pzxx);
        }
        const funcEval = new Function('baseUrl', 'casUrl', pzxx);
        pzxx = funcEval(baseUrl, casUrl);
        if (pzxx) {
            for (const key in pzxx) {
                if (key === 'layout') {
                    for (const layoutKey in pzxx.layout) {
                        Setting.layout[layoutKey] = pzxx.layout[layoutKey];
                    }
                } else {
                    Setting[key] = pzxx[key];
                }
            }
        }
    }
}

export default Setting;
