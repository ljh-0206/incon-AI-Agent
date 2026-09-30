<template>
  <!-- modal的属性一旦从父组件传过来，再改变不会渲染 -->
  <div style="width:100%">
    <component :is="modalType" :model-value="value||modelValue" v-bind="modalAttrs"
      @on-visible-change="open">
      <!-- 如果配置表单按钮显示在header -->
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div v-if="modalAttrs.title" style="flex:1;margin-left:5px">
            <Icon v-if="zjConfigdata.titleIcon" :type="zjConfigdata.titleIcon" :style="styles.titleIconStyle" />
            <b :style="styles.titleStyles"> {{ modalAttrs.title }}</b>
          </div>
          <div style="margin-right:20px" v-if="zjConfigdata.buttonsPosition === 'header'">
            <template v-for="(buttonitem, buttonindex) in zjConfigdata.titleButtons">
              <Button v-if="computeKyf(buttonitem)" :loading="loading"
                :key="'modalbutton' + buttonindex + _uid + buttonitem.blm" v-bind="computeItemAttrs(buttonitem)"
                style="margin:0 0 0 10px;" :style="computeItemStyle(buttonitem)"
                @click="handleTitleButtonClick(buttonitem)">
                <timecountdown v-if="buttonitem.seconds" :configdata="buttonitem" :opentype="opentype"
                  @commonMethod="commitMethod" />
                {{ buttonitem.content }}
              </Button>
            </template>
          </div>
        </div>
      </template>
      <!-- 此div是为了对form表单与锚点的布局 -->
      <div
        :style="{ width: '100%', height: formContentHeight, padding: '16px', 'overflow-y': 'auto', 'overflow-x': 'hidden', display: 'flex', position: 'relative' }"
        class="jform" :class="zjConfigdata.class" :id="zjConfigdata.blm + '_formDiv'">
        <div style="flex: 1;width:100%;">
          <Button v-if = "env()"  @click="test">jform test</Button>
          <i-form ref="form" :model="data" :rules="rules" v-bind="computeFormAttrs()" class="jform"
            onsubmit="return false" :id="zjConfigdata.blm" :style="computeFormStyle()"
            :class="opentype === 'show' ? 'view' : ''">
            <Row style="width:100%">
              <template v-for="(item, index) in zjConfigdata.fields">
                <i-col v-if="item.componentType == 'date-picker' && computeKyf(item)"
                  style="width:100%" :style="computeColStyle(item)" v-show="vshow[item.blm]" :span="item.colspan||24"
                  :key="item.blm + index + 'date-picker'">
                  <form-item :label-width="item.labelWidth" :label="item.labelWidth === -1 ? '' : item.mc||item.label"
                    :prop="item.blm" :ref="'formitem_' + item.blm">
                    <date-picker :ref="item.blm" :id="item.blm" :style="computeItemStyle(item)"
                      :key="item.blm + index + _uid" :class="componentClass[item.blm]" :model-value="data[item.blm]"
                      v-bind="computeItemAttrs(item)" :editable="false" style="width: 100%"
                      @on-change="handleChange(item, $event)"
                      @on-open-change="openDatePicker(item, $event)"></date-picker>
                  </form-item>
                </i-col>
                <i-col style="width:100%"
                  v-else-if="item.componentType == 'formlayout' && computeKyf(item)"
                  :span="item.colspan||24" :key="'havechild' + _uid + index" v-bind="computeItemAttrs(item)"
                  :style="computeItemStyle(item)">
                  <Row>
                    <template v-for="(childItem, childIndex) in item.children">
                      <i-col v-if="computeKyf(childItem)" style="width:100%"
                        :style="computeColStyle(childItem)" v-show="vshow[childItem.blm]" :span="childItem.colspan||24"
                        :key="'child' + _uid + childIndex + childItem.blm">
                        <form-item :label-width="childItem.labelWidth"
                          :label="childItem.labelWidth === -1 ? '' : childItem.label" :prop="childItem.blm"
                          :ref="'formitem_' + childItem.blm">
                          <date-picker v-if="childItem.componentType == 'date-picker'" :id="childItem.blm"
                            :ref="childItem.blm" :style="computeItemStyle(childItem)"
                            :class="componentClass[childItem.blm]" :model-value="data[childItem.blm]"
                            v-bind="computeItemAttrs(childItem)" :editable="false"
                            @on-change="handleChange(childItem, $event)"
                            @on-open-change="openDatePicker(childItem, $event)" style="width: 100%">
                          </date-picker>
                          <component v-else :is="childItem.componentType" :id="childItem.blm" :ref="childItem.blm"
                            :key="childItem.blm + childIndex + _uid" :fathername="componentName"
                            :style="computeItemStyle(childItem)" :class="componentClass[childItem.blm]"
                            :propstocomponent="propstochild[childItem.blm]" :opentype="opentype"
                            v-model="data[childItem.blm]" v-bind="computeItemAttrs(childItem)" :configdata="childItem"
                            :list="list[childItem.blm]" @click="handlecomponentclick(childItem, $event)"
                            @on-blur="handleBlur(childItem, $event)" @on-change="handleChange(childItem, $event)"
                            @keypress="handleKeypress(childItem, $event)" @input.native="handleRawInput(childItem, $event)"
                            @commonMethod="commitMethod" v-on="computeComponentEvent(childItem)">
                            <template v-if="childItem.xscontent != '0'">
                              {{ childItem.content ? childItem.content : data[childItem.blm] }}
                            </template>
                          </component>
                        </form-item>
                      </i-col>
                    </template>
                  </Row>
                </i-col>
                <i-col v-else-if="item.componentType == 'docker' && computeKyf(item)"
                  v-show="vshow[item.blm]" :span="item.colspan||24" :key="'docker' + item.blm + _uid + index"
                  v-bind="computeItemAttrs(item)" style="width:100%" :style="computeItemStyle(item)">
                  <div :style="item.style">
                    <form-item :label-width="item.labelWidth" :label="item.labelWidth === -1 ? '' : item.mc ||item.label"
                      :prop="item.blm" :ref="'formitem_' + item.blm">
                      <div style="display: flex;flex-wrap: wrap;">
                        <template v-for="(childItem, childIndex) in item.children">
                          <date-picker v-if="childItem.componentType == 'date-picker' && computeKyf(childItem)"
                            :id="childItem.blm" :ref="childItem.blm" :key="childItem.blm + childIndex + _uid"
                            :style="computeItemStyle(childItem)" :class="componentClass[childItem.blm]"
                            :model-value="data[childItem.blm]" v-bind="computeItemAttrs(childItem)" :editable="false"
                            @on-change="handleChange(childItem, $event)"
                            @on-open-change="openDatePicker(childItem, $event)" style="width: 100%">
                          </date-picker>
                          <component
                            v-else-if="computeKyf(childItem) && childItem.componentType != 'docker'"
                            :is="childItem.componentType" :id="childItem.blm" :ref="childItem.blm"
                            :key="childItem.blm + _uid + childIndex" :fathername="componentName"
                            :propstocomponent="propstochild[childItem.blm]" :opentype="opentype"
                            v-model="data[childItem.blm]" v-bind="computeItemAttrs(childItem)"
                            :style="computeItemStyle(childItem)" :class="componentClass[childItem.blm]"
                            :configdata="childItem" :list="list[childItem.blm]" @on-blur="handleBlur(childItem, $event)"
                            @on-change="handleChange(childItem, $event)"
                            @keypress.native="handleKeypress(childItem, $event)"
                            @input.native="handleRawInput(childItem, $event)"
                            @click="handlecomponentclick(childItem, $event)" @commonMethod="commitMethod"
                            v-on="computeComponentEvent(childItem)">
                            <template v-if="childItem.xscontent != '0'">
                              {{ childItem.content ? childItem.content : data[childItem.blm] }}
                            </template>
                          </component>
                        </template>
                      </div>

                    </form-item>
                  </div>
                </i-col>
                <i-col v-else-if="item.componentType == 'span' && computeKyf(item)" :ref="item.blm"
                  :style="computeItemStyle(item)" :class="componentClass[item.blm]"
                  v-html="item.content ? $xss(item.content) : $xss(data[item.blm])"
                  @click="handlecomponentclick(item, $event)">
                </i-col>
                <i-col v-else-if="computeKyf(item)" style="width:100%" :style="computeColStyle(item)"
                  v-show="vshow[item.blm]" :span="item.colspan||24"
                  :key="'formItem4' + _uid + index + item.blm">
                  <form-item :label-width="item.labelWidth" :label="item.labelWidth === -1 ? '' : item.mc ||item.label"
                    :prop="item.blm" :ref="'formitem_' + item.blm">
                    <component :is="item.componentType" :id="item.blm" :ref="item.blm" :key="item.blm + _uid + index"
                      :fathername="componentName" :propstocomponent="propstochild[item.blm]" :opentype="opentype"
                      v-model="data[item.blm]" v-bind="computeItemAttrs(item)" :style="computeItemStyle(item)"
                      :class="componentClass[item.blm]" :configdata="item" :list="list[item.blm]"
                      @on-blur="handleBlur(item, $event)" @on-change="handleChange(item, $event)"
                      @keypress.native="handleKeypress(item, $event)" @input.native="handleRawInput(item, $event)"
                      @click="handlecomponentclick(item, $event)" @commonMethod="commitMethod"
                      v-on="computeComponentEvent(item)">
                      <template v-if="item.xscontent != '0'">
                        {{ item.content ? item.content : data[item.blm] }}
                      </template>
                    </component>
                  </form-item>
                </i-col>
              </template>
            </Row>
          </i-form>
        </div>
        <div v-if="anchor.anchorList && anchor.anchorList.length > 0" style="width: 140px;"
          :style="computeAnchorStyle()">
          <janchor :fathername="zjConfigdata.blm" :attrs="anchor.anchorAttrs" :value="anchor.anchorList"
            style="position: fixed;"></janchor>
        </div>
      </div>
      <!--如果没有配置按钮位置或者按钮位置配置为底部  -->
      <template v-if="(zjConfigdata.buttonsPosition === 'footer' || !zjConfigdata.buttonsPosition) && zjConfigdata.titleButtons && zjConfigdata.titleButtons.length > 0 && modalType === 'Drawer'">
        <!-- 如果是Drawer抽屉，因为它没有slot，需要单独处理 -->
        <div style="text-align: center;"
          :style="computeButtonFrameStyle">
          <template v-for="(buttonitem, buttonindex) in zjConfigdata.titleButtons">
            <Button v-if="computeKyf(buttonitem)" :loading="loading"
              :key="'modalbutton' + buttonindex + _uid + buttonitem.blm" v-bind="computeItemAttrs(buttonitem)"
              style="margin:0 0 0 10px;" :style="computeItemStyle(buttonitem)"
              @click="handleTitleButtonClick(buttonitem)">
              <timecountdown v-if="buttonitem.seconds" :configdata="buttonitem" :opentype="opentype"
                @commonMethod="commitMethod" />
              {{ buttonitem.content }}
            </Button>
          </template>
        </div>
      </template>
      <template v-if="(zjConfigdata.buttonsPosition === 'footer' || !zjConfigdata.buttonsPosition) && zjConfigdata.titleButtons && zjConfigdata.titleButtons.length > 0 && modalType !== 'Drawer'" #footer>
        <div style="text-align: center;margin-right:20px;min-height: 32px;"
          :style="computeButtonFrameStyle">
          <template v-for="(buttonitem, buttonindex) in zjConfigdata.titleButtons">
            <Button v-if="computeKyf(buttonitem)" v-bind="computeItemAttrs(buttonitem)"
              :loading="loading" :key="'modalbutton' + buttonindex + _uid + buttonitem.blm"
              @click="handleTitleButtonClick(buttonitem)" style="margin:0 0 0 10px;"
              :style="computeItemStyle(buttonitem)">
              <timecountdown v-if="buttonitem.seconds" :configdata="buttonitem" :opentype="opentype"
                @commonMethod="commitMethod" />
              {{ buttonitem.content }}
            </Button>
          </template>
        </div>
      </template>
    </component>

  </div>
