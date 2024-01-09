import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { journal_abbr } from "./data";
import { replaceHandle, filterValidEntries } from "./replacehandle";
import {
  Basefun, // 基础的选择函数
  Selected, // for 循环来处理
  SelectedWithHandler, //  异步处理
  FeildExport, // 字段导出
} from "./util";

import { ClipboardHelper } from "zotero-plugin-toolkit/dist/helpers/clipboard";

Components.utils.import("resource://gre/modules/osfile.jsm");

function example(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
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
    new ClipboardHelper().addText(text, "text/unicode").copy();
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
  static ShowPopUP(descInfo: string, headerInfo: string = getString(`${config.addonRef}`), n = 3000) {
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

  // 选择地址,
  @example
  static async filePickerExample() {
    const path = await new ztoolkit.FilePicker("Import File", "open", [
      ["CSV/JSON (*.csv, *.json)", "*.csv;*.json"],
      ["Any(*.*)", "*"],
    ]).open();
    // 判断选择的地址是否为空,以及是否为字符串 false
    if (typeof path === "string" && path !== "" && path !== "false" && path !== "undefined" && path !== "null") {
      return path;
    } else {
      return null;
    }
    //ztoolkit.getGlobal("alert")(`Selected ${path}`);
  }

  // 显示事件改变的信息 -- 下拉框/复选框
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

  // 显示参考文献转换信息
  static async showBibConversionStatus(ruleItemCount: number, successfulCount: number, noActionCount: number, missingInfoItemCount: number) {
    if (successfulCount > 0) {
      this.ShowStatus(ruleItemCount, successfulCount, "items are converted.");
    }
    if (noActionCount > 0) {
      this.ShowStatus(ruleItemCount, noActionCount, "items are not converted.");
    }
    if (missingInfoItemCount > 0) {
      this.ShowStatus(ruleItemCount, missingInfoItemCount, "items are missing information.");
    }
  }

  // 初始化设置
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

  ////////////////////////
  ///// 以下是模板自带的 ///
  ////////////////////////
  @example
  static registerNotifier() {
    const callback = {
      notify: async (event: string, type: string, ids: number[] | string[], extraData: { [key: string]: any }) => {
        if (!addon?.data.alive) {
          this.unregisterNotifier(notifierID);
          return;
        }
        addon.hooks.onNotify(event, type, ids, extraData);
      },
    };

    // Register the callback in Zotero as an item observer
    const notifierID = Zotero.Notifier.registerObserver(callback, ["tab", "item", "file"]);

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
  // 在标题上添加自定义列名,通过该列可以进行排序
  @example
  static async registerExtraColumn() {
    await ztoolkit.ItemTree.register("extraColumnabbr", "abbr", (field: string, unformatted: boolean, includeBaseMapped: boolean, item: Zotero.Item) => {
      //ztoolkit.log(`field3: ${field}`) // field === 'extraColumnabbr'
      const fieldValue = ztoolkit.ExtraField.getExtraField(item, "itemBoxRowabbr");
      return fieldValue !== undefined ? String(fieldValue) : "";
    });
  }

  // 注册额外的字段
  @example
  static async registerCustomItemBoxRow() {
    await ztoolkit.ItemBox.register(
      "itemBoxRowabbr",
      "abbr",
      (field, unformatted, includeBaseMapped, item, original) => {
        //ztoolkit.log(`field1: ${field}`)
        const fieldValue = ztoolkit.ExtraField.getExtraField(item, field);
        return fieldValue !== undefined ? String(fieldValue) : "";
      },
      {
        editable: true,
        setFieldHook: (field, value, loadIn, item, original) => {
          if (value) {
            ztoolkit.ExtraField.setExtraField(item, field, value);
          }
          return true;
        },
        index: 12,
        multiline: false, // 是否多行
        collapsible: false, // 是否可折叠
      },
    );
  }

  static async registerCustomItemBoxCitationkey() {
    await ztoolkit.ItemBox.register(
      "itemBoxCitationkey",
      "abbrCkey",
      (field, unformatted, includeBaseMapped, item, original) => {
        //ztoolkit.log(`field1: ${field}`)
        const fieldValue = ztoolkit.ExtraField.getExtraField(item, field);
        return fieldValue !== undefined ? String(fieldValue) : "";
      },
      {
        editable: true,
        setFieldHook: (field, value, loadIn, item, original) => {
          if (value) {
            ztoolkit.ExtraField.setExtraField(item, field, value);
          }
          return true;
        },
        index: 1,
        multiline: false, // 是否多行
        collapsible: false, // 是否可折叠
      },
    );
  }
  //禁止显示某些菜单
  static displayMenuitem() {
    const items = ZoteroPane.getSelectedItems(); // 等价于 Zotero.getActiveZoteroPane().getSelectedItems();
    //const exchange = document.getElementById('zotero-itemmenu-abbr-journal-exchange'); // 交换期刊名
    // 检查是否存在 exchange tag
    //var elementss = document.querySelectorAll('[id^="zotero-itemmenu-abbr-"]');
    // 定义一个包含特殊 ID 的数组
    const excludeIds = [
      "zotero-itemmenu-abbr-journal-exchange",
      "zotero-itemmenu-abbr-journal-deleteAbbrTag",
      "zotero-itemmenu-abbr-journal-bibliography",
      "zotero-itemmenu-abbr-journal-deleteUserTag",
      "zotero-itemmenu-abbr-journal-selectFile",
    ];

    // 获取所有以 'zotero-itemmenu-abbr-journal-' 开头的元素
    const elements = document.querySelectorAll('[id^="zotero-itemmenu-abbr-journal-"]');

    // 使用 Array.prototype.filter() 函数过滤特殊 ID 的元素
    const filteredElements = Array.from(elements).filter((element) => !excludeIds.includes(element.id));

    const hasExchangeTag = items.some((item) => {
      return item.hasTag("exchange");
    });

    if (hasExchangeTag) {
      filteredElements.forEach((element) => element.setAttribute("disabled", "true"));
    } else {
      filteredElements.forEach((element) => element.setAttribute("disabled", "false"));
    }
  }

  // 分割条
  @example
  static registerWindowMenuWithSeparator() {
    ztoolkit.Menu.register("item", {
      tag: "menuseparator",
      id: "zotero-itemmenu-abbr-separator",
    });
  }
  // 右键菜单: 期刊缩写
  @example
  static registerRightClickMenuPopup() {
    const menuIcon = `chrome://${config.addonRef}/content/icons/`;
    ztoolkit.Menu.register("item", {
      tag: "menu",
      id: "zotero-itemmenu-abbr-journal",
      label: getString("menupopup-label"), //期刊缩写
      icon: menuIcon + "faviconsmall.png", //mac 上不显示, windows 上显示, why?
      children: [
        {
          tag: "menuitem",
          label: getString("menuitem-updateUserAbbr"), // 子菜单: 用户指定期刊缩写路径
          id: "zotero-itemmenu-abbr-journal-updateUserAbbr",
          //icon: menuIcon + "faviconsmall.png",
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
          commandListener: (ev) => HelperAbbrFactory.JA_removeTagname(["abbr_user"]),
        },
        {
          tag: "menuseparator",
        },
        {
          tag: "menuitem",
          label: getString("menuitem-selectFile"), // 子菜单: 选择文件
          id: "zotero-itemmenu-abbr-journal-selectFile",
          commandListener: (ev) => HelperAbbrFactory.buttonSelectFilePath(),
        },
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
        {
          tag: "menuitem",
          id: "zotero-itemmenu-abbr-journal-abbrkey",
          label: "show Ckey", // 该key 直接从 biblatex 中获取, 用于生成 citationKey
          commandListener: (ev) => HelperAbbrFactory.JA_exportAbbrKey(),
        },
        {
          tag: "menuitem",
          id: "zotero-itemmenu-abbr-journal-exportcsv",
          label: "export csv",
          commandListener: (ev) => HelperAbbrFactory.JA_selectItemsExportCsv(),
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
          commandListener: (ev) => HelperAbbrFactory.JA_transferAllItemsToCustomField(),
        },
        // {
        //   tag: "menuitem",
        //   label: "test", // 子菜单: 测试
        //   id: "zotero-itemmenu-abbr-journal-test",
        //   commandListener: (ev) => HelperAbbrFactory.JA_test(),
        // }
      ],
    });
  }
  // 分割条
  // @example
  // static registerWindowMenuWithSeparator2() {
  //   ztoolkit.Menu.register("item", {
  //     tag: "menuseparator",
  //     id: "zotero-itemmenu-abbr-separator2",
  //   });
  // }
  // // 右键菜单: 用来测试新功能用,  用完后可以删除
  // // 右键菜单: 一键更新期刊缩写
  // @example
  // static registerRightClickMenuItem() {
  //     //const menuIcon = `chrome://${config.addonRef}/content/icons/faviconsmall.png`;
  //     // item menuitem with icon
  //     ztoolkit.Menu.register("item", {
  //         tag: "menuitem",
  //         id: "zotero-itemmenu-abbr-journal-onestepupate",
  //         label: getString("menuitem-onestepupate"),
  //         //icon: menuIcon,
  //         commandListener: (ev) => HelperAbbrFactory.JA_oneStepUpdate(),
  //     });
  // }
}

///////////////////////////////
export class HelperAbbrFactory {
  // 简写期刊大写 ----  根据 journalAbbreviation 的字段进行特殊转换
  static async JA_toUpperCase() {
    const transformFn = (value: any) => value.toUpperCase();
    const successinfo = getString("prompt-success-abbrToupper-info");
    const failinfo = getString("prompt-fail-abbrToupper-info");
    //Basefun.executeFunctionWithTryCatch(Selected.processSelectItems, successinfo, failinfo )
    Basefun.executeFunctionWithTryCatch(async () => await Selected.processSelectItems(transformFn), successinfo, failinfo);
    //await processSelectItems(transformFn, successinfo, failinfo);
  }

  // 简写期刊小写  ----- 根据 journalAbbreviation 的字段进行特殊转换
  static async JA_toLowerCase() {
    const transformFn = (value: any) => value.toLowerCase();
    const successinfo = getString("prompt-success-abbrTolower-info");
    const failinfo = getString("prompt-fail-abbrTolower-info");
    Basefun.executeFunctionWithTryCatch(async () => await Selected.processSelectItems(transformFn), successinfo, failinfo);
    //await processSelectItems(transformFn, successinfo, failinfo);
  }

  //简写期刊首字母化 ---- 根据 journalAbbreviation 的字段进行特殊转换
  static async JA_toCapitalize() {
    const transformFn = (value: any) =>
      value.replace(/(?:^|\s)\S/g, function (firstChar: string) {
        return firstChar.toUpperCase();
      });
    const successinfo = getString("prompt-success-abbrTocapitalize-info");
    const failinfo = getString("prompt-fail-abbrTocapitalize-info");
    Basefun.executeFunctionWithTryCatch(async () => await Selected.processSelectItems(transformFn), successinfo, failinfo);
    //await processSelectItems(transformFn, successinfo, failinfo);
  }
  static async JA_InitialismAbbr() {
    const isEnglishWithAllCharacters = (str: string) => /^[\w\s\t\n\r\-'",.;:!?(){}[\]<>#+=*_~%^&|/$\\]+$/.test(str);
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

        const transformedWords = words.filter((word: any) => !ignoredWords.has(word.toLowerCase())).map((word: any) => word.charAt(0).toUpperCase());

        return transformedWords.join("");
      } catch (error) {
        ztoolkit.log("An error occurred:", error);
        return "";
      }
    };

    const successinfo = getString("prompt-success-InitialismAbbr-info");
    const failinfo = getString("prompt-fail-InitialismAbbr-info");
    Basefun.executeFunctionWithTryCatch(async () => await Selected.processSelectItems(transformFn), successinfo, failinfo);
    //await processSelectItems(transformFn, successinfo, failinfo);
  }

  // 移除简写期刊中的点
  static async JA_removeDot() {
    const transformFn = (value: any) => value.replace(/\./g, "");
    const successinfo = getString("prompt-success-removeAbbrdot-info");
    const failinfo = getString("prompt-fail-removeAbbrdot-info");
    Basefun.executeFunctionWithTryCatch(async () => await Selected.processSelectItems(transformFn), successinfo, failinfo);
    //await processSelectItems(transformFn, successinfo, failinfo);
  }

  // 根据标签名称, 删除对应的标签
  static async JA_removeTagname(usertags: string[]) {
    await Basefun.processSelectedItemsWithPromise(
      SelectedWithHandler.removeTagHandler(usertags),
      getString("prompt-success-removetag-info") + ": " + usertags[0],
      getString("prompt-error-removetag-info") + ": " + usertags[0],
    );
  }

  // 交换期刊名 --- 即简写期刊与期刊名互换 --- 还是循环的方式-- 感觉循环比较快
  static async JA_exchangeName(key1: any = "journalAbbreviation", key2: any = "publicationTitle", exchangetagname = "exchange") {
    const successinfo = getString("prompt-success-exchange-info");
    const failinfo = getString("prompt-error-exchange-info");
    Basefun.executeFunctionWithTryCatch(async () => await Selected.exchangeJournalName(), successinfo, failinfo);
  }

  // 绑定按钮事件
  @example
  static async buttonSelectFilePath() {
    const mypath = await BasicExampleFactory.filePickerExample();

    // 判断选择的地址是否为空
    if (!mypath) {
      BasicExampleFactory.ShowPopUP(getString("prompt-show-cancel-selectpath-info"));
    } else {
      await Zotero.Prefs.set(`${config.addonRef}.input`, mypath);
      BasicExampleFactory.ShowPopUP(getString("prompt-show-success-selectpath-info") + getString(`${mypath}`));
    }
  }

  @example
  static async buttonJsonSelectFilePath() {
    const mypath = await BasicExampleFactory.filePickerExample();

    // 判断选择的地址是否为空
    if (!mypath) {
      BasicExampleFactory.ShowPopUP(getString("prompt-show-cancel-selectpath-info"));
    } else {
      await Zotero.Prefs.set(`${config.addonRef}.replaceJsonFile`, mypath);
      BasicExampleFactory.ShowPopUP(getString("prompt-show-success-selectpath-info") + getString(`${mypath}`));
    }
  }

  /////////////////////////////////
  // 更新期刊缩写 ///////////////////
  ////////////////////////////////
  // 1. 使用内部数据集进行更新
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

  static async JA_update_UseInnerData() {
    const isselect_addAutotagsRaw = Zotero.Prefs.get(config.addonRef + ".addAutotags");

    // 检查原始值是否是布尔类型，如果不是，则进行适当的转换
    const isselect_addAutotags =
      typeof isselect_addAutotagsRaw === "boolean" ? isselect_addAutotagsRaw : isselect_addAutotagsRaw === "true" || isselect_addAutotagsRaw === 1;

    const { addtagsname, removetagsname } = this.JA_processTags(isselect_addAutotags, ["abbr"]);

    await Selected.updateJournalAbbr(
      journal_abbr,
      "publicationTitle",
      "journalAbbreviation",
      addtagsname,
      removetagsname,
      getString("prompt-success-updatejournal-inner-info"),
      getString("prompt-error-updatejournal-inner-info"),
      true,
    );
  }

  //2 . 使用用户数据集进行更新
  static async JA_update_UseUserData() {
    const user_abbr_data = await Basefun.get_user_data();
    if (!user_abbr_data) return;

    const isselect_addAutotagsRaw = Zotero.Prefs.get(config.addonRef + ".addAutotags");
    // 检查原始值是否是布尔类型，如果不是，则进行适当的转换
    const isselect_addAutotags =
      typeof isselect_addAutotagsRaw === "boolean" ? isselect_addAutotagsRaw : isselect_addAutotagsRaw === "true" || isselect_addAutotagsRaw === 1;
    const { addtagsname, removetagsname } = this.JA_processTags(isselect_addAutotags, ["abbr_user"]);

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
    );
  }
  // 3. 采用 ISO4 规则进行更新
  static async JA_update_UseISO4() {
    // BasicExampleFactory.ShowPopUP(`${Zotero.Prefs.get(config.addonRef + ".addAutotags")}`);

    const isselect_addAutotagsRaw = Zotero.Prefs.get(config.addonRef + ".addAutotags");
    // 检查原始值是否是布尔类型，如果不是，则进行适当的转换
    const isselect_addAutotags =
      typeof isselect_addAutotagsRaw === "boolean" ? isselect_addAutotagsRaw : isselect_addAutotagsRaw === "true" || isselect_addAutotagsRaw === 1;
    const { addtagsname, removetagsname } = this.JA_processTags(isselect_addAutotags, ["abbr_iso4"]);

    await Selected.updateUseISO4(
      {}, // 为了和上面的函数保持一致, 这里传入一个空对象
      "publicationTitle",
      "journalAbbreviation",
      addtagsname,
      removetagsname,
      getString("prompt-success-updatejournal-iso4-info"),
      getString("prompt-error-updatejournal-iso4-info"),
      true,
    );
  }
  static async JA_oneStepUpdate() {
    // 1. 一键更新期刊, 首先使用 iso4 标准, 然后使用内部数据集, 最后使用自定义数据集,
    await this.JA_update_UseISO4();
    await this.JA_update_UseInnerData();
    await this.JA_update_UseUserData();
  }

  // //定义一个获取参考文献的函数 -- 方法 1
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

  // //定义一个获取参考文献的函数 -- 方法 2
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

  static async JA_transferAllItemsToCustomField() {
    // 不显示任何信息
    try {
      const newField = "itemBoxRowabbr";

      await Selected.transferAllItemsToCustomField();

      await Selected.updateUseISO4(
        {},
        newField,
        newField,
        [""],
        [""],
        getString("prompt-success-updatejournal-iso4-info"),
        getString("prompt-error-updatejournal-iso4-info"),
        false,
      );

      await Selected.updateJournalAbbr(
        journal_abbr,
        newField,
        newField,
        [""],
        [""],
        getString("prompt-success-updatejournal-inner-info"),
        getString("prompt-error-updatejournal-inner-info"),
        false,
      );

      const user_abbr_data = await Basefun.get_user_data();
      if (!user_abbr_data) return;
      await Selected.updateJournalAbbr(
        user_abbr_data,
        newField,
        newField,
        [""],
        [""],
        getString("prompt-success-updatejournal-inner-info"),
        getString("prompt-error-updatejournal-inner-info"),
        false,
      );
    } catch (error) {
      ztoolkit.log("error", error);
    }
  }

  static async JA_exportAbbrKey() {
    Basefun.executeFunctionWithTryCatch(
      async () => {
        const resultInfo = await Selected.exportCitationkey();
        if (!resultInfo) return;

        // await BasicExampleFactory.copyToClipboard(resultInfo.strinfo);
        return resultInfo;
      },
      getString("prompt-success-exportkey"),
      getString("prompt-error-exportkey"),
    );
  }

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

  static async JA_ReplaceByJson() {
    //1 ,读取 json 文件
    const jsonpath = String(Zotero.Prefs.get(config.addonRef + ".replaceJsonFile"));
    if (!jsonpath) {
      BasicExampleFactory.ShowPopUP(getString("prompt-show-cancel-selectpath-info"));
      return;
    }
    // 2. 读取用户设置
    const isselect_addAutotagsRaw = Zotero.Prefs.get(config.addonRef + ".addRegexAutotags");
    // 检查原始值是否是布尔类型，如果不是，则进行适当的转换
    const isselect_addAutotags =
      typeof isselect_addAutotagsRaw === "boolean" ? isselect_addAutotagsRaw : isselect_addAutotagsRaw === "true" || isselect_addAutotagsRaw === 1;
    const { addtagsname, removetagsname } = this.JA_processTags(isselect_addAutotags, ["regex"]);

    const jsonstr = await Zotero.File.getContentsAsync(jsonpath, "utf-8");
    let jsondata: any;
    try {
      jsondata = JSON.parse(String(jsonstr));
    } catch (error) {
      BasicExampleFactory.ShowPopUP("Invalid json file");
      return;
    }

    const data = filterValidEntries(jsondata);
    Zotero.debug(`valid data number: ${data.length}`);
    BasicExampleFactory.ShowStatus(jsondata.length, data.length, getString("prompt-show-regular-valid"));
    if (!data || data.length === 0) {
      return;
    }

    await replaceHandle.replacejson(data, addtagsname, removetagsname);
  }
}
