export const UPDATE_FORMAT = 'UPDATE_FORMAT';

export interface UpdateFormatAction {
  type: typeof UPDATE_FORMAT;
  format: string;
}

export function updateFormat(format: string): UpdateFormatAction {
  return {
    type: UPDATE_FORMAT,
    format
  };
}
