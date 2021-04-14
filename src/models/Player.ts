import Card from './Card'
import Deck from './Deck'

interface Player {
  id: string
  name: string
  deck: Deck
  selectedCards: Card[]
  games: Card[][]
}

export default Player
