<template>
  <q-page class="strategy-page">
    <main class="strategy-shell">
      <div v-if="loading" class="page-state">
        <q-spinner color="primary" size="2rem" />
        <span>{{ t('whatIf.strategy.loading') }}</span>
      </div>
      <div v-else-if="error" class="page-state">
        <q-icon name="cloud_off" size="2rem" />
        <strong>{{ t('whatIf.errors.loadTitle') }}</strong>
        <q-btn
          color="primary"
          unelevated
          no-caps
          :label="t('common.retry')"
          @click="prepare(true)"
        />
      </div>
      <template v-else>
        <AppPageHeader
          class="strategy-header"
          :title="t('whatIf.strategy.title')"
          :back-label="t('navigation.plan')"
          :back-to="{ name: 'plan', params: { workspaceId } }"
          inline-actions
        >
          <template #actions>
            <StrategyScenarioActions
              :active-scenario-id="activeScenario.id"
              :scenario-options="scenarioOptions"
              :scenario-count="config.scenarios.length"
              @select="selectScenario"
              @add="addScenario"
              @reset="resetScenario"
              @delete="deleteScenario"
            />
          </template>
        </AppPageHeader>

        <q-banner v-if="projectionWarnings.length" rounded class="projection-warning">
          <template #avatar><q-icon name="warning_amber" /></template>
          {{ t('whatIf.strategy.projectionIncomplete') }}
        </q-banner>

        <div class="strategy-overview">
          <SavingsCapacityKpi
            class="overview-available-panel"
            :label="annualSavings >= 0 ? t('plan.savingsCapacity') : t('plan.shortfall')"
            :primary-value="formatCurrency(displayedSavings)"
            :primary-period="displayedPeriod"
            :description="t('plan.capacityDescription')"
            :negative="annualSavings < 0"
            :chart-title="t('plan.capacityChartTitle')"
            :income-label="t('plan.availableIncome')"
            :cost-of-life-label="t('plan.costOfLife')"
            :income-value="displayedCapacityIncome"
            :cost-of-life-value="displayedCapacityCostOfLife"
            :savings-value="displayedSavings"
            :metrics="strategyCapacityMetrics"
          >
            <template #actions>
              <AppPeriodSwitch
                v-model="capacityPeriod"
                variant="light"
                :aria-label="t('plan.periodSelector')"
                :options="capacityPeriodOptions"
              />
            </template>
          </SavingsCapacityKpi>

          <AppCard class="overview-allocation-panel">
            <div class="overview-section-heading">
              <div>
                <h2 class="app-card-title">{{ t('whatIf.strategy.settings') }}</h2>
                <p class="app-card-subtitle">
                  {{
                    t('whatIf.strategy.settingsDescription', {
                      amount: formatCurrency(monthlySavings),
                    })
                  }}
                </p>
              </div>
              <button
                type="button"
                class="text-link overview-heading-link"
                @click="allocationSheetOpen = true"
              >
                <q-icon name="edit" /> {{ t('whatIf.strategy.editSplit') }}
              </button>
            </div>

            <div class="overview-allocation-content">
              <div class="allocation-bar" aria-hidden="true">
                <i class="cash" :style="{ width: `${allocation.cash}%` }" />
                <i class="invest" :style="{ width: `${allocation.invest}%` }" />
                <i class="debt" :style="{ width: `${allocation.debt}%` }" />
              </div>

              <div class="allocation-overview-metrics">
                <article class="cash">
                  <span class="mini-icon cash"><q-icon name="health_and_safety" /></span>
                  <small>{{ t('whatIf.cash.title') }}</small>
                  <strong>{{ allocation.cash }}%</strong>
                  <span>{{ formatCurrency(monthlyFor(allocation.cash)) }} / m</span>
                </article>
                <article class="invest">
                  <span class="mini-icon invest"><q-icon name="trending_up" /></span>
                  <small>{{ t('whatIf.strategy.investments') }}</small>
                  <strong>{{ allocation.invest }}%</strong>
                  <span>{{ formatCurrency(monthlyFor(allocation.invest)) }} / m</span>
                </article>
                <article v-if="selectedDebt" class="debt">
                  <span class="mini-icon debt"><q-icon name="home" /></span>
                  <small>{{ t('whatIf.debt.title') }}</small>
                  <strong>{{ allocation.debt }}%</strong>
                  <span>{{ formatCurrency(monthlyFor(allocation.debt)) }} / m</span>
                </article>
              </div>
            </div>
          </AppCard>

          <AppCard class="overview-outcomes-panel">
            <div class="overview-section-heading">
              <div>
                <h2 class="app-card-title">{{ t('whatIf.strategy.projectedOutcomes') }}</h2>
                <p class="app-card-subtitle">
                  {{
                    t('whatIf.strategy.projectedOutcomesDescription', {
                      years: activeScenario.horizonYears,
                    })
                  }}
                </p>
              </div>
            </div>

            <div class="overview-outcome-list">
              <button
                v-for="outcome in strategyOutcomes"
                :key="outcome.id"
                type="button"
                class="overview-outcome"
                :aria-pressed="
                  $q.screen.gt.sm ? selectedDesktopOutcomeKind === outcomeKind(outcome) : undefined
                "
                @click="openOutcomeDetail(outcome)"
              >
                <span :class="['mini-icon', outcome.tone]"><q-icon :name="outcome.icon" /></span>
                <span class="outcome-copy">
                  <strong>{{ outcome.title }}</strong>
                  <small>{{ outcome.summary }}</small>
                </span>
                <b :class="outcome.status">{{ outcome.result }}</b>
                <q-icon name="chevron_right" class="outcome-arrow" />
              </button>
            </div>
          </AppCard>
        </div>

        <div class="desktop-projections">
          <AppCard class="desktop-projection-panel">
            <template v-if="selectedDesktopOutcomeKind === 'cash'">
              <div class="desktop-projection-heading">
                <div>
                  <h2 class="app-card-title">{{ t('whatIf.strategy.cashDetails') }}</h2>
                </div>
                <StrategyHorizonSwitch
                  :model-value="activeScenario.horizonYears"
                  @update:model-value="updateScenario({ horizonYears: $event })"
                  @custom="setCustomHorizon"
                />
              </div>
              <StrategyProjectionChart
                :strategy-points="cashProjectionPoints"
                :baseline-points="baselineCashProjectionPoints"
                :baseline-label="t('whatIf.strategy.currentPath')"
                :strategy-label="t('whatIf.strategy.strategyPath')"
                :aria-label="t('whatIf.strategy.cashChartAria')"
                class="desktop-strategy-chart"
              />
              <div class="result-breakdown desktop-result-breakdown four-values">
                <span class="projected-value-kpi">
                  <small>{{
                    t('whatIf.strategy.projectedCashAtHorizon', {
                      years: activeScenario.horizonYears,
                    })
                  }}</small>
                  <strong>{{ formatCurrency(projection.strategy.cash) }}</strong>
                  <small>{{
                    t('whatIf.strategy.inTodaysMoney', {
                      value: formatCurrency(finalProjectionPoint.realCash),
                    })
                  }}</small>
                </span>
                <span>
                  <small>{{ t('whatIf.strategy.startingValue') }}</small>
                  <strong>{{ formatCurrency(startingPosition.cash) }}</strong>
                </span>
                <span>
                  <small>{{ t('whatIf.strategy.cashContributions') }}</small>
                  <strong>{{ formatCurrency(projection.strategy.cashContributions) }}</strong>
                </span>
                <span>
                  <small>{{ t('whatIf.strategy.cashGrowth') }}</small>
                  <strong>{{ formatCurrency(projection.strategy.cashGrowth) }}</strong>
                </span>
              </div>
            </template>

            <template v-else-if="selectedDesktopOutcomeKind === 'investment'">
              <div class="desktop-projection-heading">
                <div>
                  <h2 class="app-card-title">{{ t('whatIf.strategy.investmentDetails') }}</h2>
                </div>
                <div class="desktop-projection-controls">
                  <StrategyHorizonSwitch
                    :model-value="activeScenario.horizonYears"
                    @update:model-value="updateScenario({ horizonYears: $event })"
                    @custom="setCustomHorizon"
                  />
                  <StrategyProjectionViewSwitch v-model="projectionChartMode" />
                </div>
              </div>

              <StrategyProjectionChart
                :strategy-points="investmentProjectionPoints"
                :baseline-points="baselineInvestmentProjectionPoints"
                :mode="projectionChartMode"
                class="desktop-strategy-chart"
              />
              <div class="result-breakdown desktop-result-breakdown four-values">
                <span class="projected-value-kpi">
                  <small>{{
                    t('whatIf.strategy.projectedInvestmentAtHorizon', {
                      years: activeScenario.horizonYears,
                    })
                  }}</small>
                  <strong>{{ formatCurrency(projection.strategy.investmentValue) }}</strong>
                  <small>{{
                    t('whatIf.strategy.inTodaysMoney', {
                      value: formatCurrency(finalProjectionPoint.realInvestmentValue),
                    })
                  }}</small>
                </span>
                <span>
                  <small>{{ t('whatIf.strategy.startingValue') }}</small>
                  <strong>{{ formatCurrency(startingPosition.investmentTotal) }}</strong>
                </span>
                <span>
                  <small>{{ t('whatIf.strategy.contributions') }}</small>
                  <strong>{{ formatCurrency(projection.strategy.investmentContributions) }}</strong>
                </span>
                <span>
                  <small>{{ t('whatIf.strategy.growth') }}</small>
                  <strong>{{ formatCurrency(projection.strategy.growth) }}</strong>
                </span>
              </div>
            </template>

            <template v-else-if="selectedDesktopOutcomeKind === 'netWorth'">
              <div class="desktop-projection-heading">
                <div>
                  <h2 class="app-card-title">{{ t('whatIf.strategy.netWorthDetails') }}</h2>
                </div>
                <div class="desktop-projection-controls">
                  <StrategyHorizonSwitch
                    :model-value="activeScenario.horizonYears"
                    @update:model-value="updateScenario({ horizonYears: $event })"
                    @custom="setCustomHorizon"
                  />
                  <StrategyProjectionViewSwitch v-model="netWorthChartMode" />
                </div>
              </div>
              <StrategyProjectionChart
                :strategy-points="netWorthPoints"
                :baseline-points="baselineNetWorthPoints"
                :mode="netWorthChartMode"
                :breakdown-types="netWorthBreakdownTypes"
                :baseline-label="t('whatIf.strategy.currentPath')"
                :strategy-label="t('whatIf.strategy.strategyPath')"
                :aria-label="t('whatIf.strategy.netWorthChartAria')"
                class="desktop-strategy-chart"
              />
              <div class="result-breakdown desktop-result-breakdown">
                <span class="projected-value-kpi">
                  <small>{{
                    t('whatIf.strategy.projectedInvestmentAtHorizon', {
                      years: activeScenario.horizonYears,
                    })
                  }}</small>
                  <strong>{{ formatCurrency(projectedNetWorth) }}</strong>
                  <small>{{
                    t('whatIf.strategy.inTodaysMoney', {
                      value: formatCurrency(projectedRealNetWorth),
                    })
                  }}</small>
                </span>
                <span>
                  <small>{{ t('whatIf.strategy.currentNetWorth') }}</small>
                  <strong>{{ formatCurrency(currentNetWorth) }}</strong>
                </span>
                <span>
                  <small>{{ t('whatIf.strategy.projectedGrowthLabel') }}</small>
                  <strong>{{ formatCurrency(projectedNetWorth - currentNetWorth) }}</strong>
                </span>
              </div>
            </template>

            <template v-else-if="selectedDebt">
              <div class="desktop-projection-heading">
                <div>
                  <h2 class="app-card-title">{{ t('whatIf.strategy.debtProjection.title') }}</h2>
                </div>
                <q-select
                  :model-value="selectedDebt.id"
                  :options="liabilityOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  options-dense
                  class="desktop-debt-select"
                  @update:model-value="updateScenario({ selectedLiabilityId: $event })"
                />
              </div>

              <template v-if="debtPayoff">
                <MortgageComparisonChart
                  :normal-schedule="debtPayoff.schedule"
                  :accelerated-schedule="debtPayoff.accelerated.schedule"
                  :history-schedule="debtPayoff.historySchedule"
                  :original-balance="debtPayoff.originalPrincipal"
                  :starting-balance="selectedDebtModel.balance"
                  :start-date="debtPayoff.startDate"
                  :current-date="debtPayoff.currentDate"
                  :normal-label="t('whatIf.strategy.debtProjection.normalPayment')"
                  :accelerated-label="t('whatIf.strategy.debtProjection.withExtraPayment')"
                  :aria-label="t('whatIf.strategy.debtProjection.chartAria')"
                  class="desktop-mortgage-chart"
                />
                <div class="result-breakdown debt-result-breakdown desktop-result-breakdown">
                  <span class="projected-value-kpi">
                    <small>{{ t('whatIf.strategy.finishEarlier') }}</small>
                    <strong>{{ formatDuration(debtPayoff.accelerated.monthsEarlier) }}</strong>
                  </span>
                  <span>
                    <small>{{ t('whatIf.strategy.debtProjection.normalPayoff') }}</small>
                    <strong>{{ formatMonthYear(debtPayoff.payoffDate) }}</strong>
                  </span>
                  <span>
                    <small>{{ t('whatIf.strategy.debtProjection.strategyPayoff') }}</small>
                    <strong>{{ formatMonthYear(debtPayoff.accelerated.payoffDate) }}</strong>
                  </span>
                  <span>
                    <small>{{ t('whatIf.strategy.interestSaved') }}</small>
                    <strong>{{ formatCurrency(debtPayoff.accelerated.interestSaved) }}</strong>
                  </span>
                </div>
              </template>
              <div v-else class="debt-projection-fallback">
                <q-icon name="info_outline" />
                <div>
                  <strong>{{ t('whatIf.strategy.debtProjection.title') }}</strong>
                  <p>{{ t('whatIf.strategy.debtDisclaimer') }}</p>
                </div>
              </div>
            </template>

            <StrategyMilestoneCard
              v-if="selectedDesktopOutcome"
              :milestone="selectedDesktopOutcome"
              :milestone-label="t('whatIf.strategy.milestone')"
              :today-label="t('progress.today')"
              :goal-reached-label="t('whatIf.strategy.goalReached')"
              :progress-label="t('whatIf.strategy.milestoneProgress')"
              :calculation-info-label="t('whatIf.strategy.calculationInfoAction')"
              @calculation-info="calculationInfoDialogOpen = true"
            />
          </AppCard>
        </div>
      </template>
    </main>

    <q-dialog v-model="allocationSheetOpen" :position="$q.screen.lt.md ? 'bottom' : undefined">
      <q-card class="strategy-sheet allocation-sheet">
        <span class="strategy-sheet-handle" aria-hidden="true" />
        <q-card-section class="strategy-sheet-heading">
          <div>
            <h2 class="app-card-title">{{ t('whatIf.strategy.editSettings') }}</h2>
            <p class="app-card-subtitle">
              {{
                t('whatIf.strategy.editSettingsDescription', {
                  amount: formatCurrency(monthlySavings),
                })
              }}
            </p>
          </div>
          <q-btn flat round dense icon="close" v-close-popup :aria-label="t('common.close')" />
        </q-card-section>

        <q-tabs
          v-model="settingsTab"
          dense
          no-caps
          align="left"
          active-color="primary"
          indicator-color="primary"
          class="settings-tabs"
        >
          <q-tab
            name="allocation"
            icon="account_balance_wallet"
            :label="t('whatIf.strategy.allocationTab')"
          />
          <q-tab name="financial" icon="tune" :label="t('whatIf.strategy.financialParameters')" />
        </q-tabs>

        <q-card-section class="strategy-sheet-scroll settings-tab-content">
          <q-tab-panels v-model="settingsTab" animated keep-alive>
            <q-tab-panel name="allocation">
              <section class="sheet-settings-section allocation-settings-section">
                <div class="sheet-settings-heading">
                  <span><q-icon name="account_balance_wallet" /></span>
                  <div>
                    <h3 class="app-card-title">{{ t('whatIf.strategy.allocation') }}</h3>
                    <p class="app-card-subtitle">
                      {{ t('whatIf.strategy.allocationSettingsDescription') }}
                    </p>
                  </div>
                </div>

                <div class="sheet-allocation-list">
                  <StrategyAllocationRow
                    icon="paid"
                    tone="cash"
                    :title="t('whatIf.cash.title')"
                    :description="t('whatIf.strategy.cashDescription')"
                    :percent="allocation.cash"
                    :amount="monthlyFor(allocation.cash)"
                    @change="setAllocation('cash', $event)"
                  />
                  <StrategyAllocationRow
                    icon="trending_up"
                    tone="invest"
                    expandable
                    :expanded="investmentMixOpen"
                    :title="t('whatIf.strategy.investments')"
                    :description="t('whatIf.strategy.investDescription')"
                    :percent="allocation.invest"
                    :amount="monthlyFor(allocation.invest)"
                    @change="setAllocation('invest', $event)"
                    @toggle="investmentMixOpen = !investmentMixOpen"
                  >
                    <div class="nested-mix-heading">
                      <strong class="app-row-title">{{
                        t('whatIf.strategy.investmentMix')
                      }}</strong>
                      <small class="app-caption">{{
                        t('whatIf.strategy.investmentMixDescription')
                      }}</small>
                    </div>
                    <div class="mix-list nested-mix-list">
                      <StrategyAllocationRow
                        v-for="entry in activeMix"
                        :key="entry.id"
                        :icon="entry.icon"
                        :tone="entry.tone"
                        :title="entry.label"
                        :description="entry.description"
                        :percent="entry.allocation"
                        :amount="(monthlyFor(allocation.invest) * entry.allocation) / 100"
                        @change="setMixAllocation(entry.id, $event)"
                      >
                        <template v-if="activeMix.length > 1" #actions>
                          <q-btn
                            flat
                            round
                            dense
                            icon="delete_outline"
                            color="negative"
                            size="sm"
                            :aria-label="t('whatIf.strategy.removeInvestmentType')"
                            @click="removeMix(entry.id)"
                          />
                        </template>
                      </StrategyAllocationRow>
                    </div>
                    <button
                      v-if="availableMixOptions.length"
                      type="button"
                      class="add-investment-card"
                      @click="openInvestmentTypeDialog"
                    >
                      <q-icon name="add" />
                      {{ t('whatIf.strategy.addInvestmentType') }}
                    </button>
                  </StrategyAllocationRow>
                  <StrategyAllocationRow
                    v-if="selectedDebt"
                    icon="home"
                    tone="debt"
                    :title="t('whatIf.debt.title')"
                    :description="t('whatIf.strategy.debtDescription')"
                    :percent="allocation.debt"
                    :amount="monthlyFor(allocation.debt)"
                    @change="setAllocation('debt', $event)"
                  />
                </div>

                <div class="allocation-total sheet-allocation-total">
                  <span>{{ t('whatIf.strategy.total') }}</span>
                  <strong>100%</strong>
                  <strong>{{ formatCurrency(monthlySavings) }}{{ t('whatIf.perMonth') }}</strong>
                </div>
              </section>
            </q-tab-panel>

            <q-tab-panel name="financial">
              <section class="sheet-settings-section model-parameters-section">
                <div class="sheet-settings-heading">
                  <span><q-icon name="tune" /></span>
                  <div>
                    <h3 class="app-card-title">{{ t('whatIf.strategy.financialParameters') }}</h3>
                    <p class="app-card-subtitle">
                      {{ t('whatIf.strategy.financialParametersDescription') }}
                    </p>
                  </div>
                </div>

                <div class="sheet-subheading first-parameter-heading">
                  <h3 class="app-card-title">{{ t('whatIf.strategy.inflation') }}</h3>
                  <p class="app-card-subtitle">{{ t('whatIf.strategy.inflationDescription') }}</p>
                </div>
                <article class="investment-mix-card cash-return-card">
                  <span class="mix-card-icon cash-return"><q-icon name="trending_up" /></span>
                  <div class="mix-card-identity">
                    <strong>{{ t('whatIf.strategy.costOfLife') }}</strong>
                    <small>{{ t('whatIf.strategy.inflationAdjusted') }}</small>
                  </div>
                  <button type="button" class="mix-card-metric editable-metric return-metric">
                    <strong>{{ Number(activeScenario.inflationAnnualPercent).toFixed(1) }}%</strong>
                    <small>{{ t('whatIf.strategy.perYear') }}</small>
                    <q-popup-edit
                      :model-value="activeScenario.inflationAnnualPercent"
                      buttons
                      :title="t('whatIf.strategy.inflationAnnualPercent')"
                      :label-set="t('common.save')"
                      :label-cancel="t('common.cancel')"
                      @save="setInflation"
                    >
                      <template #default="scope">
                        <q-input
                          v-model.number="scope.value"
                          autofocus
                          dense
                          outlined
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          suffix="%"
                          @keyup.enter="scope.set"
                        />
                      </template>
                    </q-popup-edit>
                  </button>
                </article>

                <div class="sheet-subheading">
                  <h3 class="app-card-title">{{ t('whatIf.strategy.cashReturn') }}</h3>
                  <p class="app-card-subtitle">{{ t('whatIf.strategy.cashReturnDescription') }}</p>
                </div>
                <article class="investment-mix-card cash-return-card">
                  <span class="mix-card-icon cash-return"><q-icon name="savings" /></span>
                  <div class="mix-card-identity">
                    <strong>{{ t('whatIf.cash.title') }}</strong>
                    <small>{{ cashReturnSourceLabel }}</small>
                  </div>
                  <button type="button" class="mix-card-metric editable-metric return-metric">
                    <strong>{{ Number(effectiveCashAnnualReturnPercent).toFixed(1) }}%</strong>
                    <small>{{ t('whatIf.strategy.expectedReturnShort') }}</small>
                    <q-popup-edit
                      :model-value="effectiveCashAnnualReturnPercent"
                      buttons
                      :title="t('whatIf.strategy.cashAnnualReturn')"
                      :label-set="t('common.save')"
                      :label-cancel="t('common.cancel')"
                      @save="setCashReturn"
                    >
                      <template #default="scope">
                        <q-input
                          v-model.number="scope.value"
                          autofocus
                          dense
                          outlined
                          type="number"
                          min="-100"
                          max="100"
                          step="0.1"
                          suffix="%"
                          @keyup.enter="scope.set"
                        />
                      </template>
                    </q-popup-edit>
                  </button>
                  <q-btn
                    v-if="cashReturnOverridden"
                    flat
                    dense
                    no-caps
                    color="primary"
                    icon="restart_alt"
                    :label="t('whatIf.strategy.useSuggestedCashReturn')"
                    @click="resetCashReturn"
                  />
                </article>

                <div class="sheet-subheading">
                  <h3 class="app-card-title">{{ t('whatIf.strategy.investments') }}</h3>
                  <p class="app-card-subtitle">
                    {{ t('whatIf.strategy.investmentReturnsDescription') }}
                  </p>
                </div>
                <div class="mix-list sheet-mix-list">
                  <article
                    v-for="entry in investmentReturnEntries"
                    :key="entry.id"
                    class="investment-mix-card investment-return-card"
                  >
                    <span :class="['mix-card-icon', entry.tone]">
                      <q-icon :name="entry.icon" />
                    </span>
                    <div class="mix-card-identity">
                      <strong>{{ entry.label }}</strong>
                      <small>{{ entry.description }}</small>
                    </div>
                    <button type="button" class="mix-card-metric editable-metric return-metric">
                      <strong>{{ Number(entry.annualReturnPercent).toFixed(1) }}%</strong>
                      <small>{{ t('whatIf.strategy.expectedReturnShort') }}</small>
                      <q-popup-edit
                        :model-value="entry.annualReturnPercent"
                        buttons
                        :title="t('whatIf.strategy.expectedAnnualReturn')"
                        :label-set="t('common.save')"
                        :label-cancel="t('common.cancel')"
                        @save="setReturn(entry.id, $event)"
                      >
                        <template #default="scope">
                          <q-input
                            v-model.number="scope.value"
                            autofocus
                            dense
                            outlined
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            suffix="%"
                            @keyup.enter="scope.set"
                          />
                        </template>
                      </q-popup-edit>
                    </button>
                  </article>
                </div>
              </section>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>

        <q-card-actions class="strategy-sheet-actions">
          <q-btn outline no-caps :label="t('common.cancel')" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="t('common.save')"
            @click="allocationSheetOpen = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="detailSheetOpen" :position="$q.screen.lt.md ? 'bottom' : undefined">
      <q-card class="strategy-sheet projection-detail-sheet">
        <span class="strategy-sheet-handle" aria-hidden="true" />
        <q-card-section class="strategy-sheet-heading">
          <div>
            <h2 class="app-card-title">{{ detailSheetTitle }}</h2>
          </div>
          <q-btn flat round dense icon="close" v-close-popup :aria-label="t('common.close')" />
        </q-card-section>
        <q-card-section class="strategy-sheet-scroll detail-sheet-content">
          <section v-if="detailSheetKind === 'cash'" class="detail-sheet-section">
            <StrategyHorizonSwitch
              class="detail-horizon-options"
              :model-value="activeScenario.horizonYears"
              @update:model-value="updateScenario({ horizonYears: $event })"
              @custom="setCustomHorizon"
            />
            <StrategyProjectionChart
              :strategy-points="cashProjectionPoints"
              :baseline-points="baselineCashProjectionPoints"
              :baseline-label="t('whatIf.strategy.currentPath')"
              :strategy-label="t('whatIf.strategy.strategyPath')"
              :aria-label="t('whatIf.strategy.cashChartAria')"
            />
            <div class="result-breakdown four-values">
              <span class="projected-value-kpi">
                <small>{{
                  t('whatIf.strategy.projectedCashAtHorizon', {
                    years: activeScenario.horizonYears,
                  })
                }}</small>
                <strong>{{ formatCurrency(projection.strategy.cash) }}</strong>
                <small>{{
                  t('whatIf.strategy.inTodaysMoney', {
                    value: formatCurrency(finalProjectionPoint.realCash),
                  })
                }}</small>
              </span>
              <span>
                <small>{{ t('whatIf.strategy.startingValue') }}</small>
                <strong>{{ formatCurrency(startingPosition.cash) }}</strong>
              </span>
              <span>
                <small>{{ t('whatIf.strategy.cashContributions') }}</small>
                <strong>{{ formatCurrency(projection.strategy.cashContributions) }}</strong>
              </span>
              <span>
                <small>{{ t('whatIf.strategy.cashGrowth') }}</small>
                <strong>{{ formatCurrency(projection.strategy.cashGrowth) }}</strong>
              </span>
            </div>
            <q-select
              :model-value="activeScenario.cashTargetMonths"
              :options="cashTargetOptions"
              emit-value
              map-options
              outlined
              :label="t('whatIf.strategy.emergencyFundTarget')"
              @update:model-value="updateScenario({ cashTargetMonths: $event })"
            />
          </section>

          <section
            v-if="['investment', 'projection'].includes(detailSheetKind)"
            class="detail-sheet-section"
          >
            <div class="detail-section-heading investment-detail-controls">
              <StrategyHorizonSwitch
                class="detail-horizon-options"
                :model-value="activeScenario.horizonYears"
                @update:model-value="updateScenario({ horizonYears: $event })"
                @custom="setCustomHorizon"
              />
              <StrategyProjectionViewSwitch
                v-model="projectionChartMode"
                size="small"
                class="detail-view-switch"
              />
            </div>
            <StrategyProjectionChart
              :strategy-points="investmentProjectionPoints"
              :baseline-points="baselineInvestmentProjectionPoints"
              :mode="projectionChartMode"
            />
            <div class="result-breakdown four-values">
              <span class="projected-value-kpi">
                <small>{{
                  t('whatIf.strategy.projectedInvestmentAtHorizon', {
                    years: activeScenario.horizonYears,
                  })
                }}</small>
                <strong>{{ formatCurrency(projection.strategy.investmentValue) }}</strong>
                <small>{{
                  t('whatIf.strategy.inTodaysMoney', {
                    value: formatCurrency(finalProjectionPoint.realInvestmentValue),
                  })
                }}</small>
              </span>
              <span
                ><small>{{ t('whatIf.strategy.startingValue') }}</small
                ><strong>{{ formatCurrency(startingPosition.investmentTotal) }}</strong></span
              >
              <span
                ><small>{{ t('whatIf.strategy.contributions') }}</small
                ><strong>{{
                  formatCurrency(projection.strategy.investmentContributions)
                }}</strong></span
              >
              <span
                ><small>{{ t('whatIf.strategy.growth') }}</small
                ><strong>{{ formatCurrency(projection.strategy.growth) }}</strong></span
              >
            </div>
          </section>

          <section v-if="detailSheetKind === 'netWorth'" class="detail-sheet-section">
            <div class="detail-section-heading net-worth-detail-controls">
              <StrategyHorizonSwitch
                class="detail-horizon-options"
                :model-value="activeScenario.horizonYears"
                @update:model-value="updateScenario({ horizonYears: $event })"
                @custom="setCustomHorizon"
              />
              <StrategyProjectionViewSwitch
                v-model="netWorthChartMode"
                class="detail-view-switch"
              />
            </div>
            <StrategyProjectionChart
              :strategy-points="netWorthPoints"
              :baseline-points="baselineNetWorthPoints"
              :mode="netWorthChartMode"
              :breakdown-types="netWorthBreakdownTypes"
              :baseline-label="t('whatIf.strategy.currentPath')"
              :strategy-label="t('whatIf.strategy.strategyPath')"
              :aria-label="t('whatIf.strategy.netWorthChartAria')"
            />
            <div class="detail-values large-detail-values">
              <span class="projected-value-kpi">
                <small>{{
                  t('whatIf.strategy.projectedInvestmentAtHorizon', {
                    years: activeScenario.horizonYears,
                  })
                }}</small>
                <strong>{{ formatCurrency(projectedNetWorth) }}</strong>
                <small>{{
                  t('whatIf.strategy.inTodaysMoney', {
                    value: formatCurrency(projectedRealNetWorth),
                  })
                }}</small>
              </span>
              <span
                ><small>{{ t('whatIf.strategy.currentNetWorth') }}</small
                ><strong>{{ formatCurrency(currentNetWorth) }}</strong></span
              >
              <span
                ><small>{{ t('whatIf.strategy.projectedGrowthLabel') }}</small
                ><strong>{{ formatCurrency(projectedNetWorth - currentNetWorth) }}</strong></span
              >
            </div>
          </section>

          <section
            v-if="selectedDebt && ['debt', 'projection'].includes(detailSheetKind)"
            class="detail-sheet-section"
          >
            <div class="detail-section-heading">
              <q-select
                :model-value="selectedDebt.id"
                :options="liabilityOptions"
                emit-value
                map-options
                dense
                outlined
                @update:model-value="updateScenario({ selectedLiabilityId: $event })"
              />
            </div>
            <template v-if="debtPayoff">
              <MortgageComparisonChart
                :normal-schedule="debtPayoff.schedule"
                :accelerated-schedule="debtPayoff.accelerated.schedule"
                :history-schedule="debtPayoff.historySchedule"
                :original-balance="debtPayoff.originalPrincipal"
                :starting-balance="selectedDebtModel.balance"
                :start-date="debtPayoff.startDate"
                :current-date="debtPayoff.currentDate"
                :normal-label="t('whatIf.strategy.debtProjection.normalPayment')"
                :accelerated-label="t('whatIf.strategy.debtProjection.withExtraPayment')"
                :aria-label="t('whatIf.strategy.debtProjection.chartAria')"
              />
              <div class="result-breakdown debt-result-breakdown">
                <span class="projected-value-kpi"
                  ><small>{{ t('whatIf.strategy.finishEarlier') }}</small
                  ><strong>{{ formatDuration(debtPayoff.accelerated.monthsEarlier) }}</strong></span
                >
                <span
                  ><small>{{ t('whatIf.strategy.debtProjection.normalPayoff') }}</small
                  ><strong>{{ formatMonthYear(debtPayoff.payoffDate) }}</strong></span
                >
                <span
                  ><small>{{ t('whatIf.strategy.debtProjection.strategyPayoff') }}</small
                  ><strong>{{ formatMonthYear(debtPayoff.accelerated.payoffDate) }}</strong></span
                >
                <span
                  ><small>{{ t('whatIf.strategy.interestSaved') }}</small
                  ><strong>{{ formatCurrency(debtPayoff.accelerated.interestSaved) }}</strong></span
                >
              </div>
            </template>
            <div v-else class="debt-projection-fallback">
              <q-icon name="info_outline" />
              <div>
                <p>{{ t('whatIf.strategy.debtDisclaimer') }}</p>
              </div>
            </div>
          </section>

          <StrategyMilestoneCard
            v-if="detailSheetOutcome"
            :milestone="detailSheetOutcome"
            :milestone-label="t('whatIf.strategy.milestone')"
            :today-label="t('progress.today')"
            :goal-reached-label="t('whatIf.strategy.goalReached')"
            :progress-label="t('whatIf.strategy.milestoneProgress')"
            :calculation-info-label="t('whatIf.strategy.calculationInfoAction')"
            @calculation-info="calculationInfoDialogOpen = true"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="debtInfoDialogOpen" :position="$q.screen.lt.sm ? 'bottom' : undefined">
      <q-card class="app-info-dialog responsive-info-card">
        <span class="info-sheet-handle" aria-hidden="true" />
        <q-card-section class="app-info-heading">
          <h2 class="app-card-title">{{ t('whatIf.strategy.debtInfoTitle') }}</h2>
          <q-btn v-close-popup flat round dense icon="close" :aria-label="t('common.close')" />
        </q-card-section>
        <q-card-section class="app-info-copy">
          <p>{{ debtInfoText }}</p>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="freedomInfoDialogOpen" :position="$q.screen.lt.sm ? 'bottom' : undefined">
      <q-card class="freedom-info-dialog responsive-info-card">
        <span class="info-sheet-handle" aria-hidden="true" />
        <q-card-section class="freedom-info-heading">
          <span class="mini-icon freedom"><q-icon name="flight_takeoff" /></span>
          <h2 class="app-card-title">{{ t('whatIf.strategy.freedomInfoTitle') }}</h2>
          <q-btn v-close-popup flat round dense icon="close" :aria-label="t('common.close')" />
        </q-card-section>
        <q-card-section class="freedom-info-copy">
          <p>{{ t('whatIf.strategy.freedomInfoDescription') }}</p>
          <div>
            <strong>{{ t('whatIf.strategy.freedomInfoIncludedTitle') }}</strong>
            <p>{{ t('whatIf.strategy.freedomInfoIncluded') }}</p>
          </div>
          <div>
            <strong>{{ t('whatIf.strategy.freedomInfoExcludedTitle') }}</strong>
            <p>{{ t('whatIf.strategy.freedomInfoExcluded') }}</p>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="calculationInfoDialogOpen"
      :position="$q.screen.lt.sm ? 'bottom' : undefined"
    >
      <q-card class="strategy-sheet info-sheet">
        <q-card-section class="strategy-sheet-heading">
          <div>
            <h2 class="app-card-title">{{ t('whatIf.strategy.calculationInfoTitle') }}</h2>
          </div>
          <q-btn flat round dense icon="close" v-close-popup :aria-label="t('common.close')" />
        </q-card-section>
        <q-card-section class="info-sheet-content">
          <p>
            {{
              t('whatIf.strategy.calculationInfoDescription', {
                inflation: Number(activeScenario.inflationAnnualPercent).toFixed(1),
              })
            }}
          </p>
          <p>{{ t('whatIf.strategy.calculationInfoFormula') }}</p>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="investmentTypeDialogOpen">
      <q-card class="investment-type-dialog">
        <q-btn
          flat
          round
          dense
          icon="close"
          class="dialog-close"
          :aria-label="t('common.cancel')"
          v-close-popup
        />
        <q-card-section class="investment-dialog-heading">
          <h2 class="app-card-title">{{ t('whatIf.strategy.addInvestmentTypeTitle') }}</h2>
          <p class="app-card-subtitle">{{ t('whatIf.strategy.addInvestmentTypeDescription') }}</p>
        </q-card-section>
        <q-card-section class="investment-dialog-options">
          <button
            v-for="option in availableMixOptions"
            :key="option.value"
            type="button"
            :class="{ selected: pendingInvestmentType === option.value }"
            @click="pendingInvestmentType = option.value"
          >
            <span class="mini-icon invest"><q-icon :name="option.icon" /></span>
            <span>
              <strong>{{ option.label }}</strong>
            </span>
            <q-icon
              :name="
                pendingInvestmentType === option.value ? 'check_circle' : 'radio_button_unchecked'
              "
            />
          </button>
        </q-card-section>
        <q-card-actions class="investment-dialog-actions">
          <q-btn outline no-caps :label="t('common.cancel')" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="t('common.add')"
            :disable="!pendingInvestmentType"
            @click="confirmInvestmentType"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="initialScenarioDialogOpen" persistent>
      <q-card class="scenario-name-dialog">
        <q-card-section>
          <h2 class="app-card-title">{{ t('whatIf.strategy.nameFirstScenario') }}</h2>
          <p class="app-card-subtitle">{{ t('whatIf.strategy.nameFirstScenarioDescription') }}</p>
          <q-input
            v-model="initialScenarioName"
            outlined
            autofocus
            maxlength="80"
            :label="t('whatIf.strategy.scenarioName')"
            @keyup.enter="confirmInitialScenario"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="t('common.continue')"
            :disable="!initialScenarioName.trim() || whatIfStore.saving"
            :loading="whatIfStore.saving"
            @click="confirmInitialScenario"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import AppPageHeader from '@/components/layout/AppPageHeader.vue'
