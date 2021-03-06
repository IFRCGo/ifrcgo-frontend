
import React from 'react';
import { connect } from 'react-redux';
import { PropTypes as T } from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { isMobileOnly } from 'react-device-detect';
import { environment } from '#config';
import { logoutUser } from '#actions';
import DropdownMenu from '#components/dropdown-menu';

import LanguageContext from '#root/languageContext';
import Translate from '#components/Translate';

class UserMenu extends React.Component {
  onLogoutClick (e) {
    e.preventDefault();
    this.props._logoutUser();
    window.location.reload();
  }

  render () {
    // Displays dropdown menu on non-mobile screens and a single logout button for the mobile menu
    const { strings } = this.context;
    const { userData } = this.props;
    if (userData.username && !isMobileOnly) {
      return (
        <DropdownMenu
          className='drop__toggle drop__toggle--caret page__meta-nav-elements-borderless'
          activeClassName='active'
          label={
            <span title={strings.userMenuAccess}>
              {`${userData.firstName} ${userData.lastName}`}
            </span>
          }
        >
          <div className='drop__title drop__title--page__meta-nav'>
            <Translate
              stringId="userMenuPopupHeading"
              params={{
                firstName: userData.firstName,
                lastName: userData.lastName,
              }}
            />
          </div>
          <ul className='drop__menu drop__menu--page__meta-nav' role='menu'>
            <li>
              <Link
                to='/account' title={strings.userMenuViewAccount}
                className='drop__menu-item'
              >
                <Translate stringId='userMenuAccount'/>
              </Link>
            </li>
            <li>
              <a
                href='#' title={strings.userMenuLogout}
                onClick={this.onLogoutClick.bind(this)}
                className='drop__menu-item'
              >
                <Translate stringId='userMenuLogout'/>
              </a>
            </li>
          </ul>
        </DropdownMenu>
      );
    } else if (userData.username && isMobileOnly) {
      return (
        <ul className='drop__menu drop__menu--page__meta-nav' role='menu'>
          <li className='drop__menu-item'><a href='#' title={strings.userMenuLogout} className='drop__menu-item' data-hook='dropdown:close' onClick={this.onLogoutClick.bind(this)}><Translate stringId='userMenuLogout'/></a></li>
        </ul>
      );
    }

    return [
      <Link key='login' to={{pathname: '/login', state: {from: this.props.location}}} title={strings.userMenuLogin} className='page__meta-nav-elements'><Translate stringId='userMenuLogin'/></Link>,
      <Link key='register' to='/register' title={strings.userMenuRegister} className='page__meta-nav-elements-borderless'><Translate stringId='userMenuRegister'/></Link>
    ];
  }
}

if (environment !== 'production') {
  UserMenu.propTypes = {
    _logoutUser: T.func,
    history: T.object,
    userData: T.object,
    location: T.object
  };
}

// /////////////////////////////////////////////////////////////////// //
// Connect functions

const selector = (state) => ({
  userData: state.user.data
});

const dispatcher = (dispatch) => ({
  _logoutUser: (...args) => dispatch(logoutUser(...args))
});
UserMenu.contextType = LanguageContext;

export default withRouter(connect(selector, dispatcher)(UserMenu));
