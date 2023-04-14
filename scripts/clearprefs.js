const fs = require('fs');
const path = require('path');
const currentWorkingDirectory = process.cwd();
console.log(`当前工作目录：${currentWorkingDirectory}`);



// 个人配置文件的选取
const peizhi_name = 'testmy';
const package_file = './package.json';
const Field = "addonRef";  // 在 package.json 中要查找的字段

// 读取 package.json 文件

// 读取本地JSON文件
const package_data = JSON.parse(fs.readFileSync(package_file));
// 递归查找函数
function searchForKey(obj, key) {
  for (let k in obj) {
    if (k === key) {
      return obj[k];
    } else if (typeof obj[k] === 'object') {
      const result = searchForKey(obj[k], key);
      if (result !== undefined) {
        return result;
      }
    }
  }
}
// 调用递归查找函数
let Field_Value = searchForKey(package_data, Field);


let zotero_path = '';

if (process.platform === 'win32') {
  zotero_path = 'C:\\kk\\Zotero';
} else if (process.platform === 'darwin') {
  zotero_path = '/Applications/Zotero.app/Contents/MacOS/';
} else {
  throw new Error('不支持的操作系统');
}


let home_dir = '';

if (process.platform === 'darwin') {
    home_dir = path.join(process.env.HOME,'Library','Application Support','Zotero','Profiles');
} else if (process.platform === 'win32') {
    home_dir = path.join(process.env.APPDATA,'Zotero','Zotero','Profiles');
} else {
    throw new Error('不支持的操作系统');
}


console.log('zotero的配置文件夹:' + home_dir)


// readdirSync 它从文件系统中读取一个目录（home_dir）并返回一个数组，包含目录中的所有文件和文件夹(不包含子目录)。
// withFileTypes: true 选项将返回一个 fs.Dirent 对象的数组，而不是文件名或目录名的字符串。
const profileFolders = fs.readdirSync(home_dir, { withFileTypes: true });

// 找到 peizhi_name  所在的配置文件夹
const targetFolder = profileFolders.find(
    (folder) => folder.isDirectory() && folder.name.includes(peizhi_name)
);

console.log(`\n找到给定的${peizhi_name}配置文件名为:\n ${targetFolder.name}`)


if (targetFolder) {
   var zotero_config_dir = path.join(home_dir, targetFolder.name);
}

console.log(`\n具体的配置路径为: \n ${zotero_config_dir}`)



// 处理配置文件下的 prefs.js 文件
    
const prefsFile = path.join(zotero_config_dir, 'prefs.js');
if (!fs.existsSync(prefsFile)) {
    throw new Error(`文件 ${prefsFile} 不存在`);
}


const lines = fs.readFileSync(prefsFile, 'utf8').split('\n');// 将文件内容分割成行数组

// 使用 filter() 方法过滤包含 abbr 的带有 user_pref 的行
keywords = ['user_pref', 'zotero.' + Field_Value];
console.log('\n清楚配置文件中同时带有以下关键字的行:')
console.log(keywords)

const filteredLines = lines.filter(line => {
    return !(line.trim().startsWith(keywords[0]) && line.includes(keywords[1]));
});
// 显示清楚了多少行
console.log(`\n共清除了 ${lines.length - filteredLines.length} 行`)
// console.log(filteredLines)
// 将过滤后的行数组连接成新的文件内容
const newFileContent = filteredLines.join('\n');

// 将修改后的内容重写回文件
fs.writeFileSync(prefsFile, newFileContent, 'utf-8');

console.log('\n完成清除配置文件中的 journalabbr 配置项')


