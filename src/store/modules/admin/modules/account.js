/**
 * 注册、登录、注销
 * */
import { createRouter } from 'vue-router';
import util from '@/libs/util';
import router, { resetRouter } from '@/router';
import routerList from '@/router/routes';
import { AccountLogin, casLogin, AccountLogout, AccountRegister } from '@api/account';
import { Modal } from 'view-ui-plus';
import { refershSider } from '@/menu/sider'
import Setting from '@/setting';
import store from '@/store';
import * as commonsJs from '@/api/common';

// 防止退出登录时重复调用
let isLoggingOut = false;

export default {
  namespaced: true,
  actions: {
    /**
     * @description 登录
     * @param {Object} param context
     * @param {Object} param username {String} 用户账号
     * @param {Object} param password {String} 密码
     * @param {Object} param route {Object} 登录成功后定向的路由对象 任何 vue-router 支持的格式
     */
    async login ({ dispatch }, { username = '', password = '', key = '', code = '', loginType = 'default', xxdm = '' } = {}) {
      // 开始请求登录接口
      const res = await AccountLogin({ username, password, key, code, loginType, xxdm })
      if (res.code == 200) {
          await dispatch('setRoutesAndUser', res.user);
      }
      return res;
    },

    /**
     * @description username登录
     */
    async usernameLogin ({ dispatch }, { username }) {
      if (username) {
        username = commonsJs.encrypt(username);
        const key = commonsJs.md5('inco_' + username + '_inco')
        const res = await commonsJs.incoRequest('/sys/usernameLogin', '', { username, key });
        if (res && res.token) {
          await dispatch('setRoutesAndUser', res);
        }
        return res;
      }
    },

    /**
     * @description CAS登录
     */
    async caslogin ({ dispatch }, { token }) {
      let res;
      if (token) {
        // 开始请求登录接口
        res = await casLogin({ token });
        if (res && res.token) {
          localStorage.setItem('iscas' + '_' + commonsJs.setting.xmid, '1');
          await dispatch('setRoutesAndUser', res);
        }
      }
      return res;
    },

    /**
     * @description oauth2登录
     */
    async oauth2Login ({ dispatch }, { code }) {
      const res = await commonsJs.incoRequest('/sys/oauth2Login', '', { code });
      if (res.code == 200) {
        await dispatch('setRoutesAndUser', res.user);
      }
      return res;
    },

    /**
     * @description token登录
     */
    async tokenLogin ({ dispatch }, { key }) {
      const res = await commonsJs.incoRequest('/sys/tokenLogin', '', { key });
      if (res && res.token) {
        await dispatch('setRoutesAndUser', res);
      }
      return res;
    },

    /**
     * 设置路由及用户信息
     * @param username
     */
    async setRoutesAndUser ({ dispatch }, res) {
      localStorage.setItem('uuid' + '_' + Setting.xmid, res.id);
      localStorage.setItem('token' + '_' + Setting.xmid, res.token);
      localStorage.setItem('refreshToken' + '_' + Setting.xmid, res.refreshToken);

      // 找出最后一次登录的角色代码,如果没有则取第一个角色
      const lastloginrole = localStorage.getItem('lastloginrole' + '_' + Setting.xmid);
      let role = res.role.find(item => item.jsdm === lastloginrole);
      if (!role || !role.jsdm) role = res.role[0];
      if (role && role.jsdm) {
        res.jsdm = role.jsdm;
        res.jsmc = role.jsmc;
        localStorage.setItem('lastloginrole' + '_' + commonsJs.setting.xmid, res.jsdm);
        localStorage.setItem('userinfo' + '_' + commonsJs.setting.xmid, JSON.stringify(res));

        const routerlist = [...role.routerList];
        let newMenuList = [...role.menuList];
        let menulist_noAuthStr = localStorage.getItem('menulist_noAuth' + '_' + Setting.xmid)
        // 兼容之前浏览器的缓存
        if (menulist_noAuthStr && !menulist_noAuthStr.startsWith('[')) menulist_noAuthStr = commonsJs.decrypt_aes(menulist_noAuthStr)
        if (menulist_noAuthStr) {
          const menulist_noAuth = JSON.parse(menulist_noAuthStr);
          newMenuList = newMenuList.concat(menulist_noAuth);
        }
        // 将菜单放进缓存，刷新页面时需重新处理
        localStorage.setItem('menulist' + '_' + commonsJs.setting.xmid, commonsJs.encrypt_aes(JSON.stringify(newMenuList)));
        // 将路由放进缓存，刷新页面时需重新处理
        localStorage.setItem('routerlist' + '_' + commonsJs.setting.xmid, commonsJs.encrypt_aes(JSON.stringify(routerlist)));
        // 处理动态路由
        routerlist.map(item => {
          if (item.fwlx == 'kjw') addrouter(item, true, 'kjw');
          if (item.fwlx == 'ht') addrouter(item, true, 'ht');
          if (item.fwlx == 'qt') addrouter(item, true, 'qt');
        })

        function recursion (data, auth) {
          // 处理路由参数
          const router_props = {};
          if (data.router_props) {
            const propsArr = data.router_props.split('&');
            for (const props of propsArr) {
              router_props[props.split('=')[0]] = props.split('=')[1];
            }
          }
          const routerObj = {
            path: data.url,
            name: data.router_name,
            // props: {routerProps:router_props},
            meta: {
              auth,
              title: data.qxmc,
              cache: true
            },
            children: [],
            component: () => import(/* webpackExclude: /\.html$/ */ '@/pages' + data.zjurl)
          };
          if (Object.keys(router_props).length > 0) {
            routerObj.props = { routerProps: router_props }
          }
          if (data.children) {
            data.children.map(item => {
              if (item.router_type == 'child') {
                // 子路由也使用 addRoute
                const childRouter = recursion(item, auth);
                routerObj.children.push(childRouter);
              } else {
                if (item.fwlx == 'kjw') addrouter(item, true, 'kjw');
                if (item.fwlx == 'ht') addrouter(item, true, 'ht');
                if (item.fwlx == 'qt') addrouter(item, true, 'qt');
              }
            })
          }
          return routerObj;
        }

        function addrouter (item, auth = false, parentName) {
          const routerObj = recursion(item, auth);

          // 使用 router.addRoute 动态添加路由
          if (parentName === 'kjw') {
            // 顶层路由，直接添加
            router.addRoute(routerObj);
            // 同时添加到 routerList 用于菜单显示
            if (!routerList.find(r => r.path === routerObj.path)) {
              routerList.push(routerObj);
            }
          } else if (parentName === 'ht') {
            // 作为 ht 的子路由添加
            router.addRoute('ht', routerObj);
            if (!routerList[0].children.find(r => r.path === routerObj.path)) {
              routerList[0].children.push(routerObj);
            }
          } else if (parentName === 'qt') {
            // 作为 qt 的子路由添加
            router.addRoute('qt', routerObj);
            if (!routerList[1].children.find(r => r.path === routerObj.path)) {
              routerList[1].children.push(routerObj);
            }
          }
        }

        // 设置 vuex 用户信息
        await dispatch('admin/user/set', res, { root: true });
        // 用户登录后从持久化数据加载一系列的设置
        await dispatch('load');
        // 初始化动态路由列表到page仓库
        store.commit('admin/page/init', routerList[0].children)

        // 刷新菜单
        refershSider();
      }
    },

    /**
     * @description 退出登录
     * */
    logout ({ commit, dispatch }, { confirm = false, vm, method } = {}) {
      // 未登录（游客）时直接忽略：
      // 接口拦截器会把 code===1 / 401 / 403(无 refreshToken) 也路由到这里
      // （src/plugins/request/index.js）。游客本就没有会话可退出，若仍走一遍
      // 清状态 + 整页刷新，就会「刷新 → 页面再次发请求 → 再次退出」形成死循环。
      const token = localStorage.getItem('token' + '_' + Setting.xmid)
      let hasSession = !!(token && token !== 'undefined')
      if (!hasSession) {
        try {
          const info = (store.state.admin.user && store.state.admin.user.info) || {}
          hasSession = !!(info.id || info.xm)
        } catch (e) {
          hasSession = false
        }
      }
      if (!hasSession) return;

      async function logout (routername) {
        // 防止重复调用导致死循环
        if (isLoggingOut) return;
        isLoggingOut = true;

        try {
          let menulist_noAuthStr = localStorage.getItem('menulist_noAuth' + '_' + Setting.xmid)
          // 兼容之前浏览器的缓存
          if (menulist_noAuthStr && !menulist_noAuthStr.startsWith('[')) menulist_noAuthStr = commonsJs.decrypt_aes(menulist_noAuthStr)
          const lastloginrole = localStorage.getItem('lastloginrole' + '_' + Setting.xmid)
          const iscas = localStorage.getItem('iscas' + '_' + Setting.xmid)
          // 注销后端数据：后端注销失败也要清本地登录态，避免残留用户信息
          try {
            await AccountLogout({ refreshToken: localStorage.getItem('refreshToken' + '_' + Setting.xmid) })
          } catch (e) {
            console.error('退出登录接口异常:', e)
          }
          // 先清空 vuex/持久化用户信息，再清 localStorage：
          // db.js 会根据 localStorage['uuid_<xmid>'] 推导存储路径，
          // 若先 localStorage.clear()，空用户对象会写到 'ghost-uuid' 路径下，
          // 真正用户的持久化信息仍留在原路径，之后又会被读出来显示成旧用户名
          await dispatch('admin/user/set', {}, { root: true });
          util.db.set('defaultdb.user', {}).write();
          util.db.set('sys.user', {}).write();
          // 删除localStorage中的数据
          localStorage.clear();
          localStorage.setItem('lastloginrole' + '_' + commonsJs.setting.xmid, lastloginrole);
          if (menulist_noAuthStr) {
            localStorage.setItem('menulist_noAuth' + '_' + commonsJs.setting.xmid, commonsJs.encrypt_aes(menulist_noAuthStr));
          }

          // 执行退出后方法
          if (method) {
            const func = new Function('_this', 'obj', method)
            func(vm, {})
          }

          // 退出跳转：非 CAS、以及 CAS 非单点登出场景，都强制整页刷新回门户首页。
          // 用 location.replace（不写入历史）而非 router.push，彻底清空内存态
          // （keep-alive 缓存页、$root 低代码状态等），避免退出后仍残留已登录数据。
          // 复用 router.resolve 拿带 routerBase 的 href，兼容部署基路径非 '/'。
          if (Setting.casEnable && iscas == '1') {
            // CAS 单点登出：交给 CAS 登出地址
            window.location.href = Setting.caslogoutUrl
          } else if (!routername) {
            const homeHref = router.resolve({ name: 'portal-home' }).href
            window.location.replace(homeHref)
          }

          // 路由跳转完成后重置路由，清除动态路由
          resetRouter();
        } finally {
          isLoggingOut = false;
        }
      }

      if (confirm) {
        Modal.confirm({
          title: vm.$t('basicLayout.logout.confirmTitle'),
          content: vm.$t('basicLayout.logout.confirmContent'),
          onOk () { logout(); }
        });
      } else {
        logout();
      }
    },
    /**
     * @description 注册
     * @param {Object} param context
     * @param {Object} param mail {String} 邮箱
     * @param {Object} param password {String} 密码
     * @param {Object} param mobile {String} 手机号码
     * @param {Object} param captcha {String} 验证码
     */
    async register ({
      dispatch
    }, {
      mail = '',
      password = '',
      mobile = '',
      captcha = ''
    } = {}) {
      // 开始请求登录接口
      const res = await AccountRegister({
        mail,
        password,
        mobile,
        captcha
      })
      // 注册成功后，完成与登录一致的操作
      // 注册也可视情况不返还 uuid、token 等数据，在注册完成后，由前端自动执行一次登录逻辑
      localStorage.setItem('uuid' + '_' + commonsJs.setting.xmid, res.uuid);
      localStorage.setItem('token' + '_' + commonsJs.setting.xmid, res.token);
      localStorage.setItem('refreshToken' + '_' + commonsJs.setting.xmid, res.refreshToken);
      // 设置 vuex 用户信息
      await dispatch('admin/user/set', res.info, {
        root: true
      });
      // 用户登录后从持久化数据加载一系列的设置
      await dispatch('load');
    },
    /**
     * @description 用户登录后从持久化数据加载一系列的设置
     * @param {Object} state vuex state
     * @param {Object} dispatch vuex dispatch
     */
    load ({
      state,
      dispatch
    }) {
      return new Promise(async resolve => {
        // 加载用户登录信息
        await dispatch('admin/user/load', null, {
          root: true
        });
        // 持久化数据加载上次退出时的多页列表
        await dispatch('admin/page/openedLoad', null, {
          root: true
        });
        // end
        resolve();
      })
    }
  }
};
