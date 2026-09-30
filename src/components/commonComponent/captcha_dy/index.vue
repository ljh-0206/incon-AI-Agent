<template>
  <div id="captcha-mask" v-if="visible">
    <div id="captcha-div"></div>
  </div>
</template>
<script>
    import './tac/load.min'
    // load.min.js 会加载 tac.min.js
    import Setting from '@/setting';

    export default {
        name: 'CaptchaDy',
        data () {
            return {
                visible: true,
                captchaInstance: null
            }
        },
        methods: {
            initCaptcha (vm) {
                return new Promise((resolve, reject) => {
                    const apiBaseURL = Setting.apiBaseURL;
                    const captchaType = Setting.captchaType || 'SLIDER';

                    const captchaConfig = {
                        // 请求验证码接口
                        requestCaptchaDataUrl: apiBaseURL + '/sys/captcha?type=' + captchaType,
                        // 验证验证码接口
                        validCaptchaUrl: apiBaseURL + '/sys/checkCaptcha',
                        // 绑定的div
                        bindEl: '#captcha-div',
                        // 验证成功回调函数
                        validSuccess: (res, c, t) => {
                            // 先销毁验证码实例
                            if (t) t.destroyWindow();
                            // 返回验证码（让 index.js 中的 cleanup 处理 DOM 清理）
                            resolve(res.data.code);
                        },
                        btnCloseFun: (el, t) => {
                            // 先销毁验证码实例
                            if (t) t.destroyWindow();
                            reject(new Error('用户取消验证'));
                        }
                    }

                    // 样式
                    const style = {
                        // 按钮样式
                        btnUrl: '/tac/images/movetrack.png',
                        // logo地址
                        logoUrl: null,
                        // 滑动边框样式
                        moveTrackMaskBgColor: '#f7b645',
                        moveTrackMaskBorderColor: '#ef9c0d'
                    }

                    try {
                        // 使用 window.initTAC 方法
                        window.initTAC('/tac', captchaConfig, style).then(tac => {
                            this.captchaInstance = tac;
                            tac.init();
                        }).catch(err => {
                            console.error('initTAC error:', err);
                            reject(err);
                        });
                    } catch (e) {
                        console.error('Captcha init error:', e);
                        reject(e);
                    }
                });
            }
        },
        computed: {},
        mounted () {
        },
        unmounted () {
            // 组件卸载时销毁验证码实例
            if (this.captchaInstance) {
                try {
                    this.captchaInstance.destroyWindow();
                } catch (e) {
                    // 忽略销毁错误
                }
            }
        }
    }
</script>
<style>
  #captcha-mask {
    display: flex;
    z-index: 9999;
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.53);
    justify-content: center;
    padding-top: 150px;
  }
</style>
