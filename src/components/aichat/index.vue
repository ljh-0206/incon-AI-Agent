<template>
    <div class="aichat">
       <apiChat
       kcid="84356ecff58047bfa56a7f6d4cd779d3" propskcid="84356ecff58047bfa56a7f6d4cd779d3" kcmc="微机原理"
            :height="690"
            :showAi="showAi"
            @cancel="showAi = false"
        />
    </div>
</template>

<script>

    import apiChat from './apiChat';
    export default {
        name: 'AIChat',
        components: {
            apiChat
        },
        data () {
            return {
                kcid: this.$route.params.id,
                kcmc: this.$route.params.kcmc,
                showAi: true
            };
        },
        methods: {
        }
    };
</script>

<style scoped>
</style>
