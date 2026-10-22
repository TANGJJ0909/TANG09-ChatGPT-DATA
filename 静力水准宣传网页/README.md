# 创谱静力水准检测系统 · 当前网页源码

本工程从本次上传的「创谱静力水准检测系统_新软件截图_离线版.html」拆分生成。
以本次上传文件为准，保留其新软件截图、通信架构图和原有交互；未合并其他版本的改动。
采用原生 HTML / CSS / JavaScript，运行无需安装依赖。

## 打开网页

直接双击 `index.html`，保持 assets 目录的相对位置。
也可在本目录运行 `python3 -m http.server 8000` 后在本机访问 http://localhost:8000。
外部资料链接和邮件联系仍需网络或邮件程序。

## 修改源码

- index.html：网页结构与文案。
- assets/css/styles-01.css：原页面基础样式。
- assets/css/styles-02.css：优化及响应式样式。
- assets/js/script-01.js：图片资源映射。
- assets/js/script-02.js：原理演示、图库、测试资料、应用方案、导出与打印。
- assets/js/script-03.js：阅读进度和返回顶部。
- assets/images/：原网页图片，按内容去重，保留原始图片字节。
- tools/build_offline.py：单文件离线版生成脚本（Python 3.9+，无额外依赖）。

软件截图与通信架构图分别由 script-01.js 中的 software、circuit 字段指定。
图片、脚本使用相对路径；中文编码为 UTF-8。

## 生成单文件离线版

在工程目录执行：

```sh
python3 tools/build_offline.py
```

输出为 dist/创谱静力水准检测系统_离线版.html，可单独拷贝与打开。

## 验证

拆分后按原顺序重新嵌入资源，与上传 HTML 逐字符一致；图片字节保持一致。
