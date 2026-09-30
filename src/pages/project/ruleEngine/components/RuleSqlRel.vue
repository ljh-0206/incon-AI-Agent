<template>
  <div class="rule-sql-rel">
    <div class="rel-header">
      <span>当前规则：</span>
      <Tag color="blue">{{ ruleName }}</Tag>
    </div>

    <Tabs @on-click="handleTabChange">
      <!-- 已绑定SQL -->
      <TabPane label="已绑定SQL">
        <Table
          :columns="boundColumns"
          :data="boundList"
          size="small"
          border
          :height="tableHeight"
        >
          <template #triggerTime="{ row }">
            <Select
              v-model="row.trigger_time"
              size="small"
              style="width: 100px"
              @on-change="handleTriggerTimeChange(row)"
            >
              <Option value="PRE">PRE</Option>
              <Option value="POST">POST</Option>
            </Select>
          </template>
          <template #priority="{ row }">
            <InputNumber
              v-model="row.priority"
              size="small"
              :min="1"
              :max="999"
              style="width: 80px"
              @on-blur="handlePriorityChange(row)"
            />
          </template>
          <template #action="{ row }">
            <Button type="error" size="small" @click="handleUnbind(row)">
              <Icon type="ios-link-outline" />解绑
            </Button>
          </template>
        </Table>
        <div v-if="boundList.length === 0" class="empty-tip">
          暂无绑定的SQL
        </div>
      </TabPane>

      <!-- 绑定新SQL -->
      <TabPane label="绑定新SQL">
        <div class="bind-search">
          <Input
            v-model="searchKeyword"
            placeholder="搜索SQL名称或ID"
            style="width: 200px"
            search
            @on-search="handleSearch"
          />
        </div>
        <Table
          ref="availableTable"
          :columns="availableColumns"
          :data="availableList"
          size="small"
          border
          :height="availableTableHeight"
          @on-selection-change="handleTableSelectionChange"
          class="ivu-mt-8"
        ></Table>
        <div class="pagination-wrapper">
          <Page
            :total="availablePagination.total"
            :current="availablePagination.pageNum"
            :page-size="availablePagination.pageSize"
            @on-change="handlePageChange"
            @on-page-size-change="handlePageSizeChange"
            show-total
            show-sizer
            size="small"
          />
        </div>
        <div class="bind-footer">
          <Button
            type="primary"
            @click="handleBind"
            :disabled="selectedSqlIds.length === 0"
          >
            <Icon type="ios-link-outline" />绑定选中SQL ({{ selectedSqlIds.length }})
          </Button>
        </div>
      </TabPane>
    </Tabs>
  </div>
</template>

<script>
import { incoRequest, request } from '@/api/common.js'

