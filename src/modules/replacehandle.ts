import {
  Basefun, // 基础的选择函数
  FeildExport,
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
const StrMethodName = ["replace", "match"];
function isValidType(value: any, type: any) {
  return typeof value === type;
}

function filterValidEntries(objectsArray: any[]) {
  const filteredObjects = objectsArray.filter((obj: any) => {
    const { itemType, searchField, replaceField, methodName, searchType, searchString, replaceType, replaceString } = obj;
    return (
      ItemType.includes(itemType) &&
      ItemField.includes(searchField) &&
      ItemField.includes(replaceField) &&
      StrMethodName.includes(methodName) &&
      SearchType.includes(searchType) &&
      ReplaceType.includes(replaceType) &&
      isValidType(itemType, "string") &&
      isValidType(searchField, "string") &&
      isValidType(replaceField, "string") &&
      isValidType(methodName, "string") &&
      isValidType(searchType, "string") &&
      isValidType(searchString, "string") &&
      isValidType(replaceType, "string") &&
      isValidType(replaceString, "string")
    );
  });
  return filteredObjects;
}

class replaceHandle {
  static async sreplace(text: string, methodName: string, searchType: string, searchString: string, replaceType: string, replaceString: string) {
    // 简单验证一下输入的参数是否合法, 注意:  replaceString 可以为空, 即 replaceString === ""
    if (!text || !searchType || !searchString || !replaceType ) {
      return -654321;
    }
  
    
    // 定义替换方式的对象映射
    const replaceMethods = {
      regex: (str: string) => {
        try {
          const matches = str.match(/^\/(.*?)\/([gim]*)$/);
          return matches ? new RegExp(matches[1], matches[2]) : null;
        } catch (error) {
          return null;
        }
      },
      string: (str: string) => str,
      function: (str: string) => {
        try {
          return new Function("return " + str)();
        } catch (error) {
          return null;
        }
      },
    };

    const searchvar = searchType === "regex" ? replaceMethods.regex(searchString) : searchString;
    if (!searchvar) return -654321;
    if(methodName === "match"){
      const matchcontent = text[methodName](searchvar) || "";
      if (Array.isArray(matchcontent) && matchcontent.length > 1) return matchcontent.join(" ");
      return matchcontent.toString();
    }else if(methodName === "replace"){
      let replacevar;
      if ( replaceType === "regex" || replaceType === "string"){
        replacevar = replaceString;
      }else if (replaceType === "function"){
        const replaceFunction = replaceMethods[replaceType as keyof typeof replaceMethods];
        replacevar = replaceFunction ? replaceFunction(replaceString) : null;
        if (typeof replacevar !== "function") return -654321;
      }else{
        return -654321;
      }
      return text[methodName](searchvar, replacevar);
    }else{
      return -654321;
    }
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
          let searchFieldContent = "";
          if (m_entry.searchField === "abbr"){
            // Zotero.debug("-----------------------------------------------")
            searchFieldContent = String(ztoolkit.ExtraField.getExtraField(item, "itemBoxRowabbr")) || "";
          }else{
            searchFieldContent = String(item.getField(m_entry.searchField));
          }
          const replaceContent = await this.sreplace(searchFieldContent, m_entry.methodName , m_entry.searchType, m_entry.searchString, m_entry.replaceType, m_entry.replaceString);
          
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
