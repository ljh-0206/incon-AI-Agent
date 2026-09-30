// 配置
import home from '@/layouts/home.vue';
import BasicLayout from '@/layouts/basic-layout/index.vue';
import main_page from '@/layouts/web-layout/index.vue';
import portalRoutes from "./portal.js";
/**
 * 路由数据
 */
const routerList = [
    {
        path: '/ht',
        name: 'ht',
        component: BasicLayout,
        redirect: { name: 'dashboard-console' },
        children: [
            {
                path: '/dashboard/console',
                name: 'dashboard-console',
                meta: {
                    auth: true,
                    title: '首页',
                    closable: false
                },
                component: () => import('@/pages/dashboard/console')
            },
            {
                path: 'log',
                name: 'log',
                meta: {
                    title: '前端日志',
                    auth: true
                },
                component: () => import('@/pages/system/log')
            },
            // ============ 大模型 API 管理（临时静态路由，便于联调预览） ============
            // 说明：正式上线应改为在 T_XT_QXB 注册菜单并授权角色，走动态路由；此处临时代码待菜单注册后删除。
            {
                path: '/ai/llm/provider',
                name: 'ai-llm-provider',
                meta: { title: '供应商管理', auth: true, cache: true },
                component: () => import('@/pages/project/ai/provider/ProviderList.vue')
            },
            {
                path: '/ai/llm/model',
                name: 'ai-llm-model',
                meta: { title: '模型管理', auth: true, cache: true },
                component: () => import('@/pages/project/ai/provider/ModelList.vue')
            },
            {
                path: '/ai/llm/calllog',
                name: 'ai-llm-calllog',
                meta: { title: '调用日志', auth: true, cache: true },
                component: () => import('@/pages/project/ai/provider/CallLogList.vue')
            },
            // 对话调试：调用 LlmGatewayController 对话接口（/ai/llm/chat 阻塞、/ai/llm/chat/stream 流式）
            {
                path: '/ai/llm/chat',
                name: 'ai-llm-chat',
                meta: { title: '对话调试', auth: true, cache: true },
                component: () => import('@/pages/project/ai/chat/ChatPlayground.vue')
            },
            // 知识库管理：调用 KbController（/kb/*）接口，行操作「文档」跳转 /ai/kbdoc
            {
                path: '/ai/kb',
                name: 'ai-kb',
                meta: { title: '知识库管理', auth: true, cache: true },
                component: () => import('@/pages/project/ai/kb/KbList.vue')
            },
            // 问答库管理：调用 QakController（/qak/*）接口
            {
                path: '/ai/qak',
                name: 'ai-qak',
                meta: { title: '问答库管理', auth: true, cache: true },
                component: () => import('@/pages/project/ai/qak/QakList.vue')
            },
            // 知识库文档管理：调用 KbDocController（/kbdoc/*）接口
            {
                path: '/ai/kbdoc',
                name: 'ai-kbdoc',
                meta: { title: '文档管理', auth: true, cache: true },
                component: () => import('@/pages/project/ai/kbdoc/KbDocList.vue')
            },
            // 文档切片管理：调用 ChunkController（/chunk/*）接口
            {
                path: '/ai/chunk',
                name: 'ai-chunk',
                meta: { title: '切片管理', auth: true, cache: true },
                component: () => import('@/pages/project/ai/chunk/ChunkList.vue')
            },
            // ============ 智能体工作流（移植自 lynx-ai） ============
            // 工作流列表：调用 WorkflowController（/ai/workflow/*）
            {
                path: '/ai/workflow',
                name: 'ai-workflow',
                meta: { title: '工作流管理', auth: true, cache: true },
                component: () => import('@/pages/project/ai/workflow/WorkflowList.vue')
            },
            // 工作流编辑器：可视化编排（vue-flow）+ 执行调试（SSE）
            {
                path: '/ai/workflow/edit/:id?',
                name: 'ai-workflow-edit',
                meta: { title: '工作流编辑', auth: true },
                component: () => import('@/components/WorkflowManage.vue')
            },
            // AI 生成工作流：自然语言描述 → 自动生成工作流图
            {
                path: '/ai/workflow/generator',
                name: 'ai-workflow-generator',
                meta: { title: 'AI 生成工作流', auth: true },
                component: () => import('@/components/WorkflowAIGenerator.vue')
            },
            // ============ 智能体应用管理 ============
            // 智能体平台首页：推荐 / 我的 / 收藏 三区块门户
            {
                path: '/ai/agent-app/home',
                name: 'ai-agent-app-home',
                meta: { title: '智能体首页', auth: true, cache: true },
                component: () => import('@/pages/project/ai/agentApp/AgentAppHome.vue')
            },
            // 智能体工作空间：应用 / 工作流 / 知识库 维护入口聚合页
            {
                path: '/ai/agent-workspace',
                name: 'ai-agent-workspace',
                meta: { title: '智能体工作空间', auth: true, cache: true },
                component: () => import('@/pages/project/ai/agentApp/AgentWorkspace.vue')
            },
            // 应用列表：调用 AgentAppController（/ai/agent-app/*）
            {
                path: '/ai/agent-app',
                name: 'ai-agent-app',
                meta: { title: '智能体应用', auth: true, cache: true },
                component: () => import('@/pages/project/ai/agentApp/AgentAppList.vue')
            },
            // 智能体推荐管理：系统管理员统一设置/取消推荐（菜单授权给管理员角色）
            {
                path: '/ai/agent-app/recommend',
                name: 'ai-agent-app-recommend',
                meta: { title: '智能体推荐管理', auth: true, cache: true },
                component: () => import('@/pages/project/ai/agentApp/AgentAppRecommend.vue')
            },
            // 应用编辑：标准模式（模型/提示词/知识库）或工作流模式（关联工作流）+ 欢迎词/头像/逐字回复/思考过程
            {
                path: '/ai/agent-app/edit/:id?',
                name: 'ai-agent-app-edit',
                meta: { title: '编辑智能体', auth: true },
                component: () => import('@/pages/project/ai/agentApp/AgentAppEdit.vue')
            },
            // 应用运行：chat 对话界面，新开对话显示欢迎词，助手头像图标
            {
                path: '/ai/agent-app/run/:id',
                name: 'ai-agent-app-run',
                meta: { title: '智能体对话', auth: true },
                component: () => import('@/pages/project/ai/agentApp/AgentAppRun.vue')
            }
        ]
    }, 
	// 智能体门户路由（/portal/*）：统一维护在 src/router/portal.js，避免重复注册同名/同路径路由。
    // 说明：门户各页 auth: true（见 docs/portal/门户功能设计方案.md §7.4）。
    ...portalRoutes,
	{
        path: '/qt',
        name: 'qt',
        redirect: { name: 'common-sy' },
        component: main_page,
        children: []
    },
    // 主路由，仅用于判断跳转配置的默认前后端页面
    {
        path: '/',
        name: 'home',
        component: home,
        meta: {},
        children: []
    },
	// ============ 智能体门户 mimo（框架外独立路由，不挂 ht/qt） ============
    // 门户首页：统一主题的智能体门户（配置 / 工作流 / 对话入口）；auth:false 便于直接预览。
    // 说明：正式门户上线时应改为动态菜单/权限控制，此处为预览路由。
    // 契约：mimo/首页设计-mimo.md
    {
        path: "/mimo/home",
        name: "mimo-home",
        meta: { title: "智能体门户", auth: false },
        component: () => import("@/pages/mimo/home/index.vue"),
    },
    // 登录路由
    {
        path: '/login',
        name: 'login',
        meta: {
            title: '$t:page.login.title'
        },
        component: () => import('@/pages/account/login')
    },
    // cas登录路由
    {
        path: '/cas',
        name: 'cas',
        meta: {
            title: 'cas登录'
        },
        component: () => import('@/pages/account/cas')
    },
    // oauth2登录路由
    {
        path: '/oauth2',
        name: 'oauth2',
        meta: {
            title: 'oauth2登录'
        },
        component: () => import('@/pages/account/oauth2')
    },
    // token登录路由
    {
        path: '/tokenLogin',
        name: 'tokenLogin',
        meta: {
            title: 'token登录'
        },
        component: () => import('@/pages/account/tokenLogin')
    },
    // page调用路由
    {
        path: '/pageinterface',
        name: 'pageinterface',
        meta: {},
        component: () => import('@/pages/pageinterface/index.vue')
    },
    // 智能体对外对话页（公开，无需登录；凭 appId + key 访问，对接 OpenApiController）
    {
        path: '/agent/chat',
        name: 'agent-chat',
        meta: { title: '智能体对话', auth: false },
        component: () => import('@/pages/project/ai/agentApp/AgentAppChat.vue')
    },
    // 403无权限路由
    {
        path: '/403',
        name: '403',
        meta: {
            title: '403'
        },
        component: () => import('@/pages/system/error/403')
    },
    // 500异常路由
    {
        path: '/500',
        name: '500',
        meta: {
            title: '500'
        },
        component: () => import('@/pages/system/error/500')
    },
    // 404异常路由
    {
        path: '/:pathMatch(.*)*',
        name: '404',
        meta: {
            title: '404'
        },
        component: () => import('@/pages/system/error/404')
    }
];

// 导出路由
export default routerList;
