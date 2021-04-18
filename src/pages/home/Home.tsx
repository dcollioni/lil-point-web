import React, { CSSProperties, useState } from 'react'
import Deck from '../../models/Deck'
import './home.scss'
import { v4 as uuidv4 } from 'uuid'
import Player from '../../models/Player'
import Card from '../../models/Card'
import CardComponent from './../../components/card/Card'
import { DragDropContext, Droppable, Draggable, DropResult, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd'
import Table from '../../models/Table'
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
  const [table, setTable] = useState<Table>({ games: [], discarded: [], selectedCards: [] })

  const start = async () => {
    console.log('iniciar...')

    const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=2')
    const newDeck = await response.json()
    console.log(newDeck)

    const deck = { id: newDeck.deck_id, remaining: newDeck.remaining, cards: [] }
    setDeck({ ...deck })

    const table: Table = { games: [], discarded: [], selectedCards: [] }
    setTable({ ...table })

    const createPlayers = () => {
      const player1: Player = {
        id: uuidv4(),
        name: 'Player 1',
        deck: { id: uuidv4(), remaining: 0, cards: [] },
        selectedCards: [],
      }
      const player2: Player = {
        id: uuidv4(),
        name: 'Player 2',
        deck: { id: uuidv4(), remaining: 0, cards: [] },
        selectedCards: [],
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

    console.log(result)
    let { droppableId } = result.destination

    if (droppableId === 'discard') {
      const cardId = result.draggableId
      const playerId = result.source.droppableId.split('_')[1]
      const player = players.find(p => p.id === playerId)
      const card = player?.deck.cards.find(c => c.id === cardId)

      if (card) {
        table.discarded.push(card)
        table.selectedCards = []
        setTable({ ...table })

        if (player) {
          player.deck.cards = player.deck.cards.filter(c => c.id !== cardId)
          player.deck.remaining = player.deck.cards.length
          player.selectedCards = []
          setPlayers([...players])
        }
      }
      return
    }

    if (droppableId.startsWith('player')) {
      droppableId = droppableId.split('_')[1]
      const player = players.find(p => p.id === droppableId)
      if (player) {
        player.deck.cards = reorder(player.deck.cards, result.source.index, result.destination.index)
      }
      return
    }

    if (droppableId.startsWith('game')) {
      droppableId = droppableId.split('_')[1]
      const game = table.games.find(g => g.id === droppableId)

      const cardId = result.draggableId
      const playerId = result.source.droppableId.split('_')[1]
      const player = players.find(p => p.id === playerId)
      const card = player?.deck.cards.find(c => c.id === cardId)

      if (game && card) {
        const newGame = [...game.cards, card]
        const validGame = isGameValid(newGame)
        if (validGame) {
          game.cards = validGame
          setTable({ ...table })

          if (player) {
            player.deck.cards = player.deck.cards.filter(c => c.id !== cardId)
            player.deck.remaining = player.deck.cards.length
            setPlayers([...players])
          }
        }
      }
      return
    }
  }

  const grid = 8

  const getItemStyle = (
    isDragging: boolean,
    draggableStyle: DraggingStyle | NotDraggingStyle | undefined,
  ): CSSProperties => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    // padding: grid * 2,
    // margin: `0 ${grid}px 0 0`,

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

  const onClickDiscardedCard = (card: Card) => {
    const { selectedCards } = table
    if (selectedCards.includes(card)) {
      table.selectedCards = selectedCards.filter(c => c !== card)
      setTable({ ...table })
    } else {
      table.selectedCards.push(card)
      setTable({ ...table })
    }
  }

  const onClickDropGame = (player: Player) => {
    const { selectedCards: tableSelectedCards } = table
    const { selectedCards } = player
    const validGame = isGameValid([...selectedCards, ...tableSelectedCards])

    if (!validGame) {
      return
    }

    table.games.push({ id: uuidv4(), cards: validGame })
    table.discarded = table.discarded.filter(card => !table.selectedCards.includes(card))
    table.selectedCards = []
    setTable({ ...table })

    player.deck.cards = player.deck.cards.filter(card => !player.selectedCards.includes(card))
    player.deck.remaining = player.deck.cards.length
    player.selectedCards = []
    setPlayers([...players])
  }

  const onClickTakeCard = async (player: Player) => {
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
      setPlayers([...players])

      if (deck) {
        deck.remaining = remaining
        setDeck({ ...deck })
      }
    }
  }

  const isGameValid = (cards: Card[]) => {
    if (cards.length < 3) {
      return false
    }

    let sortedCards = [...cards].sort(sortBySuit).sort(sortByValue)
    console.log(sortedCards)

    const uniqueSuits = new Set(sortedCards.map(card => card.suit))
    if (uniqueSuits.size === 1) {
      const validSequence = '01-02-03-04-05-06-07-08-09-10-11-12-13-14'
      const values = sortedCards.map(card => card.value.toString().padStart(2, '0')).join('-')
      console.log(values)

      if (!validSequence.includes(values)) {
        const ace = sortedCards.find(card => card.value === 1)

        if (!ace) {
          return false
        }

        if (ace) {
          ace.value = 14
          sortedCards = sortedCards.sort(sortByValue)
          const values = sortedCards.map(card => card.value.toString().padStart(2, '0')).join('-')
          console.log(values)

          if (!validSequence.includes(values)) {
            return false
          }
        }
      }
    } else if (uniqueSuits.size === 3) {
      const uniqueValues = new Set(sortedCards.map(card => card.value))
      if (uniqueValues.size > 1) {
        return false
      }
    } else {
      return false
    }

    return sortedCards
  }

  const sortBySuit = (a: Card, b: Card) => {
    if (a.suit < b.suit) {
      return -1
    }
    if (a.suit > b.suit) {
      return 1
    }
    return 0
  }

  const sortByValue = (a: Card, b: Card) => {
    if (a.value < b.value) {
      return -1
    }
    if (a.value > b.value) {
      return 1
    }
    return 0
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="home">
        <h2>Home</h2>
        <button onClick={start}>Iniciar</button>

        {deck && (
          <div id="deck">
            <p>Cartas restantes: {deck.remaining}</p>
          </div>
        )}

        {deck && table && (
          <div id="table">
            <div className="cards available">{deck.remaining > 0 && <CardComponent />}</div>

            <Droppable droppableId="discard" direction="horizontal">
              {provided => (
                <div className="cards discarded" ref={provided.innerRef} {...provided.droppableProps}>
                  {table.discarded.map(card => (
                    <div key={card.id}>
                      <CardComponent
                        card={card}
                        isSelected={table.selectedCards.includes(card)}
                        onClick={() => onClickDiscardedCard(card)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Droppable>

            <div className="games">
              {table.games.map(game => (
                <Droppable droppableId={`game_${game.id}`} direction="horizontal" key={game.id}>
                  {provided => (
                    <div className="game" ref={provided.innerRef} {...provided.droppableProps}>
                      {game.cards.map(card => (
                        <CardComponent key={card.id} card={card} />
                      ))}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>
        )}

        {players.map(player => (
          <div key={player.id} className="player">
            <span>
              {player.name} ({player.deck.remaining} cartas)
            </span>
            <span>
              <button onClick={() => onClickDropGame(player)}>Baixar jogo</button>
              <button onClick={() => onClickTakeCard(player)}>Comprar carta</button>
            </span>
            <Droppable droppableId={`player_${player.id}`} direction="horizontal">
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
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}

export default Home
