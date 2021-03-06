import React from 'react';
import { connect } from 'react-redux';
import { PropTypes as T } from 'prop-types';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import Progress from '../progress-labeled';


import { environment } from '#config';
import { getAppealsList, getAppeals } from '#actions';
import { commaSeparatedNumber as n, nope } from '#utils/format';
import {
  get,
  dateOptions,
} from '#utils/utils';

import ExportButton from '#components/export-button-container';
import Fold from '#components/fold';
import BlockLoading from '#components/block-loading';
import DisplayTable, { SortHeader, FilterHeader } from '#components/display-table';
import DateFilterHeader from '#components/common/filters/date-filter-header';
import { SFPComponent } from '#utils/extendables';
import { appealTypes as appealsType, appealTypeOptions } from '#utils/appeal-type-constants';

import LanguageContext from '#root/languageContext';
import Translate from '#components/Translate';

import { disasterTypesSelectSelector } from '#selectors';

class AppealsTable extends SFPComponent {
  constructor (props) {
    super(props);
    this.state = {
      table: {
        page: 1,
        limit: isNaN(props.limit) ? 10 : props.limit,
        sort: {
          field: '',
          direction: 'asc'
        },
        filters: {
          date: 'all',
          dtype: 'all',
          status: 'all',
          atype: 'all'
        }
      }
    };
  }

