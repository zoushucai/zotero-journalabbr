#!/bin/bash

file_a="./data_new.ts"
file_b="./src/modules/data.ts"

if ! [[ -e "$file_a" && -e "$file_b" ]]; then
    echo "文件 $file_a 或文件 $file_b 不存在, 直接退出"
    exit 1
fi

if cmp -s "$file_a" "$file_b"; then
    echo "文件内容相同"
    exit 0
else
    echo "文件内容不同"
    cp -f "$file_a" "$file_b"
    git config user.name "${{ secrets.MY_GITHUB_NAME }}"
    git config user.email "${{ secrets.MY_GITHUB_EMAIL }}"

    echo "-------------------------------------------------------"
    echo "正在检测文件的修改状态..."
    # 检测文件的修改状态
    if [[ $(git status --porcelain .) ]]; then
        # 有文件已经被修改
        echo "以下文件已被修改："
        git status --porcelain . | while read line; do
            # 列出修改过的文件名
            file=$(echo "$line" )
            echo "- $file"
        done
        
        # git add .
        # git commit -m "自动提交：更新了文件"
        echo "已成功提交更改, 但未更新到远程仓库"
    else
        echo "没有文件被修改，无需提交。"
    fi

    # git commit -m "update data.ts"
    # git push origin master
fi
