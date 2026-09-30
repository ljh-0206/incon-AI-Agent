/**
 * 全局进度条插件
 * Vue 3 版本
 */
import { createApp, ref, h } from 'vue';
import progress_dy from './index.vue';

const ProgressPlugin = {
    install (app) {
        let progressInstance = null;
        let progressEl = null;
        const componentRef = ref(null);

        const initProgress = () => {
            if (!progressInstance) {
                progressEl = document.createElement('div');
                const progressApp = createApp({
                    render () {
                        return h(progress_dy, {
                            ref: componentRef
                        });
                    }
                });
                progressInstance = progressApp.mount(progressEl);
                document.body.appendChild(progressEl);
            }
            return componentRef.value;
        };

        app.config.globalProperties.$progress = {
            show () {
                const instance = initProgress();
                if (instance) instance.start();
            },

            set (percent) {
                const instance = initProgress();
                if (instance) instance.update(percent);
            },

            hide () {
                if (componentRef.value) {
                    componentRef.value.hide();
                }
            }
        };
    }
};

export default ProgressPlugin;
