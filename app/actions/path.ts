export const UPDATE_PATH = 'UPDATE_PATH';

export interface OpenDialogResult {
  canceled: boolean;
  filePaths: string[];
}

export interface UpdatePathAction {
  type: typeof UPDATE_PATH;
  path: OpenDialogResult;
}

export function updatePath(path: OpenDialogResult): UpdatePathAction {
  return {
    type: UPDATE_PATH,
    path
  };
}
