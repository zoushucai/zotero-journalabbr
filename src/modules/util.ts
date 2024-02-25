import { BasicExampleFactory } from "./examples";
import { getString } from "../utils/locale";
import { StringUtil } from "./stringutil";
import { config } from "../../package.json";

import { AbbrevIso } from "./nodeBundle";
import { ltwa } from "./ltwa";
import { shortWords } from "./shortwords";
const abbrevIso = new AbbrevIso(ltwa, shortWords);

/**
 * 定义返回的结果的类,用于信息输出
 * @class ResultInfo
 * @property {number} selectCount 选中的条目数量
 * @property {number} successCount 成功的条目数量
 * @property {Array<string | number>} error_arr 错误的信息数组
 * @property {string} strinfo 信息字符串
 */
class ResultInfo {
  selectCount = 0;
  successCount = 0;
  error_arr: Array<string | number> = [];
  strinfo = "";
}

/**
 * 定义基本的函数类
 * @class Basefun
 * @method filterSelectedItems 用于筛选合格的条目, 所选的条目应该 过滤笔记 且 是规则的 item
 * @method processSelectedItemsWithPromise 对选中的条目进行处理, 传递的第一个参数为处理函数, 第二个参数为成功的提示信息, 第三个参数为失败的提示信息, 第四个参数为是否显示提示信息, 第五个参数为选中的条目
 * @method executeFunctionWithTryCatch 对函数进行 try ... catch ... 处理,传入不同的函数, 以及不同的提示信息, 返回一个 ResultInfo 类型的对象
 * @method get_user_data 根据文件路径读取文件, 把文件的内容作为用户缩写数据集
 * @method read_json 根据json文件路径读取文件, 把文件的内容作为用户缩写数据集
 * @method read_csv 根据csv文件路径读取文件, 把文件的内容作为用户缩写数据集
 * @method getDir 选择打开文件窗口, 选择文件路径, 把选择的文件路径返回
 * @method getQuickCopyFormat 获取当前的快速复制格式
 * @method getQuickCopyFormat2 获取当前的快速复制格式, 并返回一个 cslEngine
 *
 */
class Basefun {
  /**
   * 用于筛选合格的条目, 所选的条目应该 过滤笔记 且 是规则的 item
   * @returns {Array<Zotero.Item> | undefined} 返回一个数组, 里面包含选中的条目, 如果没有选中的条目, 则返回 undefined
   */
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

