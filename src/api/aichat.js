// import request from '@/plugins/request/aichat.js';
import request from '@/plugins/request';
// 提交问题
export function fetchApiChatProcess (data) {
    return request({
        url: '/chatgpt/chat/send/question',
        method: 'POST',
        data
    });
}
// 反馈
export function feedbackEvaluate (data) {
    return request({
        url: '/chatgpt/chat/feedback/evaluate',
        method: 'POST',
        data
    })
}
// 学生问答list
export function feedbackListpage (data) {
    return request({
        url: '/chatgpt/chat/feedback/listPage',
        method: 'POST',
        data
    })
}
// 获取问答详情
export function selectByChatCode (data) {
    return request({
        url: '/chatgpt/chat/feedback/selectByChatCode',
        method: 'POST',
        data
    })
}
// 教师审核问答记录
export function feedbackVerify (data) {
    return request({
        url: '/chatgpt/chat/feedback/verify',
        method: 'POST',
        data
    })
}
// 获取问答库列表
export function listPageqakgl (params) {
    return request({
        url: '/chatgpt/chat/qa/list',
        method: 'get',
        params
    })
}
// 获取问答数据详情
export function getByqakgl (params) {
    return request({
        url: '/chatgpt/chat/qa/get',
        method: 'get',
        params
    })
}
// 添加修改问答库
export function saveDataqakgl (data) {
    return request({
        url: '/chatgpt/chat/qa/save',
        method: 'post',
        data
    })
}
// 删除问答库单条
export function deleteDataqakgl (data) {
    return request({
        url: '/chatgpt/chat/qa/delete',
        method: 'post',
        data
    })
}
// 删除问答库多条
export function deleteDataqakglIds (data) {
    return request({
        url: '/qak/batchDelete',
        method: 'post',
        data
    })
}
export function getMarkmap (data) {
    return request({
        url: '/chatgpt/chat/getMarkmap',
        method: 'post',
        data
    })
}

export function markFindPageList (params) {
    return request({
        url: '/chatgpt/mark/findPageList',
        method: 'GET',
        params
    })
}
export function markFindList (params) {
    return request({
        url: '/chatgpt/mark/findList',
        method: 'GET',
        params
    })
}
export function markDelete (data) {
    return request({
        url: '/chatgpt/mark/delete',
        method: 'post',
        data
    })
}
