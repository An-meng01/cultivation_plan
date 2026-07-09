# 学习养成计划 - 环境配置脚本
# 用于配置 Docker 镜像加速器，解决 Docker Hub 和 GitHub 访问问题

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  学习养成计划 - Docker 环境配置" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ----- Docker Hub Registry 镜像加速器 -----
$configPath = "$env:USERPROFILE\.docker\daemon.json"
$mirrors = @(
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
)

if (Test-Path $configPath) {
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
} else {
    $config = @{}
}

$config | Add-Member -Type NoteProperty -Name "registry-mirrors" -Value $mirrors -Force
$config | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
Write-Host "[1/3] Docker daemon.json 镜像加速器已配置" -ForegroundColor Green

# ----- 重启 Docker Desktop -----
Write-Host "[2/3] 正在重启 Docker Desktop..." -ForegroundColor Yellow
$dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (Test-Path $dockerPath) {
    & $dockerPath --restart
} else {
    Write-Host "  未找到 Docker Desktop，请手动重启" -ForegroundColor Red
}
Write-Host ""

Write-Host "[3/3] 完成！" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  配置说明" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "已配置的镜像加速器："
$mirrors | ForEach-Object { Write-Host "  $_" }
Write-Host ""
Write-Host "如果 GitHub 仍然无法访问（构建后端时需要 clone Drogon），可以："
Write-Host ""
Write-Host "  # 使用 GitHub 镜像（如 gitclone.com）"
Write-Host "  `$env:GITHUB_MIRROR = 'https://gitclone.com'"
Write-Host "  docker-compose build --build-arg GITHUB_MIRROR=https://gitclone.com"
Write-Host ""
Write-Host "或者直接运行："
Write-Host "  docker-compose up --build"
Write-Host ""
Write-Host "等待 Docker Desktop 重启完成后（约 15-30 秒），重新执行上面的命令。"
Write-Host ""
