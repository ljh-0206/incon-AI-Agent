<template>
    <div style="height:100%">
        <!-- 添加业务流程 -->
        <Modal v-model="modal" width="1200px" :title="saveform.isEdit ? '修改业务流程' : '添加业务流程'" :mask-closable="false" footer-hide>
            <div style="padding-left:35px;padding-right:35px">
                <i-Form :model="saveform" ref="saveform" :rules="ruleValidate" :label-width="200">
                    <i-Input v-model="saveform.xtdm" style="display:none" placeholder=""></i-Input>
                    <Row>
                        <i-Col span="12">
                            <Form-Item label="业务流程代码" prop="ywlcdm">
                                <i-Input v-model="saveform.ywlcdm" style="width:200px" placeholder=""
                                    :disabled="saveform.isEdit"></i-Input>
                            </Form-Item>
                        </i-Col>
                        <i-Col span="12">
                            <Form-Item label="业务流程名称" prop="ywlcmc">
                                <i-Input v-model="saveform.ywlcmc" style="width:200px" placeholder=""></i-Input>
                            </Form-Item>
                        </i-Col>
                    </Row>
                    <Row>
                        <i-Col span="12">
                            <Form-Item label="业务流程英文名称" prop="ywlcmc_en">
                                <i-Input v-model="saveform.ywlcmc_en" style="width:200px" placeholder=""></i-Input>
                            </Form-Item>
                        </i-Col>
                        <i-Col span="12">
                            <Form-Item label="业务表名" prop="ywbm">
                                <i-Input v-model="saveform.ywbm" style="width:200px" placeholder=""></i-Input>
                            </Form-Item>
                        </i-Col>
                    </Row>

                    <Row>
                        <i-Col span="12">
                            <Form-Item label="业务表id字段名" prop="ywbidzdm">
                                <i-Input v-model="saveform.ywbidzdm" style="width:200px" placeholder=""></i-Input>
                            </Form-Item>
                        </i-Col>
                        <i-Col span="12">
                            <Form-Item label="业务表代办人字段" prop="ywbdbrzdm">
                                <i-Input v-model="saveform.ywbdbrzdm" style="width:200px" placeholder=""></i-Input>
                            </Form-Item>
                        </i-Col>
                    </Row>
                    <i-Input v-model="saveform.ywlcshcklj" style="display:none" placeholder=""></i-Input>
                    <i-Input v-model="saveform.swxqcklj" style="display:none" placeholder=""></i-Input>
                    <Row>
                        <i-Col span="12">
                            <Form-Item label="业务流程版本号" prop="ywlcbbh">
                                <i-Input v-model="saveform.ywlcbbh" style="width:200px" placeholder=""
                                    :disabled="saveform.isEdit"></i-Input>
                            </Form-Item>
                        </i-Col>
                        <i-Col span="12">
                            <Form-Item label="流程类别" prop="ywlclbdm">
                                <i-Select style="width:200px" clearable v-model="saveform.ywlclbdm">

                                    <i-Option v-for="item in ywlclbdm_list" :value="item.DM" :key="item.DM">{{ item.MC }}
                                    </i-Option>
                                </i-Select>
                            </Form-Item>
                        </i-Col>
                    </Row>
                    <Row>
                        <i-Col span="12">
                            <Form-Item label="可用否" prop="kyf">
                                <i-Select style="width:200px" clearable v-model="saveform.kyf">
                                    <i-Option value="1" key="1">可用</i-Option>
                                    <i-Option value="0" key="0">不可用</i-Option>
                                </i-Select>
                            </Form-Item>
                        </i-Col>
                        <i-Col span="12">
                            <Form-Item label="起始节点是否计算审核人" prop="qsjdsfjsshr">
                                <i-Select style="width:200px" clearable v-model="saveform.qsjdsfjsshr">
                                    <i-Option value="0" key="0">不计算</i-Option>
                                    <i-Option value="1" key="1">计算</i-Option>

                                </i-Select>
                            </Form-Item>
                        </i-Col>
                    </Row>
                    <Row>
                        <i-Col span="24">
                            <Form-Item label="审核记录是否只显示最新轮次" prop="shjlsfzxszxlc">
                                <i-Select style="width:200px" clearable v-model="saveform.shjlsfzxszxlc">
                                    <i-Option value="0" key="0">否</i-Option>
                                    <i-Option value="1" key="1">是</i-Option>
                                </i-Select>
                            </Form-Item>
                        </i-Col>

                    </Row>
                    <Row>
                        <i-col span="24">
                            <Form-Item label="最终审核通过后置sql" prop="zzshtghzsql">
                                <i-Input v-model="saveform.zzshtghzsql" placeholder="" type="textarea" :rows="6"></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>
                    <Row>
                        <i-col span="24">
                            <Form-Item label="最终审核不通过后置sql" prop="zzshbtghzsql">
                                <i-Input v-model="saveform.zzshbtghzsql" placeholder="" type="textarea" :rows="6"></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>

                </i-Form>
                <div slot="footer">
                    <Button type="text" @click="cancel">取消</Button>
                    <Button type="info" @click="save">保存</Button>
                </div>
            </div>
        </Modal>

        <Modal v-model="modal_copy" title="复制版本号" width="430px" :mask-closable="false">
            <i-Form :model="copyform" ref="copyform" :rules="ruleValidate_copy" :label-width="120">
                <i-Input v-model="copyform.old_xtdm" style="display:none" placeholder=""></i-Input>
                <i-Input v-model="copyform.old_ywlcdm" style="display:none" placeholder=""></i-Input>

                <Form-Item label="原版本号" prop="old_ywlcbbh">
                    <i-Input v-model="copyform.old_ywlcbbh" placeholder=""></i-Input>
                </Form-Item>

                <Form-Item label="新版本号" prop="new_ywlcbbh">
                    <i-Input v-model="copyform.new_ywlcbbh" placeholder=""></i-Input>
                </Form-Item>

                <Form-Item label="业务流程名称" prop="new_ywlcmc">
                    <i-Input v-model="copyform.new_ywlcmc" placeholder=""></i-Input>
                </Form-Item>
                <Form-Item label="业务流程英文名称" prop="new_ywlcmc_en">
                    <i-Input v-model="copyform.new_ywlcmc_en" placeholder=""></i-Input>
                </Form-Item>

            </i-Form>
            <div slot="footer">
                <Button type="text" @click="cancel_copy">取消</Button>
                <Button type="info" @click="fuzhi">保存</Button>
            </div>
        </Modal>

        <Modal v-model="modal_copylc" title="复制业务流程" :mask-closable="false">
            <i-Form :model="copylcform" ref="copylcform" :rules="ruleValidate_copylc" :label-width="130">
                <i-Input v-model="copylcform.dmxt" style="display:none" placeholder=""></i-Input>
                <i-Input v-model="copylcform.oldr_ywlcdm" style="display:none" placeholder=""></i-Input>
                <i-Input v-model="copylcform.oldr_ywlcbbh" style="display:none" placeholder=""></i-Input>
                <i-Input v-model="copylcform.oldr_xtdm" style="display:none" placeholder=""></i-Input>
                <Form-Item label="源业务流程" prop="newr_ywlcdm_bbh">
                    <i-Select style="width:200px" clearable v-model="copylcform.newr_ywlcdm_bbh" filterable>
                        <i-Option v-for="item in ywlcmcList" :value="item.YWLCDM_BBH" :key="item.YWLCDM_BBH">{{
                                item.YWLCMC
                        }}(版本：{{ item.YWLCBBH }})</i-Option>
                    </i-Select>

                </Form-Item>

            </i-Form>
            <div slot="footer">
                <Button type="text" @click="cancel_copylc">取消</Button>
                <Button type="info" @click="fuzhilc">保存</Button>
            </div>
        </Modal>

        <Modal v-model="modal_ywlcbl1" :title="saveform.isEdit ? '修改' : '添加'" width="450" :mask-closable="false">
            <i-Form :model="saveform" ref="saveform1" :rules="ruleValidate" :label-width="120">
                <Form-Item label="变量代码" prop="bldm">
                    <i-Input v-model="saveform.bldm" placeholder="" style="width:200px" :disabled="saveform.isEdit">
                    </i-Input>
                </Form-Item>
                <Form-Item label="变量名称" prop="blmc">
                    <i-Input v-model="saveform.blmc" placeholder="" style="width:200px" :disabled="saveform.isEdit">
                    </i-Input>
                </Form-Item>
                <Form-Item label="变量英文名称" prop="blmc_en">
                    <i-Input v-model="saveform.blmc_en" placeholder="" style="width:200px" :disabled="saveform.isEdit">
                    </i-Input>
                </Form-Item>
                <Form-Item label="变量类型" prop="bllx" style="display:none">
                    <i-Select style="width:200px" clearable v-model="saveform.bllx">
                        <i-Option value="1" key="1">-字符-</i-Option>
                        <i-Option value="2" key="2">-整数-</i-Option>
                        <i-Option value="3" key="3">-数字-</i-Option>
                        <i-Option value="4" key="4">-日期-</i-Option>
                    </i-Select>
                </Form-Item>
                <Form-Item label="FORMAT" prop="format" style="display:none">
                    <i-Input v-model="saveform.format" placeholder="" style="width:200px"></i-Input>
                </Form-Item>
                <Form-Item label="可用否" prop="kyf">
                    <i-Select style="width:200px" clearable v-model="saveform.kyf">

                        <i-Option v-for="item in kyflist" :value="item.dm" :key="item.dm">{{ item.mc }}</i-Option>

                    </i-Select>
                </Form-Item>
            </i-Form>
            <div slot="footer">
                <Button type="text" @click="cancel_ywlcbl">取消</Button>
                <Button type="info" @click="save_ywlcbl">保存</Button>
            </div>
        </Modal>

        <Modal v-model="modal_tongbuSl" width="900px" title="可同步实例" :mask-closable="false">
            <row>
                <i-form @submit.native.prevent>
                    <i-Col span="20">
                        <Form-Item label="是否只显示该节点之前实例" :label-width="200">
                            <i-Switch v-model="pageSfzxszqjdsl" true-value="1" false-value="0"></i-Switch>

                            <!-- </i-Input> -->
                        </Form-Item>
                    </i-Col>
                    <i-Col span="4">
                        <Form-Item :label-width="0">
                            <Button type="info" @click="querytongbuSl()">查询</Button>
                        </Form-Item>
                    </i-Col>

                </i-form>
            </row>
            <Row>
                <gzlPageable v-model:data="ktbsllist" key="page01" ref="sltable" highlight-row
                    :columns="columns_ktbsl" url="/gzlshywlc/queryShywlcjkPage"
                    :param="{ 'pageYwlcdm': ywlcform.ywlcdm, 'pageYwlcbbh': ywlcform.ywlcbbh, 'pageJddm': ywlcform.jddm, 'pageSfyzz': '0', 'pageSfzxszqjdsl': pageSfzxszqjdsl }"
                    stripe>
                </gzlPageable>
            </Row>

            <div slot="footer">
                <Button type="text" @click="modal_tongbuSl = false">取消</Button>
                <Button type="info" @click="save_tongbuSl('1')">仅同步配置</Button>
                <Button type="info" @click="save_tongbuSl('2')">同步配置并重新计算该节点待办人</Button>
            </div>
        </Modal>

        <Modal v-model="modal_ywlc1" :title="saveform.isEdit ? '修改' : '添加'" width="950px" fullscreen>
            <i-Form :model="ywlcform" ref="ywlcform" :rules="ruleValidate_ywlc" :label-width="180">

                <Card style="margin : 20px 0px">
                    <p slot="title">
                        基本信息
                    </p>
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="8">
                            <Form-Item label="节点代码" prop="jddm">
                                <i-Input v-model="ywlcform.jddm" placeholder="" :disabled="true"></i-Input>
                            </Form-Item>
                        </i-col>
                        <i-col span="8">
                            <Form-Item label="节点名称" prop="jdmc">
                                <i-Input v-model="ywlcform.jdmc" placeholder=""></i-Input>
                            </Form-Item>
                        </i-col>
                        <i-col span="8">
                            <Form-Item label="节点英文名称" prop="jdmc_en">
                                <i-Input v-model="ywlcform.jdmc_en" placeholder=""></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="8">
                            <Form-Item label="节点类型" prop="jdlx">
                                <i-Select style="width:150px" clearable v-model="ywlcform.jdlx">
                                    <i-Option value="1" key="1">起始节点</i-Option>
                                    <i-Option value="2" key="2">终止节点</i-Option>
                                    <i-Option value="3" key="3">一般节点</i-Option>
                                </i-Select>
                            </Form-Item>
                        </i-col>
                        <i-col span="8">
                            <Form-Item label="显示顺序" prop="xssx">
                                <i-Input v-model="ywlcform.xssx" placeholder="" style="width:150px"></i-Input>
                            </Form-Item>
                        </i-col>
                        <i-col span="8">
                            <Form-Item label="是否控制异常终止" prop="sfkzyczz">
                                <i-Select clearable v-model="ywlcform.sfkzyczz">
                                    <i-Option value="0" key="0">不控制</i-Option>
                                    <i-Option value="1" key="1">控制</i-Option>

                                </i-Select>
                            </Form-Item>
                        </i-col>

                    </Row>

                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="24">
                            <Form-Item label="查询值sql" prop="cxzsql">
                                <i-Input v-model="ywlcform.cxzsql" placeholder="" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>

                    </Row>

                </Card>

                <Card style="margin : 20px 0px">
                    <p slot="title">
                        标题配置
                    </p>
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="12">
                            <Form-Item label="审核通过业务流程实例标题" prop="shtgywlcslbt">
                                <i-Input v-model="ywlcform.shtgywlcslbt" placeholder=""></i-Input>
                            </Form-Item>
                        </i-col>
                        <i-col span="12">
                            <Form-Item label="审核不通过业务流程实例标题" prop="shbtgywlcslbt">
                                <i-Input v-model="ywlcform.shbtgywlcslbt" placeholder=""></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>

                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="24">
                            <Form-Item label="审核通过业务流程实例标题sql" prop="shtgywlcslbtsql">
                                <i-Input v-model="ywlcform.shtgywlcslbtsql" placeholder="" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="24">
                            <Form-Item label="审核不通过业务流程实例标题sql" prop="shbtgywlcslbtsql">
                                <i-Input v-model="ywlcform.shbtgywlcslbtsql" placeholder="" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>

                    </Row>
                </Card>

                <Card style="margin : 20px 0px">
                    <p slot="title">
                        流程配置
                    </p>
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="8">
                            <Form-Item label="上一步" prop="sybjddm">
                                <i-Select clearable v-model="ywlcform.sybjddm">
                                    <i-Option v-for="item in jdformlist" :value="item.JDDM" :key="item.JDDM">{{
                                            item.JDMC
                                    }}</i-Option>
                                </i-Select>
                            </Form-Item>
                        </i-col>
                        <i-col span="8">
                            <Form-Item label="下一步" prop="xybjddm">
                                <i-Select clearable v-model="ywlcform.xybjddm">
                                    <i-Option v-for="item in jdformlist" :value="item.JDDM" :key="item.JDDM">{{
                                            item.JDMC
                                    }}</i-Option>
                                </i-Select>
                            </Form-Item>
                        </i-col>
                        <i-col span="8">
                            <Form-Item label="审核方式" prop="shfs">
                                <i-Select clearable v-model="ywlcform.shfs">
                                    <i-Option value="1" key="1">任意人员审核即流转</i-Option>
                                    <i-Option value="2" key="2">全部人员审核通过/不通过即流转，否则流程结束</i-Option>
                                    <i-Option value="3" key="3">全部人员审核通过/任意人员审核不通过即流转</i-Option>
                                    <i-Option value="3" key="4">任意人员审核通过/全部人员审核不通过即流转</i-Option>
                                </i-Select>
                            </Form-Item>
                        </i-col>

                    </Row>

                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="24">
                            <Form-Item label="上一步节点sql" prop="sybjdsql">
                                <i-Input v-model="ywlcform.sybjdsql" placeholder="" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="24">
                            <Form-Item label="下一步节点sql" prop="xybjdsql">
                                <i-Input v-model="ywlcform.xybjdsql" placeholder="" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>
                </Card>

                <Card style="margin : 20px 0px">
                    <p slot="title">
                        审核链接配置
                    </p>
                    <Button slot="extra" type="info" size="small" @click="tongbuSl('shlblj')">同步</Button>
                    <!--<a href="#" slot="extra" @click.prevent="tongbuSl('shlblj')">
                        同步
                    </a>-->
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="12">
                            <Form-Item label="是否不参与计算审核人" prop="shlbljsfbcyjsshr">
                                <i-Select v-model="ywlcform.shlbljsfbcyjsshr">
                                    <i-Option value="0" key="0">参与计算</i-Option>
                                    <i-Option value="1" key="1">不参与计算</i-Option>
                                </i-Select>

                            </Form-Item>
                        </i-col>
                        <i-col span="12">
                            <Form-Item label="审核列表链接" prop="shlblj">
                                <i-Input v-model="ywlcform.shlblj" placeholder=""></i-Input>

                                <i-Input v-model="ywlcform.shxqlj" style="display:none" placeholder=""></i-Input>
                            </Form-Item>
                        </i-col>

                    </Row>
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="24">
                            <Form-Item label="审核列表链接sql" prop="shlbljsql">
                                <i-Input v-model="ywlcform.shlbljsql" placeholder="" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>

                </Card>
                <Card style="margin : 20px 0px">
                    <p slot="title">
                        审核人员配置
                    </p>
                    <Button slot="extra" type="info" size="small" @click="tongbuSl('ryxx')">同步</Button>
                    <!--<a href="#" slot="extra" @click.prevent="tongbuSl('ryxx')">
                        同步
                    </a>-->
                    <Row type="flex" v-for="(item, index) in ywlcform.items" v-if="item.status" :key="index"
                        align="middle" style="background: #fff1f1;margin-top: 5px">
                        <i-col span="6">
                            <Form-Item label="角色" prop="shryjsmc">
                                <i-Input v-model="ywlcform.items[index].shryjsmc" style="width:120px" readonly
                                    @on-focus="shryjs(index)"></i-Input>
                            </Form-Item>
                        </i-col>

                        <i-col span="18">
                            <Form-Item label="人员">
                                <i-Select style="width:120px" t v-model="ywlcform.items[index].lb" prop="lb" clearable
                                    placeholder="请选择人员类别" @on-change="qk(index)">
                                    <i-Option value="1" key="1">角色</i-Option>
                                    <i-Option value="2" key="2">具体部门</i-Option>
                                    <i-Option value="3" key="3">具体人员</i-Option>
                                </i-Select>
                                <i-Input style="width:120px" v-model="ywlcform.items[index].ryxxmc"
                                    placeholder="请选择人员信息" readonly prop="ryxxmc" @on-focus="xzryxx(index)"></i-Input>

                                <i-Select style="width:160px" v-model="ywlcform.items[index].sfssfqrbm">
                                    <i-Option value="0" key="0">非所属发起人部门</i-Option>
                                    <i-Option value="1" key="1">所属发起人部门</i-Option>
                                </i-Select>

                                <Button type="error" v-show="index > 0" @click="jianRow(index)">删除</Button>
                                <Button type="success" v-show="index <= 0" @click="addRow()">添加</Button>

                            </Form-Item>
                        </i-col>
                        <i-col span="24">
                            <Form-Item label="人员信息查询sql">
                                <i-Input v-model="ywlcform.items[index].ryxxcxsql" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>

                    </Row>

                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="24">
                            <Form-Item label="人员信息查询sql" prop="ryxxcxsql">
                                <i-Input v-model="ywlcform.ryxxcxsql" placeholder="" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>

                    </Row>
                </Card>
                <Card style="margin : 20px 0px">
                    <p slot="title">
                        审核状态配置
                    </p>
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="12">
                            <Form-Item label="审核通过状态显示名称" prop="shtgztxsmc">
                                <i-Input v-model="ywlcform.shtgztxsmc" placeholder=""></i-Input>
                            </Form-Item>
                        </i-col>
                        <i-col span="12">
                            <Form-Item label="审核不通过状态显示名称" prop="shbtgztxsmc">
                                <i-Input v-model="ywlcform.shbtgztxsmc" placeholder=""></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="12">
                            <Form-Item label="审核通过状态显示英文名称" prop="shtgztxsmc_en">
                                <i-Input v-model="ywlcform.shtgztxsmc_en" placeholder=""></i-Input>
                            </Form-Item>
                        </i-col>
                        <i-col span="12">
                            <Form-Item label="审核不通过状态显示英文名称" prop="shbtgztxsmc_en">
                                <i-Input v-model="ywlcform.shbtgztxsmc_en" placeholder=""></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>

                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="24">
                            <Form-Item label="审核通过状态显示名称sql" prop="shtgztxsmcsql">
                                <i-Input v-model="ywlcform.shtgztxsmcsql" placeholder="" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="24">
                            <Form-Item label="审核不通过状态显示名称sql" prop="shbtgztxsmcsql">
                                <i-Input v-model="ywlcform.shbtgztxsmcsql" placeholder="" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="24">
                            <Form-Item label="审核通过状态显示英文名称sql" prop="shtgztxsmc_ensql">
                                <i-Input v-model="ywlcform.shtgztxsmc_ensql" placeholder="" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="24">
                            <Form-Item label="审核不通过状态显示英文名称sql" prop="shbtgztxsmc_ensql">
                                <i-Input v-model="ywlcform.shbtgztxsmc_ensql" placeholder="" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>
                </Card>

                <Card style="margin : 20px 0px">
                    <p slot="title">
                        审核后置sql配置
                    </p>
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="24">
                            <Form-Item label="审核通过后置sql" prop="shtghzsql">
                                <i-Input v-model="ywlcform.shtghzsql" placeholder="" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="24">
                            <Form-Item label="审核不通过后置sql" prop="shbtghzsql">
                                <i-Input v-model="ywlcform.shbtghzsql" placeholder="" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>

                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="24">
                            <Form-Item label="最终审核通过后置sql" prop="zzshtghzsql">
                                <i-Input v-model="ywlcform.zzshtghzsql" placeholder="" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>
                    <Row type="flex" align="top" class="code-row-bg">
                        <i-col span="24">
                            <Form-Item label="最终审核不通过后置sql" prop="zzshbtghzsql">
                                <i-Input v-model="ywlcform.zzshbtghzsql" placeholder="" type="textarea"></i-Input>
                            </Form-Item>
                        </i-col>
                    </Row>
                </Card>

            </i-Form>
            <div slot="footer">
                <Button type="text" @click="cancel_ywlc">取消</Button>
                <Button type="info" @click="save_ywlc">保存</Button>
            </div>
        </Modal>
        <Modal v-model="modal_ywlcbl" title="业务流程变量" width="800px" :mask-closable="false">
            <i-form inline>
                <Form-Item>
                    <Button type="success" @click="add_ywlcBl()">添加</Button>

                </Form-Item>
            </i-form>
            <i-Table :columns="columns2" :data="data2" style="width:100%">
                <template #handle="sport">
                    <!--                     <Button-Group style="width:120px"> -->
                    <Button type="info" size="small" @click="upd_ywlcBl(sport.row)">修改</Button>
                    <Button type="error" size="small" @click="del_ywlcBl(sport.row)">删除</Button>

                    <!--                     </Button-Group>  -->
                </template>
            </i-Table>
            <div slot="footer">
                <Button type="text" @click="modal_ywlcbl = false">取消</Button>
            </div>

        </Modal>
        <Modal v-model="modal_js" title="角色列表" width="800px" :mask-closable="false">
            <row>

                <i-form @submit.native.prevent ref="jdtccxform" :model="jdtccxform" inline>
                    <i-Col span="5">
                        <Form-Item label="关键字" :label-width="50">
                            <i-Input type="text" style="width:150px" v-model="jdtccxform.p_gjz" placeholder="关键字">
                            </i-Input>
                        </Form-Item>
                    </i-Col>

                    <i-Col span="2" offset="6">
                        <Form-Item>

                            <Button type="info" @click="xzryxx1('1')">查询</Button>

                        </Form-Item>
                    </i-Col>

                </i-form>
            </row>

            <i-Table :columns="jscolumns" :data="jsData" style="width:100%">
                <template #handle="sport">
                    <Button-Group style="width:120px">
                        <Button size="small" type="info" @click="js(sport.row)">选择</Button>
                    </Button-Group>
                </template>
            </i-Table>
            <div slot="footer">
                <Button type="text" @click="modal_js = false">取消</Button>
            </div>
        </Modal>
        <Modal v-model="modal_js1" title="角色列表" width="800px" :mask-closable="false">
            <i-Table :columns="jscolumns" :data="jsData" style="width:100%">
                <template #handle="sport">
                    <Button-Group style="width:120px">
                        <Button size="small" type="info" @click="js1(sport.row)">选择</Button>
                    </Button-Group>
                </template>
            </i-Table>
            <div slot="footer">
                <Button type="text" @click="modal_js1 = false">取消</Button>
            </div>
        </Modal>
        <Modal v-model="modal_yx" title="院系列表" width="800px" :mask-closable="false">
            <row>

                <i-form @submit.native.prevent ref="jdtccxform" :model="jdtccxform" inline>
                    <i-Col span="5">
                        <Form-Item label="关键字" :label-width="50">
                            <i-Input type="text" style="width:150px" v-model="jdtccxform.p_gjz" placeholder="关键字">
                            </i-Input>
                        </Form-Item>
                    </i-Col>

                    <i-Col span="2" offset="6">
                        <Form-Item>

                            <Button type="info" @click="xzryxx1('2')">查询</Button>

                        </Form-Item>
                    </i-Col>

                </i-form>
            </row>

            <i-Table :columns="yxcolumns" :data="yxData" style="width:100%">
                <template #handle="sport">
                    <Button-Group style="width:120px">
                        <Button size="small" type="info" @click="js(sport.row)">选择</Button>
                    </Button-Group>
                </template>
            </i-Table>
            <div slot="footer">
                <Button type="text" @click="modal_yx = false">取消</Button>
            </div>
        </Modal>
        <Modal v-model="modal_yh" title="用户列表" width="800px" :mask-closable="false">
            <row>

                <i-form @submit.native.prevent ref="jdtccxform" :model="jdtccxform" inline>
                    <i-Col span="5">
                        <Form-Item label="关键字" :label-width="50">
                            <i-Input type="text" style="width:150px" v-model="jdtccxform.p_gjz" placeholder="关键字">
                            </i-Input>
                        </Form-Item>
                    </i-Col>

                    <i-Col span="2" offset="6">
                        <Form-Item>

                            <Button type="info" @click="xzryxx1('3')">查询</Button>

                        </Form-Item>
                    </i-Col>

                </i-form>
            </row>

            <i-Table :columns="yhcolumcs" :data="yhData" style="width:100%">
                <template #handle="sport">
                    <Button-Group style="width:120px">
                        <Button size="small" type="info" @click="js(sport.row)">选择</Button>
                    </Button-Group>
                </template>
            </i-Table>
            <Page ref="page_yh" :total="page_yh.total" :current="page_yh.pageNum" :page-size="page_yh.pageSize"
                show-sizer show-elevator show-total @on-change="handlePage_yh" @on-page-size-change='handlePageSize_yh'>
            </Page>
            <div slot="footer">
                <Button type="text" @click="modal_yh = false">取消</Button>
            </div>
        </Modal>
        <Modal v-model="modal_ywlc" title="业务流程" width="1200px" :mask-closable="false">
            <i-form inline>
                <Form-Item>
                    <Button type="success" @click="add_ywlc()">添加</Button>

                </Form-Item>
            </i-form>
            <i-Table :columns="columns3" :data="data3" height="300" border>
                <template #handle="sport">
                    <!--                     <Button-Group style="width:120px"> -->
                    <Button type="info" size="small" @click="upd_ywlc(sport.row)">修改</Button>
                    <Button type="error" size="small" @click="del_ywlc(sport.row)" style="margin-left:5px">删除</Button>

                    <!--                     </Button-Group>  -->
                </template>
            </i-Table>
            <div slot="footer">
                <Button type="text" @click="modal_ywlc = false">取消</Button>
            </div>

        </Modal>
        <Modal v-model="modal_imp" width="500px" title="导入" :mask-closable="false">
            <i-Form :label-width="100">
                <Form-Item label="上传文件:">
                    <Upload :before-upload="handleUpload1" ref="upload" name="file" :action="imp.scwj" :data="imp"
                        :on-success="handleSuccess1">
                        <span style="color :red">*</span>
                        <Button>文件上传</Button>
                        <div v-if="file != null"> {{ file.name }}</div>
                    </Upload>
                </Form-Item>
                <Form-Item label="上传方式:">
                    <i-Select clearable v-model="imp.scfs" style="width:90%">
                        <i-Option v-for="item in scfslist" :value="item.dm" :key="item.dm">{{ item.mc }}</i-Option>
                    </i-Select>
                    <span style="color :red">*</span>
                </Form-Item>
                <Form-Item label="覆盖方式:">

                    <i-Select clearable v-model="imp.fgfs" style="width:90%">
                        <i-Option v-for="item in fgfslist" :value="item.dm" :key="item.dm">{{ item.mc }}</i-Option>
                    </i-Select>
                </Form-Item>
            </i-Form>
            <div slot="footer">
                <Button type="text" @click="cancel_imp">取消</Button>
                <Button type="info" @click="scwj">导入</Button>
            </div>
        </Modal>

        <Layout style="height:100%">
            <form id="expform" name="expform" method="post">
            </form>
            <div ref="queryHeader" data-querypanel="hide">
                <!-- 列表查询区 -->
                <i-form @submit.native.prevent ref="formInline" :model="formInline">
                    <div style="  width:100%;height:100%">
                        <row>
                            <i-Col span="5">
                                <Form-Item label="业务" :label-width="50">
                                    <i-Input type="text" v-model="formInline.dmmc" placeholder="业务名称"></i-Input>
                                </Form-Item>
                            </i-Col>
                            <i-Col span="5">
                                <Form-Item label="可用否" :label-width="60">
                                    <i-Select clearable v-model="formInline.kyf">
                                        <i-Option v-for="item in kyflist" :value="item.dm" :key="item.dm">{{ item.mc }}
                                        </i-Option>
                                    </i-Select>
                                </Form-Item>
                            </i-Col>
                            <i-Col span="5">
                                <Form-Item label="流程类别" :label-width="100">
                                    <i-Select clearable v-model="formInline.ywlclbdm">
                                        <i-Option v-for="item in ywlclbdm_list" :value="item.DM" :key="item.DM">
                                            {{ item.MC }}
                                        </i-Option>
                                    </i-Select>
                                </Form-Item>
                            </i-Col>
                            <i-Col span="2">
                                <Form-Item :label-width="10">
                                    <Checkbox v-model="formInline.sfzdbbh" :true-value="'1'" :false-value="'0'">最大版本号
                                    </Checkbox>
                                </Form-Item>
                            </i-Col>
                            <i-Col span="4">
                                <Form-Item :label-width="0">
                                    <Button type="info" @click="handleSubmit()">查询
                                    </Button>
                                </Form-Item>
                            </i-Col>
                        </row>
                    </div>
                </i-form>
            </div>
            <i-Content>
                <Layout>
                    <div data-actionpanel style="margin-bottom:10px">
                        <Button type="success" @click="add" >添加</Button>
                        <Button type="error" @click="delYw" style="margin-left:5px;margin-right:5px">删除</Button>
                        <Button type="info" @click="expGzl" style="margin-left:5px;margin-right:5px">导出</Button>
                        <Button type="info" @click="impGzl">导入</Button>

                    </div>
                    <i-Content style="width:100%;height:100%">
                        <i-Table border ref="selection" :columns="columns1" :data="data1" style="width:100%">
                            <template v-slot:handle_syzt="sport">
                                <Badge v-if="sport.row.SYZT == '已使用'" status="error" :text="sport.row.SYZT"></Badge>
                                <Badge v-if="sport.row.SYZT != '已使用'" status="success" :text="sport.row.SYZT"></Badge>
                            </template>
                            <template v-slot:handle="sport">
                                <a type="info" size="small" @click="updateDiv(sport.row)">修改</a>
                                <a type="success" size="small" @click="addYwLc(sport.row)" style="margin-left:5px;margin-right:5px">添加流程</a>
                                <Dropdown @on-click="anz(sport.row, $event)" transfer>
                                    <a type="info" size="small">
                                        更多
                                        <Icon type="arrow-down-b"></Icon>
                                    </a>
                                    <Dropdown-menu slot="list" >
                                        <Dropdown-item name=1>添加变量</Dropdown-item>
                                        <Dropdown-item name=2>复制</Dropdown-item>
                                        <Dropdown-item name=3>复制业务</Dropdown-item>
                                    </Dropdown-menu>
                                </Dropdown>
                            </template>
                        </i-Table>
                    </i-Content>
                    <Page ref="page" :total="page.total" :current="page.pageNum" :page-size="page.pageSize"
                        :page-size-opts="pageSizeOpts" show-sizer show-elevator show-total @on-change="handlePage"
                        @on-page-size-change='handlePageSize' />
                </Layout>
            </i-Content>

        </Layout>
    </div>
