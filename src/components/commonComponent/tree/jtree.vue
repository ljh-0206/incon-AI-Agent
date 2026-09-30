<template>
  <div :style="computeStyle({ type: 'main' })" class="tree-mainBox jtree"
    :class="'style-' + configdata.blm + ' ' + configdata.blm">
    <div class="title">
      <Button v-if="env()" @click="test">treeTest</Button>
      <Icon v-if="zjConfigdata.titleIcon" :type="zjConfigdata.titleIcon" :style="zjConfigdata.titleIconStyle" />
      <p v-if="zjConfigdata.title" class="leftTitle" :style="zjConfigdata.titleStyle"> {{ zjConfigdata.title }} </p>
      <!-- 显示搜索框 -->
      <i-input v-if="zjConfigdata.sfxsss === '1'" v-model="searchTree" clearable style="width:100px"></i-input>
      <p v-if="titleButtonExist()">
        <template v-for="(item, index) in zjConfigdata.titleButtons">
          <component  :is="item.componentType"
            :key="'titleButton' + item.blm + index" v-if="computeKyf(item)" :configdata="item" :fathername="componentName"
            :propstocomponent="propstochild[item.blm]" v-bind="computeAttrs(item)" :style="computeStyle(item)"
            @click="titlebuttonclick(item)">
            <Icon v-if="item.icon" :type="item.icon" :style="item.iconStyle" />
            {{ item.content }}
          </component>
        </template>
      </p>
    </div>
    <Tree ref="tree" :data="treedata" :render="renderContent" v-bind="zjConfigdata.treeAttrs"
      @on-select-change="handleSelectChange" @on-check-change="handleCheckChange" @on-toggle-expand="handleToggleExpand"
      @on-contextmenu="handleContentmenu" v-on="computeComponentEvent(zjConfigdata)" class="tree-class"
      style="overflow-y: auto; overflow-x: hidden; width: 100%; " :style="computeStyle({ type: 'tree' })"></Tree>
  </div>
