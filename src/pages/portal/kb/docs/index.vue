<template>
    <!-- 门户文档管理页 /portal/kb/docs：220px 宣纸浅色静态 banner + 检索 / 操作 / 列表三段 + 分页 + 上传 / 批量导入 / 文本弹窗 -->
    <!-- 业务逻辑与后台 src/pages/project/ai/kbdoc/KbDocList.vue 同源（buildQuery / loadData / upload / reparse / delete / batchDelete），壳与视觉为门户 v3 规格 -->
    <!-- 顶栏 + v3 主题层由 /portal 一级壳（PortalShell）渲染：独立路由与内嵌态都只出内容 -->
        <main class="kbd-page" :class="{ 'is-view': isView, 'is-embedded': embedded }">
            <!-- ══ (a) BANNER：220px 浅色渐变静态横幅（单幅，无轮播 / 无分页），底缘 3px 绛红装订线；内嵌模式隐藏 ══ -->
            <section v-if="!embedded" class="kbd-banner" aria-label="文档管理功能介绍">
                <!-- 文案块：版心左对齐、在 220px 内垂直居中 -->
                <div class="kbd-banner-copy">
                    <p class="kbd-kicker effect" data-delay="0">
                        <span aria-hidden="true">◈</span>文档管理 · DOCUMENTS
                    </p>
                    <!-- 标题随路由 query 的知识库名变化：带名「知识库「X」- 文档管理」，空则退「文档管理」 -->
                    <h1 class="kbd-title effect" data-delay="1">{{ bannerTitle }}</h1>
                    <p class="kbd-sub effect" data-delay="2">检索文档、上传导入、解析切片，维护知识库文档</p>
                </div>
            </section>

            <div class="kbd-body">
                <!-- ══ (b-1) 检索：单行紧凑工具条（无段头标题、无面板底、无容器观感） ══ -->
                <section class="kbd-search effect" data-delay="1" aria-label="文档检索">
                    <div class="kbd-search-row">
                        <!-- 可见标签已收进屏幕阅读器专用 label（单行排布需要），控件另带 placeholder -->
                        <div class="kbd-field kbd-field--name">
                            <label class="kbd-sr-only" for="kbd-wjmc-input">文件名称</label>
                            <Input
                                v-model.trim="searchForm.wjmc"
                                :element-id="'kbd-wjmc-input'"
                                clearable
                                placeholder="文件名称，如：2026招生简章.pdf"
                                @on-enter="handleSearch"
                            />
                        </div>

                        <div class="kbd-field kbd-field--status">
                            <Select
                                v-model="searchForm.parsestatus"
                                aria-label="解析状态"
                                clearable
                                placeholder="全部解析状态"
                                @on-change="handleSearch"
                            >
                                <Option value="pending">待解析</Option>
                                <Option value="parsing">解析中</Option>
                                <Option value="parsed">解析完成</Option>
                                <Option value="failed">解析失败</Option>
                            </Select>
                        </div>

                        <div class="kbd-field kbd-field--status">
                            <Select
                                v-model="searchForm.chunkstatus"
                                aria-label="切片状态"
                                clearable
                                placeholder="全部切片状态"
                                @on-change="handleSearch"
                            >
                                <Option value="pending">待切片</Option>
                                <Option value="chunking">切片中</Option>
                                <Option value="chunked">切片完成</Option>
                                <Option value="failed">切片失败</Option>
                            </Select>
                        </div>

                        <div class="kbd-search-acts">
                            <button type="button" class="kbd-btn kbd-btn--primary" @click="handleSearch">
                                <Icon type="md-search" aria-hidden="true" />查询
                            </button>
                            <button type="button" class="kbd-btn" @click="handleReset">
                                <Icon type="md-refresh" aria-hidden="true" />重置
                            </button>
                        </div>
                    </div>
                </section>

                <!-- ══ (b-2) 返回 / 上传 / 批量导入 / 批量删除：发丝虚线丝带（不是又一张白卡，避免全页同款圆角卡） ══ -->
                <section class="kbd-acts effect" data-delay="2" aria-label="文档操作">
                    <div class="kbd-acts-main">
                        <button type="button" class="kbd-btn" @click="goBack">
                            <Icon type="md-arrow-back" aria-hidden="true" />返回
                        </button>
                        <button type="button" class="kbd-btn kbd-btn--primary" @click="openUploadModal">
                            <Icon type="md-cloud-upload" aria-hidden="true" />上传文档
                        </button>
                        <button type="button" class="kbd-btn" @click="openBatchModal">
                            <Icon type="md-copy" aria-hidden="true" />批量导入
                        </button>
                        <!-- 批量删除只在有选中项时出现，按钮自带条数；进出场走 transition，不挤动左侧按钮 -->
                        <transition name="kbd-batch">
                            <button
                                v-if="selectedIds.length"
                                type="button"
                                class="kbd-btn kbd-btn--danger"
                                @click="handleBatchDelete"
                            >
                                <Icon type="md-trash" aria-hidden="true" />批量删除({{ selectedIds.length }})
                            </button>
                        </transition>
                    </div>
                </section>

                <!-- ══ (b-3) 文档列表 ══ -->
                <section class="kbd-list" aria-labelledby="kbd-list-title">
                    <div class="kbd-list-head effect" data-delay="3">
                        <h2 id="kbd-list-title" class="kbd-h2">
                            文档列表<span class="kbd-sep" aria-hidden="true">◈</span>
                        </h2>
                        <!-- 可见计数行已取消，只留屏幕阅读器可读的 live region 播报加载 / 条数状态 -->
                        <p class="kbd-sr-only" role="status" aria-live="polite">{{ countText }}</p>
                    </div>

                    <!-- 骨架 / 错误态 / 空态 / 数据表共用本容器，进出走淡入淡出，几何不塌 -->
                    <div class="kbd-table-wrap" :aria-busy="loading ? 'true' : 'false'">
                        <transition name="kbd-fade" mode="out-in">
                            <!-- 骨架：结构镜像真表（表头 + 行），换页不跳变 -->
                            <div v-if="loading" key="sk" class="kbd-sk" aria-hidden="true">
                                <div class="kbd-sk-row kbd-sk-row--head">
                                    <span
                                        v-for="(cell, ci) in skCells"
                                        :key="'skh-' + ci"
                                        class="kbd-sk-line"
                                        :class="cell"
                                    ></span>
                                </div>
                                <div v-for="n in 6" :key="'kbd-sk-' + n" class="kbd-sk-row">
                                    <span
                                        v-for="(cell, ci) in skCells"
                                        :key="'skb-' + ci"
                                        class="kbd-sk-line"
                                        :class="cell"
                                    ></span>
                                </div>
                            </div>

                            <!-- 错误态：拦截器已弹错，这里只给可恢复的出口 -->
                            <div v-else-if="loadError" key="err" class="kbd-state" role="alert">
                                <span class="kbd-seal" aria-hidden="true">◈</span>
                                <p class="kbd-state-title">列表加载失败</p>
                                <p class="kbd-state-text">网络或服务异常，可稍后重试</p>
                                <div class="kbd-state-acts">
                                    <button type="button" class="kbd-btn kbd-btn--primary" @click="loadData">重新加载</button>
                                </div>
                            </div>

                            <!-- 空态：区分「筛选无结果」与「这个知识库还没有文档」 -->
                            <div v-else-if="tableData.length === 0" key="empty" class="kbd-state" role="status">
                                <span class="kbd-seal" aria-hidden="true">◈</span>
                                <p class="kbd-state-title">{{ hasFilter ? '没有匹配的文档' : '还没有文档' }}</p>
                                <p class="kbd-state-text">
                                    {{ hasFilter ? '换个名称或状态再试一次，也可以直接重置筛选。' : '上传第一个文档，解析后即可切片入库。' }}
                                </p>
                                <div class="kbd-state-acts">
                                    <button
                                        v-if="hasFilter"
                                        type="button"
                                        class="kbd-btn"
                                        @click="handleReset"
                                    >重置筛选</button>
                                    <button
                                        v-else
                                        type="button"
                                        class="kbd-btn kbd-btn--primary"
                                        @click="openUploadModal"
                                    >上传文档</button>
                                </div>
                            </div>

                            <!-- 数据表：View UI Table 保逻辑，样式由 :global(.kbd-page …) 换皮 -->
                            <div v-else key="data" class="kbd-table-box">
                                <Table
                                    :columns="columns"
                                    :data="tableData"
                                    border
                                    @on-selection-change="onSelectionChange"
                                >
                                    <template #wjmc="{ row }">
                                        <span class="kbd-name" :title="row.wjmc">{{ row.wjmc || '-' }}</span>
                                    </template>
                                    <template #kbname="{ row }">
                                        <span class="kbd-kb">{{ kbMap[row.kbid] || row.kbid }}</span>
                                    </template>
                                    <template #wjdx="{ row }">
                                        <span class="kbd-size">{{ formatSize(row.wjdx) }}</span>
                                    </template>
                                    <template #parsestatus="{ row }">
                                        <span class="kbd-tag" :class="'is-' + statusTone(row.parsestatus)">{{ statusText(row.parsestatus) }}</span>
                                    </template>
                                    <template #chunkstatus="{ row }">
                                        <span class="kbd-tag" :class="'is-' + statusTone(row.chunkstatus)">{{ statusText(row.chunkstatus) }}</span>
                                    </template>
                                    <template #action="{ row }">
                                        <div class="kbd-act-cell">
                                            <button type="button" class="kbd-act" @click="openTextModal(row)">文本</button>
                                            <button type="button" class="kbd-act kbd-act--main" @click="goChunk(row)">切片管理</button>
                                            <button
                                                type="button"
                                                class="kbd-act"
                                                :disabled="reparseId === row.id"
                                                :aria-busy="reparseId === row.id ? 'true' : 'false'"
                                                @click="handleReparse(row)"
                                            >
                                                <span v-if="reparseId === row.id" class="kbd-act-spin" aria-hidden="true"></span>重新解析
                                            </button>
                                            <button type="button" class="kbd-act kbd-act--del" @click="handleDelete(row)">删除</button>
                                        </div>
                                    </template>
                                </Table>
                            </div>
                        </transition>
                    </div>

                    <!-- ══ 分页：保留 View UI Page（:current 为规格口径；view-ui-plus 1.3.x 实际读 modelValue，故并用 :model-value 才能让「搜索 / 重置」把页码拉回第 1 页） ══ -->
                    <div class="kbd-pager">
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
            </div>

            <!-- ══ 页脚：共享组件 PortalFooter（全幅绛红收口带 + 居中版权行）；内嵌模式隐藏 ══ -->
            <PortalFooter v-if="!embedded" class="panel-footer-bar" />

            <!-- ══ 上传弹窗：View UI Modal + Form，class-name 换皮到门户 token ══ -->
            <Modal
                v-model="uploadVisible"
                title="上传文档"
                :width="520"
                :mask-closable="false"
                footer-hide
                transfer
                class-name="portal-kbd-modal"
            >
                <Form ref="uploadForm" :model="uploadForm" :rules="uploadRules" :label-width="100">
                    <FormItem label="所属知识库">
                        <Input :model-value="kbmc || uploadForm.kbid" disabled placeholder="请从知识库管理进入" />
                    </FormItem>
                    <FormItem label="文档" prop="file">
                        <Upload
                            ref="uploader"
                            :before-upload="beforeUpload"
                            :show-upload-list="false"
                            :action="''"
                        >
                            <Button icon="md-add">选择文档</Button>
                        </Upload>
                        <div v-if="uploadForm.file" class="kbd-chosen">
                            <Icon type="md-document" aria-hidden="true" />
                            <span class="kbd-chosen-name">{{ uploadForm.file.name }}</span>
                            <span class="kbd-chosen-size">（{{ formatSize(uploadForm.file.size) }}）</span>
                            <button type="button" class="kbd-link kbd-link--del" @click="uploadForm.file = null">移除</button>
                        </div>
                        <div class="kbd-tip">支持 PDF / Word / Excel / PPT / TXT / HTML 等常见文档，上传后自动解析并切片</div>
                    </FormItem>
                </Form>

                <div class="portal-kbd-modal__foot">
                    <Button @click="uploadVisible = false">取消</Button>
                    <Button type="primary" :loading="uploading" @click="handleUpload">确定上传</Button>
                </div>
            </Modal>

            <!-- ══ 批量导入弹窗：复用单文件 /kbdoc/upload，前端逐个串行上传并跟踪每文件状态 ══ -->
            <Modal
                v-model="batchVisible"
                title="批量导入文档"
                :width="640"
                :mask-closable="false"
                :closable="!batchUploading"
                footer-hide
                transfer
                class-name="portal-kbd-modal"
            >
                <Form :label-width="100">
                    <FormItem label="所属知识库">
                        <Input :model-value="kbmc || searchForm.kbid" disabled placeholder="请从知识库管理进入" />
                    </FormItem>
                    <FormItem label="选择文档">
                        <Upload
                            multiple
                            :show-upload-list="false"
                            :action="''"
                            :before-upload="onBatchFileSelected"
                            :disabled="batchUploading"
                        >
                            <Button icon="md-add" :disabled="batchUploading">选择文档（可多选）</Button>
                        </Upload>
                        <div class="kbd-tip">支持 PDF / Word / Excel / PPT / TXT / HTML 等，可连续多批选择；逐个后台解析并切片，无需等待全部选完</div>
                    </FormItem>
                    <FormItem v-if="batchFiles.length" label="文件列表">
                        <div class="kbd-batch-files">
                            <div v-for="(f, i) in batchFiles" :key="i" class="kbd-bf">
                                <Icon type="md-document" aria-hidden="true" />
                                <span class="kbd-bf-name" :title="f.name">{{ f.name }}</span>
                                <span class="kbd-bf-size">{{ formatSize(f.size) }}</span>
                                <span class="kbd-tag" :class="'is-' + batchStatusTone(f.status)">{{ batchStatusText(f.status) }}</span>
                                <span v-if="f.err" class="kbd-bf-err" :title="f.err">{{ f.err }}</span>
                                <button
                                    v-if="f.status === 'wait'"
                                    type="button"
                                    class="kbd-link kbd-link--del"
                                    :disabled="batchUploading"
                                    @click="removeBatchFile(i)"
                                >移除</button>
                            </div>
                        </div>
                    </FormItem>
                </Form>

                <!-- 整体进度 -->
                <div v-if="batchFiles.length" class="kbd-batch-progress">
                    <Progress :percent="batchSummary.percent" :status="batchProgressStatus" />
                    <span class="kbd-batch-progress-text">共 {{ batchSummary.total }} 个 · 成功 {{ batchSummary.success }} · 失败 {{ batchSummary.failed }}</span>
                </div>

                <div class="portal-kbd-modal__foot">
                    <Button :disabled="batchUploading" @click="closeBatchModal">{{ batchDone ? '关闭' : '取消' }}</Button>
                    <Button
                        v-if="batchFiles.length && !batchDone"
                        type="error"
                        ghost
                        icon="md-trash"
                        :disabled="batchUploading"
                        @click="clearBatchFiles"
                    >清空</Button>
                    <Button
                        type="primary"
                        :loading="batchUploading"
                        :disabled="batchUploading || !batchFiles.length || !batchFiles.some(f => f.status === 'wait')"
                        @click="handleBatchUpload"
                    >{{ batchUploading ? '导入中...' : '开始上传' }}</Button>
                </div>
            </Modal>

            <!-- ══ 解析文本内容弹窗（tika 详情 tsnr） ══ -->
            <Modal
                v-model="textVisible"
                title="解析文本内容"
                :width="760"
                :mask-closable="false"
                footer-hide
                transfer
                class-name="portal-kbd-modal"
            >
                <div class="kbd-text-wrap">
                    <Spin v-if="textLoading" fix>加载中...</Spin>
                    <Input
                        v-model="textContent"
                        type="textarea"
                        :rows="22"
                        :readonly="true"
                        placeholder="（无文本内容）"
                    />
                </div>
            </Modal>

            <!-- ══ 删除 / 重新解析确认：门户既有确认弹窗，不用 $Modal.confirm（那会弹后台样式） ══ -->
            <PortalConfirmModal
                v-model="confirmation.visible"
                :title="confirmation.title"
                :content="confirmation.content"
                :confirm-text="confirmation.confirmText"
                :confirm-type="confirmation.confirmType"
                :loading="confirmation.loading"
                @confirm="executeConfirmedAction"
            />

            <!-- ══ 切片管理弹窗：显隐由子组件内部管理，父组件通过 $refs.chunkList.open() 打开 ══ -->
            <AiChunkList ref="chunkList" @closed="loadData" />
        </main>
