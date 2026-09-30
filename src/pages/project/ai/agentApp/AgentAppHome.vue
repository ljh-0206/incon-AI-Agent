<template>
  <div class="ai-agent-app-home">
    <Spin v-if="loading" fix>加载中...</Spin>

    <!-- 推荐智能体 -->
    <section class="home-section">
      <div class="section-header">
        <h3 class="section-title"><i class="fa-solid fa-star"></i> 推荐智能体</h3>
        <span class="section-sub">平台推荐的精品智能体</span>
      </div>
      <div class="card-grid" v-if="recommended.length">
        <div class="app-card" v-for="app in recommended" :key="app.id">
          <div class="card-top">
            <div class="card-avatar"><i :class="app.avatar || 'fa-solid fa-robot'"></i></div>
            <div class="card-head">
              <div class="card-name">{{ app.name }}</div>
              <Tag :color="app.appType === 'workflow' ? 'warning' : 'primary'" size="small">
                {{ app.appType === 'workflow' ? '工作流模式' : '标准模式' }}
              </Tag>
            </div>
          </div>
          <div class="card-desc">{{ app.description || '暂无描述' }}</div>
          <div class="card-actions">
            <Button type="text" style="color:#19be6b" @click="goRun(app)">使用</Button>
            <Button type="text" :style="{color: isFavorited(app) ? '#ed4014' : '#2d8cf0'}" @click="handleFavorite(app)">
              {{ isFavorited(app) ? '取消收藏' : '收藏' }}
            </Button>
          </div>
        </div>
      </div>
      <div class="empty-state" v-else>
        <i class="fa-solid fa-star" style="font-size:36px;color:#e8eaed"></i>
        <p>暂无推荐智能体</p>
      </div>
    </section>

    <!-- 我的智能体 -->
    <section class="home-section">
      <div class="section-header">
        <div class="section-title-area">
          <h3 class="section-title"><i class="fa-solid fa-user"></i> 我的智能体</h3>
          <span class="section-sub">我创建的智能体</span>
        </div>
        <div class="section-actions">
          <Button type="primary" icon="md-add" @click="goEdit(null)">新建应用</Button>
          <Button icon="md-cog" @click="goWorkspace">工作空间</Button>
        </div>
      </div>
      <div class="card-grid" v-if="mine.length">
        <div class="app-card" v-for="app in mine" :key="app.id">
          <div class="card-top">
            <div class="card-avatar"><i :class="app.avatar || 'fa-solid fa-robot'"></i></div>
            <div class="card-head">
              <div class="card-name">{{ app.name }}</div>
              <Tag :color="app.appType === 'workflow' ? 'warning' : 'primary'" size="small">
                {{ app.appType === 'workflow' ? '工作流模式' : '标准模式' }}
              </Tag>
            </div>
          </div>
          <div class="card-desc">{{ app.description || '暂无描述' }}</div>
          <div class="card-actions">
            <Button type="text" style="color:#19be6b" @click="goRun(app)" :disabled="!app.enabled">使用</Button>
            <Button type="text" style="color:#2d8cf0" @click="goEdit(app.id)">编辑</Button>
          </div>
        </div>
      </div>
      <div class="empty-state" v-else>
        <i class="fa-solid fa-robot" style="font-size:36px;color:#e8eaed"></i>
        <p>暂未创建智能体，点击「新建应用」开始</p>
      </div>
    </section>

    <!-- 收藏智能体 -->
    <section class="home-section">
      <div class="section-header">
        <div class="section-title-area">
          <h3 class="section-title"><i class="fa-solid fa-heart"></i> 收藏智能体</h3>
          <span class="section-sub">我收藏的所有智能体</span>
        </div>
      </div>
      <div class="card-grid" v-if="favorites.length">
        <div class="app-card" v-for="app in favorites" :key="app.id">
          <div class="card-top">
            <div class="card-avatar"><i :class="app.avatar || 'fa-solid fa-robot'"></i></div>
            <div class="card-head">
              <div class="card-name">{{ app.name }}</div>
              <Tag :color="app.appType === 'workflow' ? 'warning' : 'primary'" size="small">
                {{ app.appType === 'workflow' ? '工作流模式' : '标准模式' }}
              </Tag>
            </div>
          </div>
          <div class="card-desc">{{ app.description || '暂无描述' }}</div>
          <div class="card-actions">
            <Button type="text" style="color:#19be6b" @click="goRun(app)" :disabled="!app.enabled">使用</Button>
            <Button type="text" style="color:#ed4014" @click="handleUnfavorite(app)">取消收藏</Button>
          </div>
        </div>
      </div>
      <div class="empty-state" v-else>
        <i class="fa-solid fa-heart" style="font-size:36px;color:#e8eaed"></i>
        <p>暂无收藏智能体</p>
      </div>
    </section>
  </div>
