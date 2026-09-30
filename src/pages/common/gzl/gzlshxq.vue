<template>
    <div>
        <div
                style="margin: 5px 0 12px"
                :style="style_sfxsjd"
                v-show="sfxsjd == true"
        >
            <Steps :current="jdxb" :status="xsxx">
                <Step v-for="(item, index) in gzlShywlcjdModelList"
                      :key="'steps'+_uid+index"
                      :title="item.jdmc">
                </Step>
            </Steps>
        </div>
        <div :style="style_sfxsjdsh" v-show="sfxsjdsh == true">
            <Table :columns="columns" :data="gzlShywlclsjdModelList"></Table>
        </div>
    </div>
</template>
<script>
    export default {
        name: 'gzlshxq',
        components: {},
        props: {
            ywlcdm: String,
            ywlcslid: String,
            sfxsjd: {
                type: Boolean,
                default: false
            },
            sfxsjdsh: {
                type: Boolean,
                default: false
            },
            style_sfxsjd: Object,
            style_sfxsjdsh: Object,
            height_sfxsjdsh_table: String
        },
        data () {
            return {
                jdxb: 0,
                xsxx: 'wait',
                param: {
                    ywlcdm: '', ywlcslid: ''
                },
                gzlShywlcjdModelList: [],
                gzlShywlclsjdModelList: [],
                columns: [
                    { type: 'index', title: '序号' },
                    { key: 'lsjdmc', title: '节点' },
                    { key: 'lsshrxm', title: '审核人' },
                    { key: 'lsshsj', title: '审核时间' },
                    { key: 'lsshztxsmc', title: '审核状态' },
                    { key: 'lsshyj', title: '审核意见' }
                ]
            }
        },
        methods: {
            query: function (p_ywlcdm, p_ywlcslid) {
                const self = this;
                self.param.ywlcdm = p_ywlcdm;
                self.param.ywlcslid = p_ywlcslid;
                self.commonsJs.selfRequest('/gzlshywlc/queryShywlcShck', self.param).then(res => {
                    if (res.gzlShywlcslModelOne.sfyzz == '2' && res.gzlShywlcslModelOne.ywlcslfx == '1') {
                        self.xsxx = 'finish';
                        self.jdxb = 9999;
                    } else {
                        if (res.gzlShywlcslModelOne.sfyzz == '1' || res.gzlShywlcslModelOne.ywlcslfx == '-1') {
                            self.xsxx = 'error';
                            res.gzlShywlcjdModelList.forEach((vv, ii) => {
                                if (vv.jddm == res.gzlShywlcslModelOne.yshjddm) {
                                    self.jdxb = ii;
                                }
                            })
                        } else {
                            self.xsxx = 'wait';
                            res.gzlShywlcjdModelList.forEach((vv, ii) => {
                                if (vv.jddm == res.gzlShywlcslModelOne.dshjddm) {
                                    self.jdxb = ii;
                                }
                            })
                        }
                    }
                    self.gzlShywlclsjdModelList = res.gzlShywlclsjdModelList;
                    self.gzlShywlcjdModelList = res.gzlShywlcjdModelList;
                })
            },
            clean: function () {
                this.jdxb = 0;
                this.xsxx = 'wait';
                this.param.ywlcdm = '';
                this.param.ywlcslid = '';

                this.gzlShywlcjdModelList = [];
                this.gzlShywlclsjdModelList = [];
            }
        },
        computed: {},
        mounted () {
            const self = this;
        }
    }
</script>