</template>

<script>
    import PortalConfirmModal from '../../components/PortalConfirmModal.vue'
    import PortalFooter from '../../components/PortalFooter.vue'
    import AiChunkList from '@/pages/project/ai/chunk/ChunkList.vue'
    import {
        kbdocListPage,
        kbdocUpload,
        kbdocReparse,
        kbdocDelete,
        kbdocBatchDelete,
        tikaGetBy
    } from '@/api/kbdoc'
    import { kbList } from '@/api/kb'

    export default {
        name: 'PortalKbDocs',

        // 内嵌模式：被 portal/kb 列表以 KbDocsPanel 内联引入时为 true，
        // 此时隐藏页面级 chrome（banner / 页脚）并去掉顶栏让位与版心居中；独立路由 /portal/kb/docs 走默认 false，行为不变
        props: {
            embedded: { type: Boolean, default: false },
            // 内嵌时由宿主传入当前知识库；独立路由下为空，mounted 回退到 $route.query
            kbid: { type: String, default: '' },
            kbmc: { type: String, default: '' }
        },

        // 内嵌模式下「返回」不再走路由，改为通知宿主切回知识库列表
        emits: ['back'],

        components: {
            PortalConfirmModal,
            PortalFooter,
            AiChunkList
        },

        data () {
            return {
                // 入场族开关：挂载后下一帧一次性开启（portal/kb 同口径）
                isView: false,

                // ===== 列表（口径同 src/pages/project/ai/kbdoc/KbDocList.vue）=====
                loading: false,
                loadError: false,
                // Vue 3 中同名 data 会遮蔽 props，故用 prop 初始化（内嵌时即宿主传入的知识库名）；
                // 独立路由下 prop 为空串，行为与原来一致
                kbmc: this.kbmc || '',
                // 知识库 id -> 名称 映射，用于列表「所属知识库」列展示名称而非 id
                kbMap: {},
                uploading: false,
                reparseId: '',
                selectedIds: [],
                // 查询条件
                searchForm: { kbid: '', wjmc: '', parsestatus: '', chunkstatus: '' },
                pageNum: 1,
                pageSize: 10,
                total: 0,
                tableData: [],

                // 骨架行的列片段（镜像表头 / 行的分列，窄屏由 CSS 收成 5 段）
                skCells: ['is-pick', 'is-name', 'is-kb', 'is-size', 'is-parse', 'is-chunk', 'is-num', 'is-act'],

                // 上传弹窗
                uploadVisible: false,
                uploadForm: { kbid: '', file: null },
                uploadRules: {},

                // 批量导入弹窗
                batchVisible: false,
                batchUploading: false,
                batchDone: false,
                batchFiles: [], // { file, name, size, status: wait|uploading|success|failed, err }

                // 文本弹窗
                textVisible: false,
                textLoading: false,
                textContent: '',

                // 删除 / 重新解析确认（单实例，暂存待执行动作；门户确认弹窗，不用 $Modal.confirm）
                confirmation: {
                    visible: false,
                    title: '',
                    content: '',
                    confirmText: '确认',
                    confirmType: 'primary',
                    loading: false,
                    action: null
                },

                // 表格列：字段口径同 KbDocList，展示位改用 slot 以便换到门户样式（无渲染箭头函数）
                columns: [
                    { type: 'selection', width: 55, align: 'center' },
                    { title: '文件名称', key: 'wjmc', slot: 'wjmc', minWidth: 200 },
                    { title: '所属知识库', key: 'kbid', slot: 'kbname', width: 140 },
                    { title: '文件大小', key: 'wjdx', slot: 'wjdx', width: 100, align: 'right' },
                    { title: '解析状态', slot: 'parsestatus', width: 110, align: 'center' },
                    { title: '切片状态', slot: 'chunkstatus', width: 110, align: 'center' },
                    { title: '切片数量', key: 'chunkcount', width: 90, align: 'center' },
                    { title: '操作', slot: 'action', width: 340, align: 'center', fixed: 'right' }
                ]
            }
        },

        computed: {
            // 是否带用户筛选（空态文案分流用；kbid 由入口固定传入，不算筛选条件）
            hasFilter () {
                const s = this.searchForm
                return !!(s.wjmc || s.parsestatus || s.chunkstatus)
            },

            countText () {
                // 可见计数行已取消，此文案只喂给列表头的 sr-only live region（屏幕阅读器播报用）
                if (this.loading) return '正在加载…'
                if (this.loadError) return '列表加载失败'
                let text = '共 ' + this.total + ' 篇文档 · 第 ' + this.pageNum + ' 页'
                if (this.kbmc) text += ' · 知识库「' + this.kbmc + '」'
                return text
            },

            // banner 主标题：query 带知识库名时「知识库「X」- 文档管理」，否则退回「文档管理」
            bannerTitle () {
                return this.kbmc ? '知识库「' + this.kbmc + '」- 文档管理' : '文档管理'
            },

            // 批量导入进度汇总（百分比按已完成计）
            batchSummary () {
                const total = this.batchFiles.length
                let success = 0
                let failed = 0
                let uploading = 0
                this.batchFiles.forEach(f => {
                    if (f.status === 'success') success++
                    else if (f.status === 'failed') failed++
                    else if (f.status === 'uploading') uploading++
                })
                const completed = success + failed
                const percent = total ? Math.round((completed / total) * 100) : 0
                return { total, success, failed, uploading, completed, percent }
            },

            // iView Progress 状态：进行中 active / 全成功 success / 有失败 wrong
            batchProgressStatus () {
                if (!this.batchDone) return 'active'
                return this.batchSummary.failed > 0 ? 'wrong' : 'success'
            }
        },

        watch: {
            // 同组件复用时不走 mounted：query 里的知识库名变了就同步 kbmc，banner 标题随之更新
            // 内嵌模式下 query 无关，直接跳过（宿主通过 props 传知识库）
            '$route.query.kbmc' (v) {
                if (this.embedded) return
                this.kbmc = v ? String(v) : ''
            },

            // 内嵌模式：宿主在不重挂载的情况下切换知识库时，同步 props 到本地状态
            // （同名 data 遮蔽 prop，故直接监听 $props；kbmc 同步到 data，kbid 同步到检索条件并重查）
            '$props.kbmc' (v) {
                this.kbmc = v ? String(v) : ''
            },

            '$props.kbid' (v) {
                this.searchForm.kbid = v ? String(v) : ''
                this.pageNum = 1
                this.loadData()
            },

            // 取消确认时清理待执行回调，避免后续误触发
            'confirmation.visible' (visible) {
                if (!visible && !this.confirmation.loading) {
                    this.confirmation.action = null
                }
            }
        },

        mounted () {
            // 内嵌模式优先用宿主传入的 props；独立路由回退到 query（从知识库列表跳转而来时带 kbid/kbmc）
            const kbid = this.kbid || (this.$route.query.kbid ? String(this.$route.query.kbid) : '')
            if (kbid) this.searchForm.kbid = kbid
            const kbmc = this.kbmc || (this.$route.query.kbmc ? String(this.$route.query.kbmc) : '')
            if (kbmc) this.kbmc = kbmc
            this.loadKbMap()
            this.loadData()
            // 入场族：挂载后下一帧加 .is-view
            this.$nextTick(() => {
                this.isView = true
            })
        },

        methods: {
            // 加载知识库 id->名称 映射，供列表「所属知识库」列展示名称而非 id
            async loadKbMap () {
                try {
                    const list = await kbList()
                    const arr = Array.isArray(list) ? list : (list && list.list) || []
                    const map = {}
                    arr.forEach(k => {
                        if (k && k.id) map[k.id] = k.kbmc || k.id
                    })
                    this.kbMap = map
                } catch (e) {
                    // 加载失败不影响列表展示，列将回退显示 id
                }
            },

            // ---------- 查询（口径同 KbDocList）----------
            // 组装查询参数：仅携带非空筛选条件，避免空串干扰后端 <if> 判断
            buildQuery () {
                const q = { pageNum: this.pageNum, pageSize: this.pageSize }
                const s = this.searchForm
                if (s.kbid) q.kbid = s.kbid
                if (s.wjmc) q.wjmc = s.wjmc
                if (s.parsestatus) q.parsestatus = s.parsestatus
                if (s.chunkstatus) q.chunkstatus = s.chunkstatus
                return q
            },

            async loadData () {
                this.loading = true
                this.loadError = false
                try {
                    const res = await kbdocListPage(this.buildQuery())
                    // listPage 返回 PageHelper 的 PageInfo：{ list, total, pageNum, pageSize, pages, ... }
                    if (res && Array.isArray(res.list)) {
                        this.tableData = res.list
                        this.total = typeof res.total === 'number' ? res.total : res.list.length
                    } else if (Array.isArray(res)) {
                        this.tableData = res
                        this.total = res.length
                    } else {
                        this.tableData = []
                        this.total = 0
                    }
                } catch (e) {
                    // 响应拦截器已弹出错误提示，此处静默，只切到错误态
                    this.tableData = []
                    this.total = 0
                    this.loadError = true
                } finally {
                    this.loading = false
                    // 数据整批替换后 iView 不会回抛 on-selection-change，清掉上一页选中，避免批量删除误删旧数据
                    this.selectedIds = []
                }
            },

            handleSearch () {
                this.pageNum = 1
                this.loadData()
            },

            handleReset () {
                // kbid 由知识库列表页传入且不可改，重置时保留
                this.searchForm = { kbid: this.searchForm.kbid, wjmc: '', parsestatus: '', chunkstatus: '' }
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

            onSelectionChange (selection) {
                this.selectedIds = selection.map(r => r.id)
            },

            // 返回知识库列表：内嵌模式通知宿主切回列表（不碰路由）；独立路由保持原 push 行为（结果补 catch，吞重复导航错误）
            goBack () {
                if (this.embedded) {
                    this.$emit('back')
                    return
                }
                if (!this.$router) return
                if (this.$route && this.$route.path === '/portal/kb') return
                const result = this.$router.push({ path: '/portal/kb' })
                if (result && typeof result.catch === 'function') result.catch(() => {})
            },

            // ==================== 上传 ====================
            openUploadModal () {
                this.uploadForm = { kbid: this.searchForm.kbid || '', file: null }
                this.uploadVisible = true
                this.$nextTick(() => {
                    this.$refs.uploadForm && this.$refs.uploadForm.resetFields()
                })
            },

            // iView Upload before-upload：返回 false 阻止自动上传，仅暂存文件
            beforeUpload (file) {
                this.uploadForm.file = file
                return false
            },

            handleUpload () {
                // 文件字段为原生 File 对象，不走 iView Form 的声明式校验，在此手动校验
                if (!this.uploadForm.file) {
                    this.$Message.warning('请选择文档')
                    return
                }
                this.$refs.uploadForm.validate(async (valid) => {
                    if (!valid) return
                    this.uploading = true
                    try {
                        await kbdocUpload(this.uploadForm.kbid, this.uploadForm.file)
                        this.$Message.success('上传并解析成功')
                        this.uploadVisible = false
                        this.pageNum = 1
                        this.loadData()
                    } catch (e) {
                        this.$Message.error(e.message || '上传失败')
                    } finally {
                        this.uploading = false
                    }
                })
            },

            // ==================== 批量导入 ====================
            // 复用单文件 /kbdoc/upload 接口，前端串行逐个上传：Tika 解析+切片是 CPU/内存密集型，
            // 串行可避免并发解析大文档导致 OOM；每文件独立状态，失败不阻断后续。
            openBatchModal () {
                if (!this.searchForm.kbid) {
                    this.$Message.warning('请从知识库管理进入后再批量导入')
                    return
                }
                this.batchFiles = []
                this.batchUploading = false
                this.batchDone = false
                this.batchVisible = true
            },

            // iView Upload before-upload（multiple 多选时每文件触发一次）：返回 false 阻止自动上传，仅暂存
            onBatchFileSelected (file) {
                if (!file) return false
                if (file.size === 0) {
                    this.$Message.warning('「' + file.name + '」为空文件，已忽略')
                    return false
                }
                // 去重：同名+同大小+同修改时间视为同一文件
                const dup = this.batchFiles.some(f =>
                    f.file.name === file.name && f.file.size === file.size && f.file.lastModified === file.lastModified)
                if (!dup) {
                    this.batchFiles.push({
                        file, name: file.name, size: file.size,
                        status: 'wait', err: ''
                    })
                }
                return false
            },

            removeBatchFile (idx) {
                if (this.batchUploading) return
                this.batchFiles.splice(idx, 1)
            },

            clearBatchFiles () {
                if (this.batchUploading) return
                this.batchFiles = []
                this.batchDone = false
            },

            async handleBatchUpload () {
                const pending = this.batchFiles.filter(f => f.status === 'wait')
                if (!pending.length) {
                    this.$Message.warning('请先选择文档')
                    return
                }
                this.batchUploading = true
                this.batchDone = false
                for (const f of pending) {
                    f.status = 'uploading'
                    f.err = ''
                    try {
                        await kbdocUpload(this.searchForm.kbid, f.file)
                        f.status = 'success'
                    } catch (e) {
                        f.status = 'failed'
                        f.err = (e && e.message) || '上传失败'
                    }
                }
                this.batchUploading = false
                this.batchDone = true
                // 刷新列表以展示新导入的文档（成功的已落库；失败的可在弹窗内查看原因）
                this.pageNum = 1
                this.loadData()
                const s = this.batchSummary
                if (s.failed > 0) {
                    this.$Message.warning('批量导入完成：成功 ' + s.success + ' 个，失败 ' + s.failed + ' 个')
                } else {
                    this.$Message.success('批量导入完成：成功 ' + s.success + ' 个')
                }
            },

            closeBatchModal () {
                // 上传中禁止关闭，避免中断未完成的文件
                if (this.batchUploading) return
                this.batchVisible = false
            },

            batchStatusText (s) {
                return { wait: '等待', uploading: '上传中', success: '成功', failed: '失败' }[s] || s
            },

            batchStatusColor (s) {
                return { wait: 'default', uploading: 'processing', success: 'success', failed: 'error' }[s] || 'default'
            },

            // ==================== 文本 / 切片 ====================
            // 以弹窗形式打开切片管理，并带入该文档的 tikaid 作为 docid 过滤条件
            // （切片 t_ai_chunk.docid 取 tika.id，即 kbdoc.tikaid）
            goChunk (row) {
                if (!row.tikaid) {
                    this.$Message.warning('该文档尚未解析，暂无切片')
                    return
                }
                this.$refs.chunkList.open(row.tikaid)
            },

            async openTextModal (row) {
                if (!row.tikaid) {
                    this.$Message.warning('该文档尚未解析，无文本内容')
                    return
                }
                this.textVisible = true
                this.textContent = ''
                this.textLoading = true
                try {
                    // tikaid 关联 t_ai_tika，切片 docid 亦取 tikaid；
                    // 走 tika 详情接口取解析文本内容（tsnr）
                    const tika = await tikaGetBy({ id: row.tikaid })
                    this.textContent = (tika && tika.tsnr) || '（无文本内容）'
                } catch (e) {
                    this.$Message.error('加载文本内容失败')
                    this.textContent = ''
                } finally {
                    this.textLoading = false
                }
            },

            // ==================== 重新解析 / 删除（统一走门户确认弹窗）====================
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

            handleReparse (row) {
                this.confirmAction(
                    '确认重新解析',
                    '将清除该文档原有切片并重新解析、切片，是否继续？',
                    '重新解析',
                    'primary',
                    async () => {
                        this.reparseId = row.id
                        try {
                            await kbdocReparse({ id: row.id })
                            this.$Message.success('已触发重新解析')
                            this.loadData()
                        } catch (e) {
                            // 响应拦截器已弹出错误提示
                        } finally {
                            this.reparseId = ''
                        }
                        return true
                    }
                )
            },

            handleDelete (row) {
                this.confirmAction(
                    '确认删除',
                    '确定要删除该文档吗？其切片与解析记录将一并删除。',
                    '删除',
                    'error',
                    async () => {
                        try {
                            await kbdocDelete({ id: row.id })
                        } catch (e) {
                            // 响应拦截器已弹出错误提示
                            return false
                        }
                        this.$Message.success('删除成功')
                        // 删除当前页最后一条时回退一页
                        if (this.tableData.length === 1 && this.pageNum > 1) {
                            this.pageNum--
                        }
                        this.loadData()
                        return true
                    }
                )
            },

            handleBatchDelete () {
                if (!this.selectedIds.length) {
                    this.$Message.warning('请先选择要删除的文档')
                    return
                }
                const count = this.selectedIds.length
                this.confirmAction(
                    '确认批量删除',
                    '确定要删除选中的 ' + count + ' 个文档吗？其切片与解析记录将一并删除。',
                    '批量删除',
                    'error',
                    async () => {
                        try {
                            await kbdocBatchDelete(this.selectedIds)
                        } catch (e) {
                            // 响应拦截器已弹出错误提示
                            return false
                        }
                        this.$Message.success('批量删除成功')
                        // 删除当前页全部时回退一页
                        if (this.tableData.length === count && this.pageNum > 1) {
                            this.pageNum--
                        }
                        this.selectedIds = []
                        this.loadData()
                        return true
                    }
                )
            },

            // ==================== 工具 ====================
            statusText (s) {
                return { pending: '待处理', parsing: '解析中', parsed: '解析完成', chunking: '切片中',
                    chunked: '切片完成', failed: '失败' }[s] || s || '-'
            },

            statusColor (s) {
                return { pending: 'default', parsing: 'processing', parsed: 'success',
                    chunking: 'processing', chunked: 'success', failed: 'error' }[s] || 'default'
            },

            // 复用后台 statusColor 口径（default / processing / success / error），映射到门户标签形态：
            // 虚线灰=等待、朱底=进行中、红实线=完成、红虚线=失败（框型即语义，不单靠颜色）
            statusTone (s) {
                const c = this.statusColor(s)
                if (c === 'processing') return 'run'
                if (c === 'success') return 'done'
                if (c === 'error') return 'fail'
                return 'wait'
            },

            batchStatusTone (s) {
                const c = this.batchStatusColor(s)
                if (c === 'processing') return 'run'
                if (c === 'success') return 'done'
                if (c === 'error') return 'fail'
                return 'wait'
            },

            formatSize (bytes) {
                if (bytes == null) return '-'
                if (bytes < 1024) return bytes + ' B'
                if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
                if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
                return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB'
            }
        }
    }
</script>

<style scoped lang="less">
/* ══════════════════════════════════════════════════════════════
   门户文档管理页 · v3 规格
   token 全部来自 body.page-portal-v3（PortalLayout 持有）；
   .kbd-* 为本页私有前缀，iView 内部样式统一用 :global(.kbd-page …) /
   :global(.portal-kbd-modal …) 覆写（同 portal/kb 页的技法）。
   ══════════════════════════════════════════════════════════════ */

/* ── 页面骨架：让位固定顶栏（88px），底色沿用 body 的宣纸；
   全高 flex 列（portal/kb 同口径）：内容不足时页脚贴视口底 ── */
.kbd-page {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding-top: var(--header-h);
}

/* 内嵌模式：宿主面板已提供外框，去掉顶栏让位，也不做版心居中；
   min-height:0 覆盖 100dvh，避免面板被强制撑到整屏高、内容下方留大段空白 */
.kbd-page.is-embedded {
    padding-top: 0;
    max-width: none;
    margin: 0;
    min-height: 0;
}

/* ══ BANNER（220px 整高：含 3px 装订线，全局 border-box）════ */
.kbd-banner {
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
.kbd-banner::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    background: radial-gradient(ellipse 62% 130% at 86% 12%, var(--c-red-100), transparent 64%);
    pointer-events: none;
}

/* 纸纹发丝斜线（宣纸材质授权值） */
.kbd-banner::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 3;
    background: repeating-linear-gradient(115deg, transparent 0 14px, rgba(153, 42, 24, .05) 14px 15px);
    pointer-events: none;
}

