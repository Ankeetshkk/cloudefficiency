import PropTypes from 'prop-types';
import React from 'react';

const HTMLTemplate = ({ body, title }) => {
  const hydrate_js = {__html: `hydrate(
          React.createElement(App, {
            'selectedUser': window.userName,
            'allUsers': window.allUsersDict,
            'allInstances': window.allInstances,
            'timePeriod': window.timePeriod
          }, null),
          document.getElementById('root')
        );` }
  return (
    //<!DOCTYPE html>
    <html>
      <head>
        <title>{title}</title>
        <link rel="stylesheet" href="/public/index.css" />
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.2.0/css/all.css" integrity="sha384-hWVjflwFxL6sNzntih27bfxkr27PmbbK/iSvJ+a4+0owXq79v+lsFkW54bOGbiDQ" crossorigin="anonymous" />


        <meta name="viewport" content="width=device-width,initial-scale=1"></meta>
      </head>
      <body>
        <div id="root">{body}</div>
      </body>
      <script src="/public/bundle.js"></script>
      <script dangerouslySetInnerHTML={hydrate_js}>
      </script>
    </html>
  );
};

HTMLTemplate.propTypes = {
  title: PropTypes.string.isRequired,
  body: PropTypes.element.isRequired
};

export default HTMLTemplate;