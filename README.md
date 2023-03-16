# zotero-journalabbr

#### 2023年2月23日 更新 V0.5

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

- 可以更改`chrome/content/scripts/journalabbrbyzsc.js` 文件来定义新的数据库,用的是 json 格式来定义的. 然后, 在主目录下执行,`bash build.sh` 即可生成新的插件

- 可以添加自己 csv 数据库, 数据格式要求, 第一列是原始期刊的 title, 第二列是缩写期刊, 中间用分号隔开(注意:如果用 excel 打开的话,默认是用的逗号,要注意) , 不需要列名
