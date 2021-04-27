import { MatchRound } from './MatchRound'
import Player from './Player'

export interface IMatch {
  players: Player[]
  rounds: MatchRound[]
}

export class Match implements IMatch {
  players: Player[]
  rounds: MatchRound[]

  constructor(playersNames: string[]) {
    this.players = playersNames.map(name => new Player(name))
    this.rounds = []
  }

  public get currentRound(): MatchRound {
    return this.rounds[this.rounds.length - 1]
  }

  async start(): Promise<Match> {
    const round = await new MatchRound(this.players, 11).start()
    this.rounds.push(round)
    return this
  }

  async nextRound(): Promise<MatchRound> {
    const round = await new MatchRound(this.players, 11).start()
    this.rounds.push(round)
    return round
  }
}
