<template>
    <div v-if="propsStr" v-loading="loading" :style="'height:'+ height" style="padding-top: 5px;">
        <iframe :src="src+'?'+propsStr" frameborder="no" style="width: 100%;height: 100%" scrolling="auto"/>
    </div>
</template>
<script>
    export default {
        name: 'ureport-preview',
        props: {
            routerProps: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                src: '/ureport/preview',
                height: document.documentElement.clientHeight - 134 + 'px;',
                loading: true
            };
        },
        computed: {
            propsStr () {
                let str = '';
                Object.keys(this.routerProps).map(key => {
                    str = str + key + '=' + this.routerProps[key] + '&'
                })
                return str;
            }
        },
        mounted: function () {
            setTimeout(() => {
                this.loading = false;
            }, 230);
            const that = this;
            window.onresize = function temp () {
                that.height = document.documentElement.clientHeight - 134 + 'px;';
            };
        }
    };
</script>
