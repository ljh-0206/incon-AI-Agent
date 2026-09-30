<template>
    <div style="margin-left:5px;display: inline-block;" :class="'style-' + configdata.blm + ' ' + configdata.blm">
        <Button v-bind="configdata.attrs" :style="configdata.style" @click="openImport">{{configdata.content ?
            configdata.content :'导入'}}</Button>
        <Modal v-model="show" title="导入" draggable width="1280" :fullscreen="configdata.fullscreen==='1' ? true : false"
            :closable="false" :mask-closable="false">
            <div style="height:650px;">
                <i-Form :model="saveform" ref="saveform" :label-width="110">
                    <i-Input v-model="saveform.id" style="display:none" placeholder=""></i-Input>
                    <Row>
                        <i-Col span="24" v-if="configdata.xsxzdrmb=='0'">
                          <Button type="primary" size="small" @click="xzdrwj"
                                    style="margin-left:5px">1.选择导入文件</Button>
                          <Button type="success" size="small" v-if="sfxs" @click="saveImport"
                                    style="margin-left:5px">2.开始导入</Button>
                          <span v-if="sfxsts" style="font-size: 13px;line-height: 24px;">
                                    <Button type="error" size="small" v-if="impErrorSfxs" @click="expError"
                                              style="margin-left:5px">3.下载导入失败数据</Button>
                                    导入数据<font color="blue">{{ztsTip}}</font>条：
                                    新增成功<font color="green">{{cgtsTip_insert}}</font>条 &nbsp;
                                    更新成功<font color="green">{{cgtsTip_update}}</font>条 &nbsp;
                                    失败<font color="red">{{sbtsTip}}</font>条 &nbsp;
                                </span>
                        </i-Col>
                        <i-Col span="24" v-else>
                            <Button type="error" size="small" @click="xzdrmb">1.下载导入模板</Button>
                            <Button type="primary" size="small" @click="xzdrwj"
                                style="margin-left:5px">2.选择导入文件</Button>
                            <Button type="success" size="small" v-if="sfxs" @click="saveImport"
                                style="margin-left:5px">3.开始导入</Button>
                            <span v-if="sfxsts" style="font-size: 13px;line-height: 24px;">
                                <Button type="error" size="small" v-if="impErrorSfxs" @click="expError"
                                    style="margin-left:5px">4.下载导入失败数据</Button>
                                导入数据<font color="blue">{{ztsTip}}</font>条：
                                新增成功<font color="green">{{cgtsTip_insert}}</font>条 &nbsp;
                                更新成功<font color="green">{{cgtsTip_update}}</font>条 &nbsp;
                                失败<font color="red">{{sbtsTip}}</font>条 &nbsp;
                            </span>
                        </i-Col>
                    </Row>

                    <Row :gutter="16" style="padding-top: 5px">
                        <i-Col v-show="configdata.zddytz==='0'" span="6">
                            <div style="overflow-y: auto;height:620px">
                                <div v-for="(item, index) in saveform.mbColList">
                                    <Form-Item :label="item.column_zh2" :label-width="80"
                                        :prop="'mbColList.'+index+ '.column_zh'"
                                        :rules="{required: (item.sfzjBoolean=='true' || item.sffk=='1' || item.sfbdzd=='1') ? true : false, message: '请选择，不允许为空', trigger: 'change'}">
                                        <i-Select v-model="item.column_zh" filterable clearable transfer>
                                            <i-Option v-for="item2 in btList" :value="item2"
                                                :key="item2">{{item2}}</i-Option>
                                        </i-Select>
                                    </Form-Item>
                                </div>
                            </div>
                        </i-Col>

                        <i-Col span="18">
                            <i-Table border :columns="columns2" :data="data2">

                            </i-Table>
                        </i-Col>
                    </Row>
                </i-Form>
            </div>

            <div slot="footer">
                <Button type="error" @click="cancel">导入完成/关闭</Button>
            </div>

            <Modal v-model="imp_show" width="520px" title="选择导入文件" :closable="false" :mask-closable="false">
                <i-Form>
                    <i-Input v-model="imp.id" style="display:none" placeholder=""></i-Input>
                    <Form-Item label="文件:">
                        <Upload :before-upload="handleUpload1" ref="upload" name="file"
                            :headers="{Token: 'Inco-'+token}" :action="imp.scwj" :accept="'.xls,.xlsx'" :data="imp"
                            :on-success="handleSuccess1">
                            <Button type="warning" shape="circle">选择文件</Button>
                            <span v-if="file !=null "> {{file.name }}</span>
                        </Upload>
                    </Form-Item>
                    <Form-Item label="提示:">
                        <br />
                        <span
                            style="display: inline-block;width: 100%;font-weight: bold;">1.需将Excel文件中列的单元格格式改为“文本”。</span>
                        <br />
                        <span
                            style="display: inline-block;width: 100%;font-weight: bold;">2.保存后，会在父页面自动将与字段名相同的列名对应，可手动在下方修改字段对应的列。</span>
                        <br />
                        <span
                            style="display: inline-block;width: 100%;font-weight: bold;">3.将字段和列对应好后，点击保存即可进行数据导入。</span>
                    </Form-Item>
                </i-Form>
                <div slot="footer">
                    <Button type="text" @click="cancel_imp">取消</Button>
                    <Button type="info" @click="scwj">保存</Button>
                </div>
            </Modal>
        </Modal>
    </div>
