<template>
    <div :ref="configdata.blm" class="jsmind-container" :class="'style-' + configdata.blm + ' ' + configdata.blm"></div>
</template>
<script>
    import { mapState, mapGetters } from 'vuex'
    // 在页面引入jsmind
    import 'jsmind/style/jsmind.css';
    import jsMind from 'jsmind';

    export default {
        name: 'jjsmind',
        components: {},
        props: {
            index: { type: Number, default: null },
            datas: { type: Object, default: () => ({}) },
            options: { type: Object, default: () => ({}) },
            configdata: {
                type: Object,
                default: () => ({})
            }
        },
        data () {
            return {
                componentName: '',
                ref: this.$root.componentRefs,
                myMind: null,
                jsmind_data: {
                    meta: {
                        name: 'jsMind sample'
                    },
                    format: 'node_tree',
                    data: {}
                },
                // 配置项
                pzObj: {}
            }
        },
        watch: {
            configdata: {
                handler (n, o) {
                    if (n.blm) {
                        this.componentName = n.blm
                        this.$root.componentRefs[this.componentName] = this
                        setTimeout(() => {
                            this.pzObj = {
                                editable: true, // 是否启用编辑
                                theme: 'primary', // 主题
                                mode: 'full', // 布局模式
                                support_html: true, // 是否支持节点中的 HTML 元素
                                log_level: 'info', // 日志级别
                                view: {
                                    engine: 'svg', // 节点之间线条的渲染引擎
                                    hmargin: 500, // 容器的最小水平距离
                                    vmargin: 500, // 容器的最小垂直距离
                                    line_width: 2, // 线条宽度
                                    line_color: '#57a3f3', // 线条颜色
                                    line_style: 'curved', // 线条样式，直线或曲线
                                    custom_line_render: null, // 自定义线条渲染方法
                                    draggable: true, // 是否允许拖动画布
                                    hide_scrollbars_when_draggable: true, // 当 draggable 为 true 时是否隐藏滚动条
                                    node_overflow: 'wrap', // 节点文本过长时的样式
                                    enable_device_pixel_ratio: false, // 根据设备像素比渲染高清思维导图
                                    expander_style: 'char', // 子节点展开器的样式
                                    zoom: { // 缩放配置
                                        min: 0.01, // 最小缩放比例
                                        max: 100, // 最大缩放比例
                                        step: 0.01 // 缩放比例步长
                                    },
                                    custom_node_render: null // 自定义节点渲染方法
                                },
                                layout: {
                                    hspace: 30, // 节点之间的水平空间
                                    vspace: 20, // 节点之间的垂直空间
                                    pspace: 13, // 节点与连接线之间的水平空间
                                    cousin_space: 0 // 相邻节点子节点之间的额外垂直空间
                                }
                            }
                            this.innerDatafn()
                        }, 330);
                    }
                },
                deep: true,
                immediate: true
            },
            datas: {
                handler (n, o) {
                    if (o) {
                        this.myMind.show(this.jsmind_data);
                    }
                },
                deep: true,
                immediate: true
            }
        },
        methods: {
            innerDatafn () {
                // 数据内容
                this.jsmind_data.data = this.datas
                // 配置项
                let optionss = {
                    container: this.$refs[this.configdata.blm] // [必填] 容器的 ID
                }
                if (Object.keys(this.options).length) {
                    optionss = {
                        container: this.$refs[this.configdata.blm], // [必填] 容器的 ID
                        ...this.options
                    }
                } else {
                    optionss = {
                        container: this.$refs[this.configdata.blm], // [必填] 容器的 ID
                        editable: true, // 是否启用编辑
                        // theme: 'asbestos', // 主题
                        mode: 'full', // 布局模式
                        support_html: true, // 是否支持节点中的 HTML 元素
                        log_level: 'info', // 日志级别
                        view: {
                            engine: 'svg', // 节点之间线条的渲染引擎
                            hmargin: 100, // 容器的最小水平距离
                            vmargin: 50, // 容器的最小垂直距离
                            line_width: 2, // 线条宽度
                            line_color: '#1E61FF', // 线条颜色
                            line_style: 'curved', // 线条样式，直线或曲线
                            custom_line_render: null, // 自定义线条渲染方法
                            draggable: true, // 是否允许拖动画布
                            hide_scrollbars_when_draggable: true, // 当 draggable 为 true 时是否隐藏滚动条
                            node_overflow: 'wrap', // 节点文本过长时的样式
                            enable_device_pixel_ratio: false, // 根据设备像素比渲染高清思维导图
                            expander_style: 'char', // 子节点展开器的样式
                            zoom: { // 缩放配置
                                min: 0.5, // 最小缩放比例
                                max: 2.1, // 最大缩放比例
                                step: 0.1 // 缩放比例步长
                            },
                            custom_node_render: null // 自定义节点渲染方法
                        },
                        layout: {
                            hspace: 30, // 节点之间的水平空间
                            vspace: 20, // 节点之间的垂直空间
                            pspace: 13, // 节点与连接线之间的水平空间
                            cousin_space: 0 // 相邻节点子节点之间的额外垂直空间
                        }
                    }
                }
                // 阻止浏览器默认右键事件
                document.oncontextmenu = function () {
                    return false;
                };
                this.myMind = new jsMind(optionss);
                this.myMind.show(this.jsmind_data);
            }
        },
        created () { },
        mounted () {
        }
    }
</script>
<style lang="less">
.jsmind-container {
width: 100%;
height: 100%;
background-image: url(../../../assets/images/bg-655.png);
background-size: cover;
background-repeat: no-repeat;
background-position: center;
}

.jsmind-container jmnode {
background-image: url(../../../assets/images/tbg92.png);
background-size: auto 100%;
background-position: left center;
box-shadow: 0 0 5px 0 #ccc;
border: 2px solid #fff;
}

.jsmind-container jmnode.selected {
border: none;
background-image: none;
background-color: #6165F0;
color: #fff;
box-shadow: 2px 2px 8px #999;
}

.jsmind-container jmexpander {
width: 14px;
height: 14px;
line-height: 14px;
font-size: 12px;
border-radius: 50%;
}

.jsmind-container jmnode.root {
background: #6165F0;
background: linear-gradient(to right, #2F2EEB, #855aef, #7d80e3);
border: 6px solid #fff;
color: #fff;
}
</style>
