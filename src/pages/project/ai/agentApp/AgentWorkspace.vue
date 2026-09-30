<template>
  <div class="agent-workspace">
    <div class="sub-title-row">
      <h3 class="sub-title">智能体工作空间</h3>
      <Button @click="back">返回</Button>
    </div>

    <div class="entry-grid">
      <div class="entry-card" @click="go('ai-agent-app')">
        <div class="entry-icon-wrap" style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
          <i class="fa-solid fa-robot"></i>
        </div>
        <div class="entry-title">智能体应用</div>
        <div class="entry-desc">管理智能体应用配置、发布与启用，标准模式 / 工作流模式</div>
      </div>

      <div class="entry-card" @click="go('ai-workflow')">
        <div class="entry-icon-wrap" style="background:linear-gradient(135deg,#f59e0b,#f97316)">
          <i class="fa-solid fa-sitemap"></i>
        </div>
        <div class="entry-title">工作流</div>
        <div class="entry-desc">可视化编排工作流，节点执行调试，AI 生成工作流</div>
      </div>

      <div class="entry-card" @click="go('ai-kb')">
        <div class="entry-icon-wrap" style="background:linear-gradient(135deg,#10b981,#059669)">
          <i class="fa-solid fa-database"></i>
        </div>
        <div class="entry-title">知识库</div>
        <div class="entry-desc">知识库与文档管理，切片配置，RAG 检索</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AiAgentWorkspace',
  methods: {
    go (name) {
      this.$router.push({ name });
    },
    back () {
      this.$router.go(-1);
    }
  }
};
</script>

<style lang="less" scoped>
.agent-workspace {
  padding: 16px;
}
.sub-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  .sub-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }
}
.entry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.entry-card {
  background: #fff;
  border: 1px solid #efefef;
  border-radius: 12px;
  padding: 28px 24px;
  cursor: pointer;
  transition: all .2s;
  text-align: center;
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, .1);
    transform: translateY(-2px);
  }
}
.entry-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
}
.entry-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}
.entry-desc {
  font-size: 13px;
  color: #808695;
  line-height: 1.5;
}
</style>
