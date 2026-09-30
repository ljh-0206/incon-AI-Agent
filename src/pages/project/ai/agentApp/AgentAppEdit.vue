<template>
  <div class="ai-agent-app-edit">
    <Spin v-if="loading" fix>加载中...</Spin>

    <div class="sub-title-row">
      <h3 class="sub-title">{{ form.id ? '编辑智能体应用' : '新建智能体应用' }}</h3>
      <div class="sub-title-actions">
        <Button @click="back">返回</Button>
        <Button type="primary" :loading="saving" @click="save">保存</Button>
      </div>
    </div>

    <Form :model="form" :label-width="110" class="edit-form">
      <FormItem label="应用名称" required>
        <Input v-model="form.name" placeholder="如：智能客服助手" style="width: 360px" />
      </FormItem>
      <FormItem label="应用描述">
        <Input v-model="form.description" placeholder="一句话描述应用用途" style="width: 480px" />
      </FormItem>
      <FormItem label="应用类型" required>
        <RadioGroup v-model="form.appType">
          <Radio label="standard">标准模式</Radio>
          <Radio label="workflow">工作流模式</Radio>
        </RadioGroup>
        <div class="form-tip">
          {{ form.appType === 'workflow' ? '工作流模式：关联一个已发布工作流，每条消息触发工作流执行' : '标准模式：配置模型 + 提示词 + 知识库，直接 AI 对话' }}
        </div>
      </FormItem>
      <FormItem label="头像图标">
        <div class="avatar-picker">
          <div v-for="ic in avatarPresets" :key="ic"
               :class="['avatar-option', { selected: form.avatar === ic }]"
               @click="form.avatar = ic">
            <i :class="ic"></i>
          </div>
        </div>
      </FormItem>
      <FormItem label="欢迎词">
        <Input v-model="form.welcomeText" type="textarea" :rows="2"
               placeholder="新开对话时显示的欢迎语，如：你好！我是智能客服助手，有什么可以帮您？" style="width: 560px" />
      </FormItem>
      <FormItem label="逐字回复">
        <Switch v-model="form.streaming" @on-change="onStreamingChange" />
        <span class="form-tip" style="margin-left:8px" v-if="form.appType === 'workflow'">开启后逐字流式展示（需结束节点前一个为 LLM 节点，仅最后一个 LLM 逐字输出）</span>
        <span class="form-tip" style="margin-left:8px" v-else>开启后 AI 回复逐字流式展示</span>
      </FormItem>
      <FormItem label="思考过程输出" v-if="form.streaming">
        <Switch v-model="form.showReasoning" />
        <span class="form-tip" style="margin-left:8px">开启后透传推理模型思考过程（需模型支持，仅逐字回复时生效）</span>
      </FormItem>

      <!-- 标准模式字段 -->
      <template v-if="form.appType === 'standard'">
        <Divider orientation="left">标准模式配置</Divider>
        <FormItem label="模型" required>
          <Select v-model="form.modelId" :loading="modelsLoading" clearable transfer placeholder="选择 AI 模型" style="width: 360px">
            <Option v-for="m in models" :key="m.id" :value="String(m.id)" :label="m.modelName || m.id" />
          </Select>
          <div v-if="models.length === 0" class="form-tip warn">暂无可用模型，请先在「模型管理」添加并启用 LLM 模型</div>
        </FormItem>
        <FormItem label="系统提示词">
          <Input v-model="form.systemPrompt" type="textarea" :rows="6"
                 placeholder="设定 AI 的角色和行为，如：你是一个专业的客服助手，耐心解答用户问题" style="width: 560px" />
        </FormItem>
        <FormItem label="知识库">
          <Select v-model="form.kbid" :loading="kbLoading" clearable transfer placeholder="不关联知识库（可选）" style="width: 360px">
            <Option v-for="k in knowledgeBases" :key="k.id" :value="String(k.id)" :label="k.kbmc || k.id" />
          </Select>
          <span class="form-tip" style="margin-left:8px">关联后对话按知识库做 RAG 检索注入</span>
        </FormItem>
        <FormItem label="温度">
          <Slider v-model="form.temperature" :min="0" :max="2" :step="0.1" show-input :show-input-controls="false" style="width: 360px" />
          <div class="form-tip">控制输出随机性：0=确定性，1=平衡，2=创造性（留空用模型默认）</div>
        </FormItem>
        <FormItem label="最大 Token 数">
          <InputNumber v-model="form.maxTokens" :min="100" :max="8000" :step="100" style="width: 200px" />
          <span class="form-tip" style="margin-left:8px">限制 AI 回复的最大长度</span>
        </FormItem>
      </template>

      <!-- 工作流模式字段 -->
      <template v-if="form.appType === 'workflow'">
        <Divider orientation="left">工作流模式配置</Divider>
        <FormItem label="关联工作流" required>
          <Select v-model="form.workflowId" :loading="wfLoading" clearable transfer placeholder="选择已发布的工作流" style="width: 360px">
            <Option v-for="w in workflows" :key="w.id" :value="String(w.id)" :label="w.name || w.id" />
          </Select>
          <div v-if="workflows.length === 0" class="form-tip warn">暂无已发布工作流，请先在「工作流管理」发布工作流</div>
        </FormItem>
      </template>

      <!-- 对外接口（仅已保存应用） -->
      <template v-if="form.id">
        <Divider orientation="left">对外接口</Divider>
        <FormItem label="API Key">
          <Input :model-value="form.apiKey" readonly placeholder="保存后自动生成" style="width: 420px" />
          <Button size="small" style="margin-left:8px" :loading="resetting" @click="resetKey">重置密钥</Button>
          <Button size="small" style="margin-left:8px" @click="copyText(form.apiKey)">复制</Button>
          <div class="form-tip">重置后旧 Key 立即失效；后端 API 与对话页均凭此 Key 校验。</div>
        </FormItem>
        <FormItem label="后端 API">
          <div class="open-api-block">
            <div>阻塞：<code>POST {{ apiBase }}/ai/open/agent-app/{{ form.id }}/run</code></div>
            <div>流式：<code>POST {{ apiBase }}/ai/open/agent-app/{{ form.id }}/run/stream</code></div>
            <div class="form-tip">请求头 <code>X-Api-Key: {{ form.apiKey }}</code>；body <code>{ "question": "...", "startMessageId": "可选" }</code>；流式返回 SSE 事件 <code>chatCode/message/reasoning/complete/error</code>。</div>
          </div>
        </FormItem>
        <FormItem label="对话页面">
          <div class="open-api-block">
            <code>{{ chatPageUrl }}</code>
            <Button size="small" style="margin-left:8px" @click="copyText(chatPageUrl)">复制链接</Button>
            <div class="form-tip">公开链接，无需登录；外部访客直接打开即可与该智能体对话。</div>
          </div>
        </FormItem>
      </template>
    </Form>
  </div>
