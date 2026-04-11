<template>
  <div class="household-detail pb-10">
    <!-- Header customizado (Toolbar com fundo verde institucional) -->
    <v-toolbar color="primary" flat>
      <v-btn icon @click="handleBack">
        <v-icon color="white">mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="text-white font-weight-bold"
        >Informações do domicílio</v-toolbar-title
      >
      <v-spacer></v-spacer>
    </v-toolbar>

    <!-- Loading State -->
    <div v-if="householdStore.loading && !household" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="40" />
    </div>

    <template v-else-if="household">
      <v-container class="px-4 pt-4">
        <!-- Card de Endereço Principal -->
        <v-card class="mb-5 elevation-1 rounded-lg border">
          <v-card-text class="pa-4">
            <div class="d-flex align-start mb-4">
              <v-avatar color="#E8F5E9" size="64" rounded="lg" class="mr-4">
                <v-icon size="40" color="#2E7D32">mdi-home-outline</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis">
                  Rua
                </div>
                <div class="text-h6 font-weight-bold" style="color: #1a2332; line-height: 1.2">
                  {{ household.logradouro }}, {{ household.numero }}
                </div>
                <div class="text-body-2 text-medium-emphasis mt-1">
                  Microárea {{ household.microarea || '00' }}, {{ household.bairro }} —
                  {{ household.municipio }}
                </div>
              </div>

              <v-menu v-if="household">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    variant="outlined"
                    size="small"
                    color="grey-darken-1"
                    v-bind="props"
                    class="ml-2 bg-white"
                  />
                </template>
                <v-list density="compact" rounded="lg">
                  <v-list-item
                    prepend-icon="mdi-history"
                    title="Histórico de visitas"
                    @click="openHistoryDialog('household', household.id)"
                  />
                  <v-divider class="my-1" />
                  <v-list-item
                    prepend-icon="mdi-pencil"
                    title="Editar imóvel"
                    @click="goToEditDomicilio"
                  />
                  <v-list-item
                    prepend-icon="mdi-delete"
                    title="Excluir imóvel"
                    @click="confirmDeleteDomicilio = true"
                  />
                </v-list>
              </v-menu>
            </div>

            <div class="d-flex flex-wrap ga-2 mt-4">
              <v-chip size="small" color="primary" variant="tonal" class="font-weight-medium">
                {{ household.tipo_imovel }}
              </v-chip>
              <v-chip size="small" color="orange-darken-3" variant="flat" class="font-weight-bold text-white">
                <v-icon start size="16">mdi-home-clock</v-icon>
                {{ totalVisitsCount }} Visitas
              </v-chip>
              <v-chip size="small" color="orange-darken-1" variant="flat" class="font-weight-bold text-white">
                <v-icon start size="16">mdi-heart-pulse</v-icon>
                {{ healthConditionsCount }} Condições
              </v-chip>
            </div>

            <v-btn
              block
              color="#2E7D32"
              bg-color="#E8F5E9"
              variant="flat"
              size="large"
              rounded="lg"
              class="mt-5 text-none font-weight-bold"
              @click="openVisitDialog('household', household.id, household.id)"
            >
              <v-icon start>mdi-home-map-marker</v-icon>
              VISITAR DOMICÍLIO
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Detalhes Físicos do Domicílio -->
        <h3 class="text-overline font-weight-bold text-medium-emphasis mb-2 ml-1">
          CONDIÇÕES DE MORADIA
        </h3>
        <v-card class="mb-5 elevation-0 border rounded-lg">
          <v-list density="compact" class="py-0">
            <template v-for="(value, key, index) in housingDetails" :key="key">
              <v-list-item class="px-4 py-3">
                <div class="d-flex justify-space-between align-center w-100">
                  <span class="text-body-2 text-medium-emphasis font-weight-medium">{{ key }}</span>
                  <span
                    class="text-body-2 font-weight-bold ml-4 text-right"
                    style="color: #1a2332"
                    >{{ value || 'Não informado' }}</span
                  >
                </div>
              </v-list-item>
              <v-divider
                v-if="index < Object.keys(housingDetails).length - 1"
                class="my-0 border-b"
              />
            </template>
          </v-list>
        </v-card>

        <!-- Seção de Famílias -->
        <div class="d-flex justify-space-between align-center mb-3 ml-1 mt-6">
          <h3 class="text-overline font-weight-bold text-medium-emphasis mb-0">
            FAMÍLIAS RESIDENTES
          </h3>
          <v-btn
            variant="text"
            color="primary"
            size="small"
            class="text-none font-weight-bold"
            prepend-icon="mdi-plus"
            @click="openFamilyDialog()"
            >ADICIONAR</v-btn
          >
        </div>

        <div v-if="familiesWithIndividuals.length > 0" class="d-flex flex-column ga-4">
          <v-card
            v-for="family in familiesWithIndividuals"
            :key="family.id || family._tempId"
            class="elevation-1 border rounded-lg"
          >
            <!-- Faixa de Risco superior -->
            <div
              :class="`bg-${getFamilyRisk(family).color}`"
              class="px-4 py-1 d-flex justify-space-between align-center"
            >
              <span
                class="text-caption font-weight-bold text-white text-uppercase"
                style="letter-spacing: 0.5px"
                >Risco {{ getFamilyRisk(family).label }}</span
              >
              <v-icon size="small" color="white">{{ getFamilyRisk(family).icon }}</v-icon>
            </div>

            <v-card-text class="pa-0">
              <div class="pa-4 pb-3">
                <div class="d-flex justify-space-between align-start mb-4">
                  <div>
                    <div
                      class="text-caption text-medium-emphasis text-uppercase font-weight-bold mb-1"
                    >
                      Prontuário {{ family.numero_prontuario || 'Não gerado' }}
                    </div>
                    <div
                      class="text-body-1 font-weight-bold d-flex align-center"
                      style="color: #1a2332"
                    >
                      Família de
                      {{ family.responsavel?.nome_completo?.split(' ')[0] || 'Sem Responsável' }}
                      <v-icon
                        size="18"
                        color="grey"
                        @click="showFamilyInfo(family)"
                        class="ml-1 cursor-pointer"
                        >mdi-information-outline</v-icon
                      >
                    </div>
                  </div>
                  <div class="d-flex ga-2">
                    <v-btn
                      color="#2E7D32"
                      bg-color="#E8F5E9"
                      variant="flat"
                      size="small"
                      rounded="lg"
                      class="text-none font-weight-bold px-4"
                      @click="openVisitDialog('family', family.id || family._tempId, household.id)"
                      >VISITAR</v-btn
                    >

                    <!-- Menu da Família -->
                    <v-menu>
                      <template v-slot:activator="{ props }">
                        <v-btn
                          icon="mdi-dots-vertical"
                          variant="outlined"
                          size="small"
                          color="grey-darken-1"
                          v-bind="props"
                        />
                      </template>
                      <v-list density="compact" rounded="lg">
                        <v-list-item
                          prepend-icon="mdi-history"
                          title="Histórico de visitas"
                          @click="openHistoryDialog('family', family.id)"
                        />
                        <v-list-item
                          prepend-icon="mdi-swap-horizontal"
                          title="Família mudou"
                          @click="openFamilyMudouDialog(family)"
                        />
                        <v-list-item
                          prepend-icon="mdi-delete"
                          title="Excluir família"
                          @click="confirmDeleteFamily(family)"
                        />
                        <v-list-item
                          prepend-icon="mdi-pencil"
                          title="Editar família"
                          @click="openFamilyDialog(family)"
                        />
                        <v-divider class="my-1" />
                        <v-list-item
                          prepend-icon="mdi-shield-check-outline"
                          title="Estratificar risco"
                          @click="openRiskDialog(family)"
                          color="primary"
                          class="font-weight-bold"
                        />
                      </v-list>
                    </v-menu>
                  </div>
                </div>

                <!-- Alerta: Sem responsável -->
                <v-alert
                  v-if="!family.responsavel_id"
                  variant="outlined"
                  color="error"
                  class="pa-3 rounded-lg text-body-2 mb-4 bg-red-lighten-5"
                  density="compact"
                >
                  <template v-slot:prepend
                    ><v-icon size="20" color="error">mdi-alert-triangle</v-icon></template
                  >
                  <div class="font-weight-medium" style="color: #c62828">
                    Família sem responsável cadastrado.
                  </div>
                  <div style="color: #c62828" class="text-caption mt-1">
                    Se um novo responsável não for identificado a família será inativada na
                    sincronização.
                  </div>
                </v-alert>

                <v-divider class="my-0" />

                <!-- Cidadãos Vinculados -->
                <div v-if="family.mergedIndividuals.length > 0">
                  <template v-for="(ind, index) in family.mergedIndividuals" :key="ind.id || ind._tempId">
                    <div class="d-flex align-start justify-space-between py-3">
                      <div>
                        <div
                          @click="router.push({ name: 'citizen-edit', params: { id: ind.id } })"
                          class="text-subtitle-2 font-weight-bold cursor-pointer hover-text-primary"
                          style="color: #1a2332"
                        >
                          {{ ind.nome_completo || 'Não informado' }}
                          <span v-if="ind.is_responsavel" class="text-primary text-caption ml-1">(Responsável)</span>
                        </div>
                        <div class="text-caption text-medium-emphasis mb-2">
                          {{
                            ind.sexo === 'M' || ind.sexo === 'Masculino'
                              ? 'Masculino'
                              : ind.sexo === 'F' || ind.sexo === 'Feminino'
                                ? 'Feminino'
                                : (ind.sexo || 'Não informado')
                          }}
                          | {{ calculateAgeText(ind.data_nascimento) || 'Idade não informada' }}
                        </div>
                        <div
                          class="d-flex flex-wrap ga-1 mt-1"
                          v-if="Array.isArray(ind.healthConditions) && ind.healthConditions.length > 0"
                        >
                          <v-chip
                            size="x-small"
                            v-for="(cond, idx) in ind.healthConditions"
                            :key="idx"
                            color="#475569"
                            variant="flat"
                            class="font-weight-bold text-white"
                          >
                            {{ cond }}
                          </v-chip>
                        </div>
                        <div class="d-flex flex-wrap ga-2" v-else>
                          <v-chip
                            size="x-small"
                            color="#64748b"
                            variant="tonal"
                            class="font-weight-bold bg-grey-lighten-4"
                          >
                            Sem condições
                          </v-chip>
                        </div>
                      </div>
                      <div class="d-flex ga-2 align-center mt-1">
                        <v-btn
                          color="#2E7D32"
                          bg-color="#E8F5E9"
                          variant="flat"
                          size="small"
                          rounded="lg"
                          class="text-none font-weight-bold px-4"
                          @click="openVisitDialog('individual', ind.id || ind._tempId, household.id, family.id || family._tempId)"
                          >VISITAR</v-btn
                        >

                        <v-menu>
                          <template v-slot:activator="{ props }">
                            <v-btn
                              icon="mdi-dots-vertical"
                              variant="outlined"
                              size="small"
                              color="grey-darken-1"
                              v-bind="props"
                            />
                          </template>
                          <v-list density="compact" rounded="lg">
                            <v-list-item
                              prepend-icon="mdi-history"
                              title="Histórico de visitas"
                              @click="openHistoryDialog('individual', ind.id)"
                            />
                            <v-list-item
                              prepend-icon="mdi-pencil"
                              title="Editar cidadão"
                              @click="router.push({ name: 'citizen-edit', params: { id: ind.id } })"
                            />
                            <v-list-item
                              prepend-icon="mdi-map-marker-off"
                              title="Registrar saída (mudou/óbito)"
                              @click="openCitizenSaidaDialog(ind, family)"
                            />
                            <v-list-item
                              prepend-icon="mdi-delete"
                              title="Excluir cidadão"
                              @click="openDeleteCitizenDialog(ind, family)"
                            />
                          </v-list>
                        </v-menu>
                      </div>
                    </div>
                    <v-divider v-if="index < family.mergedIndividuals.length - 1" class="my-0" />
                  </template>
                </div>

                <div
                  v-if="!family.individuals || family.individuals.length === 0"
                  class="py-4 text-center text-body-2 text-medium-emphasis"
                >
                  Nenhum cidadão cadastrado nesta família.
                </div>

                <v-divider class="my-0 mb-2" />

                <!-- Rodapé do Card: Adicionar Cidadão -->
                <v-btn
                  block
                  variant="text"
                  color="#2E7D32"
                  class="text-none font-weight-bold"
                  prepend-icon="mdi-plus"
                  @click="router.push({ name: 'citizen-create', params: { familyId: family.id || family._tempId } })"
                  data-testid="add-citizen"
                >
                  ADICIONAR CIDADÃO
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- Empty state de Famílias -->
        <v-card
          v-else
          variant="outlined"
          class="dashed-card py-10 px-6 text-center"
          color="grey-lighten-2"
        >
          <v-avatar color="grey-lighten-4" size="96" class="mb-4">
            <v-icon size="48" color="grey-lighten-1">mdi-account-group-outline</v-icon>
          </v-avatar>
          <div class="text-body-1 font-weight-medium mb-1" style="color: #64748b">
            Ainda não existem famílias cadastradas
          </div>
          <div class="text-body-2 text-medium-emphasis mb-6">
            Comece cadastrando uma família para este domicílio
          </div>

          <v-btn
            variant="text"
            color="#2E7D32"
            class="text-none font-weight-bold"
            rounded="lg"
            @click="openFamilyDialog()"
            data-testid="add-family-empty"
          >
            CADASTRAR FAMÍLIA
          </v-btn>
        </v-card>
      </v-container>
    </template>

    <!-- Dialog: Registrar Visita Domiciliar/Familiar/Cidadão -->
    <v-dialog v-model="visitDialog" max-width="400" transition="dialog-bottom-transition">
      <v-card rounded="xl" class="overflow-hidden">
        <v-toolbar color="primary" class="px-2" flat height="64">
          <v-icon start color="white" class="ml-2">mdi-home-map-marker</v-icon>
          <v-toolbar-title class="text-white font-weight-bold text-subtitle-1"
            >Registrar Visita</v-toolbar-title
          >
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="white" @click="visitDialog = false"></v-btn>
        </v-toolbar>

        <v-card-text class="pt-5 px-5">
          <div class="text-subtitle-2 font-weight-bold mb-4 text-medium-emphasis text-uppercase">
            Desfecho da Visita
          </div>

          <v-item-group
            v-model="visitForm.desfecho"
            selected-class="bg-primary text-white"
            mandatory
          >
            <v-row dense>
              <v-col cols="12">
                <v-item value="Realizada" v-slot="{ isSelected, toggle }">
                  <v-card
                    :color="isSelected ? '#2E7D32' : 'white'"
                    :class="isSelected ? '' : 'border'"
                    class="d-flex align-center pa-3 mb-2 rounded-lg cursor-pointer"
                    elevation="0"
                    @click="toggle"
                  >
                    <v-icon :color="isSelected ? 'white' : 'grey-darken-1'" class="mr-3"
                      >mdi-check-circle-outline</v-icon
                    >
                    <div
                      class="font-weight-medium"
                      :class="isSelected ? 'text-white' : 'text-grey-darken-3'"
                    >
                      Visita Realizada
                    </div>
                  </v-card>
                </v-item>
              </v-col>
              <v-col cols="6">
                <v-item value="Recusa" v-slot="{ isSelected, toggle }">
                  <v-card
                    :color="isSelected ? 'error' : 'white'"
                    :class="isSelected ? '' : 'border'"
                    class="d-flex align-center pa-3 rounded-lg cursor-pointer"
                    elevation="0"
                    @click="toggle"
                  >
                    <v-icon :color="isSelected ? 'white' : 'grey-darken-1'" class="mr-2"
                      >mdi-close-circle-outline</v-icon
                    >
                    <div
                      class="font-weight-medium text-caption"
                      :class="isSelected ? 'text-white' : 'text-grey-darken-3'"
                    >
                      Recusa
                    </div>
                  </v-card>
                </v-item>
              </v-col>
              <v-col cols="6">
                <v-item value="Ausente" v-slot="{ isSelected, toggle }">
                  <v-card
                    :color="isSelected ? 'orange-darken-2' : 'white'"
                    :class="isSelected ? '' : 'border'"
                    class="d-flex align-center pa-3 rounded-lg cursor-pointer"
                    elevation="0"
                    @click="toggle"
                  >
                    <v-icon :color="isSelected ? 'white' : 'grey-darken-1'" class="mr-2"
                      >mdi-account-cancel-outline</v-icon
                    >
                    <div
                      class="font-weight-medium text-caption"
                      :class="isSelected ? 'text-white' : 'text-grey-darken-3'"
                    >
                      Ausente
                    </div>
                  </v-card>
                </v-item>
              </v-col>
            </v-row>
          </v-item-group>

          <v-divider class="my-5"></v-divider>

          <div class="text-subtitle-2 font-weight-bold mb-4 text-medium-emphasis text-uppercase">
            Turno
          </div>
          <v-btn-toggle
            v-model="visitForm.turno"
            color="#2E7D32"
            rounded="lg"
            divided
            variant="outlined"
            class="w-100"
            mandatory
          >
            <v-btn value="Manhã" class="flex-grow-1 text-none font-weight-bold">Manhã</v-btn>
            <v-btn value="Tarde" class="flex-grow-1 text-none font-weight-bold">Tarde</v-btn>
            <v-btn value="Noite" class="flex-grow-1 text-none font-weight-bold">Noite</v-btn>
          </v-btn-toggle>
        </v-card-text>

        <div class="pa-4 pt-2">
          <v-btn
            block
            color="#2E7D32"
            size="large"
            rounded="lg"
            elevation="0"
            class="text-none font-weight-bold mb-2"
            @click="handleConfirmVisit"
            :loading="visitStore.loading"
          >
            Confirmar e Salvar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Dialog: Histórico de Visitas -->
    <v-dialog v-model="historyDialog" max-width="500" scrollable>
      <v-card rounded="xl" max-height="80vh">
        <v-card-title class="pa-5 font-weight-bold border-b d-flex align-center">
          <v-icon start color="primary">mdi-history</v-icon>
          Histórico de Visitas
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="historyDialog = false" />
        </v-card-title>

        <v-card-text class="pa-0">
          <div v-if="visitStore.historyLoading" class="pa-10 text-center">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <v-list v-else-if="visitStore.history && visitStore.history.length > 0" lines="two">
            <template v-for="(visit, idx) in visitStore.history" :key="visit.id">
              <v-list-item>
                <template v-slot:prepend>
                  <v-avatar
                    :color="visit.desfecho === 'Realizada' ? 'green-lighten-4' : 'grey-lighten-3'"
                    size="40"
                  >
                    <v-icon
                      :color="visit.desfecho === 'Realizada' ? 'green-darken-3' : 'grey-darken-2'"
                    >
                      {{
                        visit.desfecho === 'Realizada'
                          ? 'mdi-check'
                          : visit.desfecho === 'Recusa'
                            ? 'mdi-close'
                            : 'mdi-minus'
                      }}
                    </v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold"
                  >{{ formatDate(visit.data_visita) }} — {{ visit.turno }}</v-list-item-title
                >
                <v-list-item-subtitle
                  >Desfecho: <strong>{{ visit.desfecho }}</strong></v-list-item-subtitle
                >
              </v-list-item>
              <v-divider v-if="idx < visitStore.history.length - 1" />
            </template>
          </v-list>
          <div v-else class="pa-10 text-center text-body-2 text-medium-emphasis">
            Nenhum registro de visita encontrado.
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog: Adicionar/Editar Familia -->
    <v-dialog v-model="familyDialog" max-width="500" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 font-weight-bold border-b text-primary">
          <v-icon start>mdi-account-group</v-icon>
          {{ editingFamilyId ? 'Editar Família' : 'Nova Família' }}
        </v-card-title>
        <v-card-text class="pa-5">
          <v-form ref="familyFormRef" @submit.prevent>
            <div class="mb-4">
              <label
                class="text-caption font-weight-bold text-medium-emphasis mb-1 d-block text-uppercase"
                >NÚMERO DO PRONTUÁRIO</label
              >
              <v-text-field
                v-model="familyForm.numero_prontuario"
                variant="outlined"
                density="comfortable"
                placeholder="Ex: 123456"
                hide-details="auto"
                data-testid="family-prontuario"
              />
            </div>
            <v-row class="mb-1 mt-0">
              <v-col cols="12" sm="6" class="py-1">
                <label
                  class="text-caption font-weight-bold text-medium-emphasis mb-1 d-block text-uppercase"
                  >MEMBROS DECLARADOS</label
                >
                <v-text-field
                  v-model.number="familyForm.membros_declarados"
                  type="number"
                  min="1"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  data-testid="family-membros"
                />
              </v-col>
              <v-col cols="12" sm="6" class="py-1">
                <label
                  class="text-caption font-weight-bold text-medium-emphasis mb-1 d-block text-uppercase"
                  >RESIDE DESDE</label
                >
                <v-text-field
                  v-model="familyForm.reside_desde"
                  placeholder="MM/AAAA"
                  label="Reside desde (Mês/Ano) *"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  :rules="[v => !!v || 'Campo obrigatório', v => /^\d{2}\/\d{4}$/.test(v) || 'Formato inválido (MM/AAAA)']"
                  data-testid="family-reside-desde"
                />
              </v-col>
            </v-row>
            <div class="mt-4">
              <label
                class="text-caption font-weight-bold text-medium-emphasis mb-1 d-block text-uppercase"
                >RENDA FAMILIAR</label
              >
              <v-select
                v-model="familyForm.renda_familiar"
                :items="rendaOptions"
                variant="outlined"
                density="comfortable"
                placeholder="Selecione a faixa de renda"
                hide-details="auto"
              />
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 border-t bg-grey-lighten-4">
          <v-btn variant="text" class="text-none font-weight-bold" @click="familyDialog = false"
            >Cancelar</v-btn
          >
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="flat"
            class="text-none font-weight-bold px-6"
            rounded="lg"
            @click="handleSaveFamily"
            :loading="familyStore.loading"
          >
            Salvar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Confirmação de Exclusão de Domicílio -->
    <v-dialog v-model="confirmDeleteDomicilio" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5 font-weight-bold">Excluir Domicílio?</v-card-title>
        <v-card-text class="px-5 pt-0">
          Você tem certeza que deseja excluir este domicílio e todas as famílias e cidadãos
          vinculados? Esta ação não pode ser desfeita.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="confirmDeleteDomicilio = false">Cancelar</v-btn>
          <v-spacer />
          <v-btn
            color="error"
            variant="flat"
            :loading="householdStore.loading"
            @click="handleDeleteDomicilio"
            >Excluir</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Família Mudou -->
    <v-dialog v-model="familyMudouDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5 font-weight-bold">
          <v-icon start color="warning">mdi-swap-horizontal</v-icon>
          Família Mudou
        </v-card-title>
        <v-card-text class="px-5 pt-0">
          <p class="mb-4 text-body-2">
            Esta família será desvinculada deste domicílio. Esta ação não pode ser desfeita.
          </p>
          <v-text-field
            v-model="familyMudouForm.motivo"
            label="Novo endereço / motivo (opcional)"
            variant="outlined"
            density="compact"
            hint="Preencha se souber o novo local"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="familyMudouDialog = false">CANCELAR</v-btn>
          <v-spacer />
          <v-btn
            color="warning"
            variant="flat"
            :loading="familyStore.loading"
            @click="handleFamilyMudou"
            class="font-weight-bold"
          >
            CONFIRMAR MUDANÇA
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Excluir Cidadão -->
    <v-dialog v-model="deleteCitizenDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5 font-weight-bold">
          <v-icon start color="error">mdi-delete</v-icon>
          Excluir Cidadão?
        </v-card-title>
        <v-card-text class="px-5 pt-0">
          <p>
            Você tem certeza que deseja excluir
            <strong>{{ deleteCitizenTarget?.nome_completo }}</strong
            >?
          </p>
          <p class="text-caption text-medium-emphasis mt-2">
            Esta ação é irreversível e removerá o cidadão permanentemente.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="deleteCitizenDialog = false">CANCELAR</v-btn>
          <v-spacer />
          <v-btn
            color="error"
            variant="flat"
            :loading="individualStore.loading"
            @click="handleDeleteCitizen"
            class="font-weight-bold"
          >
            EXCLUIR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Saída do Cidadão (Mudou / Óbito) -->
    <v-dialog v-model="citizenSaidaDialog" max-width="420">
      <v-card rounded="xl">
        <v-card-title class="pa-5 font-weight-bold">
          <v-icon start color="orange">mdi-map-marker-off</v-icon>
          Registrar Saída
        </v-card-title>
        <v-card-text class="px-5 pt-0">
          <p class="mb-4 text-body-2">
            Selecione o motivo da saída de <strong>{{ citizenSaidaTarget?.nome_completo }}</strong
            >.
          </p>
          <v-radio-group v-model="citizenSaidaForm.motivo_saida" color="primary">
            <v-radio label="Mudou de endereço" value="mudou" />
            <v-radio label="Óbito" value="obito" />
          </v-radio-group>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="citizenSaidaDialog = false">CANCELAR</v-btn>
          <v-spacer />
          <v-btn
            color="orange"
            variant="flat"
            :loading="individualStore.loading"
            @click="handleCitizenSaida"
            class="font-weight-bold"
          >
            CONFIRMAR SAÍDA
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Global Snackbar for Feedback -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="4000"
      location="top"
      rounded="pill"
    >
      <div class="d-flex align-center ga-2">
        <v-icon>{{ snackbar.icon }}</v-icon>
        <span class="font-weight-medium">{{ snackbar.text }}</span>
      </div>
      <template v-slot:actions>
        <v-btn icon="mdi-close" variant="text" @click="snackbar.show = false" size="small" />
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHouseholdStore } from '../stores/householdStore'
import { useFamilyStore } from '../stores/familyStore'
import { useIndividualStore } from '../stores/individualStore'
import { useVisitStore } from '../stores/visitStore'
import { useVisitCartStore } from '../stores/visitCartStore'
import { sanitizeFamilyPayload } from '../utils/sanitizePayload'
import { processIndividualFromApi } from '../utils/healthConditionMapper'
import { normalizeId, areIdsEqual } from '../utils/idNormalization'
import { calculateAgeText, formatToMonthYear } from '../utils/dateUtils'

