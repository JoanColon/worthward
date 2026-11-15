<template>
  <div class="landing">
    <header class="site-header">
      <div class="wrap header-inner">
        <router-link class="brand" to="/"
          ><WorthwardMark /><span
            >{{ BRAND.wordmark }}<span class="green-dot">.</span></span
          ></router-link
        >
        <nav class="desktop-nav">
          <router-link to="/">Home</router-link><router-link to="/how-to/">How to</router-link
          ><router-link to="/learn/">Learn</router-link
          ><router-link to="/pricing/">Pricing</router-link>
        </nav>
        <a class="pill pill-primary" :href="appUrl + '/register'">Get started</a>
      </div>
    </header>
    <main
      class="wrap content-section"
      style="min-height: 65vh; padding-top: 90px; padding-bottom: 100px"
    >
      <div class="eyebrow dark">WORTHWARD GUIDE</div>
      <h1 style="font-size: clamp(2.4rem, 5vw, 4rem); line-height: 1.12; margin: 20px 0">
        {{ content.title }}
      </h1>
      <p style="font-size: 1.15rem; max-width: 680px; color: #52645c">{{ content.description }}</p>
      <div style="display: grid; gap: 16px; max-width: 760px; margin-top: 38px">
        <router-link
          v-for="item in content.items"
          :key="item.to"
          :to="item.to"
          style="
            display: block;
            padding: 22px;
            border: 1px solid #dce8e0;
            border-radius: 16px;
            text-decoration: none;
            color: #063d30;
            font-weight: 600;
          "
          >{{ item.title }} →</router-link
        >
      </div>
    </main>
    <footer class="footer">
      <div class="wrap footer-inner">
        <router-link class="brand" to="/"
          ><WorthwardMark /><span>{{ BRAND.wordmark }}.</span></router-link
        ><span>© {{ BRAND.name }}</span>
      </div>
    </footer>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import WorthwardMark from '../components/WorthwardMark.vue'
import { BRAND } from '../config/brand.js'
const props = defineProps({ section: { type: String, required: true } })
const appUrl = BRAND.currentAppUrl
const pages = {
  'how-to': {
    title: `How to use ${BRAND.name}`,
    description: 'Practical guides to understand your finances and plan ahead.',
    items: [{ title: 'Getting started', to: '/how-to/getting-started/' }],
  },
  learn: {
    title: 'Learn the basics',
    description: 'Clear explanations of the financial concepts that shape your future.',
    items: [{ title: 'What is net worth?', to: '/learn/net-worth/' }],
  },
  pricing: {
    title: 'Simple pricing',
    description:
      'Start with a free personal workspace. Advanced planning and shared workspaces are part of Pro.',
    items: [{ title: 'Explore the app', to: '/' }],
  },
  'getting-started': {
    title: 'Getting started',
    description:
      'Start with your assets, liabilities, income and expenses to build a clear picture of your finances.',
    items: [{ title: 'All tutorials', to: '/how-to/' }],
  },
  'net-worth': {
    title: 'What is net worth?',
    description:
      'Net worth is the value of your assets minus your liabilities. It helps you see your financial position beyond monthly spending.',
    items: [{ title: 'All concepts', to: '/learn/' }],
  },
}
const content = computed(() => pages[props.section] || pages.learn)
useHead({
  title: computed(() => `${content.value.title} | ${BRAND.name}`),
  meta: [{ name: 'description', content: computed(() => content.value.description) }],
})
</script>
