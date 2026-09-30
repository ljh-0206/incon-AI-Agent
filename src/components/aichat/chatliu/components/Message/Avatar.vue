<template>
  <span class="text-[28px] dark:text-white">
    <img :src="image ? stuAvatar : defaultAvatar" />
  </span>
</template>
<script>
// import defaultAvatar from '@/assets/icon.png';
    import defaultAvatar from '@/assets/images/avatar.png';
    import avatar from '@/assets/images/avatar.png';
    import { mapState } from 'vuex';
    import Setting from '@/setting'
    export default {
        props: {
            image: {
                type: Boolean,
                default: false
            }
        },
        data () {
            return {
                defaultAvatar,
                stuAvatar: ''
            }
        },
        computed: {
            ...mapState('admin/user', ['info'])
        },
        mounted () {
            if (this.info.zpid) {
                this.stuAvatar = this.commonsJs.downloadFile(this.info.zpid, this)
            } else {
                this.stuAvatar = avatar;
            }
            console.log(this.stuAvatar);
        }
    }
</script>
<style lang="less" scoped>
img {
  width: 32px;
  height: 32px;
}
</style>
