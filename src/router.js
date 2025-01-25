import { createRouter, createWebHashHistory } from 'vue-router'

import DefaultWiev from './components/DefaultWiev.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: DefaultWiev,}
  ]
})

export default router