# API

```bash
curl https://apis.wener.me/api/qr/dec/json -F file=@qrcode.jpg -v
curl https://apis.wener.me/api/qr/dec/text -F file=@qrcode.jpg -v
```

# Note

新旧版本 apis 区别 

- [ ] url-explain
- [ ] barcode
- [x] qrcode
- ~~kong admin~~
- ~~web torrent~~ - client
- [ ] bencode
- [ ] torrent file
- [ ] pki pem
- ~~editor~~ - prose-mirror, slate, simple code editor, prettier
- ~~scel~~ - 搜狗词库
- ~~language~~ - ini, asterisk conf, html entities, xml

新版本

- 单页应用
- 尽量做到移动端友好
- 不依赖 AntD
- 尽量做到代码层面模块化
- 添加 rest api
