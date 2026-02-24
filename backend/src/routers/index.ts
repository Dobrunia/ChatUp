import { router } from '../trpc/trpc';
import { authRouter } from './auth.router';
import { profileRouter } from './profile.router';
import { dialogRouter } from './dialog.router';
import { searchRouter } from './search.router';
import { messageRouter } from './message.router';
import { mediaRouter } from './media.router';
import { pushRouter } from './push.router';

export const appRouter = router({
  auth: authRouter,
  profile: profileRouter,
  dialog: dialogRouter,
  search: searchRouter,
  message: messageRouter,
  media: mediaRouter,
  push: pushRouter,
});

export type AppRouter = typeof appRouter;