import SavingsCapacityKpi from '@/components/financial/SavingsCapacityKpi.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppPeriodSwitch from '@/components/ui/AppPeriodSwitch.vue'
import MortgageComparisonChart from '@/components/liabilities/MortgageComparisonChart.vue'
import StrategyAllocationRow from '@/components/what-if/StrategyAllocationRow.vue'
import StrategyHorizonSwitch from '@/components/what-if/StrategyHorizonSwitch.vue'
import StrategyMilestoneCard from '@/components/what-if/StrategyMilestoneCard.vue'
import StrategyProjectionChart from '@/components/what-if/StrategyProjectionChart.vue'
import StrategyProjectionViewSwitch from '@/components/what-if/StrategyProjectionViewSwitch.vue'
import StrategyScenarioActions from '@/components/what-if/StrategyScenarioActions.vue'
import { getLiabilityCategory } from '@/config/liability-categories'
import {
  buildStrategyCalculationContext,
  modeledLiabilitiesForPositions,
} from '@/domain/financial/calculation-context'
import { calculateDebtPayoffImpact } from '@/domain/financial/debt-payoff'
import {
  currentFinancialYear,
  financialYearAvailableIncomeValue,
  financialYearExpenseNecessityValue,
  financialYearFlowValue,
} from '../../functions/shared/positions/annual-projection.js'
import { primaryHomeMortgageLiabilityIds } from '@/domain/financial/investable-wealth'
import {
  calculateInflationAdjustedCoverage,
  calculateInflationFactorAtMonth,
  calculateProjectedNetInvestableWealth,
  findLatestObservedPositionMonth,
  calculatePresentValue,
  simulateAllocationStrategy,
  calculateStrategyNetWorthProjection,
} from '../../functions/shared/plan/strategy-simulation.js'
import {
  calculateSavingsCapacityScenario,
  defaultStrategyScenario,
  investmentTypeDefinitions,
  normalizeStrategyForOptions,
  normalizeStrategyScenario,
  resolveCashAnnualReturnPercent,
} from '../../functions/shared/plan/what-if.js'
import { calculateMilestoneProgress } from '@/domain/milestones/calculations'
import { displayProgressPercent } from '../../functions/shared/progress/metrics.js'
import { authUser } from '@/services/auth'
import { useFinancialScopeStore } from '@/stores/financial-scope-store'
import { useFinancialYearsStore } from '@/stores/financial-years-store'
import { useAssetsStore } from '@/stores/assets-store'
import { useLiabilitiesStore } from '@/stores/liabilities-store'
import { useWhatIfStore } from '@/stores/what-if-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { formatCurrency } from '@/utils/formatters'
import { getWorkspaceMembers } from '@/utils/workspace-members'
import {
  DEMO_REFERENCE_DATE,
  financialYearForWorkspace,
  isDemoWorkspaceId,
} from '@/domain/access/demo-workspace'