</template>
<script>
    import Setting from '@/setting'
    import { mapState } from 'vuex'
    import { exportFile } from '@/plugins/exportFile';

    export default {
        name: 'importcomponent',
        props: {
            configdata: { type: Object, default: () => ({}) },
            fathername: { type: String, default: '' },
            propstocomponent: { type: Object, default: () => ({}) }
        },
        data () {
            return {
                ref: this.$root.componentRefs,
                token: localStorage.getItem('token' + '_' + Setting.xmid),
                show: false,
                imp_show: false,
                sfxs: false,
                ztsTip: 0,
                cgtsTip_insert: 0,
                cgtsTip_update: 0,
                sbtsTip: 0,
                sfxsts: false,
                impErrorSfxs: false,
                columns2: [],
                saveform: {
                    id: null,
                    mbColList: []
                },
                btList: [],
                data2: [],
                file: null,
                imp: {
                    id: '',
                    scwj: ''
                },
                commitImport: false,
                tempdata: {}
            };
        },
        methods: {
            openImport: function () {
                this.zdydr(this.configdata.ywid);
            },
            zdydr: function (params) {
                const self = this;
                self.$Spin.show();
                self.$refs.saveform.resetFields();
                self.btList = [];
                self.data2 = [];
                self.columns2 = [];
                self.commonsJs.selfRequest('/zdydrdcZdydr/getSfwhmbById', { id: params }).then(res => {
                    if (res == '1') {
                        self.show = true;
                        self.commonsJs.selfRequest('/zdydrdcZdydr/getDrmbAndColById', { id: params }).then(res => {
                            Object.assign(self.saveform, res);
                            self.saveform.mbColList = res.drmbColList;
                            self.sfxs = false;
                            self.sfxsts = false;
                            self.impErrorSfxs = false;
                            self.$Spin.hide();
                        })
                    } else {
                        self.show = false;
                        self.$Spin.hide();
                        self.$Message.error({
                            background: true,
                            duration: 5,
                            content: '导入模板未维护'
                        });
                    }
                })
            },
            xzdrmb: function () {
                const id = this.saveform.id;
                // window.location.href = Setting.apiBaseURL + "/zdydrdcZdydr/downExcel?id=" + id;
                exportFile('/zdydrdcZdydr/downExcel?id=' + id, {}, '导入模板.xls', this);
            },
            xzdrwj: function () {
                this.file = null;
                this.$refs.upload.clearFiles();
                this.imp_show = true;
            },
            handleUpload1: function (file) {
                const self = this;
                self.file = file;
                const index = file.name.lastIndexOf('.');
                const suffix = file.name.substr(index + 1);
                if (suffix != 'xls' && suffix != 'xlsx') {
                    self.$Message.error({
                        background: true,
                        closable: true,
                        duration: 10,
                        content: '请选择excel文件'
                    });
                    self.file = null;
                }
                return false;
            },
            scwj: function () {
                const self = this;
                if (self.file == null) {
                    self.$Message.error({
                        background: true,
                        closable: true,
                        duration: 10,
                        content: '请选择文件'
                    });
                    return;
                }
                self.imp.id = self.saveform.id;
                self.$Spin.show();
                self.$refs.upload.post(self.file);
            },
            handleSuccess1: function (res) {
                const self = this;
                self.sfxsts = false;
                if (res.content.zt[0] == 'true') {
                    self.columns2 = [];
                    for (var i = 0; i < res.content.bt.length; i++) {
                        self.columns2.push({
                            title: res.content.bt[i],
                            key: res.content.bt[i],
                            align: 'center',
                            minWidth: 140
                        });
                    }
                    self.btList = res.content.bt;
                    self.data2 = res.content.sj;
                    // 判断saveform.mbColList中的column_zh是否在btList中
                    for (var i = 0; i < self.saveform.mbColList.length; i++) {
                        if (self.btList.indexOf(self.saveform.mbColList[i].column_zh) == -1) {
                            if (self.btList.indexOf(self.saveform.mbColList[i].column_zh2) == -1) {
                                self.saveform.mbColList[i].column_zh = '';
                            } else {
                                self.saveform.mbColList[i].column_zh = self.saveform.mbColList[i].column_zh2;
                            }
                        }
                    }
                    self.$Message.success({
                        background: true,
                        duration: 5,
                        content: '选择导入文件成功'
                    });
                    self.file = null;
                    self.imp_show = false;
                    self.sfxs = true;
                } else {
                    self.$Message.error({
                        background: true,
                        duration: 5,
                        content: '选择导入文件失败'
                    });
                }
                self.$Spin.hide();
            },
            saveImport: function () {
                this.$refs.saveform.validate(async (valid) => {
                    const _this = this;
                    if (valid) {
                        let sqlCondtion = {}
                        if (_this.configdata.importMethod) sqlCondtion = await _this.commonsJs.funcEval(_this, {}, _this.configdata.importMethod)
                        const tjdata = {
                            id: _this.saveform.id,
                            drmbColList: _this.saveform.mbColList,
                            paramdata: sqlCondtion
                        };
                        _this.$Spin.show();
                        _this.commonsJs.incoRequest('/zdydrdcZdydr/saveImport', '', tjdata).then(res => {
                            _this.ztsTip = res.dataSize;
                            _this.cgtsTip_insert = res.okDataSize_insert;
                            _this.cgtsTip_update = res.okDataSize_update;
                            _this.sbtsTip = res.errorDataSize;
                            _this.sfxs = false;
                            _this.sfxsts = true;
                            if (parseInt(res.errorDataSize) > 0) {
                                _this.impErrorSfxs = true;
                            }
                            this.commitImport = true
                            _this.$Spin.hide();
                        })
                    } else {
                        if (_this.configdata.zddytz === '1') {
                            _this.$Message.error({
                                background: true,
                                duration: 5,
                                content: '请给主键、非空、必导字段选择对应列'
                            });
                        } else {
                            _this.$Message.error({
                                background: true,
                                duration: 5,
                                content: '导入数据文件与模板不符，请重新下载模板'
                            });
                        }
                    }
                });
            },
            expError: function () {
                const id = this.saveform.id;
                exportFile('/zdydrdcZdydr/expError?id=' + id, {}, 'error.xls', this);
            },
            cancel: function () {
                this.show = false;
                // this.$emit("importSuccess");
                // 导入后执行方法
                if (this.configdata.afterImport) {
                    const funcEval = new Function('_this', 'obj', this.configdata.afterImport)
                    funcEval(this, {}) // 执行内部方法
                }
                this.commitImport = false
                this.saveform.mbColList = [];
            },
            cancel_imp: function () {
                this.imp_show = false;
            }
        },
        mounted () { this.imp.scwj = Setting.apiBaseURL + '/zdydrdcZdydr/impExcel'; },
        components: { },
        computed: {
            ...mapState('admin/user', ['info'])
        }
    }
</script>
