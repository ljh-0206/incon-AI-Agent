<template>
  <div class="ai-kb-list">
    <Spin v-if="loading" fix>加载中...</Spin>

    <div class="sub-title-row">
      <h3 class="sub-title">知识库管理</h3>
      <div class="sub-title-actions">
        <Button type="primary" icon="md-add" @click="openAddModal">添加知识库</Button>
        <Button type="error" icon="md-trash" @click="handleBatchDelete">批量删除</Button>
      </div>
    </div>

    <!-- 查询条件 -->
    <div class="search-row">
      <Input v-model="searchForm.kbmc" placeholder="知识库名称" clearable style="width:220px" @on-enter="handleSearch" />
      <Select v-model="searchForm.status" placeholder="状态" clearable style="width:140px" @on-change="handleSearch">
        <Option value="enabled">启用</Option>
        <Option value="disabled">停用</Option>
      </Select>
      <Button type="primary" icon="md-search" @click="handleSearch">查询</Button>
      <Button icon="md-refresh" @click="handleReset">重置</Button>
    </div>

    <!-- 数据表格 -->
    <Table :columns="columns" :data="tableData" border @on-selection-change="onSelectionChange">
      <template #status="{ row }">
        <Tag :color="row.status === 'enabled' ? 'success' : 'default'">
          {{ row.status === 'enabled' ? '启用' : '停用' }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Button type="text" style="color:#19be6b" @click="goDoc(row)">文档管理</Button>
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
      <Form ref="kbForm" :model="formData" :rules="formRules" :label-width="100">
        <FormItem label="知识库名称" prop="kbmc">
          <Input v-model="formData.kbmc" placeholder="如：招生政策库" />
        </FormItem>
        <FormItem label="描述" prop="kbms">
          <Input v-model="formData.kbms" type="textarea" :rows="3" placeholder="知识库用途说明" />
        </FormItem>
        <FormItem label="状态" prop="status">
          <Select v-model="formData.status" transfer>
            <Option value="enabled">启用</Option>
            <Option value="disabled">停用</Option>
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
        kbListPage,
        kbSave,
        kbDelete,
        kbBatchDelete
    } from '@/api/kb';

    export default {
        name: 'AiKbList',

        props: {
            // 文档管理页路径：门户复用时可指向门户路由，默认保持后台原路径
            docsPath: { type: String, default: '/ai/kbdoc' }
        },

        data () {
            return {
                loading: false,
                saving: false,
                modalVisible: false,
                editMode: false, // false=新增, true=编辑
                selectedIds: [],
                // 查询条件
                searchForm: { kbmc: '', status: '' },
                pageNum: 1,
                pageSize: 10,
                total: 0,
                tableData: [],
                formData: this.getEmptyForm(),
                formRules: {
                    kbmc: [{ required: true, message: '知识库名称不能为空', trigger: 'blur' }]
                },
                columns: [
                    { type: 'selection', width: 55, align: 'center' },
                    { title: '所属知识库', key: 'kbmc', minWidth: 180, tooltip: true },
                    { title: '描述', key: 'kbms', minWidth: 240, tooltip: true },
                    { title: '状态', slot: 'status', width: 90, align: 'center' },
                    { title: '创建时间', key: 'cjsj', width: 170 },
                    { title: '操作', slot: 'action', width: 250, align: 'center', fixed: 'right' }
                ]
            };
        },

        computed: {
            modalTitle () {
                return this.editMode ? '编辑知识库' : '添加知识库';
            }
        },

        mounted () {
            this.loadData();
        },

        methods: {
            getEmptyForm () {
                return {
                    id: null,
                    kbmc: '',
                    kbms: '',
                    status: 'enabled'
                };
            },

            // 组装查询参数：仅携带非空筛选条件，避免空串干扰后端 <if> 判断
            buildQuery () {
                const q = { pageNum: this.pageNum, pageSize: this.pageSize };
                const s = this.searchForm;
                if (s.kbmc) q.kbmc = s.kbmc;
                if (s.status !== '' && s.status !== null && s.status !== undefined) {
                    q.status = s.status;
                }
                return q;
            },

            async loadData () {
                this.loading = true;
                try {
                    const res = await kbListPage(this.buildQuery());
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
                    this.$Message.error('加载知识库列表失败');
                } finally {
                    this.loading = false;
                }
            },

            handleSearch () {
                this.pageNum = 1;
                this.loadData();
            },

            handleReset () {
                this.searchForm = { kbmc: '', status: '' };
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
                    this.$refs.kbForm && this.$refs.kbForm.resetFields();
                });
            },

            openEditModal (row) {
                this.editMode = true;
                this.formData = Object.assign(this.getEmptyForm(), row);
                this.modalVisible = true;
                this.$nextTick(() => {
                    this.$refs.kbForm && this.$refs.kbForm.clearValidate();
                });
            },

            handleSave () {
                this.$refs.kbForm.validate(async (valid) => {
                    if (!valid) return;
                    this.saving = true;
                    try {
                        // 后端 save：id 有值走 update，无值走 add
                        await kbSave(this.formData);
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

            // 行操作「文档」：跳转现有文档管理页，按该知识库过滤
            goDoc (row) {
                this.$router.push({ path: this.docsPath, query: { kbid: row.id, kbmc: row.kbmc || '' } });
            },

            handleDelete (row) {
                this.$Modal.confirm({
                    title: '确认删除',
                    content: '确定要删除该知识库吗？其下文档需在文档管理页另行清理。',
                    onOk: async () => {
                        try {
                            await kbDelete({ id: row.id });
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
                    content: `确定要删除选中的 ${count} 个知识库吗？其下文档需在文档管理页另行清理。`,
                    onOk: async () => {
                        try {
                            await kbBatchDelete(this.selectedIds);
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
            }
        }
    };
</script>

<style scoped>
.ai-kb-list { width: 100%; position: relative; }
.sub-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.sub-title { font-size: 15px; font-weight: 600; color: #17233d; margin: 0; padding-left: 12px; border-left: 4px solid #2d8cf0; }
.sub-title-actions { display: flex; gap: 8px; }
.search-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.page-row { display: flex; justify-content: flex-end; margin-top: 12px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
</style>
