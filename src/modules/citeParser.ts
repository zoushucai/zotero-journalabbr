import { BasicExampleFactory } from "./examples";


Components.utils.import("resource://gre/modules/osfile.jsm");



// 删除字符串两边的空格, 以及删除成对的双引号或单引号
export function trimAndRemoveQuotes(str: string) {
    // 删除两边的空格, \s+ 是一个正则表达式，用于匹配一个或多个空白字符，
    // 而 /g 则是一个标志，表示全局匹配。
    str = str.replace(/\s+/g, ' ');
    let trimmedStr = str.trim();
 
    // 删除成对的双引号或单引号
    let quoteRemovedStr = trimmedStr.replace(/^(["'])([\s\S]*?)\1$/, '$2');
    quoteRemovedStr = quoteRemovedStr.trim();
    return quoteRemovedStr;
 }



export function isMainlyChinese(text: string) {
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
        if (charCode > 0xFFFF) {
            i++;
        }
        // 如果字符编码不在有效范围内，则抛出错误
        if (charCode < 0 || charCode > 0x10FFFF) {
            throw new Error('Invalid character code');
        }
  
        // 判断字符是否为英文字符（包括大写和小写字母）
        if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)) {
            englishCount++;
        }
        // 判断字符是否为中文字符（包括简体和繁体）
        else if (charCode >= 0x4E00 && charCode <= 0x9FFF) {
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
  









export  function replaceStrings(str: string, str1:string , str2: string, replaceStr: string) {
    // 使用正则表达式创建匹配字符串的模式
    const pattern = new RegExp(`${str1}|${str2}`, "gi");
    
    // 使用 replace() 方法进行替换
    const replacedStr = str.replace(pattern, replaceStr);
    
    // 返回替换过的字符串
    return replacedStr;
}

// 获取字符串的前 n 个单词或汉字
export  function getFirstNWordsOrCharacters(text: string, n : number) {
    let regex;

    if (isMainlyChinese(text)) {
        // 匹配前 n 个汉字
        // 汉字的 Unicode 范围 \u4e00-\u9fa5 
        regex = new RegExp(`^([\u4e00-\u9fa5]{1,${n}})`);
    } else {
        // 匹配前 n 个单词（英文）
        // \w+ 来匹配单词 ,  \W* 来匹配单词之间的非单词字符（如空格和标点符号
        regex = new RegExp(`^((?:\\w+\\W*){1,${n}})`);
    }

    let match = text.match(regex);

    if (match) {
        return match[1].trim();
    } else {
        return text.trim();
    }
}
  
export  function replaceStringByKeywords(text: string) {
    // If text is mainly Chinese, then replace "et al." with "等." and "and" with "和"
    // If text is mainly English, then replace "等." with "et al." and "和" with "and"
    // text is usually an author field

    if (isMainlyChinese(text)) {
        text = text.replace(/et al\./g, '等\.');
        text = text.replace(/and/g, '和');
    }else{
        text = text.replace(/等\./g, 'et al\.');
        text = text.replace(/和/g, 'and');
    }
    let replacedStr = replaceStrings(text, "\\&", "&", "and");
    return replacedStr;
}


//判断前缀是否存在某些特殊字符
export  function checkPrefixSpecialChar(bib_prefix: string) {
    // 如果 bib_prefix 不是字符串，返回空字符串
    if (typeof bib_prefix !== 'string' || bib_prefix === "") {
        return  false;
    }
    // 前缀中存在 "[数字]",数字是 0-200 之间的整数
    //let match = new RegExp(/\[(0|[1-9]\d?|1\d{2}|200)\]/).test(bib_prefix);
    
    // 前缀中存在 "数字" 是 0-200 之间的整数 或 1700 -- 2099 之间的整数
    let match2 = new RegExp(/(0|[1-9]\d?|1\d{2}|200|1[7-9]\d{2}|20[0-9]\d)/).test(bib_prefix);
    if (match2) {
        return  true;
    }else{
        return false;
    }

}
// 检查bib 的前缀是否符合规范
export  function checkPrefix(bib_prefix: string, isaddprefix = true, prefixvalue = "" ) {
    // 查找字符串中的第一个空格在哪里
    let index = bib_prefix.search(/\s/);
    if (!isaddprefix){
        prefixvalue="";
    } 
    // 如果找不到空格，
    if (index === -1) {
        // 是否包含特殊字符
        let ishaveSpecialChar = checkPrefixSpecialChar(bib_prefix);

        if ( ishaveSpecialChar ){
            // 如果 bib_prefix 中有特殊字符，丢弃前缀, 返回prefixvalue
            return  prefixvalue 
        }else{
            // 如果 bib_prefix 中没有特殊字符，返回 bib_prefix
            return prefixvalue + bib_prefix;
        }
    }

    // 如果找到空格，返回空格前面的字符串
    let bibwithSpeace =  bib_prefix.slice(0, index);
    // 判断 bibwithSpeace 中是否包含特殊字符
    let ishaveSpecialChar = checkPrefixSpecialChar(bibwithSpeace);
    // 如果 bibwithSpeace 中有特殊字符，丢弃前缀, 返回prefixvalue
    if (ishaveSpecialChar) {
        bibwithSpeace =  "";
    }
    let bibstr = prefixvalue + bibwithSpeace + bib_prefix.slice(index+1, bib_prefix.length);
    return bibstr;
}


export function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // 将特殊字符前加上\
  }
  
export function splitStringByKeywords(text, variableA, variableB) {
    // 转义变量 A 和变量 B 中的特殊字符
    const escapedVariableA = escapeRegExp(variableA);
    const escapedVariableB = escapeRegExp(variableB);

    // 使用正则表达式，使得匹配时忽略大小写
    const regexA = new RegExp(`\\s${escapedVariableA}|^${escapedVariableA}`, 'i');
    const regexB = new RegExp(`${escapedVariableB}`, 'i');

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
      part1 = ""
      part2 = text.slice(0, indexB);;
      part3 = text.slice(indexB);
    } else {
      return false;
      //console.error("无法按要求分割文本，变量 A 和变量 B 均不存在。");
      //return ["", "", text];
    }
  
    // 返回分割后的三段文本数组
    return [part1, part2, part3];
  }

