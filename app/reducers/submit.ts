import { AnyAction } from 'redux';
import { UPDATE_PATH } from '../actions/path';

export default function submit(state = '', action: AnyAction) {
  if (action.type === UPDATE_PATH) {
    // eslint-disable-next-line global-require
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('submit', {
      path: action.path.filePaths[0]
    });
    return action.path;
  }

  return state;
}
