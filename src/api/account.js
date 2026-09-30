/*
 * @Author: Chenxu
 * @Date: 2021-10-13 09:12:20
 * @LastEditTime: 2021-10-19 09:42:15
 * @Msg: Nothing
 */
import request from '@/plugins/request';

export function AccountLogin (data) {
    return request({
        url: '/sys/login',
        method: 'post',
        data
    });
}

export function casLogin (data) {
    return request({
        url: '/sys/casLogin',
        method: 'post',
        data
    });
}

export function AccountLogout (data) {
    return request({
        url: '/sys/logout',
        method: 'POST',
        data
    });
}

export function AccountRegister (data) {
    return request({
        url: '/sys/register',
        method: 'post',
        data
    });
}

// 查看个人信息
export function queryInfo () {
    return request({
        url: '/grzx/queryByInfo',
        method: 'post'
    });
}
// 修改个人信息
export function updateInfo (data) {
    return request({
        url: '/grzx/update',
        method: 'post',
        data
    });
}
