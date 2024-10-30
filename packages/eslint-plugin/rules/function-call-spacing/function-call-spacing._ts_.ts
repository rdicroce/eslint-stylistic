// TODO: Stage 2: Doesn't inherit js version
import type { Tree } from '#types'
import type { MessageIds, RuleOptions } from './types'
import { createRule } from '#utils/create-rule'

import {
  isNotOptionalChainPunctuator,
  isOpeningParenToken,
  isOptionalCallExpression,
  LINEBREAK_MATCHER,
} from '@typescript-eslint/utils/ast-utils'

export default createRule<RuleOptions, MessageIds>({
  name: 'function-call-spacing',
  package: 'ts',
  meta: {
    type: 'layout',
    docs: {
      description:
        'Require or disallow spacing between function identifiers and their invocations',
    },
    fixable: 'whitespace',
    schema: {
      anyOf: [
        {
          type: 'array',
          items: [
            {
              type: 'string',
              enum: ['never'],
            },
          ],
          minItems: 0,
          maxItems: 1,
        },
        {
          type: 'array',
          items: [
            {
              type: 'string',
              enum: ['always'],
            },
            {
              type: 'object',
              properties: {
                allowNewlines: {
                  type: 'boolean',
                },
              },
              additionalProperties: false,
            },
          ],
          minItems: 0,
          maxItems: 2,
        },
      ],
    },

    messages: {
      unexpectedWhitespace:
        'Unexpected whitespace between function name and paren.',
      unexpectedNewline: 'Unexpected newline between function name and paren.',
      missing: 'Missing space between function name and paren.',
    },
  },
  defaultOptions: ['never', {}] as unknown as RuleOptions,
  create(context, [option, config]) {
    const sourceCode = context.sourceCode
    const text = sourceCode.getText()

    /**
     * Check if open space is present in a function name
     * @param node node to evaluate
     * @private
     */
    function checkSpacing(
      node: Tree.CallExpression | Tree.NewExpression | Tree.ImportExpression,
      leftToken: Tree.Token,
      rightToken: Tree.Token,
    ): void {
      const isOptionalCall = isOptionalCallExpression(node)

      const textBetweenTokens = text
        .slice(leftToken.range[1], rightToken.range[0])
        .replace(/\/\*.*?\*\//gu, '')
      const hasWhitespace = /\s/u.test(textBetweenTokens)
      const hasNewline
        = hasWhitespace && LINEBREAK_MATCHER.test(textBetweenTokens)

      if (option === 'never') {
        if (hasWhitespace) {
          return context.report({
            node,
            loc: leftToken.loc.start,
            messageId: 'unexpectedWhitespace',
            fix(fixer) {
              // Don't remove comments.
              if (sourceCode.commentsExistBetween(leftToken, rightToken))
                return null

              if (isOptionalCall) {
                return fixer.replaceTextRange([
                  leftToken.range[1],
                  rightToken.range[0],
                ], '?.')
              }
              /**
               * Only autofix if there is no newline
               * https://github.com/eslint/eslint/issues/7787
               */
              if (!hasNewline) {
                return fixer.removeRange([
                  leftToken.range[1],
                  rightToken.range[0],
                ])
              }

              return null
            },
          })
        }
      }
      else if (isOptionalCall) {
        // disallow:
        // foo?. ();
        // foo ?.();
        // foo ?. ();
        if (hasWhitespace || hasNewline) {
          context.report({
            node,
            loc: leftToken.loc.start,
            messageId: 'unexpectedWhitespace',
          })
        }
      }
      else {
        if (!hasWhitespace) {
          context.report({
            node,
            loc: leftToken.loc.start,
            messageId: 'missing',
            fix(fixer) {
              return fixer.insertTextBefore(rightToken, ' ')
            },
          })
        }
        else if (!config!.allowNewlines && hasNewline) {
          context.report({
            node,
            loc: leftToken.loc.start,
            messageId: 'unexpectedNewline',
            fix(fixer) {
              // Don't remove comments.
              if (sourceCode.commentsExistBetween(leftToken, rightToken))
                return null

              return fixer.replaceTextRange(
                [leftToken.range[1], rightToken.range[0]],
                ' ',
              )
            },
          })
        }
      }
    }

    return {
      'CallExpression, NewExpression': function (node: Tree.CallExpression | Tree.NewExpression) {
        const closingParenToken = sourceCode.getLastToken(node)!
        const lastCalleeTokenWithoutPossibleParens = sourceCode.getLastToken(
          node.typeArguments ?? node.callee,
        )!

        const openingParenToken = sourceCode.getFirstTokenBetween(
          lastCalleeTokenWithoutPossibleParens,
          closingParenToken,
          isOpeningParenToken,
        )
        if (!openingParenToken || openingParenToken.range[1] >= node.range[1]) {
          // new expression with no parens...
          return
        }
        const lastCalleeToken = sourceCode.getTokenBefore(
          openingParenToken,
          isNotOptionalChainPunctuator,
        )!

        checkSpacing(node, lastCalleeToken, openingParenToken)
      },
      ImportExpression(node) {
        const leftToken = sourceCode.getFirstToken(node)!
        const rightToken = sourceCode.getTokenAfter(leftToken)!

        checkSpacing(node, leftToken, rightToken)
      },
    }
  },
})
