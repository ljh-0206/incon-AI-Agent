<template>
    <div>
        <Button v-if="env()" @click="test">test</Button>
        <i-form :model="data" :disabled="formDisabled" v-bind="computedFormAttrs($attrs)" :id="zjConfigdata.blm"  ref="form" label-position="top">
            <Row style="width:100%" class="formlist" :gutter="12" v-for="(formdataItem, formdataIndex) in data.datalist" :key="zjConfigdata.blm + formdataIndex">
                <Icon type="md-close" class="delicon" size="24" color="red" @click="handleDeleteData(formdataItem,formdataIndex)" v-if="!formDisabled"></Icon>
                <template v-for="(item, index) in zjConfigdata.fields">
                    <i-col v-if="item.componentType == 'date-picker' && computeKyf(item, formdataItem, formdataIndex)"
                        style="width:100%" :span="item.colspan"
                        :key="item.blm + index + formdataIndex + 'date-picker'">
                        <form-item style="margin-bottom: 24px;"
                            :ref="'formitem_' + item.blm" :prop="`datalist.${formdataIndex}.${item.blm}`" :rules="rules[item.blm]">
                            <template #label><span :style="computeLabelStyle(item, formdataItem)">{{ item.label }}</span></template>
                            <date-picker :ref="item.blm" :id="item.blm+ formdataIndex+index"
                                :class="componentClass[item.blm]" :model-value="formdataItem[item.blm]"
                                :editable="false"
                                :style="computeItemStyle(item, formdataItem, formdataIndex)" style="width: 100%;"
                                v-bind="computeItemAttrs(item, formdataItem, formdataIndex)"
                                @on-blur="handleBlur(item, formdataItem, $event, formdataIndex)"
                                @on-change="handleChange(item, formdataItem, $event, formdataIndex)"
                                @on-open-change="openDatePicker(item, formdataItem, $event, formdataIndex)"
                                ></date-picker>
                        </form-item>
                    </i-col>
                    <i-col v-else-if="computeKyf(item, formdataItem, formdataIndex)"
                        :span="item.colspan ? item.colspan : 24"
                        :key="'formItem4' + _uid + index + item.blm+ formdataIndex">
                        <form-item style="margin-bottom: 24px;"
                            :ref="'formitem_' + item.blm" :prop="`datalist.${formdataIndex}.${item.blm}`" :rules="computeRules(item)">
                            <template #label><span :style="computeLabelStyle(item, formdataItem)">{{ item.labelWidth==-1?'':item.label }}</span></template>
                            <component :is="item.componentType" :id="item.blm" :ref="item.blm" :fathername="componentName"
                                :propstocomponent="propstochild[item.blm]" :opentype="opentype" v-model="formdataItem[item.blm]"
                                 :configdata="item" :list="list[item.blm]" style="width: 100%;"
                                 v-bind="computeItemAttrs(item,formdataItem, formdataIndex)"
                                 :style="computeItemStyle(item, formdataItem, formdataIndex)"
                                @on-blur="handleBlur(item, formdataItem, $event, formdataIndex)"
                                @on-change="handleChange(item, formdataItem, $event, formdataIndex)"
                                @click.stop="handleClick(item, formdataItem, $event)"
                                >
                                <template v-if="item.xscontent != '0'">
                                    {{ item.content ? item.content : formdataItem[item.blm] }}
                                </template>
                            </component>
                        </form-item>
                    </i-col>
                </template>
            </Row>
        </i-form>
        <Button type="dashed" long class="add" @click="handleAdd" v-if="!formDisabled">添加</Button>
    </div>
