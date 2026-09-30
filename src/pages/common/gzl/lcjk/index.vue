<template>
    <div style="height:100%">
        <Modal v-model="modal_zjdbr" title="用户" width="900" :mask-closable="false">
            <i-Form @submit.native.prevent ref="formInline" :model="formInline" inline>
                <row>
                    <Form-Item label="关键字" :label-width="150">
                        <i-Input type="text" v-model="formInline.p_yhgjz" style="width:100px"></i-Input>
                    </Form-Item>
                    <Form-Item label="角色" :label-width="150">
                        <jselect v-model="formInline.p_yhjs" :list="jsList"></jselect>
                    </Form-Item>
                    <Form-Item>
                        <Button type="info" @click="query_zjdbr()">查询</Button>
                    </Form-Item>
                </row>

            </i-Form>
            <gzlPageable ref="selection_yh" v-model:data="data_yh" :columns="columns_yh"
                         :height="300"
                         url="/gzlshywlc/queryYhjsList" :param="formInline" highlight-row>

            </gzlPageable>

            <div slot="footer">
                <Button type="text" @click="madal_shck=false">取消</Button>
                <Button type="info" @click="zjdbr_qd">确定</Button>
            </div>
        </Modal>

        <Modal v-model="madal_shck" title="审核查看" width="900" :mask-closable="false">
            <div>
                <i-Table border ref="selection" :columns="columns_dbr" :data="data_dbr" :height="300"
                         style="width:100%">
                </i-Table>
            </div>
            <div>
                <gzlshxq ref="gzlshxq" :sfxsjd="true" :sfxsjdsh="true" height_sfxsjdsh_table="200"></gzlshxq>
            </div>
            <div slot="footer">
                <Button type="text" @click="madal_shck=false">取消</Button>
                <Button type="info" v-if="rows.sfyzz=='0'" @click="zjdbr">手动追加待办</Button>
                <Button type="info" v-if="rows.sfyzz=='0'" @click="jsdbr">计算当前待办</Button>
            </div>
        </Modal>

        <form method="post" id="queryform" name="queryform">
            <input type="hidden" ref="ywlcdm" name="ywlcdm" id="ywlcdm"/>
            <input ref="ywlcslid" type="hidden" name="ywlcslid" id="ywlcslid"/>
            <input ref="dbjddm" type="hidden" name="dbjddm" id="dbjddm"/>
            <input type="hidden" name="_header" value="001"/>
        </form>
        <Layout style="height:100%">
            <div ref="queryHeader">
                <i-Form @submit.native.prevent ref="formInline" :model="formInline" inline>
                    <row>
                        <i-Col :lg="{ span:3}" :xl="{ span: 3}">
                            <Form-Item label="标题" :label-width="50">
                                <i-Input type="text" v-model="formInline.pageBt" placeholder="标题"
                                         style="width:100px"></i-Input>
                            </Form-Item>
                        </i-Col>
                        <i-Col :lg="{ span: 5}" :xl="{ span: 5}">
                            <Form-Item label="业务流程代码/名称/id" :label-width="150">
                                <i-Input type="text" v-model="formInline.pageYwlcgjz" placeholder="业务流程代码/名称/id"
                                         style="width:180px"></i-Input>
                            </Form-Item>
                        </i-Col>

                        <i-Col :lg="{ span: 3}" :xl="{ span: 3}">
                            <Form-Item label="状态" :label-width="50">
                                <i-Select style="width:150px" clearable v-model="formInline.pageSfyzz">
                                    <i-Option value="1">终止</i-Option>
                                    <i-Option value="2">办结</i-Option>
                                    <i-Option value="0">运行</i-Option>
                                </i-Select>
                            </Form-Item>
                        </i-Col>
                        <template>
                            <i-Col :lg="{ span: 4}" :xl="{ span: 4}">
                                <Form-Item label="创建人" :label-width="70">
                                    <i-Input type="text" v-model="formInline.pageCjr" placeholder="创建人"
                                             style="width:100px"></i-Input>
                                </Form-Item>
                            </i-Col>
                        </template>
                        <i-Col :lg="{ span: 6}" :xl="{ span: 6}">
                            <Form-Item>
                                <Button type="info" @click="handleSubmit()">查询</Button>
                                <Button type="info" @click="jsdbr_pl()" style="margin-left:5px;margin-right:5px">
                                    计算待办
                                </Button>
                                <Button type="info" @click="zjdbr_pl()">追加待办</Button>
                            </Form-Item>
                        </i-Col>
                    </row>
                </i-Form>
            </div>
            <i-Content>
                <i-Table border ref="selection" :columns="columns1" :data="data1" style="width:100%">
                    <template #handle="sport">
                        <incoicon icon="fa-database" title="查看事务详情" @click="swxqck(sport.row)"></incoicon>
                        <incoicon icon="fa-database" title="查看业务详情" @click="ywlcshck(sport.row)"></incoicon>
                        <Button type="info" size="small" @click="ywlcshck(sport.row)">查看</Button>
                        <Button type="error" size="small" v-if="sport.row.sfyzz=='0'" @click="zz(sport.row)">终止
                        </Button>
                        <Button type="info" size="small" v-if="sport.row.sfyzz=='0'" @click="cz(sport.row)">重置
                        </Button>
                    </template>
                </i-Table>
                <Page ref="page" :total="page.total" :current="page.pageNum" :page-size="page.pageSize"
                      :page-size-opts="pageSizeOpts"
                      show-sizer
                      show-elevator
                      show-total
                      @on-change="handlePage"
                      @on-page-size-change='handlePageSize'/>
            </i-Content>
        </Layout>
    </div>
