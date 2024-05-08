import { config } from "../../package.json";
import { getString } from "../utils/locale";

import { journal_abbr } from "./data";
import { replaceHandle, filterValidEntries } from "./replacehandle";
import {
  Basefun, // 基础的选择函数
  Selected, // for 循环来处理
  SelectedWithHandler, //  异步处理
  FeildExport, // 字段导出
} from "./baseselect";

function example(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
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
  // 剪贴板
  @example
  static async copyToClipboard(text: string) {
    new ztoolkit.Clipboard().addText(text, "text/unicode").copy();
  }
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
  static ShowPopUP(
    descInfo: string,
    headerInfo: string = getString(`${config.addonRef}`),
    n = 3000,
  ) {
    const progressWindow = new Zotero.ProgressWindow({ closeOnClick: true });
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

  /**
   * 通过文件选择器选择文件
   * @param {string} fileExtension 文件扩展名, 默认为 *.csv;*.json,如果多个扩展名,则用分号隔开
   * @returns {Promise<string | null>} 返回选择的文件路径, 如果没有选择, 则返回 null
   */
  @example
  static async filePickerExample(
    fileExtension: string = "*.csv;*.json",
  ): Promise<string | null> {
    const showfileExtension = fileExtension
      .split(";")
      .map((item) => item.split(".").pop())
      .join("/");
    const path = await new ztoolkit.FilePicker("Import File", "open", [
      [`${showfileExtension}(${fileExtension})`, fileExtension],
      ["Any(*.*)", "*"],
    ]).open();

    // 判断选择的地址是否为空,以及是否为字符串 false
    return typeof path === "string" &&
      path !== "" &&
      path !== "false" &&
      path !== "undefined" &&
      path !== "null"
      ? path
      : null;
    //ztoolkit.getGlobal("alert")(`Selected ${path}`);
  }

  /**
   * 通过绑定事件,如果改变了下拉框/复选框的值,则显示相应的信息
   * @param event 事件对象
   */
  @example
  static async showChangeEventInfo(event: Event) {
    const target = event.target as HTMLInputElement;
    const selectedValue = target.value.trim();
    const isChecked = target.checked;

    if (selectedValue && typeof isChecked === "boolean") {
      this.ShowPopUP(`Checkbox is ${isChecked ? "" : "not "}checked`);
    } else if (selectedValue) {
      this.ShowPopUP(`Select ${selectedValue}`);
    } else {
      this.ShowPopUP("No option is selected");
    }
  }
  static async showChangeMenulistEventInfo(event: Event) {
    const target = event.target as HTMLInputElement;
    const selectedValue = target.value.trim();
    const isChecked = target.checked;

    if (selectedValue && typeof isChecked === "boolean") {
      this.ShowPopUP(`Checkbox is ${isChecked ? "" : "not "}checked`);
    } else if (selectedValue) {
      this.ShowPopUP(`Select ${selectedValue}`);
    } else {
      this.ShowPopUP("No option is selected");
    }
  }

  /**
   * 主要用于显示参考文献转换信息
   * @param {number} ruleItemCount  规则的 item 数量
   * @param {number} successfulCount  成功的数量
   * @param {number} noActionCount  没有操作的数量
   * @param {number} missingInfoItemCount  缺少信息的数量
   * @returns null, 无返回值
   */
  static async showBibConversionStatus(
    ruleItemCount: number,
    successfulCount: number,
    noActionCount: number,
    missingInfoItemCount: number,
  ) {
    if (successfulCount > 0) {
      this.ShowStatus(ruleItemCount, successfulCount, "items are converted.");
    }
    if (noActionCount > 0) {
      this.ShowStatus(ruleItemCount, noActionCount, "items are not converted.");
    }
    if (missingInfoItemCount > 0) {
      this.ShowStatus(
        ruleItemCount,
        missingInfoItemCount,
        "items are missing information.",
      );
    }
  }

  /**
   * 对于首次安装的用户,初始化设置, 用于设置默认值
   * @returns 无
   */
  @example
  static async initPrefs() {
    const initpref_data = {
      [config.addonRef + ".input"]: Zotero.Prefs.get("dataDir"),
      [config.addonRef + ".separator"]: ",",
      [config.addonRef + ".sortoptions"]: "originid", // 二维数组:[fianl_bib, nkey, ntitle, nauthor, id_arr], 利用['originid','nkey','ntitle','nauthor','id']来排序,这是他们的列名
      [config.addonRef + ".keyornum"]: "num", //
      [config.addonRef + ".discardDOI"]: true,
      [config.addonRef + ".bibemptyline"]: true,
      [config.addonRef + ".addAutotags"]: true,
      [config.addonRef + ".autorunabbrall"]: false,
      //[config.addonRef + ".isreplaceJsoncFile"]: true,
      [config.addonRef + ".addRegexAutotags"]: true,
      [config.addonRef + ".replaceJsonFile"]: "",
    };
    // BasicExampleFactory.ShowPopUP(`${Zotero.Prefs.get(config.addonRef + ".addAutotags")}`);
    // Check if preference is already set and set it if not
    for (const p in initpref_data) {
      //BasicExampleFactory.ShowPopUP(`initPrefs: ${p}`, getString(`${config.addonRef}`),9000);
      if (typeof Zotero.Prefs.get(p) === "undefined") {
        Zotero.Prefs.set(p, initpref_data[p] as string);
      }
    }
  }

  @example
  static registerNotifier() {
    const callback = {
      notify: async (
        event: string,
        type: string,
        ids: number[] | string[],
        extraData: { [key: string]: any },
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
      false,
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
      label: getString("prefs-title"),
      image: `chrome://${config.addonRef}/content/icons/favicon.png`,
      defaultXUL: true,
    };
    ztoolkit.PreferencePane.register(prefOptions);
  }
}

export class UIExampleFactory {
  // 注册右键菜单
  @example
  static registerRightClickMenuItem() {
    const menuIcon = `chrome://${config.addonRef}/content/icons/faviconsmall.png`;
    // item menuitem with icon
    ztoolkit.Menu.register("item", {
      tag: "menu",
      id: "zotero-itemmenu-abbr-journal-export",
      label: getString("menupopup-export"), //期刊缩写导出
      children: [
        {
          tag: "menuitem",
          id: "zotero-itemmenu-abbr-journal-bibliography1",
          label: getString("menuitem-bibliography1"),
          commandListener: (ev) => HelperAbbrFactory.JA_getbibliography1(),
        },
        {
          tag: "menuitem",
          id: "zotero-itemmenu-abbr-journal-bibliography2",
          label: getString("menuitem-bibliography2"),
          commandListener: (ev) => HelperAbbrFactory.JA_getbibliography2(),
        },
        {
          tag: "menuseparator",
        },
        // 弃用
        // {
        //   tag: "menuitem",
        //   id: "zotero-itemmenu-abbr-journal-abbrkey",
        //   label: "show Ckey", // 该key 直接从 biblatex 中获取, 用于生成 citationKey
        //   commandListener: (ev) => HelperAbbrFactory.JA_exportAbbrKey(),
        // },
        {
          tag: "menuitem",
          id: "zotero-itemmenu-abbr-journal-exportcsv",
          label: "export csv",
          commandListener: (ev) => HelperAbbrFactory.JA_selectItemsExportCsv(),
        },
      ],
      icon: menuIcon,
    });
  }

  // 右键菜单: 期刊缩写
  @example
  static registerRightClickMenuPopup() {
    const menuIcon = `chrome://${config.addonRef}/content/icons/faviconsmall.png`;
    ztoolkit.Menu.register("item", {
      tag: "menu",
      id: "zotero-itemmenu-abbr-journal",
      label: getString("menupopup-label"), //期刊缩写
      children: [
        {
          tag: "menuitem",
          label: getString("menuitem-updateUserAbbr"), // 子菜单: 用户指定期刊缩写路径
          id: "zotero-itemmenu-abbr-journal-updateUserAbbr",
          commandListener: (ev) => HelperAbbrFactory.JA_update_UseUserData(), // JA  表示journalAbbreviation
        },
        {
          tag: "menuitem",
          label: getString("menuitem-updatejournal"), // 子菜单: 更新简写期刊 -- 从内置数据
          id: "zotero-itemmenu-abbr-journal-updatejournal",
          commandListener: (ev) => HelperAbbrFactory.JA_update_UseInnerData(),
        },
        {
          tag: "menuitem",
          label: "ISO-4 standard", // 子菜单: 更新简写期刊 -- 利用ISO4缩写
          id: "zotero-itemmenu-abbr-iso4",
          commandListener: (ev) => HelperAbbrFactory.JA_update_UseISO4(),
        },
        {
          tag: "menuitem",
          id: "zotero-itemmenu-abbr-journal-onestepupate",
          label: getString("menuitem-onestepupate"),
          commandListener: (ev) => HelperAbbrFactory.JA_oneStepUpdate(),
        },
        //添加分割条
        {
          tag: "menuseparator",
        },
        {
          tag: "menuitem",
          label: getString("menuitem-abbrToupper"), // 子菜单: 简写期刊大写
          id: "zotero-itemmenu-abbr-journal-abbrToupper",
          commandListener: (ev) => HelperAbbrFactory.JA_toUpperCase(),
        },
        {
          tag: "menuitem",
          label: getString("menuitem-abbrTolower"), // 子菜单: 简写期刊小写
          id: "zotero-itemmenu-abbr-journal-abbrTolower",
          commandListener: (ev) => HelperAbbrFactory.JA_toLowerCase(),
        },
        {
          tag: "menuitem",
          label: getString("menuitem-abbrTocapitalize"), // 子菜单: 简写期刊首字母大写
          id: "zotero-itemmenu-abbr-journal-abbrTocapitalize",
          commandListener: (ev) => HelperAbbrFactory.JA_toCapitalize(),
        },
        {
          tag: "menuitem",
          label: getString("menuitem-removeAbbrdot"), // 子菜单: 移除简写期刊中的点
          id: "zotero-itemmenu-abbr-journal-removeAbbrdot",
          commandListener: (ev) => HelperAbbrFactory.JA_removeDot(),
        },
        {
          tag: "menuitem",
          label: getString("menuitem-InitialismAbbr"), // 子菜单: 提取简写期刊的首字母并大写(简称极致的简写)
          id: "zotero-itemmenu-abbr-journal-InitialismAbbr",
          commandListener: (ev) => HelperAbbrFactory.JA_InitialismAbbr(),
        },
        {
          tag: "menuitem",
          label: getString("menuitem-exchange"), // 子菜单: 交换期刊名
          id: "zotero-itemmenu-abbr-journal-exchange",
          commandListener: (ev) => HelperAbbrFactory.JA_exchangeName(),
        },
        //添加分割条
        {
          tag: "menuseparator",
        },
        {
          tag: "menuitem",
          label: getString("menuitem-deleteAbbrTag"), // 子菜单: 删除abbr标签
          id: "zotero-itemmenu-abbr-journal-deleteAbbrTag",
          commandListener: (ev) => HelperAbbrFactory.JA_removeTagname(["abbr"]),
        },
        {
          tag: "menuitem",
          label: getString("menuitem-deleteUserTag"), // 子菜单: 删除 abbr_user 标签
          id: "zotero-itemmenu-abbr-journal-deleteUserTag",
          commandListener: (ev) =>
            HelperAbbrFactory.JA_removeTagname(["abbr_user"]),
        },
        {
          tag: "menuseparator",
        },
        {
          tag: "menuitem",
          label: getString("menuitem-selectFile"), // 子菜单: 选择文件, 通过选择文件来自定义缩写期刊
          id: "zotero-itemmenu-abbr-journal-selectFile",
          commandListener: (ev) => HelperAbbrFactory.buttonSelectFilePath(),
        },
        {
          tag: "menuitem",
          id: "zotero-itemmenu-abbr-journal-replacejsonFile",
          label: "replace",
          commandListener: (ev) => HelperAbbrFactory.JA_ReplaceByJson(),
        },
        {
          tag: "menuitem",
          id: "zotero-itemmenu-abbr-journal-itemBoxRowabbr",
          label: "abbrall",
          commandListener: (ev) =>
            HelperAbbrFactory.JA_transferAllItemsToCustomField(true),
        },
        // {
        //   tag: "menuitem",
        //   label: "test", // 子菜单: 测试
        //   id: "zotero-itemmenu-abbr-journal-test",
        //   commandListener: (ev) => HelperAbbrFactory.JA_test(),
        // }
      ],
      icon: menuIcon,
    });
  }

  @example
  static registerWindowMenuWithSeparator() {
    ztoolkit.Menu.register("item", {
      tag: "menuseparator",
      id: "zotero-itemmenu-abbr-separator",
    });
  }

  @example
  static async registerExtraColumn() {
    const field = "itemBoxRowabbr";
    await Zotero.ItemTreeManager.registerColumns({
      pluginID: config.addonID,
      dataKey: field,
      label: "abbr", //额外列的名称
      dataProvider: (item: Zotero.Item, dataKey: string) => {
        return ztoolkit.ExtraField.getExtraField(item, field) || "";
      },
    });
  }
}

/**
 * 用于处理期刊缩写的工厂类
 * @class HelperAbbrFactory 期刊缩写工厂类
 */
export class HelperAbbrFactory {
  /**
   * 对选中的条目进行处理, 根据 journalAbbreviation 的字段进行特殊转换 -- 大写
   * @param {Array<Zotero.Item>} [selectedItems] 要处理的项目数组（可选）
   * @returns {Promise} 返回一个 Promise 对象
   */
  static async JA_toUpperCase(
    selectedItems?: Array<Zotero.Item>,
  ): Promise<void> {
    const transformFn = (value: any) => value.toUpperCase();
    const successinfo = getString("prompt-success-abbrToupper-info");
    const failinfo = getString("prompt-fail-abbrToupper-info");
    //Basefun.executeFunctionWithTryCatch(Selected.processSelectItems, successinfo, failinfo )
    Basefun.executeFunctionWithTryCatch(
      async () =>
        await Selected.processSelectItems(
          transformFn,
          "journalAbbreviation",
          selectedItems,
        ),
      successinfo,
      failinfo,
    );
    //await processSelectItems(transformFn, successinfo, failinfo);
  }

  /**
   * 对选中的条目进行处理, 根据 journalAbbreviation 的字段进行特殊转换 -- 小写
   * @param {Array<Zotero.Item>} [selectedItems] 要处理的项目数组（可选）
   * @returns {Promise} 返回一个 Promise 对象
   */
  static async JA_toLowerCase(
    selectedItems?: Array<Zotero.Item>,
  ): Promise<void> {
    const transformFn = (value: any) => value.toLowerCase();
    const successinfo = getString("prompt-success-abbrTolower-info");
    const failinfo = getString("prompt-fail-abbrTolower-info");
    Basefun.executeFunctionWithTryCatch(
      async () =>
        await Selected.processSelectItems(
          transformFn,
          "journalAbbreviation",
          selectedItems,
        ),
      successinfo,
      failinfo,
    );
    //await processSelectItems(transformFn, successinfo, failinfo);
  }

  /**
   * 对选中的条目进行处理, 根据 journalAbbreviation 的字段进行特殊转换 -- 首字母大写
   * @param {Array<Zotero.Item>} [selectedItems] 要处理的项目数组（可选）
   * @returns {Promise} 返回一个 Promise 对象
   */
  static async JA_toCapitalize(
    selectedItems?: Array<Zotero.Item>,
  ): Promise<void> {
    const transformFn = (value: any) =>
      value.replace(/(?:^|\s)\S/g, function (firstChar: string) {
        return firstChar.toUpperCase();
      });
    const successinfo = getString("prompt-success-abbrTocapitalize-info");
    const failinfo = getString("prompt-fail-abbrTocapitalize-info");
    Basefun.executeFunctionWithTryCatch(
      async () =>
        await Selected.processSelectItems(
          transformFn,
          "journalAbbreviation",
          selectedItems,
        ),
      successinfo,
      failinfo,
    );
    //await processSelectItems(transformFn, successinfo, failinfo);
  }

  /**
   * 对选中的条目进行处理, 根据 journalAbbreviation 的字段进行特殊转换 -- 提取首字母并大写
   * @param {Array<Zotero.Item>} [selectedItems] 要处理的项目数组（可选）
   * @returns {Promise} 返回一个 Promise 对象
   */
  static async JA_InitialismAbbr(
    selectedItems?: Array<Zotero.Item>,
  ): Promise<any> {
    const isEnglishWithAllCharacters = (str: string) =>
      /^[\w\s\t\n\r\-'",.;:!?(){}[\]<>#+=*_~%^&|/$\\]+$/.test(str);
    const ignoredWords = new Set([
      "and",
      "but",
      "or",
      "for",
      "with",
      "at",
      "by",
      "about",
      "above",
      "after",
      "before",
      "between",
      "from",
      "in",
      "into",
      "of",
      "on",
      "to",
      "under",
      "while",
      "a",
      "an",
      "the",
      "is",
      "am",
      "are",
      "was",
      "were",
      "have",
      "has",
      "had",
      "will",
      "shall",
      "can",
      "could",
      "should",
      "would",
    ]);

    const transformFn = (value: string) => {
      try {
        value = value.trim();
        if (!value) {
          return "";
        }

        if (!isEnglishWithAllCharacters(value)) {
          return value;
        }

        const words = value.split(/\s|\./).map((word) => word.trim());

        if (words.length === 1) {
          return words[0].toUpperCase();
        }

        const transformedWords = words
          .filter((word: any) => !ignoredWords.has(word.toLowerCase()))
          .map((word: any) => word.charAt(0).toUpperCase());

        return transformedWords.join("");
      } catch (error) {
        ztoolkit.log("An error occurred:", error);
        return "";
      }
    };

    const successinfo = getString("prompt-success-InitialismAbbr-info");
    const failinfo = getString("prompt-fail-InitialismAbbr-info");
    Basefun.executeFunctionWithTryCatch(
      async () =>
        await Selected.processSelectItems(
          transformFn,
          "journalAbbreviation",
          selectedItems,
        ),
      successinfo,
      failinfo,
    );
    //await processSelectItems(transformFn, successinfo, failinfo);
  }

  /**
   * 对选中的条目进行处理, 根据 journalAbbreviation 的字段进行特殊转换 -- 移除点
   * @param {Array<Zotero.Item>} [selectedItems] 要处理的项目数组（可选）
   * @returns {Promise} 返回一个 Promise 对象
   */
  static async JA_removeDot(selectedItems?: Array<Zotero.Item>): Promise<void> {
    const transformFn = (value: any) => value.replace(/\./g, "");
    const successinfo = getString("prompt-success-removeAbbrdot-info");
    const failinfo = getString("prompt-fail-removeAbbrdot-info");
    Basefun.executeFunctionWithTryCatch(
      async () =>
        await Selected.processSelectItems(
          transformFn,
          "journalAbbreviation",
          selectedItems,
        ),
      successinfo,
      failinfo,
    );
    //await processSelectItems(transformFn, successinfo, failinfo);
  }

  /**
   * 对选中的条目进行处理, 根据标签名称, 删除对应的标签
   * @param usertags 要删除的标签名称数组
   * @param {Array<Zotero.Item>} [selectedItems] 要处理的项目数组（可选）
   * @returns {Promise} 返回一个 Promise 对象
   */
  static async JA_removeTagname(
    usertags: string[],
    selectedItems?: Array<Zotero.Item>,
  ): Promise<void> {
    await Basefun.processSelectedItemsWithPromise(
      SelectedWithHandler.removeTagHandler(usertags),
      getString("prompt-success-removetag-info") + ": " + usertags[0],
      getString("prompt-error-removetag-info") + ": " + usertags[0],
      true,
      selectedItems,
    );
  }

  // 交换期刊名 --- 即简写期刊与期刊名互换 --- 还是循环的方式-- 感觉循环比较快

  /**
   * 对选中的条目进行处理, 交换两个字段的值, 如果交换成功, 则添加给定的标签,
   * @param {Zotero.Item.ItemField} [key1="journalAbbreviation"] 字符串, 默认值为 "journalAbbreviation"
   * @param {Zotero.Item.ItemField} [key2="publicationTitle"] 字符串, 默认值为 "publicationTitle"
   * @param {string} [exchangetagname="exchange"] 字符串, 默认值为 "exchange", 当两个字段交换成功以后, 如果以前没有存在该标签, 则添加的标签, 如果以前存在该标签, 则删除
   * @param {Array<Zotero.Item>} [selectedItems] 要处理的项目数组（可选）
   */
  static async JA_exchangeName(
    key1: Zotero.Item.ItemField = "journalAbbreviation",
    key2: Zotero.Item.ItemField = "publicationTitle",
    exchangetagname: string = "exchange",
    selectedItems?: Array<Zotero.Item>,
  ) {
    const successinfo = getString("prompt-success-exchange-info");
    const failinfo = getString("prompt-error-exchange-info");
    Basefun.executeFunctionWithTryCatch(
      async () =>
        await Selected.exchangeJournalName(
          key1,
          key2,
          exchangetagname,
          selectedItems,
        ),
      successinfo,
      failinfo,
    );
  }

  /**
   * 绑定按钮事件 --- 选择文件, 然后显示选择的文件地址,UI 上显示, 选择json/csv文件路径,  ---- 该文件一般是根据用户手动制定的缩写期刊文件, 一般是csv或者json文件
   */
  @example
  static async buttonSelectFilePath() {
    const mypath = await BasicExampleFactory.filePickerExample("*.csv;*.json"); // "*.csv;*.json

    // 判断选择的地址是否为空
    if (!mypath) {
      BasicExampleFactory.ShowPopUP(
        getString("prompt-show-cancel-selectpath-info"),
      );
    } else {
      await Zotero.Prefs.set(`${config.addonRef}.input`, mypath);
      BasicExampleFactory.ShowPopUP(
        getString("prompt-show-success-selectpath-info") +
          getString(`${mypath}`),
      );
    }
  }

  /**
   * 绑定按钮事件 --- 选择文件, 然后显示选择的文件地址, UI 上显示, 选择json文件路径 ---- 该文件中含有正则表达式信息, 主要根据该json文件的内容, 采用正则表达式来替换item中的字段, 作为扩展功能
   */
  @example
  static async buttonJsonSelectFilePath() {
    const mypath = await BasicExampleFactory.filePickerExample("*.json"); // "*.csv;*.json

    // 判断选择的地址是否为空
    if (!mypath) {
      BasicExampleFactory.ShowPopUP(
        getString("prompt-show-cancel-selectpath-info"),
      );
    } else {
      await Zotero.Prefs.set(`${config.addonRef}.replaceJsonFile`, mypath);
      BasicExampleFactory.ShowPopUP(
        getString("prompt-show-success-selectpath-info") +
          getString(`${mypath}`),
      );
    }
  }

  /**
   * 对选中的条目进行处理, 添加/删除指定的标签, 对一个固定的数组进行处理, 返回添加的标签名称数组和删除的标签名称数组
   * @param {boolean} isselect_addAutotags 是否添加自动标签
   * @param {string[]} addtagsname 要添加的标签名称数组
   */
  static JA_processTags(isselect_addAutotags: boolean, addtagsname: string[]) {
    const tagsall = ["abbr", "abbr_user", "abbr_iso4", "regex"]; // 定义包含多个固定值的数组
    let removetagsname = [];

    if (isselect_addAutotags) {
      addtagsname = addtagsname.slice();
      removetagsname = tagsall.filter((item) => !addtagsname.includes(item));
    } else {
      addtagsname = [];
      removetagsname = tagsall.slice();
    }
    return { addtagsname, removetagsname };
  }

  /**
   * 1.对选中的条目进行处理, 采用内部数据集对期刊缩写进行更新.
   * @param {Array<Zotero.Item>} [selectedItems] 要处理的项目数组（可选）
   */
  static async JA_update_UseInnerData(selectedItems?: Array<Zotero.Item>) {
    const isselect_addAutotagsRaw = Zotero.Prefs.get(
      config.addonRef + ".addAutotags",
    );

    // 检查原始值是否是布尔类型，如果不是，则进行适当的转换
    const isselect_addAutotags =
      typeof isselect_addAutotagsRaw === "boolean"
        ? isselect_addAutotagsRaw
        : isselect_addAutotagsRaw === "true" || isselect_addAutotagsRaw === 1;

    const { addtagsname, removetagsname } = this.JA_processTags(
      isselect_addAutotags,
      ["abbr"],
    );

    await Selected.updateJournalAbbr(
      journal_abbr,
      "publicationTitle",
      "journalAbbreviation",
      addtagsname,
      removetagsname,
      getString("prompt-success-updatejournal-inner-info"),
      getString("prompt-error-updatejournal-inner-info"),
      true,
      selectedItems,
    );
  }

  /**
   * 2.对选中的条目进行处理, 采用用户数据集(通过用户根据文件路径进行指定) 对期刊缩写进行更新
   * @param {boolean} [isshowinfo=true] 是否显示提示信息
   * @param {Array<Zotero.Item>} [selectedItems] 要处理的项目数组（可选）
   * @returns {Promise} 返回一个 Promise 对象
   */
  static async JA_update_UseUserData(
    isshowinfo: boolean = true,
    selectedItems?: Array<Zotero.Item>,
  ): Promise<any> {
    const user_abbr_data = await Basefun.get_user_data(isshowinfo);
    if (!user_abbr_data) return;

    const isselect_addAutotagsRaw = Zotero.Prefs.get(
      config.addonRef + ".addAutotags",
    );
    // 检查原始值是否是布尔类型，如果不是，则进行适当的转换
    const isselect_addAutotags =
      typeof isselect_addAutotagsRaw === "boolean"
        ? isselect_addAutotagsRaw
        : isselect_addAutotagsRaw === "true" || isselect_addAutotagsRaw === 1;
    const { addtagsname, removetagsname } = this.JA_processTags(
      isselect_addAutotags,
      ["abbr_user"],
    );

    // 更新期刊缩写 -- 返回的信息为 已有 2/2 条目缩写更新
    await Selected.updateJournalAbbr(
      user_abbr_data,
      "publicationTitle",
      "journalAbbreviation",
      addtagsname,
      removetagsname, // "amytest2","amytest"
      getString("prompt-success-updatejournal-user-info"),
      getString("prompt-error-updatejournal-user-info"),
      true,
      selectedItems,
    );
  }

  /**
   *
   * 3. 对选中的条目进行处理, 采用 ISO4 规则进行更新
   * @param {Array<Zotero.Item>} [selectedItems] 要处理的项目数组（可选）
   */
  static async JA_update_UseISO4(selectedItems?: Array<Zotero.Item>) {
    const isselect_addAutotagsRaw = Zotero.Prefs.get(
      config.addonRef + ".addAutotags",
    );
    // 检查原始值是否是布尔类型，如果不是，则进行适当的转换
    const isselect_addAutotags =
      typeof isselect_addAutotagsRaw === "boolean"
        ? isselect_addAutotagsRaw
        : isselect_addAutotagsRaw === "true" || isselect_addAutotagsRaw === 1;
    const { addtagsname, removetagsname } = this.JA_processTags(
      isselect_addAutotags,
      ["abbr_iso4"],
    );

    await Selected.updateUseISO4(
      {}, // 为了和上面的函数保持一致, 这里传入一个空对象
      "publicationTitle",
      "journalAbbreviation",
      addtagsname,
      removetagsname,
      getString("prompt-success-updatejournal-iso4-info"),
      getString("prompt-error-updatejournal-iso4-info"),
      true,
      selectedItems,
    );
  }

  /**
   *
   * 一键更新期刊缩写, 首先使用 iso4 标准, 然后使用内部数据集, 最后使用自定义数据集, 因此如果一个期刊存在多种标准,优先级: iso4 < 内部数据集 < 自定义数据集
   * @param {Array<Zotero.Item>} [selectedItems] 要处理的项目数组（可选）
   */
  static async JA_oneStepUpdate(selectedItems?: Array<Zotero.Item>) {
    await this.JA_update_UseISO4(selectedItems); // 使用 iso4 标准
    await this.JA_update_UseInnerData(selectedItems); // 使用内部数据集
    await this.JA_update_UseUserData(true, selectedItems); // 使用自定义数据集, 会提示用户选择文件,如果出错,可以忽略
  }

  /**
   * 获取参考文献的函数 -- 方法 1, 是整体处理, 把生成的参考文献看做一个字符串整体, 然后再进行处理
   */
  static async JA_getbibliography1() {
    Basefun.executeFunctionWithTryCatch(
      async () => {
        const resultInfo = await Selected.getbibliography1();
        if (!resultInfo) return;

        await BasicExampleFactory.copyToClipboard(resultInfo.strinfo);
        return resultInfo;
      },
      getString("prompt-success-bib-info"),
      getString("prompt-error-bib-info"),
    );
  }

  /**
   * 获取参考文献的函数 -- 方法 2,  把生成的参考文献看做一个字符串, 把这个字符串分割成三段, 然后再进行处理
   */
  static async JA_getbibliography2() {
    Basefun.executeFunctionWithTryCatch(
      async () => {
        const resultInfo = await Selected.getbibliography2();
        if (!resultInfo) return;

        await BasicExampleFactory.copyToClipboard(resultInfo.strinfo);
        return resultInfo;
      },
      getString("prompt-success-bib-info"),
      getString("prompt-error-bib-info"),
    );
  }

  /**
   * 主要是zotero启动时运行该函数, 对所有文献, 采用一键更新期刊缩写, 然后对所有文献(不同类别的文献)期刊字段, 转移到自定义字段 `itemBoxRowabbr` 中(在面板中显示的是 abbr 值)
   */
  static async JA_transferAllItemsToCustomFieldStart() {
    try {
      const libraryID = Zotero.Libraries.userLibraryID;
      const items = await Zotero.Items.getAll(libraryID);
      const selectedItems = items.filter(
        (item) => !item.isNote() && item.isRegularItem(),
      ); // 过滤笔记 且 是规则的 item
      await this.JA_transferAllItemsToCustomField(false, selectedItems);
    } catch (error) {
      ztoolkit.log(`journalabbr error: ${error}`);
    }
  }

  /**
   *主要是在菜单栏中进行点击操作, 点击的标签是: abbrall,  对选中的文献, 采用一键更新期刊缩写, 然后对选中的文献(不同类别的文献)期刊字段, 转移到自定义字段 `itemBoxRowabbr` 中(在面板中显示的是 abbr 值)
   * @param {boolean} [isshowinfo=true] 是否显示提示信息
   * @param {Array<Zotero.Item>} [selectedItems] 要处理的项目数组（可选）
   * @returns {Promise} 返回一个 Promise 对象
   */
  static async JA_transferAllItemsToCustomField(
    isshowinfo: boolean = true,
    selectedItems?: Array<Zotero.Item>,
  ): Promise<any> {
    // // 方法一 : 一键更新期刊缩写, 然后对选中的文献(不同类别的文献)期刊字段, 转移到自定义字段 `itemBoxRowabbr` 中(在面板中显示的是 abbr 值)
    await this.JA_update_UseISO4(selectedItems); // 使用 iso4 标准
    await new Promise((resolve) => setTimeout(resolve, 3000)); // 休眠3秒钟

    await this.JA_update_UseInnerData(selectedItems); // 使用内部数据集
    await new Promise((resolve) => setTimeout(resolve, 3000)); // 休眠3秒钟

    await this.JA_update_UseUserData(isshowinfo, selectedItems); // 使用自定义数据集, 会提示用户选择文件,如果出错,可以忽略

    try {
      await Selected.transferAllItemsToCustomField(selectedItems);
    } catch (error) {
      ztoolkit.log(`journalabbr error: ${error}`);
    }
  }

  /**
   *  用于显示获取到的 citationKey,  citationKey 的值的生成, 依靠其他插件. -----  better-bibtex
   *  (弃用)
   * @returns
   */
  static async JA_exportAbbrKey() {
    Basefun.executeFunctionWithTryCatch(
      async () => {
        const resultInfo = await Selected.exportCitationkey();
        ztoolkit.log(`resultInfo: ${resultInfo}`);
        if (!resultInfo) return;

        await BasicExampleFactory.copyToClipboard(resultInfo.strinfo);
        return resultInfo;
      },
      getString("prompt-success-exportkey"),
      getString("prompt-error-exportkey"),
    );
  }

  /**
   * 根据选择的item, 生成一个 csv 文件, 这个csv的每列是一个字段, 每行是一个item, 这些列包含了我们可能需要用到的字段, 主要是导出来填写表格,提交材料用的
   */
  static async JA_selectItemsExportCsv() {
    const selectedItems = Basefun.filterSelectedItems();
    if (!selectedItems) return;
    const path = await Basefun.getDir("example.csv");
    if (!path) return;
    BasicExampleFactory.ShowInfo(`Selected: ${path}`);
    let infostr = "";
    if (path.endsWith(".json")) {
      infostr = FeildExport.generateFile(selectedItems, "json");
      await Zotero.File.putContentsAsync(path, infostr);
    } else if (path.endsWith(".csv")) {
      infostr = FeildExport.generateFile(selectedItems, "csv");
      await Zotero.File.putContentsAsync(path, "\uFEFF" + infostr);
    } else {
      infostr = FeildExport.generateFile(selectedItems, "csv");
      await Zotero.File.putContentsAsync(path, infostr);
    }
    //await BasicExampleFactory.copyToClipboard(infostr);
  }

  /**
   * 根据用户选择的json文件, 采用正则的方式, 替换选中的item的字段, 用于扩展功能, 例如, 批量替换期刊名等操作
   */
  static async JA_ReplaceByJson() {
    //1 ,读取 json 文件
    const jsonpath = String(
      Zotero.Prefs.get(config.addonRef + ".replaceJsonFile"),
    );
    if (!jsonpath) {
      BasicExampleFactory.ShowPopUP(
        getString("prompt-show-cancel-selectpath-info"),
      );
      return;
    }
    // 2. 读取用户设置
    const isselect_addAutotagsRaw = Zotero.Prefs.get(
      config.addonRef + ".addRegexAutotags",
    );
    // 检查原始值是否是布尔类型，如果不是，则进行适当的转换
    const isselect_addAutotags =
      typeof isselect_addAutotagsRaw === "boolean"
        ? isselect_addAutotagsRaw
        : isselect_addAutotagsRaw === "true" || isselect_addAutotagsRaw === 1;
    const { addtagsname, removetagsname } = this.JA_processTags(
      isselect_addAutotags,
      ["regex"],
    );

    const jsonstr = await Zotero.File.getContentsAsync(jsonpath, "utf-8");
    let jsondata: any;
    try {
      jsondata = JSON.parse(String(jsonstr));
    } catch (error) {
      BasicExampleFactory.ShowPopUP("Invalid json file");
      return;
    }

    const data = filterValidEntries(jsondata);
    // ztoolkit.log(`valid data number: ${data.length}`);
    BasicExampleFactory.ShowStatus(
      jsondata.length,
      data.length,
      getString("prompt-show-regular-valid"),
    );
    if (!data || data.length === 0) {
      return;
    }

    await replaceHandle.replacejson(data, addtagsname, removetagsname);
  }
}
