import { BasicExampleFactory } from "./examples";
import { getString } from "../utils/locale";
import { StringUtil } from "./stringutil";
import { config } from "../../package.json";

import { AbbrevIso } from "./nodeBundle";
import { ltwa } from "./ltwa";
import { shortWords } from "./shortwords";
const abbrevIso = new AbbrevIso(ltwa, shortWords);

// 定义返回的结果的类,用于信息输出
class ResultInfo {
  selectCount = 0;
  successCount = 0;
  error_arr: Array<string | number> = [];
  strinfo = "";
}

class Basefun {
  /////// 1.用于筛选合格的条目 ................................................
  static filterSelectedItems() {
    //const items = Zotero.getActiveZoteroPane().getSelectedItems();
    const items = ZoteroPane.getSelectedItems(); // 等价于 Zotero.getActiveZoteroPane().getSelectedItems();
    const selectedItems = items.filter((item) => !item.isNote() && item.isRegularItem()); // 过滤笔记 且 是规则的 item
    const selectedItemsLength = selectedItems.length;
    if (selectedItemsLength == 0) {
      BasicExampleFactory.ShowStatus(0, 0, "没有选中任何条目");
      return;
    }
    return selectedItems;
  }

  /////// 2. map 处理 ................................................
  static async processSelectedItemsWithPromise(
    handler: (item: any) => Promise<boolean>,
    successMessage: string,
    errorMessage: string,
    showInfo = true,
    selectedItems?: any[],
  ) {
    try {
      if (!selectedItems) {
        selectedItems = this.filterSelectedItems();
        if (!selectedItems) return;
      }
      const tasks = selectedItems.map(handler);
      const results = await Promise.all(tasks);
      const successCount = results.filter((result) => result).length;
      if (showInfo) {
        BasicExampleFactory.ShowStatus(selectedItems.length, successCount, successMessage);
      }
    } catch (error) {
      if (showInfo) {
        BasicExampleFactory.ShowError(errorMessage);
      }
    }
  }

  /////// 3. 普通的处理方法(感觉执行更快) ................................................
  // 把 try ... catch .. 模板提取出来
  static async executeFunctionWithTryCatch(func: any, successMessage = "", errorMessage = "", errorInfo = "") {
    try {
      const result = await func();
      //ztoolkit.getGlobal('alert')(`${result}`)
      const { selectCount = 0, successCount = 0, error_arr = [] } = result ?? {};
      const errorCount = error_arr.length;

      let errorMsg = "";
      if (errorCount > 5) {
        errorMsg = getString("prompt-show-readfile-more-info") + `${errorInfo} ${errorCount}`;
      } else if (errorCount > 0) {
        errorMsg = getString("prompt-show-readfile-less-info") + `${errorInfo} ${error_arr.join(", ")}`;
      }

      if (errorMsg) {
        BasicExampleFactory.ShowInfo(errorMsg);
      }
      if (successMessage) {
        BasicExampleFactory.ShowStatus(selectCount, successCount, successMessage);
      }
      const resultInfo = new ResultInfo();
      resultInfo.selectCount = selectCount;
      resultInfo.successCount = successCount;
      resultInfo.error_arr = error_arr;
      return resultInfo;
    } catch (error) {
      if (errorMessage) {
        BasicExampleFactory.ShowError(errorMessage);
      }
    }
  }

  static async get_user_data() {
    //Zotero.Prefs.set("journalabbr.userpath", zoteroProfileDir); // 持久化设置
    const userfile = Zotero.Prefs.get(`${config.addonRef}.input`) as string; // 获得持久化的变量
    // 获得持久化变量,分隔符号
    if (!userfile) {
      BasicExampleFactory.ShowError("所选文件为空");
      return;
    }
    // 1. 根据后缀名判断是否为 csv 文件 或者 json 文件
    if (!userfile.endsWith(".csv") && !userfile.endsWith(".json")) {
      BasicExampleFactory.ShowError("请先选择 csv 或者 json 文件");
      return;
    }
    // 2. 根据后缀名选择不同的读取方式
    let user_abbr_data = null;
    if (userfile.endsWith(".csv")) {
      user_abbr_data = await this.read_csv(userfile);
    }
    if (userfile.endsWith(".json")) {
      user_abbr_data = await this.read_json(userfile);
    }
    // 3.判断返回的 user_abbr_data 的类型
    if (typeof user_abbr_data !== "object" || !user_abbr_data) {
      BasicExampleFactory.ShowError("读取 csv或 json 文件失败, 可能不存在该文件或文件未按指定格式书写!");
      return;
    }
    return user_abbr_data;
  }

