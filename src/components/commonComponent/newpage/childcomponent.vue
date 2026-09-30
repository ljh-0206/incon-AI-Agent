<template>
    <component v-if="computeKyf(configdata, row, itemindex,index)"
        :is="configdata.componentType"
        v-model="row[configdata.blm]"
        v-bind="computeAttrs(configdata, row, itemindex, index)"
        v-show="computeShow(configdata, row, itemindex, index)"
        :style="computeStyle(configdata, row, itemindex, index)"
        :class="computeClass()"
        :index="index"
        :itemindex="itemindex"
        :list="list[configdata.blm]"
        :fathername="fathername"
        :configdata="configdata"
        :propstocomponent="getChildProps(configdata)"
        @commonMethod="commitMethod"
        @update:visible="data[configdata.blm] = false"
        v-on="computeComponentEvent(configdata, row, itemindex, index)">
        <template v-if="configdata.xscontent != '0'">
            {{ configdata.dataSource === 'static' ? configdata.content : row[configdata.blm] }}
        </template>
        <template v-if="configdata.children && configdata.children.length > 0">
            <!-- 第一层布局 -->
            <template v-for="(child, childindex) in configdata.children">
                <template v-if="child.zjlb != 'multidata'">
                    <childcomponent
                        :key="child.blm + childindex"
                        :id="child.blm"
                        :ref="child.blm"
                        :data="data"
                        :row="row"
                        :configdata="child"
                        :index="index"
                        :itemindex="itemindex"
                        :list="list"
                        :propstocomponent="propstocomponent"
                        :propstochild = "propstochild"
                        :componentClass="componentClass"
                        :layoutConfig="layoutConfig"
                        :tempdata="tempdata"
                        :function="functions"
                        :styles="styles"
                        :attrs="attrs"
                        :vif="vif"
                        :vshow="vshow"
                        :fathername="fathername"
                        @commonMethod="commitMethod"
                        v-bind="computeAttrs(child, row, childindex, index)">
                    </childcomponent>
                </template>
                <template v-else>
                    <template v-for="(childdata, dataindex) in row[child.blm]" :key="child.blm + dataindex">
                        <childcomponent
                            :id="child.blm + dataindex"
                            :data="data"
                            :row="childdata"
                            :configdata="child"
                            :index="dataindex"
                            :itemindex="itemindex"
                            :list="list"
                            :propstocomponent="propstocomponent"
                            :propstochild = "propstochild"
                            :componentClass="componentClass"
                            :layoutConfig="layoutConfig"
                            :tempdata="tempdata"
                            :function="functions"
                            :styles="styles"
                            :attrs="attrs"
                            :vif="vif"
                            :vshow="vshow"
                            :fathername="fathername"
                            @commonMethod="commitMethod"
                            v-bind="computeAttrs(child, childdata, childindex, dataindex)">
                        </childcomponent>
                    </template>
                </template>
            </template>
        </template>
    </component>
