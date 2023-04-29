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
    #cp "$file_a" "$file_b"
    # git config user.name "${{ secrets.MY_GITHUB_NAME }}"
    # git config user.email "${{ secrets.MY_GITHUB_EMAIL }}"
    # git add "$file_b"
    # git commit -m "update data.ts"
    # git push origin master
fi
