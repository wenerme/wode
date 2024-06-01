import { Renderable, toast, ValueOrFunction } from 'react-hot-toast';
import { resolveErrorMessage } from '@/toast/showErrorToast';

export function showPromiseToast<T>(
  p: Promise<T>,
  {
    loading = '加载中...',
    success = '成功',
    error = (e: any) => resolveErrorMessage(e),
  }: {
    loading?: Renderable;
    success?: ValueOrFunction<Renderable, T>;
    error?: ValueOrFunction<Renderable, any>;
  } = {},
) {
  return toast.promise(p, {
    loading,
    success,
    error,
  });
}
