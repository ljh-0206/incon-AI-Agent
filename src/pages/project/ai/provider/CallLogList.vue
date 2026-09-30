<template>
  <div class="ai-llm-call-log-list">
    <Spin v-if="loading" fix>加载中...</Spin>

    <div class="sub-title-row">
      <h3 class="sub-title">调用日志</h3>
      <div class="sub-title-actions">
        <Button icon="md-refresh" @click="loadData">刷新</Button>
      </div>
    </div>

    <Table :columns="columns" :data="localData" border>
      <template #status="{ row }">
        <Tag :color="row.status === 'success' ? 'success' : 'error'">
          {{ row.status === 'success' ? '成功' : '失败' }}
        </Tag>
      </template>
      <template #action="{ row, index }">
        <Button type="text" style="color:#2d8cf0" @click="openDetail(row)">详情</Button>
        <Button type="text" style="color:#2d8cf0" @click="openReview(row)">复核</Button>
        <Button type="text" style="color:#ed4014" @click="handleDelete(index)">删除</Button>
      </template>
    </Table>

    <!-- 详情弹窗（含 CLOB：请求/响应内容） -->
    <Modal v-model="detailModal" title="日志详情" width="720" footer-hide>
      <div v-if="detail" class="detail-wrap">
        <p class="detail-row"><strong>供应商 id：</strong>{{ detail.provider_id || '-' }}</p>
        <p class="detail-row"><strong>模型 id：</strong>{{ detail.model_id || '-' }}</p>
        <p class="detail-row"><strong>Token：</strong>入 {{ detail.prompt_tokens || 0 }} / 出 {{ detail.completion_tokens || 0 }} / 总 {{ detail.total_tokens || 0 }}</p>
        <p class="detail-row"><strong>成本：</strong>{{ detail.cost || 0 }} 元</p>
        <p class="detail-row"><strong>耗时：</strong>{{ detail.latency_ms || 0 }} ms</p>
        <p class="detail-row"><strong>状态：</strong>{{ detail.status === 'success' ? '成功' : '失败' }}</p>
        <p class="detail-row"><strong>时间：</strong>{{ detail.inco_cjsj }}</p>
        <div v-if="detail.error_msg" class="detail-block">
          <div class="detail-label">错误信息：</div>
          <pre class="detail-pre">{{ detail.error_msg }}</pre>
        </div>
        <div class="detail-block">
          <div class="detail-label">请求内容：</div>
          <pre class="detail-pre">{{ detail.request_text || '（无）' }}</pre>
        </div>
        <div class="detail-block">
          <div class="detail-label">响应内容：</div>
          <pre class="detail-pre">{{ detail.response_text || '（无）' }}</pre>
        </div>
      </div>
    </Modal>

    <!-- 人工复核弹窗 -->
    <Modal v-model="reviewModal" title="人工复核" width="480">
      <Form :label-width="100">
        <FormItem label="调用状态">
          <Select v-model="reviewStatus" placeholder="请选择调用状态">
            <Option value="success">success（成功）</Option>
            <Option value="fail">fail（失败）</Option>
          </Select>
        </FormItem>
      </Form>
      <div slot="footer">
        <Button @click="reviewModal = false">取消</Button>
        <Button type="primary" :loading="reviewSaving" @click="saveReview">保存</Button>
      </div>
    </Modal>
  </div>
</template>