export default {
  name: 'RuleSqlRel',
  props: {
    ruleId: {
      type: String,
      required: true
    },
    ruleName: {
      type: String,
      default: ''
    }
  },
  emits: ['close', 'refresh'],
  data() {
    return {
      boundList: [],
      boundColumns: [
        { title: 'SQL ID', key: 'sql_id', minWidth: 180 },
        { title: 'SQL说明', key: 'sql_name', minWidth: 150 },
        { title: '触发时机', slot: 'triggerTime', width: 120 },
        { title: '优先级', slot: 'priority', width: 100 },
        { title: '操作', slot: 'action', width: 100, align: 'center' }
      ],
      availableList: [],
      availableColumns: [
        { type: 'selection', width: 70, align: 'center' },
        { title: 'SQL ID', key: 'id', minWidth: 180 },
        { title: 'SQL说明', key: 'sql_name', minWidth: 150 },
        { title: '类型', key: 'sql_type', width: 100 }
      ],
      searchKeyword: '',
      selectedSqlIds: [],
      availablePagination: {
        total: 0,
        pageNum: 1,
        pageSize: 20
      },
      tableHeight: 400,
      availableTableHeight: 300
    }
  },
  mounted() {
    this.loadBoundList()
    this.loadAvailableSqlList()
    this.calculateTableHeight()
    window.addEventListener('resize', this.calculateTableHeight)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.calculateTableHeight)
  },
  methods: {
    async loadBoundList() {
      try {
        const res = await incoRequest('queryList', 'RULE_BOUND_SQL_LIST', {
          ruleId: this.ruleId
        })
        if (res) {
          this.boundList = Array.isArray(res) ? res : []
        }
      } catch (error) {
        this.$Message.error('加载已绑定SQL失败')
      }
    },
    async loadAvailableSqlList() {
      try {
        const res = await incoRequest('queryByPage', 'SQL_LIST_FOR_BIND', {
          ruleId: this.ruleId,
          keyword: this.searchKeyword,
          pageNum: this.availablePagination.pageNum,
          pageSize: this.availablePagination.pageSize
        })
        if (res && res.list) {
          this.availableList = res.list
          this.availablePagination.total = res.total || 0
        } else if (res && res.content) {
          this.availableList = Array.isArray(res.content) ? res.content : res.content.list || []
          this.availablePagination.total = Array.isArray(res.content) ? res.content.length : res.content.total || 0
        } else {
          this.availableList = []
          this.availablePagination.total = 0
        }
      } catch (error) {
        this.$Message.error('加载可用SQL失败')
      }
    },
    handleSearch() {
      this.availablePagination.pageNum = 1
      this.loadAvailableSqlList()
    },
    handleTabChange(index) {
      // 切换到绑定新SQL标签时加载数据
      if (index === 1) {
        this.loadAvailableSqlList()
      } else if (index === 0) {
        // 切换到已绑定SQL标签时，清空选中状态
        this.selectedSqlIds = []
      }
    },
    handlePageChange(page) {
      this.availablePagination.pageNum = page
      this.loadAvailableSqlList()
    },
    handlePageSizeChange(pageSize) {
      this.availablePagination.pageSize = pageSize
      this.availablePagination.pageNum = 1
      this.loadAvailableSqlList()
    },
    handleTableSelectionChange(selection) {
      this.selectedSqlIds = selection.map(item => item.id)
    },
    async handleBind() {
      try {
        for (const sqlId of this.selectedSqlIds) {
          await incoRequest('insert', 'RULE_SQL_REL_ADD', {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sql_id: sqlId,
            rule_id: this.ruleId,
            trigger_time: 'PRE',
            priority: 100,
            czr: 'ADMIN'
          })
        }
        this.$Message.success('绑定成功')
        this.selectedSqlIds = []
        this.loadBoundList()
        this.loadAvailableSqlList()
        this.$emit('refresh')
      } catch (error) {
        this.$Message.error('绑定失败')
      }
    },
    async handleUnbind(row) {
      try {
        await incoRequest('delete', 'RULE_SQL_REL_DELETE', {
          sql_id: row.sql_id,
          rule_id: this.ruleId,
          trigger_time: row.trigger_time
        })
        this.$Message.success('解绑成功')
        this.loadBoundList()
        this.$emit('refresh')
      } catch (error) {
        this.$Message.error('解绑失败')
      }
    },
    calculateTableHeight() {
      const clientHeight = document.documentElement.clientHeight
      // 已绑定SQL表格高度
      this.tableHeight = clientHeight - 280
      if (this.tableHeight < 200) {
        this.tableHeight = 200
      }
      // 绑定新SQL表格高度（需要减去搜索、分页、底部按钮）
      this.availableTableHeight = clientHeight - 380
      if (this.availableTableHeight < 150) {
        this.availableTableHeight = 150
      }
    },
    async handleTriggerTimeChange(row) {
      try {
        await incoRequest('update', 'RULE_SQL_REL_UPDATE', {
          sql_id: row.sql_id,
          rule_id: this.ruleId,
          trigger_time: row.trigger_time,
          priority: row.priority
        })
        // 更新成功后刷新该规则的缓存
        await this.refreshRuleCache(this.ruleId)
        this.$Message.success('更新成功')
      } catch (error) {
        this.$Message.error('更新失败')
        this.loadBoundList()
      }
    },
    async handlePriorityChange(row) {
      try {
        await incoRequest('update', 'RULE_SQL_REL_UPDATE', {
          sql_id: row.sql_id,
          rule_id: this.ruleId,
          trigger_time: row.trigger_time,
          priority: row.priority
        })
        // 更新成功后刷新该规则的缓存
        await this.refreshRuleCache(this.ruleId)
        this.$Message.success('更新成功')
      } catch (error) {
        this.$Message.error('更新失败')
        this.loadBoundList()
      }
    },
    async refreshRuleCache(ruleId) {
      try {
        await request({ url: '/rule/refreshCache/' + ruleId, method: 'post' })
      } catch (error) {
        console.warn('刷新规则缓存失败', error)
      }
    }
  }
}
</script>

<style lang="less" scoped>
.rule-sql-rel {
  height: 100%;
  display: flex;
  flex-direction: column;

  .rel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e8e8e8;
    flex-shrink: 0;
  }

  .empty-tip {
    text-align: center;
    padding: 40px;
    color: #999;
  }

  .bind-search {
    margin-bottom: 8px;
    flex-shrink: 0;
  }

  .pagination-wrapper {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
  }

  .bind-footer {
    margin-top: 16px;
    text-align: center;
    flex-shrink: 0;
  }
}
</style>
