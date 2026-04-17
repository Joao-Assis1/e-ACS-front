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
        },
        {
          path: 'families',
          name: 'families',
          component: () => import('../views/FamilyListView.vue'),
        },
        {
          path: 'people',
          name: 'people',
          component: () => import('../views/PersonListView.vue'),
        },
        {
          path: 'visits',
          name: 'visits',
          component: () => import('../views/VisitHistoryView.vue'),
        },
      ],
    },
    {
      path: '/families/:familyId/citizens/new',
      name: 'citizen-create',
      component: () => import('../views/IndividualFormView.vue'),
      props: true,
      meta: { requiresAuth: true, transition: 'slide-left' },
    },
    {
      path: '/citizens/:id/edit',
      name: 'citizen-edit',
      component: () => import('../views/IndividualFormView.vue'),
      props: true,
      meta: { requiresAuth: true, transition: 'slide-left' },
    },
    {
      path: '/households/new',
      name: 'household-create',
      component: () => import('../views/HouseholdFormView.vue'),
      meta: { requiresAuth: true, transition: 'slide-left' },
    },
    {
      path: '/families/:familyId/risk',
      name: 'family-risk',
      component: () => import('../views/FamilyRiskView.vue'),
      props: true,
      meta: { requiresAuth: true, transition: 'slide-left' },
    },
    {
      path: '/households/:id',
      name: 'household-detail',
      component: () => import('../views/HouseholdDetailView.vue'),
      meta: { requiresAuth: true, transition: 'slide-left' },
    },
    {
      path: '/households/:id/edit',
      name: 'household-edit',
      component: () => import('../views/HouseholdFormView.vue'),
      meta: { requiresAuth: true, transition: 'slide-left' },
    },
    {
      path: '/citizens/:id',
      name: 'citizen-detail',
      component: () => import('../views/IndividualDetailView.vue'),
      props: true,
      meta: { requiresAuth: true, transition: 'slide-left' },
    },
    {
      path: '/families/:familyId/visit',
      name: 'family-visit',
      component: () => import('@/views/FamilyVisitView.vue'),
      props: true,
      meta: { requiresAuth: true, transition: 'slide-left' },
    },
    {
      path: '/citizens/:citizenId/visit',
      name: 'citizen-visit',
      component: () => import('@/views/IndividualVisitView.vue'),
      props: true,
      meta: { requiresAuth: true, transition: 'slide-left' },
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
