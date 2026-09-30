<template>
  <div class="ai-qak-list">
    <Spin v-if="loading" fix>加载中...</Spin>

    <div class="sub-title-row">
      <h3 class="sub-title">问答库管理</h3>
      <div class="sub-title-actions">
        <Button type="primary" icon="md-add" @click="openAddModal">添加问答</Button>
        <Button icon="md-download" :loading="exporting" @click="handleExport">导出Excel</Button>
        <Button type="error" icon="md-trash" @click="handleBatchDelete">批量删除</Button>
      </div>
    </div>

    <!-- 查询条件 -->
    <div class="search-row">
      <Input v-model="searchForm.question" placeholder="问题" clearable style="width:220px" @on-enter="handleSearch" />
      <Select v-model="searchForm.forceanswer" placeholder="强制回答" clearable style="width:140px">
        <Option value="1">是</Option>
        <Option value="0">否</Option>
      </Select>
      <Button type="primary" icon="md-search" @click="handleSearch">查询</Button>
      <Button icon="md-refresh" @click="handleReset">重置</Button>
    </div>

    <!-- 数据表格 -->
    <Table :columns="columns" :data="tableData" border @on-selection-change="onSelectionChange">
      <template #forceanswer="{ row }">
        <Tag v-if="row.forceanswer === '1'" color="success">是</Tag>
        <Tag v-else color="default">否</Tag>
      </template>
      <template #action="{ row }">
        <Button type="text" style="color:#2d8cf0" @click="openEditModal(row)">编辑</Button>
        <Button type="text" style="color:#ed4014" @click="handleDelete(row)">删除</Button>
      </template>
    </Table>

    <!-- 分页 -->
    <div class="page-row">
      <Page
        :total="total"
        :current="pageNum"
        :page-size="pageSize"
        show-total
        show-sizer
        :page-size-opts="[10, 20, 50, 100]"
        @on-change="onPageChange"
        @on-page-size-change="onPageSizeChange"
      />
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <Modal v-model="modalVisible" :title="modalTitle" :width="680" :mask-closable="false" footer-hide>
      <Form ref="qakForm" :model="formData" :rules="formRules" :label-width="100">
        <FormItem label="问题" prop="question">
          <Input v-model="formData.question" type="textarea" :rows="3" placeholder="请输入问题" />
        </FormItem>
        <FormItem label="答案" prop="answer">
          <Input v-model="formData.answer" type="textarea" :rows="4" placeholder="请输入答案" />
        </FormItem>
        <FormItem label="强制回答" prop="forceanswer">
          <Select v-model="formData.forceanswer" transfer>
            <Option value="1">是</Option>
            <Option value="0">否</Option>
          </Select>
        </FormItem>
      </Form>
      <div class="modal-footer">
        <Button @click="modalVisible = false">取消</Button>
        <Button type="primary" :loading="saving" @click="handleSave">确定</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
    import {
        qakListPage,
        qakSave,
        qakDelete,
        qakBatchDelete,
        qakExportExcel
    } from '@/api/qak';

    export default {
        name: 'AiQakList',

        data () {
            return {
                loading: false,
                exporting: false,
                saving: false,
                modalVisible: false,
                editMode: false, // false=新增, true=编辑
                selectedIds: [],
                // 查询条件（对应 QakPage 的筛选字段）
                searchForm: { question: '', forceanswer: '' },
                pageNum: 1,
                pageSize: 10,
                total: 0,
                tableData: [],
                formData: this.getEmptyForm(),
                formRules: {
                    question: [{ required: true, message: '问题不能为空', trigger: 'blur' }],
                    answer: [{ required: true, message: '答案不能为空', trigger: 'blur' }]
                },
                columns: [
                    { type: 'selection', width: 55, align: 'center' },
                    { title: '问题', key: 'question', minWidth: 220, tooltip: true },
                    { title: '答案', key: 'answer', minWidth: 280, tooltip: true },
                    { title: '强制回答', slot: 'forceanswer', width: 100, align: 'center' },
                    { title: '操作', slot: 'action', width: 140, align: 'center', fixed: 'right' }
                ]
            };
        },

        computed: {
            modalTitle () {
                return this.editMode ? '编辑问答' : '添加问答';
            }
        },

        mounted () {
            this.loadData();
        },

        methods: {
            getEmptyForm () {
                return {
                    id: null,
                    question: '',
                    answer: '',
                    forceanswer: '0'
                };
            },

            // 组装查询参数：仅携带非空筛选条件，避免空串干扰后端 <if> 判断
            buildQuery () {
                const q = { pageNum: this.pageNum, pageSize: this.pageSize };
                const s = this.searchForm;
                if (s.question) q.question = s.question;
                if (s.forceanswer !== '' && s.forceanswer !== null && s.forceanswer !== undefined) {
                    q.forceanswer = s.forceanswer;
                }
                return q;
            },

            async loadData () {
                this.loading = true;
                try {
                    const res = await qakListPage(this.buildQuery());
                    // listPage 返回 PageHelper 的 PageInfo：{ list, total, pageNum, pageSize, pages, ... }
                    if (res && Array.isArray(res.list)) {
                        this.tableData = res.list;
                        this.total = typeof res.total === 'number' ? res.total : res.list.length;
                    } else if (Array.isArray(res)) {
                        // 兼容直接返回数组的情况
                        this.tableData = res;
                        this.total = res.length;
                    } else {
                        this.tableData = [];
                        this.total = 0;
                    }
                } catch (e) {
                    this.$Message.error('加载问答列表失败');
                } finally {
                    this.loading = false;
                }
            },

            handleSearch () {
                this.pageNum = 1;
                this.loadData();
            },

            handleReset () {
                this.searchForm = { question: '', forceanswer: '' };
                this.pageNum = 1;
                this.loadData();
            },

            onPageChange (p) {
                this.pageNum = p;
                this.loadData();
            },

            onPageSizeChange (s) {
                this.pageSize = s;
                this.pageNum = 1;
                this.loadData();
            },

            onSelectionChange (selection) {
                this.selectedIds = selection.map(r => r.id);
            },

            openAddModal () {
                this.editMode = false;
                this.formData = this.getEmptyForm();
                this.modalVisible = true;
                this.$nextTick(() => {
                    this.$refs.qakForm && this.$refs.qakForm.resetFields();
                });
            },

            openEditModal (row) {
                this.editMode = true;
                this.formData = Object.assign(this.getEmptyForm(), row);
                this.modalVisible = true;
                this.$nextTick(() => {
                    this.$refs.qakForm && this.$refs.qakForm.clearValidate();
                });
            },

            handleSave () {
                this.$refs.qakForm.validate(async (valid) => {
                    if (!valid) return;
                    this.saving = true;
                    try {
                        // 后端 save：id 有值走 update，无值走 add
                        await qakSave(this.formData);
                        this.$Message.success(this.editMode ? '修改成功' : '添加成功');
                        this.modalVisible = false;
                        this.loadData();
                    } catch (e) {
                        // 响应拦截器已弹出错误提示
                    } finally {
                        this.saving = false;
                    }
                });
            },

            handleDelete (row) {
                this.$Modal.confirm({
                    title: '确认删除',
                    content: '确定要删除该问答吗？',
                    onOk: async () => {
                        try {
                            await qakDelete({ id: row.id });
                            this.$Message.success('删除成功');
                            // 删除当前页最后一条时回退一页
                            if (this.tableData.length === 1 && this.pageNum > 1) {
                                this.pageNum--;
                            }
                            this.loadData();
                        } catch (e) {
                            // 响应拦截器已弹出错误提示
                        }
                    }
                });
            },

            handleBatchDelete () {
                if (!this.selectedIds.length) {
                    this.$Message.warning('请先选择要删除的记录');
                    return;
                }
                const count = this.selectedIds.length;
                this.$Modal.confirm({
                    title: '确认批量删除',
                    content: `确定要删除选中的 ${count} 条问答吗？`,
                    onOk: async () => {
                        try {
                            await qakBatchDelete(this.selectedIds);
                            this.$Message.success('批量删除成功');
                            // 删除当前页全部时回退一页
                            if (this.tableData.length === count && this.pageNum > 1) {
                                this.pageNum--;
                            }
                            this.selectedIds = [];
                            this.loadData();
                        } catch (e) {
                            // 响应拦截器已弹出错误提示
                        }
                    }
                });
            },

            async handleExport () {
                this.exporting = true;
                try {
                    const res = await qakExportExcel(this.buildQuery());
                    let blob = res && res.data ? res.data : res;
                    // 后端异常时会返回 JSON 错误体（也被当作 blob 接收），这里做一次兜底识别；
                    // 仅当确实是 Blob 且类型为 JSON 时才判定为错误，避免把正常的 xlsx 二进制流误判成失败
                    if (blob instanceof Blob && blob.type && blob.type.indexOf('application/json') !== -1) {
                        const text = await blob.text();
                        this.$Message.error('导出失败：' + text);
                        return;
                    }
                    // 兜底：极少数情况下 responseType:'blob' 未生效，拿到的是字符串，包成 Blob 再下载
                    if (!(blob instanceof Blob)) {
                        blob = new Blob([blob], { type: 'application/vnd.ms-excel' });
                    }
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.download = 'qak.xlsx';
                    a.href = url;
                    // 挂到 DOM 上再触发点击，部分浏览器对未挂载的 a.click() 不触发下载
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    this.$Message.success('导出成功');
                } catch (e) {
                    this.$Message.error('导出失败');
                } finally {
                    this.exporting = false;
                }
            }
        }
    };
</script>

<style scoped>
.ai-qak-list { width: 100%; position: relative; }
.sub-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.sub-title { font-size: 15px; font-weight: 600; color: #17233d; margin: 0; padding-left: 12px; border-left: 4px solid #2d8cf0; }
.sub-title-actions { display: flex; gap: 8px; }
.search-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.page-row { display: flex; justify-content: flex-end; margin-top: 12px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
</style>
