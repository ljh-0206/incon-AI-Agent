<template>
<div style="display:flex;" :class="'style-' + configdata.blm + ' ' + configdata.blm">
    <Button v-if="env()" @click="test">测试选择组件1</Button>
    <div :style="{width:opentype!=='show'?'calc(100% - 140px)':'100%',border:'1px lightgray solid'}"
        v-show="configdata.hidejlist!=='1'">
        <jlist :configdata="configdata.jlist" ref="jlist" :fathername="componentName" :formname="fathername"
            :propstocomponent="propsToList" :opentype="opentype" @listdatachange="listDataChange"></jlist>
    </div>
    <div style="width: 140px" v-if="computeEdit()">
        <Button type="primary" style="margin-left: 10px;width:130px"
            @click="openSelectModal">{{configdata.searchName ? configdata.searchName :'选择'}}</Button>
    </div>
    <Modal v-model="modal" :title="configdata.title ? configdata.title :'选择'" :closable="false"
        :mask-closable="false"
        :width="configdata.modalAttrs && configdata.modalAttrs.width ? configdata.modalAttrs.width: '800px'"
        v-bind="configdata.modalAttrs" @on-visible-change="onOpen" @on-ok="handleOk"
        class-name="vertical-center-modal1">
        <jlist v-if="configdata && configdata.showList==='1'" ref="jlist_modal" :configdata="configdata.jlist"
            :fathername="componentName" :formname="fathername" :propstocomponent="propsToList" :opentype="opentype"
            @commonMethod="modal_jlistitembuttonclick"></jlist>
        <tableform v-if="modal" ref="tableform" :fathername="componentName" :configdata="configdata.tableform"
            :propstocomponent="propstocomponent" />
        <jtable v-if="modal" ref="jtable" :fathername="componentName" :configdata="configdata.jtable"
            :propstocomponent="tablePropsToComponent" @selectDataChange="selectDataChange" />
    </Modal>
</div>
</template>
<script>

    export default {
        name: 'commonmultiselect',
        components: {},
        props: {
            modelValue: { type: String, default: '' },
            fathername: { type: String, default: '' },
            opentype: { type: String, default: 'show' },
            propstocomponent: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                ref: this.$root.componentRefs,
                tablePropsToComponent: {},
                componentName: '',
                data: {},
                modal: false,
                selectData: [],
                selectedList: {},
                propsToList: { editable: this.opentype, ...this.propstocomponent },
                tempdata: {}
            }
        },

        methods: {
            test () {
                console.log(this.modelValue, 'value')
                console.log(this.configdata, 'configdata')
                console.log(this.propstocomponent, 'propstocomponent')
                console.log(this.propsToList, 'propsToList')
                console.log(this.selectData, 'selectData')
            },
            env () {
                let returnValue = false
                const str = localStorage.getItem('incoenv')
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1) returnValue = true
                return returnValue
            },
            computeEdit () {
                let returnValue = true;
                if (this.configdata.editable == '0') returnValue = false
                if (this.propstocomponent.readonly) returnValue = false
                if (this.opentype == 'show') returnValue = false
                return returnValue
            },
            onOpen (open) {
                if (open) {
                    this.$nextTick(() => {
                        this.tablePropsToComponent = { ...this.propstocomponent, ...this.tableform, list: this.selectDataStr ? this.selectDataStr.split(',') : [] }
                        if (this.configdata.showSelect == '1') {
                            const listdata = this.$refs.jlist.data
                            this.selectDataChange(listdata)
                            this.$refs.jtable.tableselecteddata = listdata
                        }
                    })
                }
            },
            jlistQuery (obj = {}) {
                this.$refs.jlist.query(obj);
            },
            listDataChange (obj) {
                const str = this.computeStr(obj.list)
                this.emitData(str, obj.list)
            },

            // 用来将list的数据根据primaryKey转成字符串
            computeStr (list) {
                let str = ''
                if (list && list.length > 0) {
                    list.forEach((res) => {
                        if (str) str = str + ',' + res[this.configdata.jlist.primaryKey]
                        else str = res[this.configdata.jlist.primaryKey]
                    })
                }
                return str
            },
            emitData (value, list) {
                if (value == this.modelValue) return
                this.$emit('update:modelValue', value)
                this.$emit('on-change', value)
            },
            query () {
                const data = this.$refs.tableform.data
                this.$refs.jtable.query(data, 'out')
            },
            handleOk () {
                const selection = this.$refs.jtable.tableselecteddata
                if (selection.length === 0) return
                const existData = this.$refs.jlist.data
                if (this.sfdx === '1' && this.configdata.showSelect != '1') this.$refs.jlist.data = existData.concat(selection)
                else this.$refs.jlist.data = JSON.parse(JSON.stringify(selection))
                const list = this.$refs.jlist.data
                const str = this.computeStr(list)
                const obj = { value: str, list: selection, jlist: list, method: this.configdata.handleReturnData }
                if (this.configdata.jtable.tableSelectMethod) this.commonsJs.funcEval1(this, obj, this.configdata.jtable.tableSelectMethod)
                if (this.configdata.handleReturnData) this.$emit('commonMethod', obj)
            },
            openSelectModal () {
                this.modal = true
            },

            selectDataChange (value1) {
                if (this.$refs.jlist_modal) this.$refs.jlist_modal.data = value1
            },
            modal_jlistitembuttonclick (obj) {
                this.$refs.jtable.deleteTableSelectData(obj.row)
                this.$refs.jtable.data = this.$refs.jtable.markSelected(JSON.parse(JSON.stringify(this.$refs.jtable.data)))
            }
        },
        watch: {
            modelValue: {
                handler (n) {
                    this.$nextTick(() => {
                        if (this.modelValue) {
                            if (this.$refs.jlist.data.length === 0) {
                                this.jlistQuery({ list: this.modelValue.split(',') })
                            }
                        } else {
                            this.$nextTick(() => { if (this.$refs.jlist) this.$refs.jlist.reset() })
                        }
                    })
                },
                immediate: true,
                deep: true
            },
            componentName: {
                handler (n, o) {
                    if (n) { this.$root.componentRefs[this.componentName] = this }
                },
                deep: true,
                immediate: true
            },
            configdata: {
                handler () {
                    this.componentName = this.configdata.blm
                },
                deep: true,
                immediate: true
            },
            propstocomponent: {
                handler (n, o) {
                    this.propsToList = { ...this.propsToList, ...n }
                    if (n.readonly === true || this.opentype == 'show' || this.configdata.editable == '0') {
                        this.$set(this.propsToList, 'showDeleteButton', '0')
                    }
                },
                deep: true,
                immediate: true
            }
        },
        computed: {
            sql () {
                const bm = this.configdata.bm
                const tableFields = []
                return {}
            },
            selectDataStr () {
                return this.computeStr(this.$refs.jlist.data)
            },
            sfdx () {
                if (this.configdata.jtable.sfdx === '0') return '0'
                else return '1'
            }
        },
        mounted () {}
    }
</script>

<style lang="less" scoped>
:deep(.vertical-center-modal1) {
    display: flex;
    align-items: center;
    justify-content: center;
    .ivu-modal {
        top: 0;
    }
}

</style>