</template>

<script>
import { Message } from 'view-ui-plus';
import request from '@/plugins/request';
import Setting from '@/setting';
import { agentAppGet, agentAppCreate, agentAppUpdate } from '@/api/agentApp';
import { agentAppResetKey } from '@/api/agentAppOpen';

export default {
  name: 'AiAgentAppEdit',
  data () {
    return {
      loading: false,
      saving: false,
      resetting: false,
      modelsLoading: false,
      kbLoading: false,
      wfLoading: false,
      models: [],
      knowledgeBases: [],
      workflows: [],
      avatarPresets: [
        'fa-solid fa-robot',
        'fa-solid fa-user-astronaut',
        'fa-solid fa-lightbulb',
        'fa-solid fa-headset',
        'fa-solid fa-graduation-cap',
        'fa-solid fa-database',
        'fa-solid fa-code',
        'fa-solid fa-pen-fancy',
        'fa-solid fa-chart-line',
        'fa-solid fa-microscope',
        'fa-solid fa-hands-helping',
        'fa-solid fa-comments'
      ],
      form: this.defaultForm()
    };
  },
  computed: {
    // 对外后端 API 基址（同源 + apiBaseURL；外部调用方按实际后端地址替换）
    apiBase () {
      return window.location.origin + (Setting.apiBaseURL || '/api');
    },
    // 对外对话页链接（公开，凭 appId + key 访问）
    chatPageUrl () {
      return `${window.location.origin}${Setting.routerBase || '/'}agent/chat?appId=${this.form.id || ''}&key=${this.form.apiKey || ''}`;
    }
  },
  mounted () {
    const id = this.$route.params.id;
    if (id) {
      this.load(id);
    }
    this.loadModels();
    this.loadKnowledgeBases();
    this.loadWorkflows();
  },
  methods: {
    defaultForm () {
      return {
        id: null,
        name: '',
        description: '',
        appType: 'standard',
        avatar: 'fa-solid fa-robot',
        welcomeText: '',
        streaming: false,
        showReasoning: false,
        modelId: null,
        systemPrompt: '',
        kbid: null,
        temperature: 0.7,
        maxTokens: 2000,
        workflowId: null,
        status: 'draft',
        enabled: false,
        apiKey: ''
      };
    },
    async load (id) {
      this.loading = true;
      try {
        const app = await agentAppGet(id);
        if (app) {
          // 合并到 form（保留默认值的兜底）
          this.form = { ...this.defaultForm(), ...app };
          // 下拉值统一转字符串
          if (this.form.modelId) this.form.modelId = String(this.form.modelId);
          if (this.form.kbid) this.form.kbid = String(this.form.kbid);
          if (this.form.workflowId) this.form.workflowId = String(this.form.workflowId);
        }
      } catch (e) {
        Message.error('加载应用失败');
      } finally {
        this.loading = false;
      }
    },
    // 下拉数据源：复用工作流资源控制器
    async loadModels () {
      this.modelsLoading = true;
      try {
        this.models = await request({ url: '/ai/workflow/res/models', method: 'get' }) || [];
      } catch (e) {
        this.models = [];
      } finally {
        this.modelsLoading = false;
      }
    },
    async loadKnowledgeBases () {
      this.kbLoading = true;
      try {
        this.knowledgeBases = await request({ url: '/ai/workflow/res/knowledge-bases', method: 'get' }) || [];
      } catch (e) {
        this.knowledgeBases = [];
      } finally {
        this.kbLoading = false;
      }
    },
    async loadWorkflows () {
      this.wfLoading = true;
      try {
        this.workflows = await request({ url: '/ai/workflow/published', method: 'get' }) || [];
      } catch (e) {
        this.workflows = [];
      } finally {
        this.wfLoading = false;
      }
    },
    // 逐字回复开关变化：工作流模式下校验「结束节点前一个必须是 LLM 节点」，否则回滚开关并提示
    async onStreamingChange (val) {
      if (!val) return; // 关闭无需校验
      if (this.form.appType !== 'workflow') return; // 标准模式不校验
      if (!this.form.workflowId) {
        Message.warning('请先选择工作流');
        this.$nextTick(() => { this.form.streaming = false; });
        return;
      }
      try {
        const wf = await request({ url: `/ai/workflow/${this.form.workflowId}`, method: 'get' });
        const check = this.checkLastNodeIsLlm(wf && wf.graphData);
        if (!check.ok) {
          Message.warning(check.msg || '工作流最后一个节点不是LLM，无法开启逐字回复');
          this.$nextTick(() => { this.form.streaming = false; });
        }
      } catch (e) {
        Message.error('校验工作流结构失败');
        this.$nextTick(() => { this.form.streaming = false; });
      }
    },
    // 解析工作流图：结束节点前一个（直连 end 的源节点）是否为 LLM
    checkLastNodeIsLlm (graphData) {
      if (!graphData) return { ok: false, msg: '工作流图为空' };
      try {
        const g = typeof graphData === 'string' ? JSON.parse(graphData) : graphData;
        const nodes = g.nodes || [];
        const edges = g.edges || [];
        const endNodes = nodes.filter(n => n.type === 'end');
        if (!endNodes.length) return { ok: false, msg: '工作流缺少结束节点' };
        const endIds = endNodes.map(n => n.id);
        const beforeEndIds = edges.filter(e => endIds.includes(e.target)).map(e => e.source);
        if (!beforeEndIds.length) return { ok: false, msg: '工作流最后一个节点不是LLM，无法开启逐字回复' };
        const beforeEndNodes = nodes.filter(n => beforeEndIds.includes(n.id));
        const allLlm = beforeEndNodes.length > 0 && beforeEndNodes.every(n => n.type === 'llm');
        return { ok: allLlm, msg: allLlm ? '' : '工作流最后一个节点不是LLM，无法开启逐字回复' };
      } catch (e) {
        return { ok: false, msg: '工作流图解析失败' };
      }
    },
    // ========== 对外接口 ==========
    async resetKey () {
      if (!this.form.id) return;
      this.resetting = true;
      try {
        const res = await agentAppResetKey(this.form.id);
        if (res && res.apiKey) {
          this.form.apiKey = res.apiKey;
          Message.success('已重置，旧密钥立即失效');
        } else {
          Message.success('已重置');
        }
      } catch (e) {
        Message.error('重置失败');
      } finally {
        this.resetting = false;
      }
    },
    copyText (text) {
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => Message.success('已复制')).catch(() => this.fallbackCopy(text));
      } else {
        this.fallbackCopy(text);
      }
    },
    fallbackCopy (text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); Message.success('已复制'); } catch (e) { Message.warning('复制失败，请手动复制'); }
      document.body.removeChild(ta);
    },
    back () {
      this.$router.push({ name: 'ai-agent-app' });
    },
    async save () {
      if (!this.form.name || !this.form.name.trim()) {
        Message.warning('请填写应用名称');
        return;
      }
      if (this.form.appType === 'standard' && !this.form.modelId) {
        Message.warning('标准模式请选择模型');
        return;
      }
      if (this.form.appType === 'workflow' && !this.form.workflowId) {
        Message.warning('工作流模式请选择关联工作流');
        return;
      }
      this.saving = true;
      try {
        const payload = { ...this.form };
        // 数值字段清理
        if (payload.temperature == null) payload.temperature = null;
        if (payload.maxTokens == null) payload.maxTokens = null;
        if (this.form.id) {
          await agentAppUpdate(payload);
          Message.success('保存成功');
        } else {
          const created = await agentAppCreate(payload);
          if (created && created.id) this.form.id = created.id;
          Message.success('创建成功');
        }
        this.back();
      } catch (e) {
        Message.error('保存失败');
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>

<style lang="less" scoped>
.ai-agent-app-edit {
  position: relative;
  padding: 16px;
  max-width: 900px;
}
.sub-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  .sub-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }
}
.edit-form {
  background: #fff;
  padding: 20px 24px;
  border-radius: 8px;
  border: 1px solid #efefef;
}
.form-tip {
  font-size: 12px;
  color: #808695;
  margin-top: 4px;
  &.warn { color: #ed4014; }
}
.open-api-block {
  font-size: 13px;
  color: #515a6e;
  line-height: 1.9;
  code {
    background: #f1f3f5;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 12px;
    word-break: break-all;
  }
}
.avatar-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.avatar-option {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f5f7fa;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .15s;
  i { font-size: 18px; color: #515a6e; }
  &:hover { background: #eef2ff; }
  &.selected {
    border-color: #6366f1;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    i { color: #fff; }
  }
}
</style>
