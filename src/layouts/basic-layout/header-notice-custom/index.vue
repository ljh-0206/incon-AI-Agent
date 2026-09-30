<!--
 * @Author: Chenxu
 * @Date: 2021-10-13 15:00:52
 * @LastEditTime: 2021-10-22 11:00:21
 * @Msg: Nothing
-->
<template>
  <div class="notice-custom i-layout-header-trigger i-layout-header-trigger-min">
    <Badge class="badge" :count="count">
      <Icon type="ios-notifications" size="26"></Icon>
    </Badge>
  </div>
</template>

<script>
    export default {
        name: 'notice-custom',
        data () {
            return {
                count: 0
            }
        },
        mounted () {},
        methods: {}
    }
</script>

<style>
.badge {
  line-height: 30px;
}
</style>
