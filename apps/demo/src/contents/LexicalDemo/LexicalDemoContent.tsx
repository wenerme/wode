import styles from './Lexical.module.css';
import { DemoEditor } from '@src/contents/LexicalDemo/DemoEditor';

export const LexicalDemoContent = () => {
  return (
    <div className={'mx-auto container'}>
      <div className={styles.Container}>
        <DemoEditor />
      </div>
    </div>
  );
};
