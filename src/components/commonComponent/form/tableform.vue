<template>
    <i-Form :id="configdata.blm" :ref="configdata.blm" :model="data" class="tableform"
        :class="'style-'+configdata.blm + ' ' + configdata.blm"
        :label-position="configdata.labelPosition ? configdata.labelPosition : 'right'"
        :label-width="configdata.labelWidth" onsubmit="return false"
        v-bind="computeFormAttrs()"
        :style="computeFormStyle()">
        <Button v-if="env()" @click="test" class="test">tableform test</Button>
        <!--按钮位置在左边-->
        <div style="display:flex;justify-content: space-between">
            <div :style="computeContentAndSearchStyle()">
                <Row v-if="configdata.colspan">
                    <i-col :span="configdata.colspan||8" v-for="(item, index) in configdata.fields" :key="'field'+item.blm">
                        <form-item
                            v-if="vif[item.blm] && (item.componentType!='Button' || (item.componentType=='Button' && item.anwz=='left')) && computeKyf(item)"
                            v-show="vshow[item.blm]" :key="'form-item' + _uid + index" :label-width="item.labelWidth"
                            :label="item.labelWidth ===-1 ? '' : item.mc ||item.label" :prop="item.blm" style="margin-bottom:0px">
                            <date-picker
                                v-if="item.componentType == 'date-picker'   && computeKyf(item)  && vif[item.blm]"
                                :ref="item.blm" :style="computeItemStyle(item)" :class="componentClass[item.blm]"
                                v-model="data[item.blm]" v-bind="computeItemAttrs(item)" :editable="false"
                                @on-change="handleChange(item, $event)"></date-picker>
                            <div v-else-if="item.componentType == 'span'&& computeKyf(item)  && vif[item.blm]"
                                :ref="item.blm" v-bind="computeItemAttrs(item)" :style="computeItemStyle(item)"
                                :class="componentClass[item.blm]"
                                v-html="item.content ? $xss(item.content) : $xss(data[item.blm])"
                                @click="handlecomponentclick(item, $event)">
                            </div>
                            <component v-else-if=" computeKyf(item)  && vif[item.blm]" :is="item.componentType"
                                :id="item.blm" :ref="item.blm" :key="item.blm+_uid+index" :fathername="componentName"
                                :propstocomponent="propstochild[item.blm]" v-model="data[item.blm]"
                                v-bind="computeItemAttrs(item)" :style="computeItemStyle(item)"
                                :class="componentClass[item.blm]" :configdata="item" :list="list[item.blm]"
                                @on-blur="handleBlur(item,$event)" @on-change="handleChange(item,$event)"
                                @keydown="handleKeypress(item,$event)"
                                @click="handlecomponentclick(item, $event)" v-on="computeComponentEvent(item)">
                                <Icon v-if="item.icon" :type="item.icon" :style="item.iconStyle" />
                                <span>{{ item.content ? item.content : data[item.blm] }}</span>
                            </component>
                        </form-item>
                    </i-col>
                </Row>
                <div v-else-if="existFields" style="display:flex;flex-wrap: wrap;" :style="computeContentStyle()">
                    <div v-for="(item, index) in configdata.fields" :key="'field'+item.blm">
                        <form-item
                            v-if="vif[item.blm] && (item.componentType!='Button' || (item.componentType=='Button' && item.anwz=='left')) && computeKyf(item)"
                            v-show="vshow[item.blm]" :key="'form-item' + _uid + index" :label-width="item.labelWidth"
                            :label="item.labelWidth ===-1 ? '' : item.mc ||item.label" :prop="item.blm" style="margin-bottom:0px">
                            <date-picker
                                v-if="item.componentType == 'date-picker'   && computeKyf(item)  && vif[item.blm]"
                                :ref="item.blm" :style="computeItemStyle(item)" :class="componentClass[item.blm]"
                                v-model="data[item.blm]" v-bind="computeItemAttrs(item)" :editable="false"
                                @on-change="handleChange(item, $event)"></date-picker>
                            <div v-else-if="item.componentType == 'span'&& computeKyf(item)  && vif[item.blm]"
                                :ref="item.blm" v-bind="computeItemAttrs(item)" :style="computeItemStyle(item)"
                                :class="componentClass[item.blm]"
                                v-html="item.content ? $xss(item.content) : $xss(data[item.blm])"
                                @click="handlecomponentclick(item, $event)">
                            </div>
                            <component v-else-if=" computeKyf(item)  && vif[item.blm]" :is="item.componentType"
                                :id="item.blm" :ref="item.blm" :key="item.blm+_uid+index" :fathername="componentName"
                                :propstocomponent="propstochild[item.blm]" v-model="data[item.blm]"
                                v-bind="computeItemAttrs(item)" :style="computeItemStyle(item)"
                                :class="componentClass[item.blm]" :configdata="item" :list="list[item.blm]"
                                @on-blur="handleBlur(item,$event)" @on-change="handleChange(item,$event)"
                                @keydown="handleKeypress(item,$event)"
                                @click="handlecomponentclick(item, $event)" v-on="computeComponentEvent(item)">
                                <Icon v-if="item.icon" :type="item.icon" :style="item.iconStyle" />
                                <span>{{ item.content ? item.content : data[item.blm] }}</span>
                            </component>
                        </form-item>
                    </div>
                </div>
                <div style="margin-left:10px" :style="computeSearchAreaStyle()">
                    <Button v-if="searchName" v-bind="computeSearchAttrs()"
                        :style="computeSearchButtonStyle('searchButtonStyle')" @click="handleSubmit()"
                        class="search_button">{{searchName}}</Button>
                    <Button v-if="configdata.reset==='1'" v-bind="computeResetAttrs()"
                        :style="computeSearchButtonStyle('resetButtonStyle')" class="ivu-ml-8 reset_button"
                        @click="handleReset()">重置</Button>
                    <a v-if="hideItem.length>0" v-font="14" :style="computeSearchButtonStyle('collapseButtonStyle')"
                        class="ivu-ml-8 collapse_arrow" @click="handleCollapse">
                        <template v-if="!collapse">展开
                            <Icon type="ios-arrow-down" />
                        </template>
                        <template v-else> 收起
                            <Icon type="ios-arrow-up" />
                        </template>
                    </a>
                </div>
            </div>
            <!--按钮位置在右边-->
            <div v-if="rightButtonList.length>0">
                <div v-for="(item, index) in rightButtonList" style="display: inline-block" :key="'btn'+item.blm">
                    <component v-if="vif[item.blm] &&  computeKyf(item)" v-show="vshow[item.blm]"
                        :key="'ibutton' + _uid + index" :is="item.componentType" :fathername="componentName"
                        :propstocomponent="propstochild[item.blm]" v-model="data[item.blm]"
                        v-bind="computeItemAttrs(item)" :style="computeItemStyle(item)"
                        :class="componentClass[item.blm]" :list="list[item.blm]" @on-blur="handleBlur(item,$event)"
                        @on-change="handleChange(item,$event)" @keydown="handleKeypress(item,$event)"
                        @click="handlecomponentclick(item, $event)">
                        <Icon v-if="item.icon" :type="item.icon" :style="item.iconStyle" />
                        <span>{{ item.content ? item.content : data[item.blm] }}</span>
                    </component>
                </div>
            </div>
        </div>

    </i-Form>
