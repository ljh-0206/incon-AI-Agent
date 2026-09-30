<template>
  <div class="rule-node-props">
    <div class="props-header">
      <h4>节点属性</h4>
    </div>
    <div class="props-content">
      <Form :label-width="80" v-if="localNode">
        <!-- 节点基本信息 -->
        <FormItem label="节点ID">
          <Input v-model="localNode.id" disabled size="small" />
        </FormItem>
        <FormItem label="节点类型">
          <Tag :color="getTypeColor(localNode.type)">{{ localNode.type }}</Tag>
        </FormItem>
        <FormItem label="节点名称">
          <Input v-model="localNode.label" size="small" @on-change="handleChange" />
        </FormItem>

        <!-- SQL查询节点 -->
        <template v-if="localNode.type === 'SQL_QUERY'">
          <Divider size="small">SQL配置</Divider>
          <Alert type="info" class="tips" style="margin-bottom: 12px;">
            <b>变量名</b>：用于引用此查询结果，在表达式中通过 ${preExec.变量名.字段名} 使用
          </Alert>
          <FormItem label="变量名">
            <Input v-model="localNode.config.id" placeholder="用于引用此查询结果" size="small" @on-change="handleChange" />
          </FormItem>
          <FormItem label="SQL ID">
            <Input v-model="localNode.config.sqlId" placeholder="手动输入SQL ID" size="small" @on-change="handleChange" />
          </FormItem>
          <FormItem label="SQL参数">
            <div style="font-size: 12px; color: #999; margin-bottom: 8px;">
              参数值支持：固定值 或 变量引用 如 ${params.status}
            </div>
            <div v-for="(param, index) in sqlParamsList" :key="index" class="param-item">
              <Input v-model="param.name" size="small" style="width: 100px; margin-right: 4px;" placeholder="参数名" @on-change="updateSqlParams" />
              <span style="color: #999; margin-right: 4px;">=</span>
              <Input v-model="param.value" size="small" style="flex: 1" placeholder="参数值，如 ${params.status}" @on-change="updateSqlParams" />
              <Button type="text" size="small" @click="removeSqlParam(index)" style="color: #999;">
                <Icon type="ios-close-circle" />
              </Button>
            </div>
            <Button type="dashed" size="small" @click="addSqlParam">
              <Icon type="ios-add" />添加参数
            </Button>
          </FormItem>
        </template>

        <!-- Bean调用节点 -->
        <template v-else-if="localNode.type === 'BEAN_CALL'">
          <Divider size="small">Bean配置</Divider>
          <FormItem label="变量名">
            <Input v-model="localNode.config.id" placeholder="用于引用此调用结果" size="small" @on-change="handleChange" />
          </FormItem>
          <FormItem label="Bean类">
            <Input v-model="localNode.config.bean" placeholder="如: userService" size="small" @on-change="handleChange" />
          </FormItem>
          <FormItem label="方法名">
            <Input v-model="localNode.config.method" placeholder="方法名" size="small" @on-change="handleChange" />
          </FormItem>
          <FormItem label="参数映射">
            <div v-for="(param, index) in sqlParamsList" :key="index" class="param-item">
              <Input v-model="param.value" size="small" style="width: 120px; margin-right: 4px;" placeholder="参数值" @on-change="updateSqlParams" />
              <span style="color: #999; margin-right: 4px;">→</span>
              <Input v-model="param.name" size="small" style="width: 100px;" placeholder="目标参数" @on-change="updateSqlParams" />
              <Button type="text" size="small" @click="removeSqlParam(index)" style="color: #999;">
                <Icon type="ios-close-circle" />
              </Button>
            </div>
            <Button type="dashed" size="small" @click="addSqlParam">
              <Icon type="ios-add" />添加参数
            </Button>
          </FormItem>
        </template>

        <!-- 表达式节点 -->
        <template v-else-if="localNode.type === 'EXPR'">
          <Divider size="small">表达式配置</Divider>
          <Alert type="info" class="tips" style="margin-bottom: 12px;">
            <div style="margin-bottom: 4px;"><b>表达式示例：</b></div>
            <div style="padding-left: 12px;">
              ${params.status} == 'ON' - 请求参数比较<br/>
              ${preExec.开关查询.status} == 'ON' - preExec查询结果比较<br/>
              ${user.jsdm} == 'ADMIN' - 当前用户角色判断<br/>
              ${sys.date} >= '2024-01-01' - 系统日期比较
            </div>
          </Alert>
          <FormItem label="表达式">
            <ExpressionBuilder
              v-model="localNode.config.expression"
              mode="gui"
              @change="handleChange"
            />
          </FormItem>
          <Alert type="info" class="tips">
            <div style="font-weight: bold; margin-bottom: 8px;">变量说明：</div>
            <div><b>params</b> - 请求参数，如 ${params.status}</div>
            <div><b>user</b> - 当前用户信息，如 ${user.yhdm}</div>
            <div><b>sys</b> - 系统变量，如 ${sys.date}</div>
            <div><b>preExec</b> - preExec查询结果，如 ${preExec.开关查询.status}</div>
          </Alert>
        </template>

        <!-- AND/OR 条件节点 -->
        <template v-else-if="localNode.type === 'AND' || localNode.type === 'OR'">
          <Divider size="small">条件配置</Divider>
          <Alert type="info" style="margin-bottom: 12px;">
            <div><b>AND</b>：所有条件都满足才通过（且）</div>
            <div><b>OR</b>：任一条件满足即通过（或）</div>
            <div style="margin-top: 8px; color: #ff9900;"><b>支持嵌套条件</b>：可以添加"组合条件"来创建嵌套的AND/OR逻辑</div>
          </Alert>
          <FormItem label="条件类型">
            <RadioGroup v-model="localNode.type" @on-change="handleTypeChange">
              <Radio label="AND">AND (全部满足)</Radio>
              <Radio label="OR">OR (任一满足)</Radio>
            </RadioGroup>
          </FormItem>
          <FormItem label="条件列表">
            <div v-for="(cond, index) in localNode.config.conditions" :key="index" class="condition-item">
              <!-- 嵌套条件组 -->
              <template v-if="cond.type === 'AND' || cond.type === 'OR'">
                <div class="nested-condition">
                  <div class="nested-header">
                    <Select v-model="cond.type" size="small" style="width: 80px;" @on-change="handleChange">
                      <Option value="AND">AND</Option>
                      <Option value="OR">OR</Option>
                    </Select>
                    <span style="margin-left: 8px;">组合条件</span>
                    <Button type="text" size="small" @click="removeCondition(index)">
                      <Icon type="ios-close-circle" />
                    </Button>
                  </div>
                  <div class="nested-rules">
                    <div v-for="(subCond, subIndex) in cond.rules" :key="subIndex" class="sub-condition-item">
                      <ExpressionBuilder
                        v-model="subCond.expr"
                        mode="gui"
                        style="flex: 1;"
                        @change="handleChange"
                      />
                      <Button type="text" size="small" @click="removeSubCondition(index, subIndex)">
                        <Icon type="ios-close-circle" />
                      </Button>
                    </div>
                    <Button type="dashed" size="small" @click="addSubCondition(index)" style="margin-top: 4px;">
                      <Icon type="ios-add" />添加子条件
                    </Button>
                  </div>
                </div>
              </template>
              <!-- 普通表达式条件 -->
              <template v-else>
                <div class="expr-condition-row">
                  <ExpressionBuilder
                    v-model="cond.expr"
                    mode="gui"
                    style="flex: 1;"
                    @change="handleChange"
                  />
                  <Button type="text" size="small" @click="removeCondition(index)">
                    <Icon type="ios-close-circle" />
                  </Button>
                </div>
              </template>
            </div>
            <div class="condition-actions">
              <Button type="dashed" size="small" @click="addCondition(false)" style="margin-right: 8px;">
                <Icon type="ios-add" />添加表达式
              </Button>
              <Button type="dashed" size="small" @click="addCondition(true)">
                <Icon type="ios-add" />添加组合条件
              </Button>
            </div>
          </FormItem>
          <Alert type="info" class="tips">
            <div style="font-weight: bold; margin-bottom: 8px;">条件表达式示例：</div>
            <div style="padding-left: 12px;">
              ${params.status} == 'ON' - 参数值比较<br/>
              ${preExec.查询结果.ownerDept} == ${user.yxdm} - 数据权限判断<br/>
              ${sys.currentTime} >= '09:00' AND ${sys.currentTime} <= '18:00' - 时间范围判断
            </div>
            <div style="font-weight: bold; margin: 12px 0 8px;">嵌套条件示例：</div>
            <div style="padding-left: 12px; color: #ff9900;">
              AND组内包含：<br/>
              &nbsp;&nbsp;1. ${params.a} == '1'<br/>
              &nbsp;&nbsp;2. OR组合条件：<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- ${params.b} == '1'<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- ${params.c} == '2'<br/>
              表示：(A == '1') AND (B == '1' OR C == '2')
            </div>
          </Alert>
        </template>

        <!-- 调用规则节点 -->
        <template v-else-if="localNode.type === 'CALL_RULE'">
          <Divider size="small">调用规则配置</Divider>
          <FormItem label="规则ID">
            <Input v-model="localNode.config.ruleId" placeholder="被调用的规则ID" size="small" @on-change="handleChange" />
          </FormItem>
        </template>

        <!-- 调用SQL节点 -->
        <template v-else-if="localNode.type === 'CALL_SQLID'">
          <Divider size="small">调用SQL配置</Divider>
          <FormItem label="SQL ID">
            <Input v-model="localNode.config.sqlId" placeholder="被调用的SQL ID" size="small" @on-change="handleChange" />
          </FormItem>
          <FormItem label="参数映射">
            <div v-for="(param, index) in sqlParamsList" :key="index" class="param-item">
              <Input v-model="param.value" size="small" style="width: 120px; margin-right: 4px;" placeholder="参数值" @on-change="updateSqlParams" />
              <span style="color: #999; margin-right: 4px;">→</span>
              <Input v-model="param.name" size="small" style="width: 100px;" placeholder="目标参数" @on-change="updateSqlParams" />
              <Button type="text" size="small" @click="removeSqlParam(index)" style="color: #999;">
                <Icon type="ios-close-circle" />
              </Button>
            </div>
            <Button type="dashed" size="small" @click="addSqlParam">
              <Icon type="ios-add" />添加参数
            </Button>
          </FormItem>
        </template>

        <!-- 调用Bean节点 -->
        <template v-else-if="localNode.type === 'CALL_BEAN'">
          <Divider size="small">调用Bean配置</Divider>
          <FormItem label="Bean类">
            <Input v-model="localNode.config.bean" placeholder="如: userService" size="small" @on-change="handleChange" />
          </FormItem>
          <FormItem label="方法名">
            <Input v-model="localNode.config.method" placeholder="方法名" size="small" @on-change="handleChange" />
          </FormItem>
          <FormItem label="参数映射">
            <div v-for="(param, index) in sqlParamsList" :key="index" class="param-item">
              <Input v-model="param.value" size="small" style="width: 120px; margin-right: 4px;" placeholder="参数值" @on-change="updateSqlParams" />
              <span style="color: #999; margin-right: 4px;">→</span>
              <Input v-model="param.name" size="small" style="width: 100px;" placeholder="目标参数" @on-change="updateSqlParams" />
              <Button type="text" size="small" @click="removeSqlParam(index)" style="color: #999;">
                <Icon type="ios-close-circle" />
              </Button>
            </div>
            <Button type="dashed" size="small" @click="addSqlParam">
              <Icon type="ios-add" />添加参数
            </Button>
          </FormItem>
        </template>

        <!-- 设置字段节点 -->
        <template v-else-if="localNode.type === 'SET_FIELD'">
          <Divider size="small">字段操作配置</Divider>

          <!-- 兼容旧版单字段格式 -->
          <div v-if="localNode.config.target && !localNode.config.fields" class="old-format-tip">
            <Alert type="warning">
              检测到旧版配置格式，已自动转换为新版
            </Alert>
          </div>

          <!-- 目标区域说明 -->
          <Alert type="info" class="target-hint">
            <div style="font-weight: bold; margin-bottom: 4px;">目标区域说明：</div>
            <div><b>请求参数(params)</b>：业务入参，SQL中的 ${params.xxx} 获取，如订单状态、用户ID等</div>
            <div><b>执行结果(result)</b>：SQL执行后的返回数据，POST触发时可用</div>
            <div><b>扩展数据(extra)</b>：preExec查询结果、级联调用结果等中间数据</div>
          </Alert>

          <!-- 字段列表 -->
          <div v-for="(field, index) in localNode.config.fields" :key="index" class="field-item">
            <Row :gutter="8">
              <Col span="8">
                <Select v-model="field.prefix" placeholder="目标" size="small" @on-change="updateFieldPrefix(index)" filterable>
                  <Option value="params.">请求参数</Option>
                  <Option value="result.">执行结果</Option>
                  <Option value="extra.">扩展数据</Option>
                </Select>
              </Col>
              <Col span="8">
                <Input v-model="field.fieldName" placeholder="字段名" size="small" @on-change="updateFieldTarget(index)" />
              </Col>
              <Col span="4">
                <Select v-model="field.operation" size="small" @on-change="handleChange">
                  <Option value="set">设置</Option>
                  <Option value="remove">删除</Option>
                </Select>
              </Col>
              <Col span="4">
                <Button type="text" size="small" @click="removeField(index)">
                  <Icon type="ios-close-circle" color="#ed4014" />
                </Button>
              </Col>
            </Row>
            <Row :gutter="8" v-if="field.operation === 'set'" style="margin-top: 8px;">
              <Col span="16">
                <Input v-model="field.value" placeholder="输入值，如: 'PROCESSED' 或 ${params.status}" size="small" @on-change="handleChange" />
              </Col>
              <Col span="8">
                <Select v-model="field.quickValue" placeholder="快速插入" size="small" @on-change="insertQuickValue(field)" filterable allow-create>
                  <Option value="params.">请求参数 ${params.}</Option>
                  <Option value="result.">执行结果 ${result.}</Option>
                  <Option value="user.">当前用户 ${user.}</Option>
                  <Option value="sys.">系统变量 ${sys.}</Option>
                  <Option value="preExec.">前置查询 ${preExec.}</Option>
                  <Option value="item.">列表元素 ${item.}</Option>
                </Select>
              </Col>
            </Row>
          </div>

          <Button type="dashed" long @click="addField" style="margin-top: 8px;">
            <Icon type="ios-add" />添加字段
          </Button>

          <!-- 表达式帮助 -->
          <Alert type="info" class="tips" style="margin-top: 12px;">
            <div style="font-weight: bold; margin-bottom: 8px;">表达式用法：</div>
            <div style="margin-bottom: 4px;"><b>变量引用：</b></div>
            <div style="padding-left: 12px; margin-bottom: 8px;">
              ${params.xxx} - 请求参数，如 ${params.status}<br/>
              ${user.xxx} - 当前用户信息<br/>
              ${sys.xxx} - 系统变量，如 ${sys.date}<br/>
              ${preExec.查询别名.字段名} - preExec查询结果，如 ${preExec.开关查询.status}<br/>
              ${item.xxx} - 当目标为result列表时，引用当前元素的字段
            </div>
            <div style="margin-bottom: 4px;"><b>三元运算符：</b></div>
            <div style="padding-left: 12px; margin-bottom: 8px;">
              ${params.status == '0' ? 'OFF' : 'ON'} - 条件赋值<br/>
              ${item.status == 'A' ? '已完成' : '未完成'} - 列表元素条件赋值
            </div>
            <div style="margin-bottom: 4px;"><b>内置函数：</b></div>
            <div style="padding-left: 12px;">
              ${FUNC:isEmpty,value=${params.xxx}} - 判断是否为空<br/>
              ${FUNC:regexMatch,pattern=正则,value=${params.mobile}} - 正则匹配
            </div>
          </Alert>
        </template>

        <!-- 结果过滤节点 -->
        <template v-else-if="localNode.type === 'FILTER_RESULT'">
          <Divider size="small">结果过滤配置</Divider>

          <Alert type="info" class="tips">
            <div style="font-weight: bold; margin-bottom: 8px;">结果过滤说明：</div>
            <div>根据条件过滤SQL查询返回的列表数据，只保留满足条件的数据项</div>
          </Alert>

          <FormItem label="过滤条件" style="margin-top: 12px;">
            <ExpressionBuilder
              v-model="localNode.config.expr"
              mode="gui"
              :var-types="filterVarTypes"
              @change="handleChange"
            />
          </FormItem>

          <Alert type="info" class="tips" style="margin-top: 12px;">
            <div style="font-weight: bold; margin-bottom: 8px;">表达式语法：</div>
            <div style="margin-bottom: 4px;"><b>变量引用：</b></div>
            <div style="padding-left: 12px; margin-bottom: 8px;">
              ${item.xxx} - 当前元素的字段，如 ${item.status}<br/>
              ${item.index} - 当前元素索引，从0开始
            </div>
            <div style="margin-bottom: 4px;"><b>比较运算符：</b></div>
            <div style="padding-left: 12px; margin-bottom: 8px;">
              == != &gt; &lt; &gt;= &lt;=
            </div>
            <div style="margin-bottom: 4px;"><b>逻辑运算符：</b></div>
            <div style="padding-left: 12px; margin-bottom: 8px;">
              && (并且)、|| (或者)、! (取反)
            </div>
            <div style="margin-bottom: 4px;"><b>字符串函数：</b></div>
            <div style="padding-left: 12px;">
              .contains(str)、.startsWith(str)、.endsWith(str)、.isEmpty()、.length()
            </div>
            <div style="margin-top: 8px;"><b>示例：</b></div>
            <div style="padding-left: 12px;">
              ${item.status} == 'ACTIVE'<br/>
              ${item.amount} &gt; 100 && ${item.type} != 'X'<br/>
              ${item.name.contains('测试')}<br/>
              ${!item.deleted}
            </div>
          </Alert>
        </template>

        <!-- 记录日志节点 -->
        <template v-else-if="localNode.type === 'LOG'">
          <Divider size="small">日志配置</Divider>
          <FormItem label="日志级别">
            <Select v-model="localNode.config.level" placeholder="选择级别" size="small" @on-change="handleChange">
              <Option value="DEBUG">DEBUG - 调试信息</Option>
              <Option value="INFO">INFO - 一般信息</Option>
              <Option value="WARN">WARN - 警告信息</Option>
              <Option value="ERROR">ERROR - 错误信息</Option>
            </Select>
          </FormItem>
          <FormItem label="日志内容">
            <Input
              v-model="localNode.config.message"
              type="textarea"
              placeholder="日志内容，支持变量引用如: 订单${params.orderId}处理完成"
              size="small"
              :rows="3"
              @on-change="handleChange"
            />
          </FormItem>
          <FormItem label="可用变量">
            <Select v-model="selectedVariable" placeholder="选择变量" size="small" @on-change="insertLogVariable" filterable>
              <Option v-for="v in availableVariables" :key="v.id" :value="v.id">{{ v.id }}</Option>
            </Select>
          </FormItem>
        </template>

        <!-- 失败处理节点 -->
        <template v-else-if="localNode.type === 'END_FAIL'">
          <Divider size="small">失败处理配置</Divider>
          <FormItem label="阻断流程">
            <i-switch v-model="localNode.config.block" @on-change="handleChange">
              <span slot="open">是</span>
              <span slot="close">否</span>
            </i-switch>
          </FormItem>
          <FormItem label="错误信息">
            <Input v-model="localNode.config.message" type="textarea" placeholder="失败时的错误信息" size="small" :rows="2" @on-change="handleChange" />
          </FormItem>
          <FormItem label="错误码">
            <Input v-model="localNode.config.errorCode" placeholder="错误码" size="small" @on-change="handleChange" />
          </FormItem>
        </template>
      </Form>
    </div>

    <!-- 底部操作按钮 -->
    <div class="props-footer">
      <Button type="primary" size="small" @click="handleSave" long>
        <Icon type="ios-save-outline" />保存修改
      </Button>
      <Button v-if="node.type !== 'START'" type="error" size="small" @click="handleDelete" class="ivu-mt-8" long>
        <Icon type="ios-trash-outline" />删除节点
      </Button>
    </div>
  </div>
