export default class NumberSequencePlugin {
  constructor(options = {}) {
    this.options = {
      mainButtonText: '1->2',
      subButtonText: '1-1',
      mainTooltip: '插入主序号',
      subTooltip: '插入子序号',
      mainStyle: {
        backgroundColor: '#fff',
        color: '#333'
      },
      subStyle: {
        backgroundColor: '#fff',
        color: '#333'
      },
      ...options
    };
    this.isInitialized = false;
    // 插件状态
    this.nextMainIndex = 1;
    this.usedMainIndexes = new Set();
    this.nextSubIndexMap = {};
    this.usedSubIndexMap = {};
    this.insertedItems = [];
    this.callbacks = {};
    this.isEditMode = false;
  }
  // 更新配置的方法
  updateConfig(config) {
    if (config.mainStyle) {
      this.options.mainStyle = { ...this.options.mainStyle, ...config.mainStyle };
    }
    if (config.subStyle) {
      this.options.subStyle = { ...this.options.subStyle, ...config.subStyle };
    }
  }
  // 注册回调函数
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  // 触发回调
  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  // 初始化插件
  init(editor) {
    this.editor = editor;
    this.registerButtons();
    this.registerEventListeners();

    // 延迟初始化内容，确保编辑器内容已加载
    setTimeout(() => {
      const content = this.editor.getContent();
      if (content) {
        this.initializeFromContent(content);
      }
    }, 200);
  }

  // 注册按钮
  registerButtons() {
    // 主序号按钮
    this.editor.ui.registry.addButton("number_main", {
      text: this.options.mainButtonText,
      tooltip: this.options.mainTooltip,
      onAction: () => {
        this.insertMainNumber();
      },
    });

    // 子序号按钮
    this.editor.ui.registry.addButton("number_sub", {
      text: this.options.subButtonText,
      tooltip: this.options.subTooltip,
      onAction: () => {
        this.insertSubNumber();
      },
    });
  }

  // 注册事件监听
  registerEventListeners() {

    let checkTimeout = null;

    //统一的检查函数，带防抖
    const debouncedCheck = () => {
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }
      checkTimeout = setTimeout(() => {
        this.checkForDeletedItems();
      }, 100); // 增加延迟，减少频繁检查
    };

    // 键盘删除事件
    this.editor.on('keydown', (e) => {
      if (e.keyCode === 8 || e.keyCode === 46) {
        this.handleDelete(e);
        // 延迟检查删除结果
        setTimeout(debouncedCheck, 200);
      }
    });

    // 只保留最重要的事件监听
    this.editor.on('input', debouncedCheck);
    this.editor.on('NodeChange', debouncedCheck);

