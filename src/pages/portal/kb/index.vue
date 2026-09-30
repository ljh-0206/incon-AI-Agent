<template>
    <!-- 门户知识库页 /portal/kb：220px 宣纸浅色静态 banner + 检索 / 操作 / 列表三段 + 分页 + 新建编辑弹窗 + 全幅页脚 -->
    <!-- 业务逻辑与后台 src/pages/project/ai/kb/KbList.vue 同源（buildQuery / loadData / save / delete / batchDelete），壳与视觉为门户 v3 规格 -->
    <!-- 顶栏 + v3 主题层由 /portal 一级壳（PortalShell）渲染：独立路由时本页只出内容；
         内嵌（宿主 /portal/mine 工作台面板）时同样只出内容，embedded 只再管页内 chrome -->
        <main class="kb-page" :class="{ 'is-view': isView, 'is-embedded': embedded }">
            <!-- ══ (a) BANNER：220px 浅色渐变静态横幅（单幅，无轮播 / 无分页），底缘 3px 绛红装订线；内嵌模式与文档内嵌视图下隐藏 ══ -->
            <section v-if="!embedded && !docView.open" class="kb-banner" aria-label="知识库模块介绍">
                <!-- 文案块：版心左对齐、在 220px 内垂直居中 -->
                <div class="kb-banner-copy">
                    <p class="kb-kicker effect" data-delay="0">
                        <span aria-hidden="true">◈</span>知识库 · KNOWLEDGE BASE
                    </p>
                    <h1 class="kb-title effect" data-delay="1">知识库管理</h1>
                    <p class="kb-sub effect" data-delay="2">检索知识库，管理文档切片，维护问答库</p>
                </div>
            </section>

            <div class="kb-body" :class="{ 'is-doc-open': docView.open }">
                <!-- ══ (b-1) 检索：单行紧凑工具条（无段头标题、无面板底、无容器观感） ══ -->
                <section v-if="!docView.open" class="kb-search effect" data-delay="1" aria-label="知识库检索">
                    <div class="kb-search-row">
                        <!-- 可见标签已收进屏幕阅读器专用 label（单行排布需要），控件另带 placeholder -->
                        <div class="kb-field kb-field--name">
                            <label class="kb-sr-only" for="kb-kbmc-input">知识库名称</label>
                            <Input
                                v-model.trim="searchForm.kbmc"
                                :element-id="'kb-kbmc-input'"
                                clearable
                                placeholder="知识库名称，如：招生政策库"
                                @on-enter="handleSearch"
                            />
                        </div>

                        <div class="kb-field kb-field--status">
                            <Select
                                v-model="searchForm.status"
                                aria-label="状态"
                                clearable
                                placeholder="全部状态"
                                @on-change="handleSearch"
                            >
                                <Option value="enabled">启用</Option>
                                <Option value="disabled">停用</Option>
                            </Select>
                        </div>

                        <div class="kb-search-acts">
                            <button type="button" class="kb-btn kb-btn--primary" @click="handleSearch">
                                <Icon type="md-search" aria-hidden="true" />查询
                            </button>
                            <button type="button" class="kb-btn" @click="handleReset">
                                <Icon type="ios-refresh" aria-hidden="true" />重置
                            </button>
                        </div>
                    </div>
                </section>

                <!-- ══ (b-2) 新建 / 删除：发丝虚线丝带（不是又一张白卡，避免全页同款圆角卡） ══ -->
                <section v-if="!docView.open" class="kb-acts effect" data-delay="2" aria-label="知识库操作">
                    <div class="kb-acts-main">
                        <button type="button" class="kb-btn kb-btn--primary" @click="openAddModal">
                            <Icon type="md-add" aria-hidden="true" />添加知识库
                        </button>
                        <!-- 批量删除只在有选中项时出现，按钮自带条数；进出场走 transition，不挤动左侧按钮 -->
                        <transition name="kb-batch">
                            <button
                                v-if="selectedIds.length"
                                type="button"
                                class="kb-btn kb-btn--danger"
                                @click="handleBatchDelete"
                            >
                                <Icon type="md-trash" aria-hidden="true" />批量删除({{ selectedIds.length }})
                            </button>
                        </transition>
                    </div>
                </section>

                <!-- ══ (b-3) 知识库列表 ══ -->
                <section v-if="!docView.open" class="kb-list" aria-labelledby="kb-list-title">
                    <div class="kb-list-head effect" data-delay="3">
                        <h2 id="kb-list-title" class="kb-h2">
                            知识库列表<span class="kb-sep" aria-hidden="true">◈</span>
                        </h2>
                    </div>

                    <!-- 加载 / 空态 / 错误态 / 卡片栅格共用本容器，几何不塌 -->
                    <div class="kb-grid-wrap" :aria-busy="loading ? 'true' : 'false'">
                        <!-- 骨架：结构镜像真卡（标题 / 描述两行 / 标签行 / 动作行），换页不跳变 -->
                        <div v-if="loading" class="kb-grid" aria-hidden="true">
                            <div v-for="n in 6" :key="'kb-sk-' + n" class="kb-slot">
                                <div class="kb-card kb-sk">
                                    <div class="kb-sk-line kb-sk-title"></div>
                                    <div class="kb-sk-line kb-sk-desc"></div>
                                    <div class="kb-sk-line kb-sk-desc kb-sk-short"></div>
                                    <div class="kb-sk-tags">
                                        <span class="kb-sk-chip"></span>
                                        <span class="kb-sk-time"></span>
                                    </div>
                                    <div class="kb-sk-acts">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 错误态：拦截器已弹错，这里只给可恢复的出口 -->
                        <div v-else-if="loadError" class="kb-state" role="alert">
                            <span class="kb-seal" aria-hidden="true">◈</span>
                            <p class="kb-state-title">列表加载失败</p>
                            <p class="kb-state-text">网络或服务异常，可稍后重试</p>
                            <div class="kb-state-acts">
                                <button type="button" class="kb-btn kb-btn--primary" @click="loadData">重新加载</button>
                            </div>
                        </div>

                        <!-- 空态：区分「筛选无结果」与「真的还没有」 -->
                        <div v-else-if="list.length === 0" class="kb-state" role="status">
                            <span class="kb-seal" aria-hidden="true">◈</span>
                            <p class="kb-state-title">{{ hasFilter ? '没有匹配的知识库' : '还没有知识库' }}</p>
                            <p class="kb-state-text">
                                {{ hasFilter ? '换个名称或状态再试一次，也可以直接重置筛选。' : '添加第一个知识库，把讲义、制度文件归拢到一处。' }}
                            </p>
                            <div class="kb-state-acts">
                                <button
                                    v-if="hasFilter"
                                    type="button"
                                    class="kb-btn"
                                    @click="handleReset"
                                >重置筛选</button>
                                <button
                                    v-else
                                    type="button"
                                    class="kb-btn kb-btn--primary"
                                    @click="openAddModal"
                                >新建知识库</button>
                            </div>
                        </div>

                        <!-- 卡片栅格：行内 transitionDelay 做 stagger，is-view 闸门每次加载重放 -->
                        <div v-else class="kb-grid" :class="{ 'is-view': gridView }">
                            <article
                                v-for="(row, i) in list"
                                :key="row.id"
                                class="kb-slot effect"
                                :style="{ transitionDelay: (i % 10) * 0.05 + 's' }"
                            >
                                <div class="kb-card" :class="{ 'is-on': isPicked(row) }">
                                    <!-- 卡片本体不是入口：唯一导航是下面的「文档管理」按钮，标题 / 描述按纯文本排版 -->
                                    <h3 class="kb-card-title">{{ row.kbmc || '未命名知识库' }}</h3>
                                    <p class="kb-card-desc">{{ row.kbms || '暂无描述' }}</p>

                                    <!-- 状态按门户标签纪律：红框 = 启用（标准），灰虚框 = 停用（次级），文字与框型双重编码 -->
                                    <div class="kb-card-meta">
                                        <span
                                            class="kb-tag"
                                            :class="row.status === 'enabled' ? 'is-on' : 'is-off'"
                                        >{{ row.status === 'enabled' ? '启用' : '停用' }}</span>
                                        <span class="kb-card-time">创建时间 {{ row.cjsj || '-' }}</span>
                                    </div>

                                    <!-- 动作条压卡底：三个独立触点（「文档管理」是本卡唯一导航出口） -->
                                    <div class="kb-card-act">
                                        <button type="button" class="kb-act kb-act--docs" @click="goDoc(row)">
                                            <Icon type="md-folder-open" aria-hidden="true" />文档管理
                                        </button>
                                        <button type="button" class="kb-act" @click="openEditModal(row)">编辑</button>
                                        <button type="button" class="kb-act kb-act--del" @click="handleDelete(row)">删除</button>
                                    </div>

                                    <!-- 多选：悬停 / 键盘聚焦浮现，选中常驻；44×44 触点，原生 checkbox 保证键盘可达 -->
                                    <label class="kb-pick" :class="{ 'is-on': isPicked(row) }">
                                        <input
                                            type="checkbox"
                                            :checked="isPicked(row)"
                                            :aria-label="'选择知识库《' + (row.kbmc || '未命名知识库') + '》'"
                                            @change="togglePick(row)"
                                        />
                                        <span class="kb-pick-box" aria-hidden="true"></span>
                                    </label>
                                </div>
                            </article>
                        </div>
                    </div>

                    <!-- ══ (d) 分页：保留 View UI Page（:current 为规格口径；view-ui-plus 1.3.x 实际读 modelValue，故并用 :model-value 才能让「搜索 / 重置」把页码拉回第 1 页） ══ -->
                    <div class="kb-pager">
                        <Page
                            :total="total"
                            :current="pageNum"
                            :model-value="pageNum"
                            :page-size="pageSize"
                            show-total
                            show-sizer
                            :page-size-opts="[10, 20, 50, 100]"
                            @on-change="onPageChange"
                            @on-page-size-change="onPageSizeChange"
                        />
                    </div>
                </section>

                <!-- ══ (b-4) 文档管理内嵌视图：点「文档管理」后在本页内联展示，返回由子组件的 back 事件驱动，不跳路由 ══ -->
                <KbDocsPanel
                    v-if="docView.open"
                    embedded
                    :kbid="docView.kbid"
                    :kbmc="docView.kbmc"
                    @back="closeDoc"
                />
            </div>

            <!-- ══ (g) 页脚：共享组件 PortalFooter（全幅绛红收口带 + 居中版权行；页脚链接 / 版本链接已按门户方案取消，首页与本页同为「只保留版权行」）═══ -->
            <PortalFooter v-if="!embedded" class="panel-footer-bar" />

            <!-- ══ (e) 新建 / 编辑：View UI Modal + Form，class-name 换皮到门户 token ══ -->
            <Modal
                v-model="modalVisible"
                :title="modalTitle"
                :width="560"
                :mask-closable="false"
                footer-hide
                transfer
                class-name="portal-kb-modal"
            >
                <Form
                    ref="kbForm"
                    :key="formKey"
                    :model="formData"
                    :rules="formRules"
                    :label-width="112"
                >
                    <!-- element-id 与检索区区分（Modal 常驻 DOM，避免 id 撞车） -->
                    <FormItem label="知识库名称" label-for="kb-form-kbmc" prop="kbmc">
                        <Input
                            v-model="formData.kbmc"
                            :element-id="'kb-form-kbmc'"
                            placeholder="如：招生政策库"
                        />
                    </FormItem>
                    <FormItem label="描述" label-for="kb-form-kbms" prop="kbms">
                        <Input
                            v-model="formData.kbms"
                            type="textarea"
                            :rows="3"
                            :element-id="'kb-form-kbms'"
                            placeholder="知识库用途说明，如：面向本科生的招生政策问答"
                        />
                    </FormItem>
                    <FormItem label="状态" prop="status">
                        <Select
                            v-model="formData.status"
                            aria-label="状态"
                            transfer
                            transfer-class-name="portal-kb-modal-drop"
                        >
                            <Option value="enabled">启用</Option>
                            <Option value="disabled">停用</Option>
                        </Select>
                    </FormItem>
                </Form>

                <div class="portal-kb-modal__foot">
                    <Button @click="modalVisible = false">取消</Button>
                    <Button type="primary" :loading="saving" @click="handleSave">确定</Button>
                </div>
            </Modal>

            <!-- ══ (f) 删除确认：门户既有确认弹窗，不用 $Modal.confirm（那会弹后台样式） ══ -->
            <PortalConfirmModal
                v-model="confirmation.visible"
                :title="confirmation.title"
                :content="confirmation.content"
                :confirm-text="confirmation.confirmText"
                :confirm-type="confirmation.confirmType"
                :loading="confirmation.loading"
                @confirm="executeConfirmedAction"
            />
        </main>
