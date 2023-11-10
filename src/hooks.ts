import {
  BasicExampleFactory,
  // HelperExampleFactory,
  // KeyExampleFactory,
  // PromptExampleFactory,
  HelperAbbrFactory,
  UIExampleFactory,
} from "./modules/examples";
import { config } from "../package.json";
import { getString, initLocale } from "./utils/locale";
import { registerPrefsScripts } from "./modules/preferenceScript";
import { createZToolkit } from "./utils/ztoolkit";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  initLocale();
  ztoolkit.ProgressWindow.setIconURI(
    "default",
    `chrome://${config.addonRef}/content/icons/favicon.png`,
  );

  ////用于测试的进度条
  // const popupWin = new ztoolkit.ProgressWindow(config.addonName, {
  //   closeOnClick: true,
  //   closeTime: -1,
  // })
  //   .createLine({
  //     text: getString("startup-begin"),
  //     type: "default",
  //     progress: 0,
  //   })
  //   .show();
  BasicExampleFactory.registerPrefs();
  await BasicExampleFactory.initPrefs();
  ZoteroPane.itemsView.onSelect.addListener(UIExampleFactory.displayMenuitem); //监听右键显示菜单
  UIExampleFactory.registerWindowMenuWithSeparator(); // 分割线
  UIExampleFactory.registerRightClickMenuPopup(); // 二级菜单
  // UIExampleFactory.registerWindowMenuWithSeparator2(); // 分割线
  await UIExampleFactory.registerCustomItemBoxRow(); // 右边的`信息`下注册额外字段 abbr
  await UIExampleFactory.registerCustomItemBoxCitationkey(); // 右边的`信息`下注册额外字段 abbrCkey
  await UIExampleFactory.registerExtraColumn(); // 菜单的额外列

  // await UIExampleFactory.registerFel();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
  // Remove addon object
  addon.data.alive = false;
  delete Zotero[config.addonInstance];
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
// Otherwise the code would be hard to read and maintian.

export default {
  onStartup,
  onShutdown,
  onNotify,
  onPrefsEvent,
  onDialogEvents,
};
