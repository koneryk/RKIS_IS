import { defineConfig } from "cypress";

export default defineConfig({
  projectId: 'ruhnfw',
  allowCypressEnv: false,

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },

  component: {
    devServer: {
      framework: "vue",
      bundler: "vite",
    },
  },
});