const route = useRoute()
const router = useRouter()
const householdStore = useHouseholdStore()
const familyStore = useFamilyStore()
const visitStore = useVisitStore()
const visitCartStore = useVisitCartStore()
const individualStore = useIndividualStore()

const familyDialog = ref(false)
const confirmDeleteDomicilio = ref(false)
const deleteFamilyId = ref(null)
const editingFamilyId = ref(null)
const familyFormRef = ref(null)

// Dialog: Visita
const visitDialog = ref(false)
const visitContext = ref({ type: null, targetId: null, householdId: null, familyId: null })
const visitForm = ref({ desfecho: 'Realizada', turno: 'Manhã' })

// Dialog: Histórico
const historyDialog = ref(false)

// Dialog: Família Mudou
const familyMudouDialog = ref(false)
const familyMudouTargetId = ref(null)
const familyMudouForm = ref({ motivo: '' })

// Dialog: Excluir Cidadão
const deleteCitizenDialog = ref(false)
const deleteCitizenTarget = ref(null)
const deleteCitizenFamilyId = ref(null)

// Dialog: Saída do Cidadão
const citizenSaidaDialog = ref(false)
const citizenSaidaTarget = ref(null)
const citizenSaidaFamilyId = ref(null)
const citizenSaidaForm = ref({ motivo_saida: 'mudou' })
const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
  icon: 'mdi-check-circle'
})

