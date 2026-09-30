<template>
    <div style="display:flex" :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <!-- <Button @click="test">测试选择组件</Button> -->
        <div :style="formula_width">
            <!-- <b>计算公式：</b> -->
            <span>{{formula}}</span>
        </div>
        <div :style="{width:button_width}">
            <Button @click="showConfig">{{btnContent}}</Button>
        </div>
        <Modal v-model="modal" title="配置公式" width="1000px" @on-visible-change="onOpen" @on-ok="handleOk">
            <div style="width:90%; line-height:32px;font-size:20px">
                <p style="color:blue">计算公式：</p>
                <span style="color:green">{{formula}}</span>
                <!-- <p>{{formula_ht}}</p> -->
            </div>
            <div style="display:flex">
                <Button @click="handleAdd('1')">左括号（</Button>
                <Button @click="handleAdd('2')">右括号 ）</Button>
                <Button @click="handleAdd('3')">加 +</Button>
                <Button @click="handleAdd('4')">减 -</Button>
                <Button @click="handleAdd('5')">乘 *</Button>
                <Button @click="handleAdd('6')">除 /</Button>
                <Button @click="handleAdd('7')">参数</Button>
                <Button @click="handleAdd('8')">常量</Button>
                <b style="margin-top:5px;margin-left:25px;color:green">添加类型</b>
                <jradio v-model="insertOrAppend" :list="radioList" style="width:200px;margin-top:5px;margin-left:5px">
                </jradio>
            </div>
            <i-table :columns="tableColumns" :data="tableData" height="500" @on-row-click="handleTableRowClick"
                highlight-row>
                <template #paramid="{row,index}">
                    <i-input v-if="row.formulaType === 'param' ||row.formulaType === 'const'"
                        v-model="tableData[index].paramid"></i-input>
                </template>
                <template #content="{row,index}">
                    <i-input v-if="row.formulaType === 'param' ||row.formulaType === 'const'"
                        v-model="tableData[index].content"></i-input>
                    <span v-else>{{row.content}}</span>
                </template>
                <template slot-scope="{row,index}" slot="operation">
                    <Button @click.stop="handleDel(row,index)">删除</Button>
                </template>
            </i-table>
        </Modal>
    </div>
