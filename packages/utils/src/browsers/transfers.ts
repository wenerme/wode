export function getFile(dataTransfer: DataTransfer | null): { file: File; filename: string } | null {
  if (dataTransfer === null) {
    return null;
  }
  const items: DataTransferItemList = dataTransfer?.items ?? ([] as any);

  if (items.length >= 2 && items[0].kind === 'string' && items[1].kind === 'file') {
    // name, file
    const text = dataTransfer.getData('text');
    const file = items[1].getAsFile() ?? dataTransfer.files?.item(0);
    if (!file) {
      console.error(`no file ${text}`, items[1]);
      return null;
    }

    // let type = file.type;
    // // fix type
    // type = type;
    // // NOTE paste file can not parse by libs
    // if (type !== file.type) {
    //   const blob = file.slice(0, file.size);
    //   file = new File([blob], text, {type});
    // }

    return { file, filename: text };
  } else if (items[0].kind === 'file') {
    const file = items[0].getAsFile();
    if (!file) {
      console.error(`no file`, items[0]);
      return null;
    }
    return { file, filename: file.name };
  } else {
    console.debug(
      `file item not match`,
      Array.from(items).map((v) => ({ type: v.type, kind: v.kind })),
    );
  }
  return null;
}
