import Card from './Card'
import Game from './Game'

interface Table {
  games: Game[]
  discarded: Card[]
}

export default Table
