<template>
    <div :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <Switch @on-change="handleChange" :model-value="data" v-bind="$attrs" true-value="1" false-value="0">
            <span v-for="(item) in list" :key="'switch'+_uid+item.value"
                :slot="item.value=='0' ? 'close' : 'open'">{{item[labelName]}}</span>
        </Switch>
    </div>
</template>
<script>
    export default {
        name: 'jswitch',
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
            labelName: { type: String, default: 'label' },
            row: { type: Object, default: () => ({}) },
            index: { type: Number },
            fathername: { type: String }
        },
        data () {
            return {
                componentName: '',
                data: this.value
            }
        },
        methods: {
            handleChange (value) {
                this.$emit('input', value)
                this.$emit('on-change', value)
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
        watch: {
            value: {
                handler (n, o) {
                    if (n) this.data = n;
                    else this.data = '0';
                },
                immediate: true
            },
            configdata: {
                handler (n, o) {
                    if (n.blm) { this.componentName = n.blm }
                },
                deep: true,
                immediate: true
            }
        },
        mounted () {
            if (this.configdata.createClass) this.loadCssCode(this.configdata.createClass)
        }

    }
</script>
