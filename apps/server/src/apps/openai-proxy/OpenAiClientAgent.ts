import { Static, Type as t } from '@sinclair/typebox';

export type OpenAiClientAgent = Static<typeof OpenAiClientAgent>;
export const OpenAiClientAgent = t.Object({
  type: t.Literal('OpenAi'),
  secrets: t.Object({
    key: t.String(),
    organization: t.Optional(t.String()),
    endpoint: t.Optional(t.String()),
  }),
  config: t.Object({
    defaults: t.Optional(t.Record(t.String(), t.Record(t.String(), t.Any()))),
    overrides: t.Optional(t.Record(t.String(), t.Record(t.String(), t.Any()))),
  }),
});
