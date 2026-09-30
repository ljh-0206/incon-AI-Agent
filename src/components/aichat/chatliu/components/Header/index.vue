<template>
  <header
    class="sticky top-0 left-0 right-0 z-0 border-b dark:border-neutral-800 bg-white/80 dark:bg-black/20 backdrop-blur">
    <div class="relative flex items-center justify-between min-w-0 overflow-hidden h-14">
      <div class="flex items-center">

      </div>
      <h1 class="flex-1 px-4 pr-6 overflow-hidden select-none text-ellipsis whitespace-nowrap">
        <strong>{{ title }}</strong>
        <Icon type="md-close-circle" class="float-right cursor-pointer" @click="$emit('cancel')" />
      </h1>
    </div>
  </header>
</template>

<script>
    export default {
        name: 'Header',
        props: {
            title: {
                type: String,
                default: '知识解答助手'
            }
        }
    }
</script>
<style lang="less" scoped>
h1 {
  font-size: 2em;
}
</style>
