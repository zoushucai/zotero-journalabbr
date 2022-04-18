# zotero-journalabbr

- 主要的功能是对 zotero 中的期刊进行缩写
- 安装该插件以后, 直接选中条目右键, 找到`期刊缩写` -->`更新期刊缩写`  , 并点击,则可以执行期刊缩写任务
- 期刊缩写的来源: [JabRef/abbrv.jabref.org](https://github.com/JabRef/abbrv.jabref.org), 我对其进行了整合, 删除了一些特殊的期刊以及期刊字符超过 80 的期刊,有可能很多期刊的缩写有多个, 选择缩写中带小数点个数多的期刊,
- 仅在 `mac` 平台上进行测试


#### 自定义期刊缩写数据库

- 可以更改`chrome/content/scripts/journalabbrbyzsc.js` 文件来定义新的数据库,用的是 json 格式来定义的
- 然后, 在主目录下执行,`bash build.sh` 即可生成新的插件

