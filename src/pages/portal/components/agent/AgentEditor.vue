<template>
    <div class="ag-editor">
        <!-- 页头 -->
        <header class="ag-editor__head">
            <div>
                <button type="button" class="ag-back" @click="$emit('nav', 'list')">← 返回列表</button>
                <h1 class="ag-editor__title">{{ isEdit ? '编辑智能体(' + form.name + ')' : '新建智能体' }}</h1>
                <!-- 新建态不再展示引导副标题；编辑态保留正在编辑信息 -->
            </div>
            <div class="ag-editor__head-actions">
                <Button @click="saveDraft">保存草稿</Button>
                <Button type="primary" @click="publish">保存并发布</Button>
            </div>
        </header>

        <div class="ag-editor__form">
            <!-- 基本信息 -->
            <section class="ag-form-sec">
                <h3 class="ag-form-sec__title">基本信息</h3>

                <div class="ag-form-row">
                    <label class="ag-form-label" for="f-name">应用名称<span class="ag-req">*</span></label>
                    <Input id="f-name" v-model.trim="form.name" placeholder="如：智能客服助手" />
                    <p v-if="errors.name" class="ag-form-error">{{ errors.name }}</p>
                </div>

                <div class="ag-form-row">
                    <label class="ag-form-label" for="f-desc">应用描述</label>
                    <Input id="f-desc" v-model.trim="form.description" placeholder="一句话描述应用用途" />
                </div>

                <div class="ag-form-row">
                    <label class="ag-form-label">应用类型<span class="ag-req">*</span></label>
                    <RadioGroup v-model="form.appType" type="button">
                        <Radio label="standard">标准模式</Radio>
                        <Radio label="workflow">工作流模式</Radio>
                    </RadioGroup>
                    <p class="ag-form-hint">{{ form.appType === 'workflow' ? '工作流模式：关联一个已发布工作流，每条消息触发工作流执行。' :
                        '标准模式：配置模型 + 提示词 + 知识库，直接 AI 对话。' }}</p>
                </div>

                <div class="ag-form-row">
                    <label class="ag-form-label">头像</label>
                    <div class="ag-avatar-row">
                        <!-- 上传与已选头像互斥渲染：上传组件的旧删除图标在 Vue 3 下不可依赖 -->
                        <template v-if="!form.avatar">
                            <div class="ag-avatar-upload">
                                <!-- 全局组件 uploadImg（注册名 uploadimg，beforeCreate 做 uploadImg 别名）；
                       v-model 绑 modelValue；单图上传组件只 emit input，故并接 @input 同步 -->
                                <uploadImg v-model="form.avatar" :configdata="avatarUploadConfig"
                                    @uploadSuccess="onAvatarUploadSuccess" />
                            </div>
                        </template>
                        <div v-else class="ag-avatar-current">
                            <div class="ag-avatar-preview ag-avatar-preview--large" role="img" aria-label="智能体头像"
                                :style="avatarPreviewStyle">
                            </div>
                            <button type="button" class="ag-avatar-remove" aria-label="删除头像" title="删除头像"
                                @click="clearAvatar">
                                <Icon type="md-close-circle" size="12" />
                            </button>
                        </div>
                    </div>
                </div>

                <div class="ag-form-row">
                    <label class="ag-form-label" for="f-welcome">欢迎词</label>
                    <Input id="f-welcome" v-model.trim="form.welcomeText" type="textarea" :rows="3"
                        placeholder="新开对话时显示的欢迎语，如：你好！我是智能客服助手，有什么可以帮您？" />
                </div>

                <div class="ag-cap-row">
                    <div class="ag-cap-row__text">
                        <div class="ag-cap-row__name">逐字回复</div>
                        <div class="ag-cap-row__desc">
                            {{ form.appType === 'workflow' ?
                                '开启后逐字流式展示（需结束节点前一个为 LLM 节点，仅最后一个LLM 逐字输出）' : '开启后 AI 回复逐字流式展示' }}
                        </div>
                    </div>
                    <i-switch v-model="form.streaming" @on-change="onStreamingChange" />
                </div>

                <div v-if="form.streaming" class="ag-cap-row">
                    <div class="ag-cap-row__text">
                        <div class="ag-cap-row__name">思考过程输出</div>
                        <div class="ag-cap-row__desc">开启后透传推理模型思考过程（需模型支持，仅逐字回复时生效）</div>
                    </div>
                    <i-switch v-model="form.showReasoning" />
                </div>
            </section>

            <!-- 标准模式字段 -->
            <section v-if="form.appType === 'standard'" class="ag-form-sec">
                <h3 class="ag-form-sec__title">标准模式配置</h3>

                <div class="ag-form-row">
                    <label class="ag-form-label" for="f-model">模型<span class="ag-req">*</span></label>
                    <Select id="f-model" v-model="form.modelId" clearable :transfer="false" placeholder="选择 AI 模型">
                        <Option v-for="m in modelOptions" :key="m.value" :value="m.value">{{ m.label }}</Option>
                    </Select>
                    <p v-if="!modelOptions.length" class="ag-form-hint ag-form-hint--warn">暂无可用模型，请先在「模型管理」添加并启用 LLM 模型
                    </p>
                </div>

                <div class="ag-form-row">
                    <label class="ag-form-label" for="f-prompt">系统提示词</label>
                    <Input id="f-prompt" v-model.trim="form.systemPrompt" type="textarea" :rows="6"
                        placeholder="设定 AI 的角色和行为，如：你是一个专业的客服助手，耐心解答用户问题" />
                </div>

                <div class="ag-form-row">
                    <label class="ag-form-label" for="f-kb">知识库</label>
                    <Select id="f-kb" v-model="form.kbid" clearable :transfer="false" placeholder="不关联知识库（可选）">
                        <Option v-for="k in kbLibrary" :key="k.value" :value="k.value">{{ k.label }}</Option>
                    </Select>
                    <p class="ag-form-hint">关联后对话按知识库做 RAG 检索注入。</p>
                </div>

                <div class="ag-form-row">
                    <label class="ag-form-label" for="f-temp">温度 <span class="ag-form-value">{{ tempLabel
                    }}</span></label>
                    <Slider id="f-temp" v-model="form.temperature" :min="0" :max="2" :step="0.1" show-input
                        :show-input-controls="false" />
                    <p class="ag-form-hint">控制输出随机性：0=确定性，1=平衡，2=创造性。</p>
                </div>

                <div class="ag-form-row">
                    <label class="ag-form-label" for="f-tokens">最大 Token 数</label>
                    <InputNumber id="f-tokens" v-model="form.maxTokens" :min="100" :max="8000" :step="100" />
                    <p class="ag-form-hint">限制 AI 回复的最大长度。</p>
                </div>
            </section>

            <!-- 工作流模式字段 -->
            <section v-if="form.appType === 'workflow'" class="ag-form-sec">
                <h3 class="ag-form-sec__title">工作流模式配置</h3>

                <div class="ag-form-row">
                    <label class="ag-form-label" for="f-wf">关联工作流<span class="ag-req">*</span></label>
                    <Select id="f-wf" v-model="form.workflowId" clearable :transfer="false" placeholder="选择已发布的工作流">
                        <Option v-for="w in workflowOptions" :key="w.value" :value="w.value">{{ w.label }}</Option>
                    </Select>
                    <p v-if="!workflowOptions.length" class="ag-form-hint ag-form-hint--warn">暂无已发布工作流，请先在「工作流管理」发布工作流
                    </p>
                </div>
            </section>

            <!-- 对外接口（仅已保存的智能体；与后台「智能体应用编辑」的对外接口分组同源）
                 密钥由后端生成、表单只读展示，不进保存 payload（避免回写覆盖），重置走专用接口 -->
            <section v-if="isEdit" class="ag-form-sec">
                <h3 class="ag-form-sec__title">对外接口</h3>

                <div class="ag-form-row">
                    <label class="ag-form-label" for="f-apikey">API Key</label>
                    <div class="ag-open-row">
                        <Input id="f-apikey" class="ag-open-key" readonly :model-value="apiKey" placeholder="保存后自动生成" />
                        <Button size="small" :loading="resetting" @click="askResetKey">重置密钥</Button>
                        <button type="button" class="ag-open-btn" :disabled="!apiKey"
                            @click="copyText(apiKey)">复制</button>
                    </div>
                    <p class="ag-form-hint">重置后旧 Key 立即失效；后端 API 与对话页均凭此 Key 校验。</p>
                </div>

                <div class="ag-form-row">
                    <label class="ag-form-label">后端 API</label>
                    <div class="ag-open-block">
                        <div class="ag-open-line">
                            <span class="ag-open-tag">POST 阻塞</span>
                            <code class="ag-open-code">{{ openRunUrl }}</code>
                        </div>
                        <div class="ag-open-line">
                            <span class="ag-open-tag ag-open-tag--stream">POST 流式</span>
                            <code class="ag-open-code">{{ openStreamUrl }}</code>
                        </div>
                        <ul class="ag-open-notes">
                            <li>请求头 <code
                                    class="ag-open-inline">{{ apiKey ? 'X-Api-Key: ' + apiKey : 'X-Api-Key:（保存后生成）' }}</code>
                            </li>
                            <li>请求体 <code class="ag-open-inline">{ "question": "...", "startMessageId": "可选" }</code>
                            </li>
                            <li>流式返回 SSE 事件 <code
                                    class="ag-open-inline">chatCode / message / reasoning / complete / error</code>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="ag-form-row">
                    <label class="ag-form-label">对话页面</label>
                    <div class="ag-open-row">
                        <code class="ag-open-code ag-open-code--link">{{ chatPageUrl }}</code>
                        <button type="button" class="ag-open-btn" :disabled="!apiKey"
                            @click="copyText(chatPageUrl)">复制链接</button>
                    </div>
                    <p class="ag-form-hint">公开链接，无需登录；外部访客直接打开即可与该智能体对话。</p>
                </div>
            </section>
        </div>

        <!-- 右侧预览：本地模拟，随表单字段实时变化 -->
        <aside class="ag-editor__preview">
            <div class="ag-preview-card">
                <header class="ag-preview-card__head">
                    <h3 class="ag-preview-card__title">对话预览</h3>
                    <span class="ag-preview-card__badge">本地模拟</span>
                </header>

                <div class="ag-preview-card__chat">
                    <div class="ag-msg ag-msg--assistant">
                        <span class="ag-glyph ag-glyph--green ag-glyph--avatar" role="img"
                            :aria-label="form.avatar ? '智能体头像' : '暂无头像'" :style="avatarPreviewStyle"><span
                                v-if="!form.avatar" class="ag-glyph__ph">智</span></span>
                        <div class="ag-msg__bubble">{{ previewWelcome }}</div>
                    </div>
                    <div class="ag-msg ag-msg--user">
                        <span class="ag-glyph ag-glyph--green ag-glyph--avatar" role="img" aria-label="我"><span
                                class="ag-glyph__ph">我</span></span>
                        <div class="ag-msg__bubble">请用一句话介绍你负责的内容。</div>
                    </div>
                </div>

                <p class="ag-preview-card__note">
                    模式：{{ form.appType === 'workflow' ? '工作流' : '标准' }}；
                    流式回复{{ form.streaming ? '开启' : '关闭' }}；
                    思考过程{{ form.showReasoning ? '展示' : '不展示' }}。
                </p>
            </div>
        </aside>

        <!-- 重置对外密钥二次确认（旧 Key 立即失效，不可撤销） -->
        <PortalConfirmModal v-model="resetConfirm.visible" title="重置对外密钥" confirm-text="重置" confirm-type="error"
            :loading="resetting" content="重置后当前 API Key 立即失效，所有使用旧 Key 的后端调用与公开对话页都会返回未授权。确定重置？" @confirm="resetKey" />
    </div>