/* ── 静态文案块：版心左对齐、220px 内垂直居中；层级压在纸纹之下（纸气盖字是刻意的） ── */
.kbd-banner-copy {
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
.kbd-kicker {
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

.kbd-title {
    margin: var(--s3) 0 0;
    font-family: var(--font-display);
    /* clamp 取 token 上下限：宽屏 40，窄屏自然收到 30，不引入手写 px */
    font-size: clamp(var(--text-2xl), 4vw, var(--text-3xl));
    font-weight: 700;
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

.kbd-sub {
    margin: var(--s3) 0 0;
    font-family: var(--font-display);
    font-size: var(--text-base);
    line-height: var(--leading-body);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink-2);
}

/* ══ 主体三段：全页唯一内衬（--max + --s6），一条左内容线；顶衬收薄，让工具区显紧凑 ══ */
.kbd-body {
    width: 100%;
    max-width: var(--max);
    margin: 0 auto;
    padding: var(--s6) var(--s6) var(--s16);
}

/* ── 段头公共语汇（「文档列表」头使用）── */
.kbd-h2 {
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

.kbd-sep {
    width: 24px;
    height: 24px;
    display: inline-grid;
    place-items: center;
    flex-shrink: 0;
    font-size: var(--text-base);
    color: var(--c-red-600);
    transition: transform .5s ease;
}

.kbd-list-head:hover .kbd-sep {
    transform: rotateY(180deg);
}

/* ── 屏幕阅读器专用文本：检索区可见标签已收起（单行排布需要），列表头的计数播报也复用本类 ── */
.kbd-sr-only {
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
.kbd-search {
    position: relative;
    padding: var(--s1) 0;
}

/* 桌面必须一行排完：nowrap + 控件定宽；窄屏断点里改纵向堆叠 */
.kbd-search-row {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--s3);
}

.kbd-field {
    display: flex;
    align-items: center;
    min-width: 0;
}

.kbd-field--name {
    flex: 0 1 340px;
    min-width: 220px;
}

.kbd-field--status {
    flex: 0 0 160px;
}

.kbd-search-acts {
    display: flex;
    flex: 0 0 auto;
    gap: var(--s2);
}

/* ══ 按钮（门户原生按钮语汇：衬线 + 宽字距，不走 iView 默认蓝；
   紧凑档：34px 高 / 12px 内距 / 12px 字号 —— 门户工具条统一触点口径） ══ */
.kbd-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--s2);
    min-height: 34px;
    padding: 0 var(--s3);
    background: var(--c-white);
    border: 1px solid var(--c-ink-2);
    border-radius: var(--r-sm);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink-2);
    white-space: nowrap;
    cursor: pointer;
    transition: background var(--t-fast), border-color var(--t-fast), color var(--t-fast);
}

