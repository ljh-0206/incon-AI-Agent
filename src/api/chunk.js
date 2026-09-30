// 文档切片管理接口 —— 对应后端 ChunkController（@RequestMapping("/chunk")）
import request from '@/plugins/request';

/**
 * 查询所有切片（不含切片内容，按 docid、chipseq 排序）
 * GET /chunk/list?docid=
 */
export function chunkList (params) {
    return request({ url: '/chunk/list', method: 'get', params });
}

/**
 * 分页查询切片（不含切片内容）
 * GET /chunk/listPage
 */
export function chunkListPage (params) {
    return request({ url: '/chunk/listPage', method: 'get', params });
}

/**
 * 查询切片详情（含切片内容 CLOB）
 * GET /chunk/getBy?id=
 */
export function chunkGetBy (params) {
    return request({ url: '/chunk/getBy', method: 'get', params });
}

/**
 * 切片入库（一般由文档上传流程自动触发，这里保留手动入口）
 * POST /chunk/chunkAndSave （@RequestBody ChunkParam）
 */
export function chunkAndSave (data) {
    return request({ url: '/chunk/chunkAndSave', method: 'post', data });
}

/**
 * 按文档ID删除其全部切片
 * POST /chunk/deleteByDocid （@RequestBody ChunkParam，取 docid）
 */
export function chunkDeleteByDocid (data) {
    return request({ url: '/chunk/deleteByDocid', method: 'post', data });
}

/**
 * 删除单条切片
 * POST /chunk/delete （@RequestBody ChunkPage，取 id）
 */
export function chunkDelete (data) {
    return request({ url: '/chunk/delete', method: 'post', data });
}

/**
 * 批量删除切片
 * POST /chunk/batchDelete （@RequestBody List<String> idList）
 */
export function chunkBatchDelete (data) {
    return request({ url: '/chunk/batchDelete', method: 'post', data });
}
