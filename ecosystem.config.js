module.exports = {
  apps: [
    {
      name: "YELLOPAY",
      script: "app.js",
      instances: 1,
      watch: ".",
      ignore_watch: ["node_modules", "public"],
    },
  ],
  deploy: {
    production: {
      user: "root",
      host: "180.149.196.70",
      ref: "origin/main",
      repo: "https://github.com/Yellowboxtechnologie/API-TAXE.git",
      path: "/root/API/API-TAXE",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
};
