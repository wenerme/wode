'use server';

import { getBuildInfo } from '../../../buildinfo';

export async function getWebBuildInfo() {
  return getBuildInfo();
}