<script>
    export default {
        name: 'AiLlmCallLogList',

        data () {
            // ========== SQL ID（真实值，见 DATA_MAPPING.md） ==========
            // 日志由网关运行时写入，前端无 insert。
            const listQueryId = '59FF70BC80C08429E0631E01A8C079B5'; // 日志列表（不含 CLOB）
            const queryOneId = '59FF70BC80C18429E0631E01A8C079B5'; // 日志详情（含 CLOB）
            const updateId = '59FF70BC80C38429E0631E01A8C079B5'; // 人工复核更新状态
            const deleteId = '59FF70BC80C48429E0631E01A8C079B5'; // 运维清理
            return {
                loading: false,
                localData: [],
                columns: [
                    { title: '供应商 id', key: 'provider_id', minWidth: 180 },
                    { title: '模型 id', key: 'model_id', minWidth: 180 },
                    { title: '输入 Token', key: 'prompt_tokens', width: 100 },
                    { title: '输出 Token', key: 'completion_tokens', width: 100 },
                    { title: '总 Token', key: 'total_tokens', width: 90 },
                    { title: '成本（元）', key: 'cost', width: 100 },
                    { title: '耗时（ms）', key: 'latency_ms', width: 100 },
                    { title: '状态', slot: 'status', width: 90 },
                    { title: '时间', key: 'inco_cjsj', width: 160 },
                    { title: '操作', slot: 'action', width: 180 }
                ],
                listQueryId,
                queryOneId,
                updateId,
                deleteId,
                detailModal: false,
                detail: null,
                reviewModal: false,
                reviewSaving: false,
                reviewStatus: '',
                reviewRow: null
            };
        },

        mounted () {
            this.loadData();
        },

        methods: {
            async loadData () {
                this.loading = true;
                try {
                    const res = await this.commonsJs.incoRequest(
                        'querylist',
                        this.listQueryId,
                        { provider_id: null, model_id: null, status: null }
                    );
                    this.localData = Array.isArray(res) ? res : [];
                } catch (e) {
                    this.$Message.error('加载日志失败');
                } finally {
                    this.loading = false;
                }
            },

            async openDetail (row) {
                this.detail = null;
                this.detailModal = true;
                try {
                    const res = await this.commonsJs.incoRequest('queryone', this.queryOneId, { id: row.id });
                    this.detail = Array.isArray(res) ? res[0] : res;
                } catch (e) {
                    this.$Message.error('加载详情失败');
                }
            },

            openReview (row) {
                this.reviewRow = row;
                this.reviewStatus = row.status || '';
                this.reviewModal = true;
            },

            async saveReview () {
                if (!this.reviewRow || !this.reviewStatus) {
                    this.$Message.warning('请选择调用状态');
                    return;
                }
                this.reviewSaving = true;
                try {
                    // 保留原 error_msg（LOG_UPDATE SQL 直接赋值，需回读避免清空）
                    let errorMsg = '';
                    try {
                        const res = await this.commonsJs.incoRequest('queryone', this.queryOneId, { id: this.reviewRow.id });
                        const d = Array.isArray(res) ? res[0] : res;
                        errorMsg = (d && d.error_msg) || '';
                    } catch (e) {
                        errorMsg = '';
                    }
                    await this.commonsJs.incoRequest('update', this.updateId, {
                        id: this.reviewRow.id,
                        status: this.reviewStatus,
                        error_msg: errorMsg
                    });
                    this.$Message.success('复核已保存');
                    this.reviewModal = false;
                    this.loadData();
                } catch (e) {
                    this.$Message.error('复核保存失败');
                } finally {
                    this.reviewSaving = false;
                }
            },

            handleDelete (index) {
                const row = this.localData[index];
                this.$Modal.confirm({
                    title: '确认删除',
                    content: '确定要删除该日志记录吗？（运维清理）',
                    onOk: async () => {
                        try {
                            await this.commonsJs.incoRequest('delete', this.deleteId, { id: row.id });
                            this.$Message.success('删除成功');
                            this.loadData();
                        } catch (e) {
                            this.$Message.error('删除失败');
                        }
                    }
                });
            }
        }
    };
</script>

<style scoped>
.ai-llm-call-log-list { width: 100%; position: relative; }
.sub-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.sub-title { font-size: 15px; font-weight: 600; color: #17233d; margin: 0; padding-left: 12px; border-left: 4px solid #2d8cf0; }
.sub-title-actions { display: flex; gap: 8px; }
.detail-wrap { line-height: 1.8; }
.detail-row { margin: 4px 0; word-break: break-all; }
.detail-block { margin-top: 12px; }
.detail-label { font-weight: 600; margin-bottom: 4px; }
.detail-pre { background: #f5f5f5; padding: 10px; border-radius: 4px; max-height: 240px; overflow: auto; white-space: pre-wrap; word-break: break-all; }
</style>
