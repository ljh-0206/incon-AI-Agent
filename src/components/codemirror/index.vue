<template>
    <div class="code-mirror-div" :ref="configdata.blm">
        <span class="tool-bar" v-if="computeEdit() && configdata.xsgjl !== '0'" style="margin-right: 10px;">
            <Button v-if="env()" @click="test">codeEditor test</Button>
            <span>请选择主题：</span>
            <Select v-model="selectedTheme" placeholder="请选择" size="small" style="width:150px"
                @on-change="themeChange">
                <Option v-for="item in cmThemeOptions" :key="item.value" :label="item.label" :value="item.value"></Option>
            </Select>
            <span style="margin-left: 10px">请选择编辑模式：</span>
            <Select v-model="selectedMode" placeholder="请选择" size="small" style="width:150px"
                @on-change="modeChange">
                <Option v-for="item in cmEditorModeOptions" :key="item.value" :label="item.label" :value="item.value"></Option>
            </Select>
            <span style="margin-left: 10px">请选择字体大小：</span>
            <Select v-model="fontsize" placeholder="请选择字体大小" size="small" style="width:150px"
                @on-change="fontsizeChange">
                <Option v-for="item in fontsizeList" :key="item" :label="item" :value="item"></Option>
            </Select>
            <Button @click="checkCode">语法检查</Button>
            <Button type="warning" size="small" @click="handleFullscreen">全屏显示</Button>
        </span>
        <div class="code-editor-container" ref="cmEditorDiv" :style="containerStyle">
            <codemirror
                v-model="editorValue"
                :style="cmStyle"
                :extensions="currentExtensions"
                :autofocus="false"
                :indent-with-tab="true"
                :tab-size="2"
                @ready="handleReady"
            />
        </div>
    </div>
</template>

