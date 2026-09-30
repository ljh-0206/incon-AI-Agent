<template>
    <div>
        <Modal v-model="shModal" title="审批" :mask-closable="false" :fullscreen="gzlObj.gnbid" :width="gzlObj.gnbid?100:920" :footer-hide="true">
            <div slot="header" style="display:flex;justify-content:space-between;align-items:center">
                <div>审批</div>
                <div>
                    <Button type="success" @click="saveSh">确定审核结果</Button>
                    <Button type="default" style="margin-left: 10px;" @click="cancelSh">取消</Button>
                </div>
            </div>
            <Row >
                <Col class="left-form" span="12" v-if="gzlObj.gnbid">
                    <jform ref="gzl_form" :configdata="formConfigdata" :propstocomponent="formProps"></jform>
                </Col>
                <Col :span="gzlObj.gnbid?12:24" class="right-form">
                    <i-Form :model="gzlObj" labelPosition="right" :label-width="100">
                        <row :gutter="16" v-if="showSh">
                                <i-col span="12" >
                                    <Form-Item label="审批结果" prop="shzt"
                                        :rules="{ required: true, message: '请选择审批结果', trigger: 'change' }">
                                        <i-Select v-model="gzlObj.shzt" @on-change="shjgChange">
                                            <i-Option value="tg">通过</i-Option>
                                            <i-Option value="btg">不通过</i-Option>
                                            <i-Option value="bh">驳回</i-Option>
                                        </i-Select>
                                    </Form-Item>
                                </i-col>
                                <i-col span="12">
                                    <Form-Item label="并退回到" v-if="gzlObj.shzt == 'bh'">
                                        <i-select v-model="gzlObj.bhjd">
                                            <i-option v-for="(item, index) in lsjdList" :value="item.jddm"
                                                :key="index + 'sh_lsjd'">{{ item.jdmc }}</i-option>
                                        </i-select>
                                    </Form-Item>
                                </i-col>
                            <i-col span="24">
                                    <Form-Item label="审批意见">
                                        <i-input type="textarea" v-model="gzlObj.shyj" :rows="4" placeholder="请输入审批意见"></i-input>
                                    </Form-Item>
                                </i-col>
                            </row>
                            <row>
                                <i-col :span="shLayoutConfig.stepspan">
                                    <Steps :current="jdxb_shck" :status="xsxx_shck" :direction="shLayoutConfig.layout">
                                        <Step v-for="(item, index) in lcjdList_shck" :title="item.jdmc" :key="index + 'shck_lcjd'">
                                        </Step>
                                    </Steps>
                                    <br />
                                </i-col>

                                <i-col :span="shLayoutConfig.tablespan">
                                    <i-Table border :columns="columns_shck" :data="lclsjdList_shck" :height="computeTableHeight()"> </i-Table>
                                </i-col>
                            </row>
                    </i-Form>
                </Col>
            </Row>
        </Modal>
        <Modal v-model="shckModal" title="审核情况" v-bind="computedShckModal()" :mask-closable="false" footer-hide>
            <row :gutter="16">
                <template v-if="gzlObj.shckshowtype=='horizontal'">
                   <i-col span="24">
                        <Steps :current="jdxb_shck" :status="xsxx_shck">
                            <Step v-for="(item, index) in lcjdList_shck" :title="item.jdmc" :key="index + 'shqk_lcjd'">
                            </Step>
                        </Steps>
                        <br />
                    </i-col>

                    <i-col span="24">
                        <i-Table border :columns="columns_shck" :data="lclsjdList_shck" height="680"> </i-Table>
                    </i-col>
                </template>
                <template v-else>
                    <i-col span="18">
                        <i-Table border :columns="columns_shck" :data="lclsjdList_shck" height="680"> </i-Table>
                    </i-col>
                    <i-col span="6">
                        <Steps :current="jdxb_shck" :status="xsxx_shck" direction="vertical">
                            <Step v-for="(item, index) in lcjdList_shck" :title="item.jdmc" :key="index + 'shqk_lcjd'">
                            </Step>
                        </Steps>
                        <br />
                    </i-col>
                </template>
            </row>
        </Modal>
    </div>
</template>

