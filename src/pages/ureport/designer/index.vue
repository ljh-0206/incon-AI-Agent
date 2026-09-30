<template>
    <div v-loading="loading" :style="'height:'+ height" style="padding-top: 5px;">
        <iframe :src="src" frameborder="no" style="width: 100%;height: 100%" scrolling="auto"/>
    </div>
</template>
<script>
    export default {
        name: 'ureport-designer',
        data () {
            return {
                src: '/ureport/designer',
                height: document.documentElement.clientHeight - 134 + 'px;',
                loading: true
            };
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
