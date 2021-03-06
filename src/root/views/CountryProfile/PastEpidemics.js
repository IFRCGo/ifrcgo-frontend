import React from 'react';
import _cs from 'classnames';

import IndicatorOutput from './IndicatorOutput';
import Translate from '#components/Translate';


class PastEpidemics extends React.PureComponent {
  render () {
    const {
      className,
      events,
    } = this.props;

    return (
      <div className={_cs(className, 'overview-past-epidemics')}>
        <h3 className='tc-heading'>
          <Translate stringId='pastEpidemicsTitle'/>
        </h3>
        <div className='tc-content'>
          { events.map(e => (
            <IndicatorOutput
              key={e.id}
              label={e.epidemic}
              value={`${e.month_display} ${e.year}`}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default PastEpidemics;