const showMessage = (text, type = 'success') => {
  snackbar.text = text
  snackbar.color = type === 'success' ? '#2E7D32' : '#C62828'
  snackbar.icon = type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'
  snackbar.show = true
}

// Dialog: Estratificação de Risco (Removido p/ view própria)

const rendaOptions = [
  'Até 1/4 salário mínimo',
  'De 1/4 a 1/2 salário mínimo',
  'De 1/2 a 1 salário mínimo',
  'De 1 a 2 salários mínimos',
  'De 2 a 3 salários mínimos',
  'De 3 a 4 salários mínimos',
  'Mais de 4 salários mínimos',
]

const familyForm = ref({
  numero_prontuario: '',
  renda_familiar: '',
  membros_declarados: 1,
  reside_desde: '',
  responsavel_id: null,
})

const household = computed(() => householdStore.currentHousehold)

const allFamilies = computed(() => {
  const storeFamilies = familyStore.families || []
  const drafts = (visitCartStore.draftFamilies || []).filter(df => df.household_id === route.params.id)
  
  // Merge and avoid duplicates by id or _tempId
  const merged = [...storeFamilies]
  drafts.forEach(df => {
    if (!merged.find(f => areIdsEqual(f.id || f._tempId, df.id || df._tempId))) {
      merged.push(df)
    }
  })
  
  return merged
})

