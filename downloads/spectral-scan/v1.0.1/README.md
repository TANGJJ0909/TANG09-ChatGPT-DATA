# 创谱联合光谱扫描 · Windows 单文件版

**[点击下载 SpectralScan.exe](https://github.com/TANGJJ0909/TANG09-ChatGPT-DATA/raw/refs/heads/releases/spectral-scan-1.0.1/downloads/spectral-scan/v1.0.1/SpectralScan.exe)**

- 平台：Windows 10 / 11，64 位。
- 文件大小：29,643,264 字节，约 28.3 MiB。
- 单文件封装：1.0.1；采集核心：1.0.0。

下载后双击运行，无需安装 Python。首次自动校验并展开内置运行环境；界面在本机默认浏览器打开，可离线使用，默认连接模拟设备。

支持 Newport SMC100CC 转台角度步进、到位及停稳检查、Newton CCD 单帧 / 帧平均采集、读取模式及 ROI / bin、制冷、实时曲线和逐点保存。尚无实测角度—波长标定时使用角度模式，中心波长 JSON 标定导入已预留。

真实设备需另外安装厂家驱动与 64 位 Andor SDK2。本文件不包含厂家专有 SDK DLL。采集核心已通过 42 项自动化及界面测试，单文件封装已通过内容校验、展开 / 复用 / 修复测试及模拟采集；**尚未在 Windows 实机或实际转台 / Newton 940 上联机验证**。

结束实验请点击界面“安全退出”；低温 CCD 会先关闭制冷并回温，达到 0℃后断开。回温期间请保持供电和连接。

默认数据和日志目录：`%LOCALAPPDATA%\Specreation\SpectralScan`。

## 校验文件

SHA256：

```text
68361b1c80bc2dd1e405b6b91ac68f2a810b8461e91103f8b6fd5a25c2489c98  SpectralScan.exe
```

可在 PowerShell 中执行：

```powershell
Get-FileHash .\SpectralScan.exe -Algorithm SHA256
```

Python、NumPy、pyserial 与 Go 许可随内置运行环境提供。技术联系：tangjj@specreation.com。
