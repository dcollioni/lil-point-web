import { v4 as uuidv4 } from 'uuid'
import Card from './Card'

export interface IGame {
  id: string
  cards: Card[]
}

export class Game implements IGame {
  id: string
  cards: Card[]

  constructor(cards: Card[]) {
    this.id = uuidv4()
    this.cards = cards
  }

  isValid(): boolean {
    const { cards } = this

    if (cards.length < 3) {
      return false
    }

    let sortedCards = [...cards].sort(this.sortBySuit).sort(this.sortByValue)
    console.log(sortedCards)

    const uniqueSuits = new Set(sortedCards.map(card => card.suit))
    if (uniqueSuits.size === 1) {
      const validSequence = '01-02-03-04-05-06-07-08-09-10-11-12-13-14'
      const values = sortedCards.map(card => card.value.toString().padStart(2, '0')).join('-')
      console.log(values)

      if (!validSequence.includes(values)) {
        const ace = sortedCards.find(card => card.value === 1)

        if (!ace) {
          return false
        }

        if (ace) {
          ace.value = 14
          sortedCards = sortedCards.sort(this.sortByValue)
          const values = sortedCards.map(card => card.value.toString().padStart(2, '0')).join('-')
          console.log(values)

          if (!validSequence.includes(values)) {
            return false
          }
        }
      }
    } else if (uniqueSuits.size === 3) {
      const uniqueValues = new Set(sortedCards.map(card => card.value))
      if (uniqueValues.size > 1) {
        return false
      }
    } else {
      return false
    }

    this.cards = sortedCards
    return true
  }

  private sortBySuit(a: Card, b: Card): number {
    if (a.suit < b.suit) {
      return -1
    }
    if (a.suit > b.suit) {
      return 1
    }
    return 0
  }

  private sortByValue(a: Card, b: Card): number {
    if (a.value < b.value) {
      return -1
    }
    if (a.value > b.value) {
      return 1
    }
    return 0
  }
}
