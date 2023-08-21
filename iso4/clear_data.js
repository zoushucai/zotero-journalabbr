// 利用 iso-4 标准检查 ./src/modules/data.js 中的数据,
// 如果 iso-4 标准得出的数据与 ./src/modules/data.js 中的数据不一致,则保留 ./src/modules/data.js 中的数据
// 如果 iso-4 标准得出的数据与 ./src/modules/data.js 中的数据一致,则清空 ./src/modules/data.js 中的数据
// 这样做的目的是减少 ./src/modules/data.js 中的数据量, 以便减少内存占用

const fs = require("fs");
// const path = require('path');

// 0.查看工作目录
console.log("当前工作目录" + process.cwd());

// 当前文件所在目录设置为工作目录
process.chdir(__dirname);
console.log("更改后的工作目录:" + process.cwd());

// // 1. 加载 data.js
// file = '/Users/zsc/Desktop/mygithub/zotero-journalabbr/src/modules/data.ts'
// // // 把 file 拷贝到当前目录
// destFile = './data.js';
// fs.copyFileSync(file, destFile);

// 1.加载 data.js
let { journal_abbr } = require("./data.js");

// 2. 加载 iso4 标准

let AbbrevIso = require("./nodeBundle.js");
let ltwa = fs.readFileSync("LTWA_20170914-modified.csv", "utf8");
let shortWords = fs.readFileSync("shortwords.txt", "utf8");
let abbrevIso = new AbbrevIso.AbbrevIso(ltwa, shortWords);

// let s = 'International Journal of Geographical Information Science';
// console.log(abbrevIso.makeAbbreviation(s));
s = "autonomous robots";
console.log(abbrevIso.makeAbbreviation(s));
// 3. 对比数据

const keys = Object.keys(journal_abbr);
let toDelete = [];
for (let i = 0; i < keys.length; i++) {
  let key = keys[i];
  let value = journal_abbr[key];
  value = value.toLowerCase().trim();
  let abbr = abbrevIso.makeAbbreviation(key);
  abbr = abbr.toLowerCase().trim();
  if (abbr === value) {
    toDelete.push(key);
  }
  // 显示一个进度条
  if (i % 1000 === 0) {
    console.log(`进度: ${i} / ${keys.length}`);
  }
}

// 删除条目
for (let key of toDelete) {
  delete journal_abbr[key];
}

console.log(`已删除${toDelete.length}个条目。`);
// 4. 保存数据

let jsContent = `const journal_abbr = ${JSON.stringify(
  journal_abbr,
  null,
  2,
)}; \n 
export { journal_abbr };
`;
fs.writeFileSync("datanew.js", jsContent, "utf8");
