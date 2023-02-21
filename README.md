# zotero-journalabbr

#### 2023年2月23日 更新

- 感谢 @[longzhanyuye5](https://github.com/longzhanyuye5) 的建议, 
- 新增 [该网站](https://woodward.library.ubc.ca/woodward/research-help/journal-abbreviations/)  的期刊缩写数据库,  
- 期刊缩写的权重优先级:  `自定义 > 该网站 > JabRef/abbrv.jabref.org`

- 对于体积太大的问题, 个人是在不太会优化, 有会的,可以修改呀!

#### 功能

- 自用, 主要的功能是对 zotero 中的期刊进行缩写
- 安装该插件以后, 直接选中条目右键, 找到`期刊缩写` -->`更新期刊缩写`  , 并点击,则可以执行期刊缩写任务
- 期刊缩写的来源: [JabRef/abbrv.jabref.org](https://github.com/JabRef/abbrv.jabref.org), 我对其进行了整合,
  - 删除了一些特殊的期刊, 比如期刊中还有 单双引号,  单反斜杠
  - 删除了期刊字符超过 80 以及期刊字符小于5的期刊
  - 对于带点的优先顺序 `点的个数 > 大写个数> 缩写短的`
  - 对于不带点的优先顺序 `不带点的个数 > 大写个数> 缩写短的`,  参考[zoushucai/zotero-journalabbr-nodot](https://github.com/zoushucai/zotero-journalabbr-nodot)

- 仅在 `mac` 平台上进行测试


#### 自定义期刊缩写数据库

- 可以更改`chrome/content/scripts/journalabbrbyzsc.js` 文件来定义新的数据库,用的是 json 格式来定义的
- 然后, 在主目录下执行,`bash build.sh` 即可生成新的插件

