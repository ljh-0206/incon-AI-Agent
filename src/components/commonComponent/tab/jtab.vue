<template>
<div style="width:100%" :style="configdata.mainStyle" :class="'style-' + configdata.blm + ' ' + configdata.blm">
    <Button v-if="env()" @click="test">tabClick</Button>
    <Tabs :model-value="value" @on-click="handleClick" v-bind="configdata.attrs" :style="configdata.style">
        <template v-for="(item,index) in configdata.fields">
            <tab-pane v-if="vif[item.blm] && computeKyf(item)" v-bind="item.attrs" :style="item.style"
                :label="item.label||item.mc" :name="item.blm" :key="'tabs'+item.blm+index+_uid"></tab-pane>
        </template>
        <template v-if="configdata.slot && configdata.slot.length>0" #extra>
            <template v-for="(item) in configdata.slot">
                <component :is="item.componentType" :id="item.blm" :ref="item.blm" :key="item.blm + _uid + index"
                    v-if="vif[item.blm] && computeKyf(item)" v-bind="computeItemAttrs(item)"
                    v-model="data[item.blm]" :style="computeItemStyle(item)" @click="handleSlotClick(item, $event)"
                    @on-blur="handleBlur(item, $event)" @on-change="handleChange(item, $event)"
                    @keypress.native="handleKeypress(item, $event)">
                    {{ item.content }}
                </component>
            </template>
        </template>
    </Tabs>
