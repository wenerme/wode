/** Recognized JWT Claims Set members, any other members may also be present. */
export interface JWTPayload {
  /**
   * JWT Issuer
   *
   * @see [RFC7519#section-4.1.1](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.1)
   */
  iss?: string;

  /**
   * JWT Subject
   *
   * @see [RFC7519#section-4.1.2](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.2)
   */
  sub?: string;

  /** JWT Audience [RFC7519#section-4.1.3](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.3). */
  aud?: string | string[];

  /**
   * JWT ID
   *
   * @see [RFC7519#section-4.1.7](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.7)
   */
  jti?: string;

  /**
   * JWT Not Before
   *
   * @see [RFC7519#section-4.1.5](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.5)
   */
  nbf?: number;

  /**
   * JWT Expiration Time
   *
   * @see [RFC7519#section-4.1.4](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.4)
   */
  exp?: number;

  /**
   * JWT Issued At
   *
   * @see [RFC7519#section-4.1.6](https://www.rfc-editor.org/rfc/rfc7519#section-4.1.6)
   */
  iat?: number;

  /** Any other JWT Claim Set member. */
  [name: string]: unknown;
}
