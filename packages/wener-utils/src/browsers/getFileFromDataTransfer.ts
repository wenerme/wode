export function getFileFromDataTransfer(dataTransfer?: DataTransfer | null): { file?: File; name?: string } {
  if (!dataTransfer) {
    return {};
  }

  const items: DataTransferItemList = dataTransfer.items ?? [];

  if (items.length >= 2 && items[0].kind === 'string' && items[1].kind === 'file') {
    // name, file
    const text = dataTransfer.getData('text');
    const file = items[1].getAsFile() ?? dataTransfer.files?.item(0);
    if (!file) {
      console.error(`no file ${text}`, items[1]);
      return {};
    }

    // let type = file.type;
    // // fix type
    // type = type;
    // // NOTE paste file can not parse by libs
    // if (type !== file.type) {
    //   const blob = file.slice(0, file.size);
    //   file = new File([blob], text, {type});
    // }

    return { file, name: text };
  } else if (items[0].kind === 'file') {
    const file = items[0].getAsFile();
    if (!file) {
      console.error(`no file`, items[0]);
      return {};
    }
    return { file, name: file.name };
  } else {
    console.debug(
      `file item not match`,
      Array.from(items).map((v) => ({ type: v.type, kind: v.kind })),
    );
  }
  return {};
}
