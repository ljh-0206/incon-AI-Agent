<template>
    <div style="width:100%" :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <Button v-if="env()" @click="test">list 按钮</Button>
        <div>
            <b v-if="data && data.length==0" style="color: lightgray;padding-left: 10px;">请选择</b>
            <div style="display:flex">
                <p v-if="configdata.title" style="flex:1" class="titleClass">
                    <Icon :type="configdata.titleIconName" :style="configdata.titleIconStyle" />
                    <b :style="configdata.titleStyle">{{configdata.title}}</b>
                </p>
                <template v-for="(titleBtnItem,titleBtnIndex) in configdata.titleButtons">
                  <a href="#"
                      v-if="computeKyf(titleBtnItem)" @click.prevent="titlebuttonclick(titleBtnItem)"
                      :key="'a'+titleBtnItem.blm+titleBtnIndex">
                      <Icon v-if="titleBtnItem.icon" :type="titleBtnItem.icon" :style="titleBtnItem.iconStyle" />
                      <b v-if="titleBtnItem.content" :style="titleBtnItem.contentStyle">{{titleBtnItem.content}}</b>
                  </a>
                </template>
            </div>
            <draggable v-model="data" v-bind="computeAttrs()" filter=".scandiv" chosenClass="chosen"
                forceFallback="true" animation="1000" @start="onStart" @end="onEnd" item-key="id">
                <template #item="{element,index}">
                    <div style="display:inline-block"
                        :class="index===itemIndex ? 'itemActive' :''" class="cellClass">
                        <div :style="computeItemStyle(element,data[index],index)">
                            <div style="display:inline-block;min-width: 70px;text-align: center;"
                                @click.stop="itemClick(element,index)">
                                <template v-for="(e,i) in configdata.showItemArr">
                                    <template v-if="handleCondition(element,e)">
                                        <span :key="e.zdm+'_'+i"></span>
                                        <span v-if="e.pre">{{e.pre}}</span>
                                        <span :style="computeItemContentStyle(e,i,data[index])">{{element[e.zdm]}}</span>
                                    </template>
                                </template>
                            </div>
                            <div class="scandiv" style="display:inline-block"
                                v-if="opentype!=='show'||propstocomponent.showDeleteButton==='1'">
                                <template v-if="configdata && configdata.itemButtons">
                                    <a v-if="computeBtnCondition(bItem,bIndex)" slot="header"
                                        v-for="(bItem,bIndex) in configdata.itemButtons" href="#"
                                        :key="'c'+bItem.blm+bIndex" @click="itembuttonclick(element,index,bItem)"
                                        class="btnClass">
                                        <Icon v-if="bItem.icon" :type="bItem.icon" size="20" :style="bItem.iconStyle" />
                                        <span v-if="bItem.content" :style="bItem.contentStyle">{{bItem.content}}</span>
                                    </a>
                                </template>
                            </div>
                        </div>
                    </div>
                </template>
            </draggable>

        </div>
    </div>
