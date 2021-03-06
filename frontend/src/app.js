import PropTypes from 'prop-types';
import React from 'react';

import { Instances } from './instances';
import { VPLIST, HELP_LINK, HELP_TEXT } from './config';

import { formatMoneyAnnual, formatMoneyAnnualIcon, formatName } from './formats';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import Analytics from './analytics';
import { isOwnedBy } from './util';


Analytics.setup();


const TopBar = ({timePeriod}) => {
  const home_url = "/"+timePeriod+"/allocation/";
  return (
    <header>
    <a href={home_url} onClick={() => Analytics.record({
      name: 'click',
      attributes: { target: 'logo' }
    })}>
      <img src={"/"+timePeriod+"/public/logo.svg"} alt="CPE logo" height="40px" />
    </a>
    <span className="title">Cloud Efficiency</span>
    <span className="title hd-only">c-type Rightsizing</span>
    <span className="title hd-only">
      <a href="https://github.com/Symantec/cloudefficiency/issues" target="_blank" onClick={() => Analytics.record({
        name: 'click',
        attributes: { target: 'issues' }
      })}><span>Issues</span><i className="fab fa-github"></i></a>
    </span>
    </header>
  );
};
const BottomBar = () => (
  <footer>
    <i className="far fa-copyright hd-only"></i>
    <span className="hd-only">2018 CPE</span>
      <a href={HELP_LINK} target="_blank" target="_blank" onClick={() => Analytics.record({
        name: 'click',
        attributes: { target: 'help' }
      })}>{HELP_TEXT}</a>
  </footer>
);
const User = ({user, timePeriod}) => {
  let url = `/${timePeriod}/allocation/${user.user_saml_name}.html`;
  return (
    <div className="content-wrapper zebra-container">
      <span className="a-wrapper"><a href={url} onClick={() => Analytics.record({
        name: 'click',
        attributes: {
            target: 'teammember',
            targetUser: user.user_saml_name
        }
      })}>{formatName(user.user_saml_name)}</a></span>
      <span>{formatMoneyAnnualIcon(user.org_waste, user.org_instance_count, true)}</span>
    </div>
  );
}

