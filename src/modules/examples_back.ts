import { config } from "../../package.json";
import { getString } from "./locale";
import { journal_abbr } from "./data";
import {
  splitStringByKeywords, 
  checkPrefix, 
  replaceStringByKeywords,
  getFirstNWordsOrCharacters
} from "./citeParser";

Components.utils.import("resource://gre/modules/osfile.jsm");

function example(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any) {
    try {
      ztoolkit.log(`Calling example ${target.name}.${String(propertyKey)}`);
      return original.apply(this, args);
    } catch (e) {
      ztoolkit.log(`Error in example ${target.name}.${String(propertyKey)}`, e);
      throw e;
    }
  };
  return descriptor;
}

export class BasicExampleFactory {
  // 显示状态
  @example
  static ShowStatus(totol: number, sucess: number, str: string) {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: " " + sucess + "/" + totol + " " + str,
        type: "success",
        progress: 100,
      })
      .show();
  }
    
  // 失败状态
  @example
  static ShowError(str: string) {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: str,
        type: "fail",
        progress: 100,
      })
      .show();
  }

  // 通知 1
  @example
  static ShowPopUP( descInfo:string, headerInfo: string = getString(`${config.addonRef}`) , n: number = 2500)  {  
    var progressWindow = new Zotero.ProgressWindow({closeOnClick:true});
    progressWindow.changeHeadline(headerInfo);
    progressWindow.addDescription(descInfo);
    progressWindow.show();
    progressWindow.startCloseTimer(n);
  }
  // 通知 2
  @example
  static ShowInfo(str: string) {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: str,
        type: "success",
        progress: 100,
      })
      .show();
  }

  // 选择地址,
  @example  
  static async filePickerExample() {
  const path = await new ztoolkit.FilePicker(
    "Import File",
    "open",
    [
      ["CSV File(*.csv)", "*.csv"],
      ["Any(*.*)", "*"]
    ]
  ).open();
  
  // 判断选择的地址是否为空,以及是否为字符串 false 
  if (typeof path === "string") {
    if (path === 'false' || path === "" || path === null || path === undefined || path === "undefined" || path === "null") {
      return null;
    }else{
      return path;
    }
  }else {
    return null;
  }
  //ztoolkit.getGlobal("alert")(`Selected ${path}`);
  }


  // 初始化设置
  @example 
  static async initPrefs () {
    const initpref_data = {
        [config.addonRef+".input"]:  Zotero.Prefs.get('dataDir'),
        [config.addonRef+".separator"]: ","
    };

    // Check if preference is already set and set it if not
    for (let p in initpref_data) {
      if (typeof Zotero.Prefs.get(p) === "undefined") {
        Zotero.Prefs.set(p,  initpref_data[p] as string);
      }
    }
  }
  
  ////////////////////////
  ///// 以下是模板自带的 ///
  ////////////////////////
  @example
  static registerNotifier() {
    const callback = {
      notify: async (
        event: string,
        type: string,
        ids: number[] | string[],
        extraData: { [key: string]: any }
      ) => {
        if (!addon?.data.alive) {
          this.unregisterNotifier(notifierID);
          return;
        }
        addon.hooks.onNotify(event, type, ids, extraData);
      },
    };

    // Register the callback in Zotero as an item observer
    const notifierID = Zotero.Notifier.registerObserver(callback, [
      "tab",
      "item",
      "file",
    ]);

    // Unregister callback when the window closes (important to avoid a memory leak)
    window.addEventListener(
      "unload",
      (e: Event) => {
        this.unregisterNotifier(notifierID);
      },
      false
    );
  }

  @example
  static exampleNotifierCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Open Tab Detected!",
        type: "success",
        progress: 100,
      })
      .show();
  }

  @example
  private static unregisterNotifier(notifierID: string) {
    Zotero.Notifier.unregisterObserver(notifierID);
  }

  @example
  static registerPrefs() {
    const prefOptions = {
      pluginID: config.addonID,
      src: rootURI + "chrome/content/preferences.xhtml",
      label: getString("prefs.title"),
      image: `chrome://${config.addonRef}/content/icons/favicon.png`,
      extraDTD: [`chrome://${config.addonRef}/locale/overlay.dtd`],
      defaultXUL: true,
    };
    ztoolkit.PreferencePane.register(prefOptions);
  }
}