<script>
    import { mapState, mapGetters } from 'vuex'

    export default {
        data: function () {
            return {
                // 工作流相关数据
                gzlObj: {
                    type: 'bc', // 工作流类型（bc=保存、tj=提交、ch=撤回、del=删除、sh=审核，zclsh=自己处理审核，shck=审核情况查看，不传默认：bc）
                    ywlcdm: '', // 业务流程代码（必须传）
                    ywid: '', // 业务ID（必须传）
                    ywmc: '低代码平台', // 业务名称
                    params: [], // 变量参数[{'bldm':value,'blz':value}]
                    sftj: '0', // 保存提交调用时的是否提交
                    dbjddm: '', // 待办节点代码（审核时使用）
                    shzt: '', // 审核状态
                    bhjd: '', // 驳回节点
                    shyj: '', // 审核意见
                    shckshowtype: 'horizontal'

                },
                // 业务表单相关数据
                dataObj: {
                    sqlid: '', // 通用map的SQLID
                    data: {} // 业务表单的data数据
                },
                // 审核弹窗
                shModal: false,
                // 历史审核节点
                lsjdList: [],
                shtgFunction: function () {}, // 审核通过后置执行方法（审核时使用）
                // 审核情况弹窗
                shckModal: false,
                jdxb_shck: 0,
                xsxx_shck: 'wait',
                lcjdList_shck: [],
                columns_shck: [
                    { title: '节点', key: 'lsjdmc' },
                    { title: '审核人', key: 'lsshrxm' },
                    { title: '审核时间', key: 'lsshsj' },
                    { title: '审核状态', key: 'lsshztxsmc' },
                    { title: '审核意见', key: 'lsshyj' }
                ],
                lclsjdList_shck: [],
                gnbid: '',
                formConfigdata: {},
                formProps: { dbjddm: '' },
                showSh: false,
                tempdata: {},
                componentRefs: {}
            }
        },
        computed: {
            ...mapState('admin/user', ['info']),
            shLayoutConfig () {
                if (this.shckshowtype == 'vertical') return { stepspan: 8, tablespan: 16, layout: 'vertical' }
                return { stepspan: 24, tablespan: 24, layout: 'horizontal' }
            }
        },
        methods: {
            computeTableHeight () {
                console.log(document.body.clientHeight, 'document.body.clientHeight')
                return document.body.clientHeight - 300
            },
            async getformConfigdata () {
                const gnbzjpzxx = await this.commonsJs.getzjpzxx(this.gzlObj.gnbid)
                const configList = gnbzjpzxx.configList
                configList.forEach(item => {
                    if (item.lx == 'jform') {
                        item.modalType = 'divlayout'
                        item.autoopen = '1'
                        item.opentype = 'show'
                        item.formId = this.gzlObj.ywid
                        delete item.modalTitle
                        delete item.titleButtons
                        this.formProps.dbjddm = this.gzlObj.dbjddm
                        this.formConfigdata = { ...item }
                    }
                })
            },
            bctj: async function (sftj) {
                const self = this;
                self.gzlObj.sftj = sftj;
                const res = await self.commonsJs.incoRequest('/gzlywlcApi/bctj', '', { gzlObj: self.gzlObj, dataObj: self.dataObj })
                return res;
            },
            ch: async function () {
                const self = this;
                const res = await self.commonsJs.incoRequest('/gzlywlcApi/ch', '', { gzlObj: self.gzlObj, dataObj: self.dataObj })
                return res;
            },
            del: async function () {
                const self = this;
                const res = await self.commonsJs.incoRequest('/gzlywlcApi/del', '', { gzlObj: self.gzlObj, dataObj: self.dataObj })
                return res;
            },
            sh: async function () {
                this.showSh = true
                if (this.gzlObj.gnbid) await this.getformConfigdata()
                const self = this;
                self.gzlObj.shzt = 'tg';
                self.gzlObj.bhjd = '';
                self.shModal = true;
                // 查询出已审核的节点有哪些
                self.commonsJs.selfRequest('/gzlywlcApi/queryLsshjd', {
                    ywlcdm: self.gzlObj.ywlcdm, ywlcslid: self.gzlObj.ywid, dbjddm: self.gzlObj.dbjddm
                }).then((res) => {
                    self.lsjdList = res;
                })

                // 查询出审核记录详情
                self.commonsJs.selfRequest('/gzlshywlc/queryShywlcShck', {
                    ywlcslid: self.gzlObj.ywid, ywlcdm: self.gzlObj.ywlcdm
                }).then((res) => {
                    if (res.gzlShywlcslModelOne.sfyzz == '2') {
                        self.xsxx_shck = 'finish';
                        self.jdxb_shck = 9999;
                    } else {
                        if (res.gzlShywlcslModelOne.sfyzz == '1') {
                            self.xsxx_shck = 'error';
                            res.gzlShywlcjdModelList.forEach(function (ii, vv) {
                                if (ii.jddm == res.gzlShywlcslModelOne.yshjddm) {
                                    self.jdxb_shck = vv;
                                }
                            })
                        } else {
                            self.xsxx_shck = 'wait';
                            res.gzlShywlcjdModelList.forEach(function (ii, vv) {
                                if (ii.jddm == res.gzlShywlcslModelOne.dshjddm) {
                                    self.jdxb_shck = vv;
                                }
                            })
                        }
                    }
                    self.lclsjdList_shck = res.gzlShywlclsjdModelList;
                    self.lcjdList_shck = res.gzlShywlcjdModelList;
                })
            },
            shjgChange: function (val) {
                const self = this;
                if (val == 'tg' || val == 'btg') {
                    self.gzlObj.bhjd = '';
                } else {
                    if (self.lsjdList && self.lsjdList.length > 0) {
                        self.gzlObj.bhjd = self.lsjdList[0].jddm;
                    }
                }
            },
            saveSh: async function () {
                const self = this;
                const shzt = self.gzlObj.shzt;
                let dataObj = self.dataObj
                let flag = true
                if (this.gzlObj.gnbid) {
                    flag = await this.$refs.gzl_form.formValid()
                    dataObj = {
                        sqlid: this.formConfigdata.funcId.updateFormId,
                        data: this.$refs.gzl_form.data
                    }
                }
                if (!flag) return
                if (shzt == 'bh') { self.gzlObj.shzt = 'btg' }
                self.commonsJs.incoRequest('/gzlywlcApi/sh', '', { gzlObj: self.gzlObj, dataObj }).then((res) => {
                    if (res.jg != '-1') {
                        self.$Message.success('审核成功');
                        self.cancelSh();
                        if (self.shtgFunction) {
                            self.shtgFunction({ gzlObj: self.gzlObj, dataObj });
                        }
                    } else {
                        if (shzt == 'bh') { self.gzlObj.shzt = 'bh' }
                        self.$Message.error('审核失败，请重试！失败原因：' + res.message);
                    }
                })
            },
            cancelSh: function () {
                this.gzlObj.shyj = '';
                this.shModal = false;
            },
            saveZclSh: async function () {
                const self = this;
                const res = await self.commonsJs.incoRequest('/gzlywlcApi/sh', '', { gzlObj: self.gzlObj, dataObj: self.dataObj })
                return res;
            },
            // 审核流程查看
            shck: function () {
                const self = this;
                this.showSh = false
                self.commonsJs.selfRequest('/gzlshywlc/queryShywlcShck', { ywlcslid: self.gzlObj.ywid, ywlcdm: self.gzlObj.ywlcdm }).then((res) => {
                    if (res.gzlShywlcslModelOne.sfyzz == '2') {
                        self.xsxx_shck = 'finish';
                        self.jdxb_shck = 9999;
                    } else {
                        if (res.gzlShywlcslModelOne.sfyzz == '1') {
                            self.xsxx_shck = 'error';
                            res.gzlShywlcjdModelList.forEach(function (ii, vv) {
                                if (ii.jddm == res.gzlShywlcslModelOne.yshjddm) {
                                    self.jdxb_shck = vv;
                                }
                            })
                        } else {
                            self.xsxx_shck = 'wait';
                            res.gzlShywlcjdModelList.forEach(function (ii, vv) {
                                if (ii.jddm == res.gzlShywlcslModelOne.dshjddm) {
                                    self.jdxb_shck = vv;
                                }
                            })
                        }
                    }
                    self.lclsjdList_shck = res.gzlShywlclsjdModelList;
                    self.lcjdList_shck = res.gzlShywlcjdModelList;
                })
                self.shckModal = true;
            },
            computedShckModal: function () {
                const self = this;
                const obj = {};
                if (self.gzlObj.shckshowtype == 'horizontal') {
                    obj.width = '980px';
                } else {
                    obj.width = '1200px';
                }
                return obj;
            }
        },
        created: function () {
            this.shModal = false;
            this.gzlObj.shyj = '';
        },
        mounted: function () {}
    }
</script>

<style scoped>
    .ivu-steps{
        line-height: 26px !important;
    }
    .left-form {
        overflow-y: auto;
        height: calc(100vh - 100px);
    }
</style>
