<template>
	<div>
		<div class="fd-nav">
			<div class="fd-nav-left">
				<div class="fd-nav-back" @click="toReturn"><i class="anticon anticon-left"></i></div>
				<div class="fd-nav-title">{{workFlowName}}</div>
			</div>
			<!-- <div class="fd-nav-center">
                <div class="fd-nav-container">
                    <div class="ghost-bar" style="transform: translateX(300px);"></div>
                    <div class="fd-nav-item"><span class="order-num">1</span>基础设置</div>
                    <div class="fd-nav-item"><span class="order-num">2</span>表单设计</div>
                    <div class="fd-nav-item active"><span class="order-num">3</span>流程设计</div>
                    <div class="fd-nav-item"><span class="order-num">4</span>高级设置</div>
                </div>
            </div> -->
			<div class="fd-nav-right">
				<!-- <button type="button" class="ant-btn button-preview"><span>预 览</span></button> -->
                <button type="button" class="ant-btn button-preview" @click="test">test</button>
				<button type="button" class="ant-btn button-publish" @click="saveSet"><span>保存配置</span></button>
				<button type="button" class="ant-btn button-publish" @click="fbgzl"><span>发布</span></button>
			</div>
		</div>
		<div class="fd-nav-content">
			<section class="dingflow-design">
				<div class="zoom">
					<div :class="'zoom-out'+ (nowVal==50?' disabled':'')" @click="zoomSize(1)"></div>
					<span>{{nowVal}}%</span>
					<div :class="'zoom-in'+ (nowVal==300?' disabled':'')" @click="zoomSize(2)"></div>
				</div>
				<div class="box-scale" id="box-scale" :style="'transform: scale('+nowVal/100+'); transform-origin: 50% 0px 0px;'">
					<nodeWrap :nodeConfig.sync="nodeConfig" :flowPermission.sync="flowPermission"></nodeWrap>

                    <!-- <div class="end-node" style="color: red;cursor: pointer;">
						<div class="end-node-circle"></div>
						<div class="end-node-text">流程结束</div>
					</div> -->
				</div>
			</section>
		</div>
		<errorDialog
			:visible.sync="tipVisible"
			:list="tipList"
		/>
		<promoterDrawer />
		<approverDrawer  :directorMaxLevel="directorMaxLevel"/>
		<!-- <copyerDrawer /> -->
		<conditionDrawer />
	</div>
