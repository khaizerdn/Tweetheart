// Static version - uses mock API
import { mockAxios } from '../mock/mockApi.js';

// In static mode, always use mock API
const requestAccessToken = mockAxios;

export default requestAccessToken;

