<template>
    <div>
        <viewfile :propstocomponent="propstocomponent" :configdata="configdata" v-model="show" @on-close="close"
            :class="'style-' + configdata.blm + ' ' + configdata.blm"></viewfile>
    </div>
</template>
<script>
    export default {
        components: {},
        props: {
            // DOM 容器传入，供组件销毁后从 body 中移除
            incoEl: { type: Object, required: true }
        },
        data () {
            return {
                dyDom: null,
                componentName: 'viewfile_dyzj',
                propstocomponent: {
                    // wjlx默认为wjid（通用上传自动去获取文件信息）；不为wjid时，需传文件类型中的一种（image、video、audio、pdf）
                    wjlx: 'wjid',
                    // wjlx不为wjid时，这里需传文件的url
                    wjid: '',
                    modalType: 'Drawer',
                    modalTitle: '预览文件',
                    modalWidth: '1000px',
                    // 不同文件预览时自己类型的configdata，如jvideo的configdata
                    configdata: {}
                },
                configdata: {},
                show: false,
                tempdata: {}
            }
        },
        watch: {

        },
        methods: {
            view (obj, dyDom) {
                this.dyDom = dyDom
                this.propstocomponent = { ...this.propstocomponent, ...obj }
                this.$nextTick(() => {
                    this.show = true
                })
            },
            close () {
                this.show = false;
                // 销毁组件 - Vue 3 兼容
                if (this.dyDom) {
                    // 1. unmount Vue 实例
                    this.dyDom.unmount();
                    // 2. 从 body 中移除 DOM 容器
                    if (this.incoEl && this.incoEl.parentNode) {
                        this.incoEl.parentNode.removeChild(this.incoEl);
                    }
                    this.dyDom = null;
                }
            }
        },
        computed: {},
        mounted () {

        }
    }
</script>
