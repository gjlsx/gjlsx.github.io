永久配置：让 Windows 默认“不询问”
如果你不想每次都输入 --yes，可以直接把“非交互模式”写入 Windows 的系统环境变量中。

选项 A：如果你平时用 PowerShell（推荐）
打开 PowerShell，运行以下命令（这会把变量直接写入你的用户配置，永久生效）：

PowerShell
[Environment]::SetEnvironmentVariable("GEMINI_NON_INTERACTIVE", "true", "User")
[Environment]::SetEnvironmentVariable("CLOUDSDK_CORE_DISABLE_PROMPTS", "1", "User")

运行后，重启一下 PowerShell 终端即可生效。

选项 B：如果你平时用 传统 CMD (命令提示符)
打开 CMD，运行以下命令：

setx GEMINI_NON_INTERACTIVE "true"
setx CLOUDSDK_CORE_DISABLE_PROMPTS "1"

同样，运行后需要重新打开一个新的 CMD 窗口来加载变量。