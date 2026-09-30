/**
 * 这是一个预览文件的调用组件
 * 调用的组件名称为：viewfile
 * Vue 3 版本
 */
import { createApp } from 'vue';
import office_dyzj from './index.vue';
import { useSharedApp } from '@/plugins/shared/sharedApp';

const office_dy = (obj) => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const app = createApp(office_dyzj, {
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
export default office_dy;
