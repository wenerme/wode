import { DemoEditor } from '@/contents/LexicalDemo/DemoEditor';
import styles from './Lexical.module.css';

export const LexicalDemoContent = () => {
  return (
    <div className={'mx-auto container'}>
      <div className={styles.Container}>
        <DemoEditor />
      </div>
    </div>
  );
};

export default LexicalDemoContent;
