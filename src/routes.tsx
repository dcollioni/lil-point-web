import React from 'react'
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom'

import App from './pages/app/App'
import Home from './pages/home/Home'

const routes = (
  <React.StrictMode>
    <Router>
      <App>
        <Switch>
          <Route path="/" component={Home} exact />
          <Redirect from="*" to="/" />
        </Switch>
      </App>
    </Router>
  </React.StrictMode>
)

export default routes
