import { useStore } from 'zustand';
import { useWindow } from './ReactWindow';

export const WindowTest = () => {
  let win = useWindow();
  let store = win.store;
  const { canMaximize, canMinimize, canResize } = useStore(store, ({ canMaximize, canMinimize, canResize }) => {
    return {
      canMaximize,
      canMinimize,
      canResize,
    };
  });
  return (
    <div className={'flex flex-col p-2'}>
      <h2>Window Test</h2>
      <div className={'flex flex-col gap-1'}>
        <div className='form-control'>
          <label className='label cursor-pointer'>
            <span className='label-text'>Can Maximize</span>
            <input
              type='checkbox'
              className='toggle'
              checked={canMaximize}
              onChange={(e) => {
                store.setState({ canMaximize: e.target.checked });
              }}
            />
          </label>
        </div>
        <div className='form-control'>
          <label className='label cursor-pointer'>
            <span className='label-text'>Can Minimize</span>
            <input
              type='checkbox'
              className='toggle'
              checked={canMinimize}
              onChange={(e) => {
                store.setState({ canMinimize: e.target.checked });
              }}
            />
          </label>
        </div>
      </div>
      <hr className={'my-4'} />
      <input type='text' className={'input input-bordered'} placeholder={'Can focus and input'} />
    </div>
  );
};
