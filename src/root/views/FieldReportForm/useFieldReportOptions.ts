import React from 'react';
import {
  isDefined,
} from '@togglecorp/fujs';
import {
  PartialForm,
  ObjectSchema,
} from '@togglecorp/toggle-form';

import { compareString } from '#utils/utils';
import LanguageContext from '#root/languageContext';
import { useRequest } from '#utils/restRequest';

import {
  requiredCondition,
  positiveIntegerCondition,
} from '#utils/form';

import {
  BooleanValueOption,
  NumericValueOption,
  StringValueOption,
  ReportType,
  emptyNumericOptionList,
  emptyActionList,
  FormType,
  ListResponse,
  Country,
  Entity,
  ActionFields,
  ActionByReportType,
  ActionsByOrganization,
  OrganizationType,
  STATUS_EARLY_WARNING,
  STATUS_EVENT,
  DISASTER_TYPE_EPIDEMIC,
  BULLETIN_PUBLISHED_NO,
  BULLETIN_PUBLISHED_PLANNED,
  BULLETIN_PUBLISHED_YES,
  SOURCE_RC,
  SOURCE_GOV,
  SOURCE_OTHER,
  User,
} from './common';

type FormSchema = ObjectSchema<PartialForm<FormType>>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const titleCondition = (
  value: number | string | null | undefined,
  allValue: PartialForm<FormType>
) => {
  if (!isDefined(value) && !isDefined(allValue.event)) {
    return 'Title is required if not linked to an existing emergency';
  }

  return undefined;
};

const getRequiredWithCondition = (key: keyof FormType) => (
  value: number | string | null | undefined,
  allValue: PartialForm<FormType>
) => {
  if (!isDefined(value) && isDefined(allValue?.[key])) {
    return 'This field is required';
  }

  return undefined;
};

const getRequiredWithNonEmptyCondition = (key: keyof FormType) => (
  value: number | string | null | undefined,
  allValue: PartialForm<FormType>
) => {
  if (!value && allValue?.[key]) {
    return 'This field is required';
  }

  return undefined;
};

const validStatusCondition = (value: number | string | null | undefined) => {
  if (value === STATUS_EARLY_WARNING || value === STATUS_EVENT) {
    return undefined;
  }

  return 'Status should either be an Event or an Early Warning / Early Action';
};