</template>
<script>
    import { mapState } from 'vuex';
    export default {
        name: 'tableform',
        props: {
            index: { type: Number, default: null },
            propstocomponent: { type: Object, default: () => ({}) },
            fathername: { type: String, default: '' },
            setdata: { type: Object, default: () => ({}) },
            childmethodparams: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                componentName: '', //
                ref: this.$root.componentRefs,
                collapse: false,
                loading: false,
                btnLoading: {},
                data: {},
                propstochild: {},
                vif: {}, // 组件渲染条件的配置，初始化全为true
                vshow: {},
                componentShow: {},
                hideItem: [],
                componentClass: {}, // 各个组件的类名
                attrs: {}, // 保存组件的属性
                styles: {}, // 保存组件的样式
                list: {}, // 保存组件的数组数据，一般用于jselect、jradio、jcheckbox、jswitch的数据
                formFieldList: [],
                componentList: [],
                triggleList: [],
                triggleByFatherObject: {},
                tempdata: {}
            };
        },
        methods: {
            test () {
                console.log(this.fathername, 'fathername')
                console.log(this.data, 'data');
                console.log(this.list, 'list');
                console.log(this.configdata, 'configdata');
                console.log(JSON.stringify(this.configdata), 'configdata');
                console.log(this.hideItem, 'hideItem');
                console.log(this.vif, 'vif');
                console.log(this.vshow, 'vshow');
                console.log(this.propstocomponent, 'propstocomponent');
                console.log(this.propstochild, 'propstochild');
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
            // 计算组件事件

            computeComponentEvent (item) {
                const eventObj = {}
                if (item.eventMethod) {
                    item.eventMethod.forEach((res) => {
                        eventObj[res.name] = (value1, value2, value3, value4, value5, $event) => {
                            const event = $event
                            const obj = { item, value1, value2, value3, value4, value5 }
                            if (event && event.stopPropagation) event.stopPropagation()// 防止冒泡
                            if (res.eventInside) {
                                const funcEval = new Function('_this', 'obj', res.eventInside)
                                funcEval(this, obj) // 执行内部方法
                            }
                            if (res.eventOutside) {
                                obj.method = res.eventOutside
                                this.$emit('commonMethod', obj) // 导出外部执行方法
                            }
                        }
                    })
                }
                return eventObj
            },
            /**
             * 计算组件渲染条件
             * @param {*} item
             */
            computeKyf (item) {
                let returnValue = true;
                if (item.condition) {
                    const funcEval = new Function('_this', 'obj', item.condition)
                    returnValue = funcEval(this, item)
                }
                if (item.kyf && item.kyf === '0') returnValue = false
                return returnValue
            },
            computeFormAttrs () {
                const newAttrs = this.configdata.formAttrs || {}
                if (this.configdata.formAttrsMethod) Object.assign(newAttrs, this.commonsJs.funcEval1(this, {}, this.configdata.formAttrsMethod))
                return newAttrs
            },
            computeFormStyle () {
                let newstyle = {}
                if (this.configdata.formStyles) newstyle = { ...newstyle, ...this.configdata.formStyles }
                if (this.configdata.formStyleConfig) {
                    const funcEval = new Function('_this', 'obj', this.configdata.formStyleConfig)
                    const styleEnv = funcEval(this, {}) // 执行内部方法
                    newstyle = { ...newstyle, ...styleEnv }
                }
                return newstyle
            },
            computeContentAndSearchStyle () {
                const style = {
                    display: 'flex',
                    flex: 1,
                    width: '100%',
                    'justify-content': 'space-between'

                }
                if (this.configdata.justify) style['justify-content'] = this.configdata.justify
                return style
            },
            computeSearchAreaStyle () {
                let newstyle = { 'justify-content': 'start' }
                if (this.configdata.justify)newstyle['justify-content'] = this.configdata.justify
                if (this.configdata.SearchAreaStyle) {
                    const funcEval = new Function('_this', 'obj', this.configdata.SearchAreaStyle)
                    const styleEnv = funcEval(this, {}) // 执行内部方法
                    newstyle = { ...newstyle, ...styleEnv }
                }
                return newstyle
            },
            computeContentStyle () {
                let newstyle = {}
                if (this.configdata.contentStyle) {
                    const funcEval = new Function('_this', 'obj', this.configdata.contentStyle)
                    newstyle = funcEval(this, {}) // 执行内部方法
                }
                return newstyle
            },
            computeSearchButtonStyle (type) {
                let newstyle = {}
                if (this.configdata[type]) {
                    const funcEval = new Function('_this', 'obj', this.configdata[type])
                    const styleEnv = funcEval(this, {}) // 执行内部方法
                    newstyle = styleEnv
                }
                return newstyle
            },
            computeItemStyle (item) {
                // 兼容数组格式和对象格式的style
                return this.commonsJs.computeNewStyle(this, { item, value: this.data[item.blm], data: this.data }, item.style, item.styleMethod, this.styles)
            },
            computeItemAttrs (item) {
                // 兼容数组格式和对象格式的attrs
                return this.commonsJs.computeNewAttrs(this, { data: this.data, item }, item.attrs, item.attrsMethod, this.attrs)
            },
            computeSearchAttrs () {
                let attrs = {}
                if (this.configdata.searchAttrsMethod) {
                    const funcEval = new Function('_this', 'obj', this.configdata.searchAttrsMethod)
                    const attrsEnv = funcEval(this, {}) // 执行内部方法
                    attrs = attrsEnv
                }
                return attrs
            },
            computeResetAttrs () {
                let attrs = {}
                if (this.configdata.resetAttrsMethod) {
                    const funcEval = new Function('_this', 'obj', this.configdata.resetAttrsMethod)
                    const attrsEnv = funcEval(this, {}) // 执行内部方法
                    attrs = attrsEnv
                }
                return attrs
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
                    this.formFieldList.forEach((f) => {
                        this[conditionAndShow][f.blm] = !booleanType
                    })
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
            /**
             *
             * @param {*} code 是创建的class的代码
             */
            loadCssCode (code) {
                if (document.getElementById('style-' + this.componentName)) document.getElementById('style-' + this.componentName).remove()
                if (!document.getElementById('style-' + this.componentName)) {
                    const style = document.createElement('style');
                    style.type = 'text/css';
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
            async setvshow (str, booleanType = true, setType = false) {
                await this.setAttrsConditionAndShow(str, 'vshow', booleanType, setType)
            },
            handleCollapse () {
                this.collapse = !this.collapse
                this.hideItem.forEach((item) => {
                    this.vshow[item] = !this.vshow[item]
                })
            },
            setPropsToComponent (str = '', obj = {}, replace = true) {
                let arr = []
                if (str) { arr = str.split(',') } else { arr = this.formFieldList.map(f => f.blm) }
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
            // setPropsToFormData () { this.data = {  ...this.propsToFormData, ...this.propstocomponent,...this.data} },
            handlecomponentclick (item, event) {
                const obj = { item, value: event, data: this.data, name: this.configdata.name, btnName: item.blm, blm: item.blm }
                if (item.clickInside) {
                    this.commonsJs.funcEval(this, obj, item.clickInside)
                }
                if (item.click) {
                    obj.method = item.click
                    this.$emit('commonMethod', obj);
                }
            },
            /**
             * 处理表单内组件失去焦点的方法
             * @param {*} item
             * 注意：event传出的不是当前的值
             */
            handleBlur (item, event) {
                // console.log(event,'print event from handleBlur in jform')
                const obj = { name: this.configdata.name, data: this.data, item, value: this.data[item.blm], blm: item.blm }
                if (item.blurInside) { this.commonsJs.funcEval(this, obj, item.blurInside) }
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
            handleChange (item, event) {
                const data = Object.assign({}, this.propstocomponent, this.data)
                if (item.componentType === 'date-picker') { // 处理日期组件回显问题
                    //由于type为datetimerange时清空，event会变为['','']导致必填校验失效
                    if (Array.isArray(event) && (!event || !event[0])) event = [];
                    this.data[item.blm] = event;
                }
                if (item.changeInside) { this.commonsJs.funcEval(this, data, item.changeInside); } // 组件数据变化内部执行方法
                if (item.componentType === 'jselect' && item.triggerObject) {
                    delete this.data[item.triggerObject]
                    this.getTriggerObjectList(item, item.triggerObject, item.blm);
                }
                const obj = { data, value: event, name: this.configdata.name, item, blm: item.blm }
                if (item.change) {
                    obj.method = item.change
                    this.$emit('commonMethod', obj)
                }
            },
            /**
             * 组件keypress的方法
             * @param {*} item
             * @param {*} event
             */
            handleKeypress (item, event) {
                const keycode = event.key
                if (this.configdata.enterKeyQuery !== '0' && keycode === 'Enter') {
                    if (item.componentType === 'i-input' || item.componentType === 'input-number') {
                        const obj = { item, value: this.data[item.blm], data: { ...this.data } }
                        if (item.keypress || item.keypressInside) {
                            if (item.keypressInside) { this.commonsJs.funcEval1(this, obj, item.keypressInside) }
                            if (item.keypress) { obj.method = item.keypress; this.$emit('commonMethod', obj) }
                        } else {
                            this.handleSubmit()
                        }
                    }
                } // 如果查询配置了按下回车直接查询
            },
            /**
             * 初始化下拉框、单选、多选、开关等数据
             */
            initList () {
                const sqlidList = []
                if (this.componentList.length > 0) {
                    this.componentList.forEach(item => {
                        if (!item.triggerByFather) {
                            // 此处为了将查询放到一次请求里进行处理
                            if (item.listType == '4' || (item.list && item.list.length > 0) || item.listMethod) {
                                this.getList(item)
                            } else if (item.listId) {
                                // listid查询
                                let obj = { ...this.propstocomponent}
                                if (item.cdqbsj === '1') obj = { ...obj, ...this.data } // 传递全部参数
                                sqlidList.push({
                                    sqlid: item.listId,
                                    blm: item.blm,
                                    type: 'querylist',
                                    param: obj,
                                    xlkitem: item// 此为了后续赋值使用，查询sql中用不到
                                })
                            } else if (item.listBm && item.listDm && item.listMc) {
                                // 代码表名查询
                                const { listBm, listDm, listMc } = item
                                let obj = { listBm, listDm, listMc, ...this.propstocomponent }
                                if (item.cdqbsj === '1') obj = { ...obj, ...this.data } // 传递全部参数
                                sqlidList.push({
                                    sqlid: 'DC37EB84F52E3520E0555943CA7634DE',
                                    blm: item.blm,
                                    type: 'querylist',
                                    param: obj,
                                    xlkitem: item// 此为了后续赋值使用，查询sql中用不到
                                })
                            } else if (item.listConfig && item.listConfig.listBm && item.listConfig.listDm && item.listConfig.listMc) {
                                // 代码表名查询
                                let obj = { ...item.listConfig, ...this.propstocomponent }
                                if (item.cdqbsj === '1') obj = { ...obj, ...this.data } // 传递全部参数
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
                            if (xlkitem.afterGetList) this.commonsJs.funcEval(this, { list: res[xlkitem.blm], data: this.data, item: xlkitem }, xlkitem.afterGetList)
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
                    const source = this.data[name]
                    const sourceList = this.list[name]
                    const list = sourceList.filter(row => { return row.dm == source })[0].children
                    this.list[item.blm] = list
                } else if (item.listId) { this.getListById(item, name) } else if (item.listConfig && item.listConfig.listBm && item.listConfig.listDm && item.listConfig.listMc) this.getListByBm(item, name)
                else if (item.listMethod) {
                    const newlist = this.commonsJs.funcEval1(this, { item, name }, item.listMethod)
                    this.list[item.blm] = newlist
                }
            },

            /**
             * 通过配置的id值获取数据
             * @param {*} item
             * @param {*} name
             */
            getListById (item, name = '') {
                let obj = { ...this.propstocomponent }
                if (name) obj[name] = this.data[name]
                if (item.cdqbsj === '1') obj = { ...obj, ...this.data } // 传递全部参数
                this.commonsJs.incoRequest('querylist', item.listId, obj).then((res) => {
                    this.list[item.blm] = res;
                    if (item.afterGetList) this.commonsJs.funcEval(this, { list: res, data: this.data, item }, item.afterGetList)
                });
            },
            /**
             * 通过配置的表名、查询的字段名等获取数据
             * @param {*} item
             * @param {*} name
             */
            getListByBm (item, name = '') {
                let obj = { ...item.listConfig, ...this.propstocomponent }
                if (name) {
                    obj[name] = this.data[name]
                    obj.jldata = this.data[name]
                }
                if (item.cdqbsj === '1') obj = { ...obj, ...this.data } // 传递全部参数
                this.commonsJs.incoRequest('querylist', 'DC37EB84F52E3520E0555943CA7634DE', obj).then(
                    (res) => {
                        this.list[item.blm] = res;
                        if (item.afterGetList) this.commonsJs.funcEval(this, { list: res, data: this.data, item }, item.afterGetList)
                    }
                );
            },
            // 自定义的list数据
            async getListBySelf (res) {
                let list = JSON.parse(JSON.stringify(res.list))
                for (let i = 0; i < list.length; i++) {
                    let item = list[i]
                    if (item.condition) { item = await this.commonsJs.funcEval(this, item, item.condition) }// 通过condition设置list的某条disabled
                }
                if (res.afterGetList) { list = await this.commonsJs.funcEval(this, { list: res.list, data: this.data, item: res }, res.afterGetList) }
                return list
            },
            /**
             * 根据传入的源组件和目标组件，查询目标组件的数据
             * @param {*} sourceItem
             * @param {*} targetName
             * @param {*} sourceItemName
             */
            getTriggerObjectList (sourceItem, targetName, sourceItemName) {
                const list = sourceItemName.split(',')
                if (list && list.length > 0) {
                    list.forEach((item) => {
                        if (this.data[item]) {
                            if (this.triggleByFatherObject[targetName]) { this.getList(this.triggleByFatherObject[targetName], item) }
                        } else {
                            this.data[targetName] = ''
                            this.list[targetName] = []
                        }
                    })
                }
            },
            handleSubmit () {
                if (this.configdata.queryMethod) {
                    this.commonsJs.funcEval1(this, this.data, this.configdata.queryMethod)
                } else {
                    const obj = Object.assign({}, this.propstocomponent, this.data);
                    if (this.configdata.targetObject) this.ref[this.fathername].query(this.configdata.targetObject, obj)
                }
            },
            query () {
                this.handleSubmit()
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
                    if (this.ref[this.configdata.blm]) {
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
            reset () {
                this.handleReset()
            },
            async handleReset () {
                await this.$refs[this.configdata.blm].resetFields();
                this.data = { ...this.propstocomponent }
                if (this.configdata.fields && this.configdata.fields.length > 0) {
                    this.configdata.fields.forEach((item) => {
                        if (item.componentType === 'input-number' && !this.data[item.blm] && this.data[item.blm] !== 0) {
                            this.data[item.blm] = null
                        }
                    })
                }
            },
            async createFields () {
                this.componentName = this.configdata.blm + (this.index ? this.index : '')
                let list = []
                const componentList = []
                const triggleList = []
                const fields = this.configdata.fields || []
                if (fields && fields.length > 0) {
                    list = this.commonsJs.getTreeToList(fields)
                    this.formFieldList = list
                    const hideItem = []
                    for (let i = 0; i < list.length; i++) {
                        const item = list[i]
                        // 处理表单引用的自定义组件
                        if (item.yyzjmc) {
                            if (!this.$options.components) this.$options.components = {}
                            if (item.registerComponentMethod && item.registerComponentMethod.trim()) {
                                const zjxx = this.commonsJs.funcEval1(this, {}, item.registerComponentMethod)
                                this.$options.components[item.yyzjmc] = zjxx
                            } else if (!this.$options.components[item.yyzjmc]) await this.commonsJs.localRegisterComponent([item.yyzjmc], this)
                        }
                        if (item.vif && item.vif === '0') { this.vif[item.blm] = false } else { this.vif[item.blm] = true }
                        if (item.isShow && item.isShow === '0') { this.vshow[item.blm] = false } else { this.vshow[item.blm] = true }
                        if (item.style) { this.styles[item.blm] = item.style } else { this.styles[item.blm] = {} }
                        if (item.attrs) { this.attrs[item.blm] = item.attrs } else { this.attrs[item.blm] = {} }
                        if (item.kyf && item.kyf === '0') { this.vif[item.blm] = false } else { this.vif[item.blm] = true }
                        if (item.isShow === '0' && item.kyf !== '0') {
                            hideItem.push(item.blm) // 初始化查询不显示的字段
                            this.componentShow[item.blm] = false
                        } else { this.componentShow[item.blm] = true }
                        if (item.componentType === 'jselect' || item.componentType === 'jradio' || item.componentType === 'jcheckbox' || item.componentType === 'jswitch') {
                            if (item.triggerObject) triggleList.push(item)
                            if (!item.triggerByFather) componentList.push(item)
                            if (item.triggerByFather) {
                                this.triggleByFatherObject[item.blm] = item
                            }
                        }
                        if (item.componentType === 'input-number' && !this.data[item.blm] && this.data[item.blm] !== 0) {
                            this.data[item.blm] = null
                        }
                        this.handleDefaultValue(item)
                    }

                    this.hideItem = hideItem
                    this.componentList = componentList
                    this.triggleList = triggleList
                    this.initList()
                    if (this.configdata.initMethod) {
                        this.commonsJs.funcEval1(this, { ...this.propstocomponent, ...this.data }, this.configdata.initMethod)
                    }
                }
            },
            /**
             * 处理缺省值
             */
            handleDefaultValue (item) {
                if (item.default !== undefined && item.default !== null && item.default !== '') {
                    if (!this.data[item.blm]) {
                        if (item.componentType === 'input-number') this.data[item.blm] = Number(item.default)
                        else this.data[item.blm] = item.default
                    } // 如果data里面有数据，则不初始化
                }
            }
        },
        watch: {
            componentName: {
                handler (n, o) {
                    if (n) {
                        this.$nextTick(() => {
                            if (!this.$root.componentRefs) { this.$root.componentRefs = {} }
                            this.$root.componentRefs[this.componentName] = this
                        })
                    }
                },
                deep: true,
                immediate: true
            },
            childmethodparams: {
                handler (n, o) {
                    if (n && n.methodName) {
                        this.$nextTick(() => { this.$emit('excutefunc', n) })
                    }
                },
                deep: true,
                immediate: true
            },
            configdata: {
                handler (n, o) {
                    if (n && n.blm) {
                        this.componentName = this.configdata.blm + (this.index ? this.index : '')
                        if (this.configdata.createClass) this.commonsJs.loadCssCode(this.configdata.createClass, n.blm)
                        this.createFields()
                    }
                },
                deep: true,
                immediate: true
            },

            propstocomponent: {
                handler (n, o) {
                    let obj = {}
                    if (Object.keys(this.data)) {
                        obj = JSON.parse(JSON.stringify(this.data))
                    }
                    this.data = { ...obj, ...n }
                },
                deep: true,
                immediate: true
            },
            // data: {
            //     handler (n,o) {
            //         let obj = {
            //             tableformName: this.configdata.blm,
            //             data: this.data,
            //             targetObject: this.configdata.targetObject
            //         }
            //         if (this.ref[this.fathername] && this.ref[this.fathername].data) {
            //             this.$set(this.ref[this.fathername].data,this.componentName,this.data)
            //         }

            //         // this.$emit('input', obj)
            //     },
            //     deep: true,
            //     immediate: true
            // },
            setdata: {
                handler () {
                    if (this.setdata.id) this.data = { ...this.data, ...this.setdata.data }
                },
                deep: true,
                immediate: true
            },
            // 监测根的传递参数的变化，如果变化了，看是否有本组件的数据，如果有本组件的数据，调用处理
            '$root.componentsParam': {
                handler (n, o) {
                    if (n[this.componentName]) {
                        const myComponentsParam = JSON.parse(JSON.stringify(n[this.componentName]))
                        delete n[this.componentName]
                        this.handleRootFunction(myComponentsParam)
                    }
                },
                deep: true,
                immediate: true
            }
        },
        computed: {
            ...mapState('admin/user', ['info']),
            formdataChange () {
                return JSON.parse(JSON.stringify(this.data));
            },
            rightButtonList () {
                const list = []
                if (this.configdata.fields && this.configdata.fields.length > 0) {
                    this.configdata.fields.forEach((item) => {
                        if (item.componentType == 'Button' && item.anwz != 'left') list.push(item)
                    })
                }
                return list
            },
            computeBtnWidth () {
                let width = 65
                if (this.configdata.reset === '1') width = width + 65
                if (this.hideItem.length > 0) width = width + 65
                // console.log(width,'width from computeBtnWidth')
                return `${width}px`
            },
            existFields () {
                let flag = false;
                if (
                    this.configdata &&
                    this.configdata.fields &&
                    this.configdata.fields.length > 0
                ) { flag = true; }
                return flag;
            },
            searchName () {
                if (this.configdata.searchName) {
                    return this.configdata.searchName;
                } else return '';
            },
            resetBtn () {
                if (this.configdata.reset) {
                    return true;
                } else return false;
            },
            getProps (str = '') {
                if (str) return this.propstocomponent[str]
                else return this.propstocomponent
            }

        },
        mounted () {},
        updated () {
            // 监测根的传递参数的变化，如果变化了，看是否有本组件的数据，如果有本组件的数据，调用处理
            if (this.$root.componentsParam[this.componentName]) {
                const myComponentsParam = JSON.parse(JSON.stringify(this.$root.componentsParam[this.componentName]))
                delete this.$root.componentsParam[this.componentName]
                this.handleRootFunction(myComponentsParam)
            }
        },
        beforeUnmount () {
            delete this.$root.componentRefs[this.componentName]
            // if (this.configdata.createClass && this.configdata.createClass.trim()) document.getElementById('style-'+this.componentName).remove()
        }
    };
</script>
