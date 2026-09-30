<template>
  <span class="i-layout-header-trigger i-layout-header-trigger-min">
    <Dropdown :trigger="isMobile ? 'click' : 'hover'" class="i-layout-header-user"
              :class="{ 'i-layout-header-user-mobile': isMobile }" @on-click="handleClick">
      <Avatar size="default" :src="info.avatar || require('@/assets/images/avatar.png')"/>
      <span class="i-layout-header-user-name">{{ info.xm }}</span>
      <span class="i-layout-header-role-name" v-if="info.role && info.role.length>1">（{{ info.jsmc }}）</span>
      <template #list>
        <DropdownMenu>
<!--        <i-link to="/setting/user">-->
<!--          <DropdownItem>-->
<!--            <Icon type="ios-contact-outline"/>-->
<!--            <span>个人中心</span>-->
<!--          </DropdownItem>-->
<!--        </i-link>-->
          <!-- <i-link to="/setting/account">
                      <DropdownItem>
                          <Icon type="ios-settings-outline" />
                          <span>{{ $t('basicLayout.user.setting') }}</span>
                      </DropdownItem>
                  </i-link>  -->
          <DropdownItem name="xgmm" v-if="showXgmm">
              <Icon type="ios-lock"/>
              <span>修改密码</span>
          </DropdownItem>
          <DropdownItem name="qhjs" v-if="info.role && info.role.length>1">
              <Icon type="ios-switch"/>
              <span>切换角色</span>
          </DropdownItem>
          <DropdownItem name="dsbdl" v-if="showDsbdl">
            <Icon type="ios-people" />
              <span>{{info.dsbdl=='1'?'禁止多设备登录':'允许多设备登录'}}</span>
          </DropdownItem>
          <DropdownItem name="qhqt" v-if="have_qt()">
            <Icon type="ios-git-compare" />
              <span>切换到前台</span>
          </DropdownItem>
        <DropdownItem name="logout">
          <Icon type="ios-log-out"/>
          <span>{{ $t('basicLayout.user.logOut') }}</span>
        </DropdownItem>
      </DropdownMenu>
      </template>
    </Dropdown>
  </span>
</template>
<script>
    import { mapState, mapActions } from 'vuex';
    import { szDsbdl } from '@api/system';
    import store from '@/store';
    import * as commonsJs from '@/api/common';
    import Setting from '@/setting';

    export default {
        name: 'iHeaderUser',
        computed: {
            ...mapState('admin/user', ['info']),
            ...mapState('admin/layout', ['isMobile', 'logoutConfirm', 'showDsbdl', 'showXgmm', 'showQhdqd'])
        },
        data () {
            return {
            }
        },
        methods: {
            ...mapActions('admin/account', ['logout']),
            handleClick (name) {
                if (name === 'xgmm') {
                    const token = localStorage.getItem('token' + '_' + Setting.xmid);
                    this.$xgmm({ token })
                }
                if (name === 'logout') {
                    this.logout({
                        confirm: this.logoutConfirm,
                        vm: this
                    })
                }
                // 切换角色
                if (name === 'qhjs') {
                    this.$qhjs({ self: this })
                }
                // 切换到前台
                if (name === 'qhqt') {
                    this.$router.replace({ name: 'qt' })
                }
                // 设置是否允许多设备登录
                if (name === 'dsbdl') {
                    let dsbdl = '1';
                    let msg = '确定设置为允许在多个设备上同时登录您的账号？';
                    if (this.info.dsbdl === '1') {
                        dsbdl = '0';
                        msg = '确定设置为禁止在多个设备上同时登录您的账号？';
                    }
                    this.$Modal.confirm({
                        title: '设置是否允许多设备登录',
                        content: msg,
                        onOk: () => {
                            szDsbdl({ dsbdl }).then(async (res) => {
                                this.$Message.success('设置是否允许多设备登录成功');
                                const userinfo = JSON.parse(localStorage.getItem('userinfo' + '_' + Setting.xmid));
                                userinfo.dsbdl = dsbdl;
                                localStorage.setItem('userinfo' + '_' + Setting.xmid, JSON.stringify(userinfo));
                                // 设置 vuex 用户信息
                                await store.dispatch('admin/user/set', userinfo, { root: true });
                                // 加载用户登录信息
                                await store.dispatch('admin/user/load', null, { root: true });
                            })
                        }
                    })
                }
            },
            handleSubmit (valid, { mail, password }) {
                if (valid) {
                    this.$Modal.info({
                        title: '输入的内容如下：',
                        content: 'mail: ' + mail + ' | password: ' + password
                    });
                }
            },
            have_qt () {
                let returnValue = false
                if (this.showQhdqd) {
                    let routerlist_local = localStorage.getItem('routerlist' + '_' + Setting.xmid)
                    // 兼容之前浏览器的缓存
                    if (routerlist_local && !routerlist_local.startsWith('[')) routerlist_local = commonsJs.decrypt_aes(routerlist_local)
                    if (routerlist_local) {
                        routerlist_local = JSON.parse(routerlist_local);
                        for (let menu = 0; menu < routerlist_local.length; menu++) {
                            if (routerlist_local[menu].fwlx === 'qt') {
                                returnValue = true;
                                break;
                            }
                        }
                    }
                }
                return returnValue
            }
        }
    }
</script>
<style scoped>
  .i-layout-header-user-name{
    font-size: 18px;
    font-weight: 500;
    color: #333;
    vertical-align: sub;
  }
  .i-layout-header-role-name{
    vertical-align: sub;
  }
</style>