</template>

<script>
// 仅用于在 beforeCreate 把全局 uploadimg 挂成 uploadImg 别名（不 import 组件文件本身）
import { getCurrentInstance } from 'vue'
import { Message } from 'view-ui-plus'
import request from '@/plugins/request'
import Setting from '@/setting'
import {
    agentAppGet,
    agentAppCreate,
    agentAppUpdate,
    agentAppPublish
} from '@/api/agentApp'
// 对外密钥重置：与后台编辑页同源（POST /ai/agent-app/{id}/reset-key）
import { agentAppResetKey } from '@/api/agentAppOpen'
import PortalConfirmModal from '@/pages/portal/components/PortalConfirmModal.vue'

// 表单字段与后台「智能体应用编辑」(AgentAppEdit) 完全对齐，不额外扩展字段
const DEFAULT_FORM = {
    name: '',
    description: '',
    appType: 'standard', // standard | workflow
    // 头像：上传组件返回的图片 ID（空串表示未上传）
    avatar: '',
    welcomeText: '',
    streaming: false,
    showReasoning: false,
    // —— 标准模式字段 ——
    modelId: '',
    systemPrompt: '',
    kbid: '',
    temperature: 0.7,
    maxTokens: 2000,
    // —— 工作流模式字段 ——
    workflowId: '',
    // 后端状态字段：草稿默认 draft / 未启用
    status: 'draft',
    enabled: false
}