const $q = useQuasar()
const { t } = useI18n()
const route = useRoute()
const financialYearsStore = useFinancialYearsStore()
const assetsStore = useAssetsStore()
const liabilitiesStore = useLiabilitiesStore()
const scopeStore = useFinancialScopeStore()
const whatIfStore = useWhatIfStore()
const workspaceStore = useWorkspaceStore()
const pageError = ref(null)
const freedomInfoDialogOpen = ref(false)
const calculationInfoDialogOpen = ref(false)
const debtInfoDialogOpen = ref(false)
const investmentTypeDialogOpen = ref(false)
const pendingInvestmentType = ref(null)
const initialScenarioDialogOpen = ref(false)
const initialScenarioName = ref('')
const projectionChartMode = ref('total')
const netWorthChartMode = ref('total')
const allocationSheetOpen = ref(false)
const settingsTab = ref('allocation')
const investmentMixOpen = ref(false)
const detailSheetOpen = ref(false)
const detailSheetKind = ref('projection')
const selectedDesktopOutcomeKind = ref('investment')
const capacityPeriod = ref('monthly')
const capacityPeriodOptions = computed(() => [
  { value: 'annual', label: t('dashboard.costOfLife.annual') },
  { value: 'monthly', label: t('dashboard.costOfLife.monthly') },
])
const year = financialYearForWorkspace(String(route.params.workspaceId), currentFinancialYear())
const workspaceId = computed(() => String(route.params.workspaceId))
const workspace = computed(
  () => workspaceStore.workspaces.find(({ id }) => id === workspaceId.value) || null,
)
const members = computed(() => getWorkspaceMembers(workspace.value))
const memberIds = computed(() => members.value.map(({ id }) => id))
const selectedMemberId = computed(() =>
  scopeStore.get(workspaceId.value, memberIds.value, authUser.value?.uid),
)
const config = computed(() => whatIfStore.config)
const financialYear = computed(() => financialYearsStore.get(workspaceId.value, year))
const loading = computed(
  () =>
    financialYearsStore.loading ||
    assetsStore.loading ||
    assetsStore.categoryLoading ||
    whatIfStore.loading ||
    liabilitiesStore.loading ||
    liabilitiesStore.categoryLoading,
)
const error = computed(
  () =>
    pageError.value ||
    assetsStore.error ||
    whatIfStore.error ||
    financialYearsStore.errorFor(workspaceId.value, year),
)
const activeScenario = computed(
  () =>
    config.value.scenarios.find(({ id }) => id === config.value.activeScenarioId) ||
    config.value.scenarios[0],
)
const positionMonth = computed(() => findLatestObservedPositionMonth(financialYear.value))
const calculationContext = computed(() =>
  buildStrategyCalculationContext({
    financialYear: financialYear.value,
    month: positionMonth.value,
    memberId: selectedMemberId.value,
    cashAssets: assetsStore.itemsForCategory('cash'),
    realEstateAssets: assetsStore.itemsForCategory('real_estate'),
    mortgageLiabilities: liabilitiesStore.itemsForCategory('mortgage'),
  }),
)
const startingPosition = computed(() => calculationContext.value.startingPosition)
const suggestedCashAnnualReturnPercent = computed(
  () => calculationContext.value.suggestedCashAnnualReturnPercent,
)
const cashReturnOverridden = computed(() =>
  Object.hasOwn(activeScenario.value, 'cashAnnualReturnPercent'),
)
const effectiveCashAnnualReturnPercent = computed(() =>
  resolveCashAnnualReturnPercent(activeScenario.value, suggestedCashAnnualReturnPercent.value),
)
const cashReturnSourceLabel = computed(() =>
  cashReturnOverridden.value
    ? t('whatIf.strategy.customCashReturn')
    : t('whatIf.strategy.suggestedCashReturn', {
        return: Number(suggestedCashAnnualReturnPercent.value).toFixed(1),
      }),
)
const simulation = computed(() =>
  calculateSavingsCapacityScenario({
    availableIncome: financialYearAvailableIncomeValue(financialYear.value, selectedMemberId.value),
    costOfLife: financialYearFlowValue(financialYear.value, 'expenses', selectedMemberId.value),
    discretionary: financialYearExpenseNecessityValue(
      financialYear.value,
      'lifestyle',
      selectedMemberId.value,
    ),
    reductionPercent: config.value.discretionaryReductionPercent,
  }),
)
const annualIncome = computed(() =>
  financialYearAvailableIncomeValue(financialYear.value, selectedMemberId.value),
)
const annualCostOfLife = computed(() =>
  financialYearFlowValue(financialYear.value, 'expenses', selectedMemberId.value),
)
const annualSavings = computed(() => annualIncome.value - annualCostOfLife.value)
const monthlySavings = computed(() => Math.max(0, simulation.value.currentSavingsCapacity))
const displayedSavings = computed(() =>
  capacityPeriod.value === 'annual' ? annualSavings.value : annualSavings.value / 12,
)
const displayedPeriod = computed(() =>
  capacityPeriod.value === 'annual' ? t('plan.perYear') : t('whatIf.perMonth'),
)
const displayedCapacityIncome = computed(() =>
  capacityPeriod.value === 'annual' ? annualIncome.value : annualIncome.value / 12,
)
const displayedCapacityCostOfLife = computed(() =>
  capacityPeriod.value === 'annual' ? annualCostOfLife.value : annualCostOfLife.value / 12,
)
const strategyCapacityMetrics = computed(() => [
  {
    label: t('plan.availableIncome'),
    value: formatCurrency(displayedCapacityIncome.value),
  },
  {
    label: t('plan.costOfLife'),
    value: `−${formatCurrency(displayedCapacityCostOfLife.value)}`,
  },
])
const liabilities = computed(() =>
  calculationContext.value.liabilities.map((liability) => ({
    ...liability,
    name: liability.name || liabilityCategoryName(liability.categoryId),
  })),
)
const modeledDebts = computed(() =>
  modeledLiabilitiesForPositions(
    liabilities.value,
    liabilitiesStore.itemsForCategory('mortgage'),
    selectedMemberId.value,
  ),
)
const selectedDebt = computed(
  () =>
    modeledDebts.value.find(({ id }) => id === activeScenario.value.selectedLiabilityId) ||
    modeledDebts.value[0] ||
    null,
)
const selectedDebtModel = computed(() => selectedDebt.value)
const allocation = computed(() =>
  normalizeStrategyForOptions(activeScenario.value.allocation, {
    cash: true,
    debt: Boolean(selectedDebt.value),
  }),
)
const projection = computed(() =>
  simulateAllocationStrategy({
    startingPosition: startingPosition.value,
    scenario: {
      ...activeScenario.value,
      allocation: allocation.value,
      cashAnnualReturnPercent: effectiveCashAnnualReturnPercent.value,
    },
    simulatedMonthlySavings: monthlySavings.value,
    simulatedMonthlyCost: simulation.value.monthlyCostOfLife,
    debtAvailable: Boolean(selectedDebt.value),
  }),
)
const baselineProjection = computed(() =>
  simulateAllocationStrategy({
    startingPosition: startingPosition.value,
    scenario: {
      ...activeScenario.value,
      allocation: allocation.value,
      cashAnnualReturnPercent: effectiveCashAnnualReturnPercent.value,
    },
    simulatedMonthlySavings: 0,
    simulatedMonthlyCost: simulation.value.monthlyCostOfLife,
    debtAvailable: Boolean(selectedDebt.value),
  }),
)
const debtPayoff = computed(() =>
  calculateDebtPayoffImpact({
    liability: selectedDebtModel.value,
    extraMonthlyPayment: monthlyFor(allocation.value.debt),
    asOfDate: localToday(),
  }),
)
const debtInfoText = computed(() =>
  debtPayoff.value
    ? t('whatIf.strategy.modeledDebtDisclaimer')
    : t('whatIf.strategy.debtDisclaimer'),
)
const investmentProjectionPoints = computed(() =>
  projection.value.strategy.points.map(({ month, investmentBalances, investmentValue }) => ({
    month,
    value: investmentValue,
    breakdown: investmentBalances,
  })),
)
const baselineInvestmentProjectionPoints = computed(() =>
  baselineProjection.value.strategy.points.map(({ month, investmentValue }) => ({
    month,
    value: investmentValue,
  })),
)
const cashProjectionPoints = computed(() =>
  projection.value.strategy.points.map(({ month, cash }) => ({ month, value: cash })),
)
const baselineCashProjectionPoints = computed(() =>
  baselineProjection.value.strategy.points.map(({ month, cash }) => ({ month, value: cash })),
)

