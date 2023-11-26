import NextAuth from 'next-auth';
import { withNextRouteHandler } from '../../../../server/next';
import { getNextAuthOptions } from './getNextAuthOptions';

const handler = withNextRouteHandler(NextAuth(getNextAuthOptions()));

export { handler as GET, handler as POST };