</template>
<script>
    import { mapState, mapGetters } from 'vuex'
    import draggable from 'vuedraggable'
    export default {
        name: 'jlist',
        components: { draggable },
        props: {
            index: { type: Number, default: null },
            value: {
                type: [String, Boolean, Array],
                default: () => []
            },
            opentype: { type: String, default: 'show' },
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
                selectedList: [],
                data: [],
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
                if (item) {
                    if (item.condition) {
                        const funcEval = new Function('_this', 'obj', item.condition)
                        returnValue = funcEval(this, item)
                    }
                    if (item.kyf && item.kyf === '0') returnValue = false
                }
                return returnValue
            },
            computeAttrs () {
                let attrs = {}
                // 兼容数组格式和对象格式的attrs
                const baseAttrs = this.configdata.attrs || {}
                if (Array.isArray(baseAttrs) && baseAttrs.length > 0) {
                    baseAttrs.forEach((attrItem) => {
                        if (attrItem.key && attrItem.key.trim() && attrItem.label !== undefined) {
                            if (attrItem.valueType === 'number') attrs[attrItem.key.trim()] = Number(attrItem.label)
                            else if (attrItem.valueType === 'boolean') attrs[attrItem.key.trim()] = attrItem.label === 'true' || attrItem.label === '1'
                            else attrs[attrItem.key.trim()] = attrItem.label
                        }
                    })
                } else if (baseAttrs && typeof baseAttrs === 'object') {
                    attrs = { ...baseAttrs }
                }
                if (this.configdata.attrsMethod) {
                    const funcEval = new Function('_this', 'obj', this.configdata.attrsMethod)
                    const methodAttrs = funcEval(this, { value: this.value, data: this.data }) // 执行内部方法
                    attrs = { ...attrs, ...methodAttrs }
                }
                return attrs
            },
            computeItemStyle (item, row, index) {
                let newstyle = { 'background-color': '#fab005' }
                // 兼容数组格式和对象格式的style
                if (item.style && Array.isArray(item.style) && item.style.length > 0) {
                    item.style.forEach((styleItem) => {
                        if (styleItem.key && styleItem.key.trim() && styleItem.label !== undefined) {
                            if (styleItem.valueType === 'number') newstyle[styleItem.key.trim()] = Number(styleItem.label)
                            else newstyle[styleItem.key.trim()] = styleItem.label
                        }
                    })
                } else if (item.style && typeof item.style === 'object') {
                    newstyle = { ...item.style }
                }
                if (this.configdata.itemStyleMethod) {
                    const funcEval = new Function('_this', 'obj', this.configdata.itemStyleMethod)
                    const styleEnv = funcEval(this, { row, index, item }) // 执行内部方法
                    newstyle = { ...newstyle, ...styleEnv }
                }
                return newstyle
            },
            computeItemContentStyle (item, index, row) {
                let newstyle = {}
                if (item.styleMethod && item.styleMethod.trim()) {
                    const funcEval = new Function('_this', 'obj', item.styleMethod)
                    newstyle = funcEval(this, { row, index, item }) // 执行内部方法
                }
                return newstyle
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
             * @param {*} code 是创建的class的代码
             */
            loadCssCode (code) {
                if (document.getElementById('style-' + this.componentName)) document.getElementById('style-' + this.componentName).remove()
                if (!document.getElementById('style-' + this.componentName)) {
                    const style = document.createElement('style');
                    style.type = 'text/css';
                    //   style.lang='less'
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
            /**
             *
             * @param {*} str 为要
             * @param {*} booleanType
             * @param {*} setType
             */
            async setvif (str, booleanType = true, setType = false) {
                await this.setAttrsConditionAndShow(str, 'vif', booleanType, setType)
            },
            async setvshow (str, booleanType = true, setType = false) {
                await this.setAttrsConditionAndShow(str, 'vshow', booleanType, setType)
            },
            getProps (str = '') {
                if (str) return this.propstocomponent[str]
                else return this.propstocomponent
            },
            reset () {
                this.data = []
                this.itemIndex = -1,
                this.selectedList = []
            },
            handleCondition (row, item) {
                const returnValue = true
                if (item && item.condition) this.commonsJs.funcEval(this, { row, item }, item.condition)
                return returnValue
            },
            itembuttonclick (item, index, bItem) {
                console.log('item', item)
                this.itemIndex = index
                const obj = { listName: this.configdata.blm, index, row: this.data[index], item: bItem, blm: bItem.blm }
                if (bItem.click) obj.method = bItem.click
                if (bItem.blm === 'itemDelete' || bItem.blm === 'delete') {
                    this.itemDelete(item, index, obj)
                } else {
                    this.$emit('commonMethod', obj)
                }
            },
            itemClick (item, index) {
                this.itemIndex = index
                const obj = { row: item, index, listName: this.configdata.name, method: this.configdata.itemClick, configdata: this.configdata }
                if (this.configdata.itemClick) {
                    obj.method = this.configdata.itemClick
                    this.$emit('commonMethod', obj)
                }
            },

            titlebuttonclick (item) {
                const obj = { listName: this.configdata.blm, item, data: this.data }
                if (item.click) {
                    obj.method = item.click
                    this.$emit('commonMethod', obj)
                }
            },
            handleOnchange (data) {
                this.$emit('input', this.selectedList)
            },
            queryListData (obj = {}, name) {
                if (this.configdata.funcId && this.configdata.funcId.queryId) {
                    this.commonsJs.incoRequest('querylist', this.configdata.funcId.queryId, { ...this.propstocomponent, ...obj }).then((res) => {
                        if (this.configdata.afterQuery && this.configdata.afterQuery.trim()) {
                            const data = this.commonsJs.funcEval1(this, { data: res, param: obj }, this.configdata.afterQuery)
                            this.data = data
                        } else {
                            this.data = res
                        }
                    })
                } else {
                    if (obj.list && obj.list.length > 0) {
                        const arr = []
                        obj.list.forEach((item) => {
                            const dataItem = {}
                            dataItem[this.configdata.primaryKey] = item
                            arr.push(dataItem)
                        })
                        this.data = arr
                    }
                }
            },
            query (obj = {}) {
                this.queryListData(obj)
            },
            itemDelete (row, index, obj) {
                this.$Modal.confirm({
                    title: '删除提醒：',
                    content: '您确定要删除此条记录吗？?',
                    onOk: () => {
                        if (this.configdata.funcId && this.configdata.funcId.deleteId) {
                            this.commonsJs.incoRequest('delete', this.configdata.funcId.deleteId, row.id).then((res) => {
                                if (this.configdata.afterDelete) this.commonsJs.funcEval(this, { row, index }, this.configdata.afterDelete)
                                this.queryListData()
                            })
                        } else {
                            this.data.splice(index, 1)
                            if (this.configdata.afterDelete) this.commonsJs.funcEval(this, { row, index }, this.configdata.afterDelete)
                        }
                        this.$emit('commonMethod', obj)
                    },
                    onCancel: () => {
                        this.$Message.info('取消删除');
                    }
                });
            },
            computeBtnCondition (item, index) {
                let returnValue = true
                if (item && item.condition && item.condition.length > 0) {
                    // console.log(item.blm,item.condition,'computeBtnCondition from jlist.vue')
                    const funcEval = new Function('_this', 'obj', item.condition)
                    returnValue = funcEval(this, item)
                }
                return returnValue
            },
            onStart () { this.drag = true; },
            // 拖拽结束事件
            onEnd () {
                this.drag = false;
            }
        },
        computed: {
            ...mapState('admin/user', ['info'])
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
            },
            childmethodparams: {
                handler (n, o) {
                    if (n && n.methodName) { this.$nextTick(() => { this.$emit('excutefunc', n) }) }
                },
                deep: true,
                immediate: true
            },
            selectedList: {
                handler () { this.$emit('input', this.selectedList) },
                deep: true
            },
            data: {
                handler () {
                    this.$emit('input', this.data)
                    this.$emit('listdatachange', { list: this.data, name: this.configdata.name })
                },
                deep: true
            },
            setdata: {
                handler (n) {
                    if (this.setdata.id) this.data = this.setdata.data
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
<style scoped>

.cardClass{
    height:100%;
    overflow-x: hidden;
    overflow-y: auto;
}

.cardClass .ivu-card-body{
    height:calc(100% - 50px);

}
.cellClass  {
    display: flex;
    justify-content:space-between;
    align-items: center;
    height:26px;
    line-height:26px;
    font-size:16px;
    margin:3px;
}
.titleClass  {
    height:32px ;
    padding-left:10px;
    padding-right:5px;
    font-size:16px;
}
.cellClass:hover {
    background:#ddd9d9;
    cursor:pointer
}
.itemActive {
    background:#f5baba
}
.btnClass {
    margin-left:5px
}
.btnClass:hover {
    color:green;
}
.item {
    padding: 6px;
    background-color: #fdfdfd;
    border: solid 1px #eee;
    margin-bottom: 10px;
    cursor: move;
}
    .item:hover {
        background-color: #f5baba;
        cursor: move;
    }
/*选中样式*/
.chosen {
    border: solid 1px #3089dc !important;
}
</style>
