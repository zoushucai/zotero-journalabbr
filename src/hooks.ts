import {
  BasicExampleFactory,
  //HelperExampleFactory,
  // KeyExampleFactory,
  // PromptExampleFactory,
  HelperAbbrFactory,
  UIExampleFactory,
} from "./modules/examples";
import { getString, initLocale } from "./utils/locale";
import { registerPrefsScripts } from "./modules/preferenceScript";
import { createZToolkit } from "./utils/ztoolkit";
import { config } from "../package.json";
import { registerCustomFields } from "./modules/fields";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  initLocale();

  BasicExampleFactory.registerPrefs();

  registerCustomFields();
  await BasicExampleFactory.initPrefs();

  
  // await UIExampleFactory.registerExtraColumn(); // 不能正确显示标题, 但是可以显示内容
  
  await UIExampleFactory.registerExtraColumnWithCustomCell(); // 自定义的列, 类似registerExtraColumn, 但可以自定义显示的内容以及正确显示标题
  UIExampleFactory.registerItemPaneCustomInfoRow();


  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );
}

async function onMainWindowLoad(win: Window): Promise<void> {
  // Create ztoolkit for every window
  addon.data.ztoolkit = createZToolkit();

  // @ts-ignore This is a moz feature
  win.MozXULElement.insertFTLIfNeeded(
    `${addon.data.config.addonRef}-mainWindow.ftl`,
  );

  UIExampleFactory.registerWindowMenuWithSeparator(); // 分割线
  UIExampleFactory.registerRightClickMenuPopup(); // 二级菜单
  UIExampleFactory.registerRightClickMenuItem(); // (改为二级菜单了,简单的一个分类操作)
  UIExampleFactory.registerWindowMenuWithSeparator(); // 分割线
  if (Zotero.Prefs.get(config.addonRef + ".autorunabbrall")) {
    ztoolkit.log(`--------- auto run abbrall ---------`);
    await HelperAbbrFactory.JA_transferAllItemsToCustomFieldStart(); // 根据item的类型, 把所有类似 publicationTitle 的字段转移到 自定义字段 itemBoxRowabbr 上
  }
  else {
      ztoolkit.log(`--------- not auto run abbrall ----------`);
      // ztoolkit.log 可以输出多个参数, 如:  ztoolkit.log("ssssssss", "ssssssss") ,多个参数会自动用空格拼接,这样有时候很方便.
      //, 而 Zotero.debug 只能输出一个参数
  }
    //addon.hooks.onDialogEvents("dialogExample");
}

async function onMainWindowUnload(win: Window): Promise<void> {
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
  // Remove addon object
  addon.data.alive = false;
  // @ts-ignore - Plugin instance is not typed
  delete Zotero[addon.data.config.addonInstance];
}

/**
 * This function is just an example of dispatcher for Notify events.
 * Any operations should be placed in a function to keep this funcion clear.
 */
async function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: { [key: string]: any },
) {
  // You can add your code to the corresponding notify type
  ztoolkit.log("notify", event, type, ids, extraData);
  if (
    event == "select" &&
    type == "tab" &&
    extraData[ids[0]].type == "reader"
  ) {
    BasicExampleFactory.exampleNotifierCallback();
  } else {
    return;
  }
}

/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this funcion clear.
 * @param type event type
 * @param data event data
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      registerPrefsScripts(data.window);
      break;
    default:
      return;
  }
}


async function onDialogEvents(type: string, event: Event) {
  switch (type) {
    case "dialogExample":
      //HelperExampleFactory.dialogExample();
      break;
    case "buttonExample":
      await HelperAbbrFactory.buttonSelectFilePath();
      break;
    case "buttonExampleJson":
      await HelperAbbrFactory.buttonJsonSelectFilePath();
      break;
    case "showChangeEventInfo":
      BasicExampleFactory.showChangeEventInfo(event);
      break;
    case "showChangeMenulistEventInfo":
      BasicExampleFactory.showChangeMenulistEventInfo(event);
      break;
    default:
      break;
  }
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintain.

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onNotify,
  onPrefsEvent,
  onDialogEvents,
};
