import React, { CSSProperties, useState } from 'react'
import Deck from '../../models/Deck'
import './home.scss'
import { v4 as uuidv4 } from 'uuid'
import Player from '../../models/Player'
import Card from '../../models/Card'
import CardComponent from './../../components/card/Card'
import { DragDropContext, Droppable, Draggable, DropResult, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd'
import Table from '../../models/Table'
import Turn from '../../models/Turn'
import Match from '../../models/Match'

let match: Match

function Home() {
  const [deck, setDeck] = useState<Deck>()
  const [players, setPlayers] = useState<Player[]>([])
  const [table, setTable] = useState<Table>({ games: [], discarded: [], selectedCards: [] })
  const [turn, setTurn] = useState<Turn>()

  const start = async () => {
    const deck = await new Deck().shuffle()
    setDeck(deck)

    const table: Table = { games: [], discarded: [], selectedCards: [] }
    setTable({ ...table })

    const createPlayers = () => {
      const player1 = new Player('Player1')
      const player2 = new Player('Player2')
      return [player1, player2]
    }

    const players = createPlayers()
    setPlayers(players)

    const assignPlayersCards = async () => {
      const totalOfCards = 3

      while (players[0].numberOfCards < totalOfCards || players[1].numberOfCards < totalOfCards) {
        for (const player of players) {
          if (player.numberOfCards < totalOfCards) {
            try {
              const card = await deck.drawCard()
              player.cards.push(card)
            } catch (err) {
              console.error(err)
            }
          }
        }
      }
    }

    await assignPlayersCards()
    setDeck(deck)

    match = new Match(players)
    const turn = match.startMatch()
    setTurn({ ...turn })
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

    let { droppableId } = result.destination

    if (droppableId === 'discard') {
      const cardId = result.draggableId
      discard(cardId)
      return
    }

    if (droppableId.startsWith('player')) {
      droppableId = droppableId.split('_')[1]
      const player = players.find(p => p.id === droppableId)
      if (player) {
        player.cards = reorder(player.cards, result.source.index, result.destination.index)
      }
      return
    }

    if (droppableId.startsWith('game')) {
      const cardId = result.draggableId
      const gameId = droppableId.split('_')[1]
      dropCard(cardId, gameId)
      return
    }
  }

  const discard = (cardId: string) => {
    if (!turn || !turn.canDrop) {
      return
    }

    const { player } = turn
    const card = player.cards.find(c => c.id === cardId)

    if (card) {
      table.discarded.push(card)
      table.selectedCards = []
      setTable({ ...table })

      player.cards = player.cards.filter(c => c.id !== cardId)
      player.selectedCards = []
      setPlayers([...players])

      const turn = match.nextTurn()
      setTurn({ ...turn })
    }
  }

  const dropCard = (cardId: string, gameId: string) => {
    if (!turn?.canDrop) {
      return
    }

    const game = table.games.find(g => g.id === gameId)

    const { player } = turn
    const card = player.cards.find(c => c.id === cardId)

    if (game && card) {
      const newGame = [...game.cards, card]
      const validGame = isGameValid(newGame)
      if (validGame) {
        game.cards = validGame
        setTable({ ...table })

        if (player) {
          player.cards = player.cards.filter(c => c.id !== cardId)
          setPlayers([...players])
        }
      }
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

    if (selectedCards.length === 0) {
      if (!turn?.canBuy) {
        return
      }
      table.selectedCards.push(card)
      setTable({ ...table })

      turn.canBuy = false
      turn.canDrop = true
      setTurn({ ...turn })
    } else if (selectedCards.includes(card)) {
      table.selectedCards = selectedCards.filter(c => c !== card)
      setTable({ ...table })

      if (turn) {
        turn.canBuy = true
        turn.canDrop = false
        setTurn({ ...turn })
      }
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

    player.cards = player.cards.filter(card => !player.selectedCards.includes(card))
    player.selectedCards = []
    setPlayers([...players])
  }

  const onClickBuyCard = async () => {
    if (!turn) {
      return
    }

    if (!turn.canBuy) {
      return
    }

    if (!deck) {
      return
    }

    try {
      const card = await deck.drawCard()
      turn.player.cards.push(card)
      setPlayers([...players])

      turn.canBuy = false
      turn.canDrop = true
      setTurn({ ...turn })

      setDeck(deck)
    } catch (err) {
      console.error(err)
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
            <div className={`cards available ${turn?.canBuy ? '' : 'disabled'}`}>
              {deck.remaining > 0 && <CardComponent onClick={() => onClickBuyCard()} />}
            </div>

            <Droppable droppableId="discard" direction="horizontal">
              {provided => (
                <div
                  className={`cards discarded ${turn?.canBuy ? '' : 'disabled'}`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
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

        {turn && (
          <div key={turn.player.id} className="player">
            <span>
              {turn.player.name} ({turn.player.numberOfCards} cartas)
            </span>
            <span>
              <button onClick={() => onClickDropGame(turn.player)} disabled={!turn.canDrop}>
                Baixar jogo
              </button>
            </span>
            <Droppable droppableId={`player_${turn.player.id}`} direction="horizontal">
              {(provided, snapshot) => (
                <div
                  className="deck"
                  ref={provided.innerRef}
                  style={getListStyle(snapshot.isDraggingOver)}
                  {...provided.droppableProps}
                >
                  {turn.player.cards.map((card, index) => (
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
                            isSelected={turn.player.selectedCards.includes(card)}
                            onClick={() => onClickCard(turn.player, card)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                </div>
              )}
            </Droppable>
          </div>
        )}
      </div>
    </DragDropContext>
  )
}

export default Home