</template>

<script>
    import PortalConfirmModal from '../components/PortalConfirmModal.vue'
    import PortalFooter from '../components/PortalFooter.vue'
    import KbDocsPanel from './docs/index.vue'
    import {
        kbListPage,
        kbSave,
        kbDelete,
        kbBatchDelete
    } from '@/api/kb'

    export default {
        name: 'PortalKb',

        // 内嵌模式：/portal/mine 工作台面板以 KbPage 引入时为 true，
        // 此时隐藏页面级 chrome（banner / 页脚）并去掉顶栏让位与版心居中；独立路由 /portal/kb 走默认 false，行为不变
        props: {
            embedded: { type: Boolean, default: false }
        },

        components: {
            PortalConfirmModal,
            PortalFooter,
            KbDocsPanel
        },

        data () {
            return {
                // 入场族开关：挂载后下一帧一次性开启（agents / mine 同口径）
                isView: false,

                // 卡片入场闸门：每次加载先关、数据落位后再开，stagger 原地重放
                gridView: false,

                // ===== 列表（口径同 KbList）=====
                loading: false,
                loadError: false,
                list: [],
                total: 0,
                pageNum: 1,
                pageSize: 10,
                searchForm: { kbmc: '', status: '' },
                selectedIds: [],

                // 文档管理内嵌视图：open=true 时页体切换为文档管理组件（不再跳转 /portal/kb/docs 路由）
                docView: { open: false, kbid: '', kbmc: '' },

                // ===== 新建 / 编辑弹窗 =====
                modalVisible: false,
                editMode: false, // false=新增, true=编辑
                saving: false,
                formKey: 0, // 每次打开重建 Form，清掉上一次的校验红字
                formData: this.getEmptyForm(),
                formRules: {
                    kbmc: [{ required: true, message: '知识库名称不能为空', trigger: 'blur' }]
                },

                // ===== 删除确认（单实例，暂存待执行动作）=====
                confirmation: {
                    visible: false,
                    title: '',
                    content: '',
                    confirmText: '确认',
                    confirmType: 'primary',
                    loading: false,
                    action: null
                }
            }
        },

        computed: {
            modalTitle () {
                return this.editMode ? '编辑知识库' : '添加知识库'
            },

            // 是否带筛选条件（空态文案分流用）
            hasFilter () {
                return !!(this.searchForm.kbmc || this.searchForm.status)
            }
        },

        watch: {
            // 取消确认时清理待执行回调，避免后续误触发
            'confirmation.visible' (visible) {
                if (!visible && !this.confirmation.loading) {
                    this.confirmation.action = null
                }
            }
        },

        mounted () {
            this.loadData()
            // 入场族：挂载后下一帧加 .is-view（§4.1① 同口径）
            this.$nextTick(() => {
                this.isView = true
            })
        },

        methods: {
            // ---------- 查询（口径同 KbList）----------
            // 组装查询参数：仅携带非空筛选条件，避免空串干扰后端 <if> 判断
            buildQuery () {
                const q = { pageNum: this.pageNum, pageSize: this.pageSize }
                const s = this.searchForm
                if (s.kbmc) q.kbmc = s.kbmc
                if (s.status !== '' && s.status !== null && s.status !== undefined) {
                    q.status = s.status
                }
                return q
            },

            async loadData () {
                this.loading = true
                this.loadError = false
                this.gridView = false // 先关卡片闸门：加载期间显示骨架，数据落位后重放 stagger
                try {
                    const res = await kbListPage(this.buildQuery())
                    // listPage 返回 PageHelper 的 PageInfo：{ list, total, pageNum, pageSize, pages, ... }
                    if (res && Array.isArray(res.list)) {
                        this.list = res.list
                        this.total = typeof res.total === 'number' ? res.total : res.list.length
                    } else if (Array.isArray(res)) {
                        // 兼容直接返回数组的情况
                        this.list = res
                        this.total = res.length
                    } else {
                        this.list = []
                        this.total = 0
                    }
                } catch (e) {
                    // 响应拦截器已弹出错误提示，此处静默，只切到错误态
                    this.list = []
                    this.total = 0
                    this.loadError = true
                } finally {
                    this.loading = false
                    this.$nextTick(() => {
                        this.gridView = true
                    })
                }
            },

            handleSearch () {
                this.pageNum = 1
                this.loadData()
            },

            handleReset () {
                this.searchForm = { kbmc: '', status: '' }
                this.pageNum = 1
                this.loadData()
            },

            onPageChange (p) {
                this.pageNum = p
                this.loadData()
            },

            onPageSizeChange (s) {
                this.pageSize = s
                this.pageNum = 1
                this.loadData()
            },

            // ---------- 卡片多选 ----------
            isPicked (row) {
                return this.selectedIds.indexOf(row.id) > -1
            },

            togglePick (row) {
                const idx = this.selectedIds.indexOf(row.id)
                if (idx > -1) this.selectedIds.splice(idx, 1)
                else this.selectedIds.push(row.id)
            },

            // ---------- 新建 / 编辑 ----------
            getEmptyForm () {
                return {
                    id: null,
                    kbmc: '',
                    kbms: '',
                    status: 'enabled'
                }
            },

            openAddModal () {
                this.editMode = false
                this.formData = this.getEmptyForm()
                this.formKey++ // 重建 Form，避免残留上一次的校验态
                this.modalVisible = true
                this.$nextTick(() => {
                    this.$refs.kbForm && this.$refs.kbForm.resetFields()
                })
            },

            openEditModal (row) {
                this.editMode = true
                this.formData = Object.assign(this.getEmptyForm(), row)
                this.formKey++
                this.modalVisible = true
                this.$nextTick(() => {
                    this.$refs.kbForm && this.$refs.kbForm.resetFields()
                })
            },

            handleSave () {
                this.$refs.kbForm.validate(async (valid) => {
                    if (!valid) return
                    this.saving = true
                    try {
                        // 后端 save：id 有值走 update，无值走 add
                        await kbSave(this.formData)
                        this.$Message.success(this.editMode ? '修改成功' : '添加成功')
                        this.modalVisible = false
                        this.loadData()
                    } catch (e) {
                        // 响应拦截器已弹出错误提示
                    } finally {
                        this.saving = false
                    }
                })
            },

            // ---------- 文档管理入口：内嵌到本页，不再跳转 /portal/kb/docs 路由 ----------
            // 文档管理组件自行读 props.kbid/kbmc，独立路由 /portal/kb/docs 仍可用于直接链接
            goDoc (row) {
                this.docView = { open: true, kbid: row.id, kbmc: row.kbmc || '' }
            },

            // 从内嵌文档管理返回：关闭内嵌视图并刷新知识库列表（文档编辑可能改变计数 / 内容）
            closeDoc () {
                this.docView = { open: false, kbid: '', kbmc: '' }
                this.loadData()
            },

            // ---------- 删除（统一走门户确认弹窗）----------
            confirmAction (title, content, confirmText, confirmType, action) {
                this.confirmation.title = title
                this.confirmation.content = content
                this.confirmation.confirmText = confirmText
                this.confirmation.confirmType = confirmType
                this.confirmation.loading = false
                this.confirmation.action = action
                this.confirmation.visible = true
            },

            // 执行待确认操作：loading 防重复；成功关框，失败（返回 false）保留弹框
            async executeConfirmedAction () {
                if (!this.confirmation.visible || this.confirmation.loading) return
                const action = this.confirmation.action
                if (!action) return
                this.confirmation.loading = true
                try {
                    const result = await action()
                    if (result !== false) {
                        this.confirmation.visible = false
                        this.confirmation.action = null
                    }
                } catch (e) {
                    // 响应拦截器已弹出错误提示
                } finally {
                    this.confirmation.loading = false
                }
            },

            handleDelete (row) {
                this.confirmAction(
                    '确认删除',
                    '确定要删除该知识库吗？其下文档需在文档管理页另行清理。',
                    '删除',
                    'error',
                    async () => {
                        try {
                            await kbDelete({ id: row.id })
                        } catch (e) {
                            // 响应拦截器已弹出错误提示
                            return false
                        }
                        this.$Message.success('删除成功')
                        // 删除当前页最后一条时回退一页
                        if (this.list.length === 1 && this.pageNum > 1) {
                            this.pageNum--
                        }
                        this.loadData()
                        return true
                    }
                )
            },

            handleBatchDelete () {
                if (!this.selectedIds.length) {
                    this.$Message.warning('请先选择要删除的记录')
                    return
                }
                const count = this.selectedIds.length
                this.confirmAction(
                    '确认批量删除',
                    '确定要删除选中的 ' + count + ' 个知识库吗？其下文档需在文档管理页另行清理。',
                    '批量删除',
                    'error',
                    async () => {
                        try {
                            await kbBatchDelete(this.selectedIds)
                        } catch (e) {
                            // 响应拦截器已弹出错误提示
                            return false
                        }
                        this.$Message.success('批量删除成功')
                        // 删除当前页全部时回退一页
                        if (this.list.length === count && this.pageNum > 1) {
                            this.pageNum--
                        }
                        this.selectedIds = []
                        this.loadData()
                        return true
                    }
                )
            }
        }
    }
