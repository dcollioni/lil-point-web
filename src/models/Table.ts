import Card from './Card'
import { Game } from './Game'

class Table {
  games: Game[]
  discarded: Card[]
  selectedCards: Card[]

  constructor() {
    this.games = []
    this.discarded = []
    this.selectedCards = []
  }
}

export default Table
