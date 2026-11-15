<template>
  <svg class="growth-backdrop" viewBox="0 0 1500 640" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7bf28c" stop-opacity=".48"/><stop offset="1" stop-color="#7bf28c" stop-opacity="0"/></linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="9" /></filter>
    </defs>
    <path d="M0 590 C160 470 250 550 385 465 S540 510 650 370 S820 325 920 245 S1080 240 1190 145 S1380 160 1500 55 L1500 640 L0 640Z" fill="url(#curveFill)"/>
    <path d="M0 590 C160 470 250 550 385 465 S540 510 650 370 S820 325 920 245 S1080 240 1190 145 S1380 160 1500 55" fill="none" stroke="#b8ffbd" stroke-width="17" opacity=".32" filter="url(#glow)"/>
    <path d="M0 590 C160 470 250 550 385 465 S540 510 650 370 S820 325 920 245 S1080 240 1190 145 S1380 160 1500 55" fill="none" stroke="#b8ffbd" stroke-width="3"/>
    <circle cx="385" cy="465" r="8" fill="#d7ffcc"/><circle cx="650" cy="370" r="8" fill="#d7ffcc"/><circle cx="1190" cy="145" r="8" fill="#d7ffcc"/>
  </svg>
</template>
