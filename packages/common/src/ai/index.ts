/**
 * Application AI catalog boundary.
 *
 * Context still re-exports these symbols for configuration compatibility, but
 * AI commands and model selection should import from `common/ai`.
 */

export * from '../context/AiCatalog';
export * from '../context/AiConfig';
