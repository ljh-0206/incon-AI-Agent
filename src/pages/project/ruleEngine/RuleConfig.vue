<template>
  <div class="rule-config-page">
    <!-- 顶部标题栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2>规则配置</h2>
      </div>
      <div class="header-right">
        <Button type="primary" @click="handleCreate">
          <Icon type="md-add" />新建规则
        </Button>
      </div>
    </div>

    <!-- 搜索筛选栏 -->
    <Card class="search-card">
      <Form :label-width="80" inline>
        <FormItem label="规则名称">
          <Input v-model="searchForm.ruleName" placeholder="请输入规则名称" style="width: 200px" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model="searchForm.status" placeholder="请选择" style="width: 100px" clearable>
            <Option value="1">启用</Option>
            <Option value="0">禁用</Option>
          </Select>
        </FormItem>
        <FormItem>
          <Button type="primary" @click="handleSearch">
            <Icon type="ios-search" />搜索
          </Button>
          <Button @click="handleReset" style="margin-left: 8px">
            <Icon type="ios-refresh" />重置
          </Button>
        </FormItem>
      </Form>
    </Card>

    <!-- 规则列表 -->
    <RuleList
      ref="ruleListRef"
      :search-form="searchForm"
      @edit="handleEdit"
      @bind-sql="handleBindSql"
      @view-log="handleViewLog"
      @delete="handleDelete"
    />

    <!-- 规则编辑弹窗 -->
    <Modal
      v-model="editModalVisible"
      :title="isEdit ? '编辑规则' : '新建规则'"
      fullscreen
      footer-hide
      :mask-closable="false"
      class-name="rule-edit-modal"
    >
      <div class="edit-modal-content">
        <!-- 画布模式 -->
        <RuleCanvas
          v-if="editModalVisible"
          :rule-id="currentRuleId"
          :rule-name="currentRuleName"
          :priority="currentPriority"
          :block-when-fail="currentBlockWhenFail"
          :status="currentStatus"
          :initial-expr="canvasExpr"
          @save="handleCanvasSave"
          @cancel="editModalVisible = false"
        />
      </div>
    </Modal>

    <!-- 绑定SQL弹窗 -->
    <Modal
      v-model="bindSqlModalVisible"
      title="绑定SQL"
      fullscreen
      footer-hide
      :mask-closable="false"
    >
      <RuleSqlRel
        v-if="bindSqlModalVisible"
        :rule-id="currentRuleId"
        :rule-name="currentRuleName"
        @close="bindSqlModalVisible = false"
        @refresh="loadRuleList"
      />
    </Modal>

    <!-- 执行日志弹窗 -->
    <Modal
      v-model="logModalVisible"
      title="执行日志"
      fullscreen
      footer-hide
      :mask-closable="false"
    >
      <RuleLog
        v-if="logModalVisible"
        :rule-id="currentRuleId"
      />
    </Modal>
  </div>
</template>

<script>
import { incoRequest, request } from '@/api/common.js'
import RuleList from './RuleList.vue'
import RuleCanvas from './components/RuleCanvas.vue'
import RuleSqlRel from './components/RuleSqlRel.vue'
import RuleLog from './components/RuleLog.vue'

