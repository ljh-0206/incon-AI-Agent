<template>
  <div class="rule-log" :style="{ height: containerHeight + 'px' }">
    <!-- 搜索条件 -->
    <Form :label-width="80" inline class="search-form">
      <FormItem label="开始时间">
        <DatePicker
          v-model="searchForm.startTime"
          type="date"
          placeholder="选择开始日期"
          style="width: 140px"
          format="yyyy-MM-dd"
          @on-change="val => searchForm.startTime = val"
        />
      </FormItem>
      <FormItem label="结束时间">
        <DatePicker
          v-model="searchForm.endTime"
          type="date"
          placeholder="选择结束日期"
          style="width: 140px"
          format="yyyy-MM-dd"
          @on-change="val => searchForm.endTime = val"
        />
      </FormItem>
      <FormItem label="通过状态">
        <Select v-model="searchForm.passed" placeholder="请选择" style="width: 100px" clearable>
          <Option value="1">通过</Option>
          <Option value="0">失败</Option>
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

    <!-- 日志列表 -->
    <div class="table-wrapper">
      <Table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        stripe
        border
        size="small"
        :height="350"
      >
        <template #passed="{ row }">
          <Tag :color="row.PASSED == 1 ? 'success' : 'error'">
            {{ row.PASSED == 1 ? '通过' : '失败' }}
          </Tag>
        </template>
        <template #action="{ row }">
          <Button type="info" size="small" @click="handleViewDetail(row)">
            <Icon type="ios-eye-outline" />详情
          </Button>
        </template>
      </Table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <Page
        :total="pagination.total"
        :current="pagination.pageNum"
        :page-size="pagination.pageSize"
        @on-change="handlePageChange"
        @on-page-size-change="handlePageSizeChange"
        show-total
        show-sizer
      />
    </div>

    <!-- 详情弹窗 -->
    <Modal
      v-model="detailModalVisible"
      title="日志详情"
      width="800"
      footer-hide
    >
      <div class="log-detail" v-if="currentLog">
        <Row :gutter="16" class="detail-row">
          <Col span="12">
            <label>规则名称：</label>
            <span>{{ currentLog.RULE_NAME }}</span>
          </Col>
          <Col span="12">
            <label>SQLID：</label>
            <span>{{ currentLog.SQL_ID || '-' }}</span>
          </Col>
        </Row>
        <Row :gutter="16" class="detail-row">
          <Col span="12">
            <label>触发时机：</label>
            <span>{{ currentLog.TRIGGER_TIME }}</span>
          </Col>
          <Col span="12">
            <label>执行结果：</label>
            <Tag :color="currentLog.PASSED == 1 ? 'success' : 'error'">
              {{ currentLog.PASSED == 1 ? '通过' : '失败' }}
            </Tag>
          </Col>
        </Row>
        <Row :gutter="16" class="detail-row">
          <Col span="12">
            <label>耗时：</label>
            <span>{{ currentLog.COST_TIME }}ms</span>
          </Col>
          <Col span="12">
            <label>执行时间：</label>
            <span>{{ currentLog.EXECUTE_TIME }}</span>
          </Col>
        </Row>
        <Row :gutter="16" class="detail-row" v-if="currentLog.BLOCK_REASON">
          <Col span="24">
            <label>阻断原因：</label>
            <span class="error-text">{{ currentLog.BLOCK_REASON }}</span>
          </Col>
        </Row>
        <Row :gutter="16" class="detail-row" v-if="currentLog.PRE_EXEC_RESULT">
          <Col span="24">
            <label>前置执行结果：</label>
            <div class="json-content">{{ formatJson(currentLog.PRE_EXEC_RESULT) }}</div>
          </Col>
        </Row>
        <Row :gutter="16" class="detail-row" v-if="currentLog.CONDITION_RESULT">
          <Col span="24">
            <label>条件评估结果：</label>
            <span>{{ currentLog.CONDITION_RESULT }}</span>
          </Col>
        </Row>
        <Row :gutter="16" class="detail-row" v-if="currentLog.EXTRA_DATA">
          <Col span="24">
            <label>额外数据：</label>
            <div class="json-content">{{ formatJson(currentLog.EXTRA_DATA) }}</div>
          </Col>
        </Row>
      </div>
    </Modal>
  </div>
