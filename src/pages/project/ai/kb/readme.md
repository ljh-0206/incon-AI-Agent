# 知识库模块 — 动态组件库（t_ddmpt_zjb）注册

本模块前端组件入库到配置平台动态组件库 `t_ddmpt_zjb`（先删后插）。组件 ID 为固定值，重存时复用同一 ID，确保先删后插命中同一行。

## 已注册组件

| ID（固定） | ZJM 组件名 | ZJSM 说明 | 源文件（相对仓库根） | BXFS | SFGY | SXH |
|----|----|----|----|----|----|----|
| `id1789372898809da397c9adb2f349aad394f95e3bb0e9e` | AiKbList | 知识库管理 | ddmpt4.0-front/src/pages/project/ai/kb/KbList.vue | vue | 0 | 1 |

- **XMID**：`1742102789896a784749324dd2816b66396f8612e6a6b95`（AI 平台共享 xmid，与工作流编排/对话管理/问题归一化等所有 AI 组件一致）
- **入库时间**：2026-09-14
- **PZXX 字符数**：10684（验证时 `DBMS_LOB.GETLENGTH(pzxx)` 应与此一致）

## 重存方式

```bash
# 1. 生成 SQL（仓库根目录下执行）
node skills/zjb-sync/save_to_zjb.js --config skills/zjb-sync/_sync_kb.json

# 2. 执行：本机无 sqlplus，用 python oracledb thin 模式（免 Oracle 客户端）
python skills/zjb-sync/_run_sync.py skills/zjb-sync/_sync_kb.sql \
  "inco_xmpzpt_4/inco_xmpzpt_4@192.168.1.30:1521/test"
```

- 配置文件：`skills/zjb-sync/_sync_kb.json`
- 生成 SQL：`skills/zjb-sync/_sync_kb.sql`

## 说明

KbList.vue 当前为 **REST prototype**（`import { kbListPage… } from '@/api/kb'` → 后端 `KbController /kb/*`），与动态组件库运行时组件（`commonsJs.incoRequest` + SQL ID）机制不同。此处入库为**源码归档/部署**用途；若要被配置平台运行动态加载，`@/api/kb` 等 webpack 别名 import 需另行适配。
