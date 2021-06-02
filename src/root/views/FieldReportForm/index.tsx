import React from 'react';
import type { History, Location } from 'history';
import type { match as Match } from 'react-router-dom';

import BlockLoading from '#components/block-loading';
import { showAlert } from '#components/system-alerts';
import Page from '#components/Page';
import {
  useForm,
  PartialForm,
} from '@togglecorp/toggle-form';
import {
  _cs,
  isDefined,
} from '@togglecorp/fujs';

import BreadCrumb from '#components/breadcrumb';
import NonFieldError from '#components/NonFieldError';
import Container from '#components/Container';
import Tabs from '#components/Tabs';
import TabPanel from '#components/Tabs/TabPanel';
import TabList from '#components/Tabs/TabList';
import Tab from '#components/Tabs/Tab';

import {
} from '#utils/field-report-constants';

import LanguageContext from '#root/languageContext';
import {
  useRequest,
  useLazyRequest,
} from '#utils/restRequest';

import ContextFields from './ContextFields';
import SituationFields from './SituationFields';
import RiskAnalysisFields from './RiskAnalysisFields';
import ActionsFields from './ActionsFields';
import EarlyActionsFields from './EarlyActionsFields';
import ResponseFields from './ResponseFields';

import useFieldReportOptions, { schema } from './useFieldReportOptions';
import {
  STATUS_EVENT,
  STATUS_EARLY_WARNING,
  DISASTER_TYPE_EPIDEMIC,
  VISIBILITY_PUBLIC,
  BULLETIN_PUBLISHED_NO,
  FormType,
  transformFormFieldsToAPIFields,
  FieldReportAPIFields,
  transformAPIFieldsToFormFields,
  FieldReportAPIResponseFields,
  getDefinedValues,
  Option,
} from './common';
import styles from './styles.module.scss';

const defaultFormValues: PartialForm<FormType> = {
  status: STATUS_EVENT,
  is_covid_report: false,
  visibility: VISIBILITY_PUBLIC,
  bulletin: BULLETIN_PUBLISHED_NO,
};

function scrollToTop () {
  window.setTimeout(() => {
    window.scrollTo({
      top: Math.min(145, window.scrollY),
      left: 0,
      behavior: 'smooth',
    });
  }, 0);
}

interface Props {
  className?: string;
  match: Match<{ reportId?: string }>;
  history: History;
  location: Location;
}