const UserSelect = ({targetUser, manager, users, timePeriod}) => {
  let userSection;
  let totalWaste;
  let totalInstanceCount;
  let manager_el
  if (manager) {
    let manager_url = `/${timePeriod}/allocation/${manager}.html`;
    manager_el = (<span>Manager: <a href={manager_url} onClick={() => Analytics.record({
        name: 'click',
        attributes: {
            target: 'manager',
            targetUser: manager.user_saml_name
        }
    })}><span className="manager-link">{formatName(manager)}</span></a></span>);
  }
  if (targetUser) {
    userSection = (
      <React.Fragment>
        <h3>{formatName(targetUser.user_saml_name)}</h3>
        <div>
          <span className="mobile-only">Can save: </span>
          <span className="hd-only">Personal potential annual savings: </span>
          <span>{formatMoneyAnnualIcon(targetUser.waste, targetUser.instance_count, true)}</span>
        </div>
        <div>{manager_el}</div>
      </React.Fragment>
    );
    totalWaste = targetUser.org_waste;
    totalInstanceCount = targetUser.org_instance_count;
  } else {
    userSection = (<h3>Leadership Team</h3>);
    totalWaste = users.map((u) => u.org_waste).reduce((a, b) => a + b, 0);
    totalInstanceCount = users.map((u) => u.org_instance_count).reduce((a, b) => a + b, 0);
  }
  let users_ordered = users.sort((a,b) => {
    if (a.org_waste !== b.org_waste) {
      return b.org_waste - a.org_waste;
    }
    return a.user_saml_name.localeCompare(b.user_saml_name);
  });
  let tooltip;
  if (targetUser) {
    tooltip = (
      <Tooltip id="tooltip">
        You are looking at Annualized potential savings based on the 10 day period ending at {timePeriod} for {formatName(targetUser.user_saml_name)}
        { users.length > 0 && ' and team.' }
        {' ' + formatName(targetUser.user_saml_name)}'s personal potential savings 
        { users.length > 0 && ' plus their team\'s' } = {formatMoneyAnnual(totalWaste)}.
      </Tooltip>
    );
  } else {
    tooltip = (
      <Tooltip id="tooltip">
        You are looking at Annualized potential savings based on the 10 day period ending at {timePeriod} for the leadership group.
      </Tooltip>
    );
  }
  return (
    <div id="user-select">
      <div className="top-section">
        {userSection}
        <OverlayTrigger onMouseOver={() => Analytics.record({
          name: 'tooltip',
          attributes: { target: 'leadership' }
        })} placement="bottom" overlay={tooltip}>
        <i className="far fa-question-circle"></i>
        </OverlayTrigger>
      </div>
    { users.length > 0 && 
        <div className="user-section">
          <span>{targetUser ? 'Direct Reports' : 'Team Members'}</span>
          <span>Potential Annual Savings</span>
          {users_ordered.map((user) => <User user={user} key={user.user_saml_name} timePeriod={timePeriod} />)}
          <span>Team Total:</span>
          <span>{formatMoneyAnnualIcon(totalWaste, totalInstanceCount, true)}</span>
        </div>
    }
    </div>
  );
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      is_loaded: false
    };
  }
  loadAllInstances(callback) {
    let req = new XMLHttpRequest();
    req.responseType = 'json';
    req.addEventListener("load", () => {
      callback(req.response)
    });
    req.open("GET", `/${this.props.timePeriod}/public/allInstances.json`, true);
    req.send();
  }
  componentDidMount() {
    if (this.props.isClient) {
      let env = this.props.env || 'dev';
      console.log('env:' + env);
      Analytics.defaultInfo({
        userName: window.userName,
        timePeriod: window.timePeriod,
        env: env
      })
      Analytics.record({ name: 'AppMount'});
      this.loadAllInstances((instances) => {
        this.setState({
          allInstances: instances,
          is_loaded: true
        });
      });
    }
  }
  render() {
    let {selectedUser, allUsers, initialInstances, instanceHeaders, timePeriod, isClient} = this.props;
    let userNames = VPLIST;
    let targetUser;
    let manager;
    if (selectedUser) {
      if (!(selectedUser in allUsers)) {
        console.error('UKNOWN USER:' + selectedUser);
      } else {
        targetUser = allUsers[selectedUser];
        userNames = (targetUser.reports || []);
        if (targetUser.manager in allUsers) {
          manager = targetUser.manager;
        }
      }
    }
    let users = userNames.map((name) => {
      if (!(name in allUsers)) {
        console.error('UNKNOWN REPORT:' + name);
        return undefined;
      }
      return allUsers[name];
    }).filter((x) => x);
    let ownerNames = users.map((u) => u.user_saml_name)
    if (targetUser) {
      ownerNames.push(targetUser.user_saml_name);
    }
    let instances = initialInstances;
    if (this.state.is_loaded) {
      instances = this.state.allInstances;
      if (targetUser) {
        instances = this.state.allInstances.filter(i => isOwnedBy(i, [targetUser.user_saml_name]));
      }
    }

    return (
      <React.Fragment>
        <TopBar timePeriod={timePeriod} />
        <UserSelect targetUser={targetUser} manager={manager} users={users} timePeriod={timePeriod} />
        <Instances is_loaded={this.state.is_loaded} instances={instances} instanceHeaders={instanceHeaders} timePeriod={timePeriod} />
        <BottomBar />
      </React.Fragment>
    );
  }
};

let userShape = PropTypes.shape({
  cost: PropTypes.number.isRequired,
  org_cost: PropTypes.number.isRequired,
  org_waste: PropTypes.number.isRequired,
  org_instance_count: PropTypes.number.isRequired,
  instance_count: PropTypes.number.isRequired,
  reports: PropTypes.arrayOf(PropTypes.string.isRequired),
  user_saml_name: PropTypes.string.isRequired,
  waste: PropTypes.number.isRequired
})

App.propTypes = {
  selectedUser: PropTypes.string,
  allUsers: PropTypes.objectOf(userShape).isRequired,
  initialInstances: PropTypes.array.isRequired,
  instanceHeaders: PropTypes.object.isRequired,
  timePeriod: PropTypes.string.isRequired,
  env: PropTypes.string.isRequired,
  isClient: PropTypes.bool
};

export default App;