const scenarioOptions = computed(() =>
  config.value.scenarios.map(({ id, name }) => ({ value: id, label: name })),
)
const liabilityOptions = computed(() =>
  modeledDebts.value.map(({ id, name }) => ({ value: id, label: name })),
)
const cashTargetOptions = computed(() =>
  [3, 6, 12].map((months) => ({
    value: months,
    label: t('whatIf.strategy.monthsValue', { months }),
  })),
)
const mixMeta = {
  stockMarket: {
    labelKey: 'plan.investments.stockMarket',
    icon: 'trending_up',
    tone: 'stock-market',
  },
  realEstate: { labelKey: 'plan.investments.realEstate', icon: 'apartment', tone: 'real-estate' },
  fixedIncome: {
    labelKey: 'plan.investments.fixedIncome',
    icon: 'account_balance',
    tone: 'fixed-income',
  },
  crypto: { labelKey: 'plan.investments.crypto', icon: 'currency_bitcoin', tone: 'crypto' },
  businessEquity: {
    labelKey: 'plan.investments.businessEquity',
    icon: 'business_center',
    tone: 'business',
  },
  other: { labelKey: 'plan.investments.other', icon: 'category', tone: 'other' },
}
const activeMix = computed(() =>
  Object.entries(activeScenario.value.investmentMix).map(([id, value]) => ({
    id,
    ...mixMeta[id],
    label: t(mixMeta[id].labelKey),
    description: t(`whatIf.strategy.investmentTypes.${id}`),
    ...value,
  })),
)
const investmentReturnEntries = computed(() =>
  investmentTypeDefinitions.map(({ id, returnPercent }) => ({
    id,
    ...mixMeta[id],
    label: t(mixMeta[id].labelKey),
    description: t(`whatIf.strategy.investmentTypes.${id}`),
    annualReturnPercent: activeScenario.value.investmentReturns?.[id] ?? returnPercent,
  })),
)
const availableMixOptions = computed(() =>
  investmentTypeDefinitions
    .filter(({ id }) => !activeScenario.value.investmentMix[id])
    .map(({ id }) => ({
      value: id,
      label: t(mixMeta[id].labelKey),
      icon: mixMeta[id].icon,
    })),
)
const currentMilestones = computed(() =>
  calculateMilestoneProgress({
    financialYear: financialYear.value,
    liabilities: liabilitiesStore.itemsForCategory('mortgage'),
    excludedLiabilityIds: primaryHomeMortgageLiabilityIds(
      assetsStore.itemsForCategory('real_estate'),
    ),
    month: positionMonth.value,
    memberId: selectedMemberId.value,
  }),
)
const currentAssets = computed(() => calculationContext.value.currentAssets)
const currentLiabilities = computed(() => calculationContext.value.currentLiabilities)
const currentRealEstate = computed(() => calculationContext.value.currentRealEstate)
const modeledRealEstateAssets = computed(() => calculationContext.value.modeledRealEstateAssets)
const modeledMortgages = computed(() => calculationContext.value.modeledMortgages)
const currentNetWorth = computed(() => calculationContext.value.currentNetWorth)
const netWorthProjection = computed(() =>
  calculateStrategyNetWorthProjection({
    currentNetWorth: currentNetWorth.value,
    currentAssets: currentAssets.value,
    currentLiabilities: currentLiabilities.value,
    currentRealEstate: currentRealEstate.value,
    strategy: projection.value.strategy,
    monthlyDebtContribution: monthlyFor(allocation.value.debt),
    debtBalance: selectedDebt.value?.balance || 0,
    selectedDebtId: selectedDebt.value?.id,
    realEstateAssets: modeledRealEstateAssets.value,
    mortgages: modeledMortgages.value,
    asOfDate: localToday(),
  }),
)
const netWorthPoints = computed(() => netWorthProjection.value.points)
const baselineNetWorthProjection = computed(() =>
  calculateStrategyNetWorthProjection({
    currentNetWorth: currentNetWorth.value,
    currentAssets: currentAssets.value,
    currentLiabilities: currentLiabilities.value,
    currentRealEstate: currentRealEstate.value,
    strategy: baselineProjection.value.strategy,
    monthlyDebtContribution: 0,
    debtBalance: selectedDebt.value?.balance || 0,
    selectedDebtId: selectedDebt.value?.id,
    realEstateAssets: modeledRealEstateAssets.value,
    mortgages: modeledMortgages.value,
    asOfDate: localToday(),
  }),
)
const baselineNetWorthPoints = computed(() => baselineNetWorthProjection.value.points)
const monthlyNetWorthProjection = computed(() =>
  calculateStrategyNetWorthProjection({
    currentNetWorth: currentNetWorth.value,
    currentAssets: currentAssets.value,
    currentLiabilities: currentLiabilities.value,
    currentRealEstate: currentRealEstate.value,
    strategy: {
      ...projection.value.strategy,
      points: projection.value.strategy.monthlyPoints,
    },
    monthlyDebtContribution: monthlyFor(allocation.value.debt),
    selectedDebtId: selectedDebt.value?.id,
    realEstateAssets: modeledRealEstateAssets.value,
    mortgages: modeledMortgages.value,
    asOfDate: localToday(),
  }),
)
const monthlyNetWorthPoints = computed(() => monthlyNetWorthProjection.value.points)
const projectionWarnings = computed(() => [
  ...netWorthProjection.value.warnings,
  ...baselineNetWorthProjection.value.warnings,
  ...monthlyNetWorthProjection.value.warnings,
])
const netWorthBreakdownTypes = computed(() => [
  { id: 'cash', label: t('whatIf.strategy.netWorthBreakdown.cash'), color: '#0870d8' },
  {
    id: 'investments',
    label: t('whatIf.strategy.netWorthBreakdown.investments'),
    color: '#8754ed',
  },
  {
    id: 'realEstate',
    label: t('whatIf.strategy.netWorthBreakdown.realEstate'),
    color: '#0c6b4d',
  },
  {
    id: 'otherAssets',
    label: t('whatIf.strategy.netWorthBreakdown.otherAssets'),
    color: '#39a8a3',
  },
  {
    id: 'liabilities',
    label: t('whatIf.strategy.netWorthBreakdown.liabilities'),
    color: '#dc4c64',
  },
])
const projectedNetWorth = computed(() => netWorthPoints.value.at(-1)?.value || 0)
const finalProjectionPoint = computed(() => projection.value.strategy.points.at(-1))
const horizonInflationFactor = computed(() =>
  calculateInflationFactorAtMonth(
    activeScenario.value.inflationAnnualPercent,
    activeScenario.value.horizonYears * 12,
  ),
)
const projectedRealNetWorth = computed(() =>
  calculatePresentValue(projectedNetWorth.value, horizonInflationFactor.value),
)
const detailSheetTitle = computed(() => {
  const titleKeys = {
    cash: 'cashDetails',
    investment: 'investmentDetails',
    debt: 'debtDetails',
    netWorth: 'netWorthDetails',
    projection: 'projectionDetails',
  }
  return t(`whatIf.strategy.${titleKeys[detailSheetKind.value] || 'projectionDetails'}`)
})
const strategyOutcomes = computed(() => {
  const outcomes = []
  const horizonMonths = activeScenario.value.horizonYears * 12

  const safetyId = `safety_${activeScenario.value.cashTargetMonths}_months`
  const safety = currentMilestones.value.find(({ id }) => id === safetyId)
  const cashTargetMonth = projection.value.strategy.cashTargetMonth
  const finalPoint = projection.value.strategy.points.at(-1)
  const inflationAdjustedSafetyMonths = calculateInflationAdjustedCoverage({
    projectedValue: finalPoint.cash,
    currentPeriodCost: simulation.value.monthlyCostOfLife,
    annualInflationPercent: activeScenario.value.inflationAnnualPercent,
    month: horizonMonths,
  })
  const safetyProgressPercent = milestoneProgressPercent(safety)
  outcomes.push({
    id: safetyId,
    icon: 'health_and_safety',
    tone: 'cash',
    showCalculationInfo: true,
    title: t('milestones.families.safety.title'),
    milestoneTitle: t('whatIf.strategy.safetyMilestoneTitle', {
      months: activeScenario.value.cashTargetMonths,
    }),
    milestoneDescription: t('whatIf.strategy.safetyMilestoneDescription', {
      months: activeScenario.value.cashTargetMonths,
    }),
    currentLabel: t('whatIf.strategy.currentCoverage'),
    achievementLabel: t('whatIf.strategy.milestoneAchievement'),
    progressPercent: safetyProgressPercent,
    todayValue: t('whatIf.strategy.monthsValue', {
      months: formatNumber(safety?.currentValue || 0),
    }),
    todayQualifier: t('whatIf.strategy.percentOfGoal', {
      percentage: safetyProgressPercent,
    }),
    goalReachedValue: goalReachedValue(cashTargetMonth),
    goalReachedQualifier:
      cashTargetMonth === 0
        ? coverageAchievementQualifier(
            safety?.currentValue,
            activeScenario.value.cashTargetMonths,
            'months',
          )
        : goalReachedQualifier(cashTargetMonth),
    goalReachedIcon: cashTargetMonth === 0 ? 'check_circle_outline' : '',
    projectedLabel: projectedCoverageLabel(),
    projectedValue: t('whatIf.strategy.monthsValue', {
      months: formatNumber(inflationAdjustedSafetyMonths),
    }),
    projectedQualifier: t('whatIf.strategy.inflationAdjustedQualifier'),
    resultValue: t('whatIf.strategy.monthsValue', {
      months: formatNumber(inflationAdjustedSafetyMonths),
    }),
    resultQualifier: t('whatIf.strategy.inflationAdjustedQualifier'),
    summary: t('whatIf.strategy.projectedCashSummary', {
      value: formatCurrency(projection.value.strategy.cash),
    }),
    description: t('whatIf.strategy.projectedCashWithInflationKpi', {
      value: formatCurrency(projection.value.strategy.cash),
      target: formatCurrency(projection.value.strategy.cashTarget),
      months: formatNumber(inflationAdjustedSafetyMonths),
    }),
    result:
      cashTargetMonth === 0
        ? t('whatIf.cash.milestoneAchieved')
        : cashTargetMonth != null
          ? reachEstimate(cashTargetMonth)
          : allocation.value.cash <= 0
            ? t('whatIf.strategy.noExtraSavingsAllocated')
            : t('whatIf.strategy.notReachedInHorizon', {
                years: activeScenario.value.horizonYears,
              }),
    status:
      cashTargetMonth != null ? 'positive' : allocation.value.cash > 0 ? 'progress' : 'negative',
  })
  outcomes.at(-1).badgeResult = outcomes.at(-1).result

  const freedom =
    currentMilestones.value.find(({ family, reached }) => family === 'freedom' && !reached) ||
    currentMilestones.value.findLast(({ family }) => family === 'freedom')
  if (freedom) {
    const annualCost = simulation.value.monthlyCostOfLife * 12
    const currentNetInvestableWealth = freedom.currentValue * annualCost
    const initialProjectionPoint = projection.value.strategy.monthlyPoints[0]
    const currentGrossInvestableWealth =
      initialProjectionPoint.cash + initialProjectionPoint.investableValue
    const reachedAt = projection.value.strategy.monthlyPoints.find(
      ({ month, cash, investableValue }) =>
        calculateInflationAdjustedCoverage({
          projectedValue: calculateProjectedNetInvestableWealth({
            currentNetInvestableWealth,
            currentGrossInvestableWealth,
            projectedGrossInvestableWealth: cash + investableValue,
          }),
          currentPeriodCost: annualCost,
          annualInflationPercent: activeScenario.value.inflationAnnualPercent,
          month,
        }) >= freedom.target,
    )
    const inflationAdjustedFundedYears = calculateInflationAdjustedCoverage({
      projectedValue: calculateProjectedNetInvestableWealth({
        currentNetInvestableWealth,
        currentGrossInvestableWealth,
        projectedGrossInvestableWealth: finalPoint.cash + finalPoint.investableValue,
      }),
      currentPeriodCost: annualCost,
      annualInflationPercent: activeScenario.value.inflationAnnualPercent,
      month: horizonMonths,
    })
    const freedomProgressPercent = milestoneProgressPercent(freedom)
    const freedomReachedMonth = reachedAt?.month ?? null
    outcomes.push({
      id: freedom.id,
      icon: 'flight_takeoff',
      tone: 'freedom',
      showInfo: true,
      showCalculationInfo: true,
      title: t('milestones.families.freedom.title'),
      milestoneTitle: t('whatIf.strategy.freedomMilestoneTitle', {
        years: freedom.target,
      }),
      milestoneDescription: t('whatIf.strategy.freedomMilestoneDescription', {
        years: freedom.target,
      }),
      currentLabel: t('whatIf.strategy.currentCoverage'),
      achievementLabel: t('whatIf.strategy.milestoneAchievement'),
      progressPercent: freedomProgressPercent,
      todayValue: t('whatIf.strategy.yearsValue', {
        years: formatNumber(freedom.currentValue),
      }),
      todayQualifier: t('whatIf.strategy.percentOfGoal', {
        percentage: freedomProgressPercent,
      }),
      goalReachedValue: goalReachedValue(freedomReachedMonth),
      goalReachedQualifier:
        freedomReachedMonth === 0
          ? coverageAchievementQualifier(freedom.currentValue, freedom.target, 'years')
          : goalReachedQualifier(freedomReachedMonth),
      goalReachedIcon: freedomReachedMonth === 0 ? 'check_circle_outline' : '',
      projectedLabel: projectedCoverageLabel(),
      projectedValue: t('whatIf.strategy.yearsValue', {
        years: formatNumber(inflationAdjustedFundedYears),
      }),
      projectedQualifier: t('whatIf.strategy.inflationAdjustedQualifier'),
      resultValue: t('whatIf.strategy.yearsValue', {
        years: formatNumber(inflationAdjustedFundedYears),
      }),
      resultQualifier: t('whatIf.strategy.inflationAdjustedQualifier'),
      summary: t('whatIf.strategy.fundedYearsSummary', {
        years: formatNumber(inflationAdjustedFundedYears),
      }),
      description: t('whatIf.strategy.freedomProjectedWithInflationKpi', {
        adjustedYears: formatNumber(inflationAdjustedFundedYears),
      }),
      result: reachedAt
        ? reachedAt.month === 0
          ? t('whatIf.cash.milestoneAchieved')
          : reachEstimate(reachedAt.month)
        : t('whatIf.strategy.notReachedInHorizon', {
            years: activeScenario.value.horizonYears,
          }),
      status: reachedAt ? 'positive' : allocation.value.invest > 0 ? 'progress' : 'negative',
    })
    outcomes.at(-1).badgeResult = outcomes.at(-1).result
  }

  const netWorth =
    currentMilestones.value.find(({ family, reached }) => family === 'netWorth' && !reached) ||
    currentMilestones.value.findLast(({ family }) => family === 'netWorth')
  if (netWorth) {
    const reachedAt = monthlyNetWorthPoints.value.find(({ value }) =>
      netWorth.id === 'net_worth_positive' ? value > 0 : value >= netWorth.target,
    )
    const finalNetWorth = netWorthPoints.value.at(-1)?.value || 0
    const netWorthProgressPercent = milestoneProgressPercent(netWorth)
    const netWorthReachedMonth = reachedAt?.month ?? null
    const projectedNetWorthProgress =
      netWorth.target > 0
        ? Math.max(0, Math.round((finalNetWorth / netWorth.target) * 100))
        : Number(finalNetWorth > 0) * 100
    outcomes.push({
      id: netWorth.id,
      icon: 'trending_up',
      tone: 'net-worth',
      title: t('milestones.families.netWorth.title'),
      milestoneTitle:
        netWorth.id === 'net_worth_positive'
          ? t('whatIf.strategy.positiveNetWorthMilestoneTitle')
          : t('whatIf.strategy.netWorthMilestoneTitle', {
              value: formatCurrency(netWorth.target),
            }),
      milestoneDescription:
        netWorth.id === 'net_worth_positive'
          ? t('whatIf.strategy.positiveNetWorthMilestoneDescription')
          : t('whatIf.strategy.netWorthMilestoneDescription', {
              value: formatCurrency(netWorth.target),
            }),
      currentLabel: t('whatIf.strategy.currentNetWorth'),
      achievementLabel: t('whatIf.strategy.milestoneAchievement'),
      progressPercent: netWorthProgressPercent,
      todayValue: formatCurrency(netWorth.currentValue),
      todayQualifier: t('whatIf.strategy.percentOfGoal', {
        percentage: netWorthProgressPercent,
      }),
      goalReachedValue: goalReachedValue(netWorthReachedMonth),
      goalReachedQualifier:
        netWorthReachedMonth === 0
          ? amountAboveTargetQualifier(netWorth.currentValue, netWorth.target)
          : goalReachedQualifier(netWorthReachedMonth),
      goalReachedIcon: netWorthReachedMonth === 0 ? 'check_circle_outline' : '',
      projectedLabel: t('whatIf.strategy.projectedNetWorthAt', {
        years: activeScenario.value.horizonYears,
      }),
      projectedValue: formatCurrency(finalNetWorth),
      projectedQualifier: t('whatIf.strategy.percentOfGoal', {
        percentage: projectedNetWorthProgress,
      }),
      resultValue: formatCurrency(finalNetWorth),
      resultQualifier: t('whatIf.strategy.projectedResultContext', {
        years: activeScenario.value.horizonYears,
        value: formatCurrency(projectedRealNetWorth.value),
      }),
      summary: t('whatIf.strategy.projectedNetWorthSummary', {
        value: formatCurrency(finalNetWorth),
      }),
      description: t('whatIf.strategy.projectedNetWorth', {
        value: formatCurrency(finalNetWorth),
      }),
      result: reachedAt
        ? reachedAt.month === 0
          ? t('whatIf.cash.milestoneAchieved')
          : reachEstimate(reachedAt.month)
        : t('whatIf.strategy.notReachedInHorizon', {
            years: activeScenario.value.horizonYears,
          }),
      status:
        reachedAt || finalNetWorth > netWorth.currentValue
          ? reachedAt
            ? 'positive'
            : 'progress'
          : 'negative',
    })
    outcomes.at(-1).badgeResult = outcomes.at(-1).result
  }

  if (selectedDebt.value && allocation.value.debt > 0) {
    const id = debtMilestoneId(selectedDebt.value.categoryId)
    const monthlyDebtContribution = monthlyFor(allocation.value.debt)
    const payoffMonth = debtPayoff.value?.accelerated.remainingPayments ?? null
    const modeledHorizonPayment = debtPayoff.value?.accelerated.schedule[horizonMonths - 1]
    const projectedBalance = debtPayoff.value
      ? (modeledHorizonPayment?.remainingBalance ??
        (payoffMonth <= horizonMonths ? 0 : selectedDebtModel.value.balance))
      : selectedDebt.value.balance
    const debtReached = Number(selectedDebtModel.value.balance) <= 0
    const debtProgressPercent = debtPayoff.value
      ? displayProgressPercent(debtPayoff.value.progress, debtReached)
      : milestoneProgressPercent(currentMilestones.value.find((milestone) => milestone.id === id))
    outcomes.push({
      id,
      icon: 'credit_score',
      tone: 'debt',
      title: t('milestones.families.debt.title'),
      milestoneTitle: t(`milestones.items.${id}`),
      milestoneDescription: t('whatIf.strategy.debtMilestoneDescription', {
        name: selectedDebt.value.name,
      }),
      currentLabel: t('whatIf.strategy.repaidToDate'),
      achievementLabel: t('whatIf.strategy.milestoneAchievement'),
      progressPercent: debtProgressPercent,
      todayValue: `${debtProgressPercent}%`,
      todayQualifier: t('whatIf.strategy.mortgageRepaid'),
      goalReachedValue: goalReachedValue(debtReached ? 0 : payoffMonth),
      goalReachedQualifier: debtReached
        ? t('whatIf.strategy.remainingBalance', { value: formatCurrency(0) })
        : debtPayoff.value
          ? formatMonthYear(debtPayoff.value.accelerated.payoffDate)
          : t('whatIf.debt.modelUnavailable'),
      goalReachedIcon: debtReached ? 'check_circle_outline' : '',
      projectedLabel: t('whatIf.strategy.timeSaved'),
      projectedValue: debtPayoff.value
        ? formatDuration(debtPayoff.value.accelerated.monthsEarlier)
        : '—',
      projectedQualifier: t('whatIf.strategy.earlierThanPlanned'),
      resultValue: formatCurrency(projectedBalance),
      resultQualifier: t('whatIf.strategy.projectedBalanceQualifier'),
      summary: t('whatIf.strategy.projectedDebtSummary', {
        value: formatCurrency(projectedBalance),
      }),
      description: t('whatIf.strategy.projectedDebtBalance', {
        name: selectedDebt.value.name,
        value: formatCurrency(projectedBalance),
      }),
      result:
        monthlyDebtContribution <= 0
          ? t('whatIf.strategy.noExtraDebtReduction')
          : debtPayoff.value
            ? t('whatIf.strategy.modeledDebtResult', {
                date: formatMonthYear(debtPayoff.value.accelerated.payoffDate),
              })
            : t('whatIf.debt.modelUnavailable'),
      status:
        monthlyDebtContribution <= 0 || !debtPayoff.value
          ? 'negative'
          : payoffMonth <= horizonMonths
            ? 'positive'
            : 'progress',
    })
    outcomes.at(-1).badgeResult =
      monthlyDebtContribution > 0 && payoffMonth != null && payoffMonth <= horizonMonths
        ? reachEstimate(payoffMonth)
        : outcomes.at(-1).result
  }

  return outcomes
})

