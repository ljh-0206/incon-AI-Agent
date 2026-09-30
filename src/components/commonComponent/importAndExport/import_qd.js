/**
 * 这个是一个赢科通用的调用组件（主要应用在调用一个modal弹出的组件)
 * Vue 3 版本
 */
import { createApp, h } from 'vue';
import importqd from './importqd.vue';
import store from '@/store/index';

const import_qd = (obj, _this) => {
    const el = document.createElement('div');
    const app = createApp({
        render () {
            return h(importqd, {
                onTriggerUpload: () => {
                    // Handle trigger upload event
                }
            });
        }
    });
    app.use(store);
    const dyDom = app.mount(el);
    document.body.appendChild(el);

    dyDom.fatherName = obj.fatherName;
    dyDom.propstocomponent = obj.params;
    const configdata = { ...obj };
    delete configdata.fatherName;
    delete configdata.params;
    dyDom.dyref = _this.$root.componentRefs;
    dyDom.configdata = configdata;
    dyDom.triggerUpload();
}
export default import_qd;
