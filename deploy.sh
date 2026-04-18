#!/bin/bash

# 008虚拟女友项目部署脚本
echo "开始部署 008-virtual-girlfriend 项目..."

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查git状态
echo "检查git状态..."
git status

# 检查环境变量文件
if [ ! -f ".env.local" ]; then
    echo "警告: .env.local 文件不存在"
    echo "请确保在Vercel中配置了环境变量"
fi

# 提供部署选项
echo ""
echo "请选择部署方式:"
echo "1. 通过Vercel网站手动部署（推荐）"
echo "2. 通过Vercel CLI部署"
echo "3. 检查项目状态"
echo "4. 退出"

read -p "请输入选项 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "=== 通过Vercel网站手动部署 ==="
        echo "1. 访问 https://vercel.com"
        echo "2. 使用GitHub账号登录"
        echo "3. 点击 'New Project'"
        echo "4. 选择GitHub仓库: noir-madlax/008-virtual-girlfriend"
        echo "5. 配置项目设置:"
        echo "   - Framework Preset: Next.js"
        echo "   - Root Directory: . (留空)"
        echo "   - Build Command: npm run build"
        echo "   - Output Directory: .next"
        echo "6. 添加环境变量:"
        echo "   - GEMINI_API_KEY"
        echo "   - NEXT_PUBLIC_SUPABASE_URL"
        echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
        echo "   - USE_PROXY"
        echo "   - NEXT_PUBLIC_APP_URL"
        echo "7. 点击 'Deploy'"
        echo ""
        echo "部署完成后，访问 https://008.100app.dev 测试"
        ;;
    2)
        echo ""
        echo "=== 通过Vercel CLI部署 ==="
        echo "请执行以下命令:"
        echo ""
        echo "# 安装Vercel CLI（如果未安装）"
        echo "npm i -g vercel"
        echo ""
        echo "# 登录Vercel"
        echo "vercel login"
        echo ""
        echo "# 关联项目"
        echo "vercel link"
        echo ""
        echo "# 设置环境变量"
        echo "vercel env add GEMINI_API_KEY"
        echo "vercel env add NEXT_PUBLIC_SUPABASE_URL"
        echo "vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY"
        echo "vercel env add USE_PROXY"
        echo "vercel env add NEXT_PUBLIC_APP_URL"
        echo ""
        echo "# 部署"
        echo "vercel --prod"
        ;;
    3)
        echo ""
        echo "=== 项目状态检查 ==="
        echo "Git状态:"
        git status
        echo ""
        echo "远程仓库:"
        git remote -v
        echo ""
        echo "环境变量:"
        if [ -f ".env.local" ]; then
            echo "环境变量文件存在"
            grep -v "^#" .env.local | grep "=" | cut -d'=' -f1 | while read var; do
                echo "  $var"
            done
        else
            echo "环境变量文件不存在"
        fi
        echo ""
        echo "项目文件:"
        ls -la
        ;;
    4)
        echo "退出部署脚本"
        exit 0
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac

echo ""
echo "部署脚本执行完成"