const selectedDesktopOutcome = computed(() =>
  strategyOutcomes.value.find(
    (outcome) => outcomeKind(outcome) === selectedDesktopOutcomeKind.value,
  ),
)
const detailSheetOutcome = computed(() =>
  strategyOutcomes.value.find((outcome) => outcomeKind(outcome) === detailSheetKind.value),
)

watch(
  strategyOutcomes,
  (outcomes) => {
    if (outcomes.some((outcome) => outcomeKind(outcome) === selectedDesktopOutcomeKind.value))
      return
    const fallback =
      outcomes.find((outcome) => outcomeKind(outcome) === 'investment') || outcomes[0]
    if (fallback) selectedDesktopOutcomeKind.value = outcomeKind(fallback)
  },
  { immediate: true },
)

function openOutcomeDetail(outcome) {
  const kind = outcomeKind(outcome)
  if ($q.screen.gt.sm) {
    selectedDesktopOutcomeKind.value = kind
    return
  }

  detailSheetKind.value = kind
  detailSheetOpen.value = true
}

function outcomeKind(outcome) {
  const detailByTone = {
    cash: 'cash',
    debt: 'debt',
    freedom: 'investment',
    'net-worth': 'netWorth',
  }
  return detailByTone[outcome?.tone] || 'investment'
}