  componentDidMount () {
    this.requestResults(this.props);
    this.props._getAppealsList();
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps (newProps) {
    let shouldMakeNewRequest = false;
    ['limit', 'country', 'region', 'atype', 'record'].forEach(prop => {
      if (newProps[prop] !== this.props[prop]) {
        shouldMakeNewRequest = true;
      }
    });
    if (shouldMakeNewRequest) {
      this.requestResults(newProps);
    }
  }

  requestResults (props) {
    props._getAppeals(this.state.table.page, this.getQs(props), props.action);
  }

  getQs (props) {
    let state = this.state.table;
    let qs = { limit: state.limit };
    if (state.sort.field) {
      qs.ordering = (state.sort.direction === 'desc' ? '-' : '') + state.sort.field;
    } else {
      qs.ordering = '-start_date';
    }

    const {
      startDate, endDate
    } = state.filters.date;
    if (startDate) {
      qs.start_date__gte = DateTime.fromISO(startDate).toISO();
    }
    if (endDate) {
      qs.start_date__lte = DateTime.fromISO(endDate).toISO();
    }
    if (state.filters.dtype !== 'all') {
      qs.dtype = state.filters.dtype;
    }
    if (state.filters.status !== 'all') {
      qs.status = state.filters.status;
    }
    if (state.filters.atype !== 'all') {
      qs.atype = state.filters.atype;
    }

    if (props.showActive) {
      qs.end_date__gt = DateTime.utc().toISO();
    }

    if (!isNaN(props.country)) {
      qs.country = props.country;
    } else if (!isNaN(props.region)) {
      qs.region = props.region;
    }

    if (props.atype) {
      qs.atype = props.atype === 'appeal' ? '1'
        : props.atype === 'dref' ? '0' : null;
    }

    if (!isNaN(props.record)) {
      qs.id = props.record;
    }
    return qs;
  }

  updateData () {
    this.requestResults(this.props);
  }

  render () {
    const {
      fetched,
      fetching,
      error,
      data
    } = this.props.appeals;

    const { strings } = this.context;
    const title = this.props.title || strings.appealsTableTitle;
    if (fetching) {
      return this.props.title
        ? (
          <Fold title={title} id={this.props.id}>
            <BlockLoading/>
          </Fold>
        )
        : (
          <BlockLoading/>
        );
    }

    if (error) {
      return (
        <Fold title={title} id={this.props.id}>
          <p>
            <Translate stringId='appealsTableError'/>
          </p>
        </Fold>
      );
    }

    if (fetched) {
      const headings = [
        {
          id: 'date',
          label: <DateFilterHeader
            id='date'
            title={strings.appealsTableStartDate}
            options={dateOptions}
            filter={this.state.table.filters.date}
            isActive={this.state.table.filters.date !== 'all'}
            featureType='table'
            onSelect={this.handleFilterChange.bind(this, 'table', 'date')} />
        },
        {
          id: 'type',
          label: <FilterHeader
            id='type'
            title={strings.appealsTableType}
            options={appealTypeOptions}
            filter={this.state.table.filters.atype}
            isActive={this.state.table.filters.atype !== 'all'}
            onSelect={this.handleFilterChange.bind(this, 'table', 'atype')} />
        },
        { id: 'code', label: strings.appealsTableCode },
        {
          id: 'name',
          label: <SortHeader
            id='name'
            title={strings.appealsTableOperation}
            sort={this.state.table.sort}
            isActive={this.state.table.sort.field === 'name'}
            onClick={this.handleSortChange.bind(this, 'table', 'name')} />
        },
        {
          id: 'dtype',
          label: <FilterHeader
            id='dtype'
            title={strings.appealsTableDisastertype}
            options={[{ value: 'all', label: 'All Types' }, ...this.props.disasterTypesSelect ]} filter={this.state.table.filters.dtype}
            isActive={this.state.table.filters.dtype !== 'all'}
            onSelect={this.handleFilterChange.bind(this, 'table', 'dtype')} />
        },
        {
          id: 'requestAmount',
          label: <SortHeader
            id='amount_requested'
            title={strings.appealsTableRequestedAmount}
            sort={this.state.table.sort}
            isActive={this.state.table.sort.field === 'amount_requested'}
            onClick={this.handleSortChange.bind(this, 'table', 'amount_requested')} />
        },
        {
          id: 'fundedAmount',
          label: <SortHeader
            id='amount_funded'
            title={strings.appealsTableFundedAmount}
            sort={this.state.table.sort}
            isActive={this.state.table.sort.field === 'amount_funded'}
            onClick={this.handleSortChange.bind(this, 'table', 'amount_funded')} />
        },
        {
          id: 'country',
          label: strings.appealsTableCountry,
        }
      ];

      const rows = data.results.map(o => {
        const fundedPercent = (parseInt(o.amount_funded) / parseInt(o.amount_requested)) * 100;
        const fundedPercentRounded = Math.round(fundedPercent * 100) / 100;
        const name = o.event ? (<Link to={`/emergencies/${o.event}`} className='link--table' title={strings.appealsTableViewEmergency}>
            {o.name}
          </Link>): o.name;
        return {
          id: o.id,
          date: DateTime.fromISO(o.start_date).toISODate(),
          code: o.code,
          name: name,
          dtype: o.dtype?.name || nope,
          requestAmount: {
            value: n(o.amount_requested, 'CHF'),
            className: ''
          },
          fundedAmount: {
            value: (<div>
              <span className='progress_value_funding_table'>{fundedPercentRounded}%</span>
              <Progress value={fundedPercent} max={100} />
            </div>),
            className: ''
          },
          type: appealsType[o.atype],
          country: o.country ? <Link to={`/countries/${o.country.id}`} className='link--table' title={strings.appealsTableViewCountry}>{o.country.name}</Link> : nope
        };
      });

      return this.props.title
        ? (
          <Fold
            showHeader={!this.props.fullscreen}
            title={`${title} (${n(data.count)})`}
            id={this.props.id}
            navLink={this.props.foldLink}
            foldTitleClass='fold__title--inline'
            foldWrapperClass='fold--main fold--appeals-table'
          >
            {this.props.showExport ? (
              <ExportButton filename='appeals'
                qs={this.getQs(this.props)}
                resource='api/v2/appeal'
              />
            ) : null}
            {this.props.fullscreen ? null : (
              <DisplayTable
                className='table table--border-bottom table--box-shadow table--active-ops margin-half-t'
                headings={headings}
                rows={rows}
                pageCount={data.count / this.state.table.limit}
                page={this.state.table.page - 1}
                onPageChange={this.handlePageChange.bind(this, 'table')}
                noPaginate={this.props.noPaginate}
              />
            )}
          </Fold>
        )
        : (
          <React.Fragment>
            {this.props.showExport ? (
              <ExportButton filename='appeals'
                qs={this.getQs(this.props)}
                resource='api/v2/appeal'
              />
            ) : null}
            {this.props.fullscreen ? null : (
              <DisplayTable
                className='table table--border-bottom table--box-shadow table--active-ops margin-half-t'
                headings={headings}
                rows={rows}
                pageCount={data.count / this.state.table.limit}
                page={this.state.table.page - 1}
                onPageChange={this.handlePageChange.bind(this, 'table')}
                noPaginate={this.props.noPaginate}
              />
            )}
          </React.Fragment>
        );
    }
    return null;
  }
}

if (environment !== 'production') {
  AppealsTable.propTypes = {
    _getAppeals: T.func,
    appeals: T.object,
    appealsList: T.object,

    limit: T.number,
    country: T.number,
    region: T.number,
    atype: T.string,
    record: T.string,

    noPaginate: T.bool,
    showExport: T.bool,
    showMap: T.bool,

    title: T.string,
    foldLink: T.object,

    showActive: T.bool,
    viewAll: T.string,
    viewAllText: T.string,
    id: T.string,

    action: T.string,
    statePath: T.string,

    fullscreen: T.bool,
    toggleFullscreen: T.func
  };
}

const selector = (state, props) => ({
  appeals: props.statePath ? get(state, props.statePath) : state.appeals,
  appealsList: state.overallStats.appealsList,
  disasterTypesSelect: disasterTypesSelectSelector(state)
});

const dispatcher = (dispatch) => ({
  _getAppeals: (...args) => dispatch(getAppeals(...args)),
  _getAppealsList: (...args) => dispatch(getAppealsList(...args))
});
AppealsTable.contextType = LanguageContext;
export default connect(selector, dispatcher)(AppealsTable);
