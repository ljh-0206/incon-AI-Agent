<script>
    import { mapState, mapGetters, mapActions } from 'vuex'
    export default {
        name: 'commonsrow',
        props: {
            value: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: () => ({}) },
            propstocomponent: { type: Object, default: () => ({}) },
            index: { type: Number, default: null },
            fathername: { type: String }
        },
        data () {
            return {
                self: this,
                ref: this.$root.componentRefs,
                componentName: '',
                zjConfigdata: {},
                propstochild: {},
                list: {},
                tempdata: {}
            }
        },
        render (h) {
            const arr = []
            const configdata = this.zjConfigdata
            if (configdata.fields && configdata.fields.length > 0) {
                for (let index = 0; index < configdata.fields.length; index++) {
                    const item = configdata.fields[index]
                    if (!item) continue
                    const componentConfig = this.getComponentConfig(h, item, this.value, index, this.propstocomponent)
                    if (componentConfig) arr.push(componentConfig)
                }
            }
            return h('div', {
                attrs: { id: configdata.blm, ...this.commonsJs.computeAttrs(this, {}, configdata.attrs, configdata.attrsMethod) },
                style: this.commonsJs.computeStyle(this, {}, configdata.style, configdata.styleMethod),
                class: `main_box style-${configdata.blm} ${configdata.blm}`
            }, arr)
        },
        methods: {
            getComponentConfig (h, item, itemdata, itemindex, fprops) {
                if (!item) return null
                const flag = this.commonsJs.computeKyf(this, itemdata, item.condition)
                if (!flag) return null
                let fatherprops = fprops
                const computeAttrs = this.commonsJs.computeAttrs(this, itemdata, item.attrs, item.attrsMethod) || {}
                const children = []
                const on = {
                    input: (event) => { if (event) { itemdata[item.blm] = event } }
                }
                if (item.componentType == 'Drawer' || item.componentType == 'Modal') {
                    on['on-visible-change'] = (open) => { if (!open) { itemdata[item.blm] = false; } }
                }
                if (item.methods && Object.keys(item.methods).length > 0) {
                    for (const key in item.methods) {
                        if (item.methods[key]) {
                            const methodName = item.methods[key];
                            on[key] = (event) => {
                                event.stopPropagation();
                                const param = { item, row: itemdata, itemindex, event }
                                if (item[methodName]) this.commonsJs.funcEval1(this, param, item[methodName])
                                else this.$emit(methodName, param)
                            }
                        }
                    }
                }
                if (item && (item.content || itemdata[item.blm])) children.push(item.content || itemdata[item.blm])
                const attrs = {
                    id: item.blm + itemindex,
                    blm: item.blm,
                    ...computeAttrs,
                    index: itemindex,
                    itemindex,
                    configdata: item,
                    row: itemdata,
                    value: itemdata[item.blm],
                    list: this.list[item.blm],
                    fathername: this.fathername,
                    propstocomponent: { ...this.propstocomponent }
                }
                if (this.propstochild[item.blm]) {
                    Object.assign(attrs.propstocomponent, this.propstochild[item.blm])
                }

                // 针对有scopedslot的组件，需要传递row和index（如在table中给jselect传递row和index）
                if (fprops) {
                    attrs.row = itemdata
                    attrs.index = itemindex
                }
                const style = this.commonsJs.computeStyle(this, item.data, item.style, item.styleMethod)
                // if (this.componentClass[item.blm]) newClass = newClass + ' ' + this.componentClass[item.blm]
                if (item.classMethod) newClass = newClass + ' ' + this.commonsJs.funcEval1(this, { item, itemdata, itemindex, dtaindex }, item.classMethod)
                // if (this.vshow[item.blm]) style.display = 'none'
                const paramObj = {
                    class: item.blm,
                    attrs,
                    style,
                    // domProps: { value: itemdata[item.blm] },
                    on,
                    directives: [],
                    slot: attrs.slot,
                    key: this.commonsJs.sys_guid(),
                    ref: item.blm
                }
                if (attrs.slot && attrs.scopedSlots) {
                    const scopedSlots = {}
                    scopedSlots[attrs.slot] = (props) => {
                        const itemChildren = []
                        fatherprops = { ...props }
                        if (item.children && item.children.length > 0) {
                            item.children.forEach((child, childindex) => {
                                const childConfig = this.getComponentConfig(h, child, itemdata, itemindex, fatherprops)
                                if (childConfig) itemChildren.push(childConfig)
                            })
                        }
                        return h('span', {}, itemChildren)
                    }
                    paramObj.scopedSlots = scopedSlots
                } else {
                    if (item.children && item.children.length > 0) {
                        item.children.forEach((child, childindex) => {
                            const flag = this.commonsJs.computeKyf(this, itemdata, item.condition)
                            if (flag) {
                                const childConfig = this.getComponentConfig(h, child, itemdata, itemindex, fatherprops)
                                if (childConfig) children.push(childConfig)
                            }
                        })
                    }
                }
                return h(item.componentType, paramObj, children)
            }
        },
        mounted () { },
        watch: {
            configdata: {
                handler (n, o) {
                    if (n && n.blm) {
                        this.componentName = n.blm
                        this.$root.componentRefs[this.componentName] = this
                        this.zjConfigdata = JSON.parse(JSON.stringify(n))
                        if (n.createClass) this.commonsJs.loadCssCode(n.createClass, n.blm)
                    }
                },
                deep: true,
                immediate: true
            }
        },
        computed: {
            ...mapState('admin/user', ['info'])
        },
        beforeUnmount () {
            const configdata = this.zjConfigdata
            if (this.$root.componentRefs[this.componentName]) delete this.$root.componentRefs[this.componentName]
            if (configdata.createClass && configdata.createClass.trim()) this.commonsJs.removeCssCode(configdata.blm)
        }

    }
</script>