.kbd-btn:hover {
    background: var(--c-paper-2);
    border-color: var(--c-ink);
    color: var(--c-ink);
}

.kbd-btn:active {
    background: var(--c-paper);
}

.kbd-btn--primary {
    background: var(--c-red-600);
    border-color: var(--c-red-600);
    color: var(--c-white);
}

.kbd-btn--primary:hover {
    background: var(--c-red-700);
    border-color: var(--c-red-700);
    color: var(--c-white);
}

/* 破坏性动作：红虚线框（框型即语义，不只靠颜色） */
.kbd-btn--danger {
    background: var(--c-white);
    border: 1px dashed var(--c-red-600);
    color: var(--c-red-600);
}

.kbd-btn--danger:hover {
    background: var(--c-red-100);
    border-style: solid;
    border-color: var(--c-red-600);
    color: var(--c-red-700);
}

/* 空态 / 错误态的出口是独立 CTA，横向稍加宽（与工具条 34px 同高） */
.kbd-state-acts .kbd-btn {
    padding: 0 var(--s4);
}

/* ══ (b-2) 操作丝带：上下发丝虚线，不做第三张白卡；紧凑单行，与检索带同高同线 ══ */
.kbd-acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s2) var(--s3);
    margin-top: var(--s3);
    padding: var(--s2) 0;
    border-top: 1px dashed rgba(153, 42, 24, .25);
    border-bottom: 1px dashed rgba(153, 42, 24, .25);
}

