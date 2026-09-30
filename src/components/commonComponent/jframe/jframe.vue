<template>
    <div :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <Button v-if="env()" @click="test" style="display:block">jframe111</Button>
        <iframe :id="configdata.blm + '_iframe'" :src="configdata.src" :frameborder="configdata.frameborder"
            :scrolling="configdata.scrolling" :style="computedStyle()"></iframe>
    </div>
</template>
<script>

    import { mapState, mapGetters } from 'vuex'
    let _this;
    export default {
        name: 'jframe',
        components: {},
        props: {
            configdata: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                componentName: ''
            }
        },
        methods: {
            test () {
                console.log(this.configdata, 'configdata in jframe')
            },
            /**
             * 根据系统配置信息组件里面配置的开发环境，如果时开发环境，则显示调试的test按钮
             */
            env () {
                let returnValue = false
                const str = localStorage.getItem('incoenv')
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1)returnValue = true
                return returnValue
            },
            // 此方法用来处理组件属性的方法
            computeKyf (item) {
                let returnValue = true;
                if (item.condition) {
                    try {
                        const funcEval = new Function('_this', 'obj', item.condition)
                        returnValue = funcEval(this, item)
                    } catch { console.log('错误：jframe的computeKyf方法中报错了：', item.blm, item) }
                }
                if (item.kyf === '0') returnValue = false
                return returnValue
            },
            computedStyle () {
                let style = { width: '100%', height: '100%', position: 'relative', padding: '10px' };
                if (this.configdata.style) {
                    style = { ...style, ...this.configdata.style }
                }
                return style;
            },
            /**
             *
             * @param {*} code 是创建的class的代码
             */
            loadCssCode (code) {
                if (!document.getElementById('style-' + this.componentName)) {
                    const style = document.createElement('style');
                    style.type = 'text/css';
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
        created () { _this = this },
        mounted () {},
        beforeDestory () {
            delete this.$root.componentRefs[this.componentName]
        },
        computed: {
            ...mapState('admin/user', ['info'])
        },
        watch: {
            configdata: {
                handler (n, o) {
                    if (n.blm) {
                        this.componentName = n.blm
                        if (this.configdata.createClass) this.loadCssCode(this.configdata.createClass)
                    }
                },
                deep: true,
                immediate: true
            }
        }
    }
</script>
<style lang="less">

</style>
