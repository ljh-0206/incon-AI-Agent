(function () {
    'use strict';

    tinymce.PluginManager.add('numbersequence', function (editor, url) {

        // ===== NumberSequencePlugin 类（内联自 index.js）=====
        class NumberSequencePlugin {
            constructor(options = {}) {
                this.options = {
                    mainButtonText: '1->2',
                    subButtonText: '1-1',
                    mainTooltip: '插入主序号',
                    subTooltip: '插入子序号',
                    mainStyle: { backgroundColor: '#fff', color: '#333' },
                    subStyle: { backgroundColor: '#fff', color: '#333' },
                    ...options
                };
                this.isInitialized = false;
                this.nextMainIndex = 1;
                this.usedMainIndexes = new Set();
                this.nextSubIndexMap = {};
                this.usedSubIndexMap = {};
                this.insertedItems = [];
                this.callbacks = {};
                this.isEditMode = false;
            }
            updateConfig(config) {
                if (config.mainStyle) this.options.mainStyle = { ...this.options.mainStyle, ...config.mainStyle };
                if (config.subStyle) this.options.subStyle = { ...this.options.subStyle, ...config.subStyle };
            }
            on(event, callback) {
                if (!this.callbacks[event]) this.callbacks[event] = [];
                this.callbacks[event].push(callback);
            }
            emit(event, data) {
                if (this.callbacks[event]) this.callbacks[event].forEach(cb => cb(data));
            }
            init(editor) {
                this.editor = editor;
                this.registerButtons();
                this.registerEventListeners();
                const tryInit = () => {
                    if (this.editor && this.editor.initialized) {
                        const content = this.editor.getContent();
                        if (content) this.initializeFromContent(content);
                    }
                };
                if (editor.initialized) {
                    tryInit();
                } else {
                    editor.on('init', tryInit);
                }
            }
            registerButtons() {
                this.editor.ui.registry.addButton("number_main", {
                    text: this.options.mainButtonText,
                    tooltip: this.options.mainTooltip,
                    onAction: () => this.insertMainNumber(),
                });
                this.editor.ui.registry.addButton("number_sub", {
                    text: this.options.subButtonText,
                    tooltip: this.options.subTooltip,
                    onAction: () => this.insertSubNumber(),
                });
            }
            registerEventListeners() {
                let checkTimeout = null;
                const debouncedCheck = () => {
                    if (checkTimeout) clearTimeout(checkTimeout);
                    checkTimeout = setTimeout(() => this.checkForDeletedItems(), 100);
                };
                this.editor.on('keydown', (e) => {
                    if (e.keyCode === 8 || e.keyCode === 46) {
                        this.handleDelete(e);
                        setTimeout(debouncedCheck, 200);
                    }
                });
                this.editor.on('input', debouncedCheck);
                this.editor.on('NodeChange', debouncedCheck);
                this.editor.on('cut paste', () => setTimeout(debouncedCheck, 200));
            }
            insertMainNumber() {
                if (!this.isInitialized) {
                    const content = this.editor.getContent();
                    this.initializeFromContent(content);
                }
                let currentMainIndex;
                if (this.isEditMode) {
                    currentMainIndex = this.nextMainIndex;
                } else {
                    currentMainIndex = 1;
                    while (this.usedMainIndexes.has(currentMainIndex)) currentMainIndex++;
                }
                this.usedMainIndexes.add(currentMainIndex);
                if (this.isEditMode) {
                    this.nextMainIndex = currentMainIndex + 1;
                } else {
                    this.nextMainIndex = Math.max(...Array.from(this.usedMainIndexes)) + 1;
                }
                const itemId = `main_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                const styleString = this.buildStyleString(this.options.mainStyle);
                const content = `<span id="${itemId}" data-type="main" data-index="${currentMainIndex}" contenteditable="false" style="${styleString}"> ${currentMainIndex} </span>`;
                this.editor.insertContent(content);
                const item = { id: itemId, type: 'main', index: currentMainIndex, parentIndex: null };
                this.insertedItems.push(item);
                if (!this.nextSubIndexMap[currentMainIndex]) {
                    this.nextSubIndexMap[currentMainIndex] = 1;
                    this.usedSubIndexMap[currentMainIndex] = new Set();
                }
                if (!this.isEditMode) this.isEditMode = true;
                this.emit('insertMain', { index: currentMainIndex, itemId: itemId, item: item, mode: this.isEditMode ? 'edit' : 'new' });
            }
            insertSubNumber() {
                const mainItems = this.insertedItems.filter(item => item.type === 'main');
                if (mainItems.length === 0) {
                    this.emit('error', { type: 'NO_MAIN_NUMBER', message: '请先添加主序号' });
                    return;
                }
                const latestMainItem = mainItems[mainItems.length - 1];
                const currentMainIndex = latestMainItem.index;
                let currentSubIndex = 1;
                while (this.usedSubIndexMap[currentMainIndex].has(currentSubIndex)) currentSubIndex++;
                this.usedSubIndexMap[currentMainIndex].add(currentSubIndex);
                const itemId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                const styleString = this.buildStyleString(this.options.subStyle);
                const content = `<span id="${itemId}" data-type="sub" data-main-index="${currentMainIndex}" data-sub-index="${currentSubIndex}" contenteditable="false" style="${styleString}"> ${currentMainIndex}-${currentSubIndex} </span>`;
                this.editor.insertContent(content);
                const item = { id: itemId, type: 'sub', index: currentSubIndex, parentIndex: currentMainIndex, fullIndex: `${currentMainIndex}-${currentSubIndex}` };
                this.insertedItems.push(item);
                this.emit('insertSub', { mainIndex: currentMainIndex, subIndex: currentSubIndex, fullIndex: `${currentMainIndex}-${currentSubIndex}`, itemId: itemId, item: item });
            }
            handleDelete(event) {
                const node = this.editor.selection.getNode();
                if (this.isOurElement(node)) {
                    event.preventDefault();
                    this.deleteItem(node);
                }
            }
            deleteItem(element) {
                let itemId, item;
                if (typeof element === 'string') itemId = element;
                else if (element && element.id) itemId = element.id;
                if (itemId) item = this.insertedItems.find(i => i.id === itemId);
                if (item) {
                    const domElement = this.editor.dom.get(itemId);
                    if (domElement) this.editor.dom.remove(domElement);
                    this.triggerDeleteEvent(item);
                    this.updateStateAfterDelete(item);
                    this.insertedItems = this.insertedItems.filter(i => i.id !== itemId);
                }
            }
            checkForDeletedItems() {
                if (this.insertedItems.length === 0) return;
                const currentContent = this.editor.getContent();
                const deletedItems = [];
                this.insertedItems.forEach(item => {
                    if (!currentContent.includes(`id="${item.id}"`)) deletedItems.push(item);
                });
                if (deletedItems.length > 0) {
                    deletedItems.forEach(item => {
                        this.triggerDeleteEvent(item);
                        this.updateStateAfterDelete(item);
                        this.insertedItems = this.insertedItems.filter(i => i.id !== item.id);
                    });
                }
            }
            updateStateAfterDelete(item) {
                if (item.type === 'main') {
                    this.usedMainIndexes.delete(item.index);
                    delete this.nextSubIndexMap[item.index];
                    delete this.usedSubIndexMap[item.index];
                    if (this.usedMainIndexes.size === 0) {
                        this.isEditMode = false;
                        this.nextMainIndex = 1;
                    } else if (this.isEditMode) {
                        this.nextMainIndex = Math.max(...Array.from(this.usedMainIndexes)) + 1;
                    }
                } else if (item.type === 'sub') {
                    if (this.usedSubIndexMap[item.parentIndex]) this.usedSubIndexMap[item.parentIndex].delete(item.index);
                }
            }
            buildStyleString(styleObj) {
                const baseStyle = Object.entries(styleObj)
                    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
                    .join('; ');
                return baseStyle + '; display: inline-block; padding: 0px 8px; margin: 0 2px; border-bottom: 1px solid #333; font-weight: bold; cursor: default; user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; white-space: nowrap; vertical-align: baseline; position: relative; z-index: 1; pointer-events: auto; outline: none';
            }
            isOurElement(node) {
                if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
                const dataType = node.getAttribute('data-type');
                return node.tagName === 'SPAN' && (dataType === 'main' || dataType === 'sub');
            }
            initializeFromContent(content) {
                if (this.isInitialized && this.insertedItems.length > 0) return;
                this.nextMainIndex = 1;
                this.usedMainIndexes = new Set();
                this.nextSubIndexMap = {};
                this.usedSubIndexMap = {};
                this.insertedItems = [];
                this.isEditMode = false;
                if (!content || content.trim() === '') {
                    this.isEditMode = false;
                    this.isInitialized = true;
                    return;
                }
                const hasMainNumbers = content.includes('data-type="main"');
                const hasSubNumbers = content.includes('data-type="sub"');
                if (hasMainNumbers || hasSubNumbers) {
                    this.isEditMode = true;
                    this.parseExistingNumbers(content);
                    if (this.usedMainIndexes.size > 0) {
                        this.nextMainIndex = Math.max(...Array.from(this.usedMainIndexes)) + 1;
                    }
                } else {
                    this.isEditMode = false;
                    this.nextMainIndex = 1;
                }
                this.isInitialized = true;
            }
            forceReinitialize(content) {
                this.isInitialized = false;
                this.initializeFromContent(content);
            }
            parseExistingNumbers(content) {
                try {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = content;
                    const mainSpans = tempDiv.querySelectorAll('span[data-type="main"]');
                    const subSpans = tempDiv.querySelectorAll('span[data-type="sub"]');
                    mainSpans.forEach(span => {
                        const index = parseInt(span.getAttribute('data-index'));
                        const id = span.id;
                        if (!isNaN(index) && id) {
                            this.usedMainIndexes.add(index);
                            this.nextMainIndex = Math.max(this.nextMainIndex, index + 1);
                            if (!this.nextSubIndexMap[index]) {
                                this.nextSubIndexMap[index] = 1;
                                this.usedSubIndexMap[index] = new Set();
                            }
                            this.insertedItems.push({ id: id, type: 'main', index: index, parentIndex: null });
                        }
                    });
                    subSpans.forEach(span => {
                        const mainIndex = parseInt(span.getAttribute('data-main-index'));
                        const subIndex = parseInt(span.getAttribute('data-sub-index'));
                        const id = span.id;
                        if (!isNaN(mainIndex) && !isNaN(subIndex) && id) {
                            if (!this.usedSubIndexMap[mainIndex]) {
                                this.usedSubIndexMap[mainIndex] = new Set();
                                this.nextSubIndexMap[mainIndex] = 1;
                            }
                            this.usedSubIndexMap[mainIndex].add(subIndex);
                            this.nextSubIndexMap[mainIndex] = Math.max(this.nextSubIndexMap[mainIndex], subIndex + 1);
                            this.insertedItems.push({ id: id, type: 'sub', index: subIndex, parentIndex: mainIndex, fullIndex: `${mainIndex}-${subIndex}` });
                        }
                    });
                } catch (error) {
                    console.error('解析现有序号时出错:', error);
                }
            }
            getStatus() {
                return { mode: this.isEditMode ? 'edit' : 'new', nextMainIndex: this.nextMainIndex, usedMainIndexes: Array.from(this.usedMainIndexes).sort(), insertedItems: [...this.insertedItems], isInitialized: this.isInitialized };
            }
            triggerDeleteEvent(item) {
                if (item.type === 'main') this.emit('deleteMain', { index: item.index, itemId: item.id, item: item });
                else if (item.type === 'sub') this.emit('deleteSub', { mainIndex: item.parentIndex, subIndex: item.index, fullIndex: item.fullIndex, itemId: item.id, item: item });
            }
        }
        // ===== End NumberSequencePlugin =====

        const defaultOptions = {
            mainButtonText: '1-2',
            subButtonText: '1-1',
            mainTooltip: '插入主序号',
            subTooltip: '插入子序号'
        };

        const plugin = new NumberSequencePlugin(defaultOptions);
        plugin.init(editor);

        editor.addCommand('insertMainNumber', function () { plugin.insertMainNumber(); });
        editor.addCommand('insertSubNumber', function () { plugin.insertSubNumber(); });

        plugin.on('insertMain', function (data) { editor.fire('numberSequenceInsertMain', data); });
        plugin.on('insertSub', function (data) { editor.fire('numberSequenceInsertSub', data); });
        plugin.on('deleteMain', function (data) { editor.fire('numberSequenceDeleteMain', data); });
        plugin.on('deleteSub', function (data) { editor.fire('numberSequenceDeleteSub', data); });
        plugin.on('error', function (data) {
            if (data.type === 'NO_MAIN_NUMBER') {
                editor.notificationManager.open({ text: data.message, type: 'warning', timeout: 3000 });
            }
        });

        return {
            getMetadata: function () { return { name: 'Number Sequence Plugin', url: '' }; },
            getPlugin: function () { return plugin; }
        };
    });
})();
