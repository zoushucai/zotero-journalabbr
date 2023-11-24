
import {
  Basefun, // 基础的选择函数
  FeildExport
} from "./util";


const ItemType = [
    "attachment-file",
    "document",
    "attachment-link",
    "attachment-pdf",
    "attachment-pdf-link",
    "attachment-snapshot",
    "attachment-web-link",
    "artwork",
    "audioRecording",
    "bill",
    "blogPost",
    "book",
    "bookSection",
    "case",
    "computerProgram",
    "conferencePaper",
    "dictionaryEntry",
    "email",
    "encyclopediaArticle",
    "film",
    "forumPost",
    "hearing",
    "instantMessage",
    "interview",
    "journalArticle",
    "letter",
    "magazineArticle",
    "manuscript",
    "newspaperArticle",
    "note",
    "patent",
    "preprint",
    "presentation",
    "report",
    "statute",
    "thesis",
    "webpage",
    "map",
    "podcast",
    "radioBroadcast",
    "tvBroadcast",
    "videoRecording",
];

const ItemField = [
"title",
"firstCreator",
"abstractNote",
"artworkMedium",
"medium",
"artworkSize",
"date",
"language",
"shortTitle",
"archive",
"archiveLocation",
"libraryCatalog",
"callNumber",
"url",
"accessDate",
"rights",
"extra",
"abbr",
"audioRecordingFormat",
"seriesTitle",
"volume",
"numberOfVolumes",
"place",
"label",
"publisher",
"runningTime",
"ISBN",
"billNumber",
"number",
"code",
"codeVolume",
"section",
"codePages",
"pages",
"legislativeBody",
"session",
"history",
"blogTitle",
"publicationTitle",
"websiteType",
"type",
"series",
"seriesNumber",
"edition",
"numPages",
"bookTitle",
"caseName",
"court",
"dateDecided",
"docketNumber",
"reporter",
"reporterVolume",
"firstPage",
"versionNumber",
"system",
"company",
"programmingLanguage",
"proceedingsTitle",
"conferenceName",
"DOI",
"dictionaryTitle",
"subject",
"encyclopediaTitle",
"distributor",
"genre",
"videoRecordingFormat",
"forumTitle",
"postType",
"committee",
"documentNumber",
"interviewMedium",
"issue",
"seriesText",
"journalAbbreviation",
"ISSN",
"letterType",
"manuscriptType",
"mapType",
"scale",
"country",
"assignee",
"issuingAuthority",
"patentNumber",
"filingDate",
"applicationNumber",
"priorityNumbers",
"issueDate",
"references",
"legalStatus",
"episodeNumber",
"audioFileType",
"repository",
"archiveID",
"citationKey",
"presentationType",
"meetingName",
"programTitle",
"network",
"reportNumber",
"reportType",
"institution",
"nameOfAct",
"codeNumber",
"publicLawNumber",
"dateEnacted",
"thesisType",
"university",
"studio",
"websiteTitle",
"id",
"year",
];

const SearchType = ["string", "regex"];
const ReplaceType = ["string", "regex", "function"];


    
function isValidType(value:any, type:any) {
    return typeof value === type;
}

function filterValidEntries(objectsArray: any[]) {
    const filteredObjects = objectsArray.filter((obj:any) => {
        const {
            itemType, searchField, replaceField, searchType,
            searchString, replaceType, replaceString
        } = obj;
        return ItemType.includes(itemType) &&
        ItemField.includes(searchField) &&
        ItemField.includes(replaceField) &&
        SearchType.includes(searchType) &&
        ReplaceType.includes(replaceType) &&
        isValidType(itemType, 'string') &&
        isValidType(searchField, 'string') &&
        isValidType(replaceField, 'string') &&
        isValidType(searchType, 'string') &&
        isValidType(searchString, 'string') &&
        isValidType(replaceType, 'string') &&
        isValidType(replaceString, 'string');
    });
    return filteredObjects;
}



class replaceHandle {
    static async sreplace(text:string, searchType:string, searchString:string, replaceType:string, replaceString:string) {
        // 简单验证一下输入的参数是否合法
        if (!text || !searchType || !searchString || !replaceType || !replaceString) {
            return -654321;
        }
    
        // 定义替换方式的对象映射
        const replaceMethods = {
            regex: (str:string) => {
                try {
                    const matches = str.match(/^\/(.*?)\/([gim]*)$/);
                    return matches ? new RegExp(matches[1], matches[2]) : null;
                } catch (error) {
                    return null;
                }
            },
            string: (str:string) => str,
            function: (str:string) => {
                try {
                    return new Function('return ' + str)();
                } catch (error) {
                    return null;
                }
            }
        };
    
        // 根据 searchType 创建相应的正则表达式或者字符串
        const searchvar = (searchType === 'regex') ? replaceMethods.regex(searchString) : searchString;
    
        // 根据 replaceType 决定如何替换
        const replaceFunction = replaceMethods[replaceType as keyof typeof replaceMethods];
        const replacevar = replaceFunction ? replaceFunction(replaceString) : null;
        // const replacevar = replaceMethods[replaceType] ? replaceMethods[replaceType](replaceString) : null;
    
        if (!searchvar || !replacevar || (replaceType === 'function' && typeof replacevar !== 'function')) {
            return -654321;
        }
    
        return text.replace(searchvar, replacevar);
    }

    static async replacejson(data: any, addtagsname: string[], removetagsname: string[]) {
        const selectedItems = Basefun.filterSelectedItems();
        if (!selectedItems) return;
    
        const ruleItemCount = selectedItems.length;
        const addTagsSet = new Set(addtagsname.map((tag) => tag.trim()));
        const removeTagsSet = new Set(removetagsname.map((tag) => tag.trim()));
    
        const tagOperations = selectedItems.map(async (item, i) => {
            const itemTags = item.getTags(); // 缓存标签信息
            const itemType = item.itemType;
    
            for (let j = 0; j < data.length; j++) {
                const m_entry = data[j];
                if (m_entry.itemType !== itemType) continue;
    
                try {
                    const searchFieldContent = String(item.getField(m_entry.searchField));
                    const replaceContent = await this.sreplace(searchFieldContent, m_entry.searchType, m_entry.searchString, m_entry.replaceType, m_entry.replaceString);
                    if (replaceContent === -654321) {
                        break;
                    }
    
                    if (m_entry.replaceField === "abbr") {
                        // const fieldValue = FeildExport.getPublicationTitleForItemType(item);
                        ztoolkit.ExtraField.setExtraField(item, "itemBoxRowabbr", replaceContent);
                    } else {
                        item.setField(m_entry.replaceField, replaceContent);
                    }
    
                    const removeTags = Array.from(removeTagsSet).filter((tag) => itemTags.some((t: any) => t.tag === tag));
                    const addTags = Array.from(addTagsSet).filter((tag) => !itemTags.some((t: any) => t.tag === tag));
    
                    removeTags.forEach((tag) => item.removeTag(tag));
                    addTags.forEach((tag) => item.addTag(tag));
    
                    await item.saveTx();
                } catch (error) {
                    break;
                }
            }
        });
        await Promise.all(tagOperations);
    }
    
}
export { replaceHandle, filterValidEntries };
