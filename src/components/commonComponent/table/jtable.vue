<template >
  <div style="width:100%" :style="zjConfigdata.mainStyles" :class="'style-' + configdata.blm + ' ' + configdata.blm">
    <div style="display:flex;justify-content:space-between"
      :style="{width:zjConfigdata.tableStyles ? zjConfigdata.tableStyles.width :''}">
      <!-- 用来显示table顶部的按钮和右侧的附加功能 -->
      <Button v-if="env()" @click="test">table-test</Button>
      <div v-if="showTitle" style="width:calc(100% - 110px)">
        <template v-for="(btnItem, btnIndex) in zjConfigdata.titleButtons">
          <component v-if="computeKyf(btnItem)" :is="btnItem.componentType" :id="btnItem.blm" :ref="btnItem.blm"
            :key="btnItem.blm + btnIndex + _uid+'commonBtn'" :configdata="btnItem" :fathername="componentName"
            :propstocomponent="propstochild[btnItem.blm]" :index="btnIndex" v-model="titledata[btnItem.blm]"
            v-bind="computeItemAttrs(btnItem,{},btnIndex)" :style="computeItemStyle(btnItem,{},btnIndex)"
            :list="list[btnItem.blm]" @commonMethod="commitMethod" v-on="titleEvent(btnItem)"
            @on-change="titleComponentChange(btnItem,btnIndex,$event)"
            @keypress.native="titleComponentKeypress(btnItem,btnIndex,$event)" @click="titlebuttonclick(btnItem)">
            <template v-if="btnItem.blm!='i-input'">
              <Icon v-if="btnItem.icon" :type="btnItem.icon" :style="btnItem.iconStyle" />
              <span v-if="btnItem.content || btnItem.componentType == 'span' || btnItem.componentType == 'p'">{{
                btnItem.content ? btnItem.content : titledata[btnItem.blm] }}</span>
            </template>
          </component>
        </template>
      </div>
      <!-- 附加功能按钮 -->
      <div v-if="zjConfigdata.additionButton==='1'" class="ivu-inline-block ivu-fr" style="padding-right:15px">
        <Dropdown class="md" @on-click="handleChangeTableSize" trigger="click" v-if="additionButtonConditon.md">
          <Tooltip class="ivu-ml" content="密度" placement="top">
            <i-link><Icon type="md-list" /></i-link>
          </Tooltip>
          <DropdownMenu #list>
            <DropdownItem name="default" :selected="!attrs.size || attrs.size === 'default'">默认</DropdownItem>
            <DropdownItem name="large" :selected="attrs.size === 'large'">宽松</DropdownItem>
            <DropdownItem name="small" :selected="attrs.size === 'small'">紧凑</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <Tooltip class="ivu-ml sx" content="刷新" placement="top" v-if="additionButtonConditon.sx">
          <i-link @click="refreshtable"><Icon custom="i-icon i-icon-refresh" /></i-link>
        </Tooltip>
        <Dropdown class="lsz" trigger="click" v-if="additionButtonConditon.lsz">
          <Tooltip class="ivu-ml" content="列设置" placement="top">
            <i-link><Icon type="md-options" /></i-link>
          </Tooltip>
          <DropdownMenu #list>
            <div class="ivu-p-8">
              <Row>
                <Col span="12">列展示</Col>
                <Col span="12" class="ivu-text-right">
                  <i-link :link-color="true" @click="handleResetColumn">重置</i-link>
                </Col>
              </Row>
            </div>
            <Divider size="small" class="ivu-mt-8 ivu-mb-8" />
            <template v-for="(item,index) in tableColumns">
              <li class="ivu-dropdown-item" :key="item.title+index" v-if="item.title">
                <Checkbox v-model="tableColumns[index].show"></Checkbox>
                <span>{{ item.title }}</span>
              </li>
            </template>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
    <vxe-table v-if="zjConfigdata.zjlx==='vxe-table'" :id="zjConfigdata.blm" :name="zjConfigdata.blm"
      :ref="zjConfigdata.blm" :class="zjConfigdata.sfdx == 0?'dx ivu-mt'+' style-'+zjConfigdata.blm :'ivu-mt'  "
      :data="data" v-bind="computeTableAttrs()" v-on="computeComponentEvent(data)">
      <vxe-column v-bind="computeFieldAttrs(item,index)" v-for="(item,index) in columnSlot" :key="item.blm+'vxecolumn'+index">
        <template v-if="item.slotChildren && item.slotChildren.length>0" #default="{ row,index}">
          <template v-for="(childItem, i) in item.slotChildren">
            <date-picker v-if="childItem.componentType == 'date-picker' && computeKyf(childItem,index,row)" transfer
              :model-value="row[childItem.blm]" :key="'formtable'+childItem.blm+index+i"
              v-bind="computeItemAttrs(childItem,row,index)" :editable="false"
              :style="computeItemStyle(childItem,row,index)" style="margin:0 5px;" :blm="childItem.blm"
              @on-change="handleOnChange(childItem, index,row,$event)"></date-picker>
            <component v-else-if="computeKyf(childItem,index,row)" transfer :is="childItem.componentType"
              v-model="row[childItem.blm]" :key="'formtable1'+childItem.blm+index+i"
              :list="computeList(childItem,row,index)" v-bind="computeItemAttrs(childItem,row,index)"
              :style="computeItemStyle(childItem,row,index)" style="margin:0 5px;" :blm="childItem.blm"
              :configdata="childItem" @click.stop="handleItemClick(childItem,index,row)"
              @on-change="handleOnChange(childItem, index,row,$event)" @on-blur="handleBlur(childItem,index,row)">
              <template v-if="computeRowContent(childItem)">
                <Icon v-if="childItem.icon" :type="childItem.icon" :style="childItem.icon"></Icon>
                {{ childItem.content ? childItem.content : row[childItem.blm] }}
              </template>
            </component>
          </template>
        </template>
      </vxe-column>
    </vxe-table>
    <i-table v-else-if="showtable" :id="zjConfigdata.blm" :name="zjConfigdata.blm" :ref="zjConfigdata.blm"
      :class="zjConfigdata.sfdx == 0?'dx ivu-mt'+' style-'+zjConfigdata.blm :'ivu-mt'  " :data="data"
      v-bind="computeTableAttrs()" v-on="computeComponentEvent(data)">
      <template v-for="item in columnSlot" #[item.slot]="{ row, index }">
        <template v-if="computeKyf(item,index,row)">
          <template v-for="(childItem, i) in item.slotChildren">
            <date-picker v-if="childItem.componentType == 'date-picker' && computeKyf(childItem, index, row)" transfer
              :model-value="row[childItem.blm]" :key="'formtable' + childItem.blm + index + i"
              v-bind="computeItemAttrs(childItem, row, index)" :editable="false"
              :style="computeItemStyle(childItem, row, index)" style="margin:0 5px;" :blm="childItem.blm" :row="row"
              :index="index" @on-change="handleOnChange(childItem, index, row, $event)"></date-picker>
            <component v-else-if="computeKyf(childItem, index, row)" transfer :is="childItem.componentType"
              v-model="row[childItem.blm]" :key="'formtable1' + childItem.blm + index + i"
              :list="computeList(childItem, row, index)" v-bind="computeItemAttrs(childItem, row, index)"
              :style="computeItemStyle(childItem, row, index)" style="margin:0 5px;" :blm="childItem.blm"
              :configdata="childItem" :row="row" :index="index" @click.stop="handleItemClick(childItem, index, row)"
              @on-change="handleOnChange(childItem, index, row, $event)" @on-blur="handleBlur(childItem, index, row)">
              <template v-if="computeRowContent(childItem)">
                <Icon v-if="childItem.icon" :type="childItem.icon" :style="childItem.icon"></Icon>
                {{ childItem.content ? childItem.content : row[childItem.blm] }}
              </template>
            </component>
          </template>
        </template>
      </template>
    </i-table>
    <Page v-if="zjConfigdata.havePage!='0'" v-show="data && data.length > 0" v-bind="computePageAttrs()"
      :style="zjConfigdata.pageStyle" style="margin-top: 10px;" @on-change="changeByPageNum"  @on-page-size-change="changeByPageSize" />
  </div>
