// 智能体门户路由（/portal/*）—— 门户路由的唯一维护点（此前散落在 routes.js 内联块与
// agent-routes.js，已合并到本文件；agent-routes.js 保留文件但已在 routes.js 中注释停用）。
//
// 约定：
// - /portal 为一级父路由（component = PortalShell：公共顶栏 + v3 主题层 + 二级出口），
//   其余门户页面是它的二级子路由；子路由用绝对路径书写（Vue Router 4 允许），
//   全路径与改造前一致，页面内的 $route.path / 按 name 跳转均不受影响。
//   这样页间互切时壳不重建，body.page-portal-v3 只随进出门户区增删。
// - iframe 嵌入页（/portal/agents/embed）与工作流编辑页（/portal/workflows/edit/:id?）必须留在壳外，
//   故与父路由平级：
//   · embed 无顶栏且免登录；
//   · 编辑页是全屏编排器（WorkflowManage 自带工具栏 / 画布，没有为固定顶栏预留 --header-h 内衬），
//     套 PortalShell 会让门户顶栏压住它的工具栏，因此作为独立页面路由注册。
// - 静态路径先于带参数路径（/portal/workflows/create 先于 /portal/workflows/:id/canvas）。
// - 门户首页 /portal/home 与智能体广场 /portal/agents 免登录（auth: false）：未登录用户可浏览；
//   其余门户页仍需登录（auth: true，见 docs/portal/门户功能设计方案.md §7.4）：页面会调用
//   /ai/agent-app/* 等鉴权接口，未登录时先回首页并弹出登录弹窗。
//   注意：src/router/index.js 的守卫只读「最后一条 matched」的 meta.auth，
//   所以每个子路由必须逐条声明自己的 auth（父路由的 auth 不能替代）。
// - 挂载点：routes.js 中 `...portalRoutes`，必须排在末尾 catch-all（/:pathMatch(.*)*）之前。
const portalRoutes = [
    // 门户一级壳：负责重定向到门户首页 + 承载公共顶栏与二级页面
    {
        path: '/portal',
        name: 'portal',
        meta: { title: '智能体门户', auth: true },
        redirect: '/portal/home',
        component: () => import('@/pages/portal/components/PortalShell.vue'),
        children: [
            {
                path: '/portal/home',
                name: 'portal-home',
                meta: { title: '门户首页', auth: false },
                component: () => import('@/pages/portal/home/index.vue')
            },
            {
                path: '/portal/agents',
                name: 'portal-agents',
                meta: { title: '智能体广场', auth: false },
                component: () => import('@/pages/portal/agents/index.vue')
            },
            {
                path: '/portal/agents/:id/run',
                name: 'portal-agent-run',
                meta: { title: '智能体对话', auth: true },
                component: () => import('@/pages/portal/agentRun/index.vue')
            },
            {
                path: '/portal/create/agent/:id?',
                name: 'portal-agent-create',
                meta: { title: '配置智能体', auth: true },
                component: () => import('@/pages/portal/create/index.vue')
            },
            // 我的聚合页：个人信息 + 功能入口（工作台）
            {
                path: '/portal/mine',
                name: 'portal-mine',
                meta: { title: '我的', auth: true },
                component: () => import('@/pages/portal/mine/index.vue')
            },
            // 我创建的：门户版智能体列表（scope=mine）
            {
                path: '/portal/mine/agents',
                name: 'portal-mine-agents',
                meta: { title: '我创建的', auth: true },
                component: () => import('@/pages/portal/mine/agents/index.vue')
            },
            // 知识库：知识库管理 / 文档管理 / 问答库管理（切片为文档页内嵌弹窗，不设独立路由）
            {
                path: '/portal/kb',
                name: 'portal-kb',
                meta: { title: '我的知识库', auth: true },
                component: () => import('@/pages/portal/kb/index.vue')
            },
            {
                path: '/portal/kb/docs',
                name: 'portal-kb-docs',
                meta: { title: '文档管理', auth: true },
                component: () => import('@/pages/portal/kb/docs/index.vue')
            },
            {
                path: '/portal/kb/qak',
                name: 'portal-kb-qak',
                meta: { title: '问答库管理', auth: true },
                component: () => import('@/pages/portal/kb/qak/index.vue')
            },
            {
                path: '/portal/workflows',
                name: 'portal-workflows',
                meta: { title: '流程助手', auth: true },
                component: () => import('@/pages/portal/workflows/index.vue')
            },
            // 流程相关路由（二期）：新建 / 画布视图由 workflows/index.vue 承载（见 docs/portal/门户功能设计方案.md §3.6）。
            // 注意：工作流「编辑」页不在本 children 内——它是壳外的独立页面路由（见文件末尾）
            {
                path: '/portal/workflows/create',
                name: 'portal-workflow-create',
                meta: { title: '新建流程', auth: true },
                component: () => import('@/pages/portal/workflows/index.vue')
            },
            // 工作流通用动态路径放在 create 静态前缀路径之后（edit 静态前缀页已在壳外单独注册）
            {
                path: '/portal/workflows/:id/canvas',
                name: 'portal-workflow-canvas',
                meta: { title: '流程画布', auth: true },
                component: () => import('@/pages/portal/workflows/index.vue')
            }
        ]
    },
    // 工作流编辑：壳外的独立页面路由（全屏编排器，自带工具栏与画布，不套门户顶栏）。
    // 路径 / 查询串与改造前一致：/portal/workflows/edit/<占位页id>?id=<工作流id> 或 ?mode=create
    // （入口见 pages/portal/components/PortalWorkflowList.vue 的 navigate()）。
    // 组件内以 route.path 前缀判定门户编辑（WorkflowManage.vue 的 isPortalEdit），故路径前缀必须保持 /portal/workflows。
    {
        path: '/portal/workflows/edit/:id?',
        name: 'portal-workflow-edit',
        meta: { title: '流程编辑', auth: true },
        component: () => import('@/components/WorkflowManage.vue'),
        // 门户不再暴露「工作流列表」视图：编辑路由只保留带 id 的编辑页
        // （如 /portal/workflows/edit?id=2104750635064090626），新建 mode=create 仍放行。
        // 无 id 且非新建时回「我的智能体 → 我的工作流」Tab，避免 WorkflowManage 渲染其内置列表页。
        beforeEnter: (to) => {
            const id = Array.isArray(to.query.id) ? to.query.id[0] : to.query.id
            const mode = Array.isArray(to.query.mode) ? to.query.mode[0] : to.query.mode
            if (id || mode === 'create') return true
            return { path: '/portal/mine/agents', query: { type: 'workflow' }, replace: true }
        }
    },
    // iframe 嵌入专用：独立对话页（无门户壳），供其他项目 iframe 引用。
    // 契约：GET /portal/agents/embed?agentId=<智能体id>；公开免登录（auth:false），
    // 故不设登录墙——宿主 iframe 内不会跳登录页；本页是门户 auth:true 约定的例外。
    // 必须留在 PortalShell 之外（壳带顶栏，本页无壳），静态路径与父路由平级不冲突。
    {
        path: '/portal/agents/embed',
        name: 'portal-agent-embed',
        meta: { title: '智能体对话（嵌入）', auth: false },
        component: () => import('@/pages/portal/agents/embed/index.vue')
    }
]

export default portalRoutes
