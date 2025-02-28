/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */

import path from 'path';

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(' --file ')}`;

export default {
  '*.{cjs,mjs,js,jsx,ts,tsx}': [buildEslintCommand, 'npm run format'],
  '*.{css,scss,sass,md}': ['npm run format'],
};

// const path = require('path');

// const buildEslintCommand = (filenames) =>
//   `next lint --fix --file ${filenames
//     .map((f) => path.relative(process.cwd(), f))
//     .join(' --file ')}`;

// module.exports = {
//   '*.{cjs,mjs,js,jsx,ts,tsx}': [buildEslintCommand, 'npm run format'],
//   '*.{css,scss,sass,md}': ['npm run format'],
// };
