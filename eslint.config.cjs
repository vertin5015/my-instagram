import eslintConfigNext from "eslint-config-next";

export default [
  ...eslintConfigNext(),

  {
    rules: {
      // 让 Prettier 接管格式
      "react/jsx-curly-brace-presence": "off",
      "react/react-in-jsx-scope": "off",

      // 不强制 prop-types（你用 TS）
      "react/prop-types": "off",

      // Next.js 已处理
      "@next/next/no-img-element": "off",
    },
  },
];
