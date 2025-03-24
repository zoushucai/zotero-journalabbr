export { registerCustomFields };

function registerCustomFields() {
  ztoolkit.FieldHooks.register(
    "getField",
    "itemBoxRowabbr",
    (
      field: string,
      unformatted: boolean,
      includeBaseMapped: boolean,
      item: Zotero.Item,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      original: Function,
    ) => {
      return ztoolkit.ExtraField.getExtraField(item, field) || "";
    },
  );

  // ztoolkit.FieldHooks.register(
  //   "getField",
  //   "abstractTranslation",
  //   (
  //     field: string,
  //     unformatted: boolean,
  //     includeBaseMapped: boolean,
  //     item: Zotero.Item,
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  //     original: Function,
  //   ) => {
  //     return ztoolkit.ExtraField.getExtraField(item, field) || "";
  //   },
  // );
}
