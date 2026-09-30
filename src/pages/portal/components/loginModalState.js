import { reactive } from 'vue'

// 门户登录弹窗全局状态：顶栏「登录」按钮、受限操作、路由守卫共用同一开关
export const loginModalState = reactive({
    visible: false,
    redirect: ''
})

// 打开登录弹窗；redirect 为登录成功后的目标地址（可选）
export function openLoginModal (redirect = '') {
    loginModalState.redirect = redirect || ''
    loginModalState.visible = true
}

// 关闭登录弹窗并清空 redirect
export function closeLoginModal () {
    loginModalState.visible = false
    loginModalState.redirect = ''
}
