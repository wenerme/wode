import { Button } from '../../daisy';
import type { Parser } from './parseIt';

export const ParserCard: React.FC<{
  parser: Parser;
  parsed?: any;
  children?: React.ReactNode;
  onChange?: (s: string) => void;
}> = ({ parser, parsed, children, onChange }) => {
  const { title, description, model } = parser;
  const actions = [];
  if (parsed) {
    if ('prev' in parsed) {
      actions.push(
        <Button key={'prev'} size={'sm'} onClick={() => onChange?.(parsed.prev().toString())}>
          上一位
        </Button>,
      );
    }
    if ('next' in parsed) {
      actions.push(
        <Button key={'next'} size={'sm'} onClick={() => onChange?.(parsed.next().toString())}>
          下一位
        </Button>,
      );
    }
  }
  if (model) {
    if ('random' in model) {
      actions.push(
        <Button key={'random'} size={'sm'} onClick={() => onChange?.(model.random().toString())}>
          随机
        </Button>,
      );
    }
  }
  return (
    <>
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <div className="card-title">
            <h3 className="text-lg font-medium leading-6">{title}</h3>
            <p className="mt-1 max-w-2xl text-sm opacity-75">{description}</p>
          </div>
          {children && <div className="border-t border-base-300 px-4 py-5 sm:px-6">{children}</div>}
          {Boolean(actions.length) && <div className="card-actions justify-end">{actions}</div>}
        </div>
      </div>
    </>
  );
};