/**
 * Computed que mescla famílias e seus respectivos cidadãos.
 * Evita chamadas repetidas de funções no template e garante reatividade limpa.
 */
const familiesWithIndividuals = computed(() => {
  const families = allFamilies.value
  const storeIndividuals = (individualStore.individuals || []).map(processIndividualFromApi)
  const draftIndividuals = (visitCartStore.draftIndividuals || []).map(processIndividualFromApi)

  return families.map(family => {
    const familyId = normalizeId(family.id || family._tempId)

    // 1. Cidadãos que já vem na prop 'individuals' da família
    const internal = (family.individuals || []).map(processIndividualFromApi)

    // 2. Cidadãos do store global
    const fromStore = storeIndividuals.filter(i => areIdsEqual(i.family_id || i.family?.id, familyId))

    // 3. Rascunhos
    const fromDrafts = draftIndividuals.filter(i => areIdsEqual(i.family_id || i.family?.id, familyId))

    // Mesclar sem duplicatas
    const merged = [...internal]
    const allOthers = [...fromStore, ...fromDrafts]

    allOthers.forEach(ind => {
      const isDuplicate = merged.find(m => areIdsEqual(m.id || m._tempId, ind.id || ind._tempId))
      if (!isDuplicate) merged.push(ind)
    })

    return {
      ...family,
      individuals: family.individuals || [],
      mergedIndividuals: merged
    }
  })
})

