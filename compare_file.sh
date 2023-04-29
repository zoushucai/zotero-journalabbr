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
if ! [[ $(git status --porcelain .) ]]; then
    echo "没有文件被修改，无需提交。"
    exit 0
fi


echo "以下文件已被修改："
git status --porcelain . | while read line; do
    file=$(echo "$line" )
    echo "- $file"
done

# 拉取最新标签
git fetch origin --tags
latest_tag=$(git describe --tags --abbrev=0)
echo "获取当前的 tag: $latest_tag"
last_number=$(echo $latest_tag | grep -o -E '[0-9]+$')
incremented_number=$((last_number + 1))
new_tag=$(echo $latest_tag | sed "s/$last_number$/$incremented_number/")
echo "准备添加最新的 tag: $new_tag"
#new_tag="v$new_tag"

# 修改 README.md
cat > ./content.txt << EOF
## $(date +%Y-%m-%d | sed 's/-/年/g; s/-/月/g; s/$/日/g') 更新 $new_tag  (prerelease, action robot)

- upadte data.ts

EOF

## 把 content.txt 插入到 README.md 的第 4 行
sed -e '4r content.txt' README.md > README.md.tmp && mv README.md.tmp README.md
rm -f content.txt
rm -f README.md.tmp

git add .
git commit -m "自动提交：更新了data.ts文件"



echo "new_tag_env=$new_tag" >> $GITHUB_ENV
echo "current_date=$(date +'%Y-%m-%d %T')" >> $GITHUB_ENV
echo "已成功提交更改, 但未更新到远程仓库"

git push origin master

#git fetch origin --tags



