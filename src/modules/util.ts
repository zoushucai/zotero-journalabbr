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
        const selectedItems = items.filter(
            (item) => !item.isNote() && item.isRegularItem()
        ); // 过滤笔记 且 是规则的 item
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
        errorMessage: string
    ) {
        try {
            const selectedItems = this.filterSelectedItems();
            if (!selectedItems) return;

            const tasks = selectedItems.map(handler);
            const results = await Promise.all(tasks);
            const successCount = results.filter((result) => result).length;

            BasicExampleFactory.ShowStatus(
                selectedItems.length,
                successCount,
                successMessage
            );
        } catch (error) {
            BasicExampleFactory.ShowError(errorMessage);
        }
    }

    /////// 3. 普通的处理方法(感觉执行更快) ................................................
    // 把 try ... catch .. 模板提取出来
    static async executeFunctionWithTryCatch(
        func: any,
        successMessage = "",
        errorMessage = "",
        errorInfo = ""
    ) {
        try {
            const result = await func();
            //ztoolkit.getGlobal('alert')(`${result}`)
            const {
                selectCount = 0,
                successCount = 0,
                error_arr = [],
            } = result ?? {};
            const errorCount = error_arr.length;

            let errorMsg = "";
            if (errorCount > 5) {
                errorMsg =
                    getString("prompt-show-readfile-more-info") +
                    `${errorInfo} ${errorCount}`;
            } else if (errorCount > 0) {
                errorMsg =
                    getString("prompt-show-readfile-less-info") +
                    `${errorInfo} ${error_arr.join(", ")}`;
            }

            if (errorMsg) {
                BasicExampleFactory.ShowInfo(errorMsg);
            }
            if (successMessage) {
                BasicExampleFactory.ShowStatus(
                    selectCount,
                    successCount,
                    successMessage
                );
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

    static async get_user_data(){
        //Zotero.Prefs.set("journalabbr.userpath", zoteroProfileDir); // 持久化设置
        const userfile = Zotero.Prefs.get(`${config.addonRef}.input`) as string; // 获得持久化的变量
        // 获得持久化变量,分隔符号
        if (!userfile) {
            BasicExampleFactory.ShowError("所选文件为空");
            return;
        }
        // 1. 根据后缀名判断是否为 csv 文件 或者 json 文件
        if ( !userfile.endsWith(".csv") && !userfile.endsWith(".json")) {
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
            BasicExampleFactory.ShowError(
                "读取 csv或 json 文件失败, 可能不存在该文件或文件未按指定格式书写!"
            );
            return;
        }
        return user_abbr_data;
    }

    // 1. 从 json 获取数据
    static async read_json(filePath: string) {
        const data_str = await Zotero.File.getContentsAsync(filePath) as string;
        const data_obj = JSON.parse(data_str);
        if (typeof data_obj !== 'object' || data_obj === null || Array.isArray(data_obj)) {
            return;
        }
        
        // 把 key 转换为小写且去除空格
        let user_abbr_data: {[key: string]: any} = {};    // 用于存储转换后的数据
        for (let key in data_obj) {
            // 只保留字符串类型的键值对
            if (typeof data_obj[key] === 'string' &&  typeof key === 'string') {
                const normkey = key.toLowerCase().trim();   // 将当前键转为小写并去除两端空格
                // 给新对象添加当前键值对, 且键重复时, 会覆盖旧值,即保留最后一次出现的键值对
                user_abbr_data[normkey] = data_obj[key].trim();
            }
        }
        return user_abbr_data;
    }

    // 0. 从 csv 获取数据
    static async read_csv(filePath: string) {
        // 1. 读取用户设置的分割符号
        let pref_separator = Zotero.Prefs.get(
            `${config.addonRef}.separator`
        ) as string; // 获得持久化的变量

        // 2. 读取 csv 文件, 并解析为字典对象
        let user_abbr_data = await Selected.readAndParseCSV(
            filePath,
            pref_separator
        );
        return user_abbr_data;
    }

    // 获取参考文献的格式
    static getQuickCopyFormat() {
        const format = Zotero.Prefs.get("export.quickCopy.setting") as string;
        if (!format || format.split("=")[0] !== "bibliography") {
            BasicExampleFactory.ShowError(
                "No bibliography style is chosen in the settings for QuickCopy."
            );
            return null;
        }
        return format;
    }

    static getQuickCopyFormat2() {
        let format_str = Zotero.Prefs.get("export.quickCopy.setting") as string;
        if (!format_str || format_str.split("=")[0] !== "bibliography") {
            BasicExampleFactory.ShowError(
                "No bibliography style is chosen in the settings for QuickCopy."
            );
            return null;
        }

        let format =  Zotero.QuickCopy.unserializeSetting(format_str);// 格式化 format,返回如下形式的对象
        // {
        //     "mode": "bibliography"
        //     "contentType": ""
        //     "id": "http://www.zotero.org/styles/china-national-standard-gb-t-7714-2005-aulower"
        //     "locale": ""
        // }

        let locale = format.locale ? format.locale : Zotero.Prefs.get('export.quickCopy.locale');
        let style = Zotero.Styles.get(format.id);
        const cslEngine = style.getCiteProc(locale, 'text');
        return cslEngine
    }
 
}

// 以下为辅助类
class Selected {
    // 对某个字段进行函数处理
    static async processSelectItems(
        transformFn: (originalValue: string) => string,
        key: any = "journalAbbreviation"
    ) {
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
    static async exchangeJournalName(
        key1: any = "journalAbbreviation",
        key2: any = "publicationTitle",
        exchangetagname: string = "exchange"
    ) {
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
    static async readAndParseCSV(filePath: string, delimiter: string = ",") {
        try {
            const csvContent = (await Zotero.File.getContentsAsync(
                filePath
            )) as string;
            const lines = csvContent.trim().split("\n");
            const data: { [key: string]: any } = {};
            const errors: any[] = [];

            await Promise.all(
                lines.map(async (line, i) => {
                    let currentLine = line.split(delimiter);
                    if (currentLine.length != 2) {
                        errors.push(i + 1);
                        return;
                    }
                    let key = StringUtil.trimAndRemoveQuotes(
                        currentLine[0]
                    ).toLowerCase();
                    let value = StringUtil.trimAndRemoveQuotes(currentLine[1]);

                    if (!key || !value) {
                        errors.push(i + 1);
                    }

                    if (!data.hasOwnProperty(key) && key != "" && value != "") {
                        data[key] = value; // 重复以先前的为准
                    }
                })
            );
            if (errors.length > 0) {
                //console.log(errors)
                if (errors.length > 5) {
                    BasicExampleFactory.ShowError(
                        getString("prompt-show-readfile-more-info") +
                            " " +
                            errors.length
                    );
                } else {
                    BasicExampleFactory.ShowError(
                        getString("prompt-show-readfile-less-info") +
                            " " +
                            errors.join(", ")
                    );
                }
            }
            return data;
        } catch (error) {
            BasicExampleFactory.ShowError(
                getString("prompt-error-readfile-info")
            );
            return null;
        }
    }

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
        await Basefun.processSelectedItemsWithPromise(
            SelectedWithHandler.updateJournalAbbrHandler(
                data,
                addtagsname,
                removetagsname
            ),
            successinfo,
            errorinfo
        );
    }

    // 采用 iso-4 标准进行期刊缩写
    static async updateUseISO4(
        data: { [key: string]: any },
        addtagsname: string[],
        removetagsname: string[],
        successinfo: string,
        errorinfo: string
    ) {
        await Basefun.processSelectedItemsWithPromise(
            SelectedWithHandler.updateJournalAbbrHandlerISO4(
                data,
                addtagsname,
                removetagsname
            ),
            successinfo,
            errorinfo
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
        const cslEngine  = Basefun.getQuickCopyFormat2()

        // 3. 获取排序的方式
        const sortoptions = Zotero.Prefs.get(
            `${config.addonRef}.sortoptions`
        ) as string; // 获得持久化的变量
        // 与 [ fianl_bib, nkey, ntitle, nauthor, id_arr] 对应的索引, 其中 id_arr 为原始的 id, 用于排序
        const optionarr = ["originid", "nkey", "ntitle", "nauthor", "id"];
        let sortindex = optionarr.indexOf(sortoptions);
        sortindex = (sortindex === -1) ? 0 : sortindex;
        
        // 获取bib format
        const keyornum = Zotero.Prefs.get(`${config.addonRef}.keyornum`) as string; // 获得持久化的变量
        const isdiscardDOI = Zotero.Prefs.get(`${config.addonRef}.discardDOI`) as boolean; // 获得持久化的变量
        const bibemptyline = Zotero.Prefs.get(`${config.addonRef}.bibemptyline`) as boolean; // 获得持久化的变量
        let bibprenum = 1;

        for (let i = 0; i < ruleItemCount; i++) {
            try {
                // 获得 每一个条目的 key 以及作者, 以及 title
                const item = selectedItems[i];
                if (keyornum == "key"){
                    nkey[i] = item.getField("citationKey") as string;
                }else if (keyornum == "num"){
                    nkey[i] = "[" + String(i + 1) +"]";
                }else {
                    nkey[i] = "";
                }
                ntitle[i] = item.getField("title") as string;
                nauthor[i] = item.getCreator(0).lastName as string;

                if (!ntitle[i] || !nauthor[i] || !nkey[i]) {
                    missingInfoItemCount.push(i);
                    continue;
                }
                
                // 方式一: 直接调用
                citestr_arr[i] = Zotero.Cite.makeFormattedBibliographyOrCitationList(cslEngine, [item], "text");
                // 根据正则表达式, 替换参考文献开头的多余信息
                // 1. 处理 [1] 或者 1. 或者 (1) 这种情况, 改成 \bibitem{key}
                // 2. 处理 等. --> et al. 或者 et al.--> 等.
                let [f, s, n] =  StringUtil.handleBibtoFormat1(citestr_arr[i], nkey[i], keyornum, bibprenum, isdiscardDOI);
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
        cslEngine.free()
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
            const sortarr = StringUtil.sortColumns(
                [fianl_bib, nkey, ntitle, nauthor, id_arr],
                sortindex,
                true
            ); // 始终把 fianl_bib 放在第一列,然后执行更改数字即可排序
            finalBib_str = sortarr[0]
                .filter((item: any) => Boolean(item))
                .join(newseparator); // 选择适当的列排序, 过滤掉空值
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
        const cslEngine  = Basefun.getQuickCopyFormat2()

        // 3. 获取排序的方式
        const sortoptions = Zotero.Prefs.get(
            `${config.addonRef}.sortoptions`
        ) as string; // 获得持久化的变量
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
                if (keyornum == "key"){
                    nkey[i] = item.getField("citationKey") as string;
                }else if (keyornum == "num"){
                    nkey[i] = "[" + String(i + 1) +"]";
                }else {
                    nkey[i] = ""; //String(i + 1);
                }
                
                ntitle[i] = item.getField("title") as string;
                nauthor[i] = item.getCreator(0).lastName as string;
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
                const bib_arr = StringUtil.splitStringByKeywords(
                    citestr_arr[i],
                    nauthor[i],
                    nTitle[i]
                ); 
                // 根据关键词分割字符串

                if (!bib_arr || bib_arr.length !== 3) {
                    fianl_bib[i] = citestr_arr[i];
                    noActionCount.push(i);
                } else {
                    fianl_bib[i] = StringUtil.handleBibtoFormat2(
                        bib_arr,
                        nkey[i],
                        keyornum,
                        bibprenum,
                        isdiscardDOI
                    );
                    bibprenum += 1;
                    successfulCount.push(i);
                }
            } catch (error) {
                fianl_bib[i] = "";
                missingInfoItemCount.push(i);
            }
        }
        // 方式二: 忽略某些 html,直接返回 text
        cslEngine.free()
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
            const sortarr = StringUtil.sortColumns(
                [fianl_bib, nkey, ntitle, nauthor, id_arr],
                sortindex,
                true
            ); // 始终把 fianl_bib 放在第一列,然后执行更改数字即可排序
            finalBib_str = sortarr[0]
                .filter((item: any) => Boolean(item))
                .join(newseparator); // 选择适当的列排序, 过滤掉空值
        }

        const resultInfo = new ResultInfo();
        resultInfo.selectCount = ruleItemCount;
        resultInfo.successCount = successfulCount.length;
        resultInfo.error_arr = noActionCount.concat(missingInfoItemCount);
        resultInfo.strinfo = finalBib_str;

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

    static updateJournalAbbrHandler(
        data: { [key: string]: any },
        addtagsname: string[],
        removetagsname: string[]
    ) {
        return async (item: any) => {
            const currentjournal = await item.getField("publicationTitle");
            const currentabbr = await item.getField("journalAbbreviation");
            if (!currentjournal) {
                return false;
            }
            
            const journalKey = currentjournal.trim().toLowerCase().replace(/\s+/g, " ").trim();
            const data_in_journal = data[journalKey];
            if (!journalKey || !data_in_journal) {
                return false;
            }

            // const isIdentical = currentabbr.trim() === data_in_journal.trim();
            const isIdentical = currentabbr?.trim() === data_in_journal.trim();
            if (!isIdentical) {
                // not identical, update
                item.setField("journalAbbreviation", data_in_journal);
            }

            const tags = item.getTags(); // tags 是一个数组对象, 每个对象一般有两个属性: type, tag. 

            addtagsname = addtagsname.map(tag => tag.trim());
            removetagsname = removetagsname.map(tag => tag.trim());

            const removeTags = removetagsname.filter(tag => tags.some((t: any) => t.tag === tag));
            const addTags = addtagsname.filter(tag => !tags.some((t: any) => t.tag === tag));

            removeTags.forEach(tag => item.removeTag(tag));
            addTags.forEach(tag => item.addTag(tag));
    
            if (removeTags.length > 0 || addTags.length > 0 || !isIdentical) {
                await item.saveTx();
            }
            return true;
        };
    }

    static updateJournalAbbrHandlerISO4(
        data: { [key: string]: any },
        addtagsname: string[],
        removetagsname: string[]
    ) {
        return async (item: any) => {
            let currentjournal = await item.getField("publicationTitle");
            const currentabbr = await item.getField("journalAbbreviation");
            if (!currentjournal) {
                return false;
            }
            
            currentjournal = currentjournal.replace(/\s+/g, " ").trim();

            const abbred_iso4_journal = abbrevIso.makeAbbreviation(currentjournal);
            if (!abbred_iso4_journal) {
                return false;
            }

            const isIdentical = currentabbr?.trim() === abbred_iso4_journal.trim();
            if (!isIdentical) {
                // not identical, update
                item.setField("journalAbbreviation", abbred_iso4_journal);
            }

            const tags = item.getTags(); // tags 是一个数组对象, 每个对象一般有两个属性: type, tag. 
            

            addtagsname = addtagsname.map(tag => tag.trim());
            removetagsname = removetagsname.map(tag => tag.trim());
            
            const removeTags = removetagsname.filter(tag => tags.some((t: any) => t.tag === tag));
            const addTags = addtagsname.filter(tag => !tags.some((t: any) => t.tag === tag));

            removeTags.forEach(tag => item.removeTag(tag));
            addTags.forEach(tag => item.addTag(tag));
    
            if (removeTags.length > 0 || addTags.length > 0 || !isIdentical) {
                await item.saveTx();
            }
            return true;
        };
    }
}





export {
    ResultInfo, // 返回结果信息类
    Basefun, // 基础的选择函数
    Selected, // for 循环来处理
    SelectedWithHandler, //  异步处理
};
