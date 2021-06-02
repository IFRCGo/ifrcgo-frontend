import { isNotDefined } from '@togglecorp/fujs';
import { FormatDateException } from './exception/FormatDateException';
import { DateTime } from 'luxon';
import { get } from '#utils/utils';
import { orgTypes } from './field-report-constants';

export const nope = '--';
export const na = 'N/A';
export const invalid = 'Invalid';
export const noSummary = 'No summary available';

export const formatDate = (date) => {
  if (typeof date === 'string' || date instanceof String) {
    date = new Date(date);
  }
  if (date instanceof Date) {
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);

    return day + '-' + month + '-' + date.getFullYear();
  }
  throw new FormatDateException('The received argument (' + date + ') is not a Date or String instance!');
};

// Ie. given 12345.99, return '12,346'
// optionally, can be passed a suffix, so:
// commaSeparatedNumber(12345.99, 'CHF') => '12,346 CHF'
export const commaSeparatedNumber = (x, suffix=null) => {
  // isNaN(null) === true :*(
  if (isNaN(x) || (!x && x !== 0)) {
    return nope;
  }
  let s = Math.round(Number(x)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (suffix) {
    s += ` ${suffix}`;
  }
  return s;
};

export function percent (value, total, decimals = 2) {
  if (isNaN(value) || isNaN(total) || total === 0) {
    return nope;
  }
  let val = value / total * 100;
  return round(val, decimals);
}

export function round (value, decimals = 2) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function shortenLargeNumber (value, decimals = 2) {
  if (value / 1e12 >= 1) {
    value = round(value / 1e12, decimals) + 'T';
  } else if (value / 1e9 >= 1) {
    value = round(value / 1e9, decimals) + 'B';
  } else if (value / 1e6 >= 1) {
    value = round(value / 1e6, decimals) + 'M';
  } else if (value / 1e3 >= 1) {
    value = round(value / 1e3, 0) + 'K';
  }
  return value;
}

export function commaSeparatedLargeNumber (value) {
  if (value / 1e12 >= 1) {
    return round(value / 1e12, 2) + 'T';
  } else if (value / 1e9 >= 1) {
    return round(value / 1e9, 2) + 'B';
  } else if (value / 1e6 >= 1) {
    return round(value / 1e6, 2) + 'M';
  }
  return commaSeparatedNumber(value);
}

// Ie. given 'MadDogIndustries', return 'Mad Dog Industries'
export const separateUppercaseWords = (x) => {
  if (typeof x !== 'string') {
    return nope;
  }
  return x.replace(/([A-Z])/g, ' $1').trim();
};

// Ie. given 'SCRT', return 'Secretariat'.
const organizationCodeToDisplay = {};
orgTypes.forEach(o => {
  organizationCodeToDisplay[o.value] = o.label;
});
export const organizationType = (code) => organizationCodeToDisplay[code] || nope;

export const uppercaseFirstLetter = (str) => {
  const s = str.toString();
  return s.slice(0, 1).toUpperCase() + s.slice(1, s.length).toLowerCase();
};

// Ie. given 'user.username', return 'username'.
export const getPropertyFromPath = (path) => {
  const parts = path.split('.');
  return parts[parts.length - 1];
};

// Ie. given 'user.username', return 'Username'.
// This will console.warn if a match isn't found.
const apiPropertyToDisplay = {
  'username': 'Username',
  'email': 'Email',
  'first_name': 'First Name',
  'last_name': 'Last Name',
  'city': 'City',
  'org': 'Organization',
  'org_type': 'Organization Type',
  'department': 'Department',
  'position': 'Position',
  'phone_number': 'Phone Number'
};
export const apiPropertyDisplay = (propOrPath) => {
  const propertyName = getPropertyFromPath(propOrPath);
  const display = apiPropertyToDisplay[propertyName];
  if (!display) {
    console.warn('No display found for', propertyName);
    return propertyName;
  }
  return display;
};

// Ie. given ('org', { org: 'NTLS' }) return 'National Society'.
const apiPropertyFormatters = {
  'org_type': organizationType
};
export const apiPropertyValue = (propOrPath, object) => {
  const value = get(object, propOrPath);
  if (typeof value === 'undefined' || value === null || value === '') {
    return nope;
  }
  const propertyName = getPropertyFromPath(propOrPath);
  const formatter = apiPropertyFormatters[propertyName];
  if (!formatter) {
    return value;
  }
  return formatter(value);
};

export const drefDefinition = {
  1: 'Requested',
  2: 'Planned',
  3: 'Deployed'
};

export const appealDefinition = {
  1: 'Requested',
  2: 'Planned',
  3: 'Launched'
};

export const bulletinDefinition = {
  1: 'Requested',
  2: 'Planned',
  3: 'Published'
};

export const deployDefinition = {
  1: 'Requested',
  2: 'Planned',
  3: 'Deployed'
};

export const getResponseStatus = (data, dataPath) => {
  const status = get(data, dataPath, null);
  if (status === null || status === 0) { return null; }
  switch (getPropertyFromPath(dataPath)) {
    case 'dref':
      return drefDefinition[status];
    case 'appeal':
      return appealDefinition[status];
    case 'bulletin':
      return bulletinDefinition[status];
    case 'rdrt':
    case 'fact':
    case 'ifrc_staff':
    default:
      return deployDefinition[status];
  }
};

export const privateSurgeAlert = 'This is a private alert. You must be logged in to view it.';

export function isoDate (d) {
  const result = DateTime.fromISO(d).toISODate();
  return result || nope;
}

export function timestamp (d) {
  const result = DateTime.fromISO(d).toLocaleString(DateTime.DATETIME_SHORT);
  return result || nope;
}

export const days90 = DateTime.utc().minus({days: 90}).startOf('day').toISO();
export const recentInterval = DateTime.utc().minus({days: 30}).startOf('day').toISO();

export function intersperse (arr, sep) {
  if (arr.length === 0) {
    return [];
  }
  return arr.slice(1).reduce(function (xs, x) {
    return xs.concat([sep, x]);
  }, [arr[0]]);
}

export function yesno (bool) {
  if (isNotDefined(bool)) {
    return '-';
  }
  return bool ? 'Yes' : 'No';
}
