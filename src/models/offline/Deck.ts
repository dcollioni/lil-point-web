import Card from './Card'

class Deck {
  private count: number
  id?: string
  remaining: number

  constructor(count: number = 2) {
    this.count = count
    this.remaining = 0
  }

  async shuffle(): Promise<Deck> {
    const response = await fetch(`https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${this.count}`)
    const { deck_id: id, remaining } = await response.json()
    this.id = id
    this.remaining = remaining
    return this
  }

  async drawCard(): Promise<Card> {
    const response = await fetch(`https://deckofcardsapi.com/api/deck/${this.id}/draw/?count=1`)
    const { cards, remaining } = await response.json()
    const drawnCard = cards[0]
    const card = new Card(drawnCard.code, drawnCard.value, drawnCard.suit, drawnCard.image)
    this.remaining = remaining
    return card
  }
}

export default Deck