</template>

<script>
import ExpressionBuilder from './ExpressionBuilder.vue'

export default {
  name: 'RuleNodeProps',
  components: { ExpressionBuilder },
  props: {
    node: {
      type: Object,
      required: true
    },
    availableVariables: {
      type: Array,
      default: () => []
    },
    sqlList: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update', 'delete'],
  data() {
    return {
      localNode: null,
      selectedVariable: '',
      targetPrefix: 'params.',
      targetField: '',
      sqlParamsList: []
    }
  },
  computed: {
    // SET_FIELD 值表达式的变量类型
    valueVarTypes() {
      return [
        { value: 'params', label: '请求参数', hasExtraField: false },
        { value: 'result', label: '执行结果', hasExtraField: false },
        { value: 'user', label: '当前用户', hasExtraField: false },
        { value: 'sys', label: '系统变量', hasExtraField: false },
        { value: 'preExec', label: '前置查询', hasExtraField: true, extraLabel: '节点.字段' },
        { value: 'item', label: '列表元素', hasExtraField: false },
        { value: 'item.index', label: '元素索引', hasExtraField: false }
      ]
    },
    // 过滤条件的变量类型
    filterVarTypes() {
      return [
        { value: 'item', label: '列表元素', hasExtraField: false },
        { value: 'item.index', label: '元素索引', hasExtraField: false },
        { value: 'params', label: '请求参数', hasExtraField: false },
        { value: 'user', label: '当前用户', hasExtraField: false },
        { value: 'sys', label: '系统变量', hasExtraField: false },
        { value: 'preExec', label: '前置查询', hasExtraField: true, extraLabel: '节点.字段' }
      ]
    }
  },
  watch: {
    node: {
      immediate: true,
      deep: true,
      handler(newVal) {
        this.localNode = JSON.parse(JSON.stringify(newVal))
        // SET_FIELD 格式兼容：将旧版单字段格式转换为多字段格式
        if (this.localNode && this.localNode.type === 'SET_FIELD') {
          if (this.localNode.config.fields) {
            // 已经是多字段格式，确保每个字段有必要的属性
            this.localNode.config.fields.forEach(field => {
              // 解析 target 为 prefix 和 fieldName
              if (field.target && !field.prefix) {
                const target = field.target
                if (target.startsWith('params.')) {
                  field.prefix = 'params.'
                  field.fieldName = target.substring(7)
                } else if (target.startsWith('result.')) {
                  field.prefix = 'result.'
                  field.fieldName = target.substring(8)
                } else if (target.startsWith('extra.')) {
                  field.prefix = 'extra.'
                  field.fieldName = target.substring(7)
                } else {
                  field.prefix = 'params.'
                  field.fieldName = target
                }
              }
            })
          } else if (this.localNode.config.target) {
            // 旧版单字段格式，转换为多字段格式
            const target = this.localNode.config.target
            let prefix = 'params.'
            let fieldName = target
            if (target.startsWith('params.')) {
              prefix = 'params.'
              fieldName = target.substring(7)
            } else if (target.startsWith('result.')) {
              prefix = 'result.'
              fieldName = target.substring(8)
            } else if (target.startsWith('extra.')) {
              prefix = 'extra.'
              fieldName = target.substring(7)
            }
            this.localNode.config.fields = [{
              prefix: prefix,
              fieldName: fieldName,
              target: target,
              operation: this.localNode.config.operation || 'set',
              value: this.localNode.config.value || ''
            }]
          } else {
            // 全新节点，初始化空字段列表
            this.localNode.config.fields = [{
              prefix: 'params.',
              fieldName: '',
              target: 'params.',
              operation: 'set',
              value: ''
            }]
          }
        }
        // 同步SQL参数列表
        this.syncSqlParamsFromNode()
      }
    }
  },
  methods: {
    handleChange() {
      // 每次修改都触发更新
    },
    handleSave() {
      this.$emit('update', this.localNode)
    },
    handleDelete() {
      this.$emit('delete', this.localNode.id)
    },
    handleTypeChange(type) {
      this.localNode.type = type
      this.handleChange()
    },
    getTypeColor(type) {
      const colorMap = {
        'START': 'success',
        'END_PASS': 'success',
        'END_FAIL': 'error',
        'SQL_QUERY': 'blue',
        'BEAN_CALL': 'purple',
        'AND': 'orange',
        'OR': 'orange',
        'EXPR': 'cyan',
        'CALL_RULE': 'gold',
        'CALL_SQLID': 'blue',
        'CALL_BEAN': 'purple',
        'CASCADE': 'red',
        'SET_FIELD': 'green',
        'FILTER_RESULT': 'green',
        'LOG': 'gray'
      }
      return colorMap[type] || 'default'
    },
    // SQL参数操作
    syncSqlParamsFromNode() {
      if (!this.localNode || !this.localNode.config) return
      const params = this.localNode.config.params || {}
      this.sqlParamsList = Object.keys(params).map(key => ({
        name: key,
        value: params[key]
      }))
    },
    syncSqlParamsToNode() {
      if (!this.localNode || !this.localNode.config) return
      const params = {}
      this.sqlParamsList.forEach(item => {
        if (item.name) {
          params[item.name] = item.value
        }
      })
      this.localNode.config.params = params
    },
    addSqlParam() {
      this.sqlParamsList.push({ name: '', value: '' })
      this.syncSqlParamsToNode()
      this.handleChange()
    },
    removeSqlParam(index) {
      this.sqlParamsList.splice(index, 1)
      this.syncSqlParamsToNode()
      this.handleChange()
    },
    updateSqlParams() {
      this.syncSqlParamsToNode()
      this.handleChange()
    },
    // 通用参数操作（用于其他节点）
    addParam() {
      if (!this.localNode.config.params) {
        this.localNode.config.params = {}
      }
      this.$set(this.localNode.config.params, `param_${Date.now()}`, '')
      this.handleChange()
    },
    removeParam(key) {
      this.$delete(this.localNode.config.params, key)
      this.handleChange()
    },
    // 条件操作
    // isNested: true-添加嵌套组合条件, false-添加普通表达式条件
    addCondition(isNested = false) {
      if (!this.localNode.config.conditions) {
        this.localNode.config.conditions = []
      }
      if (isNested) {
        // 添加嵌套的AND/OR组合条件
        this.localNode.config.conditions.push({
          id: `nested_${Date.now()}`,
          type: 'AND', // 默认使用AND
          rules: [
            { type: 'EXPR', expr: '' },
            { type: 'EXPR', expr: '' }
          ]
        })
      } else {
        // 添加普通表达式条件
        this.localNode.config.conditions.push({
          id: `cond_${Date.now()}`,
          type: 'EXPR',
          expr: ''
        })
      }
      this.handleChange()
    },
    removeCondition(index) {
      this.localNode.config.conditions.splice(index, 1)
      this.handleChange()
    },
    // 添加子条件到嵌套条件组
    addSubCondition(index) {
      const cond = this.localNode.config.conditions[index]
      if (cond && cond.rules) {
        cond.rules.push({
          type: 'EXPR',
          expr: ''
        })
        this.handleChange()
      }
    },
    // 从嵌套条件组中移除子条件
    removeSubCondition(parentIndex, subIndex) {
      const cond = this.localNode.config.conditions[parentIndex]
      if (cond && cond.rules) {
        cond.rules.splice(subIndex, 1)
        // 如果子条件为空，移除整个父条件
        if (cond.rules.length === 0) {
          this.removeCondition(parentIndex)
        } else {
          this.handleChange()
        }
      }
    },
    // 插入变量到表达式
    insertVariable() {
      if (this.selectedVariable && this.localNode.config.expression !== undefined) {
        const expr = this.localNode.config.expression || ''
        this.localNode.config.expression = expr + '${' + this.selectedVariable + '}'
        this.selectedVariable = ''
        this.handleChange()
      }
    },
    // 插入变量到日志消息
    insertLogVariable() {
      if (this.selectedVariable && this.localNode.config.message !== undefined) {
        const msg = this.localNode.config.message || ''
        this.localNode.config.message = msg + '${' + this.selectedVariable + '}'
        this.selectedVariable = ''
        this.handleChange()
      }
    },
    // 添加字段
    addField() {
      if (this.localNode && this.localNode.type === 'SET_FIELD') {
        if (!this.localNode.config.fields) {
          this.localNode.config.fields = []
        }
        this.localNode.config.fields.push({
          prefix: 'params.',
          fieldName: '',
          target: 'params.',
          operation: 'set',
          value: '',
          quickValue: ''
        })
        this.handleChange()
      }
    },
    // 删除字段
    removeField(index) {
      if (this.localNode && this.localNode.type === 'SET_FIELD' && this.localNode.config.fields) {
        this.localNode.config.fields.splice(index, 1)
        this.handleChange()
      }
    },
    // 更新字段前缀
    updateFieldPrefix(index) {
      if (this.localNode && this.localNode.type === 'SET_FIELD' && this.localNode.config.fields) {
        const field = this.localNode.config.fields[index]
        if (field) {
          field.target = field.prefix + field.fieldName
          this.handleChange()
        }
      }
    },
    // 更新字段名
    updateFieldTarget(index) {
      if (this.localNode && this.localNode.type === 'SET_FIELD' && this.localNode.config.fields) {
        const field = this.localNode.config.fields[index]
        if (field) {
          field.target = field.prefix + field.fieldName
          this.handleChange()
        }
      }
    },
    // 插入快速值
    insertQuickValue(field) {
      if (field && field.quickValue) {
        const prefix = field.quickValue
        field.value = '${' + prefix.substring(0, prefix.length - 1) + '}'
        field.quickValue = ''
        this.handleChange()
      }
    }
  }
}
</script>

<style lang="less" scoped>
.rule-node-props {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;
  color: #e0e0e0;

  .props-header {
    padding: 12px 16px;
    border-bottom: 1px solid #404040;

    h4 {
      margin: 0;
      font-size: 14px;
      color: #fff;
    }
  }

  .props-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .props-footer {
    padding: 12px;
    border-top: 1px solid #404040;
  }

  .param-item,
  .condition-item,
  .chain-rule-item,
  .field-item {
    display: flex;
    flex-direction: column;
    padding: 8px;
    background: #2d2d2d;
    border-radius: 4px;
    margin-bottom: 8px;
  }

  .condition-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }

  .nested-condition {
    background: #3a3a3a;
    border: 1px solid #565656;
    border-radius: 4px;
    padding: 8px;
    margin-bottom: 4px;

    .nested-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      color: #ff9900;
      font-weight: bold;
      font-size: 12px;

      span {
        flex: 1;
        margin-left: 4px;
      }
    }

    .nested-rules {
      padding-left: 12px;
      border-left: 2px solid #ff9900;
    }

    .sub-condition-item {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }
  }

  .expr-condition-row {
    display: flex;
    align-items: center;
  }

  .param-arrow {
    color: #57a3f3;
    font-size: 12px;
  }

  .tips {
    margin-top: 8px;
  }
}

