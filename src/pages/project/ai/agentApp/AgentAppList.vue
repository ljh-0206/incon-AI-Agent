<template>
  <div class="ai-agent-app-list">
    <Spin v-if="loading" fix>加载中...</Spin>

    <div class="sub-title-row">
      <h3 class="sub-title">智能体应用</h3>
      <div class="sub-title-actions">
        <Button icon="md-star" @click="goRecommend">推荐管理</Button>
        <Button type="primary" icon="md-add" @click="goEdit(null)">新建应用</Button>
      </div>
    </div>

    <Table :columns="columns" :data="apps" border>
      <template #avatar="{ row }">
        <div class="avatar-cell">
          <i :class="row.avatar || 'fa-solid fa-robot'" class="avatar-icon"></i>
          <span>{{ row.name }}</span>
        </div>
      </template>
      <template #appType="{ row }">
        <Tag :color="row.appType === 'workflow' ? 'warning' : 'primary'">
          {{ row.appType === 'workflow' ? '工作流模式' : '标准模式' }}
        </Tag>
      </template>
      <template #status="{ row }">
        <Tag :color="row.status === 'published' ? 'success' : 'default'">
          {{ statusText(row.status) }}
        </Tag>
      </template>
      <template #enabled="{ row }">
        <Tag :color="row.enabled ? 'success' : 'default'">{{ row.enabled ? '已启用' : '草稿' }}</Tag>
      </template>
      <template #isRecommended="{ row }">
        <Tag :color="row.isRecommended ? 'warning' : 'default'">{{ row.isRecommended ? '推荐' : '—' }}</Tag>
      </template>
      <template #cjsj="{ row }">{{ formatTime(row.cjsj) }}</template>
      <template #action="{ row }">
        <Button type="text" style="color:#19be6b" @click="goRun(row)" :disabled="!row.enabled">运行</Button>
        <Button type="text" style="color:#2d8cf0" @click="goEdit(row.id)">编辑</Button>
        <Button type="text" style="color:#2d8cf0" @click="handlePublish(row)">发布</Button>
        <Button type="text" style="color:#2d8cf0" @click="handleToggle(row)">{{ row.enabled ? '禁用' : '启用' }}</Button>
        <Button type="text" style="color:#ed4014" @click="handleDelete(row)">删除</Button>
      </template>
    </Table>
  </div>
</template>

<script>
import { Message } from 'view-ui-plus';
import { agentAppList, agentAppDelete, agentAppPublish, agentAppToggle } from '@/api/agentApp';

export default {
  name: 'AiAgentAppList',
  data () {
    return {
      loading: false,
      apps: [],
      columns: [
        { title: '应用', slot: 'avatar', minWidth: 200 },
        { title: '描述', key: 'description', minWidth: 220, ellipsis: true, tooltip: true },
        { title: '类型', slot: 'appType', width: 110 },
        { title: '状态', slot: 'status', width: 100 },
        { title: '启用', slot: 'enabled', width: 90 },
        { title: '推荐', slot: 'isRecommended', width: 80 },
        { title: '创建时间', slot: 'cjsj', width: 170 },
        { title: '操作', slot: 'action', width: 300, fixed: 'right' }
      ]
    };
  },
  mounted () {
    this.load();
  },
  methods: {
    async load () {
      this.loading = true;
      try {
        const data = await agentAppList();
        this.apps = data || [];
      } catch (e) {
        Message.error('加载应用列表失败');
      } finally {
        this.loading = false;
      }
    },
    statusText (status) {
      return { draft: '草稿', published: '已发布', disabled: '已禁用' }[status] || status;
    },
    // 后端 Date 经 Jackson 默认序列化为 ISO-8601（2026-09-21T06:59:59.000+00:00），
    // 前端格式化为本地时间（2026/9/21 14:59:59），与 WorkflowManage.formatTime 同款
    formatTime (t) {
      if (!t) return '-';
      const d = new Date(t);
      return isNaN(d.getTime()) ? String(t) : d.toLocaleString('zh-CN');
    },
    goEdit (id) {
      this.$router.push({ name: 'ai-agent-app-edit', params: id ? { id } : {} });
    },
    goRun (row) {
      this.$router.push({ name: 'ai-agent-app-run', params: { id: row.id } });
    },
    goRecommend () {
      this.$router.push({ name: 'ai-agent-app-recommend' });
    },
    async handlePublish (row) {
      try {
        await agentAppPublish(row.id);
        Message.success('发布成功');
        this.load();
      } catch (e) {
        Message.error('发布失败');
      }
    },
    async handleToggle (row) {
      try {
        await agentAppToggle(row.id, !row.enabled);
        Message.success(row.enabled ? '已禁用' : '已启用');
        this.load();
      } catch (e) {
        Message.error('操作失败');
      }
    },
    async handleDelete (row) {
      this.$Modal.confirm({
        title: '删除确认',
        content: `确定删除智能体应用「${row.name}」？此操作不可恢复。`,
        onOk: async () => {
          try {
            await agentAppDelete(row.id);
            Message.success('删除成功');
            this.load();
          } catch (e) {
            Message.error('删除失败');
          }
        }
      });
    }
  }
};
</script>

<style lang="less" scoped>
.ai-agent-app-list {
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
  .sub-title-actions {
    display: flex;
    gap: 8px;
  }
}
.avatar-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  .avatar-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }
}
</style>