</template>
<script>

    export default {
        name: 'createfomula',
        components: {},
        props: {
            fathername: { type: String, default: '' },
            value: { type: String, default: '' },
            // propstocomponent:{type:Object,default:()=>({})},
            configdata: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                ref: this.$root.componentRefs,
                radioList: [
                    { value: 'insert', label: '插入' },
                    { value: 'append', label: '追加' }
                ],
                tableColumns: [
                    { type: 'index', title: '序号' },
                    { key: 'formulaType', title: '类型' },
                    { slot: 'paramid', title: '变量id' },
                    { slot: 'content', title: '内容' },
                    { slot: 'operation', title: '操作' }
                ],
                tableData: [],
                modal: false,
                insertOrAppend: 'append',
                currentTableIndex: -1,
                tempdata: {}
            }
        },

        methods: {
            test () {
                console.log(this.$value, 'value')
            },
            onOpen (open) {
            },
            showConfig () {
                this.modal = true
            },
            handleAdd (data) {
                switch (data) {
                case '1':
                    if (this.insertOrAppend === 'insert') this.tableData.splice(this.currentTableIndex, 0, { formulaType: '括号（', content: ' ( ' })
                    else this.tableData.push({ formulaType: '括号（', content: ' ( ' })
                    break;
                case '2':
                    if (this.insertOrAppend === 'insert') this.tableData.splice(this.currentTableIndex, 0, { formulaType: '括号）', content: ' ) ' })
                    else this.tableData.push({ formulaType: '括号）', content: ' ) ' })
                    break;
                case '3':
                    if (this.insertOrAppend === 'insert') this.tableData.splice(this.currentTableIndex, 0, { formulaType: '加 +', content: ' + ' })
                    else this.tableData.push({ formulaType: '加 +', content: ' + ' })
                    break;
                case '4':
                    if (this.insertOrAppend === 'insert') this.tableData.splice(this.currentTableIndex, 0, { formulaType: '减 -）', content: ' - ' })
                    else this.tableData.push({ formulaType: '减 -）', content: ' - ' })
                    break;
                case '5':
                    if (this.insertOrAppend === 'insert') this.tableData.splice(this.currentTableIndex, 0, { formulaType: '乘 *', content: ' * ' })
                    else this.tableData.push({ formulaType: '乘 *', content: ' * ' })
                    break;
                case '6':
                    if (this.insertOrAppend === 'insert') this.tableData.splice(this.currentTableIndex, 0, { formulaType: '除 /', content: ' / ' })
                    else this.tableData.push({ formulaType: '除 /', content: ' / ' })
                    break;
                case '7':
                    if (this.insertOrAppend === 'insert') this.tableData.splice(this.currentTableIndex, 0, { formulaType: 'param', content: '', paramid: '' })
                    else this.tableData.push({ formulaType: 'param', content: '', paramid: '' })
                    break;
                case '8':
                    if (this.insertOrAppend === 'insert') this.tableData.splice(this.currentTableIndex, 0, { formulaType: 'const', content: '' })
                    else this.tableData.push({ formulaType: 'const', content: '' })
                    break;
                default:
                }
            },
            handleDel (row, index) {
                if (this.tableData.length === index) {
                    this.tableData.length.pop()
                    this.currentTableIndex = -1
                } else { this.tableData.splice(index, 1) }
            },
            handleTableRowClick (row, index) {
                this.currentTableIndex = index
            },
            handleOk (param) {
                const obj = {}
                obj.formula = this.formula
                obj.formula_ht = this.formula_ht
                obj.formula_config = this.tableData
                if (this.tableData.length > 0) {
                    obj.params = []
                    this.tableData.forEach((item) => {
                        if (item.formulaType === 'param') obj.params.push({ paramid: item.paramid, param: item.content })
                    })
                }
                this.$emit('input', JSON.stringify(obj))
                if (this.configdata.handleFomula) {
                    obj.method = this.configdata.handleFomula
                    this.$emit('commonMethod', obj)
                }

            // console.log(obj,'obj from createFomula')
            }
        },
        watch: {
            value: {
                handler () {
                    this.$nextTick(() => {
                        if (this.value) {
                            const obj = JSON.parse(this.value)
                            this.tableData = obj.formula_config
                        } else {
                            this.$nextTick(() => {
                                this.tableData = []
                            })
                        }
                    })
                },
                immediate: true
            }
        },
        computed: {
            formula () {
                let str = ''
                if (this.tableData.length > 0) {
                    this.tableData.forEach((item) => {
                        if (str) str = str + item.content
                        else str = item.content
                    })
                }
                return str
            },
            formula_ht () {
                let str = ''
                if (this.tableData.length > 0) {
                    this.tableData.forEach((item) => {
                        if (str) {
                            if (item.formulaType === 'param') {
                                str = str + `#{${item.content}}`
                            } else str = str + item.content
                        } else {
                            if (item.formulaType === 'param') {
                                str = `#{${item.content}}`
                            } else str = item.content
                        }
                    })
                }
                return str
            },
            formula_width () {
                let fomulaWidth = 'width:90%'
                if (this.configdata.button_width) {
                    const width = this.configdata.button_width;
                    fomulaWidth = `width:calc(100% - ${width})`;
                }
                return fomulaWidth
            },
            button_width () {
                let buttonWidth = '120px'
                if (this.configdata.button_width) buttonWidth = this.configdata.button_width
                return buttonWidth
            },
            btnContent () {
                let buttonContent = '配置'
                if (this.configdata.button_content) buttonContent = this.configdata.button_content
                return buttonContent
            }
        },
        mounted () {}
    }
</script>
