import React from 'react';
import { connect } from 'react-redux';
import { PropTypes as T } from 'prop-types';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';

import { environment } from '#config';
import { getSurgeAlerts } from '#actions';
import { get, dateOptions, datesAgo, isLoggedIn } from '#utils/utils';
import { nope, privateSurgeAlert, recentInterval } from '#utils/format';

// FIXME: imports from the /components/ could be a 1 liner?
import ExportButton from '#components/export-button-container';
import { SFPComponent } from '#utils/extendables';
import DisplayTable, { FilterHeader } from '#components/display-table';
import BlockLoading from '#components/block-loading';
import Fold from '#components/fold';
import Expandable from '#components/expandable';

const alertTypes = {
  0: 'FACT',
  1: 'SIMS',
  2: 'ERU',
  3: 'DHEOps',
  4: 'HEOps',
  5: 'SURGE',
  6: 'Rapid Response'
};

const typeOptions = [{value: 'all', label: 'All'}].concat(Object.keys(alertTypes).map(d => ({
  label: alertTypes[d], value: d.toString()
})));

const alertCategories = {
  0: 'Info',
  1: 'Deployment',
  2: 'Alert',
  3: 'Shelter',
  4: 'Stand down'
};

const categoryOptions = [{value: 'all', label: 'All'}].concat(Object.keys(alertCategories).map(d => ({
  label: alertCategories[d], value: d.toString()
})));

class AlertsTable extends SFPComponent {
  // Methods form SFPComponent:
  // handlePageChange (what, page)
  // handleFilterChange (what, field, value)
  // handleSortChange (what, field)

  constructor (props) {
    super(props);
    this.state = {
      table: {
        page: 1,
        limit: isNaN(this.props.limit) ? 5 : this.props.limit,
        sort: {
          field: '',
          direction: 'asc'
        },
        filters: {
          date: 'all',
          type: 'all',
          category: 'all'
        }
      }
    };
    this.handlePageChange = this.handlePageChange.bind(this);
  }

  componentDidMount () {
    this.requestResults(this.props);
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps (newProps) {
    if (newProps.limit !== this.props.limit) {
      this.requestResults(newProps);
    }
  }

  requestResults (props) {
    props._getSurgeAlerts(this.state.table.page, this.getQs(props));
  }

  getQs (props) {
    let state = this.state.table;
    let qs = { limit: state.limit };
    if (state.sort.field) {
      qs.ordering = (state.sort.direction === 'desc' ? '-' : '') + state.sort.field;
    }
    if (state.filters.date !== 'all') {
      qs.created_at__gte = datesAgo[state.filters.date]();
    } else if (props.showRecent) {
      qs.created_at__gte = recentInterval;
    }

    if (!isNaN(props.emergency)) {
      qs.event = props.emergency.toString();
    }

    if (state.filters.type !== 'all') {
      qs.atype = state.filters.type;
    }
    if (state.filters.category !== 'all') {
      qs.category = state.filters.category;
    }
    return qs;
  }

  updateData (what) {
    this.requestResults(this.props);
  }

  render () {
    const {
      data,
      fetched,
      fetching,
      error
    } = this.props.surgeAlerts;

    const title = this.props.title || 'Latest Alerts';

    if (this.props.returnNullForEmpty &&
        (error || (fetching && !fetched) || (fetched && !data.results.length))) {
      return null;
    } else if (fetching || !fetched) {
      return <Fold title={title} id={this.props.id}><BlockLoading/></Fold>;
    } else if (error) {
      return <Fold title={title} id={this.props.id}><p>Surge alerts not available.</p></Fold>;
    }

    const headings = [
      {
        id: 'date',
        label: <FilterHeader id='date' title='Date' options={dateOptions} filter={this.state.table.filters.date} onSelect={this.handleFilterChange.bind(this, 'table', 'date')} />
      },
      {
        id: 'category',
        label: <FilterHeader id='category' title='Category' options={categoryOptions} filter={this.state.table.filters.category} onSelect={this.handleFilterChange.bind(this, 'table', 'category')} />
      },
      { id: 'emergency', label: 'Emergency' },
      { id: 'msg', label: 'Alert Message' },
      {
        id: 'type',
        label: <FilterHeader id='type' title='Type' options={typeOptions} filter={this.state.table.filters.type} onSelect={this.handleFilterChange.bind(this, 'table', 'type')} />
      }
    ];

    const rows = data.results.reduce((acc, rowData, idx, all) => {
      const isLast = idx === all.length - 1;
      const date = DateTime.fromISO(rowData.created_at);
      const event = get(rowData, 'event.id');
      acc.push({
        id: rowData.id,
        date: date.toISODate(),
        emergency: event ? <Link className='link--primary' to={`/emergencies/${event}`} title='View Emergency page'>{rowData.operation}</Link> : rowData.operation || nope,

        msg: isLoggedIn(this.props.user) ? <Expandable limit={128} text={rowData.message} /> : privateSurgeAlert,
        type: alertTypes[rowData.atype],
        category: alertCategories[rowData.category]
      });

      if (!isLast) {
        acc.push({
          rowOverride: <tr role='presentation' key={`${rowData.id}-empty`}><td colSpan='4'></td></tr>
        });
      }

      return acc;
    }, []);

    const foldLink = this.props.viewAll ? (<Link className='fold__title__link' to={this.props.viewAll}>{this.props.viewAllText || 'View all surge alerts'}</Link>) : null;

    return (
      <Fold title={`${title} (${data.count})`} id={this.props.id} navLink={foldLink} foldClass='fold__title--inline' extraClass='fold--main'>
        {this.props.showExport ? (
          <ExportButton filename='surge-alerts'
            qs={this.getQs(this.props)}
            resource='api/v2/surge_alert'
          />
        ) : null}
        <DisplayTable
          className='responsive-table alerts-table'
          headings={headings}
          rows={rows}
          pageCount={data.count / this.state.table.limit}
          page={this.state.table.page - 1}
          onPageChange={this.handlePageChange.bind(this, 'table')}
          noPaginate={this.props.noPaginate}
        />
      </Fold>
    );
  }
}

if (environment !== 'production') {
  AlertsTable.propTypes = {
    _getSurgeAlerts: T.func,
    surgeAlerts: T.object,

    limit: T.number,
    emergency: T.number,

    noPaginate: T.bool,
    showExport: T.bool,
    title: T.string,

    showRecent: T.bool,
    viewAll: T.string,
    viewAllText: T.string,
    returnNullForEmpty: T.bool,
    id: T.string
  };
}

// /////////////////////////////////////////////////////////////////// //
// Connect functions

const selector = (state) => ({
  surgeAlerts: state.surgeAlerts,
  user: state.user
});

const dispatcher = (dispatch) => ({
  _getSurgeAlerts: (...args) => dispatch(getSurgeAlerts(...args))
});

export default connect(selector, dispatcher)(AlertsTable);
