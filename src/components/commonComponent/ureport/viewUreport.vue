<template>
    <div v-if="propsStr" v-loading="loading" :style="'height:'+ height" style="padding-top: 5px;"
        :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <iframe :src="src+'?'+propsStr" frameborder="no" style="width: 100%;height: 100%" scrolling="auto" />
    </div>
</template>
<script>
    export default {
        name: 'viewureport',
        props: {
            params: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: function () { return {}; } }
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
                Object.keys(this.params).map(key => {
                    str = str + key + '=' + this.params[key] + '&'
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
