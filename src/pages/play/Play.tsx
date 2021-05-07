import React, { CSSProperties, useState, useEffect } from 'react'
import './play.scss'
import { IPlayer, Player } from '../../models/online/Player'
import Card from '../../models/online/Card'
import CardComponent from '../../components/card/Card'
import { DragDropContext, Droppable, Draggable, DropResult, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd'
import { IMatch, MatchStatus } from '../../models/online/Match'
import { IMatchRound } from '../../models/online/MatchRound'
import { RouteComponentProps } from 'react-router-dom'
import { FormEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Game } from '../../models/online/Game'

let ws: WebSocket

type TParams = { matchId: string }

function Play(props: RouteComponentProps<TParams>) {
  const { matchId } = props.match.params
  const [playerName, setPlayerName] = useState('')
  const [playerData, setPlayerData] = useState<IPlayer>()
  const [matchData, setMatchData] = useState<IMatch>()
  const [roundData, setRoundData] = useState<IMatchRound>()

  useEffect(() => {
    if (ws) {
      ws.onmessage = (e: MessageEvent) => onMessage(e, playerData)
    }
  }, [playerData])

  const start = async () => {
    const startMatchMessage = {
      type: 'START_MATCH',
      payload: {
        at: new Date(),
        matchId,
      },
    }

    ws.send(JSON.stringify(startMatchMessage))
  }

  const nextRound = async () => {
    const nextRoundMessage = {
      type: 'NEXT_ROUND',
      payload: {
        at: new Date(),
        matchId,
      },
    }

    ws.send(JSON.stringify(nextRoundMessage))
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
      if (playerData) {
        playerData.cards = reorder(playerData.cards, result.source.index, result.destination.index)
        setPlayerData({ ...playerData })
      }
      return
    }

    if (droppableId.startsWith('game')) {
      const cardId = result.draggableId
      const card = playerData?.cards.find(card => card.id === cardId)
      const gameId = droppableId.split('_')[1]

      if (card) {
        dropCards([card], gameId)
      }
    }
  }

  const discard = async (cardId: string) => {
    if (!playerData) {
      return
    }

    const discardCardMessage = {
      type: 'DISCARD_CARD',
      payload: {
        matchId,
        playerId: playerData.id,
        cardId,
      },
    }

    ws.send(JSON.stringify(discardCardMessage))
  }

  const dropCards = (cards: Card[], gameId: string) => {
    if (!roundData || !playerData) {
      return
    }

    const dropCardsMessage = {
      type: 'DROP_CARDS',
      payload: {
        at: new Date(),
        matchId,
        playerId: playerData.id,
        gameId,
        cards,
      },
    }

    ws.send(JSON.stringify(dropCardsMessage))
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

  const onClickCard = (card: Card) => {
    if (!playerData) {
      return
    }

    const { selectedCards } = playerData
    if (selectedCards.includes(card)) {
      playerData.selectedCards = selectedCards.filter(c => c !== card)
      setPlayerData({ ...playerData })
    } else {
      playerData.selectedCards.push(card)
      setPlayerData({ ...playerData })
    }
  }

  const onClickDiscardedCard = (card: Card) => {
    if (!roundData) {
      return
    }

    const { turn, table } = roundData
    const { selectedCards } = table

    if (selectedCards.length === 0) {
      if (!turn?.canBuy) {
        return
      }

      table.selectedCards.push(card)
      turn.canBuy = false
      turn.canDrop = true
    } else if (selectedCards.includes(card)) {
      table.selectedCards = selectedCards.filter(c => c !== card)
      turn.canBuy = true
      turn.canDrop = false
    }

    // round.selectDiscardedCard(card)
    setRoundData({ ...roundData })
  }

  const onClickDropGame = () => {
    if (!playerData || !roundData) {
      return
    }

    // round.playerDropGame()
    // setRoundData({ ...round })

    const cards = [...playerData.selectedCards, ...roundData.table.selectedCards]

    const dropGameMessage = {
      type: 'DROP_GAME',
      payload: {
        at: new Date(),
        matchId,
        playerId: playerData?.id,
        cards, //: playerData.selectedCards,
        // tableCards: roundData.table.selectedCards,
      },
    }

    ws.send(JSON.stringify(dropGameMessage))
  }

  const onClickBuyCard = async () => {
    if (!roundData || !roundData.turn.canBuy) {
      return
    }

    const buyCardMessage = {
      type: 'BUY_CARD',
      payload: {
        at: new Date(),
        matchId,
        playerId: playerData?.id,
      },
    }

    ws.send(JSON.stringify(buyCardMessage))
  }

  const onClickDiscard = () => {
    if (!playerData) {
      return
    }

    const { selectedCards } = playerData
    if (selectedCards.length === 1) {
      const cardId = selectedCards[0].id
      discard(cardId)
      // round.playerDiscardCard(cardId)
      // setRoundData({ ...round })
    }
  }

  const onClickGame = (gameId: string) => {
    if (!roundData || !playerData) {
      return
    }

    const cards = playerData.selectedCards
    dropCards(cards, gameId)

    // const { turn } = round
    // const cardsIds = turn.player.selectedCards.map(card => card.id)
    // round.playerDropCard(cardsIds, gameId)
    // setRoundData({ ...round })
  }

  const joinMatch = async (e: FormEvent) => {
    e.preventDefault()

    const playerId = uuidv4()
    const protocol = `${matchId}_${playerId}`
    // ws = new WebSocket('ws://localhost:8080', protocol)
    ws = new WebSocket('ws://lil-point-ws.herokuapp.com', protocol)

    ws.onopen = () => {
      const joinMessage = {
        type: 'JOIN_MATCH',
        payload: {
          at: new Date(),
          matchId,
          playerId,
          playerName,
        },
      }

      ws.send(JSON.stringify(joinMessage))

      setInterval(() => {
        ws.send(JSON.stringify({ type: 'KEEP_ALIVE' }))
        fetch('https://lil-point-ws.herokuapp.com/')
      }, 30000)
    }

    ws.onmessage = (e: MessageEvent) => {
      onMessage(e, playerData)
    }
  }

  const onMessage = (e: MessageEvent<string>, playerData?: IPlayer) => {
    console.log(e)

    let data
    try {
      data = JSON.parse(e.data)
    } catch (err) {
      return
    }

    console.log(data.type)
    console.log({ playerData })

    const updatePlayer = (payload: any) => {
      const player = payload.player as Player
      setPlayerData({ ...player })
    }

    const updateMatch = (payload: any) => {
      const match = payload.match as IMatch
      setMatchData({ ...match })

      if (match.currentRound) {
        setRoundData({ ...match.currentRound })
      }
    }

    const handleCardBought = (payload: any) => {
      const card = payload.card as Card

      if (playerData) {
        playerData.cards.push(card)
        setPlayerData({ ...playerData })
      }
    }

    const handleCardDiscarded = (payload: any) => {
      const remainingCards = payload.remainingCards as Card[]
      const remainingCardsIds = remainingCards.map(card => card.id)

      if (playerData) {
        playerData.cards = playerData.cards.filter(card => remainingCardsIds.includes(card.id))
        playerData.selectedCards = []
        setPlayerData({ ...playerData })
      }
    }

    const handleGameDropped = (payload: any) => {
      const game = payload.game as Game
      const cardsIds = game.cards.map(card => card.id)

      if (playerData) {
        playerData.cards = playerData.cards.filter(card => !cardsIds.includes(card.id))
        playerData.selectedCards = []
        setPlayerData({ ...playerData })
      }
    }

    const handleCardsDropped = (payload: any) => {
      const cards = payload.cards as Card[]
      const cardsIds = cards.map(card => card.id)

      if (playerData) {
        playerData.cards = playerData.cards.filter(card => !cardsIds.includes(card.id))
        playerData.selectedCards = []
        setPlayerData({ ...playerData })
      }
    }

    switch (data.type) {
      case 'JOINED_MATCH':
        console.log(data.payload)
        updatePlayer(data.payload)
        break
      case 'MATCH_UPDATED':
        console.log(data.payload)
        updateMatch(data.payload)
        break
      case 'PLAYER_UPDATED':
        console.log(data.payload)
        updatePlayer(data.payload)
        break
      case 'CARD_BOUGHT':
        console.log(data.payload)
        handleCardBought(data.payload)
        break
      case 'CARD_DISCARDED':
        console.log(data.payload)
        handleCardDiscarded(data.payload)
        break
      case 'GAME_DROPPED':
        console.log(data.payload)
        handleGameDropped(data.payload)
        break
      case 'CARDS_DROPPED':
        console.log(data.payload)
        handleCardsDropped(data.payload)
        break
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="play">
        <h2>Play</h2>

        {!matchData && (
          <form onSubmit={joinMatch} className="join-match">
            <p>
              <input
                type="text"
                value={playerName}
                placeholder="Nome do jogador"
                onChange={e => setPlayerName(e.target.value)}
                autoFocus
              />
              <button type="submit">Entrar na partida</button>
            </p>
          </form>
        )}

        {matchData && (
          <div className="match">
            {matchData.status === MatchStatus.created && <button onClick={start}>Iniciar</button>}
            {matchData.status === MatchStatus.started && (
              <button onClick={nextRound} disabled={!roundData?.hasEnded}>
                {roundData?.hasEnded ? 'Próximo round' : 'Em andamento'}
              </button>
            )}
            {matchData.status === MatchStatus.finished && <button disabled={true}>Nova partida</button>}
            <p>
              <span>Rounds: {matchData.rounds.length}</span>
              {matchData.players.map(player => {
                const isPlayerTurn = matchData.currentRound?.turn.player.id === player.id
                return (
                  <span key={player.id} className={isPlayerTurn ? 'player-turn' : ''}>
                    {player.name} - {player.score} pontos / {player.cards.length} cartas
                  </span>
                )
              })}
            </p>
          </div>
        )}

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
                    <div
                      className={`game ${
                        !roundData.turn.canDrop || playerData?.selectedCards.length === 0 ? 'disabled' : ''
                      }`}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      onClick={() => onClickGame(game.id)}
                    >
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

        {playerData && roundData && (
          <div className="player">
            <span>
              {playerData.name} ({playerData.cards.length} cartas)
            </span>

            {roundData.turn.player.id === playerData.id && (
              <span className="buttons">
                <button onClick={() => onClickBuyCard()} disabled={!roundData.turn.canBuy}>
                  Comprar carta
                </button>
                <button
                  onClick={() => onClickDropGame()}
                  disabled={
                    !roundData.turn.canDrop ||
                    playerData.selectedCards.length + roundData.table.selectedCards.length < 3
                  }
                >
                  Baixar jogo
                </button>
                <button
                  onClick={() => onClickDiscard()}
                  disabled={!roundData.turn.canDiscard || playerData.selectedCards.length !== 1}
                >
                  Descartar
                </button>
              </span>
            )}

            <Droppable droppableId={`player_${playerData.id}`} direction="horizontal">
              {(provided, snapshot) => (
                <div
                  className="deck"
                  ref={provided.innerRef}
                  style={getListStyle(snapshot.isDraggingOver)}
                  {...provided.droppableProps}
                >
                  {playerData.cards.map((card, index) => (
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
                            isSelected={playerData.selectedCards.includes(card)}
                            onClick={() => onClickCard(card)}
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

export default Play
