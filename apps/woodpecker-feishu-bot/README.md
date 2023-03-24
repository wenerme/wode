---
name: Woodpecker Feishu Bot

description: Send notify to feishu/飞书 in text or markdown format
authors: Wener
tags: [notify]
containerImage: wener/woodpecker-feishu-bot
containerImageUrl: https://hub.docker.com/r/wener/woodpecker-feishu-bot
url: https://github.com/wenerme/wode/tree/main/apps/woodpecker-feishu-bot
---

## Example

```yaml
variables:
  - &notify_image 'wener/woodpecker-feishu-bot'

pipeline:
  Notify Start:
    image: *notify_image
    settings:
      feishu_bot_url:
        from_secret: feishu_bot_url
      feishu_bot_secret:
        from_secret: feishu_bot_secret
      markdown: |
        🏗️ Start building <%= env.CI_REPO_NAME %> #<%= env.CI_BUILD_NUMBER %>

        - <%= $.link(env.CI_COMMIT,env.CI_COMMIT_LINK) %> <%=env.CI_COMMIT_MESSAGE.replaceAll(/\n/g,';')%>

        📦️ <%=$.link(env.CI_REPO_NAME,env.CI_BUILD_LINK)%>

  Notify Done:
    image: *notify_image
    settings:
      feishu_bot_url:
        from_secret: feishu_bot_url
      feishu_bot_secret:
        from_secret: feishu_bot_secret
      markdown: |
        <%= env.CI_PIPELINE_STATUS === 'success' ? '✅' : '❌' %> Building complete <%= env.CI_REPO_NAME %> #<%= env.CI_BUILD_NUMBER %>

        - <%= env.CI_COMMIT_MESSAGE %>

        📦️ <%= $.link(env.CI_REPO_NAME, env.CI_BUILD_LINK) %> · ⏳<%= env.CI_PIPELINE_FINISHED - env.CI_PIPELINE_STARTED %>
    when:
      status: [ success, failure ]
```

## settings

| setting           | for                                    |
|-------------------|----------------------------------------|
| feisbu_bot_url    |                                        |
| feisbu_bot_secret |                                        |
| content           |                                        |
| format            | format of content, default to markdown |
| markdown          | =content+format=markdown               |
| text              | =content+format=text                   |
| dry_run           |                                        |
| debug             | print env                              |
| template_render   | render template, default to true       |