</template>
<script>
    import Bus from '@/components/commonComponent/upload/js/bus' // 上传底层组件使用（勿删）
    import { mapState, mapActions, mapMutations } from 'vuex'
    import childcomponent from './childcomponent.vue'

    export default {
        name: 'childcomponent',
        components: { childcomponent },
        props: {
            configdata: { type: Object, default: () => ({}) },
            data: { type: Object, default: () => ({}) },
            row: { type: Object, default: () => ({}) },
            propstocomponent: { type: Object, default: () => ({}) },
            propstochild: { type: Object, default: () => ({}) },
            index: { type: Number, default: null },
            itemindex: { type: Number, default: null },
            fathername: { type: String },
            list: { type: Object, default: () => ({}) },
            componentClass: { type: Object, default: () => ({}) },
            layoutConfig: { type: Array, default: () => ([]) },
            tempdata: { type: Object, default: () => ({}) },
            function: { type: Object, default: () => ({}) },
            styles: { type: Object, default: () => ({}) },
            attrs: { type: Object, default: () => ({}) },
            vif: { type: Object, default: () => ({}) },
            vshow: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                Bus,
                ref: this.$root.componentRefs,
                openStatus: true
            };
        },
        methods: {
            ...mapActions('admin/account', ['login', 'usernameLogin', 'logout']),
            // 给propstochild 设置参数
            setPropsToComponent (str = '', obj = {}, replace = true) {
                let arr = []
                if (str) { arr = str.split(',') } else { arr = this.configArr }
                arr.forEach((res) => {
                    let propsObj = {}
                    if (!replace) propsObj = { ...this.propstochild[res], ...obj } // 保留了原来 路由传递过来的 参数
                    else propsObj = obj // 如果replace设置为true，将替代原来的已保存的变量
                    this.propstochild[res] = propsObj
                })
            },
            setProps (str = '', obj = {}, replace = true) {
                this.setPropsToComponent(str, obj, replace)
            },
            setprops (str = '', obj = {}, replace = true) {
                this.setPropsToComponent(str, obj, replace)
            },
            getProps (str = '') {
                if (str) return this.propstochild[str]
                else return this.propstochild
            },
            getprops (str) { this.getProps(str) },
            // 给所有的组件（除了布局layout组件）传递参数
            getChildProps (item) {
                let props = this.propstocomponent
                if (this.propstochild[item.blm]) props = { ...props, ...this.propstochild[item.blm] }
                return props
            },
            computeKyf (item, data = {}, itemindex, dataindex) {
                let returnValue = true
                const hasKey = item.blm in this.vif
                if (hasKey) returnValue = this.vif[item.blm]
                try {
                    if (item.condition) {
                        const funcEval = new Function('_this', 'obj', item.condition)
                        const obj = { item, data, row: data, itemindex, rowindex: dataindex }
                        returnValue = funcEval(this, obj)
                    }
                    if (item.kyf && item.kyf === '0') returnValue = false
                    return returnValue
                } catch (e) {
                    console.log('错误信息：', item.blm, item, e)
                }
                return returnValue
            },
            computeShow (item, data = {}, itemindex, dataindex) {
                let returnValue = true
                const hasKey = item.blm in this.vshow
                if (hasKey) returnValue = this.vshow[item.blm]
                return returnValue
            },
            /**
             *
             * @param {*} str 要设置的组件变量名的字符串，变量用‘，’隔开
             * @param {*} type ：vif和vshow，vif是对条件v-if设置，vshow是对组件的show属性设置
             * @param {*} setType ：false是只改变要设置的组件变量名，true是将其他组件设为相反值
             */
            async setAttrsConditionAndShow (str, type, booleanType, setType) {
                if (!str) return
                // 如果输入的字符串不为空
                const arr = str.split(',')
                let conditionAndShow = ''
                if (type === 'vshow') { conditionAndShow = 'vshow' }
                if (type === 'vif') { conditionAndShow = 'vif' }
                // 如setType选择为true，则将先将所有的设置为booleanType取反
                if (setType) {
                    const allComponent = Object.keys(this.config) || []
                    if (allComponent.length > 0) {
                        for (let i = 0; i < allComponent.length; i++) {
                            this[conditionAndShow][allComponent[i]] = !booleanType
                        }
                    }
                }
                for (let i = 0; i < arr.length; i++) {
                    this[conditionAndShow][arr[i]] = booleanType
                }
            },
            /**
             *
             * @param {*} str 为要
             * @param {*} booleanType
             * @param {*} setType
             */
            async setvif (str, booleanType = true, setType = false) {
                await this.setAttrsConditionAndShow(str, 'vif', booleanType, setType)
            },
            async setVif (str, booleanType = true, setType = false) {
                await this.setAttrsConditionAndShow(str, 'vif', booleanType, setType)
            },
            async setvshow (str, booleanType = true, setType = false) {
                await this.setAttrsConditionAndShow(str, 'vshow', booleanType, setType)
            },
            async setvShow (str, booleanType = true, setType = false) {
                await this.setAttrsConditionAndShow(str, 'vshow', booleanType, setType)
            },

            // 计算组件事件
            computeComponentEvent (item, data, itemindex, dataindex) {
                const newItem = item
                const eventObj = {}
                if (item.componentEvent && item.componentEvent.length > 0) {
                    item.componentEvent.forEach((res) => {
                        eventObj[res.name] = (value1, value2, value3, value4, value5, $event) => {
                            const event = $event
                            if (event && event.stopPropagation) event.stopPropagation()// 防止冒泡
                            const obj = { item: newItem, data: this.data, row: this.row, itemindex, rowindex: dataindex, event, value1, value2, value3, value4, value5 }
                            if (res.eventInside) {
                                const funcEval = new Function('_this', 'obj', res.eventInside)
                                funcEval(this, obj) // 执行内部方法
                            }
                            if (newItem.eventOutside) obj.method = res.eventOutside
                            this.$emit('commonMethod', obj) // 导出外部执行方法
                        }
                    })
                }
                return eventObj
            },
            // 计算组件的样式
            computeStyle (item, data = {}, itemindex, dataindex) {
                try {
                    let obj = {}
                    let newStyle = {}
                    if (item.styleMethod) {
                        const funcEval = new Function('_this', 'obj', item.styleMethod)
                        newStyle = funcEval(this, { item, row: data, data, itemindex, rowindex: dataindex })
                    }
                    obj = { ...this.styles[item.blm], ...newStyle }
                    return obj
                } catch (error) {
                    console.log(item, error, '页面计算组件的样式错误')
                }
            },
            // 计算组件的属性
            computeAttrs (item, data = {}, itemindex, dataindex) {
                let obj = {}
                let newAttrs = {}
                if (item.attrsMethod) {
                    try {
                        const funcEval = new Function('_this', 'obj', item.attrsMethod)
                        newAttrs = funcEval(this, { item, row: data, data, itemindex, rowindex: dataindex })
                    } catch (e) { console.log(e, item) }
                }
                obj = { ...this.attrs[item.blm], ...newAttrs }
                return obj
            },
            computeClass () {
                let classStr = this.configdata.blm
                if (this.componentClass[this.configdata.blm]) classStr = classStr + ' ' + this.componentClass[this.configdata.blm].trim()
                // 如果有classMethod方法，则执行该方法，返回执行该方法的class名
                if (this.configdata.classMethod) {
                    const newClass = this.commonsJs.funcEval1(this, { item: this.configdata, row: this.row }, this.configdata.classMethod)
                    if (newClass) {
                        classStr = newClass
                    }
                }
                return classStr
            },
            commitMethod (obj) {
                this.$emit('commonMethod', obj)
            },
            triggerFunction (blm, method, obj) {
                // console.log(blm,method,this.$root.componentRefs)
                this.$root.componentsParam[blm] = [{ blm, method, obj }]
            }
        },
        computed: {
            ...mapState('admin/user', ['info']),
            ...mapState('admin/layout', ['isMobile', 'logoutConfirm']),
            functions () {
                return this.function
            }
        },
        watch: {},
        mounted () {

        },
        created () {
            // 注册组件
            if (this.configdata.registComponent) this.commonsJs.funcEval1(this, {}, this.configdata.registComponent)
        },
        updated () { },
        beforeDestroy () { }

    };
</script>
<style>
</style>
