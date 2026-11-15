<template>
  <div class="product-preview" :aria-label="`Illustrative ${BRAND.name} app preview`">
    <div class="desktop-preview">
      <div class="preview-top">
        <span>{{ BRAND.wordmark }}<span class="green-dot">.</span></span
        ><span class="muted">Your progress · 10Y</span>
      </div>
      <div class="desktop-grid">
        <div class="stat">
          <small>Net worth</small><strong>€287,500</strong
          ><span class="positive">+12.4% this year</span>
        </div>
        <div class="stat">
          <small>Savings rate</small><strong>28%</strong><span class="positive">+6 pp</span>
        </div>
      </div>
      <div class="chart-box">
        <div class="chart-head"><b>Projected net worth</b><span>2036 · €487,000</span></div>
        <svg viewBox="0 0 450 180" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop stop-color="#7cde8a" stop-opacity=".5" />
              <stop offset="1" stop-color="#7cde8a" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 154 Q60 145 110 133 T220 94 T335 60 T450 14 L450 180 L0 180Z"
            fill="url(#chartGrad)"
          />
          <path
            d="M0 154 Q60 145 110 133 T220 94 T335 60 T450 14"
            stroke="#168a48"
            stroke-width="4"
            fill="none"
          />
        </svg>
        <div class="chart-years">
          <span>2026</span><span>2030</span><span>2033</span><span>2036</span>
        </div>
      </div>
      <div class="milestone"><span>◎ Emergency fund</span><b class="positive">Achieved ✓</b></div>
      <div class="milestone"><span>↗ Financial independence</span><b>72%</b></div>
    </div>
    <div class="phone-preview">
      <div class="phone-notch"></div>
      <div class="phone-brand">
        <WorthwardMark /> {{ BRAND.wordmark }}<span class="green-dot">.</span>
      </div>
      <small>Net worth</small>
      <div class="phone-number">€247,500</div>
      <div class="positive phone-change">▲ 6.4% YTD</div>
      <svg viewBox="0 0 220 95">
        <path
          d="M0 85 Q30 78 52 66 T99 59 T143 38 T185 29 T220 8"
          fill="none"
          stroke="#24a75a"
          stroke-width="4"
        />
      </svg>
      <div class="phone-row">Assets <b>€310,000</b></div>
      <div class="phone-row">Liabilities <b>−€62,500</b></div>
      <div class="phone-row">Annual cash flow <b class="positive">+€18,400</b></div>
      <div class="phone-tabs">
        <span>⌂</span><span>▤</span><span class="plus">+</span><span>◎</span><span>⋯</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import WorthwardMark from './WorthwardMark.vue'
import { BRAND } from '../config/brand.js'
</script>