</template>

<script>
import { Message } from 'view-ui-plus';
import {
  agentAppRecommended,
  agentAppMine,
  agentAppFavorites,
  agentAppFavorite,
  agentAppUnfavorite
} from '@/api/agentApp';

export default {
  name: 'AiAgentAppHome',
  data () {
    return {
      loading: false,
      recommended: [],
      mine: [],
      favorites: []
    };
  },
  mounted () {
    this.loadAll();
  },
  methods: {
    async loadAll () {
      this.loading = true;
      try {
        // 并行加载三区块
        const [rec, mine, fav] = await Promise.all([
          agentAppRecommended(),
          agentAppMine(),
          agentAppFavorites()
        ]);
        this.recommended = rec || [];
        this.mine = mine || [];
        this.favorites = fav || [];
      } catch (e) {
        Message.error('加载首页数据失败');
      } finally {
        this.loading = false;
      }
    },
    // 跳运行对话页（未启用的应用不可使用）
    goRun (app) {
      if (!app.enabled) {
        Message.warning('该应用未启用，无法使用');
        return;
      }
      this.$router.push({ name: 'ai-agent-app-run', params: { id: app.id } });
    },
    goEdit (id) {
      this.$router.push({ name: 'ai-agent-app-edit', params: id ? { id } : {} });
    },
    goWorkspace () {
      this.$router.push({ name: 'ai-agent-workspace' });
    },
    // 判断应用是否已被当前用户收藏（推荐区按钮状态依据）
    isFavorited (app) {
      return this.favorites.some(f => f.id === app.id);
    },
    // 收藏 / 取消收藏 切换：与收藏区共享 favorites 数组，状态联动
    async handleFavorite (app) {
      const fav = this.isFavorited(app);
      try {
        if (fav) {
          await agentAppUnfavorite(app.id);
          this.favorites = this.favorites.filter(a => a.id !== app.id);
          Message.success('已取消收藏');
        } else {
          await agentAppFavorite(app.id);
          // 加入收藏区头部（与后端按收藏时间倒序一致）
          this.favorites = [app, ...this.favorites];
          Message.success('已收藏');
        }
      } catch (e) {
        Message.error('操作失败');
      }
    },
    // 取消收藏：本地直接移除卡片
    async handleUnfavorite (app) {
      try {
        await agentAppUnfavorite(app.id);
        Message.success('已取消收藏');
        this.favorites = this.favorites.filter(a => a.id !== app.id);
      } catch (e) {
        Message.error('操作失败');
      }
    }
  }
};
</script>

<style lang="less" scoped>
.ai-agent-app-home {
  position: relative;
  padding: 16px;
}
.home-section {
  margin-bottom: 28px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  .section-title-area {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    i {
      color: #6366f1;
      margin-right: 6px;
    }
  }
  .section-sub {
    font-size: 12px;
    color: #808695;
  }
  .section-actions {
    display: flex;
    gap: 8px;
  }
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.app-card {
  background: #fff;
  border: 1px solid #efefef;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  transition: box-shadow .2s;
  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, .08);
  }
}
.card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.card-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.card-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.card-name {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-desc {
  font-size: 13px;
  color: #808695;
  margin: 6px 0 10px;
  min-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
}
.empty-state {
  text-align: center;
  color: #c5c8ce;
  padding: 40px;
  font-size: 14px;
  background: #fff;
  border: 1px dashed #e8eaed;
  border-radius: 10px;
  p {
    margin: 10px 0 0;
  }
}
</style>