</template>
<script>
    import gzlPageable from '../gzlsz/gzlPageable.vue'
    import gzlshxq from '../gzlshxq.vue'
    import { mapState, mapGetters } from 'vuex'

    export default {
        components: { gzlshxq, gzlPageable },
        props: {},
        data () {
            return {
                ywlcdm_ywlcslid_str: '',
                modal_zjdbr: false,
                data_yh: [],
                rows: {},
                madal_shck: false,
                columns1:
                    [
                        { type: 'selection', width: 60, align: 'center', key: '_disabled' },
                        {
                            title: '查询sql',
                            key: 'ywlcslid',
                            sortable: 'custom',
                            width: 550,
                            render: (h, params) => {
                                let str = '';
                                str += 'select t.*,t.' + params.row.ywbdbrzdm + ' from ' + params.row.ywbm + ' t where ' + params.row.ywbidzdm + "='" + params.row.ywlcslid + "'";
                                return h('span', str);
                            }
                        },
                        { title: '流程代码', key: 'ywlcdm', sortable: 'custom', width: 130 },
                        { title: '流程名称', key: 'ywlcmc', sortable: 'custom', width: 140 },
                        { title: '标题', key: 'ywlcslbt', sortable: 'custom', minWidth: 160 },
                        {
                            title: '发起人/时间',
                            key: 'ywlcslcjrxmsj',
                            sortable: 'custom',
                            width: 200,
                            render: (h, params) => {
                                return h('span', params.row.ywlcslcjrxm + '：' + params.row.ywlcslcjsj);
                            }
                        },
                        { title: '审核状态', key: 'yshjdztxsmc', sortable: 'custom', width: 120 },
                        {
                            title: '实例状态',
                            key: 'sfyzz',
                            sortable: 'custom',
                            width: 100,
                            render: (h, params) => {
                                let sfyzzmc = '';
                                if (params.row.sfyzz == '0') {
                                    sfyzzmc = '运行中';
                                } else if (params.row.sfyzz == '1') {
                                    sfyzzmc = '终止';
                                } else if (params.row.sfyzz == '2') {
                                    sfyzzmc = '办结';
                                }

                                return h('span', sfyzzmc);
                            }

                        },
                        {
                            title: '操作',
                            key: 'action',
                            fixed: 'right',
                            width: 110,
                            slot: 'handle'
                        }
                    ],

                columns_dbr:
                    [
                        { title: '待办人', key: 'dbr', sortable: 'custom' },
                        { title: '待办人姓名', key: 'dbrxm', sortable: 'custom' },
                        { title: '待办人角色代码', key: 'dbrjsdm', sortable: 'custom' },
                        { title: '待办人角色名称', key: 'dbrjsmc', sortable: 'custom' }
                    ],

                columns_yh:
                    [
                        { type: 'selection', width: 60, align: 'center' },
                        { title: '用户代码', key: 'dbr', sortable: 'custom' },
                        { title: '用户名称', key: 'dbrxm', sortable: 'custom' },
                        { title: '角色代码', key: 'dbrjsdm', sortable: 'custom' },
                        { title: '角色名称', key: 'dbrjsmc', sortable: 'custom' }
                    ],
                data1: [],
                data_dbr: [],
                formInline: {
                    pageBt: '',
                    pageYwlclbdm: '',
                    pageYwlcgjz: '',
                    pageSfyzz: '',
                    p_yhgjz: '',
                    p_yhjs: '',
                    pageCjr: ''
                },
                dbjddm: '',
                ywlcdm: '',
                ywlcslid: '',
                shxqlj: '',
                swxqcklj: '',
                ywlcshcklj: '',
                page: {
                    pageNum: 1,
                    pageSize: 20,
                    total: 0
                },
                pageSizeOpts: [10, 20, 30, 50, 100],
                jsList: [],
                jsListConfig: {
                    listBm: 'T_XT_XTCSMKB',
                    listDm: 'dm',
                    listMc: 'mc'
                }
            }
        },
        methods: {
            gettableformListByBm () {
                this.commonsJs.incoRequest('querylist', 'DC37EB84F52E3520E0555943CA7634DE', this.jsListConfig).then((res) => {
                    this.jsList = res
                })
            },
            handlePage: function handlePage (value) {
                this.page.pageNum = value;
                this.PostByPage(this.page.url, this.page.data, this.page.func, true);
            },
            handlePageSize: function handlePageSize (value) {
                if (this.page.func) {
                    this.page.pageSize = value;
                    this.PostByPage(this.page.url, this.page.data, this.page.func, true);
                }
            },
            PostByPage: function PostByPage (url, data, func, flag) {
                this.loading = true;
                this.page.url = url;
                this.page.data = data;
                this.page.func = func;
                const self = this;
                if (flag) {
                    Object.assign(data, { pageNum: this.page.pageNum, pageSize: this.page.pageSize });
                } else {
                    Object.assign(data, { pageNum: 1, pageSize: this.page.pageSize });
                }
                self.commonsJs.selfRequest(url, data).then(res => {
                    if (res.total) {
                    } else {
                        if (res.content) {
                            if (res.content.total) {
                                res = res.content;
                            }
                        }
                    }
                    self.page.total = res.total;
                    self.page.pageNum = res.pageNum;
                    self.loading = false;
                    func(res);
                })
            },
            query_zjdbr: function () {
                this.$refs.selection_yh.query();
            },
            jsdbr: function () {
                this.ywlcdm_ywlcslid_str = this.rows.ywlcdm + '@' + this.rows.ywlcslid + ',';
                this.jsdbr_qd();
            },
            jsdbr_pl: function () {
                const self = this;
                const arr = self.$refs.selection.getSelection();
                if (arr.length == 0) {
                    self.$Message.info({
                        background: true,
                        duration: 5,
                        content: '请选择要操作的数据！'
                    });
                    return;
                }
                self.ywlcdm_ywlcslid_str = '';
                arr.forEach((vv, ii) => {
                    self.ywlcdm_ywlcslid_str += vv.ywlcdm + '@' + vv.ywlcslid + ',';
                })
                this.jsdbr_qd();
            },
            jsdbr_qd: function () {
                const self = this;
                self.$Spin.show();
                self.commonsJs.selfRequest('/gzlshywlc/updJsdbr', this.ywlcdm_ywlcslid_str).then(res => {
                    setTimeout(function () {
                        self.$Spin.hide();
                    }, 500);
                    if (res.jg == '1') {
                        self.$Message.success({
                            background: true,
                            duration: 5,
                            content: '操作成功'
                        });

                        self.modal_zjdbr = false;
                        if (self.madal_shck) {
                            self.ywlcshck(self.rows);
                        } else {
                            self.handleSubmit();
                        }
                    } else {
                        self.$Message.error({
                            background: true,
                            closable: true,
                            duration: 10,
                            content: res.error
                        });
                    }
                })
            },

            zjdbr: function () {
                this.data_yh = [];
                this.ywlcdm_ywlcslid_str = this.rows.ywlcdm + '@' + this.rows.ywlcslid + ',';
                this.modal_zjdbr = true;
            },
            zjdbr_pl: function () {
                const self = this;
                const arr = self.$refs.selection.getSelection();
                if (arr.length == 0) {
                    self.$Message.info({
                        background: true,
                        duration: 5,
                        content: '请选择要操作的数据！'
                    });
                    return;
                }
                self.ywlcdm_ywlcslid_str = '';
                arr.forEach((vv, ii) => {
                    self.ywlcdm_ywlcslid_str += vv.ywlcdm + '@' + vv.ywlcslid + ',';
                })
                this.data_yh = [];
                this.modal_zjdbr = true;
            },

            zjdbr_qd: function () {
                const self = this;
                const arr = self.$refs.selection_yh.getSelection();
                if (arr.length == 0) {
                    self.$Message.info({
                        background: true,
                        duration: 5,
                        content: '请选择要操作的数据！'
                    });
                    return;
                }
                let str = '';
                arr.forEach((vv, ii) => {
                    str += vv.dbr + '@' + vv.dbrjsdm + '@' + vv.dbrxm + '@' + vv.dbrjsmc + ',';
                })
                self.$Spin.show();

                self.commonsJs.selfRequest('/gzlshywlc/updZjdbr', { ywlcdm_ywlcslid_str: this.ywlcdm_ywlcslid_str, str }).then(res => {
                    setTimeout(function () {
                        self.$Spin.hide();
                    }, 500);
                    if (res.jg == '1') {
                        self.$Message.success({
                            background: true,
                            duration: 5,
                            content: '操作成功'
                        });

                        self.modal_zjdbr = false;
                        if (self.madal_shck) {
                            self.ywlcshck(self.rows);
                        } else {
                            self.handleSubmit();
                        }
                    } else {
                        self.$Message.error({
                            background: true,
                            closable: true,
                            duration: 10,
                            content: res.error
                        });
                    }
                })
            },

            handleSubmit: function () {
                const self = this
                self.$Spin.show();
                this.PostByPage('/gzlshywlc/queryShywlcjkPage', this.formInline, function (res) {
                    setTimeout(function () {
                        self.$Spin.hide();
                    }, 500);
                    self.data1 = res.list;
                })
            },
            // 终止
            zz: function (params) {
                const self = this
                self.commonsJs.selfRequest('/gzlshywlc/updShywlcZz', { ywlcdm: params.ywlcdm, ywlcslid: params.ywlcslid }).then(res => {
                    setTimeout(function () {
                        self.$Spin.hide();
                    }, 500);
                    if (res.jg == '1') {
                        self.$Message.success({
                            background: true,
                            duration: 5,
                            content: '操作成功'
                        });

                        self.handleSubmit()
                    } else {
                        self.$Message.error({
                            background: true,
                            closable: true,
                            duration: 10,
                            content: res.error
                        });
                    }
                })
            },
            // 终止
            cz: function (params) {
                const self = this
                self.commonsJs.selfRequest('/gzlshywlc/updShywlcCz', { ywlcdm: params.ywlcdm, ywlcslid: params.ywlcslid }).then(res => {
                    if (res.jg == '1') {
                        self.$Message.success({
                            background: true,
                            duration: 5,
                            content: '操作成功'
                        });

                        self.handleSubmit()
                    } else {
                        self.$Message.error({
                            background: true,
                            closable: true,
                            duration: 10,
                            content: res.error
                        });
                    }
                })
            },
            ywlcshck: function (rows) {
                const self = this;
                self.$Spin.show();
                self.commonsJs.selfRequest('/gzlshywlc/queryDbrList', { ywlcslid: rows.ywlcslid, ywlcdm: rows.ywlcdm }).then(res => {
                    self.$refs.gzlshxq.query(rows.ywlcdm, rows.ywlcslid);
                    self.madal_shck = true;
                    self.rows = rows;
                    setTimeout(function () {
                        self.$Spin.hide();
                    }, 500);
                    if (res.jg == '1') {
                        self.data_dbr = res.data_dbr;
                    } else {
                        self.$Message.error({
                            background: true,
                            closable: true,
                            duration: 10,
                            content: '操作失败'
                        });
                    }
                })
            }
        },
        computed: {
            ...mapState('admin/user', ['info'])
        },
        mounted () {
            this.gettableformListByBm()
        }
    }
</script>
