import { SetMetadata } from '@nestjs/common';

export const CHECK_POLICIES_KEY = 'check_policy';
export const CheckPolicies = (...handlers: PolicyHandler[]) => SetMetadata(CHECK_POLICIES_KEY, handlers);

interface IPolicyHandler {
  handle(ability: AuthAbility): boolean;
}

type PolicyHandlerCallback = (ability: AuthAbility) => boolean;
export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;

export type AuthAbility = {};
