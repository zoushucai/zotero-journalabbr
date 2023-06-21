const fs = require('fs');
// 打印当前工作目录
console.log('Current working directory: ' + process.cwd());
// 更改当前工作目录
process.chdir('./iso4');


// 读取 CSV 文件
let ltwa = fs.readFileSync('LTWA_20170914-modified.csv', 'utf8');

// 存储为 JavaScript 变量
const jsContent = `const ltwa = \`${ltwa}\`; \n export { ltwa };`;

// 保存为 JavaScript 文件
fs.writeFileSync('ltwa.ts', jsContent, 'utf8');

// 把 ltwa.ts 文件复制到 src/modules 目录下
fs.copyFileSync('ltwa.ts', './../src/modules/ltwa.ts');




// 读取 txt 文件
let shortWords = fs.readFileSync('shortwords.txt', 'utf8');
// 存储为 JavaScript 变量
const jsContent2 = `const shortWords = \`${shortWords}\`; \n export { shortWords }`;
// 保存为 JavaScript 文件
fs.writeFileSync('shortwords.ts', jsContent2, 'utf8');
fs.copyFileSync('shortwords.ts', './../src/modules/shortwords.ts');


console.log('JavaScript file saved successfully.');

