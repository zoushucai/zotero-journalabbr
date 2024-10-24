## 功能介绍

- 备注: 内置缩写表不一定准确, 导出数据以后需要仔细检查

右键菜单如下

### 期刊简写导出
<img src='https://cdn.jsdelivr.net/gh/zoushucai/img_bed@master/uPic/Clip_2024-10-24_21-12-03.png' alt='Clip_2024-10-24_21-12-03.png' width='300'/>


- `复制样式1到剪贴板`,
  - 主要是根据选择的条目生成 `bibliography` 格式的参考文献,
  - 根据条目自动处理了 `等` 和 `et al` 的转换,
- `复制样式2到剪贴板`,

  - 主要是根据选择的条目生成 `bibliography` 格式的参考文献,
  - 根据条目自动处理了 `等` 和 `et al` 的转换,
  - 对多个作者也进行了处理, 可能存在 `and` 和 `&` 之间的不统一, 这里统一使用 `and` (样式 2比样式 1 多这个功能)
  - 样式 1 采用的算法和样式 2 处理数据的方式不太一样,生成的参考文献样式基本上是一样的, 样式 1 是整体处理,样式 2 是分开处理的

- export csv : 把item导出为csv的格式， 方便填表

### 期刊缩写

<img src='https://cdn.jsdelivr.net/gh/zoushucai/img_bed@master/uPic/Clip_2024-10-24_21-11-26.png' alt='Clip_2024-10-24_21-11-26.png' width='200'/>


- `自定义缩写刊缩`: 即选择 `csv`或 ` json` 文件进行期刊缩写
  
  - 第一, 首先需要配置好 `csv` 或者 `json` 路径, 
  - 第二, 如果是 `csv` 文件, 则第一列为期刊全名, 第二列为缩写期刊,
  - 第三, 如果是 `json` 文件, 则按照 `json` 格式书写即可, `key` 为期刊全名, `value` 为缩写期刊名
  - 在进行期刊简写的时候, 会自动添加 `abbr_user`标签, 并且会自动检测该条目是否存在 `abbr` 和 `abbr-iso4` 标签, 如果存在则会删除,
  
