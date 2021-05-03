import React from 'react'
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom'

import App from './pages/app/App'
import Home from './pages/home/Home'
import Offline from './pages/offline/Offline'
import Play from './pages/play/Play'

const routes = (
  <React.StrictMode>
    <Router>
      <App>
        <Switch>
          <Route path="/" component={Home} exact />
          <Route path="/offline" component={Offline} exact />
          <Route path="/play/:matchId" component={Play} exact />
          <Redirect from="*" to="/" />
        </Switch>
      </App>
    </Router>
  </React.StrictMode>
)

export default routes