watch(workspaceId, () => prepare(), { immediate: true })

async function prepare(force = false) {
  pageError.value = null
  try {
    await Promise.all([
      financialYearsStore.load(workspaceId.value, year, force),
      whatIfStore.load(workspaceId.value, force),
      assetsStore.loadConfig(workspaceId.value, force),
      liabilitiesStore.loadConfig(workspaceId.value, force),
    ])
    await Promise.all([
      assetsStore.loadCategory(workspaceId.value, 'cash'),
      assetsStore.loadCategory(workspaceId.value, 'real_estate'),
      liabilitiesStore.config?.categories?.mortgage
        ? liabilitiesStore.loadCategory(workspaceId.value, 'mortgage')
        : Promise.resolve(),
    ])
    const needsInitialScenario =
      !isDemoWorkspaceId(workspaceId.value) &&
      activeScenario.value.id === defaultStrategyScenario.id
    initialScenarioDialogOpen.value = needsInitialScenario
    if (needsInitialScenario) {
      initialScenarioName.value = ''
    }
  } catch (loadError) {
    pageError.value = loadError
  }
}

async function persist(nextConfig) {
  try {
    await whatIfStore.saveStrategy(workspaceId.value, nextConfig)
    return true
  } catch {
    $q.notify({ type: 'negative', message: t('whatIf.errors.save'), position: 'top' })
    return false
  }
}

async function confirmInitialScenario() {
  const name = initialScenarioName.value.trim()
  if (!name || whatIfStore.saving) return
  const id = `scenario-${Date.now()}`
  const scenario = normalizeStrategyScenario({ ...activeScenario.value, id, name })
  const saved = await persist({ scenarios: [scenario], activeScenarioId: id })
  if (saved) initialScenarioDialogOpen.value = false
}

function updateScenario(changes) {
  const next = normalizeStrategyScenario({ ...activeScenario.value, ...changes })
  return persist({
    scenarios: config.value.scenarios.map((scenario) =>
      scenario.id === next.id ? next : scenario,
    ),
  })
}

function selectScenario(id) {
  persist({ activeScenarioId: id })
}

function addScenario() {
  if (config.value.scenarios.length >= 10) return
  $q.dialog({
    title: t('whatIf.strategy.newScenario'),
    prompt: { model: '', type: 'text', label: t('whatIf.strategy.scenarioName'), outlined: true },
    cancel: true,
  }).onOk((name) => {
    const id = `scenario-${Date.now()}`
    const scenario = normalizeStrategyScenario({ ...activeScenario.value, id, name })
    persist({ scenarios: [...config.value.scenarios, scenario], activeScenarioId: id })
  })
}

function setCustomHorizon() {
  $q.dialog({
    title: t('whatIf.strategy.customHorizon'),
    prompt: {
      model: activeScenario.value.horizonYears,
      type: 'number',
      min: 1,
      max: 50,
      suffix: t('whatIf.years'),
      outlined: true,
    },
    cancel: true,
  }).onOk((value) => updateScenario({ horizonYears: Number(value) }))
}

function deleteScenario() {
  if (config.value.scenarios.length === 1) return
  const scenarios = config.value.scenarios.filter(({ id }) => id !== activeScenario.value.id)
  persist({ scenarios, activeScenarioId: scenarios[0].id })
}

function resetScenario() {
  const next = normalizeStrategyScenario({
    ...defaultStrategyScenario,
    id: activeScenario.value.id,
    name: activeScenario.value.name,
    selectedLiabilityId: selectedDebt.value?.id || null,
  })
  return persist({
    scenarios: config.value.scenarios.map((scenario) =>
      scenario.id === next.id ? next : scenario,
    ),
  })
}

function setAllocation(key, value) {
  const target = Math.min(100, Math.max(0, Number(value) || 0))
  adjustAllocation(key, target - allocation.value[key])
}

function adjustAllocation(key, delta) {
  const next = { ...allocation.value }
  if (key === 'invest') {
    if (delta > 0) {
      let remaining = Math.min(delta, next.cash + next.debt)
      const cashChange = Math.min(next.cash, remaining)
      next.cash -= cashChange
      remaining -= cashChange
      next.debt -= Math.min(next.debt, remaining)
      next.invest = 100 - next.cash - next.debt
    } else {
      const change = Math.min(-delta, next.invest)
      next.invest -= change
      next.cash += change
    }
  } else {
    const change = delta > 0 ? Math.min(delta, next.invest) : -Math.min(-delta, next[key])
    next[key] += change
    next.invest -= change
  }
  updateScenario({ allocation: next })
}

function setMixAllocation(id, value) {
  const current = activeScenario.value.investmentMix[id]?.allocation
  if (current == null) return
  const target = Math.min(100, Math.max(0, Number(value) || 0))
  adjustMix(id, target - current)
}

function adjustMix(id, delta) {
  const mix = cloneMix()
  if (!mix[id]) return
  const otherIds = Object.keys(mix).filter((key) => key !== id)
  if (!otherIds.length) return

  if (delta > 0) {
    const donor = otherIds.sort((left, right) => mix[right].allocation - mix[left].allocation)[0]
    const change = Math.min(delta, mix[donor].allocation)
    mix[donor].allocation -= change
    mix[id].allocation += change
  } else {
    const receiver =
      id !== 'stockMarket' && mix.stockMarket
        ? 'stockMarket'
        : otherIds.sort((left, right) => mix[right].allocation - mix[left].allocation)[0]
    const change = Math.min(-delta, mix[id].allocation)
    mix[id].allocation -= change
    mix[receiver].allocation += change
  }
  updateScenario({ investmentMix: mix })
}