</script>

<style scoped lang="less">
/* ══════════════════════════════════════════════════════════════
   门户知识库页 · v3 规格
   token 全部来自 body.page-portal-v3（PortalLayout 持有）；
   .kb-* 为本页私有前缀，iView 内部样式统一用 :global(.kb-page …) /
   :global(.portal-kb-modal …) 覆写（同 PortalConfirmModal 的技法）。
   ══════════════════════════════════════════════════════════════ */

/* ── 页面骨架：让位固定顶栏（88px），底色沿用 body 的宣纸；
   全高 flex 列（agents .pg-wrap / mine .pm-page 同口径）：内容不足时页脚贴视口底 ── */
.kb-page {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding-top: var(--header-h);
}

/* 内嵌模式：宿主面板已提供外框，去掉顶栏让位，也不做版心居中；
   min-height:0 覆盖 100dvh，避免面板被强制撑到整屏高、内容下方留大段空白 */
.kb-page.is-embedded {
    padding-top: 0;
    max-width: none;
    margin: 0;
    min-height: 0;
}

/* ══ BANNER（220px 整高：含 3px 装订线，全局 border-box）════ */
.kb-banner {
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
    height: 220px;
    /* 浅色 135deg 多段渐变：色标全为宣纸 / 白 token，零深色绛红 */
    background: linear-gradient(135deg, var(--c-white) 0%, var(--c-paper-2) 58%, var(--c-paper) 100%);
    /* 装订线：浅 banner 与宣纸正文之间的唯一强分界 */
    border-bottom: 3px solid var(--c-red-600);
}

