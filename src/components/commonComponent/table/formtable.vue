<template>
  <span :style="configdata.mainStyles" :class="'style-' + configdata.blm + ' ' + configdata.blm">
      <Button v-if="env()" @click="test">formtableTest</Button>
      <Button
          v-if="(configdata.addButtonPosition==='top' || !configdata.addButtonPosition) && opentype!='show' && computeAddKyf($attrs)"
          type="primary" icon="md-add" size="small" @click="add"
          :style="configdata.addStyle">{{configdata.buttonContent ? configdata.buttonContent :'添加'}}
      </Button>
      <template v-for="(btnItem, btnIndex) in configdata.titleButtons" :key="btnItem.blm + btnIndex">
          <component :is="btnItem.componentType" :id="btnItem.blm" :ref="btnItem.blm" v-if="computeKyf(btnItem,null,null,$attrs)"
              v-bind="btnItem.attrs" :style="btnItem.style"
              @click="titlebuttonclick(btnItem)"><span v-if="btnItem.content">{{btnItem.content}}</span>
          </component>
      </template>
      <Table v-if="showTable()" :ref="configdata.blm" :columns="getTableColumns" :data="data"
          v-bind="computeTableAttrs()" @on-select="handleSelect" @on-select-cancel="handleSelectCancel"
          @on-select-all="handleSelectAll" @on-select-all-cancel="handleSelectAllCancel" @on-drag-drop="handleDrag" >
          <template v-for="(item,itemIndex) in columnSlots" :key="item.blm || itemIndex" #[item.slot]="{row,index}">
              <template v-if="computeKyf(item,row,index)">
                  <template v-if="item.slotChildren && item.slotChildren.length>0">
                      <template v-for="(child,childIndex) in item.slotChildren" :key="child.blm+childIndex">
                          <Date-Picker v-if="child.componentType == 'date-picker' || child.componentType == 'DatePicker'" transfer
                              :model-value="row[child.blm]" :disabled="computedDisabled()"
                              v-bind="computeItemAttrs(child,row,index,$attrs)" :editable="false"
                              :style="computeItemStyle(child,row,index)" :row="row" :index="index"
                              @on-blur="handleBlur(index,child,childIndex,$event)"
                              @on-change="handleOnChange(index,child,childIndex,$event)"></Date-Picker>
                          <component v-else-if="computeKyf(child,row,index)" transfer :is="child.componentType"
                              v-model="row[child.blm]"
                              :disabled="computedDisabled()" :list="list[child.blm]"
                              v-bind="computeItemAttrs(child,row,index,$attrs)" :style="computeItemStyle(child,row,index)"
                              :row="row" :index="index" @on-blur="handleBlur(index,child,childIndex,$event)"
                              @click.stop="handleClick(index,child,childIndex)"
                              @on-change="handleOnChange(index,child,childIndex,$event)">
                              <template v-if="child.xscontent!='0'">
                                  {{child.content ? child.content : row[child.blm]}}
                              </template>
                          </component>
                      </template>
                  </template>
                  <template v-else>
                      <Date-Picker v-if="item.componentType == 'date-picker' || item.componentType == 'DatePicker'" transfer
                          :key="item.blm + itemIndex" :model-value="row[item.blm]" :disabled="computedDisabled()"
                          :style="computeItemStyle(item,row,index)" v-bind="computeItemAttrs(item,row,index,$attrs)"
                          :row="row" :index="index"
                          @on-change="handleOnChange(index,item,itemIndex,$event)">
                      </Date-Picker>
                      <component v-else-if="computeKyf(item,row,index)" transfer :is="item.componentType"
                          :key="'formtable'+item.blm+itemIndex" v-model="data[index][item.blm]" :list="list[item.blm]"
                          :configdata="item" :style="computeItemStyle(item,row,index)" :opentype="opentype" :disabled="computedDisabled()"
                          v-bind="computeItemAttrs(item,row,index,$attrs)"
                          @click.stop="handleClick(index,item,itemIndex)" :row="row" :index="index"
                          @on-blur="handleBlur(index, item, itemIndex, $event)"
                          @on-change="handleOnChange(index,item,itemIndex,$event)">
                          <template v-if="item.xscontent != '0'">
                              <Icon v-if="item.icon" :type="item.icon" :size="item.iconSize"></Icon>
                              <span>{{ item.content ? item.content : row[item.blm] }}</span>
                          </template>
                      </component>
                  </template>
              </template>
          </template>
      </Table>
      <div v-if="configdata.addButtonPosition==='bottom' && opentype!='show' && computeAddKyf($attrs)"
          style="border:dotted 1px;height:32px;text-align:center" :style="configdata.addStyle">
          <a @click="add">{{configdata.buttonContent ? configdata.buttonContent :'添加'}}</a>
      </div>
  </span>
