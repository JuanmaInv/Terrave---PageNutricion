module.exports = {
  root: true,
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname
  },
  env: {
    node: true,
    es2021: true
  },
  extends: ["eslint:recommended", "prettier"],
  rules: {
    "no-console": "off"
  }
};