export default {
    name: 'AgentEditor',
    components: {
        PortalConfirmModal
    },
    props: {
        // 编辑时传入智能体对象；新建时为 null
        agent: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            // 头像上传组件 configdata：单图 58×58，与圆形预览同尺寸
            avatarUploadConfig: {
                blm: 'agent-avatar-upload',
                editable: '1',
                attrs: {
                    width: 58,
                    height: 58,
                    maxNumber: 1,
                    maxSize: 5
                }
            },
            // 资源选项：仅来自接口；请求失败或为空时明确为 []，不做本地兜底
            modelOptions: [],
            kbLibrary: [],
            workflowOptions: [],
            // 编辑态后端 id（$route.params.id 或 agent.id）；null 表示新建
            editId: null,
            detailLoading: false,
            saving: false,
            form: this.clone(DEFAULT_FORM),
            errors: {},
            // —— 对外接口（仅已保存的智能体）——
            // 对外密钥：后端在保存时生成，表单内只读展示；不进 buildPayload，保存不回写
            apiKey: '',
            resetting: false,
            resetConfirm: { visible: false }
        }
    },
    computed: {
        isEdit() {
            return !!this.editId
        },
        // 头像预览样式：图片 ID → getBackgroundImage(url) + 圆形铺满；空值交给占位字
        avatarPreviewStyle() {
            if (!this.form.avatar) return null
            const bg = this.commonsJs.getBackgroundImage(this.form.avatar, true) || {}
            return Object.assign({}, bg, {
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
            })
        },
        // —— 右侧对话预览文案 ——
        previewName() {
            return this.form.name || '未命名智能体'
        },
        previewWelcome() {
            return this.form.welcomeText || '您好，欢迎使用本智能体。'
        },
        previewDescription() {
            return this.form.description || '填写「应用描述」后，这里会展示它的自我介绍。'
        },
        // 温度展示值：空值表示使用模型默认
        tempLabel() {
            const v = this.form.temperature
            return (v === null || v === undefined || v === '') ? '默认' : Number(v).toFixed(1)
        },
        // 对外后端 API 基址（同源 + apiBaseURL；外部调用方按实际后端地址替换）
        apiBase() {
            return window.location.origin + (Setting.apiBaseURL || '/api')
        },
        // 对外阻塞 / 流式运行地址（凭 X-Api-Key 校验，免登录）
        openRunUrl() {
            return this.editId ? `${this.apiBase}/ai/open/agent-app/${this.editId}/run` : ''
        },
        openStreamUrl() {
            return this.editId ? `${this.apiBase}/ai/open/agent-app/${this.editId}/run/stream` : ''
        },
        // 对外公开对话页链接（凭 appId + key 免登录访问，参数与 /agent/chat 的读取一致）
        chatPageUrl() {
            return `${window.location.origin}${Setting.routerBase || '/'}agent/chat?appId=${this.editId || ''}&key=${this.apiKey || ''}`
        }
    },
    watch: {
        // 外部切换 agent（含新建→编辑）时同步加载详情或重置表单
        agent: {
            handler(val) {
                const id = this.resolveEditId(val)
                if (id) {
                    this.loadDetail(id)
                } else {
                    this.resetForm()
                }
            },
            immediate: true
        }
    },
    mounted() {
        // 深链/路由直达：$route.params.id 优先，缺失时回退 agent prop
        const id = this.resolveEditId(this.agent)
        if (id && String(id) !== String(this.editId)) {
            this.loadDetail(id)
        }
        // 资源选项异步加载：失败时置空并提示，不做本地兜底
        this.loadModels()
        this.loadKnowledgeBases()
        this.loadWorkflows()
    },
    // 模板中的 <uploadImg> 解析：全局注册名为小写 uploadimg，
    // Vue resolve 只尝试 name / camelize / capitalize，匹配不到 uploadImg，
    // 故在首次渲染前把全局组件挂到本组件 options 作别名（不 import 组件文件）。
    beforeCreate() {
        const inst = getCurrentInstance()
        if (!inst || !inst.appContext) return
        const registry = inst.appContext.components || {}
        const upload = registry.uploadimg || registry.uploadImg || null
        if (!upload) return
        const opts = inst.type || {}
        opts.components = opts.components || {}
        if (!opts.components.uploadImg) opts.components.uploadImg = upload
        if (!opts.components.uploadimg) opts.components.uploadimg = upload
    },
    methods: {
        clone(obj) {
            return JSON.parse(JSON.stringify(obj))
        },
        // 单图上传成功兜底：uploadImg 在 maxNumber==1 时只 emit input，
        // 与 @input 一并确保 form.avatar 拿到图片 ID
        onAvatarUploadSuccess(fileList) {
            if (!fileList || !fileList.length) return
            const ids = fileList.map(item => item.id).join(',')
            if (ids) this.form.avatar = ids
        },
        // 清空头像后立即切回上传入口，保存时 buildPayload 会传空串
        clearAvatar() {
            this.form.avatar = ''
        },
        // 解析编辑态 id：$route.params.id 优先，其次 agent.id
        resolveEditId(val) {
            const routeId = this.$route && this.$route.params ? this.$route.params.id : null
            if (routeId) return routeId
            return (val && val.id) || null
        },
        // 重置为新建默认表单
        resetForm() {
            this.editId = null
            this.form = this.clone(DEFAULT_FORM)
            this.errors = {}
            this.apiKey = ''
        },
        // 按 id 拉取详情并回填表单（$route.params.id / agent.id 已在 resolveEditId 解析；
        // 下拉 id 统一 String）。先同步 editId，避免 watcher 与 mounted 并发重复请求。
        async loadDetail(id) {
            this.editId = id
            this.detailLoading = true
            try {
                const app = await agentAppGet(id)
                if (app) {
                    this.form = this.mapAppToForm(app)
                    // 对外密钥随详情回填（后端保存时生成，旧数据可能为空）
                    this.apiKey = (app.apiKey === null || app.apiKey === undefined) ? '' : String(app.apiKey)
                }
                this.errors = {}
            } catch (e) {
                Message.error('加载智能体详情失败')
            } finally {
                this.detailLoading = false
            }
        },
        // 启停字段归一：后端 tinyint 会给出 0 / 1 或 '0' / '1'，布尔字段则直接给 true / false。
        // false / 0 / '0' 归一为 false，true / 1 / '1' 归一为 true；
        // null / undefined（字段缺失）与无法识别的取值走 defaultValue
        // （编辑页传 DEFAULT_FORM.enabled，即未启用，与原 !!app.enabled 同口径）
        normalizeEnabled(value, defaultValue) {
            if (value === null || value === undefined) return defaultValue
            if (value === false || value === 0 || value === '0') return false
            if (value === true || value === 1 || value === '1') return true
            return defaultValue
        },
        // 后端 AgentApp → 页面表单
        mapAppToForm(app) {
            const base = this.clone(DEFAULT_FORM)
            const mapped = Object.assign(base, {
                name: app.name || '',
                description: app.description || '',
                appType: app.appType === 'workflow' ? 'workflow' : 'standard',
                welcomeText: app.welcomeText || '',
                // avatar 存图片 ID；旧数据若是单字/图标类名，不进上传组件，避免 queryFileByIds 误查
                avatar: (app.avatar && String(app.avatar).length > 2) ? String(app.avatar) : '',
                streaming: !!app.streaming,
                systemPrompt: app.systemPrompt,
                showReasoning: !!app.showReasoning,
                temperature: (app.temperature === null || app.temperature === undefined || app.temperature === '')
                    ? base.temperature
                    : Number(app.temperature),
                maxTokens: (app.maxTokens === null || app.maxTokens === undefined || app.maxTokens === '')
                    ? base.maxTokens
                    : Number(app.maxTokens),
                status: app.status || 'draft',
                enabled: this.normalizeEnabled(app.enabled, base.enabled)
            })
            // 下拉关联 id 统一转字符串
            mapped.modelId = (app.modelId !== null && app.modelId !== undefined && app.modelId !== '')
                ? String(app.modelId)
                : ''
            mapped.kbid = (app.kbid !== null && app.kbid !== undefined && app.kbid !== '')
                ? String(app.kbid)
                : ''
            mapped.workflowId = (app.workflowId !== null && app.workflowId !== undefined && app.workflowId !== '')
                ? String(app.workflowId)
                : ''
            // 保证已选知识库在选项列表中有对应项（否则 Select 显示为原始 id）
            if (mapped.kbid && !this.kbLibrary.some(k => String(k.value) === String(mapped.kbid))) {
                this.kbLibrary.push({ value: String(mapped.kbid), label: String(mapped.kbid) })
            }
            return mapped
        },
        // 下拉数据源：模型列表；失败/为空时置 []
        async loadModels() {
            try {
                const list = await request({ url: '/ai/workflow/res/models', method: 'get' })
                this.modelOptions = (Array.isArray(list) ? list : []).map(m => ({
                    value: String(m.id),
                    label: m.modelName || String(m.id)
                }))
                if (!this.modelOptions.length) {
                    Message.warning('模型列表为空')
                }
            } catch (e) {
                // 接口失败：明确置空，不做本地兜底
                this.modelOptions = []
                Message.error('模型列表加载失败')
            }
        },
        // 下拉数据源：知识库列表；失败/为空时置 []
        async loadKnowledgeBases() {
            try {
                const list = await request({ url: '/ai/workflow/res/knowledge-bases', method: 'get' })
                this.kbLibrary = (Array.isArray(list) ? list : []).map(k => ({
                    value: String(k.id),
                    label: k.kbmc || String(k.id)
                }))
                // 补齐已选但列表缺失的知识库项（否则 Select 显示为原始 id）
                if (this.form.kbid && !this.kbLibrary.some(k => String(k.value) === String(this.form.kbid))) {
                    this.kbLibrary.push({ value: String(this.form.kbid), label: String(this.form.kbid) })
                }
            } catch (e) {
                // 接口失败：明确置空，不做本地兜底
                this.kbLibrary = []
                Message.error('知识库列表加载失败')
            }
        },
        // 下拉数据源：已发布工作流；失败/为空时置 []
        async loadWorkflows() {
            try {
                const list = await request({ url: '/ai/workflow/published', method: 'get' })
                this.workflowOptions = (Array.isArray(list) ? list : []).map(w => ({
                    value: String(w.id),
                    label: w.name || String(w.id)
                }))
            } catch (e) {
                // 接口失败：明确置空
                this.workflowOptions = []
            }
        },
        // 逐字回复开关变化：工作流模式下校验「结束节点前一个必须是 LLM 节点」，否则回滚开关并提示
        async onStreamingChange(val) {
            if (!val) return // 关闭无需校验
            if (this.form.appType !== 'workflow') return // 标准模式不校验
            if (!this.form.workflowId) {
                Message.warning('请先选择工作流')
                this.$nextTick(() => { this.form.streaming = false })
                return
            }
            try {
                const wf = await request({ url: `/ai/workflow/${this.form.workflowId}`, method: 'get' })
                const check = this.checkLastNodeIsLlm(wf && wf.graphData)
                if (!check.ok) {
                    Message.warning(check.msg || '工作流最后一个节点不是LLM，无法开启逐字回复')
                    this.$nextTick(() => { this.form.streaming = false })
                }
            } catch (e) {
                Message.error('校验工作流结构失败')
                this.$nextTick(() => { this.form.streaming = false })
            }
        },
        // 解析工作流图：结束节点前一个（直连 end 的源节点）是否为 LLM
        checkLastNodeIsLlm(graphData) {
            if (!graphData) return { ok: false, msg: '工作流图为空' }
            try {
                const g = typeof graphData === 'string' ? JSON.parse(graphData) : graphData
                const nodes = g.nodes || []
                const edges = g.edges || []
                const endNodes = nodes.filter(n => n.type === 'end')
                if (!endNodes.length) return { ok: false, msg: '工作流缺少结束节点' }
                const endIds = endNodes.map(n => n.id)
                const beforeEndIds = edges.filter(e => endIds.includes(e.target)).map(e => e.source)
                if (!beforeEndIds.length) return { ok: false, msg: '工作流最后一个节点不是LLM，无法开启逐字回复' }
                const beforeEndNodes = nodes.filter(n => beforeEndIds.includes(n.id))
                const allLlm = beforeEndNodes.length > 0 && beforeEndNodes.every(n => n.type === 'llm')
                return { ok: allLlm, msg: allLlm ? '' : '工作流最后一个节点不是LLM，无法开启逐字回复' }
            } catch (e) {
                return { ok: false, msg: '工作流图解析失败' }
            }
        },
        validate() {
            const errors = {}
            if (!this.form.name) errors.name = '请输入应用名称'
            this.errors = errors
            return Object.keys(errors).length === 0
        },
        // 组装后端 payload：字段与 AgentAppEdit 对齐；关联 id 一律 String()
        // 注意：对外密钥 apiKey 由后端生成、表单只读展示，不参与回写（改密钥走 reset-key 接口）
        buildPayload() {
            const f = this.form
            return {
                name: f.name,
                description: f.description || '',
                appType: f.appType === 'workflow' ? 'workflow' : 'standard',
                avatar: f.avatar || '',
                welcomeText: f.welcomeText || '',
                streaming: !!f.streaming,
                showReasoning: !!f.showReasoning,
                modelId: (f.modelId !== null && f.modelId !== undefined && f.modelId !== '') ? String(f.modelId) : '',
                systemPrompt: f.systemPrompt || '',
                kbid: (f.kbid !== null && f.kbid !== undefined && f.kbid !== '') ? String(f.kbid) : '',
                temperature: (f.temperature === undefined) ? null : f.temperature,
                maxTokens: (f.maxTokens === undefined) ? null : f.maxTokens,
                workflowId: (f.workflowId !== null && f.workflowId !== undefined && f.workflowId !== '')
                    ? String(f.workflowId)
                    : '',
                status: f.status || 'draft',
                enabled: !!f.enabled
            }
        },
        // 保存（新建 Create / 编辑 Update），返回可用的智能体 id
        async persist(status) {
            const payload = this.buildPayload()
            if (status) payload.status = status
            if (this.editId) {
                payload.id = this.editId
                await agentAppUpdate(payload)
                await this.syncApiKey(this.editId)
                return this.editId
            }
            const created = await agentAppCreate(payload)
            const id = created && created.id !== undefined && created.id !== null ? created.id : null
            if (id) {
                this.editId = id
                // 新建后服务端才首次生成对外密钥：优先取创建响应，缺失时补拉一次详情
                this.apiKey = (created && created.apiKey) ? String(created.apiKey) : this.apiKey
                await this.syncApiKey(id)
            }
            return id
        },
        // 对外密钥补拉：仅当本地尚无密钥时拉一次详情；失败静默，不阻断保存
        async syncApiKey(id) {
            if (!id || this.apiKey) return
            try {
                const app = await agentAppGet(id)
                if (app && String(app.id) === String(id)) {
                    this.apiKey = (app.apiKey === null || app.apiKey === undefined) ? '' : String(app.apiKey)
                }
            } catch (e) {
                // 密钥补拉失败：保留「保存后自动生成」占位，用户可重新进入本页再取
            }
        },
        // ========== 对外接口 ==========
        // 重置密钥前先确认：旧 Key 立即失效，操作不可撤销
        askResetKey() {
            if (!this.editId) return
            this.resetConfirm.visible = true
        },
        async resetKey() {
            if (!this.editId) return
            this.resetting = true
            try {
                const res = await agentAppResetKey(this.editId)
                this.apiKey = (res && res.apiKey) ? String(res.apiKey) : ''
                this.resetConfirm.visible = false
                Message.success('已重置，旧密钥立即失效')
            } catch (e) {
                Message.error('重置密钥失败，请稍后重试')
            } finally {
                this.resetting = false
            }
        },
        // 剪贴板：优先 Clipboard API，回退 execCommand（iOS / 非安全上下文）
        copyText(text) {
            if (!text) return
            const done = () => Message.success('已复制')
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done).catch(() => this.fallbackCopy(text))
                return
            }
            this.fallbackCopy(text)
        },
        fallbackCopy(text) {
            try {
                const ta = document.createElement('textarea')
                ta.value = text
                ta.setAttribute('readonly', 'readonly')
                ta.style.position = 'fixed'
                ta.style.opacity = '0'
                document.body.appendChild(ta)
                ta.select()
                document.execCommand('copy')
                document.body.removeChild(ta)
                Message.success('已复制')
            } catch (err) {
                Message.error('复制失败，请手动选择复制')
            }
        },
        // 保存草稿 → Create/Update（draft 状态）
        async saveDraft() {
            if (!this.form.name) {
                this.errors = { name: '保存草稿至少需要填写应用名称' }
                Message.error('请先填写应用名称')
                return
            }
            this.saving = true
            try {
                await this.persist('draft')
                Message.success('草稿已保存')
                this.$emit('nav', 'list')
            } catch (e) {
                Message.error('保存草稿失败')
            } finally {
                this.saving = false
            }
        },
        // 发布 → 先 Create/Update 落库，再调发布接口
        async publish() {
            if (!this.validate()) {
                Message.error('请补全带 * 的必填项')
                return
            }
            if (this.form.appType === 'standard' && !this.form.modelId) {
                Message.error('标准模式请选择模型')
                return
            }
            if (this.form.appType === 'workflow' && !this.form.workflowId) {
                Message.error('工作流模式请选择关联工作流')
                return
            }
            this.saving = true
            try {
                const id = await this.persist()
                if (!id) {
                    Message.error('发布失败：未获取到智能体 id')
                    return
                }
                await agentAppPublish(id)
                Message.success(this.isEdit ? '已发布更新' : '已发布')
                this.$emit('nav', 'list')
            } catch (e) {
                Message.error('发布失败')
            } finally {
                this.saving = false
            }
        }
    }
}
</script>

