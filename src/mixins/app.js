/**
 * 通用混合
 * Vue 3 兼容版本
 */
import { getCurrentInstance } from 'vue';

export default {
    computed: {
        // Vue 3 兼容：提供 uid 替代 Vue 2 的 _uid
        _uid () {
            const instance = getCurrentInstance();
            return instance ? instance.uid : 0;
        },
        // Vue 3 兼容：$listeners 已移除，所有监听器都在 $attrs 中
        $listeners () {
            // 返回空对象，避免报错
            // 在 Vue 3 中，监听器已经自动继承，不需要手动传递
            return {};
        }
    },
    methods: {
        // 在 $route 更新时触发
        appRouteChange (to, from) {

        }
    }
}
