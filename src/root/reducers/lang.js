import {
  stateInflight,
  stateError,
  stateSuccess,
} from '../utils/reducer-utils';

import lang from '#lang';

const initialState = {
  current: 'en',
  strings: {
    ...lang,
  }
};

export default function reducer (state = initialState, action) {
  let newState = state;

  switch (action.type) {
    case 'GET_LANGUAGE_INFLIGHT':
      newState = stateInflight(state, action);
      break;
    case 'GET_LANGUAGE_FAILED':
      newState = stateError(state, action);
      break;
    case 'GET_LANGUAGE_SUCCESS':
      const { data } = stateSuccess(state, action);
      const newStrings = data.strings.reduce((acc, val) => {
        acc[val.key] = val.value;
        return acc;
      }, { ...lang });

      newState = {
        ...state,
        strings: newStrings,
      };
      break;
    case 'SET_CURRENT_LANGUAGE':
      newState.current = action.language;
      break;
  }

  return newState;
}