  // 1. 从 json 获取数据
  static async read_json(filePath: string) {
    const data_str = (await Zotero.File.getContentsAsync(filePath)) as string;
    const data_obj = JSON.parse(data_str);
    if (typeof data_obj !== "object" || data_obj === null || Array.isArray(data_obj)) {
      return;
    }

    // 把 key 转换为小写且去除空格
    const user_abbr_data: { [key: string]: any } = {}; // 用于存储转换后的数据
    for (const key in data_obj) {
      // 只保留字符串类型的键值对
      if (typeof data_obj[key] === "string" && typeof key === "string") {
        const normkey = key.toLowerCase().trim(); // 将当前键转为小写并去除两端空格
        // 给新对象添加当前键值对, 且键重复时, 会覆盖旧值,即保留最后一次出现的键值对
        user_abbr_data[normkey] = data_obj[key].trim();
      }
    }
    return user_abbr_data;
  }

  // 0. 从 csv 获取数据
  static async read_csv(filePath: string) {
    // 1. 读取用户设置的分割符号
    const pref_separator = Zotero.Prefs.get(`${config.addonRef}.separator`) as string; // 获得持久化的变量

    // 2. 读取 csv 文件, 并解析为字典对象
    const user_abbr_data = await Selected.readAndParseCSV(filePath, pref_separator);
    return user_abbr_data;
  }
  // 选择存贮路径
  static async getDir(suggestion: string) {
    const path = await new ztoolkit.FilePicker(
      "Save File",
      "save",
      [
        ["CSV Files", "*.csv"],
        ["JSON Files", "*.json"],
        ["All Files", "*.*"],
      ],
      suggestion,
    ).open();
    return path;
  }
  // 获取参考文献的格式
  static getQuickCopyFormat() {
    const format = Zotero.Prefs.get("export.quickCopy.setting") as string;
    if (!format || format.split("=")[0] !== "bibliography") {
      BasicExampleFactory.ShowError("No bibliography style is chosen in the settings for QuickCopy.");
      return null;
    }
    return format;
  }

  static getQuickCopyFormat2() {
    const format_str = Zotero.Prefs.get("export.quickCopy.setting") as string;
    if (!format_str || format_str.split("=")[0] !== "bibliography") {
      BasicExampleFactory.ShowError("No bibliography style is chosen in the settings for QuickCopy.");
      return null;
    }

    const format = Zotero.QuickCopy.unserializeSetting(format_str); // 格式化 format,返回如下形式的对象
    // {
    //     "mode": "bibliography"
    //     "contentType": ""
    //     "id": "http://www.zotero.org/styles/china-national-standard-gb-t-7714-2005-aulower"
    //     "locale": ""
    // }

    const locale = format.locale ? format.locale : Zotero.Prefs.get("export.quickCopy.locale");
    const style = Zotero.Styles.get(format.id);
    const cslEngine = style.getCiteProc(locale, "text");
    return cslEngine;
  }
}

// 以下为辅助类
class Selected {
  // 对某个字段进行函数处理
  static async processSelectItems(transformFn: (originalValue: string) => string, key: any = "journalAbbreviation") {
    const selectedItems = Basefun.filterSelectedItems();
    if (!selectedItems) return;
    const selectedItemsLength = selectedItems.length;

    let successCount = 0;
    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      const originalValue = item.getField(key) as string;

      // Checking if the current abbreviation is not empty, null, or undefined
      if (originalValue) {
        const current = transformFn(originalValue);

        // If the current is different from the original, update the item's journal abbreviation field
        if (current !== originalValue) {
          item.setField(key, current);
          await item.saveTx();
          // successCount++; // Increment the counter for successfully updated items
        }
        successCount++;
      }
    }
    const resultInfo = new ResultInfo();
    resultInfo.selectCount = selectedItemsLength;
    resultInfo.successCount = successCount;
    resultInfo.error_arr = [];