/* 暖调晕（淡朱砂，--c-red-100）：压在文案之上，一层纸气 */
.kb-banner::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    background: radial-gradient(ellipse 62% 130% at 86% 12%, var(--c-red-100), transparent 64%);
    pointer-events: none;
}

/* 纸纹发丝斜线（宣纸材质授权值） */
.kb-banner::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 3;
    background: repeating-linear-gradient(115deg, transparent 0 14px, rgba(153, 42, 24, .05) 14px 15px);
    pointer-events: none;
}

/* ── 静态文案块：版心左对齐、220px 内垂直居中；层级压在纸纹之下（纸气盖字是刻意的） ── */
.kb-banner-copy {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
    max-width: var(--max);
    margin: 0 auto;
    padding: 0 var(--s6);
}

/* ── banner 文案三行：kicker / 衬线标题 / 说明行 ── */
.kb-kicker {
    display: flex;
    align-items: center;
    gap: var(--s2);
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xs);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wider);
    color: var(--c-red-600);
}

.kb-title {
    margin: var(--s3) 0 0;
    font-family: var(--font-display);
    /* clamp 取 token 上下限：宽屏 40，窄屏自然收到 30，不引入手写 px */
    font-size: clamp(var(--text-2xl), 4vw, var(--text-3xl));
    font-weight: 700;
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

.kb-sub {
    margin: var(--s3) 0 0;
    font-family: var(--font-display);
    font-size: var(--text-base);
    line-height: var(--leading-body);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink-2);
}

/* ══ 主体三段：全页唯一内衬（--max + --s6），一条左内容线；顶衬收薄，让工具区显紧凑 ══ */
.kb-body {
    width: 100%;
    max-width: var(--max);
    margin: 0 auto;
    padding: var(--s6) var(--s6) var(--s16);
}

/* 内嵌文档管理视图：内衬与版心交给子组件（.kbd-body 自带 --max + --s6），
   本层退让，避免两层内衬叠加导致左右留白加倍 */
.kb-body.is-doc-open {
    max-width: none;
    padding: 0;
}

/* ── 段头公共语汇（仍被「知识库列表」头使用）── */
.kb-h2 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--s3);
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 700;
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

.kb-sep {
    width: 24px;
    height: 24px;
    display: inline-grid;
    place-items: center;
    flex-shrink: 0;
    font-size: var(--text-base);
    color: var(--c-red-600);
    transition: transform .5s ease;
}

/* ── 屏幕阅读器专用文本（检索区可见标签已收起，单行排布需要） ── */
.kb-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* ══ (b-1) 检索带：单行紧凑工具条（无段头标题、无面板底、无左红条，零容器观感） ══ */
.kb-search {
    position: relative;
    padding: var(--s1) 0;
}

.kb-list-head:hover .kb-sep {
    transform: rotateY(180deg);
}

/* 桌面必须一行排完：nowrap + 控件定宽；窄屏断点里改纵向堆叠 */
.kb-search-row {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--s3);
}

.kb-field {
    display: flex;
    align-items: center;
    min-width: 0;
}

.kb-field--name {
    flex: 0 1 340px;
    min-width: 200px;
}

.kb-field--status {
    flex: 0 0 160px;
}

.kb-search-acts {
    display: flex;
    flex: 0 0 auto;
    gap: var(--s2);
}

/* 紧凑工具条专用高度：本轮对行内控件豁免 44px 下限（卡片动作 / 选中触点 / 分页仍守 44） */
:global(.kb-page .kb-search .ivu-input),
:global(.kb-page .kb-search .ivu-select .ivu-select-selection) {
    height: 36px;
}

