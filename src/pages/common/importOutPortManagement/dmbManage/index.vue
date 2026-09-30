<template>
    <div  v-cloak style="height:100%">
        <Modal v-model="modal" @on-visible-change="showModelChange" :title="saveform.isEdit?'修改':'添加'"  width="500" :closable="false" :mask-closable="false">
            <i-Form :model="saveform" ref="saveform" :rules="ruleValidate" :label-width="110">
                <i-Input v-model="saveform.id" style="display:none"   placeholder=""></i-Input>
                <Form-Item :label="bt_label.tablename" prop="tablename">
                    <Auto-Complete v-model="saveform.tablename" :disabled="isReadOnly" :data="bmDataList"  @on-search="handleSearchBm" @on-change="getZbList" placeholder="表名/视图名" clearable maxlength="500" show-word-limit style="border:0;width:300px;"></Auto-Complete>
                </Form-Item>
                <Form-Item :label="bt_label.dm" prop="dm">
                    <i-Select v-model="saveform.dm" filterable clearable transfer style="width:300px">
                        <i-Option v-for="selectitem in zdList" :value="selectitem.COLUMN_NAME"
                                :key="selectitem.COLUMN_NAME">{{ selectitem.COLUMN_NAME }}（{{ selectitem.COLUMN_ZH }}）
                        </i-Option>
                    </i-Select>
                </Form-Item>
                <Form-Item :label="bt_label.mc" prop="mc">
                    <i-Select v-model="saveform.mc" filterable clearable transfer style="width:300px">
                        <i-Option v-for="selectitem in zdList" :value="selectitem.COLUMN_NAME"
                                :key="selectitem.COLUMN_NAME">{{ selectitem.COLUMN_NAME }}（{{ selectitem.COLUMN_ZH }}）
                        </i-Option>
                    </i-Select>
                </Form-Item>
                <Form-Item :label="bt_label.bz" prop="bz">
                    <i-Input v-model="saveform.bz"  placeholder="" style="width: 300px"></i-Input>
                </Form-Item>
                <Form-Item :label="bt_label.wheretj">
                    <i-Input v-model="saveform.wheretj" type="textarea" :rows="5" maxlength="2000" placeholder="如：and kyf='1' and yhdm=#{incoyhdm}" style="width: 300px"></i-Input>
                </Form-Item>
            </i-Form>
            <div slot="footer">
                <Button type="text"  @click="cancel">取消</Button>
                <Button type="info"  @click="save">确定</Button>
            </div>
        </Modal>

        <div style="height:100%">
            <Form @submit.native.prevent ref="formInline" :model="formInline"   inline >
                <Form-Item :label="bt_label.tablename"  :label-width="30"  >
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

            </Form>

            <i-Table :columns="columns1" :data="data1" ref="selection"
                        style="width:100%">
                <template #handle="sport">
                    <Button-Group>
                        <Button  type="info" size="small"  @click="edit(sport.row)">修改</Button>
                    </Button-Group>
                </template>
            </i-Table>

            <Page ref="page_list" :total="page_list.total" :current="page_list.pageNum" :page-size="page_list.pageSize" :page-size-opts="pageSizeOpts_list" style="margin-top:10px"
                    show-sizer
                    show-elevator
                    show-total
                    @on-change="handlePage_list"
                    @on-page-size-change='handlePageSize_list'>
            </Page>
        </div>
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
                bt_label: {
                    tablename: '表',
                    dm: '代码',
                    mc: '名称',
                    bz: '备注',
                    wheretj: 'where条件'
                },
                columns1: [
                    { type: 'selection', width: 60, align: 'center' },
                    { title: '表', key: 'tablename', sortable: 'custom' },
                    { title: '代码', key: 'dm', sortable: 'custom' },
                    { title: '名称', key: 'mc', sortable: 'custom' },
                    { title: '备注', key: 'bz', sortable: 'custom' },
                    { title: '操作', key: 'action', width: 100, slot: 'handle' }
                ],
                ruleValidate: {
                    tablename: [
                        { required: true, message: '表名必填', trigger: 'blur' }
                    ],
                    dm: [
                        { required: true, message: '代码必选', trigger: 'blur' }
                    ],
                    mc: [
                        { required: true, message: '名称必选', trigger: 'blur' }
                    ]
                },
                data1: [],
                bmDataList: [],
                zdList: [],
                saveform: {
                    isEdit: false,
                    id: null,
                    tablename: null,
                    dm: null,
                    mc: null,
                    bz: null,
                    wheretj: ''
                },
                isReadOnly: false,
                formInline: {
                    tablename: ''
                }
            }
        },

        methods: {
            PostByPage1 (pageduixiang, url, data, func, flag) {
                pageduixiang.url = url;
                pageduixiang.data = data;
                pageduixiang.func = func;
                const self = this;

                if (flag) {
                    Object.assign(data, { pageNum: pageduixiang.pageNum, pageSize: pageduixiang.pageSize })
                } else {
                    Object.assign(data, { pageNum: 1, pageSize: pageduixiang.pageSize })
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
                this.PostByPage1(this.page_list, '/zdydrdcDmbwh/queryZdydrdcDmbwh', this.formInline, function (res) {
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
                let url = ''
                self.$refs.saveform.validate(function (valid) {
                    if (valid) {
                        if (self.saveform.isEdit) {
                            url = '/zdydrdcDmbwh/updDmb';
                            self.commonsJs.selfRequest(url, self.saveform).then((res) => {
                                if (res == '1') {
                                    self.$Message.success({
                                        background: true,
                                        duration: 5,
                                        content: '保存成功'
                                    });
                                    self.modal = false
                                    self.handleSubmit()
                                } else if (res == '2') {
                                    self.$Message.error({
                                        background: true,
                                        duration: 5,
                                        content: '代码表已存在'
                                    });
                                } else {
                                    self.$Message.error({
                                        background: true,
                                        duration: 5,
                                        content: '保存失败'
                                    });
                                }
                            })
                        } else {
                            url = '/zdydrdcDmbwh/instDmb';
                            self.commonsJs.selfRequest(url, self.saveform).then((res) => {
                                if (res == '1') {
                                    self.$Message.success({
                                        background: true,
                                        duration: 5,
                                        content: '保存成功'
                                    });
                                    self.modal = false
                                    self.handleSubmit()
                                } else if (res == '2') {
                                    self.$Message.error({
                                        background: true,
                                        duration: 5,
                                        content: '表不存在'
                                    });
                                } else if (res == '3') {
                                    self.$Message.error({
                                        background: true,
                                        duration: 5,
                                        content: '字段不存在'
                                    });
                                } else {
                                    self.$Message.error({
                                        background: true,
                                        duration: 5,
                                        content: '保存失败'
                                    });
                                }
                            })
                        }
                    } else {

                    }
                })
                return false;
            },
            add: function () {
                const self = this;
                self.modal = true;
                self.saveform.isEdit = false;
                self.isReadOnly = false;
                self.$refs.saveform.resetFields();
            },
            edit: function (params) {
                const self = this;
                this.saveform.isEdit = true;
                this.isReadOnly = true;
                this.$refs.saveform.resetFields();
                self.commonsJs.selfRequest('/zdydrdcDmbwh/getDmbById', { id: params.id }).then((res) => {
                    self.modal = true;
                    Object.assign(self.saveform, res)
                    self.getZbList(res.tablename);
                })
            },
            del: function () {
                const self = this
                let ids = '';
                this.$refs.selection.getSelection().forEach(function (e) {
                    if (!ids) ids = e.id
                    else ids = ids + ',' + e.id
                })
                if (ids.length == '0') {
                    self.$Message.info({
                        background: true,
                        closable: true,
                        duration: 10,
                        content: '请选择要删除的数据'
                    });
                } else {
                    self.commonsJs.selfRequest('/zdydrdcDmbwh/delDmb', { ids }).then((res) => {
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
                this.modal = false;
            },
            showModelChange: function (value) {
                if (!value) {
                    this.bmDataList = [];
                    this.zdList = [];
                }
            },
            handleSearchBm (value) {
                const self = this;
                self.commonsJs.selfRequest('/zdydrdcCommon/queryTableViewByGjz', { bm: value }).then((res) => {
                    self.bmDataList = res;
                })
            },
            getZbList (value) {
                const self = this;
                self.commonsJs.selfRequest('/zdydrdcCommon/queryZdlistBybm', { tableName: value }).then((res) => {
                    self.zdList = res;
                })
            }
        },
        computed: {

        },
        mounted () {
            this.handleSubmit();
        }
    }
</script>
