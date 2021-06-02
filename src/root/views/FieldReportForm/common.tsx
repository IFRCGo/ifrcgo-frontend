import { isDefined } from '@togglecorp/fujs';
import { PartialForm } from '@togglecorp/toggle-form';
import { DateTime } from 'luxon';

import { api } from '#config';
import { request } from '#utils/network';
import type { Option as SearchSelectOption } from '#components/SearchSelectInput';

export const STATUS_EARLY_WARNING = 8;
export const STATUS_EVENT = 9;
export const DISASTER_TYPE_EPIDEMIC = 1;

export type ReportType = 'EVT' | 'EPI' | 'EW' | 'COVID';

export interface NumericValueOption {
  value: number;
  label: string;
  description?: string;
}

export interface BooleanValueOption {
  value: boolean;
  label: string;
  description?: string;
}

export interface StringValueOption {
  value: string;
  label: string;
  description?: string;
}

export interface User {
  id: number;
}

export type Option = NumericValueOption | BooleanValueOption | StringValueOption;

export const emptyOptionList: Option[] = [];
export const emptyStringOptionList: StringValueOption[] = [];
export const emptyNumericOptionList: NumericValueOption[] = [];
export const emptyBooleanOptionList: BooleanValueOption[] = [];

export function fetchEventsFromApi (input: string | undefined, callback: (options: SearchSelectOption[]) => void) {
  if (!input) {
    callback([]);
  }

  request(`${api}api/v1/es_search/?type=event&keyword=${input}`)
    .then(data => {
      const options = data.hits.map((o: any) => ({
        value: o._source.id,
        label: `${o._source.name} (${DateTime.fromISO(o._source.date).toISODate()})`
      }));

      callback(options);
    });
}

export interface FormType {
  status: number;
  is_covid_report: boolean;
  dtype: number;
  event: number;
  summary: string;
  country: number;
  districts: number[];
  start_date: string;
  request_assistance?: boolean;
  ns_request_assistance?: boolean;

  epi_cases: number;
  epi_suspected_cases: number;
  epi_probable_cases: number;
  epi_confirmed_cases: number;
  epi_num_dead: number;

  epi_cases_since_last_fr: number;
  epi_deaths_since_last_fr: number;

  epi_figures_source: string;
  epi_notes_since_last_fr: string;
  sit_fields_date: string;
  other_sources: string;
  description: string;

  num_injured: number;
  num_dead: number;
  num_missing: number;
  num_affected: number;
  num_displaced: number;

  num_injured_source: string;
  num_dead_source: string;
  num_missing_source: string;
  num_affected_source: string;
  num_displaced_source: string;

  num_potentially_affected: number;
  num_highest_risk: number;
  affected_pop_centres: string;
  num_potentially_affected_source: string;
  num_highest_risk_source: string;
  affected_pop_centres_source: string;

  gov_num_assisted: number;
  num_assisted: number;
  num_localstaff: number;
  num_volunteers: number;
  num_expats_delegates: number;

  actions_ntls: number[];
  actions_ntls_desc: string;
  actions_fdrn: number[];
  actions_fdrn_desc: string;
  actions_pns: number[];
  actions_pns_desc: string;
  bulletin: number;
  actions_others: string;

  notes_health: string;
  notes_ns: string;
  notes_socioeco: string;
  external_partners: number[];
  supported_activities: number[];

  dref: number;
  dref_amount: number;
  appeal: number;
  appeal_amount: number;
  fact: number;
  num_fact: number;
  ifrc_staff: number;
  num_ifrc_staff: number;
  forecast_based_action: number;
  forecast_based_action_amount: number;

  contact_originator_name: string;
  contact_originator_title: string;
  contact_originator_email: string;
  contact_originator_phone: string;
  contact_nat_soc_name: string;
  contact_nat_soc_title: string;
  contact_nat_soc_email: string;
  contact_nat_soc_phone: string;
  contact_federation_name: string;
  contact_federation_title: string;
  contact_federation_email: string;
  contact_federation_phone: string;
  contact_media_name: string;
  contact_media_title: string;
  contact_media_email: string;
  contact_media_phone: string;

  visibility: number;
}

