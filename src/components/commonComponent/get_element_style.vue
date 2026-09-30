<template>
    <div>
        <!-- 悬浮按钮 -->
        <div v-if="!showPanel" ref="floatBtn" class="float-button" :style="btnPosition" @mousedown="startDrag"
            @click="openPanel">
            🎨 样式提取器
        </div>

        <!-- 主面板 -->
        <div v-if="showPanel" class="main-panel">
            <div class="panel-header">
                <h3>🎨 元素样式提取工具</h3>
                <button @click="closePanel" class="close-btn">×</button>
            </div>

            <div class="panel-body">
                <!-- 输入区域 -->
                <div class="input-section">
                    <label>请输入元素ID:</label>
                    <div class="input-group">
                        <input v-model="elementId" placeholder="如: jgjenum" @keyup.enter="extractStyles"
                            class="id-input"/>
                        <button @click="extractStyles" :disabled="!elementId" class="extract-btn">
                            🎯 提取样式
                        </button>
                        <!-- <button @click="testElement" class="test-btn">
                            🧪 测试元素
                        </button>
                        <button @click="debugHtmlParsing" class="debug-btn">
                            🐛 调试分析
                        </button>
                        <button @click="captureDevToolsStyles" class="devtools-btn">
                            🎯 捕获调试样式
                        </button>
                        <button v-if="showCaptureButton" @click="immediateCapture" class="capture-btn">
                            📸 立即捕获
                        </button> -->
                    </div>
                </div>

                <!-- 样式结果显示 -->
                <div v-if="extractedStyles.length > 0" class="styles-section">
                    <h4>🎯 提取到的样式 ({{ extractedStyles.length }}个)</h4>
                    <div class="styles-container">
                        <div class="styles-summary">
                            来源统计:
                            <span v-for="(count, source) in styleSources" :key="source" class="source-tag">
                                {{ source }}: {{ count }}个
                            </span>
                        </div>
                        <div class="styles-list">
                            <div v-for="(style, index) in extractedStyles" :key="index" class="style-item">
                                <span class="property">{{ style.property }}</span>
                                <span class="value">{{ style.value }}</span>
                                <span class="source">{{ style.source }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="actions">
                        <button @click="copyAllStyles" class="copy-btn">📋 复制所有样式</button>
                        <button @click="exportStyles" class="export-btn">💾 导出JSON</button>
                    </div>
                </div>

                <!-- 诊断信息 -->
                <div v-if="diagnosticInfo" class="diagnostic-section">
                    <h4>🔍 诊断信息</h4>
                    <pre class="diagnostic-content">{{ diagnosticInfo }}</pre>
                </div>

                <!-- 错误信息 -->
                <div v-else-if="errorMessage" class="error-section">
                    <div class="error-content">
                        <p>❌ {{ errorMessage }}</p>
                    </div>
                </div>

                <!-- 空状态 -->
                <div v-else class="empty-section">
                    <p>请输入元素ID开始提取样式</p>
                    <p class="hint">支持提取HTML内联样式、CSS类样式和计算样式</p>
                </div>
            </div>
        </div>

        <!-- 遮罩层 -->
        <div v-if="showPanel" class="overlay" @click="closePanel"></div>
    </div>
</template>

<script>
    export default {
        name: 'StyleExtractor',
        data () {
            return {
                showPanel: false,
                isDragging: false,
                dragOffset: { x: 0, y: 0 },
                btnPosition: { left: '20px', top: '20px' },
                elementId: '',
                extractedStyles: [],
                styleSources: {},
                diagnosticInfo: '',
                errorMessage: '',
                showCaptureButton: false
            }
        },

        mounted () {
            this.initButtonPosition();
            this.setupEventListeners();
        },

        beforeDestroy () {
            this.removeEventListeners();
        },

        methods: {
            // 初始化按钮位置
            initButtonPosition () {
                const savedPos = localStorage.getItem('styleExtractorPos');
                if (savedPos) {
                    this.btnPosition = JSON.parse(savedPos);
                }
            },

            // 设置事件监听
            setupEventListeners () {
                document.addEventListener('mousemove', this.handleDrag);
                document.addEventListener('mouseup', this.stopDrag);
            },

            // 移除事件监听
            removeEventListeners () {
                document.removeEventListener('mousemove', this.handleDrag);
                document.removeEventListener('mouseup', this.stopDrag);
            },

            // 开始拖拽
            startDrag (event) {
                this.isDragging = true;
                const btn = this.$refs.floatBtn;
                const rect = btn.getBoundingClientRect();

                this.dragOffset = {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top
                };
                event.preventDefault();
            },

            // 处理拖拽
            handleDrag (event) {
                if (!this.isDragging) return;

                const newX = event.clientX - this.dragOffset.x;
                const newY = event.clientY - this.dragOffset.y;

                this.btnPosition = {
                    left: Math.max(0, Math.min(newX, window.innerWidth - 80)) + 'px',
                    top: Math.max(0, Math.min(newY, window.innerHeight - 40)) + 'px'
                };
            },

            // 停止拖拽
            stopDrag () {
                if (this.isDragging) {
                    this.isDragging = false;
                    localStorage.setItem('styleExtractorPos', JSON.stringify(this.btnPosition));
                }
            },

            // 打开面板
            openPanel () {
                this.showPanel = true;
                this.resetState();
            },

            // 关闭面板
            closePanel () {
                this.showPanel = false;
                this.resetState();
            },

            // 重置状态
            resetState () {
                this.elementId = '';
                this.extractedStyles = [];
                this.styleSources = {};
                this.diagnosticInfo = '';
                this.errorMessage = '';
            },

            // 修复的HTML内联样式提取方法（处理多行和格式化的情况）
            extractHtmlInlineStyles (element) {
                const styles = [];
                const outerHTML = element.outerHTML;

                console.log('🔍 分析HTML源码:', outerHTML.substring(0, 500));

                // 更强大的正则表达式，处理各种格式
                // 匹配 style="任意内容"，包括换行和空格
                const styleRegex = /style\s*=\s*["']([\s\S]*?)["']/i;
                const match = outerHTML.match(styleRegex);

                if (match && match[1]) {
                    console.log('🎯 找到HTML内联样式块:', match[1]);
                    const cssText = match[1];

                    // 处理可能存在的换行和多余空格
                    const normalizedCss = cssText
                        .replace(/\s+/g, ' ') // 将所有空白字符标准化为单个空格
                        .replace(/^\s+|\s+$/g, '') // 去除首尾空格
                        .trim();

                    console.log('标准化后的CSS:', normalizedCss);

                    // 分割样式声明
                    const declarations = normalizedCss
                        .split(';')
                        .map(d => d.trim())
                        .filter(d => d.length > 0);

                    console.log('分割后的声明:', declarations);

                    declarations.forEach(decl => {
                        // 更灵活的分割方式
                        const colonIndex = decl.indexOf(':');
                        if (colonIndex > 0) {
                            const prop = decl.substring(0, colonIndex).trim();
                            const val = decl.substring(colonIndex + 1).trim();

                            if (prop && val) {
                                styles.push({
                                    property: prop,
                                    value: val,
                                    source: 'html-inline'
                                });
                                console.log('  ✅ 提取到样式:', prop, '=', val);
                            }
                        }
                    });
                } else {
                    console.log('❌ 未在HTML中找到style属性');
                    // 额外检查：直接查看element.style
                    console.log('element.style.length:', element.style.length);
                    for (let i = 0; i < element.style.length; i++) {
                        const prop = element.style[i];
                        const val = element.style.getPropertyValue(prop);
                        console.log('  element.style[', i, ']:', prop, '=', val);
                    }
                }

                return styles;
            },

            // 增强的测试方法
            testElement () {
                if (!this.elementId) {
                    this.errorMessage = '请输入元素ID';
                    return;
                }

                // 显示原始HTML信息
                const fullHtml = document.documentElement.innerHTML;
                const elementPattern = new RegExp(`<[^>]*id\\s*=\\s*["']${this.elementId}["'][\\s\\S]*?>`, 'i');
                const elementMatch = fullHtml.match(elementPattern);

                let elementHtml = '未找到元素';
                if (elementMatch) {
                    elementHtml = elementMatch[0];
                }

                this.diagnosticInfo = `
🔍 原始HTML分析:

🎯 查找元素ID: ${this.elementId}

📄 匹配的HTML片段:
${elementHtml}

📝 技术说明:
- DOM API可能无法正确反映服务端渲染的样式
- 需要直接解析HTML源码来获取真实样式
- 这种情况常见于SPA应用和服务端渲染
            `;
            },
            // 专门的调试方法 - 逐字符分析HTML
            debugHtmlParsing () {
                if (!this.elementId) {
                    this.errorMessage = '请输入元素ID';
                    return;
                }

                const element = this.findElement(this.elementId);
                if (!element) {
                    this.errorMessage = `未找到ID为 "${this.elementId}" 的元素`;
                    return;
                }

                const outerHTML = element.outerHTML;
                let debugInfo = '🔍 HTML逐字符分析:\n\n';
                debugInfo += '完整outerHTML:\n' + outerHTML + '\n\n';

                // 查找style属性的位置
                const styleStart = outerHTML.indexOf('style=');
                if (styleStart === -1) {
                    debugInfo += '❌ 未找到style=字符串\n';
                } else {
                    debugInfo += '✅ 找到style=位置: ' + styleStart + '\n';

                    // 查找引号
                    const quotePos1 = outerHTML.indexOf('"', styleStart + 6);
                    const quotePos2 = outerHTML.indexOf("'", styleStart + 6);

                    let quotePos = -1;
                    let quoteChar = '';

                    if (quotePos1 !== -1 && (quotePos2 === -1 || quotePos1 < quotePos2)) {
                        quotePos = quotePos1;
                        quoteChar = '"';
                    } else if (quotePos2 !== -1) {
                        quotePos = quotePos2;
                        quoteChar = "'";
                    }

                    if (quotePos !== -1) {
                        debugInfo += '✅ 找到开始引号: ' + quoteChar + ' 位置: ' + quotePos + '\n';

                        // 查找结束引号
                        const endQuotePos = outerHTML.indexOf(quoteChar, quotePos + 1);
                        if (endQuotePos !== -1) {
                            debugInfo += '✅ 找到结束引号位置: ' + endQuotePos + '\n';

                            const styleContent = outerHTML.substring(quotePos + 1, endQuotePos);
                            debugInfo += '🎯 提取的样式内容:\n' + styleContent + '\n\n';

                            // 尝试解析
                            const normalized = styleContent
                                .replace(/\s+/g, ' ')
                                .replace(/^\s+|\s+$/g, '')
                                .trim();

                            debugInfo += '🔄 标准化后的内容:\n' + normalized + '\n\n';

                            const declarations = normalized.split(';').filter(d => d.trim());
                            debugInfo += '📊 分解为 ' + declarations.length + ' 个声明:\n';
                            declarations.forEach((decl, index) => {
                                debugInfo += '  ' + (index + 1) + '. ' + decl.trim() + '\n';
                            });
                        } else {
                            debugInfo += '❌ 未找到结束引号\n';
                        }
                    } else {
                        debugInfo += '❌ 未找到引号\n';
                    }
                }

                // 直接检查element.style
                debugInfo += '\n🔧 element.style直接检查:\n';
                debugInfo += 'length: ' + element.style.length + '\n';
                for (let i = 0; i < element.style.length; i++) {
                    const prop = element.style[i];
                    const val = element.style.getPropertyValue(prop);
                    debugInfo += '  ' + prop + ': ' + val + '\n';
                }

                // 检查cssText
                debugInfo += '\n📝 element.style.cssText:\n';
                debugInfo += element.style.cssText || '空';

                this.diagnosticInfo = debugInfo;
            },
            // 查找元素
            findElement (id) {
                return document.getElementById(id) ||
                    document.querySelector(`#${id}`) ||
                    document.querySelector(`#${CSS.escape(id)}`);
            },

            // 核心样式提取方法

            // 最终解决方案：直接解析HTML属性
            extractStyles () {
                this.extractedStyles = [];
                if (!this.elementId) {
                    this.errorMessage = '请输入元素ID';
                    return;
                }

                try {
                    this.errorMessage = '';
                    console.log('🔍 开始最终样式提取 for ID:', this.elementId);

                    // 不使用DOM API，而是直接获取原始HTML
                    const rawHtmlStyles = this.extractRawHtmlStyles(this.elementId);

                    if (rawHtmlStyles.length > 0) {
                        this.extractedStyles = rawHtmlStyles;
                        this.styleSources = { 'html-attribute': rawHtmlStyles.length };

                        this.diagnosticInfo = `
✅ 成功提取HTML中的样式属性！

提取到的样式:
${rawHtmlStyles.map(s => `${s.property}: ${s.value}`).join('\n')}

📝 技术说明：
- 这些样式来自HTML的style属性
- 虽然DOM API检测不到，但样式确实存在
- 可能是服务端渲染或框架处理的结果
                    `;
                    } else {
                        this.diagnosticInfo = '❌ 未在HTML中找到style属性';
                    }
                } catch (error) {
                    console.error('提取失败:', error);
                    this.errorMessage = `提取失败: ${error.message}`;
                }
            },

            // 直接从HTML源码提取样式（绕过DOM API）
            extractRawHtmlStyles (elementId) {
                const styles = [];

                console.log('🔍 直接HTML解析 for ID:', elementId);

                // 方法1: 尝试从innerHTML中查找
                try {
                    // 获取整个文档的HTML
                    const fullHtml = document.documentElement.innerHTML;

                    // 构造更精确的搜索模式
                    const patterns = [
                        // 标准模式
                        new RegExp(`<[^>]*id\\s*=\\s*["']${elementId}["'][^>]*style\\s*=\\s*["']([^"']*)["'][^>]*>`, 'i'),
                        // 单引号模式
                        new RegExp(`<[^>]*id\\s*=\\s*['"]${elementId}['"][^>]*style\\s*=\\s*['"]([^'"]*)['"][^>]*>`, 'i'),
                        // 多行模式
                        new RegExp(`<[^>]*id\\s*=\\s*["']${elementId}["'][\\s\\S]*?style\\s*=\\s*["']([\\s\\S]*?)["'][\\s\\S]*?>`, 'i')
                    ];

                    let matchedStyle = null;

                    for (const pattern of patterns) {
                        const match = fullHtml.match(pattern);
                        if (match && match[1]) {
                            matchedStyle = match[1];
                            console.log('🎯 找到匹配的style内容:', matchedStyle);
                            break;
                        }
                    }

                    if (matchedStyle) {
                        // 解析CSS声明
                        const normalizedCss = matchedStyle
                            .replace(/\s+/g, ' ')
                            .replace(/^\s+|\s+$/g, '')
                            .trim();

                        const declarations = normalizedCss.split(';').filter(d => d.trim());

                        declarations.forEach(decl => {
                            const colonIndex = decl.indexOf(':');
                            if (colonIndex > 0) {
                                const prop = decl.substring(0, colonIndex).trim();
                                const val = decl.substring(colonIndex + 1).trim();

                                if (prop && val) {
                                    styles.push({
                                        property: prop,
                                        value: val,
                                        source: 'html-raw'
                                    });
                                    console.log('  ✅ 提取样式:', prop, '=', val);
                                }
                            }
                        });
                    }
                } catch (e) {
                    console.log('HTML解析方法1失败:', e.message);
                }

                // 方法2: 如果方法1失败，尝试更简单的方式
                if (styles.length === 0) {
                    try {
                        const element = document.getElementById(elementId);
                        if (element) {
                            // 直接检查outerHTML中的style属性
                            const outerHtml = element.outerHTML;
                            const styleMatch = outerHtml.match(/style\s*=\s*["']([^"']*)["']/i);

                            if (styleMatch && styleMatch[1]) {
                                const cssText = styleMatch[1];
                                const declarations = cssText.split(';').filter(d => d.trim());

                                declarations.forEach(decl => {
                                    const parts = decl.split(':').map(s => s.trim());
                                    if (parts.length === 2) {
                                        const [prop, val] = parts;
                                        if (prop && val) {
                                            styles.push({
                                                property: prop,
                                                value: val,
                                                source: 'html-outer'
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    } catch (e) {
                        console.log('HTML解析方法2失败:', e.message);
                    }
                }

                return styles;
            },

            // 检测所有样式来源
            detectAllStyleSources (element) {
                const styles = [];

                console.log('=== 开始全面样式检测 ===');

                // 1. 检查计算样式（最重要）
                console.log('--- 检查计算样式 ---');
                const computed = window.getComputedStyle(element);

                // 获取所有非默认的计算样式
                for (let i = 0; i < computed.length; i++) {
                    const property = computed[i];
                    const value = computed.getPropertyValue(property);

                    // 过滤掉明显的默认值
                    if (value &&
                        !this.isDefaultValue(property, value) &&
                        value !== 'initial' &&
                        value !== 'inherit' &&
                        value !== 'unset') {
                        styles.push({
                            property,
                            value,
                            source: 'computed-all'
                        });
                        console.log('  ✓ 计算样式:', property, '=', value);
                    }
                }

                // 2. 检查是否有通过JavaScript设置的样式
                console.log('--- 检查JavaScript样式 ---');
                if (element.style.length > 0) {
                    for (let i = 0; i < element.style.length; i++) {
                        const property = element.style[i];
                        const value = element.style.getPropertyValue(property);
                        if (value && value !== '') {
                            styles.push({
                                property,
                                value,
                                source: 'javascript'
                            });
                            console.log('  ✓ JS样式:', property, '=', value);
                        }
                    }
                }

                // 3. 检查CSS类和ID选择器
                console.log('--- 检查CSS规则匹配 ---');
                const cssStyles = this.findMatchingCssRules(element);
                styles.push(...cssStyles);

                // 4. 检查框架特定样式
                console.log('--- 检查框架样式 ---');
                const frameworkStyles = this.detectFrameworkStyles(element);
                styles.push(...frameworkStyles);

                console.log('=== 检测完成 ===');
                return styles;
            },

            // 查找匹配的CSS规则
            findMatchingCssRules (element) {
                const styles = [];
                const selectorsToCheck = [];

                // 收集可能的选择器
                if (element.id) {
                    selectorsToCheck.push(`#${element.id}`);
                }

                if (element.className) {
                    const classes = element.className.split(/\s+/).filter(c => c);
                    classes.forEach(cls => {
                        selectorsToCheck.push(`.${cls}`);
                    });
                }

                selectorsToCheck.push(element.tagName.toLowerCase());

                console.log('检查选择器:', selectorsToCheck);

                // 遍历所有样式表
                for (let i = 0; i < document.styleSheets.length; i++) {
                    try {
                        const sheet = document.styleSheets[i];
                        const rules = sheet.cssRules || sheet.rules;

                        if (!rules) continue;

                        for (let j = 0; j < rules.length; j++) {
                            const rule = rules[j];
                            if (rule.type !== CSSRule.STYLE_RULE) continue;

                            const selector = rule.selectorText;
                            const style = rule.style;

                            // 检查选择器是否匹配
                            if (this.doesSelectorActuallyMatch(element, selector)) {
                                console.log('匹配的CSS规则:', selector);

                                for (let k = 0; k < style.length; k++) {
                                    const property = style[k];
                                    const value = style.getPropertyValue(property);

                                    if (value && value !== 'initial' && value !== 'inherit') {
                                        styles.push({
                                            property,
                                            value,
                                            source: `css-rule: ${selector}`,
                                            selector
                                        });
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        // 跳过跨域样式表
                        console.log('跳过样式表', i, ':', e.message);
                    }
                }

                return styles;
            },

            // 更准确的选择器匹配
            doesSelectorActuallyMatch (element, selector) {
                try {
                    // 直接使用matches方法（最准确）
                    return element.matches(selector);
                } catch (e) {
                    // 如果matches失败，使用简化匹配
                    if (selector.startsWith('#') && element.id) {
                        return selector === `#${element.id}`;
                    }

                    if (selector.startsWith('.') && element.className) {
                        const classes = element.className.split(/\s+/);
                        return classes.some(cls => selector === `.${cls}`);
                    }

                    if (selector.toLowerCase() === element.tagName.toLowerCase()) {
                        return true;
                    }

                    return false;
                }
            },

            // 检测框架样式
            detectFrameworkStyles (element) {
                const styles = [];

                // 检查Vue相关的属性
                const vueAttrs = Array.from(element.attributes).filter(attr =>
                    attr.name.startsWith('data-v-') ||
                    attr.name.startsWith(':') ||
                    attr.name.startsWith('@') ||
                    attr.name.startsWith('v-')
                );

                if (vueAttrs.length > 0) {
                    styles.push({
                        property: 'framework-info',
                        value: `Vue绑定属性: ${vueAttrs.map(a => a.name).join(', ')}`,
                        source: 'vue-framework'
                    });
                }

                // 检查是否有内联样式绑定
                const hasVBindStyle = Array.from(element.attributes).some(attr =>
                    attr.name === ':style' || attr.name === 'v-bind:style' || attr.name === 'bind:style'
                );

                if (hasVBindStyle) {
                    styles.push({
                        property: 'vue-binding',
                        value: '检测到Vue style绑定',
                        source: 'vue-binding'
                    });
                }

                return styles;
            },

            // 判断是否为默认值
            isDefaultValue (property, value) {
                const defaults = {
                    color: ['rgb(0, 0, 0)', 'black'],
                    'font-size': ['16px', 'medium'],
                    'font-weight': ['400', 'normal'],
                    'background-color': ['rgba(0, 0, 0, 0)', 'transparent'],
                    margin: ['0px'],
                    padding: ['0px']
                };

                return defaults[property] && defaults[property].includes(value);
            },

            // 分类和显示样式
            categorizeAndDisplayStyles (allStyles) {
                // 按来源分类
                const categorized = {};
                allStyles.forEach(style => {
                    const source = style.source.split(':')[0];
                    if (!categorized[source]) {
                        categorized[source] = [];
                    }
                    categorized[source].push(style);
                });

                // 设置显示数据
                this.extractedStyles = allStyles.filter(style =>
                    style.source !== 'vue-framework' && style.source !== 'vue-binding'
                );

                this.styleSources = {};
                Object.keys(categorized).forEach(source => {
                    this.styleSources[source] = categorized[source].length;
                });
            },

            // 生成综合报告
            generateComprehensiveReport (element, allStyles) {
                const report = {
                    elementInfo: {
                        tagName: element.tagName,
                        id: element.id,
                        className: element.className,
                        hasInlineStyle: element.style.length > 0
                    },
                    styleAnalysis: {
                        totalStyles: allStyles.length,
                        bySource: this.styleSources
                    },
                    importantFindings: []
                };

                // 添加重要发现
                const vueBindings = allStyles.filter(s => s.source.includes('vue'));
                if (vueBindings.length > 0) {
                    report.importantFindings.push('检测到Vue框架样式绑定');
                }

                const cssRules = allStyles.filter(s => s.source.startsWith('css-rule'));
                if (cssRules.length > 0) {
                    report.importantFindings.push(`匹配到${cssRules.length}个CSS规则`);
                }

                if (element.style.length === 0) {
                    report.importantFindings.push('⚠️ 元素没有内联style属性');
                }

                this.diagnosticInfo = '📊 综合样式分析报告\n' +
                    '='.repeat(40) + '\n' +
                    JSON.stringify(report, null, 2);
            },
            // 提取CSS类样式
            extractCssClassStyles (element) {
                const styles = [];
                const classes = element.className ? element.className.split(/\s+/).filter(c => c) : [];

                if (classes.length === 0) {
                    console.log('元素没有CSS类');
                    return styles;
                }

                console.log('元素CSS类:', classes);

                // 遍历所有样式表
                for (let i = 0; i < document.styleSheets.length; i++) {
                    try {
                        const sheet = document.styleSheets[i];
                        const rules = sheet.cssRules || sheet.rules;

                        if (!rules) continue;

                        for (let j = 0; j < rules.length; j++) {
                            const rule = rules[j];
                            if (rule.type !== CSSRule.STYLE_RULE) continue;

                            // 检查选择器是否匹配
                            if (this.doesSelectorMatch(element, rule.selectorText, classes)) {
                                console.log('匹配的CSS规则:', rule.selectorText);

                                const style = rule.style;
                                for (let k = 0; k < style.length; k++) {
                                    const property = style[k];
                                    const value = style.getPropertyValue(property);

                                    if (value && value !== 'initial' && value !== 'inherit') {
                                        styles.push({
                                            property,
                                            value,
                                            source: `css-class: ${rule.selectorText}`
                                        });
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        // 跳过跨域样式表
                        continue;
                    }
                }

                return styles;
            },

            // 提取关键计算样式
            extractKeyComputedStyles (element) {
                const styles = [];
                const computed = window.getComputedStyle(element);

                // 定义关键样式属性
                const keyProperties = [
                    'color', 'font-size', 'font-weight', 'background-color',
                    'width', 'height', 'margin', 'padding', 'border'
                ];

                keyProperties.forEach(prop => {
                    const value = computed.getPropertyValue(prop);
                    // 过滤掉默认值
                    if (value &&
                        value !== 'rgb(0, 0, 0)' &&
                        value !== 'normal' &&
                        value !== '0px' &&
                        value !== 'auto' &&
                        value !== 'none' &&
                        !value.startsWith('rgba(0, 0, 0, 0)')) {
                        styles.push({
                            property: prop,
                            value,
                            source: 'computed'
                        });
                    }
                });

                return styles;
            },

            // 处理提取的样式（去重和统计）
            processExtractedStyles (allStyles) {
                const uniqueStyles = new Map();
                const sources = {};

                // 按优先级处理：HTML内联 > CSS类 > 计算样式
                allStyles.forEach(style => {
                    const sourceType = style.source.split(':')[0];
                    sources[sourceType] = (sources[sourceType] || 0) + 1;

                    // HTML内联样式优先级最高
                    if (style.source === 'html-inline') {
                        uniqueStyles.set(style.property, style);
                    }
                    // CSS类样式次之
                    else if (style.source.startsWith('css-class') && !uniqueStyles.has(style.property)) {
                        uniqueStyles.set(style.property, style);
                    }
                    // 计算样式最低优先级
                    else if (!uniqueStyles.has(style.property)) {
                        uniqueStyles.set(style.property, style);
                    }
                });

                this.extractedStyles = Array.from(uniqueStyles.values());
                this.styleSources = sources;
            },

            // 生成诊断信息
            generateDiagnosticInfo (element, htmlStyles, cssClassStyles, computedStyles) {
                const info = {
                    element: {
                        tagName: element.tagName,
                        id: element.id,
                        className: element.className
                    },
                    extractionResults: {
                        HTML内联样式: htmlStyles.length,
                        CSS类样式: cssClassStyles.length,
                        计算样式: computedStyles.length,
                        总计: this.extractedStyles.length
                    },
                    htmlStyleContent: htmlStyles.length > 0
                        ? htmlStyles.map(s => `${s.property}: ${s.value}`).join('; ')
                        : '无'
                };

                this.diagnosticInfo = '📊 样式提取诊断\n' + '='.repeat(30) + '\n' +
                    JSON.stringify(info, null, 2);
            },

            // 选择器匹配检查
            doesSelectorMatch (element, selector, elementClasses) {
                try {
                    // ID选择器
                    if (selector.startsWith('#') && element.id) {
                        return selector === '#' + element.id;
                    }

                    // 类选择器
                    if (selector.startsWith('.') && elementClasses) {
                        const selectorClass = selector.substring(1);
                        return elementClasses.includes(selectorClass);
                    }

                    // 标签选择器
                    if (selector.toLowerCase() === element.tagName.toLowerCase()) {
                        return true;
                    }

                    // 使用matches方法（最准确）
                    return element.matches(selector);
                } catch (e) {
                    return false;
                }
            },

            // 复制所有样式
            copyAllStyles () {
                const stylesText = this.extractedStyles
                    .map(style => `${style.property}: ${style.value};`)
                    .join('\n');

                if (stylesText) {
                    navigator.clipboard.writeText(stylesText)
                        .then(() => {
                            this.$message && this.$message.success('样式已复制到剪贴板');
                        })
                        .catch(() => {
                            this.$message && this.$message.error('复制失败');
                        });
                }
            },
            // 专门捕获调试面板临时样式的功能
            captureDevToolsStyles () {
                if (!this.elementId) {
                    this.errorMessage = '请输入元素ID';
                    return;
                }

                const element = this.findElement(this.elementId);
                if (!element) {
                    this.errorMessage = `未找到ID为 "${this.elementId}" 的元素`;
                    return;
                }

                // 这个方法需要用户配合操作
                this.diagnosticInfo = `
🔍 调试面板样式捕获指南

请按以下步骤操作：

1. 在浏览器调试面板中选中该元素
2. 在Elements面板的Styles区域添加样式
3. 确保样式真正应用（元素外观发生变化）
4. 点击下方的"立即捕获"按钮

⚠️ 重要说明：
- 调试面板的临时样式不会自动保存到element.style
- 需要通过特定方法才能捕获到
            `;

                // 显示捕获按钮
                this.showCaptureButton = true;
            },

            // 立即捕获当前应用的样式
            immediateCapture () {
                const element = this.findElement(this.elementId);
                if (!element) return;

                try {
                    // 方法1: 强制刷新计算样式
                    const computed = window.getComputedStyle(element);

                    // 方法2: 检查是否有临时的内联样式
                    const tempStyles = this.checkTemporaryStyles(element);

                    // 方法3: 捕获当前可见的样式变化
                    const visibleChanges = this.captureVisibleStyleChanges(element);

                    // 合并所有捕获到的样式
                    const allCaptured = [...tempStyles, ...visibleChanges];

                    if (allCaptured.length > 0) {
                        this.extractedStyles = allCaptured;
                        this.styleSources = { 'devtools-captured': allCaptured.length };

                        this.diagnosticInfo = `
✅ 成功捕获到调试面板样式！

捕获到的样式:
${allCaptured.map(s => `${s.property}: ${s.value}`).join('\n')}

注意：这些样式是临时的，刷新页面后会丢失。
                    `;
                    } else {
                        this.diagnosticInfo = '❌ 未捕获到任何临时样式\n请确保在调试面板中已经添加并应用了样式';
                    }
                } catch (error) {
                    this.errorMessage = `捕获失败: ${error.message}`;
                }
            },

            // 检查临时样式
            checkTemporaryStyles (element) {
                const styles = [];

                // 检查一些常见的临时样式属性
                const tempProps = ['color', 'font-size', 'font-weight', 'background-color'];

                tempProps.forEach(prop => {
                    // 直接访问样式属性
                    const directValue = element.style[prop];
                    if (directValue) {
                        styles.push({
                            property: prop,
                            value: directValue,
                            source: 'temporary-direct'
                        });
                    }

                    // 通过getPropertyValue检查
                    const computedValue = window.getComputedStyle(element).getPropertyValue(prop);
                    if (computedValue && computedValue !== 'rgb(0, 0, 0)' && computedValue !== 'normal') {
                        // 检查是否与默认值不同
                        if (this.isDifferentFromDefault(prop, computedValue)) {
                            styles.push({
                                property: prop,
                                value: computedValue,
                                source: 'temporary-computed'
                            });
                        }
                    }
                });

                return styles;
            },

            // 捕获可见的样式变化
            captureVisibleStyleChanges (element) {
                const styles = [];

                // 获取"之前"的样式快照
                const beforeStyles = {
                    color: window.getComputedStyle(element).color,
                    fontSize: window.getComputedStyle(element).fontSize,
                    fontWeight: window.getComputedStyle(element).fontWeight
                };

                // 等待一小段时间让用户应用样式
                setTimeout(() => {
                    const afterStyles = {
                        color: window.getComputedStyle(element).color,
                        fontSize: window.getComputedStyle(element).fontSize,
                        fontWeight: window.getComputedStyle(element).fontWeight
                    };

                    // 比较前后差异
                    Object.keys(beforeStyles).forEach(key => {
                        if (beforeStyles[key] !== afterStyles[key]) {
                            const propName = key === 'fontSize'
                                ? 'font-size'
                                : key === 'fontWeight' ? 'font-weight' : 'color';
                            styles.push({
                                property: propName,
                                value: afterStyles[key],
                                source: 'observed-change'
                            });
                        }
                    });
                }, 100);

                return styles;
            },

            // 判断是否与默认值不同
            isDifferentFromDefault (prop, value) {
                const defaults = {
                    color: 'rgb(0, 0, 0)',
                    'font-size': '16px',
                    'font-weight': '400'
                };

                return value !== defaults[prop];
            },
            // 导出样式为JSON
            exportStyles () {
                const exportData = {
                    elementId: this.elementId,
                    extractedAt: new Date().toISOString(),
                    styleCount: this.extractedStyles.length,
                    sources: this.styleSources,
                    styles: this.extractedStyles
                };
                this.$emit('export-styles', exportData);
            // const jsonStr = JSON.stringify(exportData, null, 2);
            // const blob = new Blob([jsonStr], { type: 'application/json' });
            // const url = URL.createObjectURL(blob);
            // const a = document.createElement('a');
            // a.href = url;
            // a.download = `styles-${this.elementId}-${Date.now()}.json`;
            // document.body.appendChild(a);
            // a.click();
            // document.body.removeChild(a);
            // URL.revokeObjectURL(url);

            // this.$message && this.$message.success('样式JSON已导出');
            }
        }
    }
</script>

<style scoped>
/* 悬浮按钮 */
.float-button {
    position: fixed;
    z-index: 9999;
    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
    color: white;
    padding: 12px 20px;
    border-radius: 30px;
    cursor: pointer;
    user-select: none;
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
    font-weight: 600;
    font-size: 14px;
    transition: all 0.3s ease;
}

.float-button:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
}

/* 主面板 */
.main-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 650px;
    background: white;
    border-radius: 15px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    overflow-y: auto;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
    color: white;
}

.panel-header h3 {
    margin: 0;
    font-size: 18px;
}

.close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.panel-body {
    padding: 25px;
}

/* 输入区域 */
.input-section {
    margin-bottom: 25px;
}

.input-section label {
    display: block;
    margin-bottom: 10px;
    font-weight: 600;
    color: #333;
}

.input-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.id-input {
    flex: 1;
    min-width: 150px;
    padding: 12px 15px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.3s;
}

.id-input:focus {
    outline: none;
    border-color: #ff6b6b;
    box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}

.extract-btn,
.test-btn {
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;
}

.extract-btn {
    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
    color: white;
}

.test-btn {
    background: #4ecdc4;
    color: white;
}

.extract-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(255, 107, 107, 0.4);
}

.test-btn:hover {
    background: #44b9b1;
    transform: translateY(-2px);
}

.extract-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

/* 样式结果显示 */
.styles-section {
    margin-bottom: 25px;
}

.styles-section h4 {
    color: #333;
    margin-bottom: 15px;
    font-size: 16px;
}

.styles-container {
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
}

.styles-summary {
    background: #f8f9fa;
    padding: 12px 15px;
    border-bottom: 1px solid #ddd;
    font-size: 14px;
}

.source-tag {
    background: #e0e7ff;
    color: #667eea;
    padding: 2px 8px;
    border-radius: 12px;
    margin: 0 5px;
    font-size: 12px;
}

.styles-list {
    max-height: 300px;
    overflow-y: auto;
    background: #f9f9f9;
}

.style-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 15px;
    border-bottom: 1px solid #eee;
    font-family: 'Courier New', monospace;
    font-size: 14px;
}

.style-item:last-child {
    border-bottom: none;
}

.style-item:nth-child(even) {
    background: #f0f0f0;
}

.property {
    font-weight: 600;
    color: #555;
    flex: 1;
}

.value {
    color: #333;
    background: white;
    padding: 2px 8px;
    border-radius: 4px;
    flex: 2;
    text-align: right;
    word-break: break-all;
}

.source {
    color: #ff6b6b;
    font-size: 12px;
    background: #ffebee;
    padding: 2px 6px;
    border-radius: 3px;
    margin-left: 8px;
    flex-shrink: 0;
}

.actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 15px;
}

.copy-btn,
.export-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
}

.copy-btn {
    background: #4ecdc4;
    color: white;
}

.export-btn {
    background: #45b7d1;
    color: white;
}

.copy-btn:hover,
.export-btn:hover {
    transform: translateY(-2px);
}

.copy-btn:hover {
    background: #44b9b1;
}

.export-btn:hover {
    background: #3ca8c1;
}

/* 诊断和错误区域 */
.diagnostic-section,
.error-section,
.empty-section {
    margin-top: 25px;
}

.diagnostic-section h4 {
    color: #333;
    margin-bottom: 15px;
    font-size: 16px;
}

.diagnostic-content {
    background: #2d3748;
    color: #e2e8f0;
    padding: 15px;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    margin: 0;
    overflow-x: auto;
    overflow-y:auto;
    max-height:200px;
    white-space: pre-wrap;
}

.error-content {
    text-align: center;
    padding: 30px;
    color: #ff6b6b;
}

.error-content p {
    margin: 0;
    font-size: 16px;
}

.empty-section {
    text-align: center;
    padding: 40px 20px;
    color: #999;
}

.hint {
    font-size: 14px;
    color: #888;
    margin-top: 10px;
}

/* 遮罩层 */
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
}

/* 响应式 */
@media (max-width: 768px) {
    .main-panel {
        width: 95%;
        margin: 10px;
    }

    .input-group {
        flex-direction: column;
    }

    .actions {
        flex-direction: column;
    }

    .float-button {
        padding: 10px 16px;
        font-size: 13px;
    }

    .diagnostic-content {
        font-size: 12px;
    }
    .debug-btn {
        background: #ffd93d;
        color: #333;
    }

    .debug-btn:hover {
        background: #ffc800;
        transform: translateY(-2px);
    }
    .devtools-btn {
        background: #9c27b0;
        color: white;
    }

    .devtools-btn:hover {
        background: #7b1fa2;
        transform: translateY(-2px);
    }

    .capture-btn {
        background: #ff9800;
        color: white;
    }

    .capture-btn:hover {
        background: #f57c00;
        transform: translateY(-2px);
    }
}
</style>
