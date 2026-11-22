<template>
  <div class="landing">
    <header class="site-header">
      <div class="wrap header-inner">
        <a class="brand" href="#top" :aria-label="`${BRAND.name} home`"
          ><WorthwardMark /><span>{{ BRAND.wordmark }}<span class="green-dot">.</span></span></a
        >
        <nav class="desktop-nav">
          <a href="#features">Features</a><a href="#how-it-works">How it works</a
          ><a href="#pricing">Pricing</a><a href="#learn">Learn</a>
        </nav>
        <div class="header-actions">
          <a class="login" :href="loginUrl">Log in</a
          ><a class="pill pill-primary" :href="registerUrl"
            >Get started <q-icon name="arrow_forward"
          /></a>
        </div>
        <q-btn
          class="mobile-menu"
          flat
          round
          icon="menu"
          aria-label="Open menu"
          @click="menuOpen = !menuOpen"
        />
      </div>
      <nav v-if="menuOpen" class="mobile-nav" @click="menuOpen = false">
        <a href="#features">Features</a><a href="#how-it-works">How it works</a
        ><a href="#pricing">Pricing</a><a href="#learn">Learn</a
        ><a :href="registerUrl">Get started</a>
      </nav>
    </header>
    <main id="top">
      <section class="hero">
        <GrowthBackdrop />
        <div class="wrap hero-grid">
          <div class="hero-copy">
            <div class="eyebrow">PERSONAL FINANCE, WITH A PLAN</div>
            <h1>Know your worth today.<br /><span>Find your way forward.</span></h1>
            <p>
              Understand your financial picture, plan your future and make better decisions — all in
              one place.
            </p>
            <div class="hero-actions">
              <a class="pill pill-mint" :href="registerUrl"
                >Get started free <q-icon name="arrow_forward" /></a
              ><a class="pill pill-outline" href="#how-it-works"
                >See how it works <q-icon name="play_circle_outline"
              /></a>
            </div>
            <div class="platforms">
              <span><q-icon name="smartphone" /> Android</span
              ><span><q-icon name="phone_iphone" /> iOS</span
              ><span><q-icon name="computer" /> Web</span>
            </div>
          </div>
          <ProductPreview />
        </div>
      </section>
      <section id="features" class="features wrap">
        <article v-for="item in features" :key="item.title" class="feature">
          <div class="feature-icon"><q-icon :name="item.icon" /></div>
          <h2>{{ item.title }}</h2>
          <p>{{ item.description }}</p>
        </article>
      </section>
      <section class="statement wrap">
        <div>
          <div class="eyebrow dark">FROM TODAY TO TOMORROW</div>
          <h2>Turn financial clarity<br />into long-term progress.</h2>
        </div>
        <ul>
          <li v-for="benefit in benefits" :key="benefit">
            <q-icon name="check_circle" /> {{ benefit }}
          </li>
        </ul>
      </section>
      <section id="how-it-works" class="content-section wrap">
        <div class="section-intro">
          <div class="eyebrow dark">HOW IT WORKS</div>
          <h2>From where you are to where you want to be.</h2>
          <p>Three simple steps to build a clearer financial future.</p>
        </div>
        <div class="steps">
          <article v-for="(step, index) in steps" :key="step.title">
            <span class="step-number">0{{ index + 1 }}</span
            ><q-icon :name="step.icon" />
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </article>
        </div>
      </section>
      <section id="learn" class="learn-section">
        <div class="wrap">
          <div class="section-intro">
            <div class="eyebrow dark">LEARN</div>
            <h2>Understand the numbers behind your future.</h2>
            <p>Simple, practical introductions to the ideas that shape your finances.</p>
          </div>
          <div class="learn-grid">
            <article v-for="topic in topics" :key="topic.title">
              <q-icon :name="topic.icon" />
              <h3>{{ topic.title }}</h3>
              <p>{{ topic.description }}</p>
            </article>
          </div>
        </div>
      </section>
      <section id="pricing" class="content-section wrap">
        <div class="section-intro">
          <div class="eyebrow dark">PRICING</div>
          <h2>Start free. Grow when you're ready.</h2>
          <p>Choose the level of financial planning that fits your needs.</p>
        </div>
        <div class="pricing-grid">
          <article class="price-card">
            <h3>Free</h3>
            <p>Build your financial picture with one personal workspace.</p>
            <strong>€0</strong>
            <ul>
              <li>One personal workspace</li>
              <li>Assets, liabilities, income and expenses</li>
              <li>Tracking and progress</li>
            </ul>
            <a class="pill pill-dark" :href="registerUrl">Get started free</a>
          </article>
          <article class="price-card featured">
            <div class="plan-label">MORE POSSIBILITIES</div>
            <h3>Pro</h3>
            <p>Plan ahead with advanced models and multiple workspaces.</p>
            <strong>Coming soon</strong>
            <ul>
              <li>Everything in Free</li>
              <li>Strategy and What If models</li>
              <li>Multiple and shared workspaces</li>
              <li>Advanced planning tools</li>
            </ul>
            <a class="pill pill-dark" :href="registerUrl">Explore {{ BRAND.name }}</a>
          </article>
        </div>
      </section>
      <section class="closing">
        <div class="wrap">
          <h2>Your financial future starts with clarity.</h2>
          <p>Know your worth today. Find your way forward.</p>
          <a class="pill pill-mint" :href="registerUrl"
            >Get started free <q-icon name="arrow_forward"
          /></a>
        </div>
      </section>
    </main>
    <footer class="footer">
      <div class="wrap footer-inner">
        <div class="brand">
          <WorthwardMark /><span>{{ BRAND.wordmark }}<span class="green-dot">.</span></span>
        </div>
        <span>© {{ new Date().getFullYear() }} {{ BRAND.name }}</span>
        <router-link to="/privacy/">Privacy</router-link>
        <router-link to="/delete-account/">Delete account</router-link>
      </div>
    </footer>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import WorthwardMark from '../components/WorthwardMark.vue'
