<template>
    <div style="margin-left:5px;display: inline-block;" :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <Button v-if="env()" @click="test" class="test">前端导出test</Button>
        <Button v-if="computeKyf()" v-bind="computeAttrs()" :style="computeStyle()" @click="writeExcel">{{
            configdata.content }}
        </Button>
    </div>
</template>
<script>
    import { mapState } from 'vuex'
    export default {
        name: 'excel_exportqd',
        props: {
            configdata: { type: Object, default: () => ({}) },
            fathername: { type: String, default: '' },
            propstocomponent: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                ref: this.$root.componentRefs,
                exportList: {},
                dmlist: {},
                tempdata: {}

            };
        },
        methods: {
            /**
             * 根据系统配置信息组件里面配置的开发环境，如果时开发环境，则显示调试的test按钮
             */
            env () {
                let returnValue = false
                const str = localStorage.getItem('incoenv')
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1)returnValue = true
                return returnValue
            },
            test () {
                console.log(this.propstocomponent, 'propstocomponent')
                console.log(this.fathername, 'fathername')
                console.log(this.configdata, 'configdata')
                console.log(this.dmlist, 'dmlist')
            },
            computeKyf (item) {
                let returnValue = true;
                if (this.configdata.condition) {
                    returnValue = this.commonsJs.funcEval1(this, { ...this.propstocomponent }, this.configdata.condition)
                }
                if (this.configdata.kyf && this.configdata.kyf === '0') returnValue = false
                return returnValue
            },
            computeStyle () {
                let newstyle = {}
                if (this.configdata.styleMethod) {
                    newstyle = this.commonsJs.funcEval1(this, {}, this.configdata.styleMethod)
                }
                return newstyle
            },
            computeAttrs () {
                let attrs = {}
                if (this.configdata.attrsMethod) {
                    attrs = this.commonsJs.funcEval1(this, {}, this.configdata.attrsMethod)
                }
                return attrs
            },
            async writeExcel () {
                if (!this.configdata.exportConfig || this.configdata.exportConfig.length === 0) {
                    this.$Message.error('您没有配置导出模板地址')
                    return
                }
                let downloadname = '下载文件.xlsx'
                if (this.configdata.downloadname) downloadname = this.configdata.downloadname + '.xlsx'
                // if(this.propstocomponent.downloadname) downloadname = this.propstocomponent.downloadname+'.xlsx'
                const exportList = []
                for (let j = 0; j < this.configdata.exportConfig.length; j++) {
                    const configItem = this.configdata.exportConfig[j]
                    const moduId = configItem.moduleId
                    // 1、获取模板配置信息
                    const moduleConfig = await this.commonsJs.incoRequest('queryone', '169399116994992a4339668b6fe5ed5864776d3af2af11e', { id: moduId })
                    const config = JSON.parse(moduleConfig.drpzxx)
                    const yxdrzd = config.yxdrzd
                    if (!yxdrzd || yxdrzd.length === 0) {
                        this.$Message.error('模板配置错误，请仔细检查模板')
                        return
                    }
                    // 2、 计算columns--导出excel的标题
                    const columns = []
                    const verifyList = []
                    for (let i = 0; i < yxdrzd.length; i++) {
                        const item = yxdrzd[i]
                        if (item.zdConfig) {
                            const zdConfig = JSON.parse(item.zdConfig)
                            if (zdConfig.hqsjfs === 'import' || zdConfig.hqsjfs === 'changeIntoDm') {
                                const column = { header: item.lm, key: item.zdm }
                                if (typeof zdConfig.columnWidth !== 'undefined') column.width = zdConfig.columnWidth
                                columns.push(column)
                                if (zdConfig.hqsjfs === 'changeIntoDm' && this.configdata.exportType === 'exportmodule') {
                                    await this.getVerifyList(item, zdConfig, verifyList) // 获取下载模板的内容是list下拉框的数据
                                }
                            }
                        }
                    }
                    // 3、获取导出数据
                    let list = []
                    if (this.configdata.exportType === 'exportmodule') {
                        for (let i = 0; i < 5000; i++) { list.push({}) }
                    } else {
                        // 获取导出数据相关组件的data值
                        if (configItem.getDataPath === 'currentData' && this.configdata.zjblm) {
                            list = this.ref[this.configdata.zjblm].data
                        }
                        // 如果是根据id查询数据
                        else if (configItem.getDataPath === 'queryById' && configItem.queryId) {
                            list = await this.commonsJs.incoRequest('querylist', configItem.queryId, this.propstocomponent)
                            this.exportList[configItem] = list
                        } // 继承已查询的数据
                        else if (configItem.getDataPath === 'inherit' && configItem.queryId) {
                            list = this.exportList[configItem.queryId]
                        }
                    }
                    exportList.push({ sheetName: configItem.sm, columns, list, verifyList })
                }
                await this.commonsJs.exportMultiSheetDataToExcel(exportList, downloadname)
            },
            async getVerifyList (item, zdConfig, verifyList) {
                const list = await this.getDMList(zdConfig)
                if (list.length > 0) {
                    let verifyObj = {}
                    const arr = []
                    list.forEach((listItem) => { arr.push(listItem.label) })
                    const labelStr = arr.join(',')
                    const str = `"${labelStr}"`
                    verifyObj = {
                        key: item.zdm,
                        dataValidation: {
                            type: 'list',
                            allowBlank: true,
                            formulae: [str]
                        }
                    }
                    verifyList.push(verifyObj)
                }
            },
            async getDMList (dmConfig) {
                let list = []
                if (dmConfig.list && dmConfig.list.length > 0) { list = dmConfig.list } else if (dmConfig.dmbm && dmConfig.dm && dmConfig.mc) {
                    const obj = { listBm: dmConfig.dmbm, listDm: dmConfig.dm, listMc: dmConfig.mc, whereSql: dmConfig.whereSql }
                    list = await this.commonsJs.incoRequest('querylist', 'DC37EB84F52E3520E0555943CA7634DE', obj)
                }
                return list
            }
        },
        mounted () {},
        components: { },
        computed: {
            ...mapState('admin/user', ['info'])
        }
    }
</script>