<style lang="less" scoped>
@import (reference) './styles/agent-theme.less';

.ag-editor {
    .ag-root();
    // iView 控件统一走绛红宣纸主题（按钮 / 输入 / 文本域 / 选择器 / 开关 / 单选 / 复选 / 标签）。
    // 与 AgentList、WorkflowEditor、WorkflowGenerator 同一根作用域写法：
    // 深浅两主题共用同一套 :deep 覆盖，取色全部走 var(--ag-theme-*)，
    // 由祖先 .agent-module 的内联主题变量切换 —— 故此处不要调用 .ag-theme-tokens()，
    // 否则会在本节点重新写入浅色默认值并把深墨主题冻回浅色。
    .ag-iview-theme();

    // 两栏布局：页头通栏，左列表单、右列对话预览（窄屏降为单栏，见文件末尾媒体查询）
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 20px;
    align-items: start;
    max-width: 100%;
}

// ══ 主按钮（type="primary"）背景 / 边框兜底 ══════════════════════════════════
// 全局样式 .ivu-btn-primary{ background-color:#79b3f9 !important; border-color:#79b3f9 !important }
// 带 !important，本主题 mixin（.ag-iview-theme()）里的普通声明压不过它 —— 页头「发布」会显示成浅蓝。
// 全局样式不可改，故仅在本页作用域内用「同等 !important + 更高特异性」把颜色抢回来；
// 只命中 .ag-editor 子树，其他页面不受影响。solid 与 ghost 两个变体都覆盖（本页暂无 ghost 主按钮，
// 保留是为了与 AgentList / WorkflowList 三处口径一致，后续加按钮不会漏）。
// 颜色取主题令牌（@ag-accent 一族指向 var(--ag-theme-*)），与 mixin 完全一致，深浅主题都不写死。
// 注意：hover / active 也要加 !important，否则常态被抢回后、悬停态又落回全局蓝。
:deep(.ivu-btn-primary:not(.ivu-btn-ghost)) {
    background-color: @ag-accent !important;
    border-color: @ag-accent-deep !important;
}

