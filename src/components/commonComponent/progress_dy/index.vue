<template>
  <div v-show="visible" class="global-progress" :class="'style-' + configdata.blm + ' ' + configdata.blm">
    <div class="progress-content">
      <Progress :percent="percent" :stroke-width="30" :status="status" stroke-color="#2d8cf0" hide-info />
      <div class="progress-text">{{ percent }}%</div>
    </div>
  </div>
</template>

<script>
    export default {
        props: {
            configdata: { type: Object, default: () => { return {} } }
        },
        data () {
            return {
                visible: false,
                percent: 0,
                status: 'active'
            }
        },
        methods: {
            start () {
                this.visible = true
                this.percent = 0
                this.status = 'active'
            },
            update (percent) {
                this.percent = Math.min(Math.max(percent, 0), 100)
                if (percent >= 100) {
                    this.status = 'success'
                }
            },
            hide () {
                this.visible = false
            }
        }
    }
</script>

<style scoped>
.global-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-content {
  width: 500px;
  text-align: center;
}

.progress-text {
  margin-top: 10px;
  font-size: 20px;
  color: #2d8cf0;
}
</style>
