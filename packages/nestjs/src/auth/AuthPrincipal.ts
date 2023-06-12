/**
 * 用户、服务账户或机器人
 */
export interface AuthPrincipal {
  roles: string[];

  [key: string]: any;
}