</template>
<script>
    import { mapState, mapGetters } from 'vuex'
    import { getCurrentInstance, resolveComponent } from 'vue'
    let _this;
    export default {
        name: 'jtree',
        components: {},
        props: {
            index: { type: Number, default: null },
            fathername: { type: String, default: '' },
            configdata: { type: Object, default: () => ({}) },
            propstocomponent: { type: Object, default: () => ({}) },
            setdata: { type: Object, default: () => ({}) },
            childmethodparams: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                self: this,
                componentName: '',
                ref: this.$root.componentRefs,
                zjConfigdata: {}, // 组件的配置数据
                data: [], // 树的数据
                list: {},
                function: {}, // 保存自定义方法
                style: {},
                attrs: {},
                propstochild: {},
                searchTree: '',
                currentItem: {}, // 当前选中的行数据
                expandItem: [],
                tempdata: {}, // 临时数据存储
                dragable:false, //设置树的节点是否可以拖拽
                dragNode: null, // 拖拽排序：当前被拖拽的节点 data
                dropType: '' // 拖拽排序：落点类型 before/inner/after（用于可选视觉反馈）
            };
        },
        methods: {
            test () {
                console.log('zjConfigdata----', this.zjConfigdata, '树组件里面的test from jtree.vue')
                console.log('data', this.data, this.dataExample, '树组件里面的test from jtree.vue')
                // console.log('datastringify', JSON.stringify(this.data,null,2), '树组件里面的test from jtree.vue')
                console.log(this.propstocomponent, 'propstocomponent test from jtree.vue')
                console.log(this.$refs.tree.getCheckedNodes(), 'getCheckedNodes')
                console.log(this.style, 'style-left and attrs-right', this.attrs)
                console.log(this.ref, 'ref')
                console.log(this.info, 'info')
                console.log(this.tempdata, 'tempdata')
                console.log(this.function, 'function')
                console.log(this.dragable ? '1':'0','dragable')
                // this.$set(this.style,'mainStyle',{height:'800px',"overflow-y":'auto'})
            },
            renderContent (h, { root, node, data }) {
                const itemTitleArr = this.renderTitle(h, root, node, data) // 树标题
                const btn = this.renderRowButtons(h, root, node, data) // 树行按钮
                const itemParam = {}
                if (this.zjConfigdata.itemStyleMethod) itemParam.style = this.computeItemStyle(this.zjConfigdata.itemStyleMethod, data)
                const isEllipsis = this.zjConfigdata.titleEllipsis === '1'
                const rowStyle = isEllipsis
                    ? { display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }
                    : { display: 'inline-block', width: '100%' }
                const buttonStyle = isEllipsis
                    ? { flexShrink: '0', marginLeft: 'auto', marginRight: '32px' }
                    : { display: 'inline-block', float: 'right', marginRight: '32px' }
                let itemTitleStyle = itemParam.style || {}
                if (isEllipsis) {
                    itemTitleStyle = { ...itemTitleStyle, flex: '1', minWidth: '0', overflow: 'hidden' }
                }
                const itemTitle = h('span', { ...itemParam, style: itemTitleStyle }, itemTitleArr);
                const buttons = h('span', { style: buttonStyle }, btn);
                const arr = [itemTitle];
                if (btn.length > 0) arr.push(buttons);
                // Vue 3: 事件使用 onClick 而不是 on: { click }
                // 拖拽排序：启用时给行挂上原生拖拽事件
                const dragProps = this.dragable ? {
                    draggable: true,
                    onDragstart: (event) => { this.onDragStart(data, event) },
                    onDragover: (event) => { this.onDragOver(data, event) },
                    onDrop: (event) => { this.onDrop(data, event) },
                    onDragend: (event) => { this.onDragEnd(event) }
                } : {}
                return h('div', {
                    class: 'tree-row',
                    style: rowStyle,
                    onClick: (event) => { this.treeitemclick(data) },
                    ...dragProps
                }, arr);
            },

            // 在树中按 id 查找节点及其父数组/下标/父节点（parentNode 为 null 表示顶层）
            findNodeAndParent (tree, id, parentNode = null) {
                if (!tree || !tree.length) return null
                for (let i = 0; i < tree.length; i++) {
                    const node = tree[i]
                    if (node.id === id) return { parentArr: tree, index: i, node, parentNode }
                    if (node.children && node.children.length) {
                        const r = this.findNodeAndParent(node.children, id, node)
                        if (r) return r
                    }
                }
                return null
            },
            // 根据鼠标相对行高的位置计算落点类型：before / after（仅同级排序）
            computeDropType (event) {
                const el = event.currentTarget
                if (!el) return 'after'
                const rect = el.getBoundingClientRect()
                const ratio = (event.clientY - rect.top) / rect.height
                if (ratio < 0.5) return 'before'
                return 'after'
            },
            onDragStart (data, event) {
                this.dragNode = data
                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', data.id) // Firefox 需要 setData 才能拖拽
                }
            },
            onDragOver (data, event) {
                event.preventDefault()
                if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
                this.dropType = this.computeDropType(event)
            },
            onDragEnd (event) {
                this.dragNode = null
                this.dropType = ''
            },
            onDrop (targetData, event) {
                event.preventDefault()
                event.stopPropagation()
                const dragData = this.dragNode
                if (!dragData || dragData.id === targetData.id) return

                // 只能同级排序：先定位两个节点，父级（父数组）必须相同
                const dragLoc = this.findNodeAndParent(this.data, dragData.id)
                const tgtLoc = this.findNodeAndParent(this.data, targetData.id)
                if (!dragLoc || !tgtLoc) return
                if (dragLoc.parentArr !== tgtLoc.parentArr) return // 不同父级，禁止跨级/拖成子节点

                const dropType = this.computeDropType(event) // before / after

                // 1) 从原父级移除拖拽节点
                dragLoc.parentArr.splice(dragLoc.index, 1)

                // 2) 同一父数组内移除后目标下标可能变化，重新定位后插入
                const tgtLoc2 = this.findNodeAndParent(this.data, targetData.id)
                if (!tgtLoc2) return
                const insertIndex = tgtLoc2.index + (dropType === 'after' ? 1 : 0)
                tgtLoc2.parentArr.splice(insertIndex, 0, dragData)

                // 3) emit 事件（重排后的扁平 list + 上下文）
                this.emitDragSort(dragData, targetData, dropType)
                this.dragNode = null
                this.dropType = ''
            },
            emitDragSort (dragData, targetData, dropType) {
              let fatherNode=this.commonsJs.findChildNode ('id', this.data, dragData.fid,'children')
              let list = []
              if (fatherNode && fatherNode.children.length) list = fatherNode.children
              else if (dragData.fid==='root') list = this.data
              list.forEach((node,index) => {node.sxh=index})
              if (this.zjConfigdata.dragSortMethod) {
                this.commonsJs.funcEval(this, {list: list, data: this.data, row: dragData},this.zjConfigdata.dragSortMethod)
              }
            },
            renderTitle (h, root, node, data) {
                let newTitle = '';
                const itemTitleArr = []
                // 计算item图标
                const itemIcon = []
                if (this.zjConfigdata.itemIconConfig && this.zjConfigdata.itemIconConfig.length > 0) {
                    this.zjConfigdata.itemIconConfig.forEach((item) => {
                        let returnValue = true
                        if (item.condition) returnValue = this.computeKyf({ ...item, data, row: data })
                        if (returnValue) {
                            // Vue 3: props 直接传入，不需要 props: {} 嵌套
                            const iconConfig = h('Icon', {
                                type: item.name,
                                style: item.style
                            })
                            itemIcon.push(iconConfig)
                        }
                    })
                }

                // 计算item的title
                if (this.zjConfigdata.itemTitleConfig) {
                    this.zjConfigdata.itemTitleConfig.forEach((item, index) => {
                        if (index === 0 && data[item]) newTitle = data[item];
                        else if (data[item]) {
                            let separator = '--'
                            if (this.zjConfigdata.itemTitleSeparator) separator = this.zjConfigdata.itemTitleSeparator
                            newTitle = newTitle + separator + data[item];
                        }
                    });
                } else newTitle = data.title;

                if (itemIcon.length > 0) itemTitleArr.push(itemIcon)
                const titleText = newTitle || data.title
                const titleSpanProps = { style: { cursor: 'pointer' } }
                if (this.zjConfigdata.titleEllipsis === '1') {
                    titleSpanProps.class = 'tree-row-title-ellipsis'
                    titleSpanProps.title = titleText
                }
                itemTitleArr.push(h('span', titleSpanProps, titleText))
                return itemTitleArr
            },
            renderRowButtons (h, root, node, data) {
                const btn = [];
                if (this.zjConfigdata.itemButtons && this.zjConfigdata.itemButtons.length > 0) {
                    this.zjConfigdata.itemButtons.forEach((bItem, bindex) => {
                        if (bItem.componentType === 'Button') bItem.componentType = 'Button'
                        let returnValue = true;
                        if (bItem.condition) { returnValue = this.computeKyf({ ...bItem, data, row: data }) }
                        if (returnValue) {
                            const attrs = this.commonsJs.computeAttrs(this, data, bItem.attrs, bItem.attrsMethod)
                            const bitemstyle = this.commonsJs.computeStyle(this, data, bItem.style, bItem.styleMethod)
                            if (bItem.yyzjmc) bItem.componentType = bItem.yyzjmc
                            // 添加右侧功能区组件事件
                            const computedEvents = this.computeComponentEvent(bItem, data)
                            // Vue 3 格式：事件使用 onXxx 形式
                            const eventProps = {}
                            Object.keys(computedEvents).forEach(eventName => {
                                // 将 on-click 转换为 onClick，click 转换为 onClick
                                const normalizedName = eventName.replace(/^on-?/, '')
                                eventProps['on' + normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1)] = computedEvents[eventName]
                            })

                            const props = { ...this.propstocomponent, configdata: bItem, fathername: this.componentName }
                            if (bItem.list) props.list = bItem.list

                            // Vue 3 h() 函数：props 直接平铺，不需要 props/attrs/domProps/on 嵌套
                            const componentProps = {
                                ...props,
                                size: 'small',
                                ...attrs,
                                style: bitemstyle,
                                key: 'btn' + bItem.blm + bindex,
                                onClick: (event) => {
                                    event.stopPropagation()
                                    this.itembuttonclick(root, node, data, bItem)
                                },
                                ...eventProps
                            }

                            if (this.zjConfigdata.showOnHover === '1') componentProps.class = 'tree-row-btn-hover'

                            const children = []
                            if (bItem.icon) {
                                const iconProps = { type: bItem.icon, style: bItem.iconStyle }
                                if (bItem.iconTitle) iconProps.title = bItem.iconTitle
                                children.push(h(resolveComponent('Icon'), iconProps))
                            }
                            if (bItem.content) children.push(bItem.content || '')
                            const obj = h(resolveComponent(bItem.componentType), componentProps, children)
                            btn.push(obj)
                        }
                    });
                }
                return btn
            },
            computeComponentEvent (item, row) {
                const eventObj = {}
                if (item.eventMethod) {
                    item.eventMethod.forEach((res) => {
                        eventObj[res.name] = (value1, value2, value3, value4, value5, $event) => {
                            const event = $event
                            const obj = { value1, value2, value3, value4, value5, row }
                            if (event && event.stopPropagation) event.stopPropagation()// 防止冒泡
                            if (res.eventInside) this.commonsJs.funcEval1(this, obj, res.eventInside)// 执行内部方法
                            if (res.eventOutside) this.$emit('commonMethod', { ...obj, method: res.eventOutside }) // 导出外部执行方法
                        }
                    })
                }
                return eventObj
            },
            init () {
                this.reset()
                this.initMethod()
            },
            initMethod () {
                if (this.zjConfigdata.mountedMethodInside) this.commonsJs.funcEval(this, this.zjConfigdata, this.zjConfigdata.mountedMethodInside)
                if (this.zjConfigdata.isMounted === '1') this.query()
            },
            // 重置树结构信息
            reset () {
                this.data = []
                this.style = {}
                this.attrs = {}
                this.currentItem = {}
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

            // 动态计算树的item样式的方法
            computeStyle (item) {
                let style = {}
                let tempStyle = {}
                // 兼容数组格式和对象格式的style
                let baseStyle = item.style || {}
                if (item.type === 'main') {
                    baseStyle = this.zjConfigdata.mainStyle || {}
                    if (this.zjConfigdata.mainStyleMethod) tempStyle = this.commonsJs.funcEval1(this, {}, this.zjConfigdata.mainStyleMethod)
                } else if (item.type === 'tree') {
                    baseStyle = this.zjConfigdata.treeStyle || {}
                    if (this.zjConfigdata.treeStyleMethod) tempStyle = this.commonsJs.funcEval1(this, {}, this.zjConfigdata.treeStyleMethod)
                } else if (item.styleMethod) {
                    tempStyle = this.commonsJs.funcEval1(this, {}, item.styleMethod)
                }
                // 处理数组或对象格式的style
                if (Array.isArray(baseStyle) && baseStyle.length > 0) {
                    baseStyle.forEach((styleItem) => {
                        if (styleItem.key && styleItem.key.trim() && styleItem.label !== undefined) {
                            if (styleItem.valueType === 'number') style[styleItem.key.trim()] = Number(styleItem.label)
                            else style[styleItem.key.trim()] = styleItem.label
                        }
                    })
                } else if (baseStyle && typeof baseStyle === 'object') {
                    style = { ...baseStyle }
                }
                style = { ...style, ...tempStyle }
                return style
            },
            computeAttrs (item, data = {}, itemindex, dataindex) {
                let obj = {}
                let newAttrs = {}
                // 兼容数组格式和对象格式的attrs
                const baseAttrs = item.attrs || {}
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
                    } catch (e) { console.log(e, item) }
                }
                obj = { ...obj, ...newAttrs }
                return obj
            },
            // 动态计算树的item样式的方法
            computeItemStyle (method, data) {
                let style = {}
                try {
                    if (method && method.trim()) style = this.commonsJs.funcEval1(this, data, method)
                } catch (e) { console.log(e, method, data) }
                if (data.id) {
                    if (data.id === this.currentItem.id) style.color = '#ff9900'
                }
                return style
            },
            titleButtonExist () {
                let flag = false
                if (this.zjConfigdata.titleButtons && this.zjConfigdata.titleButtons.length > 0) flag = true
                return flag
            },
            setProps (str = '', obj = {}, replace = true) {
                let arr = []
                if (str) { arr = str.split(',') } else { arr = this.configArr }
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
            /**
             * 计算组件渲染条件
             * @param {*} item
             */
            computeKyf (item) {
                // console.log(item,'print item form computeKyf from jtree.vue')
                let returnValue = true;
                if (item) {
                    if (item.condition) {
                        try {
                            const funcEval = new Function('_this', 'obj', item.condition)
                            returnValue = funcEval(this, item)
                        } catch (e) { console.log('tree condition报错：', item.blm, item.condition) }
                    }
                    if (item.kyf && item.kyf === '0') returnValue = false
                }
                return returnValue
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
            treeitemclick (row) {
                this.currentItem = row
                if (this.zjConfigdata.itemClickInside) this.commonsJs.funcEval(this, row, this.zjConfigdata.itemClickInside)
                const obj = { treeName: this.zjConfigdata.name, row, propstocomponent: this.propstocomponent }
                if (this.zjConfigdata.itemClick) obj.method = this.zjConfigdata.itemClick
                if (obj.method) this.$emit('commonMethod', obj)
            },
            handleSelectChange (data) {
                // console.log(data,'sel')
                // this.$emit("editabletreeselect", {name:this.zjConfigdata.name,data:data,});
                this.$emit('commonMethod', { name: this.zjConfigdata.name, data });
            },
            handleCheckChange (list) {
                if (this.ref[this.fathername] && this.ref[this.fathername].componentName) {
                    this.ref[this.fathername].data[this.componentName] = list
                }
                this.$emit('commonMethod', { name: this.zjConfigdata.blm, list })
            },
            handleToggleExpand () {

            },
            handleContentmenu () {

            },

            /**
             * 获取tree扩展的信息
             */
            getExpandInfo () {
                this.expandItem = []
                if (this.data.length === 0) return
                const list = this.commonsJs.getTreeToList(this.data)
                if (list.length === 0) return
                list.forEach((item) => {
                    if (item.expand) this.expandItem.push({ id: item.id })
                })
                // console.log(this.expandItem,'expandItem from jtree.vue')
            },
            /**
             * 设置tree的expand item
             * @param {*} list 查询后的数据res
             * @param {*} expandItem 存储扩展的数据，tree内部定义为this.expandItem
             */
            setExpandInfo (list = [], expandItem) {
                if (list.length > 0 && expandItem.length > 0) {
                    list.forEach((treeItem) => {
                        this.expandItem.forEach((expandItem) => {
                            if (treeItem.id === expandItem.id) treeItem.expand = true
                        })
                    })
                }
            },

            refreshTreeData (obj = {}, type) {
                if (this.data && this.data.length > 0) this.getExpandInfo(); // 获取tree扩展expand的信息
                if (this.zjConfigdata.queryId) {
                    this.$nextTick(() => {
                        let params = { ...obj, ...this.propstocomponent }
                        if (this.zjConfigdata.beforeQuery) params = this.commonsJs.funcEval(this, param, this.zjConfigdata.beforeQuery)
                        this.commonsJs.incoRequest('querylist', this.zjConfigdata.queryId, params).then(async (res) => {
                            this.setExpandInfo(res, this.expandItem)
                            if (this.zjConfigdata.afterQuery) {
                                // let temp_data=this.commonsJs.listToTree( res);
                                this.data = await this.commonsJs.funcEval(this, { res, ...params }, this.zjConfigdata.afterQuery)
                            } else {
                                this.data = this.commonsJs.listToTree(res);
                            }
                        });
                    })
                }
            },
            query (obj = {}) {
                this.refreshTreeData(obj)
            },
            titlebuttonclick (item) {
                this.currentItem = {}
                const obj = { treeName: this.zjConfigdata.blm, blm: item.blm, row: {}, propstocomponent: this.propstocomponent, method: item.click }
                if (item.clickInside) this.commonsJs.funcEval(this, item, item.clickInside)
                if (obj.method) this.$emit('commonMethod', obj)
            },

            deleteItem (root, node, data) {
                if (this.zjConfigdata.deleteId) {
                    this.$Modal.confirm({
                        title: '删除提示',
                        content: '<p>您确认要删这写数据吗，一旦删除将无法恢复</p>',
                        onOk: () => {
                            this.commonsJs.incoRequest('delete', this.zjConfigdata.deleteId, data).then(() => {
                                this.$Message.info('删除成功');
                                this.refreshTreeData();
                            });
                        },
                        onCancel: () => {
                            this.$Message.info('取消删除');
                        }
                    });
                }
            },
            itembuttonclick (root, node, item, bItem) {
                this.currentItem = item
                const obj = {
                    root,
                    node,
                    row: item,
                    item: bItem,
                    treeName: this.zjConfigdata.blm,
                    blm: bItem.blm,
                    method: bItem.click,
                    propstocomponent: this.propstocomponent
                }
                if (bItem.clickInside) this.commonsJs.funcEval(this, obj, bItem.clickInside)
                if (bItem.blm === 'delete') this.deleteItem(root, node, item);
                if (obj.method) this.$emit('commonMethod', obj)
                // else this.$emit('itembuttonclick',obj)
            },
            commitMethod (obj) { if (obj.method) this.commonsJs.funcEval(this, obj, obj.method) },
            // 向根发送要触发执行的方法和数据
            triggerFunction (blm, method, obj) {
                console.log(blm, method, this.$root.componentRefs, obj, 'triggerFunction from jtree.vue')
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
            }
        },
        computed: {
            ...mapState('admin/user', ['info']),
            treedata () {
                if (this.data.length === 0) return []
                if (!this.searchTree.trim()) return this.data
                const oldList = this.commonsJs.treeToList(this.data)
                const list = []
                for (let i = 0; i < oldList.length; i++) {
                    const data = oldList[i]
                    let newTitle = ''
                    if (this.zjConfigdata.itemTitleConfig) {
                        for (let j = 0; j < this.zjConfigdata.itemTitleConfig.length; j++) {
                            const item_param = this.zjConfigdata.itemTitleConfig[j]
                            if (j === 0 && data[item_param]) newTitle = data[item_param];
                            else if (data[item_param]) { newTitle = newTitle + this.zjConfigdata.itemTitleSeparator + data[item_param]; }
                        }
                    } else newTitle = data.title;
                    if (newTitle.indexOf(this.searchTree.trim()) !== -1) { list.push(data) }
                }
                const treelist = []
                list.forEach((item) => {
                    treelist.push(item)
                    if (item.fid !== 'root') findFather(item.fid)
                    findChildren(item.id)
                })
                const finalList = Array.from(new Set(treelist))
                return this.commonsJs.listToTree(finalList)
                function findFather (id) {
                    const length = oldList.length
                    let item = {}
                    let index = -1
                    if (length > 0) {
                        for (let i = 0; i < length; i++) {
                            if (oldList[i].id === id) {
                                item = oldList[i]
                                index = i
                                break;
                            }
                        }
                        if (index > -1) {
                            treelist.push(item)
                            oldList.splice(index, 1)
                            if (item.fid !== 'root') findFather(item.fid)
                        }
                    }
                }
                function findChildren (id) {
                    const length = oldList.length
                    let item = {}
                    if (length > 0) {
                        for (let i = 0; i < length; i++) {
                            if (oldList[i].fid === id) {
                                item = oldList[i]
                                treelist.push(item)
                                findChildren(item.id)
                            }
                        }
                    }
                }
            },
            selectedData () {
                if (this.$refs.tree) return this.$refs.tree.getCheckedNodes()
                else return []
            } // 选中的数据
        },
        watch: {
            childmethodparams: {
                handler (n, o) {
                    if (n && n.methodName) { this.$nextTick(() => { this.$emit('excutefunc', n) }) }
                },
                deep: true,
                immediate: true
            },
            configdata: {
                async handler (n) {
                    if (n.blm) {
                        const zjConfigdata = JSON.parse(JSON.stringify(n))
                        if (zjConfigdata.registerComponent) {
                            const selfComponent = zjConfigdata.registerComponent.replace(' ', '').split(',')
                            await this.commonsJs.registerComponent(selfComponent, this)
                        }
                        this.componentName = zjConfigdata.blm + (this.index ? this.index : '')
                        if (!this.$root.componentRefs) this.$root.componentRefs = {}
                        this.$root.componentRefs[this.componentName] = this
                        const addConfigdata = this.commonsJs.funcEval1(this, {}, zjConfigdata.addConfigdata)
                        if (zjConfigdata.addConfigdata) Object.assign(zjConfigdata, addConfigdata)
                        this.zjConfigdata = zjConfigdata
                        if (n.function || n.registerMethods) await this.commonsJs.createFunction(n.function, n.registerMethods, this, this.componentName)
                        if (this.zjConfigdata.createClass) this.commonsJs.loadCssCode(this.zjConfigdata.createClass, n.blm)
                        this.init()
                    }
                },
                deep: true,
                immediate: true
            },
            setdata: {
                handler () {
                    if (this.setdata.id) {
                        this.data = this.setdata.data
                    }
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
        updated () {
            // 监测根的传递参数的变化，如果变化了，看是否有本组件的数据，如果有本组件的数据，调用处理
            if (this.$root.componentsParam[this.componentName]) {
                const myComponentsParam = JSON.parse(JSON.stringify(this.$root.componentsParam[this.componentName]))
                delete this.$root.componentsParam[this.componentName]
                this.handleRootFunction(myComponentsParam)
            }
        },
        created () { },
        beforeUnmount () {
            delete this.$root.componentRefs[this.componentName]
            this.commonsJs.removeCssCode(this.zjConfigdata.blm)
        }
    };
</script>
<style scoped>
.tree-mainBox {
  /* height: 100%; */
  width: 100%;
  overflow-y: auto;
}

.tree-mainBox .title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* height: 32px; */
  font-size: 16px;
}

.tree-mainBox .leftTitle {
  flex: 1;
}

.tree-mainBox :deep(.tree-class .ivu-tree-title) {
  overflow-y: auto;
  width: 100%;
}

/* 更改图标 */
.tree-mainBox :deep(.ivu-icon-ios-arrow-forward):before {
  content: "\f330";
  color: green
}

.tree-mainBox :deep(.ivu-tree-arrow-open .ivu-icon-ios-arrow-forward):before {
  content: "\f418";
  color: chocolate
}

.tree-mainBox :deep(.ivu-tree-arrow-open i) {
  transform: rotate(0deg);
}

.tree-mainBox :deep(.ivu-tree-arrow i) {
  font-size: 12px;
  vertical-align: middle;
  font-weight: 900;
  /* border: 1px #6b6a6a solid; */
}

/* 按钮 hover 显隐 */
.tree-mainBox :deep(.tree-row .tree-row-btn-hover) {
  display: none;
}
.tree-mainBox :deep(.tree-row:hover .tree-row-btn-hover) {
  display: inline-block;
}

/* 标题省略号显示 */
.tree-mainBox :deep(.tree-row-title-ellipsis) {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>
