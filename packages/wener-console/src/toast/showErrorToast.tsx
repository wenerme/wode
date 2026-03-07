import { classOf } from '@wener/utils';
import { toast } from 'react-hot-toast';
import { resolveErrorMessage } from './resolveErrorMessage';

export function showErrorToast(error: Error | any) {
	if (!error) {
		return;
	}
	// window.__LAST_ERROR__ = error;
	console.log(`ERROR ${classOf(error)}`, error);
	toast.error(resolveErrorMessage(error));
}
