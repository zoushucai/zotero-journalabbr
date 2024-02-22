Components.utils.import("resource://gre/modules/osfile.jsm");

//////////////////////// 这个文件中的参数,不涉及 Zotero, 全是字符串处理函数 //////////
// 也不知道取什么类名

class StringUtil {
  // 1. 删除字符串两边的空格, 以及删除成对的双引号或单引号
  static trimAndRemoveQuotes(str: string) {
    // 删除两边的空格, \s+ 是一个正则表达式，用于匹配一个或多个空白字符，
    // 而 /g 则是一个标志，表示全局匹配。
    str = str.replace(/\s+/g, " ");
    const trimmedStr = str.trim();

    // 删除成对的双引号或单引号
    let quoteRemovedStr = trimmedStr.replace(/^(["'])([\s\S]*?)\1$/, "$2");
    quoteRemovedStr = quoteRemovedStr.trim();
    return quoteRemovedStr;
  }

  //2. 判断一个字符串主要以中文为主还是英文为主
  static isMainlyChinese(text: string) {
    // 记录中文字符数量
    let chineseCount = 0;
    // 记录英文字符数量
    let englishCount = 0;
    // 记录其他字符数量
    let otherCount = 0;

    for (let i = 0; i < text.length; i++) {
      // 获取当前字符的编码
      let charCode = text.codePointAt(i);
      charCode = charCode as number;
      // 如果字符是代理项（surrogate），则跳过下一个字符
      if (charCode > 0xffff) {
        i++;
      }
      // 如果字符编码不在有效范围内，则抛出错误
      if (charCode < 0 || charCode > 0x10ffff) {
        throw new Error("Invalid character code");
      }

      // 判断字符是否为英文字符（包括大写和小写字母）
      if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)) {
        englishCount++;
      }
      // 判断字符是否为中文字符（包括简体和繁体）
      else if (charCode >= 0x4e00 && charCode <= 0x9fff) {
        chineseCount++;
      }
      // 判断字符是否为其他字符
      else {
        otherCount++;
      }
    }
    // 判断中文字符数量是否大于英文字符数量
    return chineseCount > englishCount;
  }

  //3. 把字符串 A 和字符 B 都替换为 C, 其实感觉没有必要,可以做两次替换
  static replaceStrings(str: string, str1: string, str2: string, replaceStr: string) {
    const pattern = new RegExp(`${str1}|${str2}`, "gi"); // 使用正则表达式创建匹配字符串的模式
    const replacedStr = str.replace(pattern, replaceStr); // 使用 replace() 方法进行替换
    return replacedStr; // 返回替换过的字符串
  }

  // 4.获取字符串的前 n 个单词或汉字
  static getFirstNWordsOrCharacters(text: string, n: number) {
    let regex;
    if (this.isMainlyChinese(text)) {
      // 匹配前 n 个汉字
      // 汉字的 Unicode 范围 \u4e00-\u9fa5
      regex = new RegExp(`^([\u4e00-\u9fa5]{1,${n}})`);
    } else {
      // 匹配前 n 个单词（英文）
      // \w+ 来匹配单词 ,  \W* 来匹配单词之间的非单词字符（如空格和标点符号
      regex = new RegExp(`^((?:\\w+\\W*){1,${n}})`);
    }

    const match = text.match(regex);

    if (match) {
      return match[1].trim();
    } else {
      return text.trim();
    }
  }

  //判断前缀是否存在某些特殊字符
  static checkPrefixSpecialChar(bib_prefix: string) {
    // 如果 bib_prefix 不是字符串，返回空字符串
    if (typeof bib_prefix !== "string" || bib_prefix === "") {
      return false;
    }
    // 前缀中存在 "[数字]",数字是 0-200 之间的整数
    //let match = new RegExp(/\[(0|[1-9]\d?|1\d{2}|200)\]/).test(bib_prefix);

    // 前缀中存在 "数字" 是 0-200 之间的整数 或 1700 -- 2099 之间的整数
    const match2 = new RegExp(/(0|[1-9]\d?|1\d{2}|200|1[7-9]\d{2}|20[0-9]\d)/).test(bib_prefix);
    if (match2) {
      return true;
    } else {
      return false;
    }
  }

  // 检查bib 的前缀是否符合规范
  static checkPrefix(bib_prefix: string, isaddprefix = true, prefixvalue = "") {
    // 查找字符串中的第一个空格在哪里
    const index = bib_prefix.search(/\s/);
    if (!isaddprefix) {
      prefixvalue = "";
    }
    // 如果找不到空格，
    if (index === -1) {
      // 是否包含特殊字符
      const ishaveSpecialChar = this.checkPrefixSpecialChar(bib_prefix);

      if (ishaveSpecialChar) {
        // 如果 bib_prefix 中有特殊字符，丢弃前缀, 返回prefixvalue
        return prefixvalue;
      } else {
        // 如果 bib_prefix 中没有特殊字符，返回 bib_prefix
        return prefixvalue + bib_prefix;
      }
    }

    // 如果找到空格，返回空格前面的字符串
    let bibwithSpeace = bib_prefix.slice(0, index);
    // 判断 bibwithSpeace 中是否包含特殊字符
    const ishaveSpecialChar = this.checkPrefixSpecialChar(bibwithSpeace);
    // 如果 bibwithSpeace 中有特殊字符，丢弃前缀, 返回prefixvalue
    if (ishaveSpecialChar) {
      bibwithSpeace = "";
    }
    const bibstr = prefixvalue + bibwithSpeace + bib_prefix.slice(index + 1, bib_prefix.length);
    return bibstr;
  }

  static escapeRegExp(string: string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // 将特殊字符前加上\
  }

  // 把一个文本,按指定字符串 A 和字符串 B 分割成三个字符串数组
  static splitStringByKeywords(text: string, stringA: string, stringB: string) {
    // 转义变量 A 和变量 B 中的特殊字符
    const escapedVariableA = this.escapeRegExp(stringA);
    const escapedVariableB = this.escapeRegExp(stringB);

    // 使用正则表达式，使得匹配时忽略大小写
    const regexA = new RegExp(`\\s${escapedVariableA}|^${escapedVariableA}`, "i");
    const regexB = new RegExp(`${escapedVariableB}`, "i");

    // 查找变量 A 和变量 B 在文本中的位置
    const indexA = text.search(regexA);
    const indexB = text.search(regexB);

    let part1, part2, part3;

    if (indexA !== -1 && indexB !== -1) {
      // 如果变量 A 和变量 B 都存在，则按照变量 A 和变量 B 的位置，将文本分割为三部分
      if (indexA < indexB) {
        part1 = text.slice(0, indexA);
        part2 = text.slice(indexA, indexB);
        part3 = text.slice(indexB);
      } else {
        return false;
        //console.error("变量 A 不在变量 B 之前，无法按要求分割文本。");
        //return [text, "", ""];
      }
    } else if (indexA !== -1) {
      // 如果只有变量 A 存在，则按照变量 A 的位置，将文本分割为三部分
      part1 = text.slice(0, indexA);
      part2 = text.slice(indexA);
      part3 = "";
    } else if (indexB !== -1) {
      // 如果只有变量 B 存在，则按照变量 B 的位置，将文本分割为三部分
      part1 = "";
      part2 = text.slice(0, indexB);
      part3 = text.slice(indexB);
    } else {
      return false;
      //console.error("无法按要求分割文本，变量 A 和变量 B 均不存在。");
      //return ["", "", text];
    }

    // 返回分割后的三段文本数组
    return [part1, part2, part3];
  }

  static sortColumns(arrays: any, sortByColumn = 0, ascending = true) {
    // 定义一个函数 sortColumns，它将对数组的多个列进行排序
    // arrays: 数组数组，包含要排序的多个列
    // sortByColumn: 数字，指定按哪一列排序，默认为 0
    // ascending: 布尔值，表示是否升序排列，默认为 true
    //
    // 检查输入参数是否符合要求
    // 如果 arrays 不是数组类型或其元素不全都是数组类型，则抛出一个类型错误
    if (!Array.isArray(arrays) || !arrays.every((arr) => Array.isArray(arr))) {
      throw new TypeError("输入参数必须是数组的数组");
    }

    // 如果数组中有任何两个子数组长度不相等，则抛出一个错误
    if (arrays.some((arr, i) => i > 0 && arr.length !== arrays[i - 1].length)) {
      throw new Error("所有输入数组必须具有相同的长度");
    }

    // 如果 sortByColumn 参数不在数组范围内，则抛出一个范围错误
    if (sortByColumn < 0 || sortByColumn >= arrays.length) {
      throw new RangeError("sortByColumn 参数超出范围");
    }

    // 获取将要排序的那一列，并根据 ascending 参数确定排序顺序
    const columnToSort = arrays[sortByColumn];
    const sortOrder = ascending ? 1 : -1;

    // 将 columnToSort 数组中的每个元素映射为其索引
    // 然后使用 sort 方法按索引排序，sort 方法返回已经排好序的索引数组
    const sortedIndices = columnToSort
      .map((value: any, index: any) => index)
      .sort((a: any, b: any) => {
        // 比较 columnToSort 数组中 a 和 b 两个位置的值
        // 通过 typeof 判断类型，如果是数字则直接比较大小，否则按字符串比较
        if (typeof columnToSort[a] === "number" && typeof columnToSort[b] === "number") {
          return (columnToSort[a] - columnToSort[b]) * sortOrder;
        }

        // 如果一个位置为 undefined，则将其视为空字符串，并将其作为较小值
        if (typeof columnToSort[a] === "undefined") return -1 * sortOrder;
        if (typeof columnToSort[b] === "undefined") return 1 * sortOrder;

        // 解析要比较的字符串为数字
        const numA = parseFloat(columnToSort[a]);
        const numB = parseFloat(columnToSort[b]);

        // 如果两个值都不是数字，则将它们视为字符串，并使用 localeCompare 方法进行比较
        if (isNaN(numA) && isNaN(numB)) {
          const strA = String(columnToSort[a]);
          const strB = String(columnToSort[b]);
          return strA.localeCompare(strB) * sortOrder;
        }

        // 如果其中一个值是 NaN，则将其作为较大值，以便排序
        if (isNaN(numA)) return 1 * sortOrder;
        if (isNaN(numB)) return -1 * sortOrder;

        // 如果两个值都是数字，则使用它们之间的差值进行比较
        return (numA - numB) * sortOrder;
      });

    // 返回重新排列后的输入数组
    return arrays.map((array) => sortedIndices.map((index: any) => array[index]));
  }

  // 把字符转为 Unicode 编码
  static toUnicode(input: string) {
    let result = "";
    for (let i = 0; i < input.length; i++) {
      // 获取每个字符的 Unicode 编码，并转换为16进制
      result += "\\u" + input.charCodeAt(i).toString(16);
    }
    return result;
  }

  static bibdiscardDOI(text: string) {
    text = text.trim();

    const doiRegex = /http[s]?:\/\/doi\.org\/[\w.-]+$/i; // 检查文本中是否存在 DOI
    const fianl_text = doiRegex.test(text) ? text.replace(doiRegex, "") : text;
    return fianl_text.trim();
  }
  //////////////////////////////////////////////
  //////// 参考文献格式化2 //////////
  // 根据语言替换 等和et al.
  static replaceStringByKeywords(text: string) {
    // If text is mainly Chinese, then replace "et al." with "等." and "and" with "和"
    // If text is mainly English, then replace "等." with "et al." and "和" with "and"
    // text is usually an author field

    if (this.isMainlyChinese(text)) {
      text = text.replace(/\bet al\.\b/, "等.");
      text = text.replace(/\band\b/, "和");
    } else {
      text = text.replace(/(等|\u7b49)\./u, "et al.");
      text = text.replace(/(和|\u548c)/u, "and");
    }
    const replacedStr = this.replaceStrings(text, "\\&", "&", "and");
    return replacedStr;
  }

  static handleBibtoFormat2(bib: string[], nkey: string, keyornum: string, bibprenum: number, isdiscardDOI: boolean) {
    // bib:string[] 必须是分成三个部分的字符串数组
    // nkey:string 为引用的关键字, 用于生成 \\bibitem{nkey} 的格式
    // keyornum:string 为引用格式, num为数字, key为关键字,
    //      如果为key, 则需要提供则是以 \\bibitem{nkey} 的格式
    //      如果为num, 则需要提供序号(由 bibprenum 提供), 则是以 [num] 的格式
    // bibprenum:number 为引用的序号, 只有当 keyornum 为 num 时才有用
    // isdiscardDOI:boolean 是否去除DOI
    const bibPrefix = bib[0].trim(); // 前缀

    let bibpre = "";
    if (keyornum === "num") {
      bibpre = "[" + bibprenum + "]";
    } else if (keyornum === "key") {
      bibpre = "\\bibitem{" + nkey + "}";
    } else {
      bibpre = "";
    }

    const bibPrefixNew = this.checkPrefix(bibPrefix, true, bibpre); // 检查前缀,是否提取出错?
    const bibAuthor = this.replaceStringByKeywords(bib[1]); // 对作者中的某些中英文进行替换

    let bibnew = bibPrefixNew + " " + bibAuthor + " " + bib[2];

    if (isdiscardDOI) {
      bibnew = this.bibdiscardDOI(bibnew);
    }
    bibnew = bibnew.replace(/[ ]+/g, " ");
    return bibnew;
  }

  //////// 参考文献格式化1 //////////
  // static replaceStringByKeywordsUnicode(text: string) {
  //     let final_text = "";
  //     let result = this.isMainlyChinese(text)
  //     if (result) {
  //         final_text = text.replace(/et al\./, "等.");
  //     } else {
  //         final_text = text.replace(/(等|\u7b49)\s*\./u, "et al.");
  //     }
  //     return final_text;
  // }
  static replaceStringByKeywordsUnicode(text: string) {
    // If text is mainly Chinese, then replace "et al." with "等."
    // If text is mainly English, then replace "等." with "et al." a
    // text is usually an author field
    const keyword = this.isMainlyChinese(text) ? "等." : "et al.";
    // Replace the matching pattern with the keyword
    return text.replace(keyword === "等." ? /et al\./ : /(等|\u7b49)\s*\./u, keyword);
  }

  static handleBibtoFormat1(text: string, nkey: string, keyornum: string, bibprenum: number, isdiscardDOI: boolean) {
    // text:string 是一个字符串
    // nkey:string 为引用的关键字, 用于生成 \\bibitem{nkey} 的格式
    // keyornum:string 为引用格式, num为数字, key为关键字,
    //      如果为key, 则需要提供则是以 \\bibitem{nkey} 的格式
    //      如果为num, 则需要提供序号(由 bibprenum 提供), 则是以 [num] 的格式
    // bibprenum:number 为引用的序号, 只有当keyornum为num时才有用
    // isdiscardDOI:boolean 是否去除DOI
    // ztoolkit.log(`handleBibtoFormat1: ${text}`)
    let successfulCount = false;
    let noActionCount = false;

    let bibpre = "";
    if (keyornum === "num") {
      bibpre = "[" + bibprenum + "]";
    } else if (keyornum === "key") {
      bibpre = "\\bibitem{" + nkey + "}";
    } else {
      bibpre = "";
    }

    text = text.trim();

    let fianl_text = "";
    const regex = /^(\[\d+\]|\d+\.|\(\d+\)|\\bibitem\{[0-9A-Za-z-]+?\})/;
    if (regex.test(text)) {
      // 如果找到了符合条件的模式，则使用 replace 方法进行替换
      fianl_text = text.replace(regex, bibpre);
      fianl_text = this.replaceStringByKeywordsUnicode(fianl_text);
      successfulCount = true;
    } else if (keyornum === "num") {
      fianl_text = bibpre + " " + text;
      successfulCount = true;
    } else {
      fianl_text = bibpre + " " + text;
      noActionCount = true;
      // ztoolkit.log("Bib noActionCount, the reason might be starting with the name of the author directly.");
    }

    if (isdiscardDOI) {
      fianl_text = this.bibdiscardDOI(fianl_text);
    }

    fianl_text = fianl_text.replace(/[ ]+/g, " ");
    return [fianl_text, successfulCount, noActionCount];
  }
}

// 导出所有函数
export { StringUtil };
