<template>
  <div class="landing">
    <header class="site-header">
      <div class="wrap header-inner">
        <router-link class="brand" to="/">
          <WorthwardMark />
          <span>{{ BRAND.wordmark }}<span class="green-dot">.</span></span>
        </router-link>
        <nav class="desktop-nav">
          <router-link to="/">Home</router-link>
          <router-link to="/privacy/">Privacy</router-link>
          <router-link to="/delete-account/">Delete account</router-link>
        </nav>
        <a class="pill pill-primary" :href="appUrl">Open Worthward</a>
      </div>
    </header>

    <main class="wrap legal-page">
      <div class="eyebrow dark">WORTHWARD LEGAL</div>
      <h1>{{ page.title }}</h1>
      <p class="legal-updated">Last updated: 21 November 2026</p>
      <section v-for="section in page.sections" :key="section.title">
        <h2>{{ section.title }}</h2>
        <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
      </section>
      <a v-if="page.action" class="pill pill-primary legal-action" :href="page.action.href">
        {{ page.action.label }}
      </a>
    </main>

    <footer class="footer">
      <div class="wrap footer-inner">
        <router-link class="brand" to="/"
          ><WorthwardMark /><span>{{ BRAND.wordmark }}.</span></router-link
        >
        <router-link to="/privacy/">Privacy</router-link>
        <router-link to="/delete-account/">Delete account</router-link>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import WorthwardMark from '../components/WorthwardMark.vue'
import { BRAND } from '../config/brand.js'

const props = defineProps({ pageType: { type: String, required: true } })
const appUrl = BRAND.currentAppUrl
const pages = {
  privacy: {
    title: 'Privacy policy',
    sections: [
      {
        title: 'Data Worthward processes',
        paragraphs: [
          'Worthward stores the account information needed to sign you in, the financial information you choose to enter, workspace membership, planning preferences, and subscription status.',
          'If you connect a public Google Sheets portfolio, Worthward reads the sheet URL and the investment data required for that feature. Do not connect a sheet that contains information you do not want processed.',
        ],
      },
      {
        title: 'Why it is used',
        paragraphs: [
          'This data is used to provide financial workspaces, calculations, projections, collaboration, account security, and Pro access. Worthward does not sell your personal or financial data.',
        ],
      },
      {
        title: 'Services and retention',
        paragraphs: [
          'Worthward uses Firebase services for authentication, application storage, hosting, and server functions. Google Play processes Android subscription purchases under Google’s own terms.',
          'Data is retained while your account is active and is removed when account deletion completes, except where a limited record must be retained for security, fraud prevention, or a legal obligation.',
        ],
      },
      {
        title: 'Your choices',
        paragraphs: [
          'You can review and change your financial data in the app. You can permanently delete your account from Account and privacy. Deleting Worthward does not cancel an active Google Play subscription; cancel it separately in Google Play.',
        ],
      },
    ],
  },
  deletion: {
    title: 'Delete your Worthward account',
    sections: [
      {
        title: 'How to request deletion',
        paragraphs: [
          'Sign in to Worthward, open Account and privacy from the navigation menu, and select Delete my account. The same flow is available from the button below.',
          'If you own a shared workspace, delete that workspace first. This prevents another person’s shared financial data from being removed without warning.',
        ],
      },
      {
        title: 'What is deleted',
        paragraphs: [
          'Deletion removes your sign-in account, private account records, personal workspaces and their financial data, membership in other workspaces, and Worthward subscription records. The action cannot be undone.',
          'An active Google Play subscription must be cancelled separately through Google Play.',
        ],
      },
    ],
    action: { label: 'Open account deletion', href: `${BRAND.currentAppUrl}/#/home/account` },
  },
}
const page = computed(() => pages[props.pageType] || pages.privacy)

useHead({
  title: computed(() => `${page.value.title} | ${BRAND.name}`),
  meta: [{ name: 'description', content: computed(() => page.value.sections[0].paragraphs[0]) }],
})
</script>

<style scoped>
.legal-page {
  max-width: 860px;
  padding-top: 80px;
  padding-bottom: 100px;
}
.legal-page h1 {
  font-size: clamp(2.4rem, 5vw, 4rem);
  line-height: 1.1;
  margin: 20px 0 8px;
  color: #063d30;
}
.legal-updated {
  color: #687a71;
  margin-bottom: 48px;
}
.legal-page section {
  margin-top: 34px;
}
.legal-page h2 {
  color: #063d30;
  font-size: 1.45rem;
}
.legal-page p {
  color: #52645c;
  line-height: 1.75;
}
.legal-action {
  margin-top: 36px;
}
</style>
