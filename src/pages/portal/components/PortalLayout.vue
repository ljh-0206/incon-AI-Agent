<template>
    <!-- 门户通用壳：v3 主题层 + 顶栏（品牌 / 主导航 / 用户下拉）+ 内容插槽 -->
    <div class="portal-layout">
        <!-- 顶栏：品牌 + 主导航 + 用户（v3 约束：不放检索与创建助手） -->
        <header class="header" id="site-header" :class="{ 'is-solid': solid }">
            <div class="header-inner">
                <a class="brand" :href="homePath" aria-label="赢科智能体平台首页" @click.prevent="onBrandClick">
                    <span class="brand-seal" aria-hidden="true">赢科<br />智能</span>
                    <span>
                        <div class="brand-cn">赢科智能体平台</div>
                        <div class="brand-en">YINGKE AGENT PLATFORM</div>
                    </span>
                </a>
                <nav class="nav" aria-label="主导航">
                    <!-- 选中态由当前路由前缀匹配推导（如 /portal/home → 首页高亮） -->
                    <a v-for="m in navLinks" :key="'nav-' + m.label" :href="m.path"
                        :class="{ 'is-active': isNavActive(m) }" :aria-current="isNavActive(m) ? 'page' : null"
                        @click="onNavLink(m, $event)">{{ m.label }}</a>
                </nav>
                <div class="header-actions">
                    <!-- 已登录：用户头像下拉；未登录：改为「登录」按钮（打开门户登录弹窗） -->
                    <div v-if="isLoggedIn" class="user-menu" ref="userMenu">
                        <button type="button" class="user-chip" aria-haspopup="menu"
                            :aria-expanded="userMenuOpen ? 'true' : 'false'" :aria-label="userName + ' · 账户菜单'"
                            @click="toggleUserMenu">
                            <span v-if="userAvatarId" class="user-av user-av--img" aria-hidden="true"
                                :style="userAvatarStyle"></span>
                            <span v-else class="user-av" aria-hidden="true">{{ userAvatar }}</span>
                            <span>{{ userName }}</span>
                            <span class="user-caret" aria-hidden="true">▾</span>
                        </button>
                        <!-- 「我的」进个人中心路由；「跳转后台」进 ht 默认页；「退出登录」走真实登出 -->
                        <div v-show="userMenuOpen" class="user-dropdown" role="menu" aria-label="账户菜单">
                            <button type="button" role="menuitem" @click="onMenuMine">我的</button>
                            <button v-if="showJumpHt" type="button" role="menuitem" @click="onMenuHt">跳转后台</button>
                            <button type="button" role="menuitem" @click="onMenuLogout">退出登录</button>
                        </div>
                    </div>
                    <button v-else type="button" class="login-btn" aria-haspopup="dialog" @click="openLoginModal()">登录</button>
                </div>
            </div>
        </header>

        <!-- 登录弹窗（未登录时由顶栏按钮 / 受限操作 / 路由守卫唤起） -->
        <PortalLoginModal />

        <!-- 页面内容 -->
        <slot />
    </div>
</template>

<script>
// 「跳转后台」展示判定用：读本地路由表缓存（镜像 header-user 的 have_qt）
import { mapState } from 'vuex'
import Setting from '@/setting'
import { decrypt_aes } from '@/utils/aesEncrypt'
import PortalLoginModal from './PortalLoginModal.vue'
import { openLoginModal } from './loginModalState'

