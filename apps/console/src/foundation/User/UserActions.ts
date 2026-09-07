import { getUrqlClient } from '@wener/console/client/graphql';
import { getFragmentData } from '#/gql';
import { CurrentUserFragment, CurrentUserQuery } from './query';

export namespace UserActions {
	export async function getCurrentUser() {
		const { data, error } = await getUrqlClient().query(CurrentUserQuery, {});
		if (error) {
			throw error;
		}
		if (!data?.data) {
			throw new Error('Current user data is empty');
		}
		return getFragmentData(CurrentUserFragment, data.data);
	}
}