    return resultInfo;
  }

  // 交换期刊名 --- 即简写期刊与期刊名互换 --- 还是循环的方式-- 感觉循环比较快
  static async exchangeJournalName(key1: any = "journalAbbreviation", key2: any = "publicationTitle", exchangetagname = "exchange") {
    const selectedItems = Basefun.filterSelectedItems();
    if (!selectedItems) return;
    const selectedItemsLength = selectedItems.length;

    let successCount = 0;
    for (let i = 0; i < selectedItemsLength; i++) {
      const item = selectedItems[i];
      const currentabbr = item.getField(key1);
      const currentjournal = item.getField(key2);
      item.setField(key1, currentjournal);
      item.setField(key2, currentabbr);
      // 检查标签是否存在
      if (item.hasTag(exchangetagname)) {
        item.removeTag(exchangetagname);
      } else {
        item.addTag(exchangetagname);
      }
      await item.saveTx();
      successCount++;
    }

    const resultInfo = new ResultInfo();
    resultInfo.selectCount = selectedItemsLength;
    resultInfo.successCount = successCount;
    return resultInfo;
  }
  // 读取 csv 文件并解析
  static async readAndParseCSV(filePath: string, delimiter = ",") {
    try {
      const csvContent = (await Zotero.File.getContentsAsync(filePath)) as string;
      const lines = csvContent.trim().split("\n");
      const data: { [key: string]: any } = {};
      const errors: any[] = [];

      await Promise.all(
        lines.map(async (line, i) => {
          const currentLine = line.split(delimiter);
          if (currentLine.length != 2) {
            errors.push(i + 1);
            return;
          }
          const key = StringUtil.trimAndRemoveQuotes(currentLine[0]).toLowerCase();
          const value = StringUtil.trimAndRemoveQuotes(currentLine[1]);

          if (!key || !value) {
            errors.push(i + 1);
          }

          if (!Object.prototype.hasOwnProperty.call(data, key) && key != "" && value != "") {
            data[key] = value; // 重复以先前的为准
          }
        }),
      );
      if (errors.length > 0) {
        //console.log(errors)
        if (errors.length > 5) {
          BasicExampleFactory.ShowError(getString("prompt-show-readfile-more-info") + " " + errors.length);
        } else {
          BasicExampleFactory.ShowError(getString("prompt-show-readfile-less-info") + " " + errors.join(", "));
        }
      }
      return data;
    } catch (error) {
      BasicExampleFactory.ShowError(getString("prompt-error-readfile-info"));
      return null;
    }
  }

  // 定义一个共用的函数, 用于更新期刊缩写, 传递的第一个参数为数据, 第二个参数为数组字符串
  // 这个数据的要求: 数据集在 js 中是一个字典对象,  第一列key为原始期刊名(全部是小写且删除多余的空格), 第二列value为缩写
  // 第二个参数为进行期刊缩写的条目添加给定的标签, 用于标记识别
  static async updateJournalAbbr(
    data: { [key: string]: any },
    oldField: string,
    newField: string,
    addtagsname: string[],
    removetagsname: string[],
    successinfo: string,
    errorinfo: string,
    showInfo: boolean,
    selectedItems?: any[],
  ) {
    await Basefun.processSelectedItemsWithPromise(
      SelectedWithHandler.updateJournalAbbrHandler(data, oldField, newField, addtagsname, removetagsname),
      successinfo,
      errorinfo,
      showInfo,
      selectedItems,
    );
  }

  // 采用 iso-4 标准进行期刊缩写
  static async updateUseISO4(
    data: { [key: string]: any },
    oldField: string,
    newField: string,
    addtagsname: string[],
    removetagsname: string[],
    successinfo: string,
    errorinfo: string,
    showInfo: boolean,
    selectedItems?: any[],
  ) {
    await Basefun.processSelectedItemsWithPromise(
      SelectedWithHandler.updateJournalAbbrHandlerISO4(data, oldField, newField, addtagsname, removetagsname),
      successinfo,
      errorinfo,
      showInfo,
      selectedItems,
    );
  }

  // 生成参考文献 --- 方法 1
  static async getbibliography1() {
    const selectedItems = Basefun.filterSelectedItems();
    if (!selectedItems) return;
    const originid = selectedItems.map((item) => item.id); // 记录获取的条目原始顺序
    //测试 for 循环更快
    const nkey = [],
      ntitle = [],
      nauthor = [],
      fianl_bib = [],
      citestr_arr = [];
    //nTitle = [];
    const ruleItemCount = selectedItems.length;
    const successfulCount = [];
    const noActionCount = [];
    const missingInfoItemCount = [];
    // 2. 获得参考文献的格式
    // 方式 1-- 使用内置的
    // const format = Basefun.getQuickCopyFormat();
    // if (!format) return;
    //
    // 方式二: 忽略某些 html,直接返回 text
    const cslEngine = Basefun.getQuickCopyFormat2();

    // 3. 获取排序的方式
    const sortoptions = Zotero.Prefs.get(`${config.addonRef}.sortoptions`) as string; // 获得持久化的变量
    // 与 [ fianl_bib, nkey, ntitle, nauthor, id_arr] 对应的索引, 其中 id_arr 为原始的 id, 用于排序
    const optionarr = ["originid", "nkey", "ntitle", "nauthor", "id"];
    let sortindex = optionarr.indexOf(sortoptions);
    sortindex = sortindex === -1 ? 0 : sortindex;

    // 获取bib format
    const keyornum = Zotero.Prefs.get(`${config.addonRef}.keyornum`) as string; // 获得持久化的变量
    const isdiscardDOI = Zotero.Prefs.get(`${config.addonRef}.discardDOI`) as boolean; // 获得持久化的变量
    const bibemptyline = Zotero.Prefs.get(`${config.addonRef}.bibemptyline`) as boolean; // 获得持久化的变量
    let bibprenum = 1;

    for (let i = 0; i < ruleItemCount; i++) {
      try {
        // 获得 每一个条目的 key 以及作者, 以及 title
        const item = selectedItems[i];
        if (keyornum == "key") {
          nkey[i] = item.getField("citationKey") as string;
        } else if (keyornum == "num") {
          nkey[i] = "[" + String(i + 1) + "]";
        } else {
          nkey[i] = "";
        }
        ntitle[i] = item.getField("title") as string;
        const creator = item.getCreators()[0];
        nauthor[i] = creator && creator.lastName ? creator.lastName : "";

        if (!ntitle[i] || !nauthor[i] || !nkey[i]) {
          missingInfoItemCount.push(i);
          continue;
        }

        // 方式一: 直接调用
        citestr_arr[i] = Zotero.Cite.makeFormattedBibliographyOrCitationList(cslEngine, [item], "text");
        // 根据正则表达式, 替换参考文献开头的多余信息
        // 1. 处理 [1] 或者 1. 或者 (1) 这种情况, 改成 \bibitem{key}
        // 2. 处理 等. --> et al. 或者 et al.--> 等.
        const [f, s, n] = StringUtil.handleBibtoFormat1(citestr_arr[i], nkey[i], keyornum, bibprenum, isdiscardDOI);
        bibprenum += 1;
        fianl_bib[i] = f;
        if (s) successfulCount.push(i);
        if (n) noActionCount.push(i);
      } catch (error) {
        fianl_bib[i] = "";
        missingInfoItemCount.push(i);
      }
    }
    // 方式二: 忽略某些 html,直接返回 text
    cslEngine.free();
    const newseparator = bibemptyline ? "\n\n" : "\n";

    //////// 最终的参考文献的处理 //////////
    // 理论上 id_arr 和 fianl_bib 长度是一样的
    const fianl_biblength = fianl_bib.length;
    let finalBib_str = ""; // 生成最终的参考文献字符串
    // 生成最终的参考文献字符串//
    if (sortindex === 0 || fianl_biblength !== ruleItemCount) {
      finalBib_str = fianl_bib.filter((item) => Boolean(item)).join(newseparator); // 过滤掉空值
    } else {
      const id_arr = []; // 记录条目的原始顺序
      for (let i = 0; i < fianl_biblength; i++) {
        id_arr.push(i);
      }
      // 这里可以根据 ['originid','nkey','ntitle','nauthor','id']; 排序, 这里 origin_id === id_arr
      const sortarr = StringUtil.sortColumns([fianl_bib, nkey, ntitle, nauthor, id_arr], sortindex, true); // 始终把 fianl_bib 放在第一列,然后执行更改数字即可排序
      finalBib_str = sortarr[0].filter((item: any) => Boolean(item)).join(newseparator); // 选择适当的列排序, 过滤掉空值
    }

    const resultInfo = new ResultInfo();
    resultInfo.selectCount = ruleItemCount;
    resultInfo.successCount = successfulCount.length;
    resultInfo.error_arr = noActionCount.concat(missingInfoItemCount);
    resultInfo.strinfo = finalBib_str;

    return resultInfo;
  }

  // 生成参考文献 --- 方法 2
  static async getbibliography2() {
    const selectedItems = Basefun.filterSelectedItems();
    if (!selectedItems) return;
    const originid = selectedItems.map((item) => item.id); // 记录获取的条目原始顺序
    //测试 for 循环更快
    const nkey = [],
      ntitle = [],
      nauthor = [],
      fianl_bib = [],
      citestr_arr = [],
      nTitle = [];
    const ruleItemCount = selectedItems.length;
    const successfulCount = [];
    const noActionCount = [];
    const missingInfoItemCount = [];
    // 2. 获得参考文献的格式
    // 方式 1-- 使用内置的
    // const format = Basefun.getQuickCopyFormat();
    // if (!format) return;
    //
    // 方式二: 忽略某些 html,直接返回 text
    const cslEngine = Basefun.getQuickCopyFormat2();

    // 3. 获取排序的方式
    const sortoptions = Zotero.Prefs.get(`${config.addonRef}.sortoptions`) as string; // 获得持久化的变量
    const optionarr = ["originid", "nkey", "ntitle", "nauthor", "id"];
    let sortindex = optionarr.indexOf(sortoptions);
    sortindex = sortindex === -1 ? 0 : sortindex;
    // 获取bib format
    const keyornum = Zotero.Prefs.get(`${config.addonRef}.keyornum`) as string; // 获得持久化的变量
    const isdiscardDOI = Zotero.Prefs.get(`${config.addonRef}.discardDOI`) as boolean; // 获得持久化的变量
    const bibemptyline = Zotero.Prefs.get(`${config.addonRef}.bibemptyline`) as boolean; // 获得持久化的变量
    let bibprenum = 1;

    for (let i = 0; i < ruleItemCount; i++) {
      try {
        // 获得 每一个条目的 key 以及作者, 以及 title
        const item = selectedItems[i];
        if (keyornum == "key") {
          nkey[i] = item.getField("citationKey") as string;
        } else if (keyornum == "num") {
          nkey[i] = "[" + String(i + 1) + "]";
        } else {
          nkey[i] = ""; //String(i + 1);
        }

        ntitle[i] = item.getField("title") as string;
        const author0 = JSON.parse(JSON.stringify(item.getCreator(0)));
        nauthor[i] = author0.lastName.trim() || "";
        nTitle[i] = StringUtil.getFirstNWordsOrCharacters(ntitle[i], 3); // 获得 title 的前三个单词

        if (!ntitle[i] || !nauthor[i] || !nkey[i]) {
          missingInfoItemCount.push(i);
          continue;
        }

        // 方式一: 直接调用
        //citestr_arr[i] = await Zotero.QuickCopy.getContentFromItems([item],format).text; // 返回当前条目的参考文献
        // 方式二: 忽略某些 html,直接返回 text
        citestr_arr[i] = Zotero.Cite.makeFormattedBibliographyOrCitationList(cslEngine, [item], "text");
        // 根据正则表达式, 替换参考文献开头的多余信息, 先进行关键词分割成三段, 然后对第一段进行处理, 最后再合并
        // 1. 处理 [1] 或者 1. 或者 (1) 这种情况, 改成 \bibitem{key}
        // 2. 处理 等. --> et al. 或者 et al. --> 等
        // 3. 处理 多个作者中的& 以及\& --> and
        const bib_arr = StringUtil.splitStringByKeywords(citestr_arr[i], nauthor[i], nTitle[i]);
        // 根据关键词分割字符串

        if (!bib_arr || bib_arr.length !== 3) {
          fianl_bib[i] = citestr_arr[i];
          noActionCount.push(i);
        } else {
          fianl_bib[i] = StringUtil.handleBibtoFormat2(bib_arr, nkey[i], keyornum, bibprenum, isdiscardDOI);
          bibprenum += 1;
          successfulCount.push(i);
        }
      } catch (error) {
        fianl_bib[i] = "";
        missingInfoItemCount.push(i);
      }
    }
    // 方式二: 忽略某些 html,直接返回 text
    cslEngine.free();
    const newseparator = bibemptyline ? "\n\n" : "\n";

    //////// 最终的参考文献的处理 //////////
    // 理论上 id_arr 和 fianl_bib 长度是一样的
    const fianl_biblength = fianl_bib.length;
    let finalBib_str = ""; // 生成最终的参考文献字符串
    // 生成最终的参考文献字符串//
    if (sortindex === 0 || fianl_biblength !== ruleItemCount) {
      finalBib_str = fianl_bib.filter((item) => Boolean(item)).join(newseparator); // 过滤掉空值
    } else {
      const id_arr = []; // 记录条目的原始顺序
      for (let i = 0; i < fianl_biblength; i++) {
        id_arr.push(i);
      }
      // 这里可以根据 ['originid','nkey','ntitle','nauthor','id']; 排序
      const sortarr = StringUtil.sortColumns([fianl_bib, nkey, ntitle, nauthor, id_arr], sortindex, true); // 始终把 fianl_bib 放在第一列,然后执行更改数字即可排序
      finalBib_str = sortarr[0].filter((item: any) => Boolean(item)).join(newseparator); // 选择适当的列排序, 过滤掉空值
    }

    const resultInfo = new ResultInfo();
    resultInfo.selectCount = ruleItemCount;
    resultInfo.successCount = successfulCount.length;
    resultInfo.error_arr = noActionCount.concat(missingInfoItemCount);
    resultInfo.strinfo = finalBib_str;

    return resultInfo;
  }

  // 把所有类型的条目按照一定规则转到自定义的字段上: 其中自定义字段为:
  static async transferAllItemsToCustomField(selectedItems?: any[]) {
    try {
      if (!selectedItems) {
        selectedItems = Basefun.filterSelectedItems();
        if (!selectedItems) return;
      }
      Zotero.debug("+++++++++++++++++++++++++++++++++++++++++++");

      Zotero.debug(`"selectedItems: ${selectedItems.length}`);

      const ruleItemCount = selectedItems.length;

      for (let i = 0; i < ruleItemCount; i++) {
        try {
          const item = selectedItems[i];
          const fieldValue = FeildExport.getPublicationTitleForItemType(item);
          Zotero.debug("+++++++++++++++++++++++++++++++++++++++++++2222");
          Zotero.debug(`"fieldValue: ${fieldValue}`);
          if (fieldValue) {
            await ztoolkit.ExtraField.setExtraField(item, "itemBoxRowabbr", fieldValue);
            Zotero.debug("+++++++++++++++++++++++++++++++++++++++++++3333");
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      Zotero.debug(`"journalabbr error: ${error}`);
    }
  }

  // 导出 citationkey
  static async exportCitationkey() {
    const selectedItems = Basefun.filterSelectedItems();
    if (!selectedItems) return;
    const ruleItemCount = selectedItems.length;
    const successfulCount = [];
    const noActionCount = [];
    const missingInfoItemCount = [];

    let strinfo = "";
    for (let i = 0; i < ruleItemCount; i++) {
      try {
        const mitem = selectedItems[i];
        const ckey = String(mitem.getField("citationKey")); // 强行转为字符串
        // 可以设置不同的样式
        if (i + 1 == ruleItemCount) {
          strinfo = strinfo + ckey;
        } else {
          strinfo = strinfo + ckey + ", ";
        }
        strinfo = strinfo.trim();
        if (ckey) {
          ztoolkit.ExtraField.setExtraField(mitem, "itemBoxCitationkey", ckey);
          successfulCount.push(i);
        }
      } catch (error) {
        ztoolkit.log("error", error);
        missingInfoItemCount.push(i);
      }
    }

    const resultInfo = new ResultInfo();
    resultInfo.selectCount = ruleItemCount;
    resultInfo.successCount = successfulCount.length;
    resultInfo.error_arr = missingInfoItemCount;
    resultInfo.strinfo = strinfo;
    return resultInfo;
  }
}

// 以下为辅助类
class SelectedWithHandler {
  static removeTagHandler(usertags: string[]) {
    return async (item: any) => {
      const success = item.removeTag(usertags[0]);
      if (success) {
        await item.saveTx();
      }
      return success;
    };
  }

  static updateJournalAbbrHandler(data: { [key: string]: any }, oldField: string, newField: string, addtagsname: string[], removetagsname: string[]) {
    return async (item: any) => {
      const currentjournal = await item.getField(oldField);
      const currentabbr = await item.getField(newField);
      if (!currentjournal) {
        return false;
      }

      const journalKey = currentjournal.trim().toLowerCase().replace(/\s+/g, " ").trim();
      const data_in_journal = data[journalKey];
      if (!journalKey || !data_in_journal) {
        return false;
      }

      const isIdentical = currentabbr?.trim() === data_in_journal.trim();
      if (!isIdentical) {
        // not identical, update
        item.setField(newField, data_in_journal);
      }

      // 1. 先获取当前条目的标签 ,
      // 2. 判断当前条目是否有标签, 如果有, 则删除, 如果没有, 则添加
      // 3. 保存 (上述算法有点浪费内容, 因为每次都要获取标签, 但是这样可以保证标签的正确性)

      const tags = item.getTags(); // tags 是一个数组对象, 每个对象一般有两个属性: type, tag.
      const existingTags = new Set(tags.map((tagObj: any) => tagObj.tag));
      const tagsToAdd = addtagsname.filter((tag) => !existingTags.has(tag));
      const tagsToRemove = removetagsname.filter((tag) => existingTags.has(tag));

      tagsToRemove.forEach((tag) => item.removeTag(tag));
      tagsToAdd.forEach((tag) => item.addTag(tag));

      if (tagsToRemove.length > 0 || tagsToAdd.length > 0 || !isIdentical) {
        // 当前条目的标签发生了变化, 或者当前条目的期刊缩写发生了变化, 则保存
        await item.saveTx();
      }
      return true;
    };
  }

  static updateJournalAbbrHandlerISO4(data: { [key: string]: any }, oldField: string, newField: string, addtagsname: string[], removetagsname: string[]) {
    return async (item: any) => {
      try {
        let currentjournal = (await item.getField(oldField))?.trim();
        const currentabbr = (await item.getField(newField))?.trim();
        if (!currentjournal) return false;

        currentjournal = currentjournal.replace(/\s+/g, " ").trim();

        const abbred_iso4_journal = abbrevIso.makeAbbreviation(currentjournal);
        if (!abbred_iso4_journal) return false;

        const isIdentical = currentabbr?.trim() === abbred_iso4_journal.trim();
        if (!isIdentical) {
          // not identical, update
          item.setField(newField, abbred_iso4_journal);
        }

        if ((addtagsname.length == 1 && addtagsname[0] == "") || (removetagsname.length == 1 && removetagsname[0] == "")) {
          if (!isIdentical) {
            await item.saveTx();
          }
          return true;
        }

        const tags = item.getTags(); // tags 是一个数组对象, 每个对象一般有两个属性: type, tag.
        addtagsname = addtagsname.map((tag) => tag.trim());
        removetagsname = removetagsname.map((tag) => tag.trim());

        const removeTags = removetagsname.filter((tag) => tags.some((t: any) => t.tag === tag));
        const addTags = addtagsname.filter((tag) => !tags.some((t: any) => t.tag === tag));

        removeTags.forEach((tag) => item.removeTag(tag));
        addTags.forEach((tag) => item.addTag(tag));

        if (removeTags.length > 0 || addTags.length > 0 || !isIdentical) {
          await item.saveTx();
        }
        return true;
      } catch (error) {
        Zotero.debug(`Error in updateJournalAbbrHandlerISO4: ${error}`);
        return false;
      }
    };
  }
}

class FeildExport {
  /** 根据 所选中的 item 导出 csv or json 文件
   */
  static convertJsonToCsv(jsonData: any) {
    /**
     * 参数: jsonData 是一个数组对象, 把数组对象转换为 csv
     * 作用:  根据对象转换为 csv, key 为 header, value 为数据
     */
    if (!jsonData || !jsonData.length) {
      return "";
    }
    const csvRows = [];
    // 利用 key 作为header
    const header = Object.keys(jsonData[0]);
    // 构建 CSV 标题行
    csvRows.push(header.join(","));

    // 构建 CSV 数据行
    for (const row of jsonData) {
      const values = header.map((key) => {
        let value = row[key];
        // 处理可能包含逗号的数据
        if (value != null && typeof value === "string") {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(","));
    }

    // 将数组连接为一个 CSV 字符串
    return csvRows.join("\n");
  }
  // 2 处理 作者
  static formatAuthors2Str(authors: any) {
    /**
     * 描述: 把 数组authors按照一定的格式进行处理,转为字符串
     * 参数: authors 是一个数组对象, 每个对象一般有两个属性: firstName, lastName,
     * 作用: 通过遍历数组, 把数组中的每个对象的 firstName 和 lastName 进行拼接,空格隔开,
     * 然后再把数组中的每个对象拼接起来, 用逗号隔开, 最终返回一个字符串
     */

    if (Array.isArray(authors) && authors.length > 0) {
      const formattedAuthors = authors.map((author) => `${author.firstName} ${author.lastName}`.trim());
      return formattedAuthors.join(", ").trim();
    } else {
      return "";
    }
  }
  static formatAuthors2Obj(maxAuthorNum: number, authors: any) {
    /**
     * 描述: 把 数组authors按照一定的格式进行处理,转为对象
     * 参数: maxAuthorNum 是一个数字, 表示当前选择的 item 种 最大的作者数量
     *     authors 是一个数组对象, 每个对象一般有两个属性: firstName, lastName,
     * 作用: 通过遍历数组, 把数组中的每个对象的 firstName 和 lastName 进行拼接,空格隔开,
     * 然后把拼接后的字符串 作为jsonData_author 的属性, 最终返回一个对象
     */
    const jsonData_author: { [key: string]: string } = {};
    for (let i = 0; i < maxAuthorNum; i++) {
      jsonData_author[`Author${i + 1}`] = "";
    }

    authors.forEach((item: any, index: any) => {
      const fullName = item.firstName.trim() + " " + item.lastName.trim();
      jsonData_author[`Author${index + 1}`] = fullName.trim() || "";
    });
    return jsonData_author;
  }

  static getPublicationTitleForItemType(item: any) {
    /**
     * item : 传递的 item
     * 通过 item 的类型, 处理 PublicationTitle, 从不同类型的 item 中获取
     */
    const itype = item.itemType.toLowerCase();
    let publicationTitle;
    switch (itype) {
      case "thesis":
        publicationTitle = item.getField("university");
        break;
      case "book":
        publicationTitle = item.getField("publisher");
        break;
      case "journalarticle":
        publicationTitle = item.getField("publicationTitle");
        break;
      case "conferencepaper":
        publicationTitle = item.getField("conferenceName");
        if (!publicationTitle) {
          publicationTitle = item.getField("publisher");
        }
        break;
      case "preprint":
        publicationTitle = item.getField("repository");
        break;
      case "booksection":
        publicationTitle = item.getField("publisher");
        break;
      default:
        try {
          publicationTitle = item.getField("publicationTitle");
        } catch (e) {
          publicationTitle = "";
        }
        break;
    }
    return String(publicationTitle).trim();
  }

  static getLibTagColors(items: any) {
    /**
     * 参数: items 表示当前选择的 items, 本质items没有用到, 只是为了获取当前库的标签颜色
     * 作用: 获取整个库的所有带颜色的标签, 返回一个 Set
     */
    // 创建一个 Set 来存储所有的标签颜色
    const libColorTagSet = new Set();

    // 方式 1: 遍历每个项目并获取标签颜色
    // for (const item of items) {
    //   const tagColors = Zotero.Tags.getColors(item.libraryID);
    //   tagColors.forEach((value, key) => {
    //     //const color = value.color;
    //     //s0 = `Key: ${key}, Color: ${color}\n`;
    //     tagSet.add(key);
    //   });
    // }

    // 方式 2: 直接获取库的标签颜色
    const id = Zotero.Libraries.userLibraryID;
    const tagColors = Zotero.Tags.getColors(id);
    tagColors.forEach((value, key) => {
      libColorTagSet.add(key);
    });
    return libColorTagSet;
  }

  static getSelectTagColors(items: any, tagSet: any) {
    /**
     * 参数: items 表示当前选择的 items, tagSet 表示当前库的所有标签颜色
     * 作用: 获取选择条目的所有带颜色的标签, 返回一个 Set, 因此选择条目的标签颜色 是 当前库的标签颜色的子集
     */

    // 创建一个 Set 来存储选择的标签颜色
    const selectTagSet = new Set();

    // 遍历每个项目并获取标签颜色
    for (const item of items) {
      const tags = item.getTags();
      tags.forEach((tag: any) => {
        if (tagSet.has(tag.tag)) {
          selectTagSet.add(tag.tag);
        }
      });
    }

    return selectTagSet;
  }

  static getItemCollectionNames(item: any) {
    /**
     * 参数: item 表示当前选择的 item
     * 作用: 获取当前 item 所在的 collection 名称, 返回一个字符串
     */
    const ids = item.getCollections();
    const data = Zotero.Collections.get(ids);
    const newList = JSON.parse(JSON.stringify(data));
    return newList.map((item: any) => item.name).join(", ");
  }

  static getMaxAuthorNum(items: any) {
    /**
     * 参数: items 表示当前选择的 items
     * 作用: 根据所选的条目, 统计最大作者数
     */
    let maxAuthorNum = 0;
    for (const item of items) {
      const authors = JSON.parse(JSON.stringify(item.getCreators()));
      const authorsNum = authors.length;
      if (authorsNum > maxAuthorNum) {
        maxAuthorNum = authorsNum;
      }
    }
    return maxAuthorNum;
  }

  static getItemData(item: any, selectTagSets: any, maxAuthorNum: number, cslEngine: any) {
    /**
     * 参数: item:  传递的 item
     *      selectTagSets: 选择的标签集合
     *      maxAuthorNum: 最大作者数量
     *      cslEngine: cslEngine, 生成参考文献格式的引擎
     * 作用: 根据 item, 生成一个对象, 用于存储 item 的基本信息
     * */
    const item_ckey = String(item.getField("citationKey")).trim();
    const item_title = String(item.getField("title")).trim();
    const item_date = item.getField("date");
    const item_dateAdded = item.getField("dateAdded");
    const item_dateModified = item.getField("dateModified");
    const item_doi = item.getField("DOI");
    const item_type = item.itemType;
    // 1. 合并作者
    const authors = JSON.parse(JSON.stringify(item.getCreators()));
    const item_authors2str = this.formatAuthors2Str(authors).trim(); // 把多个作者合并为一个字符串

    const item_authors2obj = this.formatAuthors2Obj(maxAuthorNum, authors); // 作者的对象
    // 2.处理 publicationTitle
    const item_publicationTitle = this.getPublicationTitleForItemType(item);
    const item_journalAbbreviation = item.getField("journalAbbreviation");
    // 处理参考文献引用(原封不动)
    let item_ref = Zotero.Cite.makeFormattedBibliographyOrCitationList(cslEngine, [item], "text");
    item_ref = item_ref.trim();
    // 处理参考文献引用2(去除[1])
    const item_ref2 = item_ref.replace(/^\[\d+\]|\(\d+\)|\d+\./, "").trim();

    // 处理标签
    const item_tags = new Set(item.getTags().map((tag: any) => tag.tag));

    // 处理Collections, 获得item 所在的 collection 名称
    const item_collection_name = this.getItemCollectionNames(item);
    /////////////// 构建 JSON 数据, 用于生成 CSV  //////////////
    // 创建一个对象, 用于存储基本信息
    const jsonData_part_1 = {
      Type: item_type,
      CitationKey: item_ckey,
      Bibliography: item_ref,
      Bibliography2: item_ref2,
      Title: item_title,
      Authors: item_authors2str,
      Collections: item_collection_name,
      PublicationTitle: item_publicationTitle,
      JournalAbbreviation: item_journalAbbreviation,
      Date: item_date,
      DateAdded: item_dateAdded,
      DateModified: item_dateModified,
      DOI: item_doi,
    };
    // 创建一个对象, 检查每个标签是否存在
    const jsonData_part_2: Record<string, number> = {};
    selectTagSets.forEach((keyA: string) => {
      jsonData_part_2[keyA] = item_tags.has(keyA) ? 1 : 0;
    });
    // 合并多个对象
    const jsonData = Object.assign({}, jsonData_part_1, item_authors2obj, jsonData_part_2);
    return jsonData;
  }

  // 7. 循环每个 item, 获取数据, 得到一个数组对象, 然后转为 csv
  static generateFile(items: any, filetype: string) {
    /*
      参数: items: 选择的条目, filetype: 导出的文件类型
    */
    const cslEngine = Basefun.getQuickCopyFormat2();
    const libColorTagSet = this.getLibTagColors(items);
    const selectTagSets = this.getSelectTagColors(items, libColorTagSet);
    const ItemsData = [];
    const maxAuthorNum = this.getMaxAuthorNum(items); // 获取最大作者数

    // 循环每个 item, 获取数据
    for (const item of items) {
      const itemdata = this.getItemData(item, selectTagSets, maxAuthorNum, cslEngine);
      ItemsData.push(itemdata);
    }
    if (filetype == "json") {
      return JSON.stringify(ItemsData, null, 2);
    } else {
      const csv = this.convertJsonToCsv(ItemsData);
      return csv;
    }
  }
}

export {
  ResultInfo, // 返回结果信息类
  Basefun, // 基础的选择函数
  Selected, // for 循环来处理
  SelectedWithHandler, //  异步处理
  FeildExport, // 导出字段整理
};
