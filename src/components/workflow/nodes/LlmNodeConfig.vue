<template>
  <div class="llm-config">
    <!-- 模型选择 -->
    <FormItem label="模型">
      <Select :transfer="true" v-model="localConfig.modelId" placeholder="选择模型" @on-change="emitUpdate">
        <Option
          v-for="model in models"
          :key="model.id"
          :label="model.name"
          :value="model.id"
        >{{ model.name }}</Option>
      </Select>
    </FormItem>

    <!-- 系统提示词 -->
    <FormItem label="系统提示词">
      <Input
        v-model="localConfig.systemPrompt"
        type="textarea"
        :rows="4"
        placeholder="设置AI的角色和行为规则..."
        @on-blur="emitUpdate"
      />
    </FormItem>

    <!-- 用户提示词 -->
    <FormItem label="用户提示词">
      <Input
        v-model="localConfig.userPrompt"
        type="textarea"
        :rows="4"
        placeholder="使用 {{变量名}} 引用上游变量"
        @on-blur="emitUpdate"
      />
      <div class="variable-hints">
        <span class="hint-label">可用变量：</span>
        <Tag 
          v-for="v in availableVariables" 
          :key="v" 
          size="small" 
          type="info"
          @click="insertVariable(v)"
          class="var-tag"
        >
          {{ v }}
        </Tag>
      </div>
    </FormItem>

    <!-- 输出变量 -->
    <FormItem label="输出变量名">
      <Input v-model="localConfig.outputVariable" placeholder="llm_output" @on-blur="emitUpdate" />
    </FormItem>

    <!-- 高级配置 -->
    <Collapse class="advanced-config">
      <CollapsePanel title="高级配置" name="advanced">
        <FormItem label="Temperature">
          <Slider 
            v-model="localConfig.temperature" 
            :min="0" 
            :max="2" 
            :step="0.1" 
            show-input
            :show-input-controls="false"
            @on-change="emitUpdate"
          />
          <div class="param-hint">控制输出随机性：0=确定性，1=平衡，2=创造性</div>
        </FormItem>
        
        <FormItem label="最大Token数">
          <InputNumber
            v-model="localConfig.maxTokens"
            :min="100"
            :max="8000"
            :step="100"
            @on-change="emitUpdate"
          />
          <div class="param-hint">限制AI回复的最大长度</div>
        </FormItem>

        <!-- 关联上下文：智能体工作流模式按 chatcode 取对话历史拼入 userPrompt；工作流编辑器调试无历史 -->
        <FormItem label="关联上下文">
          <i-switch v-model="localConfig.useChatHistory" @on-change="emitUpdate" />
          <div class="param-hint">选中则把该智能体的对话历史拼入提示词，支持多轮对话续接</div>
        </FormItem>
      </CollapsePanel>
    </Collapse>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps({
  config: Object,
  availableVariables: Array
})

const emit = defineEmits(['update:config'])

const models = ref([])

const localConfig = reactive({
  modelId: null,
  systemPrompt: '',
  userPrompt: '{{input}}',
  outputVariable: 'llm_output',
  temperature: 0.7,
  maxTokens: 2000,
  useChatHistory: false
})

// 同步外部配置
watch(() => props.config, (newConfig) => {
  if (newConfig) {
    Object.assign(localConfig, newConfig)
  }
}, { immediate: true, deep: true })

// 加载模型列表（ddmpt4.0：/ai/workflow/res/models，返回 ReturnT.content）
// 兼容实体驼峰（modelLabel）与低代码下划线（model_label）两种 JSON 命名
onMounted(async () => {
  try {
    const res = await axios.get('/api/ai/workflow/res/models')
    if (res.data.code === 200) {
      const list = res.data.content || []
      models.value = list.map(m => ({
        ...m,
        id: m.id || m.id_,
        name: m.modelLabel || m.model_label || m.modelName || m.model_name || `模型${m.id}`
      }))
    }
  } catch (e) {
    console.error('加载模型列表失败:', e)
  }
})

// 发送更新
const emitUpdate = () => {
  emit('update:config', { ...localConfig })
}

// 插入变量
const insertVariable = (varName) => {
  localConfig.userPrompt += `{{${varName}}}`
  emitUpdate()
}
</script>

<style scoped>
.llm-config {
  padding: 8px 0;
}

.variable-hints {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.hint-label {
  font-size: 12px;
  color: #909399;
}

.var-tag {
  cursor: pointer;
}

.var-tag:hover {
  background: #409eff;
  color: white;
}

.advanced-config {
  margin-top: 12px;
  border: none;
}

.advanced-config :deep(.el-collapse-item__header) {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  background: #f8fafc;
  border-radius: 6px;
  padding: 0 12px;
  height: 36px;
}

.advanced-config :deep(.el-collapse-item__content) {
  padding: 12px 0;
}

.param-hint {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}
</style>
