<template>
    <div style="margin-left:5px;display: inline-block;" :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <Button v-if="env()" @click="test" class="test">前端导出test</Button>
        <Button @click="writeExcel">{{ configdata.content }}</Button>
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
            async writeExcel () {
                const moduleConfig = await this.commonsJs.incoRequest('queryone', '169399116994992a4339668b6fe5ed5864776d3af2af11e', { id: this.configdata.moduleId })
                const config = JSON.parse(moduleConfig.drpzxx)
                const yxdrzd = config.yxdrzd
                if (!yxdrzd || yxdrzd.length === 0) {
                    this.$Message.error('模板配置错误，请仔细检查模板')
                    return
                }
                const columns = []
                let verifyList = []
                for (let i = 0; i < yxdrzd.length; i++) {
                    const item = yxdrzd[i]
                    if (item.zdConfig) {
                        const zdConfig = JSON.parse(item.zdConfig)
                        if (zdConfig.hqsjfs === 'import' || zdConfig.hqsjfs === 'changeIntoDm') {
                            // 是否是非导出字段(此处为兼容原来的导入模板配置，值为1是，则不导入，如果不配置，则默认为导入字段)
                            if (item.bdc !== '1') {
                                const column = { header: item.lm }
                                column.key = item.dcblm ? item.dcblm : item.zdm
                                if (item.ycdc === '1') column.hidden = true // 是否隐藏导出字段
                                if (typeof zdConfig.columnWidth !== 'undefined') column.width = zdConfig.columnWidth
                                columns.push(column)
                            }
                            if (zdConfig.hqsjfs === 'changeIntoDm') {
                                await this.getVerifyList(item, zdConfig, verifyList) // 获取下载模板的内容是list下拉框的数据
                            }
                        }
                    }
                }

                let list = []
                if (this.configdata.exportType === 'exportmodule') {
                    for (let i = 0; i < 5000; i++) { list.push({}) }
                }
                // 获取已选导入字段的信息// 将数据转换为sheet结构
                if (this.configdata.exportType === 'exportlistdata') {
                    // 获取导出数据相关组件的data值
                    if (this.configdata.zjblm) {
                        list = this.ref[this.configdata.zjblm].data
                    }
                }
                if (this.configdata.exportType === 'exportquerydata' && this.configdata.queryId) {
                    list = await this.commonsJs.incoRequest('querylist', this.configdata.queryId, this.propstocomponent)
                }

                if (this.configdata.exportType !== 'exportmodule') verifyList = []

                let downloadname = '下载文件.xlsx'
                if (this.configdata.downloadname) downloadname = this.configdata.downloadname + '.xlsx'
                if (this.propstocomponent.downloadname) downloadname = this.propstocomponent.downloadname + '.xlsx'

                this.commonsJs.exportDataToExcel(columns, list, verifyList, downloadname)
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
                if (dmConfig.dmlist && dmConfig.dmlist.length > 0) { list = dmConfig.dmlist } else if (dmConfig.dmbm && dmConfig.dm && dmConfig.mc) {
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
