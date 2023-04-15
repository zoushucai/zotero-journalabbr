
export async function isMainlyChinese(text: string): Promise<boolean> {
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
  



export async function splitStringByKeywords(text: string, stringA: string, stringB: string): Promise<string[]> {
    // 如果参数不是字符串，返回空数组
    if (typeof text !== 'string' || typeof stringA !== 'string' || typeof stringB !== 'string') {
        return [];
    }
    stringA = stringA.trim();
    stringB = stringB.trim();
    // 创建一个正则表达式，匹配字符串 A 和字符串 B（忽略大小写），前面带空格
    let regexA = new RegExp(`\\s${stringA}`, 'i');
    let regexB = new RegExp(`\\s${stringB}`, 'i');

    // 查找字符串 A 和字符串 B 的位置
    let indexA = text.search(regexA);
    let indexB = text.search(regexB);

    // 如果找不到字符串 A 或字符串 B，返回原始文本
    if (indexA === -1 || indexB === -1) {
        return [text];
    }

    // 如果字符串 A 的位置在字符串 B 的后面，返回空
    if (indexA > indexB) {
        return [];
    }

    // 切割字符串为三段
    let part1 = text.slice(0, indexA);
    let part2 = "";
    let part3 = "";
    // 下面等价  
    // 运算符 || 和空数组 [ ] 来避免出现 null 或 undefined 的情况。
    // 如果 text.match(regexA) 返回的是一个 RegExpMatchArray 类型的数组，则我们直接获取其中的第一个元素 matchA[0]；
    // 否则，我们返回一个空数组 [ ] 并取其中的第一个元素，由于空数组没有任何元素，因此取到的值就是 undefined。   
    //let matchA = text.match(regexA)[0];
    let matchA = (text.match(regexA) || [])[0];
    if (matchA === undefined) {
        part2 = text.slice(indexA, indexB);
    }else{
        part2 = text.slice(indexA + matchA.length, indexB);
    }
    
   
    //let matchB = text.match(regexB)[0];
    let matchB = (text.match(regexB) || [])[0];
    if (matchB === undefined) {
        part3 = text.slice(indexB);
    }else{
        part3 = text.slice(indexB + matchB.length);
    }

    return [part1, matchA + part2 , matchB + part3]; // 返回原始的字符串数组
}







export async function replaceStrings(str: string, str1:string , str2: string, replaceStr: string): Promise<string> {
    // 使用正则表达式创建匹配字符串的模式
    const pattern = new RegExp(`${str1}|${str2}`, "gi");
    
    // 使用 replace() 方法进行替换
    const replacedStr = str.replace(pattern, replaceStr);
    
    // 返回替换过的字符串
    return replacedStr;
}

// 获取字符串的前 n 个单词或汉字
export async function getFirstNWordsOrCharacters(text: string, n : number) {
    let regex;

    if (await isMainlyChinese(text)) {
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
        return match[1];
    } else {
        return text;
    }
}
  
export async function replaceStringByKeywords(text: string) {
    // If text is mainly Chinese, then replace "et al." with "等." and "and" with "和"
    // If text is mainly English, then replace "等." with "et al." and "和" with "and"
    // text is usually an author field

    if ( await isMainlyChinese(text)) {
        text = text.replace(/et al\./g, '等\.');
        text = text.replace(/and/g, '和');
    }else{
        text = text.replace(/等\./g, 'et al\.');
        text = text.replace(/和/g, 'and');
    }
    let replacedStr = await replaceStrings(text, "\\&", "&", "and");
    return replacedStr;
}



// 检查bib 的前缀是否符合规范
export async function checkPrefix(bib_prefix: string, isaddprefix = true, prefixvalue = "" ) {
    // 如果 bib_prefix 不是字符串，返回空字符串
    if (typeof bib_prefix !== 'string' || bib_prefix === "") {
        if (isaddprefix){
            return  prefixvalue + ""
        }else{
            return "";
        }
    }

    // 查找字符串中的第一个空格在哪里
    let index = bib_prefix.search(/\s/);
    // 如果找不到空格，返回原来的字符串
    if (index === -1) {
        if (isaddprefix){
            return  prefixvalue + bib_prefix
        }else{
            return bib_prefix;
        }
       
    }

    // 如果找到空格，返回空格前面的字符串
    let bibwithSpeace =  bib_prefix.slice(0, index);
    // 判断 bibwithSpeace 中是否有数字
    let bibwithSpeaceHasNumber = /\d/.test(bibwithSpeace);
    // 如果 bibwithSpeace 中有数字 , 则赋值为空
    if (bibwithSpeaceHasNumber) {
        bibwithSpeace =  "";
    }
    let bibstr = bibwithSpeace + bib_prefix.slice(index+1, bib_prefix.length);
    if (isaddprefix) { 
        return prefixvalue + bibstr;
    }else{
        return bibstr;
    }
}