export default {
    name: 'PortalLayout',

    components: {
        PortalLoginModal
    },

    // 契约：props.solid（顶栏实底态）/ 默认 slot（页面内容）
    props: {
        // 顶栏是否为实底态（原首页按屏索引判断，改为由页面传入）
        solid: {
            type: Boolean,
            default: false
        }
    },

    computed: {
        // 用户信息：响应式读取 store（镜像 header-user/index.vue 的 mapState）
        // 说明：store 恢复（admin/account/load）晚于本组件挂载，computed 会自动回填
        ...mapState('admin/user', ['info']),

        // 登录态：与路由守卫同一口径（src/router/index.js beforeEach：
        // localStorage.getItem('token_' + Setting.xmid) 存在且 !== 'undefined'），
        // store 用户信息作兜底（logout 时 token 与 info 同步清空，两者不会互相矛盾）。
        // 镜像 src/pages/portal/home/index.vue 的同名 computed
        isLoggedIn() {
            let token = ''
            try {
                token = localStorage.getItem('token_' + Setting.xmid) || ''
            } catch (e) {
                token = ''
            }
            if (token && token !== 'undefined') return true
            const info = this.info || {}
            // 兜底需有真实用户标识，避免残留空对象被判为已登录
            return !!(info && typeof info === 'object' && (info.id || info.xm))
        },

        // 姓名：取不到时给中性称谓「用户」，绝不编造姓名（游客不应看到像真人姓名的占位）
        userName() {
            const info = this.info || {}
            return info.xm ? String(info.xm) : '用户'
        },

        // 头像图片 ID：仅长度 > 2 视为后端图片 ID（判定对齐 AgentList.mapRow）
        userAvatarId() {
            const raw = this.info && this.info.avatar ? String(this.info.avatar) : ''
            return raw.length > 2 ? raw : ''
        },

        // 头像文字：无图片 ID 时取姓名首字，最终兜底中性字「用」（与 userName 的中性称谓一致）
        userAvatar() {
            return this.userName.charAt(0) || '用'
        },

        // 头像背景图：与门户范式一致（commonsJs.getBackgroundImage(id, true)，圆形铺满）
        userAvatarStyle() {
            if (!this.userAvatarId) return null
            const bg = this.commonsJs.getBackgroundImage(this.userAvatarId, true) || {}
            return Object.assign({}, bg, {
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
            })
        }
    },

    data() {
        return {
            // 用户下拉开合状态
            userMenuOpen: false,
            // 「跳转后台」是否展示（mounted 时按 haveHt() 判定，判定前默认展示）
            showJumpHt: true,
            // 门户首页路由（品牌点击）
            homePath: '/portal/home',
            // 智能体广场列表页路由（已注册）
            agentsListPath: '/portal/agents',
            // 主导航（真实路由，选中态由当前路由推导）
            // 「我的智能体」→ /portal/mine（我的聚合工作台：我创建的 / 我的收藏 / 我的知识库等栏目）
            navLinks: [
                { label: '首页', path: '/portal/home' },
                { label: '智能体广场', path: '/portal/agents', action: 'plaza' },
                { label: '我的智能体', path: '/portal/mine' }
            ]
        }
    },

    mounted() {
        // 监听句柄（非响应式，unmount 时统一清理）
        this._handlers = {
            keydown: this.onKeydown.bind(this),
            docClick: this.onDocClick.bind(this)
        }
        window.addEventListener('keydown', this._handlers.keydown)
        // 用户下拉：点击外部关闭（document 层）
        document.addEventListener('click', this._handlers.docClick)

        // 主题层挂载：token 与 body 级样式挂在 body.page-portal-v3 上
        document.body.classList.add('page-portal-v3')

        // 「跳转后台」展示判定（镜像 have_qt，见方法注释）
        this.showJumpHt = this.haveHt()
    },

    beforeUnmount() {
        // 解绑所有监听
        const h = this._handlers
        if (h) {
            window.removeEventListener('keydown', h.keydown)
            document.removeEventListener('click', h.docClick)
            this._handlers = null
        }
        // 主题层卸载
        document.body.classList.remove('page-portal-v3')
    },

    methods: {
        // ---------- 主导航 ----------
        // 当前路由与目标前缀匹配时高亮（精确命中或落在其子路径下）
        isNavActive(m) {
            if (!m || !m.path || !this.$route) return false
            const p = this.$route.path
            return p === m.path || p.indexOf(m.path + '/') === 0
        },

        // 品牌点击：回门户首页
        onBrandClick() {
            if (this.homePath && this.$router) this.$router.push(this.homePath)
        },

        // 导航项点击：plaza 走带兜底的跳转，其余直接真实路由
        onNavLink(m, e) {
            if (e && e.preventDefault) e.preventDefault()
            if (!m) return
            if (m.action === 'plaza') {
                this.goPlaza()
                return
            }
            if (m.path && this.$router) {
                // 已在目标路径时只忽略（对齐 onMenuMine 的写法，吞重复导航结果）
                if (this.$route && this.$route.path === m.path) return
                const result = this.$router.push(m.path)
                if (result && typeof result.catch === 'function') result.catch(() => { })
            }
        },

        // 跳转智能体列表展示页；路由未注册（命中 404 兜底）则轻提示，避免点出 404
        goPlaza() {
            const path = this.agentsListPath
            let registered = false
            if (this.$router && this.$router.resolve) {
                const resolved = this.$router.resolve(path)
                const matched = (resolved && resolved.matched) || []
                // 本项目有 /:pathMatch(.*)* name:'404' 兜底路由：命中它 = 未注册
                registered = matched.some(r => r && r.name && r.name !== '404')
            }
            if (!registered) {
                this.$Message.info('智能体广场 · 智能体列表页即将上线')
                return
            }
            this.$router.push(path)
        },

        // ---------- 跳转后台展示判定 ----------
        // 镜像 src/layouts/basic-layout/header-user/index.vue 的 have_qt()：
        // 读本地 routerlist 缓存，检查是否存在 fwlx === 'ht' 的后台菜单。
        // showQhdqd（切换到前台）开关无 ht 侧对应配置、判定不明确，故不作门控；
        // 读不到缓存（未登录 / 首次访问）时默认展示，未登录由 dashboard-console
        // 的 auth:true 路由守卫拦截。
        haveHt() {
            try {
                let routerlistLocal = localStorage.getItem('routerlist' + '_' + Setting.xmid)
                // 兼容未加密的历史缓存（与 have_qt 一致）
                if (routerlistLocal && !routerlistLocal.startsWith('[')) {
                    routerlistLocal = decrypt_aes(routerlistLocal)
                }
                if (routerlistLocal) {
                    const list = JSON.parse(routerlistLocal)
                    for (let i = 0; i < list.length; i++) {
                        if (list[i] && list[i].fwlx === 'ht') return true
                    }
                    // 有缓存但无后台菜单：当前角色无后台权限，不展示
                    return false
                }
            } catch (e) {
                // 缓存异常按无数据处理
            }
            // 读不到缓存：判定不明确时默认展示
            return true
        },

        // ---------- 登录（未登录态） ----------
        // 顶栏「登录」：打开门户登录弹窗（不带 redirect，登录成功后停留在当前页）
        openLoginModal,

        // ---------- 用户头像下拉 ----------
        toggleUserMenu() {
            this.userMenuOpen = !this.userMenuOpen
        },

        // 关闭下拉；focusBack=true 时焦点回到触发器
        closeUserMenu(focusBack) {
            if (!this.userMenuOpen) return
            this.userMenuOpen = false
            if (focusBack && this.$refs.userMenu) {
                const trigger = this.$refs.userMenu.querySelector('.user-chip')
                if (trigger && trigger.focus) trigger.focus()
            }
        },

        // 点击外部关闭（document 层监听）
        onDocClick(e) {
            if (!this.userMenuOpen) return
            const wrap = this.$refs.userMenu
            if (wrap && wrap.contains && !wrap.contains(e.target)) this.closeUserMenu(false)
        },

        // Esc：关闭用户下拉（置于输入态无关的位置，任意焦点下都可关）
        onKeydown(e) {
            if (e.key !== 'Escape' || !this.userMenuOpen) return
            e.preventDefault()
            this.closeUserMenu(true)
        },

        // 菜单项：我的 → 个人中心（src/router/portal.js 已注册 portal-mine）
        // 已在 /portal/mine 时只关闭下拉、不重复跳转；push 结果补 catch（吞重复导航错误）
        // —— 对齐仓库既有 goPath 写法（docs/portal/门户页面与路由索引.md §4），mine 页设计计划 v1.1 O10
        onMenuMine() {
            this.closeUserMenu(true)
            if (!this.$router || this.$route && this.$route.path === '/portal/mine') return
            const result = this.$router.push('/portal/mine')
            if (result && typeof result.catch === 'function') result.catch(() => { })
        },

        // 菜单项：跳转后台 → ht 默认页（/ht redirect → dashboard-console）
        onMenuHt() {
            this.closeUserMenu(true)
            this.$router.push({ name: 'dashboard-console' })
        },

        // 菜单项：退出登录 → 对齐 header-user 的真实登出（admin/account/logout，含二次确认）
        onMenuLogout() {
            this.closeUserMenu(true)
            const layout = (this.$store && this.$store.state.admin && this.$store.state.admin.layout) || {}
            this.$store.dispatch('admin/account/logout', { confirm: layout.logoutConfirm, vm: this })
        }
    }
}
</script>