.kbd-acts-main {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s2);
}

/* 批量删除进出场：透明度 + 轻微左移；右侧是空位，不会挤动左侧按钮 */
.kbd-batch-enter-active,
.kbd-batch-leave-active {
    transition: opacity var(--t-fast), translate var(--t-fast);
}

.kbd-batch-enter-from,
.kbd-batch-leave-to {
    opacity: 0;
    translate: -8px 0;
}

/* ══ (b-3) 列表段 ══ */
.kbd-list {
    margin-top: var(--s6);
}

.kbd-list-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--s2) var(--s4);
    margin-bottom: var(--s4);
}

/* 加载 / 错误 / 空态 / 数据表共用容器：最小高度压住状态切换时的几何跳动 */
.kbd-table-wrap {
    position: relative;
    min-height: 360px;
}

/* 状态切换淡入淡出（skeleton → data / empty / error 之间平滑过渡） */
.kbd-fade-enter-active,
.kbd-fade-leave-active {
    transition: opacity var(--t-base), transform var(--t-base);
}

.kbd-fade-enter-from {
    opacity: 0;
    transform: translateY(12px);
}

.kbd-fade-leave-to {
    opacity: 0;
}

/* ── 骨架：结构镜像真表（表头带 + 6 行），换页不塌不跳 ── */
.kbd-sk {
    overflow: hidden;
    background: var(--c-white);
    border: 1px solid var(--c-border);
}

.kbd-sk-row {
    display: grid;
    /* 列宽比例对齐真表（选择 / 文件名 / 知识库 / 大小 / 解析 / 切片 / 数量 / 操作），
       除选择列外全部用 minmax(0,fr)：窄一点的桌面宽度下只压缩、不横向溢出 */
    grid-template-columns: 44px minmax(0, 2.6fr) minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1.1fr) minmax(0, 1.1fr) minmax(0, .9fr) minmax(0, 3.4fr);
    align-items: center;
    gap: var(--s4);
    height: 56px;
    padding: 0 var(--s4);
    border-bottom: 1px solid var(--c-border);
}

.kbd-sk-row:last-child {
    border-bottom: 0;
}

.kbd-sk-row--head {
    height: 48px;
    background: var(--c-paper-2);
    border-bottom: 2px solid var(--c-red-600);
}

.kbd-sk-line {
    display: block;
    height: var(--s3);
    background: var(--c-paper);
    border-radius: var(--r-sm);
}

.kbd-sk-row--head .kbd-sk-line {
    background: var(--c-red-100);
}

.kbd-sk-line.is-pick {
    width: 16px;
    height: 16px;
    margin: 0 auto;
    border: 1px dashed var(--c-red-600);
    background: var(--c-white);
}

.kbd-sk-line.is-name { width: 62%; }
.kbd-sk-line.is-kb { width: 70%; }
.kbd-sk-line.is-size { width: 56%; }
.kbd-sk-line.is-parse { width: 76%; }
.kbd-sk-line.is-chunk { width: 76%; }
.kbd-sk-line.is-num { width: 50%; }
.kbd-sk-line.is-act { width: 72%; }

/* ── 空态 / 错误态：CSS 印章 + 一行文案 + 一个出口，不留大空白 ── */
.kbd-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--s3);
    min-height: 360px;
    padding: var(--s10) var(--s6);
    background: var(--c-white);
    border: 1px dashed var(--c-border);
    text-align: center;
}

.kbd-seal {
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

.kbd-seal::after {
    content: '';
    position: absolute;
    inset: calc(var(--s2) * -1);
    border: 1px dashed var(--c-red-600);
    border-radius: var(--r-full);
    pointer-events: none;
    transition: transform .5s ease;
}

.kbd-state:hover .kbd-seal::after {
    transform: rotateY(180deg);
}

.kbd-state-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xl);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

.kbd-state-text {
    margin: 0;
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--c-ink-2);
}

.kbd-state-acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--s3);
    margin-top: var(--s2);
}

/* ── 分页行 ── */
.kbd-pager {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--s5);
}

/* ══ 页脚：视觉规格在共享组件 PortalFooter，本页只留布局——
   margin-top:auto 吸收余量（.kbd-page flex 列 + min-height 才钉得住）══ */
.panel-footer-bar {
    margin-top: auto;
}

/* ══ 单元格内容（Table slot 内，父作用域可及）═══ */
.kbd-name {
    display: block;
    /* 右侧预留 8px：悬停右移 8px 后正好不被 ellipsis 裁到 */
    max-width: calc(100% - var(--s2));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-body);
    color: var(--c-ink);
    transition: translate var(--t-base);
}

.kbd-kb {
    color: var(--c-muted);
}

.kbd-size {
    font-variant-numeric: tabular-nums;
    color: var(--c-ink);
}

/* ── 状态标签：沿用门户「框型即语义」纪律（虚线灰=等待 / 朱底=进行中 / 红实线=完成 / 红虚线=失败）── */
.kbd-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 26px;
    padding: 0 var(--s3);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    white-space: nowrap;
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: var(--r-full);
    color: var(--c-muted);
}

.kbd-tag.is-wait {
    border-style: dashed;
    color: var(--c-muted);
}

.kbd-tag.is-run {
    background: var(--c-red-100);
    border-color: var(--c-red-600);
    color: var(--c-red-700);
}

.kbd-tag.is-done {
    border-color: var(--c-red-600);
    color: var(--c-red-600);
}

.kbd-tag.is-fail {
    border-style: dashed;
    border-color: var(--c-red-600);
    color: var(--c-red-600);
}

/* ── 操作列：四个独立触点，44px 高，衬线宽字距 ── */
.kbd-act-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--s1);
}