const totalVisitsCount = computed(() => {
  return visitStore.history.filter(v => areIdsEqual(v.household_id, route.params.id)).length
})

const healthConditionsCount = computed(() => {
  let count = 0
  familiesWithIndividuals.value.forEach(family => {
    family.mergedIndividuals.forEach(ind => {
      // healthConditions is an array of strings in this view
      if (Array.isArray(ind.healthConditions)) {
        count += ind.healthConditions.length
      }
    })
  })
  return count
})

const housingDetails = computed(() => {
  if (!household.value) return {}
  return {
    Localização: household.value.localizacao,
    Situação: household.value.situacao_moradia,
    Construção: household.value.material_construcao,
    Abastecimento: household.value.abastecimento_agua,
    Animais: household.value.possui_animais ? 'Sim' : 'Não',
  }
})

const handleBack = () => {
  if (window.history.length > 1 && window.history.state?.back) {
    router.back()
  } else {
    router.push({ name: 'households' })
  }
}
const getFamilyRisk = (family) => {
  const riskMap = {
    'R0': { label: 'R0', color: 'blue-grey', icon: 'mdi-shield-check', score: family.pontuacao_risco },
    'R1': { label: 'R1', color: 'blue', icon: 'mdi-alert-circle-outline', score: family.pontuacao_risco },
    'R2': { label: 'R2', color: 'orange-darken-2', icon: 'mdi-alert', score: family.pontuacao_risco },
    'R3': { label: 'R3', color: 'red-darken-2', icon: 'mdi-alert-octagon', score: family.pontuacao_risco }
  }

  // Se a API já processou o risco, usamos o mapeamento
  if (family.classificacao_risco) {
    // Extrai o código (R0, R1, etc) caso o backend envie a string completa do enum
    const riskCode = family.classificacao_risco.split(' ')[0]
    if (riskMap[riskCode]) return riskMap[riskCode]
    if (riskMap[family.classificacao_risco]) return riskMap[family.classificacao_risco]
  }
  
  // Estado padrão para famílias ainda não estratificadas (Membros novos ou offline)
  return { 
    label: 'N/E', 
    color: 'grey-lighten-1', 
    icon: 'mdi-help-circle-outline', 
    score: null,
    description: 'Não Estratificado' 
  }
}
const formatDate = (d) => {
  if (!d) return 'Data desconhecida'
  return new Date(d).toLocaleDateString('pt-BR')
}

