/**
 * WebSocket Store - Vue 3 版本
 */
import { createStore } from 'vuex';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export default createStore({
    state: {
        url: '',
        websocket: null,
        stompClient: null,
        listenerList: [], // 监听器列表，断线重连时 用于重新注册监听
        ljcs: 0
    },
    getters: {
        stompClient (state) {
            return function () {
                return state.stompClient;
            }
        }
    },
    mutations: {
        // 初始化
        WEBSOCKET_INIT (state, url) {
            if (state.stompClient == null || !state.stompClient.connected) {
                state.url = url
                if (state.stompClient != null && state.websocket.readyState === SockJS.OPEN) {
                    state.stompClient.disconnect(() => {
                        this.commit('WEBSOCKET_CONNECT')
                    })
                } else if (state.stompClient != null && state.websocket.readyState === SockJS.CONNECTING) {
                    // console.log("连接正在建立")

                } else {
                    this.commit('WEBSOCKET_CONNECT')
                }
            } else {
                // console.log("连接已建立成功，不再执行")
            }
        },
        // 连接
        WEBSOCKET_CONNECT (state) {
            const _this = this
            const websock = new SockJS(state.url);
            state.websocket = websock
            // 获取STOMP子协议的客户端对象
            const stompClient = Stomp.over(websock);
            stompClient.debug = null // 关闭控制台打印
            stompClient.heartbeat.outgoing = 20000;
            stompClient.heartbeat.incoming = 0;// 客户端不从服务端接收心跳包
            // 向服务器发起websocket连接
            stompClient.connect(
                { name: 'test' }, // 此处注意更换自己的用户名，最好以参数形式带入
                frame => {
                    // console.log('链接成功！')
                    state.listenerList.forEach(item => {
                        state.stompClient.subscribe(item.topic, item.callback)
                    })
                },
                err => { // 第一次连接失败和连接后断开连接都会调用这个函数 此处调用重连
                    state.ljcs = state.ljcs + 1;
                    if (state.ljcs < 50) {
                        setTimeout(() => {
                            _this.commit('WEBSOCKET_CONNECT')
                        }, 2000)
                    }
                }
            );
            state.stompClient = stompClient
        },
        // 向订阅发送消息
        WEBSOCKET_SEND (state, p) {
            state.stompClient.send(p.topic, {}, p.data);
        },
        // 订阅
        WEBSOCKET_SUBSRCIBE (state, p) {
            let sfcz = false;
            for (let i = 0; i < state.listenerList.length; i++) {
                if (state.listenerList[i].topic == p.topic) {
                    sfcz = true;
                    break;
                }
            }
            if (!sfcz) {
                state.stompClient.subscribe(p.topic, msg => { p.callbackFun(msg.body) }, { id: p.topic });
                state.listenerList.push({ topic: p.topic, callback: p.callbackFun })
            }
        },
        // 取消订阅
        WEBSOCKET_UNSUBSRCIBE (p) {
            state.stompClient.unsubscribe(p.topic)
            for (let i = 0; i < state.listenerList.length; i++) {
                if (state.listenerList[i].topic == p.topic) {
                    state.listenerList.splice(i, 1);
                    break;
                }
            }
        },
        // 取消所有订阅
        WEBSOCKET_UNSUBSRCIBEALL (state) {
            for (let i = 0; i < state.listenerList.length; i++) {
                state.stompClient.unsubscribe(state.listenerList[i].topic);
                state.listenerList.splice(i, 1);
            }
        }
    },
    actions: {
        WEBSOCKET_INIT ({ commit }, url) {
            commit('WEBSOCKET_INIT', url)
        },
        WEBSOCKET_SEND ({ commit }, p) {
            commit('WEBSOCKET_SEND', p)
        },
        WEBSOCKET_SUBSRCIBE ({ commit }, p) {
            commit('WEBSOCKET_SUBSRCIBE', p)
        },
        WEBSOCKET_UNSUBSRCIBE ({ commit }, topic) {
            commit('WEBSOCKET_UNSUBSRCIBE', topic)
        },
        WEBSOCKET_UNSUBSRCIBEALL ({ commit }) {
            commit('WEBSOCKET_UNSUBSRCIBEALL')
        }
    }
})
