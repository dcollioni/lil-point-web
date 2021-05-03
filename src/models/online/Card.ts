import { v4 as uuidv4 } from 'uuid'

class Card {
  id: string
  code: string
  name: string
  suit: string
  image: string
  value: number
  score: number

  constructor(code: string, value: string, suit: string, image: string) {
    this.id = uuidv4()
    this.code = code
    this.name = value
    this.suit = suit
    this.image = image
    this.value = this.getValue(value)
    this.score = this.getScore(value)
  }

  private getValue(value: string): number {
    switch (value) {
      case 'ACE':
        return 1
      case 'JACK':
        return 11
      case 'QUEEN':
        return 12
      case 'KING':
        return 13
      default:
        return parseInt(value, 10)
    }
  }

  private getScore(value: string): number {
    switch (value) {
      case 'ACE':
        return 15
      case 'JACK':
        return 10
      case 'QUEEN':
        return 10
      case 'KING':
        return 10
      default:
        return parseInt(value, 10)
    }
  }
}

export default Card
