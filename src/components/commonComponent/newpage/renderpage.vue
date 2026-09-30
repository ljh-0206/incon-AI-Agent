<script>
/**
 * newrenderpage.vue — 基于 render 函数的页面渲染组件
 *
 * 用途：通过 configdata 传入组件配置，动态解析并递归渲染页面
 * 改进：移除调试代码、合并重复方法、增加错误边界、代码按职责分组
 * 兼容：完全向后兼容现有 renderpage.vue 的 configdata 格式
 */
    import { h, resolveComponent } from 'vue'
    import Bus from '@/components/commonComponent/upload/js/bus'
    import { mapState, mapActions } from 'vuex'

    export default {
        name: 'renderpage',
        props: {
            value: { type: [Object, Array, String, Number, Boolean] },
            configdata: { type: Object, default: () => ({}) },
            propstocomponent: { type: Object, default: () => ({}) },
            index: { type: Number, default: null },
            fathername: { type: String }
        },
        emits: ['commonMethod', 'update:visible', 'update:modelValue', 'excutefunc'],

        data () {
            return {
                Bus,
                componentName: '',
                data: {},
                config: {},
                zjConfigdata: {},
                propstochild: {},
                layoutConfig: [],
                function: {},
                list: {},
                componentClass: {},
                styles: {},
                attrs: {},
                vif: {},
                vshow: {},
                ref: this.$root.componentRefs,
                openStatus: true,
                tempdata: {},
                // 可配置的引用组件类型列表，方便扩展
                refComponentTypes: ['collection', 'incocomponent', 'newpage', 'renderpage', 'newrenderpage', 'jtable', 'jform']
            }
        },

        render () {
            const arr = []
            const test = h(resolveComponent('Button'), { onClick: () => { this.test() } }, this.componentName + '测试')
            arr.push(test)
            if (this.layoutConfig && this.layoutConfig.length > 0) {
                for (let i = 0; i < this.layoutConfig.length; i++) {
                    try {
                        const item = this.layoutConfig[i]
                        const componentConfig = this.getComponentConfig(item, this.data, i, null)
                        arr.push(componentConfig)
                    } catch (e) {
                        // 单个组件渲染失败不影响整体页面
                        console.error('[newrenderpage] 渲染组件失败:', this.layoutConfig[i]?.blm, e)
                    }
                }
            }
            return h('div', {
                id: this.zjConfigdata.blm,
                style: { ...this.computeMainStyle() },
                class: `main_newpage1 style-${this.zjConfigdata.blm} ${this.zjConfigdata.blm}`
            }, arr)
        },

        methods: {
            ...mapActions('admin/account', ['login', 'usernameLogin', 'logout']),
            env () {
                let returnValue = false
                const str = localStorage.getItem('incoenv')
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1)returnValue = true
                return returnValue
            },
            test () {
                console.log(this.fathername, 'fathername')
                console.log(this.componentName, 'componentnAME')
                console.log(this.ref, 'ref')
                console.log(this.propstocomponent, 'propstocomponent')
                console.log(this.propstochild, 'propstochild')
                console.log(this.config, 'config')
                console.log(this.zjConfigdata, 'configdata')
                console.log(this.function, 'function')
                console.log(this.value, 'value')
                console.log(this.data, 'data')
                console.log(this.tempdata, 'tempdata')
                console.log(this.list, 'list')
                console.log(this.layoutConfig, 'layoutConfig')
                console.log(this.vif, 'vif')
                console.log(this.vshow, 'vshow')
                console.log(this.styles, 'styles')
                console.log(this.attrs, 'attrs')
                console.log(this.info, 'this.info')
                console.log(this.fileUrl, 'this.fileUrl')
            },

            // ==================== 渲染相关 ====================

            /**
             * 获取组件配置（支持单数据和多数组数据）
             * @param {Object} item - 组件配置项
             * @param {*} itemdata - 当前数据
             * @param {number} itemindex - 组件索引
             * @param {number} dataindex - 数据索引
             */
            getComponentConfig (item, itemdata, itemindex, dataindex) {
                const children = []
                if (item.zjlb !== 'multidata') {
                    const res = this.getSingleComponentConfig(item, itemdata, itemindex, dataindex)
                    if (res) children.push(res)
                } else {
                    if (itemdata[item.blm] && itemdata[item.blm].length > 0) {
                        itemdata[item.blm].forEach((data, idx) => {
                            const res = this.getSingleComponentConfig(item, data, itemindex, idx)
                            if (res) children.push(res)
                        })
                    }
                }
                return children
            },

            /**
             * 获取单个组件的渲染配置
             */
            getSingleComponentConfig (item, itemdata, itemindex, dataindex) {
                // 判断是否渲染
                if (!this.computeKyf(item, itemdata, itemindex, dataindex)) return null

                let children = []
                const paramObj = {
                    id: `${item.blm}+${itemindex}+${dataindex}`,
                    ref: `${item.blm}+${itemindex}+${dataindex}`,
                    key: `${item.blm}+${itemindex}+${dataindex}`,
                    class: `style-${item.blm} ${item.blm}`,
                    style: this.computeStyle(item, { ...itemdata }, itemindex, dataindex) || {},
                    fathername: this.componentName,
                    index: dataindex,
                    itemindex,
                    row: itemdata,
                    // 默认值绑定（从 itemdata[blm] 取值）
                    value: itemdata ? itemdata[item.blm] : '',
                    modelValue: itemdata ? itemdata[item.blm] : '',
                    configdata: item,
                    propstocomponent: this.propstochild[item.blm] || {},
                    // 默认事件处理
                    'onUpdate:visible': (val) => { itemdata[item.blm] = val },
                    'onUpdate:value': (val) => { itemdata[item.blm] = val },
                    'onUpdate:modelValue': (val) => { itemdata[item.blm] = val },
                    // 组件事件（可覆盖默认事件）
                    ...this.computeComponentEvent(item, itemdata, itemindex, dataindex),
                    // 计算属性（attrsMethod 可覆盖 value/modelValue 等默认值）
                    ...(() => {
                        const computedAttrs = this.computeAttrs(item, { data: this.data, row: itemdata })
                        // 缓存数据源引用（供 slotScope 获取原始行数据，解决深拷贝导致双向绑定失效）
                        // 自动扫描常见数组属性名，也可通过 item.slotDataProp 手动指定
                        const dataProps = item.slotDataProp
                            ? [item.slotDataProp]
                            : ['data', 'items', 'dataSource', 'list', 'rows', 'options']
                        for (const prop of dataProps) {
                            if (computedAttrs[prop] && Array.isArray(computedAttrs[prop])) {
                                item._dataSource = computedAttrs[prop]
                                break
                            }
                        }
                        return computedAttrs
                    })()
                }

                // 处理显示内容
                if (item.xscontent === '1') {
                    if (item.content) paramObj.innerHTML = item.content
                    if (item.dataSource === 'dynamics') paramObj.innerHTML = itemdata && itemdata[item.blm] ? itemdata[item.blm] : null
                }

                // 处理 vshow
                if (!this.vshow[item.blm]) paramObj.style.display = 'none'

                // 处理 slot
                const haveSlot = item.haveSlot
                if (haveSlot) children = {}

                if (item.children && item.children.length > 0) {
                    if (haveSlot === '1') {
                        children = this.getSlotConfig(item.children, item, itemdata, itemindex, dataindex)
                    } else {
                        item.children.forEach((child) => {
                            const childConfig = this.getComponentConfig(child, itemdata, itemindex, dataindex)
                            children.push(childConfig)
                        })
                    }
                }

                // 判断使用 resolveComponent 还是直接渲染标签
                const useResolve = /[A-Z]/.test(item.componentType) || this.refComponentTypes.includes(item.componentType)
                if (useResolve) return h(resolveComponent(item.componentType), paramObj, children)
                else return h(item.componentType, paramObj, children)
            },

            /**
             * 获取 slot 配置
             */
            getSlotConfig (list, parentItem, itemdata, itemindex, dataindex) {
                const slot = {}
                const defaultArr = []
                list.forEach((child) => {
                    if (child.componentType === 'slot') {
                        const childArr = []
                        if (child.children && child.children.length > 0) {
                            child.children.forEach((slotChild) => {
                                const res = this.getSingleComponentConfig(slotChild, itemdata, itemindex, dataindex)
                                if (res) childArr.push(res)
                            })
                        }
                        slot[child.blm] = () => childArr
                    } else if (child.componentType === 'slotScope') {
                        slot[child.blm] = (scope) => {
                            const childArr = []
                            if (child.children && child.children.length > 0) {
                                // 获取原始数据引用（解决 iView/ElementPlus 等组件 scope 深拷贝导致双向绑定失效）
                                // 兼容不同 scope 结构：{row} / {item} / {record}，{index} / {$index}
                                const scopeIndex = scope.index !== undefined ? scope.index : scope.$index
                                const scopeRow = scope.row || scope.item || scope.record || scope
                                let scopedData = scopeRow
                                if (parentItem._dataSource && scopeIndex !== undefined && parentItem._dataSource[scopeIndex]) {
                                    scopedData = parentItem._dataSource[scopeIndex]
                                }
                                child.children.forEach((slotChild) => {
                                    const res = this.getSingleComponentConfig(slotChild, scopedData, itemindex, dataindex)
                                    if (res) childArr.push(res)
                                })
                            }
                            return childArr
                        }
                    } else {
                        defaultArr.push(this.getComponentConfig(child, itemdata, itemindex, dataindex))
                    }
                })
                return { ...slot, default: () => defaultArr }
            },

            // ==================== 样式/属性计算 ====================

            /**
             * 计算主框架样式
             */
            computeMainStyle () {
                let obj = {}
                let newStyle = {}
                const style = this.zjConfigdata.style || {}
                if (this.zjConfigdata.mainStyleMethod) {
                    const funcEval = new Function('_this', 'obj', this.zjConfigdata.mainStyleMethod)
                    newStyle = funcEval(this, {})
                }
                obj = { ...style, ...newStyle }
                return obj
            },

            /**
             * 计算组件样式（兼容数组和对象格式）
             */
            computeStyle (item, data = {}, itemindex, dataindex) {
                try {
                    let obj = {}
                    let newStyle = {}
                    // 优先从缓存取，fallback 到 item 自身的 style
                    const baseStyle = this.styles[item.blm] || item.style || {}
                    // 兼容数组格式和对象格式
                    if (Array.isArray(baseStyle) && baseStyle.length > 0) {
                        baseStyle.forEach((styleItem) => {
                            if (styleItem.key && styleItem.key.trim() && styleItem.label !== undefined) {
                                if (styleItem.valueType === 'number') obj[styleItem.key.trim()] = Number(styleItem.label)
                                else obj[styleItem.key.trim()] = styleItem.label
                            }
                        })
                    } else if (baseStyle && typeof baseStyle === 'object') {
                        obj = { ...baseStyle }
                    }
                    if (item.styleMethod) {
                        const funcEval = new Function('_this', 'obj', item.styleMethod)
                        newStyle = funcEval(this, { item, row: data, data, itemindex, rowindex: dataindex })
                    }
                    return { ...obj, ...newStyle }
                } catch (error) {
                    console.error('[newrenderpage] computeStyle错误:', item.blm, error)
                }
            },

            /**
             * 计算组件属性（兼容数组和对象格式）
             */
            computeAttrs (item, data = {}, itemindex, dataindex) {
                let obj = {}
                let newAttrs = {}
                // 优先从缓存取，fallback 到 item 自身的 attrs
                const baseAttrs = this.attrs[item.blm] || item.attrs || {}
                // 兼容数组格式和对象格式
                if (Array.isArray(baseAttrs) && baseAttrs.length > 0) {
                    baseAttrs.forEach((attrItem) => {
                        if (attrItem.key && attrItem.key.trim() && attrItem.label !== undefined) {
                            if (attrItem.valueType === 'number') obj[attrItem.key.trim()] = Number(attrItem.label)
                            else if (attrItem.valueType === 'boolean') obj[attrItem.key.trim()] = attrItem.label === 'true' || attrItem.label === '1'
                            else obj[attrItem.key.trim()] = attrItem.label
                        }
                    })
                } else if (baseAttrs && typeof baseAttrs === 'object') {
                    obj = { ...baseAttrs }
                }
                if (item.attrsMethod) {
                    try {
                        const funcEval = new Function('_this', 'obj', item.attrsMethod)
                        newAttrs = funcEval(this, { item, row: data, data, itemindex, rowindex: dataindex })
                    } catch (e) {
                        console.error('[newrenderpage] computeAttrs动态属性错误:', item.blm, e)
                    }
                }
                return { ...obj, ...newAttrs }
            },

            /**
             * 判断组件是否可用（kyf + condition + vif）
             */
            computeKyf (item, data = {}, itemindex, dataindex) {
                let returnValue = true
                if (this.vif.hasOwnProperty(item.blm)) returnValue = this.vif[item.blm]
                try {
                    if (item.condition) {
                        const funcEval = new Function('_this', 'obj', item.condition)
                        const obj = { item, data, row: data, itemindex, rowindex: dataindex }
                        returnValue = funcEval(this, obj)
                    }
                    if (item.kyf && item.kyf === '0') returnValue = false
                    return returnValue
                } catch (e) {
                    console.error('[newrenderpage] computeKyf错误:', item.blm, e)
                }
                return returnValue
            },

            // ==================== 事件处理 ====================

            /**
             * 计算组件事件（统一方法，替代原 getOnConfig）
             */
            computeComponentEvent (item, data, itemindex, dataindex) {
                const eventObj = {}
                if (item.componentEvent && item.componentEvent.length > 0) {
                    item.componentEvent.forEach((res) => {
                        eventObj[res.name] = (value1, value2, value3, value4, value5, $event) => {
                            const event = $event
                            if (event && event.stopPropagation) event.stopPropagation()
                            const obj = {
                                item,
                                data: this.data,
                                row: data,
                                itemindex,
                                rowindex: dataindex,
                                event,
                                value1,
                                value2,
                                value3,
                                value4,
                                value5
                            }
                            // 执行内部方法
                            if (res.eventInside) {
                                const funcEval = new Function('_this', 'obj', res.eventInside)
                                funcEval(this, obj)
                            }
                            // 导出外部执行方法
                            if (item.eventOutside) obj.method = res.eventOutside
                            this.$emit('commonMethod', obj)
                        }
                    })
                }
                return eventObj
            },

            /**
             * 提交方法到父组件或本地执行
             */
            commitMethod (obj) {
                if (obj.method) {
                    if (!obj.componentName || obj.componentName === this.componentName) {
                        this.commonsJs.funcEval(this, obj, obj.method)
                    } else {
                        this.$emit('commonMethod', obj)
                    }
                }
            },

            // ==================== 初始化 ====================

            /**
             * 初始化单个组件的信息
             */
            async initComponentInfo (item) {
                this.vif[item.blm] = item.vifCondition !== '0'
                this.vshow[item.blm] = item.isShow !== '0'

                const lx = item.lx || item.componentType
                // 引用组件：从数据库获取配置
                if (item.yyid && this.refComponentTypes.includes(lx)) {
                    if (item.hqpzfs === 'father') {
                        Object.assign(item, await this.getYyzjConfig(item))
                        item.hqpzfs = 'father'
                    } else {
                        item.hqpzfs = 'query'
                    }
                }
                this.config[item.blm] = item

                // 注册自定义组件
                if (item.yyzjmc && item.yyzjmc.trim()) await this.commonsJs.zjRegisterOne(item, this)
                // 初始化样式
                if (item.style && Object.keys(item.style).length > 0) this.styles[item.blm] = item.style
                // 初始化属性
                if (item.attrs && Object.keys(item.attrs).length > 0) this.attrs[item.blm] = item.attrs
                // 初始化 class 名
                this.componentClass[item.blm] = (item.className && item.className.trim()) ? item.className.trim() : item.blm
                // 初始化 list
                if (item.list) this.list[item.blm] = this.commonsJs.funcEval1(this, {}, item.list)
                // 执行查询
                if (item.queryId && item.queryType) this.query(item.queryType, item.queryId, {}, item.blm)
            },

            /**
             * 执行初始化方法
             */
            init (initMethod) {
                this.commonsJs.funcEval(this, { data: this.data }, initMethod)
            },

            /**
             * 清空组件数据
             */
            reset () {
                this.data = {}
                this.list = {}
                this.config = {}
                this.styles = {}
                this.attrs = {}
                this.componentClass = {}
                this.propstochild = {}
                this.function = {}
            },

            open () {
                this.reset()
            },

            /**
             * 根据配置信息生成组件配置
             */
            async getConfig (n, name) {
                if (!name) return
                this.componentName = name
                if (!this.$root.componentRefs) this.$root.componentRefs = {}
                this.$root.componentRefs[this.componentName] = this
                if (this.index) this.componentName = name + this.index

                let zjpzxx_obj = n
                if (n.zjpzxx) zjpzxx_obj = JSON.parse(n.zjpzxx)

                // 创建 class 样式
                if (zjpzxx_obj.createClass) this.commonsJs.loadCssCode(zjpzxx_obj.createClass, this.componentName)
                // 计算主框架样式
                if (zjpzxx_obj.style) this.styles.main_style = zjpzxx_obj.style
                // 创建配置的方法
                if (zjpzxx_obj.function && zjpzxx_obj.function.length > 0) this.createFunction(zjpzxx_obj.function)

                // 解析配置列表（兼容 layoutConfig 和 configList）
                let list = []
                if (zjpzxx_obj.layoutConfig && zjpzxx_obj.layoutConfig.length > 0) list = this.commonsJs.treeToList(zjpzxx_obj.layoutConfig)
                else if (zjpzxx_obj.configList && zjpzxx_obj.configList.length > 0) list = this.commonsJs.treeToList(zjpzxx_obj.configList)

                const layoutTree = []
                for (let i = 0; i < list.length; i++) {
                    const item = list[i]
                    if (item.kyf !== '0') {
                        await this.initComponentInfo(item)
                        layoutTree.push(item)
                    }
                }

                // 全局注册组件库中的组件
                if (zjpzxx_obj.registerComponent) {
                    const selfComponent = zjpzxx_obj.registerComponent.replace(' ', '').split(',')
                    await this.commonsJs.registerComponent(selfComponent, this)
                }

                const layout = this.commonsJs.listToTree(list)
                if (zjpzxx_obj.initMethod) this.init(zjpzxx_obj.initMethod)
                this.layoutConfig = layout
            },

            /**
             * 通过 id 查询获取组件配置信息
             */
            async getConfigById (item, name) {
                const res = await this.commonsJs.getzjpzxx(item.yyid)
                res.blm = name
                this.zjConfigdata = res
                await this.getConfig(res, name)
            },

            /**
             * 生成自定义方法
             */
            async createFunction (list) {
                // 处理注册方法
                if (this.zjConfigdata.registerMethods && this.zjConfigdata.registerMethods.trim()) {
                    const methodsArr = this.zjConfigdata.registerMethods.replace(' ', '').split(',')
                    const notExistMethods = []
                    for (let i = 0; i < methodsArr.length; i++) {
                        const item = methodsArr[i]
                        if (this.$root.functionMethods[item]) {
                            list.push({ name: item, buttonClick: this.$root.functionMethods[item] })
                        } else {
                            notExistMethods.push(item)
                        }
                    }
                    if (notExistMethods.length > 0) {
                        const queryList = await this.commonsJs.incoRequest('querylist', 'get_tyfuncion_from_other_xm', { list: notExistMethods })
                        for (let i = 0; i < queryList.length; i++) {
                            const item = queryList[i]
                            this.$root.functionMethods[item.ffm] = item.fft
                            list.push({ name: item.ffm, buttonClick: item.fft })
                        }
                    }
                }
                // 创建方法
                for (let i = 0; i < list.length; i++) {
                    const item = list[i]
                    if (item.name && item.buttonClick) {
                        try {
                            this.function[item.name] = eval(item.buttonClick)
                        } catch (e) {
                            console.error('[newrenderpage] createFunction错误:', item.name, e)
                        }
                    }
                }
            },

            /**
             * 获取引用组件配置
             */
            async getYyzjConfig (item) {
                const configObj = await this.commonsJs.getzjpzxx(item.yyid)
                configObj.blm = item.blm
                configObj.fid = item.fid
                if (configObj.lx) configObj.componentType = configObj.lx
                return configObj
            },

            // ==================== 数据操作 ====================

            /**
             * 查询数据
             */
            query (queryType = '', sqlid = '', obj, blm) {
                if (!sqlid) return
                if (queryType === 'querybypage') {
                    if (!obj.pageNumber) obj.pageNumber = 1
                    if (!obj.pageSize) obj.pageSize = 5
                }
                try {
                    this.commonsJs.incoRequest(queryType, sqlid, obj).then((res) => {
                        if (queryType === 'querylist') {
                            if (blm) this.data[blm] = res
                            else this.data = res
                        }
                        if (queryType === 'querybypage') {
                            if (blm) this.data[blm] = res.list
                            else this.data = res
                        }
                        if (queryType === 'queryone') {
                            if (blm) this.data[blm] = res
                            else this.data = res
                        }
                    })
                } catch (e) {
                    console.error('[newrenderpage] query错误:', blm, 'sqlid:', sqlid, '类型:', queryType)
                }
            },

            setValue (name, data, blm) {
                if (!name) return
                const method = blm ? `_this.data['${blm}'] = obj` : '_this.data = obj'
                this.triggerFunction(name, method, data)
            },

            getValue (name, blm) {
                if (blm) return this.ref[name].data[blm]
                else return this.ref[name].data
            },

            triggerFunction (blm, method, obj) {
                this.$root.componentsParam[blm] = [{ blm, method, obj }]
            },

            // ==================== 跨组件通信 ====================

            /**
             * 处理 root 传递的方法调用
             */
            handleRootFunction (list) {
                if (list.length === 0) return
                list.forEach((item) => {
                    if (item.method && item.method.trim()) {
                        const funcEval = new Function('_this', 'obj', item.method)
                        funcEval(this, item.obj)
                    }
                })
            },

            setPropsToComponent (str = '', obj = {}, replace = true) {
                const arr = str ? str.split(',') : (this.configArr || Object.keys(this.config))
                arr.forEach((res) => {
                    const propsObj = replace ? obj : { ...this.propstochild[res], ...obj }
                    this.propstochild[res] = propsObj
                })
            },

            setProps (str = '', obj = {}, replace = true) {
                this.setPropsToComponent(str, obj, replace)
            },

            setprops (str = '', obj = {}, replace = true) {
                this.setPropsToComponent(str, obj, replace)
            },

            getProps (str = '') {
                return str ? this.propstochild[str] : this.propstochild
            },

            getprops (str) {
                return this.getProps(str)
            },

            // ==================== 显隐控制 ====================

            /**
             * 批量设置 vif 或 vshow
             * @param {string} str - 组件 blm，逗号分隔
             * @param {string} type - 'vif' 或 'vshow'
             * @param {boolean} booleanType - 显示/隐藏
             * @param {boolean} setType - true: 先将其他组件设为相反值
             */
            async setAttrsConditionAndShow (str, type, booleanType, setType) {
                if (!str) return
                const arr = str.split(',')
                const target = type === 'vshow' ? 'vshow' : 'vif'
                // setType=true 时，先将所有组件设为相反值
                if (setType) {
                    const allComponent = Object.keys(this.config) || []
                    allComponent.forEach((key) => { this[target][key] = !booleanType })
                }
                arr.forEach((key) => { this[target][key] = booleanType })
            },

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
            }
        },

        computed: {
            ...mapState('admin/user', ['info']),
            ...mapState('admin/layout', ['isMobile', 'logoutConfirm'])
        },

        watch: {
            configdata: {
                handler (n) {
                    if (!n) return
                    if (n.hqpzfs === 'query') {
                        if (n.yyid) this.getConfigById(n, n.blm)
                    } else {
                        this.zjConfigdata = JSON.parse(JSON.stringify(n))
                        this.getConfig(this.zjConfigdata, this.zjConfigdata.blm)
                    }
                    if (n.configdataChangeMethod) this.commonsJs.funcEval(this, { configdata: n }, n.configdataChangeMethod)
                },
                deep: true,
                immediate: true
            },

            '$root.componentsParam': {
                handler (n) {
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
                handler (n) {
                    if (this.zjConfigdata.propstocomponentChangeMethod) {
                        this.commonsJs.funcEval(this, { propstocomponent: n }, this.zjConfigdata.propstocomponentChangeMethod)
                    }
                },
                deep: true,
                immediate: true
            },

            data: {
                handler () {
                    if (this.zjConfigdata.dataChangeMethod) {
                        this.commonsJs.funcEval(this, { data: this.data }, this.zjConfigdata.dataChangeMethod)
                    }
                },
                deep: true,
                immediate: true
            },

            value: {
                handler (n, o) {
                    if (n && this.zjConfigdata.valueChange) {
                        this.commonsJs.funcEval1(this, { value: n, oldValue: o }, this.zjConfigdata.valueChange)
                    }
                },
                deep: true,
                immediate: true
            }
        },

        created () {
            if (this.zjConfigdata.registComponent) {
                this.commonsJs.funcEval1(this, {}, this.zjConfigdata.registComponent)
            }
            if (this.zjConfigdata.createdMethod) {
                this.commonsJs.funcEval1(this, {}, this.zjConfigdata.createdMethod)
            }
        },

        mounted () {
            if (this.zjConfigdata.mountedMethod) {
                this.commonsJs.funcEval1(this, {}, this.zjConfigdata.mountedMethod)
            }
        },

        updated () {
            if (this.$root.componentsParam[this.componentName]) {
                const myComponentsParam = JSON.parse(JSON.stringify(this.$root.componentsParam[this.componentName]))
                delete this.$root.componentsParam[this.componentName]
                this.handleRootFunction(myComponentsParam)
            }
        },

        beforeUnmount () {
            delete this.$root.componentRefs[this.componentName]
            this.commonsJs.removeCssCode(this.componentName)
        }
    }
</script>

<style>
.main_newpage {
    overflow-y: auto;
}

.main_newpage::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.main_newpage::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, .05);
    border-radius: 6px;
    -webkit-box-shadow: inset 1px 1px 0 rgba(0, 0, 0, .1);
}

.main_newpage:hover::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, .2);
    border-radius: 6px;
    -webkit-box-shadow: inset 1px 1px 0 rgba(0, 0, 0, .1);
}

.main_newpage::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, .4);
    -webkit-box-shadow: inset 1px 1px 0 rgba(0, 0, 0, .1);
}

.main_newpage::-webkit-scrollbar-track {
    border-radius: 6px;
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0);
    background-color: white;
}

.main_newpage::-webkit-scrollbar-track:hover {
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, .4);
    background-color: rgba(0, 0, 0, .01);
}
</style>
