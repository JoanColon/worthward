import { ViteSSG } from "vite-ssg";
import { useHead, createHead } from "@unhead/vue";
import Quasar from "quasar/src/vue-plugin.js";
import { resolveComponent, useSSRContext, mergeProps, ref, unref, computed, withCtx, createVNode, createTextVNode, toDisplayString } from "vue";
import { ssrRenderComponent, ssrRenderAttrs, ssrRenderAttr, ssrRenderList, ssrInterpolate } from "vue/server-renderer";
import QIcon from "quasar/src/components/icon/QIcon.js";
import QBtn from "quasar/src/components/btn/QBtn.js";
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$5 = {};
function _sfc_ssrRender$2(_ctx, _push, _parent, _attrs) {
  const _component_router_view = resolveComponent("router-view");
  _push(ssrRenderComponent(_component_router_view, _attrs, null, _parent));
}
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/App.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const App = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["ssrRender", _sfc_ssrRender$2]]);
const _sfc_main$4 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    viewBox: "0 0 58 58",
    role: "img",
    "aria-label": "Worthward logo",
    xmlns: "http://www.w3.org/2000/svg"
  }, _attrs))}><path d="M5 34 L16 48 L28 27 L38 42 L52 9" fill="none" stroke="#65cc76" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"></path><path d="M40 9 H52 V21" fill="none" stroke="#d0ffbf" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"></path></svg>`);
}
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/WorthwardMark.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const WorthwardMark = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["ssrRender", _sfc_ssrRender$1]]);
const _sfc_main$3 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    class: "growth-backdrop",
    viewBox: "0 0 1500 640",
    preserveAspectRatio: "none",
    "aria-hidden": "true"
  }, _attrs))}><defs><linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7bf28c" stop-opacity=".48"></stop><stop offset="1" stop-color="#7bf28c" stop-opacity="0"></stop></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="9"></feGaussianBlur></filter></defs><path d="M0 590 C160 470 250 550 385 465 S540 510 650 370 S820 325 920 245 S1080 240 1190 145 S1380 160 1500 55 L1500 640 L0 640Z" fill="url(#curveFill)"></path><path d="M0 590 C160 470 250 550 385 465 S540 510 650 370 S820 325 920 245 S1080 240 1190 145 S1380 160 1500 55" fill="none" stroke="#b8ffbd" stroke-width="17" opacity=".32" filter="url(#glow)"></path><path d="M0 590 C160 470 250 550 385 465 S540 510 650 370 S820 325 920 245 S1080 240 1190 145 S1380 160 1500 55" fill="none" stroke="#b8ffbd" stroke-width="3"></path><circle cx="385" cy="465" r="8" fill="#d7ffcc"></circle><circle cx="650" cy="370" r="8" fill="#d7ffcc"></circle><circle cx="1190" cy="145" r="8" fill="#d7ffcc"></circle></svg>`);
}
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/GrowthBackdrop.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const GrowthBackdrop = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["ssrRender", _sfc_ssrRender]]);
const _sfc_main$2 = {
  __name: "ProductPreview",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "product-preview",
        "aria-label": "Illustrative Worthward app preview"
      }, _attrs))}><div class="desktop-preview"><div class="preview-top"><span>worthward<span class="green-dot">.</span></span><span class="muted">Your progress · 10Y</span></div><div class="desktop-grid"><div class="stat"><small>Net worth</small><strong>€287,500</strong><span class="positive">+12.4% this year</span></div><div class="stat"><small>Savings rate</small><strong>28%</strong><span class="positive">+6 pp</span></div></div><div class="chart-box"><div class="chart-head"><b>Projected net worth</b><span>2036 · €487,000</span></div><svg viewBox="0 0 450 180" preserveAspectRatio="none"><defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#7cde8a" stop-opacity=".5"></stop><stop offset="1" stop-color="#7cde8a" stop-opacity="0"></stop></linearGradient></defs><path d="M0 154 Q60 145 110 133 T220 94 T335 60 T450 14 L450 180 L0 180Z" fill="url(#chartGrad)"></path><path d="M0 154 Q60 145 110 133 T220 94 T335 60 T450 14" stroke="#168a48" stroke-width="4" fill="none"></path></svg><div class="chart-years"><span>2026</span><span>2030</span><span>2033</span><span>2036</span></div></div><div class="milestone"><span>◎ Emergency fund</span><b class="positive">Achieved ✓</b></div><div class="milestone"><span>↗ Financial independence</span><b>72%</b></div></div><div class="phone-preview"><div class="phone-notch"></div><div class="phone-brand">`);
      _push(ssrRenderComponent(WorthwardMark, null, null, _parent));
      _push(` worthward<span class="green-dot">.</span></div><small>Net worth</small><div class="phone-number">€247,500</div><div class="positive phone-change">▲ 6.4% YTD</div><svg viewBox="0 0 220 95"><path d="M0 85 Q30 78 52 66 T99 59 T143 38 T185 29 T220 8" fill="none" stroke="#24a75a" stroke-width="4"></path></svg><div class="phone-row">Assets <b>€310,000</b></div><div class="phone-row">Liabilities <b>−€62,500</b></div><div class="phone-row">Annual cash flow <b class="positive">+€18,400</b></div><div class="phone-tabs"><span>⌂</span><span>▤</span><span class="plus">+</span><span>◎</span><span>⋯</span></div></div></div>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/ProductPreview.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {
  __name: "LandingPage",
  __ssrInlineRender: true,
  setup(__props) {
    const appUrl = "https://cost-of-life-f23b2.web.app";
    const menuOpen = ref(false);
    const features = [
      { icon: "account_balance_wallet", title: "Net Worth", description: "See the complete picture of what you own and what you owe." },
      { icon: "trending_up", title: "Financial Progress", description: "Follow your evolution, savings rate and financial milestones." },
      { icon: "track_changes", title: "Planning", description: "Explore scenarios, set goals and build your long-term strategy." },
      { icon: "signpost", title: "Life Decisions", description: "Understand the financial impact of the choices that shape your life." }
    ];
    const benefits = ["A complete view of your finances", "A plan tailored to your goals", "Better decisions for the life you want"];
    const steps = [
      { icon: "account_balance_wallet", title: "Understand today", description: "Add your income, expenses, assets and liabilities." },
      { icon: "tune", title: "Plan your future", description: "Explore projections, goals and alternative scenarios." },
      { icon: "show_chart", title: "Move forward", description: "Track your progress and adjust your plan along the way." }
    ];
    const topics = [
      { icon: "payments", title: "Your money", description: "Income, expenses, cash flow and savings." },
      { icon: "account_balance", title: "Your wealth", description: "Assets, liabilities, net worth and liquidity." },
      { icon: "trending_up", title: "Growing wealth", description: "Inflation, investing and compound interest." },
      { icon: "flag", title: "Financial freedom", description: "Emergency funds, goals and independence." }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "landing" }, _attrs))}><header class="site-header"><div class="wrap header-inner"><a class="brand" href="#top" aria-label="Worthward home">`);
      _push(ssrRenderComponent(WorthwardMark, null, null, _parent));
      _push(`<span>worthward<span class="green-dot">.</span></span></a><nav class="desktop-nav"><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a><a href="#learn">Learn</a></nav><div class="header-actions"><a class="login"${ssrRenderAttr("href", unref(appUrl) + "/login")}>Log in</a><a class="pill pill-primary"${ssrRenderAttr("href", unref(appUrl) + "/register")}>Get started `);
      _push(ssrRenderComponent(QIcon, { name: "arrow_forward" }, null, _parent));
      _push(`</a></div>`);
      _push(ssrRenderComponent(QBtn, {
        class: "mobile-menu",
        flat: "",
        round: "",
        icon: "menu",
        "aria-label": "Open menu",
        onClick: ($event) => menuOpen.value = !menuOpen.value
      }, null, _parent));
      _push(`</div>`);
      if (menuOpen.value) {
        _push(`<nav class="mobile-nav"><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a><a href="#learn">Learn</a><a${ssrRenderAttr("href", unref(appUrl) + "/register")}>Get started</a></nav>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</header><main id="top"><section class="hero">`);
      _push(ssrRenderComponent(GrowthBackdrop, null, null, _parent));
      _push(`<div class="wrap hero-grid"><div class="hero-copy"><div class="eyebrow">PERSONAL FINANCE, WITH A PLAN</div><h1>Know your worth today.<br><span>Find your way forward.</span></h1><p>Understand your financial picture, plan your future and make better decisions — all in one place.</p><div class="hero-actions"><a class="pill pill-mint"${ssrRenderAttr("href", unref(appUrl) + "/register")}>Get started free `);
      _push(ssrRenderComponent(QIcon, { name: "arrow_forward" }, null, _parent));
      _push(`</a><a class="pill pill-outline" href="#how-it-works">See how it works `);
      _push(ssrRenderComponent(QIcon, { name: "play_circle_outline" }, null, _parent));
      _push(`</a></div><div class="platforms"><span>`);
      _push(ssrRenderComponent(QIcon, { name: "smartphone" }, null, _parent));
      _push(` Android</span><span>`);
      _push(ssrRenderComponent(QIcon, { name: "phone_iphone" }, null, _parent));
      _push(` iOS</span><span>`);
      _push(ssrRenderComponent(QIcon, { name: "computer" }, null, _parent));
      _push(` Web</span></div></div>`);
      _push(ssrRenderComponent(_sfc_main$2, null, null, _parent));
      _push(`</div></section><section id="features" class="features wrap"><!--[-->`);
      ssrRenderList(features, (item) => {
        _push(`<article class="feature"><div class="feature-icon">`);
        _push(ssrRenderComponent(QIcon, {
          name: item.icon
        }, null, _parent));
        _push(`</div><h2>${ssrInterpolate(item.title)}</h2><p>${ssrInterpolate(item.description)}</p></article>`);
      });
      _push(`<!--]--></section><section class="statement wrap"><div><div class="eyebrow dark">FROM TODAY TO TOMORROW</div><h2>Turn financial clarity<br>into long-term progress.</h2></div><ul><!--[-->`);
      ssrRenderList(benefits, (benefit) => {
        _push(`<li>`);
        _push(ssrRenderComponent(QIcon, { name: "check_circle" }, null, _parent));
        _push(` ${ssrInterpolate(benefit)}</li>`);
      });
      _push(`<!--]--></ul></section><section id="how-it-works" class="content-section wrap"><div class="section-intro"><div class="eyebrow dark">HOW IT WORKS</div><h2>From where you are to where you want to be.</h2><p>Three simple steps to build a clearer financial future.</p></div><div class="steps"><!--[-->`);
      ssrRenderList(steps, (step, index) => {
        _push(`<article><span class="step-number">0${ssrInterpolate(index + 1)}</span>`);
        _push(ssrRenderComponent(QIcon, {
          name: step.icon
        }, null, _parent));
        _push(`<h3>${ssrInterpolate(step.title)}</h3><p>${ssrInterpolate(step.description)}</p></article>`);
      });
      _push(`<!--]--></div></section><section id="learn" class="learn-section"><div class="wrap"><div class="section-intro"><div class="eyebrow dark">LEARN</div><h2>Understand the numbers behind your future.</h2><p>Simple, practical introductions to the ideas that shape your finances.</p></div><div class="learn-grid"><!--[-->`);
      ssrRenderList(topics, (topic) => {
        _push(`<article>`);
        _push(ssrRenderComponent(QIcon, {
          name: topic.icon
        }, null, _parent));
        _push(`<h3>${ssrInterpolate(topic.title)}</h3><p>${ssrInterpolate(topic.description)}</p></article>`);
      });
      _push(`<!--]--></div></div></section><section id="pricing" class="content-section wrap"><div class="section-intro"><div class="eyebrow dark">PRICING</div><h2>Start free. Grow when you&#39;re ready.</h2><p>Choose the level of financial planning that fits your needs.</p></div><div class="pricing-grid"><article class="price-card"><h3>Free</h3><p>Build your financial picture with one personal workspace.</p><strong>€0</strong><ul><li>One personal workspace</li><li>Assets, liabilities, income and expenses</li><li>Tracking and progress</li></ul><a class="pill pill-dark"${ssrRenderAttr("href", unref(appUrl) + "/register")}>Get started free</a></article><article class="price-card featured"><div class="plan-label">MORE POSSIBILITIES</div><h3>Pro</h3><p>Plan ahead with advanced models and multiple workspaces.</p><strong>Coming soon</strong><ul><li>Everything in Free</li><li>Strategy and What If models</li><li>Multiple and shared workspaces</li><li>Advanced planning tools</li></ul><a class="pill pill-dark"${ssrRenderAttr("href", unref(appUrl) + "/register")}>Explore Worthward</a></article></div></section><section class="closing"><div class="wrap"><h2>Your financial future starts with clarity.</h2><p>Know your worth today. Find your way forward.</p><a class="pill pill-mint"${ssrRenderAttr("href", unref(appUrl) + "/register")}>Get started free `);
      _push(ssrRenderComponent(QIcon, { name: "arrow_forward" }, null, _parent));
      _push(`</a></div></section></main><footer class="footer"><div class="wrap footer-inner"><div class="brand">`);
      _push(ssrRenderComponent(WorthwardMark, null, null, _parent));
      _push(`<span>worthward<span class="green-dot">.</span></span></div><span>© ${ssrInterpolate((/* @__PURE__ */ new Date()).getFullYear())} Worthward</span><a href="mailto:hello@example.com" title="Replace with your support address">Contact</a></div></footer></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/LandingPage.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "ContentPage",
  __ssrInlineRender: true,
  props: { section: { type: String, required: true } },
  setup(__props) {
    const props = __props;
    const appUrl = "https://cost-of-life-f23b2.web.app";
    const pages = {
      "how-to": { title: "How to use Worthward", description: "Practical guides to understand your finances and plan ahead.", items: [{ title: "Getting started", to: "/how-to/getting-started/" }] },
      "learn": { title: "Learn the basics", description: "Clear explanations of the financial concepts that shape your future.", items: [{ title: "What is net worth?", to: "/learn/net-worth/" }] },
      "pricing": { title: "Simple pricing", description: "Start with a free personal workspace. Advanced planning and shared workspaces are part of Pro.", items: [{ title: "Explore the app", to: "/" }] },
      "getting-started": { title: "Getting started", description: "Start with your assets, liabilities, income and expenses to build a clear picture of your finances.", items: [{ title: "All tutorials", to: "/how-to/" }] },
      "net-worth": { title: "What is net worth?", description: "Net worth is the value of your assets minus your liabilities. It helps you see your financial position beyond monthly spending.", items: [{ title: "All concepts", to: "/learn/" }] }
    };
    const content = computed(() => pages[props.section] || pages.learn);
    useHead({ title: computed(() => `${content.value.title} | Worthward`), meta: [{ name: "description", content: computed(() => content.value.description) }] });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_router_link = resolveComponent("router-link");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "landing" }, _attrs))}><header class="site-header"><div class="wrap header-inner">`);
      _push(ssrRenderComponent(_component_router_link, {
        class: "brand",
        to: "/"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(WorthwardMark, null, null, _parent2, _scopeId));
            _push2(`<span${_scopeId}>worthward<span class="green-dot"${_scopeId}>.</span></span>`);
          } else {
            return [
              createVNode(WorthwardMark),
              createVNode("span", null, [
                createTextVNode("worthward"),
                createVNode("span", { class: "green-dot" }, ".")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<nav class="desktop-nav">`);
      _push(ssrRenderComponent(_component_router_link, { to: "/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Home`);
          } else {
            return [
              createTextVNode("Home")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_router_link, { to: "/how-to/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`How to`);
          } else {
            return [
              createTextVNode("How to")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_router_link, { to: "/learn/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Learn`);
          } else {
            return [
              createTextVNode("Learn")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_router_link, { to: "/pricing/" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Pricing`);
          } else {
            return [
              createTextVNode("Pricing")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</nav><a class="pill pill-primary"${ssrRenderAttr("href", unref(appUrl) + "/register")}>Get started</a></div></header><main class="wrap content-section" style="min-height:65vh;padding-top:90px;padding-bottom:100px;"><div class="eyebrow dark">WORTHWARD GUIDE</div><h1 style="font-size:clamp(2.4rem,5vw,4rem);line-height:1.12;margin:20px 0;">${ssrInterpolate(content.value.title)}</h1><p style="font-size:1.15rem;max-width:680px;color:#52645c;">${ssrInterpolate(content.value.description)}</p><div style="display:grid;gap:16px;max-width:760px;margin-top:38px;"><!--[-->`);
      ssrRenderList(content.value.items, (item) => {
        _push(ssrRenderComponent(_component_router_link, {
          key: item.to,
          to: item.to,
          style: { "display": "block", "padding": "22px", "border": "1px solid #dce8e0", "border-radius": "16px", "text-decoration": "none", "color": "#063d30", "font-weight": "600" }
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(item.title)} →`);
            } else {
              return [
                createTextVNode(toDisplayString(item.title) + " →", 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></div></main><footer class="footer"><div class="wrap footer-inner">`);
      _push(ssrRenderComponent(_component_router_link, {
        class: "brand",
        to: "/"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(WorthwardMark, null, null, _parent2, _scopeId));
            _push2(`<span${_scopeId}>worthward.</span>`);
          } else {
            return [
              createVNode(WorthwardMark),
              createVNode("span", null, "worthward.")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<span>© Worthward</span></div></footer></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/ContentPage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const routes = [
  { path: "/", component: _sfc_main$1 },
  { path: "/how-to/", component: _sfc_main, props: { section: "how-to" } },
  { path: "/learn/", component: _sfc_main, props: { section: "learn" } },
  { path: "/pricing/", component: _sfc_main, props: { section: "pricing" } },
  { path: "/how-to/getting-started/", component: _sfc_main, props: { section: "getting-started" } },
  { path: "/learn/net-worth/", component: _sfc_main, props: { section: "net-worth" } }
];
const createApp = ViteSSG(App, { routes, base: "/" }, ({ app }) => {
  app.use(createHead());
  app.use(Quasar, { plugins: {} });
});
export {
  createApp
};
