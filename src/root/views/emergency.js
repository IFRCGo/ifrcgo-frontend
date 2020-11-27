import * as url from 'url';
import React from 'react';
import { connect } from 'react-redux';
import memoize from 'memoize-one';
import { Link, withRouter } from 'react-router-dom';
import { PropTypes as T } from 'prop-types';
import _toNumber from 'lodash.tonumber';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import { Helmet } from 'react-helmet';

import { api, environment } from '#config';
import NewGlobalLoading from '#components/NewGlobalLoading';
import Translate from '#components/Translate';
import BreadCrumb from '#components/breadcrumb';
import { withLanguage } from '#root/languageContext';
import { resolveToString } from '#utils/lang';
import {
  getEventById,
  getEventSnippets,
  getSitrepsByEventId,
  getSitrepTypes,
  getAppealDocsByAppealIds,
  addSubscriptions,
  delSubscription,
  getUserProfile
} from '#actions';
import {
  commaSeparatedNumber as n,
  separateUppercaseWords as separate,
  nope,
  isoDate,
  timestamp,
  noSummary
} from '#utils/format';
import {
  get,
  mostRecentReport,
  getRecordsByType
} from '#utils/utils';

import App from '#views/app';
import Fold from '#components/fold';
import TabContent from '#components/tab-content';
import ErrorPanel from '#components/error-panel';
import Expandable from '#components/expandable';
import Snippets from '#components/emergencies/snippets';
import SurgeAlertsTable from '#components/connected/alerts-table';
import PersonnelTable from '#components/connected/personnel-table';
import EruTable from '#components/connected/eru-table';
import EmergencyMap from '#components/map/emergency-map';
import { epiSources } from '#utils/field-report-constants';
import ProjectFormModal from '#views/ThreeW/project-form-modal';
import { countriesGeojsonSelector, regionsByIdSelector } from '../selectors';

