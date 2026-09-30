<template>
    <div>
        <i-Table @on-expand="onExpand" :row-class-name="rowClassName" :stripe="stripe"
                 :highlight-row="highlightRow" :height="height"
                 ref="refrandom" :loading="load" border :size="size" :columns="columns" :data="data"
                 @on-row-click="onRowClick"
                 @on-select="onSelect"
                 @on-select-cancel="onSelectCancel"
                 @on-select-all="onSelectAll"
                 @on-select-all-cancel="onSelectAllCancel"
                 @on-sort-change="onsortchange"
        >
            <template v-for="col in columns" v-if="col.slot" v-slot="scope" :slot="col.slot">
                <slot :name="col.slot" :row="scope.row" :index="scope.index"></slot>
            </template>
        </i-Table>
        <Page :total="page.total" :size="pageTagSize" :current="page.pageNum" :page-size="page.pageSize"
              :page-size-opts="pageSizeOpts"
              :show-sizer="showSizer"
              :show-elevator="showElevator"
              show-total
              @on-change="handlePage"
              @on-page-size-change='handlePageSize'>
        </Page>
    </div>
</template>
<script>
    export default {
        name: 'gzl-pageable',
        components: {},
        props: {
            columns: Array,
            param: Object,
            url: String,
            height: Number,
            size: String,
            pageTagSize: String,
            data: {
                type: Array,
                default: function () {
                    return []
                }
            },
            showSizer: {
                type: Boolean,
                default: true
            },
            showElevator: {
                type: Boolean,
                default: true
            },
            stripe: {
                type: Boolean,
                default: false
            },
            highlightRow: {
                type: Boolean,
                default: false
            },
            rowClassName: {
                type: Function,
                default: function () {
                    return '';
                }
            }

        },
        data () {
            return {
                load: false,
                pageSizeOpts: [10, 20, 30, 50, 100],
                page: {
                    pageNum: 1,
                    pageSize: null,
                    total: null
                },
                otherHeight: 0
            }
        },

        methods: {
            onSelect: function (selection, row) {
                this.$emit('on-select', selection, row)
            },
            onSelectCancel: function (selection, row) {
                this.$emit('on-select-cancel', selection, row)
            },
            onSelectAll: function (selection) {
                this.$emit('on-select-all', selection)
            },
            onSelectAllCancel: function (selection) {
                this.$emit('on-select-all-cancel', selection)
            },
            clear: function () {
                this.data = []
                this.page.total = 0
                this.page.pageNum = 1
            },
            query: function (param) {
                const self = this
                self.load = true
                Object.assign(this.param, { pageNum: this.page.pageNum, pageSize: this.page.pageSize })

                self.commonsJs.selfRequest(self.url, self.param).then(res => {
                    if (res.content) {
                        self.$emit('update:data', res.content.list)
                        self.page.total = res.content.total
                    } else {
                        self.$emit('update:data', res.list)
                        self.page.total = res.total
                    }
                    self.load = false
                })
                this.$emit('on-refresh')
            },
            refresh: function () {
                this.query(this.page.pageNum)
            },
            handlePage: function (value) {
                this.page.pageNum = value
                this.query()
            },
            handlePageSize: function (value) {
                if (value && value > 0) {
                    this.page.pageSize = value
                    this.query()
                }
            },
            onRowClick: function (row, index) {
                this.$emit('on-row-click', row, index)
            },
            onExpand: function (row, status) {
                this.$emit('on-expand', row, status)
            },
            getSelection: function () {
                return this.$refs[this.refrandom].getSelection();
                return this.$refs.refrandom.getSelection();
            },
            setingPageSize: function (val) {
                const size = parseInt(Math.floor((val * 1) / 42)) - 1
                this.pageSizeOpts = this.pageSizeOpts.slice(0, 4);
                if (this.pageSizeOpts.indexOf(size) == -1) {
                    if (size > 0) {
                        this.pageSizeOpts.push(size)
                    }
                }
                const self = this
                self.$nextTick(function () {
                    self.page.pageSize = size
                })
            },
            // 页面列表排序
            onsortchange: function (c, k, o) {
                this.$emit('on-sort-change', c, k, o)
            }
        },
        computed: {},
        watch: {},
        mounted () {
        }
    }
</script>