import GrowthBackdrop from '../components/GrowthBackdrop.vue'
import ProductPreview from '../components/ProductPreview.vue'
import { BRAND } from '../config/brand.js'
const appUrl = BRAND.currentAppUrl
const loginUrl = `${appUrl}/#/`
const registerUrl = `${appUrl}/#/?register=1`
const menuOpen = ref(false)
const features = [
  {
    icon: 'account_balance_wallet',
    title: 'Net Worth',
    description: 'See the complete picture of what you own and what you owe.',
  },
  {
    icon: 'trending_up',
    title: 'Financial Progress',
    description: 'Follow your evolution, savings rate and financial milestones.',
  },
  {
    icon: 'track_changes',
    title: 'Planning',
    description: 'Explore scenarios, set goals and build your long-term strategy.',
  },
  {
    icon: 'signpost',
    title: 'Life Decisions',
    description: 'Understand the financial impact of the choices that shape your life.',
  },
]
const benefits = [
  'A complete view of your finances',
  'A plan tailored to your goals',
  'Better decisions for the life you want',
]
const steps = [
  {
    icon: 'account_balance_wallet',
    title: 'Understand today',
    description: 'Add your income, expenses, assets and liabilities.',
  },
  {
    icon: 'tune',
    title: 'Plan your future',
    description: 'Explore projections, goals and alternative scenarios.',
  },
  {
    icon: 'show_chart',
    title: 'Move forward',
    description: 'Track your progress and adjust your plan along the way.',
  },
]
const topics = [
  {
    icon: 'payments',
    title: 'Your money',
    description: 'Income, expenses, cash flow and savings.',
  },
  {
    icon: 'account_balance',
    title: 'Your wealth',
    description: 'Assets, liabilities, net worth and liquidity.',
  },
  {
    icon: 'trending_up',
    title: 'Growing wealth',
    description: 'Inflation, investing and compound interest.',
  },
  {
    icon: 'flag',
    title: 'Financial freedom',
    description: 'Emergency funds, goals and independence.',
  },
]
</script>
