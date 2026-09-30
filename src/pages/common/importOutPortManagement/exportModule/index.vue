<template>
    <div>
        <!--添加导出模板Modal-->
        <Modal v-model="modal" @on-visible-change="showModelChange" title="添加"  width="500" :closable="false" :mask-closable="false">
            <i-Form :model="saveform" ref="saveform" :rules="ruleValidate" :label-width="110">
                <Form-Item :label="bt_label.ywmc" prop="ywmc">
                    <i-Input v-model="saveform.ywmc"  placeholder=""  style="width: 300px"></i-Input>
                </Form-Item>
                <Form-Item :label="bt_label.tablename" prop="tablename">
                    <Auto-Complete v-model="saveform.tablename" :data="bmDataList"  @on-search="handleSearchBm" placeholder="表名" clearable maxlength="500" show-word-limit style="border:0;width:300px;"></Auto-Complete>
                </Form-Item>
                <Form-Item :label="bt_label.bz" prop="bz">
                    <i-Input v-model="saveform.bz"  placeholder="" style="width: 300px"></i-Input>
                </Form-Item>
            </i-Form>
            <div slot="footer">
                <Button type="text"  @click="cancel">取消</Button>
                <Button type="info"  @click="save">保存</Button>
            </div>
        </Modal>

        <!--维护导出模版Modal-->
        <Modal v-model="whdcmbModal" title="维护导出模板"  width="1080" fullscreen :closable="false" :mask-closable="false">
            <i-Form :model="saveWhdcmbForm" ref="saveWhdcmbForm" :rules="whdcmbValidate" :label-width="100">
                <i-Input v-model="saveWhdcmbForm.id" style="display:none"   placeholder=""></i-Input>
                <Row>
                    <i-Col span="8">
                        <Form-Item :label="bt_label.ywmc" prop="ywmc" :label-width="80">
                            <i-Input v-model="saveWhdcmbForm.ywmc" placeholder=""  style="width: 220px"></i-Input>
                        </Form-Item>
                    </i-Col>
                    <i-Col span="8">
                        <Form-Item :label="bt_label.tablename" prop="tablename">
                            <i-Input v-model="saveWhdcmbForm.tablename"  placeholder="" v-bind:readonly="isReadOnly" style="width: 220px"></i-Input>
                        </Form-Item>
                    </i-Col>
                    <i-Col span="8">
                        <Form-Item :label="bt_label.bz" prop="bz" :label-width="70">
                            <i-Input v-model="saveWhdcmbForm.bz"  placeholder="" style="width: 220px"></i-Input>
                        </Form-Item>
                    </i-Col>
                </Row>
                <Row :gutter="16">
                    <i-Col span="12">
                        <Card :padding="6">
                            <template #title>
                                <p style="text-align: center;">待添加导出字段</p>
                            </template>
                            <i-Table border :columns="columns2" :data="data2">
                                <template #dmbxlk="params">
                                    <i-Select v-model="data2[params.index].dmb_id" filterable clearable transfer>
                                        <i-Option v-for="item in dmblist" :value="item.id" :key="item.id">{{ item.tablename }}</i-Option>
                                    </i-Select>
                                </template>
                                <template #sjqxxlk="params">
                                    <i-Select v-model="data2[params.index].sjqx" clearable transfer>
                                        <i-Option v-for="item in sjqxList" :value="item.dm" :key="item.dm">{{ item.mc }}</i-Option>
                                    </i-Select>
                                </template>
                                <template #addColHandle="sport">
                                    <Button  type="success" size="small"  @click="addCol(sport)">添加</Button>
                                </template>
                            </i-Table>
                        </Card>
                    </i-Col>
                    <i-Col span="12">
                        <Card :padding="6">
                            <template #title>
                                <p style="text-align: center;">已添加导出字段</p>
                            </template>
                            <i-Table border :columns="columns3" :data="data3">
                                <template #dmbxlk="params">
                                    <i-Select v-model="data3[params.index].dmb_id" filterable clearable transfer>
                                        <i-Option v-for="item in dmblist" :value="item.id" :key="item.id">{{ item.tablename }}</i-Option>
                                    </i-Select>
                                </template>
                                <template #sjqxxlk="params">
                                    <i-Select v-model="data3[params.index].sjqx" clearable transfer>
                                        <i-Option v-for="item in sjqxList" :value="item.dm" :key="item.dm">{{ item.mc }}</i-Option>
                                    </i-Select>
                                </template>
                                <template #px_number="params">
                                    <Input-Number :min="1" v-model="data3[params.index].px"></Input-Number>
                                </template>
                                <template #delColHandle="sport">
                                    <Button  type="error" size="small"  @click="delCol(sport)">删除</Button>
                                </template>
                            </i-Table>
                        </Card>
                    </i-Col>
                </Row>
            </i-Form>
            <div slot="footer">
                <Button type="text"  @click="cancelWhdcmbModal">取消</Button>
                <Button type="info"  @click="saveWhdcmb">保存</Button>
            </div>
        </Modal>

        <Layout style="height:100%;background:#fff">
            <div ref="queryHeader">
                <i-form @submit.native.prevent ref="formInline" :model="formInline" inline>
                    <Form-Item :label="bt_label.ywmc"  :label-width="80"  >
                        <i-Input type="text" v-model="formInline.ywmc">
                        </i-Input>
                    </Form-Item>

                    <Form-Item :label="bt_label.tablename"  :label-width="90"  >
                        <i-Input type="text" v-model="formInline.tablename">
                        </i-Input>
                    </Form-Item>

                    <Form-Item>
                        <Button type="info"  @click="handleSubmit()"  >查询</Button>
                    </Form-Item>
                    <Form-Item>
                        <Button type="success" @click="add"  >添加</Button>
                    </Form-Item>
                    <Form-Item>
                        <Button type="error"  @click="del" >删除</Button>
                    </Form-Item>
                </i-form>
            </div>

            <i-Content>
                <i-Table :columns="columns1" :data="data1" ref="selection" style="width:100%">
                    <template #handle="sport">
                        <Button  type="info" size="small"  @click="whdcmb(sport.row)">维护导出模板</Button>
                        <exportcomponent :configdata="{ywid:sport.row.id,content:'导出数据',attrs:{type:'warning',size:'small'}}" style="margin-left:10px;"></exportcomponent>
                    </template>
                </i-Table>
                <Page ref="page_list" :total="page_list.total" :current="page_list.pageNum" :page-size="page_list.pageSize" :page-size-opts="pageSizeOpts_list" style="margin-top:10px"
                    show-sizer
                    show-elevator
                    show-total
                    @on-change="handlePage_list"
                    @on-page-size-change='handlePageSize_list'>
                </Page>
            </i-Content>

        </Layout>
    </div>