export function getDefinedValues<T extends Record<string, any>>(o: T): Partial<T> {
  type Key = keyof T;
  const keys = Object.keys(o) as Key[];
  const definedValues: Partial<T> = {};
  keys.forEach((key) => {
    if (isDefined(o[key])) {
      definedValues[key] = o[key];
    }
  });

  return definedValues;
}

export type ListResponse<T> = {
  count: number;
  results: T[];
  next?: string;
};

export interface Entity {
  id: number;
  name: string;
}

export interface Country extends Entity {
  independent: boolean;
  record_type: number;
}

export const optionKeySelector = (o: Option) => o.value;
export const numericOptionKeySelector = (o: NumericValueOption) => o.value;
export const stringOptionKeySelector = (o: StringValueOption) => o.value;
export const booleanOptionKeySelector = (o: BooleanValueOption) => o.value;
export const optionLabelSelector = (o: Option) => o.label;
export const optionDescriptionSelector = (o: Option) => o.description;

export const BULLETIN_PUBLISHED_NO = 0;
export const BULLETIN_PUBLISHED_PLANNED = 2;
export const BULLETIN_PUBLISHED_YES = 3;

export const SOURCE_RC = 'red-cross';
export const SOURCE_GOV = 'government';
export const SOURCE_OTHER = 'other';

export const VISIBILITY_PUBLIC = 3;
export const VISIBILITY_RCRC_MOVEMENT = 1;
export const VISIBILITY_IFRC_SECRETARIAT = 2;

export const EPI_SOURCE_MOH = 0;
export const EPI_SOURCE_WHO = 1;
export const EPI_SOURCE_OTHER = 2;
export const epiSourceOptions: NumericValueOption[] = [
  { value: EPI_SOURCE_MOH, label: 'Ministry of Health' },
  { value: EPI_SOURCE_WHO, label: 'World Health Organization' },
  { value: EPI_SOURCE_OTHER, label: 'Other' },
];

// NTLS: National society of Red Cross
// FDRN: IFRC
// PNS: Other RCRC (Partner NS)
export type OrganizationType = 'NTLS' | 'PNS' | 'FDRN';
export type FieldReportType = 'EW' | 'EVT' | 'EPI' | 'COVID';
type ContactType = 'Originator' | 'NationalSociety' | 'Federation' | 'Media';

export interface ActionFields {
  category: string;
  field_report_types: FieldReportType[];
  id: number;
  name: string;
  organizations: OrganizationType[]
  tooltip_text: string | null;
}

export type ActionByReportType = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [key in FieldReportType]: ActionFields[];
}

export type ActionsByOrganization = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [key in OrganizationType]: Action[]
};

export const emptyActionList: ActionFields[] = [];

export type Action = {
  value: number;
  label: string;
  category: string;
  description: string | undefined;
  organization: OrganizationType;
}


export interface FieldReportAPIFields {
  // ------------------------------------------
  // Context
  // ------------------------------------------
  status: number;
  is_covid_report: boolean;
  event: number | undefined;
  summary: string;
  countries: number[];
  districts: number[];
  dtype: number;
  start_date: string;
  request_assistance: boolean | undefined;
  ns_request_assistance: boolean | undefined;

  // ------------------------------------------
  // Risk Analysis, Situation
  // ------------------------------------------

  // Potentially affected with source = "Red Cross / Red Cresent"
  num_potentially_affected: number | undefined;
  num_highest_risk: number | undefined;
  affected_pop_centres: string | undefined;
  num_injured: number | undefined;
  num_dead: number | undefined;
  num_missing: number | undefined;
  num_affected: number | undefined;
  num_displaced: number | undefined;

  // Potentially affected with source = "Government"
  gov_num_potentially_affected: number | undefined;
  gov_num_highest_risk: number | undefined;
  gov_affected_pop_centres: string | undefined;
  gov_num_injured: number | undefined;
  gov_num_dead: number | undefined;
  gov_num_missing: number | undefined;
  gov_num_affected: number | undefined;
  gov_num_displaced: number | undefined;

  // Potentially affected with source = "Other"
  other_num_potentially_affected: number | undefined;
  other_num_highest_risk: number | undefined;
  other_affected_pop_centres: string | undefined;
  other_num_injured: number | undefined;
  other_num_dead: number | undefined;
  other_num_missing: number | undefined;
  other_num_affected: number | undefined;
  other_num_displaced: number | undefined;

