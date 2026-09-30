<!-- 此组件是为table的slot中添加一个有label的组件 -->
<template>
    <span @click="click" v-if="computeKyf()">
        <Button @click="test">test</Button>
        <span :style="computeLabelStyle()">{{ configdata.mc }}: </span>
        <span :style="computeValueStyle()">{{ data.value }}</span>
    </span>
</template>
<script>
    export default {
        name: 'columnitem',
        components: {},
        props: {
            // value:{type:[Array,String],default:()=>[]},
            fathername: { type: String, default: '' },
            value: { type: String, default: '' },
            configdata: { type: Object, default: () => ({}) },
            propstocomponent: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                componentName: '', // 当前组件的名称，即configdata.blm
                ref: this.$root.componentRefs,
                data: { value: '' },
                tempdata: {}
            }
        },
        methods: {
            test () {
                console.log(this.value, 'this.value')
                console.log(this.configdata, 'this.configdata')
                console.log(this.data, 'this.data')
            },
            computeLabelStyle () {
                let style = {}
                if (this.configdata.labelMethod) {
                    style = this.commonsJs.funcEval1(this, {}, this.configdata.labelMethod)
                }
                return style
            },
            computeValueStyle () {
                let style = {}
                if (this.configdata.valueMethod) {
                    style = this.commonsJs.funcEval1(this, {}, this.configdata.valueMethod)
                }
                return style
            },
            computeKyf () {
                const item = this.configdata;
                let flag = true;
                if (item.vifCondition == '0') flag = false
                if (item.condition) {
                    try {
                        const funcEval = new Function('_this', 'obj', item.condition)
                        flag = funcEval(this, item)
                    } catch { console.log('在jtable中的computeKyf方法中报错了：', item.blm, item) }
                }
                if (item.kyf === '0') flag = false
                return flag
            },
            click () {
                if (this.configdata.clickInside) this.commonsJs.funcEval1(this, { item: this.configdata, value: this.value }, this.configdata.clickInside)
            }
        },
        computed: {},
        watch: {
            value: {
                handler (n, o) {
                    let val = n
                    if (this.configdata.valueChangeMethod) val = this.commonsJs.funcEval1(this, { item: this.configdata, value: n }, this.configdata.valueChangeMethod)
                    this.data.value = val
                },
                deep: true,
                immediate: true

            }
        },
        mounted () { },
        updated () {},
        beforeUnmount () {}

    }
</script>
