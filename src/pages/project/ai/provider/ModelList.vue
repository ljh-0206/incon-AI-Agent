<template>
  <div class="ai-llm-model-list">
    <Spin v-if="loading" fix>加载中...</Spin>

    <div class="sub-title-row">
      <h3 class="sub-title">模型管理</h3>
      <div class="sub-title-actions">
        <Button type="primary" icon="md-add" @click="openAddModal">添加模型</Button>
      </div>
    </div>

    <Table :columns="columns" :data="localData" border>
      <template #model_type="{ row }">
        <Tag :color="modelTypeColor(row.model_type)">{{ modelTypeText(row.model_type) }}</Tag>
      </template>
      <template #support_stream="{ row }">
        <Tag :color="row.support_stream === '1' ? 'success' : 'default'">
          {{ row.support_stream === '1' ? '支持' : '不支持' }}
        </Tag>
      </template>
      <template #is_default="{ row }">
        <Tag v-if="row.is_default === '1'" color="success">默认</Tag>
        <span v-else>-</span>
      </template>
      <template #status="{ row }">
        <Tag :color="row.status === 'enabled' ? 'success' : 'default'">
          {{ row.status === 'enabled' ? '启用' : '禁用' }}
        </Tag>
      </template>
      <template #action="{ row, index }">
        <Button type="text" style="color:#2d8cf0" @click="handleSetDefault(row)">设默认</Button>
        <Button type="text" style="color:#2d8cf0" @click="openEditModal(row, index)">编辑</Button>
        <Button type="text" style="color:#ed4014" @click="handleDelete(index)">删除</Button>
      </template>
    </Table>

    <jform
      ref="jform"
      :model-value="modalVisible"
      :configdata="jformConfig"
      :propstocomponent="jformProps"
      @update:visible="modalVisible = $event"
      @closemodal="onFormClosed"
    ></jform>
  </div>
</template>

