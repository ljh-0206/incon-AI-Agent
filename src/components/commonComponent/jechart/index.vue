<template>
    <div :style="containerStyle" v-bind="containerAttrs" :class="containerClass">
        <div ref="chartEl" :id="configdata.blm" style="width:100%;height:100%"></div>
    </div>
</template>

<script>
    import { mapState } from 'vuex'
    import * as echarts from 'echarts'

    export default {
        name: 'jechart',
        props: {
            index: { type: Number, default: null },
            // Vue3 v-model
            modelValue: { type: Object, default: () => ({}) },
            // 兼容旧写法
            value: { type: Object, default: () => ({}) },
            list: { type: Array, default: () => [] },
            fathername: { type: String },
            propstocomponent: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                chart: null,
                _componentName: '',
                _renderVersion: 0,
                _ro: null,
                _eventsBound: false,
                _styleEl: null,
                _lastOptionJson: null
            }
        },
        computed: {
            // 统一取值：优先 modelValue，兼容 value
            computedValue () {
                return this.modelValue && Object.keys(this.modelValue).length > 0
                    ? this.modelValue
                    : this.value
            },
            // 容器样式
            containerStyle () {
                let s = { height: '100%', width: '100%', display: 'inline-block' }
                if (this.configdata.mockData) return s
                if (this.configdata.style) s = { ...s, ...this.configdata.style }
                if (this.configdata.styleMethod) {
                    try {
                        s = { ...s, ...this.commonsJs.funcEval1(this, {}, this.configdata.styleMethod) }
                    } catch (e) { /* 忽略样式方法执行错误 */ }
                }
                return s
            },
            // 容器属性
            containerAttrs () {
                let a = {}
                if (this.configdata.attrs) a = { ...this.configdata.attrs }
                if (this.configdata.attrsMethod) {
                    try {
                        a = { ...a, ...this.commonsJs.funcEval1(this, {}, this.configdata.attrsMethod) }
                    } catch (e) { /* 忽略属性方法执行错误 */ }
                }
                return a
            },
            // 容器 class
            containerClass () {
                const c = ['jechart']
                if (this.configdata.blm) c.push('style-' + this.configdata.blm, this.configdata.blm)
                if (this.configdata.classMethod) {
                    try {
                        c.push(this.commonsJs.funcEval1(this, {}, this.configdata.classMethod))
                    } catch (e) { /* 忽略class方法执行错误 */ }
                }
                return c
            },
            ...mapState('admin/user', ['info'])
        },
        watch: {
            // configdata 变化：注册组件 + 触发渲染
            configdata: {
                handler (n) {
                    if (!n || !n.blm) return
                    this._componentName = n.blm
                    this.$root.componentRefs[n.blm] = this
                    // 注入自定义CSS
                    if (n.createClass) this.loadCssCode(n.createClass)
                    this.scheduleRender()
                },
                deep: true,
                immediate: true
            },
            // 数据变化（modelValue 或 value）：initType='1' 时触发渲染
            computedValue: {
                handler (n) {
                    if (n && Object.keys(n).length > 0 && this.configdata.initType === '1') {
                        this.scheduleRender()
                    }
                },
                deep: true
            },
            // propstocomponent.option 直接传入 option
            'propstocomponent.option': {
                handler () { this.scheduleRender() },
                deep: true
            },
            // list 数据变化时向上 emit
            list: {
                handler (n) {
                    if (n && n.length > 0 && !(this.computedValue && this.computedValue.list)) {
                        this.$emit('update:modelValue', { list: n })
                    }
                },
                deep: true,
                immediate: true
            }
        },
        methods: {
            /**
             * 统一渲染调度入口 —— 去抖：多个 watcher 同一帧内触发只执行一次
             */
            scheduleRender () {
                this._renderVersion++
                this._renderPending = true
                const ver = this._renderVersion
                requestAnimationFrame(() => {
                    if (ver !== this._renderVersion) return
                    this._renderPending = false
                    this.doRender()
                })
            },

            /**
             * 核心渲染逻辑
             */
            doRender () {
                // 1. 确保图表实例存在
                if (!this.ensureChart()) return

                // 2. 获取 option
                const option = this.resolveOption()
                if (!option) return

                // 3. 处理 Promise（getoption 可能返回 Promise）
                if (option && typeof option.then === 'function') {
                    option.then(res => {
                        if (this.chart && !this.chart.isDisposed()) {
                            this.applyOption(res)
                        }
                    })
                    return
                }

                // 4. 直接设置 option
                this.applyOption(option)
            },

            /**
             * 确定 option 来源（优先级）
             * 1. propstocomponent.option（外部直接传入）
             * 2. configdata.getoption（动态执行）
             */
            resolveOption () {
                // 最高优先级：外部直接传入 option
                if (this.propstocomponent && this.propstocomponent.option) {
                    return this.propstocomponent.option
                }
                // 通过 getoption 动态生成
                if (this.configdata.getoption) {
                    try {
                        return this.commonsJs.funcEval1(this, {}, this.configdata.getoption)
                    } catch (e) {
                        console.warn('[jechart] getoption 执行失败:', e.message)
                        return null
                    }
                }
                return null
            },

            /**
             * 将 option 应用到图表实例
             * 缓存上次的 option JSON，如果相同则跳过 setOption
             * 防止样式变化等无关变更触发不必要的坐标系销毁重建
             * 注意：ECharts 6.0 中 resize() 会触发完整的坐标系重建，
             * 所以不在 setOption 后立即调用 resize()，由 ResizeObserver 处理尺寸变化
             */
            applyOption (option) {
                if (!option) return
                try {
                    // 深拷贝：剥离 Vue3 Proxy + 防止 ECharts 内部修改原始数据
                    const plain = JSON.parse(JSON.stringify(option))
                    // 修复 grid/axis 格式不匹配
                    this.fixOptionCompat(plain)
                    // 对比 option 是否有变化
                    const jsonStr = JSON.stringify(plain)
                    if (jsonStr === this._lastOptionJson) {
                        // option 未变化，无需操作（尺寸变化由 ResizeObserver 处理）
                        return
                    }
                    this._lastOptionJson = jsonStr
                    this.chart.setOption(plain, { notMerge: true })
                } catch (e) {
                    console.warn('[jechart] setOption 失败:', e.message)
                }
            },

            /**
             * 确保图表实例已初始化
             * @returns {boolean} 实例是否可用
             */
            ensureChart () {
                // 已有实例：检查是否被 dispose
                if (this.chart) {
                    if (this.chart.isDisposed()) {
                        this.chart = null
                    } else {
                        return true
                    }
                }

                const el = this.$refs.chartEl
                if (!el) return false

                // DOM 还没有尺寸，等 ResizeObserver 触发
                if (el.offsetWidth === 0 || el.offsetHeight === 0) {
                    this.setupResizeObserver()
                    return false
                }

                // 初始化 ECharts 实例
                this.chart = echarts.init(el)
                this.bindEvents()
                this.setupResizeObserver()
                return true
            },

            /**
             * 绑定 ECharts 事件
             */
            bindEvents () {
                if (this._eventsBound || !this.chart) return
                this._eventsBound = true
                const events = this.configdata.componentEvent || this.configdata.eventlist
                if (events && events.length > 0) {
                    events.forEach(evt => {
                        if (!evt.name) return
                        this.chart.on(evt.name, (params) => {
                            try {
                                this.commonsJs.funcEval1(this, params, evt.eventInside)
                            } catch (e) {
                                console.warn('[jechart] 事件回调执行失败:', evt.name, e.message)
                            }
                        })
                    })
                }
            },

            /**
             * ResizeObserver：容器尺寸变化时自动重新渲染
             * 注意：ECharts 6.0 中 resize() 会触发完整的坐标系重建，
             * 所以改用重新 setOption 的方式来适应新尺寸
             */
            setupResizeObserver () {
                if (this._ro) return
                const el = this.$refs.chartEl
                if (!el || typeof ResizeObserver === 'undefined') return

                this._ro = new ResizeObserver(() => {
                    if (!this.chart || this.chart.isDisposed()) {
                        // 还没初始化，尝试初始化
                        if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
                            this.chart = echarts.init(el)
                            this.bindEvents()
                            this.doRender()
                        }
                        return
                    }
                    // 容器尺寸变化，使缓存失效并重新渲染
                    this._lastOptionJson = null
                    this.scheduleRender()
                })
                this._ro.observe(el)
            },

            /**
             * 修复 ECharts option 中 grid/axis 格式不一致问题
             * 数据库中的 getoption 模板可能生成 grid:[{...}] 数组但 xAxis/yAxis 为对象，
             * 或反过来。ECharts 要求 grid/axis 格式匹配，否则 coordinateSystem 创建失败
             */
            fixOptionCompat (option) {
                if (!option) return option
                // 统一 grid/xAxis/yAxis 格式：当其中一个为数组另一个为对象时对齐
                let gridIsArr = Array.isArray(option.grid)
                let xIsArr = Array.isArray(option.xAxis)
                let yIsArr = Array.isArray(option.yAxis)
                // grid 是单元素数组 → 转对象
                if (gridIsArr && option.grid.length === 1) {
                    option.grid = option.grid[0]
                    gridIsArr = false
                }
                // xAxis 是单元素数组 → 转对象
                if (xIsArr && option.xAxis.length === 1) {
                    option.xAxis = option.xAxis[0]
                    xIsArr = false
                }
                // yAxis 是单元素数组 → 转对象
                if (yIsArr && option.yAxis.length === 1) {
                    option.yAxis = option.yAxis[0]
                    yIsArr = false
                }
                return option
            },

            /**
             * 动态注入自定义 CSS 代码
             */
            loadCssCode (code) {
                const id = 'style-' + this._componentName
                const old = document.getElementById(id)
                if (old) old.remove()
                const style = document.createElement('style')
                style.type = 'text/css'
                style.id = id
                style.appendChild(document.createTextNode(code))
                document.head.appendChild(style)
                this._styleEl = style
            }
        },
        mounted () {
            // 首次尝试初始化（如果 configdata 已经就绪）
            if (this.configdata && this.configdata.blm) {
                this.scheduleRender()
            }
        },
        unmounted () {
            // 清理 ResizeObserver
            if (this._ro) {
                this._ro.disconnect()
                this._ro = null
            }
            // 销毁 ECharts 实例
            if (this.chart) {
                this.chart.dispose()
                this.chart = null
            }
            // 清理注入的 CSS
            if (this._styleEl) {
                this._styleEl.remove()
                this._styleEl = null
            }
            // 从全局 refs 中移除
            if (this._componentName && this.$root && this.$root.componentRefs) {
                delete this.$root.componentRefs[this._componentName]
            }
        }
    }
</script>

<style scoped>
.jechart {
    display: inline-block;
}
</style>
