<template>
    <div :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <Button v-if="env()" @click="test">jselect test</Button> <!--测试按钮-->
        <Select v-bind="$attrs" @on-change="handleChange" :value="value" @on-clear="handleClear">
            <template v-for="(item,index) in list">
                <!--此处option不要换行，不然在允许搜索时，会显示换行符-->
                <Option v-if="computeKyf(item)" :style="computeStyle(item)" :value="item.value"
                    v-bind="computeAttrs(item)" :key="item.value+'option'+index"><Icon v-if="item.icon" :type="item.icon"></Icon>{{item.label}}</Option>
            </template>
        </Select>
    </div>
</template>
<script>
    export default {
        name: 'jselect',
        props: {
            value: { type: [String, Number, Array, Boolean], default: '' },
            list: { type: [Array], default: () => [] },
            propstocomponent: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: () => ({}) },
            row: { type: Object, default: () => ({}) },
            index: { type: Number },
            fathername: { type: String }
        },
        data () {
            return {
                componentName: '',
                ref: this.$root.componentRefs
            }
        },
        methods: {
            /** * 根据系统配置信息组件里面配置的开发环境，如果时开发环境，则显示调试的test按钮 */
            env () {
                let returnValue = false
                const str = localStorage.getItem('incoenv')
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1)returnValue = true
                return returnValue
            },
            test () {
                console.log(this.list, 'print list from jselect.vue')
                console.log(this.configdata, 'print configdata from jselect.vue')
                console.log(this.propstocomponent, 'print propstocomponent from jselect.vue')
            },
            computeKyf (item) {
                if (item.kyf && item.kyf === '0') return false
                let returnValue = true;
                if (this.configdata.itemCondition) returnValue = this.commonsJs.funcEval1(this, item, this.configdata.itemCondition)
                if (item.condition) {
                    returnValue = this.commonsJs.funcEval1(this, item, item.condition)
                }
                return returnValue
            },
            computeAttrs (item) {
                let attrs = {}
                if (item.attrs) attrs = item.attrs
                if (this.configdata.itemAttrs) {
                    const funcEval = new Function('_this', 'obj', this.configdata.itemAttrs)
                    const attrs1 = funcEval(this, { ...item })
                    attrs = { ...attrs, ...attrs1 }
                }
                return attrs
            },
            computeStyle (item) {
                let newstyle = {}
                if (item.style) newstyle = { ...item.style }
                if (this.configdata.itemStyle) newstyle = { ...newstyle, ...this.commonsJs.funcEval1(this, item, this.configdata.itemStyle) }
                if (this.configdata.itemStyleMethod) newstyle = { ...newstyle, ...this.commonsJs.funcEval1(this, item, this.configdata.itemStyleMethod) }
                return newstyle
            },
            handleChange (value) {
                this.$emit('input', value)
                this.$emit('on-change', value)
            },
            handleClear () {
                this.$emit('on-clear')
            }
        },
        mounted () {
            if (this.configdata.createClass) this.commonsJs.loadCssCode(this.configdata.createClass)
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