:deep(.ivu-btn-primary:not(.ivu-btn-ghost):hover:not([disabled])) {
    background-color: @ag-accent-hover !important;
    border-color: @ag-accent-hover !important;
}

:deep(.ivu-btn-primary:not(.ivu-btn-ghost):active:not([disabled])) {
    background-color: @ag-accent-deep !important;
    border-color: @ag-accent-deep !important;
}

:deep(.ivu-btn-ghost.ivu-btn-primary) {
    background-color: transparent !important;
    border-color: fade(@ag-accent-solid, 55%) !important;
}

:deep(.ivu-btn-ghost.ivu-btn-primary:hover:not([disabled])) {
    background-color: @ag-accent-weak !important;
    border-color: @ag-accent !important;
}

:deep(.ivu-btn-ghost.ivu-btn-primary:active:not([disabled])) {
    background-color: @ag-accent-weak !important;
    border-color: @ag-accent-deep !important;
}

// —— 页头（通栏） ——
.ag-editor__head {
    grid-column: 1 / -1;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.ag-back {
    .ag-link();
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
}

.ag-editor__title {
    margin: 0 0 4px;
    .font-serif();
    font-size: 26px;
    font-weight: 600;
    color: @ag-ink;
    letter-spacing: 0.03em;
}

.ag-editor__head-actions {
    display: flex;
    gap: 10px;
    padding-bottom: 2px;
}

// —— 表单列（栅格第 1 列） ——
.ag-editor__form {
    grid-column: 1;
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-width: 0;
}

// —— 表单区 ——
.ag-form-sec {
    .ag-panel();
    padding: 20px 22px 24px;
}

.ag-form-sec__title {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 0 0 18px;
    .font-serif();
    font-size: 16px;
    font-weight: 600;
    color: @ag-ink;
}

.ag-form-row {
    margin-bottom: 16px;

    &:last-child {
        margin-bottom: 0;
    }
}

.ag-form-label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    color: @ag-ink-2;
}

