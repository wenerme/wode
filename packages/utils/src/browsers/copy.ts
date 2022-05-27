// https://gist.github.com/rproenca/64781c6a1329b48a455b645d361a9aa3
let _copy: (s: any) => void;

function initCopy() {
  let textArea: HTMLTextAreaElement;

  function isIOS() {
    return navigator.userAgent.match(/ipad|iphone/i);
  }

  function createTextArea(text: string) {
    textArea = document.createElement('textArea') as HTMLTextAreaElement;
    textArea.value = text;
    document.body.appendChild(textArea);
  }

  function selectText() {
    let range, selection;

    if (isIOS()) {
      range = document.createRange();
      range.selectNodeContents(textArea);
      selection = window.getSelection();
      if (selection === null) {
        console.error(`no selection`);
        return;
      }
      selection.removeAllRanges();
      selection.addRange(range);
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.select();
    }
  }

  function copyToClipboard() {
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }

  _copy = (text) => {
    createTextArea(text);
    selectText();
    copyToClipboard();
  };
}

export function copy(text: string) {
  if (window.navigator?.clipboard?.writeText) {
    window.navigator.clipboard.writeText(text);
    return;
  }
  if (!_copy) {
    initCopy();
  }
  _copy(text);
}
