import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { getPref, setPref } from "../utils/prefs";

import {
  BasicExampleFactory,
} from "./examples";

export async function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
      columns: [],
      rows: [],
    };
  } else {
    addon.data.prefs.window = _window;
  }
  
  // updatePrefsUI();
  // bindPrefEvents();
  buildPrefsPane();
}



function buildPrefsPane() {
  const doc = addon.data.prefs!.window?.document;
  if (!doc) {
    return;
  }
  
  ztoolkit.UI.replaceElement(
    {
      tag: "menulist",
      attributes: {
        value: getPref("sortoptions") as string ,
        native: "true",
      },
      listeners: [
        {
          type: "command",
          listener: (e) => {
            if (e.target) {
              const target = e.target as HTMLInputElement;
              handleDropdownChange(target.value);
              setPref("sortoptions", target.value);
            }
          },
        },
      ],
      children: [
        {
          tag: "menupopup",
          children: [
            {
              tag: "menuitem",
              attributes: {
                label: getString("sortoptions-nkey"),
                value: "nkey",
              },
            },
            {
              tag: "menuitem",
              attributes: {
                label: getString("sortoptions-nauthor"),
                value: "nauthor",
              },
            },
            {
              tag: "menuitem",
              attributes: {
                label: getString("sortoptions-ntitle"),
                value: "ntitle",
              },
            },
            {
              tag: "menuitem",
              attributes: {
                label: getString("sortoptions-id"),
                value: "id",
              },
            },
            {
              tag: "menuitem",
              attributes: {
                label: getString("sortoptions-originid"),
                value: "originid",
              },
            }
          ],
        },
      ],
    },
    doc.querySelector(`#${makeId("sortoptions")}`) as HTMLElement
  );

  ztoolkit.UI.replaceElement(
    {
      tag: "menulist",
      attributes: {
        value: getPref("keyornum") as string ,
        native: "true",
      },
      listeners: [
        {
          type: "command",
          listener: (e) => {
            if (e.target) {
              const target = e.target as HTMLInputElement;
              handleDropdownChange(target.value);
              setPref("keyornum", target.value);
            }
          },
        },
      ],
      children: [
        {
          tag: "menupopup",
          children: [
            {
              tag: "menuitem",
              attributes: {
                label: getString("keyornum-key"),
                value: "key",
              },
            },
            {
              tag: "menuitem",
              attributes: {
                label: getString("keyornum-num"),
                value: "num",
              },
            }
          ],
        },
      ],
    },
    doc.querySelector(`#${makeId("keyornum")}`) as HTMLElement
  );

  
  function handleDropdownChange(selectedValue: string) {
    ztoolkit.log("Selected value: ", selectedValue);
    BasicExampleFactory.ShowPopUP(`Select ${selectedValue}`)
  }
  
}

function makeId(type: string) {
  return `${config.addonRef}-${type}`;
}