</div>
</template>
<script>
    import { mapState } from 'vuex';

    export default {
        name: 'jtab',
        components: {},
        props: {
            index: { type: Number, default: null },
            propstocomponent: {
                type: Object,
                default: () => ({})
            },
            configdata: { type: Object, default: function () { return {} } },
            value: { type: String, default: '' },
            fathername: { type: String, default: '' }

        },
        data () {
            return {
                componentName: '', // 当前组件的名称，即configdata.blm
                ref: this.$root.componentRefs,
                data: {},
                vif: {},
                vshow: {},
                tempdata: {}
            }
        },
        methods: {
            test () {
                console.log(this.value, 'value')
                console.log(this.configdata, 'configdata')
                console.log(this.data, 'data')
                console.log(this.propstocomponent, 'propstocomponent')
                console.log(this.vif, 'vif')
                console.log(this.vshow, 'vshow')
                console.log(this.commonsJs, 'this.commonsJs')
                console.log(this.tabpineList, 'tabpinlist')
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
            computeItemStyle (item) {
                let newstyle = {}
                if (item.style) newstyle = { ...item.style }
                if (item.styleMethod) {
                    const funcEval = new Function('_this', 'obj', item.styleMethod)
                    const styleEnv = funcEval(this, {}) // 执行内部方法
                    newstyle = { ...newstyle, ...styleEnv }
                }
                return newstyle
            },
            computeItemAttrs (item) {
                let attrs = {}
                if (item.attrs) attrs = { ...item.attrs }
                if (item.attrsMethod) {
                    const funcEval = new Function('_this', 'obj', item.attrsMethod)
                    const attrsEnv = funcEval(this, {}) // 执行内部方法
                    attrs = { ...attrs, ...attrsEnv }
                }
                return attrs
            },
            getProps (str = '') {
                if (str) return this.propstocomponent[str]
                else return this.propstocomponent
            },
            computeKyf (item) {
                let returnValue = true;
                if (item) {
                    if (item.condition) {
                        const funcEval = new Function('_this', 'obj', item.condition)
                        returnValue = funcEval(this, item)
                    }
                    if (item.kyf && item.kyf === '0') returnValue = false
                }

                return returnValue
            },
            handleClick (name) {
                // 如果在tab中配置了click，则执行click；将不执行子组件中的click方法
                if (this.configdata.click && this.configdata.click.trim()) {
                    this.$emit('commonMethod', { method: this.configdata.click, blm: name, name, value: name })
                    return
                }
                // 如果在tab中没有配置click方法，而在子组件中配置了click方法，则执行子组件的click方法
                this.ref[this.fathername].data[this.componentName] = name
                this.$emit('input', name)
                let item = {}
                this.configdata.fields.forEach((res) => { if (res.blm === name) item = res })
                const obj = { tabpanName: this.configdata.blm, item, blm: name, value: name }
                if (item.onClick || item.click) {
                    obj.method = item.onClick || item.click
                    this.$emit('commonMethod', obj)
                }
            },
            handleSlotClick (item, value) {
                if (item.clickInside) this.commonsJs.funcEval1(this, {}, item.clickInside)
                if (item.click) this.$emit('commonMethod', { ...item, method: item.click })
            },
            handleBlur (item, value) {
                if (item.blurInside) this.commonsJs.funcEval1(this, {}, item.blurInside)
                if (item.blur) this.$emit('commonMethod', { ...item, method: item.blur })
            },
            handleKeypress (item, event) {
                if (item.keypressInside) this.commonsJs.funcEval1(this, { event }, item.keypressInside)
                if (item.keypress) this.$emit('commonMethod', { ...item, method: item.keypress, event })
            },
            handleChange (item, value) {
                if (item.changeInside) this.commonsJs.funcEval1(this, {}, item.changeInside)
                if (item.change) this.$emit('commonMethod', { ...item, method: item.change, value })
            }
        },
        watch: {
            configdata: {
                handler () {
                    if (this.configdata.blm) {
                        this.componentName = this.configdata.blm + (this.index ? this.index : '')
                        if (!this.$root.componentRefs) { this.$root.componentRefs = {} }
                        this.$root.componentRefs[this.componentName] = this
                        if (this.configdata.createClass) this.commonsJs.loadCssCode(this.configdata.createClass, this.componentName)
                        if (this.configdata.fields && this.configdata.fields.length > 0) {
                            this.configdata.fields.forEach((item) => {
                                if (item.vifCondition === '0') { this.vif[item.blm] = false } else { this.vif[item.blm] = true }
                                // 如果配置配置了组件初始化显示，则配置组件初始化显示的值，不配置缺省为true
                                if (item.isShow && item.isShow === '0') this.vshow[item.blm] = false
                                else { this.vshow[item.blm] = true }
                            })
                        }
                        if (this.configdata.slot && this.configdata.slot.length > 0) {
                            this.configdata.slot.forEach((item) => {
                                if (item.componentType == 'i-input') {
                                    this.data[item.blm] = null
                                }
                                if (item.vifCondition === '0') { this.vif[item.blm] = false } else { this.vif[item.blm] = true }
                                // 如果配置配置了组件初始化显示，则配置组件初始化显示的值，不配置缺省为true
                                if (item.isShow && item.isShow === '0') this.vshow[item.blm] = false
                                else { this.vshow[item.blm] = true }
                            })
                        }
                        if (this.configdata.default) { this.ref[this.fathername].data[this.componentName] = this.configdata.default }
                        // else {this.$set(this.ref[this.fathername].data,this.componentName,this.configdata.fields[0].blm)}
                    }
                },
                deep: true,
                immediate: true
            },
            'configdata.default': {
                handler () {
                    this.$emit('input', this.configdata.default)
                },
                deep: true,
                immediate: true
            }

        },
        computed: {
            ...mapState('admin/user', ['info']),
            tabpineList () {
                const arr = []
                if (this.configdata.fields && this.configdata.fields.length > 0) {
                    this.configdata.fields.forEach(item => {
                        if (item.componentType === 'tab-pane') arr.push(item)
                    })
                }
                return arr
            }
        },
        mounted () {
            if (this.configdata.mountedMethod) this.commonsJs.funcEval1(this, {}, this.configdata.mountedMethod)
        },
        updated () {
            // 监测根的传递参数的变化，如果变化了，看是否有本组件的数据，如果有本组件的数据，调用处理
            if (this.$root.componentsParam[this.componentName]) this.handleRootFunction(myComponentsParam)
        },
        beforeUnmount () {
            if (this.$options.components) {
                for (const key in this.$options.components) {
                    delete this.$options.components[key]
                }
            }
            delete this.$root.componentRefs[this.componentName]
            this.commonsJs.removeCssCode(this.componentName)
        }
    }
</script>
