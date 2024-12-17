export type ValueProps<T = string> = {
  value?: T;
  onValueChange?: (value: T) => void;
  defaultValue?: T;
};
