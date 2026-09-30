<template>
  <div class="ai-agent-app-recommend">
    <Spin v-if="loading" fix>加载中...</Spin>

    <div class="sub-title-row">
      <h3 class="sub-title">智能体推荐管理</h3>
      <div class="sub-title-actions">
        <Button @click="goAppList">返回应用列表</Button>
      </div>
    </div>

    <!-- 统计 + 筛选 -->
    <div class="filter-bar">
      <div class="stat">
        <span class="stat-label">已推荐</span>
        <span class="stat-num">{{ recommendedCount }}</span>
        <span class="stat-divider">/</span>
        <span class="stat-total">{{ apps.length }} 个应用</span>
      </div>
      <div class="filter-controls">
        <Input v-model="keyword" placeholder="按名称搜索" clearable style="width: 220px" @on-change="filterApps" />
        <Select v-model="recommendFilter" style="width: 140px; margin-left: 8px" @on-change="filterApps">
          <Option value="all" label="全部" />
          <Option value="recommended" label="仅已推荐" />
          <Option value="unrecommended" label="仅未推荐" />
        </Select>
        <Button icon="md-refresh" style="margin-left: 8px" @click="load">刷新</Button>
      </div>
    </div>

    <Table :columns="columns" :data="filteredApps" border>
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
      <template #enabled="{ row }">
        <Tag :color="row.enabled ? 'success' : 'default'">{{ row.enabled ? '已启用' : '草稿' }}</Tag>
      </template>
      <template #isRecommended="{ row }">
        <Tag :color="row.isRecommended ? 'warning' : 'default'">{{ row.isRecommended ? '推荐' : '—' }}</Tag>
      </template>
      <template #useCount="{ row }">
        <span :class="['use-count', { hot: row.useCount > 0 }]">{{ row.useCount || 0 }}</span>
      </template>
      <template #action="{ row }">
        <Button type="text" style="color:#19be6b" :disabled="!row.enabled" @click="goRun(row)">运行</Button>
        <Button type="text" :style="{ color: row.isRecommended ? '#ed4014' : '#f90' }" @click="handleRecommend(row)">
          {{ row.isRecommended ? '取消推荐' : '设为推荐' }}
        </Button>
      </template>
    </Table>

    <div class="tips">
      <i class="fa-solid fa-circle-info"></i>
      仅「已启用 且 已推荐」的应用会出现在用户端智能体首页的「推荐智能体」区。推荐状态由系统管理员在此统一维护。
    </div>
  </div>
</template>

<script>
import { Message } from 'view-ui-plus';
import { agentAppList, agentAppRecommend } from '@/api/agentApp';

export default {
  name: 'AiAgentAppRecommend',
  data () {
    return {
      loading: false,
      apps: [],
      keyword: '',
      recommendFilter: 'all',
      filteredApps: [],
      columns: [
        { title: '应用', slot: 'avatar', minWidth: 200 },
        { title: '描述', key: 'description', minWidth: 240, ellipsis: true, tooltip: true },
        { title: '类型', slot: 'appType', width: 110 },
        { title: '启用', slot: 'enabled', width: 90 },
        { title: '推荐', slot: 'isRecommended', width: 90 },
        { title: '使用次数', slot: 'useCount', width: 100, align: 'center' },
        { title: '操作', slot: 'action', width: 200, fixed: 'right' }
      ]
    };
  },
  computed: {
    recommendedCount () {
      return this.apps.filter(a => a.isRecommended).length;
    }
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
        this.filterApps();
      } catch (e) {
        Message.error('加载应用列表失败');
      } finally {
        this.loading = false;
      }
    },
    // 按名称 + 推荐状态过滤
    filterApps () {
      const kw = (this.keyword || '').trim().toLowerCase();
      this.filteredApps = this.apps.filter(a => {
        if (kw && !(a.name || '').toLowerCase().includes(kw)) return false;
        if (this.recommendFilter === 'recommended' && !a.isRecommended) return false;
        if (this.recommendFilter === 'unrecommended' && a.isRecommended) return false;
        return true;
      });
    },
    async handleRecommend (row) {
      try {
        await agentAppRecommend(row.id, !row.isRecommended);
        Message.success(row.isRecommended ? '已取消推荐' : '已设为推荐');
        // 重新拉取：后端按「推荐优先 + 使用次数倒序」排序，刷新后顺序与计数同步
        await this.load();
      } catch (e) {
        Message.error('操作失败');
      }
    },
    goAppList () {
      this.$router.push({ name: 'ai-agent-app' });
    },
    // 跳运行对话页（未启用的应用不可运行，与 AgentAppList 一致）
    // 携带 from=recommend，运行页「返回」据此时回推荐管理页而非应用列表
    goRun (row) {
      if (!row.enabled) {
        Message.warning('该应用未启用，无法运行');
        return;
      }
      this.$router.push({ name: 'ai-agent-app-run', params: { id: row.id }, query: { from: 'recommend' } });
    }
  }
};
</script>

<style lang="less" scoped>
.ai-agent-app-recommend {
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
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  .stat {
    display: flex;
    align-items: baseline;
    gap: 6px;
    .stat-label { font-size: 13px; color: #808695; }
    .stat-num { font-size: 20px; font-weight: 600; color: #f90; }
    .stat-divider { color: #c5c8ce; margin: 0 2px; }
    .stat-total { font-size: 13px; color: #808695; }
  }
  .filter-controls { display: flex; align-items: center; }
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
.use-count {
  font-weight: 600;
  color: #c5c8ce;
  &.hot { color: #f90; }
}
.tips {
  margin-top: 12px;
  font-size: 12px;
  color: #808695;
  i { color: #2d8cf0; margin-right: 4px; }
}
</style>