.ag-req {
    margin-left: 2px;
    color: @ag-danger;
}

.ag-form-error {
    margin: 5px 0 0;
    font-size: 12px;
    color: @ag-danger;
}

.ag-form-hint {
    margin: 6px 0 0;
    font-size: 12px;
    color: @ag-ink-3;
    line-height: 1.6;

    &--warn {
        color: @ag-danger;
    }
}

.ag-form-value {
    margin-left: 6px;
    font-size: 12px;
    color: @ag-accent;
    font-family: @ag-serif;
}

// ══ 对外接口：密钥 / 端点 / 公开链接 ═══════════════════════════════════════════
// 端点与密钥都是长串等宽内容：整块走「内嵌纸面 + 发丝边」样式，窄屏逐项换行，
// 触点统一由 ::after 撑到 44px（视觉体量不变），与门户其余文字钮同一套令牌。
.ag-open-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
}

.ag-open-key {
    flex: 1 1 260px;
    min-width: 0;
    max-width: 420px;
}

.ag-open-btn {
    .ag-link();
    position: relative;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 32px;
    padding: 0 12px;
    border: 1px solid @ag-line-strong;
    border-radius: @ag-radius;
    background: @ag-surface;
    color: @ag-ink-2;
    text-decoration: none;
    white-space: nowrap;

    &:hover:not([disabled]) {
        border-color: @ag-accent;
        background: @ag-accent-weak;
        color: @ag-accent;
    }

    &[disabled] {
        border-color: @ag-line;
        color: @ag-ink-3;
        cursor: not-allowed;
    }

    // 触点扩到 44px 的透明层（视觉体量不变）
    &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 44px;
    }
}