    // 其他重要事件
    this.editor.on('cut paste', () => {
      setTimeout(debouncedCheck, 200);
    });
  }
  // 测试事件系统
  testEventSystem() {
    this.emit('deleteMain', { test: 'deleteMain event' });
    this.emit('deleteSub', { test: 'deleteSub event' });
  }
  // 插入主序号
  insertMainNumber() {
    // 如果还没初始化，先初始化
    if (!this.isInitialized) {
      const content = this.editor.getContent();
      this.initializeFromContent(content);
    }

    let currentMainIndex;

    // 根据模式选择插入策略
    if (this.isEditMode) {
      // 编辑模式：追加模式，直接使用 nextMainIndex
      currentMainIndex = this.nextMainIndex;
    } else {
      // 新建模式：递增模式，优先填充空缺
      currentMainIndex = 1;
      while (this.usedMainIndexes.has(currentMainIndex)) {
        currentMainIndex++;
      }
    }

    this.usedMainIndexes.add(currentMainIndex);

    //更新 nextMainIndex
    if (this.isEditMode) {
      // 编辑模式：简单递增
      this.nextMainIndex = currentMainIndex + 1;
    } else {
      // 新建模式：设为当前最大序号 + 1
      this.nextMainIndex = Math.max(...Array.from(this.usedMainIndexes)) + 1;
    }

    const itemId = `main_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const styleString = this.buildStyleString(this.options.mainStyle);

    const content = `<span 
      id="${itemId}" 
      data-type="main" 
      data-index="${currentMainIndex}"
      contenteditable="false"
      style="${styleString}"> ${currentMainIndex} </span>`;

    this.editor.insertContent(content);

    const item = {
      id: itemId,
      type: 'main',
      index: currentMainIndex,
      parentIndex: null
    };
    this.insertedItems.push(item);

    // 初始化子序号管理
    if (!this.nextSubIndexMap[currentMainIndex]) {
      this.nextSubIndexMap[currentMainIndex] = 1;
      this.usedSubIndexMap[currentMainIndex] = new Set();
    }

    //插入后，如果之前是新建模式，现在变成编辑模式
    if (!this.isEditMode) {
      this.isEditMode = true;
    }

    //触发回调
    this.emit('insertMain', {
      index: currentMainIndex,
      itemId: itemId,
      item: item,
      mode: this.isEditMode ? 'edit' : 'new'
    });
  }

  // 插入子序号
  insertSubNumber() {
    const mainItems = this.insertedItems.filter(item => item.type === 'main');
    if (mainItems.length === 0) {
      //触发错误回调
      this.emit('error', {
        type: 'NO_MAIN_NUMBER',
        message: '请先添加主序号'
      });
      return;
    }

    const latestMainItem = mainItems[mainItems.length - 1];
    const currentMainIndex = latestMainItem.index;

    let currentSubIndex = 1;
    while (this.usedSubIndexMap[currentMainIndex].has(currentSubIndex)) {
      currentSubIndex++;
    }

    this.usedSubIndexMap[currentMainIndex].add(currentSubIndex);

    const itemId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const styleString = this.buildStyleString(this.options.subStyle);

    const content = `<span 
      id="${itemId}" 
      data-type="sub" 
      data-main-index="${currentMainIndex}"
      data-sub-index="${currentSubIndex}"
      contenteditable="false"
      style="${styleString}"> ${currentMainIndex}-${currentSubIndex} </span>`;

    this.editor.insertContent(content);

    const item = {
      id: itemId,
      type: 'sub',
      index: currentSubIndex,
      parentIndex: currentMainIndex,
      fullIndex: `${currentMainIndex}-${currentSubIndex}`
    };
    this.insertedItems.push(item);

    //触发回调
    this.emit('insertSub', {
      mainIndex: currentMainIndex,
      subIndex: currentSubIndex,
      fullIndex: `${currentMainIndex}-${currentSubIndex}`,
      itemId: itemId,
      item: item
    });
  }

  // 处理删除
  handleDelete(event) {

    const node = this.editor.selection.getNode();

    if (this.isOurElement(node)) {
      event.preventDefault();
      this.deleteItem(node);
    }
  }

  // 删除项目
  deleteItem(element) {
    let itemId, item;

    if (typeof element === 'string') {
      itemId = element;
      item = this.insertedItems.find(item => item.id === itemId);
    } else if (element && element.id) {
      itemId = element.id;
      item = this.insertedItems.find(item => item.id === itemId);
    }

    if (item) {
      // 从DOM中移除（如果存在）
      const domElement = this.editor.dom.get(itemId);
      if (domElement) {
        this.editor.dom.remove(domElement);
      }

      // 触发删除事件
      this.triggerDeleteEvent(item);

      // 更新状态
      this.updateStateAfterDelete(item);

      // 从数组中移除
      this.insertedItems = this.insertedItems.filter(i => i.id !== itemId);
    }
  }

  // 检查删除项目
  checkForDeletedItems() {

    if (this.insertedItems.length === 0) {
      return;
    }

    const currentContent = this.editor.getContent();
    const deletedItems = [];

    //检查每个项目是否还存在
    this.insertedItems.forEach(item => {
      const elementExists = currentContent.includes(`id="${item.id}"`);

      if (!elementExists) {
        deletedItems.push(item);
      }
    });

    //处理删除的项目
    if (deletedItems.length > 0) {

      deletedItems.forEach(item => {
        //直接触发删除事件，不调用 deleteItem（避免重复处理）
        this.triggerDeleteEvent(item);

        //更新状态
        this.updateStateAfterDelete(item);

        //从数组中移除
        this.insertedItems = this.insertedItems.filter(i => i.id !== item.id);
      });
    }
  }
  //更新状态的独立方法
  updateStateAfterDelete(item) {
    if (item.type === 'main') {
      this.usedMainIndexes.delete(item.index);
      // 清理对应的子序号映射
      delete this.nextSubIndexMap[item.index];
      delete this.usedSubIndexMap[item.index];

      //如果删除后没有主序号了，切换回新建模式
      if (this.usedMainIndexes.size === 0) {
        this.isEditMode = false;
        this.nextMainIndex = 1;
      } else if (this.isEditMode) {
        //编辑模式下，nextMainIndex 保持为最大序号 + 1
        this.nextMainIndex = Math.max(...Array.from(this.usedMainIndexes)) + 1;
      }

    } else if (item.type === 'sub') {
      if (this.usedSubIndexMap[item.parentIndex]) {
        this.usedSubIndexMap[item.parentIndex].delete(item.index);
      }
    }
  }
  // 手动切换模式的方法（可选）
  switchMode(mode) {
    if (mode === 'edit' || mode === 'new') {
      this.isEditMode = (mode === 'edit');

      // 重新计算 nextMainIndex
      if (this.isEditMode && this.usedMainIndexes.size > 0) {
        this.nextMainIndex = Math.max(...Array.from(this.usedMainIndexes)) + 1;
      } else if (!this.isEditMode) {
        this.nextMainIndex = 1;
      }
    }
  }
  //更新状态获取方法
  getStatus() {
    return {
      mode: this.isEditMode ? 'edit' : 'new',
      nextMainIndex: this.nextMainIndex,
      usedMainIndexes: Array.from(this.usedMainIndexes).sort(),
      insertedItems: [...this.insertedItems],
      isInitialized: this.isInitialized
    };
  }
  //触发删除事件的独立方法
  triggerDeleteEvent(item) {
    if (item.type === 'main') {
      this.emit('deleteMain', {
        index: item.index,
        itemId: item.id,
        item: item
      });
    } else if (item.type === 'sub') {
      this.emit('deleteSub', {
        mainIndex: item.parentIndex,
        subIndex: item.index,
        fullIndex: item.fullIndex,
        itemId: item.id,
        item: item
      });
    }
  }
  // 构建样式字符串
  buildStyleString(styleObj) {
    const baseStyle = Object.entries(styleObj)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');

    // 使用您要求的样式
    return baseStyle +
      '; display: inline-block' +
      '; padding: 0px 8px' +
      '; margin: 0 2px' +
      '; border-bottom: 1px solid #333' +
      '; font-weight: bold' +
      '; cursor: default' +
      '; user-select: none' +
      '; -webkit-user-select: none' +
      '; -moz-user-select: none' +
      '; -ms-user-select: none' +
      '; white-space: nowrap' +
      '; vertical-align: baseline' +
      '; position: relative' +
      '; z-index: 1' +
      '; pointer-events: auto' +
      '; outline: none';
  }

  isOurElement(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    const dataType = node.getAttribute('data-type');
    const result = node.tagName === 'SPAN' && (dataType === 'main' || dataType === 'sub');
    return result;
  }

  // 初始化现有内容
  initializeFromContent(content) {

    //如果已经初始化过且有内容，且不是强制重新初始化，则跳过
    if (this.isInitialized && this.insertedItems.length > 0) {
      return;
    }

    // 重置状态
    this.nextMainIndex = 1;
    this.usedMainIndexes = new Set();
    this.nextSubIndexMap = {};
    this.usedSubIndexMap = {};
    this.insertedItems = [];
    this.isEditMode = false; //重置模式标志

    if (!content || content.trim() === '') {
      this.isEditMode = false;
      this.isInitialized = true;
      return;
    }

    //检测是否包含序号元素
    const hasMainNumbers = content.includes('data-type="main"');
    const hasSubNumbers = content.includes('data-type="sub"');

    if (hasMainNumbers || hasSubNumbers) {
      this.isEditMode = true;

      // 解析现有的序号元素
      this.parseExistingNumbers(content);

      //编辑模式：nextMainIndex 设为最大序号 + 1
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
  // 解析现有的序号元素（简化版）
  parseExistingNumbers(content) {
    try {
      // 创建临时DOM来解析内容
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      // 查找所有序号元素
      const mainSpans = tempDiv.querySelectorAll('span[data-type="main"]');
      const subSpans = tempDiv.querySelectorAll('span[data-type="sub"]');

      // 处理主序号
      mainSpans.forEach(span => {
        const index = parseInt(span.getAttribute('data-index'));
        const id = span.id;

        if (!isNaN(index) && id) {
          this.usedMainIndexes.add(index);
          this.nextMainIndex = Math.max(this.nextMainIndex, index + 1);

          // 初始化子序号管理
          if (!this.nextSubIndexMap[index]) {
            this.nextSubIndexMap[index] = 1;
            this.usedSubIndexMap[index] = new Set();
          }

          // 记录项目
          const item = {
            id: id,
            type: 'main',
            index: index,
            parentIndex: null
          };
          this.insertedItems.push(item);
        }
      });

      // 处理子序号
      subSpans.forEach(span => {
        const mainIndex = parseInt(span.getAttribute('data-main-index'));
        const subIndex = parseInt(span.getAttribute('data-sub-index'));
        const id = span.id;

        if (!isNaN(mainIndex) && !isNaN(subIndex) && id) {
          // 确保主序号的子序号集合存在
          if (!this.usedSubIndexMap[mainIndex]) {
            this.usedSubIndexMap[mainIndex] = new Set();
            this.nextSubIndexMap[mainIndex] = 1;
          }

          this.usedSubIndexMap[mainIndex].add(subIndex);
          this.nextSubIndexMap[mainIndex] = Math.max(
            this.nextSubIndexMap[mainIndex],
            subIndex + 1
          );

          // 记录项目
          const item = {
            id: id,
            type: 'sub',
            index: subIndex,
            parentIndex: mainIndex,
            fullIndex: `${mainIndex}-${subIndex}`
          };
          this.insertedItems.push(item);
        }
      });

    } catch (error) {
      console.error('🚫 解析现有序号时出错:', error);
    }
  }
  // 获取插件状态
  getStatus() {
    return {
      nextMainIndex: this.nextMainIndex,
      usedMainIndexes: Array.from(this.usedMainIndexes).sort(),
      insertedItems: [...this.insertedItems]
    };
  }
}