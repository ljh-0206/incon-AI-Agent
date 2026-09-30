import store from '@/store';
import axios from 'axios';
import util from '@/libs/util';
import Setting from '@/setting';

import {
    Message,
    Notice,
    Spin
} from 'view-ui-plus';

const env = process.env.NODE_ENV;

// 创建一个错误
function errorCreate (msg) {
    const err = new Error(msg);
    errorLog(err);
    throw err;
}

// 记录和显示错误
function errorLog (err) {
    // 添加到日志
    store.dispatch('admin/log/push', {
        message: '数据请求异常',
        type: 'error',
        meta: {
            error: err
        }
    });
    // 打印到控制台
    if (process.env.NODE_ENV === 'development') {
        util.log.error('>>>>>> Error >>>>>>');
        console.log(err);
    }
    // 显示提示，可配置使用 iView 的 $Message 还是 $Notice 组件来显示
    if (Setting.errorModalType === 'Message') {
        Message.error({
            content: err.message,
            duration: Setting.modalDuration
        });
    } else if (Setting.errorModalType === 'Notice') {
        Notice.error({
            title: '提示',
            desc: err.message,
            duration: Setting.modalDuration
        });
    }
}

// 创建一个 axios 实例
export const service = axios.create({
    baseURL: Setting.apiBaseURL,
    timeout: 200000 // 请求超时时间
});

service.defaults.headers.post['Content-Type'] = 'application/json'
service.defaults.headers.get['Content-Type'] = 'application/x-www-form-urlencoded'
service.defaults.headers['X-Requested-With'] = 'XMLHttpRequest'
// 请求拦截器
service.interceptors.request.use(
    config => {
        // 在请求发送之前做一些处理
        const token = localStorage.getItem('token' + '_' + Setting.xmid);
        // 让每个请求携带token-- ['X-Token']为自定义key 请根据实际情况自行修改
        if (token) {
            config.headers.Token = 'Inco-' + token;
        }
        // 增加携带角色信息
        const userinfoStr = localStorage.getItem('userinfo' + '_' + Setting.xmid);
        if (userinfoStr) {
            const userinfo = JSON.parse(userinfoStr);
            config.headers.RoleCode = userinfo.jsdm;
        }
        return config;
    },
    error => {
        // 发送失败
        console.log(error);
        Promise.reject(error);
    }
);

// 刷新token的请求函数
function refreshToken (refreshToken) {
    return service({
        url: '/sys/refreshToken',
        method: 'post',
        data: { refreshToken }
    })
}

// 因axios请求为异步请求，故可能会出现同时多次刷新token的情况
// 该变量相当于给刷新token上了个锁
let isRefreshing = false
// 存储待重试请求的队列
let failedQueue = []

