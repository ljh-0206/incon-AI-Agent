/*
 * @Author: lijiahao
 * @Date: 2021-09-24 10:40:09
 * @LastEditTime: 2022-04-08 11:30:05
 * @Msg: Nothing
 */

import Setting from '@/setting'
import { decrypt_aes } from '@/utils/aesEncrypt'

const sider = [];
// 页面刷新时导入后台返回的菜单
(function () {
    refershSider();
})()

export function refershSider () {
    const menu_list = [];
    let menulist = localStorage.getItem('menulist' + '_' + Setting.xmid)
    // 兼容之前浏览器的缓存
    if (menulist && !menulist.startsWith('[')) menulist = decrypt_aes(menulist)
    let menulist_noAuth = localStorage.getItem('menulist_noAuth' + '_' + Setting.xmid)
    // 兼容之前浏览器的缓存
    if (menulist_noAuth && !menulist_noAuth.startsWith('[')) menulist_noAuth = decrypt_aes(menulist_noAuth)
    // 只有登录后localStorage才有值
    if (!menulist && !menulist_noAuth) return;

    if (menulist) {
        menulist = JSON.parse(menulist)
        menulist = menulist.map(item => { return recursion(item) })
        menulist.forEach((item) => {
            let flag = true
            menu_list.forEach((item2) => {
                if (item.qxdm == item2.qxdm) flag = false
            })
            if (flag) menu_list.push(item)
        })
    }
    if (menulist_noAuth) {
        menulist_noAuth = JSON.parse(menulist_noAuth);
        menulist_noAuth = menulist_noAuth.map(item => { return recursion(item) })
        menulist_noAuth.forEach((item) => {
            let flag = true
            menu_list.forEach((item2) => {
                if (item.qxdm == item2.qxdm) flag = false
            })
            if (flag) menu_list.push(item)
        })
    }

    function recursion (data) {
        data.header = 'home';
        data.path = data.url;
        if (data.children) {
            data.children = data.children.map(item => {
                return recursion(item)
            })
        }
        return data;
    }

    pushSider(menu_list)
}

export function pushSider (data) {
    sider.length = 0;
    sider.push(...data)
}

export function getSider () {
    return sider;
}
export default sider;