  epi_cases: number | undefined;
  epi_suspected_cases: number | undefined;
  epi_probable_cases: number | undefined;
  epi_confirmed_cases: number | undefined;
  epi_num_dead: number | undefined;
  epi_figures_source: string | undefined;
  epi_notes_since_last_fr: string | undefined;
  epi_cases_since_last_fr: number | undefined;
  epi_deaths_since_last_fr: number | undefined;

  // Date of Data for Epidemic
  sit_fields_date: string | undefined;

  // Source details
  other_sources: string | undefined;

  // Risk analysis or Situational Overview
  description: string | undefined;


  // ------------------------------------------
  // Actions
  // ------------------------------------------

  // Assisted by Government
  gov_num_assisted: number | undefined;

  // Assisted by RCRC Movements
  num_assisted: number | undefined;

  // Number of NS Staff Involved
  num_localstaff: number | undefined;

  // Number of NS Volunteers Involved
  num_volunteers: number | undefined;

  // Number of RCRC Partner Personnel Involved
  num_expats_delegates: number | undefined;

  actions_taken: {
    organization: OrganizationType;
    summary?: string;
    actions: number[];
  }[]

  notes_health: string | undefined;
  notes_ns: string | undefined;
  notes_socioeco: string | undefined;

  bulletin: number | undefined;
  actions_others: string | undefined;
  external_partners: number[] | undefined;
  supported_activities: number[] | undefined;


  // ------------------------------------------
  // Early Actions: Planned Interventions
  // ------------------------------------------
  dref: number | undefined;
  dref_amount: number | undefined;
  appeal: number | undefined;
  appeal_amount: number | undefined;

  // Rapid Response Personnel
  fact: number | undefined;
  num_fact: number | undefined;

  // Emergency Response Units
  ifrc_staff: number | undefined;
  num_ifrc_staff: number | undefined;

  forecast_based_action: number | undefined;
  forecast_based_action_amount: number | undefined;

  // ------------------------------------------
  // Early Actions: Contacts
  // ------------------------------------------
  contacts: {
    ctype: ContactType;
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  }[]
  visibility: number;
}