</template>
<script>
    import { mapState } from 'vuex'
    import columnitem from './columnitem.vue'
    export default {
        name: 'jtable',
        components: { columnitem },
        props: {
            index: { type: Number, default: null },
            setdata: { type: Object, default: () => ({}) },
            childmethodparams: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: () => ({}) },
            fathername: { type: String, default: '' },
            propstocomponent: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                componentName: '', // 组件名称
                ref: this.$root.componentRefs, // 所有组件的指针引用
                style: {}, // 组件的样式
                attrs: {}, // 组件的属性
                componentClass: {}, // 组件的class
                propstochild: {}, // 传递给子组件的属性
                zjConfigdata: {}, // 组件的配置数据
                titledata: {}, // 用于绑定在table顶部配置功能按钮区组件，如配置了下拉框
                showTitle: false,
                columns: [], // table的列
                vif: {}, // 配置页面元数渲染条件
                vshow: {},
                function: {}, // 保存自定义方法
                tableColumns: [], /// table的列
                data: [], // table的data
                tempdata: {}, // 临时数据存储
                list: {}, // table组件的list
                page: { pageNum: 1, pageSize: 10, total: 0 }, // page组件的信息
                columns_meta: { loading: false },
                columnSlot: [], // 列的插槽
                tableselecteddata: [], // table选中的数据
                expandtreekey: [], // 展开的树节点
                showtable: false// 是否显示table
            };
        },
        methods: {
            test () {
                console.log('componentName', this.componentName, 'componentName print form jtable.vue');
                console.log('index', this.index, 'index print form jtable.vue');
                console.log('configdata', this.configdata, 'configdata print form jtable.vue');
                console.log('zjConfigdata', this.zjConfigdata, 'zjConfigdata print form jtable.vue');
                console.log('getColumns', this.getColumns, 'getColumns print form jtable.vue');
                // console.log('getColumns', JSON.stringify(this.configdata), "this.configdata");

                console.log('data', this.data, 'data print form jtable.vue', this);
                console.log('propstocomponent', this.propstocomponent, 'propstocomponent print form jtable.vue');
                console.log('propstochild', this.propstochild, 'propstochild print form jtable.vue');
                console.log('tableform', this.tableform, 'tableform print form jtable.vue');
                console.log('list', this.list, 'tableform print form jtable.vue');
                console.log('columnSlot', this.columnSlot, 'tableform print form jtable.vue');
                console.log('tableselecteddata', this.tableselecteddata, 'tableselecteddata print form jtable.vue');
                console.log(this.commonsJs.BrowerHeight, 'screenHeight')
                console.log(this.fathername, 'fathername')
                console.log(this.tableColumns, 'tableColumns')
                console.log(this.style, 'style')
                console.log(this.attrs, 'attrs')
                console.log(this.info, 'info')
                console.log(this.expandtreekey, 'this.expandtreekey')
                console.log(this.titledata, 'titledata')
                console.log(this.page, 'page')
                console.log(this.function, 'function')
                console.log(this.tempdata, 'tempdata')
            },
            titleEvent (item) {
                const eventObj = {}
                if (item.eventMethod) {
                    item.eventMethod.forEach((res) => {
                        eventObj[res.name] = (value1, value2, value3, value4, value5, $event) => {
                            const event = $event
                            const obj = { value1, value2, value3, value4, value5 }
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
            // 计算组件事件
            computeComponentEvent () {
                let eventObj = {}
                const eventObj_iview = {
                    'on-select': this.handleSelect,
                    'on-select-cancel': this.handleSelectCancel,
                    'on-selection-change': this.handleselecteddata,
                    'on-select-all': this.handleSelectAll,
                    'on-select-all-cancel': this.handleSelectAllCancel,
                    'on-row-click': this.handleRowClick,
                    'on-row-dblclick': this.handleOnrowdbclick,
                    'on-expand-tree': this.handleOnexpandtree
                }
                const eventObj_vxe = {
                    'checkbox-change': this.handleSelect,
                    'checkbox-all': this.handleVxeSelectAll,
                    'radio-change': this.handleVxeRadioChange,
                    'cell-click': this.handleRowClick,
                    'cell-dblclick': this.handleOnrowdbclick
                }
                if (this.zjConfigdata.zjlx === 'vxe-table') eventObj = eventObj_vxe
                else eventObj = eventObj_iview
                if (this.zjConfigdata.eventMethod) {
                    this.zjConfigdata.eventMethod.forEach((res) => {
                        eventObj[res.name] = (value1, value2, value3, value4, value5, $event) => {
                            const event = $event
                            const obj = { value1, value2, value3, value4, value5 }
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
            computeMainStyle (style) {
                let newstyle = {}
                if (style && Object.keys(style)) newstyle = style
                const h = document.documentElement.clientHeight || document.body.clientHeight
                newstyle.height = h / 2 + 'px'
                return newstyle
            },
            computeList (item, row, index) {
                let list = []
                if (this.list[item.blm]) list = this.list[item.blm]
                if (row.itemList && row.itemList[item.blm]) list = row.itemList[item.blm]
                return list
            },
            computeTableAttrs () {
                let newAttrs = {
                    border: false,
                    'highlight-row': true,
                    'tooltip-max-width': 300,
                    loading: this.columns_meta.loading,
                    columns: this.getColumns
                }
                if (this.attrs) newAttrs = { ...newAttrs, ...this.attrs }
                if (this.zjConfigdata.attrsMethod) {
                    const attrsEnv = this.commonsJs.funcEval1(this, {}, this.zjConfigdata.attrsMethod)
                    newAttrs = { ...newAttrs, ...attrsEnv }
                }
                return newAttrs
            },
            computePageAttrs () {
                let newAttrs = {
                    transfer: true,
                    'show-total': true,
                    'show-elevator': true,
                    'show-sizer': true,
                    'page-size': this.page.pageSize,
                    current: this.page.pageNum,
                    total: this.page.total
                }
                if (this.zjConfigdata.pageAttrsMethod) {
                    const attrsEnv = this.commonsJs.funcEval1(this, {}, this.zjConfigdata.pageAttrsMethod)
                    newAttrs = { ...newAttrs, ...attrsEnv }
                }
                return newAttrs
            },
            computeFieldAttrs (item) {
                item.field = item.key
                if (item.type === 'index') item.type = 'seq'
                if (item.type === 'selection') {
                    if (this.zjConfigdata.sfdx === '0') item.type = 'radio'
                    else item.type = 'checkbox'
                }
                if (item.componentType === 'tableSlot') {
                    item.field = item.blm
                    delete item.slot
                }
                if (item.attrsMethod) {
                    const newAttrs = this.commonsJs.funcEval1(this, {}, item.attrsMethod) || {}
                    item = { ...item, ...newAttrs }
                }
                return item
            },
            computeItemAttrs (item, row, index) {
                // 兼容数组格式和对象格式的attrs
                let newAttrs = {}
                // 处理数组或对象格式的attrs
                if (item.attrs && Array.isArray(item.attrs)) {
                    item.attrs.forEach((attr) => {
                        if (attr.key && attr.key.trim() && attr.label !== undefined) {
                            if (attr.valueType === 'number') newAttrs[attr.key.trim()] = Number(attr.label)
                            else if (attr.valueType === 'boolean') newAttrs[attr.key.trim()] = attr.label === 'true' || attr.label === '1'
                            else newAttrs[attr.key.trim()] = attr.label
                        }
                    })
                } else if (item.attrs) {
                    newAttrs = { ...item.attrs }
                }
                // 合并行级别的attrs
                if (row.attrs && row.attrs[item.blm]) {
                    newAttrs = { ...newAttrs, ...row.attrs[item.blm] }
                }
                // 执行attrsMethod
                if (item.attrsMethod) {
                    const funcEval = new Function('_this', 'obj', item.attrsMethod)
                    const attrsEnv = funcEval(this, { row, index, item })
                    newAttrs = { ...newAttrs, ...attrsEnv }
                }
                return newAttrs
            },
            computeItemStyle (item, row, index) {
                // 兼容数组格式和对象格式的style
                let newstyle = {}
                // 处理数组或对象格式的style
                if (item.style && Array.isArray(item.style)) {
                    item.style.forEach((s) => {
                        if (s.key && s.key.trim() && s.label !== undefined) {
                            newstyle[s.key.trim()] = s.label
                        }
                    })
                } else if (item.style) {
                    newstyle = { ...item.style }
                }
                // 执行styleMethod
                if (item.styleMethod) {
                    const funcEval = new Function('_this', 'obj', item.styleMethod)
                    const styleEnv = funcEval(this, { row, index, item })
                    newstyle = { ...newstyle, ...styleEnv }
                }
                return newstyle
            },
            computeRowContent (item) {
                let flag = true
                const zjlx = item.componentType
                if (zjlx === 'i-input' || zjlx === 'input-number' || zjlx === 'jselect' || zjlx === 'radio' || zjlx === 'checkbox' || zjlx === 'jswitch' || zjlx === 'date-picker') flag = false
                return flag
            },
            /**
             * 计算组件渲染条件
             * @param {*} item
             */
            computeKyf (item, index, row) {
                let returnValue = this.vif[item.blm];
                if (item.componentType === 'input-number' && row[item.blm] !== 0 && !row[item.blm]) {
                    row[item.blm] = null
                }
                if (item.condition) {
                    try {
                        const funcEval = new Function('_this', 'obj', item.condition)
                        const obj = { item, index, row }
                        returnValue = funcEval(this, obj)
                    } catch (e) {
                        console.log('jtable computeKyf错误:', item.blm, item.condition, e)
                    }
                }
                if (item.kyf && item.kyf === '0') returnValue = false
                return returnValue
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
            setProps (str = '', obj = {}, replace = true) {
                let arr = []
                if (str) { arr = str.split(',') } else { arr = (this.zjConfigdata.titleButtons || []).map(b => b.blm) }
                arr.forEach((res) => {
                    let propsObj = {}
                    if (!replace) propsObj = { ...this.propstochild[res], ...obj } // 保留了原来 路由传递过来的 参数
                    else propsObj = obj // 如果replace设置为true，将替代原来的已保存的变量
                    this.propstochild[res] = propsObj
                })
            },
            setprops (str, obj, replace) {
                this.setProps(str, obj, replace)
            },
            getProps (str = '') {
                if (str) return this.propstocomponent[str]
                else return this.propstocomponent
            },
            // 向根发送要触发执行的方法和数据
            triggerFunction (blm, method, obj) {
                this.$root.componentsParam[blm] = [{ blm, method, obj }]
            },
            // 此方法是用来根据triggerFunction，来触发本地的方法
            handleRootFunction (list) {
                if (list.length === 0) return
                list.forEach((item) => {
                    if (item.method && item.method.trim()) {
                        const funcEval = new Function('_this', 'obj', item.method)
                        funcEval(this, item.obj)
                    }
                })
            },

            /**
             *
             * @param {*} str 要设置的组件变量名的字符串，变量用‘，’隔开
             * @param {*} type ：vif和vshow，vif是对条件v-if设置，vshow是对组件的show属性设置
             * @param {*} setType ：false是只改变要设置的组件变量名，true是将其他组件设为相反值
             */
            setAttrsConditionAndShow (str, type, booleanType, setType) {
                if (!str) return
                // 如果输入的字符串不为空
                const arr = str.split(',')
                let conditionAndShow = ''
                if (type === 'vshow') { conditionAndShow = 'vshow' }
                if (type === 'vif') { conditionAndShow = 'vif' }
                // 如setType选择为true，则将先将所有的设置为booleanType取反
                if (setType) {
                    const allComponent = Object.keys(this.vif) || []
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
             * @param {*} str 为要
             * @param {*} booleanType
             * @param {*} setType
             */
            setvif (str, booleanType = true, setType = false) {
                this.setAttrsConditionAndShow(str, 'vif', booleanType, setType)
            },
            setvshow (str, booleanType = true, setType = false) {
                this.setAttrsConditionAndShow(str, 'vshow', booleanType, setType)
            },
            // 重置数据到初始值
            reset () {
                this.data = []
                this.tempdata = {}
                this.page = { pageNum: 1, pageSize: 10, total: 0 }
                this.tableselecteddata = []
                this.style = {}
                this.attrs = {}
                this.attrs = { ...this.zjConfigdata.attrs }
            },
            async initTable () {
                if (this.zjConfigdata.titleButtons && this.zjConfigdata.titleButtons.length > 0) {
                    this.showTitle = false
                    // 注册title区按钮引用的自定义组件
                    for (let i = 0; i < this.zjConfigdata.titleButtons.length; i++) {
                        const item = this.zjConfigdata.titleButtons[i]
                        this.vif[item.blm] = true
                        if (item.vifCondition == '0' || item.isShow == '0') this.vif[item.blm] = false
                        if (item.yyzjmc && item.yyzjmc.trim()) {
                            if (item.addConfigdata) Object.assign(item, this.commonsJs.funcEval1(this, {}, item.addConfigdata))
                            await this.commonsJs.zjRegisterOne(item, this)
                        }
                    }
                    this.showTitle = true
                }
                this.reset()
                this.createFunction(this.zjConfigdata.function)
                this.computeTableColumns()
                await this.getColumnSlot()
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
                this.showtable = true
                this.initList()
                if (this.zjConfigdata.mountedMethod) this.commonsJs.funcEval1(this, {}, this.zjConfigdata.mountedMethod)
                if (this.zjConfigdata.isMounted === '1') this.query()
            },
            /**
             * 创建方法
             */
            async createFunction (list = []) {
                if (list.length === 0) return
                const _this = this
                for (let i = 0; i < list.length; i++) {
                    const item = list[i]
                    try {
                        if (item.name && item.func.trim()) {
                            const func = eval(item.func)
                            this.function[item.name.trim()] = func
                        }
                    } catch { console.log('创建方法时发生错误：createFunction', item.name) }
                }
            },
            // 计算table的columns
            computeTableColumns () {
                let flag = true
                if (!this.zjConfigdata.columns) flag = false
                if (this.zjConfigdata.columns && this.zjConfigdata.columns.length === 0) flag = false
                let arr = []
                if (flag) {
                    this.zjConfigdata.columns.forEach((item) => {
                        if (item.kyf !== '0') {
                            if (!item.title && item.mc) item.title = item.mc
                            const newItem = { ...item }
                            this.vif[item.blm] = true
                            if (newItem.isShow === '0' || newItem.vifCondition === '0') this.vif[item.blm] = false
                            if (item.slotChildren && item.slotChildren.length > 0) {
                                item.slotChildren.forEach((child) => {
                                    this.vif[child.blm] = true
                                    if (child.isShow === '0' || child.vifCondition === '0') this.vif[child.blm] = false
                                })
                            }
                            arr.push(newItem)
                        } // 排除不可用的组件
                    })
                } else if (this.zjConfigdata.defineConfigdata) arr = this.commonsJs.funcEval1(this, { columns: arr }, this.zjConfigdata.defineConfigdata)
                this.tableColumns = arr
            },
            async getColumnSlot () {
                const arr = []
                if (this.tableColumns.length > 0) {
                    for (let i = 0; i < this.tableColumns.length; i++) {
                        const item = this.tableColumns[i]
                        if (item.yyzjmc && item.yyzjmc.trim()) this.commonsJs.zjRegisterOne(item, this)
                        if (this.zjConfigdata.zjlx !== 'vxe-table') {
                            if (item.slot && item.slotChildren && item.slotChildren.length > 0) {
                                for (let j = 0; j < item.slotChildren.length; j++) {
                                    const child = item.slotChildren[j]
                                    if (child.yyzjmc && child.yyzjmc.trim()) this.commonsJs.zjRegisterOne(child, this)
                                }
                                arr.push(item);
                            }
                        } else { arr.push(item) }
                    }
                }
                this.columnSlot = arr
            },
            // showSlot() {
            //   let flag=false
            //   if (this.columnSlot && this.columnSlot.length>0) flag=true
            //   return flag
            // },
            // table的title功能区右侧功能按钮区设置列显示与否
            handleShowColumns (item, index) {
                this.tableColumns[index].show = !item.show
            },
            // 初始化table，row中某组件时下拉框（组件配置中有list的数组数据）---固定值
            initList () {
                const sqlidList = []
                if (this.columnSlot && this.columnSlot.length > 0) {
                    this.columnSlot.forEach((item) => {
                        if (item.slotChildren && item.slotChildren.length > 0) {
                            item.slotChildren.forEach((child) => {
                                if (child.componentType === 'jselect' || child.componentType === 'jradio' || child.componentType === 'jcheckbox' || child.componentType == 'jswitch') {
                                    if (child.listType == '4' || (child.list && child.list.length > 0)) {
                                        this.getList(child)
                                    } else if (child.listId) {
                                        sqlidList.push({
                                            sqlid: child.listId,
                                            blm: child.blm,
                                            type: 'querylist',
                                            param: {},
                                            xlkitem: child// 此为了后续赋值使用，查询sql中用不到
                                        })
                                    } else if (child.listConfig && child.listConfig.listBm && child.listConfig.listDm && child.listConfig.listMc) {
                                        sqlidList.push({
                                            sqlid: 'DC37EB84F52E3520E0555943CA7634DE',
                                            blm: child.blm,
                                            type: 'querylist',
                                            param: child.listConfig,
                                            xlkitem: child// 此为了后续赋值使用，查询sql中用不到
                                        })
                                    } else if (child.listMethod && child.listMethod) {
                                        this.list[child.blm] = this.commonsJs.funcEval1(this, {}, child.listMethod)
                                    }
                                }
                            })
                        }
                    })
                }
                if (this.zjConfigdata.titleButtons && this.zjConfigdata.titleButtons.length > 0) {
                    this.zjConfigdata.titleButtons.forEach((item) => {
                        if (item.componentType === 'jselect' || item.componentType === 'jradio' || item.componentType === 'jcheckbox' || item.componentType == 'jswitch') {
                            if (item.listType == '4' || (item.list && item.list.length > 0)) {
                                this.getList(item)
                            } else if (item.listId) {
                                sqlidList.push({
                                    sqlid: item.listId,
                                    blm: item.blm,
                                    type: 'querylist',
                                    param: { ...this.propstocomponent },
                                    xlkitem: item// 此为了后续赋值使用，查询sql中用不到
                                })
                            } else if (item.listConfig && item.listConfig.listBm && item.listConfig.listDm && item.listConfig.listMc) {
                                sqlidList.push({
                                    sqlid: 'DC37EB84F52E3520E0555943CA7634DE',
                                    blm: item.blm,
                                    type: 'querylist',
                                    param: item.listConfig,
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
                        })
                    })
                }
            },
            getList (item) {
                if (item.listType == '4') {
                    let list = this.$root.list[item.listBm]
                    if (!list) list = []
                    this.list[item.blm] = list
                } else if (item.list && item.list.length > 0) { this.list[item.blm] = item.list }
            },

            titleComponentKeypress (item, index, event) {
                const keycode = event.key
                const obj = {
                    item,
                    value: event,
                    data: this.titledata,
                    tableName: this.zjConfigdata.blm,
                    blm: item.blm,
                    keycode
                }
                if (item.keypressInside) {
                    this.commonsJs.funcEval(this, obj, item.keypressInside)
                }

                if (item.keypress) obj.method = item.keypress
                this.$emit('commonMethod', obj);
            },
            // title区组件change
            titleComponentChange (item, index, event) {
                if (item.componentType != 'jselect') return
                this.titledata[item.blm] = event
                const obj = {
                    item,
                    value: event,
                    data: this.titledata,
                    tableName: this.zjConfigdata.blm,
                    blm: item.blm
                }
                if (item.changeInside) { this.commonsJs.funcEval(this, obj, item.changeInside); } // 组件数据变化内部执行方法
                if (item.change) obj.method = item.change
                this.$emit('commonMethod', obj)// 新版本规范导出obj
            },
            titlebuttonclick (item) {
                const obj = { tableName: this.zjConfigdata.blm, item, selecteddata: this.tableselecteddata, data: this.data, blm: item.blm, method: item.click }
                if (item.clickInside) this.commonsJs.funcEval(this, item, item.clickInside)
                if (item.click) {
                    obj.method = item.click
                    this.$emit('commonMethod', obj)
                }
            },

            callItemClick (blm, rowdata) {
                const item = this.commonsJs.findChildNode('blm', this.columnSlot, blm, 'slotChildren')
                this.handleItemClick(item, null, rowdata)
            },
            handleItemClick (item, index, rowdata) {
                if (
                    (item.blm == 'deleteButton' || item.blm == 'delete') &&
                    this.deleteId
                ) { this.confirmDelete(index, item, rowdata); }
                const tableId = this.zjConfigdata.tableId || 'id'
                let row = this.commonsJs.findChildNode(tableId, this.data, rowdata[tableId])
                if (!row) row = rowdata
                const obj = {
                    ...this.propstocomponent,
                    tableName: this.zjConfigdata.blm,
                    blm: item.blm,
                    row,
                    data: this.data,
                    index
                };
                if (item.clickInside) this.commonsJs.funcEval(this, obj, item.clickInside)
                if (item.click) {
                    obj.method = item.click
                    this.$emit('commonMethod', obj);
                }
            },
            handleBlur (item, index, rowdata) {
                const value = rowdata[item.blm]
                const obj = {
                    ...this.propstocomponent,
                    tableName: this.zjConfigdata.blm,
                    blm: item.blm,
                    row: rowdata,
                    data: this.data,
                    index,
                    value
                };
                if (item.blurInside) this.commonsJs.funcEval(this, obj, item.blurInside)
                if (item.blur) {
                    obj.method = item.blur
                    this.$emit('commonMethod', obj);
                }
            },
            // 对于table里slot组件赋值递归处理数据
            finddata (data, id, blm, value, attrs = {}, list) {
                let flag = false
                let row = {}
                data.forEach((res) => {
                    if (id && res[this.zjConfigdata.tableId] == id) {
                        res[blm] = value
                        if (attrs && Object.keys(attrs).length > 0) res.attrs = attrs
                        if (list) {
                            if (!res.itemList) res.itemList = {}
                            res.itemList[blm] = list
                        }
                        flag = true
                        row = res
                    } else {
                        if (res.children && res.children.length > 0 && !flag) {
                            row = this.finddata(res.children, id, blm, value)
                        }
                    }
                })
                return row
            },
            // table里cell数据变化触发
            handleOnChange (item, index, rowdata, event) {
                if (this._handlingChange) return
                this._handlingChange = true
                let value = rowdata[item.blm]
                if (item.componentType == 'date-picker' || item.componentType == 'DatePicker') {
                    value = event
                    rowdata[item.blm] = event
                }
                const id = rowdata[this.zjConfigdata.tableId] || 'id'
                // this.finddata(this.data,id,item.blm,value)
                // let row = rowdata
                const row = this.finddata(this.data, id, item.blm, value)
                const obj = {
                    ...this.propstocomponent,
                    tableName: this.zjConfigdata.blm,
                    blm: item.blm,
                    row,
                    data: this.data,
                    index,
                    value
                };
                if (item.changeInside) this.commonsJs.funcEval(this, obj, item.changeInside)
                if (item.change) {
                    obj.method = item.change
                    this.$emit('commonMethod', obj)
                }
                if (item.componentType == 'jselect' && item.triggerObject) {
                    let triggerItem = {}
                    this.columnSlot.forEach((item1) => {
                        if (item1.slotChildren && item1.slotChildren.length > 0) {
                            item1.slotChildren.forEach((item2) => {
                                if (item2.blm == item.triggerObject) {
                                    triggerItem = item2
                                }
                            })
                        }
                    })
                    delete row[triggerItem.blm]
                    if (triggerItem.listId) {
                        this.commonsJs.incoRequest('querylist', triggerItem.listId, { ...this.propstocomponent, [item.blm]: value }).then((res) => {
                            if (!row.itemList) row.itemList = {}
                            row.itemList[triggerItem.blm] = res;
                            this.finddata(this.data, id, triggerItem.blm, value, {}, res)
                        });
                    } else if (triggerItem.listConfig && triggerItem.listConfig.listBm && triggerItem.listConfig.listDm && triggerItem.listConfig.listMc) {
                        this.commonsJs.incoRequest('querylist', 'DC37EB84F52E3520E0555943CA7634DE', triggerItem.listConfig)
                            .then((res) => {
                                if (!row.itemList) row.itemList = {}
                                row.itemList[triggerItem.blm] = res;
                                this.finddata(this.data, id, triggerItem.blm, value, {}, res)
                            });
                    }
                }
                if (item.componentType == 'date-picker' || item.componentType == 'DatePicker') { // 处理日期组件回显问题
                    if (!row.attrs) row.attrs = {}
                    // 用于设置截至时间小于开始时间不可选
                    if (item.triggerObject) {
                        if (!row[item.blm] || row[item.blm] > row[item.triggerObject]) {
                            row[item.triggerObject] = ''
                            this.finddata(this.data, id, item.triggerObject, '')
                        }
                        const kssj = new Date(event).getTime()

                        if (!row.attrs[item.triggerObject]) row.attrs[item.triggerObject] = {}
                        row.attrs[item.triggerObject].options = {
                            disabledDate: function (date) {
                                return date.valueOf() <= kssj - 86400000;
                            }
                        }
                    }
                    if (item.triggerFatherName) {
                        const kssj = row[item.triggerFatherName]
                        const d = new Date(kssj)
                        const year = d.getFullYear()
                        const month = d.getMonth()
                        const day = d.getDate()
                        const hour = d.getHours()
                        const minute = d.getMinutes()
                        const second = d.getSeconds()
                        const jssj = row[item.blm]
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
                        if (!row.attrs[item.blm]) row.attrs[item.blm] = {}
                        row.attrs[item.blm]['time-picker-options'] = {
                            'disabled-hours': disabledHours,
                            'disabled-minutes': disabledMinute,
                            'disabled-seconds': disabledSeconds
                        }
                    }
                    this.finddata(this.data, id, item.blm, value, row.attrs)
                }

                // 处理展开的tree数据
                if (this.zjConfigdata.attrs && this.zjConfigdata.attrs['row-key'] && this.expandtreekey && this.expandtreekey.length > 0 && this.data && this.data.length > 0) {
                    this.handleExpandTree(this.data);
                }
                this.$nextTick(() => { this._handlingChange = false })
            },
            handleExpandTree (data) {
                data.forEach((item) => {
                    this.expandtreekey.forEach((item2) => {
                        if (item[this.zjConfigdata.attrs['row-key']] == item2) {
                            item._showChildren = true
                        }
                    })
                    if (item.children && item.children.length > 0) {
                        this.handleExpandTree(item.children)
                    }
                })
            },

            handleRowClick (item, index) {
                if (this.zjConfigdata.rowClick) {
                    const obj = {
                        ...this.propstocomponent,
                        tableName: this.zjConfigdata.blm,
                        row: this.zjConfigdata.zjlx === 'vxe-table' ? item.row : item,
                        index: this.zjConfigdata.zjlx === 'vxe-table' ? item.rowIndex : index,
                        data: this.data,
                        method: this.zjConfigdata.rowClick
                    };
                    this.$emit('commonMethod', obj)
                }
            },
            handleOnrowdbclick (item, index) {
                if (this.zjConfigdata.rowdbclick) {
                    const obj = {
                        ...this.propstocomponent,
                        tableName: this.zjConfigdata.blm,
                        row: this.zjConfigdata.zjlx === 'vxe-table' ? item.row : item,
                        index: this.zjConfigdata.zjlx === 'vxe-table' ? item.rowIndex : index,
                        data: this.data,
                        method: this.zjConfigdata.rowdbclick
                    };
                    this.$emit('commonMethod', obj);
                }
            },
            handleOnexpandtree (rowkey, status) {
                let tableid = 'id'
                if (this.zjConfigdata.attrs && this.zjConfigdata.attrs['row-key']) { tableid = this.zjConfigdata.attrs['row-key'] } else if (this.zjConfigdata.attrsMethod) {
                    const attrs = this.commonsJs.funcEval1(this, {}, this.zjConfigdata.attrsMethod)
                    if (attrs && attrs['row-key']) tableid = attrs['row-key']
                }
                const row = this.getRowById(tableid, rowkey, this.data)
                if (status) {
                    this.expandtreekey.push(rowkey)
                    row._showChildren = true
                } else {
                    const index = this.expandtreekey.indexOf(rowkey);
                    if (index !== -1) {
                        this.expandtreekey.splice(index, 1);
                        row._showChildren = false
                    }
                }
            },
            getRowById (rowkey, id, data) {
                let findRow = null
                for (const item of data) {
                    if (item[rowkey] === id) {
                        findRow = item
                        break
                    } else {
                        if (item.children && item.children.length > 0) {
                            findRow = this.getRowById(rowkey, id, item.children)
                        }
                    }
                }
                if (findRow) return findRow
            },
            handleselecteddata () {
                if (this.ref[this.fathername]) this.ref[this.fathername].data[this.componentName] = this.tableselecteddata
            },
            handleResetColumn () {
                this.tableColumns.forEach((item) => { item.show = true })
            },
            handleChangeTableSize (size) {
                this.attrs.size = size
            },
            // tableselecteddata
            addToTableselecteddata (row) {
                const id = this.zjConfigdata.tableId || 'id'
                let exist = false
                if (this.zjConfigdata.sfdx === '0') {
                    this.markSingleSelect(row)
                } else {
                    for (const item of this.tableselecteddata) {
                        if (item[id] === row[id]) {
                            exist = true
                            break
                        }
                    }
                    if (!exist) this.tableselecteddata.push(row)
                }
            },
            deleteTableSelectData (row) {
                const id = this.zjConfigdata.tableId || 'id'
                let index = -2
                for (let i = 0; i < this.tableselecteddata.length; i++) {
                    const item = this.tableselecteddata[i]
                    if (item[id] === row[id]) { index = i; break }
                }
                if (index !== -2) { this.tableselecteddata.splice(index, 1) }
            },
            handleSelect (selection, row) {
                if (this.zjConfigdata.zjlx === 'vxe-table') {
                    if (selection.checked) this.addToTableselecteddata(selection.row)
                    else this.deleteTableSelectData(selection.row)
                    // this.tableselecteddata = JSON.parse(JSON.stringify(selection.records))
                    // this.handleselecteddata()
                } else this.addToTableselecteddata(row)
            }, // 选择
            handleSelectCancel (selection, row) { this.deleteTableSelectData(row) }, // 取消选择
            handleVxeRadioChange (obj) {
                this.tableselecteddata = [obj.row]
                this.handleselecteddata()
            },
            handleVxeSelectAll (obj) {
                if (obj.checked) {
                    this.data.forEach((row) => {
                        this.addToTableselecteddata(row)
                    })
                } else {
                    this.data.forEach((row) => {
                        this.deleteTableSelectData(row)
                    })
                }
            },
            handleSelectAll () { for (const row of this.data) this.addToTableselecteddata(row) },
            handleSelectAllCancel () { for (const row of this.data) this.deleteTableSelectData(row) },
            markSingleSelect (row) {
                if (!row) return
                const id = this.zjConfigdata.tableId
                this.tableselecteddata = []
                if (Object.keys(row).length > 0) this.tableselecteddata.push(row)
                for (let i = 0; i < this.data.length; i++) {
                    const item = this.data[i]
                    if (item[id] === row[id]) {
                        this.data[i]._checked = true
                    } else {
                        this.data[i]._checked = false
                    }
                }
            },
            /**
             * 标注查询table数据的返回值后，标注选中状态
             * @param {*} res
             */
            markSelected (res) {
                const id = this.zjConfigdata.tableId
                const selectedList = JSON.parse(JSON.stringify(this.tableselecteddata))
                if (res && res.length > 0) {
                    res.forEach((row) => {
                        let markflag = false
                        if (selectedList && selectedList.length > 0) {
                            for (let i = 0; i < selectedList.length; i++) {
                                const item = selectedList[i]
                                if (item[id] === row[id]) {
                                    row._checked = true
                                    selectedList.splice(i, 1)
                                    markflag = true
                                    break
                                }
                            }
                        }
                        row._checked = markflag
                    })
                }
                return res
            },
            /**
             * 改变选中状态：此方法是通过外部，给一个行信息，标注改行选中与否（如果选择，则取消选择，如果没选中，变成选择）
             * 该方法一般是通过外部按钮等操作来触发
             */
            toggleselecteddata (row) {
                const id = this.zjConfigdata.tableId
                let index = -1
                this.data.forEach((item, itemIndex) => {
                    if (item[id] === row[id]) index = itemIndex
                })
                if (index !== -1) this.$refs.table.toggleSelect(index)
            },
            async query (data, queryType = { source: 'out' }) {
                // 处理传递给tableform的数据，即将tableform和propsToComponent合并
                let tableform = {}
                let queryId = this.queryId
                if (this.zjConfigdata.funcId && this.zjConfigdata.funcId.queryId) queryId = this.zjConfigdata.funcId.queryId
                if (this.ref[this.zjConfigdata.tableformName] && this.ref[this.zjConfigdata.tableformName].data) tableform = this.ref[this.zjConfigdata.tableformName].data
                let obj = { ...this.propstocomponent, ...tableform, ...data }
                if (this.zjConfigdata.beforeQueryInside) {
                    obj = await this.commonsJs.funcEval1(this, obj, this.zjConfigdata.beforeQueryInside)
                }
                if (queryId) {
                    // 判断是否有分页，处理分页功能，默认设置有分页
                    this.columns_meta.loading = true;
                    this.data = []

                    // 配置是否有分页的规则：如果配置没有分页，则queryList，如果不配或配置为有分页，则按分页查询
                    if (this.zjConfigdata.havePage === '0') {
                        let res = null
                        if (this.zjConfigdata.childrenQuery) {
                            const multiParam = {
                                sqlid: queryId,
                                type: 'querylist',
                                blm: 'data',
                                param: { ...obj },
                                children: this.commonsJs.funcEval1(this, obj, this.zjConfigdata.childrenQuery)
                            }
                            const res_mul = await this.commonsJs.multiquery([multiParam])
                            res = res_mul.data
                        } else res = await this.commonsJs.incoRequest('querylist', queryId, obj)
                        // 处理展开的tree数据
                        if (this.zjConfigdata.attrs && this.zjConfigdata.attrs['row-key'] && this.expandtreekey && this.expandtreekey.length > 0 && res && res.length > 0) {
                            this.handleExpandTree(res);
                        }
                        // 查询后的内部处理方法
                        if (this.zjConfigdata.queryInside) {
                            res = await this.commonsJs.funcEval(this, res, this.zjConfigdata.queryInside);
                        }
                        this.data = res
                        this.columns_meta.loading = false;
                        const outsideObj = { tableName: this.zjConfigdata.blm, data: this.data }
                        if (this.zjConfigdata.queryOutside) {
                            outsideObj.method = this.zjConfigdata.queryOutside
                            this.$emit('commonMethod', outsideObj)
                        }
                    } else {
                        if (queryType.source == 'out') { this.page.pageNum = 1; }
                        if (!this.zjConfigdata.havePage || this.zjConfigdata.havePage === '1') Object.assign(obj, this.page)
                        let res = null
                        if (this.zjConfigdata.childrenQuery) {
                            const multiParam = {
                                sqlid: queryId,
                                type: 'querybypage',
                                blm: 'data',
                                param: { ...obj },
                                children: this.commonsJs.funcEval1(this, obj, this.zjConfigdata.childrenQuery)
                            }
                            const res_mul = await this.commonsJs.multiquery([multiParam])
                            res = res_mul.data
                        } else res = await this.commonsJs.incoRequest('querybypage', queryId, obj)
                        // 处理展开的tree数据
                        if (this.zjConfigdata.attrs && this.zjConfigdata.attrs['row-key'] && this.expandtreekey && this.expandtreekey.length > 0 && res.list && res.list.length > 0) {
                            this.handleExpandTree(res.list);
                        }

                        // 查询后的内部处理方法
                        if (this.zjConfigdata.queryInside) {
                            res = await this.commonsJs.funcEval(this, res, this.zjConfigdata.queryInside);
                        }
                        this.page.total = res.total;
                        this.markSelected(res.list);

                        this.data = res.list
                        this.columns_meta.loading = false;
                        const outsideObj = { tableName: this.zjConfigdata.blm, data: this.data }
                        if (this.zjConfigdata.queryOutside) {
                            outsideObj.method = this.zjConfigdata.queryOutside
                            this.$emit('commonMethod', outsideObj)
                        }
                        if (this.zjConfigdata.zjlx === 'vxe-table') {
                            this.$nextTick(() => {
                                const $table = this.$refs[this.zjConfigdata.blm];
                                if ($table) {
                                    const selectedData = []
                                    this.tableselecteddata.forEach(row => {
                                        const newrow = res.list.find(item => item[this.zjConfigdata.tableId || 'id'] === row[this.zjConfigdata.tableId || 'id'])
                                        if (newrow) selectedData.push(newrow)
                                    })
                                    $table.setCheckboxRow(selectedData, true);
                                }
                            })
                        }
                        // console.log('table query',this.componentName,res,this.fathername)
                    }
                }
            },
            refreshtable () {
                this.query(this.tableform, { source: 'in' });
            },

            // handleQueryRes(obj) {
            //   this.commonsJs.funcEval(this,obj,this.zjConfigdata.tableQueryResInside)
            // },
            changeByPageNum (value) {
                this.page.pageNum = value;
                // 如果有自定义的分页方法，执行自定义方法，否则执行系统的查询
                if (this.zjConfigdata.pageButtonClick) {
                    this.commonsJs.funcEval(this, {}, this.zjConfigdata.pageButtonClick)
                } else this.query({}, { source: 'in' });
            },
            changeByPageSize (value) {
                this.page.pageSize = value;
                if (this.zjConfigdata.pageButtonClick) { this.commonsJs.funcEval(this, {}, this.zjConfigdata.pageButtonClick) } else this.query({}, { source: 'in' });
            },
            confirmDelete (index, item, row) {
                console.log('confirmDelete', index, item, row)
                const deleteId = this.deleteId
                const delTitle = '删除提醒';
                const delContent = '您确定要删除此行信息吗，一旦删除将无法恢复';
                const delTitle_en = '';
                const delContent_en = '';
                this.$Modal.confirm({
                    title: delTitle,
                    content: delContent,
                    onOk: () => {
                        this.$Spin.show()
                        this.commonsJs.incoRequest(
                            'delete',
                            deleteId,
                            { ...this.propstocomponent, ...row }
                        ).then((res) => {
                            const obj = {
                                tableName: this.zjConfigdata.blm,
                                row, // 返回行内容
                                index, // 返回行索引
                                blm: item.blm, // 返回行按钮变量名
                                item // 返回行的按钮配置信息
                            };
                            // 删除时，如果删除的当前数据只有一条，并且pangeNum大于一时，计算页码
                            if (this.data.length === 1 && this.page.pageNum > 1) { this.page.pageNum = this.page.pageNum - 1; }
                            this.deleteTableSelectData(row) // 删除数据时，要把选择的信息删除
                            if (this.zjConfigdata.deleteInside) this.commonsJs.funcEval(this, obj, this.zjConfigdata.deleteInside) // 执行删除内部方法
                            if (this.zjConfigdata.deleteOutside) {
                                obj.method = this.zjConfigdata.deleteOutside
                                this.$emit('commonMethod', obj)
                            }
                            this.$Spin.hide()
                            this.$Message.success('删除成功')
                            this.query({}, { source: 'in' });
                        });
                    },
                    onCancel: () => {
                        this.$Message.info('取消删除');
                    }
                });
                this.columns_meta.loading = false;
            },
            handleDrag (start, end) {
                this.commonsJs.moveArrayItem(this.data, start, end)
            },
            handleSpan (row, column, rowIndex, columnIndex) {
                if (this.zjConfigdata.spanMethod) {
                    this.commonsJs.funcEval1(this, { row, column, rowIndex, columnIndex }, this.zjConfigdata.spanMethod)
                }
            },
            commitMethod (obj) {
                if (obj.method) {
                    if (!obj.componentName || obj.componentName === this.componentName) this.commonsJs.funcEval(this, obj, obj.method)
                    else this.$emit('commonMethod', obj)
                }
            },
            resizeWindow () {
                if (this.zjConfigdata.attrsMethod) {
                    const attrs = this.computeTableAttrs()
                    this.attrs = attrs
                }
            }
        },
        watch: {
            // componentName: {
            //       handler(n,o) {
            //           if (n) {
            //             this.$nextTick(()=>{
            //                 if (!this.$root.componentRefs) {this.$set(this.$root,'componentRefs',{})}
            //                 this.$set(this.$root.componentRefs,this.componentName,this)
            //             })
            //           }
            //       },deep:true,immediate:true
            //   },
            childmethodparams: {
                handler (n, o) {
                    if (n && n.methodName) {
                        this.$nextTick(() => {
                            this.$emit('excutefunc', n)
                        })
                    }
                },
                deep: true,
                immediate: true
            },
            configdata: {
                async handler (n, o) {
                    if (n && n.blm) {
                        this.componentName = n.blm + (this.index ? this.index : '')
                        if (!this.$root.componentRefs) { this.$root.componentRefs = {} }
                        this.$root.componentRefs[this.componentName] = this
                        if (n.hqpzfs === 'query' && n.yyid) {
                            const res = await this.commonsJs.getzjpzxx(n.yyid) // 获取zjpzxx
                            res.blm = n.blm;
                            this.zjConfigdata = res;
                        } else this.zjConfigdata = JSON.parse(JSON.stringify(n))
                        const titleButtons = this.zjConfigdata.titleButtons || []
                        if (titleButtons.length == 0) {
                            if (this.zjConfigdata.tableTitleButtons && this.zjConfigdata.tableTitleButtons.length > 0) { this.zjConfigdata.titleButtons = this.zjConfigdata.tableTitleButtons }
                        }
                    }
                },
                deep: true,
                immediate: true
            },
            zjConfigdata: {
                handler (n, o) {
                    if (this.zjConfigdata.blm) {
                        if (this.zjConfigdata.createClass) this.commonsJs.loadCssCode(this.zjConfigdata.createClass, n.blm)
                        this.initTable()
                        if (n.configdataChangeMethod) this.commonsJs.funcEval(this, { configdata: n, data: this.data }, n.configdataChangeMethod)
                        window.addEventListener('resize', this.resizeWindow);
                    }
                },
                deep: true,
                immediate: true
            },
            setdata: {
                handler (n) {
                    // console.log(this.setdata.data,'print from jTable.vue of watch setdata')
                    if (this.setdata.id) this.data = this.setdata.data
                },
                deep: true,
                immediate: true
            },
            // //监测根的传递参数的变化，如果变化了，看是否有本组件的数据，如果有本组件的数据，调用处理
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
            },
            propstocomponent: {
                handler (n, o) {
                    if (this.zjConfigdata.propschangeMethod) {
                        this.commonsJs.funcEval1(this, n, this.zjConfigdata.propschangeMethod)
                    }
                },
                deep: true,
                immediate: true
            },
            tableselecteddata: {
                handler (n, o) {
                    this.$emit('selectDataChange', n)
                    if (this.zjConfigdata.selecteddataMethod) {
                        const method = this.zjConfigdata.selecteddataMethod
                        this.$emit('commonMethod', { selectdata: n, method })
                    }
                },
                deep: true,
                immediate: true
            }
        },

        computed: {
            ...mapState('admin/user', ['info']),
            tableid () {
                let id = 'id'
                if (this.zjConfigdata.tableId) id = this.zjConfigdata.tableId
                return id
            },
            queryId () {
                let queryId = null
                if (this.zjConfigdata.queryId) queryId = this.zjConfigdata.queryId
                else if (this.zjConfigdata.funcId && this.zjConfigdata.funcId.queryId) queryId = this.zjConfigdata.funcId.queryId
                return queryId
            },
            deleteId () {
                let deleteId = null
                if (this.zjConfigdata.deleteId) deleteId = this.zjConfigdata.deleteId
                if (this.zjConfigdata.funcId && this.zjConfigdata.funcId.deleteId) deleteId = this.zjConfigdata.funcId.deleteId
                return deleteId
            },
            getColumns () {
                const arr = [];
                if (this.tableColumns && this.tableColumns.length > 0) {
                    this.tableColumns.forEach((item) => {
                        // 处理columns的attrs
                        if (item.attrs) {
                            for (const attrName in item.attrs) {
                                item[attrName] = item.attrs[attrName]
                            }
                        }
                        if (item.attrsMethod) {
                            const attrs = this.commonsJs.funcEval1(this, {}, item.attrsMethod)
                            item = { ...item, ...attrs }
                        }
                        let returnValue = this.vif[item.blm]
                        if (this.zjConfigdata.zjlx === 'vxe-table') {
                            if (item.tooltip) item.showOverflow = true
                        }
                        if (item.condition && item.condition.trim()) returnValue = this.commonsJs.funcEval1(this, {}, item.condition) // condition为true时，返回true
                        if (item.show === false) returnValue = false
                        if (returnValue) arr.push(item)
                    })
                }
                return arr;
            },
            additionButtonConditon () {
                const obj = {}
                if (this.zjConfigdata.additionSelectButton && this.zjConfigdata.additionSelectButton.length > 0) {
                    this.zjConfigdata.additionSelectButton.forEach(item => {
                        if (item == 'md') obj.md = true
                        if (item == 'sx') obj.sx = true
                        if (item == 'lsz') obj.lsz = true
                    })
                }
                return obj
            },
            selectedData () {
                return this.tableselecteddata
            }
        },
        created () {},
        mounted () {},
        // updated(){
        //   //监测根的传递参数的变化，如果变化了，看是否有本组件的数据，如果有本组件的数据，调用处理
        //   if (this.$root.componentsParam[this.componentName]) {
        //     let myComponentsParam=JSON.parse(JSON.stringify(this.$root.componentsParam[this.componentName]))
        //     delete this.$root.componentsParam[this.componentName]
        //     this.handleRootFunction(myComponentsParam)
        //   }
        // },
        beforeUnmount () {
            window.removeEventListener('resize', this.resizeWindow)
            if (this.$options.components) {
                for (const key in this.$options.components) {
                    delete this.$options.components[key]
                }
            }
            delete this.$root.componentRefs[this.componentName]
            this.commonsJs.removeCssCode(this.componentName)
        }
    };
</script>
<style>
.dx th .ivu-table-cell.ivu-table-cell-with-selection .ivu-checkbox-wrapper{
display: none;
}
.ivu-table-cell-slot{
  display: inline-block;
  width:100%;
}
</style>