/* ══ 按钮（门户原生按钮语汇：衬线 + 宽字距，不走 iView 默认蓝） ══ */
.kb-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--s2);
    min-height: 36px;
    padding: 0 var(--s4);
    background: var(--c-white);
    border: 1px solid var(--c-ink-2);
    border-radius: var(--r-sm);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink-2);
    white-space: nowrap;
    cursor: pointer;
    transition: background var(--t-fast), border-color var(--t-fast), color var(--t-fast);
}

/* 空态 / 错误态的出口是独立 CTA，不吃工具条的紧凑豁免，仍守 44px 下限 */
.kb-state-acts .kb-btn {
    min-height: 44px;
    padding: 0 var(--s5);
}

.kb-btn:hover {
    background: var(--c-paper-2);
    border-color: var(--c-ink);
    color: var(--c-ink);
}

.kb-btn:active {
    background: var(--c-paper);
}

.kb-btn--primary {
    background: var(--c-red-600);
    border-color: var(--c-red-600);
    color: var(--c-white);
}

.kb-btn--primary:hover {
    background: var(--c-red-700);
    border-color: var(--c-red-700);
    color: var(--c-white);
}

/* 破坏性动作：红虚线框（框型即语义，不只靠颜色） */
.kb-btn--danger {
    background: var(--c-white);
    border: 1px dashed var(--c-red-600);
    color: var(--c-red-600);
}

.kb-btn--danger:hover {
    background: var(--c-red-100);
    border-style: solid;
    border-color: var(--c-red-600);
    color: var(--c-red-700);
}

/* ══ (b-2) 操作丝带：上缘发丝虚线（下缘开放，直接落进列表段），不做第三张白卡；紧凑单行，与检索带同高同线 ══ */
.kb-acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s2) var(--s3);
    margin-top: var(--s3);
    padding: var(--s2) 0;
    border-top: 1px dashed rgba(153, 42, 24, .25);
}

.kb-acts-main {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s2);
}

/* 批量删除进出场：透明度 + 轻微左移；右侧是空位，不会挤动左侧「添加知识库」 */
.kb-batch-enter-active,
.kb-batch-leave-active {
    transition: opacity var(--t-fast), translate var(--t-fast);
}

.kb-batch-enter-from,
.kb-batch-leave-to {
    opacity: 0;
    translate: -8px 0;
}

/* ══ (b-3) 列表段 ══ */
.kb-list {
    margin-top: var(--s6);
}

.kb-list-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--s2) var(--s4);
    margin-bottom: var(--s4);
}

.kb-grid-wrap {
    min-height: 320px;
}

/* ── 栅格：auto-fill + min(min(280,100%)…) —— 稀疏结果不拉伸，永不出现大片空带 ── */
.kb-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
    gap: var(--s5);
}

.kb-slot {
    min-width: 0;
}

/* ══ 知识库卡片 ══ */
/* 高度与工作流 .wf-card（定高 248）/ 我的智能体 .amc-card（min-height 248）三面板取齐 —— 切栏时卡片高度不变。
   这里用 height:100% + min-height:248 走栅格拉伸，而非像 .wf-card 那样定高：
   本卡描述不限行数（无 clamp），定高会把超长标题 / 描述裁掉；min-height 下内容 ≤248 时行高恒为 248，
   超长内容自然撑开而不裁切 */
.kb-card {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 248px;
    padding: var(--s5);
    /* 阴影挂本体（本体无 clip-path → 焦点金环不被裁） */
    box-shadow: var(--shadow-sm);
    transition: box-shadow var(--t-base);
}

/* 底板：白底 + 发丝描边 + 右下 18px 折角（门户切角语汇，不用全页统一圆角卡） */
.kb-card::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background: var(--c-white);
    border: 1px solid var(--c-border);
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
    transition: background var(--t-base), border-color var(--t-base);
}

/* 左 3px 丝带：hover 加宽到 6px，不触布局 */
.kb-card::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    z-index: 1;
    background: var(--c-red-600);
    transform-origin: left;
    transition: transform var(--t-base);
}

/* 内容层抬到底板之上（树序在 ::before 之后、::after 之前） */
.kb-card>* {
    position: relative;
    z-index: 1;
}

/* 动作条与拾取角标压在底板 / 左丝带之上（拾取角标是 absolute，须盖过 ::after 的 3px 丝带） */
.kb-card .kb-card-act,
.kb-card .kb-pick {
    z-index: 3;
}

/* 选中态：绛红描边 + --c-red-100 顶部晕（非仅颜色：角标也同时置为实心勾） */
.kb-card.is-on::before {
    border-color: var(--c-red-600);
    background: linear-gradient(180deg, var(--c-red-100) 0%, var(--c-white) 42%);
}

.kb-card-title {
    margin: 0;
    padding-right: var(--s10);
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
    overflow-wrap: anywhere;
}

/* 描述恒占 2 行：换页 / 换数据时行高稳定 */
.kb-card-desc {
    margin: var(--s2) 0 0;
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--c-ink-2);
    min-height: calc(var(--text-sm) * var(--leading-body) * 2);
    overflow-wrap: anywhere;
}

.kb-card-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--s2);
    margin-top: var(--s4);
}

/* 状态标签：红框 = 启用（标准），灰虚框 = 停用（次级） */
.kb-tag {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    padding: 0 var(--s3);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: var(--r-full);
    color: var(--c-muted);
}

.kb-tag.is-on {
    border-color: var(--c-red-600);
    color: var(--c-red-600);
}

.kb-tag.is-off {
    border-style: dashed;
    color: var(--c-muted);
}

.kb-card-time {
    font-size: var(--text-xs);
    line-height: var(--leading-body);
    color: var(--c-muted);
    overflow-wrap: anywhere;
}

/* 动作条：压到卡底（margin-top:auto），上缘发丝虚线 */
.kb-card-act {
    position: relative;
    margin-top: auto;
    padding-top: var(--s3);
    border-top: 1px dashed rgba(153, 42, 24, .25);
    display: flex;
    align-items: center;
    gap: var(--s1);
}

.kb-act {
    display: inline-flex;
    align-items: center;
    gap: var(--s1);
    min-height: 44px;
    padding: 0 var(--s2);
    margin-left: calc(var(--s2) * -1);
    background: transparent;
    border: 0;
    border-radius: var(--r-sm);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink-2);
    white-space: nowrap;
    cursor: pointer;
    transition: background var(--t-fast), color var(--t-fast);
}

.kb-act:first-child {
    margin-right: auto;
}

.kb-act--docs {
    color: var(--c-red-600);
    /* 金只走图形通道（门户纪律：金不做小字）：下划线贴文字，不受 44px 触点高度牵扯 */
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 3px;
    transition: background var(--t-fast), color var(--t-fast), text-decoration-color var(--t-fast);
}

.kb-act--del {
    color: var(--c-red-500);
}

