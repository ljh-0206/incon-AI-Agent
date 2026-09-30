import cookies from './util.cookies';
import logFunctions from './util.log';
import db from './util.db';

import store from '@/store';

/**
 * @description 日志记录函数 - 可作为函数调用记录日志，也可使用方法打印彩色日志
 * @param {Object} params 日志参数 { content, type }
 */
function log (params) {
    if (params) {
        store.dispatch('admin/log/push', params);
    }
}

// 添加日志打印方法
log.capsule = logFunctions.capsule;
log.colorful = logFunctions.colorful;
log.default = logFunctions.default;
log.primary = logFunctions.primary;
log.success = logFunctions.success;
log.warning = logFunctions.warning;
log.error = logFunctions.error;

// 添加 push 方法（与直接调用等效）
log.push = function (params) {
    store.dispatch('admin/log/push', params);
};

const util = {
    cookies,
    log,
    db
};

// 标签页标题兜底：页面名尚未就绪（首屏挂载前 / 路由无 meta.title / i18n 未就绪）时用它
const DEFAULT_TITLE = '赢科智能体平台';

function tTitle (title = '') {
    // i18n 键（$t:xxx）：未就绪时不返回原始键名，交给调用方回落到 DEFAULT_TITLE
    if (title.indexOf('$t:') === 0) {
        return (window && window.$t) ? window.$t(title.split('$t:')[1]) : '';
    }
    return title;
}

/**
 * @description 更改标题
 * 规则（写死）：浏览器标签页标题 = 当前页面名称本身；
 * 不再拼接 Setting.titleSuffix —— 该后缀会被后端配置（initSetting）覆盖成「配置平台4.0」，
 * 即旧「页面名 - 配置平台4.0」的来源。
 * @param {Object} title 当前页面名称，通常传 route.meta.title
 * @param {Object} count 未读消息数提示（可视情况选择使用或不使用）
 */
util.title = function ({
    title,
    count
}) {
    title = tTitle(title);
    let fullTitle = title || DEFAULT_TITLE;

    if (count) fullTitle = `(${count}条消息)${fullTitle}`;
    window.document.title = fullTitle;
};

function requestAnimation (task) {
    if ('requestAnimationFrame' in window) {
        return window.requestAnimationFrame(task);
    }

    setTimeout(task, 16);
}

export {
    requestAnimation
};

export default util;
