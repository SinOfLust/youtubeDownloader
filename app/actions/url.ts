export const UPDATE_URL = 'UPDATE_URL';

export interface UpdateUrlAction {
  type: typeof UPDATE_URL;
  url: string;
}

export function updateUrl(url: string): UpdateUrlAction {
  return {
    type: UPDATE_URL,
    url
  };
}