// Removed local calculateAgeText as it is now imported

// Visita
const openVisitDialog = (type, targetId, householdId, familyId = null) => {
  visitContext.value = { type, targetId, householdId, familyId }
  visitForm.value = { desfecho: 'Realizada', turno: 'Manhã' }
  visitDialog.value = true
}

const handleConfirmVisit = async () => {
  const { type, targetId, householdId, familyId } = visitContext.value
  const payload = {
    desfecho: visitForm.value.desfecho,
    turno: visitForm.value.turno,
    visita_realizada: visitForm.value.desfecho === 'Realizada',
    acompanhada_por_outro_profissional: false,
    data_visita: new Date().toISOString().substring(0, 10),
    motivo: [],
    motivo_busca_ativa: [],
  }

  if (type === 'household') payload.household_id = targetId
  else if (type === 'family') {
    payload.family_id = targetId
    payload.household_id = householdId
  } else if (type === 'individual') {
    payload.individual_id = targetId
    payload.family_id = familyId
    payload.household_id = householdId
  }

  const result = await visitStore.createVisit(payload)
  if (result) {
    visitDialog.value = false
    showMessage('Visita registrada com sucesso!')
  } else {
    showMessage('Erro ao registrar visita.', 'error')
  }
}

// Histórico
const openHistoryDialog = async (type, id) => {
  historyDialog.value = true
  const filters = {}
  if (type === 'household') filters.householdId = id
  else if (type === 'family') filters.familyId = id
  else if (type === 'individual') filters.individualId = id
  await visitStore.fetchHistory(filters)
}

