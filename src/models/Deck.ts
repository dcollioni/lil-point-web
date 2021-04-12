import Card from './Card'

interface Deck {
  id: string
  remaining: number
  cards: Card[]
}

export default Deck
