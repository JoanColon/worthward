export const learnTopics = {
  netWorth: topic('netWorth'),
  costOfLife: topic('costOfLife'),
  savingsRate: topic('savingsRate'),
  assetValuation: topic('assetValuation'),
  liquidity: topic('liquidity'),
  depreciation: topic('depreciation'),
  debt: topic('debt'),
  interestRates: topic('interestRates'),
  loanAmortization: topic('loanAmortization'),
  frenchAmortization: topic('frenchAmortization'),
  principalVsInterest: topic('principalVsInterest'),
  earlyRepayment: topic('earlyRepayment'),
  disposableIncome: topic('disposableIncome'),
  incomeStability: topic('incomeStability'),
  fixedVsVariableExpenses: topic('fixedVsVariableExpenses'),
  discretionarySpending: topic('discretionarySpending'),
  budgetVsActual: topic('budgetVsActual'),
  estimatedVsConfirmed: topic('estimatedVsConfirmed'),
  payYourselfFirst: topic('payYourselfFirst'),
  emergencyFund: topic('emergencyFund'),
  savingsStrategy: topic('savingsStrategy'),
  compoundInterest: topic('compoundInterest'),
  inflation: topic('inflation'),
  expectedReturns: topic('expectedReturns'),
  financialIndependence: topic('financialIndependence'),
  netWorthGrowth: topic('netWorthGrowth'),
  milestones: topic('milestones'),
  riskAndVolatility: topic('riskAndVolatility'),
  diversification: topic('diversification'),
  dividendYield: topic('dividendYield'),
  totalReturn: topic('totalReturn'),
  propertyAppreciation: topic('propertyAppreciation'),
  realEstateReturns: topic('realEstateReturns'),
}

export const learnContexts = {
  'workspace-dashboard': context('dashboard', ['netWorth', 'costOfLife', 'savingsRate']),
  assets: context('assets', ['assetValuation', 'liquidity', 'depreciation']),
  liabilities: context('liabilities', ['debt', 'interestRates', 'loanAmortization']),
  'mortgage-detail': context('mortgage', [
    'frenchAmortization',
    'principalVsInterest',
    'earlyRepayment',
  ]),
  income: context('income', ['disposableIncome', 'incomeStability']),
  expenses: context('expenses', ['fixedVsVariableExpenses', 'discretionarySpending']),
  'expense-tracker': context('expenseTracker', ['budgetVsActual', 'estimatedVsConfirmed']),
  plan: context('plan', ['payYourselfFirst', 'emergencyFund', 'savingsStrategy']),
  'what-if-strategy': context('strategy', [
    'compoundInterest',
    'inflation',
    'expectedReturns',
    'financialIndependence',
  ]),
  progress: context('progress', ['netWorthGrowth', 'financialIndependence', 'milestones']),
  'investment-portfolio': context('investments', [
    'riskAndVolatility',
    'diversification',
    'dividendYield',
    'totalReturn',
  ]),
  'real-estate-model': context('realEstate', [
    'propertyAppreciation',
    'liquidity',
    'realEstateReturns',
  ]),
}

export function resolveLearnContext(route) {
  const routeName = typeof route?.name === 'string' ? route.name : ''
  const registeredContext = learnContexts[routeName]
  if (!registeredContext) return null

  return {
    id: routeName,
    ...registeredContext,
    topics: registeredContext.topicIds.map((topicId) => ({
      id: topicId,
      ...learnTopics[topicId],
    })),
  }
}

function topic(id) {
  return {
    titleKey: `learn.topics.${id}.title`,
    descriptionKey: `learn.topics.${id}.description`,
    bodyKey: `learn.topics.${id}.body`,
  }
}

function context(id, topicIds) {
  return {
    titleKey: `learn.contexts.${id}.title`,
    descriptionKey: `learn.contexts.${id}.description`,
    topicIds,
  }
}
