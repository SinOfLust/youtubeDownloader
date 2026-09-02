import { AnyAction } from 'redux';
import { UPDATE_URL } from '../actions/url';

export default function url(state = '', action: AnyAction) {
  if (action.type === UPDATE_URL) {
    // eslint-disable-next-line global-require
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('URL', {
      URL: action.url
    });
    return action.url;
  }

  return state;
}