<style lang="less">
/* ═══ v3 主题层（挂在 body.page-portal-v3，门户壳持有）══════════
   来源：v3 设计稿（原 src/pages/mimo/design-02-bucm/css/v3.css，设计稿已删除）的
   :root / html,body / 元素重置 / :focus-visible 段；token 名与值一字不改。
   本文件即 v3 token 的唯一现行出处（设计稿删除后不再有外部来源文件）。
   注：body 的 overflow:hidden 属首页 100vh 分屏的页面级需求，留在首页不迁入。 */

/* ── :root → body.page-portal-v3（Color / Type / Space / Radius / Shadow / Motion）── */
body.page-portal-v3 {
    /* ── Color（绛红校色 + 宣纸，token 化） ── */
    --c-red-700: #7E2214;
    --c-red-600: #992A18;
    --c-red-500: #A31A0B;
    --c-red-100: rgba(153, 42, 24, .12);
    --c-red-glass: rgba(191, 52, 30, .25);
    --c-gold-500: #F69C20;
    --c-gold-300: #E2A93B;
    --c-paper: #EFE3D7;
    --c-paper-2: #F7EBDF;
    --c-ink: #1A1410;
    --c-ink-2: #3D342C;
    --c-muted: #8C847E;
    --c-white: #FFFFFF;
    --c-border: rgba(26, 20, 16, .12);
    --c-ring: rgba(246, 156, 32, .55);

    /* ── Type ── */
    --font-display: "Noto Serif SC", "Songti SC", "SimSun", Georgia, serif;
    --font-body: "Microsoft YaHei", "微软雅黑", "PingFang SC", "Segoe UI", sans-serif;
    --text-xs: 12px;
    --text-sm: 14px;
    --text-base: 16px;
    --text-lg: 18px;
    --text-xl: 22px;
    --text-2xl: 30px;
    --text-3xl: 40px;
    --text-4xl: 52px;
    --leading-tight: 1.2;
    --leading-body: 1.65;
    --tracking-wide: .12em;
    --tracking-wider: .2em;

    /* ── Space (base-8) ── */
    --s1: 4px;
    --s2: 8px;
    --s3: 12px;
    --s4: 16px;
    --s5: 20px;
    --s6: 24px;
    --s8: 32px;
    --s10: 40px;
    --s12: 48px;
    --s16: 64px;
    --s20: 80px;

    /* ── Radius / Shadow / Motion ── */
    --r-sm: 4px;
    --r-md: 8px;
    --r-lg: 16px;
    --r-full: 999px;
    --shadow-sm: 0 1px 3px rgba(26, 20, 16, .08);
    --shadow-md: 0 8px 24px rgba(26, 20, 16, .12);
    --shadow-lg: 0 16px 40px rgba(26, 20, 16, .16);
    --t-fast: 150ms ease;
    --t-base: 250ms ease;
    --t-scene: 700ms ease-in-out;

    --header-h: 88px;
    --max: 1440px;
}

