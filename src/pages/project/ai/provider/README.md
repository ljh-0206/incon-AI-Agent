# 大模型 API 管理（前端配置层）

本目录为 AI 平台「模型底座」的前端配置页面，遵循平台 jform CRUD + SQL 驱动（`commonsJs.incoRequest`）模式。

## 页面清单

| 文件 | 职责 | 一级路由入口 |
|------|------|-------------|
| `ProviderList.vue` | 供应商管理（系统预设 + 自定义 / 密钥加密 / 默认路由） | 是 |
| `ModelList.vue` | 模型管理（多类型 / 参数 / 价格 / 默认）；由供应商行操作「模型」弹窗内嵌，亦可独立菜单 | 否（内嵌）/ 可独立 |
| `CallLogList.vue` | 调用日志（查询 / 详情 CLOB / 人工复核 / 运维清理） | 是 |

> 数据操作统一走 `this.commonsJs.incoRequest(type, sqlId, param)`，SQL ID 真实值见后端 `resources/sql/大模型API管理/03_sync_sqb_配置平台.sql` 及设计文档《DATA_MAPPING.md》。

## 落地步骤

1. **建表**：执行后端 `resources/sql/大模型API管理/00_建表.sql`（或 `01_建表.sql`），创建 `t_ai_llm_provider` / `t_ai_llm_model` / `t_ai_llm_call_log` 三张表 + 索引。
2. **SQL 配置入 `t_ht_sqb`**：执行 `03_sync_sqb_配置平台.sql`，写入 15 条 SQL（3 组 × 5），本程序运行在配置平台单平台。
3. **系统预设种子**：执行 `04_供应商系统预设.sql`，写入 8 家主流供应商（含中文需设置 `NLS_LANG=AMERICAN_AMERICA.AL32UTF8`）。
4. **菜单注册**：见下文。

## 菜单注册（路由为动态菜单驱动）

本平台路由由菜单表（`T_XT_QXB`）驱动，组件路径字段 `zjurl` 相对 `@/pages`。需通过平台「菜单管理」新增以下菜单项（字段为示意，`qxdm/fqxdm` 由平台分配）：

| 菜单名称 (`qxmc`) | 路由 (`url`) | 组件路径 (`zjurl`) | 服务类型 (`fwlx`) | router_name |
|------------------|-------------|-------------------|------------------|-------------|
| 大模型 API 管理 | /ai/llm | —（目录） | ht | ai-llm |
| 供应商管理 | /ai/llm/provider | /project/ai/provider/ProviderList | ht | ai-llm-provider |
| 模型管理 | /ai/llm/model | /project/ai/provider/ModelList | ht | ai-llm-model |
| 调用日志 | /ai/llm/calllog | /project/ai/provider/CallLogList | ht | ai-llm-calllog |

- 「模型管理」页默认由「供应商管理」行操作「模型」弹窗内嵌（传 `provider-id`）；如需独立菜单访问，按上表注册并可通过 `?providerId=xxx` 串联。
- 注册后需为相应角色授权菜单权限，刷新即可见。

## 安全契约（已落实）

- 密钥 `api_key/api_secret` 前端 `encrypt_aes` 加密入库；列表/单条查询 SQL 不回传密钥；编辑留空用 `decode` 不覆盖；编辑时输入框置空不回显。
- 平台代码保护：本模块仅在本目录内编写，不修改 `src/components/`、`src/api/` 等公共代码。