</template>
<script>
    import nodeWrap from './nodeWrap.vue'
    import errorDialog from './dialog/errorDialog'
    import promoterDrawer from './drawer/promoterDrawer'
    import approverDrawer from './drawer/approverDrawer'
    // import copyerDrawer from './drawer/copyerDrawer'
    import conditionDrawer from './drawer/conditionDrawer'
    // import { getWorkFlowData, setWorkFlowData } from '@/plugins/api.js'
    // import { mapMutations } from 'vuex'
    export default {
        name: 'jworkflow',
        components: {
            nodeWrap,
            errorDialog,
            promoterDrawer,
            approverDrawer,
            // copyerDrawer,
            conditionDrawer
        },
        props: {
            propstocomponent: {
                type: Object,
                default: () => ({})
            },
            fathername: { type: String, default: '' }
        },
        data () {
            return {
                ref: this.$root.componentRefs,
                currentNode: {},
                jdList: [],
                tipList: [],
                tipVisible: false,
                nowVal: 100,
                processConfig: {},
                nodeConfig: {},
                workFlowDef: {},
                flowPermission: [],
                directorMaxLevel: 0,

                tableId: this.propstocomponent.id,
                workFlowName: this.propstocomponent.ywlcmc,
                isTried: false,
                promoterDrawer: false,
                flowPermission1: {},
                approverDrawer: false,
                approverConfig1: {},
                // copyerDrawer: false,
                copyerConfig1: {},
                conditionDrawer: false,
                conditionsConfig1: {
                    conditionNodes: []
                }
            };
        },
        created () {
            this.$root.componentRefs.jworkflow = this
        },
        computed: {
            nodeList () {
                return this.distribute()
            }
        },
        watch: {
            'propstocomponent.pzxx': {
                handler (n, o) {
                    if (n) {
                        this.processConfig = n;
                        this.nodeConfig = n.nodeConfig;
                        this.flowPermission = n.flowPermission;
                        this.directorMaxLevel = n.directorMaxLevel;
                        this.workFlowDef = n.workFlowDef
                    }
                },
                deep: true,
                immediate: true
            }
        },
        methods: {
            test () {
                console.log(this.processConfig, 'this.processConfig')
                console.log(this.nodeConfig, 'this.nodeConfig')
                console.log(this.nodeList, 'nodeList')
                console.log(this.jdList, 'jdList')
            },
            toReturn () {
                this.ref.xgzl.config.gzlsj.modal = false
            },
            reErr ({ childNode }) {
                if (childNode) {
                    const { type, error, nodeName, conditionNodes } = childNode
                    if (type == 1 || type == 2) {
                        if (error) {
                            this.tipList.push({ name: nodeName, type: ['', '审核人', '抄送人'][type] })
                        }
                        this.reErr(childNode)
                    } else if (type == 3) {
                        this.reErr(childNode)
                    } else if (type == 4) {
                        this.reErr(childNode)
                        for (let i = 0; i < conditionNodes.length; i++) {
                            if (conditionNodes[i].error) {
                                this.tipList.push({ name: conditionNodes[i].nodeName, type: '条件' })
                            }
                            this.reErr(conditionNodes[i])
                        }
                    }
                } else {
                    childNode = null
                }
            },
            async saveSet () {
                // this.setIsTried(true)
                // this.tipList = [];
                // this.reErr(this.nodeConfig);
                // if (this.tipList.length != 0) {
                // 	this.tipVisible = true;
                // 	return;
                // }
                // this.processConfig.flowPermission = this.flowPermission

                this.$Spin.show()
                this.saveConfig().then(res => {
                    this.$Spin.hide()
                    this.$Message.success('设置成功');
                    this.toReturn();
                })
            },
            saveConfig () {
                const processConfigJsonStr = JSON.stringify(this.processConfig)
                return this.commonsJs.incoRequest('update', '1708501735711dbe1972ebfc8692261162ab68dd61a939ae7', { id: this.tableId, pzxx: processConfigJsonStr })
            },
            distribute () {
                const data = this.nodeConfig
                const arr = []
                const tempObj = data.jdpzxx
                arr.push({ id: data.id, fid: data.fid, jdpzxx: { ...tempObj }, type: data.type })
                if (data.childNode) this.findChild(arr, data.childNode)
                return arr
            },
            findChild (arr, node) {
                arr.push({ id: node.id, fid: node.fid, jdpzxx: node.jdpzxx, type: node.type })
                if (node.conditionNodes && node.conditionNodes.length > 0) {
                    node.conditionNodes.forEach((item) => {
                        arr.push({ id: item.id, fid: item.fid, jdpzxx: item.jdpzxx, type: item.type })
                        if (item.childNode) this.findChild(arr, item.childNode)
                    })
                }
                if (node.childNode) this.findChild(arr, node.childNode)
            },
            // 发布
            fbgzl () {
                this.saveConfig().then(res => {
                    console.log(this.propstocomponent, 'this.propstocomponent')
                    const obj = { ywlcid: this.propstocomponent.ywlcid, ywlcdm: this.propstocomponent.ywlcdm, ywlcbbh: this.propstocomponent.ywlcbbh, xtdm: this.propstocomponent.xtdm };
                    const jdList = [];
                    const jdxqList = [];
                    // 计算节点
                    this.nodeList.forEach(item => {
                        if (item.type == 0 || item.type == 1) {
                            jdList.push({ ...item.jdpzxx, ...obj })

                            if (item.jdpzxx.shrylist && item.jdpzxx.shrylist.length > 0) {
                                item.jdpzxx.shrylist.forEach(ryitem => {
                                    const newitem = { ...item.jdpzxx, ...ryitem, ...obj }
                                    if (ryitem.ry) {
                                        newitem.rylb = '3'
                                        newitem.ryxx = ryitem.ry
                                        newitem.ryxxmc = ryitem.ryxm
                                    } else if (ryitem.bm) {
                                        newitem.rylb = '2'
                                        newitem.ryxx = ryitem.bm
                                        newitem.ryxxmc = ryitem.bmmc
                                    } else {
                                        newitem.rylb = '1'
                                        newitem.ryxx = ryitem.js
                                        newitem.ryxxmc = ryitem.jsmc
                                    }
                                    newitem.shryjsdm = ryitem.js
                                    newitem.shryjsmc = ryitem.jsmc
                                    newitem.sfssfqrbm = ryitem.sfssfqrbm
                                    newitem.ryxxcxsql = ryitem.ryxxcxsql
                                    jdxqList.push(newitem)
                                })
                            }
                        }
                    })

                    obj.jdList = jdList;
                    obj.jdxqList = jdxqList;

                    // 处理数据
                    this.handlerGzlData(obj)

                    console.log(obj, 'obj')

                    this.$Spin.show()
                    this.commonsJs.incoRequest('update', '1708682398664fac8c9f6575a27c6e4a88aa4fcf7bc5489f', obj).then(res => {
                        this.$Spin.hide()
                        this.$Message.success('发布成功');
                        this.toReturn();
                        this.ref.xgzl.query('xgzl_table')
                    })
                })
            },
            // 处理数据
            handlerGzlData (obj) {
                // 处理jdList
                obj.jdList.forEach((item, itemindex) => {
                    let rylb = ''
                    let ryxx = ''
                    let ryxxmc = ''
                    let shryjsdm = ''
                    let shryjsmc = ''
                    if (item.shrylist && item.shrylist.length > 0) {
                        item.shrylist.forEach((ryitem, index) => {
                            if (ryitem.ry) {
                                rylb = rylb ? rylb + ',3' : '3'
                                ryxx = ryxx ? +ryxx + ',' + ryitem.ry : ryitem.ry
                                ryxxmc = ryxxmc ? +ryxxmc + ',' + ryitem.ryxm : ryitem.ryxm
                            } else if (ryitem.bm) {
                                rylb = rylb ? +rylb + ',2' : '2'
                                ryxx = ryxx ? +ryxx + ',' + ryitem.bm : ryitem.bm
                                ryxxmc = ryxxmc ? +ryxxmc + ',' + ryitem.bmmc : ryitem.bmmc
                            } else {
                                rylb = rylb ? rylb + ',1' : '1'
                                ryxx = ryxx ? +ryxx + ',' + ryitem.js : ryitem.js
                                ryxxmc = ryxxmc ? +ryxxmc + ',' + ryitem.jsmc : ryitem.jsmc
                            }
                            shryjsdm = shryjsdm ? +shryjsdm + ',' + ryitem.js : ryitem.js
                            shryjsmc = shryjsmc ? +shryjsmc + ',' + ryitem.jsmc : ryitem.jsmc
                        })
                    }
                    item.rylb = rylb
                    item.ryxx = ryxx
                    item.ryxxmc = ryxxmc
                    item.shryjsdm = shryjsdm
                    item.shryjsmc = shryjsmc
                    item.xssx = itemindex + 1
                })
            },
            zoomSize (type) {
                if (type == 1) {
                    if (this.nowVal == 50) return;
                    this.nowVal -= 10;
                } else {
                    if (this.nowVal == 300) return;
                    this.nowVal += 10;
                }
            },

            setIsTried (payload) {
                this.isTried = payload
            },
            setPromoter (payload) {
                this.promoterDrawer = payload
            },
            setFlowPermission (payload) {
                this.flowPermission1 = payload
            },
            setApprover (payload) {
                this.approverDrawer = payload
            },
            setApproverConfig (payload) {
                this.approverConfig1 = payload
            },
            setCopyer (payload) {
                this.copyerDrawer = payload
            },
            setCopyerConfig (payload) {
                this.copyerConfig1 = payload
            },
            setCondition (payload) {
                this.conditionDrawer = payload
            },
            setConditionsConfig (payload) {
                this.conditionsConfig1 = payload
            }
        }
    };
</script>
<style>
@import "./css/workflow.css";

.error-modal-list {
	width: 455px;
}
</style>
