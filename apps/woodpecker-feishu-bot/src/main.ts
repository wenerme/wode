import axios from 'axios';
import dotenv from 'dotenv';
import { Eta } from 'eta';
import fs from 'fs-extra';
import { z } from 'zod';
import { createFeishuBotHookRequest } from './bot';

const Envs = z.object({
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
  PLUGIN_TEMPLATE: z.coerce.boolean().default(true),
  PLUGIN_FAILSAFE: z.coerce.boolean().default(false),
});

async function main() {
  await beforeServerStart();
  if (Boolean(process.env.PLUGIN_DEBUG)) {
    console.log(`Debug env:`);
    console.log(
      Object.entries(process.env)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('\n'),
    );
  }

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
    PLUGIN_TEMPLATE: template,
    PLUGIN_FAILSAFE: failSafe,
  } = result.data;

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

  try {
    if (
      !(await run({
        url,
        secret,
        text,
        markdown,
        imagePath,
        dryRun,
        template,
        html,
      })) &&
      !failSafe
    ) {
      process.exit(1);
    }
  } catch (e) {
    console.error(`Error: ${e}`);
    if (!failSafe) {
      process.exit(1);
    }
  }
}

main();

async function run({
  url,
  secret,
  text,
  markdown,
  html,
  template,
  dryRun,
  imagePath,
}: {
  url: string;
  secret?: string;
  text?: string;
  html?: string;
  markdown?: string;
  imagePath?: string;
  template?: boolean;
  dryRun?: boolean;
}) {
  if (!text && !markdown) {
    console.error('no content', {
      text,
      markdown,
    });
    return false;
  }
  if (template) {
    const ctx = {
      env: { ...process.env },
      fs: Object.freeze(fs),
    };

    const eta = new Eta({
      // ...Eta.defaultConfig,
      useWith: true,
      autoTrim: false,
    });
    if (text) {
      text = await eta.renderAsync(text, {
        ...ctx,
        $: TextUtils,
      });
    }
    if (markdown) {
      markdown = await eta.renderAsync(markdown, {
        ...ctx,
        $: MarkdownUtils,
      });
    }
    if (html) {
      html = await eta.renderAsync(html, {
        ...ctx,
        $: HTMLUtils,
      });
    }
  }

  if (imagePath) {
    try {
      await fs.stat(imagePath);
    } catch (e) {
      console.error(`image file not found: ${imagePath}`);
      return false;
    }
  }

  console.log(`Send`, {
    text,
    markdown,
  });

  if (dryRun) {
    console.log('dry run');
    return true;
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
    return;
  }
  console.log(`->`, JSON.stringify(data));

  return true;
}

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
