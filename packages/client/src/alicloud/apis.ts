import * as DytnsV20200217 from './DytnsV20200217';
import * as OcrV20210707 from './OcrV20210707';

export { type OcrV20210707, type DytnsV20200217 };

export interface AliCloudApis {
  Dytnsapi: {
    '2020-02-17': DytnsV20200217.DytnsV20200217Api;
  };
  'ocr-api': {
    '2021-07-07': OcrV20210707.OcrV20210707Api;
  };
}
