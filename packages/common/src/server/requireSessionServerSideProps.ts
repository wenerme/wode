import { GetServerSideProps } from 'next';
import { getRemoteServerSession } from './getRemoteServerSession';

export const requireSessionServerSideProps: GetServerSideProps = async ({ req, res, resolvedUrl }) => {
  const session = await getRemoteServerSession({ req, res });
  if (!session) {
    return {
      redirect: {
        destination: `/auth/signin`,
        permanent: false,
        basePath: false,
      },
    };
  }
  return {
    props: {
      session,
    },
  };
};
