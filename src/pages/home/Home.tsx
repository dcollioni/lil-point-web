import React, { FormEvent, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { IMatch } from '../../models/online/Match'
import './home.scss'

let ws: WebSocket

function Home() {
  const [matches, setMatches] = useState<IMatch[]>([])

  useEffect(() => {
    const connect = () => {
      console.log('connecting...')
      // ws = new WebSocket('ws://localhost:8080')
      ws = new WebSocket('ws://lil-point-ws.herokuapp.com')

      ws.onmessage = e => {
        const message = JSON.parse(e.data)

        switch (message.type) {
          case 'AVAILABLE_MATCHES':
            setMatches([...message.payload.matches])
            break
        }

        console.log(e.data)
      }
    }
    connect()
  }, [])

  const createMatch = async (e: FormEvent) => {
    e.preventDefault()
    const message = {
      type: 'CREATE_MATCH',
      payload: {
        at: new Date(),
        numberOfPlayers: 2,
      },
    }

    ws.send(JSON.stringify(message))

    // const res = await fetch('http://localhost:3001/match', {
    //   method: 'post',
    //   body: JSON.stringify(payload),
    //   headers: { 'Content-Type': 'application/json' },
    // })

    // const match = await res.json()
    // console.log(match)
  }

  return (
    <div className="home">
      <h2>Home</h2>

      <form onSubmit={createMatch} className="create-match">
        <p>
          <button type="submit">Criar partida</button>
        </p>
      </form>

      {matches.length > 0 && (
        <ul>
          {matches.map(match => (
            <li key={match.id}>
              <Link to={`play/${match.id}`}>{match.id}</Link> {match.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Home