// Família Mudou
const openFamilyMudouDialog = (family) => {
  familyMudouTargetId.value = family.id
  familyMudouForm.value = { motivo: '' }
  familyMudouDialog.value = true
}
const handleFamilyMudou = async () => {
  const success = await familyStore.familyMudou(familyMudouTargetId.value, familyMudouForm.value)
  if (success) {
    familyMudouDialog.value = false
    showMessage('Situação da família atualizada!')
  } else {
    showMessage('Erro ao atualizar situação da família.', 'error')
  }
}

// Estratificação de Risco
const openRiskDialog = (family) => {
  router.push({ name: 'family-risk', params: { familyId: family.id } })
}

// Excluir Cidadão
const openDeleteCitizenDialog = (ind, family) => {
  deleteCitizenTarget.value = ind
  deleteCitizenFamilyId.value = family.id
  deleteCitizenDialog.value = true
}

const handleDeleteCitizen = async () => {
  const success = await individualStore.removeIndividual(deleteCitizenTarget.value.id)
  if (success) {
    const fIdx = familyStore.families.findIndex((f) => f.id === deleteCitizenFamilyId.value)
    if (fIdx !== -1 && familyStore.families[fIdx].individuals) {
      familyStore.families[fIdx].individuals = familyStore.families[fIdx].individuals.filter(
        (i) => i.id !== deleteCitizenTarget.value.id,
      )
    }
    deleteCitizenDialog.value = false
    deleteCitizenTarget.value = null
    showMessage('Cidadão removido com sucesso!')
  } else {
    showMessage('Erro ao remover cidadão.', 'error')
  }
}

