import { v4 as uuidv4 } from 'uuid'
import { MatchRound } from './MatchRound'
import { IPlayer } from './Player'

export enum MatchStatus {
  created = 'CREATED',
  started = 'STARTED',
  finished = 'FINISHED',
}

export interface IMatch {
  id: string
  status: MatchStatus
  numberOfPlayers: number
  players: IPlayer[]
  rounds: MatchRound[]
  currentRound: MatchRound
}

export class Match implements IMatch {
  id: string
  status: MatchStatus
  numberOfPlayers: number
  players: IPlayer[]
  rounds: MatchRound[]

  constructor(numberOfPlayers: number) {
    this.id = uuidv4()
    this.status = MatchStatus.created
    this.numberOfPlayers = numberOfPlayers
    this.players = []
    this.rounds = []
  }

  public get currentRound(): MatchRound {
    return this.rounds[this.rounds.length - 1]
  }

  // addPlayer(name: string): Player {
  //   const player = new Player(name)
  //   this.players.push(player)
  //   return player
  // }

  // async start(): Promise<Match> {
  //   const round = await new MatchRound(this.players, this.cardsPerPlayer).start()
  //   this.rounds.push(round)
  //   this.status = MatchStatus.started
  //   return this
  // }

  // async nextRound(): Promise<MatchRound> {
  //   const round = await new MatchRound(this.players, this.cardsPerPlayer).start()
  //   this.rounds.push(round)
  //   return round
  // }
}