export const schema: FormSchema = {
  fields: (value): FormSchemaFields => ({
    status: [requiredCondition, validStatusCondition],
    is_covid_report: [requiredCondition],
    dtype: [requiredCondition],
    event: [],
    summary: [titleCondition],
    country: [requiredCondition],
    districts: [],
    start_date: [requiredCondition],
    request_assistance: [],
    ns_request_assistance: [],

    epi_cases: [positiveIntegerCondition],
    epi_suspected_cases: [positiveIntegerCondition],
    epi_probable_cases: [positiveIntegerCondition],
    epi_confirmed_cases: [positiveIntegerCondition],
    epi_num_dead: [positiveIntegerCondition],

    epi_cases_since_last_fr: [positiveIntegerCondition],
    epi_deaths_since_last_fr: [positiveIntegerCondition],

    epi_figures_source: [],
    epi_notes_since_last_fr: [],
    sit_fields_date: [],
    other_sources: [],
    description: [],

    num_injured: [getRequiredWithCondition('num_injured_source'), positiveIntegerCondition],
    num_dead: [getRequiredWithCondition('num_dead_source'), positiveIntegerCondition],
    num_missing: [getRequiredWithCondition('num_missing_source'), positiveIntegerCondition],
    num_affected: [getRequiredWithCondition('num_affected_source'), positiveIntegerCondition],
    num_displaced: [getRequiredWithCondition('num_displaced_source'), positiveIntegerCondition],

    num_injured_source: [getRequiredWithCondition('num_injured')],
    num_dead_source: [getRequiredWithCondition('num_dead')],
    num_missing_source: [getRequiredWithCondition('num_missing')],
    num_affected_source: [getRequiredWithCondition('num_affected')],
    num_displaced_source: [getRequiredWithCondition('num_displaced')],

    num_potentially_affected: [getRequiredWithCondition('num_potentially_affected_source'), positiveIntegerCondition],
    num_highest_risk: [getRequiredWithCondition('num_highest_risk_source'), positiveIntegerCondition],
    affected_pop_centres: [getRequiredWithCondition('affected_pop_centres_source')],
    num_potentially_affected_source: [getRequiredWithCondition('num_potentially_affected')],
    num_highest_risk_source: [getRequiredWithCondition('num_highest_risk')],
    affected_pop_centres_source: [getRequiredWithCondition('affected_pop_centres')],

    gov_num_assisted: [positiveIntegerCondition],
    num_assisted: [positiveIntegerCondition],
    num_localstaff: [positiveIntegerCondition],
    num_volunteers: [positiveIntegerCondition],
    num_expats_delegates: [positiveIntegerCondition],

    actions_ntls: [],
    actions_ntls_desc: [],
    actions_fdrn: [],
    actions_fdrn_desc: [],
    actions_pns: [],
    actions_pns_desc: [],
    bulletin: [],
    actions_others: [],

    notes_health: [],
    notes_ns: [],
    notes_socioeco: [],
    external_partners: [],
    supported_activities: [],

    dref: [getRequiredWithNonEmptyCondition('dref_amount')],
    dref_amount: [getRequiredWithNonEmptyCondition('dref'), positiveIntegerCondition],
    appeal: [getRequiredWithNonEmptyCondition('appeal_amount')],
    appeal_amount: [getRequiredWithNonEmptyCondition('appeal'), positiveIntegerCondition],
    fact: [getRequiredWithNonEmptyCondition('num_fact')],
    num_fact: [getRequiredWithNonEmptyCondition('fact'), positiveIntegerCondition],
    ifrc_staff: [getRequiredWithNonEmptyCondition('num_ifrc_staff')],
    num_ifrc_staff: [getRequiredWithNonEmptyCondition('ifrc_staff'), positiveIntegerCondition],
    forecast_based_action: [getRequiredWithNonEmptyCondition('forecast_based_action_amount')],
    forecast_based_action_amount: [getRequiredWithNonEmptyCondition('forecast_based_action'), positiveIntegerCondition],

    contact_originator_name: [],
    contact_originator_title: [],
    contact_originator_email: [],
    contact_originator_phone: [],
    contact_nat_soc_name: [],
    contact_nat_soc_title: [],
    contact_nat_soc_email: [],
    contact_nat_soc_phone: [],
    contact_federation_name: [],
    contact_federation_title: [],
    contact_federation_email: [],
    contact_federation_phone: [],
    contact_media_name: [],
    contact_media_title: [],
    contact_media_email: [],
    contact_media_phone: [],
    visibility: [requiredCondition],
  }),

  fieldDependencies: () => ({
    summary: ['event'],
    num_injured: ['num_injured_source'],
    num_injured_source: ['num_injured'],
    num_dead: ['num_dead_source'],
    num_dead_source: ['num_dead'],
    num_missing: ['num_missing_source'],
    num_missing_source: ['num_missing'],
    num_affected: ['num_affected_source'],
    num_affected_source: ['num_affected'],
    num_displaced: ['num_displaced_source'],
    num_displaced_source: ['num_displaced'],
    dref: ['dref_amount'],
    dref_amount: ['dref'],
    appeal: ['appeal_amount'],
    appeal_amount: ['appeal'],
    fact: ['num_fact'],
    num_fact: ['fact'],
    ifrc_staff: ['num_ifrc_staff'],
    num_ifrc_staff: ['ifrc_staff'],
    forecast_based_action: ['forecast_based_action_amount'],
    forecast_based_action_amount: ['forecast_based_action'],

    num_potentially_affected: ['num_potentially_affected_source'],
    num_highest_risk: ['num_highest_risk_source'],
    affected_pop_centres: ['affected_pop_centres_source'],
    num_potentially_affected_source: ['num_potentially_affected'],
    num_highest_risk_source: ['num_highest_risk'],
    affected_pop_centres_source: ['affected_pop_centres'],
  }),

  validation: (value) => {
    if (value.status === STATUS_EARLY_WARNING
        && value.dtype === DISASTER_TYPE_EPIDEMIC) {
      return 'Early Warning / Early action cannot be selected when disaster type is Epidemic or vice-versa';
    }

    return undefined;
  },
};