.kbd-act {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--s1);
    min-height: 44px;
    padding: 0 var(--s2);
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

.kbd-act:hover {
    background: var(--c-red-100);
    color: var(--c-red-700);
}

/* 重新解析进行中：按钮禁用，悬停不再给反馈底 */
.kbd-act:disabled,
.kbd-act:disabled:hover {
    cursor: default;
    opacity: .6;
    background: transparent;
    color: var(--c-ink-2);
}

/* 切片管理是主动作：绛红 + 金下划线只走图形通道（门户纪律：金不做小字） */
.kbd-act--main {
    color: var(--c-red-600);
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 3px;
    transition: background var(--t-fast), color var(--t-fast), text-decoration-color var(--t-fast);
}

.kbd-act--del {
    color: var(--c-red-500);
}

@media (hover: hover) {
    .kbd-act--main:hover {
        text-decoration-color: var(--c-gold-500);
    }

    /* 列表行「拿起」感：悬停时文件名右移 8px（幅度 ≤8px，只动 translate 通道） */
    .ivu-table-row-hover .kbd-name {
        translate: var(--s2) 0;
    }
}

/* 重新解析进行中的小转环（功能性加载指示，不属装饰动画） */
.kbd-act-spin {
    width: 12px;
    height: 12px;
    border: 2px solid var(--c-red-100);
    border-top-color: var(--c-red-600);
    border-radius: var(--r-full);
    animation: kbd-spin .8s linear infinite;
}

@keyframes kbd-spin {
    to {
        transform: rotate(360deg);
    }
}

/* ══ 弹窗内自有片段（Modal transfer 到 body，但内容仍是本组件插槽，带本作用域）═══ */
.kbd-chosen {
    display: flex;
    align-items: center;
    gap: var(--s2);
    min-height: 34px;
    margin-top: var(--s2);
    color: var(--c-ink-2);
    font-size: var(--text-sm);
}

.kbd-chosen-name {
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--c-ink);
}

.kbd-chosen-size {
    color: var(--c-muted);
    font-size: var(--text-xs);
    flex-shrink: 0;
}

.kbd-tip {
    margin-top: var(--s2);
    color: var(--c-muted);
    font-size: var(--text-xs);
    line-height: var(--leading-body);
}

/* 弹窗内的文字动作（移除 / 清空一类）：红字紧凑触点 */
.kbd-link {
    min-height: 34px;
    padding: 0 var(--s2);
    background: transparent;
    border: 0;
    border-radius: var(--r-sm);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink-2);
    cursor: pointer;
    transition: background var(--t-fast), color var(--t-fast);
}

.kbd-link:hover {
    background: var(--c-red-100);
    color: var(--c-red-700);
}

.kbd-link--del {
    color: var(--c-red-500);
}

/* 批量导入文件列表 */
.kbd-batch-files {
    max-height: 280px;
    overflow-y: auto;
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
}

.kbd-bf {
    display: flex;
    align-items: center;
    gap: var(--s2);
    min-height: 36px;
    padding: var(--s1) var(--s3);
    border-bottom: 1px solid var(--c-border);
    color: var(--c-muted);
}

.kbd-bf:last-child {
    border-bottom: 0;
}

.kbd-bf:hover {
    background: var(--c-paper-2);
}

.kbd-bf-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--c-ink);
    font-size: var(--text-sm);
}

.kbd-bf-size {
    flex-shrink: 0;
    color: var(--c-muted);
    font-size: var(--text-xs);
    font-variant-numeric: tabular-nums;
}

.kbd-bf-err {
    flex-shrink: 0;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--c-red-500);
    font-size: var(--text-xs);
}

.kbd-batch-progress {
    margin-top: var(--s3);
}

.kbd-batch-progress-text {
    display: block;
    margin-top: var(--s2);
    color: var(--c-muted);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
}

/* 文本弹窗：给 Spin fix 一个定位祖先 */
.kbd-text-wrap {
    position: relative;
}

/* ══ 入场族：opacity 0→1 + translateY(28px→0)，0.7s ══
   区块走 data-delay 四档；位移只在 transform 通道，悬停用 translate 通道，互不抢占 */
.effect {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity .7s ease, transform .7s ease;
}

.kbd-page.is-view .effect {
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

/* ══════════════════════════════════════════════════════════════
   View UI Plus 表格换皮（:global 限定在本页类名之下，不外溢）
   衬线表头 + 绛红装订线 + 宣纸行分隔 + 红渐变悬停行，全页零蓝色
   ══════════════════════════════════════════════════════════════ */

/* 外框：发丝描边 + 白底（1px 盒子即表格的上下左右边界） */
:global(.kbd-page .ivu-table-wrapper-with-border) {
    border: 1px solid var(--c-border);
    background: var(--c-white);
}

/* 库自带的表底 / 右缘补线与外框重叠成 2px，直接关掉，交给上面的 1px 盒子；
   固定列副本表的底缘线同理（与外框底边同位） */
:global(.kbd-page .ivu-table::before),
:global(.kbd-page .ivu-table.ivu-table-border::after),
:global(.kbd-page .ivu-table-fixed::before),
:global(.kbd-page .ivu-table-fixed-right::before) {
    display: none;
}

/* 固定操作列的投影压到宣纸调 */
:global(.kbd-page .ivu-table-fixed-right.ivu-table-fixed-shadow) {
    box-shadow: -2px 0 6px -2px rgba(26, 20, 16, .14);
}

/* 表头：宣纸底 + 衬线宽字距 + 绛红装订线 */
:global(.kbd-page .ivu-table th) {
    height: 48px;
    background: var(--c-paper-2);
    border-bottom: 2px solid var(--c-red-600);
    color: var(--c-ink);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 700;
    letter-spacing: var(--tracking-wide);
}

/* 单元格：白底 + 发丝分隔，行高留出 44px 触点 */
:global(.kbd-page .ivu-table td) {
    height: 56px;
    background: var(--c-white);
    border-bottom: 1px solid var(--c-border);
    color: var(--c-ink-2);
    font-size: var(--text-sm);
}

/* 竖线（border 属性）：末列不再画，交给外框 */
:global(.kbd-page .ivu-table.ivu-table-border th),
:global(.kbd-page .ivu-table.ivu-table-border td) {
    border-right: 1px solid var(--c-border);
}

:global(.kbd-page .ivu-table.ivu-table-border th:last-child),
:global(.kbd-page .ivu-table.ivu-table-border td:last-child) {
    border-right: 0;
}

/* 固定操作列表头带：与主表头同底同线，不出现灰色浮条 */
:global(.kbd-page .ivu-table-fixed-right-header) {
    background-color: var(--c-paper-2);
    border-top: 0;
    border-bottom: 2px solid var(--c-red-600);
}

/* 悬停行：主表左起红渐变（td 透出 tr 的底），固定操作列副本表用同色系单色淡红衔接 */
:global(.kbd-page .ivu-table tr.ivu-table-row-hover td) {
    background-color: transparent;
}

:global(.kbd-page .ivu-table tr.ivu-table-row-hover) {
    background-image: linear-gradient(90deg, var(--c-red-100) 0%, rgba(153, 42, 24, 0) 78%);
}

:global(.kbd-page .ivu-table-fixed-right tr.ivu-table-row-hover),
:global(.kbd-page .ivu-table-fixed-right tr.ivu-table-row-hover td) {
    background-color: var(--c-red-100);
    background-image: none;
}

/* 单元格内衬与对齐 */
:global(.kbd-page .ivu-table .ivu-table-cell) {
    line-height: var(--leading-tight);
}

/* 选择列：收窄内衬，给 44×44 触点让位 */
:global(.kbd-page .ivu-table .ivu-table-cell-with-selection) {
    padding-left: var(--s1);
    padding-right: var(--s1);
}

/* 多选框：44×44 触点 + 绛红选中态 + 键盘金环（压过库自带的 outline:0） */
:global(.kbd-page .ivu-checkbox-wrapper) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin: 0;
    line-height: normal;
    font-size: var(--text-sm);
    vertical-align: middle;
    cursor: pointer;
}

:global(.kbd-page .ivu-checkbox-checked .ivu-checkbox-inner) {
    background: var(--c-red-600);
    border-color: var(--c-red-600);
}

:global(.kbd-page .ivu-checkbox-inner) {
    border-color: var(--c-border);
    transition: border-color var(--t-fast), background var(--t-fast);
}

:global(.kbd-page .ivu-checkbox:hover .ivu-checkbox-inner) {
    border-color: var(--c-red-600);
}

:global(.kbd-page .ivu-checkbox-input:focus-visible + .ivu-checkbox-inner) {
    outline: 2px solid var(--c-ring);
    outline-offset: 3px;
}

/* 库自带的聚焦光圈是 20% 主题蓝，换成 token 金环 */
:global(.kbd-page .ivu-checkbox-focus) {
    box-shadow: 0 0 0 2px var(--c-ring);
}

/* ══ 检索区控件（输入框 / 下拉，页内非 transfer）：34px 紧凑档 ══
   注意只限定 input 元素：切片管理弹窗（AiChunkList，未 transfer）也挂在本页之下，
   那里的 textarea 不吃这里的 34px 定高，避免被压扁 */
:global(.kbd-page input.ivu-input) {
    height: 34px;
    padding: 0 var(--s3);
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    color: var(--c-ink);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    transition: border-color var(--t-fast), box-shadow var(--t-fast);
}

