<template>
  <div class="ai-workflow-list">
    <Spin v-if="loading" fix>加载中...</Spin>

    <div class="sub-title-row">
      <h3 class="sub-title">工作流管理</h3>
      <div class="sub-title-actions">
        <Button type="primary" icon="md-add" @click="goEdit(null)">新建工作流</Button>
        <Button icon="md-bulb" @click="goGenerator" style="margin-left:8px">AI 生成</Button>
      </div>
    </div>

    <Table :columns="columns" :data="workflows" border>
      <template #enabled="{ row }">
        <Tag :color="row.enabled ? 'success' : 'default'">{{ row.enabled ? '已启用' : '草稿' }}</Tag>
      </template>
      <template #status="{ row }">
        <Tag :color="row.status === 'published' ? 'primary' : 'default'">
          {{ statusText(row.status) }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Button type="text" style="color:#2d8cf0" @click="goEdit(row.id)">编辑</Button>
        <Button type="text" style="color:#2d8cf0" @click="handlePublish(row)">发布</Button>
        <Button type="text" style="color:#2d8cf0" @click="handleToggle(row)">{{ row.enabled ? '禁用' : '启用' }}</Button>
        <Button type="text" style="color:#2d8cf0" @click="goExecutions(row)">执行历史</Button>
        <Button type="text" style="color:#2d8cf0" @click="showOpenApi(row)">对外接口</Button>
        <Button type="text" style="color:#ed4014" @click="handleDelete(row)">删除</Button>
      </template>
    </Table>

    <!-- 对外接口 Modal -->
    <Modal v-model="openModal" :title="`对外接口 — ${current && current.name || ''}`" width="680" footer-hide>
      <div v-if="current" class="open-api-modal">
        <div class="oa-row">
          <span class="oa-label">API Key</span>
          <Input :model-value="current.apiKey" readonly style="flex:1" />
          <Button size="small" style="margin-left:8px" :loading="resetting" @click="resetWfKey">重置</Button>
          <Button size="small" style="margin-left:8px" @click="copyText(current.apiKey)">复制</Button>
        </div>
        <div class="form-tip">重置后旧 Key 立即失效；调用前需先「启用」该工作流。</div>
        <div class="oa-row" style="margin-top:14px">
          <span class="oa-label">阻塞</span>
          <code>POST {{ apiBase }}/ai/open/workflow/{{ current.id }}/run</code>
        </div>
        <div class="oa-row" style="margin-top:8px">
          <span class="oa-label">流式</span>
          <code>POST {{ apiBase }}/ai/open/workflow/{{ current.id }}/run/stream</code>
        </div>
        <div class="form-tip">请求头 <code>X-Api-Key: {{ current.apiKey }}</code>；阻塞 / 流式 body 均为输入 map（如 <code>{ "input": "..." }</code>）；查询参数 <code>streaming</code>（可空，缺省 true）、<code>showReasoning</code>（可空，缺省 false）；流式返回工作流原生 SSE 事件 <code>start/node_*/output_delta/reasoning_delta/complete/error</code>。</div>
      </div>
    </Modal>
  </div>
</template>

<script>
import { Message } from 'view-ui-plus';
import Setting from '@/setting';
import { workflowList, workflowDelete, workflowPublish, workflowToggle, workflowResetKey } from '@/api/workflow';

export default {
  name: 'AiWorkflowList',
  data () {
    return {
      loading: false,
      workflows: [],
      openModal: false,
      current: null,
      resetting: false,
      columns: [
        { title: '名称', key: 'name', minWidth: 180 },
        { title: '描述', key: 'description', minWidth: 220, ellipsis: true, tooltip: true },
        { title: '状态', slot: 'status', width: 110 },
        { title: '启用', slot: 'enabled', width: 90 },
        { title: '版本', key: 'version', width: 80 },
        { title: '创建时间', key: 'cjsj', width: 170 },
        { title: '操作', slot: 'action', width: 400, fixed: 'right' }
      ]
    };
  },
  computed: {
    apiBase () {
      return window.location.origin + (Setting.apiBaseURL || '/api');
    }
  },
  mounted () {
    this.load();
  },
  methods: {
    async load () {
      this.loading = true;
      try {
        const data = await workflowList();
        this.workflows = data || [];
      } catch (e) {
        Message.error('加载工作流列表失败');
      } finally {
        this.loading = false;
      }
    },
    statusText (status) {
      return { draft: '草稿', published: '已发布', disabled: '已禁用' }[status] || status;
    },
    goEdit (id) {
      this.$router.push({ name: 'ai-workflow-edit', params: id ? { id } : {} });
    },
    goGenerator () {
      this.$router.push({ name: 'ai-workflow-generator' });
    },
    goExecutions (row) {
      this.$router.push({ name: 'ai-workflow-edit', params: { id: row.id }, query: { tab: 'executions' } });
    },
    async handlePublish (row) {
      try {
        await workflowPublish(row.id);
        Message.success('发布成功');
        this.load();
      } catch (e) {
        Message.error('发布失败');
      }
    },
    async handleToggle (row) {
      try {
        await workflowToggle(row.id, !row.enabled);
        Message.success(row.enabled ? '已禁用' : '已启用');
        this.load();
      } catch (e) {
        Message.error('操作失败');
      }
    },
    async handleDelete (row) {
      this.$Modal.confirm({
        title: '删除确认',
        content: `确定删除工作流「${row.name}」？此操作不可恢复。`,
        onOk: async () => {
          try {
            await workflowDelete(row.id);
            Message.success('删除成功');
            this.load();
          } catch (e) {
            Message.error('删除失败');
          }
        }
      });
    },
    // ========== 对外接口 ==========
    showOpenApi (row) {
      this.current = { ...row };
      this.openModal = true;
    },
    async resetWfKey () {
      if (!this.current || !this.current.id) return;
      this.resetting = true;
      try {
        const res = await workflowResetKey(this.current.id);
        if (res && res.apiKey) {
          this.current.apiKey = res.apiKey;
          Message.success('已重置，旧密钥立即失效');
        } else {
          Message.success('已重置');
        }
      } catch (e) {
        Message.error('重置失败');
      } finally {
        this.resetting = false;
      }
    },
    copyText (text) {
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => Message.success('已复制')).catch(() => this.fallbackCopy(text));
      } else {
        this.fallbackCopy(text);
      }
    },
    fallbackCopy (text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); Message.success('已复制'); } catch (e) { Message.warning('复制失败，请手动复制'); }
      document.body.removeChild(ta);
    }
  }
};
</script>

<style lang="less" scoped>
.ai-workflow-list {
  position: relative;
  padding: 16px;
}
.sub-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  .sub-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }
}
.open-api-modal {
  .oa-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .oa-label {
    width: 64px;
    flex-shrink: 0;
    font-size: 13px;
    color: #515a6e;
  }
  code {
    background: #f1f3f5;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 12px;
    word-break: break-all;
    flex: 1;
  }
  .form-tip {
    font-size: 12px;
    color: #808695;
    margin-top: 6px;
    line-height: 1.6;
    code { background: #f1f3f5; padding: 1px 5px; border-radius: 3px; }
  }
}
</style>