const limitQuery = {
  limit: 500,
};

function useFieldReportOptions(value: Partial<FormType>) {
  const { strings } = React.useContext(LanguageContext);

  const {
    pending: fetchingUserDetails,
    response: userDetails,
  } = useRequest<User>({
    url: 'api/v2/user/me/',
  });

  const {
    pending: fetchingCountries,
    response: countriesResponse,
  } = useRequest<ListResponse<Country>>({
    url: 'api/v2/country/',
    query: limitQuery,
  });

  const countryOptions = React.useMemo(() => (
    countriesResponse?.results?.filter(
      c => c.independent && c.record_type === 1
    ).map((c) => ({
      value: c.id,
      label: c.name,
    })) ?? emptyNumericOptionList
  ), [countriesResponse]);

  const countryQuery = React.useMemo(() => ({
    country: value.country,
    limit: 500,
  }), [value.country]);

  const {
    pending: fetchingDistricts,
    response: districtsResponse,
  } = useRequest<ListResponse<Entity>>({
    skip: !value.country,
    url: 'api/v2/district/',
    query: countryQuery,
  });

  const districtOptions = React.useMemo(() => (
    districtsResponse?.results?.map(d => ({
      value: d.id,
      label: d.name,
    })).sort(compareString) ?? emptyNumericOptionList
  ), [districtsResponse]);

  const {
    pending: fetchingDisasterTypes,
    response: disasterTypesResponse,
  } = useRequest<ListResponse<Entity>>({
    url: 'api/v2/disaster_type/',
  });

  const disasterTypeOptions = React.useMemo(() => (
    disasterTypesResponse?.results?.map((d) => ({
      value: d.id,
      label: d.name,
    })) ?? emptyNumericOptionList
  ), [disasterTypesResponse]);

  const reportType: ReportType = React.useMemo(() => {
    if (value.status === STATUS_EARLY_WARNING) {
      return 'EW';
    }

    if (value.is_covid_report) {
      return 'COVID';
    }

    if (value.dtype === DISASTER_TYPE_EPIDEMIC) {
      return 'EPI';
    }

    return 'EVT';
  }, [value.status, value.dtype, value.is_covid_report]);

  const {
    pending: fetchingSupportedActivities,
    response: supportedActivitiesResponse,
  } = useRequest<ListResponse<Entity>>({
    url: 'api/v2/supported_activity/',
    query: limitQuery,
  });

  const supportedActivityOptions = React.useMemo(() => (
    supportedActivitiesResponse?.results?.map((d) => ({
      value: d.id,
      label: d.name,
    })) ?? emptyNumericOptionList
  ), [supportedActivitiesResponse]);

  const {
    pending: fetchingExternalPartners,
    response: externalPartnersResponse,
  } = useRequest<ListResponse<Entity>>({
    url: 'api/v2/external_partner/',
    query: limitQuery,
  });

  const externalPartnerOptions = React.useMemo(() => (
    externalPartnersResponse?.results?.map((d) => ({
      value: d.id,
      label: d.name,
    })) ?? emptyNumericOptionList
  ), [externalPartnersResponse]);

  const {
    pending: fetchingActions,
    response: actionsResponse,
  } = useRequest<ListResponse<ActionFields>>({
    url: 'api/v2/action/',
    query: limitQuery,
  });


  const actionOptionsMap: ActionByReportType = React.useMemo(() => {
    if (!actionsResponse?.results?.length) {
      return {
        EVT: emptyActionList,
        EPI: emptyActionList,
        COVID: emptyActionList,
        EW: emptyActionList,
      } as ActionByReportType;
    }

    const actionList = actionsResponse.results;
    const getFilter = (reportType: string) => (a: ActionFields) => (
      a.field_report_types.findIndex(
        (frt: string) => frt === reportType
      ) !== -1
    );

    const actionMap = {
      EW: actionList.filter(getFilter('EW')),
      EPI: actionList.filter(getFilter('EPI')),
      COVID: actionList.filter(getFilter('COVID')),
      EVT: actionList.filter(getFilter('EVT')),
    };

    return actionMap;
  }, [actionsResponse]);

  const orgGroupedActionForCurrentReport = React.useMemo(() => {
    const options = actionOptionsMap[reportType];

    return options.reduce((acc, val) => {
      const newAcc = {...acc} as ActionsByOrganization;
      (Object.keys(newAcc) as OrganizationType[]).forEach((org) => {
        if (val.organizations.findIndex((o) => o === org) !== -1) {
          newAcc[org].push({
            value: val.id,
            label: val.name,
            description: val.tooltip_text ?? undefined,
            category: val.category,
            organization: org,
          });
        }
      });
      return newAcc;
    }, {
      NTLS: [],
      PNS: [],
      FDRN: [],
    } as ActionsByOrganization);
  }, [actionOptionsMap, reportType]);

  const statusOptions: NumericValueOption[] = React.useMemo(() => ([
    {
      value: STATUS_EARLY_WARNING,
      label: strings.fieldReportConstantStatusEarlyWarningLabel,
      description: strings.fieldReportConstantStatusEarlyWarningDescription,
    },
    {
      value: STATUS_EVENT,
      label: strings.fieldReportConstantStatusEventLabel,
      description: strings.fieldReportConstantStatusEventDescription,
    },
  ]), [strings]);

  const yesNoOptions = React.useMemo(() => {
    return [
      { value: true, label: strings.fieldReportFormOptionYesLabel },
      { value: false, label: strings.fieldReportFormOptionNoLabel },
    ] as BooleanValueOption[];
  }, [strings]);

  const bulletinOptions: NumericValueOption[] = React.useMemo(() => [
    { label: strings.fieldReportFormOptionNoLabel, value: BULLETIN_PUBLISHED_NO },
    { label: strings.fieldReportFormOptionPlannedLabel, value: BULLETIN_PUBLISHED_PLANNED },
    { label: strings.fieldReportFormOptionPublishedLabel, value: BULLETIN_PUBLISHED_YES },
  ], [strings]);

  const sourceOptions: StringValueOption[] = React.useMemo(() => ([
    {label: strings.fieldsStep2OrganizationsEVTEWLabelRC, value: SOURCE_RC},
    {label: strings.fieldsStep2OrganizationsEVTEWLabelGovernment, value: SOURCE_GOV},
    {label: strings.fieldsStep2OrganizationsLabelOther, value: SOURCE_OTHER},
  ]), [strings]);

  return {
    bulletinOptions,
    countryOptions,
    disasterTypeOptions,
    districtOptions,
    externalPartnerOptions,
    fetchingActions,
    fetchingCountries,
    fetchingDisasterTypes,
    fetchingDistricts,
    fetchingExternalPartners,
    fetchingSupportedActivities,
    fetchingUserDetails,
    orgGroupedActionForCurrentReport,
    reportType,
    sourceOptions,
    statusOptions,
    supportedActivityOptions,
    userDetails,
    yesNoOptions,
  };
}

export default useFieldReportOptions;
