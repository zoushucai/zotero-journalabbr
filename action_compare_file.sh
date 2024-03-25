#!/bin/bash

file_a="./data_new.ts"
file_b="./src/modules/data.ts"

if ! [[ -e "$file_a" && -e "$file_b" ]]; then
    echo "文件 $file_a 或文件 $file_b 不存在, 直接退出"
    exit 1
fi

if cmp -s "$file_a" "$file_b"; then
    rm -f "$file_a"
    echo "文件内容相同"
    exit 0
fi

echo "=========文件内容不同======="
cp -f "$file_a" "$file_b"
rm -f "$file_a"
npm run build

check_changes() {
    echo "-------------------------------------------------------"
    echo "正在检测文件的修改状态..."
    if [[ -z $(git status --porcelain .) ]]; then
        echo "没有文件被修改，无需提交。"
        # current_date=''
        # echo "$current_date" >>"$GITHUB_ENV"
        exit 0
    fi

    echo "以下文件已被修改："
    git status --porcelain . | while read -r line; do
        echo "- $line"
    done
    # current_date=$(date +'%Y-%m-%d %T')
    # echo "$current_date" >>"$GITHUB_ENV"

}
check_changes

git add . && git commit -m "Automatic submission: Updated data.ts"
echo "已成功提交更改, 但未更新到远程仓库"
git push origin main
echo "---- 已成功提交更改，并更新到远程仓库 ----"
