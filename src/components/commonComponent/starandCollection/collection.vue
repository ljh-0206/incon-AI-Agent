<template>
  <div :id="zjConfigdata.blm" :ref="zjConfigdata.blm" :name="zjConfigdata.blm" :class="'collection_main ' + 'style-' + configdata.blm">
    <component :is="zjConfigdata.modalType || 'divlayout'" :id="zjConfigdata.blm" :model-value="value||modelValue" :ref="zjConfigdata.blm"
          :width="zjConfigdata.modalWidth" :footer-hide="zjConfigdata.buttonsPosition === 'header' ? true : false"
          v-bind="computeModalAttrs()" :name="zjConfigdata.blm" @on-visible-change="open"
          @on-ok="handleOk" @on-cancel="close" style="width: 100%;"
          :class="'collection_main ' + 'style-' + configdata.blm">
          <Button v-if = "env()" @click="test">collection--{{ zjConfigdata.blm }}</Button>
          <template #header >
              <div v-if="zjConfigdata.buttonsPosition === 'header' && (zjConfigdata.modalTitle || (zjConfigdata.titleButtons && zjConfigdata.titleButtons.length > 0))"
                style="display:flex;justify-content:space-between;align-items: center;">
                <vhtml :style="zjConfigdata.titleStyle" style="flex:1" :value="zjConfigdata.modalTitle || ''"> </vhtml>
                <div style="margin-right:20px" v-if="zjConfigdata.buttonsPosition === 'header'"
                    :style="computeButtonFrameStyle()">
                    <template v-for="(buttonitem, buttonindex) in zjConfigdata.titleButtons">
                        <Button v-if="computeBtnKyf(buttonitem)" :loading="loading"
                            :key="'modalbutton' + buttonindex + _uid + buttonitem.blm" v-bind="computeAttrs(buttonitem)"
                            style="margin:0 10px;" :style=computeItemStyle(buttonitem)
                            @click="handlefooterbuttonclick(buttonitem)">
                            <Icon v-if="buttonitem.icon" :type="buttonitem.icon" :style="buttonitem.iconStyle" /> {{buttonitem.content }}
                        </Button>
                    </template>
                </div>
              </div>
          </template>
          <div :style="computeMainStyle()" :id="configdata.blm + '_div'">
              <Row v-if="layoutConfig && layoutConfig.length > 0">
                  <template v-for="(level1, index1) in layoutConfig">
                      <template v-if="vif[level1.blm] && computeKyf(level1)">
                          <i-col v-if="level1.lx === 'layout' || level1.componentType === 'layout'" v-show="vshow[level1.blm]"
                              :key="'level1' + level1.blm + _uid + index" :style="config[level1.blm].style"
                              :attrs="config[level1.blm].attrs"
                              :span="config[level1.blm].colspan ? config[level1.blm].colspan : '24'">
                              <Row v-if="level1.children && level1.children.length > 0">
                                  <template v-for="(level2, level2Index) in level1.children">
                                      <i-col
                                          v-if="(level2.lx === 'layout' || level2.componentType == 'layout') && vif[level2.blm] && computeKyf(level2)"
                                          v-show="vshow[level2.blm]" :key="'level2' + level2.blm + _uid + level2Index"
                                          :style="config[level2.blm].style" :attrs="config[level2.blm].attrs"
                                          :span="config[level2.blm].colspan ? config[level2.blm].colspan : '24'">
                                          <Row v-if="level2.children && level2.children.length > 0">
                                              <template v-for="(level3, index3) in level2.children">
                                                  <i-col span="24">
                                                      <component v-if="vif[level3.blm] && computeKyf(level3)"
                                                          :is="resolveDynamicComponent(level3)" v-show="vshow[level3.blm]"
                                                          :key="level3.blm + _uid + index3" :ref="level3.blm" :index="index"
                                                          :value="computeValue(level3)" :fathername="componentName"
                                                          :configdata="config[level3.blm]"
                                                          :propstocomponent="propstochild[level3.blm]"
                                                          :childmethodparams="excuteData[level3.blm]"
                                                          :setdata="setdata[level3.blm]" @excutefunc="handleexcutefunc"
                                                          @commonMethod="commitMethod"
                                                          @update:visible="config[level3.blm].modal = false"></component>

                                                  </i-col>
                                              </template>
                                          </Row>
                                      </i-col>
                                      <i-col v-else :key="level2.blm + _uid + 'col'" span="24">
                                          <component v-if="vif[level2.blm] && computeKyf(level2)"
                                              :is="resolveDynamicComponent(level2)" v-show="vshow[level2.blm]"
                                              :key="level2.blm + _uid + level2Index" :ref="level2.blm" :index="index"
                                              :value="computeValue(level2)" :fathername="componentName"
                                              :configdata="config[level2.blm]"
                                              :propstocomponent="propstochild[level2.blm]"
                                              :childmethodparams="excuteData[level2.blm]" :setdata="setdata[level2.blm]"
                                              @excutefunc="handleexcutefunc" @commonMethod="commitMethod"
                                              @update:visible="config[level2.blm].modal = false"></component>
                                      </i-col>
                                  </template>
                              </Row>
                          </i-col>
                          <i-col v-else :style="config[level1.blm].style" :key="level1.blm + _uid + 'col'" span="24">
                              <component :is="resolveDynamicComponent(level1)" v-show="vshow[level1.blm]"
                                  :key="level1.blm + _uid + index1" :ref="level1.blm" :index="index"
                                  :value="computeValue(level1)" :fathername="componentName"
                                  :configdata="config[level1.blm]" :propstocomponent="propstochild[level1.blm]"
                                  :childmethodparams="excuteData[level1.blm]" :setdata="setdata[level1.blm]"
                                  @excutefunc="handleexcutefunc" @commonMethod="commitMethod"
                                  @update:visible="config[level1.blm].modal = false"></component>
                          </i-col>
                      </template>
                  </template>
              </Row>
          </div>
          <!--如果没有配置按钮位置或者按钮位置配置为底部  -->
          <template v-if="(zjConfigdata.buttonsPosition === 'footer' || !zjConfigdata.buttonsPosition) && zjConfigdata.titleButtons && zjConfigdata.titleButtons.length > 0 && zjConfigdata.modalType === 'Drawer'">
              <!-- 如果是Drawer抽屉，因为它没有slot，需要单独处理 -->
              <div style="text-align: center;margin-right:20px;"
                  :style="computeButtonFrameStyle()">
                  <template v-for="(buttonitem, buttonindex) in zjConfigdata.titleButtons">
                      <Button v-if="computeBtnKyf(buttonitem)" v-bind="buttonitem.attrs" :loading="loading"
                          :key="'modalbutton' + buttonindex + _uid + buttonitem.blm"
                          @click="handlefooterbuttonclick(buttonitem)" :style=computeItemStyle(buttonitem)>
                          <Icon v-if="buttonitem.icon" :type="buttonitem.icon" :style="buttonitem.iconStyle" />
                          {{ buttonitem.content }}
                      </Button>
                  </template>
              </div>
          </template>
          <template #footer >
                <div v-if="(zjConfigdata.buttonsPosition === 'footer' || !zjConfigdata.buttonsPosition) && zjConfigdata.titleButtons && zjConfigdata.titleButtons.length > 0 && zjConfigdata.modalType !== 'Drawer'"
                    style="text-align: center;margin-right:20px;min-height: 32px;"
                    :style="computeButtonFrameStyle()">
                    <template v-for="(buttonitem, buttonindex) in zjConfigdata.titleButtons">
                        <Button v-if="computeBtnKyf(buttonitem)" v-bind="buttonitem.attrs" :loading="loading"
                            :key="'modalbutton' + buttonindex + _uid + buttonitem.blm"
                            @click="handlefooterbuttonclick(buttonitem)" :style=computeItemStyle(buttonitem)>
                            <Icon v-if="buttonitem.icon" :type="buttonitem.icon" :style="buttonitem.iconStyle" />
                            {{ buttonitem.content }}
                        </Button>
                    </template>
                </div>
            </template>
      </component>
  </div>
