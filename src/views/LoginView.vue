<template>
  <v-container class="login-page fill-height" fluid>
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="10" md="6" lg="4" xl="3" class="px-4">
        <div class="login-card-wrapper">
          <v-card class="login-card" elevation="12" rounded="xl">
            <!-- Green branded header -->
            <div class="login-header">
              <div class="login-header__icon">
                <v-icon size="52" color="white">mdi-home-city</v-icon>
              </div>
              <h1 class="login-header__title">e-ACS</h1>
              <p class="login-header__subtitle">Território Eletrônico</p>
            </div>

            <!-- Form -->
            <v-card-text class="px-6 pt-8 pb-2">
              <v-alert
                v-if="authStore.error"
                type="error"
                variant="tonal"
                class="mb-5"
                closable
                rounded="lg"
                @click:close="authStore.error = null"
              >
                {{ authStore.error }}
              </v-alert>

              <v-form @submit.prevent="handleLogin" ref="formRef">
                <label class="field-label">Usuario (Implementar validação CPF)</label>
                <v-text-field
                  v-model="username"
                  placeholder="Digite seu CPF"
                  prepend-inner-icon="mdi-account-outline"
                  :rules="[rules.required]"
                  hide-details="auto"
                  class="mb-5"
                  autofocus
                  data-testid="login-username"
                />

                <label class="field-label">Senha</label>
                <v-text-field
                  v-model="password"
                  placeholder="Digite sua senha"
                  prepend-inner-icon="mdi-lock-outline"
                  :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                  @click:append-inner="showPassword = !showPassword"
                  :type="showPassword ? 'text' : 'password'"
                  :rules="[rules.required]"
                  hide-details="auto"
                  class="mb-7"
                  data-testid="login-password"
                />

                <v-btn
                  type="submit"
                  size="x-large"
                  block
                  :loading="authStore.loading"
                  color="secondary"
                  class="text-none font-weight-bold login-btn"
                  rounded="lg"
                  elevation="3"
                  data-testid="login-submit"
                >
                  <v-icon start>mdi-login-variant</v-icon>
                  Entrar
                </v-btn>
              </v-form>
            </v-card-text>

            <!-- Footer -->
            <div class="login-footer">
              <span>Versão 1.0.0</span>
              <span class="text-medium-emphasis">Sistema de Atenção Territorial</span>
            </div>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const formRef = ref(null)
const username = ref('')
const password = ref('')
const showPassword = ref(false)

const rules = {
  required: (v) => !!v || 'Campo obrigatório',
}

const handleLogin = async () => {
  const { valid } = await formRef.value.validate()
  if (valid) {
    const success = await authStore.login(username.value, password.value)
    if (success) {
      router.push({ name: 'households' })
    }
  }
}
</script>

<style scoped>
.login-page {
  background: linear-gradient(160deg, #e8f5e9 0%, #f0f4f3 40%, #ffffff 100%);
  min-height: 100vh;
}

.login-card-wrapper {
  animation: card-enter 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-card {
  overflow: hidden;
}

.login-header {
  background: linear-gradient(135deg, #05684b 0%, #0c9c6e 100%);
  padding: 40px 24px 32px;
  text-align: center;
  position: relative;
}

.login-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 24px;
  background: white;
  border-radius: 24px 24px 0 0;
}

.login-header__icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-header__title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: -0.5px;
}

.login-header__subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 4px 0 0;
  font-weight: 400;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.field-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
  margin-left: 2px;
}

.login-btn {
  letter-spacing: 0.3px;
  font-size: 1rem;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.login-btn:hover {
  transform: translateY(-1px);
}

.login-btn:active {
  transform: translateY(0);
}

.login-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 16px 24px 20px;
  font-size: 0.75rem;
  color: #94a3b8;
}

@media (prefers-reduced-motion: reduce) {
  .login-card-wrapper {
    animation: none;
  }
  .login-btn {
    transition: none;
  }
}
</style>
