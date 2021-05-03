import Player from './Player'

class Turn {
  player: Player
  canBuy: boolean
  canDrop: boolean
  canDiscard: boolean

  constructor(player: Player) {
    this.player = player
    this.canBuy = true
    this.canDrop = false
    this.canDiscard = false
  }
}

export default Turn
