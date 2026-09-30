export default {
    install (app) {
        app.config.globalProperties.$set = function (obj, blm, value) {
            obj[blm] = value
        }
    }
}
