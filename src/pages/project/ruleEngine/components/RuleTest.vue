<template>
  <Modal
    v-model="visible"
    title="规则测试"
    width="800"
    footer-hide
    :mask-closable="false"
  >
    <div class="test-content">
      <Row :gutter="16">
        <Col span="12">
          <Card title="测试参数" class="param-card">
            <Form :label-width="100">
              <FormItem label="规则ID">
                <Input v-model="testParams.ruleId" disabled />
              </FormItem>
              <FormItem label="规则表达式">
                <Input v-model="testParams.ruleExpr" type="textarea" :rows="6" disabled />
              </FormItem>
              <Divider>自定义参数</Divider>
              <div v-for="(param, index) in customParams" :key="index" class="param-row">
                <Input v-model="param.key" placeholder="参数名" style="width: 120px; margin-right: 8px;" />
                <Input v-model="param.value" placeholder="参数值" style="width: 150px; margin-right: 8px;" />
                <Button type="error" size="small" @click="removeParam(index)">
                  <Icon type="ios-close" />
                </Button>
              </div>
              <Button type="dashed" long @click="addCustomParam">
                <Icon type="ios-add" />添加测试参数
              </Button>
            </Form>
          </Card>
        </Col>
        <Col span="12">
          <Card title="测试结果" class="result-card">
            <div v-if="!testResult" class="no-result">
              <Icon type="ios-hourglass-outline" size="48" />
              <p>点击"执行测试"查看结果</p>
            </div>
            <div v-else class="result-content">
              <Alert :type="testResult.passed ? 'success' : 'error'" show-icon>
                {{ testResult.passed ? '测试通过' : '测试不通过' }}
              </Alert>
              <Divider>执行详情</Divider>
              <Timeline>
                <TimelineItem
                  v-for="(step, index) in testResult.steps"
                  :key="index"
                  :color="step.passed ? 'success' : 'error'"
                >
                  <p class="step-title">{{ step.name }}</p>
                  <p class="step-detail">{{ step.detail }}</p>
                </TimelineItem>
              </Timeline>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
    <div slot="footer" style="text-align: right;margin-top: 20px;">
      <Button @click="handleClose">关闭</Button>
      <Button type="primary" @click="handleTest" :loading="testing" style="margin-left: 10px;">
        <Icon type="ios-play-outline" />执行测试
      </Button>
    </div>
  </Modal>
</template>

<script>
import { request } from '@/api/common.js'
import { encrypt_aes } from '@/api/common.js'

export default {
  name: 'RuleTest',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    ruleId: {
      type: String,
      default: ''
    },
    ruleExpr: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      testing: false,
      customParams: [],
      testResult: null
    }
  },
  computed: {
    visible: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('update:modelValue', val)
      }
    },
    testParams() {
      return {
        ruleId: this.ruleId,
        ruleExpr: this.ruleExpr
      }
    }
  },
  methods: {
    handleClose() {
      this.$emit('update:modelValue', false)
    },
    addCustomParam() {
      this.customParams.push({ key: '', value: '' })
    },
    removeParam(index) {
      this.customParams.splice(index, 1)
    },
    async handleTest() {
      this.testing = true
      this.testResult = null

      try {
        // 构建测试参数
        const testParams = {}
        this.customParams.forEach(p => {
          if (p.key) {
            testParams[p.key] = p.value
          }
        })

        // 构建加密数据
        const requestData = {
          ruleExpr: this.ruleExpr,
          testParams: testParams,
          userInfo: {}
        }
        const encryptedData = encrypt_aes(JSON.stringify(requestData))

        const res = await request({
          url: '/rule/test',
          method: 'post',
          data: { param: encryptedData }
        })

        // 构建测试结果步骤
        const steps = []
        if (res) {
          if (res.error) {
            steps.push({ name: '执行异常', detail: res.error, passed: false })
          } else {
            steps.push({ name: '规则解析', detail: 'JSON格式正确', passed: true })
            if (res.preExecResults && res.preExecResults.length > 0) {
              steps.push({ name: '预执行结果', detail: JSON.stringify(res.preExecResults), passed: true })
            }
            if (res.blocked) {
              steps.push({ name: '规则阻断', detail: res.blockReason || '条件不满足', passed: false })
            } else {
              steps.push({ name: '规则通过', detail: '所有条件满足', passed: true })
            }
          }
        }

        this.testResult = {
          passed: res && res.passed,
          steps: steps
        }
      } catch (error) {
        this.testResult = {
          passed: false,
          steps: [
            { name: '执行失败', detail: error.message || '未知错误', passed: false }
          ]
        }
      } finally {
        this.testing = false
      }
    }
  }
}
</script>

<style lang="less" scoped>
.test-content {
  .param-card,
  .result-card {
    height: 100%;
  }

  .param-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  .no-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    color: #999;

    p {
      margin-top: 16px;
    }
  }

  .result-content {
    .step-title {
      font-weight: 600;
    }

    .step-detail {
      color: #666;
      font-size: 12px;
    }
  }
}
</style>
