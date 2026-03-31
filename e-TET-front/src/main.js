import { createApp } from 'vue'
import { createPinia } from 'pinia'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue'
import router from './router'

const etetTheme = {
  dark: false,
  colors: {
    primary: '#05684B',
    'primary-darken-1': '#044A35',
    secondary: '#0C9C6E',
    'secondary-darken-1': '#087A56',
    accent: '#00BFA5',
    error: '#C62828',
    warning: '#E65100',
    info: '#0277BD',
    success: '#2E7D32',
    background: '#F0F4F3',
    surface: '#FFFFFF',
    'surface-variant': '#F5F7F6',
    'on-background': '#1A2332',
    'on-surface': '#1A2332',
  },
}

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'etetTheme',
    themes: { etetTheme },
  },
  defaults: {
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      rounded: 'lg',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      rounded: 'lg',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      rounded: 'lg',
    },
    VBtn: {
      rounded: 'lg',
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