.ag-open-block {
    padding: 12px 14px;
    border: 1px solid @ag-line;
    border-radius: @ag-radius;
    background: @ag-surface-2;
}

.ag-open-line {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;

    &+& {
        margin-top: 10px;
    }
}

// 端点前缀标：阻塞 = 绛红描边，流式 = 金色描边
.ag-open-tag {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 8px;
    border: 1px solid @ag-accent;
    border-radius: 3px;
    background: @ag-surface;
    color: @ag-accent;
    font-family: @ag-serif;
    font-size: 12px;
    line-height: 1;

    &--stream {
        border-color: @gold;
        color: @ag-warn;
    }
}

.ag-open-code {
    flex: 1 1 auto;
    min-width: 0;
    padding: 3px 7px;
    border: 1px solid @ag-line;
    border-radius: 3px;
    background: @ag-surface;
    font-family: Consolas, "SFMono-Regular", Menlo, monospace;
    font-size: 12px;
    line-height: 1.7;
    color: @ag-ink;
    word-break: break-all;

    // 公开对话页链接：顶格独占一行
    &--link {
        display: block;
        flex: 1 1 100%;
    }
}

.ag-open-inline {
    padding: 1px 6px;
    border: 1px solid @ag-line;
    border-radius: 3px;
    background: @ag-surface;
    font-family: Consolas, "SFMono-Regular", Menlo, monospace;
    font-size: 11.5px;
    line-height: 1.6;
    color: @ag-ink-2;
    word-break: break-all;
}

.ag-open-notes {
    margin: 10px 0 0;
    padding: 10px 0 0 4px;
    list-style: none;
    border-top: 1px dashed @ag-line-strong;

    li {
        position: relative;
        margin-bottom: 6px;
        padding-left: 14px;
        font-size: 12px;
        line-height: 1.7;
        color: @ag-ink-3;

        &:last-child {
            margin-bottom: 0;
        }

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 9px;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: @ag-accent;
        }
    }
}