:global(.kbd-page input.ivu-input:hover) {
    border-color: var(--c-red-600);
}

:global(.kbd-page input.ivu-input:focus) {
    border-color: var(--c-red-600);
    box-shadow: none;
}

/* 键盘焦点金环（压过库自带的 outline:0） */
:global(.kbd-page input.ivu-input:focus-visible) {
    outline: 2px solid var(--c-ring);
    outline-offset: 3px;
}

:global(.kbd-page input.ivu-input::placeholder) {
    color: var(--c-muted);
}

/* 清除图标占位（库自带的右内距会被上面的基础规则盖掉，这里补回 24px：够图标位又不显宽） */
:global(.kbd-page .ivu-input-icon-normal + input.ivu-input) {
    padding-right: var(--s6);
}

:global(.kbd-page .ivu-input-wrapper) {
    width: 100%;
}

:global(.kbd-page .ivu-input-icon) {
    color: var(--c-muted);
}

:global(.kbd-page .ivu-input-icon:hover) {
    color: var(--c-red-600);
}

:global(.kbd-page .ivu-select) {
    width: 100%;
}

:global(.kbd-page .ivu-select .ivu-select-selection) {
    height: 34px;
    display: flex;
    align-items: center;
    padding: 0 var(--s6) 0 var(--s3);
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    color: var(--c-ink);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    transition: border-color var(--t-fast), box-shadow var(--t-fast);
}

:global(.kbd-page .ivu-select .ivu-select-selection:hover) {
    border-color: var(--c-red-600);
}

:global(.kbd-page .ivu-select-visible .ivu-select-selection) {
    border-color: var(--c-red-600);
    box-shadow: none;
    outline: 0;
}

:global(.kbd-page .ivu-select .ivu-select-selection:focus-visible) {
    outline: 2px solid var(--c-ring);
    outline-offset: 3px;
}

:global(.kbd-page .ivu-select .ivu-select-placeholder) {
    color: var(--c-muted);
    flex: 1;
    min-width: 0;
}

:global(.kbd-page .ivu-select .ivu-select-selected-value) {
    color: var(--c-ink);
    flex: 1;
    min-width: 0;
}

:global(.kbd-page .ivu-select .ivu-select-arrow) {
    color: var(--c-muted);
}

:global(.kbd-page .ivu-select-dropdown) {
    padding: var(--s1) 0;
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    box-shadow: var(--shadow-md);
}

:global(.kbd-page .ivu-select-item) {
    display: flex;
    align-items: center;
    min-height: 36px;
    padding: 0 var(--s4);
    color: var(--c-ink-2);
    font-family: var(--font-body);
    transition: background var(--t-fast), color var(--t-fast);
}

:global(.kbd-page .ivu-select-item:hover),
:global(.kbd-page .ivu-select-item:focus) {
    background: var(--c-red-100);
    color: var(--c-red-600);
}

:global(.kbd-page .ivu-select-item-selected),
:global(.kbd-page .ivu-select-item-selected:hover) {
    background: var(--c-red-100);
    color: var(--c-red-600);
    font-weight: 600;
}

/* ══ 分页：34 紧凑触点 + 绛红当前页，切 flex 允许换行（禁止横向滚动） ══ */
:global(.kbd-page .ivu-page) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--s2);
    max-width: 100%;
    font-family: var(--font-body);
}

:global(.kbd-page .ivu-page-total) {
    height: auto;
    line-height: normal;
    margin-right: 0;
    color: var(--c-muted);
    font-size: var(--text-sm);
}

:global(.kbd-page .ivu-page-item),
:global(.kbd-page .ivu-page-item-jump-prev),
:global(.kbd-page .ivu-page-item-jump-next),
:global(.kbd-page .ivu-page-prev),
:global(.kbd-page .ivu-page-next) {
    min-width: 34px;
    height: 34px;
    line-height: 32px;
    margin-right: 0;
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: var(--r-sm);
    color: var(--c-ink-2);
    font-family: var(--font-display);
    transition: background var(--t-fast), border-color var(--t-fast), color var(--t-fast);
}

:global(.kbd-page .ivu-page-item a),
:global(.kbd-page .ivu-page-item-jump-prev a),
:global(.kbd-page .ivu-page-item-jump-next a),
:global(.kbd-page .ivu-page-prev a),
:global(.kbd-page .ivu-page-next a) {
    color: inherit;
    line-height: inherit;
}

:global(.kbd-page .ivu-page-item:hover),
:global(.kbd-page .ivu-page-item-jump-prev:hover),
:global(.kbd-page .ivu-page-item-jump-next:hover),
:global(.kbd-page .ivu-page-prev:hover),
:global(.kbd-page .ivu-page-next:hover) {
    border-color: var(--c-red-600);
    color: var(--c-red-600);
}

:global(.kbd-page .ivu-page-item-active),
:global(.kbd-page .ivu-page-item-active:hover) {
    background: var(--c-red-600);
    border-color: var(--c-red-600);
    color: var(--c-white);
}

:global(.kbd-page .ivu-page-item-active a),
:global(.kbd-page .ivu-page-item-active:hover a) {
    color: var(--c-white);
}

:global(.kbd-page .ivu-page-item-jump-prev),
:global(.kbd-page .ivu-page-item-jump-next) {
    color: var(--c-muted);
}

:global(.kbd-page .ivu-page-options) {
    margin-left: 0;
}

:global(.kbd-page .ivu-page-options .ivu-select-selection) {
    height: 34px;
}

/* ══ 弹窗换皮：PortalConfirmModal / portal-kb 同款 class-name 技法 ══ */
:global(.portal-kbd-modal) {
    padding: var(--s6);
    font-family: var(--font-body);
}

:global(.portal-kbd-modal .ivu-modal) {
    max-width: 100%;
    margin: 0 auto;
    top: 8vh;
}

:global(.portal-kbd-modal .ivu-modal-content) {
    overflow: hidden;
    background: var(--c-paper-2);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    box-shadow: var(--shadow-lg);
}

:global(.portal-kbd-modal .ivu-modal-header) {
    padding: var(--s5) var(--s6) var(--s4);
    border-bottom: 1px solid var(--c-border);
    background: transparent;
}

:global(.portal-kbd-modal .ivu-modal-header-inner) {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

:global(.portal-kbd-modal .ivu-modal-close) {
    width: 36px;
    height: 36px;
    top: var(--s1);
    right: var(--s1);
    display: grid;
    place-items: center;
    color: var(--c-muted);
    transition: color var(--t-fast);
}

:global(.portal-kbd-modal .ivu-modal-close:hover) {
    color: var(--c-red-600);
}

:global(.portal-kbd-modal .ivu-modal-body) {
    padding: var(--s5) var(--s6) var(--s6);
}

/* 表单标签：衬线 + 左对齐，纵向对齐 34px 字段 */
:global(.portal-kbd-modal .ivu-form-item-label) {
    padding: var(--s3) var(--s3) var(--s3) 0;
    text-align: left;
    font-family: var(--font-display);
    font-size: var(--text-sm);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink-2);
}

:global(.portal-kbd-modal .ivu-form-item) {
    margin-bottom: var(--s4);
}

:global(.portal-kbd-modal .ivu-form-item-content) {
    line-height: normal;
    font-size: var(--text-sm);
}

:global(.portal-kbd-modal .ivu-form-item-error-tip) {
    font-size: var(--text-xs);
    color: var(--c-red-500);
}

/* 必填星号走 token 红（库默认色不在 v3 调色板内） */
:global(.portal-kbd-modal .ivu-form-item-required:before) {
    color: var(--c-red-500);
}

:global(.portal-kbd-modal input.ivu-input) {
    height: 34px;
}

:global(.portal-kbd-modal .ivu-input) {
    padding: 0 var(--s3);
    background: var(--c-white);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    color: var(--c-ink);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    transition: border-color var(--t-fast), box-shadow var(--t-fast);
}

:global(.portal-kbd-modal .ivu-input:hover) {
    border-color: var(--c-red-600);
}

:global(.portal-kbd-modal .ivu-input:focus) {
    border-color: var(--c-red-600);
    box-shadow: none;
}

:global(.portal-kbd-modal .ivu-input:focus-visible) {
    outline: 2px solid var(--c-ring);
    outline-offset: 3px;
}

:global(.portal-kbd-modal .ivu-input::placeholder) {
    color: var(--c-muted);
}

:global(.portal-kbd-modal textarea.ivu-input) {
    padding: var(--s2) var(--s3);
    line-height: var(--leading-body);
    resize: vertical;
}

:global(.portal-kbd-modal .ivu-form-item-error .ivu-input),
:global(.portal-kbd-modal .ivu-form-item-error .ivu-select-selection) {
    border-color: var(--c-red-500);
}

/* 禁用字段：宣纸底 + 墨字，不用库自带的浅灰 */
:global(.portal-kbd-modal .ivu-input[disabled]) {
    background: var(--c-paper);
    color: var(--c-ink-2);
    cursor: not-allowed;
}

/* 弹窗内 Upload / Form 的行内按钮（选择文档一类） */
:global(.portal-kbd-modal .ivu-upload) {
    display: inline-block;
}

