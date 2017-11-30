'use strict';
import * as formData from '../utils/field-report-constants';

const getValidValues = (arr, key) => arr.map(o => o[key]).filter(o => o !== '');

export const step1 = {
  properties: {
    summary: {
      type: 'string'
    },
    countries: {
      type: 'array',
      minItems: 1,
      items: {
        enum: getValidValues(formData.countries, 'value')
      }
    },
    status: {
      type: 'string',
      enum: getValidValues(formData.status, 'value')
    },
    disasterType: {
      type: 'string',
      enum: getValidValues(formData.disasterType, 'value')
    },
    event: {
      type: 'number',
      minimum: 0
    },
    description: {
      type: 'string'
    },
    assistance: {
      type: 'boolean'
    }
  },
  required: ['summary', 'countries', 'status', 'disasterType']
};

export const step2 = {
  definitions: {
    estimation: {
      type: 'array',
      items: {
        properties: {
          estimation: { type: 'number', minimum: 0 },
          source: {enum: ['red-cross', 'government']}
        }
      }
    }
  },
  properties: {
    numInjured: {
      '$ref': '#/definitions/estimation'
    },
    numDead: {
      '$ref': '#/definitions/estimation'
    },
    numMissing: {
      '$ref': '#/definitions/estimation'
    },
    numAffected: {
      '$ref': '#/definitions/estimation'
    },
    numDisplaced: {
      '$ref': '#/definitions/estimation'
    },
    numAssistedGov: { type: 'number', minimum: 0 },
    numAssistedRedCross: { type: 'number', minimum: 0 },
    numLocalStaff: { type: 'number', minimum: 0 },
    numVolunteers: { type: 'number', minimum: 0 },
    numExpats: { type: 'number', minimum: 0 }
  }
};

export const step3 = {
  definitions: {
    actionsCheckboxes: {
      properties: {
        options: {
          type: 'array',
          items: {
            properties: {
              checked: {
                type: 'boolean'
              }
            }
          }
        },
        description: {
          type: 'string'
        }
      }
    }
  },
  properties: {
    actionsNatSoc: {
      '$ref': '#/definitions/actionsCheckboxes'
    },
    actionsPns: {
      '$ref': '#/definitions/actionsCheckboxes'
    },
    actionsFederation: {
      '$ref': '#/definitions/actionsCheckboxes'
    },
    bulletin: {
      type: 'string'
    },
    actionsOthers: {
      type: 'string'
    }
  }
};

export const step4 = {
  properties: {
    dref: {
      type: 'string'
    },
    amountDref: { type: 'number', minimum: 0 },
    emergencyAppeal: {
      type: 'string'
    },
    amountEmergencyAppeal: { type: 'number', minimum: 0 },
    rdrtrits: {
      type: 'string'
    },
    numPplRdrits: { type: 'number', minimum: 0 },
    fact: {
      type: 'string'
    },
    numPplFact: { type: 'number', minimum: 0 },
    ifrcStaff: {
      type: 'string'
    },
    numPplIfrcStaff: { type: 'number', minimum: 0 },
    eru: {
      type: 'array',
      items: {
        properties: {
          type: { type: 'string' },
          status: { type: 'string' },
          units: { type: 'number', minimum: 0 }
        }
      }
    }
  }
};

export const step5 = {
  definitions: {
    contact: {
      properties: {
        name: { type: 'string' },
        func: { type: 'string' },
        email: { type: 'string', format: 'email' }
      }
    }
  },
  properties: {
    contactOriginator: {
      '$ref': '#/definitions/contact'
    },
    contactPrimary: {
      '$ref': '#/definitions/contact'
    },
    contactNatSoc: {
      '$ref': '#/definitions/contact'
    },
    contactFederation: {
      '$ref': '#/definitions/contact'
    },
    contactMediaNatSoc: {
      '$ref': '#/definitions/contact'
    },
    contactMedia: {
      '$ref': '#/definitions/contact'
    }
  }
};
