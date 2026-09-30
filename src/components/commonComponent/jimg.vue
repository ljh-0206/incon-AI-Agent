<template>
    <img :src="src" :class="'style-' + configdata.blm + ' ' + configdata.blm">
</template>
<script>
    export default {
        name: 'jimg',
        props: {
            configdata: {
                type: Object, default: () => ({})
            },
            value: {
                type: String,
                default: ''
            },
            item: {
                type: Object,
                default: () => ({})
            }
        },
        data () {
            return {
                componentName: '',
                fileUrl: this.commonsJs.fileUrl
            }
        },
        computed: {
            src () {
                return this.configdata.sourcetype == 'base64' ? this.value : this.fileUrl + this.value
            }
        },
        methods: {
            handleClick (value) {},
            /**
             *
             * @param {*} code 是创建的class的代码
             */
            loadCssCode (code) {
                if (document.getElementById('style-' + this.componentName)) document.getElementById('style-' + this.componentName).remove()
                if (!document.getElementById('style-' + this.componentName)) {
                    const style = document.createElement('style');
                    style.type = 'text/css';
                    //   style.lang='less'
                    style.rel = 'stylesheet';
                    style.id = 'style-' + this.componentName
                    // for Chrome Firefox Opera Safari
                    style.appendChild(document.createTextNode(code));
                    // for IE
                    // style.styleSheet.cssText = code;
                    const head = document.getElementsByTagName('head')[0];
                    head.appendChild(style);
                }
            }
        },
        mounted () {
            if (this.configdata.createClass) this.loadCssCode(this.configdata.createClass)
        },
        watch: {
            configdata: {
                handler (n, o) {
                    if (n.blm) { this.componentName = n.blm }
                },
                deep: true,
                immediate: true
            }
        }

    }
</script>
