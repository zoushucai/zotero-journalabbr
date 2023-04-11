import { config } from "../../package.json";
import { getString } from "./locale";
import { journal_abbr } from "./data";
import { get } from "http";

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
    ],
    "*.*"
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
      const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`;
      // item menuitem with icon
      ztoolkit.Menu.register("item", {
        tag: "menuitem",
        id: "zotero-itemmenu-abbr-journal-onestepupate",
        label: getString("menuitem.onestepupate"),
        icon: menuIcon,
        commandListener: (ev) => HelperAbbrFactory.oneStepUpdate(),
      });
    }
}


export class HelperAbbrFactory {
  // 简写期刊大写 ----  根据 journalAbbreviation 的字段进行特殊转换
  static async journalAbbreviationToUpperCase() {
   try {
     var items = Zotero.getActiveZoteroPane().getSelectedItems(); 
     var rn = 0; //计算替换条目个数
     if(1 <= items.length){
         for (var item of items) {
             var currentabbr: string | number | boolean = item.getField('journalAbbreviation');
             // 断言是字符串类型
             currentabbr = (currentabbr as string).toUpperCase();
             if(currentabbr=="" || currentabbr==null || currentabbr==undefined){
                 // alert("为空");
             }else{
                 item.setField("journalAbbreviation", currentabbr); 
                 await item.saveTx();
                 rn ++;
             }
         }
     }
   //BasicExampleFactory.ShowError('转换失败');
   BasicExampleFactory.ShowStatus(items.length, rn, getString("prompt.success.abbrToupper.info"));
 } catch (error) {
   BasicExampleFactory.ShowError(getString("prompt.error.execution.info"));
 }
 return;
}

// 简写期刊小写  ----- 根据 journalAbbreviation 的字段进行特殊转换
static async journalAbbreviationToLowerCase() {
 try {
   var items = Zotero.getActiveZoteroPane().getSelectedItems(); 
   var rn = 0; //计算替换条目个数
   if(1 <= items.length){
       for (var item of items) {
           var currentabbr: string | number | boolean =item.getField('journalAbbreviation');
           // // 也可以强制断言是字符串类型
           currentabbr = (currentabbr as string).toLowerCase();
           if(currentabbr=="" || currentabbr==null || currentabbr==undefined){
               // alert("为空");
           }else{
               item.setField("journalAbbreviation", currentabbr); 
               await item.saveTx();
               rn ++;
           }
       }
   }
   BasicExampleFactory.ShowStatus(items.length, rn, getString("prompt.success.abbrTolower.info"))
 } catch (error) {
  BasicExampleFactory.ShowError(getString("prompt.error.execution.info"));
}
}

//简写期刊首字母化 ---- 根据 journalAbbreviation 的字段进行特殊转换
static async journalAbbreviationToCapitalize() {
 try {
   var items = Zotero.getActiveZoteroPane().getSelectedItems(); 
   var rn = 0; //计算替换条目个数
   if(1 <= items.length){
       for (var item of items) {
           var currentabbr  =  item.getField('journalAbbreviation');
           //强制断言是字符串类型
           currentabbr = (currentabbr as string).toLowerCase()
           currentabbr = currentabbr.replace(/(?:^|\s)\S/g, function(firstChar: string) {
               return firstChar.toUpperCase();
             });
           if(currentabbr=="" || currentabbr==null || currentabbr==undefined){
               // alert("为空");
           }else{
               item.setField("journalAbbreviation", currentabbr); 
               await item.saveTx();
               rn ++;
           }
       }
   }
   BasicExampleFactory.ShowStatus(items.length, rn, getString("prompt.success.abbrTocapitalize.info"))
 } catch (error) {
  BasicExampleFactory.ShowError(getString("prompt.error.execution.info"));
 }
}

// 移除简写期刊中的点
static async removeJournalAbbreviationDot() {
 try {
     var items = Zotero.getActiveZoteroPane().getSelectedItems(); 
     var rn = 0; //计算替换条目个数
     if(1 <= items.length){
         for (var item of items) {
             var currentabbr  =  item.getField('journalAbbreviation')
             //强制断言是字符串类型
             currentabbr = (currentabbr as string).replace(/\./g, "");
             if(currentabbr=="" || currentabbr==null || currentabbr==undefined){
                 // alert("为空");
             }else{
                 item.setField("journalAbbreviation", currentabbr); 
                 await item.saveTx();
                 rn ++;
             }
         }
     }
   BasicExampleFactory.ShowStatus(items.length, rn, getString("prompt.success.removeAbbrdot.info"))
 } catch (error) {
  BasicExampleFactory.ShowError(getString("prompt.error.execution.info"));
 }
 return;
}

// 根据标签名称, 删除对应的标签
static async removeTagByName(usertags: string[]) {
   try {
     //获取 Zotero 窗口,并获取选中的条目信息， items包含所选条目的所有字段信息
     var items = Zotero.getActiveZoteroPane().getSelectedItems(); 
     var rn = 0; // 记录删除指定 tag 的个数
     var nf = false;  // 删除 tag 是否成功
     if(1 <= items.length){
         for(var item of items){
             nf = item.removeTag(usertags[0]);
             if(nf){
                 await item.saveTx();
                 rn ++
             }
         }
     }
   BasicExampleFactory.ShowStatus(items.length, rn,  getString("prompt.success.removetag.info")+': '+usertags[0])
 } catch (error) {
   //BasicExampleFactory.ShowError('删除'+usertags[0] + '标签失败') 
   BasicExampleFactory.ShowError(getString("prompt.error.removetag.info")+': '+ usertags[0] );

 }
}

// 交换期刊名 --- 即简写期刊与期刊名互换
static async exchangeJournalName() {
 try {
   var items = Zotero.getActiveZoteroPane().getSelectedItems(); 
   var rn = 0; //计算替换条目个数
   if(1 <= items.length){
       for (var item of items) {
           let currentabbr  =  item.getField('journalAbbreviation');
           let currentjournal  =  item.getField('publicationTitle');
           item.setField("journalAbbreviation", currentjournal); 
           item.setField("publicationTitle", currentabbr); 
           await item.saveTx();
           // 检查标签是否存在
           let tagExists = false;
           const tagName = 'exchange';
           let tags = item.getTags();
           for (const tag of tags) {
               if (tag.tag === tagName) {
                   tagExists = true;
                   break;
               }
           }
           // 如果标签存在，则移除；如果不存在，则添加
           if (tagExists) {
             await item.removeTag(tagName);
           } else {
             await item.addTag(tagName);
           }
           // 保存更改
           await item.saveTx();   
           rn ++;
       }
   }
   BasicExampleFactory.ShowStatus(items.length, rn, getString("prompt.success.exchange.info"))
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
  if (mypath === null) {
    BasicExampleFactory.ShowPopUP(getString("prompt.show.cancel.selectpath.info"))
  }else{
    await Zotero.Prefs.set(`${config.addonRef}.input`, mypath);
    BasicExampleFactory.ShowPopUP(getString("prompt.show.success.selectpath.info")+ getString(`${mypath}`))
  }

}

// 删除字符串两边的空格, 删除成对的双引号或单引号
@example
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
     // Read CSV file content
     let csvContent = await Zotero.File.getContentsAsync(filePath);
     // 断言是字符串类型
     csvContent = csvContent as string;
     // Parse CSV content
     let lines = csvContent.trim().split('\n');
     let data: { [key: string]: any } = {};
     for (let i = 0; i < lines.length; i++) {
         let currentLine = lines[i].split(delimiter);
         let key = await HelperAbbrFactory.trimAndRemoveQuotes(currentLine[0]);
         key = key.toLowerCase();
         let value = await HelperAbbrFactory.trimAndRemoveQuotes(currentLine[1]);
         if(key == "" || value == ""){
           BasicExampleFactory.ShowError('读取用户文件,大约第'+ i + "行解析出的格式中含有空字符")
         }
         if (!data.hasOwnProperty(key) && key != "" && value != "") {
             data[key] = value; // 重复以先前的为准
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
static async updateJournalAbbr(data: { [key: string]: any }, addtagsname: string[], removetagsname: string[], str: string) {
 try {
   //1. 先获取选择的条目
   var items = Zotero.getActiveZoteroPane().getSelectedItems(); //items包含所选条目的所有字段信息
   let rn = 0; //计算替换条目个数

   //2. 判断是否有条目被选中
   
   if(1 <= items.length){
       for (let item of items) {
           let currentjournal  =  item.getField('publicationTitle'); //1. 字段精确查询 
           if (!currentjournal) {
            break;
           }
           currentjournal = currentjournal as string; // 强制断言为字符串类型
           currentjournal  =  currentjournal.trim().toLowerCase(); //2. 转换为小写, 删除多余的空格
           currentjournal = currentjournal.replace(/\s+/g, ' ').trim();
          if(currentjournal=="" || currentjournal==null || currentjournal==undefined){
            // alert("为空");
            break;
          }
           if(data.hasOwnProperty(currentjournal)){
               item.setField("journalAbbreviation", data[currentjournal]); 
               await item.saveTx();
               // 对条目的标签进行处理
               const addtags = addtagsname[0];
               const removetags = removetagsname[0];
              
               // 如果准备移除的标签存在, 则移除, 如果准备添加的标签不存在, 则添加
               let tags = item.getTags();//获取条目的所有标签
               for (const tag of tags) {
                  if (tag.tag === removetags) {
                       await item.removeTag(removetags);
                       break;
                   }
               }
               let tagExists = false;
               //tags = item.getTags();
               for(const tag of tags ){
                  if (tag.tag === addtags) {
                    tagExists = true;
                    break;
                  }
               }
               // 如果标签不存在, 则添加
               if (!tagExists) {
                 await item.addTag(addtags); // 表示这些期刊进行了自动期刊缩写
               }
               //await item.saveTx();
               await item.save({
                 skipDateModifiedUpdate: true
               });
               rn ++;
           }
       }
   }
   BasicExampleFactory.ShowStatus(items.length, rn, str)
 } catch (error) {

   BasicExampleFactory.ShowError(getString("prompt.error.updatejournal.info"));
 }
 return;
}


// 1. 使用内部数据集进行更新
static async updateJournalAbbreviationUseInnerData() {
 await HelperAbbrFactory.updateJournalAbbr(journal_abbr, ['abbr'], ['abbr_user'], getString("prompt.success.updatejournal.info"))
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
  //  // 3. 判断分割符号是否为分号或逗号
  //   if(pref_separator != "," && pref_separator != ";"){
  //     ztoolkit.getGlobal("alert")(`请先选择正确的分隔符号`);
  //     return;
  //   }else{
  //     BasicExampleFactory.ShowPopUP("自动选择逗号(,)分隔符号")
  //     pref_separator = ',' //默认为逗号
  //   }
   var user_abbr_data = await HelperAbbrFactory.readAndParseCSV(userfile, pref_separator);

   // 4.判断返回的 user_abbr_data 的类型
   if(typeof user_abbr_data != "object" || user_abbr_data == null || user_abbr_data == undefined){
     //ztoolkit.getGlobal("alert")(`读取 csv 文件失败, 可能不存在该文件，或文件未按指定格式书写!`);
     BasicExampleFactory.ShowError('读取 csv 文件失败, 可能不存在该文件或文件未按指定格式书写!');
     return;
   }

   // 5. 更新期刊缩写 -- 返回的信息为 已有 2/2 条目缩写更新
   await HelperAbbrFactory.updateJournalAbbr(user_abbr_data, ['abbr_user'], ['abbr'], getString("prompt.success.updatejournal.info"));
 } catch (error) {
   BasicExampleFactory.ShowError('采用用户数据集更新简写期刊失败')
 }
}

static async oneStepUpdate(){
  // 
  // var aa = await Zotero.Prefs.get(`${config.addonRef}.separator`); // 获得持久化的变量
  // ztoolkit.getGlobal("alert")(`hhhh==kk${aa}`)
  //
  // 1. 一键更新期刊, 先使用内部数据集,在使用自定义数据集, 
  await HelperAbbrFactory.updateJournalAbbreviationUseInnerData();
  await HelperAbbrFactory.updateJournalAbbreviationUseUserData();
}

}
