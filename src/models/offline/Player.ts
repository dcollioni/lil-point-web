import { v4 as uuidv4 } from 'uuid'
import Card from './Card'

class Player {
  id: string
  name: string
  cards: Card[]
  selectedCards: Card[]
  score: number

  constructor(name: string) {
    this.id = uuidv4()
    this.name = name
    this.cards = []
    this.selectedCards = []
    this.score = 0
  }

  public get numberOfCards(): number {
    return this.cards.length
  }
}

export default Player