function NewFieldReportForm(props: Props) {
  const {
    className,
    location,
    history,
    match,
  } = props;

  const { reportId } = match.params;
  const { strings } = React.useContext(LanguageContext);
  const [initialEventOptions, setInitialEventOptions] = React.useState<Option[]>([]);

  const {
    pending: fieldReportPending,
    response: fieldReportResponse,
  } = useRequest<FieldReportAPIResponseFields>({
    skip: !reportId,
    url: `api/v2/field_report/${reportId}/`,
  });

  const crumbs = React.useMemo(() => [
    // FIXME: use translations
    {link: location?.pathname, name: isDefined(reportId) ? 'Edit Field Report' : strings.breadCrumbNewFieldReport},
    {link: '/', name: strings.breadCrumbHome},
  ], [strings.breadCrumbHome, strings.breadCrumbNewFieldReport, location, reportId]);

  const {
    value,
    error,
    onValueChange,
    validate,
    onErrorSet,
    onValueSet,
  } = useForm(defaultFormValues, schema);

   React.useEffect(() => {
    if (fieldReportResponse) {
      const formValue = transformAPIFieldsToFormFields(fieldReportResponse);
      onValueSet(formValue);
      setInitialEventOptions([{
        value: fieldReportResponse.event.id,
        label: fieldReportResponse.event.name,
      }]);
      // fieldReportResponse.event.
    }
  }, [fieldReportResponse, onValueSet, setInitialEventOptions]);

  const {
    pending: fieldReportSubmitPending,
    trigger: submitRequest,
  } = useLazyRequest<FieldReportAPIResponseFields, Partial<FieldReportAPIFields>>({
    url: reportId ? `api/v2/update_field_report/${reportId}/` : 'api/v2/create_field_report/',
    method: reportId ? 'PUT' : 'POST',
    body: ctx => ctx,
    onSuccess: (response) => {
      showAlert('success', (
        <p>
          {strings.fieldReportFormRedirectMessage}
        </p>
      ), true, 3000);
      window.setTimeout(
        () => history.push(`/reports/${response?.id}`),
        250,
      );
    },
    onFailure: ({ value: { messageForNotification, errors }}) => {
      console.error(errors);
      showAlert('danger', (
        <p>
          <strong>
            {strings.fieldReportFormErrorLabel}
          </strong>
          &nbsp;
          {messageForNotification}
        </p>
      ), true, 4500);
    },
  });

  const {
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
  } = useFieldReportOptions(value);

  React.useEffect(() => {
    if (value.status === STATUS_EARLY_WARNING) {
      onValueChange(false, 'is_covid_report');

      if (value.dtype === DISASTER_TYPE_EPIDEMIC) {
        onValueChange(undefined, 'dtype');
      }
    }
  }, [value.status, onValueChange, value.dtype]);

  React.useEffect(() => {
    if (value.is_covid_report) {
      onValueChange(DISASTER_TYPE_EPIDEMIC, 'dtype');
    }
  }, [value.is_covid_report, onValueChange]);

  const pending = fetchingUserDetails
    || fetchingActions
    || fieldReportPending
    || fieldReportSubmitPending;

  type StepTypes = 'step1' | 'step2' | 'step3' | 'step4';
  const [currentStep, setCurrentStep] = React.useState<StepTypes>('step1');
  const submitButtonLabel = currentStep === 'step4' ? 'Submit' : 'Continue';
  const submitButtonClassName = currentStep === 'step4' ? 'button--primary-filled' : 'button--secondary-filled';
  const shouldDisabledBackButton = currentStep === 'step1';

  const handleTabChange = React.useCallback((newStep: StepTypes) => {
    scrollToTop();

    const {
      errored,
      error,
    } = validate();

    onErrorSet(error);

    if (!errored) {
      setCurrentStep(newStep);
    }
  }, [setCurrentStep, validate, onErrorSet]);

  const handleSubmitButtonClick = React.useCallback(() => {
    scrollToTop();
    const {
      errored,
      error,
      value: finalValues,
    } = validate();

    onErrorSet(error);

    if (errored) {
      return;
    }

    if (currentStep === 'step4') {
      const apiFields = transformFormFieldsToAPIFields(finalValues as FormType);
      const definedValues = getDefinedValues(apiFields);

      if (userDetails && userDetails.id) {
        const body = {
          user: userDetails.id,
          ...definedValues
        };

        submitRequest(body);
      }
    } else {
      const nextStepMap: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        [key in Exclude<StepTypes, 'step4'>]: Exclude<StepTypes, 'step1'>;
      } = {
        step1: 'step2',
        step2: 'step3',
        step3: 'step4',
      };

      setCurrentStep(nextStepMap[currentStep]);
    }
  }, [submitRequest, userDetails, currentStep, setCurrentStep, validate, onErrorSet]);

  const handleBackButtonClick = React.useCallback(() => {
    scrollToTop();
    const {
      errored,
      error,
    } = validate();

    onErrorSet(error);

    if (!errored && currentStep !== 'step1') {
      const prevStepMap: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        [key in Exclude<StepTypes, 'step1'>]: Exclude<StepTypes, 'step4'>;
      } = {
        step2: 'step1',
        step3: 'step2',
        step4: 'step3',
      };
      setCurrentStep(prevStepMap[currentStep]);
    }
  }, [validate, setCurrentStep, currentStep, onErrorSet]);

  return (
    <Tabs
      disabled={pending}
      onChange={handleTabChange}
      value={currentStep}
      variant="step"
    >
      <Page
        className={_cs(styles.newFieldReportForm, className)}
        title={isDefined(reportId) ? 'IFRC Go - Update Field Report' : strings.fieldReportFormPageTitle}
        heading={isDefined(reportId) ? 'Update Field Report' : strings.fieldReportCreate}
        breadCrumbs={<BreadCrumb crumbs={crumbs} compact />}
        info={(
          <TabList className={styles.tabList}>
            <Tab
              name="step1"
              step={1}
            >
              Context
            </Tab>
            <Tab
              name="step2"
              step={2}
            >
              { value.status === STATUS_EARLY_WARNING && 'Risk Analysis' }
              { value.status === STATUS_EVENT && 'Situation' }
            </Tab>
            <Tab
              name="step3"
              step={3}
            >
              { value.status === STATUS_EARLY_WARNING && 'Early Action' }
              { value.status === STATUS_EVENT && 'Action' }
            </Tab>
            <Tab
              name="step4"
              step={4}
            >
              Response
            </Tab>
          </TabList>
        )}
      >
        {pending ? (
          <Container>
            <BlockLoading />
          </Container>
        ) : (
          <>
            <Container>
              <NonFieldError
                error={error}
                message="Please fill in required fields first!"
              />
            </Container>
            <TabPanel name="step1">
              <ContextFields
                error={error}
                onValueChange={onValueChange}
                statusOptions={statusOptions}
                value={value}
                yesNoOptions={yesNoOptions}
                disasterTypeOptions={disasterTypeOptions}
                reportType={reportType}
                countryOptions={countryOptions}
                districtOptions={districtOptions}
                fetchingCountries={fetchingCountries}
                fetchingDistricts={fetchingDistricts}
                fetchingDisasterTypes={fetchingDisasterTypes}
                initialEventOptions={initialEventOptions}
              />
            </TabPanel>
            <TabPanel name="step2">
              {value.status === STATUS_EARLY_WARNING && (
                <RiskAnalysisFields
                  sourceOptions={sourceOptions}
                  error={error}
                  onValueChange={onValueChange}
                  value={value}
                />
              )}
              {value.status === STATUS_EVENT && (
                <SituationFields
                  sourceOptions={sourceOptions}
                  reportType={reportType}
                  error={error}
                  onValueChange={onValueChange}
                  value={value}
                />
              )}
            </TabPanel>
            <TabPanel name="step3">
              {value.status === STATUS_EARLY_WARNING && (
                <EarlyActionsFields
                  bulletinOptions={bulletinOptions}
                  actionOptions={orgGroupedActionForCurrentReport}
                  error={error}
                  onValueChange={onValueChange}
                  value={value}
                />
              )}
              {value.status === STATUS_EVENT && (
                <ActionsFields
                  bulletinOptions={bulletinOptions}
                  actionOptions={orgGroupedActionForCurrentReport}
                  reportType={reportType}
                  error={error}
                  onValueChange={onValueChange}
                  value={value}
                  externalPartnerOptions={externalPartnerOptions}
                  supportedActivityOptions={supportedActivityOptions}
                  fetchingExternalPartners={fetchingExternalPartners}
                  fetchingSupportedActivities={fetchingSupportedActivities}
                />
              )}
            </TabPanel>
            <TabPanel name="step4">
              <ResponseFields
                reportType={reportType}
                error={error}
                onValueChange={onValueChange}
                value={value}
              />
            </TabPanel>
            <div className={styles.actions}>
              <button
                className={_cs('button button--secondary-bounded', shouldDisabledBackButton && 'disabled')}
                type="button"
                disabled={shouldDisabledBackButton}
                onClick={handleBackButtonClick}
              >
                Back
              </button>
              <button
                className={_cs('button', submitButtonClassName)}
                onClick={handleSubmitButtonClick}
                type="submit"
              >
                {submitButtonLabel}
              </button>
            </div>
          </>
        )}
      </Page>
    </Tabs>
  );
}

export default NewFieldReportForm;
