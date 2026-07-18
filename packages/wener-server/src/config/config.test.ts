import { expect, test } from 'vite-plus/test';
import { getRootConfig } from './root.config';

test('conf', () => {
	expect(getRootConfig({ S3_ENDPOINT: 'http://minio:9000' })).matchSnapshot();
});