// Saída do Cidadão
const openCitizenSaidaDialog = (ind, family) => {
  citizenSaidaTarget.value = ind
  citizenSaidaFamilyId.value = family.id
  citizenSaidaForm.value = { motivo_saida: 'mudou' }
  citizenSaidaDialog.value = true
}

const handleCitizenSaida = async () => {
  const success = await individualStore.saidaCidadao(
    citizenSaidaTarget.value.id,
    citizenSaidaForm.value,
  )
  if (success) {
    const fIdx = familyStore.families.findIndex((f) => f.id === citizenSaidaFamilyId.value)
    if (fIdx !== -1 && familyStore.families[fIdx].individuals) {
      familyStore.families[fIdx].individuals = familyStore.families[fIdx].individuals.filter(
        (i) => i.id !== citizenSaidaTarget.value.id,
      )
    }
    citizenSaidaDialog.value = false
    citizenSaidaTarget.value = null
    showMessage('Saída do cidadão registrada!')
  } else {
    showMessage('Erro ao registrar saída.', 'error')
  }
}

// Family CRUD
const openFamilyDialog = (family = null) => {
  if (family && !family._tempId) {
    editingFamilyId.value = family.id
    familyForm.value = {
      ...family,
      membros_declarados: family.membros_declarados || family.numero_membros || 1,
      renda_familiar: family.renda_familiar || '',
      reside_desde: formatToMonthYear(family.reside_desde || ''),
    }
  } else {
    editingFamilyId.value = null
    familyForm.value = {
      numero_prontuario: '',
      renda_familiar: '',
      membros_declarados: 1,
      reside_desde: '',
      responsavel_id: null,
    }
  }
  familyDialog.value = true
}

const handleSaveFamily = async () => {
  const { valid } = await familyFormRef.value.validate()
  if (!valid) return

  const rawPayload = {
    numero_prontuario: familyForm.value.numero_prontuario,
    renda_familiar: familyForm.value.renda_familiar,
    membros_declarados: familyForm.value.membros_declarados,
    reside_desde: familyForm.value.reside_desde,
    saneamento_inadequado: false,
    household_id: route.params.id,
  }

  const sanitized = sanitizeFamilyPayload(rawPayload)
  console.log('[handleSaveFamily] Payload que será enviado:', JSON.stringify(sanitized, null, 2))

  try {
    let result
    if (editingFamilyId.value) {
      result = await familyStore.updateFamily(editingFamilyId.value, sanitized)
    } else {
      result = await familyStore.createFamily(sanitized)
    }

    if (result) {
      familyDialog.value = false
      showMessage(`Família ${editingFamilyId.value ? 'atualizada' : 'cadastrada'} com sucesso!`)
    } else {
      showMessage(familyStore.error || 'Erro ao salvar família.', 'error')
    }
  } catch (err) {
    console.error('[handleSaveFamily] Exceção:', err)
  }
}

const confirmDeleteFamily = (family) => {
  deleteFamilyId.value = family.id
}
const handleDeleteFamily = async () => {
  const success = await familyStore.removeFamily(deleteFamilyId.value)
  if (success) {
    deleteFamilyId.value = null
    showMessage('Família removida com sucesso!')
  } else {
    showMessage('Erro ao remover família.', 'error')
  }
}
const showFamilyInfo = (family) =>
  alert(
    `Família ${family.numero_prontuario}\nMembros: ${family.numero_membros || family.membros_declarados || 0}\nRenda: ${family.renda_familiar || '-'}\nReside desde: ${family.reside_desde}`,
  )

const goToEditDomicilio = () =>
  router.push({ name: 'household-edit', params: { id: route.params.id } })
const handleDeleteDomicilio = async () => {
  const success = await householdStore.remove(route.params.id)
  if (success) router.push({ name: 'households' })
}

onMounted(async () => {
  const id = route.params.id
  if (id) {
    console.log('[HouseholdDetailView] Carregando dados para o domicílio:', id)
    await householdStore.fetchById(id)
    await familyStore.fetchByHousehold(id)
    console.log('[HouseholdDetailView] Famílias carregadas:', familyStore.families.length)
    
    await individualStore.fetchByHousehold(id)
    console.log('[HouseholdDetailView] Total de cidadãos no store:', individualStore.individuals.length)
  }
  
  visitCartStore.initVisit(route.params.id)
})
</script>

<style scoped>
.household-detail {
  background-color: #f8fafb;
  min-height: 100vh;
}

.dashed-card {
  border: 1px dashed #cbd5e1 !important;
  background-color: transparent !important;
}

.border-b {
  border-bottom: 1px solid #f1f5f9;
}
</style>
