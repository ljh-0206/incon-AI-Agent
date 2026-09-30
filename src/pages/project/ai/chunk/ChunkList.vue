<template>
  <Modal
    v-model="visible"
    title="文档切片管理"
    :width="1000"
    :mask-closable="false"
    footer-hide
    :styles="{ top: '40px' }"
    @on-cancel="close"
  >
    <div class="ai-chunk-list">
      <Spin v-if="loading" fix>加载中...</Spin>

      <div class="sub-title-actions">
        <Button type="error" icon="md-trash" @click="handleBatchDelete">批量删除</Button>
        <Button icon="md-close" @click="close">关闭</Button>
      </div>

      <!-- 数据表格 -->
      <Table :columns="columns" :data="tableData" border @on-selection-change="onSelectionChange">
        <template #chipseq="{ row }">
          <Tag color="blue">{{ row.chipseq }}</Tag>
        </template>
        <template #action="{ row }">
          <Button type="text" style="color:#2d8cf0" @click="openContentModal(row)">查看内容</Button>
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

      <!-- 切片内容弹窗（CLOB） -->
      <Modal v-model="contentVisible" :title="contentTitle" :width="760" :mask-closable="false" footer-hide>
        <Spin v-if="contentLoading" fix>加载中...</Spin>
        <Input
          v-model="contentValue"
          type="textarea"
          :rows="22"
          :readonly="true"
          placeholder="（无内容）"
        />
      </Modal>
    </div>
  </Modal>
</template>

<script>
    import {
        chunkListPage,
        chunkGetBy,
        chunkDelete,
        chunkBatchDelete
    } from '@/api/chunk';

    export default {
        name: 'AiChunkList',

        data () {
            return {
                visible: false,
                loading: false,
                selectedIds: [],
                // 查询条件
                searchForm: { docid: '' },
                pageNum: 1,
                pageSize: 10,
                total: 0,
                tableData: [],
                // 内容弹窗
                contentVisible: false,
                contentLoading: false,
                contentTitle: '切片内容',
                contentValue: '',
                columns: [
                    { type: 'selection', width: 55, align: 'center' },
                    { title: '切片顺序', slot: 'chipseq', width: 100, align: 'center' },
                    { title: '切片ID', key: 'id', minWidth: 200, tooltip: true },
                    // { title: '所属文档名称', key: 'wjmc', minWidth: 200, tooltip: true },
                    { title: '字符数', key: 'chipsize', width: 100, align: 'center' },
                    { title: '创建时间', key: 'cjsj', width: 170 },
                    { title: '操作', slot: 'action', width: 200, align: 'center', fixed: 'right' }
                ]
            };
        },

        methods: {
            // 由父组件通过 $refs 调用，直接以方法参数传入 docid 打开弹窗并加载。
            // 弹窗显隐由本组件内部 visible 控制，不依赖父组件 v-model 往返，
            // 避免同一 tick 内 prop 更新时序导致弹窗无法弹出的问题。
            open (docid) {
                this.searchForm.docid = docid ? String(docid) : '';
                this.pageNum = 1;
                this.selectedIds = [];
                this.contentVisible = false;
                this.visible = true;
                this.loadData();
            },

            // 关闭弹窗并通知父组件（父组件可据此刷新文档列表的切片数）
            close () {
                this.visible = false;
                this.$emit('closed');
            },
            // 组装查询参数：仅携带非空筛选条件，避免空串干扰后端 <if> 判断
            buildQuery () {
                const q = { pageNum: this.pageNum, pageSize: this.pageSize };
                if (this.searchForm.docid) q.docid = this.searchForm.docid;
                return q;
            },

            async loadData () {
                this.loading = true;
                try {
                    const res = await chunkListPage(this.buildQuery());
                    // listPage 返回 PageHelper 的 PageInfo：{ list, total, pageNum, pageSize, pages, ... }
                    if (res && Array.isArray(res.list)) {
                        this.tableData = res.list;
                        this.total = typeof res.total === 'number' ? res.total : res.list.length;
                    } else if (Array.isArray(res)) {
                        this.tableData = res;
                        this.total = res.length;
                    } else {
                        this.tableData = [];
                        this.total = 0;
                    }
                } catch (e) {
                    this.$Message.error('加载切片列表失败');
                } finally {
                    this.loading = false;
                }
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

            // ==================== 查看内容（CLOB） ====================
            async openContentModal (row) {
                this.contentVisible = true;
                this.contentTitle = `切片内容（第 ${row.chipseq} 片 / 共 ${row.chipsize} 字）`;
                this.contentValue = '';
                this.contentLoading = true;
                try {
                    const detail = await chunkGetBy({ id: row.id });
                    this.contentValue = (detail && detail.chipcontent) || '（无内容）';
                } catch (e) {
                    this.$Message.error('加载切片内容失败');
                    this.contentValue = '';
                } finally {
                    this.contentLoading = false;
                }
            },

            // ==================== 删除 ====================
            handleDelete (row) {
                this.$Modal.confirm({
                    title: '确认删除',
                    content: '确定要删除该切片吗？',
                    onOk: async () => {
                        try {
                            await chunkDelete({ id: row.id });
                            this.$Message.success('删除成功');
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
                    this.$Message.warning('请先选择要删除的切片');
                    return;
                }
                const count = this.selectedIds.length;
                this.$Modal.confirm({
                    title: '确认批量删除',
                    content: `确定要删除选中的 ${count} 条切片吗？`,
                    onOk: async () => {
                        try {
                            await chunkBatchDelete(this.selectedIds);
                            this.$Message.success('批量删除成功');
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
.ai-chunk-list { width: 100%; position: relative; min-height: 120px; }
.sub-title-actions { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 12px; }
.page-row { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
