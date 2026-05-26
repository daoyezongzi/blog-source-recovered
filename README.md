# blog-source-recovered

这是从 `blog-folder` 静态站反向恢复出的 Hexo 源码仓库骨架。

## 已恢复内容

- 帖子：16 篇（source/_posts/技术心得-01-3分钟写进一篇博客.md、source/_posts/无题2022.md、source/_posts/喀秋莎.md、source/_posts/贤士的礼物.md、source/_posts/无题241112.md、source/_posts/永远和成功.md、source/_posts/人生何处不青山.md、source/_posts/鸽.md、source/_posts/柳.md、source/_posts/黑沙滩.md、source/_posts/菲林.md、source/_posts/烟笼寒水.md、source/_posts/青蓝色的五点钟.md、source/_posts/未寄出的信，全新的开始.md、source/_posts/TradeEye开发杂谈01丨论grill-me.skill对我的帮助.md、source/_posts/ZongziLegder开发杂谈01丨我如何开始一个项目.md）
- 页面：`links`（从静态页恢复），`about`（补建占位页）
- 资源：`source/img`、`source/js`、`source/css/custom.css`、`source/manifest.json`、`source/site-info.json`、`source/content.json`
- 配置：`_config.yml`、`_config.icarus.yml`、`scripts/inject-custom-assets.js`
- 部署：GitHub Actions 工作流 `/.github/workflows/deploy.yml`

## 使用方式

```bash
npm install
npm run serve
```

本地预览后生成静态文件：

```bash
npm run build
```

## 私有源码仓库 + 公开站点建议流程

1. 新建一个 **私有** GitHub 仓库，推送本目录全部源码。
2. 在同账号下准备一个用于 Pages 的仓库（通常是 `<username>.github.io`，可公开）。
3. 将 Actions 工作流保留在私有源码仓库中，推送 `main` 时自动部署到 `gh-pages`。
4. 若你用自定义域名，请在 `source/CNAME` 添加域名。

## 需要你手动确认

- `_config.yml` 里的 `deploy.repo` 需要替换为你的真实仓库地址。
- 当前文章正文是“保真 HTML 体”恢复，后续可按需再转换为纯 Markdown。
- 由于静态快照缺少 `/about/index.html`，当前 `about` 页面为补建占位内容。
