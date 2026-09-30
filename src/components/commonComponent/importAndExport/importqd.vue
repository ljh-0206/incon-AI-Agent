<template>
    <div style="margin-left:5px;display: inline-block;vertical-align: top;"
        :class="'style-' + configdata.blm + ' ' + configdata.blm">
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
                    config: {},
                    drtssz: 100,
                    columns: [],
                    resultData: {}
                // successDataList:[],
                // errorDataList:[],
                },
                componentsParam: {},
                componentRefs: {},
                successed_import: false,
                requiredImportField: {}
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
                        workbook.eachSheet((worksheet, sheetId) => {
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
                        // 如果导入的数据小于2条，说明没有导入的数据（第一条是标题）
                        if (datalist.length > 0) {
                            if (this.configdata.importType === 'zdydr') {
                                if (this.configdata.importMethod) await this.commonsJs.funcEval(this, { data: datalist }, this.configdata.importMethod)
                            } else {
                                const mbidList = this.configdata.moduleId
                                await this.handleImport(datalist[0], mbidList)
                            // for(let i=0;i<datalist.length;i++){
                            //     this.dataList = data[i]
                            //     await this.handleImport(datalist[i],mbidList)
                            // }
                            }
                        // 导入完成方法
                        // if(this.configdata.afterImport && this.successed_import)  this.commonsJs.funcEval(this,{data:datalist},this.configdata.afterImport)
                        }
                    });
                };
                return false
            },
            // 将导入数据处理成模板配置的列名
            handleData (data) {
                if (data.length < 1) {
                    this.$Message.error('没有导入的数据')
                    return []
                }
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
                if (this.configdata.beforeUploadMethod) await this.commonsJs.funcEval(this, {}, this.configdata.beforeUploadMethod)
                this.commonsJs.spin('正在导入中，因为需要计算数据，可能需要很长时间，请耐心等待', 'show', this)
                const data = JSON.parse(JSON.stringify(datalist))
                // 根据模板id获取模板配置
                const moduleConfig = await this.commonsJs.incoRequest('queryone', '169399116994992a4339668b6fe5ed5864776d3af2af11e', { id: mbid })

                const config = JSON.parse(moduleConfig.drpzxx)
                const yxdrzd = config.yxdrzd// 获取已选导入字段的信息
                if (yxdrzd.length === 0) {
                    this.$Message.error('没有配置导入字段')
                    return
                }
                await this.getDmList(config.dmList) // 获取代码表内容
                let drlx = ''
                let configList = []
                if (this.configdata.drlx) {
                    drlx = this.configdata.drlx
                    configList = config.module_config // 获取导入模板的配置信息，有bm，requiredZd，fieldConfig，
                } else {
                    drlx = this.configdata.importDataType
                    configList = this.computeConfigList(config, moduleConfig)
                }
                const firstBm = configList[0].bm // 第一个表的表名
                const firstB_requied_zd = configList[0].requiredZd.zdm // 第一个表中必导字段
                const newdata_list = await this.first_handleData(data, configList, drlx)
                await this.verify_data(newdata_list, configList, drlx)
                const qp_list = this.qp_data(newdata_list, firstBm, firstB_requied_zd, drlx, configList)
                const final_result = this.handle_result(qp_list, configList)
                if (final_result.errorlist.length > 0) {
                    this.childProps.drtssz = config.drtssz
                    this.childProps.config = configList
                    const columns = this.computeErrColumns(config)
                    this.childProps.columns = columns
                    const errorlist1 = this.handle_errorlist(final_result.errorlist, datalist, config.fieldsConfig, configList)
                    const errorlist = JSON.parse(JSON.stringify(errorlist1))
                    this.childProps.errorlist = errorlist
                    this.showlist = true
                    this.commonsJs.spin('', 'hide', this)
                }
                if (final_result.successlist.length > 0) {
                    const final_list = this.get_finalList(final_result.successlist, configList)
                    await this.import_to_database(final_list, config.drtssz, drlx)

                    // 刷新对象变量
                    if (this.configdata.refreshObject) {
                        const refreshList = this.configdata.refreshObject.split(',')
                        refreshList.forEach(item => {
                            if (this.configdata.drlx) this.configdata.dyref[item].query()
                            else this.ref[item].query()
                        })
                    }
                    this.commonsJs.spin('', 'hide', this)
                } else {
                    this.$Message.warning('没有能导入的数据')
                    this.commonsJs.spin('', 'hide', this)
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
                let lastdata = {}
                for (let index = 0; index < data.length; index++) {
                    const item = data[index]
                    if (index > 0) lastdata = arr[index - 1]
                    let data_obj = {}
                    data_obj = await handleDataItem(item, configlist, drlx, this, lastdata, index)
                    arr.push(data_obj)
                }
                return arr
                // 处理每条data的数据
                async function handleDataItem (data, configlist, drlx, _this, lastdata, rowindex) {
                    const newdata_item = { inco_import_id: _this.commonsJs.sys_guid(), _rownum_: data.__rowNum__ }
                    // 循环表名
                    for (let itemIndex = 0; itemIndex < configlist.length; itemIndex++) {
                        const item = configlist[itemIndex]
                        // 循环表内的字段名
                        item.fieldConfig.forEach((field) => {
                            const new_zdm = field.bm_zdm
                            if (drlx === 'add') {
                                if (field.hqsjfs === 'import') { newdata_item[new_zdm] = data[field.lm] } // 此处校验导入字段长度或数据值（如果是数字的化）
                                else if (field.hqsjfs === 'gdz') { newdata_item[new_zdm] = field.gdz }// 此处校验导入字段长度或数据值（如果是数字的化）
                                else if (field.hqsjfs === 'param') { newdata_item[new_zdm] = _this.propstocomponent[field.crcsblm] } else if (field.hqsjfs === 'sys_guid') { newdata_item[new_zdm] = _this.commonsJs.sys_guid() } else if (field.hqsjfs === 'sysdate') {
                                    const date = new Date()
                                    newdata_item[new_zdm] = date.toLocaleString()
                                } else if (field.hqsjfs === 'changeIntoDm') {
                                    if (field.kfwk == '0' && !data[field.lm]) newdata_item[new_zdm] = ''
                                    else if (_this.dmlist[field.zdm] && _this.dmlist[field.zdm].length > 0) {
                                        const mc = data[field.lm]
                                        const list = _this.dmlist[field.zdm]
                                        let dm = ''
                                        let dmflag = false
                                        const verify_dm = _this.verify_dm(mc, list)
                                        dmflag = verify_dm.flag
                                        for (let i = 0; i < list.length; i++) {
                                            if (list[i].label === mc) {
                                                dm = list[i].value
                                                dmflag = true
                                                break;
                                            }
                                        }
                                        if (dmflag) { newdata_item[new_zdm] = verify_dm.dmstr } else {
                                            newdata_item.flag = 'error'
                                            if (!newdata_item[`${item.bm}_error_list`]) newdata_item[`${item.bm}_error_list`] = []
                                            const error = `表名为：${field.bm},行号为${newdata_item._rownum_}，列名为：${field.lm},值为：${data[field.lm] ? data[field.lm] : '“空值”'}不在代码表中；`
                                            newdata_item[`${item.bm}_error_list`].push({ rownum: newdata_item._rownum_, content: error })
                                        }
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
                                if (field.hqsjfs === 'changeIntoDm') {
                                    if (field.kfwk == '0' && !data[field.lm]) newdata_item[new_zdm] = ''
                                    else if (_this.dmlist[field.zdm] && _this.dmlist[field.zdm].length > 0) {
                                        const mc = data[field.lm]
                                        const list = _this.dmlist[field.zdm]
                                        const dm = ''
                                        let dmflag = false
                                        const verify_dm = _this.verify_dm(mc, list)
                                        dmflag = verify_dm.flag
                                        if (dmflag) { newdata_item[new_zdm] = verify_dm.dmstr } else {
                                            newdata_item.flag = 'error'
                                            if (!newdata_item[`${item.bm}_error_list`]) newdata_item[`${item.bm}_error_list`] = []
                                            const error = `表名为：${field.bm},行号为${newdata_item._rownum_}，列名为：${field.lm},值为：${data[field.lm] ? data[field.lm] : '“空值”'}不在代码表中；`
                                            newdata_item[`${item.bm}_error_list`].push({ rownum: newdata_item._rownum_, content: error })
                                        }
                                    }
                                }
                            }
                        })
                        const eachBmImportFlag = _this.get_required_zd_status(newdata_item, item.bm, item.requiredZd, item.fieldConfig, rowindex)
                        newdata_item[`${item.bm}_isRequiredImportData`] = eachBmImportFlag.isRequiredImportData
                        if (eachBmImportFlag.isRequiredImportData == 'import') {
                            if (newdata_item[`${item.bm}_error_list`] && newdata_item[`${item.bm}_error_list`].length > 0) {
                                newdata_item[`${item.bm}_isRequiredImportData`] = 'error'
                            }
                        }
                        if (eachBmImportFlag.isRequiredImportData == 'empty') {
                            item.fieldConfig.forEach(field => {
                                const new_zdm = field.bm_zdm
                                if (itemIndex < configlist.length - 1) newdata_item[new_zdm] = lastdata[new_zdm]
                            })
                            if (rowindex > 0) newdata_item[`${item.bm}_error_list`] = []
                            newdata_item[`${item.bm}_isRequiredImportData`] == 'empty'
                        }
                        if (eachBmImportFlag.isRequiredImportData == 'error') {
                            newdata_item.error = 'error'
                            if (newdata_item[`${item.bm}_error_list`] && newdata_item[`${item.bm}_error_list`].length > 0) {
                                newdata_item[`${item.bm}_error_list`] = newdata_item[`${item.bm}_error_list`].concat(eachBmImportFlag.error)
                            } else { newdata_item[`${item.bm}_error_list`] = eachBmImportFlag.error }
                        }
                        await _this.verify_field(newdata_item, item, _this)
                    }
                    return newdata_item
                }
            },
            /**
             * 此功能用于校验代码是否存在，并解决导入数据多代码情形
             * @param {*} mc 导入的数据
             * @param {*} list 该字段的代码表的list
             */
            verify_dm (mc, list) {
                if (!mc) return { flag: false, dmstr: '' }
                const dm_list = []
                mc = mc + ''
                const dm_mc = mc.split(',')
                let flag = true
                for (let j = 0; j < dm_mc.length; j++) {
                    let exist = false
                    for (let i = 0; i < list.length; i++) {
                        if (list[i].label === dm_mc[j]) {
                            dm_list.push(list[i].value)
                            exist = true
                            break;
                        }
                    }
                    if (!exist) {
                        flag = false
                        break;
                    }
                }
                return { flag, dmstr: dm_list.join(',') }
            },
            /** 判断item_data 必填字段是否有完整数据
             * 1、如果必导字段全为空，如果有一个为空，还有必导字段内容，则报错并输入报错信息
             */
            get_required_zd_status (item_data, bm, required_zd, fields, rowindex) {
                let isRequiredImportData = 'import' // 所有必导字段都不为空
                const error = []
                for (let i = 0; i < required_zd.length; i++) {
                    const zdm = `${bm}__inco__${required_zd[i].zdm}`
                    let field_data = item_data[zdm]
                    if (typeof field_data === 'number') field_data = field_data.toString()
                    // 判断必填数据是否为空
                    if (!field_data || !field_data.trim()) {
                        isRequiredImportData = 'empty'
                        error.push({ rownum: item_data._rownum_, content: `表名为：${bm},行号为${item_data._rownum_},列为“${required_zd[i].lm}”导入内容不能为空；` })
                    }
                }
                let flag = false
                // 如果必导字段为空，则判断是否有字段，如果有一个字段不为空，则报错
                if (isRequiredImportData === 'empty') {
                    for (let i = 0; i < fields.length; i++) {
                        const bm_zdm = fields[i].bm_zdm
                        let fielddata = item_data[bm_zdm]
                        if (typeof fielddata === 'number') fielddata = fielddata.toString()
                        if (fielddata && (fields[i].hqsjfs == 'import' || fields[i].hqsjfs == 'changeIntoDm')) {
                            isRequiredImportData = 'error'
                            flag = true
                            break
                        }
                    }
                }

                if (rowindex == 0 && isRequiredImportData == 'empty') isRequiredImportData = 'error'
                const returnValue = { isRequiredImportData, oneRequiredDataEmpty: flag, error }
                return returnValue
            },
            /** 把每个字段校验和数据唯一性校验分开处理，
             * 校验每个字段的合法性
             */
            async verify_field (field_data, item, _this) {
                if (!field_data[item.bm + '_isRequiredImportData']) return // 如果不是必填的数据，则不需要校验
                const row = field_data
                if (!row[`${item.bm}_error_list`]) row[`${item.bm}_error_list`] = []
                for (let i = 0; i < item.fieldConfig.length; i++) {
                    const field = item.fieldConfig[i]
                    // 判断是否非空字段校验
                    // 校验字段类型的必须校验
                    if (row[field.bm_zdm]) {
                        if (!row[`${item.bm}_error_list`]) row[`${item.bm}_error_list`] = []
                        switch (field.zdlx.toLowerCase()) {
                        case 'varchar2':
                            if (typeof row[field.bm_zdm] === 'string') row[field.bm_zdm] = row[field.bm_zdm].trim()
                            if (typeof row[field.bm_zdm] === 'number') row[field.bm_zdm] = row[field.bm_zdm].toString()
                            let verifyStrLengthResult = this.commonsJs.verifyStrLength(row[field.bm_zdm], field.zdcd)
                            if (!verifyStrLengthResult.flag) {
                                row.flag = 'error'
                                const error = `表名为：${field.bm}，第${row._rownum_}行,列名为"${field.lm}"的长度为${verifyStrLengthResult.length}，超出数据库字段长度${field.zdcd}`
                                // row.error_list.push(error)
                                row[`${item.bm}_error_list`].push({ rownum: row._rownum_, content: error })
                            }
                            break;
                        case 'nchar':
                            verifyStrLengthResult = this.commonsJs.verifyStrLength(row[field.bm_zdm], field.zdcd)
                            if (!verifyStrLengthResult.flag) {
                                row.flag = 'error'
                                const error = `表名为：${field.bm}，第${row._rownum_}行,列名为"${field.lm}"的长度为${verifyStrLengthResult.length}，超出数据库字段长度${field.zdcd}`
                                // row.error_list.push(error)
                                row[`${item.bm}_error_list`].push({ rownum: row._rownum_, content: error })
                            }
                            break;
                        case 'char':
                            verifyStrLengthResult = this.commonsJs.verifyStrLength(row[field.bm_zdm], field.zdcd)
                            if (!verifyStrLengthResult.flag) {
                                row.flag = 'error'
                                const error = `表名为：${field.bm}，第${row._rownum_}行,列名为"${field.lm}"的长度为${verifyStrLengthResult.length}，超出数据库字段长度${field.zdcd}`
                                // row.error_list.push(error)
                                row[`${item.bm}_error_list`].push({ rownum: row._rownum_, content: error })
                            }
                            break;
                        case 'number':
                            if (parseFloat(row[field.bm_zdm]).toString() == 'NaN') {
                                row.flag = 'error'
                                const error = `表名为：${field.bm}，第${row._rownum_}行,列名为"${field.lm}"不是数字`
                                // row.error_list.push(error)
                                row[`${item.bm}_error_list`].push({ rownum: row._rownum_, content: error })
                            }
                            break;
                        case 'date':
                            let flag = false;
                            if (isNaN(row[field.bm_zdm]) && !isNaN(Date.parse(row[field.bm_zdm]))) {
                                flag = true;
                                row[field.bm_zdm] = this.formatDate(row[field.bm_zdm])
                            }
                            if (!flag) {
                                row.flag = 'error'
                                const error = `表名为：${field.bm}，第${row._rownum_}行,列名为"${field.lm}"不是日期格式`
                                // row.error_list.push(error)
                                row[`${item.bm}_error_list`].push({ rownum: row._rownum_, content: error })
                            }
                            break;
                        default:
                        }
                        if (row.flag != 'error' && field.jyfs == 'date') {
                            const date = this.formatDate(row[field.bm_zdm])
                            row[field.bm_zdm] = date
                        }
                    }
                }
            },
            formatDate (numb, format = '-') {
                const time = new Date(Date.parse(numb))
                // 修正为北京时区
                if (numb.indexOf('T') != -1) time.setTime(time.getTime() + (time.getTimezoneOffset() * 60000));
                const year = time.getFullYear();
                const month = time.getMonth() + 1;
                const date = time.getDate();
                const hours = time.getHours();
                const minutes = time.getMinutes();
                const seconds = time.getSeconds();
                return `${year}${format}${(month < 10 ? '0' + month : month)}${format}${(date < 10 ? '0' + date : date)} ${(hours < 10 ? '0' + hours : hours)}:${(minutes < 10 ? '0' + minutes : minutes)}:${(seconds < 10 ? '0' + seconds : seconds)}`;
            },
            /**
             * 校验数据的唯一性，以100条数据为一组，分组校验，并在原数据上标注错误数据
             */
            async verify_data (datalist, config, drlx) {
                if (!config || config.length == 0) return
                let flag = false
                for (let i = 0; i < config.length; i++) {
                    const item = config[i]
                    if (item.primarykeylist && item.primarykeylist.length > 0) {
                        flag = true
                        break
                    }
                }
                if (!flag) return
                const data = JSON.parse(JSON.stringify(datalist))
                const data_arr = []
                let verify_result = []
                while (data.length > 0) {
                    let index = 0
                    const length = 101
                    const temparr = []

                    while (data.length > 0 && index < length) {
                        index++
                        temparr.push(data[0])
                        data.splice(0, 1)
                    }
                    data_arr.push(temparr)
                }
                let sqlid = ''
                if (drlx === 'add') sqlid = 'import_verify_data'
                if (drlx === 'update') sqlid = 'import_verify_data_update'
                for (let i = 0; i < data_arr.length; i++) {
                    const res = await this.commonsJs.incoRequest('querylist', sqlid, { datalist: data_arr[i], config })
                    verify_result = verify_result.concat(res)
                }
                verify_result.forEach((verifydata) => {
                    datalist.forEach((dataitem) => {
                        if (dataitem._rownum_ == verifydata.row_num) {
                            dataitem.flag = 'error'
                            if (!dataitem[verifydata.bm + '_error_list']) dataitem[verifydata.bm + '_error_list'] = []
                            dataitem[verifydata.bm + '_error_list'].push({ rownum: verifydata.row_num, content: verifydata.error })
                        }
                    })
                })
            },

            qp_data (list, firstBm, firstB_requied_zd, drlx, configList) {
                if (list.length == 0) return []
                const data_qp_list = []
                let qp_item = []
                // let first = true
                const newdata_list = JSON.parse(JSON.stringify(list))
                if (newdata_list[0][firstBm + '_isRequiredImportData'] == 'empty') newdata_list[0][firstBm + '_isRequiredImportData'] = 'error'
                // 将数据切片
                let indexnum = 0 // 为防止死循环，最大插入数据不允许超过10000条记录
                // qp_item.push(list[0])
                while (newdata_list.length > 0) {
                    const rowdata = newdata_list[0]
                    for (let index = 0; index < configList.length; index++) {
                        const item = configList[index]
                        const required = rowdata[item.bm + '_isRequiredImportData']
                        rowdata.qp_bm = item.bm
                        if (required === 'import' || required === 'error') qp_item.push({ ...rowdata })
                    }
                    newdata_list.splice(0, 1)
                    if (!newdata_list[0]) {
                        data_qp_list.push(qp_item)
                        break;
                    }
                    const required = newdata_list[0][firstBm + '_isRequiredImportData']
                    if (required === 'import' || required === 'error') {
                        data_qp_list.push(qp_item)
                        qp_item = []
                    }
                    indexnum++
                    if (indexnum > 10000) break
                }

                return data_qp_list
            },
            // 将切片每条导入数据的数组继续分组成一组的导入数据,将原来表名_字段名的数据还原回与真实字段对应，并对每条数据
            // 增加对应导入的字段等相关信息
            get_finalList (list, configList) {
                // 处理表导入数据条
                const final_list = []
                list.forEach((qp_list) => {
                    const fieldList = []
                    qp_list.forEach((row, index) => {
                        configList.forEach((bmlist) => {
                            const flagMark = `${bmlist.bm}_isRequiredImportData`
                            const flag = row[flagMark]
                            if (flag == 'import' && bmlist.bm === row.qp_bm) {
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
                                fieldList.push(obj)
                            }
                        })
                    })
                    final_list.push(fieldList)
                })
                return final_list
            },

            async import_to_database (final_import_data, final_drtssz, drlx) {
                const final_list = JSON.parse(JSON.stringify(final_import_data))
                // this.$Spin.show()
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
                const promiseList = []
                if (arr.length > 0) {
                    for (let i = 0; i < arr.length; i++) {
                        const item = arr[i]
                        if (drlx == 'add') promiseList.push(this.commonsJs.incoRequest('insert', 'import_to_database_sql', { list: item.dataList }))
                        // 更新导入数据，需要给后台传入数据，更新字段和表的主键
                        if (drlx == 'update') promiseList.push(this.commonsJs.incoRequest('update', 'import_excel_to_database_update', { list: item.dataList }))
                    }
                }
                await Promise.all(promiseList).then((result) => {
                    this.commonsJs.spin('', 'hide', this)
                    if (!this.configdata.importSuccessMsg || this.configdata.importSuccessMsg == '1') this.$Message.success('导入成功')
                    this.successed_import = true
                    // 导入完成方法
                    if (this.configdata.afterImport && this.successed_import) this.commonsJs.funcEval(this, { data: final_import_data }, this.configdata.afterImport)
                }).catch((error) => {
                    this.commonsJs.spin('', 'hide', this)
                    this.$Message.success('导入失败')
                })
            },

            async getDmList (dmlist) {
                // 获取配置信息的代码表list
                if (dmlist) {
                    const dmlistSql = []
                    for (let i = 0; i < dmlist.length; i++) {
                        const zdConfig = dmlist[i]
                        if (zdConfig.dmlist && zdConfig.dmlist.length > 0) {
                            this.dmlist[zdConfig.zdm] = zdConfig.dmlist
                        } else if (zdConfig.dmbm && zdConfig.dm && zdConfig.mc) {
                            const obj = { listBm: zdConfig.dmbm, listDm: zdConfig.dm, listMc: zdConfig.mc }
                            // 将多个请求合并成到dmlistSql数组中，在下面的进行一次性请求
                            const sqlConfig = { sqlid: 'DC37EB84F52E3520E0555943CA7634DE', blm: zdConfig.zdm, type: 'querylist', param: obj }
                            dmlistSql.push(sqlConfig)
                        }
                    }
                    if (dmlistSql.length > 0) {
                        const res = await this.commonsJs.multiquery(dmlistSql)
                        this.dmlist = { ...this.dmlist, ...res }
                    }
                }
            },
            handle_result (list, configList) {
                const successlist = []
                const errorlist = []
                for (let i = 0; i < list.length; i++) {
                    const item = list[i]
                    let error = false
                    outer:for (let j = 0; j < item.length; j++) {
                        const row = item[j]
                        for (let k = 0; k < configList.length; k++) {
                            const bm = configList[k].bm
                            if (row[bm + '__isRequiredImportData'] === 'error' || (row[bm + '_error_list'] && row[bm + '_error_list'].length > 0)) {
                                error = true
                                break outer
                            }
                        }
                    }
                    if (error) errorlist.push(item)
                    else successlist.push(item)
                }
                return { successlist, errorlist }
            },
            computeConfigList (param, param1) {
                const bmList = param1.bm.split(',')
                const fieldsConfig = []
                param.yxdrzd.forEach((item) => {
                    const temp_item = { ...item }
                    if (temp_item.zdConfig) {
                        const zdConfig = JSON.parse(temp_item.zdConfig)
                        delete temp_item.zdConfig
                        const param = { ...temp_item, ...zdConfig }
                        fieldsConfig.push(param)
                    }
                })
                const module_config = []
                const dmList = []
                bmList.forEach((bm) => {
                    const bObj = { bm }
                    const fieldConfig = []
                    const requiredZd = []
                    const updateList = []
                    const primarykeylist = []
                    const update_primaryKeyList = []
                    const verifyFields = []
                    fieldsConfig.forEach((row) => {
                        const temp_zdm = row.zdm
                        if (!row.dcblm) { row.dcblm = row.zdm }
                        if (row.bm === bm) {
                            row.bm_zdm = `${bm}__inco__${row.zdm}`
                            row.key = `${bm}__inco__${row.zdm}`
                            row.title = row.lm
                            fieldConfig.push(row)
                            if (row.hqsjfs === 'import') {
                                if (row.kfwk === '1') {
                                    row.required_zd = '1'
                                    requiredZd.push({ zdm: row.zdm, lm: row.lm })
                                }
                            }
                            if (row.jyfs === 'verifyfield') verifyFields.push({ zdm: row.zdm, bm_zdm: row.bm + '__inco__' + row.zdm })
                            if (row.hqsjfs === 'changeIntoDm') dmList.push(row)
                            // 计算主键和update数据
                            if (row.sfzj === '1') {
                                primarykeylist.push({ zdm: row.zdm, bm_zdm: row.bm + '__inco__' + row.zdm })
                                update_primaryKeyList.push({ zdm: row.zdm, bm_zdm: row.bm + '__inco__' + row.zdm })
                            } else {
                                if (row.dclx && row.dclx.length > 0) {
                                    let flag = false
                                    row.dclx.forEach((dclx_item) => { if (dclx_item == 'export_for_update') flag = true })
                                    if (flag) updateList.push(row.zdm)
                                }
                            }
                        }
                    })
                    bObj.fieldConfig = fieldConfig
                    bObj.requiredZd = requiredZd
                    bObj.primarykeylist = primarykeylist
                    bObj.updateList = updateList
                    bObj.update_primaryKeyList = update_primaryKeyList
                    bObj.verifyFields = verifyFields
                    module_config.push(bObj)
                })
                return module_config
            },
            computeErrColumns (config) {
                const columns = [{ key: '_rownum_', title: '序号', header: '序号' }]
                config.fieldsConfig.forEach((item) => {
                    if (item.hqsjfs === 'import' || item.hqsjfs === 'changeIntoDm') columns.push({ key: item.key, title: item.title, header: item.title })
                })
                columns.push({ key: 'error', title: '错误信息', header: '错误信息' })
                return columns
            },
            handle_errorlist (list, datalist, fieldsConfig, configList) {
                if (list.length == 0) return []
                const resuleList = []
                list.forEach((item) => {
                    item.forEach((item1) => {
                        if (!item1.error_list) item1.error_list = []
                        const sourceRow = datalist.filter((item2) => { return item2.__rowNum__ === item1._rownum_ })[0]
                        fieldsConfig.forEach((item2) => {
                            item1[item2.key] = sourceRow[item2.title]
                        })
                        let flag = true
                        for (let i = 0; i < resuleList.length; i++) {
                            if (item1._rownum_ === resuleList[i]._rownum_) {
                                flag = false
                                break
                            }
                        }
                        for (let i = 0; i < configList.length; i++) {
                            if (item1[configList[i].bm + '_error_list'] && item1[configList[i].bm + '_error_list'].length > 0) {
                                item1.error_list = item1.error_list.concat(item1[configList[i].bm + '_error_list'])
                            }
                        }
                        if (flag) {
                            resuleList.push({ ...item1 })
                        }
                    })
                })
                return resuleList
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