</template>
<script>
/* eslint-disable */
import { mapState, mapMutations } from 'vuex'
// var _this;
export default {
  name: "jform",
  inheritAttrs: false, // Vue 3: 防止非 props 属性自动继承到根元素
  props: {
    index: { type: Number, default: null },
    value: { type: Boolean, default: false },
    modelValue: { type: Boolean, default: false },
    fathername: { type: String, default: '' },
    childmethodparams: { type: Object, default: () => ({}) },
    setdata: { type: Object, default: () => ({}) },
    propstocomponent: { type: Object, default: () => ({}), },
    configdata: { type: Object, default: () => ({}), },
  },
  data() {
    return {
      componentName: '',//当前组件的名称，即configdata.blm
      ref: this.$root.componentRefs,
      propstochild: {},//传递给子组件的数据
      zjConfigdata: {}, //表单配置数据
      olddata: {}, //保存上一次的数据，开发人员可用于对比
      data: {}, //表单的data
      function: {}, //保存自定义方法
      loading: false,
      openStatus: false, //主要用于富文本编辑器使用
      oldDate: "", //用于DatePicker日期变化时，解决必填项校验不通过问题
      btnLoading: {},
      rules: {},  //表单校验规则的配置
      formDisabled: false,
      vif: {},//组件渲染条件的配置，初始化全为true vif
      gzlvif: {},//工作流节点是否设置某字段是否显示
      vshow: {},//vshow
      anchor: { anchorList: [], anchorStyle: {}, anchorAttrs: {} },
      componentClass: {}, //各个组件的类名 //class
      attrs: {}, //保存组件的属性
      gzlAttrs: {},//工作流节点的属性，主要用来设置某字段是否编辑
      styles: {}, //保存组件的样式
      list: {},  //保存组件的数组数据，一般用于jselect、jradio、jcheckbox、jswitch的数据
      formFieldList: [],
      componentList: [],
      triggleList: [],
      triggleByFatherObject: {},//有那些下拉框是由父级触发的
      triggleDatePicker: [],//有级联的日期框
      tempdata: {}, //存储临时变量
      inputRawValues: {}, // 记录 input-number 输入过程中的原始值，用于 blur 越界校验
    };
  },
  methods: {
    async test() {
      console.log(this.value, "value in jform");
      console.log(this.configdata, "Configdata test in jform");
      // console.log(JSON.stringify(this.configdata), "Configdata test in jform");
      console.log(this.zjConfigdata, "zjConfigdata test in jform");
      console.log(this.data, "data from test in jform")
      console.log(this.propstocomponent, "propstocomponent test in jform");
      console.log(this.propstochild, "propstochild test in jform");
      console.log('list', this.list, 'componentList', this.componentList, 'triggleList', this.triggleList, 'triggleByFatherObject', this.triggleByFatherObject);
      console.log('vif', this.vif)
      console.log('vshow', this.vshow)
      console.log(this.attrs, 'this.attrs')
      console.log(this.styles, 'this.style')
      console.log(this.componentClass, 'print env from test in jform')
      console.log(this.ref, 'ref')
      console.log(this.openStatus, 'this.openstatus')
      console.log(this.rules, '校验')
      console.log(this.info, 'info')
      console.log(this.anchor, 'anchor')
      console.log(this.opentype, 'opentype')
      console.log(this.fathername, 'fathername')
      console.log(this.function, 'function')
      console.log(this.modalAttrs, 'modalAttrs')
      console.log(this.gzlAttrs, 'gzlAttrs')
      console.log(this.gzlvif, 'gzlvif')

    },
    async handlerConfigdata(n={},o={}) {
      this.zjConfigdata = JSON.parse(JSON.stringify(n))
      if (n.hqpzfs === 'query' && n.yyid) {
        if (n.yyid != this.zjConfigdata.id) {
          //获取zjpzxx
          let zjpzxx = await this.commonsJs.getzjpzxx(n.yyid);
          zjpzxx.blm = n.blm
          this.zjConfigdata = zjpzxx;
        }
      }
      if (this.zjConfigdata.addConfigdata) Object.assign(this.zjConfigdata, this.commonsJs.funcEval1(this,{},this.zjConfigdata.addConfigdata))
      let titleButtons = this.zjConfigdata.titleButtons || []
      if (titleButtons.length == 0) {
        if (this.zjConfigdata.buttonConfig && this.zjConfigdata.buttonConfig.length > 0) {
          this.zjConfigdata.titleButtons = this.zjConfigdata.buttonConfig
        }
      }
      if (this.zjConfigdata.function && this.zjConfigdata.function.length > 0) {
        // console.log('this.zjConfigdata.function', this.zjConfigdata.function)
        this.createFunction(this.zjConfigdata.function)
      }
      if (this.zjConfigdata.modalType == 'divlayout' && this.zjConfigdata.autoopen == '1') this.open(true)
    },
    /**
     * modal打开时处理的方
     * @param {*} isOpen
     */
    async open(isOpen) {
      if (isOpen) {
        console.log('*****open*******')
        if (this.zjConfigdata.keypressMethod) {
          this.$root.activeModal.unshift(this.componentName)
          document.addEventListener('keydown', this.handleKeyDown);
        }//删除keydown的监听事件
        this.$nextTick(async () => {
          await this.initForm();
          this.componentName = this.zjConfigdata.blm + (this.index ? this.index : '')
          this.openStatus = true; //这个参数用来控制富文本编辑器的状态
          if (this.zjConfigdata.afterOpen) {
            let obj = this.data
            await this.commonsJs.funcEval(this, obj, this.zjConfigdata.afterOpen)
          }
          if (this.zjConfigdata.haveGzl == '1') await this.handleGzlNode() //处理表单在改工作流节点的数据权限
        })
      } else {
        if (this.zjConfigdata.keypressMethod) {
          document.removeEventListener('keydown', this.handleKeyDown);//删除keydown的监听事件
          if (this.$root.activeModal.length > 0) {
            this.$root.activeModal.shift()
          }
        }
        this.close()
      }
    },
    close(item = {}) {
      this.attrs = {}
      this.styles = {}
      // if (this.ref[this.fathername].config) this.$set(this.ref[this.fathername].config[this.zjConfigdata.blm], 'opentype', '')
      this.openStatus = false
      if (this.zjConfigdata.beforeClose) {
        this.commonsJs.funcEval(this, {}, this.zjConfigdata.beforeClose)
      }
      if (item.clickInside) { this.commonsJs.funcEval(this, {}, item.clickInside) }
      if (item.click) {
        let obj = { formdata: this.formdata, method: item.click }
        this.$emit('commonMethod', obj) //导出外部执行方法
      }
      this.$emit("update:visible", false);
      this.$emit("closemodal", false);
    },
    /*** 根据系统配置信息组件里面配置的开发环境，如果时开发环境，则显示调试的test按钮*/
    env() {
      let returnValue = false
      let str = localStorage.getItem('incoenv')
      if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1) returnValue = true
      return returnValue
    },

    computeMainStyle() {
      let newstyle = {}
      if (this.zjConfigdata.mainStyle) newstyle = { ...this.zjConfigdata.mainStyle }
      if (this.zjConfigdata.styleMethod) {
        let funcEval = new Function('_this', 'obj', this.zjConfigdata.styleMethod)
        let styleEnv = funcEval(this, {}) //执行内部方法
        newstyle = { ...newstyle, ...styleEnv }
      }
      return newstyle
    },

    computeFormAttrs() {
      let newAttrs = this.zjConfigdata.formAttrs || {}
      if (this.zjConfigdata.haveGzl != '1') newAttrs.disabled = this.formDisabled
      if (this.zjConfigdata.haveGzl == '1' && !this.propstocomponent.dbjddm) newAttrs.disabled = this.formDisabled
      if (this.zjConfigdata.formAttrsMethod) Object.assign(newAttrs, this.commonsJs.funcEval1(this, {}, this.zjConfigdata.formAttrsMethod))
      return newAttrs
    },
    computeFormStyle() {
      return this.commonsJs.computeNewStyle(this, {}, { ...this.zjConfigdata.formStyles }, this.zjConfigdata.formStyleMethod, {})
    },
    computeColStyle(item) {
      return this.commonsJs.computeNewStyle(this, {}, {}, item.colStyleMethod, {})
    },
    computeAnchorStyle() {
      return this.commonsJs.computeNewStyle(this, {}, {}, this.zjConfigdata.anchorStyle, {})
    },
    computeButtonFrameStyle() {
      return this.commonsJs.computeNewStyle(this, { data: this.data }, null, this.zjConfigdata.buttonFrameStyle, null)
    },
    computeItemStyle(item) {
      return this.commonsJs.computeNewStyle(this, { item, data: this.data, value: this.data[item.blm] }, item.style, item.styleMethod, this.styles)
    },
    computeItemAttrs(item) {
      let attrs = this.commonsJs.computeNewAttrs(this, { data: this.data, item: item }, item.attrs, item.attrsMethod, this.attrs)
      // if (this.zjConfigdata.haveGzl == '1') Object.assign(attrs, this.gzlAttrs[item.blm])
      if (item.componentType === 'InputNumber' || item.componentType === 'Input-Number' || item.componentType === 'input-number') {
        if (attrs.min || attrs.max) attrs["active-change"] = false
      }
      return attrs
    },
    /**
     * 计算组件渲染条件
     * @param {*} item
     */
    computeKyf(item) {
      if (item.kyf === '0') return false
      let returnValue = this.vif[item.blm];
      if (item.condition) {
        try {
          let funcEval = new Function('_this', 'obj', item.condition)
          returnValue = funcEval(this, { ...item, item: item, data: this.data })
        }
        catch { console.log('在jform中的computeKyf方法中报错了：', item.blm, item) }
      }
      if (this.zjConfigdata.haveGzl == '1' && this.gzlvif[item.blm] == '0') returnValue = false
      return returnValue
    },
    /**
     *
     * @param {*} str 要设置的组件变量名的字符串，变量用‘，’隔开
     * @param {*} type ：vif和vshow，vif是对条件v-if设置，vshow是对组件的show属性设置
     * @param {*} setType ：false是只改变要设置的组件变量名，true是将其他组件设为相反值
     */
    async setAttrsConditionAndShow(str, type, booleanType, setType) {
      if (!str) return
      //如果输入的字符串不为空
      let arr = str.split(',')
      let conditionAndShow = ''
      if (type === 'vshow') { conditionAndShow = 'vshow' }
      if (type === 'vif') { conditionAndShow = 'vif' }
      //如setType选择为true，则将先将所有的设置为booleanType取反
      if (setType) {
        this.fieldlist.forEach((f) => {
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
    async setvif(str, booleanType = true, setType = false) {
      await this.setAttrsConditionAndShow(str, 'vif', booleanType, setType)
    },
    async setvshow(str, booleanType = true, setType = false) {
      await this.setAttrsConditionAndShow(str, 'vshow', booleanType, setType)
    },
    //计算组件事件

    computeComponentEvent(item) {
      let eventObj = {}
      if (item.eventMethod) {
        item.eventMethod.forEach((res) => {
          eventObj[res.name] = (value1, value2, value3, value4, value5, $event) => {
            let event = $event
            let obj = { item: item, value1: value1, value2: value2, value3: value3, value4: value4, value5: value5 }
            if (event && event.stopPropagation) event.stopPropagation()//防止冒泡
            if (res.eventInside) {
              let funcEval = new Function('_this', 'obj', res.eventInside)
              funcEval(this, obj) //执行内部方法
            }
            if (res.eventOutside) {
              obj.method = res.eventOutside
              this.$emit('commonMethod', obj) //导出外部执行方法
            }
          }
        })
      }
      return eventObj
    },

    //执行配置方法
    async commitMethod(obj) {
      if (obj.method) await this.commonsJs.funcEval(this, obj, obj.method)
    },
    /**
     * 用来给form的数据变量初始化为null；目前只给了InputNumber设置了空值--原因系统给它付了初始值1
     */
    reset() {
      this.data = {}
      this.olddata = {}
      this.loading = false
      this.openStatus = false
      this.formDisabled = false
      this.oldDate = ""
    },
    async resetFields() {
      this.btnLoading = {}
      this.propstochild = {}
      // this.rules= {}
      // this.formDisabled= false
      this.anchorList = []
      this.componentClass = {}
      this.attrs = {}
      this.styles = {}
      // this.formFieldList=[]
      this.componentList = []
      this.triggleList = []
      this.triggleByFatherObject = {}
    },
    handerInputNumberNullvalue() {
      if (this.zjConfigdata.fields && this.zjConfigdata.fields.length > 0) {
        let list = this.fieldlist
        list.forEach((item) => {
          if (!this.data[item.blm] && this.data[item.blm] !== 0 && (item.componentType === 'InputNumber' || item.componentType === 'Input-Number' || item.componentType === 'input-number')) {
            this.data[item.blm] = null
          }
        })
      }
    },
    /**
     * 用来初始化表单数据，将传入表单的数据传递到formData中
     */
    async initForm() {
      this.reset()
      if (this.$refs.form) await this.$refs.form.resetFields()
      await this.resetFields()
      this.data = { ...this.propstocomponent }
      this.formDisabled = this.opentype === "show" ? true : false

      //此初始化list需要放到this.data有值后，不然初始化下拉框数据的传递全部数据将在第二次打开才生效
      if (!this.zjConfigdata.initListPosition || this.zjConfigdata.initListPosition == '0') { await this.createFields() }//当表单配置初始化list位置为formJson变化时执行
      if (this.opentype === "add") {
        this.data["id"] = this.commonsJs.sys_guid();
        this.handleDefaultValue();
      } else if (this.opentype === "edit" || this.opentype === "show") {
        await this.query();
      }
      this.handerInputNumberNullvalue()
    },

    /**
     * 处理表单内组件点击方法
     * @param {*} item
     * @param {*} event
     */
    handlecomponentclick(item, event) {
      let obj = {
        item: item,
        value: event,
        data: this.data,
        formBlm: this.zjConfigdata.blm,
        formname: this.zjConfigdata.blm,
        blm: item.blm
      }
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
    handleBlur(item, event) {
      // console.log(item,event,'print event from handleBlur in jform')
      this.validateInputNumberRange(item)
      let obj = {
        item: item,
        value: this.data[item.blm],
        data: this.data,
        formBlm: this.zjConfigdata.blm,
        blm: item.blm
      }

      if (item.blurInside) {
        this.commonsJs.funcEval(this, obj, item.blurInside)
      }
      if (item.blur) {
        obj.method = item.blur
        this.$emit('commonMethod', obj)
      }
    },
    /**
     * 记录 input-number 输入过程中的原始值（blur 时组件已 clamp，无法再拿到原始输入）
     * @param {*} item
     * @param {*} event
     */
    handleRawInput(item, event) {
      const type = item.componentType
      if (type !== 'input-number' && type !== 'InputNumber' && type !== 'Input-Number') return
      this.inputRawValues[item.blm] = event.target.value
    },
    /**
     * input-number 设置了 min/max 时，blur 时校验输入值是否越界并给出提示
     * @param {*} item
     */
    validateInputNumberRange(item) {
      const type = item.componentType
      if (type !== 'input-number' && type !== 'InputNumber' && type !== 'Input-Number') return
      const attrs = this.computeItemAttrs(item)
      const min = attrs.min
      const max = attrs.max
      if ((min === undefined || min === null || min === '') && (max === undefined || max === null || max === '')) return
      const raw = this.inputRawValues[item.blm]
      delete this.inputRawValues[item.blm] // 读后清空，避免下次未输入却重复校验
      if (raw === '' || raw === null || raw === undefined) return
      const num = Number(raw)
      if (isNaN(num)) return
      const belowMin = min !== undefined && min !== null && min !== '' && num < min
      const aboveMax = max !== undefined && max !== null && max !== '' && num > max
      if (belowMin || aboveMax) {
        const name = item.mc || item.label || '数值'
        this.$Message.error(`${name} 的取值范围为 ${min} ~ ${max}`)
      }
    },
    /**
     * 处理表单组件数据变化时处理的方法
     * @param {*} item
     * @param {*} event
     */
    handleChange(item, event) {
      let obj = {
        item: item,
        value: event,
        data: this.data,
        formBlm: this.zjConfigdata.blm,
        blm: item.blm,
        formname: this.zjConfigdata.blm,
        fathername: this.fathername
      }
      if (item.componentType == "date-picker" || item.componentType == "DatePicker") { //处理日期组件回显问题
        if (Array.isArray(event) && (!event || !event[0])) event = []; //由于type为datetimerange时清空，event会变为['','']导致必填校验失效
        this.data[item.blm] = event
        //用于设置截至时间小于开始时间不可选
        if (item.triggerObject) {
          if (!this.data[item.blm] || this.data[item.blm] > this.data[item.triggerObject]) {
            this.data[item.triggerObject] = ''
          }
          let kssj = new Date(event).getTime()
          this.attrs[item.triggerObject] = { options: {} }
          this.attrs[item.triggerObject].options = {
            disabledDate: function (date) {
              return date.valueOf() <= kssj - 86400000;
            }
          }
        }
        if (item.triggerFatherName) {
          let kssj = this.data[item.triggerFatherName]
          let d = new Date(kssj)
          let year = d.getFullYear()
          let month = d.getMonth()
          let day = d.getDate()
          let hour = d.getHours()
          let minute = d.getMinutes()
          let second = d.getSeconds()
          let jssj = this.data[item.blm]
          let d2 = new Date(jssj)
          let year2 = d2.getFullYear()
          let month2 = d2.getMonth()
          let day2 = d2.getDate()
          let hour2 = d2.getHours()
          let minute2 = d2.getMinutes()
          let disabledHours = []
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
          this.attrs[item.blm]['time-picker-options'] = {
            'disabled-hours': disabledHours,
            'disabled-minutes': disabledMinute,
            'disabled-seconds': disabledSeconds
          }
        }
      }
      if (item.componentType == "jselect") this.data[item.blm] = event
      if (item.componentType === "jselect" && item.triggerObject) {
        delete this.data[item.triggerObject]
        this.getTriggerObjectList(item, item.triggerObject, item.blm);
      }

      if (item.changeInside) { this.commonsJs.funcEval(this, obj, item.changeInside); } //组件数据变化内部执行方法
      if (item.change) {
        obj.method = item.change
        this.$emit('commonMethod', obj)
      }
      if (item.componentType === "commonmultiselect" || item.componentType === "newmultiselect") {
        if (this.rules[item.blm]) this.$refs.form.validateField(item.blm) //改变校验状态
      }
    },
    openDatePicker(item, flag) {
      if (flag) {
        if (!this.data[item.blm] && item.triggerFatherName) {
          this.data[item.blm] = this.data[item.triggerFatherName]
          this.handleChange(item, this.data[item.blm])
        }
      }
    },
    /**
     * 组件keypress的方法
     * @param {*} item
     * @param {*} event
     */
    handleKeypress(item, event) {
      // console.log(event,'handleKeyPress from jform')
      let keycode = event.key
      let obj = {
        item: item,
        value: event,
        data: this.data,
        formBlm: this.zjConfigdata.blm,
        blm: item.blm,
        keycode: keycode
      }
      if (item.keypressInside) {
        this.commonsJs.funcEval(this, {}, item.keypressInside)
      }

      if (item.keypress) {
        obj.method = item.keypress
        this.$emit('commonMethod', obj)
      }
      //处理日期组件回显问题
    },
    /**
     * 初始化下拉框、单选、多选、开关等数据
     */
    async initList() {
      let sqlidList = []
      // 批量收集需要立即设置的list数据
      let batchListData = {}
      if (this.componentList.length > 0) {
        let newcomponentList = JSON.parse(JSON.stringify(this.componentList))
        for (let index = 0; index < newcomponentList.length; index++) {
          let item = newcomponentList[index]
          if (!item.jlzdmc) {
            // 此处为了将查询放到一次请求里进行处理
            if (item.listType == '4' || (item.list && item.list.length > 0) || item.listMethod) {
              // 获取数据但不立即设置，收集到batchListData中
              let listData = await this.getListData(item)
              if (listData !== null) {
                batchListData[item.blm] = listData
              }
            } else if (item.listId) {
              // listid查询
              let obj = { ...this.propstocomponent, opentype: this.opentype }
              if (item.cdqbsj === '1') obj = { ...obj, ...this.data } //传递全部参数
              sqlidList.push({
                sqlid: item.listId,
                blm: item.blm,
                type: 'querylist',
                param: obj,
                xlkitem: item,//此为了后续赋值使用，查询sql中用不到
              })
            } else if (item.listConfig && item.listConfig.listBm && item.listConfig.listDm && item.listConfig.listMc) {
              // 代码表名查询
              let obj = { ...item.listConfig, opentype: this.opentype, ...this.propstocomponent }
              if (item.cdqbsj === '1') obj = { ...obj, ...this.data } //传递全部参数
              sqlidList.push({
                sqlid: 'DC37EB84F52E3520E0555943CA7634DE',
                blm: item.blm,
                type: 'querylist',
                param: obj,
                xlkitem: item,//此为了后续赋值使用，查询sql中用不到
              })
            }
          }
        }
      }

      //使用sqlidList查询代码表数据，收集所有数据后统一赋值
      if (sqlidList != null && sqlidList.length > 0) {
        await this.commonsJs.multiquery(sqlidList).then(res => {
          sqlidList.forEach(item => {
            let xlkitem = item.xlkitem
            batchListData[xlkitem.blm] = res[xlkitem.blm]
            if (xlkitem.afterGetList) this.commonsJs.funcEval(this, { list: res[xlkitem.blm], data: this.data, item: xlkitem }, xlkitem.afterGetList)
          })
        })
      }

      // 统一赋值，避免逐个触发响应式更新
      if (Object.keys(batchListData).length > 0) {
        Object.assign(this.list, batchListData)
      }
    },

    /**
     * 根据配置不同，调用不同的获取数据的方法
     * @param {*} item
     * @param {*} name
     */
    async getList(item, name = '') {
      if (name) await this.getListByTrigger(item, name)
      else await this.getListNoTrigger(item)
    },
    /**
     * 获取list数据但不设置（用于批量处理）
     * @param {*} item
     * @returns {Array|null} 返回list数据或null
     */
    async getListData(item) {
      if (item.listType == '4') {
        let list = this.$root.list[item.listBm]
        if (!list) list = []
        return list
      }
      else if (item.list && item.list.length > 0) {
        let newlist = await this.getListBySelf(item)
        return newlist
      }
      else if (item.listMethod) {
        let newlist = this.commonsJs.funcEval1(this, { item: item, name: '' }, item.listMethod)
        return newlist
      }
      return null
    },
    /**
     * 根据配置不同，调用不同的获取数据的方法_没级联
     * @param {*} item
     */
    async getListNoTrigger(item) {
      if (item.listType == '4') {
        let list = this.$root.list[item.listBm]
        if (!list) list = []
        this.$set(this.list, item.blm, list)
      }
      else if (item.list && item.list.length > 0) {
        let newlist = await this.getListBySelf(item)
        this.$set(this.list, item.blm, newlist)
      }
      else if (item.listMethod) {
        let newlist = this.commonsJs.funcEval1(this, { item: item, name: '' }, item.listMethod)
        this.$set(this.list, item.blm, newlist)
      }
    },
    /**
     * 根据配置不同，调用不同的获取数据的方法_级联
     * @param {*} item
     * @param {*} name
     */
    async getListByTrigger(item, name) {
      if (item.listType == '4') {
        let source = this.data[name]
        let sourceList = this.list[name]
        list = sourceList.filter(row => { return row.dm == source })[0].children
        this.$set(this.list, item.blm, list)
      }
      else if (item.listId) { this.getListById(item, name) }
      else if (item.listConfig && item.listConfig.listBm && item.listConfig.listDm && item.listConfig.listMc) this.getListByBm(item, name)
      else if (item.listMethod) {
        let newlist = this.commonsJs.funcEval1(this, { item: item, name: name }, item.listMethod)
        this.$set(this.list, item.blm, newlist)
      }
    },

    //自定义的list数据
    async getListBySelf(res) {
      let list = JSON.parse(JSON.stringify(res.list))
      for (let i = 0; i < list.length; i++) {
        let item = list[i]
        if (item.condition) { item = await this.commonsJs.funcEval(this, item, item.condition) }//通过condition设置list的某条disabled
      }
      if (res.afterGetList) { list = await this.commonsJs.funcEval(this, { list: res.list, data: this.data, item: res }, res.afterGetList) }
      return list

    },
    /**
     * 通过配置的id值获取数据
     * @param {*} item
     * @param {*} name
     */
    getListById(item, name = '') {
      let obj = { ...this.propstocomponent, opentype: this.opentype }
      if (name) obj[name] = this.data[name]
      if (item.cdqbsj === '1') obj = { ...obj, ...this.data } //传递全部参数
      this.commonsJs.incoRequest('querylist', item.listId, obj).then((res) => {
        this.$set(this.list, item.blm, res);
        if (item.afterGetList) this.commonsJs.funcEval(this, { list: res, data: this.data, item: item }, item.afterGetList)
      });
    },
    /**
     * 通过配置的表名、查询的字段名等获取数据
     * @param {*} item
     * @param {*} name
     */
    getListByBm(item, name = '') {
      let obj = { ...item.listConfig, opentype: this.opentype, ...this.propstocomponent }
      if (name) {
        obj[name] = this.data[name]
        obj.jldata = this.data[name]
      }
      if (item.cdqbsj === '1') obj = { ...obj, ...this.data } //传递全部参数
      this.commonsJs.incoRequest('querylist', 'DC37EB84F52E3520E0555943CA7634DE', obj).then(
        (res) => {
          this.$set(this.list, item.blm, res);
          if (item.afterGetList) this.commonsJs.funcEval(this, { list: res, data: this.data, item: item }, item.afterGetList)
        }
      );
    },
    /**
     * 获取所有被触发的list数据，一般时自定义查询时，才单独调用
     */
    initTargetList() {
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
    getTriggerObjectList(sourceItem, targetName, sourceItemName) {
      let list = targetName.split(',')
      if (list && list.length > 0) {
        list.forEach((item) => {
          if (this.data[sourceItemName]) {
            if (this.triggleByFatherObject[item]) { this.getList(this.triggleByFatherObject[item], sourceItemName) }
          } else {
            this.$set(this.data, item, '')
            this.$set(this.list, item, [])
          }
        })
      }
    },

    initDataPickTrigger() {
      if (this.triggleDatePicker.length > 0) {
        this.triggleDatePicker.forEach(item => {
          this.handleChange(item, this.data[item.blm])
        })
      }
    },


    /**
     * 处理缺省值，一般时在表单新增时调用
     * @param {*} force 如果参数为true：就是不管formData里面的变量是否有值，均将缺省值覆盖。
     *                  如果参数为false，formData里面有值的话，将不被初始化
     */
    handleDefaultValue(force = false) {
      if (this.zjConfigdata.fields && this.zjConfigdata.fields.length > 0) {
        let list = this.fieldlist
        list.forEach((item) => {
          if (item.defaultMethod) this.data[item.blm] = this.commonsJs.funcEval1(this, { item: item, data: this.data }, item.defaultMethod) //处理默认值方法
          else if (item.default || item.default == 0 || item.default == '0') {
            if (force) { this.data[item.blm] = item.default }
            else if (!this.data[item.blm]) {
              let defaultValue = item.default
              if (item.componentType === 'input-number') {
                if (typeof item.default != 'number') defaultValue = Number(item.default)
                else defaultValue = item.default
              }
              this.data[item.blm] = defaultValue
            } //如果data里面有数据，则不初始化
          } else {
            if (item.componentType === 'input-number' && !this.data[item.blm] && this.data[item.blm] != 0) this.data[item.blm] = null
          }
        })
      }
    },
    /**
     * 表单功能组件：如保存、提交处理方法
     * @param {*} item
     */
    async handleTitleButtonClick(item) {
      let obj = { formName: this.zjConfigdata.blm, data: this.data, item: item, blm: item.blm, opentype: this.opentype }
      if (item.blm === "cancel") {
        this.close();
      }
      else if (item.blm == "save") {
        if (this.opentype === "add") { this.handleAdd(item); }
        if (this.opentype === "edit") { this.handleEdit(item); }
      } else {
        //处理表单自定义功能按钮的方法，其方法是将数据导出到父组件执行
        let obj = { formName: this.zjConfigdata.blm, data: this.data, item: item, blm: item.blm, opentype: this.opentype }
        if (item.clickInside) this.commonsJs.funcEval(this, obj, item.clickInside)
        if (item.click) {
          obj.method = item.click
          this.$emit("commonMethod", obj);
        }
      }

    },
    /**
     * 表单校验，包含表单自有的校验和自定义校验两个部分
     */
    async formValid() {
      let flag = false
      let message = '校验没有通过，请仔细检查填写的数据'
      await this.$refs.form.validate((valid) => { flag = valid })
      if (flag) {
        if (this.zjConfigdata.validMethod) {
          let res = await this.commonsJs.funcEval(this, this.data, this.zjConfigdata.validMethod)
          flag = res.flag
          if (res.message) message = res.message
        }
      }
      if (flag) {
        //校验子表单
        let fields = this.fieldlist.filter(item => item.componentType === 'formlist')
        for (let i = 0; i < fields.length; i++) {
          let item = fields[i]
          let itemflag = await this.$refs[item.blm][0].formValid()
          if (!itemflag) {
            flag = false
            message = `子表【${item.mc ||item.label}】数据校验没有通过，请仔细检查填写的数据`
            break
          }
        }
      }
      if (!flag) { this.$Message.error(message) }
      return flag
    },
    /**
     * 处理data里的数据，对于input类型的数据，利用trim()函数将前后空格去掉
     */
    trimString() {
      if (this.zjConfigdata.trimSpace !== '1') return
      if (this.zjConfigdata.fields && this.zjConfigdata.fields.length > 0) {
        let list = this.commonsJs.treeToList(this.zjConfigdata.fields)
        list.forEach((item) => {
          if (item.componentType === 'i-input' || item.componentType === 'Input') {
            if (this.data[item.blm] && typeof this.data[item.blm] === 'string') {
              this.data[item.blm] = this.data[item.blm].trim()
            }
          }
        })
      }
    },
    // 父组件 value（字符串）→ 转数组给 jcheckbox 渲染
    changeStrToArray(data, fields) {
      fields.forEach((field) => {
        if (field.saveLx === 'str' && data[field.blm] && typeof data[field.blm] === 'string') {
          data[field.blm] = data[field.blm].split(',')
        }
      })
    },
    // 内部数组 → 转字符串 emit 给父组件保存
    changeArrayToStr(data, fields) {
      fields.forEach((field) => {
        if (field.saveLx === 'str' && Array.isArray(data[field.blm])) {
          data[field.blm] = data[field.blm].join(',')
        }
      })
    },
    /**
     * 处理表单新增数据保存按钮
     * @param {*} btn 传递按钮的名字，用于保存是设置按钮为loadding
     */
    async handleAdd(item) {
      //表单校验
      let flag = await this.formValid()
      if (!flag) return  //校验没通过
      this.trimString()//去除input 空格
      //判断是否右insertId，如果有，则执行
      if (this.insertId) {
        await this.handleAddBySqlId(item)
      } else {
        //没有insertId时调用
        let obj = { formName: this.zjConfigdata.blm, data: this.data, item: item, blm: item.blm, opentype: this.opentype }
        if (item.clickInside) this.commonsJs.funcEval(this, obj, item.clickInside)
        if (item.click) {
          obj.method = item.click
          this.$emit('commonMethod', obj)
        }
      }
    },
    //有sqlId时保存方法
    async handleAddBySqlId(item) {
      let obj = JSON.parse(JSON.stringify(this.data));
      this.changeArrayToStr(obj,this.fieldlist)
      this.loading = true
      if (this.zjConfigdata.beforeAdd) obj = await this.commonsJs.funcEval(this, obj, this.zjConfigdata.beforeAdd) //添加保存钱方法调用
      this.commonsJs.incoRequest('insert', this.insertId, obj)
        .then(async (res) => {
          if (this.zjConfigdata.afterAdd) await this.commonsJs.funcEval(this, obj, this.zjConfigdata.afterAdd) //添加保存后方法调用
          this.loading = false;
          this.$Message.success("添加保存成功");
          this.close(item);
          if (this.zjConfigdata.targetObject) this.ref[this.zjConfigdata.targetObject].query({}, { source: 'out' }) //刷新列表数据
        })
        .catch((error) => {
          this.loading = false;
          this.$Message.error(error);
        });
    },
    /**
     * 处理表单编辑openType=‘edit’，编辑页面保存按钮
     * @param {*} item
     */
    async handleEdit(item) {
      let flag = await this.formValid() //表单校验
      if (!flag) return  //校验没通过
      this.trimString()
      if (this.updateId) { await this.handleEditBySqlId(item)}
      else {
        let obj = { formName: this.zjConfigdata.blm, data: this.data, blm: item.blm, item: item, opentype: this.opentype }
        if (item.clickInside) this.commonsJs.funcEval(this, obj, item.clickInside)
        if (item.click) {
          obj.method = item.click
          this.$emit('commonMethod', obj)
        }
      }
    },
    async handleEditBySqlId(item) {
      this.loading = true;
      let data = JSON.parse(JSON.stringify(this.data))
      this.changeArrayToStr(data,this.fieldlist)
      if (this.zjConfigdata.beforeEdit) { data = await this.commonsJs.funcEval(this, data, this.zjConfigdata.beforeEdit) }
      let res = await this.commonsJs.incoRequest('update', this.updateId, data)
      if (this.zjConfigdata.afterEdit) res = await this.commonsJs.funcEval(this, data, this.zjConfigdata.afterEdit)
      this.$Message.success("修改保存成功");
      this.loading = false
      // let obj={formName:this.zjConfigdata.blm,data:this.data,blm:item.blm,item:item,opentype:this.opentype}
      this.close(item);
      if (this.zjConfigdata.targetObject) this.ref[this.zjConfigdata.targetObject].query({}, { source: 'in' }) //刷新列表数据
      //this.$emit("refreshdata", obj);
    },
    /**
     * 查询表单的数据。在有查询id的情况下调用此方法
     * queryId 是在
     */
    async query(queryId = null, param = {}) {

      let sqlid = queryId || this.queryId
      if (!sqlid) {
        console.warn('没有查询sqlid或formId，无法查询数据')
        return
      }
      if (this.zjConfigdata.childrenQuery) {
        let obj = {
          sqlid: sqlid,
          type: 'queryone',
          blm: 'data',
          param: { ...this.propstocomponent, ...this.data, id: this.formId, ...param }
        }
        let funcEval = new Function('_this', 'obj', this.zjConfigdata.childrenQuery)
        let children = funcEval(this, {}) //执行内部方法
        obj.children = children
        this.commonsJs.multiquery([obj]).then(async (res) => {
          if (this.zjConfigdata.afterQuery) {
            //查询后自定义处理方法
            res = await this.commonsJs.funcEval(this, res, this.zjConfigdata.afterQuery)
          }
          let obj = {}
          obj = { ...this.propstocomponent, ...res.data } //将原来传入form的参数和查询后的参数统一返回给formData
          this.olddata = JSON.parse(JSON.stringify(this.data))   //用于编辑时，如果没有修改数据，则不保存。主要目的时减少对后台的操作
          this.data = obj
          this.initTargetList() //触发查询级联的数据，主要用于下拉框等回显
          this.initDataPickTrigger()//触发日期选择框回显
        })
      } else {
        let queryParam = { ...this.propstocomponent, id: this.formId, ...param }
        if (this.zjConfigdata.beforerQuery) queryParam = await this.commonsJs.funcEval(this, queryParam, this.zjConfigdata.beforerQuery) //查询前自定义处理方法
        let res = await this.commonsJs.incoRequest('queryone', sqlid, queryParam)
        if (this.zjConfigdata.afterQuery) { res = await this.commonsJs.funcEval(this, res, this.zjConfigdata.afterQuery) }//查询后自定义处理方法
        let obj = {}
        obj = { ...this.propstocomponent, ...res } //将原来传入form的参数和查询后的参数统一返回给formData
        this.olddata = JSON.parse(JSON.stringify(this.data))   //用于编辑时，如果没有修改数据，则不保存。主要目的时减少对后台的操作
        this.changeStrToArray(obj,this.fieldlist)
        this.data = obj
        this.initTargetList() //触发查询级联的数据，主要用于下拉框等回显
        this.initDataPickTrigger()//触发日期选择框回显
      }
    },
    //
    formtableitembuttonclick(item, obj) {
      // console.log(this.data,'formtableitembuttonclick from jform.vue')
      if (obj.clickInForm) this.commonsJs.funcEval(this, obj, obj.clickInForm)
      if (obj.item.click) {
        obj.method = obj.item.click
        obj.formdata = this.data
        obj.form_configdata = this.zjConfigdata
        this.$emit('commonMethod', obj)
      }
    },
    formtableitemchange(obj) {
      if (obj.change) {
        obj.method = obj.change
        this.$emit('commonMethod', obj)
      }

    },
    /**
     * 自定义组件返回值的处理方法
     * @param {*} item 组件的配置信息
     * @param {*} obj 返回的数据信息
     */
    handleReturnValue(item, obj = {}) {
      if (item.returnValueOutside) this.commonsJs.funcEval(this, obj, item.returnValueOutside)
    },
    //此方法用来处理多选人组件返回数据
    handleCommonMutiSelect(obj) {
      if (obj.item.handleReturnData) this.commonsJs.funcEval(this, obj, obj.item.handleReturnData)
    },
    getProps(str = '') {
      if (str) return this.propstochild[str]
      else return this.propstocomponent
    },
    setPropsToComponent(str = '', obj = {}, replace = true) {
      let arr = []
      if (str) { arr = str.split(',') }
      else { arr = this.configArr }
      arr.forEach((res) => {
        let propsObj = {}
        if (!replace) propsObj = { ...this.propstochild[res], ...obj } //保留了原来 路由传递过来的 参数
        else propsObj = obj   //如果replace设置为true，将替代原来的已保存的变量
        this.propstochild[res] = propsObj
      })
    },
    setProps(str = '', obj = {}, replace = true) {
      this.setPropsToComponent(str, obj, replace)
    },
    //向根发送要触发执行的方法和数据
    triggerFunction(blm, method, obj) {
      this.$root.componentsParam[blm] = [{ blm: blm, method: method, obj: obj }]
    },
    //此方法是用来根据triggerFunction，来触发本地的方法
    handleRootFunction(list) {
      if (list.length === 0) return
      let maxAttempts = 100 // 最多等待5秒 (100 * 50ms)
      let attempts = 0
      let timer = setInterval(() => {
        attempts++
        //需要定时执行的代码
        if (this.ref[this.zjConfigdata.blm] && this.$refs.form) {
          clearInterval(timer)
          list.forEach((item) => {
            if (item.method && item.method.trim()) {
              let funcEval = new Function('_this', 'obj', item.method)
              funcEval(this, item.obj)
            }
          })
        } else if (attempts >= maxAttempts) {
          // 超时后清除定时器，避免无限循环
          clearInterval(timer)
          console.warn('handleRootFunction 超时：组件引用未就绪', this.zjConfigdata.blm)
        }
      }, 50)
    },
    /**
     * 根据formJson传进来的字段，进行初始化相关信息：主要包括：style、attrs、list、vif
     * 在formJson变化是调用
     */
    async createFields() {
      this.rules = this.zjConfigdata.rules || {}
      // await this.resetFields()
      this.list = {}
      this.vif = {}
      this.vshow = {}
      this.anchor = {}
      if (this.zjConfigdata.titleIconStyle) this.styles.titleIconStyle = this.zjConfigdata.titleIconStyle
      if (this.zjConfigdata.titleStyles) this.styles.titleStyles = this.zjConfigdata.titleStyles
      if (this.zjConfigdata.anchorList) this.anchor['anchorList'] = this.zjConfigdata.anchorList
      if (this.zjConfigdata.anchorStyle) this.anchor['anchorStyle'] = this.zjConfigdata.anchorStyle
      let fields = this.zjConfigdata.fields
      if (this.zjConfigdata.titleButtons && this.zjConfigdata.titleButtons.length > 0) {
        this.zjConfigdata.titleButtons.forEach((btn) => {
          this.$nextTick(() => {
            this.setcomponentConfig(btn)
          })
        })
      }
      if (fields && fields.length > 0) {
        let list = []
        let componentList = []
        let triggleList = []
        list = this.fieldlist
        // this.formFieldList=list
        for (let i = 0; i < list.length; i++) {
          let item = list[i]
          //处理表单必填校验
          if (!this.rules[item.blm]) this.rules[item.blm] = []
          if (item.required && item.required == '1') {
            let changeRules = { required: true, message: item.mc + ' 必填', trigger: 'change' }
            let blurRules = { required: true, message: item.mc + ' 必填', trigger: 'blur' }
            if (item.multiple === 'true' || (item.attrs && item.attrs.multiple) || item.componentType === 'jcheckbox' || item.componentType === 'formtable') {
              blurRules.type = 'array'
              changeRules.type = 'array'
            }
            if (item.componentType === 'input-number' || item.componentType === 'InputNumber') {
              blurRules.type = 'number'
              changeRules.type = 'number'
            }
            this.rules[item.blm].push(blurRules)
            this.rules[item.blm].push(changeRules)
          }
          //处理表单校验方法
          if (item.ruleMethod) {
            let rule = this.commonsJs.funcEval1(this, {}, item.ruleMethod)
            if (this.rules[item.blm] && this.rules[item.blm].length > 0) this.rules[item.blm] = this.rules[item.blm].concat(rule)
            else this.rules[item.blm] = rule
          }
          //处理表单校验规则
          if (item.verify_rule && this.opentype != 'show') {
            if (!this.rules[item.blm]) this.rules[item.blm] = []
            this.rules[item.blm] = this.rules[item.blm].concat(this.commonsJs.validate(item.verify_rule, { length: item.rule_length, zz: item.rule_zz, message: item.rule_message }))
          }
          //处理表单引用的自定义组件
          if (item.yyzjmc) {
            this.commonsJs.zjRegisterOne(item,this)
          }
          //此$nextTick不能去除，否则会导致样式不生效、表单初始就校验必填
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

        //处理字段权限（包含vif、disabled）
        this.$nextTick(() => {
          if(this.zjConfigdata.fieldAuthMethod) {
            let {vif,attrs} = this.commonsJs.funcEval1(this, {}, this.zjConfigdata.fieldAuthMethod)
            if(vif && vif.length>0) this.setvif(vif.join(','),false)
            if(attrs && attrs.length>0){
              attrs.forEach(item=>{
                if(!this.attrs[item]) this.attrs[item]={disabled:true}
                else this.attrs[item].disabled=true
              })
            }
          }
        })

        this.componentList = componentList
        this.triggleList = triggleList
        await this.initList()
      }
    },
    /**
     * 创建自定义方法
     * @param {*} list
     */
    async createFunction(list = []) {
      if (list.length === 0) return
      let _this = this
      if (this.configdata.registerMethods && this.configdata.registerMethods.trim()) {
        let methodsArr = this.configdata.registerMethods.replace(' ', '').split(',')
        let notExistMethods = []
        for (let i = 0; i < methodsArr.length; i++) {
          let item = methodsArr[i]
          if (this.$root.functionMethods[item]) list.push({ name: item, func: this.$root.functionMethods[item] })
          else notExistMethods.push(item)
        }
        if (notExistMethods.length > 0) {
          let queryList = await this.commonsJs.incoRequest('querylist', 'get_tyfuncion_from_other_xm', { list: notExistMethods })
          for (let i = 0; i < queryList.length; i++) {
            let item = queryList[i]
            this.$root.functionMethods[item.ffm] = item.fft
            list.push({ name: item.ffm, func: item.fft })
          }
        }
      }
      for (let i = 0; i < list.length; i++) {
        let item = list[i]
        try {
          if (item.name && item.func.trim()) {
            let func = eval(item.func)
            this.function[item.name.trim()] = func
          }
        } catch { console.log('创建方法时发生错误：createFunction', item.name) }
      }
    },
    /**
     * 设置组件的vif、vshow、style、attrs等信息
     * @param {*} item
     */
    setcomponentConfig(item) {
      if (item.style && Object.keys(item.style).length > 0) { this.styles[item.blm] = { ...item.style } }
      // if (item.attrs && Object.keys(item.attrs).length > 0) { this.attrs[item.blm] = { ...item.attrs } }
      if (item.vifCondition === '0') { this.vif[item.blm] = false }
      else { this.vif[item.blm] = true }
      //如果配置配置了组件初始化显示，则配置组件初始化显示的值，不配置缺省为true
      if (item.isShow && item.isShow === '0') this.vshow[item.blm] = false
      else { this.vshow[item.blm] = true }
    },
    handleKeyDown(event) {
      // 检查是否按下了 Ctrl+S
      if (event.ctrlKey && event.key === 's' && this.$root.activeModal && this.$root.activeModal.length > 0) {
        let activeModalName = this.$root.activeModal[0]
        if (activeModalName == this.componentName) {
          event.preventDefault();// 阻止浏览器默认的保存页面行为
          if (this.zjConfigdata.keypressMethod && this.zjConfigdata.keypressMethod.trim()) this.commonsJs.funcEval(this, {}, this.zjConfigdata.keypressMethod)
        }
      }
    },
    async handleGzlNode() {
      if (!this.propstocomponent.dbjddm) return
      let gnbid = this.zjConfigdata.gnbid
      let res = await this.commonsJs.incoRequest('queryone', '1764921595630efcffbf5dba6e977bbd6e63483cb6c1f647', { gnbid: gnbid })
      let pz = JSON.parse(res.pzxx)
      if (pz.tbshqx[2] && pz.tbshqx[2].pzxx && pz.tbshqx[2].pzxx.jdlist) {
        let node = pz.tbshqx[2].pzxx.jdlist.filter(item => item.jddm == this.data.dbjddm)
        if (node[0] && node[0].fields && node[0].fields.length > 0) {
          node[0].fields.forEach((nodeitem) => {
            for (let i = 0; i < this.fieldlist.length; i++) {
              let field = this.fieldlist[i]
              if (nodeitem.label == field.label) {
                if (nodeitem.isread != '1') this.gzlvif[field.blm] = '0'
                if (nodeitem.iswrite == '1') {
                  this.gzlvif[field.blm] = '1'
                  this.gzlAttrs[field.blm] = { disabled: false }
                  this.setProps(field.blm, { editable: true })
                } else {
                  this.gzlAttrs[field.blm] = { disabled: true }
                }
              }
            }
          })
        }
      }
    }
  },
  mounted() { },
  created() {
    // _this=this
    //给form添加数据监听
    if (this.zjConfigdata.watchMethod && this.zjConfigdata.watchName) {
      this.$watch(
        this.zjConfigdata.watchName,
        {
          deep: true, immediate: true, handler(n, o) {
            let obj = { n: n, o: o }
            this.commonsJs.funcEval(this, obj, this.zjConfigdata.watchMethod)
          }
        }
      )
    }

  },

  computed: {
    ...mapState('admin/user', ['info']),
    modalAttrs() {
      let obj = {}
      //计算title
      let titleConfig = this.zjConfigdata.modalTitle || {};
      if (this.opentype === 'add') {
        obj.title = this.zjConfigdata.addTitle || titleConfig.addTitle || '添加'
      }
      else if (this.opentype === "edit") obj.title = this.zjConfigdata.editTitle || titleConfig.editTitle || '修改'
      else if (this.opentype === "show") obj.title = this.zjConfigdata.showTitle || titleConfig.showTitle || '显示'
      obj.mask = true
      obj['mask-closable'] = false
      obj.width = this.zjConfigdata.modalWidth || '50%'
      obj['footer-hide'] = this.zjConfigdata.buttonsPosition === 'header' ? true : false

      // Vue 3 兼容：Drawer 使用 teleport，无法自动继承 id/style/class
      // 对于 Drawer，使用 class-name prop；对于 Modal/divlayout，使用 class
      const className = 'style-' + this.zjConfigdata.blm + ' ' + this.zjConfigdata.blm
      if (this.modalType === 'Drawer') {
        // Drawer 的特殊处理
        obj['class-name'] = className
        // Drawer 使用 teleport，id 和 style 无法应用，跳过
      } else {
        // Modal 和 divlayout 可以正常继承这些属性
        obj.id = this.zjConfigdata.blm + '_modal'
        obj.style = this.computeMainStyle()
        obj.class = className
      }
      let attrs = this.commonsJs.computeNewAttrs(this, {}, this.zjConfigdata.modalAttrs, this.zjConfigdata.attrsMethod, {})
      // if (this.zjConfigdata.attrsMethod && this.zjConfigdata.attrsMethod.trim()) {
        Object.assign(obj, attrs)
      // }
      return obj
    },
    insertId() {
      let insertId = null
      if (this.zjConfigdata.insertId) insertId = this.zjConfigdata.insertId
      if (this.zjConfigdata.funcId && this.zjConfigdata.funcId.insertId) insertId = this.zjConfigdata.funcId.insertId
      return insertId
    },
    updateId() {
      let updateId = null
      if (this.zjConfigdata.updateFormId) updateId = this.zjConfigdata.updateFormId
      if (this.zjConfigdata.funcId && this.zjConfigdata.funcId.updateFormId) updateId = this.zjConfigdata.funcId.updateFormId
      return updateId
    },
    queryId() {
      let queryId = null
      if (this.zjConfigdata.queryFormId) queryId = this.zjConfigdata.queryFormId
      if (this.zjConfigdata.funcId && this.zjConfigdata.funcId.queryFormId) queryId = this.zjConfigdata.funcId.queryFormId
      return queryId
    },

    formdataChange() {
      return JSON.parse(JSON.stringify(this.data));
    },
    opentype() {
      return this.configdata.opentype;
    },
    modalType() {
      if (this.zjConfigdata.modalType) return this.zjConfigdata.modalType;
      else return "divlayout";
    },


    formId() {
      return this.configdata.formId || '';
    },
    formJsonString() {
      return JSON.stringify(this.zjConfigdata);
    },
    formContentHeight() {
      let height = '100%'
      if (this.zjConfigdata.titleButtons && this.zjConfigdata.titleButtons.length > 0 && this.zjConfigdata.modalType === 'Drawer' && this.zjConfigdata.buttonsPosition !== '1')
        height = 'calc(100vh - 116px)'
      return height
    },
    fieldlist() {
      let list = []
      if (this.zjConfigdata.fields && this.zjConfigdata.fields.length > 0) list = this.commonsJs.treeToList(this.zjConfigdata.fields)
      return list
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
    // },
    configdata: {
      handler(n, o) {
        if (n && n.blm) {
          this.componentName = n.blm + (this.index ? this.index : '')
          if (!this.$root.componentRefs) { this.$root['componentRefs'] = {} }
          this.$root.componentRefs[this.componentName] = this
          if (n.createClass) this.commonsJs.loadCssCode(n.createClass, n.blm)
        }
        if (o) {
          let obj = JSON.parse(JSON.stringify(n))
          let obj2 = JSON.parse(JSON.stringify(this.zjConfigdata))
          delete obj.modal
          delete obj.opentype
          delete obj.formId
          delete obj2.modal
          delete obj2.opentype
          delete obj2.formId
          // delete obj2.titleButtons

          if (JSON.stringify(obj) != JSON.stringify(obj2)) {
            this.handlerConfigdata(n,o)
          }
          this.zjConfigdata.opentype = n.opentype
          this.zjConfigdata.formId = n.formId
        } else {
          if(n.blm)this.handlerConfigdata(n,o)
        }

      }, deep: true, immediate: true
    },
    data: {
      handler(n, o) {
        if (this.zjConfigdata.dataChangeMethod) {
          this.commonsJs.funcEval(this, { data: this.data }, this.zjConfigdata.dataChangeMethod)
        }
      }, deep: true, immediate: true
    },
    childmethodparams: {
      handler(n, o) {
        if (n && n.methodName) { this.$nextTick(() => { this.$emit('excutefunc', n) }) }
      }, deep: true, immediate: true
    },
    "zjConfigdata.fields": {
      handler(n) {
        if (n && n.length > 0)
          if (this.zjConfigdata.anchorList && this.zjConfigdata.anchorList.length > 0) this.anchorList = this.zjConfigdata.anchorList
        if (this.zjConfigdata.initListPosition === '1') this.createFields() //当表单配置初始化list位置为formJson变化时执行

      }, deep: true, immediate: true
    },
    formJsonString: {
      handler(n, o) {
        if (this.zjConfigdata.titleButtons) {
          let btnLoading = {};
          this.zjConfigdata.titleButtons.map((item) => {
            btnLoading[item.blm] = false;
          });
          this.btnLoading = btnLoading;
        }
      },
      deep: true,
      immediate: true,
    },
    propstocomponent: {
      handler(n, o) {
        if (this.propstocomponent) {
          Object.assign(this.data, this.propstocomponent)
        }
      }, deep: true, immediate: true,
    },
    setdata: {
      handler() {
        if (this.setdata.id) this.data = { ...this.data, ...this.setdata.data }
      }, deep: true, immediate: true
    },
    //监测根的传递参数的变化，如果变化了，看是否有本组件的数据，如果有本组件的数据，调用处理
    "$root.componentsParam": {
      handler(n, o) {
        if (n && n[this.componentName]) {
          let myComponentsParam = JSON.parse(JSON.stringify(n[this.componentName]))
          delete n[this.componentName]
          this.handleRootFunction(myComponentsParam)
        }
      }, deep: true, immediate: true
    },
  },
  beforeUnmount() {
    if (this.zjConfigdata.keypressMethod) document.removeEventListener('keydown', this.handleKeyDown);//删除keydown的监听事件
    delete this.$root.componentRefs[this.componentName]
    this.commonsJs.removeCssCode(this.componentName)
  },
}

</script>
<style scoped>
.drawer-header {
  width: "100%";
  position: relative;
  height: 32px;
  line-height: 32px;
}


.jform .ivu-radio-input {
  opacity: 1;
}

.jform .ivu-input[disabled],
.jform .ivu-input-number-input[disabled],
.jform .ivu-select-disabled .ivu-select-selection {
  color: #515a6e !important;
  background-color: #fff;
  border: none;
}

.jform .ivu-btn[disabled] {
  color: #515a6e !important;
  background-color: #fff;
}

.jform .ivu-radio-disabled .ivu-radio-inner:after {
  color: #515a6e !important;
  background-color: #fff;
}

.demo-drawer-footer {
  width: 100%;
  height: 54px;
  position: absolute;
  bottom: 0;
  left: 0;
  border-top: 1px solid #e8e8e8;
  padding: 10px 16px;
  text-align: right;
  background: #fff;
}

#jform :deep(.ivu-form-item-required .ivu-form-item-content):after {
  content: "*";
  display: inline-block;
  margin-right: 4px;
  line-height: 1;
  font-family: SimSun;
  font-size: 14px;
  color: #ed4014;
}

#jform :deep(.ivu-form-item-content > div) {
  width: calc(100% - 15px) !important;
  display: inline-block;
}

.ivu-drawer-body {
  padding: 0 !important;
}

.ivu-table-cell-tooltip {
  display: inline-block !important;
}
</style>
