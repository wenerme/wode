import dayjs from 'dayjs';

export interface BuildInfo {
  version: string;
  date?: string;
  isProd: boolean;
  isDev: boolean;
  commit: {
    shortSha?: string;
    timestamp?: string;
    tag?: string;
    refName?: string;
    branch?: string;
  };
}

let _info: BuildInfo;

export function getBuildInfo(): BuildInfo {
  return (_info ||= (() => {
    if (!globalThis?.process) {
      (globalThis as any).process = { env: {} as any };
    }

    const buildInfo = {
      date: process.env.BUILD_DATE,
      commit: {
        shortSha: process.env.CI_COMMIT_SHORT_SHA,
        timestamp: process.env.CI_COMMIT_TIMESTAMP,
        tag: process.env.CI_COMMIT_TAG,
        refName: process.env.CI_COMMIT_REF_NAME,
        branch: process.env.CI_COMMIT_BRANCH,
      },
    };

    const midInfo = {
      ...buildInfo,
      version: buildInfo.date ? dayjs(buildInfo.date).format('YYYY.MM.DD') : '0.0.0',
      isProd: Boolean(
        buildInfo.commit.branch === 'main' ||
          buildInfo.commit.branch === 'master' ||
          buildInfo.commit.branch?.startsWith('release/') ||
          buildInfo.commit.refName?.match(/^v\d/) ||
          buildInfo.commit.refName?.match(/^release\//),
      ),
    };
    return Object.freeze({ ...midInfo, date: buildInfo.date, isDev: !midInfo.isProd });
  })());
}