// —— 头像上传 + 58×58 圆形预览 ——
.ag-avatar-row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    flex-wrap: wrap;
    overflow: visible;
}

.ag-avatar-current {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 70px;
    width: 70px;
    height: 70px;
    padding: 6px;
    box-sizing: border-box;
    overflow: visible;
}

.ag-avatar-preview {
    position: relative;
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 1px solid @ag-line-strong;
    background-color: @ag-surface-2;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center;
    overflow: visible;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.ag-avatar-preview--large {
    width: 58px;
    height: 58px;
}

.ag-avatar-upload {
    min-width: 0;

    // 上传控件内部浮动布局：清一下避免撑破行高
    ::v-deep(.demo-upload-list),
    ::v-deep(.upload-icon) {
        margin-top: 0;
        margin-right: 0;
        border-radius: 50%;
        font-size: 28px;
    }

    // 覆盖全局上传控件的默认蓝色虚线框，沿用绛红宣纸主题
    ::v-deep(.upload-icon) {
        border-color: @ag-line-strong;
        background: @ag-surface;
        color: @ag-accent;
        transition: border-color @ag-motion-fast @ag-ease, background-color @ag-motion-fast @ag-ease, color @ag-motion-fast @ag-ease;
    }

    ::v-deep(.upload-icon:hover) {
        border-color: @ag-accent;
        background: @ag-accent-weak;
    }
}

.ag-avatar-remove {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    margin: 0;
    padding: 0;
    border: 1px solid @ag-line-strong;
    border-radius: 50%;
    background: @ag-surface;
    color: @ag-ink-2;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transform: translateY(2px) scale(0.96);
    transition: opacity @ag-motion-fast @ag-ease, transform @ag-motion-fast @ag-ease, background-color @ag-motion-fast @ag-ease, border-color @ag-motion-fast @ag-ease, color @ag-motion-fast @ag-ease;

    &:hover {
        border-color: @ag-danger;
        background: @ag-danger-weak;
        color: @ag-danger;
    }

    &:focus-visible {
        outline: 2px solid @ag-focus-ring;
        outline-offset: 2px;
    }
}

.ag-avatar-current:hover .ag-avatar-remove,
.ag-avatar-current:focus-within .ag-avatar-remove {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0) scale(1);
}

// —— 开关行（逐字回复 / 思考过程输出） ——
.ag-cap-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 0;
    border-top: 1px solid @ag-line;

    &:first-of-type {
        border-top: none;
    }
}

.ag-cap-row__name {
    font-size: 13px;
    font-weight: 600;
    color: @ag-ink;
}

.ag-cap-row__desc {
    margin-top: 2px;
    font-size: 12px;
    color: @ag-ink-3;
}

// —— 右侧预览（栅格第 2 列，随页头下方滚动吸顶） ——
.ag-editor__preview {
    grid-column: 2;
    grid-row: 2;
    position: sticky;
    top: 16px;
}

.ag-preview-card {
    .ag-panel();
    padding: 18px 20px;
}

.ag-preview-card__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 14px;
}

.ag-preview-card__title {
    margin: 0;
    .font-serif();
    font-size: 16px;
    font-weight: 600;
    color: @ag-ink;
}

.ag-preview-card__badge {
    font-size: 11px;
    letter-spacing: 0.08em;
    color: @ag-warn;
    background: @ag-warn-weak;
    padding: 2px 8px;
    border-radius: 3px;
}

.ag-preview-card__chat {
    background: @ag-paper;
    border: 1px solid @ag-line;
    border-radius: @ag-radius;
    padding: 14px;
}

.ag-msg {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;

    &:last-child {
        margin-bottom: 0;
    }

    &.ag-msg--user {
        flex-direction: row-reverse;
    }
}

.ag-msg__bubble {
    max-width: 82%;
    padding: 8px 12px;
    border: 1px solid @ag-line;
    border-radius: @ag-radius;
    background: @ag-surface;
    font-size: 13px;
    line-height: 1.65;
    color: @ag-ink;
}

.ag-msg--user .ag-msg__bubble {
    background: @ag-accent-weak;
    border-color: transparent;
    color: @ag-ink;
}

.ag-preview-card__note {
    margin: 12px 0 0;
    font-size: 12px;
    color: @ag-ink-3;
    line-height: 1.6;
}

// —— 预览头像字形 ——
.ag-glyph {
    .ag-glyph();

    // 头像圆底：与表单 58 圆形预览一致的裁切
    &--avatar {
        border-radius: 50%;
        background-size: 100% 100%;
        background-repeat: no-repeat;
        background-position: center;
        overflow: hidden;
    }
}

.ag-glyph__ph {
    font-family: @ag-serif;
    font-size: 16px;
    color: #F7EBDF;
    line-height: 1;
}

.ag-glyph--green {
    background: @ag-accent;
}

// —— 窄屏：两栏降为单栏 ——
@media (max-width: 1020px) {
    .ag-editor {
        grid-template-columns: 1fr;
    }

    .ag-editor__preview {
        grid-column: 1;
        grid-row: auto;
        position: static;
    }
}

// —— 窄屏：对外接口块逐项换行，端点标签与代码各占一行 ——
@media (max-width: 640px) {
    .ag-open-key {
        flex: 1 1 100%;
        max-width: none;
    }

    .ag-open-line {
        flex-wrap: wrap;
    }

    .ag-open-block {
        padding: 10px 12px;
    }
}
</style>
