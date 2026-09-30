<template>
    <div style="width:100%" :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <!-- <Button  @click="test">自定义组件-{{ configdata.blm }}</Button> -->
        <component v-if="dynamicComponent" :is="dynamicComponent"></component>
    </div>
</template>
<script>
    import { mapState, mapGetters } from 'vuex'
    export default {
        name: 'vuefile',
        components: {},
        props: {
            index: { type: Number, default: null },
            value: {
                type: [String, Boolean, Array],
                default: () => []
            },
            setdata: { type: Object, default: () => ({}) },
            childmethodparams: { type: Object, default: () => ({}) },
            configdata: {
                type: Object,
                default: () => ({})
            },
            propstocomponent: {
                type: Object,
                default: () => ({})
            }
        },
        data () {
            return {
                componentName: '',
                ref: this.$root.componentRefs,
                data: {},
                itemIndex: -1,
                tempdata: {}
            }
        },
        methods: {
            test () {
                console.log(this.propstocomponent, 'propstocomponent from jlist')
                console.log(this.configdata, 'configdata from jlist')
                console.log(this.data, 'data from jlist')
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
            /**
             * 计算组件渲染条件
             * @param {*} item
             */
            computeKyf (item) {
                let returnValue = true;
                if (item.condition) {
                    const funcEval = new Function('_this', 'obj', item.condition)
                    returnValue = funcEval(this, item)
                }
                if (item.kyf && item.kyf === '0') returnValue = false
                return returnValue
            },
            computeAttrs () {
                let attrs = {}
                if (this.configdata.attrsMethod) {
                    const funcEval = new Function('_this', 'obj', this.configdata.attrsMethod)
                    attrs = funcEval(this, { value: this.value, data: this.data }) // 执行内部方法
                }
                return attrs
            }

        },
        computed: {
            ...mapState('admin/user', ['info']),
            dynamicComponent () {
                if (this.configdata && this.configdata.yyid) {
                    return () => import(`@/pages/${this.configdata.yyid}`)
                } else { return null }
            }
        },
        watch: {
            componentName: {
                handler (n, o) { if (n) { this.$root.componentRefs[this.componentName] = this } }, deep: true, immediate: true
            },
            configdata: {
                handler () {
                    this.componentName = this.configdata.blm + (this.index ? this.index : '')
                    if (this.configdata.createClass) this.loadCssCode(this.configdata.createClass)
                },
                deep: true,
                immediate: true
            }

        },
        mounted () {},
        created () {},

        beforeDestroy () {
            delete this.$root.componentRefs[this.componentName]
            if (this.configdata.createClass && this.configdata.createClass.trim()) document.getElementById('style-' + this.componentName).remove()
        }
    }
</script>
<style >
</style>
