import { createRouter, createWebHashHistory } from 'vue-router'

import DefaultWiev from './components/DefaultWiev.vue'
import NumberBus from './components/NumberBus.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: DefaultWiev},
    { path: '/numberbus', component: NumberBus}
  ]
})

export default router