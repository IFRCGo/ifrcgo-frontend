'use strict';

export const countriesByRegion = {
  '0': [
    '12',
    '13',
    '18',
    '34',
    '39',
    '41',
    '43',
    '44',
    '45',
    '57',
    '63',
    '65',
    '69',
    '70',
    '73',
    '77',
    '93',
    '102',
    '103',
    '109',
    '110',
    '112',
    '114',
    '115',
    '120',
    '122',
    '127',
    '128',
    '143',
    '150',
    '151',
    '152',
    '157',
    '158',
    '161',
    '163',
    '170',
    '176',
    '181',
    '182',
    '183',
    '184',
    '185',
    '186',
    '187',
    '188',
    '189',
    '209',
    '290'
  ],
  '1': [
    '4',
    '5',
    '8',
    '19',
    '20',
    '25',
    '28',
    '31',
    '33',
    '35',
    '42',
    '46',
    '48',
    '51',
    '54',
    '58',
    '59',
    '60',
    '62',
    '75',
    '76',
    '79',
    '80',
    '81',
    '90',
    '116',
    '126',
    '132',
    '134',
    '135',
    '172',
    '177',
    '178',
    '179',
    '180'
  ],
  '2': [
    '7',
    '14',
    '22',
    '27',
    '36',
    '40',
    '47',
    '66',
    '84',
    '85',
    '91',
    '94',
    '99',
    '111',
    '121',
    '123',
    '125',
    '130',
    '131',
    '133',
    '136',
    '147',
    '153',
    '156',
    '160',
    '169',
    '171',
    '191',
    '192',
    '193',
    '194',
    '195',
    '210',
    '211',
    '213',
    '227',
    '275',
    '279',
    '281'
  ],
  '3': [
    '1',
    '3',
    '6',
    '11',
    '15',
    '17',
    '21',
    '23',
    '29',
    '30',
    '37',
    '53',
    '55',
    '56',
    '64',
    '67',
    '68',
    '71',
    '72',
    '74',
    '82',
    '83',
    '88',
    '89',
    '98',
    '100',
    '105',
    '106',
    '107',
    '108',
    '113',
    '117',
    '124',
    '129',
    '138',
    '141',
    '142',
    '154',
    '155',
    '159',
    '164',
    '165',
    '167',
    '174',
    '175',
    '197',
    '199',
    '200',
    '201',
    '202',
    '228',
    '270',
    '271'
  ],
  '4': [
    '2',
    '10',
    '16',
    '26',
    '61',
    '87',
    '92',
    '97',
    '101',
    '119',
    '139',
    '149',
    '173',
    '203',
    '204',
    '205',
    '206',
    '222'
  ]
};

export const regions = {
  '0': {
    id: 0,
    name: 'Africa'
  },
  '1': {
    id: 1,
    name: 'Americas'
  },
  '2': {
    id: 2,
    name: 'Asia Pacific'
  },
  '3': {
    id: 3,
    name: 'Europe'
  },
  '4': {
    id: 4,
    name: 'Middle East & North Africa'
  }
};

export const regionsIdByName = {
  'africa': 0,
  'americas': 1,
  'asiapacific': 2,
  'europe': 3,
  'mena': 4
};

export const getRegionId = (idOrName) => {
  // If region name
  if (isNaN(idOrName)) {
    return regionsIdByName[idOrName.toLowerCase()];
  }
  return idOrName;
};
