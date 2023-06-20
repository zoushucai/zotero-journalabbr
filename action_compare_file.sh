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


echo "=========文件内容不同======="
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

# 修改 README.md --- $(date +%Y-%m-%d | sed 's/-\(.*\)-/年\1月/; s/$/日/g') 
cat > ./content.txt << EOF
## $(date +%Y-%m-%d) update $new_tag (released by action)

- update data.ts

EOF

## 把 content.txt 插入到 README.md 的第 8 行
sed -e '8r content.txt' README.md > README.md.tmp && mv README.md.tmp README.md
rm -f content.txt
rm -f README.md.tmp


###### 确认通过检测, 以下是文件有修改的情况 ######
## 修改版本号
python action_update_version.py $new_tag
## 重新构建
npm run build-dev

echo "---------重新构建,此次更新的以下文件被修改：----------"
git status --porcelain . | while read line; do
    file=$(echo "$line" )
    echo "- $file"
done


git add .
git commit -m "Automatic submission: Updated data.ts and release $new_tag"
git tag $new_tag


echo "new_tag_env=$new_tag" >> $GITHUB_ENV
echo "current_date=$(date +'%Y-%m-%d %T')" >> $GITHUB_ENV
echo "已成功提交更改, 但未更新到远程仓库"

# 如果仓库设置了保护分支，所以需要强制推送, 否则会报错
git push origin main
echo "---- 已成功提交更改, 并更新到远程仓库 ----"
#git fetch origin --tags