/* ── html, body { height:100%; margin:0 } + body 基础（字体/行高/颜色/背景）── */
body.page-portal-v3 {
    height: 100%;
    margin: 0;
    font-family: var(--font-body);
    font-size: var(--text-sm);
    line-height: var(--leading-body);
    color: var(--c-ink-2);
    background: var(--c-paper);
    -webkit-font-smoothing: antialiased;
}

/* ── *, *::before, *::after { box-sizing: border-box } ── */
body.page-portal-v3 *,
body.page-portal-v3 *::before,
body.page-portal-v3 *::after {
    box-sizing: border-box;
}

/* ── 元素级重置（a / button,input / img / ul）── */
body.page-portal-v3 a {
    color: inherit;
    text-decoration: none;
}

body.page-portal-v3 button,
body.page-portal-v3 input {
    font: inherit;
    color: inherit;
}

body.page-portal-v3 img {
    display: block;
    max-width: 100%;
}

body.page-portal-v3 ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

/* ── :focus-visible 焦点环 ── */
body.page-portal-v3 :focus-visible {
    outline: 2px solid var(--c-ring);
    outline-offset: 3px;
}
</style>

<style scoped lang="less">
/* ══ 顶栏 ══════════════════════════════════ */
.header {
    position: fixed;
    inset: 0 0 auto;
    z-index: 20;
    height: var(--header-h);
    padding: var(--s4) var(--s6);
    display: flex;
    align-items: center;
    animation: headerIn .3s linear both;
    color: var(--c-white);
    transition: background var(--t-base), color var(--t-base), box-shadow var(--t-base);
}

@keyframes headerIn {
    from {
        transform: translateY(-100%);
    }

    to {
        transform: translateY(0);
    }
}

.header::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 160px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, .55), transparent);
    z-index: -1;
    pointer-events: none;
    transition: opacity var(--t-base);
}

.header.is-solid {
    background: rgba(247, 235, 223, .96);
    color: var(--c-ink);
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(10px);
}

.header.is-solid::before {
    opacity: 0;
}

.header.is-solid .brand-en {
    color: var(--c-muted);
}

.header.is-solid .nav a {
    color: var(--c-ink-2);
}

.header.is-solid .user-chip {
    color: var(--c-ink);
}

.header-inner {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: var(--s6);
}

.brand {
    display: flex;
    align-items: center;
    gap: var(--s3);
    flex-shrink: 0;
}

.brand-seal {
    width: 48px;
    height: 48px;
    border: 2px solid var(--c-gold-500);
    border-radius: var(--r-full);
    display: grid;
    place-items: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: var(--text-xs);
    line-height: 1.15;
    letter-spacing: var(--tracking-wide);
    color: var(--c-gold-500);
    background: var(--c-red-glass);
}