- `内置缩写`: 即采用插件提供的内置数据进行期刊缩写
  
  - 自动添加 `abbr` 标签, 并删除 `abbr_user` 和 `abbr-iso4` 标签
  
  - 内置数据的来源: [JabRef/abbrv.jabref.org](https://github.com/JabRef/abbrv.jabref.org) 和 [该网站](https://woodward.library.ubc.ca/woodward/research-help/journal-abbreviations/) 的期刊缩写数据库, 感谢
    - 这里对其两个数据进行了整合, 按照一定规则进行数据处理排序, 基本思想,不改变数据中的值, 只当数据搬运工.
    
    - 内置期刊缩写的权重优先级: `该网站 > JabRef/abbrv.jabref.org `
    
    - `JabRef/abbrv.jabref.org` 数据处理规则:
      - 删除了一些特殊的期刊, 比如期刊名中存在 单双引号, 单反斜杠等特殊字符
      - 删除了期刊字符超过 80 以及期刊字符小于5的期刊
      - 对于同一个期刊可能存在多个缩写, 其优先顺序 `点的个数 > 大写个数> 缩写短的`
    
    - 具体来自仓库：[zoushucai/journalmerge](https://github.com/zoushucai/journalmerge)
    
      
  
- `ISO-4 standard` 采用 ISO-4 的标准来缩写期刊, 来源 [marcinwrochna/abbrevIso](https://github.com/marcinwrochna/abbrevIso), 这里只是做了整合, 感谢其作者

  - 自动添加 `abbr-iso4` 标签, 并删除 `abbr_user` 和 `abbr` 标签

- `一步更新`: 即首先选择`ISO-4 standard`, 然后选择 `内置期刊缩写`, 最后选择 `用户期刊缩写`

  - 此时, 期刊缩写的优先级: `自定义 > 内置数据 > ISO-4 standard`

- `大写简写期刊` : 简写期刊这个字段进行大写

- `小写简写期刊` : 简写期刊这个字段进行小写

- `首字母化简写` : 简写期刊这个字段进行首字母化

- `首字母缩写` : 简写期刊这个字段进行首字母缩写

- `移除简写中的点` : 简写期刊中的点移除

- `交换期刊名` : 即原始期刊和简写期刊进行互换,并自动添加 `exchange` 标签, 如果换回去了,则会删除该标签

- `自定义文件路径`: 一个快捷的操作, 对应偏好设置中的自定义缩写文件路径

-  `abbrall` 选项， 把所有类型的条目都按照某个规则进行缩写, 缩写的结果放在 `extra`中的 `itemBoxRowabbr` 字段, 然后, 条目右侧信息面板中会显示一个 `abbr` 字段,其值为`extra`中对应的`itemBoxRowabbr`字段的值. 并把这个字段放入条目的标题上, 可以通过右键添加自定义的列名(列名为`abbr`), 于是就可对所有条目按照缩写进行排序了.(备注: 好像一定要经过这个 `extra`步骤才能在右侧信息面板中显示且可以编辑, 不知道有没有其他方法. 有的话,可以告诉我一下)
  - 某个规则缩写:

    - 对所有条目进行分类, 先利用 ISO-4 的标准进行缩写, 然后利用内置的数据进行缩写, 最后利用用户自定义的数据进行缩写, 从而实现优先级: `自定义 > 内置数据 > ISO-4 standard`. 且如果用户没有自定义数据文件,虽然会提示有错,但是不影响使用. (不过这样每次运行会消耗一点点时间)

    - 对所有条目进行分类, 规则如下

      ```
      thesis --> university
      book --> publisher
      # 对于期刊类,先从简写中获取,如果简写为空,那么再从全名中获取
      journalArticle --> journalAbbreviation ---> publicationTitle
      conferencePaper --> conferenceName
      preprint --> repository
      bookSection --> publisher
      ohther --> itemBoxRowabbr
      如果获得的值都为空,那么再从 journalAbbreviation 中尝试获取, 如果还是为空, 那么就为空白了
      对获取的字段会自动按照上述缩写规则进行缩写, 且不会添加任何 标签
      
      ```


- `replace` 选项, 按照指定的`json `文件, 进行条目缩写, 本质上就是调用 `str.replace()` 函数 或`str.match()`

  - 输入对应的 `json `内容格式如下, (记住是标准的` json`,而非` jsonc`, 下面用注释进行解释说明)

  - 本质是调用 `js`中的替换函数或匹配函数: `str.replace(regexp|substr, newSubStr|function[, flags])`或 `str.match(regexp|substr_` 根据不同的输入,执行不同的操作
  
  
    - 支持对同一个字段进行多次操作
  
  
    - 如果内部字段被置为空, 则不进行操作(保护一下)
  
      ```json
      [
        {
          "itemType": "conferencePaper", // 条目类型,需要符合 zotero 的规则
          "searchField": "conferenceName", // 条目字段类型,需要符合 zotero 的规则
          "replaceField": "conferenceName", // 条目字段类型,需要符合 zotero 的规则
          "methodName": "replace", // 采用的方法名, 暂时支持 "replace" 和  "match", 如果是 mact 则只有searchType和 searchString生效
          "searchType": "regex", // 支持两种类型, "string", "regex", 如果是 regex,则需要 "/(\w+)\s* \s*(\w+)/g"的形式
          "searchString": "/(\\w+)\\s(\\w+)/g", // 匹配的值
          "replaceType": "regex", // 支持三种类型,"string", "regex", "function",  这里的 "string", "regex" 等价 , 仅"methodName": "replace" 生效
          "replaceString": "$2, $1" // 替换的值
        },
        {
          "itemType": "journalArticle",
          "searchField": "publicationTitle",
          "replaceField": "publicationTitle",
          "methodName": "replace",
          "searchType": "regex",
          "searchString": "/.*/g",
          "replaceType": "function",
          "replaceString": "(match) => match.toLowerCase()"
        },
        {
          "itemType": "journalArticle",
          "searchField": "publicationTitle",
          "replaceField": "abbr",
          "methodName": "replace",
          "searchType": "regex",
          "searchString": "/.*/g",
          "replaceType": "function",
          "replaceString": "(match) => match.toUpperCase()"
        },
        {
          "itemType": "journalArticle",
          "searchField": "abbr",
          "replaceField": "abbr",
          "methodName": "match",
          "searchType": "regex",
          "searchString": "/\\b\\w/g",
          "replaceType": "regex",
          "replaceString": ""
        },
        {
          "itemType": "journalArticle",
          "searchField": "abbr",
          "replaceField": "abbr",
          "methodName": "replace",
          "searchType": "regex",
          "searchString": "/ /g",
          "replaceType": "string",
          "replaceString": ""
        }
      ]
      ```
  
  	下面列举一些在 zotero 中常见条目的类型(注意大小写), 其中
  
  	-  如果 `searchField` 和 `replaceField` 值相同, 一旦替换了,原来的值就消失了,谨慎操作.
  
  	- `abbr` 为该插件的自定义字段, 即可把所有字段的处理后的结果归到`abbr`字段上, 避免误操作
  
      ```
      itemType         ---   searchField     ---->     replaceField
      --------------------------------------------------------------
      thesis           ---  university       ---->  university (abbr)
      book             ---  publisher        ---->  publisher (abbr)
      journalArticle   ---  publicationTitle ---->  journalAbbreviation (abbr)
      conferencePaper  ---  conferenceName   ---->  conferenceName (abbr)
      preprint         ---  repository       ---->  repository (abbr)
      bookSection      ---  publisher        ---->  publisher (abbr)
      ```
