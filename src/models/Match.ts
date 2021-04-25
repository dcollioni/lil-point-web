import Player from './Player'
import Turn from './Turn'

class Match {
  private players: Player[]
  private playerIndex: number

  constructor(players: Player[]) {
    this.players = players
    this.playerIndex = 0
  }

  startMatch(): Turn {
    return {
      player: this.players[this.playerIndex],
      canBuy: true,
      canDrop: false,
      canDiscard: false,
    }
  }

  nextTurn(): Turn {
    this.playerIndex++
    if (this.playerIndex === this.players.length) {
      this.playerIndex = 0
    }

    return {
      player: this.players[this.playerIndex],
      canBuy: true,
      canDrop: false,
      canDiscard: false,
    }
  }
}

export default Match
