<template>
    <Checkbox-Group @on-change="handleChange" v-model="checkBoxData" v-bind="$attrs"
        :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <template v-for="(item,index) in list">
            <Checkbox v-if="computeKyf(item)" :style="computeStyle(item)" :label="item[valueName]"
                :key="'chekbox'+_uid+item.value" v-bind="computeAttrs(item)">
                <div :style="configdata.style" style="display:inline-block">
                    <Icon v-if="item.icon" :type="item.icon"></Icon>
                    <span>{{item[labelName]}}</span>
                </div>
            </Checkbox>
        </template>

    </Checkbox-Group>
</template>
<script>
    export default {
        name: 'jcheckbox',
        props: {
            value: {
                type: Array,
                default: () => []
            },

            list: {
                type: Array,
                default: () => []
            },
            valueName: { type: String, default: 'value' },
            labelName: { type: String, default: 'label' },
            transfer: true,
            configdata: { type: Object, default: () => ({}) },
            row: { type: Object, default: () => ({}) },
            index: { type: Number },
            fathername: { type: String }
        },
        data () {
            return {
                componentName: '',
                ref: this.$root.componentRefs,
                checkBoxData: []

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
                this.$emit('input', this.checkBoxData)
                this.$emit('on-change', this.checkBoxData)
            },
            /**
             * 计算组件渲染条件
             * @param {*} item
             */
            computeKyf (item) {
                if (item.kyf && item.kyf === '0') return false
                let returnValue = true;
                if (this.configdata.itemCondition) returnValue = this.commonsJs.funcEval1(this, {}, this.configdata.itemCondition)
                if (item.condition) {
                    returnValue = this.commonsJs.funcEval1(this, {}, item.condition)
                }
                return returnValue
            },
            computeAttrs (item) {
                let attrs = {}
                if (item.attrs) attrs = { ...item.attrs }
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
        watch: {
            value: {
                deep: true,
                immediate: true,
                handler: function (val) {
                    if (this.configdata.createClass) this.loadCssCode(this.configdata.createClass)
                    const oldValue = JSON.stringify(this.value)
                    const newValue = JSON.stringify(this.checkBoxData)
                    if (oldValue !== newValue) { this.checkBoxData = JSON.parse(JSON.stringify(this.value)) }
                }
            },
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
