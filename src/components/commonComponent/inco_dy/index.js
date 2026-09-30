/**
 * 这是一个赢科通用的调用组件（主要应用在调用一个modal弹出的组件）
 * 调用的组件名称为：inco_dy
 * Vue 3 版本
 */
import { createApp } from 'vue';
import inco_dyzj from './index.vue';
import { useSharedApp } from '@/plugins/shared/sharedApp';

const inco_dy = (obj) => {
    if (obj.yyid) {
        const el = document.createElement('div');
        document.body.appendChild(el);
        const app = createApp(inco_dyzj, {
            // 通过 props 传入，Vue 3 不允许直接给 prop 赋值
            propstody: obj,
            // DOM 容器传入，供组件销毁后从 body 中移除
            incoEl: el
        });
        // 一行注入所有全局属性
        useSharedApp(app);
        // app 实例通过 window 中转，供子组件销毁时 unmount 使用
        const dyDom = app.mount(el);
        // 调用
        dyDom.getConfig(obj, app);
    }
};

export default inco_dy;
