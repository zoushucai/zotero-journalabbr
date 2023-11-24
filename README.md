# zotero-journalabbr

- 备注: 内置缩写表不一定准确, 导出数据以后需要仔细检查

  **[功能介绍](./introduce.md)**

- 该插件基于[windingwind/zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template) V1.0.0开发, [![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)

- Release 0.7.0 以后的只支持 zotero7, 需要 zotero6 的可以手动下载 Release 0.6.\*

## 2023-11-25更新

- 可以自动选择是否增加标签

- 可以输入正则表达式,根据喜好自己选择替换. 具体参考[功能介绍](./introduce.md)

## 2023-11-10更新

- 增加一个 export csv, 主要是把 item 面板上的数据转为 csv数据, 方便梳理数据,整理报告等

## 2023-11-07更新

- 增加一个 Citation , 来自 [retorquere/zotero-better-bibtex](https://github.com/retorquere/zotero-better-bibtex). 主要是该作者好像插件还没有完善, 希望能够早日完善, 感谢.

## 2023-08-21更新

- 增加一个首字母缩写的功能
- 采用了 v1.0.0模板
- 修复了与其他插件有冲突的问题

## 2023-06-21更新

- 添加 ISO-4 标准, 来源: [marcinwrochna/abbrevIso](https://github.com/marcinwrochna/abbrevIso/blob/master/package.json)

## 2023-06-20 更新

- 修复 bib 不处理中文的问题
- 新增对 bib 的简单处理,比如 可以选择 数字或 key 样式, 以及 丢弃 doi
- 由于处理bib 需要用到key,因此需要 citationKey 字段, 该字段由[retorquere/zotero-better-bibtex](https://github.com/retorquere/zotero-better-bibtex) 提供, 因此这个插件依赖该插件, 才能生成 `\bibitem{xxx} xxxxxxxx `

## 2023年06月15日 更新 0.6.11 (released by action)

- update data.ts

## 2023年05月14日

- 自定义简写期刊 支持 json 和 csv 格式

## 2023年05月04日 更新 0.6.7 (released by action)

- update data.ts

## 2023年04月29日 更新 0.6.6 (released by action)

- update data.ts

## 2023 年 4 月 17 日更新 0.6.4

- 使得代码具有模板化
- 添加导出 `bibliography` 格式的参考文献在剪贴板
- 调整面版,尽量只占用一个菜单项
- 这个 git 版本号有点跳

## 2023 年 4 月 11 日更新 V0.6.0

#### 插件变更

- 采用模板来构建插件,实现自动化发布, 模板来自: [windingwind/zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template)
- 从 master 分支转到 main 分支

## Old Version

### 2023 年 4 月 9 日更新 V0.5.1

- 新增期刊互换, 即原始期刊和简写期刊进行互换

### 2023年2月23日 更新 V0.5

- 新增了几个对期刊缩写字段的小功能
  - 缩写期刊的大写
  - 缩写期刊的小写
  - 缩写期刊的首字母化
  - 移除缩写期刊中的点
- 如果用户自定义了缩写期刊, 现在会保留上一次(正确)使用的记录, 主要的思想是: 在本机注入一个文本文件用来记录上次用户的选择(不过没能实现弹窗选择路径的效果,先暂且这样吧)
- 对于体积太大的问题,思考了一下, 如果单独把数据拿出来大概 10M (利用简单的压缩处理一下,大概也有 2--3M)
  - 把数据文件存在本地, 需要解压缩, 解压以后的文件还是 10M 左右, 还不如直接写在插件中
  - 把数据放在服务器上, 国内没有免费的服务器, 其次放在 github上, 不挂梯子根本下载不了,就算了
  - 数据优化存储,不会

### 2023年2月23日 更新

- 感谢 @[longzhanyuye5](https://github.com/longzhanyuye5) 的建议,
- 新增 [该网站](https://woodward.library.ubc.ca/woodward/research-help/journal-abbreviations/) 的期刊缩写数据库,
- 期刊缩写的权重优先级: `自定义 > 该网站 > JabRef/abbrv.jabref.org`
- 对于体积太大的问题, 个人是在不太会优化, 有会的,可以修改呀!

### 功能

- 自用, 主要的功能是对 zotero 中的期刊进行缩写
- 安装该插件以后, 直接选中条目右键, 找到 `期刊缩写` -->`更新期刊缩写` , 并点击,则可以执行期刊缩写任务
- 期刊缩写的来源: [JabRef/abbrv.jabref.org](https://github.com/JabRef/abbrv.jabref.org), 我对其进行了整合,

  - 删除了一些特殊的期刊, 比如期刊中还有 单双引号, 单反斜杠
  - 删除了期刊字符超过 80 以及期刊字符小于5的期刊
  - 对于带点的优先顺序 `点的个数 > 大写个数> 缩写短的`
  - 对于不带点的优先顺序 `不带点的个数 > 大写个数> 缩写短的`, 参考[zoushucai/zotero-journalabbr-nodot](https://github.com/zoushucai/zotero-journalabbr-nodot)

- 仅在 `mac` 平台上进行测试

### 自定义期刊缩写数据库

- 可以更改 `chrome/content/scripts/journalabbrbyzsc.js` 文件来定义新的数据库,用的是 json 格式来定义的. 然后, 在主目录下执行,`bash build.sh` 即可生成新的插件
- 可以添加自己 csv 数据库, 数据格式要求, 第一列是原始期刊的 title, 第二列是缩写期刊, 中间用分号隔开(注意:如果用 excel 打开的话,默认是用的逗号,要注意) , 不需要列名
