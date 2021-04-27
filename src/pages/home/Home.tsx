import React, { CSSProperties, useState } from 'react'
import './home.scss'
import Player from '../../models/Player'
import Card from '../../models/Card'
import CardComponent from './../../components/card/Card'
import { DragDropContext, Droppable, Draggable, DropResult, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd'
import { Match, IMatch } from '../../models/Match'
import { MatchRound, IMatchRound } from '../../models/MatchRound'

let match: Match
let round: MatchRound

function Home() {
  const [matchData, setMatchData] = useState<IMatch>()
  const [roundData, setRoundData] = useState<IMatchRound>()

  const start = async () => {
    match = await new Match(['PlayerA', 'PlayerB']).start()
    round = match.currentRound

    setMatchData({ ...match })
    setRoundData({ ...round })
  }

  const nextRound = async () => {
    round = await match.nextRound()

    setMatchData({ ...match })
    setRoundData({ ...round })
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
      const player = match?.players.find(p => p.id === droppableId)
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

  const discard = async (cardId: string) => {
    if (!round) {
      return
    }

    round.playerDiscardCard(cardId)
    setRoundData({ ...round })
  }

  const dropCard = (cardId: string, gameId: string) => {
    if (!round) {
      return
    }

    round.playerDropCard(cardId, gameId)
    setRoundData({ ...round })
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
    if (!round) {
      return
    }

    const { selectedCards } = player
    if (selectedCards.includes(card)) {
      player.selectedCards = selectedCards.filter(c => c !== card)
      setRoundData({ ...round })
      // setPlayers([...players])
    } else {
      player.selectedCards.push(card)
      // setPlayers([...players])
      setRoundData({ ...round })
    }
  }

  const onClickDiscardedCard = (card: Card) => {
    if (!round) {
      return
    }

    round.selectDiscardedCard(card)
    setRoundData({ ...round })
  }

  const onClickDropGame = () => {
    if (!round) {
      return
    }

    round.playerDropGame()
    setRoundData({ ...round })
  }

  const onClickBuyCard = async () => {
    if (!round) {
      return
    }

    await round.playerBuyCard()
    setRoundData({ ...round })
  }

  const onClickDiscard = () => {
    if (!round) {
      return
    }

    const { selectedCards } = round.turn.player
    if (selectedCards.length === 1) {
      const cardId = selectedCards[0].id
      round.playerDiscardCard(cardId)
      setRoundData({ ...round })
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="home">
        <h2>Home</h2>

        {!matchData && <button onClick={start}>Iniciar</button>}

        {matchData && (
          <div className="match">
            <p>
              <span>Rounds: {matchData.rounds.length}</span>
              {matchData.players.map(player => (
                <span key={player.id}>
                  {player.name} - pontos: {player.score}
                </span>
              ))}
            </p>
          </div>
        )}

        {roundData?.hasEnded && <button onClick={nextRound}>Próximo round</button>}

        {roundData?.deck && (
          <div id="deck">
            <p>Cartas restantes: {roundData.deck.remaining}</p>
          </div>
        )}

        {roundData?.deck && roundData?.table && (
          <div id="table">
            <div className={`cards available ${roundData.turn.canBuy ? '' : 'disabled'}`}>
              {roundData.deck.remaining > 0 && <CardComponent onClick={() => onClickBuyCard()} />}
            </div>

            <Droppable droppableId="discard" direction="horizontal">
              {provided => (
                <div
                  className={`cards discarded ${roundData.turn.canBuy ? '' : 'disabled'}`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {roundData.table.discarded.map(card => (
                    <div key={card.id}>
                      <CardComponent
                        card={card}
                        isSelected={roundData.table.selectedCards.includes(card)}
                        onClick={() => onClickDiscardedCard(card)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Droppable>

            <div className="games">
              {roundData.table.games.map(game => (
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

        {roundData?.turn && (
          <div key={roundData.turn.player.id} className="player">
            <span>
              {roundData.turn.player.name} ({roundData.turn.player.numberOfCards} cartas)
            </span>
            <span className="buttons">
              <button onClick={() => onClickBuyCard()} disabled={!roundData.turn.canBuy}>
                Comprar carta
              </button>
              <button
                onClick={() => onClickDropGame()}
                disabled={
                  !roundData.turn.canDrop ||
                  roundData.turn.player.selectedCards.length + roundData.table.selectedCards.length < 3
                }
              >
                Baixar jogo
              </button>
              <button
                onClick={() => onClickDiscard()}
                disabled={!roundData.turn.canDiscard || roundData.turn.player.selectedCards.length !== 1}
              >
                Descartar
              </button>
            </span>
            <Droppable droppableId={`player_${roundData.turn.player.id}`} direction="horizontal">
              {(provided, snapshot) => (
                <div
                  className="deck"
                  ref={provided.innerRef}
                  style={getListStyle(snapshot.isDraggingOver)}
                  {...provided.droppableProps}
                >
                  {roundData.turn.player.cards.map((card, index) => (
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
                            isSelected={roundData.turn.player.selectedCards.includes(card)}
                            onClick={() => onClickCard(roundData.turn.player, card)}
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