</template>
<script>
    import gzlPageable from './gzlPageable.vue'
    import Setting from '@/setting'
    import { exportFile } from '@/plugins/exportFile';
    export default {
        components: { gzlPageable },
        props: {},
        data () {
            return {
                jdtccxform: { p_gjz: '' },
                pageSfzxszqjdsl: '1',
                tongbubj: '',
                pageSizeOpts: [10, 20, 30, 50, 100],
                page: {
                    pageNum: 1,
                    pageSize: 20,
                    total: 0
                },
                page_yh: {
                    pageNum: 1,
                    pageSize: 10,
                    url: null,
                    data: null,
                    func: null,
                    total: 0
                },
                pageSizeOpts_yh: [10, 20, 30, 50, 100],
                modal: false,
                modal_tongbuSl: false,
                modal_ywlcbl1: false,
                modal_copy: false,
                modal_copylc: false,
                modal_ywlcbl: false,
                modal_ywlc: false,
                modal_ywlc1: false,
                modal_js: false,
                modal_js1: false,
                modal_yx: false,
                modal_yh: false,
                modal_imp: false,
                file: null,
                columns1: [
                    { type: 'selection', width: 60, align: 'center' },
                    { title: '使用状态', key: 'action', slot: 'handle_syzt', width: 96 },
                    { title: '业务流程代码', key: 'YWLCDM', sortable: 'custom' },
                    { title: '业务流程名称', key: 'YWLCMC', sortable: 'custom' },
                    { title: '业务表', key: 'YWBM', sortable: 'custom' },
                    { title: '业务表id字段', key: 'YWBIDZDM', sortable: 'custom' },
                    { title: '业务表代办人', key: 'YWBDBRZDM', sortable: 'custom', width: 140, align: 'center' },
                    { title: '版本号', key: 'YWLCBBH', sortable: 'custom', width: 100, align: 'center' },
                    { title: '流程类别', key: 'YWLCLBDM', sortable: 'custom', width: 120 },
                    {
                        title: '起始节点是否计算审核人',
                        key: 'QSJDSFJSSHR',
                        sortable: 'custom',
                        width: 130,
                        align: 'center',
                        render: (h, params) => { return h('span', params.row.QSJDSFJSSHR == '1' ? '计算' : '不计算'); }
                    },
                    {
                        title: '可用否',
                        key: 'KYF',
                        sortable: 'custom',
                        width: 100,
                        align: 'center',
                        render: (h, params) => {
                            return h('span', params.row.KYF == '1' ? '是' : '否');
                        }
                    },
                    {
                        title: '操作',
                        key: 'action',
                        fixed: 'right',
                        slot: 'handle',
                        width: 170,
                        align: 'center'
                    }
                ],
                columns2: [
                    { title: '业务名称', key: 'YWLCMC', sortable: 'custom' },
                    { title: '变量代码', key: 'BLDM', sortable: 'custom' },
                    { title: '变量名称', key: 'BLMC', sortable: 'custom' },
                    { title: '英文名称', key: 'BLMC_EN', sortable: 'custom' },
                    {
                        title: '可用否',
                        key: 'KYF',
                        sortable: 'custom',
                        render: (h, params) => {
                            return h('span', params.row.KYF == '1' ? '是' : '否');
                        }

                    },

                    {
                        title: '操作',
                        key: 'action',
                        fixed: 'right',
                        width: 120,
                        slot: 'handle'
                    }
                ],
                columns3: [
                    { title: '业务名称', key: 'ywlcmc', sortable: 'custom', width: 120 },
                    { title: '节点代码', key: 'jddm', sortable: 'custom', width: 120 },
                    { title: '节点名称', key: 'jdmc', sortable: 'custom', width: 120 },
                    { title: '人员类别', key: 'rylb', sortable: 'custom', width: 120 },
                    { title: '人员信息', key: 'ryxx', sortable: 'custom', width: 120 },
                    { title: '审核人员角色', key: 'shryjsmc', sortable: 'custom', width: 140 },

                    { title: '审核方式', key: 'shfs', sortable: 'custom', width: 120 },
                    { title: '上一步节点', key: 'sybjdmc', sortable: 'custom', width: 140 },
                    { title: '下一步节点', key: 'xybjdmc', sortable: 'custom', width: 140 },
                    { title: '节点类型', key: 'jdlx', sortable: 'custom', width: 120 },
                    { title: '显示顺序', key: 'xssx', sortable: 'custom', width: 120 },

                    {
                        title: '操作',
                        key: 'action',
                        fixed: 'right',
                        width: 140,
                        slot: 'handle'
                    }
                ],
                jscolumns: [
                    { title: '角色代码', key: 'JSDM', sortable: 'custom' },
                    { title: '角色名称', key: 'JSMC', sortable: 'custom' },
                    {
                        title: '操作',
                        key: 'action',
                        fixed: 'right',
                        width: 100,
                        slot: 'handle'
                    }
                ],
                yxcolumns: [
                    { title: '院系代码', key: 'YXDM', sortable: 'custom' },
                    { title: '院系名称', key: 'YXMC', sortable: 'custom' },
                    {
                        title: '操作',
                        key: 'action',
                        fixed: 'right',
                        width: 100,
                        slot: 'handle'
                    }
                ],
                yhcolumcs: [
                    { title: '用户代码', key: 'YHDM', sortable: 'custom' },
                    { title: '用户名称', key: 'XM', sortable: 'custom' },
                    {
                        title: '操作',
                        key: 'action',
                        fixed: 'right',
                        width: 100,
                        slot: 'handle'
                    }
                ],
                ktbsllist: [],
                columns_ktbsl:
                    [
                        { type: 'selection', width: 60, align: 'center' },

                        {
                            title: '待审核节点',
                            key: 'dshjd',
                            sortable: 'custom',
                            width: 200,
                            render: (h, params) => {
                                return h('span', params.row.dshjddm + '：' + params.row.dshjdmc);
                            }
                        },

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

                        { title: '审核状态', key: 'yshjdztxsmc', sortable: 'custom', width: 120 }

                    ],

                ruleValidate: {
                    ywlcdm: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    ywbm: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    ywbidzdm: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    ywbdbrzdm: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    ywlcbbh: [
                        { required: true, pattern: /^(([1-9]\d{0,3})|0)(\.\d{0,2})?$/, message: '请输入数字', trigger: 'blur' }
                    ],
                    kyf: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    bldm: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    blmc: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    format: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    blmc_en: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ]

                },
                ruleValidate_copy: {
                    old_ywlcbbh: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    new_ywlcbbh: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ]

                },
                ruleValidate_copylc: {
                    newr_ywlcdm_bbh: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ]

                },
                ruleValidate_ywlc: {
                    jddm: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    jdlx: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    sfssfqrbm: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    xssx: [
                        { required: true, pattern: /^(([1-9]\d{0,3})|0)(\.\d{0,2})?$/, message: '请输入数字', trigger: 'blur' }
                    ],
                    shfs: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ],
                    sfkzyczz: [
                        { required: true, message: '必填', trigger: 'blur' }
                    ]

                },
                data1: [],
                data2: [],
                data3: [],
                jsData: [],
                yxData: [],
                yhData: [],
                saveform: {
                    ids: '',
                    isEdit: false,
                    ywlcdm: '',
                    ywlcmc: '',
                    ywbm: '',
                    ywbidzdm: '',
                    ywbdbrzdm: '',
                    ywlcshcklj: '',
                    swxqcklj: '',
                    ywlcmc_en: '',
                    ywlcbbh: '',
                    ywlclbdm: '',
                    kyf: null,
                    xtdm: '',
                    bldm: '',
                    blmc: '',
                    bllx: '',
                    blmc_en: '',
                    format: '',
                    qsjdsfjsshr: '',
                    shjlsfzxszxlc: '',
                    zzshtghzsql: '',
                    zzshbtghzsql: ''
                },
                copyform: {
                    old_xtdm: '',
                    old_ywlcdm: '',
                    old_ywlcbbh: '',
                    new_ywlcbbh: '',
                    new_ywlcmc: '',
                    new_ywlcmc_en: ''
                },
                copylcform: {
                    oldr_ywlcdm: '',
                    oldr_ywlcbbh: '',
                    oldr_xtdm: '',
                    newr_ywlcdm_bbh: '',
                    newr_ywlcdm: '',
                    newr_ywlcbbh: ''
                },
                ywlcform: {
                    ryxx: '',
                    ryxxz: '',
                    lb: '',
                    index: '',
                    ywlcdm: '',
                    ywlcbbh: '',
                    jddm: '',
                    jdmc: '',
                    sybjdmc: '',
                    xybjdmc: '',
                    sybjdsql: '',
                    xybjdsql: '',
                    cxzsql: '',
                    shxqlj: '',
                    shfs: '',
                    jdlx: '',
                    qxdm: '',
                    shtgqzsj: '',
                    shbtgqzsj: '',
                    shtghzsj: '',
                    shbtghzsj: '',
                    shtgztxsmc: '',
                    shbtgztxsmc: '',
                    sfssfqrbm: '',
                    ryxxcxsql: '',
                    shtgqzsjdm: '',
                    shbtgqzsjdm: '',
                    shtghzsjdm: '',
                    shbtghzsjdm: '',
                    jdmc_en: '',
                    shtgztxsmc_en: '',
                    shbtgztxsmc_en: '',
                    ryxxmc_en: '',
                    shryjsmc_en: '',
                    xssx: '',
                    items: [],

                    shtgztxsmcsql: '',
                    shbtgztxsmcsql: '',
                    shtgztxsmc_ensql: '',
                    shbtgztxsmc_ensql: '',
                    shlbljsql: '',
                    shlbljsfbcyjsshr: '',

                    shtgywlcslbt: '',
                    shtgywlcslbtsql: '',
                    shbtgywlcslbt: '',
                    shbtgywlcslbtsql: '',

                    sfkzyczz: '',
                    shtghzsql: '',
                    shbtghzsql: '',
                    zzshtghzsql: '',
                    zzshbtghzsql: ''
                },
                imp: {
                    scfs: '',
                    scwj: '',
                    fgfs: ''
                },
                ywlclbdm_list: [],
                ywlcmcList: [],
                jdformlist: [],
                formInline: {
                    dmmc: '',
                    kyf: '',
                    sfzdbbh: '',
                    ywlclbdm: ''
                },
                kyflist: [{ dm: '1', mc: '可用' }, { dm: '0', mc: '不可用' }],
                scfslist: [{ dm: '1', mc: '追加' }, { dm: '0', mc: '覆盖' }],
                fgfslist: [{ dm: '1', mc: '精确至版本号' }, { dm: '0', mc: '删除该业务流程所有版本，并导入' }]
            }
        },
        methods: {
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
                    Object.assign(data, {
                        pageNum: this.page.pageNum,
                        pageSize: this.page.pageSize
                    });
                } else {
                    Object.assign(data, {
                        pageNum: 1,
                        pageSize: this.page.pageSize
                    });
                }

                self.commonsJs.selfRequest(url, data).then(res => {
                    if (res.total) { } else {
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
            anz: function (rowa, namea) {
                if (namea == '1') { this.addYwLcbl(rowa); } else if (namea == '2') { this.Copybbh(rowa); } else if (namea == '3') { this.CopyYwlc(rowa); }
            },
            PostByPage1: function PostByPage (pageduixiang, url, data, func, flag) {
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
                self.commonsJs.selfRequest(url, data).then(res => {
                    if (res.total) { } else {
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
            handlePage_yh: function handlePage_yh (value) {
                this.page_yh.pageNum = value;
                this.queryyh(value);
            },
            handlePageSize_yh: function handlePageSize_yh (value) {
                if (this.page_yh.func) {
                    this.page_yh.pageSize = value;
                    this.queryyh();
                }
            },

            handleSubmit: function () {
                const self = this
                this.PostByPage('/gzljcsz/queryYwList', this.formInline, function (res) {
                    self.data1 = res.YwList ? res.YwList.list : [];
                    self.ywlclbdm_list = res.lbList
                    self.ywlcmcList = res.ywlcmcList
                })
            },
            save: function () {
                const self = this
                this.$refs.saveform.validate((valid) => {
                    if (valid) {
                        self.commonsJs.selfRequest('/gzljcsz/addorupdate', self.saveform).then(result => {
                            if (result == '1') {
                                self.$Message.success({
                                    background: true,
                                    duration: 5,
                                    content: '操作成功'
                                });
                            }
                            if (result == '2') {
                                self.$Message.error({
                                    background: true,
                                    duration: 5,
                                    content: '操作失败'
                                });
                            }

                            if (result == '3') {
                                self.$Message.success({
                                    background: true,
                                    duration: 5,
                                    content: '操作成功'
                                });
                            }
                            if (result == '4') {
                                self.$Message.error({
                                    background: true,
                                    duration: 5,
                                    content: '操作失败'
                                });
                            }

                            self.modal = false
                            self.handleSubmit()
                        })
                    } else {

                    }
                })
                return false;
            },

            add: function () {
                this.$refs.saveform.resetFields();
                this.modal = true;
                this.saveform.isEdit = false;
            },
            updateDiv: function (params) {
                const self = this
                self.commonsJs.selfRequest('/gzljcsz/querypzsfcz', { ywlcdm: params.YWLCDM, ywlcbbh: params.YWLCBBH, xtdm: params.XTDM }).then(res => {
                    if (res > 0) {
                        self.$Message.success({
                            background: true,
                            closable: true,
                            duration: 10,
                            content: '该业务已被使用，请复制新版本'
                        });
                    } else {
                        self.commonsJs.selfRequest('/gzljcsz/queryOneYw', { ywlcdm: params.YWLCDM, ywlcbbh: params.YWLCBBH, xtdm: params.XTDM }).then(res => {
                            self.saveform.isEdit = true;
                            self.modal = true;
                            Object.assign(self.saveform, res);
                        })
                    }
                })
            },
            Copybbh: function (params) {
                this.copyform.old_xtdm = params.XTDM;
                this.copyform.old_ywlcdm = params.YWLCDM;
                this.copyform.old_ywlcbbh = params.YWLCBBH;
                this.copyform.new_ywlcbbh = '';

                this.copyform.new_ywlcmc = params.YWLCMC;
                this.copyform.new_ywlcmc_en = params.YWLCMC_EN;
                this.modal_copy = true;
            },
            CopyYwlc: function (params) {
                this.copylcform.oldr_xtdm = params.XTDM;
                this.copylcform.oldr_ywlcdm = params.YWLCDM;
                this.copylcform.oldr_ywlcbbh = params.YWLCBBH;
                this.modal_copylc = true;
            },
            delYw: function () {
                const self = this
                let ids = '';
                const bs = this.$refs.selection.getSelection()
                if (bs == '') {
                    self.$Message.success({
                        background: true,
                        closable: true,
                        duration: 10,
                        content: '请选择数据！'
                    });
                } else {
                    this.$refs.selection.getSelection().forEach(e => {
                        ids += e.YWLCDM + '@' + e.XTDM + '@' + e.YWLCBBH + ','
                    });
                    ids = ids.substring(0, ids.length - 1);

                    self.commonsJs.selfRequest('/gzljcsz/delYw', { ids }).then(res => {
                        if (res == 1) {
                            self.$Message.success({ background: true, duration: 5, content: '操作成功' });
                        } else {
                            self.$Message.error({ background: true, closable: true, duration: 10, content: '删除失败，存在不能删除实例，请重新选择' });
                        }
                        self.handleSubmit();
                    })
                }
            },
            fuzhi: function () {
                const self = this
                self.commonsJs.selfRequest('/gzljcsz/fuzhi', this.copyform).then(res => {
                    if (res == 3) {
                        self.$Message.success({
                            background: true,
                            closable: true,
                            duration: 10,
                            content: '不能复制，已存在该版本号'
                        });
                    } else if (res == 1) {
                        self.$Message.success({
                            background: true,
                            duration: 5,
                            content: '操作成功'
                        });
                    } else {
                        self.$Message.error({
                            background: true,
                            duration: 5,
                            content: '操作失败'
                        });
                    }
                    self.modal_copy = false;
                    self.handleSubmit();
                })
            },
            fuzhilc: function () {
                const self = this
                this.copylcform.newr_ywlcdm = this.copylcform.newr_ywlcdm_bbh.split('@')[0];
                this.copylcform.newr_ywlcbbh = this.copylcform.newr_ywlcdm_bbh.split('@')[1];

                self.commonsJs.selfRequest('/gzljcsz/fuzhiYwlc', this.copylcform).then(res => {
                    if (res == 1) {
                        self.$Message.success({
                            background: true,
                            duration: 5,
                            content: '操作成功'
                        });
                    } else {
                        self.$Message.error({
                            background: true,
                            duration: 5,
                            content: '操作失败'
                        });
                    }
                    self.modal_copylc = false;
                    self.handleSubmit();
                })
            },
            addYwLcbl: function (params) {
                const self = this
                self.saveform.ywlcdm = params.YWLCDM;
                self.saveform.ywlcmc = params.YWLCMC;
                self.saveform.ywlcbbh = params.YWLCBBH;

                self.commonsJs.selfRequest('/gzljcsz/queryYwlcBl', this.saveform).then(res => {
                    self.data2 = res.list;
                })
                self.modal_ywlcbl = true;
            },
            showYwlcbl: function () {
                const self = this
                self.commonsJs.selfRequest('/gzljcsz/queryYwlcBl', this.saveform).then(res => {
                    self.data2 = res.list;
                })
            },
            add_ywlcBl: function () {
                const self = this
                self.commonsJs.selfRequest('/gzljcsz/querypzsfcz', this.saveform).then(res => {
                    if (res > 0) {
                        self.$Message.success({
                            background: true,
                            closable: true,
                            duration: 10,
                            content: '该业务已被使用，无法添加业务流程变量！'
                        });
                    } else {
                        self.modal_ywlcbl1 = true
                        self.saveform.isEdit = false
                        self.$refs.saveform1.resetFields();
                    }
                })
            },
            upd_ywlcBl: function (params) {
                const self = this
                self.saveform.isEdit = true
                self.saveform.bldm = params.BLDM
                self.commonsJs.selfRequest('/gzljcsz/queryOneYwlcBl', this.saveform).then(res => {
                    self.modal_ywlcbl1 = true
                    Object.assign(self.saveform, res);
                })
            },
            save_ywlcbl: function () {
                const self = this
                self.commonsJs.selfRequest('/gzljcsz/querypzsfcz', this.saveform).then(res => {
                    if (res > 0) {
                        self.$Message.success({
                            background: true,
                            closable: true,
                            duration: 10,
                            content: '该业务已被使用，无法修改业务流程变量！'
                        });
                    } else {
                        let url = '';

                        if (self.saveform.isEdit) {
                            url = '/gzljcsz/updYwlcBl'
                        } else {
                            url = '/gzljcsz/addYwlcBl'
                        }

                        self.commonsJs.selfRequest(url, self.saveform).then(res => {
                            if (res == '1') {
                                self.$Message.success({
                                    background: true,
                                    duration: 5,
                                    content: '操作成功'
                                });
                                self.modal_ywlcbl1 = false;
                                self.showYwlcbl();
                            } else {
                                self.$Message.error({
                                    background: true,
                                    closable: true,
                                    duration: 10,
                                    content: '变量重复！'
                                });
                            }
                        })
                        return false;
                    }
                })
            },
            del_ywlcBl: function (params) {
                const self = this
                self.saveform.bldm = params.BLDM
                self.saveform.ywlcdm = params.YWLCDM
                self.saveform.ywlcbbh = params.YWLCBBH

                self.commonsJs.selfRequest('/gzljcsz/querypzsfcz', this.saveform).then(res => {
                    if (res > 0) {
                        self.$Message.success({
                            background: true,
                            closable: true,
                            duration: 10,
                            content: '该业务已被使用，无法删除业务流程变量！'
                        });
                    } else {
                        self.commonsJs.selfRequest('/gzljcsz/deleteYwbl', self.saveform).then(res => {
                            if (res == '1') {
                                self.$Message.success({
                                    background: true,
                                    duration: 5,
                                    content: '操作成功'
                                });
                                self.showYwlcbl();
                            } else {
                                self.$Message.error({
                                    background: true,
                                    duration: 5,
                                    content: '删除失败'
                                });
                            }
                        })
                    }
                })
            },
            addYwLc: function (params) {
                const self = this;
                self.ywlcform.ywlcdm = params.YWLCDM;
                self.ywlcform.ywlcbbh = params.YWLCBBH;
                self.commonsJs.selfRequest('/gzljcsz/queryYwlc', this.ywlcform).then(res => {
                    self.data3 = res.list;
                })
                self.modal_ywlc = true;
            },
            showYwLc: function () {
                const self = this;
                self.commonsJs.selfRequest('/gzljcsz/queryYwlc', self.ywlcform).then(res => {
                    self.data3 = res.list;
                })
            },
            tongbuSl: function (tongbubj) {
                const self = this;
                self.tongbubj = tongbubj;
                self.pageSfzxszqjdsl = '1';
                if (!self.saveform.isEdit) {
                    self.$Message.error({
                        background: true,
                        closable: true,
                        duration: 5,
                        content: '请先进行保存再同步！'
                    });
                    return;
                }
                this.$refs.sltable.query();
                self.modal_tongbuSl = true;
            },
            querytongbuSl () { this.$refs.sltable.query(); },
            save_tongbuSl: function (tongbufs) {
                const self = this;
                let ids = '';
                const bs = this.$refs.sltable.getSelection()
                if (bs == '') {
                    self.$Message.success({
                        background: true,
                        closable: true,
                        duration: 10,
                        content: '请选择数据！'
                    });
                    return;
                }

                this.$refs.sltable.getSelection().forEach(e => {
                    ids += e.ywlcdm + '@' + e.ywlcslid + ','
                });
                ids = ids.substring(0, ids.length - 1);

                self.commonsJs.selfRequest('/gzljcsz/querypzsfcz', this.ywlcform).then(res => {
                    if (res > 0) {
                        self.$Message.success({
                            background: true,
                            closable: true,
                            duration: 10,
                            content: '该业务已被使用，无法修改业务流程！'
                        });
                    } else {
                        self.$refs.ywlcform.validate((valid) => {
                            self.ywlcform.items.forEach(e => {
                                if (e.shryjsmc == '' || e.ryxxmc == '' || e.lb == '') {
                                    self.$Message.success({
                                        background: true,
                                        closable: true,
                                        duration: 10,
                                        content: '请填写审核人员角色名称或人员信息'
                                    });
                                    valid = false;
                                }
                            })
                            if (valid) {
                                self.ywlcform.ryxxz = '';
                                self.ywlcform.items.forEach(e => {
                                    self.ywlcform.ryxxz = self.ywlcform.ryxxz + e.ryxx + '@' + e.ryxxmc + '@' + e.shryjsmc + '@' + e.shryjsdm + '@' + e.lb + ','
                                })
                                self.$Spin.show();

                                self.commonsJs.selfRequest('/gzljcsz/updateywlcjd', self.ywlcform).then(result => {
                                    if (result == '1') {
                                        self.commonsJs.selfRequest('/gzlshywlc/tongbusl', {
                                            ids,
                                            ywlcdm: self.ywlcform.ywlcdm,
                                            ywlcbbh: self.ywlcform.ywlcbbh,
                                            jddm: self.ywlcform.jddm,
                                            tongbubj: self.tongbubj,
                                            tongbufs
                                        }).then(res => {
                                            setTimeout(function () {
                                                self.$Spin.hide();
                                            }, 500);
                                            self.showYwLc();
                                            if (rr.jg == '1') {
                                                self.$Message.success({
                                                    background: true,
                                                    closable: true,
                                                    duration: 9999999999,
                                                    content: rr.message
                                                });
                                            } else {
                                                self.$Message.error({
                                                    background: true,
                                                    closable: true,
                                                    duration: 99999999999,
                                                    content: rr.message
                                                });
                                            }
                                        })
                                    } else {
                                        setTimeout(function () {
                                            self.$Spin.hide();
                                        }, 500);
                                        self.$Message.error({
                                            background: true,
                                            closable: true,
                                            duration: 10,
                                            content: '该节点名称存在！'
                                        });
                                        self.ywlcform.ryxxz = '';
                                    }
                                })
                            } else {
                                self.$Message.error({
                                    background: true,
                                    closable: true,
                                    duration: 10,
                                    content: '请完整填写表单！'
                                });
                            }
                        })
                        return false;
                    }
                })
            },
            add_ywlc: function () {
                const self = this;
                self.commonsJs.selfRequest('/gzljcsz/querypzsfcz', this.ywlcform).then(res => {
                    if (res > 0) {
                        self.$Message.success({
                            background: true,
                            closable: true,
                            duration: 10,
                            content: '该业务已被使用，无法添加业务流程！'
                        });
                    } else {
                        // self.commonsJs.selfRequest('/gzljcsz/queryJddm',{}).then(res=>{
                        self.$refs.ywlcform.resetFields();
                        self.modal_ywlc1 = true;
                        self.saveform.isEdit = false;
                        self.ywlcform.jddm = self.commonsJs.sys_guid();
                        self.ywlcform.items = [];
                        self.ywlcform.ryxxz = '';
                        self.ywlcform.items.push({
                            value: '',
                            index: '',
                            status: 1,
                            ryxx: '',
                            ryxxmc: '',
                            shryjsmc: '',
                            shryjsdm: '',
                            lb: '',
                            sfssfqrbm: '0',
                            ryxxcxsql: ''
                        });
                        // })
                        self.commonsJs.selfRequest('/gzljcsz/queryjdlist', self.ywlcform).then(res => {
                            self.jdformlist = res
                        })
                    }
                })
            },
            addRow: function () {
                const self = this
                this.ywlcform.items.push({
                    value: '',
                    index: '',
                    status: 1,
                    ryxx: '',
                    ryxxmc: '',
                    shryjsmc: '',
                    shryjsdm: '',
                    lb: '',
                    sfssfqrbm: '0',
                    ryxxcxsql: ''
                });
            },
            jianRow: function (num) {
                this.ywlcform.items.splice(num, num);
            },
            xzryxx: function (e) {
                const self = this;
                self.jdtccxform.p_gjz = '';
                const ld = self.ywlcform.items[e].lb;
                if (ld == '' || ld == undefined) {
                    self.$Message.success({
                        background: true,
                        closable: true,
                        duration: 10,
                        content: '请选择人员类别！'
                    });
                    return false;
                }
                self.ywlcform.index = e;
                if (ld == 1) {
                    self.commonsJs.selfRequest('/gzljcsz/queryJueSe', {}).then(res => {
                        self.jsData = res.list;
                        self.modal_js = true;
                    })
                }
                if (ld == 2) {
                    self.commonsJs.selfRequest('/gzljcsz/queryAllyx', {}).then(res => {
                        self.yxData = res.list;
                        self.modal_yx = true;
                    })
                }
                if (ld == 3) {
                    this.PostByPage1(this.page_yh, '/gzljcsz/queryAllyh', {}, function (res) {
                        self.yhData = res.yhlist.list;
                        self.page_yh.pageNum = res.yhlist.pageNum;
                        self.page_yh.pageSize = res.yhlist.pageSize;
                        self.modal_yh = true;
                    })
                }
            },
            xzryxx1: function (l) {
                const self = this;
                const ld = l

                if (ld == '1') {
                    self.commonsJs.selfRequest('/gzljcsz/queryJueSe', self.jdtccxform).then(res => {
                        self.jsData = res.list;
                    })
                }
                if (ld == '2') {
                    self.commonsJs.selfRequest('/gzljcsz/queryAllyx', self.jdtccxform).then(res => {
                        self.yxData = res.list;
                    })
                }
                if (ld == '3') {
                    this.PostByPage1(this.page_yh, '/gzljcsz/queryAllyh', self.jdtccxform, function (res) {
                        self.yhData = res.yhlist.list;
                        self.page_yh.pageNum = res.yhlist.pageNum;
                        self.page_yh.pageSize = res.yhlist.pageSize;
                    })
                }
            },
            queryyh: function (pageNum) {
                const self = this;
                this.PostByPage1(this.page_yh, '/gzljcsz/queryAllyh', {}, function (res) {
                    self.yhData = res.yhlist.list;
                    self.page_yh.pageNum = res.yhlist.pageNum;
                    self.page_yh.pageSize = res.yhlist.pageSize;
                    self.modal_yh = true;
                }, pageNum)
            },
            js: function (params) {
                const self = this
                const index = self.ywlcform.index
                const ld = self.ywlcform.items[index].lb;
                if (ld == 1) {
                    self.ywlcform.items[index].ryxx = params.JSDM;
                    self.ywlcform.items[index].ryxxmc = params.JSMC;
                    self.ywlcform.ryxxmc_en = params.JSMC_EN,
                    self.modal_js = false;
                }
                if (ld == 2) {
                    self.ywlcform.items[index].ryxx = params.YXDM;
                    self.ywlcform.items[index].ryxxmc = params.YXMC;
                    self.ywlcform.ryxxmc_en = params.YXMC_EN,
                    self.modal_yx = false;
                }
                if (ld == 3) {
                    self.ywlcform.items[index].ryxx = params.YHDM;
                    self.ywlcform.items[index].ryxxmc = params.XM;
                    self.ywlcform.ryxxmc_en = params.XM_EN,
                    self.modal_yh = false;
                }
            },
            js1: function (params) {
                const self = this
                const index = self.ywlcform.index
                self.ywlcform.items[index].shryjsdm = params.JSDM;
                self.ywlcform.items[index].shryjsmc = params.JSMC;
                self.ywlcform.shryjsmc_en = params.JSMC_EN,
                self.modal_js1 = false;
            },
            shryjs: function (index) {
                const self = this
                self.commonsJs.selfRequest('/gzljcsz/queryJueSe', {}).then(res => {
                    self.jsData = res.list;
                    self.modal_js1 = true;
                    self.ywlcform.index = index;
                })
            },
            save_ywlc: function () {
                const self = this
                self.commonsJs.selfRequest('/gzljcsz/querypzsfcz', this.ywlcform).then(res => {
                    if (res > 0) {
                        self.$Message.success({
                            background: true,
                            closable: true,
                            duration: 10,
                            content: '该业务已被使用，无法修改业务流程！'
                        });
                    } else {
                        let url = '';
                        self.$refs.ywlcform.validate((valid) => {
                            self.ywlcform.items.forEach(e => {
                                if (e.shryjsmc == '' || e.ryxxmc == '' || e.lb == '') {
                                    self.$Message.success({
                                        background: true,
                                        closable: true,
                                        duration: 10,
                                        content: '请填写审核人员角色名称或人员信息'
                                    });
                                    valid = false;
                                }
                            })
                            if (valid) {
                                self.ywlcform.ryxxz = '';
                                self.ywlcform.items.forEach(e => {
                                    self.ywlcform.ryxxz = self.ywlcform.ryxxz + e.ryxx + '@' + e.ryxxmc + '@' + e.shryjsmc + '@' + e.shryjsdm + '@' + e.lb + ','
                                })
                                if (self.saveform.isEdit) {
                                    url = '/gzljcsz/updateywlcjd'
                                } else {
                                    url = '/gzljcsz/addywlcjd'
                                }

                                self.commonsJs.selfRequest(url, self.ywlcform).then(result => {
                                    if (result == '1') {
                                        self.$Message.success({
                                            background: true,
                                            duration: 5,
                                            content: '操作成功'
                                        });
                                        self.modal_ywlc1 = false;
                                        self.showYwLc();
                                    } else {
                                        self.$Message.error({
                                            background: true,
                                            closable: true,
                                            duration: 10,
                                            content: '该节点名称存在！'
                                        });
                                        self.ywlcform.ryxxz = '';
                                    }
                                })
                            } else {

                            }
                        })
                        return false;
                    }
                })
            },
            del_ywlc: function (params) {
                const self = this;
                self.ywlcform.jddm = params.jddm;
                self.ywlcform.ywlcdm = params.ywlcdm;
                self.ywlcform.ywlcbbh = params.ywlcbbh;
                self.commonsJs.selfRequest('/gzljcsz/querypzsfcz', this.ywlcform).then(res => {
                    if (res > 0) {
                        self.$Message.success({
                            background: true,
                            closable: true,
                            duration: 10,
                            content: '该业务已被使用，无法删除业务流程！'
                        });
                    } else {
                        self.commonsJs.selfRequest('/gzljcsz/delYwlc', self.ywlcform).then(res => {
                            if (res == '1') {
                                self.$Message.success({
                                    background: true,
                                    duration: 5,
                                    content: '操作成功'
                                });
                                self.showYwLc();
                            } else {
                                self.$Message.error({
                                    background: true,
                                    duration: 5,
                                    content: '操作失败'
                                });
                            }
                        })
                    }
                })
            },
            upd_ywlc: function (params) {
                const self = this;
                self.ywlcform.jddm = params.jddm;
                self.ywlcform.ywlcdm = params.ywlcdm;
                self.ywlcform.ywlcbbh = params.ywlcbbh;
                this.ywlcform.items = [];
                self.ywlcform.ryxxz = '';
                self.saveform.isEdit = true;

                self.commonsJs.selfRequest('/gzljcsz/queryjdlist', this.ywlcform).then(res => {
                    self.jdformlist = res
                })

                self.commonsJs.selfRequest('/gzljcsz/queryOneYwlcjd', this.ywlcform).then(res => {
                    Object.assign(self.ywlcform, res.one);
                    self.modal_ywlc1 = true;
                    if (res.xqlist != null && res.xqlist.length > 0) {
                        res.xqlist.forEach((vv, ii) => {
                            self.ywlcform.items.push({
                                value: '',
                                index: '',
                                status: 1,
                                ryxx: vv.ryxx,
                                ryxxmc: vv.ryxxmc,
                                shryjsmc: vv.shryjsmc,
                                shryjsdm: vv.shryjsdm,
                                lb: vv.rylb,
                                sfssfqrbm: vv.sfssfqrbm,
                                ryxxcxsql: vv.ryxxcxsql
                            });
                        })
                    } else {
                        if (res.one.ryxx.indexOf(',') == -1) {
                            self.ywlcform.items.push({
                                value: '',
                                index: '',
                                status: 1,
                                ryxx: res.one.ryxx,
                                ryxxmc: res.one.ryxxmc,
                                shryjsmc: res.one.shryjsmc,
                                shryjsdm: res.one.shryjsdm,
                                lb: res.one.rylb,
                                sfssfqrbm: res.one.sfssfqrbm,
                                ryxxcxsql: ''
                            });
                        } else {
                            const shuzu = res.one.ryxx.split(',');
                            const ryxxmczu = res.one.ryxxmc.split(',');
                            const shryjsmczu = res.one.shryjsmc.split(',');
                            const shryjsdmzu = res.one.shryjsdm.split(',');
                            const lbzu = res.one.rylb.split(',');
                            for (let i = 0; i < shuzu.length; i++) {
                                self.ywlcform.items.push({
                                    value: '',
                                    index: '',
                                    status: 1,
                                    ryxx: shuzu[i],
                                    ryxxmc: ryxxmczu[i],
                                    shryjsmc: shryjsmczu[i],
                                    shryjsdm: shryjsdmzu[i],
                                    lb: lbzu[i],
                                    sfssfqrbm: res.one.sfssfqrbm,
                                    ryxxcxsql: ''
                                });
                            }
                        }
                    }
                })
            },
            qk: function (e) {
                const self = this;
                self.ywlcform.items[e].ryxxmc = '';
                self.ywlcform.items[e].ryxx = '';
                if (self.ywlcform.items[e].lb == '1') {
                    self.ywlcform.items[e].ryxxmc = self.ywlcform.items[e].shryjsmc;
                    self.ywlcform.items[e].ryxx = self.ywlcform.items[e].shryjsdm;
                }
            },
            cancel: function () {
                this.modal = false
            },
            cancel_copy: function () {
                this.modal_copy = false
            },
            cancel_copylc: function () {
                this.modal_copylc = false
            },
            cancel_ywlcbl: function () {
                this.modal_ywlcbl1 = false
            },
            cancel_ywlc: function () {
                this.modal_ywlc1 = false
            },
            cancel_imp: function () {
                this.modal_imp = false
            },
            expGzl: function () {
                const self = this;
                const xzsj = self.$refs.selection.getSelection();
                let ids = '';
                if (xzsj == '') {
                    self.$Message.success({
                        background: true,
                        closable: true,
                        duration: 10,
                        content: '请选择数据！'
                    });
                } else {
                    self.$refs.selection.getSelection().forEach(function (e) {
                        ids += e.YWLCDM + '@' + e.YWLCBBH + ','
                    });
                    ids = ids.substring(0, ids.length - 1);
                    self.saveform.ids = ids;
                    exportFile('/gzljcsz/expGzl?ywdm=' + self.saveform.ids, {}, 'gzlsz.in', this);
                }
            },
            impGzl: function () {
                const self = this;
                self.file = null;
                self.imp.scfs = '';
                self.imp.fgfs = '';
                self.$refs.upload.clearFiles();
                self.modal_imp = true;
            },
            handleUpload1: function (file) {
                const self = this;
                self.file = file;
                const index = file.name.lastIndexOf('.');
                const suffix = file.name.substr(index + 1);
                if (suffix != 'in') {
                    self.$Message.success({
                        background: true,
                        closable: true,
                        duration: 10,
                        content: '只能上传inco'
                    });
                    self.file = null;
                }
                return false;
            },
            scwj: function () {
                const self = this;
                if (self.file == null) {
                    self.$Message.success({
                        background: true,
                        closable: true,
                        duration: 10,
                        content: '请上传文件'
                    });
                    return;
                }
                if (self.imp.scfs == '') {
                    self.$Message.success({
                        background: true,
                        closable: true,
                        duration: 10,
                        content: '请选择上传方式'
                    });
                    return;
                }
                self.$refs.upload.post(self.file);
            },
            handleSuccess1: function (res) {
                const self = this;
                if (res == '1') {
                    self.$Message.success({
                        background: true,
                        duration: 5,
                        content: '操作成功'
                    });
                    self.file = null;
                    self.modal_imp = false;
                    self.handleSubmit();
                }
            }

        },
        computed: {
        },
        mounted () {
            const self = this
            this.handleSubmit();
            self.imp.scwj = Setting.apiBaseURL + '/gzljcsz/impGzl';
        }
    }
</script>