.kb-act:hover {
    background: var(--c-red-100);
    color: var(--c-red-700);
}

/* ── 多选角标：悬停 / 键盘聚焦浮现，选中常驻；触点 44×44 ── */
.kb-pick {
    position: absolute;
    right: var(--s2);
    top: var(--s2);
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--t-fast);
}

/* 浮现条件：卡内悬停 / 已选中常驻（两条各自成规则，互不牵连） */
.kb-card:hover .kb-pick {
    opacity: 1;
}

.kb-pick.is-on {
    opacity: 1;
}

/* 键盘聚焦：用 :has 看得到内部 input 的 focus-visible。
   刻意不写 :focus-within —— 鼠标点选后 input 仍持焦，指针离开卡片时角标会赖着不隐藏 */
.kb-pick:has(input:focus-visible) {
    opacity: 1;
}

/* 触屏无 hover：角标常驻，否则选不着 */
@media (hover: none) {
    .kb-pick {
        opacity: 1;
    }
}

/* 原生 checkbox 铺满 44×44 触点，视觉交给 .kb-pick-box */
.kb-pick input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
}

.kb-pick-box {
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    background: var(--c-white);
    border: 1px dashed var(--c-red-600);
    border-radius: var(--r-sm);
    transition: background var(--t-fast), border-color var(--t-fast);
    pointer-events: none;
}

.kb-pick input:checked+.kb-pick-box {
    background: var(--c-red-600);
    border-color: var(--c-red-600);
    border-style: solid;
}

.kb-pick input:checked+.kb-pick-box::after {
    content: '';
    width: 5px;
    height: 9px;
    border: solid var(--c-white);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg) translate(-1px, -1px);
}

/* 键盘焦点环画在可视方块上（input 本身 opacity:0，环不可见） */
.kb-pick input:focus-visible+.kb-pick-box {
    outline: 2px solid var(--c-ring);
    outline-offset: 3px;
}

/* ── 骨架卡：结构镜像真卡，换页不塌不跳 ── */
.kb-sk {
    pointer-events: none;
}

.kb-sk-line,
.kb-sk-chip,
.kb-sk-time,
.kb-sk-acts span {
    display: block;
    background: var(--c-paper);
    border-radius: var(--r-sm);
}

.kb-sk-title {
    width: 54%;
    height: var(--s5);
}

.kb-sk-desc {
    width: 100%;
    height: var(--s3);
    margin-top: var(--s3);
}

.kb-sk-short {
    width: 68%;
    margin-top: var(--s2);
}

.kb-sk-tags {
    display: flex;
    align-items: center;
    gap: var(--s3);
    margin-top: var(--s4);
}

.kb-sk-chip {
    width: 48px;
    height: 26px;
    flex-shrink: 0;
}

.kb-sk-time {
    width: 120px;
    height: var(--s3);
}

.kb-sk-acts {
    margin-top: auto;
    padding-top: var(--s3);
    border-top: 1px dashed rgba(153, 42, 24, .25);
    display: flex;
    gap: var(--s4);
}

.kb-sk-acts span {
    width: 56px;
    height: var(--s3);
}

/* ── 空态 / 错误态：CSS 印章 + 一行文案 + 一个出口，不留大空白 ── */
.kb-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--s3);
    min-height: 320px;
    padding: var(--s10) var(--s6);
    background: var(--c-white);
    border: 1px dashed var(--c-border);
    text-align: center;
}

.kb-seal {
    position: relative;
    width: 72px;
    height: 72px;
    display: grid;
    place-items: center;
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    line-height: 1;
    color: var(--c-red-600);
    background: linear-gradient(160deg, var(--c-white), var(--c-paper));
    box-shadow: inset 0 0 0 4px var(--c-red-100);
    border-radius: var(--r-full);
}

.kb-seal::after {
    content: '';
    position: absolute;
    inset: calc(var(--s2) * -1);
    border: 1px dashed var(--c-red-600);
    border-radius: var(--r-full);
    pointer-events: none;
    transition: transform .5s ease;
}

.kb-state:hover .kb-seal::after {
    transform: rotateY(180deg);
}

.kb-state-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xl);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

.kb-state-text {
    margin: 0;
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--c-ink-2);
}

.kb-state-acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--s3);
    margin-top: var(--s2);
}

/* ── 分页行 ── */
.kb-pager {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--s5);
}

/* ══ (g) 页脚：视觉规格在共享组件 PortalFooter，本页只留布局——
   margin-top:auto 吸收余量 → 列表再短也贴视口底 ══ */
.panel-footer-bar {
    margin-top: auto;
}

/* ══ 入场族：opacity 0→1 + translateY(28px→0)，0.7s ══
   区块走 data-delay 四档，卡片走行内 transitionDelay（(i%10)*0.05s）；
   位移只在 transform 通道，且只属于入场——卡片 hover 不再位移（卡片不是入口） */
.effect {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity .7s ease, transform .7s ease;
}

.kb-page.is-view .effect {
    opacity: 1;
    transform: none;
}

.effect[data-delay="1"] {
    transition-delay: .08s;
}

.effect[data-delay="2"] {
    transition-delay: .16s;
}

.effect[data-delay="3"] {
    transition-delay: .24s;
}

/* 卡片闸门独立于页面闸门：加载期间必须能压回 0 才能重放 stagger（特异性需高于上面一条） */
.kb-page .kb-grid:not(.is-view) .effect {
    opacity: 0;
    transform: translateY(28px);
}

.kb-page .kb-grid.is-view .effect {
    opacity: 1;
    transform: none;
}

/* ══ hover 反馈（触屏不误触发位移） ══
   卡片不是入口：hover 只给「描边亮起 + 阴影加深 + 左丝带加宽」三处静态反馈，
   不做抬升 / 位移 / 按压（那会暗示整卡可点），但足以让拾取角标的浮现读起来是有意的 */
@media (hover: hover) {
    .kb-card:hover {
        box-shadow: var(--shadow-md);
    }

    .kb-card:hover::before {
        border-color: var(--c-red-600);
    }

    .kb-card:hover::after {
        transform: scaleX(2);
    }

    /* 金下划线只走图形通道，只亮主动作 */
    .kb-card:hover .kb-act--docs {
        text-decoration-color: var(--c-gold-500);
    }
}

/* ══════════════════════════════════════════════════════════════
   View UI Plus 覆写（ :global 限定在本页 / 本弹窗类名之下，不外溢）
   ══════════════════════════════════════════════════════════════ */

/* ── 输入框 ── */
:global(.kb-page .ivu-input) {
    height: 44px;
    padding: 0 var(--s3);
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    color: var(--c-ink);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    transition: border-color var(--t-fast), box-shadow var(--t-fast);
}

:global(.kb-page .ivu-input:hover) {
    border-color: var(--c-red-600);
}

