import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar } from '@quasar/vite-plugin'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    vue(),
    quasar({
      sassVariables: false,
      runMode: isSsrBuild ? 'ssr-server' : 'web-client',
    }),
  ],
  build: { outDir: 'dist' },
  ssr: { noExternal: ['quasar'] },
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
  },
}))
