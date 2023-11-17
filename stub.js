/**
 * Stub file for `@stylistic/eslint-plugin`
 * Importing this file will directly load from source,
 * so no build process is needed, and it always stays up-to-date.
 */
import { fileURLToPath } from 'node:url'
import JITI from 'jiti'

const jiti = JITI(import.meta.url, {
  alias: {
    '@stylistic/eslint-plugin': fileURLToPath(new URL('./packages/eslint-plugin/src/index.ts', import.meta.url)),
    '@stylistic/eslint-plugin-js': fileURLToPath(new URL('./packages/eslint-plugin-js/src/index.js', import.meta.url)),
    '@stylistic/eslint-plugin-jsx': fileURLToPath(new URL('./packages/eslint-plugin-jsx/src/index.js', import.meta.url)),
    '@stylistic/eslint-plugin-ts': fileURLToPath(new URL('./packages/eslint-plugin-ts/src/index.ts', import.meta.url)),
    '@eslint-stylistic/metadata': fileURLToPath(new URL('./packages/metadata/src/index.ts', import.meta.url)),
  },
})

export default jiti('@stylistic/eslint-plugin').default
