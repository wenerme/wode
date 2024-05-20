import { ObjectType } from 'type-graphql';
import { BaseNode } from './BaseNode';
import { RelayNode } from './relay';

@ObjectType({ implements: [RelayNode, BaseNode] })
export class BaseObject extends BaseNode {}
