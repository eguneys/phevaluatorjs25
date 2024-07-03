import { Side, next, RoundN } from './round2'
import { GameN } from './game2'


function make_round_from_game(game: GameN) {
  let { small_blind, button, seats } = game
  return RoundN.make(small_blind, button, seats.map(seat => seat.chips))
}

export class Headsup {

  static make = () => {

    let small_blind = 10
    let game = GameN.headsup(small_blind)

    let stacks = small_blind * 300

    game.act(`sit 1-${stacks}`)
    game.act(`sit 2-${stacks}`)

    return new Headsup([], game)
  }

  constructor(
    readonly history: RoundN[],
    public game?: GameN,
    public _round?: RoundN,
    public winner?: Side) {}

  get round() {
    return this._round?.clone
  }

  get game_dests() {
    let { dests } = this.game!

    dests.lea = undefined
    dests.folds = undefined

    return dests
  }

  get round_dests() {
    return this._round?.dests
  }

  round_act(act: string) {
    let res = this._round!.act(act)

    let { dests } = this._round!

    if (dests.phase || !dests.dealer_action) {
      if (this.history.length === 10) {
        this.history.shift()
      }
      this.history.push(RoundN.from_fen(this._round!.fen))
    }

   
    if (dests.fin) {
      let lose_side = this._round!.stacks.findIndex(_ => _.stack === 0) + 1
      if (lose_side !== 0) {
        this._round = undefined
        this.game = undefined
        this.winner = next(2, lose_side as Side)
      } else {
        let shares = this._round!.stacks.map(_ => _.stack).join('-')
        this._round = undefined

        return this.game!.act(`share ${shares}`)
      }
    }

    return res
  }

  game_act(act: string) {

    let [cmd, _args] = act.split(' ')

    switch (cmd) {
      case 'deal': {
        this._round = make_round_from_game(this.game!)
        return this.game!.act(act)
      }
    }
  }
}
