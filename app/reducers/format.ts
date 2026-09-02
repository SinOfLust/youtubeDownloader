import { AnyAction } from 'redux';
import { UPDATE_FORMAT } from '../actions/format';

export default function format(state = '', action: AnyAction) {
  if (action.type === UPDATE_FORMAT) {
    // eslint-disable-next-line global-require
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('format', {
      format: action.format
    });
    return action.format;
  }

  return state;
}