:global(.kb-page .ivu-input:focus) {
    border-color: var(--c-red-600);
    box-shadow: none;
}

/* 键盘焦点金环（压过库自带的 outline:0） */
:global(.kb-page .ivu-input:focus-visible) {
    outline: 2px solid var(--c-ring);
    outline-offset: 3px;
}

:global(.kb-page .ivu-input::placeholder) {
    color: var(--c-muted);
}

/* 清除图标占位（库自带的 32px 右内距会被上面的基础规则盖掉，这里补回） */
:global(.kb-page .ivu-input-icon-normal+.ivu-input) {
    padding-right: var(--s8);
}

/* 校验错误描边：须高于上面的基础描边规则，否则红框出不来 */
:global(.kb-page .ivu-form-item-error .ivu-input),
:global(.kb-page .ivu-form-item-error .ivu-select-selection) {
    border-color: var(--c-red-500);
}

/* ── 下拉框（检索态下拉在页内，非 transfer） ── */
:global(.kb-page .ivu-select .ivu-select-selection) {
    height: 44px;
    display: flex;
    align-items: center;
    padding: 0 var(--s8) 0 var(--s3);
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    color: var(--c-ink);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    transition: border-color var(--t-fast), box-shadow var(--t-fast);
}

:global(.kb-page .ivu-select .ivu-select-selection:hover) {
    border-color: var(--c-red-600);
}

:global(.kb-page .ivu-select-visible .ivu-select-selection) {
    border-color: var(--c-red-600);
    box-shadow: none;
    outline: 0;
}

:global(.kb-page .ivu-select .ivu-select-selection:focus-visible) {
    outline: 2px solid var(--c-ring);
    outline-offset: 3px;
}

:global(.kb-page .ivu-select .ivu-select-placeholder) {
    color: var(--c-muted);
    flex: 1;
    min-width: 0;
}

:global(.kb-page .ivu-select .ivu-select-selected-value) {
    color: var(--c-ink);
    flex: 1;
    min-width: 0;
}

:global(.kb-page .ivu-select .ivu-select-arrow) {
    color: var(--c-muted);
}

:global(.kb-page .ivu-select-dropdown) {
    padding: var(--s1) 0;
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    box-shadow: var(--shadow-md);
}

:global(.kb-page .ivu-select-item) {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 0 var(--s6);
    color: var(--c-ink-2);
    font-family: var(--font-body);
    transition: background var(--t-fast), color var(--t-fast);
}

:global(.kb-page .ivu-select-item:hover),
:global(.kb-page .ivu-select-item:focus) {
    background: var(--c-red-100);
    color: var(--c-red-600);
}

:global(.kb-page .ivu-select-item-selected),
:global(.kb-page .ivu-select-item-selected:hover) {
    background: var(--c-red-100);
    color: var(--c-red-600);
    font-weight: 600;
}

/* ── 分页：44 触点 + 绛红当前页，切 flex 允许换行（禁止横向滚动） ── */
:global(.kb-pager .ivu-page) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s2);
    max-width: 100%;
    font-family: var(--font-body);
}

:global(.kb-pager .ivu-page-total) {
    height: auto;
    line-height: normal;
    margin-right: 0;
    color: var(--c-muted);
    font-size: var(--text-sm);
}

:global(.kb-pager .ivu-page-item),
:global(.kb-pager .ivu-page-item-jump-prev),
:global(.kb-pager .ivu-page-item-jump-next),
:global(.kb-pager .ivu-page-prev),
:global(.kb-pager .ivu-page-next) {
    min-width: 44px;
    height: 44px;
    line-height: 42px;
    margin-right: 0;
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: var(--r-sm);
    color: var(--c-ink-2);
    font-family: var(--font-display);
    transition: background var(--t-fast), border-color var(--t-fast), color var(--t-fast);
}

:global(.kb-pager .ivu-page-item a),
:global(.kb-pager .ivu-page-item-jump-prev a),
:global(.kb-pager .ivu-page-item-jump-next a),
:global(.kb-pager .ivu-page-prev a),
:global(.kb-pager .ivu-page-next a) {
    color: inherit;
    line-height: inherit;
}

:global(.kb-pager .ivu-page-item:hover),
:global(.kb-pager .ivu-page-item-jump-prev:hover),
:global(.kb-pager .ivu-page-item-jump-next:hover),
:global(.kb-pager .ivu-page-prev:hover),
:global(.kb-pager .ivu-page-next:hover) {
    border-color: var(--c-red-600);
    color: var(--c-red-600);
}

:global(.kb-pager .ivu-page-item-active),
:global(.kb-pager .ivu-page-item-active:hover) {
    background: var(--c-red-600);
    border-color: var(--c-red-600);
    color: var(--c-white);
}

:global(.kb-pager .ivu-page-item-active a),
:global(.kb-pager .ivu-page-item-active:hover a) {
    color: var(--c-white);
}

:global(.kb-pager .ivu-page-item-jump-prev),
:global(.kb-pager .ivu-page-item-jump-next) {
    color: var(--c-muted);
}

:global(.kb-pager .ivu-page-options) {
    margin-left: 0;
}

:global(.kb-pager .ivu-page-options .ivu-select-selection) {
    height: 44px;
}

/* ══ (e) 新建 / 编辑弹窗换皮：PortalConfirmModal 同款 class-name 技法 ══ */
:global(.portal-kb-modal) {
    padding: var(--s6);
    font-family: var(--font-body);
}

:global(.portal-kb-modal .ivu-modal) {
    max-width: 100%;
    margin: 0 auto;
    top: 8vh;
}

:global(.portal-kb-modal .ivu-modal-content) {
    overflow: hidden;
    background: var(--c-paper-2);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    box-shadow: var(--shadow-lg);
}

:global(.portal-kb-modal .ivu-modal-header) {
    padding: var(--s5) var(--s6) var(--s4);
    border-bottom: 1px solid var(--c-border);
    background: transparent;
}

:global(.portal-kb-modal .ivu-modal-header-inner) {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

:global(.portal-kb-modal .ivu-modal-close) {
    width: 44px;
    height: 44px;
    top: var(--s1);
    right: var(--s1);
    display: grid;
    place-items: center;
    color: var(--c-muted);
    transition: color var(--t-fast);
}

:global(.portal-kb-modal .ivu-modal-close:hover) {
    color: var(--c-red-600);
}

:global(.portal-kb-modal .ivu-modal-body) {
    padding: var(--s5) var(--s6) var(--s6);
}

/* 表单标签：衬线 + 左对齐，纵向对齐 44px 字段 */
:global(.portal-kb-modal .ivu-form-item-label) {
    padding: var(--s3) var(--s3) var(--s3) 0;
    text-align: left;
    font-family: var(--font-display);
    font-size: var(--text-sm);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink-2);
}

