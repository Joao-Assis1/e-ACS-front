import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('../layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/households',
        },
        {
          path: 'households',
          name: 'households',
          component: () => import('../views/HouseholdListView.vue'),
          meta: { title: 'Domicílios' },
        },
        {
          path: 'households/new',
          name: 'household-create',
          component: () => import('../views/HouseholdFormView.vue'),
          meta: { transition: 'slide-left', showBack: true, title: 'Novo Domicílio' },
        },
        {
          path: 'households/:id',
          name: 'household-detail',
          component: () => import('../views/HouseholdDetailView.vue'),
          meta: { transition: 'slide-left', showBack: true, title: 'Detalhes do Domicílio' },
        },
        {
          path: 'households/:id/edit',
          name: 'household-edit',
          component: () => import('../views/HouseholdFormView.vue'),
          meta: { transition: 'slide-left', showBack: true, title: 'Editar Domicílio' },
        },
        {
          path: 'families',
          name: 'families',
          component: () => import('../views/FamilyListView.vue'),
          meta: { title: 'Famílias' },
        },
        {
          path: 'families/:familyId/citizens/new',
          name: 'citizen-create',
          component: () => import('../views/IndividualFormView.vue'),
          props: true,
          meta: { transition: 'slide-left', showBack: true, title: 'Novo Cidadão' },
        },
        {
          path: 'families/:familyId/risk',
          name: 'family-risk',
          component: () => import('../views/FamilyRiskView.vue'),
          props: true,
          meta: { transition: 'slide-left', showBack: true, title: 'Estratificação de Risco' },
        },
        {
          path: 'families/:familyId/visit',
          name: 'family-visit',
          component: () => import('@/views/FamilyVisitView.vue'),
          props: true,
          meta: { transition: 'slide-left', showBack: true, title: 'Visita Familiar' },
        },
        {
          path: 'people',
          name: 'people',
          component: () => import('../views/PersonListView.vue'),
          meta: { title: 'Cidadãos' },
        },
        {
          path: 'citizens/:id',
          name: 'citizen-detail',
          component: () => import('../views/IndividualDetailView.vue'),
          props: true,
          meta: { transition: 'slide-left', showBack: true, title: 'Detalhes do Cidadão' },
        },
        {
          path: 'citizens/:id/edit',
          name: 'citizen-edit',
          component: () => import('../views/IndividualFormView.vue'),
          props: true,
          meta: { transition: 'slide-left', showBack: true, title: 'Editar Cidadão' },
        },
        {
          path: 'citizens/:citizenId/visit',
          name: 'citizen-visit',
          component: () => import('@/views/IndividualVisitView.vue'),
          props: true,
          meta: { transition: 'slide-left', showBack: true, title: 'Visita Individual' },
        },
        {
          path: 'visits',
          name: 'visits',
          component: () => import('../views/VisitHistoryView.vue'),
          meta: { title: 'Histórico de Visitas' },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth !== false && !token) {
    return { name: 'login' }
  }
  if (to.name === 'login' && token) {
    return { name: 'households' }
  }
})

export default router
