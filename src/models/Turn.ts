import Player from './Player'

interface Turn {
  player: Player
  canBuy: boolean
  canDrop: boolean
  canDiscard: boolean
}

export default Turn
