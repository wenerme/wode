import { router } from '../../trpc';
import { repoRouter } from './repoRouter';

export const githubRouter = router({
  repo: repoRouter,
});