:global(.portal-kb-modal .ivu-form-item) {
    margin-bottom: var(--s4);
}

:global(.portal-kb-modal .ivu-form-item-content) {
    line-height: normal;
    font-size: var(--text-sm);
}

:global(.portal-kb-modal .ivu-form-item-error-tip) {
    font-size: var(--text-xs);
    color: var(--c-red-500);
}

/* 必填星号走 token 红（库默认色不在 v3 调色板内） */
:global(.portal-kb-modal .ivu-form-item-required:before) {
    color: var(--c-red-500);
}

:global(.portal-kb-modal input.ivu-input) {
    height: 44px;
}

:global(.portal-kb-modal .ivu-input) {
    padding: 0 var(--s3);
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    color: var(--c-ink);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    transition: border-color var(--t-fast), box-shadow var(--t-fast);
}

:global(.portal-kb-modal .ivu-input:hover) {
    border-color: var(--c-red-600);
}

:global(.portal-kb-modal .ivu-input:focus) {
    border-color: var(--c-red-600);
    box-shadow: none;
}

:global(.portal-kb-modal .ivu-input:focus-visible) {
    outline: 2px solid var(--c-ring);
    outline-offset: 3px;
}

:global(.portal-kb-modal .ivu-input::placeholder) {
    color: var(--c-muted);
}

:global(.portal-kb-modal textarea.ivu-input) {
    padding: var(--s2) var(--s3);
    line-height: var(--leading-body);
    resize: vertical;
}

:global(.portal-kb-modal .ivu-form-item-error .ivu-input),
:global(.portal-kb-modal .ivu-form-item-error .ivu-select-selection) {
    border-color: var(--c-red-500);
}

/* 弹窗内下拉（transfer 到 body，靠 transfer-class-name 认亲） */
:global(.portal-kb-modal .ivu-select .ivu-select-selection) {
    height: 44px;
    display: flex;
    align-items: center;
    padding: 0 var(--s8) 0 var(--s3);
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    color: var(--c-ink);
    font-family: var(--font-body);
    font-size: var(--text-sm);
}

:global(.portal-kb-modal .ivu-select-visible .ivu-select-selection) {
    border-color: var(--c-red-600);
    box-shadow: none;
}

:global(.portal-kb-modal .ivu-select .ivu-select-placeholder) {
    color: var(--c-muted);
}

/* 提升特异性：transfer 到 body 后不再有 .portal-kb-modal 祖先，靠 body.page-portal-v3（仅门户页存在）兜住 */
:global(body.page-portal-v3 .portal-kb-modal-drop) {
    padding: var(--s1) 0;
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    box-shadow: var(--shadow-md);
}

:global(.portal-kb-modal-drop .ivu-select-item) {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 0 var(--s6);
    color: var(--c-ink-2);
    font-family: var(--font-body);
    transition: background var(--t-fast), color var(--t-fast);
}

:global(.portal-kb-modal-drop .ivu-select-item:hover),
:global(.portal-kb-modal-drop .ivu-select-item:focus) {
    background: var(--c-red-100);
    color: var(--c-red-600);
}

:global(.portal-kb-modal-drop .ivu-select-item-selected),
:global(.portal-kb-modal-drop .ivu-select-item-selected:hover) {
    background: var(--c-red-100);
    color: var(--c-red-600);
    font-weight: 600;
}

/* 弹窗动作行 */
:global(.portal-kb-modal__foot) {
    display: flex;
    justify-content: flex-end;
    gap: var(--s3);
    margin-top: var(--s5);
    padding-top: var(--s4);
    border-top: 1px dashed rgba(153, 42, 24, .25);
}

:global(.portal-kb-modal .ivu-btn) {
    min-width: 96px;
    min-height: 44px;
    margin: 0;
    border-radius: var(--r-sm);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    box-shadow: none;
    transition: background var(--t-fast), border-color var(--t-fast), color var(--t-fast);
}

:global(.portal-kb-modal .ivu-btn:focus-visible) {
    outline: 2px solid var(--c-ring);
    outline-offset: 3px;
}

:global(.portal-kb-modal .ivu-btn:not(.ivu-btn-primary):not(.ivu-btn-error)) {
    background: var(--c-white);
    border-color: var(--c-ink-2);
    color: var(--c-ink-2);
}

:global(.portal-kb-modal .ivu-btn:not(.ivu-btn-primary):not(.ivu-btn-error):hover) {
    background: var(--c-paper-2);
    border-color: var(--c-ink);
    color: var(--c-ink);
}

:global(.portal-kb-modal .ivu-btn-primary) {
    background: var(--c-red-600);
    border-color: var(--c-red-600);
    color: var(--c-white);
}

:global(.portal-kb-modal .ivu-btn-primary:hover) {
    background: var(--c-red-700);
    border-color: var(--c-red-700);
    color: var(--c-white);
}

/* ══ 唯一宽度断点 996 ══ */
@media (max-width: 996px) {
    .kb-banner-copy {
        padding: 0 var(--s4);
    }

    .kb-sub {
        font-size: var(--text-sm);
    }

    .kb-body {
        padding-inline: var(--s4);
    }

    /* 窄屏放弃单行：检索行纵向堆叠，字段与按钮通栏（单行只承诺桌面宽度） */
    .kb-search {
        padding: var(--s2) 0;
    }

    .kb-search-row {
        flex-direction: column;
        align-items: stretch;
    }

    .kb-field--name,
    .kb-field--status {
        flex: 1 1 auto;
        min-width: 0;
        width: 100%;
    }

    .kb-search-acts {
        width: 100%;
    }

    .kb-search-acts .kb-btn {
        flex: 1;
    }

    /* 单列栅格：≤996 一律一行一卡 */
    .kb-grid {
        grid-template-columns: minmax(0, 1fr);
    }

    .kb-pager {
        justify-content: center;
    }

    /* 弹窗在窄屏收内衬，给字段多留宽度 */
    :global(.portal-kb-modal) {
        padding: var(--s4);
    }
}

/* ══ 动效降级：入场 / 位移 / 过渡全量直出 ══ */
@media (prefers-reduced-motion: reduce) {

    .effect,
    .kb-page.is-view .effect,
    .kb-page .kb-grid:not(.is-view) .effect,
    .kb-page .kb-grid.is-view .effect {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
    }

    .kb-card,
    .kb-card:hover {
        transition: box-shadow var(--t-fast);
    }

    .kb-card::after,
    .kb-card::before,
    .kb-seal::after,
    .kb-pick,
    .kb-pick-box,
    .kb-btn,
    .kb-act,
    .kb-sep {
        transition: none;
    }

    .kb-card:hover::after,
    .kb-state:hover .kb-seal::after,
    .kb-list-head:hover .kb-sep {
        transform: none;
    }

    .kb-batch-enter-active,
    .kb-batch-leave-active {
        transition: none;
    }
}
</style>