</template>
<script>
    export default {
        components: {},
        props: {

        },
        data () {
            return {
                page_list: {
                    pageNum: 1,
                    pageSize: 10,
                    url: null,
                    data: null,
                    func: null,
                    total: 0
                },
                pageSizeOpts_list: [10, 20, 30, 50, 100],

                modal: false,
                whdcmbModal: false,
                bt_label: {
                    ywmc: '业务名称',
                    tablename: '表名/视图名',
                    bz: '备注'
                },
                columns1: [
                    { type: 'selection', width: 60, align: 'center' },
                    { title: '业务名称', key: 'ywmc', sortable: 'custom' },
                    { title: '表名/视图名', key: 'tablename', sortable: 'custom' },
                    { title: '备注', key: 'bz', sortable: 'custom' },
                    { title: '业务ID', key: 'id', width: 260, sortable: 'custom' },
                    { title: '操作', key: 'action', width: 260, slot: 'handle' }
                ],
                columns2: [
                    { title: '字段', key: 'column_en', align: 'center' },
                    {
                        title: '列名',
                        key: 'column_zh',
                        align: 'center',
                        render: (h, params) => {
                            return h('Input', {
                                props: {
                                    value: params.row.column_zh
                                },
                                on: {
                                    'on-blur': (event) => {
                                        this.data2[params.index].column_zh = event.target.value;
                                    }
                                }
                            });
                        }
                    },
                    { title: '代码表', key: 'dmb_id', width: 110, align: 'center', slot: 'dmbxlk' },
                    { title: '数据权限', key: 'sjqx', width: 130, align: 'center', slot: 'sjqxxlk' },
                    { title: '操作', key: 'action', width: 80, align: 'center', slot: 'addColHandle' }
                ],
                columns3: [
                    { title: '导出字段', key: 'column_en', align: 'center' },
                    {
                        title: '导出列名',
                        key: 'column_zh',
                        align: 'center',
                        render: (h, params) => {
                            return h('Input', {
                                props: {
                                    value: params.row.column_zh
                                },
                                domProps: {
                                    title: params.row.column_zh
                                },
                                on: {
                                    'on-blur': (event) => {
                                        this.data3[params.index].column_zh = event.target.value;
                                    }
                                }
                            });
                        }
                    },
                    { title: '代码表', key: 'dmb_id', width: 110, align: 'center', slot: 'dmbxlk' },
                    { title: '数据权限', key: 'sjqx', width: 130, align: 'center', slot: 'sjqxxlk' },
                    { title: '排序', key: 'px', width: 130, align: 'center', slot: 'px_number' },
                    { title: '操作', key: 'action', width: 80, align: 'center', slot: 'delColHandle' }
                ],
                ruleValidate: {
                    ywmc: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    tablename: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ]
                },
                whdcmbValidate: {
                    ywmc: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    tablename: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ]
                },
                data1: [],
                data2: [],
                data3: [],
                dmblist: [],
                bmDataList: [],
                sjqxList: [
                    { dm: 'bmdms', mc: '部门(院系)' },
                    { dm: 'njs', mc: '年级' },
                    { dm: 'xiaoqus', mc: '校区' },
                    { dm: 'jysdms', mc: '教研室' },
                    { dm: 'zydms', mc: '专业' },
                    { dm: 'bjdms', mc: '班级' },
                    { dm: 'br', mc: '本人' },
                    { dm: 'js', mc: '角色' }
                ],
                saveform: {
                    ywmc: null,
                    tablename: null,
                    bz: null
                },
                saveWhdcmbForm: {
                    id: null,
                    ywmc: null,
                    tablename: null,
                    bz: null
                },
                isReadOnly: true,
                formInline: {
                    ywmc: '',
                    tablename: ''
                }
            }
        },

        methods: {
            PostByPage1: function (pageduixiang, url, data, func, flag) {
                pageduixiang.url = url;
                pageduixiang.data = data;
                pageduixiang.func = func;
                const self = this;

                if (flag) {
                    Object.assign(data, {
                        pageNum: pageduixiang.pageNum,
                        pageSize: pageduixiang.pageSize
                    });
                } else {
                    Object.assign(data, {
                        pageNum: 1,
                        pageSize: pageduixiang.pageSize
                    });
                }

                self.commonsJs.selfRequest(url, data).then((res) => {
                    if (res.total) {} else {
                        if (res.content) {
                            if (res.content.total) {
                                res = res.content;
                            }
                        }
                    }

                    pageduixiang.total = res.total;
                    pageduixiang.pageNum = res.pageNum;

                    func(res);
                })
            },
            handlePage_list: function (value) {
                this.page_list.pageNum = value;
                this.handleSubmit(value);
            },
            handlePageSize_list: function (value) {
                if (this.page_list.func) {
                    this.page_list.pageSize = value;
                    this.handleSubmit();
                }
            },
            handleSubmit: function (pageNum) {
                const self = this;
                self.$Spin.show();
                this.PostByPage1(this.page_list, '/zdydrdcDcmbwh/queryDcmbwh', this.formInline, function (res) {
                    setTimeout(function () {
                        self.data1 = res.list;
                        self.page_list.total = res.total;
                        self.page_list.pageNum = res.pageNum;
                        self.page_list.pageSize = res.pageSize;
                        self.$Spin.hide();
                    }, 250);
                }, pageNum)
            },
            save: function () {
                const self = this
                const url = ''
                self.$refs.saveform.validate(function (valid) {
                    if (valid) {
                        self.$Spin.show();
                        self.commonsJs.selfRequest('/zdydrdcDcmbwh/saveDcmbxx', self.saveform).then((res) => {
                            self.$Spin.hide();
                            if (res.jg == '1') {
                                // 打开维护导出模板
                                self.openWhdcmb(res.id);
                                self.modal = false;
                                self.handleSubmit();
                            } else if (res.jg == '2') {
                                self.$Message.error({
                                    background: true,
                                    duration: 5,
                                    content: '表不存在'
                                });
                            } else {
                                self.$Message.error({
                                    background: true,
                                    duration: 5,
                                    content: '查询失败'
                                });
                            }
                        })
                    } else {

                    }
                })
                return false;
            },
            add: function () {
                const self = this;
                this.modal = true;
                this.$refs.saveform.resetFields();
            },
            whdcmb: function (params) {
                this.openWhdcmb(params.id);
            },
            openWhdcmb: function (id) {
                const self = this;
                self.$Spin.show();
                this.$refs.saveWhdcmbForm.resetFields();
                self.commonsJs.selfRequest('/zdydrdcDcmbwh/getDcmbxxById', { id }).then((res) => {
                    self.whdcmbModal = true;
                    Object.assign(self.saveWhdcmbForm, res);
                    self.data2 = res.dcmbWtjColList;
                    self.data3 = res.dcmbColList;
                    self.dmblist = res.dmbList;
                    self.$Spin.hide();
                })
            },
            addCol: function (params) {
                const self = this;
                // 添加到data3
                self.data3.push(params.row);
                // 从data2中删除
                self.data2.splice(params.index, 1);
            },
            delCol: function (params) {
                const self = this;
                // 添加到data2
                self.data2.push(params.row);
                // 从data3中删除
                self.data3.splice(params.index, 1);
            },
            saveWhdcmb: function () {
                const self = this
                self.$refs.saveWhdcmbForm.validate(function (valid) {
                    if (valid) {
                        const tjdata = {
                            id: self.saveWhdcmbForm.id,
                            ywmc: self.saveWhdcmbForm.ywmc,
                            tablename: self.saveWhdcmbForm.tablename,
                            bz: self.saveWhdcmbForm.bz,
                            dcmbColList: self.data3
                        }

                        self.commonsJs.incoRequest('/zdydrdcDcmbwh/saveDcmbAndCol', '', tjdata).then((res) => {
                            if (res == '1') {
                                self.$Message.success({
                                    background: true,
                                    duration: 5,
                                    content: '维护成功'
                                });
                                self.whdcmbModal = false;
                                self.handleSubmit()
                            } else {
                                self.$Message.error({
                                    background: true,
                                    duration: 5,
                                    content: '维护失败'
                                });
                            }
                        })
                    } else {

                    }
                })
                return false;
            },
            del: function () {
                const self = this
                const ids = new Array();
                this.$refs.selection.getSelection().forEach(function (e) {
                    ids.push(e.id)
                })
                if (ids.length == '0') {
                    self.$Message.info({
                        background: true,
                        closable: true,
                        duration: 10,
                        content: '请选择要删除的数据'
                    });
                } else {
                    self.commonsJs.incoRequest('/zdydrdcDcmbwh/delDcmbxx', '', { ids }).then((res) => {
                        if (res == '1') {
                            self.$Message.success({
                                background: true,
                                duration: 5,
                                content: '删除成功'
                            });
                            self.handleSubmit();
                        } else {
                            self.$Message.error({
                                background: true,
                                duration: 5,
                                content: '删除失败'
                            });
                        }
                    })
                }
            },
            cancel: function () {
                this.modal = false
            },
            cancelWhdcmbModal: function () {
                this.whdcmbModal = false;
                this.data2 = [];
                this.data3 = [];
                this.dmblist = [];
            },
            showModelChange: function (value) {
                if (!value) {
                    this.bmDataList = [];
                }
            },
            handleSearchBm (value) {
                const self = this;
                self.commonsJs.selfRequest('/zdydrdcCommon/queryTableViewByGjz', { bm: value }).then((res) => {
                    self.bmDataList = res;
                })
            }
        },
        computed: {

        },
        mounted () { this.handleSubmit(); }
    }
</script>
