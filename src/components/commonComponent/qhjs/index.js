/**
 * 这个是一个切换的调用组件
 * Vue 3 版本
 */
import { createApp } from 'vue';
import qhjs_zj from './index.vue';
import { useSharedApp } from '@/plugins/shared/sharedApp';

const qhjs_dy = (obj) => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const app = createApp(qhjs_zj, {
        // DOM 容器传入，供组件销毁后从 body 中移除
        incoEl: el
    });
    // 一行注入所有全局属性
    useSharedApp(app);
    const dyDom = app.mount(el);
    dyDom.open(obj, app);
};
export default qhjs_dy;