</template>
<script>
    import { sys_guid, moveArrayItem } from '@/api/common';

    export default {
        name: 'formtable',
        props: {
            fathername: { type: String, default: '' },
            modelValue: { type: Array, default: () => [] },
            name: { type: String, default: '' },
            item: { type: Object, default: () => ({}) },
            configdata: { type: Object, default: () => ({}) },
            buttonProps: { type: String, default: 'primary' },
            opentype: { type: String },
            propstocomponent: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                componentName: '',
                ref: this.$root.componentRefs,
                zjConfigdata: {},
                oldDate: '',
                data: [],
                dataChangeStatus: false,
                index: 1,
                tableColumns: [],
                columnSlots: [], // 添加 columnSlots 数组
                list: {},
                tableselecteddata: []
            };
        },
        computed: {
            getTableColumns () {
                const columns = [];
                if (!this.zjConfigdata.columns || this.zjConfigdata.columns.length === 0) {
                    return columns;
                }
                for (const item of this.zjConfigdata.columns) {
                    if (item.condition) {
                        const obj = { item, data: this.data };
                        const funcEval = new Function('_this', 'obj', item.condition);
                        const returnValue = funcEval(this, obj);
                        if (returnValue) columns.push(item);
                    } else {
                        columns.push(item);
                    }
                }
                return columns;
            }
        },
        methods: {
            test () {
                console.log('componentName', this.componentName, 'from formtable.vue');
                console.log('configdata', this.configdata, 'from formtable.vue');
                console.log('zjConfigdata', this.zjConfigdata, 'from formtable.vue');
                console.log('data', this.data, 'from formtable.vue');
                console.log('tableColumns', this.tableColumns, 'from formtable.vue');
                console.log('opentype', this.opentype, 'from formtable.vue');
                console.log('list', this.list, 'from formtable.vue');
                console.log('modelValue', this.modelValue, 'from formtable.vue');
            },
            env () {
                let returnValue = false;
                const str = localStorage.getItem('incoenv');
                if (str && str.length > 0 && JSON.parse(localStorage.getItem('incoenv')).env === 1) returnValue = true;
                return returnValue;
            },

            computeKyf (item, row, index, attrs) {
                let returnValue = true;
                if (item.componentType === 'input-number' && row[item.blm] !== 0 && !row[item.blm]) {
                    row[item.blm] = null;
                }
                if (item.condition) {
                    try {
                        const funcEval = new Function('_this', 'obj', item.condition);
                        const obj = { item, index, row };
                        returnValue = funcEval(this, obj);
                    } catch (e) {
                        console.log('formtable computeKyf error:', item.blm, item.condition, e);
                    }
                }
                if (item.kyf && item.kyf === '0') returnValue = false;
                if (attrs && attrs.disabled) returnValue = false;
                return returnValue;
            },
            computeAddKyf (attrs) {
                let returnValue = true;
                if (this.configdata.addcondition) {
                    try {
                        const funcEval = new Function('_this', 'obj', this.configdata.addcondition);
                        returnValue = funcEval(this, {});
                    } catch (e) {
                        console.log('formtable computeAddKyf error:', e);
                    }
                }
                if (this.configdata.editable == '0') returnValue = false
                if (attrs && attrs.disabled) returnValue = false
                return returnValue;
            },
            showTable () {
                if (this.configdata.showTableTitle == '0') {
                    if (this.data && this.data.length > 0) return true;
                    else return false;
                }
                return true;
            },
            computedDisabled () {
                return this.opentype == 'show' || this.configdata.editable == '0'
            },
            add () {
                if (!this.zjConfigdata.columns || this.zjConfigdata.columns.length === 0) {
                    this.$Message.warning('请先配置表格列信息')
                    return
                }
                if (this.zjConfigdata.addMethod) {
                    const obj = this.commonsJs.funcEval1(this, { data: this.data }, this.zjConfigdata.addMethod)
                    if (obj) this.data.push(obj)
                } else {
                    const newItem = this.zjConfigdata.defaultData ? { ...this.zjConfigdata.defaultData } : {}
                    newItem[this.zjConfigdata.tableId || 'id'] = sys_guid()
                    this.zjConfigdata.columns.forEach((item) => {
                        if (item.slot && newItem[item.slot] === undefined) newItem[item.slot] = null
                    })
                    this.data.push(newItem)
                }
                this.$emit('update:modelValue', this.data)
            },
            computeTableAttrs () {
                let attrs = this.configdata.attrs || {};
                if (this.configdata.attrsMethod) {
                    const funcEval = this.commonsJs.funcEval1(this, {}, this.configdata.attrsMethod);
                    attrs = { ...attrs, ...funcEval };
                }
                return attrs;
            },
            computeItemAttrs (item, row, index, attrs) {
                let newAttrs = {};
                if (item.attrs) newAttrs = { ...item.attrs };
                if (row.attrs && row.attrs[item.blm]) {
                    newAttrs = { ...newAttrs, ...row.attrs[item.blm] };
                }
                if (item.attrsMethod) {
                    const funcEval = new Function('_this', 'obj', item.attrsMethod);
                    const attrsEnv = funcEval(this, { row, index, item });
                    newAttrs = { ...newAttrs, ...attrsEnv };
                }
                if (this.computedDisabled()) newAttrs.disabled = true
                if (attrs && attrs.disabled) newAttrs.disabled = true
                return newAttrs;
            },
            computeItemStyle (item, row, index) {
                let newstyle = {};
                if (item.style) newstyle = { ...item.style };
                if (item.styleMethod) {
                    const funcEval = new Function('_this', 'obj', item.styleMethod);
                    const styleEnv = funcEval(this, { row, index, item });
                    newstyle = { ...newstyle, ...styleEnv };
                }
                return newstyle;
            },
            titlebuttonclick (btnItem) {
                const obj = {
                    tableName: this.zjConfigdata.blm,
                    item: btnItem,
                    selecteddata: this.tableselecteddata,
                    data: this.data,
                    blm: btnItem.blm
                };
                if (btnItem.clickInside) {
                    this.commonsJs.funcEval(this, obj, btnItem.clickInside);
                }
                if (btnItem.click) {
                    obj.method = btnItem.click;
                    this.$emit('commonMethod', obj);
                }
            },
            handleSelect (selection, row) {
                this.addToTableselecteddata(row);
            },
            handleSelectCancel (selection, row) {
                this.deleteTableSelectData(row);
            },
            handleSelectAll (selection) {
                for (const row of this.data) {
                    this.addToTableselecteddata(row);
                }
            },
            handleSelectAllCancel (selection) {
                for (const row of this.data) {
                    this.deleteTableSelectData(row);
                }
            },
            handleDrag (start, end) {
                moveArrayItem(this.data, start, end);
            },
            addToTableselecteddata (row) {
                const id = this.zjConfigdata.tableId || 'id';
                let exist = false;
                for (const item of this.tableselecteddata) {
                    if (item[id] === row[id]) {
                        exist = true;
                        break;
                    }
                }
                if (!exist) this.tableselecteddata.push(row);
            },
            deleteTableSelectData (row) {
                const id = this.zjConfigdata.tableId || 'id';
                let index = -2;
                for (let i = 0; i < this.tableselecteddata.length; i++) {
                    const item = this.tableselecteddata[i];
                    if (item[id] === row[id]) {
                        index = i;
                        break;
                    }
                }
                if (index !== -2) {
                    this.tableselecteddata.splice(index, 1);
                }
            },
            handleClick (index, item, itemIndex) {
                if (item.blm == 'deleteButton') {
                    this.$Modal.confirm({
                        title: '删除确认',
                        content: '您确定要删除该行信息吗？',
                        onOk: () => { this.data.splice(index, 1) },
                        onCancel: () => { this.$Message.info('取消删除'); }
                    })
                } else {
                    const obj = {
                        index,
                        item,
                        itemIndex,
                        data: this.data,
                        row: this.data[index],
                        formtableName: this.configdata.blm,
                        blm: item.blm
                    };
                    if (item.clickInside) { this.commonsJs.funcEval(this, obj, item.clickInside); }
                    if (item.clickInForm) obj.clickInForm = item.clickInForm
                    this.ref[this.fathername].formtableitembuttonclick(this.configdata, obj)
                }
            },
            handleBlur (index, item, itemIndex, event) {
                const value = this.data[index][item.blm];
                const obj = {
                    index,
                    item,
                    itemIndex,
                    data: this.data,
                    row: this.data[index],
                    formtableName: this.configdata.blm,
                    blm: item.blm,
                    value: event
                };
                if (item.blurInside) {
                    this.commonsJs.funcEval(this, obj, item.blurInside);
                }
            },
            handleOnChange (index, item, itemIndex, event) {
                const row = this.data[index] // 当前行数据
                if (item.componentType == 'date-picker') { // 处理日期组件回显问题
                    if (this.oldDate != event || !event) {
                        this.$set(row, item.blm, event)
                        this.oldDate = event;
                    }
                }
                const obj = { index, item, itemIndex, data: this.data, row: this.data[index], formtableName: this.name, blm: item.blm, list: this.list }
                if (item.changeInside) this.commonsJs.funcEval(this, obj, item.changeInside)
                if (item.change) {
                    obj.method = item.change
                    this.$emit('commonMethod', obj)
                }
            },

            getColumnSlot () {
                this.columnSlots = [];
                if (this.tableColumns && this.tableColumns.length > 0) {
                    for (let i = 0; i < this.tableColumns.length; i++) {
                        const item = this.tableColumns[i];
                        if (item.slot) {
                            if (item.yyzjmc && item.yyzjmc.trim()) {
                                this.commonsJs.zjRegisterOne(item, this);
                            }
                            if (item.slotChildren && item.slotChildren.length > 0) {
                                for (let j = 0; j < item.slotChildren.length; j++) {
                                    const child = item.slotChildren[j];
                                    if (child.yyzjmc && child.yyzjmc.trim()) {
                                        this.commonsJs.zjRegisterOne(child, this);
                                    }
                                }
                            }
                            this.columnSlots.push(item);
                        }
                    }
                }
            },
            initList () {
                const sqlidList = [];
                if (this.tableColumns && this.tableColumns.length > 0) {
                    this.tableColumns.forEach((item) => {
                        if (this.configdata.editable == '0') item.editable = '0'
                        const zjlx = item.componentType
                        if (zjlx === 'jselect' || zjlx === 'jradio' || zjlx === 'jcheckbox' || zjlx === 'jswitch') {
                            if (item.listType == '4' || (item.list && item.list.length > 0)) {
                                this.getList(item)
                            } else if (item.listId) {
                                sqlidList.push({
                                    sqlid: item.listId,
                                    blm: item.blm,
                                    type: 'querylist',
                                    param: {},
                                    xlkitem: item// 此为了后续赋值使用，查询sql中用不到
                                })
                            } else if (item.listBm && item.listDm && item.listMc) {
                                sqlidList.push({
                                    sqlid: 'DC37EB84F52E3520E0555943CA7634DE',
                                    blm: item.blm,
                                    type: 'querylist',
                                    param: { listBm: item.listBm, listDm: item.listDm, listMc: item.listMc },
                                    xlkitem: item// 此为了后续赋值使用，查询sql中用不到
                                })
                            }
                        }
                        if (item.slotChildren && item.slotChildren.length > 0) {
                            item.slotChildren.forEach((child) => {
                                if (this.configdata.editable == '0') child.editable = '0'
                                if (child.componentType === 'jselect' || child.componentType === 'jradio' ||
                                    child.componentType === 'jcheckbox' || child.componentType === 'jswitch') {
                                    if (child.listType == '4' || (child.list && child.list.length > 0)) {
                                        this.getList(child);
                                    } else if (child.listId) {
                                        sqlidList.push({
                                            sqlid: child.listId,
                                            blm: child.blm,
                                            type: 'querylist',
                                            param: {},
                                            xlkitem: child
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
                if (sqlidList.length > 0) {
                    this.commonsJs.multiquery(sqlidList).then(res => {
                        sqlidList.forEach(item => {
                            const xlkitem = item.xlkitem;
                            this.list[xlkitem.blm] = res[xlkitem.blm];
                        });
                    });
                }
            },
            getList (item) {
                if (item.listType == '4') {
                    let list = this.$root.list[item.listBm];
                    if (!list) list = [];
                    this.list[item.blm] = list;
                } else if (item.list && item.list.length > 0) {
                    this.list[item.blm] = item.list;
                }
            },
            reset () {
                this.data = [];
                this.tableselecteddata = [];
            },
            initTable () {
                // this.reset();
                if (this.zjConfigdata.columns && this.zjConfigdata.columns.length > 0) {
                    this.tableColumns = this.zjConfigdata.columns;
                    this.getColumnSlot();
                    this.initList();
                }
                if (this.zjConfigdata.initMethod) {
                    this.commonsJs.funcEval1(this, {}, this.zjConfigdata.initMethod);
                }
            }
        },
        watch: {
            modelValue: {
                handler (n) {
                    if (n && Array.isArray(n)) {
                        this.data = JSON.parse(JSON.stringify(n));
                    }
                },
                deep: true,
                immediate: true
            },
            data: {
                handler () {
                    // this.$emit('input', this.data);
                    if (JSON.stringify(this.data) !== JSON.stringify(this.modelValue)) {
                        this.$emit('update:modelValue', this.data);
                    }
                    if (this.configdata.dataChangeMethod) {
                        this.commonsJs.funcEval1(this, { data: this.data }, this.configdata.dataChangeMethod);
                    }
                },
                deep: true
            },
            configdata: {
                handler (n) {
                    if (n && n.blm) {
                        this.componentName = n.blm;
                        if (!this.$root.componentRefs) {
                            this.$root.componentRefs = {};
                        }
                        this.$root.componentRefs[this.componentName] = this;
                        this.zjConfigdata = this.commonsJs.deepClone(n);
                        if (n.addConfigdata) {
                            Object.assign(this.zjConfigdata, this.commonsJs.funcEval1(this, {}, n.addConfigdata));
                        }
                        if (n.createClass) {
                            this.commonsJs.loadCssCode(n.createClass, n.blm);
                        }
                        this.initTable();
                    }
                },
                deep: true,
                immediate: true
            },
            zjConfigdata: {
                handler (n) {
                    if (this.zjConfigdata.blm) {
                        if (this.zjConfigdata.createClass) {
                            this.commonsJs.loadCssCode(this.zjConfigdata.createClass, n.blm);
                        }
                    }
                },
                deep: true,
                immediate: true
            },
            propstocomponent: {
                handler () {
                    if (this.configdata.propsChangeMethod) {
                        this.commonsJs.funcEval1(this, {}, this.configdata.propsChangeMethod)
                    }
                },
                deep: true,
                immediate: true
            }
        },
        beforeUnmount () {
            // if (this.$options.components) {
            //     for (let key in this.$options.components) {
            //         delete this.$options.components[key];
            //     }
            // }
            // delete this.$root.componentRefs[this.componentName];
            // this.commonsJs.removeCssCode(this.componentName);
        }
    };
</script>