  /**
   * 功能: 对选中的条目进行处理, 传递的第一个参数为处理函数, 第二个参数为成功的提示信息, 第三个参数为失败的提示信息, 第四个参数为是否显示提示信息, 第五个参数为选中的条目
   * @param {function} handler , 传递的第一个参数为处理函数, 该函数返回一个 Promise<boolean>
   * @param {string} successMessage , 传递的第二个参数为成功的提示信息
   * @param {string} errorMessage , 传递的第三个参数为失败的提示信息
   * @param {boolean} [showInfo=true] - showInfo , 传递的第四个参数为是否显示提示信息. 默认为 true
   * @param {Array<Zotero.Item>} [selectedItems] - selectedItems  , 传递的第五个参数为选中的条目, 如果没有传递, 则默认为当前选中的条目
   */
  static async processSelectedItemsWithPromise(
    handler: (item: any) => Promise<boolean>,
    successMessage: string,
    errorMessage: string,
    showInfo: boolean = true,
    selectedItems?: Array<Zotero.Item>,
  ) {
    try {
      if (!selectedItems) {
        selectedItems = this.filterSelectedItems();
        if (!selectedItems) return;
      }
      Zotero.debug(" ------------------------------------------- ");
      ztoolkit.log(`selectedItems.length: ${selectedItems.length}`);
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

  /**
   * 对函数进行 try ... catch ... 处理,传入不同的函数, 以及不同的提示信息, 返回一个 ResultInfo 类型的对象
   * @param func  要执行的函数, 该函数返回一个对象, 该对象包含 selectCount, successCount, error_arr 三个属性
   * @param successMessage  成功的提示信息
   * @param errorMessage  失败的提示信息
   * @param errorInfo  错误的提示信息
   * @returns  返回一个 ResultInfo 类型的对象
   */
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

  /**
   * 根据文件路径读取文件, 把文件的内容作为用户缩写数据集
   * @param showinfo  布尔类型  是否显示提示信息--仅限于所选文件为空时以及 不是csv或者json文件时
   * @returns 返回用户缩写数据集, 是一个字典对象, key 为原始期刊名(全部是小写且删除多余的空格), value 为缩写
   */
  static async get_user_data(isshowinfo: boolean = true) {
    //Zotero.Prefs.set("journalabbr.userpath", zoteroProfileDir); // 持久化设置
    const userfile = Zotero.Prefs.get(`${config.addonRef}.input`) as string; // 获得持久化的变量, 文件路径
    if (!userfile) {
      if (isshowinfo) {
        BasicExampleFactory.ShowError("所选文件为空, 该操作取消");
      }
      return;
    }

    const fileExtension = userfile.split(".").pop()?.toLowerCase();
    // const fileExtension = Zotero.File.getExtension(userfile);
    if (!fileExtension || (fileExtension !== "csv" && fileExtension !== "json")) {
      if (isshowinfo) {
        BasicExampleFactory.ShowError("请先选择 csv 或者 json 文件");
      }
      return;
    }

    let user_abbr_data = null;
    switch (fileExtension) {
      case "csv":
        user_abbr_data = await this.read_csv(userfile);
        break;
      case "json":
        user_abbr_data = await this.read_json(userfile);
        break;
      default:
        BasicExampleFactory.ShowError("文件格式错误");
        break;
    }
    if (!user_abbr_data || typeof user_abbr_data !== "object") {
      BasicExampleFactory.ShowError("读取文件失败，文件可能不存在或格式错误！");
      return;
    }
    return user_abbr_data;
  }

  /**
   * 根据json文件路径读取文件, 把文件的内容作为用户缩写数据集
   * @param filePath  字符串类型  代表文件路径
   * @returns  返回用户缩写数据集, 是一个字典对象, key 为原始期刊名(全部是小写且删除多余的空格), value 为缩写
   */
  static async read_json(filePath: string) {
    try {
      const data_str = (await Zotero.File.getContentsAsync(filePath)) as string;
      const data_obj = JSON.parse(data_str);
      if (typeof data_obj !== "object" || data_obj === null || Array.isArray(data_obj)) {
        return null;
      }
      const user_abbr_data: { [key: string]: any } = {}; // 用于存储转换后的数据

      // // 使用 for in 方法
      // for (const key in data_obj) {
      //   // 只保留字符串类型的键值对
      //   if (typeof data_obj[key] === "string" && typeof key === "string") {
      //     const normkey = key.toLowerCase().trim(); // 将当前键转为小写并去除两端空格
      //     // 给新对象添加当前键值对, 且键重复时, 会覆盖旧值,即保留最后一次出现的键值对
      //     user_abbr_data[normkey] = data_obj[key].trim();
      //   }
      // }
      // return user_abbr_data;

      // // 使用 forEach 方法
      Object.entries(data_obj).forEach(([key, value]) => {
        if (typeof value === "string" && typeof key === "string") {
          const normkey = key.toLowerCase().trim();
          user_abbr_data[normkey] = value.trim();
        }
      });
      return user_abbr_data;
    } catch (error) {
      ztoolkit.log("---------------*********-----------------");
      ztoolkit.log(error);
      return null;
    }
  }

  /**
   * 根据csv文件路径读取文件, 把文件的内容作为用户缩写数据集
   * @param {string} filePath  字符串类型  代表文件路径
   * @returns {Promise<{ [key: string]: any } | null> | null} 返回用户缩写数据集, 是一个字典对象, key 为原始期刊名(全部是小写且删除多余的空格), value 为缩写
   */
  static async read_csv(filePath: string): Promise<{ [key: string]: any } | null> {
    const pref_separator = Zotero.Prefs.get(`${config.addonRef}.separator`) as string; // 获得持久化的变量, 读取用户设置的分割符号
    const user_abbr_data = await Selected.readAndParseCSV(filePath, pref_separator); // 读取 csv 文件并为字典对象
    return user_abbr_data;
  }

  /**
   * 选择打开文件窗口, 选择文件路径, 把选择的文件路径返回
   * @param {string} suggestion  字符串类型  为建议的文件名
   * @returns {Promise<string | false>} 返回一个字符串类型  代表文件路径, 如果没有选择文件, 则返回 false
   */
  static async getDir(suggestion: string) : Promise<string | false> {
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

  /**
   * 获取当前的快速复制格式
   * @returns {string | null} 返回一个字符串类型  代表当前的快速复制格式
   */
  static getQuickCopyFormat() {
    const format = Zotero.Prefs.get("export.quickCopy.setting") as string;
    if (!format || format.split("=")[0] !== "bibliography") {
      BasicExampleFactory.ShowError("No bibliography style is chosen in the settings for QuickCopy.");
      return null;
    }
    return format;
  }

  /**
   * 获取当前的快速复制格式, 并返回一个 cslEngine
   * @returns 返回一个 cslEngine
   */
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

/**
 * 定义一个 Selected 类, 用于辅助处理选中的条目
 * @class Selected  用于辅助处理选中的条目
 * @method processSelectItems 对选中的条目进行处理, 传递的第一个参数为处理函数, 第二个参数为成功的提示信息, 第三个参数为失败的提示信息, 第四个参数为是否显示提示信息, 第五个参数为选中的条目
 * @method exchangeJournalName 对选中的条目进行处理, 交换两个字段的值, 如果交换成功, 则添加给定的标签
 * @method readAndParseCSV 根据文件路径和分隔符,  读取 csv 文件并解析
 * @method updateJournalAbbr 定义一个共用的函数, 用于更新期刊缩写, 对选中的条目进行处理, 给定缩写数据集, 对item的期刊缩写进行更新, 如果更新成功, 则添加给定的标签, 如果更新失败, 则添加给定的标签
 * @method updateUseISO4 采用 iso-4 标准进行期刊缩写
 * @method getbibliography1 生成参考文献 --- 方法 1, 是整体处理, 把生成的参考文献看做一个字符串整体, 然后再进行处理
 * @method getbibliography2 生成参考文献 --- 方法 2, 把生成的参考文献看做一个字符串, 把这个字符串分割成三段, 然后再进行处理
 * @method transferAllItemsToCustomField 对选中的条目进行处理, 把所有类型的条目按照一定规则转到自定义的字段上, 这个字段是 extraField下面的 itemBoxRowabbr字段, 理论上根据itemBoxRowabbr的值, 映射到面板信息为abbr字段上
 * @method exportCitationkey 对选中的条目进行处理, 把 citationkey 的值, 更新到 extraField 下面的 itemBoxCitationkey 字段上
 */
class Selected {
  /**
   * 功能: 对选中的条目进行处理, 传递的第一个参数为处理函数, 第二个参数为成功的提示信息, 第三个参数为失败的提示信息, 第四个参数为是否显示提示信息, 第五个参数为选中的条目
   * @param {function} transformFn , 传递的第一个参数为处理函数
   * @param {Zotero.Item.ItemField} key , 传递的第二个参数为成功的提示信息
   * @param {Array<Zotero.Item>} [selectedItems]  , 传递的第三个参数为选中的条目, 如果没有传递, 则默认为当前选中的条目
   * @returns 返回一个 ResultInfo 类型的对象
   */
  static async processSelectItems(transformFn: (originalValue: string) => string, key: Zotero.Item.ItemField = "journalAbbreviation", selectedItems?: Array<Zotero.Item>) {
    if (!selectedItems) {
      selectedItems = Basefun.filterSelectedItems();
      if (!selectedItems) return;
    }
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
          item.setField(key, current?.trim());
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
  /**
   * 对选中的条目进行处理, 交换两个字段的值, 如果交换成功, 则添加给定的标签,
   * @param {Zotero.Item.ItemField} [key1="journalAbbreviation"]  , 字符串类型  默认为 journalAbbreviation
   * @param {Zotero.Item.ItemField} [key2="publicationTitle"]  , 字符串类型  默认为 publicationTitle
   * @param {string} [exchangetagname="exchange"]  , 字符串类型  默认为 exchange, 当两个字段交换成功以后, 如果以前没有存在该标签, 则添加的标签, 如果以前存在该标签, 则删除
   * @param {Array<Zotero.Item>} [selectedItems]  , 传递的第四个参数为选中的条目, 如果没有传递, 则默认为当前选中的条目
   */
  static async exchangeJournalName(key1: Zotero.Item.ItemField = "journalAbbreviation", key2: Zotero.Item.ItemField = "publicationTitle", exchangetagname:string = "exchange", selectedItems?: Array<Zotero.Item>) {
    if (!selectedItems) {
      selectedItems = Basefun.filterSelectedItems();
      if (!selectedItems) return;
    }
    
    const selectedItemsLength = selectedItems.length;

    let successCount = 0;
    for (let i = 0; i < selectedItemsLength; i++) {
      const item = selectedItems[i];
      const currentabbr = item.getField(key1)?.trim();
      const currentjournal = item.getField(key2)?.trim();
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

  /**
   * 根据文件路径和分隔符,  读取 csv 文件并解析
   * @param {string} filePath  字符串类型  代表文件路径
   * @param {string} [delimiter=","]  字符串类型  代表分隔符
   * @returns {Promise<{ [key: string]: any } | null>} 返回用户缩写数据集, 是一个字典对象, key 为原始期刊名(全部是小写且删除多余的空格), value 为缩写
   */
  static async readAndParseCSV(filePath: string, delimiter:string = ","): Promise<{ [key: string]: any } | null> {
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

  /**
   * 定义一个共用的函数, 用于更新期刊缩写, 对选中的条目进行处理, 给定缩写数据集, 对item的期刊缩写进行更新, 如果更新成功, 则添加给定的标签, 如果更新失败, 则添加给定的标签
   * @param {Object} data , 给定的缩写数据集, 是一个字典对象, 第一列key为原始期刊名(全部是小写且删除多余的空格), 第二列value为缩写
   * @param {string} oldField , 字符串类型  为item 的字段名称,即要对item的字段,根据data,找出对应的缩写
   * @param {string} newField , 字符串类型  为item 的字段名称, 把找到的缩写更新到这个字段中
   * @param {Array<string>} addtagsname , 字符串数组类型, 当更新成功以后, 添加的标签, 用于标记识别
   * @param {Array<string>} removetagsname , 字符串数组类型, 当更新成功以后, 删除的标签, 防止重复
   * @param {string} successinfo , 字符串类型  更新成功的提示信息
   * @param {string} errorinfo , 字符串类型  更新失败的提示信息
   * @param {boolean} showInfo , 布尔类型  是否显示提示信息
   * @param {Array<Zotero.Item>} [selectedItems]  , 传递的第九个参数为要处理的项目数组（可选）, 如果没有传递, 则默认为当前选中的条目
   * @returns {Promise<void>} 返回一个 Promise<void>
   */
  static async updateJournalAbbr(
    data: { [key: string]: any },
    oldField: string,
    newField: string,
    addtagsname: string[],
    removetagsname: string[],
    successinfo: string,
    errorinfo: string,
    showInfo: boolean,
    selectedItems?: Array<Zotero.Item>,
  ): Promise<void> {
    await Basefun.processSelectedItemsWithPromise(
      SelectedWithHandler.updateJournalAbbrHandler(data, oldField, newField, addtagsname, removetagsname),
      successinfo,
      errorinfo,
      showInfo,
      selectedItems,
    );
  }

  /**
   * 采用 iso-4 标准进行期刊缩写
   * @param {Object} data , 给定的缩写数据集, 是一个字典对象, 第一列key为原始期刊名(全部是小写且删除多余的空格), 第二列value为缩写, 这里主要是 data 为了保持一致, 一般用{}即可
   * @param {string} oldField , 字符串类型  为item 的字段名称,即要对item的字段,根据 iso标准, 找出对应的缩写
   * @param {string} newField , 字符串类型  为item 的字段名称, 把找到的缩写更新到这个字段中
   * @param {Array<string>} addtagsname , 字符串数组类型, 当更新成功以后, 添加的标签, 用于标记识别
   * @param {Array<string>} removetagsname , 字符串数组类型, 当更新成功以后, 删除的标签, 防止重复
   * @param {string} successinfo , 字符串类型  更新成功的提示信息
   * @param {string} errorinfo , 字符串类型  更新失败的提示信息
   * @param {boolean} showInfo , 布尔类型  是否显示提示信息
   * @param {Array<Zotero.Item>} [selectedItems]  - , 为要处理的项目数组（可选）
   */
  static async updateUseISO4(
    data: { [key: string]: any },
    oldField: string,
    newField: string,
    addtagsname: string[],
    removetagsname: string[],
    successinfo: string,
    errorinfo: string,
    showInfo: boolean,
    selectedItems?: Array<Zotero.Item>,
  ) {
    await Basefun.processSelectedItemsWithPromise(
      SelectedWithHandler.updateJournalAbbrHandlerISO4(data, oldField, newField, addtagsname, removetagsname),
      successinfo,
      errorinfo,
      showInfo,
      selectedItems,
    );
  }

  /**
   * 生成参考文献 --- 方法 1, 是整体处理, 把生成的参考文献看做一个字符串整体, 然后再进行处理
   * @returns 返回一个 ResultInfo 类型的对象
   */
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

  /**
   * 生成参考文献 --- 方法 2, 把生成的参考文献看做一个字符串, 把这个字符串分割成三段, 然后再进行处理
   * @returns 返回一个 ResultInfo 类型的对象
   */
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

  /**
   * 对选中的条目进行处理, 把所有类型的条目按照一定规则转到自定义的字段上, 这个字段是 extraField下面的 itemBoxRowabbr字段, 理论上根据itemBoxRowabbr的值, 映射到面板信息为abbr字段上
   * @param {Array<Zotero.Item>} [selectedItems]  , 传递的第一个参数为要处理的项目数组（可选）, 如果没有传递, 则默认为当前选中的条目
   */
  static async transferAllItemsToCustomField(selectedItems?: Array<Zotero.Item>) {
    try {
      if (!selectedItems) {
        selectedItems = Basefun.filterSelectedItems();
        if (!selectedItems) return;
      }
      const ruleItemCount = selectedItems.length;
      const selectExtraField = "itemBoxRowabbr";
      for (let i = 0; i < ruleItemCount; i++) {
        try {
          const item = selectedItems[i];
          const newfieldvalue = FeildExport.getPublicationTitleForItemType(item)?.trim();
          const oldfieldvalue = ztoolkit.ExtraField.getExtraField(item, selectExtraField)?.trim();
          if (newfieldvalue && newfieldvalue !== oldfieldvalue) {
            await ztoolkit.ExtraField.setExtraField(item, selectExtraField, newfieldvalue);
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      ztoolkit.log("------------------------------------");
      ztoolkit.log(`"journalabbr error: ${error}`);
    }
  }

  /**
   * 对选中的条目进行处理, 把 citationkey 的值, 更新到 extraField 下面的 itemBoxCitationkey 字段上
   * @returns 返回一个 ResultInfo 类型的对象
   *  
   */
  static async exportCitationkey() {
    const selectedItems = Basefun.filterSelectedItems();
    if (!selectedItems) return;
    const ruleItemCount = selectedItems.length;
    const successfulCount = [];
    const noActionCount = [];
    const missingInfoItemCount = [];

    let strinfo = "";
    const selectExtraField = "itemBoxCitationkey";
    for (let i = 0; i < ruleItemCount; i++) {
      try {
        const mitem = selectedItems[i];
        const ckey = (mitem.getField("citationKey") || "")?.trim();
        // 可以设置不同的样式
        if (i + 1 == ruleItemCount) {
          strinfo = strinfo + ckey;
        } else {
          strinfo = strinfo + ckey + ", ";
        }
        strinfo = strinfo.trim();
        if (ckey) {
          const oldfieldvalue = ztoolkit.ExtraField.getExtraField(mitem, selectExtraField)?.trim();
          if (ckey !== oldfieldvalue) {
            await ztoolkit.ExtraField.setExtraField(mitem, selectExtraField, ckey);
          }
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

/**
 * 定义一个 SelectedWithHandler 类, 用于处理选中的条目, 辅助类
 * @class SelectedWithHandler 用于处理选中的条目, 辅助类
 * @method removeTagHandler 用于移除标签的处理函数
 * @method updateJournalAbbrHandler 用于更新期刊缩写的处理函数
 * @method updateJournalAbbrHandlerISO4 对期刊进行缩写, 使用 iso-4 标准进行缩写
 */
class SelectedWithHandler {
  /**
   * 移除标签的处理函数
   * @param {Array<string>} usertags  字符串数组类型, 要移除的标签
   * @returns {function} 返回一个处理函数
   */
  static removeTagHandler(usertags: string[]): (item: any) => Promise<boolean>{
    return async (item: any) => {
      const success = item.removeTag(usertags[0]);
      if (success) {
        await item.saveTx();
      }
      return success;
    };
  }

  /**
   * 更新期刊缩写的处理函数
   * @param { { [key: string]: any } } data  期刊缩写的数据集, 是一个字典对象, key 为原始期刊名(全部是小写且删除多余的空格), value 为缩写
   * @param {string} oldField  字符串类型  为item 的字段名称,即要对item的字段,根据data,找出对应的缩写
   * @param {string} newField  字符串类型  为item 的字段名称, 把找到的缩写更新到这个字段中
   * @param {Array<string>} addtagsname  字符串数组类型, 当更新成功以后, 添加的标签, 用于标记识别
   * @param {Array<string>} removetagsname  字符串数组类型, 当更新成功以后, 删除的标签, 防止重复
   * @returns  返回一个处理函数
   */
  static updateJournalAbbrHandler(data: { [key: string]: any }, oldField: string, newField: string, addtagsname: string[], removetagsname: string[]) {
    return async (item: any) => {
      let currentjournal;
      let currentabbr;
      if (oldField === "itemBoxRowabbr") {
        currentjournal = await ztoolkit.ExtraField.getExtraField(item, oldField);
      } else {
        currentjournal = await item.getField(oldField);
      }

      if (newField === "itemBoxRowabbr") {
        currentabbr = await ztoolkit.ExtraField.getExtraField(item, newField);
      } else {
        currentabbr = await item.getField(newField);
      }

      if (!currentjournal) {
        return false;
      }

      const journalKey = currentjournal.trim().toLowerCase().replace(/\s+/g, " ").trim();
      const data_in_journal = data[journalKey]?.trim();
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

  /**
   * 对期刊进行缩写, 使用 iso-4 标准进行缩写
   * @param { { [key: string]: any } } data 为了保持一致, 这里这个data参数没有用到, 一般用传递 {} 即可
   * @param {string} oldField  字符串类型  为item 的字段名称,即要对item的字段,根据 iso标准, 找出对应的缩写
   * @param {string} newField  字符串类型  为item 的字段名称, 把找到的缩写更新到这个字段中
   * @param {Array<string>} addtagsname  字符串数组类型, 当更新成功以后, 添加的标签, 用于标记识别
   * @param {Array<string>} removetagsname  字符串数组类型, 当更新成功以后, 删除的标签, 防止重复
   * @returns 返回一个处理函数
   */
  static updateJournalAbbrHandlerISO4(data: { [key: string]: any }, oldField: string, newField: string, addtagsname: string[], removetagsname: string[]) {
    return async (item: any) => {
      try {
        let currentjournal = (await item.getField(oldField))?.trim();
        const currentabbr = (await item.getField(newField))?.trim();
        if (!currentjournal) return false;

        currentjournal = currentjournal.replace(/\s+/g, " ").trim();

        const abbred_iso4_journal = abbrevIso.makeAbbreviation(currentjournal)?.trim();
        if (!abbred_iso4_journal) return false;

        const isIdentical = currentabbr?.trim() === abbred_iso4_journal?.trim();
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
        ztoolkit.log("--------------------------------------------");
        ztoolkit.log(`Error in updateJournalAbbrHandlerISO4: ${error}`);
        return false;
      }
    };
  }
}

/**
 * 定义一个 FeildExport 类, 用于处理字段导出, 辅助类\
 * @class FeildExport 用于处理字段导出, 辅助类
 * @method convertJsonToCsv  把jsonData转换为csv
 * @method formatAuthors2Str  把 数组authors按照一定的格式进行处理,转为字符串
 * @method formatAuthors2Obj  把数组authors按照一定的格式进行处理,转为对象
 * @method getPublicationTitleForItemType  给定一个 item, 根据item的类型, 获取不同类型的期刊名称, 这里都用 publicationTitle 表示, 特别的, 对于 journalarticle 类型, 优先使用 journalAbbreviation, 如果没有, 则使用 publicationTitle
 * @method getLibTagColors  获取当前库的标签颜色
 * @method getSelectTagColors  获取选择条目的所有带颜色的标签, 返回一个 Set, 因此选择条目的标签颜色 是 当前库的标签颜色的子集
 * @method getItemCollectionNames  获取当前 item 所在的 collection 名称
 * @method getMaxAuthorNum 返回的是一个数字,  表示所选条目中最大的作者数, 根据所选的条目, 统计所选条目中最大作者数,
 * @method getItemData  获取 item 的基本信息, 生成一个对象, 用于存储 item 的基本信息
 * @method generateFile 循环每个 item, 获取数据, 得到一个数组对象, 然后转为 csv
 */
class FeildExport {
  /**
   * 把jsonData转换为csv
   * @param {any} jsonData  是一个数组对象, 把数组对象转换为 csv
   * @returns {string} 返回一个字符串, 表示转换后的csv
   */
  static convertJsonToCsv(jsonData: any): string {
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

  /**
   * 把 数组authors按照一定的格式进行处理,转为字符串
   * @param {any} authors  是一个数组对象, 每个对象一般有两个属性: firstName, lastName,
   * @returns 返回一个字符串
   * 作用: 通过遍历数组, 把数组中的每个对象的 firstName 和 lastName 进行拼接,空格隔开, 然后再把数组中的每个对象拼接起来, 用逗号隔开, 最终返回一个字符串
   */
  static formatAuthors2Str(authors: any) {
    if (Array.isArray(authors) && authors.length > 0) {
      const formattedAuthors = authors.map((author) => `${author.firstName} ${author.lastName}`.trim());
      return formattedAuthors.join(", ").trim();
    } else {
      return "";
    }
  }

  /**
   * 把数组authors按照一定的格式进行处理,转为对象
   * @param {number} maxAuthorNum  是一个数字, 表示当前选择的 item 种 最大的作者数量
   * @param {any} authors  是一个数组对象, 每个对象一般有两个属性: firstName, lastName,
   * @returns  返回一个对象
   * 作用: 通过遍历数组, 把数组中的每个对象的 firstName 和 lastName 进行拼接,空格隔开, 然后把拼接后的字符串 作为jsonData_author 的属性, 最终返回一个对象
   */
  static formatAuthors2Obj(maxAuthorNum: number, authors: any) {
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

  /**
   * 给定一个 item, 根据item的类型, 获取不同类型的期刊名称, 这里都用 publicationTitle 表示, 特别的, 对于 journalarticle 类型, 优先使用 journalAbbreviation, 如果没有, 则使用 publicationTitle
   * @param {any} item  传递的 item
   * @returns 返回一个字符串
   * 作用: 通过 item 的类型, 处理 PublicationTitle, 从不同类型的 item 中获取
   */
  static getPublicationTitleForItemType(item: any) {
    const itype = item.itemType.toLowerCase();
    let publicationTitle;
    let journalAbbreviation;
    switch (itype) {
      case "thesis":
        publicationTitle = item.getField("university");
        break;
      case "book":
        publicationTitle = item.getField("publisher");
        break;
      case "journalarticle":
        journalAbbreviation = item.getField("journalAbbreviation");
        if (!journalAbbreviation) {
          publicationTitle = item.getField("publicationTitle");
        } else {
          publicationTitle = journalAbbreviation;
        }
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
          journalAbbreviation = item.getField("journalAbbreviation");
          if (!journalAbbreviation) {
            publicationTitle = item.getField("publicationTitle");
          } else {
            publicationTitle = journalAbbreviation;
          }
        } catch (e) {
          publicationTitle = "";
        }
        break;
    }
    return (publicationTitle ?? "").trim();
  }

  /**
   * 获取当前库的标签颜色
   * @param items  表示当前选择的 items, 本质items没有用到, 只是为了获取当前库的标签颜色
   * @returns 返回一个 Set
   * 作用: 获取整个库的所有带颜色的标签, 返回一个 Set
   * 方式 2: 直接获取库的标签颜色
   */
  static getLibTagColors(items: any) {
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

  /**
   * 获取选择条目的所有带颜色的标签, 返回一个 Set, 因此选择条目的标签颜色 是 当前库的标签颜色的子集
   * @param items  表示当前选择的 items
   * @param tagSet  表示当前库的所有标签颜色
   * @returns 返回一个 Set, 表示选择条目的所有带颜色的标签
   */
  static getSelectTagColors(items: any, tagSet: any) {
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

  /**
   * 获取当前 item 所在的 collection 名称
   * @param item  表示当前选择的 item
   * @returns 返回一个字符串
   * 作用: 获取当前 item 所在的 collection 名称, 返回一个字符串
   */
  static getItemCollectionNames(item: any) {
    const ids = item.getCollections();
    const data = Zotero.Collections.get(ids);
    const newList = JSON.parse(JSON.stringify(data));
    return newList.map((item: any) => item.name).join(", ");
  }

  /**
   * 返回的是一个数字,  表示所选条目中最大的作者数, 根据所选的条目, 统计所选条目中最大作者数,
   * @param items  表示当前选择的 items
   * @returns 返回一个数字
   */
  static getMaxAuthorNum(items: any) {
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

  /**
   * 获取 item 的基本信息, 生成一个对象, 用于存储 item 的基本信息
   * @param {any} item  传递的 item, 但由于 dateAdded 和 dateModified 不在 Zotero.Item 指定的属性中, 这里用 any 类型
   * @param {any} selectTagSets  选择的标签集合
   * @param {number} maxAuthorNum  最大作者数量
   * @param {any} cslEngine  生成参考文献格式的引擎
   * @returns 返回一个对象, 用于存储 item 的基本信息, 这个对象可以转为 csv
   */
  static getItemData(item: any,  selectTagSets: any, maxAuthorNum: number, cslEngine: any) {
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

  /**
   * 循环每个 item, 获取数据, 得到一个数组对象, 然后转为 csv
   * @param {Array<Zotero.Item>} items  选择的条目,是数组
   * @param {string} filetype  导出的文件类型, 可以是 json 或者 csv(默认是 csv)
   * @returns 返回一个字符串
   */
  static generateFile(items: Array<Zotero.Item>, filetype: string) {
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
