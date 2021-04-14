import React, { CSSProperties, useState } from 'react'
import Deck from '../../models/Deck'
import './home.scss'
import { v4 as uuidv4 } from 'uuid'
import Player from '../../models/Player'
import Card from '../../models/Card'
import CardComponent from './../../components/card/Card'
import { DragDropContext, Droppable, Draggable, DropResult, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd'
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
  // const [selectedCards, setSelectedCards] = useState<Card[]>([])

  const start = async () => {
    console.log('iniciar...')

    const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=2')
    const newDeck = await response.json()
    console.log(newDeck)

    const deck = { id: newDeck.deck_id, remaining: newDeck.remaining, cards: [] }
    setDeck(deck)

    const createPlayers = () => {
      const player1: Player = {
        id: uuidv4(),
        name: 'Player 1',
        deck: { id: uuidv4(), remaining: 0, cards: [] },
        selectedCards: [],
        games: [],
      }
      const player2: Player = {
        id: uuidv4(),
        name: 'Player 2',
        deck: { id: uuidv4(), remaining: 0, cards: [] },
        selectedCards: [],
        games: [],
      }
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

  const reorder = (list: Card[], startIndex: number, endIndex: number) => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    return result
  }

  const onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
      return
    }

    console.log({ result })
    const { droppableId } = result.destination
    const player = players.find(p => p.id === droppableId)

    if (player) {
      player.deck.cards = reorder(player.deck.cards, result.source.index, result.destination.index)
    }

    // setPlayers([...players])
  }

  const grid = 8

  const getItemStyle = (
    isDragging: boolean,
    draggableStyle: DraggingStyle | NotDraggingStyle | undefined,
  ): CSSProperties => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    // padding: grid * 2,
    margin: `0 ${grid}px 0 0`,

    // change background colour if dragging
    background: isDragging ? 'transparent' : 'transparent',

    // styles we need to apply on draggables
    ...draggableStyle,
  })

  const getListStyle = (isDraggingOver: boolean) => ({
    background: isDraggingOver ? 'transparent' : 'transparent',
    display: 'flex',
    padding: grid,
    overflow: 'auto',
  })

  const onClickCard = (player: Player, card: Card) => {
    const { selectedCards } = player
    if (selectedCards.includes(card)) {
      player.selectedCards = selectedCards.filter(c => c !== card)
      setPlayers([...players])
    } else {
      player.selectedCards.push(card)
      setPlayers([...players])
    }
  }

  const onClickDropGame = (player: Player) => {
    const { selectedCards } = player
    player.games.push(selectedCards)
    player.deck.cards = player.deck.cards.filter(card => !player.selectedCards.includes(card))
    player.deck.remaining = player.deck.cards.length
    player.selectedCards = []
    setPlayers([...players])
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
          <span>
            {player.name} ({player.deck.remaining} cartas)
          </span>
          <span>
            <button onClick={() => onClickDropGame(player)}>Baixar jogo</button>
          </span>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId={player.id} direction="horizontal">
              {(provided, snapshot) => (
                <div
                  className="deck"
                  ref={provided.innerRef}
                  style={getListStyle(snapshot.isDraggingOver)}
                  {...provided.droppableProps}
                >
                  {player.deck.cards.map((card, index) => (
                    <Draggable key={card.id} draggableId={card.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          key={card.id}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                        >
                          <CardComponent
                            card={card}
                            isSelected={player.selectedCards.includes(card)}
                            onClick={() => onClickCard(player, card)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <div className="games">
            {player.games.map(game => (
              <div className="game" key={game[0].id}>
                {game.map(card => (
                  <CardComponent key={card.id} card={card} />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Home
