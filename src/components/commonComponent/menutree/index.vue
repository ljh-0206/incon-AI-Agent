<template>
    <div :style="computeStyle()" :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <Button v-if="env()" @click="test">menutree test</Button> <!--测试按钮-->
        <Menu ref="menu" width="auto">
            <template>
                <template v-for="(item, index) in data">
                    <i-menu-side-item-tree v-if="!item.children || item.children.length==0" :menu="item" :key="index"
                        :configdata="configdata"></i-menu-side-item-tree>
                    <i-menu-side-submenu-tree v-else :configdata="configdata" :menu="item"
                        :key="index+_uid"></i-menu-side-submenu-tree>
                </template>
            </template>
        </Menu>
    </div>
</template>
<script>

    import iMenuSideItemTree from './menu-item';
    import iMenuSideSubmenuTree from './submenu';

    export default {
        name: 'menutree',
        components: {
            iMenuSideItemTree,
            iMenuSideSubmenuTree
        },
        props: {
            list: { type: Array, default: () => [] },
            index: { type: Number, default: null },
            fathername: { type: String, default: '' },
            configdata: { type: Object, default: () => ({}) },
            propstocomponent: {
                type: Object,
                default: () => ({})
            },
            setdata: { type: Object, default: () => ({}) },
            childmethodparams: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                componentName: '',
                ref: this.$root.componentRefs,
                data: [],
                style: {},
                attrs: {},
                propstochild: {},
                searchTree: '',
                currentItem: {},
                expandItem: [],
                tempdata: {}
            }
        },

        methods: {
            async test () {
                console.log(this.configdata, 'configdata test in jform');
                console.log(this.data, 'data from test in jform')
                console.log(this.propstocomponent, 'propstocomponent test in jform');
                console.log(this.propstochild, 'propstochild test in jform');
                console.log('list', this.list, 'componentList', this.componentList, 'triggleList', this.triggleList, 'triggleByFatherObject', this.triggleByFatherObject);
                console.log('vif', this.vif)
                console.log(this.attrs, 'this.attrs')
                console.log(this.styles, 'this.style')
            },
            env () {
                let returnValue = false
                const str = localStorage.getItem('incoenv')
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1)returnValue = true
                return returnValue
            },
            init () {
                this.reset()
                this.initMethod()
            },
            // 重置树结构信息
            reset () {
                this.data = []
                this.style = {}
                this.attrs = {}
                this.currentItem = {}
            },
            initMethod () {
                if (this.configdata.mountedMethodInside) this.commonsJs.funcEval(this, this.configdata, this.configdata.mountedMethodInside)
                if (this.configdata.isMounted === '1') this.query()
            },
            computeStyle () {
                let newstyle = {}
                if (this.configdata.mainStyle) newstyle = { ...this.configdata.mainStyle }
                if (this.configdata.styleMethod) {
                    const funcEval = new Function('_this', 'obj', this.configdata.styleMethod)
                    const styleEnv = funcEval(this, {}) // 执行内部方法
                    newstyle = { ...newstyle, ...styleEnv }
                }
                return newstyle
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
                    //   style.lang='less'
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
            query (obj = {}, type) {
                if (this.data && this.data.length > 0) this.getExpandInfo(); // 获取tree扩展expand的信息
                if (this.configdata.queryId) {
                    this.$nextTick(() => {
                        let params = { ...obj, ...this.propstocomponent }
                        if (this.configdata.beforeQuery) params = this.commonsJs.funcEval(this, param, this.configdata.beforeQuery)
                        this.commonsJs.incoRequest('querylist', this.configdata.queryId, params).then(async (res) => {
                            if (this.configdata.afterQuery) {
                                this.data = await this.commonsJs.funcEval(this, { res, ...params }, this.configdata.afterQuery)
                            } else {
                                this.data = this.commonsJs.listToTree(res);
                            }
                        });
                    })
                }
            },
            itemClick (param) {
                if (this.configdata.itemClick) param.method = this.configdata.itemClick
                this.$emit('commonMethod', param)
            }
        },
        computed: {

        },
        watch: {
            componentName: {
                handler (n, o) {
                    if (n) { this.$root.componentRefs[this.componentName] = this }
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
                handler (n) {
                    if (n.blm) {
                        this.componentName = this.configdata.blm + (this.index ? this.index : '')
                        if (this.configdata.createClass) this.loadCssCode(this.configdata.createClass)
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
            propstocomponent: {
                handler (n) {
                    if (n.setdata.id) {
                        this.data = n.setdata.data
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
        created () { }
    }
</script>
