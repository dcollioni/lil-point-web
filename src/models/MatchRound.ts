import { v4 as uuidv4 } from 'uuid'
import Card from './Card'
import Deck from './Deck'
import { Game } from './Game'
import Player from './Player'
import Table from './Table'
import Turn from './Turn'

export interface IMatchRound {
  id: string
  cardsPerPlayer: number
  players: Player[]
  deck: Deck
  table: Table
  turn: Turn
  hasEnded: boolean
}

export class MatchRound implements IMatchRound {
  id: string
  cardsPerPlayer: number
  players: Player[]
  deck: Deck
  table: Table
  private turnPlayerIndex: number = 0
  turn: Turn
  hasEnded: boolean

  constructor(players: Player[], cardsPerPlayer: number) {
    this.id = uuidv4()
    this.players = players
    this.cardsPerPlayer = cardsPerPlayer
    this.deck = new Deck()
    this.table = new Table()
    this.turn = new Turn(this.players[this.turnPlayerIndex])
    this.hasEnded = false
  }

  async start(): Promise<MatchRound> {
    this.deck = await this.deck.shuffle()

    const playersCards = await this.drawPlayersCards()
    playersCards.map((cards, index) => {
      this.players[index].cards = cards
    })

    return this
  }

  nextTurn(): Turn {
    this.turnPlayerIndex++
    if (this.turnPlayerIndex === this.players.length) {
      this.turnPlayerIndex = 0
    }

    this.turn = new Turn(this.players[this.turnPlayerIndex])
    return this.turn
  }

  async playerBuyCard(): Promise<void> {
    if (!this.turn.canBuy) {
      return
    }

    try {
      const card = await this.deck.drawCard()
      this.turn.player.cards.push(card)

      this.turn.canBuy = false
      this.turn.canDrop = true
      this.turn.canDiscard = true
    } catch (err) {
      console.error(err)
    }
  }

  playerDiscardCard(cardId: string): void {
    const { turn, table } = this

    if (!turn.canDiscard) {
      return
    }

    const { player } = turn
    const card = player.cards.find(c => c.id === cardId)

    if (card) {
      table.discarded.push(card)
      table.selectedCards = []

      player.cards = player.cards.filter(c => c.id !== cardId)
      player.selectedCards = []

      this.checkTurnResult()

      if (!this.hasEnded) {
        this.nextTurn()
      }
    }
  }

  playerDropGame(): void {
    const {
      turn: { player },
      table,
    } = this

    if (!this.turn.canDrop) {
      return
    }

    const { selectedCards: tableSelectedCards } = table
    const { selectedCards } = player
    const game = new Game([...selectedCards, ...tableSelectedCards])

    if (!game.isValid()) {
      return
    }

    this.turn.canDiscard = true

    table.games.push(game)
    table.discarded = table.discarded.filter(card => !table.selectedCards.includes(card))
    table.selectedCards = []

    player.cards = player.cards.filter(card => !player.selectedCards.includes(card))
    player.selectedCards = []
    this.checkTurnResult()
  }

  playerDropCard = (cardId: string, gameId: string) => {
    const { turn, table } = this

    if (!turn.canDrop) {
      return
    }

    const { player } = turn
    const game = table.games.find(g => g.id === gameId)
    const card = player.cards.find(c => c.id === cardId)

    if (game && card) {
      const newGame = new Game([...game.cards, card])

      if (newGame.isValid()) {
        game.cards = newGame.cards
        player.cards = player.cards.filter(c => c.id !== cardId)
        this.checkTurnResult()
      }
    }
  }

  selectDiscardedCard(card: Card): void {
    const { turn, table } = this
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
  }

  private checkTurnResult(): void {
    const {
      turn: { player },
    } = this

    if (player.numberOfCards === 0) {
      this.hasEnded = true
      this.sumPlayersScore()
    }
  }

  private sumPlayersScore(): void {
    const { players } = this

    for (const player of players) {
      player.score += player.cards.reduce((sum: number, currentCard: Card) => {
        return (sum += currentCard.score)
      }, 0)
    }

    console.log(players)
  }

  private async drawPlayersCards(): Promise<Card[][]> {
    const cards: Card[][] = this.players.map(() => [])
    let complete = false

    do {
      for (const playerCards of cards) {
        if (playerCards.length < this.cardsPerPlayer) {
          try {
            const card = await this.deck.drawCard()
            playerCards.push(card)
          } catch (err) {
            console.error(err)
          }
        }
      }

      complete = cards.flat().length === this.players.length * this.cardsPerPlayer
    } while (!complete)

    return cards
  }
}
