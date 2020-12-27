import {NextPage} from 'next';
import dynamic from 'next/dynamic';

const Content = dynamic({
  loader() {
    return import('../apps/calc').then(({Calculator}) => Calculator)
  },
  ssr:false
})
const Page: NextPage = () => {
  return <div>
    <Content />
  </div>
}
export default Page