<script>
    import { Codemirror } from 'vue-codemirror'
    import { keymap, EditorView } from '@codemirror/view'
    import { toggleComment, moveLineUp, moveLineDown } from '@codemirror/commands'
    import { javascript } from '@codemirror/lang-javascript'
    import { json } from '@codemirror/lang-json'
    import { sql } from '@codemirror/lang-sql'
    import { css } from '@codemirror/lang-css'
    import { xml } from '@codemirror/lang-xml'
    import { html } from '@codemirror/lang-html'
    import { yaml } from '@codemirror/lang-yaml'
    import { python } from '@codemirror/lang-python'
    import { markdown } from '@codemirror/lang-markdown'
    import { startCompletion } from '@codemirror/autocomplete'
    import { oneDark } from '@codemirror/theme-one-dark'
    import { linter, lintGutter } from '@codemirror/lint'
    import { Compartment } from '@codemirror/state'
    import { markRaw } from 'vue'
    import { JSHINT } from 'jshint'

    // 代码格式化
    import { js_beautify as jsBeautify } from 'js-beautify'

    // JavaScript 实时语法检查 (对应原版 lint: true + javascript-lint)
    const jsLinter = linter((view) => {
        const code = view.state.doc.toString()
        if (!code || !code.trim()) return []
        const options = {
            esversion: 6,
            strict: false,
            asi: true,
            bitwise: true,
            noarg: true,
            eqeqeq: false,
            undef: true,
            curly: false,
            devel: true,
            jquery: true,
            browser: true,
            evil: false,
            globals: { $: true, require: true }
        }
        JSHINT(code, options)
        const errors = JSHINT.data().errors || []
        const diagnostics = []
        for (const err of errors) {
            if (!err || !err.reason) continue
            const lineObj = view.state.doc.line(Math.max(1, err.line))
            const from = lineObj.from + Math.max(0, (err.character || 1) - 1)
            const to = Math.min(from + 1, lineObj.to)
            diagnostics.push({
                from,
                to,
                message: err.reason,
                severity: err.code && err.code.startsWith('E') ? 'error' : 'warning'
            })
        }
        return diagnostics
    })

    export default {
        // eslint-disable-next-line vue/multi-word-component-names
        name: 'codeeditor',
        components: {
            Codemirror
        },
        emits: ['input', 'update:modelValue', 'onChangeCode'],
        props: {
            index: { type: Number, default: null },
            value: { type: String, default: '' },
            modelValue: { type: String, default: '' },
            configdata: { type: Object, default: () => ({}) },
            id: { type: String },
            opentype: { type: String },
            fathername: { type: String },
            propstocomponent: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                componentName: '',
                internalChange: false,
                editorView: null,
                ref: this.$root.componentRefs,
                codeMirrorStyle: { 'font-size': '18px' },
                fullscreen: false,
                // 初始值优先取 modelValue(v-model),其次 value(兼容 Vue 2 风格)
                editorValue: this.modelValue || this.value || '',
                selectedTheme: 'oneDark',
                selectedMode: 'html',
                themeConf: markRaw(new Compartment()),
                languageConf: markRaw(new Compartment()),
                fontsize: '18px',
                fontsizeList: ['12px', '13px', '14px', '15px', '16px', '18px', '20px', '22px', '24px', '26px', '28px', '30px', '32px', '34px', '36px', '38px'],
                tempdata: {},
                envCache: null,
                cmThemeOptions: [
                    { label: '深色 (oneDark)', value: 'oneDark' },
                    { label: '浅色', value: 'light' }
                ],
                cmEditorModeOptions: [
                    { label: 'JavaScript', value: 'javascript' },
                    { label: 'JSON', value: 'json' },
                    { label: 'SQL', value: 'sql' },
                    { label: 'CSS', value: 'css' },
                    { label: 'XML', value: 'xml' },
                    { label: 'HTML', value: 'html' },
                    { label: 'YAML', value: 'yaml' },
                    { label: 'Markdown', value: 'markdown' },
                    { label: 'Python', value: 'python' }
                ],
                modeExtensionsCache: markRaw({
                    javascript: null,
                    json: null,
                    sql: null,
                    css: null,
                    xml: null,
                    html: null,
                    yaml: null,
                    markdown: null,
                    python: null
                })
            }
        },
        computed: {
            // basicSetup 已由 vue-codemirror 默认集成,此处只追加 basicSetup 不包含的扩展
            extraExtensions () {
                return markRaw([
                    EditorView.lineWrapping,
                    lintGutter(),
                    jsLinter,
                    keymap.of([
                        // 注释切换 (basicSetup 不含)
                        { key: 'Mod-/', run: toggleComment },
                        // 行上下移动 (basicSetup 不含)
                        { key: 'Alt-ArrowUp', run: moveLineUp },
                        { key: 'Alt-ArrowDown', run: moveLineDown },
                        // 手动触发自动补全
                        { key: 'Ctrl-Enter', run: (view) => { startCompletion(view); return true } },
                        { key: 'Ctrl-Shift-c', run: (view) => { startCompletion(view); return true } },
                        // 格式化代码
                        {
                            key: 'Mod-Alt-l',
                            run: (view) => {
                                const beautified = jsBeautify(view.state.doc.toString())
                                view.dispatch({
                                    changes: { from: 0, to: view.state.doc.length, insert: beautified }
                                })
                                // dispatch 后 vue-codemirror 会自动 emit update:modelValue
                                // 此处只补发 onChangeCode 事件
                                this.$emit('onChangeCode', beautified)
                                if (this.configdata.dataChangeMethod) {
                                    this.commonsJs.funcEval1(this, { value: beautified }, this.configdata.dataChangeMethod)
                                }
                                return true
                            }
                        },
                        // 自定义保存
                        {
                            key: 'Mod-s',
                            run: () => {
                                if (this.configdata.ctrl_s) {
                                    this.commonsJs.funcEval1(this, {}, this.configdata.ctrl_s)
                                }
                                return true
                            }
                        }
                    ])
                ])
            },
            currentExtensions () {
                return [
                    ...this.extraExtensions,
                    this.languageConf.of(this.getModeExtension(this.selectedMode)),
                    this.themeConf.of(this.selectedTheme === 'oneDark' ? oneDark : [])
                ]
            },
            cmStyle () {
                const style = {
                    height: '100%',
                    fontSize: this.fontsize
                }
                if (this.configdata.height) {
                    style.height = this.configdata.height
                }
                return style
            },
            containerStyle () {
                const style = { height: '300px' }
                if (this.configdata.height) {
                    style.height = this.configdata.height
                }
                if (this.configdata.styleMethod) {
                    Object.assign(style, this.commonsJs.funcEval1(this, {}, this.configdata.styleMethod))
                }
                if (this.fullscreen) {
                    style.position = 'fixed'
                    style.top = '0'
                    style.left = '0'
                    style.width = '100vw'
                    style.height = '100vh'
                    style.zIndex = '9999'
                }
                return style
            }
        },
        watch: {
            // v-model 双向绑定: 编辑器内容变化时同步到父组件
            editorValue (n, o) {
                if (n === o || this.internalChange) return
                this.internalChange = true
                this.$emit('update:modelValue', n)
                this.$emit('input', n)
                if (this.configdata.dataChangeMethod) {
                    this.commonsJs.funcEval1(this, { value: n }, this.configdata.dataChangeMethod)
                }
                this.$nextTick(() => {
                    this.internalChange = false
                })
            },
            // 父组件通过 v-model 更新 modelValue 时同步到编辑器
            modelValue (n) {
                if (this.internalChange) return
                if (n !== this.editorValue) {
                    this.internalChange = true
                    this.editorValue = n
                    this.$nextTick(() => {
                        this.internalChange = false
                    })
                }
            },
            // 兼容 Vue 2 风格的 :value 绑定 (仅在 modelValue 为空时生效)
            value (n) {
                if (this.internalChange) return
                if (!this.modelValue && n !== this.editorValue) {
                    this.internalChange = true
                    this.editorValue = n
                    this.$nextTick(() => {
                        this.internalChange = false
                    })
                }
            },
            configdata: {
                handler (n) {
                    if (n.blm) {
                        this.componentName = this.configdata.blm + (this.index ? this.index : '')
                        this.$root.componentRefs[this.componentName] = this
                    }
                    if (n.initMethod) {
                        this.commonsJs.funcEval1(this, {}, n.initMethod)
                    }
                },
                immediate: true
            }
        },
        mounted () {
            document.addEventListener('keydown', this.handleKeydown)
            const str = localStorage.getItem('incoenv')
            this.envCache = !!(str && str.length > 0 && JSON.parse(str).env === 1)
        },
        beforeUnmount () {
            document.removeEventListener('keydown', this.handleKeydown)
        },
        methods: {
            computeEdit () {
                let returnValue = true;
                if (this.configdata.editable == '0') returnValue = false
                if (this.opentype == 'show') returnValue = false
                return returnValue
            },
            handleReady (payload) {
                this.editorView = payload.view
            },
            getModeExtension (mode) {
                if (!this.modeExtensionsCache[mode]) {
                    const modes = {
                        javascript: () => javascript(),
                        json: () => json(),
                        sql: () => sql(),
                        css: () => css(),
                        xml: () => xml(),
                        html: () => html(),
                        yaml: () => yaml(),
                        markdown: () => markdown(),
                        python: () => python()
                    }
                    this.modeExtensionsCache[mode] = modes[mode] ? markRaw(modes[mode]()) : markRaw(javascript())
                }
                return this.modeExtensionsCache[mode]
            },
            handleKeydown (e) {
                if (e.keyCode === 27 && this.fullscreen) {
                    this.handleFullscreen()
                }
            },
            computeItemStyle () {
                let newStyle = { ...this.codeMirrorStyle }
                if (this.configdata.height) newStyle.height = this.configdata.height
                if (this.configdata.styleMethod) {
                    const style1 = this.commonsJs.funcEval1(this, {}, this.configdata.styleMethod)
                    newStyle = { ...newStyle, ...style1 }
                }
                if (newStyle['font-size']) this.fontsize = newStyle['font-size']
                return newStyle
            },
            test () {
                console.log(this.configdata, 'configdata')
                console.log(this.editorValue, 'editorValue')
                console.log(this.editorView, 'editorView')
            },
            env () {
                return this.envCache || false
            },
            fontsizeChange (value) {
                this.fontsize = value
            },
            themeChange (value) {
                this.selectedTheme = value
                if (this.editorView) {
                    this.editorView.dispatch({
                        effects: this.themeConf.reconfigure(value === 'oneDark' ? oneDark : [])
                    })
                }
            },
            modeChange (value) {
                this.selectedMode = value
                if (this.editorView) {
                    this.editorView.dispatch({
                        effects: this.languageConf.reconfigure(this.getModeExtension(value))
                    })
                }
            },
            insertStr (str) {
                if (!this.editorView) {
                    console.warn('编辑器还未初始化')
                    return
                }
                const { from } = this.editorView.state.selection.main
                this.editorView.dispatch({
                    changes: { from, insert: str }
                })
            },
            handleFullscreen () {
                this.fullscreen = !this.fullscreen
            },
            checkCode () {
                const results = this.commonsJs.validateCode(this.editorValue)
                this.$Modal.confirm({
                    title: '代码检查',
                    width: '900px',
                    content: JSON.stringify(results, null, 2)
                })
            }
        }
    }
</script>
<style>
.tool-bar {
    margin: 0px 0px 10px;
}

.CodeMirror {
    height: 100% !important;
}

/* CodeMirror 6 样式 */
.cm-editor {
    height: 100% !important;
    outline: none !important;
}

.cm-scroller {
    overflow: auto !important;
}

.cm-content {
    min-height: 100% !important;
}

.code-editor-container {
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
}

/* 修复行号重复显示问题 */
.cm-gutters {
    display: flex !important;
}

.cm-gutter {
    flex-shrink: 0;
}

.cm-gutter.cm-lineNumbers {
    min-width: 40px;
    text-align: right;
}

.cm-gutter.cm-foldGutter {
    width: 14px;
}
</style>
