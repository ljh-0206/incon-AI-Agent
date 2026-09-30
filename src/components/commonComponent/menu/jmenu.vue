<template>
    <!-- 改菜单指做到三级下拉 -->
    <Menu transfer mode="horizontal" v-bind="computeMenuAttrs()" :active-name="activeName" class="menu_class"
        :class="'style-' + configdata.blm + ' ' + configdata.blm" :style="configdata.style">
        <!-- <Button v-if="env()" @click="test">菜单测试按钮</Button> -->
        <template v-for="(item,index) in data">
            <template v-if="!item.children">
                <Menu-Item v-if="computeKyf(item)" :name="item.name" :key="(item.name+index)"
                    :class="item.name===activeName ? 'activeClass ivu-menu-item-active ivu-menu-item-selected' :''"
                    :attrs="computeAttrs(item.item)">
                    <div @click="handleClick(item,index)">
                        <Icon v-if="item.icon" :type="item.icon" :style="computeStyle(item)"
                            :attrs="computeAttrs(item.item)" />
                        <span :style="computeStyle(item)" :attrs="computeAttrs(item.item)">{{item.content}}</span>
                    </div>
                </Menu-Item>
            </template>
            <template v-else>
                <!-- 下拉菜单 -->
                <Submenu v-if="computeKyf(item)" :name="item.name">
                    <template #title>
                        <Icon v-if="item.icon" :type="item.icon" :style="computeStyle(item)"
                            :attrs="computeAttrs(item.item)" />
                        <span :style="computeStyle(item)" :attrs="computeAttrs(item.item)">{{item.content}}</span>
                    </template>
                    <!-- 下拉一级菜单配置 -->
                    <template v-if="(item.children && item.children.length>0)">
                        <template v-for="(child,childindex) in item.children">
                            <!-- 配置子菜单项 -->
                            <Menu-Item v-if="computeKyf(child)" :name="child.name" :key="(child.name+childindex+index)"
                                :style="computeStyle(child)" :attrs="computeAttrs(child)">
                                <div @click="handleClick(child,childindex)">
                                    <Icon v-if="item.icon" :type="item.icon" :style="computeStyle(child)"
                                        :attrs="computeAttrs(child)" />
                                    <span :style="computeStyle(child)"
                                        :attrs="computeAttrs(child)">{{child.content}}</span>
                                </div>
                            </Menu-Item>
                        </template>
                    </template>
                </Submenu>
            </template>
        </template>
    </Menu>
</template>
<script>
    import { mapState, mapGetters, mapActions } from 'vuex'
    export default {
        name: 'jmenu',
        props: {
            configdata: { type: Object, default: () => ({}) },
            value: { type: Array, default: () => [] },
            propstocomponent: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                currentName: '',
                currentItem: {},
                data: [],
                ref: this.$root.componentRefs,
                tempdata: {}
            }
        },
        methods: {
            test () {
                console.log(this.list, '打印菜单list of jmenu.vue')
                console.log(this.configdata, 'configdata of jmenu.vue')
                console.log(this.data, 'data of jmenu.vue')
            },
            env () {
                let returnValue = false
                const str = localStorage.getItem('incoenv')
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1)returnValue = true
                return returnValue
            },
            query (sqlId) {
                // 这个sqlid是查询菜单的id，给的是固定值
                this.commonsJs.incoRequest('queryList', '16715135857696c91aeb9aaa79cb381dd82af4b8a3e5ca2').then((res) => {
                    let list = []
                    if (res && res.length > 0) list = this.commonsJs.listToTree(res, 'id', 'fid', 'name', '-1')
                    this.data = list
                // console.log(list,'list of menu from jmenu.vue')
                })
            },
            handleClick (item, index) {
                this.currentItem = { ...item }
                if (this.configdata.componentEvent && this.configdata.componentEvent.length > 0) {
                    for (let i = 0; i < this.configdata.componentEvent.length; i++) {
                        const eventItem = this.configdata.componentEvent[i]
                        if (eventItem.name === 'click') this.commonsJs.funcEval1(this, item, eventItem.eventInside)
                    }
                } else {
                    this.currentName = item.name
                    const currentRouterName = this.$router.currentRoute.name
                    if (currentRouterName === item.name) { return }
                    const query = {};
                    // if(item.router_props){
                    //     let propsArr = item.router_props.split("&");
                    //     for (let props of propsArr) {
                    //         query[props.split("=")[0]] = props.split("=")[1];
                    //     }
                    // }
                    // 是否新标签页打开
                    if (item.sfxbqydk == '1') {
                        const routeData = this.$router.resolve({ name: item.name, query })
                        window.open(routeData.href, '_blank')
                    } else {
                        this.$router.push({ name: item.name, query })
                    }
                }
            },
            /**
             * 计算组件渲染条件
             * @param {*} item
             */
            computeMenuAttrs () {
                let attrs = {}
                if (this.configdata.attrsMethod) {
                    attrs = this.commonsJs.funcEval1(this, {}, this.configdata.attrsMethod)
                }
                return attrs;
            },
            computeKyf (item) {
                let returnValue = true;
                if (this.configdata.itemCondition) {
                    const funcEval = new Function('_this', 'obj', this.configdata.itemCondition)
                    returnValue = funcEval(this, item)
                }
                if (item.kyf && item.kyf === '0') returnValue = false
                return returnValue
            },
            computeAttrs (item, index) {},
            computeStyle () {
                let newstyle = {}
                if (this.configdata.itemStyleMethod) {
                    const funcEval = new Function('_this', 'obj', this.configdata.itemStyleMethod)
                    const styleEnv = funcEval(this, {}) // 执行内部方法
                    newstyle = styleEnv
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
            }
        },
        mounted () {
            if (this.configdata.dataSource === '1') {
                if (this.configdata.configdataChange) this.commonsJs.funcEval1(this, {}, this.configdata.configdataChange)
            } else {
                if (this.value.length == 0) this.query()
                else this.data = this.value
            }
            if (this.configdata.createClass) {
                this.loadCssCode(this.configdata.createClass)
            }
        },
        watch: {
            configdata: {
                handler (n, o) {
                    if (n.blm) this.$root.componentRefs[n.blm] = this
                },
                deep: true,
                immediate: true
            }
        },
        computed: {
            ...mapState('admin/user', ['info']),
            activeName () {
                return this.$route.name
            }
        }

    }
</script>