export function transformFormFieldsToAPIFields(formValues: FormType): FieldReportAPIFields {
  const {
    status,
    is_covid_report,
    dtype,
    event,
    summary,
    country,
    districts,
    start_date,
    request_assistance,
    ns_request_assistance,

    epi_cases,
    epi_suspected_cases,
    epi_probable_cases,
    epi_confirmed_cases,
    epi_num_dead,
    epi_cases_since_last_fr,
    epi_deaths_since_last_fr,

    epi_figures_source,
    epi_notes_since_last_fr,
    sit_fields_date,
    other_sources,
    description,

    num_injured,
    num_dead,
    num_missing,
    num_affected,
    num_displaced,

    num_injured_source,
    num_dead_source,
    num_missing_source,
    num_affected_source,
    num_displaced_source,

    num_potentially_affected,
    num_highest_risk,
    affected_pop_centres,
    num_potentially_affected_source,
    num_highest_risk_source,
    affected_pop_centres_source,

    gov_num_assisted,
    num_assisted,
    num_localstaff,
    num_volunteers,
    num_expats_delegates,

    actions_ntls,
    actions_ntls_desc,
    actions_fdrn,
    actions_fdrn_desc,
    actions_pns,
    actions_pns_desc,
    bulletin,
    actions_others,

    notes_health,
    notes_ns,
    notes_socioeco,
    external_partners,
    supported_activities,

    dref,
    dref_amount,
    appeal,
    appeal_amount,
    fact,
    num_fact,
    ifrc_staff,
    num_ifrc_staff,
    forecast_based_action,
    forecast_based_action_amount,

    contact_originator_name,
    contact_originator_title,
    contact_originator_email,
    contact_originator_phone,
    contact_nat_soc_name,
    contact_nat_soc_title,
    contact_nat_soc_email,
    contact_nat_soc_phone,
    contact_federation_name,
    contact_federation_title,
    contact_federation_email,
    contact_federation_phone,
    contact_media_name,
    contact_media_title,
    contact_media_email,
    contact_media_phone,

    visibility,
  } = formValues;

  const actions_taken: FieldReportAPIFields['actions_taken'] = [];

  if (isDefined(actions_ntls_desc) || (actions_ntls ?? []).length > 0) {
    actions_taken.push({
      organization: 'NTLS',
      summary: actions_ntls_desc,
      actions: actions_ntls,
    });
  }

  if (isDefined(actions_fdrn_desc) || (actions_fdrn ?? []).length > 0) {
    actions_taken.push({
      organization: 'FDRN',
      summary: actions_fdrn_desc,
      actions: actions_fdrn,
    });
  }

  if (isDefined(actions_pns_desc) || (actions_pns ?? []).length > 0) {
    actions_taken.push({
      organization: 'PNS',
      summary: actions_pns_desc,
      actions: actions_pns,
    });
  }

  const contacts: FieldReportAPIFields['contacts'] = [];

  // NOTE: server will not accept the contact unless all the fields are present
  const hasOriginatorContact = isDefined(contact_originator_name)
    || isDefined(contact_originator_title)
    || isDefined(contact_originator_email)
    || isDefined(contact_originator_phone);
  if (hasOriginatorContact) {
    contacts.push({
      ctype: 'Originator',
      name: contact_originator_name ?? '',
      title: contact_originator_title ?? '',
      email: contact_originator_email ?? '',
      phone: contact_originator_phone ?? '',
    });
  }

  const hasNationalSocietyContact = isDefined(contact_nat_soc_name)
    || isDefined(contact_nat_soc_title)
    || isDefined(contact_nat_soc_email)
    || isDefined(contact_nat_soc_phone);
  if (hasNationalSocietyContact) {
    contacts.push({
      ctype: 'NationalSociety',
      name: contact_nat_soc_name ?? '',
      title: contact_nat_soc_title ?? '',
      email: contact_nat_soc_email ?? '',
      phone: contact_nat_soc_phone ?? '',
    });
  }

  const hasFederationContact = isDefined(contact_federation_name)
    || isDefined(contact_federation_title)
    || isDefined(contact_federation_email)
    || isDefined(contact_federation_phone);
  if (hasFederationContact) {
    contacts.push({
      ctype: 'Federation',
      name: contact_federation_name ?? '',
      title: contact_federation_title ?? '',
      email: contact_federation_email ?? '',
      phone: contact_federation_phone ?? '',
    });
  }

  const hasMediaContact = isDefined(contact_media_name)
    || isDefined(contact_media_title)
    || isDefined(contact_media_email)
    || isDefined(contact_media_phone);
  if (hasMediaContact) {
    contacts.push({
      ctype: 'Media',
      name: contact_media_name ?? '',
      title: contact_media_title ?? '',
      email: contact_media_email ?? '',
      phone: contact_media_phone ?? '',
    });
  }

  const rc_num_potentially_affected = num_potentially_affected_source === SOURCE_RC ? num_potentially_affected : undefined;
  const rc_num_highest_risk = num_highest_risk_source === SOURCE_RC ? num_highest_risk : undefined;
  const rc_affected_pop_centres = affected_pop_centres_source === SOURCE_RC ? affected_pop_centres : undefined;
  const rc_num_injured = num_injured_source === SOURCE_RC ? num_injured : undefined;
  const rc_num_dead = num_dead_source === SOURCE_RC ? num_dead : undefined;
  const rc_num_missing = num_missing_source === SOURCE_RC ? num_missing : undefined;
  const rc_num_affected = num_affected_source === SOURCE_RC ? num_affected : undefined;
  const rc_num_displaced = num_displaced_source === SOURCE_RC ? num_displaced : undefined;

  const gov_num_potentially_affected = num_potentially_affected_source === SOURCE_GOV ? num_potentially_affected : undefined;
  const gov_num_highest_risk = num_highest_risk_source === SOURCE_GOV ? num_highest_risk : undefined;
  const gov_affected_pop_centres = affected_pop_centres_source === SOURCE_GOV ? affected_pop_centres : undefined;
  const gov_num_injured = num_injured_source === SOURCE_GOV ? num_injured : undefined;
  const gov_num_dead = num_dead_source === SOURCE_GOV ? num_dead : undefined;
  const gov_num_missing = num_missing_source === SOURCE_GOV ? num_missing : undefined;
  const gov_num_affected = num_affected_source === SOURCE_GOV ? num_affected : undefined;
  const gov_num_displaced = num_displaced_source === SOURCE_GOV ? num_displaced : undefined;

  const other_num_potentially_affected = num_potentially_affected_source === SOURCE_OTHER? num_potentially_affected : undefined;
  const other_num_highest_risk = num_highest_risk_source === SOURCE_OTHER? num_highest_risk : undefined;
  const other_affected_pop_centres = affected_pop_centres_source === SOURCE_OTHER? affected_pop_centres : undefined;
  const other_num_injured = num_injured_source === SOURCE_OTHER? num_injured : undefined;
  const other_num_dead = num_dead_source === SOURCE_OTHER? num_dead : undefined;
  const other_num_missing = num_missing_source === SOURCE_OTHER? num_missing : undefined;
  const other_num_affected = num_affected_source === SOURCE_OTHER? num_affected : undefined;
  const other_num_displaced = num_displaced_source === SOURCE_OTHER? num_displaced : undefined;

  return {
    status,
    is_covid_report,
    event,
    summary,
    countries: [country],
    districts,
    dtype,
    start_date: isDefined(start_date) ? (new Date(start_date)).toISOString() : start_date,
    request_assistance,
    ns_request_assistance,

    num_potentially_affected: rc_num_potentially_affected,
    num_highest_risk: rc_num_highest_risk,
    affected_pop_centres: rc_affected_pop_centres,
    num_injured: rc_num_injured,
    num_dead: rc_num_dead,
    num_missing: rc_num_missing,
    num_affected: rc_num_affected,
    num_displaced: rc_num_displaced,

    gov_num_potentially_affected,
    gov_num_highest_risk,
    gov_affected_pop_centres,
    gov_num_injured,
    gov_num_dead,
    gov_num_missing,
    gov_num_affected,
    gov_num_displaced,

    other_num_potentially_affected,
    other_num_highest_risk,
    other_affected_pop_centres,
    other_num_injured,
    other_num_dead,
    other_num_missing,
    other_num_affected,
    other_num_displaced,

    epi_cases,
    epi_suspected_cases,
    epi_probable_cases,
    epi_confirmed_cases,
    epi_num_dead,
    epi_figures_source,
    epi_notes_since_last_fr,
    epi_cases_since_last_fr,
    epi_deaths_since_last_fr,

    sit_fields_date: isDefined(sit_fields_date) ? (new Date(sit_fields_date)).toISOString() : sit_fields_date,
    other_sources,
    description,

    gov_num_assisted,
    num_assisted,
    num_localstaff,
    num_volunteers,
    num_expats_delegates,

    actions_taken,
    notes_health,
    notes_ns,
    notes_socioeco,

    bulletin,
    actions_others,
    external_partners,
    supported_activities,

    dref,
    dref_amount,
    appeal,
    appeal_amount,
    fact,
    num_fact,
    ifrc_staff,
    num_ifrc_staff,
    forecast_based_action,
    forecast_based_action_amount,

    contacts,
    visibility,
  };
}

