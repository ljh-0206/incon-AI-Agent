<template>
    <div>
        <!-- 添加导入模板Modal -->
        <Modal v-model="modal" @on-visible-change="showModelChange" title="添加"  width="660" :closable="false" :mask-closable="false">
            <Form :model="saveform" ref="saveform" :rules="ruleValidate" :label-width="110">
                <Form-Item :label="bt_label.ywmc" prop="ywmc">
                    <i-Input v-model="saveform.ywmc"  placeholder="" ></i-Input>
                </Form-Item>
                <Form-Item :label="bt_label.tablename" prop="tablename">
                    <Auto-Complete v-model="saveform.tablename" :data="bmDataList"  @on-search="handleSearchBm" placeholder="表名" clearable maxlength="500" show-word-limit style="border:0;"></Auto-Complete>
                </Form-Item>
                <Form-Item :label="bt_label.bz" prop="bz">
                    <i-Input v-model="saveform.bz"  placeholder=""></i-Input>
                </Form-Item>
                <Form-Item :label="bt_label.qzjyjkurl" prop="qzjyjkurl">
                    <i-Input v-model="saveform.qzjyjkurl"  placeholder="前置校验接口URL地址(处理导入前置业务逻辑)"></i-Input>
                </Form-Item>
                <Form-Item :label="bt_label.hzjyjkurl" prop="hzjyjkurl">
                    <i-Input v-model="saveform.hzjyjkurl"  placeholder="后置校验接口URL地址(处理导入后置业务逻辑)"></i-Input>
                </Form-Item>
            </Form>
            <div slot="footer">
                <Button type="text"  @click="cancel">取消</Button>
                <Button type="info"  @click="save">保存</Button>
            </div>
        </Modal>

        <!--维护导入模版Modal-->
        <Modal v-model="whdrmbModal" @on-visible-change="showWhModelChange" title="维护导入模板"  width="1080" fullscreen :closable="false" :mask-closable="false">
            <Form :model="saveWhdrmbForm" ref="saveWhdrmbForm" :rules="whdrmbValidate" :label-width="100">
                <i-Input v-model="saveWhdrmbForm.id" style="display:none"   placeholder=""></i-Input>
                <Row>
                    <i-Col span="8">
                        <Form-Item :label="bt_label.ywmc" prop="ywmc">
                            <i-Input v-model="saveWhdrmbForm.ywmc" placeholder=""></i-Input>
                        </Form-Item>
                    </i-Col>
                    <i-Col span="8">
                        <Form-Item :label="bt_label.tablename" prop="tablename">
                            <i-Input v-model="saveWhdrmbForm.tablename"  placeholder="" v-bind:readonly="isReadOnly"></i-Input>
                        </Form-Item>
                    </i-Col>
                    <i-Col span="8">
                        <Form-Item :label="bt_label.bz" prop="bz">
                            <i-Input v-model="saveWhdrmbForm.bz"  placeholder=""></i-Input>
                        </Form-Item>
                    </i-Col>
                    <i-Col span="8">
                        <Form-Item :label="bt_label.qzjyjkurl" prop="qzjyjkurl">
                            <i-Input v-model="saveWhdrmbForm.qzjyjkurl"  placeholder="前置校验接口URL地址(处理导入前置业务逻辑)"></i-Input>
                        </Form-Item>
                    </i-Col>
                    <i-Col span="8">
                        <Form-Item :label="bt_label.hzjyjkurl" prop="hzjyjkurl">
                            <i-Input v-model="saveWhdrmbForm.hzjyjkurl"  placeholder="后置校验接口URL地址(处理导入后置业务逻辑)"></i-Input>
                        </Form-Item>
                    </i-Col>
                </Row>
                <Row :gutter="16">
                    <i-Col span="6">
                        <Card :padding="6">
                            <template #title>
                                <p style="text-align: center;">待添加导入字段</p>
                            </template>
                            <i-Table border :columns="columns2" :data="data2">
                                <template #addColHandle="sport">
                                    <Button  type="success" size="small"  @click="addCol(sport)">添加</Button>
                                </template>
                            </i-Table>
                        </Card>
                    </i-Col>
                    <i-Col span="18">
                        <Card :padding="6">
                            <template #title>
                                <p style="text-align: center;">已添加导入字段</p>
                            </template>
                            <i-Table border :columns="columns3" :data="data3">
                                <template #sfbdzdxlk="params">
                                    <i-Select v-model="data3[params.index].sfbdzd" transfer>
                                        <i-Option v-for="item in sfbdzdlist" :value="item.dm" :key="item.dm">{{ item.mc }}</i-Option>
                                    </i-Select>
                                </template>
                                <template #scuuidscxlk="params">
                                    <i-Select v-model="data3[params.index].sfuuidsc" transfer>
                                        <i-Option v-for="item in sfuuidsclist" :value="item.dm" :key="item.dm">{{ item.mc }}</i-Option>
                                    </i-Select>
                                </template>
                                <template #dmbxlk="params">
                                    <i-Select v-model="data3[params.index].dmb_id" filterable clearable transfer>
                                        <i-Option v-for="item2 in dmbList" :value="item2.id" :key="item2.id">{{ item2.tablename }}</i-Option>
                                    </i-Select>
                                </template>
                                <template #gdzxlk="params">
                                    <div :style="{float: 'left',width: (data3[params.index].csShow == '1' ? '45%' : '100%')}">
                                        <i-Select v-model="data3[params.index].gdz" filterable clearable allow-create transfer @on-create="channelCreate(data3[params.index].gdz)" @keydown.native.enter.prevent ="keyDownEvent" @on-change="changeGdz(params.index)">
                                            <i-Option v-for="item2 in gdzList" :value="item2.value" :key="item2.value">{{ item2.label }}</i-Option>
                                        </i-Select>
                                    </div>
                                    <div v-if="data3[params.index].csShow == '1' ? true : false" :style="{float: 'left',width: (data3[params.index].csShow == '1' ? '55%' : '0%')}">
                                        <i-Input v-model="data3[params.index].csm" placeholder="参数名"></i-Input>
                                    </div>
                                </template>
                                <template #sfwxgyjzdxlk="params">
                                    <i-Select v-model="data3[params.index].sfwxgyjzd">
                                        <i-Option value="1">是</i-Option>
                                        <i-Option value="0">否</i-Option>
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
            </Form>
            <div slot="footer">
                <Button type="text"  @click="cancelWhdrmbModal">取消</Button>
                <Button type="info"  @click="saveWhdrmb">保存</Button>
            </div>
        </Modal>

        <Layout style="height:100%;background:#fff">
            <div ref="queryHeader"  style="padding-top:12px">
                <Form @submit.native.prevent ref="formInline" :model="formInline"   inline >
                    <Form-Item :label="bt_label.ywmc"  :label-width="80"  >
                        <i-Input type="text" v-model="formInline.ywmc">
                        </i-Input>
                    </Form-Item>

                    <Form-Item :label="bt_label.tablename"  :label-width="50"  >
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
            </div>

            <i-Content>
                <i-Table   :columns="columns1" :data="data1" ref="selection"
                        style="width:100%">
                    <template #handle="sport">
                        <Button  type="info" size="small"  @click="whdrmb(sport.row)">维护模板</Button>
                        <importcomponent  :configdata="{ywid:sport.row.id,content:'导入数据',attrs:{type:'warning',size:'small'}}"></importcomponent>
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
                whdrmbModal: false,
                bt_label: {
                    ywmc: '业务名称',
                    tablename: '表名',
                    bz: '备注',
                    qzjyjkurl: '前置校验',
                    hzjyjkurl: '后置校验'
                },
                columns1: [
                    { type: 'selection', width: 60, align: 'center' },
                    { title: '业务名称', key: 'ywmc', sortable: 'custom' },
                    { title: '表名', key: 'tablename', sortable: 'custom' },
                    { title: '备注', key: 'bz', sortable: 'custom' },
                    { title: '业务ID', key: 'id', width: 260, sortable: 'custom' },
                    { title: '操作', key: 'action', width: 200, slot: 'handle' }
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
                                        this.data2[params.index].column_zh =
                                            event.target.value;
                                    }
                                }
                            });
                        }
                    },
                    { title: '操作', key: 'action', width: 80, align: 'center', slot: 'addColHandle' }
                ],
                columns3: [
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
                                domProps: {
                                    title: params.row.column_zh
                                },
                                on: {
                                    'on-change': (event) => {
                                        this.data3[params.index].column_zh = event.target.value;
                                    }
                                }
                            });
                        }
                    },
                    { title: '字段类型', key: 'column_lx', align: 'center' },
                    { title: '字段长度', key: 'column_cd', width: 65, align: 'center' },
                    { title: '是否主键', key: 'sfzjBoolean2', width: 65, align: 'center' },
                    { title: '是否非空', key: 'sffkBoolean', width: 65, align: 'center' },
                    { title: '必导字段', key: 'sfbdzd', width: 95, align: 'center', slot: 'sfbdzdxlk' },
                    { title: '是否UUID生成', key: 'sfuuidsc', width: 95, align: 'center', slot: 'scuuidscxlk' },
                    { title: '代码表', key: 'dmb_id', align: 'center', slot: 'dmbxlk' },
                    { title: '固定值', key: 'gdz', width: 220, align: 'center', slot: 'gdzxlk' },
                    { title: '更新依据', key: 'sfwxgyjzd', width: 100, align: 'center', slot: 'sfwxgyjzdxlk' },
                    { title: '排序', key: 'px', align: 'center', slot: 'px_number' },
                    { title: '操作', key: 'action', width: 80, align: 'center', slot: 'delColHandle' }
                ],
                sfbdzdlist: [
                    { dm: '0', mc: '否' },
                    { dm: '1', mc: '是' }
                ],
                sfuuidsclist: [
                    { dm: '0', mc: '否' },
                    { dm: '1', mc: '是' }
                ],
                dmbList: [
                ],
                gdzList: [
                    { label: '参数传入', value: 'cscr' },
                    { label: '操作人用户代码', value: 'czrzh' },
                    { label: '操作人姓名', value: 'czrxm' },
                    { label: '操作人ip', value: 'czrip' },
                    { label: '操作人角色代码', value: 'czrjsdm' },
                    // {label:'操作人角色名称',value:'czrjsmc'},
                    { label: '操作时间（DATE）', value: 'czrsjdate' },
                    { label: '操作时间（String,YYYY-MM-DD HH:mm:ss）', value: 'czrsjString' },
                    { label: '模板不使用下拉框', value: 'mbbsyxlk' }
                ],
                ruleValidate: {
                    ywmc: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    tablename: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ]
                },
                whdrmbValidate: {
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
                bmDataList: [],
                saveform: {
                    ywmc: null,
                    tablename: null,
                    qzjyjkurl: null,
                    hzjyjkurl: null,
                    bz: null
                },
                saveWhdrmbForm: {
                    id: null,
                    ywmc: null,
                    tablename: null,
                    qzjyjkurl: null,
                    hzjyjkurl: null,
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
                this.PostByPage1(this.page_list, '/zdydrdcDrmbwh/queryDrmbwh', this.formInline, function (res) {
                    setTimeout(function () {
                        self.data1 = res.list;
                        self.page_list.total = res.total;
                        self.page_list.pageNum = res.pageNum;
                        self.page_list.pageSize = res.pageSize;
                        self.$Spin.hide();
                    }, 250);
                }, pageNum)
            },
            save () {
                const self = this
                self.$refs.saveform.validate(function (valid) {
                    if (valid) {
                        self.$Spin.show();
                        self.commonsJs.selfRequest('/zdydrdcDrmbwh/saveDrmbxx', self.saveform).then((res) => {
                            self.$Spin.hide();
                            if (res.jg == '1') {
                                // 打开维护导入模板
                                self.openDrmbwh(res.id);
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
            whdrmb: function (params) {
                this.openDrmbwh(params.id);
            },
            openDrmbwh: function (id) {
                this.$Spin.show();
                const self = this;
                this.$refs.saveWhdrmbForm.resetFields();
                self.commonsJs.selfRequest('/zdydrdcDrmbwh/getDrmbxxById', { id }).then((res) => {
                    self.whdrmbModal = true;
                    Object.assign(self.saveWhdrmbForm, res);
                    for (let i = 0; i < res.drmbColList.length; i++) {
                        if (res.drmbColList[i].gdz != null && res.drmbColList[i].gdz != '' && res.drmbColList[i].gdz != 'undefined') {
                            let sfcz = false;
                            for (let j = 0; j < self.gdzList.length; j++) {
                                if (self.gdzList[j].value == res.drmbColList[i].gdz) {
                                    sfcz = true;
                                    break;
                                }
                            }
                            if (!sfcz) {
                                self.gdzList.push({ label: res.drmbColList[i].gdz, value: res.drmbColList[i].gdz });
                            }
                        }
                    }
                    self.data2 = res.drmbWtjColList;
                    self.data3 = res.drmbColList;
                    self.dmbList = res.dmbList;
                    self.$Spin.hide();
                })
            },
            addCol: function (params) {
                const self = this;
                // 添加到data3
                params.row.px = self.data3.length + 1;
                self.data3.push(params.row);
                // 从data2中删除
                self.data2.splice(params.index, 1);
            },
            delCol: function (params) {
                const self = this;
                if (params.row.sfzj == '1') {
                    self.$Message.error({
                        background: true,
                        duration: 5,
                        content: '主键不允许删除'
                    });
                } else if (params.row.sffk == '1') {
                    self.$Message.error({
                        background: true,
                        duration: 5,
                        content: '非空字段不允许删除'
                    });
                } else {
                    // 添加到data2
                    self.data2.push(params.row);
                    // 从data3中删除
                    self.data3.splice(params.index, 1);
                }
            },
            saveWhdrmb: function () {
                const self = this
                self.$refs.saveWhdrmbForm.validate(function (valid) {
                    if (valid) {
                        const tjdata = {
                            id: self.saveWhdrmbForm.id,
                            ywmc: self.saveWhdrmbForm.ywmc,
                            tablename: self.saveWhdrmbForm.tablename,
                            qzjyjkurl: self.saveWhdrmbForm.qzjyjkurl,
                            hzjyjkurl: self.saveWhdrmbForm.hzjyjkurl,
                            bz: self.saveWhdrmbForm.bz,
                            drmbColList: self.data3
                        }
                        self.commonsJs.incoRequest('/zdydrdcDrmbwh/saveDrmbAndCol', '', tjdata).then((res) => {
                            if (res == '1') {
                                self.$Message.success({
                                    background: true,
                                    duration: 5,
                                    content: '维护成功'
                                });
                                self.whdrmbModal = false
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
                    self.commonsJs.incoRequest('/zdydrdcDrmbwh/delDrmbxx', '', { ids }).then((res) => {
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
            cancelWhdrmbModal: function () {
                this.whdrmbModal = false;
            },
            showModelChange: function (value) {
                if (!value) {
                    this.bmDataList = [];
                }
            },
            handleSearchBm (value) {
                const self = this;
                self.commonsJs.selfRequest('/zdydrdcCommon/queryTableByGjz', { bm: value }).then((res) => {
                    self.bmDataList = res;
                })
            },
            showWhModelChange: function (value) {
                if (!value) {
                    this.data2 = [];
                    this.data3 = [];
                    this.dmbList = [];
                    this.gdzList = [
                        { label: '参数传入', value: 'cscr' },
                        { label: '操作人用户代码', value: 'czrzh' },
                        { label: '操作人姓名', value: 'czrxm' },
                        { label: '操作人ip', value: 'czrip' },
                        { label: '操作人角色代码', value: 'czrjsdm' },
                        // {label:'操作人角色名称',value:'czrjsmc'},
                        { label: '操作时间（DATE）', value: 'czrsjdate' },
                        { label: '操作时间（String,YYYY-MM-DD HH:mm:ss）', value: 'czrsjString' },
                        { label: '模板不使用下拉框', value: 'mbbsyxlk' }
                    ];
                }
            },
            changeGdz (index) {
                if (this.data3[index].gdz == 'cscr') {
                    this.data3[index].csm = this.data3[index].column_en.toLowerCase();
                    this.data3[index].csShow = '1';
                } else {
                    this.data3[index].csm = '';
                    this.data3[index].csShow = '0';
                }
            },
            channelCreate (val) {
                let sfcz = false;
                for (let j = 0; j < this.gdzList.length; j++) {
                    if (this.gdzList[j].value == val) {
                        sfcz = true;
                        break;
                    }
                }
                if (!sfcz) {
                    this.gdzList.push(val);
                }
            },
            keyDownEvent () {
            // 防止输入框输入内容按enter键刷新内容，写个空方法
            }
        },
        computed: {

        },
        mounted () {
            this.handleSubmit();
        }
    }
</script>
