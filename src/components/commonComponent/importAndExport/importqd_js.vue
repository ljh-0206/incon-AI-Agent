<template>
    <div style="margin-left:5px;display: inline-block;" :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <Button v-if="env()" @click="test" class="test">前端导入test</Button>
        <template>
            <Upload :before-upload="zdy_beforeupload" ref="zdy_upload" action="/" accept=".xls,.xlsx">
                <Button v-if="computeKyf()" v-bind="computeAttrs()" :style="computeStyle()">
                    {{configdata.content ? configdata.content :'导入' }}
                </Button>
                <div ref="triggerUpload"></div>
            </Upload>
        </template>
        <collection v-model="showlist" :configdata="collection_config" :propstocomponent="childProps"></collection>
    </div>
</template>
<script>
    import { mapState } from 'vuex'
    import * as Excel from 'exceljs/dist/exceljs.min.js';
    export default {
        name: 'import_qd_js',
        props: {
            dyref: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: () => ({}) },
            fathername: { type: String, default: '' },
            propstocomponent: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                ref: this.$root.componentRefs,
                showlist: false,
                collection_config: {},
                dmlist: {},
                data: {},
                tempdata: {},
                dataList: [],
                childProps: {
                    columns: [],
                    successDataList: [],
                    errorDataList: []
                },
                componentsParam: {},
                componentRefs: {}
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
            // 该方法用于通过js方法调用导入功能时触发“选择上传文件”
            triggerUpload () { this.$refs.triggerUpload.click() },
            zdy_beforeupload (file) {
                const data = [];
                const fileReader = new FileReader();
                // 这里需要把文件转换成 ArrayBuffer 类型 给ExcelJS
                fileReader.readAsArrayBuffer(file);
                fileReader.onload = (e) => {
                    const workbook = new Excel.Workbook();
                    workbook.xlsx.load(e.target.result).then(async () => {
                        workbook.eachSheet(function (worksheet, sheetId) {
                            const sheetData = []
                            let index = 0
                            worksheet.eachRow((row, idx) => { // Sheet1的内容 按row 读取
                                const line = [...row.values]
                                if (line.length > 0) {
                                    const rowdata = []
                                    for (let i = 1; i < line.length; i++) {
                                        rowdata.push(line[i])
                                    }
                                    // let rowdata = line.map(m=>m?m.toString():'')
                                    if (index == 0) rowdata.unshift('__rowNum__')
                                    else rowdata.unshift(idx)
                                    sheetData.push(rowdata)
                                }
                                index++
                            });
                            data.push(sheetData)
                        });
                        // 这里 datalist 就是处理后的多个sheet页中的内容
                        const datalist = this.handleData(data)

                        if (this.configdata.importType === 'zdydr') {
                            // if(this.configdata.handlePage&&this.configdata.handleMethod) this.ref[this.configdata.handlePage].function[this.configdata.handleMethod](datalist)
                            if (this.configdata.importMethod) await this.commonsJs.funcEval(this, { data: datalist }, this.configdata.importMethod)
                        } else {
                            const mbidList = this.configdata.moduleId
                            for (let i = 0; i < datalist.length; i++) {
                                this.dataList = data[i]
                                await this.handleImport(datalist[i], mbidList)
                            // await this.handleImport(datalist[i],mbidList[i])
                            }
                        }
                        // 导入完成方法
                        if (this.configdata.afterImport) this.commonsJs.funcEval(this, { data: datalist }, this.configdata.afterImport)
                    });
                };
                return false
            },
            // 将导入数据处理成模板配置的列名
            handleData (data) {
                console.log(data, '导入excel数据')
                const datalist = []
                if (data.length > 0) {
                    data.forEach(item => {
                        if (item.length > 0) {
                            const sheetDatalist = []
                            const columu_keys = Object.keys(item[0])
                            for (let i = 1; i < item.length; i++) {
                                const row = {}
                                const data_keys = Object.keys(item[i])
                                columu_keys.forEach((key) => {
                                    data_keys.forEach((key2) => {
                                        if (key == key2) {
                                            row[item[0][key]] = item[i][key2]
                                        }
                                    })
                                })
                                sheetDatalist.push(row)
                            }
                            datalist.push(sheetDatalist)
                        }
                    })
                }
                return datalist
            },
            // 调用导入
            async handleImport (datalist, mbid) {
                const data = JSON.parse(JSON.stringify(datalist))
                if (data.length === 0) {
                    this.$Message.error('没有导入的数据')
                    return
                }
                // 根据模板id获取模板配置
                const moduleConfig = await this.commonsJs.incoRequest('queryone', '169399116994992a4339668b6fe5ed5864776d3af2af11e', { id: mbid })
                const config = JSON.parse(moduleConfig.drpzxx)
                const yxdrzd = config.yxdrzd// 获取已选导入字段的信息
                if (yxdrzd.length === 0) {
                    this.$Message.error('没有配置导入字段')
                    return
                }
                const drtssz = config.drtssz
                const drlx = this.configdata.drlx // 获取导入类型

                await this.getDmList(config.dmList) // 获取代码表内容
                const configList = config.module_config // 获取导入模板的配置信息，有bm，requiredZd，fieldConfig，
                const firstBm = configList[0].bm // 第一个表的表名
                const firstB_requied_zd = configList[0].requiredZd.zdm // 第一个表中必导字段
                const newdata_list = await this.first_handleData(data, configList, drlx)
                console.log(newdata_list, 'first_handleData', datalist, configList)
                const verify_data = await this.verify_data(newdata_list, configList)
                const qp_list = this.qp_data(newdata_list, firstBm, firstB_requied_zd)
                const final_result = this.handle_result(qp_list)
                // 将导入data切片成一条条导入的数据数组（主要针对多表导入）
                const final_list = this.get_finalList(final_result.successlist, configList)

                const import_result_temp = JSON.parse(JSON.stringify(final_list))
                // let successList = this.changeDataToTableList(import_result_temp.successList)
                // let errorList = this.changeDataToTableList(import_result_temp.err_list)
                // this.childProps['columns'] = config.fieldsConfig
                // this.childProps['successDataList'] = successList
                // this.childProps['errorDataList'] = errorList

                if (final_list.length > 0) {
                    await this.import_to_database(final_list, drtssz)
                    // 刷新对象变量
                    if (this.configdata.refreshObject) {
                        const refreshList = this.configdata.refreshObject.split(',')
                        refreshList.forEach(item => {
                            this.configdata.dyref[item].query()
                        })
                    }
                } else {
                    this.$Message.warning('没有要导入的数据')
                }
            },

            /**
             * 先循环data，然后按表名循环，再按字段名循环
             * 处理导入数据，1、将数据按照表名_字段名重新赋值；2、传参字段将参数给字段赋值；3、自动生成id字段，生成id
             * 4、代码转换字段，转换代码；5、yhdm、jsdm、bmdm等字段从前台传入导入人基本信息
             * 6、计算那些导入数据是导入的数据，并且筛查出导入数据中必导字段为空的字段；7、校验数据的唯一性
             * @param {*} data
             * @param {*} fieldConfig
             */
            async first_handleData (data, configlist, drlx) {
                const arr = []
                const _this = this
                let lastdata = {}
                for (let index = 0; index < data.length; index++) {
                    const item = data[index]
                    if (index > 0) lastdata = arr[index - 1]
                    let data_obj = {}
                    data_obj = await handleDataItem(item, configlist, drlx, _this, lastdata)
                    // await this.verify_field(data_obj,configlist)
                    arr.push(data_obj)
                }
                return arr
                // 处理每条data的数据
                async function handleDataItem (data, configlist, drlx, _this, lastdata) {
                    const newdata_item = { inco_import_id: _this.commonsJs.sys_guid(), _rownum_: data.__rowNum__ }
                    // 循环表名
                    for (let itemIndex = 0; itemIndex < configlist.length; itemIndex++) {
                        const item = configlist[itemIndex]
                        // 循环表内的字段名
                        item.fieldConfig.forEach((field) => {
                            const new_zdm = field.bm_zdm
                            if (drlx === 'add') {
                                if (field.hqsjfs === 'import') {
                                    newdata_item[new_zdm] = data[field.lm]
                                // 此处校验导入字段长度或数据值（如果是数字的化）
                                } else if (field.hqsjfs === 'gdz') {
                                    newdata_item[new_zdm] = field.gdz
                                // 此处校验导入字段长度或数据值（如果是数字的化）
                                } else if (field.hqsjfs === 'param') {
                                    newdata_item[new_zdm] = _this.propstocomponent[field.crcsblm]
                                } else if (field.hqsjfs === 'sys_guid') {
                                    newdata_item[new_zdm] = _this.commonsJs.sys_guid()
                                } else if (field.hqsjfs === 'sysdate') {
                                    const date = new Date()
                                    newdata_item[new_zdm] = date.toLocaleString()
                                } else if (field.hqsjfs === 'changeIntoDm') {
                                    if (_this.dmlist[field.zdm] && _this.dmlist[field.zdm].length > 0) {
                                        const mc = data[field.lm]
                                        const list = _this.dmlist[field.zdm]
                                        let dm = ''
                                        for (let i = 0; i < list.length; i++) {
                                            if (list[i].label === mc) {
                                                dm = list[i].value
                                                break;
                                            }
                                        }
                                        newdata_item[new_zdm] = dm
                                    }
                                } else if (field.hqsjfs === 'yhdm') {
                                    newdata_item[new_zdm] = _this.info.yhdm
                                } else if (field.hqsjfs === 'jsdm') {
                                    newdata_item[new_zdm] = _this.info.jsdm
                                } else if (field.hqsjfs === 'bmdm') {
                                    newdata_item[new_zdm] = _this.info.bmdm
                                } else if (field.hqsjfs === 'inherit' && field.inherit_bm && field.inherit_zdm) {
                                    const sourcezdm = `${field.inherit_bm}__inco__${field.inherit_zdm}`
                                    newdata_item[new_zdm] = newdata_item[sourcezdm]
                                }
                            } else {
                                newdata_item[new_zdm] = data[field.lm]
                            }
                        })
                        const eachBmImportFlag = _this.get_required_zd_status(newdata_item, item.bm, item.requiredZd)
                        newdata_item[`${item.bm}_isRequiredImportData`] = false
                        if (eachBmImportFlag.isRequiredImportData) {
                            newdata_item[`${item.bm}_isRequiredImportData`] = true
                        } else {
                            item.fieldConfig.forEach(field => {
                                const new_zdm = field.bm_zdm
                                newdata_item[new_zdm] = lastdata[new_zdm]
                            })
                            if (eachBmImportFlag.oneRequiredDataEmpty) {
                                newdata_item.error = 'error'
                                if (newdata_item.error_list && newdata_item.error_list.length > 0) {
                                    newdata_item.error_list = newdata_item.error_list.concat(eachBmImportFlag.error)
                                } else { newdata_item.error_list = eachBmImportFlag.error }
                            }
                        }
                    // await _this.verify_field(newdata_item,item,_this)
                    }

                    return newdata_item
                }
            },
            /** 判断item_data 必填字段是否有完整数据
             * 1、如果必导字段全为空，如果有一个为空，还有必导字段内容，则报错并输入报错信息
             */
            get_required_zd_status (item_data, bm, required_zd) {
                let isRequiredImportData = true // 所有必导字段都不为空
                const oneRequiredDataEmpty = [] // 必导字段有一个为空
                let error = []
                for (let i = 0; i < required_zd.length; i++) {
                    const zdm = `${bm}__inco__${required_zd[i].zdm}`
                    // 判断必填数据是否为空
                    if (item_data[zdm] == null || item_data[zdm] == 'undefined' || item_data[zdm] == '') {
                        isRequiredImportData = false
                        oneRequiredDataEmpty.push('exist')
                        error.push({ rownum: item_data._rownum_, content: `行号为${item_data._rownum_},列为“${required_zd[i].lm}”导入内容不能为空` })
                    } else { oneRequiredDataEmpty.push('notexist') }
                }
                let flag = false
                if (!isRequiredImportData) {
                    const firstEmpty = oneRequiredDataEmpty[0]
                    for (let j = 0; j < oneRequiredDataEmpty.length; j++) {
                        if (oneRequiredDataEmpty[j] != firstEmpty) {
                            flag = true
                            break
                        }
                    }
                    if (!flag) error = []
                }
                return { isRequiredImportData, oneRequiredDataEmpty: flag, error }
            },
            async verify_data (datalist, config) {
                const data = JSON.parse(JSON.stringify(datalist))
                const data_arr = []
                let verify_result = []
                while (data.length > 0) {
                    let index = 0
                    const length = 4
                    const temparr = []

                    while (data.length > 0 && index < length) {
                        index++
                        temparr.push(data[0])
                        data.splice(0, 1)
                    }
                    data_arr.push(temparr)
                }
                const verifydata_result = []
                for (let i = 0; i < data_arr.length; i++) {
                    const res = await this.commonsJs.incoRequest('querylist', 'import_verify_data', { datalist: data_arr[i], config })
                    console.log(res, 'res')
                    verify_result = verify_result.concat(res)
                }
                console.log(data_arr, 'data_arr', verify_result)
            },
            // get_required_zd_status(item_data,bm,required_zd) {
            //     let isRequiredImportData=true //所有必导字段都不为空
            //     let oneRequiredDataEmpty=false //必导字段有一个为空
            //     let error=[]
            //     for (let i=0;i<required_zd.length;i++) {
            //         let zdm=`${bm}__inco__${required_zd[i].zdm}`
            //         //判断必填数据是否为空
            //         if (item_data[zdm]==null || item_data[zdm]=='undefined' || item_data[zdm]=='') {
            //             oneRequiredDataEmpty=true
            //             isRequiredImportData=false
            //             error.push({rownum:item_data._rownum_,content:`行号为${item_data._rownum_},列为“${required_zd[i].lm}”导入内容不能为空`})
            //         }
            //     }
            //     return {isRequiredImportData:isRequiredImportData,oneRequiredDataEmpty:oneRequiredDataEmpty,error:error}
            // },
            /**
             * 将一组导入的数据分成组
             */
            qp_data (list, firstBm, firstB_requied_zd) {
                const newdata_list = JSON.parse(JSON.stringify(list))
                // 将数据切片
                const data_qp_list = []
                let index = 0 // 为防止死循环，最大插入数据不允许超过10000条记录
                while (newdata_list.length > 0) {
                    index++
                    const qp_item = []
                    const flag = newdata_list[0][firstBm + '_isRequiredImportData']
                    // 判断数据是否是必导字段
                    if (flag) {
                        qp_item.push(newdata_list[0])
                        newdata_list.splice(0, 1)
                        while (newdata_list.length > 0) {
                            const empty_item = newdata_list[0][firstBm + '_isRequiredImportData']
                            if (empty_item) {
                                break
                            } else {
                                qp_item.push(newdata_list[0])
                                newdata_list.splice(0, 1)
                            }
                        }
                    }
                    if (qp_item.length > 0) {
                        data_qp_list.push(qp_item)
                    }
                    if (index > 10000) break
                }
                return data_qp_list
            },

            // 将切片每条导入数据的数组继续分组成一组的导入数据,将原来表名_字段名的数据还原回与真实字段对应，并对每条数据
            // 增加对应导入的字段等相关信息
            get_finalList (list, configList) {
                // 处理表导入数据条
                const final_list = []
                list.forEach((qp_list) => {
                    qp_list.forEach((row, index) => {
                        const fieldList = []
                        configList.forEach((bmlist) => {
                            const flagMark = `${bmlist.bm}_isRequiredImportData`
                            const flag = row[flagMark]
                            if (flag) {
                                const obj = {}
                                const fieldArr = []
                                bmlist.fieldConfig.forEach((field) => {
                                    const zdm = `${bmlist.bm}__inco__${field.zdm}`
                                    obj[field.zdm] = row[zdm]
                                    fieldArr.push({ zdm: field.zdm, zdlx: field.zdlx.toLowerCase() })
                                })
                                obj.primarykeylist = bmlist.primarykeylist
                                obj.update_primaryKeyList = bmlist.update_primaryKeyList
                                obj.updateList = bmlist.updateList
                                obj.incodr_bm = bmlist.bm
                                obj.incodr_fieldlist = fieldArr
                                obj.fieldConfig = bmlist.fieldConfig
                                obj._rownum_ = row._rownum_
                                obj.isRequiredImportData = true
                                if (row[`${bmlist.bm}_oneRequiredDataIsEmpty`]) {
                                    obj.oneRequiredDataIsEmpty = true
                                    obj.error = row[`${bmlist.bm}_error`]
                                }
                                fieldList.push(obj)
                            }
                        })
                        final_list.push(fieldList)
                    })
                })
                return final_list
            },
            async verify_field (field_data, item, _this) {
                if (!field_data[item.bm + '_isRequiredImportData']) return // 如果不是必填的数据，则不需要校验
                const row = field_data
                if (!row.error_list) row.error_list = []
                for (let i = 0; i < item.fieldConfig.length; i++) {
                    const field = item.fieldConfig[i]
                    // 判断是否非空字段校验
                    // 校验字段类型的必须校验
                    if (row[field.bm_zdm]) {
                        switch (field.zdlx.toLowerCase()) {
                        case 'varchar2':
                            if (typeof row[field.bm_zdm] === 'string') row[field.bm_zdm] = row[field.bm_zdm].trim()
                            let verifyStrLengthResult = this.commonsJs.verifyStrLength(row[field.bm_zdm], field.zdcd)
                            if (!verifyStrLengthResult.flag) {
                                row.flag = 'error'
                                const error = { rownum: row._rownum_ }
                                error.content = `第${row._rownum_}行,列名为"${field.lm}"的长度为${verifyStrLengthResult.length}，超出数据库字段长度${field.zdcd}`
                                row.error_list.push(error)
                            }
                            break;
                        case 'nchar':
                            verifyStrLengthResult = this.commonsJs.verifyStrLength(row[field.bm_zdm], field.zdcd)
                            if (!verifyStrLengthResult.flag) {
                                row.flag = 'error'
                                const error = { rownum: row._rownum_ }
                                error.content = `第${row._rownum_}行,列名为"${field.lm}"的长度为${verifyStrLengthResult.length}，超出数据库字段长度${field.zdcd}`
                                row.error_list.push(error)
                            }
                            break;
                        case 'char':
                            verifyStrLengthResult = this.commonsJs.verifyStrLength(row[field.bm_zdm], field.zdcd)
                            if (!verifyStrLengthResult.flag) {
                                row.flag = 'error'
                                const error = { rownum: row._rownum_ }
                                error.content = `第${row._rownum_}行,列名为"${field.lm}"的长度为${verifyStrLengthResult.length}，超出数据库字段长度${field.zdcd}`
                                row.error_list.push(error)
                            }
                            break;
                        case 'number':
                            if (parseFloat(row[field.bm_zdm]).toString() == 'NaN') {
                                row.flag = 'error'
                                const error = { rownum: row._rownum_ }
                                error.content = `第${row._rownum_}行,列名为"${field.lm}"不是数字`
                                row.error_list.push(error)
                            }
                            break;
                        case 'date':
                            let flag = false;
                            if (isNaN(row[field.bm_zdm]) && !isNaN(Date.parse(row[field.bm_zdm]))) { flag = true; }
                            if (!flag) {
                                row.flag = 'error'
                                const error = { rownum: row._rownum_ }
                                error.content = `第${row._rownum_}行,列名为"${field.lm}"不是日期格式`
                                row.error_list.push(error)
                            }
                            break;
                        default:
                        }
                    }
                    if (field.jyfs === 'verifyfield') {
                        const returnValue = await lhzj_verify(row, item, _this)
                        if (!returnValue.flag) {
                            row.flag = 'error'
                            row.error_list.push({ rownum: row._rownum_, content: `第${row._rownum_}行,列名为"${field.lm}"唯一性校验失败` })
                        }
                    }
                }
                console.log(row, 'row*******')

                async function lhzj_verify (row, item, _this) {
                    const returnValue = { flag: true, error: '' }
                    const fieldlist = item.verifyFields
                    const param = {}
                    param.incodr_bm = item.bm
                    param.fieldlist = fieldlist
                    for (let i = 0; i < fieldlist.length; i++) {
                        const field = fieldlist[i]
                        param[field] = row[`${item.bm}__inco__${field}`]
                    }
                    const res = await _this.commonsJs.incoRequest('queryone', 'verify_dr_data_exist', param)
                    if (res.num > 0) {
                        returnValue.flag = false
                        returnValue.error = `第${row._rownum_}的"${row.bm}"唯一性校验失败`
                    }
                    return returnValue
                }
            },
            async import_to_database (final_import_data, final_drtssz, drlx) {
                this.showlist = true
                const final_list = JSON.parse(JSON.stringify(final_import_data))
                this.$Spin.show()
                let drtssz = 1
                if (final_drtssz > 1) drtssz = final_drtssz
                const arr = []
                let arrItem = []
                while (final_list.length > 0) {
                    if (arrItem.length < drtssz) {
                        arrItem.push(final_list[0])
                        final_list.splice(0, 1)
                    } else {
                        arr.push({ dataList: arrItem })
                        arrItem = []
                    }
                }
                if (arrItem.length > 0)arr.push({ dataList: arrItem })
                if (arr.length > 0) {
                    for (let i = 0; i < arr.length; i++) {
                        const item = arr[i]
                        console.log(item, '最终导入字段')
                        if (this.configdata.drlx == 'add') await this.commonsJs.incoRequest('insert', 'import_to_database_sql', { list: item.dataList })
                    // 更新导入数据，需要给后台传入数据，更新字段和表的主键
                    // if(this.configdata.drlx=='update') await this.commonsJs.incoRequest('update','import_excel_to_database_update',{list:item.dataList})
                    }
                }
                this.$Spin.hide()
                this.$Message.success('导入成功')
            },

            async getDmList (dmlist) {
                // 获取配置信息的代码表list
                for (let i = 0; i < dmlist.length; i++) {
                    const zdConfig = dmlist[i]
                    if (zdConfig.dmlist && zdConfig.dmlist.length > 0) {
                        this.dmlist[field.zdm] = zdConfig.dmlist
                    } else if (zdConfig.dmbm && zdConfig.dm && zdConfig.mc) {
                        const obj = { listBm: zdConfig.dmbm, listDm: zdConfig.dm, listMc: zdConfig.mc }
                        const list = await this.commonsJs.incoRequest('querylist', 'DC37EB84F52E3520E0555943CA7634DE', obj)
                        this.dmlist[zdConfig.zdm] = list
                    }
                }
            },
            handle_result (list) {
                const successlist = []
                const errorlist = []
                list.forEach((item) => {
                    let error = false
                    for (let i = 0; i < item.length; i++) {
                        if (item[i].flag === 'error') {
                            error = true
                            break
                        }
                    }
                    if (error) errorlist.push(item)
                    else successlist.push(item)
                })
                return { successlist, errorlist }
            },
            changeDataToTableList (list) {
                if (list.length === 0) return []
                const arrList = []
                list.forEach((arr1) => {
                    arr1.forEach((item) => { arrList.push(item) })
                })
                const tableList = []
                let currentItem = {}
                arrList[0].fieldConfig.forEach((field) => {
                    currentItem[field.bm_zdm] = arrList[0][field.zdm]
                    currentItem._rownum_ = arrList[0]._rownum_
                })
                while (arrList.length > 0) {
                    const item = arrList[0]
                    if (currentItem._rownum_ === item._rownum_) {
                        if (arrList.length > 0) {
                            item.fieldConfig.forEach((field) => { currentItem[field.bm_zdm] = item[field.zdm] })
                        }
                    } else {
                        tableList.push(currentItem)
                        currentItem = {}
                        if (arrList.length > 0) {
                            item.fieldConfig.forEach((field) => { currentItem[field.bm_zdm] = item[field.zdm] })
                            currentItem._rownum_ = item._rownum_
                        }
                    }
                    arrList.splice(0, 1)
                }
                tableList.push({ ...currentItem })
                return tableList
            }
        },
        mounted () {
            this.commonsJs.getzjpzxx('1709970421345e1c6d9a5fc3446b6561987c6f3a38baa').then((res) => {
                this.collection_config = { ...res }
            })
        },
        components: { },
        computed: {
            ...mapState('admin/user', ['info'])
        }
    }
</script>
