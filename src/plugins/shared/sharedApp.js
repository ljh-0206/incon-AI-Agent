/**
 * 所有应用共享的全局配置
 * main.js 和 inco_dy 等独立子应用都通过 useSharedApp(app) 注入
 */

// ============ vue-flow 样式 ============
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';

// ============ 样式文件（仅在主应用入口引入一次，子应用共享主应用 DOM 环境，无需重复引入）============
// 样式统一在 main.js 入口处引入，此处只放纯 JS 共享逻辑

// ============ 核心依赖（不含 createApp，调用方已引入）============
import store from '@/store/index';
import router from '@/router';
import i18n from '@/i18n';
import mixinApp from '@/mixins/app';
// 配置
import Setting from '@/setting';
import * as commonsJs from '@/api/common';
import ViewUIPlus from 'view-ui-plus';
import index from '@/components/index';
import Vant from 'vant';
import VXETable from 'vxe-table';
import setPlugin from '@/plugins/shared/setPlugin';
import plugins from '@/plugins';
import ProgressPlugin from '@/components/commonComponent/progress_dy/index.js';
import * as gzl from '@/components/commonComponent/gzl/index.js';
import inco_dy from '@/components/commonComponent/inco_dy/index.js';
import viewfile_dy from '@/components/commonComponent/viewFile_dy/index.js';
import office_dy from '@/components/commonComponent/office_dy/index.js';
import xgmm_dy from '@/components/commonComponent/xgmm/index.js';
import qhjs_dy from '@/components/commonComponent/qhjs/index.js';
import func from '@/components/commonComponent/newgzl/js/preload.js';
import captcha_dy from '@/components/commonComponent/captcha_dy/index.js';
import SockJs from 'sockjs-client';
import Stomp from 'stompjs';
import jshint from 'jshint';
import mitt from 'mitt';
import xss from 'xss';
import { VueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';

// ============ 全局初始化（window 全局量）============
const emitter = mitt();
window.$Bus = emitter;
window.JSHINT = jshint.JSHINT;

// ============ xss 白名单配置 ============
const xssOptions = {
    whiteList: {
        a: ['style', 'href', 'title', 'target'],
        p: ['style'],
        section: ['style'],
        strong: ['style'],
        abbr: ['title', 'style'],
        address: ['style'],
        area: ['style', 'shape', 'coords', 'href', 'alt'],
        article: ['style'],
        aside: ['style'],
        audio: ['style', 'autoplay', 'controls', 'loop', 'preload', 'src'],
        b: ['style'],
        bdi: ['style', 'dir'],
        bdo: ['style', 'dir'],
        big: ['style'],
        blockquote: ['style', 'cite'],
        br: ['style'],
        caption: ['style'],
        center: ['style'],
        cite: ['style'],
        code: ['style'],
        col: ['style', 'align', 'valign', 'span', 'width'],
        colgroup: ['style', 'align', 'valign', 'span', 'width'],
        dd: ['style'],
        del: ['style', 'datetime'],
        details: ['style', 'open'],
        div: ['style', 'class'],
        dl: ['style'],
        dt: ['style'],
        em: ['style'],
        font: ['style', 'color', 'size', 'face'],
        footer: ['style'],
        h1: ['style'],
        h2: ['style'],
        h3: ['style'],
        h4: ['style'],
        h5: ['style'],
        h6: ['style'],
        header: ['style'],
        hr: ['style'],
        i: ['style'],
        img: ['style', 'src', 'alt', 'title', 'width', 'height'],
        ins: ['style', 'datetime'],
        li: ['style'],
        mark: ['style'],
        nav: ['style'],
        ol: ['style'],
        pre: ['style'],
        s: ['style'],
        small: ['style'],
        span: ['style'],
        sub: ['style'],
        sup: ['style'],
        table: ['width', 'border', 'align', 'valign', 'style'],
        tbody: ['style', 'align', 'valign'],
        td: ['width', 'rowspan', 'colspan', 'align', 'valign', 'style'],
        tfoot: ['style', 'align', 'valign'],
        th: ['style', 'width', 'rowspan', 'colspan', 'align', 'valign'],
        thead: ['style', 'align', 'valign'],
        tr: ['style', 'rowspan', 'align', 'valign'],
        tt: ['style'],
        u: ['style'],
        ul: ['style'],
        video: ['style', 'autoplay', 'controls', 'loop', 'preload', 'src', 'height', 'width'],
        style: ['style']
    },
    stripIgnoreTag: true,
    allowCommentTag: false,
    stripIgnoreTagBody: ['script', 'noscript']
};

const customXss = new xss.FilterXSS(xssOptions);

// ============ 共享配置 ========================================
/**
 * 为 Vue app 实例注入所有共享配置
 * @param {import('vue').App} app - createApp() 返回的实例
 */
export function useSharedApp (app) {
    // 1. warnHandler - 忽略 Vue 3 非关键警告
    app.config.warnHandler = (msg, instance, trace) => {
        if (msg.includes('Extraneous non-props attributes') ||
            msg.includes('Extraneous non-emits event listeners') ||
            msg.includes('Non-function value encountered for default slot') ||
            msg.includes('was accessed during render but is not defined on instance') ||
            msg.includes('emitted event "update:visible"') ||
            msg.includes('Failed to resolve component') ||
            msg.includes('Unknown custom element')
        ) {
            return;
        }
        console.warn('[Vue warn]: ' + msg, trace);
    };

    // 2. Vuex store 单例
    app.use(store);

    // 3. Vue Router 单例（子应用和主应用共用同一个路由实例）
    app.use(router);

    // 4. i18n（子应用和主应用共用同一个 i18n 实例）
    app.use(i18n);

    // 5. ViewUIPlus（直接使用共用的 i18n）
    app.use(ViewUIPlus, {
        i18n: (key, value) => i18n.global.t(key, value)
    });

    // 6. 全局组件
    app.use(index);
    app.component('VueFlow', VueFlow);
    app.component('VueFlowBackground', Background);
    app.component('VueFlowControls', Controls);
    app.component('VueFlowMiniMap', MiniMap);

    // 7. Vant
    app.use(Vant);

    // 8. VXETable
    app.use(VXETable);

    // 9. 插件
    app.use(setPlugin);
    app.use(plugins);

    // 10. ProgressPlugin
    app.use(ProgressPlugin);

    // 11. 全局属性
    const gp = app.config.globalProperties;
    gp.commonsJs = commonsJs;
    gp.$gzl = gzl;
    gp.$inco_dy = inco_dy;
    gp.$viewfile_dy = viewfile_dy;
    gp.$office_dy = office_dy;
    gp.$xgmm = xgmm_dy;
    gp.$qhjs = qhjs_dy;
    gp.$func = func;
    gp.$captcha = captcha_dy;
    gp.SockJs = SockJs;
    gp.Stomp = Stomp;
    gp.$Bus = window.$Bus;
    gp.$xss = (html) => customXss.process(html);

    gp.baseUrl = Setting.baseUrl;
    gp.casUrl = Setting.casUrl;
    gp.sysConfig = Setting;

    // 12. provide 注入 xss（setup 中可通过 inject('$xss') 获取）
    app.provide('$xss', customXss.process.bind(customXss));

    // 13. 全局 mixin（Vue 2 兼容：_uid、$listeners、appRouteChange）
    app.mixin(mixinApp);

    return app;
}

// 导出单例，供外部直接引用
export { store, router, i18n, commonsJs, emitter };