function openInvestmentTypeDialog() {
  pendingInvestmentType.value = availableMixOptions.value[0]?.value || null
  investmentTypeDialogOpen.value = true
}

function confirmInvestmentType() {
  const type = pendingInvestmentType.value
  if (!type) return
  const definition = investmentTypeDefinitions.find(({ id }) => id === type)
  const mix = cloneMix()
  const donor = Object.keys(mix).sort(
    (left, right) => mix[right].allocation - mix[left].allocation,
  )[0]
  const allocationToAdd = Math.min(10, mix[donor]?.allocation || 0)
  if (!allocationToAdd) return
  mix[donor].allocation -= allocationToAdd
  mix[type] = { allocation: allocationToAdd, annualReturnPercent: definition.returnPercent }
  updateScenario({ investmentMix: mix })
  investmentTypeDialogOpen.value = false
}

function removeMix(id) {
  const mix = cloneMix()
  const recipient = Object.keys(mix)
    .filter((key) => key !== id)
    .sort((left, right) => mix[right].allocation - mix[left].allocation)[0]
  if (!mix[id] || !recipient) return
  mix[recipient].allocation += mix[id].allocation || 0
  delete mix[id]
  updateScenario({ investmentMix: mix })
}

function setReturn(id, value) {
  const numeric = Math.min(100, Math.max(0, Number(value) || 0))
  updateScenario({
    investmentReturns: { ...activeScenario.value.investmentReturns, [id]: numeric },
  })
}

function setCashReturn(value) {
  const numeric = Math.min(100, Math.max(-100, Number(value) || 0))
  updateScenario({ cashAnnualReturnPercent: numeric })
}

function resetCashReturn() {
  const candidate = { ...activeScenario.value }
  delete candidate.cashAnnualReturnPercent
  const next = normalizeStrategyScenario(candidate)
  return persist({
    scenarios: config.value.scenarios.map((scenario) =>
      scenario.id === next.id ? next : scenario,
    ),
  })
}

function setInflation(value) {
  const numeric = Math.min(100, Math.max(0, Number(value) || 0))
  updateScenario({ inflationAnnualPercent: numeric })
}

function cloneMix() {
  return Object.fromEntries(
    Object.entries(activeScenario.value.investmentMix).map(([id, value]) => [id, { ...value }]),
  )
}

function monthlyFor(percent) {
  return (monthlySavings.value * percent) / 100
}

function milestoneProgressPercent(milestone) {
  return displayProgressPercent(milestone?.progress, milestone?.reached)
}

function goalReachedValue(months) {
  if (months === 0) return t('whatIf.strategy.achieved')
  if (months == null) return t('whatIf.strategy.notReached')
  if (months < 12)
    return t('whatIf.strategy.inMonthsShort', { months: Math.max(1, Math.ceil(months)) })
  return t('whatIf.strategy.inYearsShort', {
    years: Math.max(1, Math.ceil(months / 12)),
  })
}

function goalReachedQualifier(months) {
  if (months === 0) return t('whatIf.strategy.targetMet')
  if (months == null)
    return t('whatIf.strategy.withinProjection', { years: activeScenario.value.horizonYears })
  const estimated = new Date(`${localToday()}T00:00:00Z`)
  estimated.setUTCMonth(estimated.getUTCMonth() + Math.max(0, Math.ceil(months)))
  return t('whatIf.strategy.estimatedYear', { year: estimated.getUTCFullYear() })
}

function projectedCoverageLabel() {
  return t('whatIf.strategy.projectedCoverageAt', {
    years: activeScenario.value.horizonYears,
  })
}

function coverageAchievementQualifier(currentValue, target, unit) {
  const amountAboveTarget = Math.max(0, Number(currentValue || 0) - Number(target || 0))
  if (amountAboveTarget <= 0) return t('whatIf.strategy.targetMet')
  const isSingular = Math.abs(amountAboveTarget - 1) < 0.05
  return t(`whatIf.strategy.${isSingular ? unit.slice(0, -1) : unit}AboveTarget`, {
    amount: formatNumber(amountAboveTarget),
  })
}

function amountAboveTargetQualifier(currentValue, target) {
  const amountAboveTarget = Math.max(0, Number(currentValue || 0) - Number(target || 0))
  if (amountAboveTarget <= 0) return t('whatIf.strategy.targetMet')
  return t('whatIf.strategy.amountAboveTarget', {
    value: formatCurrency(amountAboveTarget),
  })
}

function reachEstimate(months) {
  if (months < 12)
    return t('whatIf.strategy.estimatedReachMonths', { months: Math.max(1, Math.ceil(months)) })
  return t('whatIf.strategy.estimatedReachYears', {
    years: Math.max(1, Math.ceil(months / 12)),
  })
}

function localToday() {
  if (isDemoWorkspaceId(workspaceId.value)) return DEMO_REFERENCE_DATE
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
}

function formatDuration(months) {
  const total = Math.max(0, Number(months) || 0)
  const years = Math.floor(total / 12)
  const remainingMonths = total % 12
  if (!years) return t('liabilities.mortgage.durationMonths', { months: remainingMonths })
  if (!remainingMonths) return t('liabilities.mortgage.durationYears', { years })
  return t('liabilities.mortgage.duration', { years, months: remainingMonths })
}

function formatMonthYear(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-IE', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

function debtMilestoneId(categoryId) {
  if (categoryId === 'mortgage') return 'debt_mortgage_free'
  if (categoryId === 'car_loan') return 'debt_car_free'
  if (categoryId === 'student_loan') return 'debt_student_free'
  if (['personal_loan', 'credit_card_debt', 'other_debt'].includes(categoryId))
    return 'debt_consumer_free'
  return 'debt_free'
}

function formatNumber(value) {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value)
}

function liabilityCategoryName(categoryId) {
  return t(getLiabilityCategory(categoryId)?.nameKey || 'whatIf.debt.title')
}
</script>

<style scoped lang="scss">
@use '@/css/mixins' as *;
@use '@/css/foundation/breakpoints' as bp;

.strategy-page {
  @include financial-page;
}
.strategy-shell {
  @include financial-shell;
  max-width: 80rem;
}
.page-state {
  display: grid;
  place-items: center;
  gap: 0.75rem;
  min-height: 28rem;
  color: var(--color-copy);
}
.projection-warning {
  color: #7a4b00;
  background: #fff4d6;
}
.strategy-overview {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  grid-template-areas:
    'available available'
    'allocation outcomes';
  gap: 1rem;
  align-items: stretch;
  margin-top: 0.75rem;
}
.overview-available-panel {
  grid-area: available;
  margin-top: 0;
}
.overview-allocation-panel {
  display: flex;
  flex-direction: column;
  grid-area: allocation;
}
.overview-allocation-content {
  display: grid;
  align-content: center;
  flex: 1;
}
.overview-outcomes-panel {
  grid-area: outcomes;
}
.overview-section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}
.overview-section-heading h2,
.overview-section-heading p {
  margin: 0;
}
.overview-section-heading p {
  margin-top: 0.25rem;
}
.text-link {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 0.3rem;
  padding: 0.25rem 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}
