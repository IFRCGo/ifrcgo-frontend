import React from 'react';
import { _cs } from '@togglecorp/fujs';
import type { Location } from 'history';

import BlockLoading from '#components/block-loading';
import Page from '#components/Page';
import Pager from '#components/Pager';
import BreadCrumb from '#components/breadcrumb';
import Container from '#components/Container';
import Table from '#components/Table';
import {
  inCountryProjectColumns,
  nsProjectColumns,
  allProjectColumns,
} from '#views/Country/ThreeW/projectTableColumns';
import { projectKeySelector } from '#views/Country/ThreeW/common';
import LanguageContext from '#root/languageContext';
import {
  ListResponse,
  useRequest,
} from '#utils/restRequest';
import { Project } from '#types';

import styles from './styles.module.scss';

const ITEM_PER_PAGE = 20;

interface Props {
  className?: string;
  location: Location;
}

function NewThreeW(props: Props) {
  const {
    className,
    location,
  } = props;

  const [query, queryType] = React.useMemo(() => {
    let baseQuery;
    let queryType: 'country' | 'ns' | undefined;

    if (location?.search) {
      const [q1, q2] = location.search.split('=');

      if (q1 === '?country') {
        baseQuery = { country: q2 };
        queryType = 'country';
      }

      if (q1 === '?reporting_ns') {
        baseQuery = { reporting_ns :+q2 };
        queryType = 'ns';
      }
    }

    return [baseQuery, queryType] as const;
  }, [location?.search]);

  const { strings } = React.useContext(LanguageContext);
  const crumbs = React.useMemo(() => [
    // FIXME: use translations
    {link: location?.pathname, name: 'All 3W' },
    {link: '/', name: strings.breadCrumbHome},
  ], [strings.breadCrumbHome, location]);

  const [activePage, setActivePage] = React.useState(1);

  const {
    pending,
    response,
  } = useRequest<ListResponse<Project>>({
    url: 'api/v2/project/',
    query: {
      limit: ITEM_PER_PAGE,
      offset: ITEM_PER_PAGE * (activePage - 1),
      ...query,
    },
  });

  const columns = React.useMemo(() => {
    if (queryType === 'ns') {
      return nsProjectColumns;
    }

    if (queryType === 'country') {
      return inCountryProjectColumns;
    }

    return allProjectColumns;
  }, [queryType]);


  return (
    <Page
      className={_cs(styles.allThreeW, className)}
      title="IFRC Go - All 3W"
      breadCrumbs={<BreadCrumb crumbs={crumbs} compact />}
    >
      <Container
        className={styles.mainContent}
        heading={pending ? 'All 3W' : `All 3W (${response?.count})`}
      >
        {pending ? (
          <BlockLoading />
        ) : (
          <>
            <Table
              className={styles.projectsTable}
              data={response?.results}
              columns={columns}
              keySelector={projectKeySelector}
              variant="large"
            />
            {response && (
              <div className={styles.footer}>
                <Pager
                  activePage={activePage}
                  onActivePageChange={setActivePage}
                  itemsCount={response.count}
                  maxItemsPerPage={ITEM_PER_PAGE}
                />
              </div>
            )}
          </>
        )}
      </Container>
    </Page>
  );
}

export default NewThreeW;