</template>
<script>
    import { mapState, mapGetters, mapActions } from 'vuex'
    import { resolveComponent } from 'vue';
    // import iMenuSide from '@/layouts/basic-layout/menu-side/index.vue'

    export default {
        name: 'collection',
        components: {},
        // Declare emits for Drawer/Modal events to suppress Vue 3 warnings
        emits: ['commonMethod', 'on-ok', 'on-cancel', 'update:visible', 'excutefunc'],
        props: {
            index: { type: Number, default: null },
            value: { type: Boolean, default: false },
            modelValue: { type: Boolean, default: false },
            fathername: { type: String },
            childmethodparams: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: () => ({}) },
            propstocomponent: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                componentName: '',
                ref: this.$root.componentRefs,
                zjConfigdata: {}, // collection的配置数据
                config: {}, // 每个组件的配置数据
                layoutConfig: [], // 用来循环布局的tree型数据
                mountedComponent: [],
                excuteData: {},
                data: {},
                setdata: {},
                propstochild: {},
                vif: {},
                spin: false,
                vshow: {},
                function: {}, // 保存组件的自定义方法
                loading: false,
                tempdata: {}
            // index:0,
            }
        },

        methods: {
            /**
             * 解析动态组件，优先返回组件对象而不是组件名
             * 这样可以绑过 Vue 3 的 resolveComponent 对动态注册组件的限制
             */
            resolveDynamicComponent (item) {
                const componentName = item.lx || item.componentType
                if (!componentName) return null

                // 1. 首先检查 $options.components 中是否有这个组件（局部注册的）
                if (this.$options.components && this.$options.components[componentName]) {
                    return this.$options.components[componentName]
                }

                // 2. 尝试用 resolveComponent 解析（全局注册的组件）
                try {
                    const resolved = resolveComponent(componentName)
                    // resolveComponent 找不到时会返回组件名字符串本身
                    if (resolved && resolved !== componentName) {
                        return resolved
                    }
                } catch (e) {
                // ignore
                }

                // 3. 返回原始组件名，让 Vue 尝试解析
                return componentName
            },
            async test () {
                console.log(resolveComponent('jdropdown'), 'jdropdown====', resolveComponent('menu-horizontal'))
                console.log(this.componentName, 'componentName of collection')
                console.log(this.index, 'index of collection')
                console.log(this.propstocomponent, 'propstocomponent')
                console.log(this.config, 'config')
                console.log(this.zjConfigdata, 'zjConfigdata')
                // console.log(JSON.stringify(this.zjConfigdata,null,2), 'zjConfigdata')
                console.log(this.layoutConfig, 'print layoutConfig ')
                console.log(this.propstochild, 'propstochild')
                console.log(this.vshow, 'print vshow ')
                console.log(this.vif, 'print vif ')
                console.log(this.function, 'print function')
                console.log(this.data, 'data')
                console.log(this.setdata, 'setdata')
                console.log(this.commonsJs, 'this.commonsJs')
                console.log(this.fathername, 'fathername')
                console.log(this.info, 'this info')
                console.log(this.tempdata, 'tempdata')
                console.log(this.value, 'value')
                console.log(this.ref, 'ref')
                const id = this.commonsJs.sys_guid()
                console.log(id, 't****', id.length)
            },
            computeMainStyle () {
                let newstyle = {}
                if (this.zjConfigdata.style) newstyle = { ...this.zjConfigdata.style }
                if (this.zjConfigdata.styleMethod) {
                    const funcEval = new Function('_this', 'obj', this.zjConfigdata.styleMethod)
                    const styleEnv = funcEval(this, {}) // 执行内部方法
                    newstyle = { ...newstyle, ...styleEnv }
                }
                return newstyle
            },
            computeItemStyle (item) {
                // 兼容数组格式和对象格式的style
                return this.commonsJs.computeNewStyle(this, { item, value: this.data[item.blm], data: this.data }, item.style, item.styleMethod, {})
            },
            computeButtonFrameStyle () {
                let newstyle = {}
                if (this.zjConfigdata.buttonFrameStyle) {
                    newstyle = this.zjConfigdata.buttonFrameStyle
                }
                return newstyle
            },
            // 计算组件的属性
            computeAttrs (item) {
                // 兼容数组格式和对象格式的attrs
                return this.commonsJs.computeNewAttrs(this, { item }, item.attrs, item.attrsMethod, {})
            },
            reset () {
                this.layoutConfig = []
                this.vif = {}
                this.vshow = {}
                this.function = {}
                this.data = {}
                this.propstochild = {}
                const componentArr = Object.keys(this.config)
                componentArr.forEach((item) => {
                    if (this.$refs[item] && this.$refs[item][0] && this.$refs[item][0].reset) this.$refs[item][0].reset()
                }
                )
                this.config = {}
            },
            async open (open, flag) {
                if (open) {
                    if (this.zjConfigdata.keypressMethod) {
                        this.$root.activeModal.unshift(this.componentName)
                        document.addEventListener('keydown', this.handleKeyDown);
                    }// 删除keydown的监听事件
                    if (!flag) {
                        if (this.zjConfigdata.resetData !== '0') this.reset()
                        await this.getcomponentconfig()
                    }

                    if (this.zjConfigdata.mountedMethod) {
                        await this.commonsJs.funcEval(this, {}, this.zjConfigdata.mountedMethod)
                    }
                    if (this.zjConfigdata.onOpenMethod) {
                        await this.commonsJs.funcEval(this, {}, this.zjConfigdata.onOpenMethod)
                    }
                } else {
                    if (this.zjConfigdata.keypressMethod) {
                        document.removeEventListener('keydown', this.handleKeyDown);// 删除keydown的监听事件
                        if (this.$root.activeModal.length > 0) {
                            this.$root.activeModal.shift()
                        }
                    }
                    this.close()
                }
            },
            close (param) {
                const obj = { data: this.data, ...param, blm: this.zjConfigdata.blm }
                if (this.zjConfigdata.closeInsideMethod) this.commonsJs.funcEval(this, obj, this.zjConfigdata.closeInsideMethod)
                this.$emit('update:visible', false);
            },
            /**
             *一般是指点击了带弹出层的collection时，定义的选择按钮时触发
             */
            handleOk (param = {}) {
                const obj = { data: this.data, ...param, blm: this.zjConfigdata.blm }
                if (this.zjConfigdata.closeMethod) {
                    obj.method = this.zjConfigdata.closeMethod
                    this.$emit('commonMethod', obj)
                }
                this.close()
            },
            handleReturnValue (obj) {
                this.$emit('handleReturnValue', obj)
            },
            handlefooterbuttonclick (item) {
                const obj = { data: this.data, collectionName: this.zjConfigdata.blm, item, blm: item.blm, method: item.click }
                if (item.clickInside) this.commonsJs.funcEval(this, obj, item.clickInside)
                if (item.blm === 'cancel') this.close()
                if (obj.method) this.$emit('commonMethod', obj)
            },
            /**
             * 根据系统配置信息组件里面配置的开发环境，如果时开发环境，则显示调试的test按钮
             */
            env () {
                let returnValue = false
                const str = localStorage.getItem('incoenv')
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1) returnValue = true
                return returnValue
            },
            computeValue (item) {
                const str = 'collection,jform'
                // if (item.blm =='alnr') debugger
                if (str.includes(item.lx)) {
                    return this.config[item.blm].modal
                } else {
                    return this.data[item.blm]
                }
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
                    const allComponent = Object.keys(this.config) || []
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
            async setvif (str, booleanType = true, setType = false) {
                await this.setAttrsConditionAndShow(str, 'vif', booleanType, setType)
            },
            async setVif (str, booleanType = true, setType = false) {
                await this.setAttrsConditionAndShow(str, 'vif', booleanType, setType)
            },
            async setvshow (str, booleanType = true, setType = false) {
                await this.setAttrsConditionAndShow(str, 'vshow', booleanType, setType)
            },
            async setvShow (str, booleanType = true, setType = false) {
                await this.setAttrsConditionAndShow(str, 'vshow', booleanType, setType)
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
                    if (this.ref[this.zjConfigdata.blm]) {
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
             * 获取组件里面某个变量的值
             * @param {*} name 组件变量名
             * @param {*} blm 数据变量名
             */
            getValue (name, blm = 'data') {
                if (!name) return
                let data1 = null
                if (this.$refs[name] && this.$refs[name][0]) data1 = this.$refs[name][0][blm]
                else {
                    this.$nextTick(() => {
                        try {
                            if (blm === 'data') data1 = this.$refs[name][0][blm]
                            else data1 = this.$refs[name][0].data
                        } catch (e) {
                            console.log(name, ' getValue错误信息:', this.$refs[name], e)
                        }
                    })
                }
                return data1
            },
            getvalue (name, blm) { this.getValue(name, blm) },
            /**
             * 设置某个组件变量的值
             * @param {*} name 组件变量名
             * @param {*} blm
             * @param {*} data
             */
            setValue (name, data) {
                this.setdata[name] = { id: this.commonsJs.sys_guid(), data }
            },
            setvalue (name, data) { this.setValue(name, data) },
            // 给propstochild 设置参数
            setPropsToComponent (str = '', obj = {}, replace = true) {
                if (!str) return
                let arr = []
                if (str) { arr = str.split(',') } else { arr = this.configArr }
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
            setprops (str = '', obj = {}, replace = true) {
                this.setPropsToComponent(str, obj, replace)
            },

            // 给所有的组件（除了布局layout组件）传递参数
            setAllProps (obj = {}, replace = true) {
                let str = ''
                for (const key in this.config) {
                    const item = this.config[key]
                    if (this.config[key].lx != 'layout' && this.config[key].componentType != 'layout') {
                        if (str) str = str + ',' + item.blm.trim()
                        else str = item.blm.trim()
                    }
                }
                this.setProps(str, obj, replace)
            },
            getProps (str = '') {
                if (str) return this.propstochild[str]
                else return this.propstochild
            },
            getprops (str) { this.getProps(str) },
            /**
             *
             * @param {*} name
             * @param {*} functionName
             * @param {*} obj
             */
            handleexcutefunc (obj) {
                const param = JSON.parse(JSON.stringify(obj))
                this.excuteData[param.name] = {}
                let methodParams = {}
                if (param.param) methodParams = param.param
                this.$refs[param.name][0][param.methodName](methodParams)
            // console.log(obj,'handleexcutefunc from collection.vue',this.$refs[param.name][0][param.methodName])
            },
            childMethod (blm, methodName, param, queryType) {
                this.excuteData[blm] = { name: blm, methodName, param, methodId: this.commonsJs.sys_guid(), queryType }
            },
            query (name, obj, queryType = {}) {
                // console.log('in query of collection.vue',name)
                this.childMethod(name, 'query', obj, queryType)
            },
            tableformdatachange (obj) {
                // console.log(obj,'tableformdatachange from collection.vue')
                this.data[obj.tableformName] = obj.data
            },
            tableformQuery (obj) {
                // console.log(obj,'print from tableformQuery in collection.vue')
                this.query(obj.targetObject, {})
            },
            handleTableselecteddata (obj) {
                this.data[obj.tableName] = obj.selection
            },
            handleTreeCheckboxSelect (obj) {
                this.data[obj.name] = obj.list
            },

            computeModalAttrs () {
                let attrs = {}
                if (this.zjConfigdata.attrs) attrs = { ...this.zjConfigdata.attrs }
                if (this.zjConfigdata.attrsMethod) {
                    Object.assign(attrs, this.commonsJs.funcEval1(this, {}, this.zjConfigdata.attrsMethod))
                }
                return attrs
            },
            /**
             * 计算组件渲染条件，组件渲染获取相关信息要从data的config[blm]中获取
             * @param {*} item
             */
            computeKyf (item) {
                let returnValue = true;
                if (this.config[item.blm] && this.config[item.blm].condition) {
                    try {
                        const funcEval = new Function('_this', 'obj', this.config[item.blm].condition)
                        returnValue = funcEval(this, item)
                    } catch (e) {
                        console.log(item.condition, 'item.condition', this.config[item.blm].condition)
                        console.log('计算collection可用否报错了', item.blm, e, item)
                    }
                }
                if (this.config[item.blm] && this.config[item.blm].kyf && this.config[item.blm].kyf === '0') returnValue = false
                if (item.kyf && item.kyf === '0') returnValue = false
                return returnValue
            },
            // 计算collection 功能按钮的可用否
            computeBtnKyf (item) {
                let returnValue = true;
                if (item.condition) {
                    try {
                        const funcEval = new Function('_this', 'obj', item.condition)
                        returnValue = funcEval(this, item)
                    } catch (e) {
                        console.log(item.condition, 'item.condition')
                        console.log('计算collection可用否报错了', item.blm, e, item)
                    }
                }
                if (item.kyf && item.kyf === '0') returnValue = false
                return returnValue
            },
            async commitMethod (obj) {
                // console.log(obj.method,'commitMethod from collection.vue')
                if (obj.method) await this.commonsJs.funcEval(this, obj, obj.method)
            },

            // 生成自定义方法，并放在function中
            async createFunction (list) {
                const _this = this
                if (this.zjConfigdata.registerMethods && this.zjConfigdata.registerMethods.trim()) {
                    const methodsArr = this.zjConfigdata.registerMethods.replace(' ', '').split(',')
                    const notExistMethods = []
                    for (let i = 0; i < methodsArr.length; i++) {
                        const item = methodsArr[i]
                        if (this.$root.functionMethods[item]) list.push({ name: item, functionContent: this.$root.functionMethods[item] })
                        else notExistMethods.push(item)
                    }
                    if (notExistMethods.length > 0) {
                        const queryList = await this.commonsJs.incoRequest('querylist', 'get_tyfuncion_from_other_xm', { list: notExistMethods })
                        for (let i = 0; i < queryList.length; i++) {
                            const item = queryList[i]
                            this.$root.functionMethods[item.ffm] = item.fft
                            list.push({ name: item.ffm, functionContent: item.fft, buttonClick: item.fft })
                        }
                    }
                }
                for (let i = 0; i < list.length; i++) {
                    const item = list[i]
                    try {
                        const content = item.functionContent || item.buttonClick
                        if (item.name && content && content.trim()) {
                            this.function[item.name.trim()] = eval(content)
                        // this.function[item.name.trim()] = new Function(item.functionContent)
                        }
                    } catch { console.log('创建方法时发生错误：createFunction', item.name) }
                }
            },
            // 根据配置获取collection的配置,获取配置的方式有通过id、yyid查询或继承
            async getcomponentconfig (refreshId) {
                if (this.zjConfigdata.getConfigPath === '1' || this.zjConfigdata.hqpzfs === 'query' || refreshId) {
                    let queryid = this.zjConfigdata.id
                    if (this.zjConfigdata.yyid) queryid = this.zjConfigdata.yyid
                    if (refreshId) queryid = refreshId
                    // 获取collection的zjpzxx
                    const zjpzxx = await this.commonsJs.getzjpzxx(queryid);
                    zjpzxx.blm = this.zjConfigdata.blm
                    await this.setcomponentconfig(zjpzxx)
                } else await this.setcomponentconfig(this.zjConfigdata)
            },
            async setcomponentconfig (zjConfigdata) {
                if (!zjConfigdata.configList) return
                this.mountedComponent = []
                // 处理自定义方法，并将方法放到function对象中
                let selfComponent = []
                if (zjConfigdata.function && zjConfigdata.function.length > 0) await this.createFunction(zjConfigdata.function)
                for (let index = 0; index < zjConfigdata.configList.length; index++) {
                    await this.handleChildItem(zjConfigdata.configList[index], selfComponent)
                }
                if (zjConfigdata.passParamsToChild !== '0') this.setAllProps(this.propstocomponent, true)
                // collection下输入的注册组件名
                if (zjConfigdata.registerComponent) {
                    selfComponent = selfComponent.concat(zjConfigdata.registerComponent.replace(' ', '').split(','))
                    await this.commonsJs.registerComponent(selfComponent, this) // 注册组件，注册组件需要在组件加载前
                }
                // 在加载组件前，执行的方法
                if (zjConfigdata.beforeInit) await this.commonsJs.funcEval(this, {}, zjConfigdata.beforeInit)
                let fid = zjConfigdata.id
                if (zjConfigdata.sourcelx == 'newcollection') fid = 'root' // 如果是新建的newcollection，要单独处理则fid为root
                // 使用 $nextTick 确保组件注册生效后再渲染
                await this.$nextTick()
                this.layoutConfig = this.commonsJs.listToTree(zjConfigdata.configList, 'id', 'fid', 'title', fid)
            },
            async handleChildItem (item, selfComponent) {
                delete item.children // 删除children，防止递归时出错
                if (item.addConfigdata) Object.assign(item, this.commonsJs.funcEval1(this, {}, item.addConfigdata)) // 合并额外的配置数据
                this.config[item.blm] = item
                // 处理从父组件来的数据（路由里传入的数据）}aa
                if (item.isMounted === '1') this.mountedComponent.push({ blm: item.blm, lx: item.lx, mountedMethod: item.mountedMethod })
                if (item.vifCondition === '0' || item.vif === '0') {
                    this.vif[item.blm] = false
                } else { this.vif[item.blm] = true }
                if (item.isShow === '1' || !item.isShow) this.vshow[item.blm] = true

                else this.vshow[item.blm] = false
                if (item.titleButtons && item.titleButtons.length > 0) {
                    item.titleButtons.forEach((button) => { this.vif[button.blm] = true })
                }
                // collection下添加功能组件为自定义组件时
                if (item.yyzjmc && item.yyzjmc.trim()) await this.commonsJs.zjRegisterOne(item, this)
                // if (item.registerComponentMethod && item.registerComponentMethod.trim()) {
                //     let zjxx = this.commonsJs.funcEval1(this, {}, item.registerComponentMethod)
                //     this.$options.components[item.componentType] = zjxx
                // } else if (item.yyzjmc) selfComponent.push(item.yyzjmc.trim())
                if (item.children && item.children.length > 0) {
                    for (let i = 0; i < item.children.length; i++) {
                        await this.handleChildItem(item.children[i])
                    }
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
        computed: {
            configArr () {
                return Object.keys(this.config)
            },
            ...mapState('admin/user', ['info'])
        },
        watch: {
            configdata: {
                async handler (n, o) {
                    if (n && n.blm) {
                        if (n.hqpzfs == 'query' && n.yyid) {
                            const zjpzxx = await this.commonsJs.getzjpzxx(n.yyid);
                            zjpzxx.blm = this.zjConfigdata.blm
                            this.zjConfigdata = zjpzxx
                        } else this.zjConfigdata = JSON.parse(JSON.stringify(n))
                        if (this.zjConfigdata.buttonConfig && this.zjConfigdata.buttonConfig.length > 0) this.zjConfigdata.titleButtons = this.zjConfigdata.buttonConfig
                        if (this.zjConfigdata.createClass) this.commonsJs.loadCssCode(this.zjConfigdata.createClass, n.blm)
                        this.componentName = this.zjConfigdata.blm + (this.index ? this.index : '')
                        if (n.configdataChangeMethod) this.commonsJs.funcEval(this, { zjConfigdata: n, data: this.data }, n.configdataChangeMethod)
                        if (this.zjConfigdata.modalType === 'divlayout' && this.zjConfigdata.autoopen != '0') this.open(true)
                    }
                },
                deep: true,
                immediate: true
            },
            componentName: {
                handler (n, o) {
                    if (n && n != 'undefined') {
                        // this.$nextTick(()=>{
                        this.$root.componentRefs[this.componentName] = this
                    // })
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
            propstocomponent: {
                handler (n, o) {
                    if (this.zjConfigdata.passParamsToChild != '0') {
                        this.setAllProps(this.propstocomponent)
                    }
                    if (this.zjConfigdata.propstocomponentChangeMethod) this.commonsJs.funcEval(this, { propstocomponent: n }, this.zjConfigdata.propstocomponentChangeMethod)
                },
                deep: true,
                immediate: true
            },
            data: {
                handler (n, o) {
                    if (this.zjConfigdata.dataChangeMethod) this.commonsJs.funcEval(this, { data: this.data }, this.zjConfigdata.dataChangeMethod)
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
        mounted () { },
        created () {
            if (this.zjConfigdata.createdMethod) this.commonsJs.funcEval1(this, {}, this.zjConfigdata.createdMethod)
        },
        beforeUnmount () {
        // if (this.zjConfigdata.keypressMethod) {
        //     document.removeEventListener('keydown', this.handleKeyDown);//删除keydown的监听事件
        // }
        // if (this.$root.componentRefs[this.componentName]) delete this.$root.componentRefs[this.componentName]
        // if (this.zjConfigdata && this.zjConfigdata.createClass && this.zjConfigdata.createClass.trim()) document.getElementById('style-' + this.componentName)?.remove()
        }
    }

</script>
<style>
.collection_spin {
    position: fixed !important;
    z-index: 999999 !important;
}

.ivu-col {
    min-height: 0px !important;
}
</style>
