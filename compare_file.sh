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
fi


echo "文件内容不同"
cp -f "$file_a" "$file_b"

npm run build-dev
echo "-------------------------------------------------------"
echo "正在检测文件的修改状态..."
if [[ $(git status --porcelain .) ]]; then
    echo "以下文件已被修改："
    git status --porcelain . | while read line; do
        file=$(echo "$line" )
        echo "- $file"
    done
    
    git add .
    git commit -m "自动提交：更新了文件"
    # 拉取最新标签
    git fetch origin --tags
    latest_tag=$(git describe --tags --abbrev=0)
    echo "获取当前的 tag: $latest_tag"
    last_number=$(echo $latest_tag | grep -o -E '[0-9]+$')
    incremented_number=$((last_number + 1))
    new_tag=$(echo $latest_tag | sed "s/$last_number$/$incremented_number/")
    echo "准备添加最新的 tag: $new_tag"
    new_tag_v="v$new_tag"
    git tag $new_tag_v
    echo "new_tag_v_env=$new_tag_v" >> $GITHUB_ENV
    echo "已成功提交更改, 但未更新到远程仓库"

else
    echo "没有文件被修改，无需提交。"
fi

# git commit -m "update data.ts"
# git push origin master

#git fetch origin --tags



