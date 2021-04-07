import React, { PropsWithChildren, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './app.scss'

const App = (props: PropsWithChildren<ReactNode>) => {
  return (
    <div className="app">
      <header>
        <div className="header-content">
          <h1>
            <Link to="/">Pontinho</Link>
          </h1>
        </div>
      </header>
      <div className="content">{props.children}</div>
      <footer>
        <div className="footer-content"></div>
      </footer>
    </div>
  )
}

export default App
