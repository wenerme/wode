import 'axios';
import axios from 'axios';
import dotenv from 'dotenv';
import * as Eta from 'eta';
import type { EtaConfig } from 'eta/dist/types/config';
import fs from 'node:fs/promises';
import { z } from 'zod';
import { createFeishuBotHookRequest } from './bot';

let Envs = z.object({
  PLUGIN_FEISHU_BOT_URL: z.string().url(),
  PLUGIN_FEISHU_BOT_SECRET: z.string().optional(),
  PLUGIN_CONTENT: z.string().optional(),
  PLUGIN_FORMAT: z.string().optional(),
  PLUGIN_TEXT: z.string().optional(),
  PLUGIN_MARKDOWN: z.string().optional(),
  PLUGIN_HTML: z.string().optional(),
  PLUGIN_IMAGE: z.string().optional(),
  PLUGIN_DRY_RUN: z.coerce.boolean().optional(),
  PLUGIN_DEBUG: z.coerce.boolean().optional(),
  PLUGIN_TEMPLATE_RENDER: z.coerce.boolean().optional().default(true),
});

async function main() {
  await beforeServerStart();
  const result = Envs.safeParse(process.env);
  if (!result.success) {
    console.error(`${result.error.issues.map(({ path, message }) => `${path.join('.')}: ${message}`).join(' ;')}`);
    process.exit(1);
    return;
  }
  const {
    PLUGIN_FEISHU_BOT_SECRET: secret,
    PLUGIN_FEISHU_BOT_URL: url,
    PLUGIN_IMAGE: imagePath,
    PLUGIN_DRY_RUN: dryRun,
    PLUGIN_TEMPLATE_RENDER: tplRender,
    PLUGIN_DEBUG: debug,
  } = result.data;

  if (debug) {
    console.log(`Debug env:`);
    console.log(
      Object.entries(process.env)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('\n'),
    );
  }

  let { PLUGIN_TEXT: text, PLUGIN_MARKDOWN: markdown, PLUGIN_HTML: html } = result.data;
  let content = result.data.PLUGIN_CONTENT;
  let format = result.data.PLUGIN_FORMAT;
  {
    if (content) {
      switch (format) {
        case 'text':
          text = content;
          break;
        default:
        case 'markdown':
          markdown = content;
          break;
      }
    }
  }
  if (!text && !markdown) {
    console.error('no content', {
      text,
      markdown,
      content,
      format,
    });
    process.exit(1);
    return;
  }
  if (tplRender) {
    const ctx = {
      env: { ...process.env },
    };
    let opts: EtaConfig = {
      ...Eta.defaultConfig,
      useWith: true,
      autoTrim: false,
    };
    if (text) {
      text = Eta.render(
        text,
        {
          ...ctx,
          $: TextUtils,
        },
        opts,
      );
    }
    if (markdown) {
      markdown = Eta.render(
        markdown,
        {
          ...ctx,
          $: MarkdownUtils,
        },
        opts,
      );
    }
    if (html) {
      html = Eta.render(
        html,
        {
          ...ctx,
          $: HTMLUtils,
        },
        opts,
      );
    }
  }

  if (imagePath) {
    try {
      await fs.stat(imagePath);
    } catch (e) {
      console.error(`image file not found: ${imagePath}`);
      process.exit(1);
      return;
    }
  }

  if (dryRun) {
    console.log('dry run');
    console.log({
      text,
      markdown,
    });
    return;
  }

  const req = createFeishuBotHookRequest({
    config: {
      url,
      secret,
    },
    text,
    markdown,
  });

  const { data, status, statusText, headers } = await axios.request(req);
  if (status >= 300) {
    console.error({ statusText, status, data, headers });
    process.exit(1);
    return;
  }
  console.log(JSON.stringify(data, null, 2));
}

main();

async function beforeServerStart() {
  const log = console;
  const mode = process.env.NODE_ENV || 'production';
  const envs = [`.env.${mode}.local`, `.env.${mode}`, `.env.local`, `.env`];
  for (const env of envs) {
    if (!dotenv.config({ path: env }).error) {
      log.info(`loaded env from \`${env}\``);
    }
  }
}

export interface TemplateUtils {
  link(txt: string, href?: string): string;
}

const MarkdownUtils: TemplateUtils = {
  link: (txt: string, href?: string) => {
    if (href) {
      return `[${txt}](${href})`;
    }
    return txt;
  },
};
const HTMLUtils: TemplateUtils = {
  link: (txt: string, href?: string) => {
    if (href) {
      return `<a href='${encodeURI(href)}'>${txt}</a>`;
    }
    return txt;
  },
};
const TextUtils: TemplateUtils = {
  link: (txt: string, href?: string) => {
    return href || txt;
  },
};