export class UIExampleFactory {
  // 分割条
  @example
  static registerRightClickMenuSeparator() {
    ztoolkit.Menu.register("item", {
      tag: "menuseparator",
      id: "zotero-itemmenu-separator",
    });
  }
  // 右键菜单: 期刊缩写
  @example
  static registerRightClickMenuPopup() {
    const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`;
    ztoolkit.Menu.register(
      "item",
      {
        tag: "menu",
        label: getString("menupopup.label"), //期刊缩写
        id: "zotero-itemmenu-abbr-journal",
        children: [
          {
            tag: "menuitem",
            label: getString("menuitem.updateUserAbbr"), // 子菜单: 用户指定期刊缩写路径
            id: "zotero-itemmenu-abbr-journal-updateUserAbbr",
            commandListener: (ev) => HelperAbbrFactory.updateJournalAbbreviationUseUserData(),
          },
          {
            tag: "menuitem",
            label: getString("menuitem.updatejournal"), // 子菜单: 更新简写期刊
            id: "zotero-itemmenu-abbr-journal-updatejournal",
            commandListener: (ev) => HelperAbbrFactory.updateJournalAbbreviationUseInnerData(),
          },
          //添加分割条
          {
            tag: "menuseparator",
          },
          {
            tag: "menuitem",
            label: getString("menuitem.abbrToupper"), // 子菜单: 简写期刊大写
            id: "zotero-itemmenu-abbr-journal-abbrToupper",
            commandListener: (ev) => HelperAbbrFactory.journalAbbreviationToUpperCase(),
          },
          {
            tag: "menuitem",
            label: getString("menuitem.abbrTolower"), // 子菜单: 简写期刊小写
            id: "zotero-itemmenu-abbr-journal-abbrTolower",
            commandListener: (ev) => HelperAbbrFactory.journalAbbreviationToLowerCase(),
          },
          {
            tag: "menuitem",
            label: getString("menuitem.abbrTocapitalize"), // 子菜单: 简写期刊首字母大写
            id: "zotero-itemmenu-abbr-journal-abbrTocapitalize",
            commandListener: (ev) => HelperAbbrFactory.journalAbbreviationToCapitalize(),
          },
          {
            tag: "menuitem",
            label: getString("menuitem.removeAbbrdot"), // 子菜单: 移除简写期刊中的点
            id: "zotero-itemmenu-abbr-journal-removeAbbrdot",
            commandListener: (ev) => HelperAbbrFactory.removeJournalAbbreviationDot(),
          },
          {
            tag: "menuitem",
            label: getString("menuitem.exchange"), // 子菜单: 交换期刊名
            id: "zotero-itemmenu-abbr-journal-exchange",
            commandListener: (ev) => HelperAbbrFactory.exchangeJournalName(),
          },
          //添加分割条
          {
            tag: "menuseparator",
          },
          {
            tag: "menuitem",
            label: getString("menuitem.deleteAbbrTag"), // 子菜单: 删除abbr标签
            id: "zotero-itemmenu-abbr-journal-deleteAbbrTag",
            commandListener: (ev) => HelperAbbrFactory.removeTagByName(['abbr']),
          },
          {
            tag: "menuitem",
            label: getString("menuitem.deleteUserTag"), // 子菜单: 删除 abbr_user 标签
            id: "zotero-itemmenu-abbr-journal-deleteUserTag",
            commandListener: (ev) => HelperAbbrFactory.removeTagByName(['abbr_user']),
          },
          {
            tag: "menuseparator",
          },
          {
            tag: "menuitem",
            label: getString("menuitem.selectFile"), // 子菜单: 选择文件
            id: "zotero-itemmenu-abbr-journal-selectFile",
            commandListener: (ev) => HelperAbbrFactory.buttonSelectFilePath(),
          },
          // {
          //   tag: "menuitem",
          //   label: getString("menuitem.updateCollection"), // 子菜单: 文件夹期刊缩写
          //   id: "zotero-itemmenu-abbr-journal-updateCollection",
          //   commandListener: (ev) => HelperAbbrFactory.updateCollection(),
          // },
        ],
      },
    );
  }

  // // 右键菜单: 用来测试新功能用,  用完后可以删除
  // // 右键菜单: 一键更新期刊缩写
  @example
  static registerRightClickMenuItem() {
    //const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`;
    // item menuitem with icon
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      id: "zotero-itemmenu-abbr-journal-onestepupate",
      label: getString("menuitem.onestepupate"),
      //icon: menuIcon,
      commandListener: (ev) => HelperAbbrFactory.getbibliography2(),
    });
  }
  
  // 右键菜单: 一键 生成带有 \\bibitem{citeKey} bibliography  的期刊
  @example
  static registerRightClickMenuItemBibitem() {
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      id: "zotero-itemmenu-abbr-journal-bibliography",
      label: getString("menuitem.bibliography"),
      commandListener: (ev) => HelperAbbrFactory.getbibliography(),
    });
  }
}