/* 弹窗动作行 */
:global(.portal-kbd-modal__foot) {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--s3);
    margin-top: var(--s5);
    padding-top: var(--s4);
    border-top: 1px dashed rgba(153, 42, 24, .25);
}

:global(.portal-kbd-modal .ivu-btn) {
    min-width: 84px;
    min-height: 34px;
    margin: 0;
    padding: 0 var(--s3);
    border-radius: var(--r-sm);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    box-shadow: none;
    transition: background var(--t-fast), border-color var(--t-fast), color var(--t-fast);
}

:global(.portal-kbd-modal .ivu-btn:focus-visible) {
    outline: 2px solid var(--c-ring);
    outline-offset: 3px;
}

:global(.portal-kbd-modal .ivu-btn:not(.ivu-btn-primary):not(.ivu-btn-error)) {
    background: var(--c-white);
    border-color: var(--c-ink-2);
    color: var(--c-ink-2);
}

:global(.portal-kbd-modal .ivu-btn:not(.ivu-btn-primary):not(.ivu-btn-error):hover) {
    background: var(--c-paper);
    border-color: var(--c-ink);
    color: var(--c-ink);
}

:global(.portal-kbd-modal .ivu-btn-primary) {
    background: var(--c-red-600);
    border-color: var(--c-red-600);
    color: var(--c-white);
}

:global(.portal-kbd-modal .ivu-btn-primary:hover) {
    background: var(--c-red-700);
    border-color: var(--c-red-700);
    color: var(--c-white);
}

:global(.portal-kbd-modal .ivu-btn-error) {
    background: transparent;
    border-color: var(--c-red-600);
    color: var(--c-red-600);
}

:global(.portal-kbd-modal .ivu-btn-error:not(.ivu-btn-disabled):not(.ivu-btn-loading):hover) {
    background: var(--c-red-100);
    color: var(--c-red-700);
}

/* 进度条：绛红条 + 宣纸槽 */
:global(.portal-kbd-modal .ivu-progress-inner) {
    background-color: var(--c-paper);
    border-radius: var(--r-full);
}

:global(.portal-kbd-modal .ivu-progress-bg) {
    background-color: var(--c-red-600);
    border-radius: var(--r-full);
}

:global(.portal-kbd-modal .ivu-progress-success .ivu-progress-bg) {
    background-color: var(--c-red-600);
}

:global(.portal-kbd-modal .ivu-progress-wrong .ivu-progress-bg) {
    background-color: var(--c-red-500);
}

:global(.portal-kbd-modal .ivu-progress-text) {
    color: var(--c-muted);
    font-size: var(--text-xs);
}

:global(.portal-kbd-modal .ivu-progress-success .ivu-progress-text) {
    color: var(--c-red-600);
}

:global(.portal-kbd-modal .ivu-progress-wrong .ivu-progress-text) {
    color: var(--c-red-500);
}

/* 加载遮罩：转点与文案同走 token 红 */
:global(.portal-kbd-modal .ivu-spin) {
    color: var(--c-red-600);
}

:global(.portal-kbd-modal .ivu-spin-dot) {
    background-color: var(--c-red-600);
}

/* ══════════════════════════════════════════════════════════════
   后台原件回流：切片管理弹窗（AiChunkList）未 transfer，整棵挂在本页之下。
   该组件不在本次改动范围（不改它自身文件），这里只在本页内做配色兜底，
   保证页内不出现后台蓝。
   ══════════════════════════════════════════════════════════════ */

/* 弹窗框架：与 portal-kbd-modal 同一视觉（宣纸底 + 发丝描边 + 衬线标题） */
:global(.kbd-page .ivu-modal-content) {
    overflow: hidden;
    background: var(--c-paper-2);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    box-shadow: var(--shadow-lg);
}

:global(.kbd-page .ivu-modal-header) {
    padding: var(--s5) var(--s6) var(--s4);
    border-bottom: 1px solid var(--c-border);
    background: transparent;
}

:global(.kbd-page .ivu-modal-header-inner) {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink);
}

:global(.kbd-page .ivu-modal-close) {
    width: 36px;
    height: 36px;
    top: var(--s1);
    right: var(--s1);
    display: grid;
    place-items: center;
    color: var(--c-muted);
}

:global(.kbd-page .ivu-modal-close:hover) {
    color: var(--c-red-600);
}

:global(.kbd-page .ivu-modal-body) {
    padding: var(--s5) var(--s6) var(--s6);
}

/* 按钮：衬线宽字距 + 34px 紧凑触点 + token 边色 */
:global(.kbd-page .ivu-btn) {
    min-height: 34px;
    border-radius: var(--r-sm);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    box-shadow: none;
}

:global(.kbd-page .ivu-btn:not(.ivu-btn-primary):not(.ivu-btn-error)) {
    background: var(--c-white);
    border-color: var(--c-ink-2);
    color: var(--c-ink-2);
}

:global(.kbd-page .ivu-btn:not(.ivu-btn-primary):not(.ivu-btn-error):hover) {
    background: var(--c-paper-2);
    border-color: var(--c-ink);
    color: var(--c-ink);
}

:global(.kbd-page .ivu-btn-primary) {
    background: var(--c-red-600);
    border-color: var(--c-red-600);
    color: var(--c-white);
}

:global(.kbd-page .ivu-btn-primary:hover) {
    background: var(--c-red-700);
    border-color: var(--c-red-700);
    color: var(--c-white);
}

:global(.kbd-page .ivu-btn-error) {
    background: var(--c-red-600);
    border-color: var(--c-red-600);
    color: var(--c-white);
}

:global(.kbd-page .ivu-btn-error:hover) {
    background: var(--c-red-700);
    border-color: var(--c-red-700);
    color: var(--c-white);
}

/* 后台文本按钮把颜色写死在行内样式里（含 #2d8cf0），行内优先级最高，
   只能在本页用 !important 拉回门户色：正文墨色，悬停绛红 */
:global(.kbd-page .ivu-btn-text) {
    color: var(--c-ink-2) !important;
}

:global(.kbd-page .ivu-btn-text:hover) {
    color: var(--c-red-600) !important;
}

:global(.kbd-page .ivu-btn-text[disabled]) {
    color: var(--c-muted) !important;
}

/* 后台状态标签 color="blue" 走 class（非行内），换到朱底红框 */
:global(.kbd-page .ivu-tag-blue),
:global(.kbd-page .ivu-tag-blue .ivu-tag-text) {
    background: var(--c-red-100);
    border-color: var(--c-red-600);
    color: var(--c-red-700);
}

:global(.kbd-page .ivu-tag-blue) {
    height: 26px;
    line-height: 24px;
    border-radius: var(--r-full);
    font-family: var(--font-display);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
}

/* ══ 唯一宽度断点 996 ══ */
@media (max-width: 996px) {
    .kbd-banner-copy {
        padding: 0 var(--s4);
    }

    .kbd-sub {
        font-size: var(--text-sm);
    }

    .kbd-body {
        padding-inline: var(--s4);
    }

    /* 窄屏放弃单行：检索行纵向堆叠，字段与按钮通栏（单行只承诺桌面宽度） */
    .kbd-search {
        padding: var(--s2) 0;
    }

    .kbd-search-row {
        flex-direction: column;
        align-items: stretch;
    }

    .kbd-field--name,
    .kbd-field--status {
        flex: 1 1 auto;
        min-width: 0;
        width: 100%;
    }

    .kbd-search-acts {
        width: 100%;
    }

    .kbd-search-acts .kbd-btn {
        flex: 1;
    }

    /* 操作丝带：按钮各占半宽、允许换行，不产生横向溢出 */
    .kbd-acts-main {
        width: 100%;
    }

    .kbd-acts-main .kbd-btn {
        flex: 1 1 auto;
    }

    /* 骨架收成 5 段：选择 / 文件名 / 解析 / 切片 / 操作（fr 收缩，永不横向溢出） */
    .kbd-sk-row {
        grid-template-columns: 40px minmax(0, 2.6fr) minmax(0, 1.1fr) minmax(0, 1.1fr) minmax(0, 3fr);
    }

    .kbd-sk-row > :nth-child(3),
    .kbd-sk-row > :nth-child(4),
    .kbd-sk-row > :nth-child(7) {
        display: none;
    }

    .kbd-pager {
        justify-content: center;
    }

    /* 弹窗在窄屏收内衬，给字段多留宽度 */
    :global(.portal-kbd-modal) {
        padding: var(--s4);
    }

    :global(.portal-kbd-modal .ivu-modal) {
        top: 4vh;
    }
}

/* ══ 动效降级：入场 / 位移 / 过渡全量直出 ══ */
@media (prefers-reduced-motion: reduce) {

    .effect,
    .kbd-page.is-view .effect {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
    }

    .kbd-fade-enter-active,
    .kbd-fade-leave-active,
    .kbd-batch-enter-active,
    .kbd-batch-leave-active {
        transition: none;
    }

    .kbd-fade-enter-from,
    .kbd-batch-enter-from,
    .kbd-batch-leave-to {
        transform: none;
        translate: none;
    }

    .kbd-name,
    .kbd-act,
    .kbd-btn,
    .kbd-link,
    .kbd-sep,
    .kbd-seal::after {
        transition: none;
    }

    .ivu-table-row-hover .kbd-name {
        translate: none;
    }

    .kbd-list-head:hover .kbd-sep,
    .kbd-state:hover .kbd-seal::after {
        transform: none;
    }
}
</style>