<script>
    export default {
        name: 'AiLlmModelList',

        props: {
            // 所属供应商（第二级对象）
            providerId: {
                type: String,
                default: ''
            }
        },

        data () {
            // ========== SQL ID（真实值，见 DATA_MAPPING.md） ==========
            const listQueryId = '59FF70BC80BB8429E0631E01A8C079B5'; // 模型列表
            const queryFormId = '59FF70BC80BC8429E0631E01A8C079B5'; // 模型单条
            const insertId = '59FF70BC80BD8429E0631E01A8C079B5'; // 新增
            const updateFormId = '59FF70BC80BE8429E0631E01A8C079B5'; // 修改
            const deleteId = '59FF70BC80BF8429E0631E01A8C079B5'; // 删除
            const providerListId = '59FF70BC80B68429E0631E01A8C079B5'; // 供应商列表（下拉加载用）
            return {
                loading: false,
                modalVisible: false,
                editIndex: -1,
                localData: [],
                columns: [
                    { title: '模型名称', key: 'model_label', minWidth: 160 },
                    { title: '模型标识', key: 'model_name', width: 140 },
                    { title: '类型', slot: 'model_type', width: 130 },
                    { title: '上下文窗口', key: 'context_window', width: 100 },
                    { title: '流式', slot: 'support_stream', width: 80 },
                    { title: '输入价格', key: 'price_per1k_input', width: 100 },
                    { title: '输出价格', key: 'price_per1k_output', width: 100 },
                    { title: '默认', slot: 'is_default', width: 80 },
                    { title: '状态', slot: 'status', width: 90 },
                    { title: '操作', slot: 'action', width: 200 }
                ],
                listQueryId,
                deleteId,
                updateFormId,
                providerListId,

                jformConfig: {
                    blm: 'ai_llm_model_form',
                    modalType: 'Modal',
                    modalWidth: '680',
                    opentype: '',
                    formId: '',
                    buttonsPosition: 'footer',
                    buttonConfig: [
                        { blm: 'save', content: '确定', attrs: { type: 'primary' } },
                        { blm: 'cancel', content: '取消', attrs: { type: 'warning' } }
                    ],
                    formAttrs: { 'label-width': 130, 'label-position': 'right' },
                    modalTitle: { addTitle: '添加模型', editTitle: '编辑模型' },
                    funcId: { queryFormId, insertId, updateFormId },
                    beforeAdd: "obj.provider_id=_this.propstocomponent.provider_id||'';return obj",
                    beforeEdit: "obj.provider_id=_this.propstocomponent.provider_id||'';return obj",
                    rules: {
                        model_name: [{ required: true, message: '模型标识 必填', trigger: 'change' }],
                        model_label: [{ required: true, message: '模型名称 必填', trigger: 'change' }],
                        model_type: [{ required: true, message: '模型类型 必填', trigger: 'change' }],
                        status: [{ required: true, message: '状态 必填', trigger: 'change' }]
                    },
                    // 每个字段一个 docker：左侧 label（字段名），中间输入框，右侧 span 帮助文本
                    // 注意：provider_id 的 list 由 loadProviders() 动态填充（按 blm 索引）
                    fields: [
                        {
                            blm: 'docker_provider_id', mc: '所属供应商', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'provider_id', componentType: 'jselect', attrs: { transfer: true, disabled: true }, list: [], style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_provider_id', componentType: 'span', content: '由供应商行「模型」入口带入，只读', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_model_name', mc: '模型标识', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'model_name', componentType: 'i-input', attrs: { placeholder: '如 deepseek-chat，须与官方一致' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_model_name', componentType: 'span', content: '须与供应商官方模型名一致', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_model_label', mc: '模型名称', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'model_label', componentType: 'i-input', attrs: { placeholder: '中文名' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_model_label', componentType: 'span', content: '界面展示用中文名', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_model_type', mc: '模型类型', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'model_type', componentType: 'jselect', attrs: { transfer: true }, list: [
                                    { value: 'llm', label: '对话 LLM' },
                                    { value: 'embedding', label: '向量化 Embedding' },
                                    { value: 'rerank', label: '重排序 Rerank' }
                                ], style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_model_type', componentType: 'span', content: '对话/向量化/重排序', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_context_window', mc: '上下文保留轮次', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'context_window', componentType: 'i-input', attrs: { placeholder: 'LLM 填，数字' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_context_window', componentType: 'span', content: 'LLM 填，如 10', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_max_input_tokens', mc: '最大输入 Token', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'max_input_tokens', componentType: 'i-input', attrs: { placeholder: 'LLM 填' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_max_input_tokens', componentType: 'span', content: 'LLM 填，单次最大输入', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_max_output_tokens', mc: '最大输出 Token', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'max_output_tokens', componentType: 'i-input', attrs: { placeholder: 'LLM 填' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_max_output_tokens', componentType: 'span', content: 'LLM 填，单次最大输出', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_support_stream', mc: '流式输出', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'support_stream', componentType: 'jselect', attrs: { transfer: true }, list: [
                                    { value: '1', label: '支持' }, { value: '0', label: '不支持' }
                                ], style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_support_stream', componentType: 'span', content: '是否支持 SSE 流式', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_support_functions', mc: '函数调用', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'support_functions', componentType: 'jselect', attrs: { transfer: true }, list: [
                                    { value: '1', label: '支持' }, { value: '0', label: '不支持' }
                                ], style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_support_functions', componentType: 'span', content: '是否支持 function calling', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_batch_size', mc: '批次大小', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'batch_size', componentType: 'i-input', attrs: { placeholder: 'Embedding 填' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_batch_size', componentType: 'span', content: 'Embedding 填，单批向量数', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_temperature', mc: '温度', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'temperature', componentType: 'i-input', attrs: { placeholder: '默认 0.7' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_temperature', componentType: 'span', content: '0~2，越高越发散', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_max_tokens', mc: 'Max Tokens', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'max_tokens', componentType: 'i-input', attrs: { placeholder: '默认 2000' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_max_tokens', componentType: 'span', content: '单次最大输出 Token', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_top_p', mc: 'Top P', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'top_p', componentType: 'i-input', attrs: { placeholder: '默认 0.9' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_top_p', componentType: 'span', content: '0~1，核采样阈值', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_price_per1k_input', mc: '输入价格', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'price_per1k_input', componentType: 'i-input', attrs: { placeholder: '元/1K Token' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_price_per1k_input', componentType: 'span', content: '元/1K 输入 Token，成本计量依据', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_price_per1k_output', mc: '输出价格', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'price_per1k_output', componentType: 'i-input', attrs: { placeholder: '元/1K Token' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_price_per1k_output', componentType: 'span', content: '元/1K 输出 Token，成本计量依据', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_is_default', mc: '是否默认', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'is_default', componentType: 'jselect', attrs: { transfer: true }, list: [
                                    { value: '1', label: '是' }, { value: '0', label: '否' }
                                ], style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_is_default', componentType: 'span', content: '该供应商下缺省模型', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_sort_order', mc: '排序', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'sort_order', componentType: 'i-input', attrs: { placeholder: '数字，越小越靠前' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_sort_order', componentType: 'span', content: '数字越小越靠前', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_status', mc: '状态', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'status', componentType: 'jselect', attrs: { transfer: true }, list: [
                                    { value: 'enabled', label: '启用' }, { value: 'disabled', label: '禁用' }
                                ], style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_status', componentType: 'span', content: '启用/禁用', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        },
                        {
                            blm: 'docker_description', mc: '描述', componentType: 'docker', labelWidth: 130, colspan: 24,
                            children: [
                                { blm: 'description', componentType: 'i-input', attrs: { type: 'textarea', rows: 3, placeholder: '请输入描述' }, style: { flex: '1', maxWidth: '420px', marginRight: '12px' } },
                                { blm: 'help_description', componentType: 'span', content: '备注，选填', style: { color: '#808695', fontSize: '12px', lineHeight: '32px' } }
                            ]
                        }
                    ]
                },
                jformProps: {}
            };
        },

        computed: {
            // 优先取 prop，回退到路由 query（独立菜单页串联）
            currentProviderId () {
                return this.providerId || this.$route.query.providerId || '';
            }
        },

        watch: {
            currentProviderId: {
                handler (newVal) {
                    if (newVal) {
                        this.loadData();
                    }
                },
                immediate: true
            }
        },

        methods: {
            async loadData () {
                if (!this.currentProviderId) return;
                this.loading = true;
                try {
                    const res = await this.commonsJs.incoRequest(
                        'querylist',
                        this.listQueryId,
                        { provider_id: this.currentProviderId }
                    );
                    this.localData = Array.isArray(res) ? res : [];
                } catch (e) {
                    this.$Message.error('加载模型失败');
                } finally {
                    this.loading = false;
                }
            },

            onFormClosed () {
                this.loadData();
            },

            // 加载供应商下拉，填充 provider_id 的 jselect list（disabled 仅展示名称）
            async loadProviders () {
                try {
                    const res = await this.commonsJs.incoRequest(
                        'querylist',
                        this.providerListId,
                        {}
                    );
                    const list = (Array.isArray(res) ? res : []).map(p => ({ value: p.id, label: p.provider_label || p.provider_name }));
                    // provider_id 字段嵌套在 docker_provider_id 的 children 中（docker 三段式布局）
                    const docker = this.jformConfig.fields.find(f => f.blm === 'docker_provider_id');
                    const field = docker ? docker.children.find(c => c.blm === 'provider_id') : null;
                    if (field) field.list = list;
                } catch (e) {
                    // 供应商下拉加载失败不阻塞表单
                }
            },

            async openAddModal () {
                this.editIndex = -1;
                await this.loadProviders();
                this.jformProps = {
                    provider_id: this.currentProviderId,
                    support_stream: '0',
                    support_functions: '0',
                    is_default: '0',
                    status: 'enabled',
                    sort_order: 99
                };
                this.jformConfig.opentype = 'add';
                this.jformConfig.formId = '';
                this.modalVisible = true;
            },

            async openEditModal (row, index) {
                this.editIndex = index;
                await this.loadProviders();
                this.jformProps = { provider_id: this.currentProviderId };
                this.jformConfig.opentype = 'edit';
                this.jformConfig.formId = row.id;
                this.modalVisible = true;
            },

            // 设为默认：当前置 1，其余置 0（类型内缺省路由对象）
            async handleSetDefault (row) {
                if (row.is_default === '1') return;
                try {
                    await this.commonsJs.incoRequest('update', this.updateFormId, { ...row, is_default: '1' });
                    for (const m of this.localData) {
                        if (m.id !== row.id && m.is_default === '1') {
                            await this.commonsJs.incoRequest('update', this.updateFormId, { ...m, is_default: '0' });
                        }
                    }
                    this.$Message.success('已设为默认');
                    this.loadData();
                } catch (e) {
                    this.$Message.error('设置默认失败');
                }
            },

            handleDelete (index) {
                const row = this.localData[index];
                this.$Modal.confirm({
                    title: '确认删除',
                    content: '确定要删除该模型吗？',
                    onOk: async () => {
                        try {
                            await this.commonsJs.incoRequest('delete', this.deleteId, { id: row.id });
                            this.$Message.success('删除成功');
                            this.loadData();
                        } catch (e) {
                            this.$Message.error('删除失败');
                        }
                    }
                });
            },

            modelTypeColor (v) {
                return { llm: 'primary', embedding: 'success', rerank: 'warning', tts: 'blue', speech2text: 'cyan' }[v] || 'default';
            },
            modelTypeText (v) {
                return { llm: '对话 LLM', embedding: 'Embedding', rerank: 'Rerank', tts: 'TTS', speech2text: '语音转文字' }[v] || v;
            }
        }
    };
</script>

<style scoped>
.ai-llm-model-list { width: 100%; position: relative; }
.sub-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.sub-title { font-size: 15px; font-weight: 600; color: #17233d; margin: 0; padding-left: 12px; border-left: 4px solid #2d8cf0; }
.sub-title-actions { display: flex; gap: 8px; }
</style>