export default {
  name: 'RuleConfig',
  components: {
    RuleList,
    RuleCanvas,
    RuleSqlRel,
    RuleLog
  },
  data() {
    return {
      searchForm: {
        ruleName: '',
        status: ''
      },
      editModalVisible: false,
      isEdit: false,
      currentRuleId: '',
      currentRuleName: '',
      currentPriority: 100,
      currentBlockWhenFail: false,
      currentStatus: '1',
      canvasExpr: '',
      bindSqlModalVisible: false,
      logModalVisible: false
    }
  },
  methods: {
    loadRuleList() {
      if (this.$refs.ruleListRef) {
        this.$refs.ruleListRef.loadData()
      }
    },
    handleSearch() {
      // 搜索时重置到第一页
      if (this.$refs.ruleListRef) {
        this.$refs.ruleListRef.pagination.pageNum = 1
      }
      this.loadRuleList()
    },
    handleReset() {
      this.searchForm = {
        ruleName: '',
        status: ''
      }
      // 重置时也重置页码
      if (this.$refs.ruleListRef) {
        this.$refs.ruleListRef.pagination.pageNum = 1
      }
      this.loadRuleList()
    },
    handleCreate() {
      this.isEdit = false
      this.currentRuleId = ''
      this.currentRuleName = ''
      this.currentPriority = 100
      this.currentBlockWhenFail = true
      this.currentStatus = '1'
      this.canvasExpr = ''
      this.editModalVisible = true
    },
    handleEdit(row) {
      this.isEdit = true
      this.currentRuleId = row.id
      this.currentRuleName = row.rule_name || ''
      this.currentPriority = row.priority || 100
      this.currentBlockWhenFail = row.block_when_fail == '1' || row.block_when_fail == 1
      this.currentStatus = String(row.status) || '1'

      // rule_expr 统一使用 {nodes, connections} 格式
      // 兼容旧格式 {preExec, condition}，转换为 {nodes, connections}
      const ruleExpr = row.rule_expr || ''
      let parsedExpr = {}
      try {
        parsedExpr = ruleExpr ? JSON.parse(ruleExpr) : {}
      } catch (e) {
        parsedExpr = {}
      }

      // 如果是旧格式 {preExec, condition}，转换为新格式 {nodes, connections}
      if (parsedExpr.preExec || parsedExpr.condition) {
        this.canvasExpr = JSON.stringify(this.convertLegacyToCanvas(parsedExpr))
      } else {
        // 新格式直接使用
        this.canvasExpr = ruleExpr
      }

      this.editModalVisible = true
    },
    // 将旧格式 {preExec, condition} 转换为画布格式 {nodes, connections}
    convertLegacyToCanvas(expr) {
      const nodes = []
      const connections = []
      let nodeIndex = 0
      const xOffset = 100

      // 添加START节点
      const startNode = {
        id: `node_${nodeIndex++}`,
        type: 'START',
        label: '开始',
        x: xOffset,
        y: 200,
        config: {}
      }
      nodes.push(startNode)

      // 添加preExec节点
      const preExec = expr.preExec || []
      preExec.forEach((item, idx) => {
        const nodeType = this.mapPreExecTypeToCanvas(item.type)
        const preExecNode = {
          id: `node_${nodeIndex++}`,
          type: nodeType,
          label: item.id || item.type,
          x: xOffset + (idx + 1) * 180,
          y: 200,
          config: this.convertPreExecItemToConfig(item)
        }
        nodes.push(preExecNode)
        connections.push({
          id: `conn_${connections.length}`,
          sourceNodeId: idx === 0 ? startNode.id : nodes[nodes.length - 2].id,
          targetNodeId: preExecNode.id,
          sourcePort: 'output',
          targetPort: 'input'
        })
      })

      // 添加条件节点
      const condition = expr.condition || { type: 'AND', rules: [] }
      const conditionNode = {
        id: `node_${nodeIndex++}`,
        type: condition.type === 'AND' ? 'AND' : 'OR',
        label: condition.type === 'AND' ? 'AND条件' : 'OR条件',
        x: xOffset + (preExec.length + 1) * 180,
        y: 200,
        config: {
          conditions: condition.rules || []
        }
      }
      nodes.push(conditionNode)
      connections.push({
        id: `conn_${connections.length}`,
        sourceNodeId: preExec.length > 0 ? nodes[nodes.length - 2].id : startNode.id,
        targetNodeId: conditionNode.id,
        sourcePort: 'output',
        targetPort: 'input'
      })

      // 添加失败节点
      const onFailure = expr.onFailure || {}
      const failNode = {
        id: `node_${nodeIndex++}`,
        type: 'END_FAIL',
        label: '失败',
        x: xOffset + (preExec.length + 2) * 180,
        y: 120,
        config: {
          block: onFailure.block !== false,
          message: onFailure.message || '',
          errorCode: onFailure.errorCode || ''
        }
      }
      nodes.push(failNode)

      const passNode = {
        id: `node_${nodeIndex++}`,
        type: 'END_PASS',
        label: '通过',
        x: xOffset + (preExec.length + 2) * 180,
        y: 280,
        config: {}
      }
      nodes.push(passNode)

      // 连接条件到失败和通过
      connections.push({
        id: `conn_${connections.length}`,
        sourceNodeId: conditionNode.id,
        targetNodeId: failNode.id,
        sourcePort: 'false',
        targetPort: 'input'
      })
      connections.push({
        id: `conn_${connections.length}`,
        sourceNodeId: conditionNode.id,
        targetNodeId: passNode.id,
        sourcePort: 'true',
        targetPort: 'input'
      })

      return { nodes, connections }
    },
    mapPreExecTypeToCanvas(type) {
      const typeMap = {
        'SQL': 'SQL_QUERY',
        'BEAN': 'BEAN_CALL',
        'CALL_RULE': 'RULE_CHAIN',
        'CALL_SQLID': 'CALL_SQLID',
        'CALL_BEAN': 'CALL_BEAN'
      }
      return typeMap[type] || 'SQL_QUERY'
    },
    convertPreExecItemToConfig(item) {
      const config = {}
      if (item.sqlId) {
        config.sqlId = item.sqlId
        config.params = item.params || {}
      } else if (item.beanClass) {
        config.beanClass = item.beanClass
        config.beanMethod = item.beanMethod
        config.params = item.params || {}
      } else if (item.ruleId) {
        config.ruleId = item.ruleId
        config.chainRules = [{ ruleId: item.ruleId }]
      }
      return config
    },
    async handleCanvasSave(data) {
      try {
        // 新增时生成ID
        if (!this.isEdit) {
          data.id = this.commonsJs.sys_guid()
        }
        if (this.isEdit) {
          await incoRequest('update', 'RULE_CONFIG_UPDATE', data)
        } else {
          await incoRequest('insert', 'RULE_CONFIG_ADD', data)
        }
        // 保存成功后刷新规则缓存
        await this.refreshRuleCache(data.id)
        this.$Message.success(this.isEdit ? '更新成功' : '新增成功')
        this.editModalVisible = false
        this.loadRuleList()
      } catch (error) {
        this.$Message.error('保存失败: ' + (error.message || '未知错误'))
      }
    },
    async refreshRuleCache(ruleId) {
      try {
        await request({ url: '/rule/refreshCache/' + ruleId, method: 'post' })
      } catch (error) {
        console.warn('刷新规则缓存失败', error)
      }
    },
    handleBindSql(row) {
      this.currentRuleId = row.id
      this.currentRuleName = row.rule_name
      this.bindSqlModalVisible = true
    },
    handleViewLog(row) {
      this.currentRuleId = row.id
      this.currentRuleName = row.rule_name
      this.logModalVisible = true
    },
    handleDelete(row) {
      this.$Modal.confirm({
        title: '确认删除',
        content: `确定要删除规则"${row.rule_name}"吗？`,
        onOk: async () => {
          try {
            await incoRequest('delete', 'RULE_CONFIG_DELETE', { id: row.id })
            this.$Message.success('删除成功')
            // 删除后重置到第一页并刷新
            if (this.$refs.ruleListRef) {
              this.$refs.ruleListRef.pagination.pageNum = 1
              this.$refs.ruleListRef.loadData()
            }
          } catch (error) {
            this.$Message.error('删除失败: ' + (error.message || '未知错误'))
          }
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.rule-config-page {
  padding: 16px;
  background: #f5f5f5;
  min-height: 100%;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .header-left h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }

  .search-card {
    margin-bottom: 16px;
  }
}
</style>

<style lang="less">
.rule-edit-modal {
  .edit-modal-content {
    height: calc(100vh - 120px);
    overflow: hidden;
  }
}
</style>