export class HelperAbbrFactory {

  // 简写期刊大写 ----  根据 journalAbbreviation 的字段进行特殊转换
  static async journalAbbreviationToUpperCase() {
   try {
    const selectedItems = Zotero.getActiveZoteroPane().getSelectedItems(); 
    if(0 == selectedItems.length){
        BasicExampleFactory.ShowStatus(0, 0, getString("prompt.success.abbrToupper.info"));
        return;
    }

    const updateResults = await Promise.all(selectedItems.map(async (item) => {
      const originalAbbr = item.getField('journalAbbreviation') as string;

      // Checking if the current abbreviation is not empty, null, or undefined
      if (originalAbbr) {
        const current = originalAbbr.toUpperCase();

        // If the current is different from the original, update the item's journal abbreviation field
        if (current !== originalAbbr) {
          item.setField("journalAbbreviation", current);
          await item.saveTx();
          //return true; // Return true to indicate a replaced item
        }
        return true; // 也表示已经替换成功
      }
      return false; // Return false to indicate no replacement occurred
    }));
  
    // Calculate the total number of replaced items using reduce
    const successCount = updateResults.filter(Boolean).length;
    BasicExampleFactory.ShowStatus(selectedItems.length, successCount, getString("prompt.success.abbrToupper.info"));
 } catch (error) {
   BasicExampleFactory.ShowError(getString("prompt.error.execution.info"));
 }
 return;
}

// 简写期刊小写  ----- 根据 journalAbbreviation 的字段进行特殊转换
static async journalAbbreviationToLowerCase() {
  try {
    const selectedItems = Zotero.getActiveZoteroPane().getSelectedItems(); 
    if(0 == selectedItems.length){
      BasicExampleFactory.ShowStatus(0, 0, getString("prompt.success.abbrToupper.info"));
      return;
    }

  const updateResults = await Promise.all(selectedItems.map(async (item) => {
    const originalAbbr = item.getField('journalAbbreviation') as string;
    if (originalAbbr) {
      const current = originalAbbr.toLowerCase();
      if (current !== originalAbbr) {
        item.setField("journalAbbreviation", current);
        await item.saveTx();
      }
      return true; 
    }
    return false; 
  }));

  const successCount = updateResults.filter(Boolean).length; 
  BasicExampleFactory.ShowStatus(selectedItems.length, successCount, getString("prompt.success.abbrTolower.info"))
 } catch (error) {
  BasicExampleFactory.ShowError(getString("prompt.error.execution.info"));
}
}

//简写期刊首字母化 ---- 根据 journalAbbreviation 的字段进行特殊转换
static async journalAbbreviationToCapitalize() {
 try {
  const selectedItems = Zotero.getActiveZoteroPane().getSelectedItems(); 
  if(0 == selectedItems.length){
    BasicExampleFactory.ShowStatus(0, 0, getString("prompt.success.abbrToupper.info"));
    return;
  }

  const updateResults = await Promise.all(selectedItems.map(async (item) => {
    const originalAbbr = item.getField('journalAbbreviation')  as string;
    if (originalAbbr) {
      const current =  originalAbbr.replace(/(?:^|\s)\S/g, function(firstChar: string) {
        return firstChar.toUpperCase();
      });
      if (current !== originalAbbr) {
        item.setField("journalAbbreviation", current);
        await item.saveTx();
      }
      return true; 
    }
    return false; 
  }));
  const successCount = updateResults.filter(Boolean).length;

  BasicExampleFactory.ShowStatus(selectedItems.length, successCount, getString("prompt.success.abbrTocapitalize.info"))
 } catch (error) {
  BasicExampleFactory.ShowError(getString("prompt.error.execution.info"));
 }
}

// 移除简写期刊中的点
static async removeJournalAbbreviationDot() {
 try {
    const selectedItems = Zotero.getActiveZoteroPane().getSelectedItems(); 
    if(0 == selectedItems.length){
      BasicExampleFactory.ShowStatus(0, 0, getString("prompt.success.abbrToupper.info"));
      return;
    }

    const updateResults = await Promise.all(selectedItems.map(async (item) => {
      const originalAbbr = item.getField('journalAbbreviation')  as string;
      if (originalAbbr) {
        const current =  originalAbbr.replace(/\./g, "");
        if (current !== originalAbbr) {
          item.setField("journalAbbreviation", current);
          await item.saveTx();
        }
        return true; 
      }
      return false; 
    }));
    const successCount = updateResults.filter(Boolean).length;

    BasicExampleFactory.ShowStatus(selectedItems.length, successCount, getString("prompt.success.removeAbbrdot.info"))
 } catch (error) {
  BasicExampleFactory.ShowError(getString("prompt.error.execution.info"));
 }
 return;
}

// 根据标签名称, 删除对应的标签
static async removeTagByName(usertags: string[]) {
   try {
    //获取 Zotero 窗口,并获取选中的条目信息， items包含所选条目的所有字段信息
    const selectedItems = Zotero.getActiveZoteroPane().getSelectedItems(); 
    if(0 == selectedItems.length){
      BasicExampleFactory.ShowStatus(0, 0, getString("prompt.success.abbrToupper.info"));
      return;
    }

    const results = await Promise.all(selectedItems.map(async (item) => {
      const nf = item.removeTag(usertags[0]);
      if (nf) {
        await item.saveTx();
        return true;
      } else {
        return false;
      }
    }));
    const successCount = results.filter(Boolean).length;

    BasicExampleFactory.ShowStatus(selectedItems.length, successCount, getString("prompt.success.removetag.info")+': '+usertags[0])
 } catch (error) {
   //BasicExampleFactory.ShowError('删除'+usertags[0] + '标签失败') 
   BasicExampleFactory.ShowError(getString("prompt.error.removetag.info")+': '+ usertags[0] );

 }
}

// 交换期刊名 --- 即简写期刊与期刊名互换
static async exchangeJournalName() {
 try {
  const selectedItems = Zotero.getActiveZoteroPane().getSelectedItems(); 
  if(0 == selectedItems.length){
    BasicExampleFactory.ShowStatus(0, 0, getString("prompt.success.abbrToupper.info"));
    return;
  }
  const tagName = 'exchange';
  const updateResults = await Promise.all(selectedItems.map(async (item) => {
    const currentabbr = item.getField('journalAbbreviation');
    const currentjournal = item.getField('publicationTitle');
    item.setField('journalAbbreviation', currentjournal);
    item.setField('publicationTitle', currentabbr);
    await item.saveTx();

    const tagExists = item.getTags().some((tag) => tag.tag === tagName); // some() 方法遍历该数组, 并返回一个布尔值, 表示是否有元素满足提供的函数
    if (tagExists) {
      item.removeTag(tagName);
    } else {
      item.addTag(tagName);
    }
    await item.saveTx();
    return true;
  }));
  const successCount = updateResults.filter(Boolean).length;

  BasicExampleFactory.ShowStatus(selectedItems.length, successCount, getString("prompt.success.exchange.info"))
 } catch (error) {
  BasicExampleFactory.ShowError(getString("prompt.error.exchange.info"));
}
 return;
}

// 绑定按钮事件 
@example
static async buttonSelectFilePath() {
  var mypath = await BasicExampleFactory.filePickerExample();
  // 判断选择的地址是否为空
  if (!mypath) {
    BasicExampleFactory.ShowPopUP(getString("prompt.show.cancel.selectpath.info"))
  }else{
    await Zotero.Prefs.set(`${config.addonRef}.input`, mypath);
    BasicExampleFactory.ShowPopUP(getString("prompt.show.success.selectpath.info")+ getString(`${mypath}`))
  }
}

// 删除字符串两边的空格, 删除成对的双引号或单引号
static async trimAndRemoveQuotes(str: string) {
   // 删除两边的空格, \s+ 是一个正则表达式，用于匹配一个或多个空白字符，
   // 而 /g 则是一个标志，表示全局匹配。
   str = str.replace(/\s+/g, ' ');
   let trimmedStr = str.trim();

   // 删除成对的双引号或单引号
   let quoteRemovedStr = trimmedStr.replace(/^(["'])([\s\S]*?)\1$/, '$2');
   quoteRemovedStr = quoteRemovedStr.trim();
   return quoteRemovedStr;
}

 // 读取 csv 文件并解析
 @example
 static async readAndParseCSV(filePath: string, delimiter: string = ',') {
  try {
    const csvContent = await Zotero.File.getContentsAsync(filePath) as string;
    const lines = csvContent.trim().split('\n');
    const data: {[key: string]: any} = {};
    const errors: any[] = [];

    await Promise.all(lines.map(async (line, i) => {
      let currentLine = line.split(delimiter);
      if (currentLine.length != 2) {
        errors.push(i + 1);
        return;
      }
      let key = await this.trimAndRemoveQuotes(currentLine[0]);
      key = key.toLowerCase();
      let value = await this.trimAndRemoveQuotes(currentLine[1]);

      if(!key || !value){
          errors.push(i + 1);
      }

      if (!data.hasOwnProperty(key) && key != "" && value != "") {
      data[key] = value; // 重复以先前的为准
      }
    }));
    if (errors.length > 0 ) {
      //console.log(errors)
      if(errors.length > 5){
        BasicExampleFactory.ShowError(getString("prompt.show.readfile.more.info") +" " + errors.length);
      }else{
        BasicExampleFactory.ShowError(getString("prompt.show.readfile.less.info") + " "+ errors.join(', '));
      }
    }
    return data;
  } catch (error) {
    BasicExampleFactory.ShowError(getString("prompt.error.readfile.info"));
    return null;
  }
}


/////////////////////////////////
// 更新期刊缩写 ///////////////////
////////////////////////////////

// 定义一个共用的函数, 用于更新期刊缩写, 传递的第一个参数为数据, 第二个参数为数组字符串
// 这个数据的要求: 数据集在 js 中是一个字典对象,  第一列key为原始期刊名(全部是小写且删除多余的空格), 第二列value为缩写
// 第二个参数为进行期刊缩写的条目添加给定的标签, 用于标记识别
static async updateJournalAbbr(
  data: { [key: string]: any }, 
  addtagsname: string[], 
  removetagsname: string[], 
  successinfo: string, 
  errorinfo: string
) {
 try {
   //1. 先获取选择的条目
   var items = Zotero.getActiveZoteroPane().getSelectedItems(); //items包含所选条目的所有字段信息
   //2. 判断是否有条目被选中
   if (items.length === 0) {
    BasicExampleFactory.ShowStatus(items.length, 0, successinfo);
    return;
  }

  const tasks = items.map(async (item) => {
    let currentjournal = item.getField('publicationTitle'); //1. 字段精确查询 
    if (!currentjournal) {
      return ;
    }

    currentjournal = currentjournal as string;
    currentjournal = currentjournal.trim().toLowerCase(); //2. 转换为小写, 删除多余的空格
    currentjournal = currentjournal.replace(/\s+/g, ' ').trim();

    if (currentjournal == "" || currentjournal == null || currentjournal == undefined) {
      return ;
    }

    if (data.hasOwnProperty(currentjournal)) {
      item.setField("journalAbbreviation", data[currentjournal]);
      //await item.saveTx();

      // 对条目的标签进行处理
      const addtags = addtagsname[0];
      const removetags = removetagsname[0];
            
      let tags = item.getTags(); //获取条目的所有标签

      // 如果条目没有标签, 则直接添加
      if (tags.length === 0) {
        item.addTag(addtags);
        return true;
      }

       // 如果准备移除的标签存在, 则移除, 如果准备添加的标签不存在, 则添加
      for (const tag of tags) {
        // 如果准备移除的标签存在, 则移除
        if (tag.tag === removetags) {
          item.removeTag(removetags);
          break;
        }
      }

      // 检查准备添加的标签是否存在
      let tagExists = false;
      for (const tag of tags) {
        if (tag.tag === addtags) {
          tagExists = true;
          break;
        }
      }
      // 如果标签不存在, 则添加
      if (!tagExists) {
        item.addTag(addtags); // 表示这些期刊进行了自动期刊缩写
      }
      await item.saveTx();
      return true;
    }
    return ;
  });

  const results = await Promise.all(tasks);
  const updateCount = results.filter(result => result).length; //筛选出成功更新的数量
  BasicExampleFactory.ShowStatus(items.length, updateCount, successinfo);
  
 } catch (error) {
  BasicExampleFactory.ShowError(errorinfo);
 }
 return;
}


// 1. 使用内部数据集进行更新
static async updateJournalAbbreviationUseInnerData() {
 await this.updateJournalAbbr(
  journal_abbr, 
  ['abbr'], 
  ['abbr_user'], 
  getString("prompt.success.updatejournal.inner.info"), 
  getString("prompt.error.updatejournal.inner.info")
  )
}

//2 . 使用用户数据集进行更新
static async updateJournalAbbreviationUseUserData() {
 try {
   //Zotero.Prefs.set("journalabbr.userpath", zoteroProfileDir); // 持久化设置
   var userfile = await Zotero.Prefs.get(`${config.addonRef}.input`); // 获得持久化的变量
   // 获得持久化变量,分隔符号

   if(userfile == "" || userfile == null || userfile == undefined){
     BasicExampleFactory.ShowError('所选文件为空')
     return;
   }
   userfile = userfile as string; // 强制断言为字符串类型
   // 1. 根据后缀名判断是否为 csv 文件
    if(userfile.endsWith(".csv") == false){
      BasicExampleFactory.ShowError('请先选择 csv 文件');
      return;
    }
    // 2. 读取用户数据集, 以及数据的分割符号
   var pref_separator = await Zotero.Prefs.get(`${config.addonRef}.separator`); // 获得持久化的变量
   pref_separator = pref_separator as string; // 强制断言为字符串类型

   // 3. 读取 csv 文件, 并解析为字典对象
   var user_abbr_data = await this.readAndParseCSV(userfile, pref_separator);

   // 4.判断返回的 user_abbr_data 的类型
   if(typeof user_abbr_data != "object" || user_abbr_data == null || user_abbr_data == undefined){
     BasicExampleFactory.ShowError('读取 csv 文件失败, 可能不存在该文件或文件未按指定格式书写!');
     return;
   }

   // 5. 更新期刊缩写 -- 返回的信息为 已有 2/2 条目缩写更新
   await this.updateJournalAbbr(
    user_abbr_data, 
    ['abbr_user'], 
    ['abbr'],
    getString("prompt.success.updatejournal.user.info"), 
    getString("prompt.error.updatejournal.user.info")
  );
 } catch (error) {
   BasicExampleFactory.ShowError(getString("prompt.error.updatejournal.user.info"))
 }
}

static async oneStepUpdate(){
  // 
  // var aa = await Zotero.Prefs.get(`${config.addonRef}.separator`); // 获得持久化的变量
  // ztoolkit.getGlobal("alert")(`hhhh==kk${aa}`)
  //
  // 1. 一键更新期刊, 先使用内部数据集,在使用自定义数据集, 
  await this.updateJournalAbbreviationUseInnerData();
  await this.updateJournalAbbreviationUseUserData();
}




// 定义一个获取参考文献的异步函数
static async getbibliography(){
  try {
    // 获取参考文献的默认格式
    const format =  this.getQuickCopyFormat();
    if (!format) return;

    //  获取选定的 Zotero 条目
    const selectedItems = await Zotero.getActiveZoteroPane().getSelectedItems();
    if (selectedItems.length == 0) {
      BasicExampleFactory.ShowInfo("No items are selected.");
      return;
    }
  
    //  为选定的每个项目创建一个 bibTasks 数组，其中包含异步操作
    const bibTasks = selectedItems.map(async (item) => {
      if (!item.isRegularItem()) return ""; // 如果 item 不是一个规则的条目，返回空字符串
      
      // 获取当前条目的参考文献信息
      const biblio = await Zotero.QuickCopy.getContentFromItems([item], format);
      if (!biblio) return { type: "missingInfo" }; // 如果获取失败，返回 missingInfo 类型

      const biblioTxt = await biblio.text;
      if (!biblioTxt) return { type: "missingInfo" };

      // 获取作者姓氏和条目标题
      const [authorLastName, title] = await Promise.all([
        this.getAuthorLastName(item),
        this.getItemTitle(item),
      ]);
      if (!authorLastName || !title) return { type: "missingInfo" };
      
      // 获取标题的前三个字符(单词或字符)
      const nTitle = getFirstNWordsOrCharacters(title, 3);
      const bib = splitStringByKeywords(biblioTxt, authorLastName, nTitle); // 根据关键词分割字符串
      return bib.length === 3
          ? { type: "success", content: this.buildFormattedBibItem(bib, item) }
          : { type: "noAction", content: biblioTxt + '\n' };
    });

    const bibResults = await Promise.all(bibTasks); // 等待所有任务完成

        // 使用 reduce 函数处理结果，得到最终参考文献字符串和各种计数器值
    const [finalBib, ruleItemCount, successfulCount, noActionCount, missingInfoItemCount] =
    bibResults.reduce(
      ([finalBib, ruleItemCount, successfulCount, noActionCount, missingInfoItemCount], result) => {
        if (result === "") return [finalBib, ruleItemCount, successfulCount, noActionCount, missingInfoItemCount];
        ruleItemCount++;
        switch (result.type) {
          case "success":
            successfulCount++;
            finalBib += result.content;
            break;
          case "noAction":
            noActionCount++;
            finalBib += result.content;
            break;
          case "missingInfo":
            missingInfoItemCount++;
            break;
        }
        return [finalBib, ruleItemCount, successfulCount, noActionCount, missingInfoItemCount];
      },
      ["", 0, 0, 0, 0] // 初始值
    );

  this.showBibConversionStatus(ruleItemCount, successfulCount, noActionCount, missingInfoItemCount);
  return finalBib;
} catch (error) {
  BasicExampleFactory.ShowError(getString("prompt.error.bib.info"));
  return;
}
}


static async getbibliography2(){
  // 利用 for 循序
  try {
      // 下面获取 items
      const selectedItems = Zotero.getActiveZoteroPane().getSelectedItems();
      var items = selectedItems.filter((item) => !item.isNote()  && item.getCreator(0) && item.isRegularItem() ); // 过滤笔记 且 过滤没有作者的 items
  
      if (items.length == 0) {
        BasicExampleFactory.ShowInfo("No items are selected.");
        return;
      }

    // 进一步处理 参考文献格式
    const format_str = this.getQuickCopyFormat();
    if (!format_str) return;
    // 转换
    const format =  Zotero.QuickCopy.unserializeSetting(format_str)
    // // 转换为如下形式:
    // format = {
    //   mode: 'bibliography',
    //   id: 'http://www.zotero.org/styles/ieee',
    //   contentType: 'text',
    //   locale: 'en-US'
    // };

    // 获得 locale
    var locale = format.locale ? format.locale : Zotero.Prefs.get('export.quickCopy.locale');
    var style = Zotero.Styles.get(format.id);// 获得 csl 样式
    var cslEngine = style.getCiteProc(locale, 'text'); // 获得 cslEngine 引擎

    // 以上为参考文献的准备工作
    // 直接生成参考文献,只不过是一个字符串
    var citestr = Zotero.Cite.makeFormattedBibliographyOrCitationList(cslEngine, items, "text");
    cslEngine.free();// 释放 cslEngine

    // 分割为数组字符串
    const citestr_arr = citestr.split('\n').filter( (item: string) => {
      return item.trim() && item.trim() !== "";
    });
    
    // 检查一下 citestr_arr 的长度
    if(citestr_arr.length != items.length){
      BasicExampleFactory.ShowError("生成的参考文献条目数目与选定的条目数目不一致" + citestr_arr.length + " " + items.length);
      return;
    }
    // const nkey = items.map((item) => item.getField('citationKey')); // 获得 每一个条目的 key
    // const ntitle = items.map((item) => item.getField('title')); // 获得 每一个条目的 title
    // const nauthor = items.map((item) => item.getCreator(0).lastName); // 获得 每一个条目的 作者

    //测试 for 循环更快
    const nkey = [];
    const ntitle = [];
    const nauthor = [];
    const fianl_bib = [];
    let ruleItemCount =  items.length;
    let successfulCount = 0;
    let noActionCount = 0
    let missingInfoItemCount =  selectedItems.length - items.length;
    for(let i = 0 ; i<items.length; i++){
      // 获得 每一个条目的 key 以及作者, 以及 title
       let item = items[i];
       nkey[i] = item.getField('citationKey'); 
       ntitle[i] = item.getField('title') as string;
       nauthor[i] = item.getCreator(0).lastName;
       // 获取标题的前三个字符(单词或字符)
      const nTitle = getFirstNWordsOrCharacters(ntitle[i], 3);
      const bib = splitStringByKeywords(citestr_arr[i], nauthor[i] as string, nTitle); // 根据关键词分割字符串
      if (bib.length === 3){
        fianl_bib[i] = this.buildFormattedBibItem2(bib, nkey[i] as string) 
        successfulCount ++;
      }else{
        fianl_bib[i] = bib;
        noActionCount ++;
      }
    }
    // 生成最终的参考文献字符串
    const finalBib = fianl_bib.join('\n');
    this.showBibConversionStatus(ruleItemCount, successfulCount, noActionCount, missingInfoItemCount);
  } catch (error) {
    BasicExampleFactory.ShowError(getString("prompt.error.bib.info"));
    return;
  }
}

static buildFormattedBibItem2(bib: string[], addkey: string) {
  //  bib:any 必须是分成三个部分的字符串数组
  const bibPrefix = bib[0]; // 前缀
  const bibPrefixNew = checkPrefix(bibPrefix, true, `\\bibitem{${addkey}} `); // 检查前缀,是否提取出错?
  const bibAuthor = replaceStringByKeywords(bib[1]);// 对作者中的某些中英文进行替换

  return bibPrefixNew + " " + bibAuthor + " " + bib[2] + '\n';
}


static getQuickCopyFormat() {
  const format = Zotero.Prefs.get("export.quickCopy.setting") as string;
  if (!format || format.split("=")[0] !== "bibliography") {
    BasicExampleFactory.ShowError("No bibliography style is chosen in the settings for QuickCopy.");
    return null;
  }
  return format;
}

static async getAuthorLastName(item: any) {
  const creator = item.getCreator(0);
  return creator ? creator['lastName']?.trim() : null;
}

static async getItemTitle(item: any) {
  return await item.getField('title') || null;
}

static buildFormattedBibItem(bib:any, item:any) {
  const bibPrefix = bib[0];
  const addValue = "\\bibitem{" + item.getField('citationKey') + "} ";
  const bibPrefixNew = checkPrefix(bibPrefix, true, addValue);

  const bibAuthor = replaceStringByKeywords(bib[1]);

  return bibPrefixNew + " " + bibAuthor + " " + bib[2] + '\n';
}

static showBibConversionStatus(ruleItemCount: number, successfulCount: number, noActionCount: number, missingInfoItemCount: number) {
  if (successfulCount > 0) {
    BasicExampleFactory.ShowStatus(ruleItemCount, successfulCount, "items are converted.");
  }
  if (noActionCount > 0) {
    BasicExampleFactory.ShowStatus(ruleItemCount, noActionCount, "items are not converted.");
  }
  if (missingInfoItemCount > 0) {
    BasicExampleFactory.ShowStatus(ruleItemCount, missingInfoItemCount, "items are missing information.");
  }
}

}
