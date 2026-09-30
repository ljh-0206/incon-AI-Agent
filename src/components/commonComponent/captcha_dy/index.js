/**
 * 这个是行为验证码的调用组件
 * Vue 3 版本
 */
import { createApp } from 'vue';
import captcha_dyzj from './index.vue';
import { useSharedApp } from '@/plugins/shared/sharedApp';

const captcha_dy = () => {
    return new Promise((resolve, reject) => {
        const el = document.createElement('div');
        document.body.appendChild(el);
        let captchaApp = null;

        const cleanup = () => {
            if (captchaApp) {
                try {
                    captchaApp.unmount();
                } catch (e) {
                    console.error('Unmount error:', e);
                }
                captchaApp = null;
            }
            if (el && el.parentNode) {
                try {
                    el.parentNode.removeChild(el);
                } catch (e) {
                    // 忽略移除错误
                }
            }
        };

        try {
            captchaApp = createApp(captcha_dyzj);
            useSharedApp(captchaApp);
            const vm = captchaApp.mount(el);

            // 调用组件的初始化方法
            if (vm && vm.initCaptcha) {
                vm.initCaptcha(vm)
                    .then((result) => {
                        resolve(result);
                        setTimeout(cleanup, 100);
                    })
                    .catch((error) => {
                        reject(error);
                        setTimeout(cleanup, 100);
                    });
            } else {
                reject(new Error('验证码组件初始化失败'));
                cleanup();
            }
        } catch (e) {
            console.error('Captcha error:', e);
            reject(e);
            cleanup();
        }
    });
}

export default captcha_dy;