</template>

<script>
import { ruleLogList, ruleLogDetail } from '@/api/system.js'

export default {
  name: 'RuleLog',
  props: {
    ruleId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      searchForm: {
        startTime: '',
        endTime: '',
        passed: ''
      },
      columns: [
        {
          title: '规则名称',
          key: 'RULE_NAME',
          minWidth: 150,
          ellipsis: true
        },
        {
          title: 'SQLID',
          key: 'SQL_ID',
          minWidth: 120,
          ellipsis: true
        },
        {
          title: '触发时机',
          key: 'TRIGGER_TIME',
          width: 90,
          align: 'center'
        },
        {
          title: '执行结果',
          slot: 'passed',
          width: 90,
          align: 'center'
        },
        {
          title: '耗时',
          key: 'COST_TIME',
          width: 70,
          align: 'center',
          render: (h, params) => {
            return h('span', params.row.COST_TIME + 'ms')
          }
        },
        {
          title: '执行时间',
          key: 'EXECUTE_TIME',
          minWidth: 160
        },
        {
          title: '阻断原因',
          key: 'BLOCK_REASON',
          minWidth: 150,
          ellipsis: true
        },
        {
          title: '操作',
          slot: 'action',
          width: 80,
          align: 'center',
          fixed: 'right'
        }
      ],
      tableData: [],
      loading: false,
      pagination: {
        total: 0,
        pageNum: 1,
        pageSize: 10
      },
      detailModalVisible: false,
      currentLog: null,
      containerHeight: 500
    }
  },
  mounted() {
    this.loadData()
    this.calculateContainerHeight()
    window.addEventListener('resize', this.calculateContainerHeight)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.calculateContainerHeight)
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const params = {
          ruleId: this.ruleId,
          pageNum: this.pagination.pageNum,
          pageSize: this.pagination.pageSize
        }
        if (this.searchForm.startTime) {
          params.startTime = this.searchForm.startTime
        }
        if (this.searchForm.endTime) {
          params.endTime = this.searchForm.endTime
        }
        if (this.searchForm.passed !== '') {
          params.passed = this.searchForm.passed
        }
        const res = await ruleLogList(params)
        if (res) {
          this.tableData = res.records || res.list || []
          this.pagination.total = res.total || 0
        }
      } catch (error) {
        this.$Message.error('加载日志列表失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.pagination.pageNum = 1
      this.loadData()
    },
    handleReset() {
      this.searchForm = {
        startTime: '',
        endTime: '',
        passed: ''
      }
      this.pagination.pageNum = 1
      this.loadData()
    },
    handlePageChange(page) {
      this.pagination.pageNum = page
      this.loadData()
    },
    handlePageSizeChange(pageSize) {
      this.pagination.pageSize = pageSize
      this.loadData()
    },
    async handleViewDetail(row) {
      try {
        const logId = row.ID
        if (!logId) {
          this.$Message.error('日志ID不存在')
          return
        }
        const res = await ruleLogDetail({ id: logId })
        if (res) {
          this.currentLog = res
          this.detailModalVisible = true
        }
      } catch (error) {
        this.$Message.error('加载日志详情失败')
      }
    },
    formatJson(str) {
      try {
        const obj = typeof str === 'string' ? JSON.parse(str) : str
        return JSON.stringify(obj, null, 2)
      } catch (e) {
        return str
      }
    },
    calculateContainerHeight() {
      const clientHeight = document.documentElement.clientHeight
      this.containerHeight = clientHeight - 150
      if (this.containerHeight < 300) {
        this.containerHeight = 300
      }
    }
  }
}
</script>

<style lang="less" scoped>
.rule-log {
  display: flex;
  flex-direction: column;

  .search-form {
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  .table-wrapper {
    flex: 1;
    .ivu-table-wrapper {
      height: 100% !important;
    }
  }

  .pagination-wrapper {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
  }

  .log-detail {
    .detail-row {
      margin-bottom: 12px;
      line-height: 32px;

      label {
        font-weight: 500;
        color: #666;
      }

      .error-text {
        color: #ed4014;
      }

      .json-content {
        background: #f5f5f5;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 150px;
        overflow-y: auto;
      }
    }
  }
}
</style>