class Emergency extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      showProjectForm: false,
      selectedAppeal: null,
      sitrepFilters: {
        date: 'all',
        type: 'all',
      },
      subscribed: false,
      tabs: [{ title: 'Emergency Details', hash: '#details' }, { title: 'Reports/Documents', hash: '#reports' }, { title: 'Rapid Response', hash: '#rapid-response' }],
    };
    this.addSubscription = this.addSubscription.bind(this);
    this.delSubscription = this.delSubscription.bind(this);
    this.isSubscribed = this.isSubscribed.bind(this);
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps (nextProps) {
    if (this.props.location.hash !== nextProps.location.hash) {
      const top =
        window.pageYOffset !== undefined
          ? window.pageYOffset
          : window.scrollTop;
      window.scrollTo(0, top - 90);
    }

    if (this.props.match.params.id !== nextProps.match.params.id) {
      return this.getEvent(nextProps.match.params.id);
    }

    if (this.props.event.fetching && !nextProps.event.fetching) {
      // Redirect if it's a merged Emergency
      if (
        nextProps.event.fetched &&
        nextProps.event.data &&
        nextProps.event.data.parent_event
      ) {
        this.props.history.push(
          `/emergencies/${nextProps.event.data.parent_event}#details`
        );
      }

      this.getAppealDocuments(nextProps.event);

      // setup tabs
      const { data } = nextProps.event;
      // check if there are additional tabs
      let tabs = [...this.state.tabs];
      const tabLabels = ['tab_one_title', 'tab_two_title', 'tab_three_title'];
      tabLabels.forEach((key) => {
        if (data && data[key]) {
          const title = data[key];
          const hash = `#${title.toLowerCase().split(' ').join('-')}`;
          tabs.push({
            title: title,
            hash: hash,
          });
        }
      });
      this.setState({ tabs: tabs });
      setTimeout(() => {
        this.displayTabContent();
      }, 0);
    }

    if (!this.props.profile.fetched && nextProps.profile.fetched) {
      this.setState({ subscribed: this.isSubscribed(nextProps) });
    }

    const newProjectAdded =
      this.props.projectForm.fetching === true &&
      nextProps.projectForm.fetching === false &&
      nextProps.projectForm.error === null;

    if (newProjectAdded) {
      this.setState({ showProjectForm: false });
    }
  }

  componentDidMount () {
    this.getEvent(this.props.match.params.id);
    this.props._getSitrepTypes();
    if (this.props.isLogged) {
      this.props._getUserProfile(this.props.user.data.username);
    }

    // FIXME - we might need a different strategy for this
    // this.displayTabContent();
  }

  // Sets default tab if url param is blank or incorrect
  displayTabContent () {
    const tabHashArray = this.state.tabs.map(({ hash }) => hash);
    if (!tabHashArray.find((hash) => hash === this.props.location.hash)) {
      this.props.history.replace(
        `${this.props.location.pathname}${tabHashArray[0]}`
      );
    }
  }

  getEvent (id) {
    // showGlobalLoading();
    this.props._getEventById(id);
    this.props._getSitrepsByEventId(id);
  }

  getAppealDocuments (event) {
    const appealIds = get(event, 'data.appeals', []).map((o) => o.id);
    if (appealIds.length) {
      this.props._getAppealDocsByAppealIds(appealIds, event.data.id);
    }
  }

  onAppealClick (id, e) {
    e.preventDefault();
    this.setState({ selectedAppeal: id });
  }

  isSubscribed (nextProps) {
    if (nextProps.profile.fetched && !nextProps.profile.error) {
      const filtered = nextProps.profile.data.subscription.filter(
        (subscription) =>
          subscription.event === parseInt(this.props.match.params.id)
      );
      if (filtered.length > 0) {
        return true;
      }
    }
    return false;
  }

  renderFieldReportStatsEW (report) {
    const numPotentiallyAffected =
      parseInt(get(report, 'num_potentially_affected')) ||
      parseInt(get(report, 'gov_num_potentially_affected')) ||
      parseInt(get(report, 'other_num_potentially_affected'));
    const numHighestRisk =
      parseInt(get(report, 'num_highest_risk')) ||
      parseInt(get(report, 'gov_num_highest_risk')) ||
      parseInt(get(report, 'other_num_highest_risk'));
    const affectedPopCentres =
      get(report, 'affected_pop_centres') ||
      get(report, 'gov_affected_pop_centres') ||
      get(report, 'other_affected_pop_centres');
    return (
      <div className='col-lg flex spacing-4-t'>
        <div className='box__global emergency__affected__figures'>
          <h3 className='heading__title heading__title--emergency'>
            <Translate stringId="emergencyTopOverviewSectionTitle" />
          </h3>
          <div>
            <ul className='list-reset'>
              <li className='row flex spacing-half-v'>
                <div className='col'>
                  <Translate stringId="emergencyPotentiallyAffectedLabel" />
                </div>
                <div className='col margin-left-auto'>
                  <span className="base-font-semi-bold">
                    {n(numPotentiallyAffected)}
                  </span>
                </div>
              </li>
              <li className='row flex spacing-half-v'>
                <div className='col'>
                  <Translate stringId="emergencyHighestRiskLabel" />
                </div>
                <div className='col margin-left-auto'>
                  <span className="base-font-semi-bold">{n(numHighestRisk)}</span>
                </div>
              </li>
              <li className='row flex spacing-half-v'>
                <div className='col'>
                  <Translate stringId="emergencyAffectedPopulationCentresLabel" />
                </div>
                <div className='col margin-left-auto'>
                  <span className="base-font-semi-bold">{affectedPopCentres}</span>
                </div>
              </li>
              <li className='row flex spacing-half-v'>
                <div className='col'>
                  <Translate stringId="emergencyAssistedByGovernmentLabel" />
                </div>
                <div className='col margin-left-auto'>
                  <span className="base-font-semi-bold">
                    {n(get(report, 'gov_num_assisted'))}
                  </span>
                </div>
              </li>
              <li className='row flex spacing-half-v'>
                <div className='col'>
                  <Translate stringId="emergencyAssistedByRCRCLabel" />
                </div>
                <div className='col margin-left-auto'>
                  <span className="base-font-semi-bold">
                    {n(get(report, 'num_assisted'))}
                  </span>
                </div>
              </li>
            </ul>
          </div>
          <div className="emergency__source">
            <Translate
              stringId="emergencySourceMessage"
              params={{
                link: (
                  <Link to={`/reports/${report.id}`}>
                    {`${report.summary} ${timestamp(report.updated_at || report.created_at)}`}
                  </Link>
                ),
              }}
            />
          </div>
        </div>
      </div>
      );
  }

  renderFieldReportStatsEvent (report, isEPI, isCOVID) {
    const { strings } = this.props;
    const numAffected = parseInt(get(report, 'num_affected')) || parseInt(get(report, 'gov_num_affected')) || parseInt(get(report, 'other_num_affected'));
    const numInjured = parseInt(get(report, 'num_injured')) || parseInt(get(report, 'gov_num_injured')) || parseInt(get(report, 'other_num_injured'));
    const numDead = parseInt(get(report, 'num_dead')) || parseInt(get(report, 'gov_num_dead')) || parseInt(get(report, 'other_num_dead'));
    const numMissing = parseInt(get(report, 'num_missing')) || parseInt(get(report, 'gov_num_missing')) || parseInt(get(report, 'other_num_missing'));
    const numDisplaced = parseInt(get(report, 'num_displaced')) || parseInt(get(report, 'gov_num_displaced')) || parseInt(get(report, 'other_num_displaced'));
    const numAssisted = parseInt(get(report, 'num_assisted')) || parseInt(get(report, 'gov_num_assisted')) || parseInt(get(report, 'other_num_assisted'));
    const epiFiguresSource = epiSources.find(source => source.value === `${report.epi_figures_source}`);
    return (
      <div className='col-lg flex spacing-4-t'>
        <div className='box__global emergency__affected__figures'>
          <h3 className='heading__title heading__title--emergency'>
            <Translate stringId="emergencyFieldReportStatsHeading" />
          </h3>
          <div className=''>
            { isEPI
              ? (
                <ul className='list-reset'>
                  <li className='row flex spacing-half-v'>
                    <div className='col'>
                      {strings.emergencyCasesLabel}
                    </div>  
                    <div className='col margin-left-auto'>
                      <span className='base-font-semi-bold'>{n(get(report, 'epi_cases'))}</span>
                    </div>
                  </li>
                  { !isCOVID
                    ? (
                      <React.Fragment>
                        <li className='row flex spacing-half-v pl-small'>
                          <div className='col'>
                            {strings.emergencySuspectedCasesLabel}
                          </div>
                          <div className='col margin-left-auto'>
                            <span className='base-font-semi-bold'>{n(get(report, 'epi_suspected_cases'))}</span>
                          </div>
                        </li>
                        <li className='row flex spacing-half-v pl-small'>
                          <div className='col'>
                            {strings.emergencyProbableCasesLabel}
                          </div>
                          <div className='col margin-left-auto'>
                            <span className='base-font-semi-bold'>{n(get(report, 'epi_probable_cases'))}</span>
                          </div>
                        </li>
                        <li className='row flex spacing-half-v pl-small'>
                          <div className='col'>
                            {strings.emergencyConfirmedCasesLabel}
                          </div>
                          <div className='col margin-left-auto'>
                            <span className='base-font-semi-bold'>{n(get(report, 'epi_confirmed_cases'))}</span>
                          </div>
                        </li>
                      </React.Fragment>
                    )
                    : null
                  }
                  <li className='row flex spacing-half-v'>
                    <div className='col'>
                      {strings.emergencyDeadLabel}
                    </div>  
                    <div className='col margin-left-auto'>
                      <span className='base-font-semi-bold'>{n(get(report, 'epi_num_dead'))}</span>
                    </div>  
                  </li>
                  <li className='row flex spacing-half-v'>
                    <div className='col emergency__source'>Source:
                      { isEPI
                        ? (
                          <React.Fragment>
                            <strong>{epiFiguresSource ? ` ${epiFiguresSource.label}` : ' --' }</strong>
                          </React.Fragment>
                        )
                        : (
                          <Link to={`/reports/${report.id}`}>{report.summary}, {timestamp(report.updated_at || report.created_at)}</Link>
                        )
                      }
                    </div>
                  </li>
                </ul>
              )
              : (
                <ul className='list-reset'>
                  <li className='row flex spacing-half-v'>
                    <div className='col'>
                      {strings.emergencyAffectedLabel}
                    </div>
                    <div className='col margin-left-auto'>
                      <span className='base-font-semi-bold'>{n(numAffected)}</span>
                    </div>
                  </li>
                  <li className='row flex spacing-half-v'>
                    <div className='col'>
                      {strings.emergencyInjuredLabel}
                    </div>
                    <div className='col margin-left-auto'>
                      <span className='base-font-semi-bold'>{n(numInjured)}</span>
                    </div>
                    </li>
                  <li className='row flex spacing-half-v'>
                    <div className='col'>
                      {strings.emergencyDeadLabel}
                    </div>
                    <div className='col margin-left-auto'>
                      <span className='base-font-semi-bold'>{n(numDead)}</span>
                    </div>
                  </li>
                  <li className='row flex spacing-half-v'>
                    <div className='col'>
                      {strings.emergencyMissingLabel}
                    </div>
                    <div className='col margin-left-auto'>
                      <span className='base-font-semi-bold'>{n(numMissing)}</span>
                    </div>
                  </li>
                  <li className='row flex spacing-half-v'>
                    <div className='col'>
                      {strings.emergencyDisplacedLabel}
                    </div>
                    <div className='col margin-left-auto'>
                      <span className='base-font-semi-bold'>{n(numDisplaced)}</span>
                    </div>
                  </li>
                </ul>
              )
            }
            <hr />
            <ul className='list-reset'>
                  <li className='row flex spacing-half-v'>
                <div className='col'>
                  {strings.emergencyAssistedLabel}
                </div>
                    <div className='col margin-left-auto'>
                  <span className='base-font-semi-bold'>{n(numAssisted)}</span>
                </div>
              </li>
              <li className='row flex spacing-half-v'>
                <div className='col'>
                  {strings.emergencyLocalStaffLabel}
                </div>
                <div className='col margin-left-auto'>
                  <span className='base-font-semi-bold'>{n(get(report, 'num_localstaff'))}</span>
                </div>
              </li>
              <li className='row flex spacing-half-v'>
                <div className='col'>
                  {strings.emergencyVolunteersLabel}
                </div>
                <div className='col margin-left-auto'>
                  <span className='base-font-semi-bold'>{n(get(report, 'num_volunteers'))}</span>
                </div>
              </li>
              { !isCOVID
                ? (
                  <li className='row flex spacing-half-v'>
                    <div className='col'>
                      {strings.emergencyDelegatesLabel}
                    </div>
                    <div className='col margin-left-auto'>
                      <span className='base-font-semi-bold'>{n(get(report, 'num_expats_delegates'))}</span>
                    </div>
                  </li>
                )
                : null
              }
            </ul>
          </div>
        </div>
      </div>
    );
  }

  renderFieldReportStats () {
    const report = mostRecentReport(
      get(this.props, 'event.data.field_reports')
    );
    const hideIt = get(this.props, 'event.data.hide_attached_field_reports');
    if (!report || hideIt) return null;
    const status = report.status === 8 ? 'EW' : 'EVT';
    const isEPI = get(this.props, 'event.data.dtype') === 1;
    const isCOVID = report.is_covid_report;
    if (status === 'EW') {
      return this.renderFieldReportStatsEW(report);
    } else {
      return this.renderFieldReportStatsEvent(report, isEPI, isCOVID);
    }
  }

  renderHeaderStats () {
    const { appeals } = this.props.event.data;
    const selected = this.state.selectedAppeal;

    let stats = {
      beneficiaries: 0,
      funded: 0,
      requested: 0,
    };
    stats = appeals
      .filter((o) => {
        return selected ? o.id === selected : true;
      })
      .reduce((acc, o) => {
        acc.beneficiaries += _toNumber(o.num_beneficiaries);
        acc.funded += _toNumber(o.amount_funded);
        acc.requested += _toNumber(o.amount_requested);
        return acc;
      }, stats);
    const displayHeadlineStats =
      stats.beneficiaries || stats.requested || stats.funded;
    return (
      <div>
        <div className="inpage__header-col">
          {displayHeadlineStats ? (
            <div className="inpage__headline-stats inpage__headline-stats--emergency">
              <div className='sumstats__wrap'>
                <ul className="sumstats">
                  {stats.beneficiaries > 0 ? (
                    <li className="sumstats__item__wrap">
                      <div className='sumstats__item'>
                        <span className='sumstats__icon_wrapper'>
                          <img className='sumstats__icon_2020' src="/assets/graphics/layout/targeted-population.svg" />
                        </span>
                        <span className="sumstats__value">
                          {n(stats.beneficiaries)}
                        </span>
                        <Translate
                          className="sumstats__key"
                          stringId="emergencyPeopleTargetedLabel"
                        />
                      </div>
                    </li>
                  ) : null}

                  {stats.requested > 0 ? (
                    <li className="sumstats__item__wrap">
                      <div className='sumstats__item'>                  
                        <span className='sumstats__icon_wrapper'>
                          <img className='sumstats__icon_2020' src="/assets/graphics/layout/funding-requirements.svg" />
                        </span>
                        <span className="sumstats__value">
                          {n(stats.requested)}
                        </span>
                        <Translate
                          className="sumstats__key"
                          stringId="emergencyFundingRequirementsLabel"
                        />
                      </div>
                    </li>
                  ) : null}
                  {stats.funded > 0 ? (
                    <li className="sumstats__item__wrap">
                      <div className='sumstats__item'>
                        <span className='sumstats__icon_wrapper'>
                          <img className='sumstats__icon_2020' src="/assets/graphics/layout/funding-coverage.svg" />
                        </span>
                        <span className="sumstats__value">{n(stats.funded)}</span>
                        <Translate
                          className="sumstats__key"
                          stringId="emergencyFundingLabel"
                        />
                      </div>
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
        <div className="funding-chart"></div>
      </div>
    );
  }

  userHasPerms (fieldReport) {
    const userIsAnon = !this.props.isLogged;
    const userIsSuperuser = this.props.profile.fetched && this.props.profile.data.is_superuser;
    const userIsIFRCAdmin = this.props.profile.fetched && this.props.profile.data.is_ifrc_admin;
    const visibility = fieldReport.visibility;

    // superusers can see all reports
    if (userIsSuperuser || userIsIFRCAdmin) {
      return true;
    }

    // anonymous users can only see public reports
    if (userIsAnon) {
      return visibility === 3;
    }

    // logged in users can see all reports not restricted to IFRC
    return visibility !== 2;
  }

  renderFieldReports () {
    const {
      strings,
      event: {
        data,
      },
    } = this.props;
    const fieldReports = data.field_reports ? data.field_reports.filter(fr => this.userHasPerms(fr)) : [];
    if (fieldReports.length) {
      return (
        <Fold
          id="field-reports"
          title={resolveToString(strings.emergencyFieldReportsWithCountTitle, { count: data.field_reports.length })}
          foldWrapperClass="event-field-reports fold--main">
          <table className="table table--border-bottom">
            <thead>
              <tr>
                <th>{strings.emergencyFieldReportTableHeaderDate}</th>
                <th>{strings.emergencyFieldReportTableHeaderName}</th>
                <th>{strings.emergencyFieldReportTableHeaderCountries}</th>
                <th>{strings.emergencyFieldReportTableHeaderRegions}</th>
              </tr>
            </thead>
            <tbody>
              {fieldReports.map(o => (
                <tr key={o.id}>
                  <td>{isoDate(o.created_at)}</td>
                  <td>
                    <Link
                      to={{
                        pathname: `/reports/${o.id}`,
                        state: this.props.location.pathname
                      }}
                      className="link--table"
                      title={strings.emergencyFieldReportLinkTitle}
                    >
                      {o.summary || noSummary}
                    </Link>
                  </td>
                  <td>
                    {Array.isArray(o.countries)
                      ? o.countries.map((c) => (
                        <Link
                          to={`/countries/${c.id}`}
                          key={c.id}
                          className="link--table"
                        >
                          {c.name}{' '}
                        </Link>
                      ))
                      : nope}
                  </td>
                  <td>
                    {Array.isArray(o.countries) ? o.countries.map(c => c.region).reduce((acc, curr) => {
                      if (curr !== null && acc.indexOf(curr) === -1) {
                        acc.push(curr);
                      }
                      return acc;
                    }, []).map(region => {
                      return (<Link to={`/regions/${region}`}
                        key={region}
                        className="link--table"
                      >
                        { this.props.regionsById[region][0].label }
                      </Link>);
                    }) : nope }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Fold>
      );
    }
    return null;
  }

  renderReports (className, reportTypes) {
    return (
      <div className="response__doc__block">
        <div className="clearfix">
          {Object.keys(reportTypes).map((reportTypeId) => {
            return (
              <div
                className="response__doc__col"
                key={`response-type-${reportTypeId}`}
              >
                <div className="response__doc__each">
                  <div className="response__doc__title">
                    {reportTypes[reportTypeId].title}
                  </div>
                  <div className="response__doc__inner scrollbar__custom">
                    {reportTypes[reportTypeId].hasOwnProperty('items') &&
                      reportTypes[reportTypeId].items.length > 0 ? (
                        reportTypes[reportTypeId].items.map((item) => {
                          return (
                            <div
                              className="response__doc__item"
                              key={`item-${item.id}`}
                            >
                              {item.name}
                              <a
                                className="collecticon-download response__doc__item__link"
                                target="_blank"
                                href={item.document || item.document_url}
                              ></a>
                            </div>
                          );
                        })
                      ) : (
                        <div className="response__doc__item">
                          <Translate stringId="emergencyNoDocumentsMessage" />
                        </div>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  renderResponseDocuments () {
    const data = get(this.props.situationReports, 'data.results', []);
    const { date, type } = this.state.sitrepFilters;
    // return empty when no data, only on default filters.
    if (!data.length && date === 'all' && type === 'all') return null;
    const { id } = this.props.match.params;
    const addReportLink = url.resolve(api, `api/event/${id}/change`);
    const types = this.props.situationReportTypes;
    if (!types.fetched) {
      return null;
    }
    const reportsByType = getRecordsByType(types, data);
    return (
      <Fold
        id="response-documents"
        header={() => (
          <div className="fold__headline">
            <div className="fold__actions">
              <a
                className="button button--primary-bounded button--small"
                href={addReportLink}
                target="_blank"
              >
                Add a Report
              </a>
            </div>
            <h2 className="fold__title">Response Documents</h2>
          </div>
        )}
      >
        <div>{this.renderReports('situation-reports-list', reportsByType)}</div>
      </Fold>
    );
  }

  renderAppealReports (className, reports) {
    return (
      <ul className={className}>
        {reports.map((o) => {
          let href = o['document'] || o['document_url'] || null;
          if (!href) {
            return null;
          }
          return (
            <li key={o.id} className='col col-6-xs'>
              <a className="link-underline" href={href} target="_blank">
                {o.name}, {isoDate(o.created_at)}
              </a>
            </li>
          );
        })}
      </ul>
    );
  }

  renderAppealDocuments () {
    const { strings } = this.props;
    const data = get(this.props.appealDocuments, 'data.results', []);
    if (!data.length) return null;
    return (
      <Fold id="documents" title={strings.emergencyAppealDocumentsTitle} foldWrapperClass='fold--main'>
        {this.renderAppealReports('public-docs-list row flex-xs', data)}
      </Fold>
    );
  }

  hasKeyFigures () {
    const { data } = this.props.event;
    const kf = get(data, 'key_figures');
    if (!Array.isArray(kf) || !kf.length) {
      return false;
    } else {
      return true;
    }
  }

  renderKeyFigures () {
    const { strings } = this.props;
    const { data } = this.props.event;
    const kf = get(data, 'key_figures');
    if (!this.hasKeyFigures()) return null;

    return (
      <Fold title={strings.emergencyKeyFiguresTitle} foldWrapperClass="key-figures fold--main padding-b-reset" foldContainerClass='container--padding-reset'>
        <div className='sumstats__wrap'>
          <ul className="sumstats">
            {kf.map((o) => (
              <li key={o.deck} className='sumstats__item__wrap'>
                <div className='sumstats__item'>
                  <h3 className='sumstats__value margin-reset'>{isNaN(o.number) ? o.number : n(o.number)}</h3>
                  <p className="sumstats__key">{o.deck}</p>
                  <p className="key-figure-source emergency__source">
                    <Translate
                      stringId="emergencySourceFigure"
                      params={{
                        source: o.source,
                      }}
                    />
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Fold>
    );
  }

  addSubscription () {
    this.props._addSubscriptions(this.props.match.params.id);
    this.setState({ subscribed: true });
  }

  delSubscription () {
    this.props._delSubscription(this.props.match.params.id);
    this.setState({ subscribed: false });
  }

  renderAdditionalTabPanels () {
    const additionalTabs = this.state.tabs.slice(1);
    if (additionalTabs.length) {
      return (
        <React.Fragment>
          {additionalTabs.map((tab, index) => {
            return (
              <TabPanel key={tab.title}>
                <Snippets
                  eventId={get(this.props.event, 'data.id')}
                  tab={index + 1}
                />
              </TabPanel>
            );
          })}
        </React.Fragment>
      );
    }
  }

  isPending = memoize((projectForm = {}, eventForm = {}, siteRepForm = {}) => (
    projectForm.fetching || eventForm.fetching || siteRepForm.fetching
  ))

  renderContent () {
    const { fetched, error, data } = this.props.event;

    if (!fetched || error) return null;
    const report =
      mostRecentReport(get(this.props, 'event.data.field_reports')) || {};
    const summary = data.summary || report.description || null;

    const contacts =
      Array.isArray(data.contacts) && data.contacts.length
        ? data.contacts
        : Array.isArray(report.contacts) && report.contacts.length
          ? report.contacts
          : null;
    const subscribeButton = () =>
      this.state.subscribed ? (
        <React.Fragment>
          <div className='col-sm spacing-half-v'>
            <button
              className="button button--primary-bounded button--xsmall"
              onClick={this.delSubscription}
            >
              <Translate stringId="emergencyActionUnsubscribeLabel" />
            </button>
          </div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className='col-sm spacing-half-v'>
            <button
              className="button button--primary-filled button--xsmall"
              onClick={this.addSubscription}
            >
              <Translate stringId="emergencyActionSubscribeLabel" />
            </button>
          </div>
        </React.Fragment>
      );

    const showExportMap = () => {
      // Show the export map if exactly one country is selected, and at least 1 district is selected.
      if (
        data.countries.length === 1 &&
        data.countries[0].record_type === 1 &&
        data.districts.length > 0
      ) {
        return (
          <div className='col-lg flex-1'>
            <EmergencyMap
              countries={data.countries}
              districts={data.districts}
              name={data.name}
              date={data.updated_at}
              disasterTypeCode={data.dtype}
              countriesGeojson={this.props.countriesGeojson}
            />
          </div> 
        );
      } else {
        return null;
      }
    };

    const handleTabChange = (index) => {
      const tabHashArray = this.state.tabs.map(({ hash }) => hash);
      const url = this.props.location.pathname;
      this.props.history.replace(`${url}${tabHashArray[index]}`);
    };
    const hashes = this.state.tabs.map((t) => t.hash);
    const selectedIndex =
      hashes.indexOf(this.props.location.hash) !== -1
        ? hashes.indexOf(this.props.location.hash)
        : 0;

    const { strings } = this.props;
    let country = null,
      regionId = null,
      countryLink = null,
      regionLink = null,
      regionName = null;

    let crumbs = [
      {
        link: `/emergency/${get(data, 'id')}`,
        name: get(data, 'name', strings.breadCrumbEmergency)
      }
    ];
    if (data.countries.length > 0) {
      country = data.countries[0];
      countryLink = `/countries/${this.props.event.data.countries[0].id}`;
      crumbs.push({
        link: countryLink, name: country.name
      });
      regionId = country.region;
      if (regionId) {
        regionLink = `/regions/${regionId}`;
        regionName = this.props.regionsById[regionId][0].label;
        crumbs.push({
          link: regionLink,
          name: regionName
        });
      }
    }
    crumbs.push({
      link: '/emergencies', name: strings.breadCrumbEmergencies,
    });
    crumbs.push({
      link: '/', name: strings.breadCrumbHome,
    });

    return (
      <section className="inpage">
        <Helmet>
          <title>
            { resolveToString(strings.emergencyPageTitle, { name: get(data, 'name', 'Emergency') }) }
          </title>
        </Helmet>

        <div className='container-lg'>
          <div className='row flex-sm'>
            <div className='col col-6-sm col-7-mid'>
              <BreadCrumb
                breadcrumbContainerClass='padding-reset'
                crumbs={crumbs}
              />
            </div>

            <div className='col col-6-sm col-5-mid spacing-half-t'>
              <div className='row-sm flex flex-justify-flex-end'>
                {this.props.isLogged ? subscribeButton() : null}
                <div className='col-sm spacing-half-v flex'>
                  <a
                    href={url.resolve(api, `api/event/${data.id}/change/`)}
                    className="button button--xsmall button--primary-bounded button button--edit-action"
                  >
                    <span className='f-icon-pencil margin-half-r'></span>
                    <Translate
                      stringId="emergencyActionEditEventLabel"
                    />
                  </a>
                </div>
                <div className='col-sm spacing-half-v flex'>
                  {this.props.isLogged && (
                    <button
                      onClick={() => {
                        this.setState({
                          showProjectForm: true,
                        });
                      }}
                      className="button button--xsmall button--primary-bounded"
                    >
                        <Translate
                          stringId="emergencyActionCreateThreeWActivityLabel"
                        />
                    </button>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>
          {this.state.showProjectForm && (
            <ProjectFormModal
              onCloseButtonClick={() => {
                this.setState({ showProjectForm: false });
              }}
            />
          )}
        <header className="inpage__header inpage__header--action">
          <div className="container-lg">
            <div>
              <div>
                <h1 className="inpage__title">{data.name}</h1>
                <div className="inpage__headline-actions text-center row flex flex-justify-center">
                  { regionId ? (
                    <div className='col spacing-half-v flex'>
                      <Link to={regionLink}
                        className="link link--with-icon"
                      >
                        <span className='link--with-icon-text'>
                          {regionName}
                        </span>
                        <span className='collecticon-chevron-right link--with-icon-inner'></span>
                      </Link>
                    </div>
                  ) : null }
                  { country ? (
                  <div className='col spacing-half-v flex'>
                    <Link to={countryLink}
                      className="link link--with-icon"
                    >
                      <span className='link--with-icon-text'>
                        {country.name}
                      </span>
                      <span className='collecticon-chevron-right link--with-icon-inner'></span>
                    </Link>
                  </div>
                  ) : null }
                </div>
                {this.renderHeaderStats()}
              </div>
            </div>
          </div>
        </header>
        <div className='tab__wrap margin-2-t'>
          <Tabs
            selectedIndex={selectedIndex}
            onSelect={(index) => handleTabChange(index)}
          >
            <TabList>
              {this.state.tabs.map((tab) => (
                <Tab key={tab.title}>{tab.title}</Tab>
              ))}
            </TabList>

            <div className="inpage__body">
              <div className="inner">
                <TabPanel>
                  <TabContent isError={!this.hasKeyFigures()} title={strings.emergencyKeyFiguresTitle}>
                    <div className='container-lg'>
                      {this.renderKeyFigures()}
                    </div>
                  </TabContent>
                  <TabContent>
                    <div className='container-lg'>
                      <div className='box__global emergency__overview'>
                        <div className='heading__title heading__title--emergency'>{strings.emergencyOverviewBoxTitle}</div>
                          <div className='row-sm flex'>
                            <div className='col-sm col-12 col-4-mid'>
                              <div className='flex row emergency__overview-row'>
                                <div className='col emergency__overview-col-cat'>{strings.emergencyDisasterCat}</div>
                                <div className='col emergency__overview-col-desc'>
                                  <div className='state-block row-sm'>
                                    <div className='col-sm'>
                                      <div className='state-name'>Orange</div>
                                    </div>
                                    <div className='col-sm'>
                                      <div className='state state--severity-mid'></div>
                                    </div>
                                  </div>
                                </div>
                              </div> 

                              <div className='flex row emergency__overview-row'>
                                <div className='col emergency__overview-col-cat'>{strings.emergencyDisasterType}</div>
                                <div className='col emergency__overview-col-desc'>
                                  <div className='emergency__overview-desc'>
                                    Conflict
                                  </div>
                                </div>
                              </div> 

                              <div className='flex row emergency__overview-row'>
                                <div className='col emergency__overview-col-cat'>{strings.globalStartDate}</div>
                                <div className='col emergency__overview-col-desc'>
                                  <div className='emergency__overview-desc'>
                                    YYYY-MM-DD
                                  </div>
                                </div>
                              </div> 
                            </div>
                            <div className='col-sm col-12 col-4-mid'>
                              <div className='flex row emergency__overview-row'>
                                <div className='col emergency__overview-col-cat'>{strings.emergencyGovtReqIntlAsst}</div>
                                <div className='col emergency__overview-col-desc'>
                                  <div className='emergency__overview-desc'>
                                    Yes
                                  </div>
                                </div>
                              </div> 

                              <div className='flex row emergency__overview-row'>
                                <div className='col emergency__overview-col-cat'>{strings.emergencyNSReqIntlAsst}</div>
                                <div className='col emergency__overview-col-desc'>
                                  <div className='emergency__overview-desc'>
                                    Yes
                                  </div>
                                </div>
                              </div> 
                            </div>
                            <div className='col-sm col-12 col-4-mid'>
                              <div className='flex row emergency__overview-row'>
                                <div className='col emergency__overview-col-cat'>{strings.emergencyDREF}</div>
                                <div className='col emergency__overview-col-desc'>
                                  <div className='emergency__overview-desc'>
                                    Requested for 25000CHF
                                  </div>
                                </div>
                              </div> 

                              <div className='flex row emergency__overview-row'>
                                <div className='col emergency__overview-col-cat'>{strings.emergencyRapidResponsePersonnel}</div>
                                <div className='col emergency__overview-col-desc'>
                                  <div className='emergency__overview-desc'>
                                    Requested
                                  </div>
                                </div>
                              </div> 
                            </div>
                          </div>
                      </div>
                    </div>
                  </TabContent>
                  <TabContent
                    isError={!summary}
                    errorMessage={strings.noDataMessage}
                    title={strings.emergencyOverviewTitle}
                  >
                    <Fold
                      id="overview"
                      title={strings.emergencySituationalOverviewTitle}
                      foldWrapperClass="situational-overview fold--main"
                    >
                      <Expandable
                        sectionClass="rich-text-section"
                        limit={2048}
                        text={summary}
                      />
                    </Fold>
                  </TabContent>
                  <div className='container-lg'>
                    <div className='row-lg flex-sm flex-justify-center'>
                      {showExportMap()}
                      {this.renderFieldReportStats()}
                    </div>
                  </div>
                  {contacts && contacts.length ? (
                    <div className='container-lg margin-2-v'>
                      <Fold id="contacts" title={strings.emergencyContactsTitle} foldWrapperClass="contacts fold--main" foldContainerClass='container--padding-reset'>
                        <table className="table table--border-bottom">
                          <thead className="visually-hidden">
                            <tr>
                              <th>{strings.emergencyContactsTableHeaderName}</th>
                              <th>{strings.emergencyContactsTableHeaderTitle}</th>
                              <th>{strings.emergencyContactsTableHeaderType}</th>
                              <th>{strings.emergencyContactsTableHeaderContact}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {contacts.map((o) => (
                              <tr key={o.id}>
                                <td>{o.name}</td>
                                <td>{o.title}</td>
                                <td>{separate(o.ctype)}</td>
                                <td>
                                  {o.email.indexOf('@') !== -1 ? (
                                    <a
                                      className="button button--small button--grey-cement-bounded"
                                      href={`mailto:${o.email}`}
                                      title={strings.emergencyContactTitle}
                                    >
                                      {o.email}
                                    </a>
                                  ) : (
                                    <a
                                      className="button button--small button--grey-cement-bounded"
                                      href={`tel:${o.email}`}
                                      title={strings.emergencyContactTitle}
                                    >
                                      {o.email}
                                    </a>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Fold>
                    </div>
                  ) : (
                    <div className='container-lg margin-2-v'>
                      <ErrorPanel
                        title={strings.emergencyContactsTitle}
                        errorMessage={strings.emergencyContactEmptyMessage}
                      />
                    </div>
                  )}
                </TabPanel>

                <TabPanel>
                  <TabContent
                    isError={!get(this.props.event, 'data.field_reports.length')}
                    errorMessage={strings.noDataMessage}
                    title={strings.emergencyFieldReportsTitle}
                  >
                    {this.renderFieldReports()}
                  </TabContent>

                  <TabContent
                    isError={
                      !get(this.props.appealDocuments, 'data.results.length')
                    }
                    errorMessage={strings.noDataMessage}
                    title={strings.emergencyAppealDocumentsTitle}
                  >
                    {this.renderAppealDocuments()}
                  </TabContent>

                  <TabContent
                    isError={
                      !get(this.props.situationReports, 'data.results.length')
                    }
                    errorMessage={strings.noDataMessage}
                    title={strings.emergencyResponseDocumentsTitle}
                  >
                    {this.renderResponseDocuments()}
                  </TabContent>

                </TabPanel>

                <TabPanel>
                  <TabContent title={strings.emergencyAlertsTitle}>
                    <SurgeAlertsTable
                      id="alerts"
                      title={strings.emergencyAlertsTitle}
                      emergency={this.props.match.params.id}
                      returnNullForEmpty={true}
                    />
                  </TabContent>
                  <TabContent
                    isError={!get(this.props.eru, 'data.results.length')}
                    errorMessage={strings.noDataMessage}
                    title={strings.emergencyERUTitle}
                  >
                    <EruTable id="erus" emergency={this.props.match.params.id} />
                  </TabContent>
                  <TabContent title={strings.emergencyPersonnelTitle}>
                    <PersonnelTable
                      id="personnel"
                      emergency={this.props.match.params.id}
                    />
                  </TabContent>
                </TabPanel>

                {this.renderAdditionalTabPanels()}
              </div>
            </div>
          </Tabs>
        </div>
      </section>
    );
  }

  render () {
    const {
      strings,
      projectForm,
      event,
      siteRepResponse,
    } = this.props;

    const pending = this.isPending(projectForm, event, siteRepResponse);

    return (
      <App className="page--emergency">
        <Helmet>
          <title>{strings.emergencyPageTitleStatic}</title>
        </Helmet>
        { pending && <NewGlobalLoading /> }
        {this.renderContent()}
      </App>
    );
  }
}

if (environment !== 'production') {
  Emergency.propTypes = {
    _getEventById: T.func,
    _getEventSnippets: T.func,
    _getSitrepsByEventId: T.func,
    _getSitrepTypes: T.func,
    _getAppealDocsByAppealIds: T.func,
    _addSubscriptions: T.func,
    _delSubscription: T.func,
    _getUserProfile: T.func,
    snippets: T.object,
    match: T.object,
    location: T.object,
    history: T.object,
    event: T.object,
    situationReports: T.object,
    situationReportTypes: T.object,
    appealDocuments: T.object,
    surgeAlerts: T.object,
    eru: T.object,
    personnel: T.object,
    isLogged: T.bool,
    profile: T.object,
    user: T.object,
  };
}

// /////////////////////////////////////////////////////////////////// //
// Connect functions

const selector = (state, ownProps) => ({
  projectForm: state.projectForm,
  event: get(state.event.event, ownProps.match.params.id, {
    data: {},
    fetching: false,
    fetched: false,
  }),
  snippets: get(state.event.snippets, ownProps.match.params.id, {
    data: {},
    fetching: false,
    fetched: false,
  }),
  siteRepResponse: state.situationReports,
  situationReports: get(
    state.situationReports,
    ['reports', ownProps.match.params.id],
    {
      data: {},
      fetching: false,
      fetched: false,
    }
  ),
  situationReportTypes: state.situationReports.types,
  appealDocuments: get(state.appealDocuments, ownProps.match.params.id, {
    data: {},
    fetching: false,
    fetched: false,
  }),
  surgeAlerts: state.surgeAlerts,
  eru: state.deployments.eru,
  personnel: state.deployments.personnel,
  isLogged: !!state.user.data.token,
  user: state.user,
  profile: state.profile,
  regionsById: regionsByIdSelector(state),
  countriesGeojson: countriesGeojsonSelector(state),
});

const dispatcher = (dispatch) => ({
  _getEventById: (...args) => dispatch(getEventById(...args)),
  _getEventSnippets: (...args) => dispatch(getEventSnippets(...args)),
  _getSitrepsByEventId: (...args) => dispatch(getSitrepsByEventId(...args)),
  _getSitrepTypes: (...args) => dispatch(getSitrepTypes(...args)),
  _getAppealDocsByAppealIds: (...args) =>
    dispatch(getAppealDocsByAppealIds(...args)),
  _addSubscriptions: (...args) => dispatch(addSubscriptions(...args)),
  _delSubscription: (...args) => dispatch(delSubscription(...args)),
  _getUserProfile: (...args) => dispatch(getUserProfile(...args)),
});

export default withLanguage(withRouter(connect(selector, dispatcher)(Emergency)));
