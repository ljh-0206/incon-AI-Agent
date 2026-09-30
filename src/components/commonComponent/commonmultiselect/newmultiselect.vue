<template>
    <div class="list-box" >
        <Button v-if = "env()" @click="test()">多选test222</Button>
        <div class="list-content">
            <div v-for="(item, index) in list" :key="'list' + index" class="list-item">
                <span>{{ item.showContent }}</span>
                <a v-if="showButton" @click="deleteItem(index)">
                    <Icon type="md-close" class="item-delete" />
                </a>
            </div>
        </div>
        <a v-if="showButton" class="select-btn" @click="openSelectModal">选择</a>
        <Modal v-model="modal" title="选择" :closable="false" :mask-closable="false" :width="configdata.modalWidth?configdata.modalWidth:800" @on-visible-change="onOpen" @on-ok="handleOk">
            <tableform ref="tableform" :fathername="componentName" :configdata="tableformConfigdata"
                :propstocomponent="propstocomponent" />
            <jtable ref="jtable" v-if="modal" :fathername="componentName" :configdata="jtableConfigdata"
                :propstocomponent="tablePropsToComponent" />
        </Modal>
    </div>
</template>
<script>

    export default {
        name: 'newmultiselect',
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
                bm: '',
                primaryKey: '',
                zjConfigdata: {},
                listConfigdata: {},
                tableformConfigdata: {},
                jtableConfigdata: {},
                fields: [],
                columns: [],
                data: {},
                list: [],
                oldList: [],
                tableformdata: {},
                tabledata: [],
                modal: false,
                selectData: [],
                selectedList: {},
                propsToList: { editable: this.opentype, ...this.propstocomponent },
                tempdata: {},
                tjFields: [{ tjzd: 'xmoryhdm', zd: 'yhdm' }]
            }
        },

        methods: {
            test () {
                console.log(this.modelValue, 'value')
                console.log(this.zjConfigdata, 'configdata')
                console.log(this.propstocomponent, 'propstocomponent')
                console.log(this.propsToList, 'propsToList')
                console.log(this.selectData, 'selectData')
                console.log(this.sql, 'sql')
            },
            env () {
                let returnValue = false
                const str = localStorage.getItem('incoenv')
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1) returnValue = true
                return returnValue
            },
            onOpen (open) {
                this.$refs.tableform.data = {}
                if (open) {
                    this.$nextTick(() => {
                        this.tablePropsToComponent = { ...this.tablePropsToComponent, ...this.tableform, list: this.selectDataStr ? this.selectDataStr.split(',') : [] }
                        if (this.configdata.showSelect == '1') {
                            this.$refs.jtable.tableselecteddata = [...this.list]
                        }
                    })
                }
            },
            jlistQuery (obj = {}) {
                this.commonsJs.incoRequest('querylist', '1767575981562b139ffe9cbcc1ae476bc947a2b6a7da7a8',
                                           { bm: this.zjConfigdata.bm, primaryKey: this.zjConfigdata.primaryKey, listFields: this.listConfigdata.listFields, list: obj.list }).then((res) => {
                                               this.list = res
                                               this.oldList = JSON.parse(JSON.stringify(res))
                                           })
            },

            deleteItem (index) {
                this.$Modal.confirm({
                    title: '提示',
                    content: '确定要删除该项吗？',
                    onOk: () => {
                        this.list.splice(index, 1)
                        const str = this.computeStr(this.list)
                        this.$emit('input', str)
                    }
                });
            },

            // 用来将list的数据根据primaryKey转成字符串
            computeStr (list) {
                console.log(list, 'computeStr list')
                let str = ''
                if (list && list.length > 0) {
                    list.forEach((res) => {
                        if (str) str = str + ',' + res[this.zjConfigdata.primaryKey]
                        else str = res[this.zjConfigdata.primaryKey]
                    })
                }
                return str
            },
            emitData (value) {
                if (value == this.modelValue) return
                this.$emit('input', value)
                this.$emit('update:modelValue',value)
                this.$emit('on-change', value)
            },
            query () {
                const data = this.$refs.tableform.data
                this.$refs.jtable.query(data, 'out')
            },
            handleOk () {
                console.log('handleOk')
                const selection = this.$refs.jtable.tableselecteddata
                if (selection.length === 0) return
                this.list = JSON.parse(JSON.stringify(selection))
                const str = this.computeStr(this.list)
                this.emitData(str)
                const obj = { value: str, list: selection, jlist: this.list, method: this.configdata.handleReturnData }
                if (this.zjConfigdata.tableSelectMethod) this.commonsJs.funcEval1(this, obj, this.zjConfigdata.tableSelectMethod)
                if (this.zjConfigdata.handleReturnData) this.$emit('commonMethod', obj)
                // if (this.configdata.refreshObj && this.configdata.refreshObj.length > 0) this.refreshTarget(selection)
            },
            computeDelItem () {
                let arr = []
                const primaryKey = this.zjConfigdata.primaryKey
                if (this.list.length > 0) {
                    for (let i = 0; i < this.oldList.length; i++) {
                        const oldItem = this.oldList[i]
                        let flag = false
                        this.list.forEach((res, idx) => {
                            if (res[primaryKey] === oldItem[primaryKey]) {
                                flag = true
                            }
                        })
                        if (!flag) arr.push(oldItem)
                    }
                } else {
                    arr = this.oldList
                }
                return arr // 返回删除的 数据
            },
            computeRefreshObj (n) {
                const zblist = {}
                this.configdata.refreshObj.forEach((item) => {
                    if (!zblist[item.formBlm]) zblist[item.formBlm] = []
                    zblist[item.formBlm].push({ zformBlm: item.zformBlm, dataBlm: item.dataBlm })
                })
                return zblist
            },
            handleRefreshItem (n, type, zblist, formdata) {
                n.forEach((item) => {
                    const data = {}
                    const deleteitem = []
                    for (const key in zblist) {
                        const rowlist = zblist[key]
                        rowlist.forEach((row) => { data[row.zformBlm] = item[row.dataBlm] })
                        let flag = false
                        if (!formdata[key]) formdata[key] = []
                        formdata[key].forEach((row, index) => {
                            for (const k in row) {
                                if (row[k] === data[k]) flag = true
                            }
                            if (flag && type === 'delete') deleteitem.push(index)
                        })
                        if (type === 'delete') {
                            for (let i = deleteitem.length - 1; i >= 0; i--) {
                                formdata[key].splice(deleteitem[i], 1)
                            }
                        }
                        if (!flag && type === 'add') formdata[key].push(data)
                    }
                })
            },
            refreshTarget (n) {
                // 如果单选的情况下，可以将选择的数据刷新表单中配置的刷新对象(表单中有效)
                if (this.configdata.refreshObj && this.configdata.refreshObj.length > 0) {
                    const formdata = this.ref[this.fathername].data
                    if (this.configdata.sfdx === '0') {
                        let data = {}
                        if (n && n.length == 1) data = n[0]
                        this.configdata.refreshObj.forEach((item) => {
                            formdata[item.formBlm] = data[item.dataBlm]
                        })
                    } else if (this.configdata.sfdx === '1') {
                        const zblist = this.computeRefreshObj()
                        this.handleRefreshItem(this.computeDelItem(), 'delete', zblist, formdata)
                        this.handleRefreshItem(n, 'add', zblist, formdata)
                    }
                }
            },
            openSelectModal () {
                this.modal = true
            },
            handleConfigdata (n) {
                const pz = JSON.parse(JSON.stringify(n))
                if (pz.addConfigdata) {
                    Object.assign(pz, this.commonsJs.funcEval1(this, {}, pz.addConfigdata))
                    delete pz.addConfigdata
                    this.zjConfigdata = pz
                }
                this.bm = pz.bm
                this.listConfigdata.listFields = pz.listFields
                this.tableformConfigdata = {
                    blm: n.blm + '_tableform',
                    labelWidth: pz.tableForm_labelWidth ? pz.tableForm_labelWidth : 100,
                    fields: pz.tableformfields,
                    targetObject: n.blm + '_table',
                    searchName: '查询'
                }
                this.jtableConfigdata = {
                    blm: n.blm + '_table',
                    zjlx: 'vxe-table',
                    columns: pz.columns,
                    isMounted: n.isMounted ? n.isMounted : '1',
                    sfdx: n.sfdx ? n.sfdx : '0',
                    queryId: '17675764770035db7e766136fc9bc94e724bd38fe3b11',
                    tableformName: n.blm + '_tableform',
                    tableId: pz.primaryKey ? pz.primaryKey : 'id',
                    beforeQueryInside: `
                  console.log('beforeQueryInside called')
                  let tableformList=[]
                  let tableformData = _this.ref.${n.blm + '_tableform'}.data
                  let tableformFields = []
                  if(_this.ref.${n.blm + '_tableform'}) tableformFields = _this.ref.${n.blm + '_tableform'}.configdata.fields
                  tableformFields.forEach((field)=>{
                      if(tableformData[field.blm]) {
                          if(field.componentType=='i-input'){
                              let str = '(${this.bm}'+'.'+field.blm + " like '%' || trim('" + tableformData[field.blm]+"') || '%'"
                              if(field.listBm) str=str+" or "+field.listBm+"."+field.listMc + " like '%' || trim('" + tableformData[field.blm]+"') || '%'"
                              str=str+")"
                              tableformList.push(str)
                          }else if(field.componentType=='jselect'||field.componentType=='jradion'){
                              let str = '${this.bm}'+'.'+field.blm + " = '" + tableformData[field.blm]+"'"
                              tableformList.push(str)
                          }
                      }
                  })
                  obj.bm='${this.bm}'
                  obj.queryTableFields=JSON.parse(\`${JSON.stringify(this.zjConfigdata.queryTableFields)}\`)
                  obj.queryTableJoinBm=JSON.parse(\`${JSON.stringify(this.zjConfigdata.queryTableJoinBm)}\`)
                  obj.tableformList=tableformList
                  console.log(obj,'=====obj beforeQueryInside=====')
                  return obj
            `
                }
            }

        },
        watch: {
          modelValue: {
                handler (n) {
                    if (this.modelValue) {
                        this.$emit('on-change', this.modelValue)
                        if (this.list.length > 0) return
                        this.$nextTick(() => {
                            this.jlistQuery({ list: this.modelValue.split(',') })
                        })
                    } else { this.list = [] }
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
                handler (n) {
                    if (n.blm) {
                        this.componentName = n.blm
                        this.handleConfigdata(n)
                    }
                },
                deep: true,
                immediate: true
            },
            propstocomponent: {
                handler (n, o) {
                    this.propsToList = { ...this.propsToList, ...n }
                    if (n.readonly === true) {
                        this.propsToList.showDeleteButton = '0'
                    }
                },
                deep: true,
                immediate: true
            },
            list: {
                handler (n) {
                    if (n && n.length > 0 && this.zjConfigdata.listShowFields && this.zjConfigdata.listShowFields.length > 0) {
                        n.forEach(item => {
                            let showContent = ''
                            this.zjConfigdata.listShowFields.forEach((showitem, index) => {
                                if (index == 0) showContent = item[showitem] != undefined ? item[showitem] : ''
                                else showContent = showContent + (item[showitem] != undefined ? '-' + item[showitem] : '')
                            })
                            item.showContent = showContent
                        })
                    }
                    if (this.configdata.refreshObj && this.configdata.refreshObj.length > 0) {
                        const deleteList = this.computeDelItem()
                        this.refreshTarget(n)
                    }
                },
                deep: true
            }
        },
        computed: {
            showButton () {
                let showButton = true
                if (this.opentype === 'show') showButton = false
                if (this.configdata.editable == '0') showButton = false
                if (this.propstocomponent.editable == false || this.propstocomponent.editable == '0') showButton = false
                return showButton
            }
        },
        mounted () {},
        created () { }
    }
</script>

<style lang="less" scoped>
    .list-box {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        min-height:30px;
        width: 100%;
        border: 1px lightgray solid;
        padding-left: 5px;
        .list-content{
            flex: 1;
        }
        .list-item {
            position: relative;
            display: inline-block;
            align-items: center;
            padding: 0 5px;
            border-bottom: 1px solid #e8e8e8;
            .item-delete {
                color:red;
                cursor: pointer;

            }
        }
        .select-btn {
            width: 32px;
            cursor: pointer;
            color: #1890ff;
            margin-right: 6px;
        }
    }
    :deep(.vertical-center-modal1) {
        display: flex;
        align-items: center;
        justify-content: center;
        .ivu-modal {
            top: 0;
        }
    }

</style>
