<template>
  <Card class="list-card">
    <Table
      :columns="columns"
      :data="tableData"
      :loading="loading"
      stripe
      border
    >
            <template #status="{ row }">
        <Badge status="success" text="启用" v-if="row.status == '1'" />
        <Badge status="error" text="禁用" v-else />
      </template>
      <template #action="{ row }">
        <Button type="primary" size="small" @click="handleEdit(row)" class="ivu-mr-8">
          <Icon type="ios-create-outline" />编辑
        </Button>
        <Button type="warning" size="small" @click="handleBindSql(row)" class="ivu-mr-8">
          <Icon type="ios-link-outline" />绑定SQL
        </Button>
        <Button type="default" size="small" @click="handleViewLog(row)" class="ivu-mr-8">
          <Icon type="ios-list-outline" />日志
        </Button>
        <Button type="error" size="small" @click="handleDelete(row)">
          <Icon type="ios-trash-outline" />删除
        </Button>
      </template>
    </Table>

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
  </Card>
</template>

<script>
import { incoRequest } from '@/api/common.js'

export default {
  name: 'RuleList',
  props: {
    searchForm: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      columns: [
        {
          title: '规则ID',
          key: 'id',
          width: 300,
          ellipsis: false,
          render: (h, params) => {
            return h('div', {
              style: {
                wordBreak: 'break-all',
                fontSize: '12px'
              }
            }, params.row.id)
          }
        },
        {
          title: '规则名称',
          key: 'rule_name',
          minWidth: 150
        },
        {
          title: '优先级',
          key: 'priority',
          width: 80,
          align: 'center'
        },
        {
          title: '失败阻断',
          key: 'block_when_fail',
          width: 100,
          align: 'center',
          render: (h, params) => {
            return h('Tag', {
              props: { color: params.row.block_when_fail == '1' ? 'red' : 'default' }
            }, params.row.block_when_fail == '1' ? '是' : '否')
          }
        },
        {
          title: '状态',
          slot: 'status',
          width: 100,
          align: 'center'
        },
        {
          title: '操作',
          slot: 'action',
          width: 320,
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
      searchTimer: null
    }
  },
  mounted() {
    this.loadData()
  },
  watch: {
    searchForm: {
      handler() {
        // 当搜索条件变化时自动重新加载（防抖）
        clearTimeout(this.searchTimer)
        this.searchTimer = setTimeout(() => {
          this.pagination.pageNum = 1
          this.loadData()
        }, 300)
      },
      deep: true
    }
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const params = {
          ...this.searchForm,
          pageNum: this.pagination.pageNum,
          pageSize: this.pagination.pageSize
        }
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === null) {
            delete params[key]
          }
        })
        const res = await incoRequest('queryByPage', 'RULE_CONFIG_LIST', params)
        if (res) {
          this.tableData = res.records || res.list || []
          this.pagination.total = res.total || res.count || 0
        }
      } catch (error) {
        this.$Message.error('加载规则列表失败')
      } finally {
        this.loading = false
      }
    },
    handlePageChange(page) {
      this.pagination.pageNum = page
      this.loadData()
    },
    handlePageSizeChange(pageSize) {
      this.pagination.pageSize = pageSize
      this.loadData()
    },
    handleEdit(row) {
      this.$emit('edit', row)
    },
    handleBindSql(row) {
      this.$emit('bind-sql', row)
    },
    handleViewLog(row) {
      this.$emit('view-log', row)
    },
    handleDelete(row) {
      this.$emit('delete', row)
    }
  }
}
</script>

<style lang="less" scoped>
.list-card {
  .pagination-wrapper {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
