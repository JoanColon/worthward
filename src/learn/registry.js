const assetCategoryContexts = { cash: 'cash', investment: 'investments' }
const liabilityCategoryContexts = { mortgage: 'mortgages' }

export const learnTopics = {
  frenchAmortization: topic('frenchAmortization'),
  principalVsInterest: topic('principalVsInterest'),
  earlyRepayment: topic('earlyRepayment'),
  inflationPurchasingPower: topic('inflationPurchasingPower'),
  understandingBondsStocks: topic('understandingBondsStocks'),
}

export const learnContexts = {
  cash: context('cash', ['inflationPurchasingPower']),
  'cash-model': context('cash', ['inflationPurchasingPower']),
  investments: context('investments', ['understandingBondsStocks']),
  mortgages: context('mortgage', ['frenchAmortization', 'principalVsInterest', 'earlyRepayment']),
  'mortgage-detail': context('mortgage', [
    'frenchAmortization',
    'principalVsInterest',
    'earlyRepayment',
  ]),
}

export function resolveLearnContext(route) {
  const routeName = typeof route?.name === 'string' ? route.name : ''
  const category = String(route?.params?.category || '')
  const contextId = resolveContextId(routeName, category)
  const registeredContext = learnContexts[contextId]
  if (!registeredContext) return null

  return {
    id: contextId,
    ...registeredContext,
    topics: registeredContext.topicIds.map((topicId) => ({
      id: topicId,
      ...learnTopics[topicId],
    })),
  }
}

function resolveContextId(routeName, category) {
  if (routeName === 'asset-category') return assetCategoryContexts[category] || routeName
  if (routeName === 'liability-category') return liabilityCategoryContexts[category] || routeName
  return routeName
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
