<template>
    <div style="width:100%">
        <slot name="header"></slot>
        <slot></slot>
        <slot name="footer"></slot>
    </div>
</template>
<script>
    export default {
        name: 'divlayout'
    }

</script>
