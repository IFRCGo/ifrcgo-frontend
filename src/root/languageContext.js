import React from 'react';
import lang from '#lang';

export default React.createContext({
  strings: lang,
  setStrings: () => {},
});