</template>
<script>

    import { mapState } from 'vuex';

    export default {
        name: 'formlist',
        props: {
            index: { type: Number },
            modelValue: { type: Array },
            opentype: { type: String, default: 'show' },
            configdata: { type: Object, default: () => ({}) },
            propstocomponent: { type: Object, default: () => ({}) },
            fathername: { type: String }
        },
        data () {
            return {
                ref: this.$root.componentRefs,
                data: { datalist: [] },
                zjConfigdata: {},
                attrs: {},
                rules: {},
                list: {},
                propstochild: {},
                componentName: '',
                componentClass: {},
                componentList: {},
                vif: {},
                vshow: {},
                triggleList: [],
                triggleByFatherObject: {}, // 有那些下拉框是由父级触发的
                triggleDatePicker: []// 有级联的日期框
            }
        },
        methods: {
            test () {
                console.log(this.zjConfigdata, 'zjConfigdata')
                console.log(this.data.datalist, 'data')
                console.log(this.rules, 'rules')
                console.log(this, 'this')
            },
            env () {
                let returnValue = false
                const str = localStorage.getItem('incoenv')
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1) returnValue = true
                return returnValue
            },
            computedFormAttrs (attr) {
                return attr || {}
            },
            computeItemStyle (item, data) {
                let style = item.style || {}
                // if (this.style[data.id] && this.style[data.id][item.blm]) style = { ...style, ...this.style[data.id][item.blm] }
                if (item.styleMethod) {
                    const funcEval = new Function('_this', 'obj', item.styleMethod)
                    const styleEnv = funcEval(this, { item, value: data[item.blm], data }) // 执行内部方法
                    style = { ...style, ...styleEnv }
                }
                return style
            },
            computeLabelStyle (item, data) {
                let style = item.labelStyle || {}
                if (item.labelStyleMethod) {
                    const funcEval = new Function('_this', 'obj', item.labelStyleMethod)
                    const styleEnv = funcEval(this, { item, value: data[item.blm], data }) // 执行内部方法
                    style = { ...style, ...styleEnv }
                }
                return style
            },
            computeItemAttrs (item, data) {
                let attrs = item.attrs || {}
                Object.assign(attrs, this.attrs[item.blm] || {})
                if (this.attrs[data.id] && this.attrs[data.id][item.blm]) attrs = { ...attrs, ...this.attrs[data.id][item.blm] }
                if (item.attrsMethod) {
                    const funcEval = new Function('_this', 'obj', item.attrsMethod)
                    const attrsEnv = funcEval(this, { item, value: data[item.blm], data }) // 执行内部方法
                    attrs = { ...attrs, ...attrsEnv }
                }
                return attrs
            },
            /**
             * 计算组件渲染条件
             * @param {*} item
             */
            computeKyf (item, data, index) {
                if (item.kyf === '0') return false
                let returnValue = this.vif[item.blm];
                if (item.condition) {
                    try {
                        const funcEval = new Function('_this', 'obj', item.condition)
                        returnValue = funcEval(this, { item, data, index })
                    } catch { console.log('在formlist中的computeKyf方法中报错了：', item.blm, item) }
                }
                return returnValue
            },
            computeRules (item) {
                const rules = []
                if (item.required && item.required == '1') {
                    const changeRules = { required: true, type: 'string', message: item.label + ' 必填', trigger: 'change' }
                    const blurRules = { required: true, type: 'string', message: item.label + ' 必填', trigger: 'blur' }
                    const attrs = this.computeItemAttrs(item)
                    let isArray = false
                    if (item.multiple === 'true' || (item.attrs && item.attrs.multiple) || item.componentType === 'jcheckbox' || item.componentType === 'formlist' || item.componentType === 'formtable') {
                        isArray = true
                    }
                    if (attrs.type === 'daterange' || attrs.type === 'datetimerange') isArray = true
                    if (isArray) {
                        blurRules.type = 'array'
                        changeRules.type = 'array'
                    }
                    if (item.componentType === 'input-number' || item.componentType === 'InputNumber' || item.componentType === 'Rate') {
                        blurRules.type = 'number'
                        changeRules.type = 'number'
                    }
                    rules.push(blurRules)
                    if (item.componentType !== 'input-number' && item.componentType !== 'InputNumber') {
                        rules.push(changeRules)
                    }
                }
                return rules
            },
            isInputNumber (type) {
                return type === 'input-number' || type === 'InputNumber' || type === 'Input-Number'
            },
            /**
             * 设置组件的vif、vshow、style、attrs等信息
             * @param {*} item
             */
            setcomponentConfig (item) {
                if (item.style && Object.keys(item.style).length > 0) { this.styles[item.blm] = { ...item.style } }
                // if (item.attrs && Object.keys(item.attrs).length > 0) { this.attrs[item.blm] = { ...item.attrs } }
                if (item.vifCondition === '0') { this.vif[item.blm] = false } else { this.vif[item.blm] = true }
                // 如果配置配置了组件初始化显示，则配置组件初始化显示的值，不配置缺省为true
                if (item.isShow && item.isShow === '0') this.vshow[item.blm] = false
                else { this.vshow[item.blm] = true }
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
                    const fields = this.zjConfigdata.fields || []
                    fields.forEach((f) => {
                        this[conditionAndShow][f.blm] = !booleanType
                    })
                }
                for (let i = 0; i < arr.length; i++) {
                    await (this[conditionAndShow][arr[i]] = booleanType)
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

            // 执行配置方法
            async commitMethod (obj) { if (obj.method) await this.commonsJs.funcEval(this, obj, obj.method) },

            /**
             * 处理表单内组件点击方法
             * @param {*} item
             * @param {*} event
             */
            handleClick (item, data, event) {
                const obj = { item, data, value: event, blm: item.blm }
                if (item.click) obj.method = item.click
                if (item.clickInside) { this.commonsJs.funcEval(this, obj, item.clickInside); }
                this.$emit('commonMethod', obj)
                this.$emit('componentclick', obj)
            },
            /**
             * 处理表单内组件失去焦点的方法
             * @param {*} item
             * 注意：event传出的不是当前的值
             */
            handleBlur (item, data, event) {
                const obj = { item, data, value: event, blm: item.blm }
                if (item.blurInside) this.commonsJs.funcEval(this, obj, item.blurInside)
                if (item.blur) {
                    obj.method = item.blur
                    this.$emit('commonMethod', obj)
                }
            },
            /**
             * 处理表单组件数据变化时处理的方法
             * @param {*} item
             * @param {*} event
             */
            handleChange (item, data, event, index) {
                const obj = { item, data, value: event, blm: item.blm }
                if (item.componentType == 'date-picker' || item.componentType == 'DatePicker') { // 处理日期组件回显问题
                    if (Array.isArray(event) && (!event || !event[0])) event = []; // 由于type为datetimerange时清空，event会变为['','']导致必填校验失效
                    data[item.blm] = event
                    // 用于设置截至时间小于开始时间不可选
                    if (item.triggerObject) {
                        if (!data[item.blm] || data[item.blm] > data[item.triggerObject]) {
                            data[item.triggerObject] = ''
                        }
                        const kssj = new Date(event).getTime()

                        if (!this.attrs[data.id][item.triggerObject]) this.attrs[data.id][item.triggerObject] = {}
                        this.attrs[data.id][item.triggerObject].options = {}
                        this.attrs[data.id][item.triggerObject].options = {
                            disabledDate: function (date) { return date.valueOf() <= kssj - 86400000; }
                        }
                    }
                    if (item.triggerFatherName) {
                        const kssj = data[item.triggerFatherName]
                        const d = new Date(kssj)
                        const year = d.getFullYear()
                        const month = d.getMonth()
                        const day = d.getDate()
                        const hour = d.getHours()
                        const minute = d.getMinutes()
                        const second = d.getSeconds()
                        const jssj = data[item.blm]
                        const d2 = new Date(jssj)
                        const year2 = d2.getFullYear()
                        const month2 = d2.getMonth()
                        const day2 = d2.getDate()
                        const hour2 = d2.getHours()
                        const minute2 = d2.getMinutes()
                        const disabledHours = []
                        let disabledMinute = []
                        let disabledSeconds = []
                        if (year == year2 && month == month2 && day == day2) {
                            for (let i = 0; i < hour; i++) {
                                disabledHours[i] = i
                            }
                            for (let i = 0; i < minute; i++) {
                                disabledMinute[i] = i
                            }
                            for (let i = 0; i < second; i++) {
                                disabledSeconds[i] = i
                            }
                            if (hour == hour2) {
                                if (minute != minute2) {
                                    disabledSeconds = []
                                }
                            } else {
                                disabledMinute = []
                                disabledSeconds = []
                            }
                        }
                        if (!this.attrs[data.id][item.triggerFatherName]) this.attrs[data.id][item.triggerFatherName] = {}
                        this.attrs[data.id][item.triggerFatherName]['time-picker-options'] = {
                            'disabled-hours': disabledHours,
                            'disabled-minutes': disabledMinute,
                            'disabled-seconds': disabledSeconds
                        }
                    }
                }
                if (item.componentType == 'jselect') data[item.blm] = event
                if (item.componentType === 'jselect' && item.triggerObject) {
                    delete data[item.triggerObject]
                    this.getTriggerObjectList(item, item.triggerObject, item.blm);
                }

                if (item.changeInside) { this.commonsJs.funcEval(this, obj, item.changeInside); } // 组件数据变化内部执行方法
                if (item.change) {
                    obj.method = item.change
                    this.$emit('commonMethod', obj)
                }
                // if (item.componentType === "commonmultiselect" || item.componentType === "newmultiselect") {
                if (this.rules[item.blm] && item.blm && index !== undefined) {
                    const propPath = `datalist.${index}.${item.blm}`;
                    this.$nextTick(() => {
                        this.$refs.form.validateField(propPath);
                    });
                }
            // }
            },
            /**
             * 组件keypress的方法
             * @param {*} item
             * @param {*} event
             */
            handleKeypress (item, data, event) {
                // console.log(event,'handleKeyPress from jform')
                const keycode = event.key
                const obj = { item, value: event, data, blm: item.blm, keycode }
                if (item.keypressInside) {
                    this.commonsJs.funcEval(this, {}, item.keypressInside)
                }

                if (item.keypress) {
                    obj.method = item.keypress
                    this.$emit('commonMethod', obj)
                }
            // 处理日期组件回显问题
            },
            openDatePicker (item, data, flag, index) {
                if (flag) {
                    if (!data[item.blm] && item.triggerFatherName) {
                        data[item.blm] = data[item.triggerFatherName]
                        this.handleChange(item, data, data[item.blm], index)
                    }
                }
            },
            /**
             * 初始化下拉框、单选、多选、开关等数据
             */
            initList () {
                const sqlidList = []
                if (this.componentList.length > 0) {
                    this.componentList.forEach(item => {
                        if (!item.jlzdmc) {
                            // 此处为了将查询放到一次请求里进行处理
                            if (item.listType == '4' || (item.list && item.list.length > 0) || item.listMethod) {
                                this.getList(item)
                            } else if (item.listId) {
                                // listid查询
                                let obj = { ...this.propstocomponent, opentype: this.opentype }
                                if (item.cdqbsj === '1') obj = { ...obj, ...this.data.datalist } // 传递全部参数
                                sqlidList.push({
                                    sqlid: item.listId,
                                    blm: item.blm,
                                    type: 'querylist',
                                    param: obj,
                                    xlkitem: item// 此为了后续赋值使用，查询sql中用不到
                                })
                            } else if (item.listConfig && item.listConfig.listBm && item.listConfig.listDm && item.listConfig.listMc) {
                                // 代码表名查询
                                let obj = { ...item.listConfig, opentype: this.opentype, ...this.propstocomponent }
                                if (item.cdqbsj === '1') obj = { ...obj, ...this.data.datalist } // 传递全部参数
                                sqlidList.push({
                                    sqlid: 'DC37EB84F52E3520E0555943CA7634DE',
                                    blm: item.blm,
                                    type: 'querylist',
                                    param: obj,
                                    xlkitem: item// 此为了后续赋值使用，查询sql中用不到
                                })
                            }
                        }
                    })
                }

                // 使用sqlidList查询代码表数据
                if (sqlidList != null && sqlidList.length > 0) {
                    this.commonsJs.multiquery(sqlidList).then(res => {
                        sqlidList.forEach(item => {
                            const xlkitem = item.xlkitem
                            this.list[xlkitem.blm] = res[xlkitem.blm];
                            if (xlkitem.afterGetList) this.commonsJs.funcEval(this, { list: res[xlkitem.blm], data: this.data.datalist, item: xlkitem }, xlkitem.afterGetList)
                        })
                    })
                }
            },

            /**
             * 根据配置不同，调用不同的获取数据的方法
             * @param {*} item
             * @param {*} name
             */
            async getList (item, name = '') {
                if (name) this.getListByTrigger(item, name)
                else this.getListNoTrigger(item)
            },
            /**
             * 根据配置不同，调用不同的获取数据的方法_没级联
             * @param {*} item
             */
            async getListNoTrigger (item) {
                if (item.listType == '4') {
                    let list = this.$root.list[item.listBm]
                    if (!list) list = []
                    this.list[item.blm] = list
                } else if (item.list && item.list.length > 0) {
                    const newlist = await this.getListBySelf(item)
                    this.list[item.blm] = newlist
                } else if (item.listMethod) {
                    const newlist = this.commonsJs.funcEval1(this, { item, name: '' }, item.listMethod)
                    this.list[item.blm] = newlist
                }
            },
            /**
             * 根据配置不同，调用不同的获取数据的方法_级联
             * @param {*} item
             * @param {*} name
             */
            async getListByTrigger (item, name) {
                if (item.listType == '4') {
                    const source = this.data.datalist[name]
                    const sourceList = this.list[name]
                    const list = sourceList.filter(row => { return row.dm == source })[0].children
                    this.list[item.blm] = list
                } else if (item.listId) { this.getListById(item, name) } else if (item.listConfig && item.listConfig.listBm && item.listConfig.listDm && item.listConfig.listMc) this.getListByBm(item, name)
                else if (item.listMethod) {
                    const newlist = this.commonsJs.funcEval1(this, { item, name }, item.listMethod)
                    this.list[item.blm] = newlist
                }
            },

            // 自定义的list数据
            async getListBySelf (res) {
                let list = JSON.parse(JSON.stringify(res.list))
                for (let i = 0; i < list.length; i++) {
                    let item = list[i]
                    if (item.condition) { item = await this.commonsJs.funcEval(this, item, item.condition) }// 通过condition设置list的某条disabled
                }
                if (res.afterGetList) { list = await this.commonsJs.funcEval(this, { list: res.list, data: this.data.datalist, item: res }, res.afterGetList) }
                return list
            },
            /**
             * 通过配置的id值获取数据
             * @param {*} item
             * @param {*} name
             */
            getListById (item, name = '') {
                let obj = { ...this.propstocomponent, opentype: this.opentype }
                if (name) obj[name] = this.data.datalist[name]
                if (item.cdqbsj === '1') obj = { ...obj, ...this.data.datalist } // 传递全部参数
                this.commonsJs.incoRequest('querylist', item.listId, obj).then((res) => {
                    this.list[item.blm] = res;
                    if (item.afterGetList) this.commonsJs.funcEval(this, { list: res, data: this.data.datalist, item }, item.afterGetList)
                });
            },
            /**
             * 通过配置的表名、查询的字段名等获取数据
             * @param {*} item
             * @param {*} name
             */
            getListByBm (item, name = '') {
                let obj = { ...item.listConfig, opentype: this.opentype, ...this.propstocomponent }
                if (name) {
                    obj[name] = this.data.datalist[name]
                    obj.jldata = this.data.datalist[name]
                }
                if (item.cdqbsj === '1') obj = { ...obj, ...this.data.datalist } // 传递全部参数
                this.commonsJs.incoRequest('querylist', 'DC37EB84F52E3520E0555943CA7634DE', obj).then(
                    (res) => {
                        this.list[item.blm] = res;
                        if (item.afterGetList) this.commonsJs.funcEval(this, { list: res, data: this.data.datalist, item }, item.afterGetList)
                    }
                );
            },
            /**
             * 获取所有被触发的list数据，一般时自定义查询时，才单独调用
             */
            initTargetList () {
                if (this.triggleList.length > 0) {
                    this.triggleList.forEach((item) => {
                        this.getTriggerObjectList(item, item.triggerObject, item.blm)
                    })
                }
            },
            /**
             * 根据传入的源组件和目标组件，查询目标组件的数据，可多级级联，多级触发时，变量名用英文逗号隔开
             * @param {*} sourceItem
             * @param {*} targetName
             * @param {*} sourceItemName
             */
            getTriggerObjectList (sourceItem, targetName, sourceItemName) {
                const list = targetName.split(',')
                if (list && list.length > 0) {
                    list.forEach((item) => {
                        if (this.data.datalist[sourceItemName]) {
                            if (this.triggleByFatherObject[item]) { this.getList(this.triggleByFatherObject[item], sourceItemName) }
                        } else {
                            this.data.datalist[item] = ''
                            this.list[item] = []
                        }
                    })
                }
            },

            initDataPickTrigger () {
                if (this.triggleDatePicker.length > 0) {
                    this.triggleDatePicker.forEach(item => {
                        this.handleChange(item, this.data.datalist[item.blm])
                    })
                }
            },

            /**
             * 表单校验，包含表单自有的校验和自定义校验两个部分
             */
            async formValid () {
                let flag = false
                flag = await this.$refs.form.validate()
                if (flag) {
                    if (this.zjConfigdata.validMethod) {
                        const res = await this.commonsJs.funcEval(this, this.data.datalist, this.zjConfigdata.validMethod)
                        flag = res.flag
                    }
                }
                return flag
            },
            /**
             * 处理data里的数据，对于input类型的数据，利用trim()函数将前后空格去掉
             */
            trimString () {
                if (this.zjConfigdata.trimSpace !== '1') return
                if (this.zjConfigdata.fields && this.zjConfigdata.fields.length > 0) {
                    const list = this.commonsJs.treeToList(this.zjConfigdata.fields)
                    list.forEach((item) => {
                        if (item.componentType === 'i-input' || item.componentType === 'Input') {
                            if (this.data.datalist[item.blm] && typeof this.data.datalist[item.blm] === 'string') {
                                this.data.datalist[item.blm] = this.data.datalist[item.blm].trim()
                            }
                        }
                    })
                }
            },
            /**
             * 处理表单新增数据保存按钮
             * @param {*} btn 传递按钮的名字，用于保存是设置按钮为loadding
             */
            async handleAdd (item) {
                const id = this.commonsJs.sys_guid()
                const obj = { id }
                const fields = this.zjConfigdata.fields || []
                fields.forEach(field => {
                    if (this.isInputNumber(field.componentType)) obj[field.blm] = null
                })
                this.handleDefaultValue(obj)
                this.data.datalist.push(obj)
                this.attrs[id] = {}
            },
            /**
             * 处理缺省值，一般时在表单新增时调用
             * @param {*} force 如果参数为true：就是不管formData里面的变量是否有值，均将缺省值覆盖。
             *                  如果参数为false，formData里面有值的话，将不被初始化
             */
            handleDefaultValue (data) {
                if (this.zjConfigdata.fields && this.zjConfigdata.fields.length > 0) {
                    const list = this.zjConfigdata.fields
                    list.forEach((item) => {
                        if (item.defaultMethod) {
                            data[item.blm] = this.commonsJs.funcEval1(this, { item, data }, item.defaultMethod)
                        } else if (item.default || item.default === 0 || item.default === '0') {
                            if (!data[item.blm]) {
                                let defaultValue = item.default
                                if (this.isInputNumber(item.componentType)) {
                                    if (typeof item.default !== 'number') defaultValue = Number(item.default)
                                    else defaultValue = item.default
                                }
                                data[item.blm] = defaultValue
                            } // 如果data里面有数据，则不初始化
                        } else {
                            if (this.isInputNumber(item.componentType) && !data[item.blm] && data[item.blm] != 0) data[item.blm] = null
                        }
                    })
                }
            },
            handerInputNumberNullvalue (dataList, fields) {
                fields = fields || []
                dataList = dataList || []
                dataList.forEach(row => {
                    fields.forEach(field => {
                        if (this.isInputNumber(field.componentType) && !row[field.blm] && row[field.blm] !== 0) {
                            row[field.blm] = null
                        }
                    })
                })
            },
            changeStrToArray (dataList, fields) {
                fields = fields || []
                dataList = dataList || []
                dataList.forEach(row => {
                    fields.forEach(field => {
                        if (field.saveLx === 'str' && row[field.blm] && typeof row[field.blm] === 'string') {
                            row[field.blm] = row[field.blm].split(',')
                        }
                    })
                })
            },
            changeArrayToStr (dataList, fields) {
                fields = fields || []
                dataList = dataList || []
                dataList.forEach(row => {
                    fields.forEach(field => {
                        if (field.saveLx === 'str' && Array.isArray(row[field.blm])) {
                            row[field.blm] = row[field.blm].join(',')
                        }
                    })
                })
            },
            handleDeleteData (data, index) {
                this.$Modal.confirm({
                    title: '提示',
                    content: '确定要删除该条数据吗？',
                    onOk: () => {
                        delete this.attrs[data.id]
                        this.data.datalist.splice(index, 1)
                    },
                    onCancel: () => {
                    }
                });
            },
            /**
             * 处理表单编辑openType=‘edit’，编辑页面保存按钮
             * @param {*} item
             */

            getProps (str = '') {
                if (str) return this.propstochild[str]
                else return this.propstocomponent
            },
            setPropsToComponent (str = '', obj = {}, replace = true) {
                let arr = []
                if (str) { arr = str.split(',') } else { arr = (this.zjConfigdata.fields || []).map(f => f.blm) }
                arr.forEach((res) => {
                    let propsObj = {}
                    if (!replace) propsObj = { ...this.propstochild[res], ...obj } // 保留了原来 路由传递过来的 参数
                    else propsObj = obj // 如果replace设置为true，将替代原来的已保存的变量
                    this.propstochild[res] = propsObj
                })
                console.log(arr, this.propstochild, 'setPropsToComponent from jform.vue')
            },
            setProps (str = '', obj = {}, replace = true) {
                this.setPropsToComponent(str, obj, replace)
            },
            // 向根发送要触发执行的方法和数据
            triggerFunction (blm, method, obj) {
                this.$root.componentsParam[blm] = [{ blm, method, obj }]
            },
            // 此方法是用来根据triggerFunction，来触发本地的方法
            handleRootFunction (list) {
                if (list.length === 0) return
                const timer = setInterval(() => {
                    // 需要定时执行的代码
                    if (this.ref[this.zjConfigdata.blm] && this.$refs.form) {
                        clearInterval(timer)
                        list.forEach((item) => {
                            if (item.method && item.method.trim()) {
                                const funcEval = new Function('_this', 'obj', item.method)
                                funcEval(this, item.obj)
                            }
                        })
                    }
                }, 50)
            },
            /**
             * 根据formJson传进来的字段，进行初始化相关信息：主要包括：style、attrs、list、vif
             * 在formJson变化是调用
             */
            async createFields () {
                this.rules = this.zjConfigdata.rules || {}
                // await this.resetFields()
                this.list = {}
                this.vif = {}
                this.vshow = {}
                this.anchor = {}
                const fields = this.zjConfigdata.fields
                if (fields && fields.length > 0) {
                    let list = []
                    const componentList = []
                    const triggleList = []
                    list = fields
                    // this.formFieldList=list
                    for (let i = 0; i < list.length; i++) {
                        const item = list[i]
                        item.editable = this.configdata.editable
                        if (!this.rules[item.blm]) this.rules[item.blm] = []
                        if (item.required && item.required == '1') {
                            const changeRules = { required: true, message: item.label + ' 必填', trigger: 'change' }
                            const blurRules = { required: true, message: item.label + ' 必填', trigger: 'blur' }
                            if (item.multiple === 'true' || (item.attrs && item.attrs.multiple) || item.componentType === 'jcheckbox' || item.componentType === 'formtable') {
                                blurRules.type = 'array'; changeRules.type = 'array'
                            }
                            if (item.componentType === 'input-number' || item.componentType === 'InputNumber') {
                                blurRules.type = 'number'; changeRules.type = 'number'
                            }
                            this.rules[item.blm].push(blurRules)
                            this.rules[item.blm].push(changeRules)
                        }
                        // 处理表单校验方法
                        if (item.ruleMethod) {
                            const rule = this.commonsJs.funcEval1(this, {}, item.ruleMethod)
                            if (this.rules[item.blm] && this.rules[item.blm].length > 0) this.rules[item.blm] = this.rules[item.blm].concat(rule)
                            else this.rules[item.blm] = rule
                        }
                        // 处理表单校验规则
                        if (item.verify_rule && this.opentype != 'show') {
                            if (!this.rules[item.blm]) this.rules[item.blm] = []
                            this.rules[item.blm] = this.rules[item.blm].concat(this.commonsJs.validate(item.verify_rule, { length: item.rule_length, zz: item.rule_zz, message: item.rule_message }))
                        }
                        // 处理表单引用的自定义组件
                        if (item.yyzjmc) {
                            if (!this.$options.components) this.$options.components = {}
                            if (item.registerComponentMethod && item.registerComponentMethod.trim()) {
                                const zjxx = this.commonsJs.funcEval1(this, {}, item.registerComponentMethod)
                                this.$options.components[item.yyzjmc] = zjxx
                            } else { if (!this.$options.components[item.yyzjmc]) await this.commonsJs.localRegisterComponent([item.yyzjmc], this) }
                        }

                        this.$nextTick(() => {
                            this.setcomponentConfig(item)
                        })

                        if (item.componentType === 'jselect' || item.componentType === 'jradio' || item.componentType === 'jcheckbox' || item.componentType === 'jswitch') {
                            if (item.triggerObject) triggleList.push(item)
                            if (!item.jlzdmc) componentList.push(item)
                            else this.triggleByFatherObject[item.blm] = item
                        }
                        if (item.componentType === 'date-picker' && item.triggerObject) this.triggleDatePicker.push(item)
                    }

                    // 计算字段权限
                    this.$nextTick(() => {
                        if (this.zjConfigdata.fieldAuthMethod) {
                            const { vif, attrs } = this.commonsJs.funcEval1(this, {}, this.zjConfigdata.fieldAuthMethod)
                            if (vif && vif.length > 0) this.setvif(vif.join(','), false)
                            if (attrs && attrs.length > 0) {
                                attrs.forEach(item => {
                                    if (!this.attrs[item]) this.attrs[item] = { disabled: true }
                                    else this.attrs[item].disabled = true
                                })
                            }
                        }
                    })

                    this.componentList = componentList
                    this.triggleList = triggleList
                    this.initList()
                }
            },

            handleKeyDown (event) {
                // 检查是否按下了 Ctrl+S
                if (event.ctrlKey && event.key === 's' && this.$root.activeModal && this.$root.activeModal.length > 0) {
                    const activeModalName = this.$root.activeModal[0]
                    if (activeModalName == this.componentName) {
                        event.preventDefault();// 阻止浏览器默认的保存页面行为
                        if (this.zjConfigdata.keypressMethod && this.zjConfigdata.keypressMethod.trim()) this.commonsJs.funcEval(this, {}, this.zjConfigdata.keypressMethod)
                    }
                }
            }
        },
        watch: {
            propstocomponent: {
                handler (n, o) {
                    if (this.configdata.propsChangeMethod) this.commonsJs.funcEval1(this, {}, this.configdata.propsChangeMethod)
                },
                deep: true,
                immediate: true
            },
            modelValue: {
                handler (n, o) {
                    if (!this.modelValue) { this.data.datalist = [] } // 如果无值，将数据设置为空数组
                    else if (this.modelValue && this.modelValue.length == 0) { if (this.data.datalist.length != 0) this.data.datalist = [] }
                    else if (this.modelValue && this.modelValue.length == 1 && !this.modelValue[0]) { this.data.datalist = [] } // 这个是处理在modalForm里面用了resetFields，给form Table增加了一个[undefine]
                    else if (this.modelValue) {
                        const dataList = JSON.parse(JSON.stringify(this.modelValue))
                        this.changeStrToArray(dataList, this.configdata.fields)
                        this.handerInputNumberNullvalue(dataList, this.configdata.fields)
                        // 用数组形式与内部 datalist 比较，避免字符串/数组形式差异导致的死循环
                        if (JSON.stringify(dataList) !== JSON.stringify(this.data.datalist)) {
                            this.data.datalist = dataList
                        }
                    }
                },
                deep: true,
                immediate: true
            },
            data: {
                handler () {
                    const dataList = JSON.parse(JSON.stringify(this.data.datalist))
                    this.changeArrayToStr(dataList, this.configdata.fields)
                    // 只在结果与父组件 modelValue 不一致时才 emit，避免再次触发 modelValue watcher 形成死循环
                    if (JSON.stringify(dataList) !== JSON.stringify(this.modelValue)) {
                        this.$emit('update:modelValue', dataList)
                    }
                    if (this.configdata.dataChangeMethod) this.commonsJs.funcEval1(this, { data: this.data.datalist }, this.configdata.dataChangeMethod)
                },
                deep: true
            },
            configdata: {
                handler (n, o) {
                    console.log(n, 'configdata formlist')
                    if (n.blm) {
                        this.componentName = n.blm
                        this.$root.componentRefs[this.componentName] = this
                        this.zjConfigdata = this.commonsJs.deepClone(n)
                        if (n.addConfigdata) Object.assign(this.zjConfigdata, this.commonsJs.funcEval1(this, {}, n.addConfigdata))
                        if (n.createClass) this.commonsJs.loadCssCode(n.createClass, n.blm)
                        if (this.zjConfigdata.initMethod) this.commonsJs.funcEval1(this, {}, this.zjConfigdata.initMethod)
                    }
                },
                deep: true,
                immediate: true
            },
            'zjConfigdata.fields': {
                handler (n, o) {
                    this.createFields()
                },
                deep: true,
                immediate: true
            }

        },
        computed: {
            ...mapState('admin/user', ['info']),
            formDisabled () {
                if (this.opentype === 'show') return true
                else if (this.configdata.editable == '0') return true
                else return false
            }
        },
        mounted () { },
        created () { },
        beforeDestroy () {
            this.commonsJs.removeCssCode(this.configdata.blm)
        }
    }
</script>
<style scoped>
    .formlist{
        margin-bottom: 20px;
        border: solid 1px #e8eaec;
        padding: 20px;
        box-sizing: border-box;
        position: relative;
    }
    .formlist:hover {
        border: solid 1px rgb(123, 145, 247);
        .delicon{
            display:block;
        }
    }
    .formlist .delicon{
        position: absolute;
        right: 10px;
        top: 10px;
        cursor: pointer;
        display:none;
    }
    .add{
        margin-top: 8px;
        height: 40px;
        line-height: 40px;
        background-color: #fff990;
    }
</style>
