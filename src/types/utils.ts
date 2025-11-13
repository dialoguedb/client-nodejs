export type InputValidatorResponse = [true] | [false, string];

export type ListResponse<T> = {
  items: T[];
  next?: string;
};
