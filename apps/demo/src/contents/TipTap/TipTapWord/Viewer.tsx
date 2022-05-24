import { useEditorStore } from '@src/contents/TipTap/TipTapWord/useEditorState';
import classNames from 'classnames';
import styled from 'styled-components';

const DeviceSize: Record<string, string> = {
  mobile: 'max-w-screen-sm',
  tablet: 'max-w-screen-md',
  laptop: 'max-w-screen-lg',
  desktop: 'max-w-screen-xl',
};

const ViewerContainer = styled.div`
  .ProseMirror {
    outline: none;
    //line-height: 1.25rem;
    min-height: 80px;

    .ProseMirror-selectednode {
      border: 2px solid #1a73e8;
      box-sizing: border-box;
    }

    .selectedCell:after {
      background: rgba(200, 200, 255, 0.4);
      //background: #e8f0fe;
      content: '';
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      pointer-events: none;
      position: absolute;
      z-index: 2;
    }

    .column-resize-handle {
      background-color: #adf;
      bottom: -2px;
      position: absolute;
      right: -2px;
      pointer-events: none;
      top: 0;
      width: 4px;
    }

    .resize-cursor {
      cursor: ew-resize;
      cursor: col-resize;
    }

    table {
      td,
      th {
        position: relative;
      }
    }

    ul[data-type='taskList'] {
      list-style: none;
      padding-left: 0;

      li {
        display: flex;
        gap: 8px;

        & p {
          margin: 0;
        }
      }
    }

    mark {
      color: currentColor;
    }
  }
`;
export const Viewer: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { viewSize, presetStyleName } = useEditorStore(({ settings: { viewSize, presetStyleName } }) => ({
    viewSize,
    presetStyleName,
  }));
  let cx = classNames(
    'p-4 shadow border bg-white mx-auto h-fit min-h-full',
    presetStyleName?.startsWith('prose') && 'prose',
    presetStyleName,
    !viewSize && 'max-w-none',
    DeviceSize[viewSize || ''],
  );
  return <ViewerContainer className={cx}>{children}</ViewerContainer>;
};