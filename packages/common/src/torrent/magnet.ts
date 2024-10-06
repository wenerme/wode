export interface Magnet {
  dn?: string | string[] | undefined;
  tr?: string | string[] | undefined;
  xs?: string | string[] | undefined;
  as?: string | string[] | undefined;
  ws?: string | string[] | undefined;
  kt?: string[] | undefined;
  ix?: number | number[] | undefined;
  xt?: string | string[] | undefined;
  infoHash?: string | undefined;
  infoHashBuffer?: Buffer | undefined;
  name?: string | string[] | undefined;
  keywords?: string | string[] | undefined;
  announce?: string[] | undefined;
  urlList?: string[] | undefined;
}