export interface FieldReportAPIResponseFields extends Omit<FieldReportAPIFields, 'user' | 'dtype' | 'event' | 'countries' | 'districts' | 'actions_taken'> {
  id: number;
  user: {
    id: number;
  };
  dtype: {
    id: number;
  };
  event: {
    id: number;
    name: string;
  };
  countries: {
    id: number;
  }[];
  districts: {
    id: number;
  }[];
  actions_taken: {
    id: number;
    organization: OrganizationType;
    summary?: string;
    actions: ActionFields[];
  }[];
}

export function transformAPIFieldsToFormFields(apiValues: FieldReportAPIResponseFields): PartialForm<FormType> {
  const {
    /*
    id,
    user: {
        id: user,
    },
     */
    dtype: {
        id: dtype,
    },
    contacts,
    actions_taken,
    event: {
        id: event,
    },
    countries: {
        0: {
            id: country,
        }
    },
    districts,
    external_partners,
    supported_activities,
    is_covid_report,
    status,
    request_assistance,
    ns_request_assistance,
    num_injured: rc_num_injured,
    num_dead: rc_num_dead,
    num_missing: rc_num_missing,
    num_affected: rc_num_affected,
    num_displaced: rc_num_displaced,
    num_assisted,
    num_localstaff,
    num_volunteers,
    num_expats_delegates,
    num_potentially_affected: rc_num_potentially_affected,
    num_highest_risk: rc_num_highest_risk,
    affected_pop_centres: rc_affected_pop_centres,
    gov_num_injured,
    gov_num_dead,
    gov_num_missing,
    gov_num_affected,
    gov_num_displaced,
    gov_num_assisted,
    epi_cases,
    epi_suspected_cases,
    epi_probable_cases,
    epi_confirmed_cases,
    epi_num_dead,
    epi_figures_source,
    epi_cases_since_last_fr,
    epi_deaths_since_last_fr,
    epi_notes_since_last_fr,
    gov_num_potentially_affected,
    gov_num_highest_risk,
    gov_affected_pop_centres,
    other_num_injured,
    other_num_dead,
    other_num_missing,
    other_num_affected,
    other_num_displaced,
    other_num_potentially_affected,
    other_num_highest_risk,
    other_affected_pop_centres,
    sit_fields_date,
    visibility,
    bulletin,
    dref,
    dref_amount,
    appeal,
    appeal_amount,
    forecast_based_action,
    forecast_based_action_amount,
    fact,
    num_fact,
    ifrc_staff,
    num_ifrc_staff,
    notes_health,
    notes_ns,
    notes_socioeco,
    start_date,
    summary,
    other_sources,
    description,
    actions_others,
    /*
    sources,
    who_num_assisted,
    health_min_num_assisted,
    other_num_assisted,
    imminent_dref,
    imminent_dref_amount,
    rdrt,
    num_rdrt,
    eru_base_camp,
    eru_base_camp_units,
    eru_basic_health_care,
    eru_basic_health_care_units,
    eru_it_telecom,
    eru_it_telecom_units,
    eru_logistics,
    eru_logistics_units,
    eru_deployment_hospital,
    eru_deployment_hospital_units,
    eru_referral_hospital,
    eru_referral_hospital_units,
    eru_relief,
    eru_relief_units,
    eru_water_sanitation_15,
    eru_water_sanitation_15_units,
    eru_water_sanitation_40,
    eru_water_sanitation_40_units,
    eru_water_sanitation_20,
    eru_water_sanitation_20_units,
    report_date,
    created_at,
    updated_at,
    previous_update,
    regions,
     */
  } = apiValues;

  const getSourceAndValue: <T extends string | number>(
    rc?: T, gov?: T, other?: T,
  ) => [
    string | undefined,
    T | undefined,
  ] = (rc, gov, other) => {
    if (isDefined(rc)) {
      return [SOURCE_RC, rc];
    } else if (isDefined(gov)) {
      return [SOURCE_GOV, gov];
    } else if (isDefined(other)) {
      return [SOURCE_OTHER, other];
    }

    return [undefined, undefined];
  };

  const [
    num_potentially_affected_source,
    num_potentially_affected,
  ] = getSourceAndValue(
    rc_num_potentially_affected,
    gov_num_potentially_affected,
    other_num_potentially_affected,
  );

  const [
    num_highest_risk_source,
    num_highest_risk,
  ] = getSourceAndValue(
    rc_num_highest_risk,
    gov_num_highest_risk,
    other_num_highest_risk,
  );

  const [
    affected_pop_centres_source,
    affected_pop_centres,
  ] = getSourceAndValue(
    rc_affected_pop_centres,
    gov_affected_pop_centres,
    other_affected_pop_centres,
  );

  const [
    num_injured_source,
    num_injured,
  ] = getSourceAndValue(
    rc_num_injured,
    gov_num_injured,
    other_num_injured,
  );

  const [
    num_dead_source,
    num_dead,
  ] = getSourceAndValue(
    rc_num_dead,
    gov_num_dead,
    other_num_dead,
  );

  const [
    num_missing_source,
    num_missing,
  ] = getSourceAndValue(
    rc_num_missing,
    gov_num_missing,
    other_num_missing,
  );

  const [
    num_affected_source,
    num_affected,
  ] = getSourceAndValue(
    rc_num_affected,
    gov_num_affected,
    other_num_affected,
  );
  const [
    num_displaced_source,
    num_displaced,
  ] = getSourceAndValue(
    rc_num_displaced,
    gov_num_displaced,
    other_num_displaced,
  );

  let actions_ntls;
  let actions_ntls_desc;
  let actions_fdrn;
  let actions_fdrn_desc;
  let actions_pns;
  let actions_pns_desc;

  actions_taken.forEach((action) => {
    switch(action.organization) {
      case 'NTLS':
        actions_ntls = action.actions.map(d => d.id);
        actions_ntls_desc = action.summary;
        break;
      case 'FDRN':
        actions_fdrn = action.actions.map(d => d.id);
        actions_fdrn_desc = action.summary;
        break;
      case 'PNS':
        actions_pns = action.actions.map(d => d.id);
        actions_pns_desc = action.summary;
        break;
      default:
          break;
    }
  });

  let contact_originator_name;
  let contact_originator_title;
  let contact_originator_email;
  let contact_originator_phone;
  let contact_nat_soc_name;
  let contact_nat_soc_title;
  let contact_nat_soc_email;
  let contact_nat_soc_phone;
  let contact_federation_name;
  let contact_federation_title;
  let contact_federation_email;
  let contact_federation_phone;
  let contact_media_name;
  let contact_media_title;
  let contact_media_email;
  let contact_media_phone;

  contacts.forEach((contact) => {
    switch(contact.ctype) {
      case 'Originator':
        contact_originator_name = contact.name;
        contact_originator_title = contact.title;
        contact_originator_email = contact.email;
        contact_originator_phone = contact.phone;
        break;
      case 'NationalSociety':
        contact_nat_soc_name = contact.name;
        contact_nat_soc_title = contact.title;
        contact_nat_soc_email = contact.email;
        contact_nat_soc_phone = contact.phone;
        break;
      case 'Federation':
        contact_federation_name = contact.name;
        contact_federation_title = contact.title;
        contact_federation_email = contact.email;
        contact_federation_phone = contact.phone;
        break;
      case 'Media':
        contact_media_name = contact.name;
        contact_media_title = contact.title;
        contact_media_email = contact.email;
        contact_media_phone = contact.phone;
        break;
    }
  });


  return {
    start_date: isDefined(start_date) ? start_date.split('T')[0] : start_date,
    summary,
    other_sources,
    dtype,
    event,
    country,
    districts: districts?.map(d => d.id) ?? [],
    external_partners,
    is_covid_report,
    supported_activities,
    status,
    request_assistance,
    ns_request_assistance,

    num_assisted,
    num_localstaff,
    num_volunteers,
    num_expats_delegates,
    description,

    num_potentially_affected,
    num_highest_risk,
    affected_pop_centres,
    num_injured,
    num_dead,
    num_missing,
    num_affected,
    num_displaced,

    num_potentially_affected_source,
    affected_pop_centres_source,
    num_highest_risk_source,
    num_injured_source,
    num_dead_source,
    num_missing_source,
    num_affected_source,
    num_displaced_source,

    gov_num_assisted,
    epi_cases,
    epi_suspected_cases,
    epi_probable_cases,
    epi_confirmed_cases,
    epi_num_dead,
    epi_figures_source,
    epi_cases_since_last_fr,
    epi_deaths_since_last_fr,
    epi_notes_since_last_fr,

    actions_ntls,
    actions_ntls_desc,
    actions_fdrn,
    actions_fdrn_desc,
    actions_pns,
    actions_pns_desc,
    bulletin,
    actions_others,

    notes_health,
    notes_ns,
    notes_socioeco,

    contact_originator_name,
    contact_originator_title,
    contact_originator_email,
    contact_originator_phone,
    contact_nat_soc_name,
    contact_nat_soc_title,
    contact_nat_soc_email,
    contact_nat_soc_phone,
    contact_federation_name,
    contact_federation_title,
    contact_federation_email,
    contact_federation_phone,
    contact_media_name,
    contact_media_title,
    contact_media_email,
    contact_media_phone,

    sit_fields_date: isDefined(sit_fields_date) ? sit_fields_date.split('T')[0] : sit_fields_date,
    visibility,
    dref,
    dref_amount,
    appeal,
    appeal_amount,
    forecast_based_action,
    forecast_based_action_amount,
    fact,
    num_fact,
    ifrc_staff,
    num_ifrc_staff,
  };
}
