<template>
  <div :style="configdata.style">
    <slot></slot>
  </div>
</template>
<script>

    export default {
        name: 'container',
        components: {},
        props: { configdata: { type: Object, default: function () { return {}; } } }
    };
</script>