// 深色主题 - 覆盖 iView 组件默认样式
::v-deep {
  .ivu-form-item-label {
    color: #e0e0e0 !important;
    padding: 8px 12px 8px 0;
  }

  .ivu-form-item {
    margin-bottom: 12px;
  }

  .ivu-input {
    background-color: #2d2d2d !important;
    border-color: #404040 !important;
    color: #e0e0e0 !important;

    &::placeholder {
      color: #888 !important;
    }

    &:focus {
      border-color: #57a3f3 !important;
      box-shadow: 0 0 0 2px rgba(87, 163, 243, 0.2);
    }
  }

  .ivu-input-number {
    background-color: #2d2d2d !important;
    border-color: #404040 !important;
    color: #e0e0e0 !important;

    &-input {
      background-color: transparent !important;
      color: #e0e0e0 !important;
    }
  }

  .ivu-select {
    background-color: #2d2d2d !important;

    &-selection {
      background-color: #2d2d2d !important;
      border-color: #404040 !important;
      color: #e0e0e0 !important;

      &::placeholder {
        color: #888 !important;
      }
    }

    &-dropdown {
      background-color: #2d2d2d !important;

      .ivu-select-item {
        color: #e0e0e0 !important;

        &:hover {
          background-color: #3a3a3a !important;
        }

        &.ivu-select-item-selected {
          background-color: #57a3f3 !important;
          color: #fff !important;
        }
      }
    }
  }

  .ivu-radio-group {
    .ivu-radio-wrapper {
      color: #e0e0e0 !important;
    }
  }

  .ivu-checkbox-wrapper {
    color: #e0e0e0 !important;
  }

  .ivu-alert {
    background-color: #2d2d2d !important;
    border-color: #404040 !important;
    color: #e0e0e0 !important;

    &-info {
      border-color: #57a3f3 !important;
      background-color: rgba(87, 163, 243, 0.1) !important;
    }

    &-warning {
      border-color: #ff9900 !important;
      background-color: rgba(255, 153, 0, 0.1) !important;
    }
  }

  .ivu-divider {
    border-color: #404040 !important;
    color: #888 !important;
  }

  .ivu-btn-dashed {
    color: #e0e0e0 !important;
    border-color: #404040 !important;
    background-color: #2d2d2d !important;

    &:hover {
      color: #57a3f3 !important;
      border-color: #57a3f3 !important;
    }
  }

  .ivu-btn-text {
    color: #e0e0e0 !important;

    &:hover {
      color: #57a3f3 !important;
    }
  }

  .ivu-tag {
    background: #2d2d2d;
    border-color: #404040;
    color: #e0e0e0;
  }

  .ivu-icon {
    color: #888;
  }
}
</style>