// 处理队列中的请求
function processQueue (error, token = null) {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

// 响应拦截器
service.interceptors.response.use(
    response => {
        // dataAxios 是 axios 返回数据中的 data
        const dataAxios = response.data;
        // 这个状态码是和后端约定的
        const {
            code,
            content
        } = dataAxios;
        // 根据 code 进行判断
        if (code === undefined) {
            // 如果没有 code 代表这不是项目后端开发的接口
            errorCreate('服务器返回值错误');
        } else {
            // 有 code 代表这是一个后端接口 可以进行进一步的判断
            switch (code) {
                case 200:
                    // code === 200 代表成功
                    // 加载用户登录信息
                    return content;
                case 1:
                    // 登出（排除退出登录请求本身，避免递归调用）
                    if (!response.config.url.includes('/sys/logout')) {
                        store.dispatch('admin/account/logout')
                    }
                    break;
                case 400:
                    // code === 400 请求错误，请联系管理员
                    errorCreate('请求错误，请联系管理员');
                    break;
                case 401:
                    // code === 401 未授权，请登录
                    errorCreate('未授权，请登录');
                    break;
                case 403:
                    // code === 403 没有访问权限，请联系管理员
                    // 排除掉刷新token和退出登录的请求，避免递归调用
                    if (!response.config.url.includes('/sys/refreshToken') && !response.config.url.includes('/sys/logout')) {
                        // 先查询vuex中是否有refreshToken
                        // 如果没有，则直接重定向到登录页面进行重新登录
                        if (!localStorage.getItem('refreshToken' + '_' + Setting.xmid)) {
                            store.dispatch('admin/account/logout')
                            if (!Setting.noLoginMsgNoEnable) {
                                errorCreate('登录已过期，请重新登录');
                            }
                        } else {
                            // 如果有，则先判断是否已经有过刷新请求，如果没有，进行刷新请求
                            if (!isRefreshing) {
                                isRefreshing = true
                                return refreshToken(localStorage.getItem('refreshToken' + '_' + Setting.xmid)).then(async res => {
                                    isRefreshing = false
                                    // 通过该请求响应数据的状态码判断刷新token(refreshToken)是否过期
                                    if (!res) {
                                        store.dispatch('admin/account/logout')
                                        if (!Setting.noLoginMsgNoEnable) {
                                            errorCreate('登录已过期，请重新登录');
                                        }
                                    } else {
                                        // 未过期时会得到两个新的token，此时将其持久化
                                        const userinfostr = localStorage.getItem('userinfo' + '_' + Setting.xmid);
                                        if (userinfostr) {
                                            const userinfo = JSON.parse(userinfostr);
                                            userinfo.token = res.token;
                                            userinfo.refreshToken = res.refreshToken;
                                            localStorage.setItem('token' + '_' + Setting.xmid, userinfo.token)
                                            localStorage.setItem('refreshToken' + '_' + Setting.xmid, userinfo.refreshToken)
                                            localStorage.setItem('userinfo' + '_' + Setting.xmid, JSON.stringify(userinfo));

                                            // 设置 vuex 用户信息
                                            await store.dispatch('admin/user/set', userinfo, { root: true });
                                            // 加载用户登录信息
                                            await store.dispatch('admin/user/load', null, { root: true });
                                        }

                                        // 处理队列中的请求
                                        processQueue(null, res.token)

                                        // 重新发起因token过期而未能成功实现的请求
                                        if (env === 'development') {
                                            response.config.url = response.config.url.replace('/api', '')
                                        }
                                        return service.request(response.config)
                                    }
                                }).catch(err => {
                                    processQueue(err)
                                })
                            } else {
                                // 如果正在刷新token，则将请求加入队列等待
                                return new Promise((resolve, reject) => {
                                    failedQueue.push({ resolve, reject })
                                }).then(token => {
                                    // 重新发起因token过期而未能成功实现的请求
                                    if (env === 'development') {
                                        // 注意：这里需要重新构建完整的URL
                                        const config = { ...response.config }
                                        config.url = config.url.replace('/api', '')
                                        config.headers = { ...config.headers, Token: 'Inco-' + token }
                                        return service.request(config)
                                    } else {
                                        // 在生产环境中直接更新token
                                        response.config.headers.Token = 'Inco-' + token;
                                        return service.request(response.config)
                                    }
                                }).catch(err => {
                                    return Promise.reject(err)
                                })
                            }
                        }
                    }
                    break;
                case 404:
                    // code === 404 您访问页面不存在，请联系管理员
                    errorCreate('您访问页面不存在，请联系管理员');
                    break;
                case 408:
                    // code === 408 请求超时
                    errorCreate('请求超时');
                    break;
                case 500:
                    // code === 500 服务器错误，请联系管理员
                    errorCreate('服务器错误，请联系管理员');
                    break;
                default:
                    // 非固定 code
                    // errorCreate(`${dataAxios.msg}: ${response.config.url}`);
                    Spin.hide()
                    console.log('异常错误ID：' + content);
                    errorCreate(`${dataAxios.msg}`);
                    break;
            }
        }
    },
    error => {
        errorLog(error);
        return Promise.reject(error);
    }
);
export default service
