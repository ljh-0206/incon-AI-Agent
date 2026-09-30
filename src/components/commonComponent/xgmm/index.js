/**
 * 这是一个修改密码的调用组件
 * Vue 3 版本
 */
import { createApp } from 'vue';
import xgmm_zj from './index.vue';
import { useSharedApp } from '@/plugins/shared/sharedApp';

const xgmm_dy = (obj) => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const app = createApp(xgmm_zj, {
        // DOM 容器传入，供组件销毁后从 body 中移除
        incoEl: el
    });
    // 一行注入所有全局属性
    useSharedApp(app);
    const dyDom = app.mount(el);
    if (obj) {
        dyDom.open(obj, app);
    }
};
export default xgmm_dy;