.overview-heading-link {
  min-height: 1.4rem;
  padding: 0;
  line-height: 1.3;
}
.allocation-bar {
  display: flex;
  height: var(--financial-chart-bar-height);
  margin: 0 0 var(--space-6);
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-surface-soft);
}
.allocation-bar i {
  display: block;
  min-width: 0;
}
.allocation-bar .cash {
  background: #15a875;
}
.allocation-bar .invest {
  background: var(--color-primary);
}
.allocation-bar .debt {
  background: var(--color-warning);
}
.allocation-overview-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.allocation-overview-metrics article {
  display: grid;
  justify-items: center;
  gap: 0.15rem;
  padding: 0 0.75rem;
  border-right: 1px solid var(--color-line);
  text-align: center;
}
.allocation-overview-metrics article:last-child {
  border: 0;
}
.allocation-overview-metrics small,
.allocation-overview-metrics span:last-child {
  color: var(--color-copy);
  font-size: 0.69rem;
}
.allocation-overview-metrics strong {
  font-size: 1.12rem;
}
.overview-outcome-list {
  display: grid;
  margin-top: 0.6rem;
}
.overview-outcome {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(7rem, auto) auto;
  align-items: center;
  gap: 0.7rem;
  padding: 0.7rem 0;
  border: 0;
  border-bottom: 1px solid var(--color-line);
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.overview-outcome:last-child {
  border-bottom: 0;
}
.overview-outcome .outcome-copy {
  display: grid;
  min-width: 0;
  gap: 0.15rem;
}
.overview-outcome .outcome-copy strong {
  font-size: 0.83rem;
}
.overview-outcome .outcome-copy small {
  color: var(--color-copy);
  font-size: 0.68rem;
  line-height: 1.35;
}
.overview-outcome b {
  max-width: 13rem;
  text-align: right;
  font-size: 0.72rem;
}
.outcome-arrow {
  color: var(--color-copy);
}
.desktop-projections {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}
.desktop-projection-heading {
  @include financial-chart-heading;
  gap: 1.5rem;
}
.desktop-projection-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.desktop-projection-controls .horizon-options {
  --strategy-horizon-option-min-width: 4.5rem;
}
.desktop-strategy-chart,
.desktop-mortgage-chart {
  margin-top: 0.25rem;
}
.desktop-result-breakdown {
  margin-top: 0.35rem;
}
.info-sheet-content {
  display: grid;
  gap: 0.75rem;
  padding: 0.5rem 1.25rem 1.25rem;
}
.info-sheet-content p {
  margin: 0;
  color: var(--color-copy);
  line-height: 1.55;
}
.desktop-debt-select {
  width: min(17rem, 32vw);
}
.strategy-sheet {
  display: flex;
  flex-direction: column;
  width: min(48rem, calc(100vw - 2rem));
  max-width: none;
  max-height: min(88dvh, 54rem);
  overflow: hidden;
  border-radius: 1.25rem;
  color: var(--color-ink);
}
.projection-detail-sheet {
  width: min(56rem, calc(100vw - 2rem));
}
.strategy-sheet-handle {
  display: none;
  align-self: center;
  width: 2.8rem;
  height: 0.28rem;
  margin-top: 0.55rem;
  border-radius: 999px;
  background: #aab8ca;
}
.strategy-sheet-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.35rem 0.85rem;
}
.strategy-sheet-heading h2,
.strategy-sheet-heading p,
.sheet-subheading h3,
.sheet-subheading p,
.detail-section-heading h3 {
  margin: 0;
}
.strategy-sheet-heading p,
.sheet-subheading p {
  margin-top: 0.3rem;
}
.settings-tabs {
  flex: 0 0 auto;
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-line);
  color: var(--color-copy);
}
.settings-tab-content :deep(.q-panel),
.settings-tab-content :deep(.q-tab-panel) {
  background: transparent;
}
.settings-tab-content :deep(.q-tab-panel) {
  padding: 0;
}
.strategy-sheet-scroll {
  min-height: 0;
  padding: 0.6rem 1.35rem 1.25rem;
  overflow-y: auto;
}
.sheet-settings-section {
  padding: 1rem;
  border: 1px solid var(--color-line);
  border-radius: 1rem;
  background: var(--color-surface-soft);
}
.sheet-settings-section + .sheet-settings-section {
  margin-top: 1rem;
}
.sheet-settings-heading {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.9rem;
}
.sheet-settings-heading > span {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.7rem;
  background: var(--color-blue-soft);
  color: var(--color-primary);
  font-size: 1.15rem;
}
.sheet-settings-heading h3,
.sheet-settings-heading p {
  margin: 0;
}
.sheet-settings-heading p {
  margin-top: 0.15rem;
}
.model-parameters-section {
  background: var(--color-surface);
}
.model-parameters-section .sheet-subheading {
  margin-top: 1rem;
  padding-top: 0.9rem;
}
.model-parameters-section .first-parameter-heading {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}
.sheet-allocation-list {
  display: grid;
  gap: 0.7rem;
}
.sheet-allocation-total {
  margin-top: 0.8rem;
}
.nested-mix-heading {
  display: grid;
  gap: var(--space-1);
}
.nested-mix-list {
  margin-top: var(--space-3);
}
.sheet-subheading {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-line);
}
.strategy-sheet-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
  padding: 0.9rem 1.35rem 1.25rem;
  border-top: 1px solid var(--color-line);
}
.detail-sheet-content {
  display: grid;
  gap: 1rem;
}
.detail-sheet-section {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  border: 1px solid var(--color-line);
  border-radius: 0.9rem;
}
.detail-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.detail-section-heading h3 {
  font-size: 1rem;
}
.net-worth-detail-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
}
.net-worth-detail-controls .detail-horizon-options {
  min-width: 0;
}
.large-detail-values strong {
  font-size: 1.05rem;
}
.projection-heading h2 {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.25;
}
.projection-heading p {
  margin: 0.25rem 0 0;
  color: var(--color-copy);
  font-size: 0.72rem;
  line-height: 1.35;
}
.allocation-list,
.mix-list {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
  margin-top: 0.75rem;
}
:deep(.mini-icon) {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.1rem;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 50%;
  overflow: hidden;
}
:deep(.mini-icon > .q-icon) {
  position: static !important;
  margin: 0 !important;
  transform: none !important;
  line-height: 1;
}
:deep(.mini-icon.cash) {
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}
:deep(.mini-icon.invest) {
  background: var(--color-blue-soft);
  color: var(--color-primary);
}
:deep(.mini-icon.debt) {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}
:deep(.mini-icon.freedom) {
  background: var(--color-purple-soft);
  color: var(--color-purple);
}
:deep(.mini-icon.net-worth) {
  background: var(--color-blue-soft);
  color: var(--color-primary);
}
.allocation-total {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 1rem;
  margin-top: 0.55rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.75rem;
  background: var(--color-surface-soft);
  font-size: 0.86rem;
}
.allocation-total strong:last-child {
  text-align: right;
}
.investment-mix-card {
  display: grid;
  grid-template-columns: 2.5rem minmax(5.5rem, 1fr) 4.4rem 5.1rem minmax(3.75rem, auto) auto;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  padding: 0.65rem;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 0.8rem;
  background: white;
}
.cash-return-card {
  grid-template-columns: 2.5rem minmax(5.5rem, 1fr) 5.1rem;
  margin-top: 0.7rem;
}
.investment-return-card {
  grid-template-columns: 2.5rem minmax(5.5rem, 1fr) 5.1rem;
}
.mix-card-icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  font-size: 1.3rem;
}
.mix-card-icon.cash-return {
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}
.mix-card-icon.stock-market {
  background: var(--color-blue-soft);
  color: var(--color-primary);
}
.mix-card-icon.real-estate {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}
.mix-card-icon.fixed-income {
  background: var(--color-green-soft);
  color: var(--color-success-dark);
}
.mix-card-icon.crypto {
  background: var(--color-purple-soft);
  color: var(--color-purple);
}
.mix-card-icon.business {
  background: #e6f7f6;
  color: #087f7a;
}
.mix-card-icon.other {
  background: var(--color-surface-soft);
  color: var(--color-copy);
}
.mix-card-identity,
.mix-card-metric {
  display: grid;
  min-width: 0;
}
.mix-card-identity strong {
  font-size: 0.88rem;
}
.mix-card-identity small,
.mix-card-metric small {
  overflow: hidden;
  color: var(--color-copy);
  font-size: 0.68rem;
  text-overflow: ellipsis;
}
.mix-card-metric {
  min-height: 2.4rem;
  align-content: center;
  padding: var(--space-1) var(--space-2);
  border: 0;
  border-radius: var(--radius-button);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
}
.mix-card-metric strong {
  font-size: 1rem;
}
.editable-metric {
  cursor: pointer;
}
.editable-metric:hover,
.editable-metric:focus-visible {
  background: var(--color-surface-soft);
}
.editable-metric:hover strong,
.editable-metric:focus-visible strong {
  color: var(--color-primary);
}
.editable-metric:focus-visible {
  outline: 2px solid var(--color-primary-focus);
  outline-offset: 1px;
}
.add-investment-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  margin-top: 0.7rem;
  padding: 0.8rem;
  border: 1px dashed #9ac5ff;
  border-radius: 0.75rem;
  background: #f8fbff;
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}
.add-investment-card:focus-visible {
  @include focus-ring;
}
.investment-type-dialog {
  width: min(30rem, calc(100vw - 2rem));
  overflow: hidden;
  border-radius: var(--radius-md);
}
.investment-dialog-heading {
  padding: 1.35rem 1.35rem 0.7rem;
}
.investment-dialog-heading h2,
.investment-dialog-heading p {
  margin: 0;
}
.investment-dialog-heading p {
  margin-top: 0.35rem;
}
.investment-dialog-options {
  display: grid;
  gap: 0.55rem;
  padding: 0.7rem 1.35rem 1.1rem;
}
.investment-dialog-options > button {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem;
  border: 1px solid var(--color-line);
  background: white;
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
}
.investment-dialog-options > button.selected {
  border-color: var(--color-primary);
  background: var(--color-blue-soft);
}
.investment-dialog-options > button > span:nth-child(2) {
  display: grid;
}
.investment-dialog-options small {
  color: var(--color-copy);
  font-size: 0.7rem;
}
.investment-dialog-options > button > .q-icon:last-child {
  color: var(--color-primary);
}
.investment-dialog-actions {
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.85rem 1.35rem 1.2rem;
  border-top: 1px solid var(--color-line);
}
.detail-values {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}
.detail-values span {
  display: grid;
}
.detail-values small {
  color: var(--color-copy);
  font-size: 0.65rem;
}
.detail-values strong {
  color: var(--color-ink);
  font-size: 0.78rem;
}
.positive {
  color: var(--color-success-dark);
}
.negative {
  color: var(--color-danger);
}
.progress {
  color: var(--color-primary);
}
.projection-panel {
  grid-area: projection;
  position: relative;
}
.debt-projection-fallback {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: var(--color-surface-soft);
}
.debt-projection-fallback > .q-icon {
  color: var(--color-primary);
  font-size: 1.4rem;
}
.debt-projection-fallback div {
  display: grid;
  gap: 0.2rem;
}
.debt-projection-fallback p {
  margin: 0;
  color: var(--color-copy);
  font-size: 0.72rem;
}
.projection-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.projection-controls {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.result-breakdown {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin-top: 0.75rem;
  padding: 1rem 1.1rem;
  border-radius: 0.75rem;
  background: var(--color-surface-soft);
}
.result-breakdown span {
  display: grid;
  align-content: center;
  gap: 0.2rem;
  min-height: 3rem;
  padding: 0.3rem 0.85rem;
  border-right: 1px solid var(--color-line);
}
.result-breakdown span:last-child {
  border: 0;
}
.result-breakdown small {
  color: var(--color-copy);
  font-size: 0.72rem;
  font-weight: 550;
  line-height: 1.25;
}
.result-breakdown strong {
  color: var(--color-ink);
  font-size: clamp(0.95rem, 1.6vw, 1.1rem);
  line-height: 1.15;
  overflow-wrap: anywhere;
}
.result-breakdown .projected-value-kpi strong,
.detail-values .projected-value-kpi strong {
  color: var(--color-primary);
  font-size: clamp(1.05rem, 1.8vw, 1.25rem);
}
.result-breakdown.debt-result-breakdown {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.result-breakdown.four-values {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.scenario-name-dialog {
  width: min(28rem, calc(100vw - 2rem));
  padding: 0.5rem;
  border-radius: 1rem;
}
.scenario-name-dialog h2 {
  margin: 0;
}
.scenario-name-dialog p {
  margin: 0.4rem 0 1.25rem;
}
.freedom-info-dialog {
  width: min(31rem, calc(100vw - 2rem));
  border-radius: var(--radius-card);
  color: var(--color-ink);
}
.freedom-info-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
}
.freedom-info-heading h2 {
  flex: 1;
  margin: 0;
}
.freedom-info-copy {
  display: grid;
  gap: 1rem;
  padding-top: 0;
}
.freedom-info-copy div {
  display: grid;
  gap: 0.2rem;
}
.freedom-info-copy p {
  margin: 0;
  color: var(--color-copy);
  font-size: 0.9rem;
  line-height: 1.55;
}

@media (max-width: 1023px) {
  .desktop-projections {
    display: none;
  }
  .strategy-sheet {
    width: 100vw;
    max-height: 90dvh;
    border-radius: 1.35rem 1.35rem 0 0;
  }
  .strategy-sheet-handle {
    display: block;
  }
  .projection-detail-sheet .result-breakdown,
  .projection-detail-sheet .detail-values {
    grid-template-columns: 1fr;
  }
  .projection-detail-sheet .result-breakdown {
    gap: 0;
    padding: 0.35rem 0.85rem;
  }
  .projection-detail-sheet .result-breakdown span,
  .projection-detail-sheet .detail-values span {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: 0;
    padding: 0.75rem 0;
    border-right: 0;
    border-bottom: 1px solid var(--color-line);
  }
  .projection-detail-sheet .result-breakdown span:last-child,
  .projection-detail-sheet .detail-values span:last-child {
    border-bottom: 0;
  }
  .projection-detail-sheet .result-breakdown small,
  .projection-detail-sheet .detail-values small {
    font-size: 0.72rem;
    line-height: 1.25;
  }
  .projection-detail-sheet .result-breakdown strong,
  .projection-detail-sheet .detail-values strong {
    max-width: 60%;
    font-size: 0.95rem;
    text-align: right;
  }
  .projection-detail-sheet .result-breakdown .projected-value-kpi,
  .projection-detail-sheet .detail-values .projected-value-kpi {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: 1rem;
    row-gap: 0.25rem;
  }
  .projection-detail-sheet .projected-value-kpi > strong {
    grid-column: 2;
    grid-row: 1;
    max-width: none;
    white-space: nowrap;
  }
  .projection-detail-sheet .projected-value-kpi > strong + small {
    grid-column: 1 / -1;
    grid-row: 2;
    text-align: right;
  }
}

@media (max-width: bp.$content-compact-max) {
  .strategy-header {
    align-items: flex-end;
    flex-direction: row;
    gap: var(--space-2);
  }
  .strategy-header :deep(.app-page-header__actions) {
    width: auto;
  }
  .strategy-overview {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'available'
      'allocation'
      'outcomes';
    gap: 0.8rem;
  }
  .overview-section-heading {
    align-items: baseline;
  }
  .overview-section-heading p {
    max-width: 15rem;
  }
  .allocation-bar {
    height: var(--financial-chart-bar-height-compact);
    margin-bottom: var(--space-4);
  }
  .allocation-overview-metrics article {
    padding: 0 0.35rem;
  }
  .allocation-overview-metrics small {
    font-size: 0.63rem;
  }
  .allocation-overview-metrics strong {
    font-size: 1rem;
  }
  .overview-outcome {
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'icon copy arrow'
      'icon status arrow';
    gap: 0.2rem 0.65rem;
  }
  .overview-outcome > .mini-icon {
    grid-area: icon;
  }
  .overview-outcome .outcome-copy {
    grid-area: copy;
  }
  .overview-outcome b {
    grid-area: status;
    max-width: none;
    text-align: left;
  }
  .overview-outcome .outcome-arrow {
    grid-area: arrow;
  }
  .strategy-sheet-heading {
    padding: 0.8rem 1rem 0.7rem;
  }
  .strategy-sheet-scroll {
    padding: 0.5rem 1rem 1rem;
  }
  .strategy-sheet-actions {
    padding: 0.8rem 1rem max(1rem, env(safe-area-inset-bottom));
  }
  .detail-sheet-section {
    padding: 0.75rem;
  }
  .detail-section-heading {
    align-items: stretch;
    flex-direction: column;
  }
  .investment-detail-controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-2);
  }
  .investment-detail-controls .detail-horizon-options {
    min-width: 0;
  }
  .net-worth-detail-controls {
    grid-template-columns: 1fr;
  }
  .net-worth-detail-controls .detail-view-switch {
    width: 100%;
  }
  .net-worth-detail-controls .detail-view-switch button {
    flex: 1;
  }
  .large-detail-values {
    grid-template-columns: 1fr;
  }
  .investment-mix-card {
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'icon identity action'
      'icon allocation return'
      'icon amount amount';
    gap: 0.45rem 0.7rem;
  }
  .investment-return-card {
    grid-template-areas: 'icon identity return';
  }
  .cash-return-card {
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas: 'icon identity return';
  }
  .mix-card-icon {
    grid-area: icon;
    align-self: start;
    width: 2.6rem;
    height: 2.6rem;
  }
  .mix-card-identity {
    grid-area: identity;
  }
  .return-metric {
    grid-area: return;
  }
  .mix-card-metric {
    min-height: auto;
    padding-left: 0;
    border-left: 0;
  }
  .allocation-total {
    grid-template-columns: 1fr auto;
  }
  .allocation-total strong:last-child {
    grid-column: 1 / -1;
    text-align: left;
  }
  .projection-heading {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: 'copy horizon';
    align-items: center;
    gap: 0.75rem;
  }
  .projection-heading > div:first-child {
    grid-area: copy;
  }
  .projection-controls {
    display: contents;
  }
  .result-breakdown {
    gap: 0;
    padding: 0.7rem;
  }
  .result-breakdown span {
    min-width: 0;
    min-height: 3.25rem;
    padding: 0.4rem 0.55rem;
  }
  .result-breakdown small {
    font-size: 0.68rem;
    line-height: 1.2;
  }
  .result-breakdown strong {
    font-size: clamp(0.88rem, 3.5vw, 1rem);
  }
}
</style>
