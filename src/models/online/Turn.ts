import { IPlayer } from './Player'

class Turn {
  player: IPlayer
  canBuy: boolean
  canDrop: boolean
  canDiscard: boolean

  constructor(player: IPlayer) {
    this.player = player
    this.canBuy = true
    this.canDrop = false
    this.canDiscard = false
  }
}

export default Turn
