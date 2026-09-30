<template>
    <div id="app">
        <!-- 门户首页的 keep-alive 已随门户壳迁入 PortalShell（/portal 父路由内的 router-view 缓存：
             仅白名单 PortalV3Home），App 层不再缓存任何路由 -->
        <router-view />
    </div>
</template>
<script>
    import { on, off } from 'view-ui-plus/src/utils/dom';
    import { Input } from 'view-ui-plus';
    import { setMatchMedia } from 'view-ui-plus/src/utils/assist';
    import { mapState, mapMutations } from 'vuex';
    import * as commonsJs from '@/api/common';
    // 配置
    import Setting from './setting';
    import { baseUrl, casUrl } from './setting';
    // 工具
    import util from '@/libs/util';
    import menuHeader from '@/menu/header';
    import menuSider from '@/menu/sider';
    import routerList from '@/router/routes';
    import {
        getHeaderName,
        getMenuSider,
        getSiderSubmenu
    } from '@/libs/system';

    setMatchMedia();

    export default {
        name: 'app',
        data () {
            return {
                baseUrl,
                casUrl,
                sysConfig: Setting,
                componentsParam: {},
                componentRefs: {},
                function: {}, // 通用function
                functionMethods: {}, // 通用function方法
                components: {}, // 组件列表
                tempdata: {},
                list: {},
                cssnr_ht: '',
                cssnr_qt: '',
                aiParam: {
                    aiInputArea: false,
                    operationArea: false
                },
                activeModal: []
            }
        },
        computed: {
            ...mapState('admin/user', ['info']),
            ref () {
                return this.componentRefs
            }
        },
        methods: {
            ...mapMutations('admin/layout', [
                'setDevice'
            ]),
            handleWindowResize () {
                this.handleMatchMedia();
            },
            handleMatchMedia () {
                const matchMedia = window.matchMedia;
                if (matchMedia('(max-width: 600px)').matches) {
                    this.setDevice('Mobile');
                } else if (matchMedia('(max-width: 992px)').matches) {
                    this.setDevice('Tablet');
                } else {
                    this.setDevice('Desktop');
                }
            },
            // 调试模式快捷键：Ctrl+Alt+Shift+F1 → 开启；Ctrl+Alt+Shift+F2 → 关闭
            handleKeyDown (event) {
                const isF1 = event.key === 'F1' || event.keyCode === 112;
                const isF2 = event.key === 'F2' || event.keyCode === 113;
                if (event.ctrlKey && event.altKey && event.shiftKey && (isF1 || isF2)) {
                    event.preventDefault();
                    this.confirmDebugToggle(isF1 ? 1 : 0);
                }
            },
            confirmDebugToggle (targetEnv) {
                let pwd = '';
                this.$Modal.confirm({
                    title: '调试模式',
                    render: (h) => h(Input, {
                        type: 'password',
                        placeholder: '请输入确认密码',
                        'onUpdate:modelValue': (val) => { pwd = val; }
                    }),
                    onOk: () => {
                        if (pwd === '3.1415926') {
                            localStorage.setItem('incoenv', JSON.stringify({ env: targetEnv }));
                            location.reload();
                        } else {
                            this.$Message.error('密码错误');
                        }
                    }
                });
            },
            triggerFunction (blm, method, obj) {
                this.$set(this.componentsParam, blm, [{ blm, method, obj }])
            },
            // 对比系统版本
            compareVersion () {
                const compareVersion = Setting.compareVersion;
                commonsJs.incoRequest('/inco/ht/queryCompareVersion', '', {}).then(res => {
                    if (res != compareVersion) {
                        this.$Message.info('前后端版本不一致，请尽快检查升级！');
                    }
                })
            },
            // 获取通用代码表数据
            getDmbList (dmbsjList) {
                const dmbList = commonsJs.listToTree(dmbsjList)
                let dmbName = ''
                let list = []
                while (dmbList.length > 0) {
                    if (!dmbName) dmbName = dmbList[0].bm
                    if (dmbList[0].bm === dmbName) {
                        list.push(dmbList[0])
                        dmbList.splice(0, 1)
                    } else {
                        if (dmbName) this.$set(this.list, dmbName, list)
                        dmbName = ''
                        list = []
                        dmbName = dmbList[0].bm
                    }
                }
                if (dmbName) this.$set(this.list, dmbName, list)
            },
            // websocket同步配置
            getWebsocketTbpz () {
                if (Setting.sycConfigEnabled) {
                    commonsJs.websocket.dispatch('WEBSOCKET_INIT', Setting.apiBaseURL + '/my-websocket')

                    let ind = 0;
                    const timeer = setInterval(() => {
                        ind++;
                        if (ind == 50) clearInterval(timeer);
                        if (commonsJs.websocket.state.stompClient && commonsJs.websocket.state.stompClient.connected) {
                            this.getWebsocketMessage();
                            clearInterval(timeer);
                        }
                    }, 500)
                }
            },
            // 获取websocket消息
            getWebsocketMessage () {
                if (commonsJs.websocket.state.stompClient) {
                    // 处理数据（同步配置）
                    commonsJs.websocket.dispatch('WEBSOCKET_SUBSRCIBE', {
                        topic: '/topic/tbpz',
                        callbackFun: (msg) => {
                            const data = commonsJs.decrypt_aes(msg); // 解密后的接收数据
                            const obj = JSON.parse(data);
                            const ref = this.componentRefs
                            hadleHtComponent(ref, obj, obj.lx)
                        }
                    });
                    // 接收推送消息
                    commonsJs.websocket.dispatch('WEBSOCKET_SUBSRCIBE', {
                        topic: '/topic/pttx',
                        callbackFun: (msg) => {
                            if (msg) {
                                msg = commonsJs.decrypt_aes(msg)
                                this.$Modal.warning({
                                    title: '提醒',
                                    width: '780',
                                    content: msg
                                });
                            }
                        }
                    });
                }
                function hadleHtComponent (ref, obj, lx) {
                    if (!ref[obj.blm]) return
                    const fathername = ref[obj.blm].fathername
                    if (fathername) {
                        if (lx === 'jform' || lx === 'collection') {
                            obj.modal = true
                            obj.opentype = 'edit'
                        } else if (lx === 'incocomponent' || lx === 'newpage' || lx === 'renderpage') obj.zjpzxx = JSON.stringify(obj)
                        if (ref[fathername] && ref[fathername].config[obj.blm]) {
                            ref[fathername].config[obj.blm] = { ...obj }
                        }
                    } else {
                        if (lx === 'incocomponent' || lx === 'newpage' || lx === 'renderpage') {
                            delete obj.zjsjxx
                            obj.zjpzxx = JSON.stringify(obj)
                            ref[obj.blm].getConfig(obj, obj.blm)
                        }
                    }
                }
            }
        },
        async created () {
            // 查询其他信息
            const queryRes = await commonsJs.multiquery([
                { sqlid: '17213516114722ec9ea424f779644ed596f5f2a63533fd222', blm: 'dmbList', type: 'querylist', param: { xmid: Setting.xmid } }, // 代码表数据
                { sqlid: '16892208593112327881417b97b6eab35bc4791d641a57', blm: 'cssnr_ht', type: 'queryone', param: { lx: 'ht' } }, // 后台主题样式
                { sqlid: '16892208593112327881417b97b6eab35bc4791d641a57', blm: 'cssnr_qt', type: 'queryone', param: { lx: 'qt' } }, // 前端主题样式
                { sqlid: 'get_tyfuncion', blm: 'tyfflist', type: 'querylist', param: { xmid: Setting.xmid } }// 通用function
            ]);
            this.cssnr_ht = queryRes.cssnr_ht ? queryRes.cssnr_ht.cssnr : ''
            this.cssnr_qt = queryRes.cssnr_qt ? queryRes.cssnr_qt.cssnr : ''
            // 创建通用function
            if (queryRes.tyfflist && queryRes.tyfflist.length > 0) {
                const _this = this
                queryRes.tyfflist.forEach((item) => {
                    this.functionMethods[item.ffm] = item.fft
                    try {
                        const func = eval(item.fft)
                        this.$set(this.function, item.ffm, func)
                    } catch { console.log('创建通用方法时发生错误：createFunction', item.ffm) }
                })
            }
            // 对比前后端系统版本
            this.compareVersion();
            // 获取通用代码表数据
            this.getDmbList(queryRes.dmbList);
            // websocket同步配置
            this.getWebsocketTbpz();

            // 设置系统标题
            util.title({
                title: this.$route.meta.title
            })

            // 处理路由 得到每一级的路由设置
            this.$store.commit('admin/page/init', routerList[0].children);

            // 设置顶栏菜单
            this.$store.commit('admin/menu/setHeader', menuHeader);
            // 加载用户登录的数据
            this.$store.dispatch('admin/account/load');
            // 初始化全屏监听
            this.$store.dispatch('admin/layout/listenFullscreen')
            // 调试模式快捷键监听（迁移自 3.0 main.js）
            document.addEventListener('keydown', this.handleKeyDown);
        },
        mounted () {
            on(window, 'resize', this.handleWindowResize);
            this.handleMatchMedia();
        },
        watch: {
            // 监听路由 控制侧边栏显示 标记当前顶栏菜单（如需要）
            '$route' (to, from) {
                let path = to.matched[to.matched.length - 1].path;
                if (!Setting.dynamicSiderMenu) {
                    let headerName = getHeaderName(path, menuSider);
                    if (headerName === null) {
                        path = to.path;
                        headerName = getHeaderName(path, menuSider);
                    }
                    // 在 404 时，是没有 headerName 的
                    if (headerName !== null) {
                        this.$store.commit('admin/menu/setHeaderName', headerName);
                        this.$store.commit('admin/menu/setMenuSider', menuSider);
                        const filterMenuSider = getMenuSider(menuSider, headerName);
                        this.$store.commit('admin/menu/setSider', filterMenuSider);
                        this.$store.commit('admin/menu/setActivePath', to.path);

                        const openNames = getSiderSubmenu(path, menuSider);
                        this.$store.commit('admin/menu/setOpenNames', openNames);
                    }
                }
                this.appRouteChange(to, from);
            }
        },
        beforeUnmount () {
            off(window, 'resize', this.handleWindowResize);
            document.removeEventListener('keydown', this.handleKeyDown);
        }
    }
</script>
