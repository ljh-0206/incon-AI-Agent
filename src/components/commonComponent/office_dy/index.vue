<template>
    <div :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <onlyoffice :propstocomponent="propstocomponent" v-model="show"></onlyoffice>
    </div>
</template>
<script>
    export default {
        components: {},
        props: {
            configdata: { type: Object, default: () => { return {} } },
            // DOM 容器传入，供组件销毁后从 body 中移除
            incoEl: { type: Object, required: true }
        },
        data () {
            return {
                dyDom: null,
                componentName: 'office_dyzj',
                propstocomponent: {
                    modalType: 'Drawer',
                    modalTitle: '文档编辑',
                    modalWidth: '100%',
                    fileType: '',
                    title: '',
                    wjid: '',
                    mode: ''
                },
                show: false,
                tempdata: {}
            }
        },
        watch: {

        },
        methods: {
            open (obj, dyDom) {
                this.propstocomponent = { ...this.propstocomponent, ...obj };
                this.show = true;
                this.dyDom = dyDom;
            },
            // 销毁组件 - Vue 3 兼容
            close () {
                if (this.dyDom) {
                    this.dyDom.unmount();
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
