<template>
    <div>
        <RadioGroup @on-change="handleChange" :model-value="value" v-bind="$attrs"
            :class="'style-' + configdata.blm + ' ' + configdata.blm">
            <template v-for="(item) in list">
                <Radio v-if="computeKyf(item)" :style="computeStyle(item)" :label="item[valueName]"
                    :key="'radio'+_uid+item.value" v-bind="computeAttrs(item)">
                    <Icon v-if="item.icon" :type="item.icon"></Icon><span>{{item[labelName]}}</span>
                </Radio>
            </template>

        </RadioGroup>
    </div>
</template>
<script>
    export default {
        name: 'jradio',
        props: {
            value: {
                type: [String, Number, Array, Boolean],
                default: ''
            },
            configdata: { type: Object, default: () => ({}) },

            list: {
                type: [Array],
                default: () => []
            },
            valueName: { type: String, default: 'value' },
            labelName: { type: String, default: 'label' },
            row: { type: Object, default: () => ({}) },
            index: { type: Number },
            fathername: { type: String }
        },
        data () {
            return {
                componentName: '',
                ref: this.$root.componentRefs,
                data: this.value

            }
        },
        methods: {
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
            },
            handleChange (value) {
                this.$emit('input', value)
                this.$emit('on-change', value)
            },
            computeKyf (item) {
                let returnValue = true;
                if (item) {
                    if (item.kyf && item.kyf === '0') return false
                    if (this.configdata.itemCondition) returnValue = this.commonsJs.funcEval1(this, {}, this.configdata.itemCondition)
                    if (item.condition) {
                        returnValue = this.commonsJs.funcEval1(this, {}, item.condition)
                    }
                }
                return returnValue
            },
            computeAttrs (item) {
                let attrs = {}
                if (item.attrs) attrs = { attrs, ...item.attrs }
                if (this.configdata.itemAttrs) {
                    const funcEval = new Function('_this', 'obj', this.configdata.itemAttrs)
                    attrs = { ...attrs, ...funcEval(this, attrs) }
                }
                return attrs
            },
            computeStyle (item) {
                let newstyle = {}
                if (item.style) newstyle = { ...item.style }
                if (this.configdata.itemStyle) newstyle = { ...newstyle, ...this.commonsJs.funcEval1(this, item, this.configdata.itemStyle) }
                if (this.configdata.itemStyleMethod) newstyle = { ...newstyle, ...this.commonsJs.funcEval1(this, item, this.configdata.itemStyleMethod) }
                return newstyle
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
