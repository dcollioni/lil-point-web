import React, { CSSProperties, useState, useEffect } from 'react'
import './play.scss'
import { IPlayer } from '../../models/online/Player'
import Card from '../../models/online/Card'
import CardComponent from '../../components/card/Card'
import { DragDropContext, Droppable, Draggable, DropResult, DraggingStyle, NotDraggingStyle } from 'react-beautiful-dnd'
import { IMatch, MatchStatus } from '../../models/online/Match'
import { MatchRound, IMatchRound } from '../../models/online/MatchRound'
import { RouteComponentProps } from 'react-router-dom'
import { FormEvent } from 'react'

let ws: WebSocket
let round: MatchRound

type TParams = { matchId: string }

function Play(props: RouteComponentProps<TParams>) {
  const { matchId } = props.match.params
  const [playerName, setPlayerName] = useState('')
  const [playerData, setPlayerData] = useState<IPlayer>()
  const [matchData, setMatchData] = useState<IMatch>()
  const [roundData, setRoundData] = useState<IMatchRound>()

  useEffect(() => {
    if (ws && playerData) {
      ws.onmessage = (e: MessageEvent) => onMessage(e, playerData)
    }
  }, [playerData])

  const start = async () => {
    // match = await new Match(['PlayerA', 'PlayerB']).start()
    // round = match.currentRound
    // setMatchData({ ...match })
    // setRoundData({ ...round })
    await fetch(`http://localhost:3001/match/${matchId}/start`, { method: 'post' })
  }

  const nextRound = async () => {
    // round = await match.nextRound()
    // setMatchData({ ...match })
    // setRoundData({ ...round })
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
      // droppableId = droppableId.split('_')[1]
      // const player = matchData?.players.find(p => p.id === droppableId)
      if (playerData) {
        playerData.cards = reorder(playerData.cards, result.source.index, result.destination.index)
        setPlayerData({ ...playerData })
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
    if (!playerData) {
      return
    }

    // round.playerDiscardCard(cardId)
    // setRoundData({ ...round })

    const res = await fetch(`http://localhost:3001/match/${matchId}/discard/${cardId}`, { method: 'post' })

    if (res.ok) {
      playerData.cards = playerData?.cards.filter(card => card.id !== cardId)
      playerData.selectedCards = []
      setPlayerData({ ...playerData })
    }
  }

  const dropCard = (cardId: string, gameId: string) => {
    if (!round) {
      return
    }

    round.playerDropCard([cardId], gameId)
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
    // // if (!round) {
    // //   return
    // // }
    // await round.playerBuyCard()
    // setRoundData({ ...round })

    await fetch(`http://localhost:3001/match/${matchId}/buy`, { method: 'post' })
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
    if (!round) {
      return
    }

    const { turn } = round
    const cardsIds = turn.player.selectedCards.map(card => card.id)
    round.playerDropCard(cardsIds, gameId)
    setRoundData({ ...round })
  }

  const joinMatch = async (e: FormEvent) => {
    e.preventDefault()

    const payload = { name: playerName }

    const res = await fetch(`http://localhost:3001/match/${matchId}/join`, {
      method: 'post',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })

    const player = await res.json()
    console.log(player)
    setPlayerData({ ...player })

    ws = new WebSocket('ws://localhost:8080', matchId)

    ws.onopen = () => {
      const connectMessage = {
        type: 'CONNECT',
        payload: {
          matchId: matchId,
          playerId: player.id,
        },
      }

      ws.send(JSON.stringify(connectMessage))
    }

    // ws.onmessage = (e: MessageEvent<string>) => {
    //   onMessage(e, playerData)
    // }
  }

  const onMessage = (e: MessageEvent<string>, playerData: IPlayer) => {
    let data
    try {
      data = JSON.parse(e.data)
    } catch (err) {
      return
    }

    console.log(data.type)

    let match
    let updatedPlayer

    switch (data.type) {
      case 'PLAYER_CONNECTED':
        match = data.payload.match
        setMatchData({ ...data.payload.match })

        updatedPlayer = match.players.find((p: IPlayer) => p.id === playerData.id)
        if (updatedPlayer) {
          setPlayerData({ ...updatedPlayer })
        }
        break
      case 'MATCH_STARTED':
        match = data.payload.match
        setMatchData({ ...match })
        setRoundData({ ...match.currentRound })

        updatedPlayer = match.players.find((p: IPlayer) => p.id === playerData.id)
        if (updatedPlayer) {
          setPlayerData({ ...updatedPlayer })
        }
        break
      case 'CARD_BOUGHT':
        match = data.payload.match as IMatch
        setMatchData({ ...match })
        setRoundData({ ...match.currentRound })

        if (match.currentRound.turn.player.id === playerData.id) {
          const cards = match.currentRound.turn.player.cards
          const lastCard = cards[cards.length - 1]
          playerData.cards.push(lastCard)
          setPlayerData({ ...playerData })
        }
        break
      case 'CARD_DISCARDED':
        match = data.payload.match as IMatch
        setMatchData({ ...match })
        setRoundData({ ...match.currentRound })

        // if (match.currentRound.turn.player.id === playerData.id) {
        //   const cards = match.currentRound.turn.player.cards
        //   const lastCard = cards[cards.length - 1]
        //   playerData.cards.push(lastCard)
        //   setPlayerData({ ...playerData })
        // }
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
              />
              <button type="submit">Entrar na partida</button>
            </p>
          </form>
        )}

        {matchData && (
          <div className="match">
            {matchData.status === MatchStatus.created && <button onClick={start}>Iniciar</button>}
            {matchData.status === MatchStatus.started && (
              <button onClick={nextRound} disabled={true}>
                Em andamento
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
                    <div
                      className={`game ${
                        !roundData.turn.canDrop || roundData.turn.player.selectedCards.length === 0 ? 'disabled' : ''
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
                    roundData.turn.player.selectedCards.length + roundData.table.selectedCards.length < 3
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
