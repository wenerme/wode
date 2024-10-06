/**
 * @see https://help.aliyun.com/document_detail/442255.html#api-detail-40
 */
export interface RecognizeIdcardRoot {
  algo_version: string;
  data: RecognizeIdcardRootData;
  height: number;
  orgHeight: number;
  orgWidth: number;
  width: number;
}

export interface RecognizeIdcardRootData {
  face: RecognizeIdcardRootDataFace;
}

export interface RecognizeIdcardRootDataFace {
  algo_version: string;
  angle: number;
  data: RecognizeIdcardRootDataFaceData;
  ftype: number;
  height: number;
  orgHeight: number;
  orgWidth: number;
  prism_keyValueInfo: RecognizeIdcardRootDataFacePrismKeyValueInfo[];
  sliceRect: RecognizeIdcardRootDataFaceSliceRect;
  warning: RecognizeIdcardRootDataFaceWarning;
  width: number;
}

export interface RecognizeIdcardRootDataFaceData {
  address: string;
  birthDate: string;
  ethnicity: string;
  idNumber: string;
  name: string;
  sex: string;
}

export interface RecognizeIdcardRootDataFacePrismKeyValueInfo {
  key: string;
  keyProb: number;
  value: string;
  valuePos: RecognizeIdcardRootDataFacePrismKeyValueInfoValuePo[];
  valueProb: number;
}

export interface RecognizeIdcardRootDataFacePrismKeyValueInfoValuePo {
  x: number;
  y: number;
}

export interface RecognizeIdcardRootDataFaceSliceRect {
  x0: number;
  x1: number;
  x2: number;
  x3: number;
  y0: number;
  y1: number;
  y2: number;
  y3: number;
}

export interface RecognizeIdcardRootDataFaceWarning {
  completenessScore: number;
  isCopy: number;
  isReshoot: number;
  qualityScore: number;
  tamperScore: number;
}
