<template>
    <div>
        <div class="node-wrap" v-if="nodeConfig.type<2">
            <div class="node-wrap-box" :class="(nodeConfig.type==0?'start-node ':'')+(isTried&&nodeConfig.error?'active error':'')">
                <div>
                    <div class="title" :style="`background: rgb(${bgColor});`">
                        <!-- <span v-if="nodeConfig.type==0">{{nodeConfig.nodeName}}</span> -->
                        <template >
                            <span class="iconfont">{{nodeConfig.type==1?'':''}}</span>
                            <span class="editable-title">{{nodeConfig.nodeName}}</span>
                            <i class="anticon anticon-close close" v-if="nodeConfig.type!=0" @click="delNode"></i>
                        </template>
                    </div>
                    <div class="content" @click="setPerson(nodeConfig)">
                        <div class="text">
                            <span :style="{color:nodeConfig.jdpzxx?'green':'red'}">{{nodeConfig.jdpzxx?nodeConfig.jdpzxx.jdmc:(nodeConfig.type==0?'请配置发起节点':'请配置审核节点')}}</span>
                        </div>
                        <i class="anticon anticon-right arrow"></i>
                    </div>
                    <div class="error_tip" v-if="isTried&&nodeConfig.error">
                        <i class="anticon anticon-exclamation-circle"></i>
                    </div>
                </div>
            </div>
            <addNode :childNodeP.sync="nodeConfig.childNode" :pNode="nodeConfig"></addNode>
        </div>
        <div class="branch-wrap" v-if="nodeConfig.type==4">
            <div class="branch-box-wrap">
                <div class="branch-box">
                    <button class="add-branch" @click="addTerm">添加条件</button>
                    <div class="col-box" v-for="(item,index) in nodeConfig.conditionNodes" :key="index">
                        <div class="condition-node">
                            <div class="condition-node-box">
                                <div class="auto-judge" :class="isTried&&item.error?'error active':''">
                                    <div class="sort-left" v-if="index!=0" @click="arrTransfer(index,-1)">&lt;</div>
                                    <div class="title-wrapper">
                                        <span class="editable-title">{{item.nodeName}}</span>
                                        <span class="priority-title" @click="setPerson(item)">优先级{{item.priorityLevel}}</span>
                                        <i class="anticon anticon-close close" @click="delTerm(index)"></i>
                                    </div>
                                    <div class="sort-right" v-if="index!=nodeConfig.conditionNodes.length-1" @click="arrTransfer(index)">&gt;</div>
                                    <div class="content" @click="setPerson(item)">{{item.jdpzxx ? item.jdpzxx.fzmc :'请设置条件'}}</div>
                                    <div class="error_tip" v-if="isTried&&item.error">
                                        <i class="anticon anticon-exclamation-circle"></i>
                                    </div>
                                </div>
                                <addNode :childNodeP.sync="item.childNode" :pNode="item"></addNode>
                            </div>
                        </div>
                        <nodeWrap v-if="item.childNode" :nodeConfig.sync="item.childNode"></nodeWrap>
                        <template v-if="index==0">
                            <div class="top-left-cover-line"></div>
                            <div class="bottom-left-cover-line"></div>
                        </template>
                        <template v-if="index==nodeConfig.conditionNodes.length-1">
                            <div class="top-right-cover-line"></div>
                            <div class="bottom-right-cover-line"></div>
                        </template>
                    </div>
                </div>
                <addNode :childNodeP.sync="nodeConfig.childNode" :pNode="nodeConfig"></addNode>
            </div>
        </div>
        <nodeWrap v-if="nodeConfig.childNode" :nodeConfig.sync="nodeConfig.childNode"></nodeWrap>

        <!-- <div class="node-wrap" v-if="nodeConfig.endNodeConfig&&nodeConfig.endNodeConfig.type==2">
            <div class="node-wrap-box">
                <div class="title" :style="`background: red;`">
                    <template >
                        <span class="iconfont"></span>
                        <span class="editable-title">{{nodeConfig.endNodeConfig.nodeName}}</span>
                    </template>
                </div>
                <div class="content" @click="setPerson(nodeConfig.endNodeConfig)">
                    <div class="text">
                        <span :style="{color:nodeConfig.endNodeConfig.jdpzxx?'green':'red'}">{{nodeConfig.endNodeConfig.jdpzxx?nodeConfig.endNodeConfig.jdpzxx.jdmc:'请配置结束节点'}}</span>
                    </div>
                    <i class="anticon anticon-right arrow"></i>
                </div>
                <div class="error_tip" v-if="isTried&&nodeConfig.error">
                    <i class="anticon anticon-exclamation-circle"></i>
                </div>
            </div>
        </div> -->

        <div class="end-node" style="color: red;cursor: pointer;" v-if="nodeConfig.endNodeConfig&&nodeConfig.endNodeConfig.type==2">
            <div class="end-node-circle"></div>
            <div class="end-node-text">流程结束</div>
        </div>

    </div>
