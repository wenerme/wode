export type DivisionCodeLevel = 'village' | 'town' | 'county' | 'city' | 'province';

export interface DivisionTreeNode {
  sub: string; // sub code
  children?: Record<string, DivisionTreeNode>;

  code: string; // full code
  name?: string; // name of division
}

export type DivisionTree = Record<string, DivisionTreeNode>;