.brand-cn {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 700;
    letter-spacing: var(--tracking-wider);
    line-height: var(--leading-tight);
}

.brand-en {
    font-size: 11px;
    letter-spacing: .08em;
    color: rgba(255, 255, 255, .65);
    margin-top: var(--s1);
}

.nav {
    display: flex;
    gap: var(--s1);
    flex: 1;
    justify-content: center;
}

.nav a {
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    padding: var(--s2) var(--s4);
    position: relative;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    transition: color var(--t-fast);
}

.nav a::after {
    content: '';
    position: absolute;
    left: var(--s4);
    right: var(--s4);
    bottom: var(--s1);
    height: 2px;
    background: var(--c-gold-500);
    transform: scaleX(0);
    transition: transform var(--t-base);
}

.nav a:hover::after,
.nav a.is-active::after,
.nav a[aria-current="page"]::after {
    transform: scaleX(1);
}

.header-actions {
    display: flex;
    align-items: center;
    gap: var(--s3);
    flex-shrink: 0;
}

/* ══ 顶栏 · 登录按钮（未登录态，替代用户下拉） ══ */
.login-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* 与 .user-chip 同高，保证顶栏高度一致 */
    min-height: 44px;
    padding: 0 var(--s5);
    border: 1px solid var(--c-gold-500);
    border-radius: var(--r-full);
    /* button 重置默认外观 */
    background: var(--c-red-glass);
    color: var(--c-gold-500);
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    cursor: pointer;
    transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
}

.login-btn:hover {
    background: var(--c-red-600);
    color: var(--c-paper-2);
}

.login-btn:focus-visible {
    outline: 2px solid var(--c-ring);
    outline-offset: 3px;
}

/* 实底顶栏（宣纸底）：金色描边在浅底上对比不足，改用绛红描边 + 宣纸底 */
.header.is-solid .login-btn {
    background: var(--c-red-100);
    border-color: var(--c-red-600);
    color: var(--c-red-700);
}

.header.is-solid .login-btn:hover {
    background: var(--c-red-600);
    color: var(--c-paper-2);
}

/* ══ 顶栏 · 用户头像下拉（自建，v3 风格） ══ */
.user-menu {
    position: relative;
}

.user-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--s2);
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
    min-height: 44px;
    /* 触发器为 button：重置默认外观 */
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
}

.user-caret {
    font-size: 10px;
    line-height: 1;
    opacity: .75;
    transition: transform var(--t-fast);
}

.user-chip[aria-expanded="true"] .user-caret {
    transform: rotate(180deg);
}

.user-dropdown {
    position: absolute;
    /* 左缘对齐「名字」起点（头像 36px + 间距 --s2 = 44px）：菜单落在名字正下方，替代原右对齐造成的偏移 */
    left: calc(36px + var(--s2));
    right: auto;
    top: calc(100% + var(--s2));
    /* 宽度由内容决定（最长项「跳转后台」），min-width 不窄于名字区，收掉原 168px 的右侧留白 */
    width: max-content;
    min-width: calc(100% - 36px - var(--s2));
    padding: var(--s1);
    background: var(--c-paper);
    border: 1px solid var(--c-border);
    border-radius: var(--r-sm);
    box-shadow: var(--shadow-md);
    z-index: 30;
}

.user-dropdown button {
    display: block;
    width: 100%;
    /* 行高保持 40px 点击区；水平 padding 收窄到 --s3，配合 max-content 去掉多余空白 */
    min-height: 40px;
    padding: 0 var(--s3);
    border: 0;
    background: transparent;
    /* 选项文字在面板内水平居中（面板仍左缘对齐名字，定位不变） */
    text-align: center;
    font-family: var(--font-display);
    letter-spacing: var(--tracking-wide);
    color: var(--c-ink-2);
    cursor: pointer;
    transition: background var(--t-fast), color var(--t-fast);
}

/* hover / 聚焦反白：红底金字 */
.user-dropdown button:hover,
.user-dropdown button:focus-visible {
    background: var(--c-red-600);
    color: var(--c-gold-500);
}

.user-av {
    width: 36px;
    height: 36px;
    border-radius: var(--r-full);
    border: 1px solid var(--c-gold-500);
    background: var(--c-red-100);
    display: grid;
    place-items: center;
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--c-gold-500);
}

/* 图片头像：由内联 background-image 铺满（尺寸 / 圆形 / 配色不变） */
.user-av--img {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    overflow: hidden;
}
</style>
