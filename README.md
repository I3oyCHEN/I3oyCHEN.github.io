# I3oyCHEN 的数字花园

这是一个由 GitHub Pages 直接托管的原生静态网站，不需要 Hexo、Node.js 或本地构建环境。

## 更新内容

日常维护主要编辑 `content/site-content.js`：

- `categories` 控制首页分类卡片。
- `entries` 控制可搜索、可筛选的记录。
- 每条记录的 `category` 必须与一个分类 `id` 对应。
- `url` 可以指向站内页面、锚点或外部链接。

新增独立长文时，可在 `notes/` 下添加 HTML 页面，再把页面地址写入对应记录的 `url`。

## 更换预设背景

预设背景样式位于 `assets/styles.css`。旧站背景图保存在 `assets/backgrounds/classic.jpg`。

访客也可以在网页右上角打开“背景”，选择本地图片。图片只保存在该访客的浏览器中，不会上传或写入仓库。

## 发布

`main` 分支根目录就是发布内容。GitHub Pages 会直接提供这些静态文件，无需构建工作流。

## 公开内容提醒

这是公开仓库与公开网站。不要提交私人日程、住址、联系方式、令牌、密码或其他敏感信息。

