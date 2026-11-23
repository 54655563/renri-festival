# 人日嘉年华 · 万物同春

纯 HTML / CSS / JavaScript，无依赖、无需构建。双击 `index.html` 可离线体验。用于展位或部署时，建议用现代 Chrome、Edge、Safari 从静态服务器访问整个目录。

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

浏览器访问 http://127.0.0.1:8765/ 。第一次打开会播放序章（默认静音，允许手动开声或跳过），结束后停在最后一帧，点「展卷游园」。游园 BGM 默认开启，通常在点击入场后播放；如果浏览器拦截，下一次页面点击会尝试恢复，之后会记住开关偏好。护照和已结算分数在当前标签页刷新后恢复；「开始新一位访客」不清除主动上榜的本机昵称和分数。界面中英并排显示。人日墙未启用。

## 素材

序章视频及三首场景 BGM 已放在 `assets/`。四张聊天附件原图没有出现在本地工作区，网站自带备用插图。将原图按下列文件名放进 `assets/` 即可替换，HTML 和 CSS 不用改：

- 求签：`f2851ff64ec2b138a6bc399b94cfbca3.png`
- 煎饼：`2d00263c7d341727613de6ee17bc6316.png`
- 登高：`8125a72a5d124b494248df450c9f5c2e.png`
- 妆造：`72fcfa3d7d8e71620095f5fcf8e72362.png`

## 可选在线模型

进入游园，点右上角 **「API 设置 / API Settings」**，无需编辑代码。地址和模型会保存在当前浏览器，密钥只留在当前页面内存，刷新清除。保存后重新进入摊位生效。配置地址请填完整请求路径，或在通过 HTTP(S) 打开网页时填写站内路径（如 `/api/image`）。不要把密钥写进 URL 或项目代码。

- **DeepSeek：** 默认模型 `deepseek-chat`。只填密钥则请求 `https://api.deepseek.com/chat/completions`。如果浏览器跨域策略阻止直连，填兼容代理的完整地址，可选填代理令牌。地址和密钥都留空时使用本地签文和示例诗。
- **可灵：** 填可灵代理的完整地址，可选填代理令牌。可灵官方访问密钥与签名放在代理服务器，不要填进网页。代理地址留空时，自拍只在本地处理。

`config.js` 可为部署统一指定默认值。在线展出建议使用自有代理；跨域代理需允许该站来源。该目录不包含代理服务，也不保证任何线上接口已经开通。

- `deepseek.endpoint`：接受 JSON `POST {model, messages}`，返回 OpenAI 兼容 JSON `choices[0].message.content`。代理可将请求转发至 DeepSeek 的 `/chat/completions`。
- `kling.endpoint`：接受 multipart `POST`，字段 `image` 为一张 JPG/PNG，`preset` 为当前造型标识。代理处理可灵的鉴权、任务轮询及结果下载，在 45 秒内返回 `image/png`、`image/jpeg` 或 `image/webp` 二进制。启用前应明确告知处理位置、服务端留存期限、删除方式和联系方式。未启用时自拍只在浏览器内处理，不会上传。

## 检查

```powershell
node --test
```
