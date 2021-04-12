import React, { useState } from 'react'
import Deck from '../../models/Deck'
import './home.scss'
import { v4 as uuidv4 } from 'uuid'
import Player from '../../models/Player'
import Card from '../../models/Card'
import CardComponent from './../../components/card/Card'
const { fetch } = window

const mapCardValue = (value: string): number => {
  switch (value) {
    case 'ACE':
      return 1
    case 'JACK':
      return 11
    case 'QUEEN':
      return 12
    case 'KING':
      return 13
    default:
      return parseInt(value, 10)
  }
}

function Home() {
  const [deck, setDeck] = useState<Deck>()
  const [players, setPlayers] = useState<Player[]>([])

  const start = async () => {
    console.log('iniciar...')

    const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=2')
    const newDeck = await response.json()
    console.log(newDeck)

    const deck = { id: newDeck.deck_id, remaining: newDeck.remaining, cards: [] }
    setDeck(deck)

    const createPlayers = () => {
      const player1: Player = { id: uuidv4(), name: 'Player 1', deck: { id: uuidv4(), remaining: 0, cards: [] } }
      const player2: Player = { id: uuidv4(), name: 'Player 2', deck: { id: uuidv4(), remaining: 0, cards: [] } }
      return [player1, player2]
    }

    const players = createPlayers()
    setPlayers(players)

    const assignPlayersCards = async () => {
      const totalOfCards = 11

      while (players[0].deck.remaining < totalOfCards || players[1].deck.remaining < totalOfCards) {
        for (const player of players) {
          if (player.deck.remaining < totalOfCards) {
            const response = await fetch(`https://deckofcardsapi.com/api/deck/${deck?.id}/draw/?count=1`)
            if (response.ok) {
              const { cards, remaining } = await response.json()
              const drawnCard = cards[0]

              const card: Card = {
                id: uuidv4(),
                code: drawnCard.code,
                image: drawnCard.image,
                name: drawnCard.value,
                suit: drawnCard.suit,
                value: mapCardValue(drawnCard.value),
              }
              // console.log(card)

              player.deck.cards.push(card)
              player.deck.remaining = player.deck.cards.length

              if (deck) {
                deck.remaining = remaining
              }
            }
          }
        }
      }
    }

    await assignPlayersCards()

    setDeck({ ...deck, remaining: deck.remaining })
  }

  return (
    <div className="home">
      <h2>Home</h2>
      <button onClick={start}>Iniciar</button>

      {deck && (
        <div id="deck">
          <p>Cartas restantes: {deck.remaining}</p>
        </div>
      )}

      {players.map(player => (
        <div key={player.id} className="player">
          {player.name} ({player.deck.remaining} cartas)
          <div className="deck">
            {player.deck.cards.map(card => (
              <CardComponent key={card.id} card={card} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Home