</template>
<script>
    import { mapState, mapMutations } from 'vuex'
    import nodeWrap from './nodeWrap.vue'
    import addNode from './addNode.vue'
    export default {
        name: 'nodeWrap',
        components: {
            nodeWrap,
            addNode
        },
        props: ['nodeConfig', 'flowPermission'],
        data () {
            return {
                ref: this.$root.componentRefs,
                placeholderList: ['发起节点', '审核节点']
            }
        },
        mounted () {
            if (this.nodeConfig.type == 1) {
                this.nodeConfig.error = !this.$func.setApproverStr(this.nodeConfig)
            } else if (this.nodeConfig.type == 2) {
                this.nodeConfig.error = !this.$func.copyerStr(this.nodeConfig)
            } else if (this.nodeConfig.type == 4) {
                this.resetConditionNodesErr()
            }
        },
        computed: {
            ...mapState(['isTried', 'flowPermission1', 'approverConfig1', 'copyerConfig1', 'conditionsConfig1']),
            defaultText () {
                return this.placeholderList[this.nodeConfig.type]
            },
            showText () {
                if (this.nodeConfig.type == 0) return this.$func.arrToStr(this.flowPermission) || '所有人'
                if (this.nodeConfig.type == 1) return this.$func.setApproverStr(this.nodeConfig)
                return this.$func.copyerStr(this.nodeConfig)
            },
            bgColor () {
                return ['87, 106, 149', '255, 148, 62', '50, 150, 250'][this.nodeConfig.type]
            }
        },
        watch: {
            flowPermission1 (data) {
                if (data.flag && data.id === this._uid) {
                    this.$emit('update:flowPermission', data.value)
                }
            },
            approverConfig1 (data) {
                if (data.flag && data.id === this._uid) {
                    this.$emit('update:nodeConfig', data.value)
                }
            },
            copyerConfig1 (data) {
                if (data.flag && data.id === this._uid) {
                    this.$emit('update:nodeConfig', data.value)
                }
            },
            conditionsConfig1 (data) {
                if (data.flag && data.id === this._uid) {
                    this.$emit('update:nodeConfig', data.value)
                }
            }
        },
        methods: {
            delNode () {
                this.$emit('update:nodeConfig', this.nodeConfig.childNode);
            },
            addTerm () {
                const len = this.nodeConfig.conditionNodes.length + 1
                this.nodeConfig.conditionNodes.push({
                    id: this.commonsJs.sys_guid(),
                    fid: this.nodeConfig.id,
                    nodeName: '条件' + len,
                    type: 3,
                    priorityLevel: len,
                    conditionList: [],
                    nodeUserList: [],
                    childNode: null
                });
                this.resetConditionNodesErr()
                this.$emit('update:nodeConfig', this.nodeConfig);
            },
            delTerm (index) {
                this.nodeConfig.conditionNodes.splice(index, 1)
                this.nodeConfig.conditionNodes.map((item, index) => {
                    item.priorityLevel = index + 1
                    item.nodeName = `条件${index + 1}`
                });
                this.resetConditionNodesErr()
                this.$emit('update:nodeConfig', this.nodeConfig);
                if (this.nodeConfig.conditionNodes.length == 1) {
                    if (this.nodeConfig.childNode) {
                        if (this.nodeConfig.conditionNodes[0].childNode) {
                            this.reData(this.nodeConfig.conditionNodes[0].childNode, this.nodeConfig.childNode)
                        } else {
                            this.nodeConfig.conditionNodes[0].childNode = this.nodeConfig.childNode
                        }
                    }
                    this.$emit('update:nodeConfig', this.nodeConfig.conditionNodes[0].childNode);
                }
            },
            reData (data, addData) {
                if (!data.childNode) {
                    data.childNode = addData
                } else {
                    this.reData(data.childNode, addData)
                }
            },
            setPerson (node) {
                const nodeConfig = node
                // if (node=='endNode') nodeConfig = this.nodeConfig.endNodeConfig
                // else nodeConfig = node
                // nodeConfig = nodeType=='endNode'?this.nodeConfig.endNodeConfig:this.nodeConfig;
                let { type, jdpzxx } = nodeConfig;
                this.ref.jworkflow.currentNode = nodeConfig
                if (!jdpzxx) {
                    jdpzxx = { jddm: this.commonsJs.sys_guid() }
                }
                if (type == 0 || type == 1 || type == 2) {
                    jdpzxx.jdlx = type == 0 ? '1' : (type == 1 ? '2' : '3');
                    this.ref.gzlsj.setProps('jdsjform', { ...jdpzxx, type })
                    this.ref.gzlsj.config.jdsjform.opentype = 'add'
                    this.ref.gzlsj.config.jdsjform.modal = true
                } else {
                    this.ref.gzlsj.setProps('tjpz', jdpzxx)
                    // this.$set(this.ref.gzlsj.config.fzform,'opentype','add')
                    this.ref.gzlsj.config.tjpz.modal = true
                // this.ref.jworkflow.setCondition(true)
                // this.ref.jworkflow.setConditionsConfig({
                //     value: JSON.parse(JSON.stringify(this.nodeConfig)),
                //     nodeType,
                //     flag: false,
                //     id: this._uid
                // })
                }
            },
            arrTransfer (index, type = 1) { // 向左-1,向右1
                this.nodeConfig.conditionNodes[index] = this.nodeConfig.conditionNodes.splice(index + type, 1, this.nodeConfig.conditionNodes[index])[0];
                this.nodeConfig.conditionNodes.map((item, index) => {
                    item.priorityLevel = index + 1
                })
                this.$emit('update:nodeConfig', this.nodeConfig);
            },
            resetConditionNodesErr () {
                for (let i = 0; i < this.nodeConfig.conditionNodes.length; i++) {
                    this.nodeConfig.conditionNodes[i].error = this.$func.conditionStr(this.nodeConfig, i) == '请设置条件' && i != this.nodeConfig.conditionNodes.length - 1
                }
            }
        }
    }
</script>
<style>
.error_tip {
    position: absolute;
    top: 0px;
    right: 0px;
    transform: translate(150%, 0px);
    font-size: 24px;
}

.promoter_person .el-dialog__body {
    padding: 10px 20px 14px 20px;
}

.selected_list {
    margin-bottom: 20px;
    line-height: 30px;
}

.selected_list span {
    margin-right: 10px;
    padding: 3px 6px 3px 9px;
    line-height: 12px;
    white-space: nowrap;
    border-radius: 2px;
    border: 1px solid rgba(220, 220, 220, 1);
}

.selected_list img {
    margin-left: 5px;
    width: 7px;
    height: 7px;
    cursor: pointer;
}
</style>
