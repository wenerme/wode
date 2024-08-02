import { ReactNode } from 'react';
import { isReactElement } from './renderReactNodeToText';

export function renderReactNodeToMarkdown(node: ReactNode) {
  const walk = (_node: any): string => {
    if (!_node) return '';
    if (!isReactElement(_node)) return String(_node);

    if (Array.isArray(_node)) {
      return _node.map((v) => walk(v)).join('');
    } else if (typeof _node === 'object') {
      if (typeof _node.type === 'function') {
        return walk((_node as any).type(_node.props));
      }
      const children = Array.isArray(_node.props.children)
        ? _node.props.children.map((c: any) => walk(c)).join('')
        : walk(_node.props.children);

      switch (_node.type) {
        case 'p':
        case 'br':
        case 'div':
          return children + '\n';
        case 'a':
          return `[${children}](${_node.props.href})`;
        case 'strong':
        case 'b':
          return `**${children}**`;
        case 'em':
        case 'i':
          return `_${children}_`;
        case 'code':
          return `\`${children}\``;
        case 'pre':
          return `\`\`\`\n${children}\n\`\`\``;
        case 'ul':
        case 'ol':
          return children + '\n';
        case 'li':
          return `- ${children}\n`;
        case 'img':
          return `![${_node.props.alt}](${_node.props.src})`;
        default:
          return children;
      }
    }
    return String(_node);
  };

  return walk(node);
}
