export interface UserInfo {
  nickName: string;
  avatarUrl: string;
  city: string;
  country: string;
  gender: number;
  language: string;
  province: string;
}

export interface EncryptedUserInfo {
  cloudId?: string;
  encryptedData: string;
  iv: string;
  signature: string;
  rawData: string | object;
  userInfo: UserInfo;
}

export interface DecryptedUserInfo extends UserInfo {
  openId: string;
  unionId?: string;
  watermark: {
    timestamp: number;
    appid: string;
  };
}
