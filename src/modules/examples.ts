import { config } from "../../package.json";
import { getString } from "./locale";
import { journal_abbr } from "./data";
import {
    Basefun, // 基础的选择函数
    Selected, // for 循环来处理
    SelectedWithHandler, //  异步处理
} from "./util";

import { ClipboardHelper } from "zotero-plugin-toolkit/dist/helpers/clipboard";

Components.utils.import("resource://gre/modules/osfile.jsm");

function example(
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
) {
    const original = descriptor.value;
    descriptor.value = function (...args: any) {
        try {
            ztoolkit.log(
                `Calling example ${target.name}.${String(propertyKey)}`
            );
            return original.apply(this, args);
        } catch (e) {
            ztoolkit.log(
                `Error in example ${target.name}.${String(propertyKey)}`,
                e
            );
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
    static ShowPopUP(
        descInfo: string,
        headerInfo: string = getString(`${config.addonRef}`),
        n: number = 2500
    ) {
        var progressWindow = new Zotero.ProgressWindow({ closeOnClick: true });
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
        if (
            typeof path === "string" &&
            path !== "" &&
            path !== "false" &&
            path !== "undefined" &&
            path !== "null"
        ) {
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

        if (selectedValue && typeof isChecked === 'boolean') {
            this.ShowPopUP(`Checkbox is ${isChecked ? '' : 'not '}checked.`);
          } else if (selectedValue) {
            this.ShowPopUP(`Select ${selectedValue}.`);
          } else {
            this.ShowPopUP('No option is selected.');
          }
    }
    

    // 显示参考文献转换信息
    static async showBibConversionStatus(
        ruleItemCount: number,
        successfulCount: number,
        noActionCount: number,
        missingInfoItemCount: number
    ) {
        if (successfulCount > 0) {
            this.ShowStatus(
                ruleItemCount,
                successfulCount,
                "items are converted."
            );
        }
        if (noActionCount > 0) {
            this.ShowStatus(
                ruleItemCount,
                noActionCount,
                "items are not converted."
            );
        }
        if (missingInfoItemCount > 0) {
            this.ShowStatus(
                ruleItemCount,
                missingInfoItemCount,
                "items are missing information."
            );
        }
    }

    // 初始化设置
    @example
    static async initPrefs() {
        const initpref_data = {
            [config.addonRef + ".input"]: Zotero.Prefs.get("dataDir"),
            [config.addonRef + ".separator"]: ",",
            [config.addonRef + ".sortoptions"]: "default", // [fianl_bib, id_arr, origin_id, nkey]
            [config.addonRef + ".keyornum"]: "key", //
            [config.addonRef + ".discardDOI"]: true,
            [config.addonRef + ".bibemptyline"]: true,
        };

        // Check if preference is already set and set it if not
        for (let p in initpref_data) {
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
        const elements = document.querySelectorAll(
            '[id^="zotero-itemmenu-abbr-journal-"]'
        );

        // 使用 Array.prototype.filter() 函数过滤特殊 ID 的元素
        const filteredElements = Array.from(elements).filter(
            (element) => !excludeIds.includes(element.id)
        );

        let hasExchangeTag = items.some((item) => {
            return item.hasTag("exchange");
        });

        if (hasExchangeTag) {
            filteredElements.forEach((element) =>
                element.setAttribute("disabled", "true")
            );
            //BasicExampleFactory.ShowPopUP(getString("prompt.show.disabled.info"));
        } else {
            filteredElements.forEach((element) =>
                element.setAttribute("disabled", "false")
            );
        }
    }

    // 分割条
    @example
    static registerRightClickMenuSeparator() {
        ztoolkit.Menu.register("item", {
            tag: "menuseparator",
            id: "zotero-itemmenu-abbr-separator",
        });
    }
    // 右键菜单: 期刊缩写
    @example
    static registerRightClickMenuPopup() {
        const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`;
        ztoolkit.Menu.register("item", {
            tag: "menu",
            label: getString("menupopup.label"), //期刊缩写
            id: "zotero-itemmenu-abbr-journal",
            children: [
                {
                    tag: "menuitem",
                    label: getString("menuitem.updateUserAbbr"), // 子菜单: 用户指定期刊缩写路径
                    id: "zotero-itemmenu-abbr-journal-updateUserAbbr",
                    commandListener: (ev) =>
                        HelperAbbrFactory.JA_update_UseUserData(), // JA  表示journalAbbreviation
                },
                {
                    tag: "menuitem",
                    label: getString("menuitem.updatejournal"), // 子菜单: 更新简写期刊
                    id: "zotero-itemmenu-abbr-journal-updatejournal",
                    commandListener: (ev) =>
                        HelperAbbrFactory.JA_update_UseInnerData(),
                },
                {
                    tag: "menuitem",
                    id: "zotero-itemmenu-abbr-journal-onestepupate",
                    label: getString("menuitem.onestepupate"),
                    commandListener: (ev) => HelperAbbrFactory.JA_oneStepUpdate(),
                },
                //添加分割条
                {
                    tag: "menuseparator",
                },
                {
                    tag: "menuitem",
                    label: getString("menuitem.abbrToupper"), // 子菜单: 简写期刊大写
                    id: "zotero-itemmenu-abbr-journal-abbrToupper",
                    commandListener: (ev) => HelperAbbrFactory.JA_toUpperCase(),
                },
                {
                    tag: "menuitem",
                    label: getString("menuitem.abbrTolower"), // 子菜单: 简写期刊小写
                    id: "zotero-itemmenu-abbr-journal-abbrTolower",
                    commandListener: (ev) => HelperAbbrFactory.JA_toLowerCase(),
                },
                {
                    tag: "menuitem",
                    label: getString("menuitem.abbrTocapitalize"), // 子菜单: 简写期刊首字母大写
                    id: "zotero-itemmenu-abbr-journal-abbrTocapitalize",
                    commandListener: (ev) =>
                        HelperAbbrFactory.JA_toCapitalize(),
                },
                {
                    tag: "menuitem",
                    label: getString("menuitem.removeAbbrdot"), // 子菜单: 移除简写期刊中的点
                    id: "zotero-itemmenu-abbr-journal-removeAbbrdot",
                    commandListener: (ev) => HelperAbbrFactory.JA_removeDot(),
                },
                {
                    tag: "menuitem",
                    label: getString("menuitem.exchange"), // 子菜单: 交换期刊名
                    id: "zotero-itemmenu-abbr-journal-exchange",
                    commandListener: (ev) =>
                        HelperAbbrFactory.JA_exchangeName(),
                },
                //添加分割条
                {
                    tag: "menuseparator",
                },
                {
                    tag: "menuitem",
                    label: getString("menuitem.deleteAbbrTag"), // 子菜单: 删除abbr标签
                    id: "zotero-itemmenu-abbr-journal-deleteAbbrTag",
                    commandListener: (ev) =>
                        HelperAbbrFactory.JA_removeTagname(["abbr"]),
                },
                {
                    tag: "menuitem",
                    label: getString("menuitem.deleteUserTag"), // 子菜单: 删除 abbr_user 标签
                    id: "zotero-itemmenu-abbr-journal-deleteUserTag",
                    commandListener: (ev) =>
                        HelperAbbrFactory.JA_removeTagname(["abbr_user"]),
                },
                {
                    tag: "menuseparator",
                },
                {
                    tag: "menuitem",
                    label: getString("menuitem.selectFile"), // 子菜单: 选择文件
                    id: "zotero-itemmenu-abbr-journal-selectFile",
                    commandListener: (ev) =>
                        HelperAbbrFactory.buttonSelectFilePath(),
                },
                {
                    tag: "menuitem",
                    id: "zotero-itemmenu-abbr-journal-bibliography1",
                    label: getString("menuitem.bibliography1"),
                    commandListener: (ev) => HelperAbbrFactory.JA_getbibliography1(),
                },
                {
                    tag: "menuitem",
                    id: "zotero-itemmenu-abbr-journal-bibliography2",
                    label: getString("menuitem.bibliography2"),
                    commandListener: (ev) => HelperAbbrFactory.JA_getbibliography2(),
                }
                // {
                //   tag: "menuitem",
                //   label: getString("menuitem.updateCollection"), // 子菜单: 文件夹期刊缩写
                //   id: "zotero-itemmenu-abbr-journal-updateCollection",
                //   commandListener: (ev) => HelperAbbrFactory.updateCollection(),
                // },
            ],
        });
    }

    // // 右键菜单: 用来测试新功能用,  用完后可以删除
    // // 右键菜单: 一键更新期刊缩写
    // @example
    // static registerRightClickMenuItem() {
    //     //const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`;
    //     // item menuitem with icon
    //     ztoolkit.Menu.register("item", {
    //         tag: "menuitem",
    //         id: "zotero-itemmenu-abbr-journal-onestepupate",
    //         label: getString("menuitem.onestepupate"),
    //         //icon: menuIcon,
    //         commandListener: (ev) => HelperAbbrFactory.JA_oneStepUpdate(),
    //     });
    // }

    // 右键菜单: 一键 生成带有 \\bibitem{citeKey} bibliography  的期刊
    // @example
    // static registerRightClickMenuItemBibitem() {
    //     ztoolkit.Menu.register("item", {
    //         tag: "menuitem",
    //         id: "zotero-itemmenu-abbr-journal-bibliography",
    //         label: getString("menuitem.bibliography"),
    //         commandListener: (ev) => HelperAbbrFactory.JA_getbibliography2(),
    //     });
    // }
}

///////////////////////////////
export class HelperAbbrFactory {
    // 简写期刊大写 ----  根据 journalAbbreviation 的字段进行特殊转换
    static async JA_toUpperCase() {
        const transformFn = (value: any) => value.toUpperCase();
        const successinfo = getString("prompt.success.abbrToupper.info");
        const failinfo = getString("prompt.fail.abbrToupper.info");
        //Basefun.executeFunctionWithTryCatch(Selected.processSelectItems, successinfo, failinfo )
        Basefun.executeFunctionWithTryCatch(
            async () => await Selected.processSelectItems(transformFn),
            successinfo,
            failinfo
        );
        //await processSelectItems(transformFn, successinfo, failinfo);
    }

    // 简写期刊小写  ----- 根据 journalAbbreviation 的字段进行特殊转换
    static async JA_toLowerCase() {
        const transformFn = (value: any) => value.toLowerCase();
        const successinfo = getString("prompt.success.abbrTolower.info");
        const failinfo = getString("prompt.fail.abbrTolower.info");
        Basefun.executeFunctionWithTryCatch(
            async () => await Selected.processSelectItems(transformFn),
            successinfo,
            failinfo
        );
        //await processSelectItems(transformFn, successinfo, failinfo);
    }

    //简写期刊首字母化 ---- 根据 journalAbbreviation 的字段进行特殊转换
    static async JA_toCapitalize() {
        const transformFn = (value: any) =>
            value.replace(/(?:^|\s)\S/g, function (firstChar: string) {
                return firstChar.toUpperCase();
            });
        const successinfo = getString("prompt.success.abbrTocapitalize.info");
        const failinfo = getString("prompt.fail.abbrTocapitalize.info");
        Basefun.executeFunctionWithTryCatch(
            async () => await Selected.processSelectItems(transformFn),
            successinfo,
            failinfo
        );
        //await processSelectItems(transformFn, successinfo, failinfo);
    }

    // 移除简写期刊中的点
    static async JA_removeDot() {
        const transformFn = (value: any) => value.replace(/\./g, "");
        const successinfo = getString("prompt.success.removeAbbrdot.info");
        const failinfo = getString("prompt.fail.removeAbbrdot.info");
        Basefun.executeFunctionWithTryCatch(
            async () => await Selected.processSelectItems(transformFn),
            successinfo,
            failinfo
        );
        //await processSelectItems(transformFn, successinfo, failinfo);
    }

    // 根据标签名称, 删除对应的标签
    static async JA_removeTagname(usertags: string[]) {
        await Basefun.processSelectedItemsWithPromise(
            SelectedWithHandler.removeTagHandler(usertags),
            getString("prompt.success.removetag.info") + ": " + usertags[0],
            getString("prompt.error.removetag.info") + ": " + usertags[0]
        );
    }

    // 交换期刊名 --- 即简写期刊与期刊名互换 --- 还是循环的方式-- 感觉循环比较快
    static async JA_exchangeName(
        key1: any = "journalAbbreviation",
        key2: any = "publicationTitle",
        exchangetagname: string = "exchange"
    ) {
        const successinfo = getString("prompt.success.exchange.info");
        const failinfo = getString("prompt.error.exchange.info");
        Basefun.executeFunctionWithTryCatch(
            async () => await Selected.exchangeJournalName(),
            successinfo,
            failinfo
        );
    }

    // 绑定按钮事件
    @example
    static async buttonSelectFilePath() {
        var mypath = await BasicExampleFactory.filePickerExample();

        // 判断选择的地址是否为空
        if (!mypath) {
            BasicExampleFactory.ShowPopUP(
                getString("prompt.show.cancel.selectpath.info")
            );
        } else {
            await Zotero.Prefs.set(`${config.addonRef}.input`, mypath);
            BasicExampleFactory.ShowPopUP(
                getString("prompt.show.success.selectpath.info") +
                    getString(`${mypath}`)
            );
        }
    }

    /////////////////////////////////
    // 更新期刊缩写 ///////////////////
    ////////////////////////////////
    // 1. 使用内部数据集进行更新
    static async JA_update_UseInnerData() {
        await Selected.updateJournalAbbr(
            journal_abbr,
            ["abbr"],
            ["abbr_user"],
            getString("prompt.success.updatejournal.inner.info"),
            getString("prompt.error.updatejournal.inner.info")
        );
    }

    //2 . 使用用户数据集进行更新
    static async JA_update_UseUserData() {
        const user_abbr_data = await Basefun.get_user_data();
        if (!user_abbr_data) return;
        // 更新期刊缩写 -- 返回的信息为 已有 2/2 条目缩写更新
        await Selected.updateJournalAbbr(
            user_abbr_data,
            ["abbr_user"],
            ["abbr"],
            getString("prompt.success.updatejournal.user.info"),
            getString("prompt.error.updatejournal.user.info")
        );
    }

    static async JA_oneStepUpdate() {
        // 1. 一键更新期刊, 先使用内部数据集,在使用自定义数据集,
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
            getString("prompt.success.bib.info"),
            getString("prompt.error.bib.info")
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
            getString("prompt.success.bib.info"),
            getString("prompt.error.bib.info")
        );
    }

}
