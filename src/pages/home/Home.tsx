import React, { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import './home.scss'

let ws: WebSocket

function Home() {
  const [matchId, setMatchId] = useState('')
  const [joinMatchId, setJoinMatchId] = useState('')
  const [playerName, setPlayerName] = useState('')

  const createMatch = async (e: FormEvent) => {
    e.preventDefault()
    const payload = { numberOfPlayers: 2 }

    const res = await fetch('http://localhost:3001/match', {
      method: 'post',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })

    const match = await res.json()
    console.log(match)

    setMatchId(match.id)
  }

  const joinMatch = async (e: FormEvent) => {
    e.preventDefault()
    const payload = { name: playerName }

    const res = await fetch(`http://localhost:3001/match/${joinMatchId}/join`, {
      method: 'post',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })

    const player = await res.json()
    console.log(player)

    ws = new WebSocket('ws://localhost:8080', joinMatchId)

    ws.onopen = () => {
      const connectMessage = {
        type: 'CONNECT',
        payload: {
          matchId: joinMatchId,
          playerId: player.id,
        },
      }

      ws.send(JSON.stringify(connectMessage))
    }

    ws.onmessage = e => {
      console.log(e.data)
    }
  }

  return (
    <div className="home">
      <h2>Home</h2>

      <form onSubmit={createMatch} className="create-match">
        <p>
          <button type="submit">Criar partida</button>
          {matchId && (
            <span>
              ID da partida: <Link to={`play/${matchId}`}>{matchId}</Link>
            </span>
          )}
        </p>
      </form>

      <form onSubmit={joinMatch} className="join-match">
        <p>
          <input
            type="text"
            value={joinMatchId}
            placeholder="ID da partida"
            onChange={e => setJoinMatchId(e.target.value)}
          />
          <input
            type="text"
            value={playerName}
            placeholder="Nome do jogador"
            onChange={e => setPlayerName(e.target.value)}
          />
          <button type="submit">Entrar na partida</button>
        </p>
      </form>
    </div>
  )
}

export default Home
