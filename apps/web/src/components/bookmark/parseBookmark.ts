// netscape

function canParse(html: string): boolean {
  // 首个非空字符必须是 '<'
  for (let i = 0; i < html.length; i++) {
    if (/\s/.test(html[i])) {
      continue;
    }
    if (html[i] === '<') {
      break;
    } else {
      return false;
    }
  }
  return /<dl/i.test(html) && /<\/dl/i.test(html) && /<dt/i.test(html) && /<a[^<>]*href\s*=\s*/i.test(html);
}

export type BookmarkItem = {
  type: 'bookmark' | 'folder';
  title: string;
  url?: string;
  addDate?: string;
  lastModified?: string;
  // dataurl
  icon?: string;
  nsRoot?: string | 'menu' | 'toolbar' | 'unsorted';
  children?: BookmarkItem[];
};

export function parseBookmark(html: string | Document): BookmarkItem[] {
  type Item = BookmarkItem & {
    __dir_dl?: Element;
  };

  function _getNodeData(node: Element): Item {
    const data = {} as Item;

    for (let i = 0; i < node.childNodes.length; i++) {
      const childNode = node.childNodes[i];
      if (childNode.nodeType === Node.ELEMENT_NODE) {
        const element = childNode as Element;

        if (element.tagName === 'A') {
          // 书签
          data.type = 'bookmark';
          data.url = element.getAttribute('href') ?? undefined;
          data.title = element.textContent ?? '';

          const add_date = element.getAttribute('add_date');
          if (add_date) {
            data.addDate = add_date;
          }

          const icon = element.getAttribute('icon');
          if (icon) {
            data.icon = icon;
          }
        } else if (element.tagName === 'H3') {
          // 文件夹
          data.type = 'folder';
          data.title = element.textContent ?? '';

          const add_date = element.getAttribute('add_date');
          const last_modified = element.getAttribute('last_modified');

          if (add_date) {
            data.addDate = add_date;
          }

          if (last_modified) {
            data.lastModified = last_modified;
          }
          if (element.hasAttribute('personal_toolbar_folder')) {
            data.nsRoot = 'toolbar';
          }
          if (element.hasAttribute('unfiled_bookmarks_folder')) {
            data.nsRoot = 'unsorted';
          }
        } else if (element.tagName === 'DL') {
          // 存储 DL 元素以进一步处理子节点
          data.__dir_dl = element;
        }
      }
    }

    // 检查是否有下一个兄弟节点作为文件夹的 DL 元素
    if (data.type === 'folder' && !data.__dir_dl) {
      let nextSibling = node.nextSibling;
      while (nextSibling && nextSibling.nodeType !== Node.ELEMENT_NODE) {
        nextSibling = nextSibling.nextSibling;
      }
      const nextElementSibling = nextSibling as Element;
      if (nextElementSibling && nextElementSibling.tagName === 'DD') {
        const dls = nextElementSibling.getElementsByTagName('DL');
        if (dls.length) {
          data.__dir_dl = dls[0];
        }
      }
    }

    return data;
  }

  function processDir(dir: Element, level: number): BookmarkItem[] {
    const children = dir.childNodes;
    let menuRoot: Item | undefined;
    const items: Item[] = [];

    for (let i = 0; i < children.length; i++) {
      const childNode = children[i];
      if (childNode.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }
      const child = childNode as Element;
      if (child.tagName !== 'DT') {
        continue;
      }
      const itemData = _getNodeData(child);

      if (itemData.type) {
        if (level === 0 && !itemData.nsRoot) {
          // 创建菜单根节点
          menuRoot ||= {
            title: 'Menu',
            children: [],
            nsRoot: 'menu',
            type: 'folder',
          };
          if (itemData.type === 'folder' && itemData.__dir_dl) {
            itemData.children = processDir(itemData.__dir_dl, level + 1);
            delete itemData.__dir_dl;
          }
          menuRoot.children?.push(itemData);
        } else {
          if (itemData.type === 'folder' && itemData.__dir_dl) {
            itemData.children = processDir(itemData.__dir_dl, level + 1);
            delete itemData.__dir_dl;
          }
          items.push(itemData);
        }
      }
    }
    if (menuRoot) {
      items.push(menuRoot);
    }
    return items;
  }

  let ele: Document;
  if (typeof html === 'string') {
    ele = new DOMParser().parseFromString(html, 'text/html');
  } else {
    ele = html;
  }

  const dls = ele.getElementsByTagName('DL');

  if (dls.length <= 0) {
    throw new Error('Netscape Bookmarks file malformed: no DL nodes were found');
  }
  return processDir(dls[0], 0);
}

// https://github.com/sentialx/node-bookmarks-parser
