import Card from './Card'
import Game from './Game'

interface Table {
  games: Game[]
  discarded: Card[]
  selectedCards: Card[]
}

export default Table
