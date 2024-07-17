import { hand_rank } from './hand_rank'
import { Card, Card3, split_cards } from './cards'

export type Chips = number
export type BetDescription = string


const all_equal = <A>(arr: A[]) => arr.every( v => v === arr[0] )

function sum(a: number[]) {
  return a.reduce((a, b) => a + b, 0)
}

let next_phases: Record<Phase, Phase> = {
  'p': 'f',
  'f': 't',
  't': 'r'
}
function next_phase(phase: Phase): Phase {
  return next_phases[phase]
}

export function next_side(in_other_than_action_sides: Side[], action_side: Side): Side {
  return in_other_than_action_sides.find(_ => _ > action_side) ?? Math.min(...in_other_than_action_sides) as Side
}

export function find_sides<A>(_: A[], fn: (_: A) => boolean) {
  let res: Side[] = []
  _.forEach((_, i) => { if (fn(_)) { res.push(i + 1 as Side) }})
  return res
}


export type Side = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export class RoundNPov {

  static from_fen = (fen: string) => {
    let [rrest, shares] = fen.split('shares')
    let [rest, f_cards] = rrest.trim().split('!')
    let [rest2, pot] = rest.split('$')
    let [head, stacks] = rest2.split('|')

    let [blinds, button] = head.split(' ')
    let [small_blind] = blinds.split('-')

    let middle = f_cards === '' ? undefined : (split_cards(f_cards)) as [Card, Card, Card, Card, Card]

    let flop, turn, river
    if (middle) {
      flop = middle.slice(0, 3) as [Card, Card, Card]
      turn = middle[3]
      river = middle[4]
    }

    return new RoundNPov(num(small_blind), num(button) as Side, stacks.split('/').map(Stack.from_fen), pot === '' ? undefined : Pot.from_fen(pot), flop, turn, river, shares?.trim().split(' ').map(_ => PotShare.from_fen(_)))
  }


  constructor(
    public small_blind: Chips,
    public button: Side,
    readonly stacks: Stack[],
    public pot?: Pot,
    public flop?: [Card, Card, Card],
    public turn?: Card,
    public river?: Card,
    public shares?: PotShare[]) {}

  get total_pot() {
    let total_bets = sum(this.stacks.map(_ => _.bet?.total ?? 0))
    return total_bets + (this.pot?.total_pot ?? 0)
  }

  get middle() {
    let res = []
    if (this.flop) {
      res.push(...this.flop)
    }
    if (this.turn) {
      res.push(this.turn)
    }
    if (this.river) {
      res.push(this.river)
    }
    return res
  }

  get fen() {

    let { small_blind, button } = this

    let big_blind = small_blind * 2

    let header = `${small_blind}-${big_blind} ${button}`
    let stacks = this.stacks.map(_ => _.fen).join(' / ')

    let pot = this.pot?.fen
    if (pot) {
      pot = ` ${pot} `
    } else {
      pot = ''
    }

    let middle = (this.flop?.join('') ?? '') + (this.turn ?? '') + (this.river ?? '')

    let shares = (this.shares?.map(_ => _.fen).join(' ') ?? '')
    if (shares) {
      shares = ` shares ${shares}`
    }

    return `${header} | ${stacks} $${pot}!${middle}${shares}`
  }
}

export function num(s: string) {
  return parseInt(s)
}

// 1 2 3 4
// 1 3 3
// 2 3 2
// 3 3 1
// 4 3 4
// 1 1 1
// 2 1 4
// 3 1 3
// 4 1 2
export function pov_side(nb: number, pov: Side, side: Side): Side {
  let res = (side - pov + 1)
  if (res < 1) {
    return res + nb as Side
  } else {
    return res as Side
  }
}

export function next(nb: number, s: Side) {
  if (s + 1 > nb) {
    return 1 as Side
  } else {
    return (s + 1) as Side
  }
}

export class PotShare {
  static win(n: Side, chips: Chips) { return new PotShare([n, chips]) }
  static back(n: Side, chips: Chips) { return new PotShare(undefined, [n, chips]) }
  static swin(n: Side, chips: Chips) { return new PotShare(undefined, undefined, [n, chips]) }



  get clone() {
    let win = this.win?.slice(0) as [Side, Chips] | undefined
    let back = this.back?.slice(0) as [Side, Chips] | undefined
    let swin = this.swin?.slice(0) as [Side, Chips] | undefined

    return new PotShare(
      win,
      back,
      swin)
  }

  static from_fen = (fen: string) => {
    let [win, s_side, s_chips] = fen.split('-')
    let side = num(s_side) as Side
    let chips = num(s_chips) as Chips
    if (win === 'win') {
      return PotShare.win(side, chips)
    }
    if (win === 'swin') {
      return PotShare.swin(side, chips)
    }
    return PotShare.back(side, chips)
  }

  constructor(readonly win?: [Side, Chips], readonly back?: [Side, Chips], readonly swin?: [Side, Chips]) {}


  pov(nb: number, pov: Side) {
    let { win, back, swin } = this

    let pov_win: [Side, Chips] | undefined = 
      win ? [pov_side(nb, pov, win[0]), win[1]] : undefined
    let pov_back: [Side, Chips] | undefined = 
      back ? [pov_side(nb, pov, back[0]), back[1]] : undefined

    let pov_swin: [Side, Chips] | undefined = 
      swin ? [pov_side(nb, pov, swin[0]), swin[1]] : undefined
    return new PotShare(pov_win, pov_back, pov_swin)
  }

  get fen() {
    let { win, back, swin } = this
    if (win) {
      return `win-${win[0]}-${win[1]}`
    }
    if (back) {
      return `back-${back[0]}-${back[1]}`
    }
    if (swin) {
      return `swin-${swin[0]}-${swin[1]}`
    }
  }
}

export type StackState = string

export class Call {

  static from_fen(cmd: string) {
    let [str, call] = cmd.split('-')

    if (str === 'call') {
      return new Call(parseInt(call))
    }
  }

  constructor(readonly match: Chips) {}

  get fen() {
    return `call-${this.match}`
  }
}

export class Raise {

  static from_fen(cmd: string) {
    let [raise, cant] = cmd.split('x')

    let [str, _match, _min_raise] = raise.split('-')
    if (str === 'raise') {
      let match = parseInt(_match)
      let min_raise = parseInt(_min_raise)

      if (cant) {
        let [_a, _b] = cant.split('-')

        let a = parseInt(_a)
        let b = parseInt(_b)

        if (b === 0) {
          return Raise.cant_match(match, min_raise, a)
        } else {
          return Raise.cant_minraise(match, min_raise, b)
        }
      } else {
        return new Raise(match, min_raise)
      }
    }
  }

  static cant_match = (match: Chips, min_raise: Chips, stack: Chips) => new Raise(match, min_raise, stack)
  static cant_minraise = (match: Chips, min_raise: Chips, stack: Chips) => new Raise(match, min_raise, undefined, stack)

  constructor(readonly match: Chips, readonly min_raise: Chips, readonly cant_match?: Chips, readonly cant_minraise?: Chips) {}

  get fen() {
    let cant = this.cant_match !== undefined ? `x${this.cant_match}-0` : (this.cant_minraise !== undefined ? `x${this.match}-${this.cant_minraise}` : '')
    return `raise-${this.match}-${this.min_raise}${cant}`
  }
}

export class Bet {

  static from_fen = (fen: string) => {
    let [desc, previous, match, raise] = fen.split('-')

    return new Bet(desc, num(previous), match ? num(match) : undefined, raise ? num(raise) : undefined)
  }

  get clone() {

    let { desc, previous, match, raise } = this

    return new Bet(
      desc,
      previous,
      match,
      raise)
  }

  constructor(readonly desc: BetDescription,
              readonly previous: Chips,
              readonly match?: Chips,
              readonly raise?: Chips) {}


  get total() {
    return this.previous + (this.match ?? 0) + (this.raise ?? 0)
  }

  get fen() {

    let { desc, previous, match, raise } = this

    let matches = (match !== undefined) ? `-${match}` : ''
    let raises = (raise !== undefined) ? `-${raise}` : ''
    return `${desc}-${previous}${matches}${raises}`
  }
}

export class Stack {

  static make = (chips: number) => new Stack('d', chips)

  static from_fen = (fen: string) => {
    let state = fen.trim()[0]
    let [stack, hand_s, bet_s] = fen.trim().slice(1).split(' ')

    let bet: string | undefined = bet_s,
      hand: string | undefined = hand_s
    if (!hand_s) {
    } else if (hand_s.length === 4 && hand_s !== 'fold') {
    } else {
      bet = hand_s
      hand = undefined
    }

    return new Stack(state, num(stack), hand ? (split_cards(hand, 2) as [Card, Card]) : undefined, bet ? Bet.from_fen(bet) : undefined)
  }

  get clone() {
    let { state, stack } = this
    let hand = this.hand?.slice(0) as [Card, Card] | undefined
    let bet = this.bet?.clone

    return new Stack(
      state,
      stack,
      hand,
      bet)
  }

  constructor(
    public state: StackState,
    public stack: Chips,
    public hand?: [Card, Card],
    public bet?: Bet) {}

    get hide_cards() {
      let { state, stack, bet, hand } = this
      let show_if_showdown = state === 's' ? hand : undefined
      return new Stack(state, stack, show_if_showdown, bet)
    }

  get fen() {

    let { stack, state, bet, hand } = this

    let hand_s = hand ? `${hand.join('')}` : undefined
    let bet_s = bet ? bet.fen : undefined
    let ss = hand_s ? (bet_s ? `${hand_s} ${bet_s}` : hand_s) : bet_s

    if (ss) {
      return `${state}${stack} ${ss}`
    } else {
      return `${state}${stack}`
    }
  }


  post_bet(pov: Side, desc?: BetDescription, match?: Chips, raise?: Chips) {
    if (!desc) {
      this.bet = undefined
    } else if (this.bet) {
      this.bet = new Bet(desc, this.bet.total, match, raise)
    } else {
      this.bet = new Bet(desc, 0, match, raise)
    }
    let delta = (match ?? 0) + (raise ?? 0)
    this.stack -= delta

    let res = []

    res.push(new ActionBetEvent(pov, this.bet))
    if (delta > 0) { res.push(new StackEvent(pov, delta)) }

    return res
  }
}

export class Dests {


  static from_fen = (fen: string) => {
    let cmds = fen.split(' ')


    let res = Dests.empty


    cmds.forEach(cmd => {
      if (cmd === 'win') {
        res.win = true
      }
      if (cmd === 'fin') {
        res.fin = true
      }
      if (cmd === 'phase') {
        res.phase = true
      }
      if (cmd === 'showdown') {
        res.showdown = true
      }
      if (cmd === 'share') {
        res.share = true
      }
      if (cmd === 'check') {
        res.check = true
      }
      if (cmd === 'fold') {
        res.fold = true
      }


      let call = Call.from_fen(cmd)
      if (call) {
        res.call = call
      }

      let raise = Raise.from_fen(cmd)
      if (raise) {
        res.raise = raise;
      }


      let [str, deal] = cmd.split('-')

      if (str === 'deal') {
        res.deal = parseInt(deal)
      }

    })

    return res
  }

  static get empty() { return new Dests() }
  static deal(nb: number) { return new Dests(nb) }
  static get phase() { return new Dests(undefined, true) }
  static get showdown() { return new Dests(undefined, undefined, true) }
  static get share() { return new Dests(undefined, undefined, undefined, true) }
  static get check() { return new Dests(undefined, undefined, undefined, undefined, true) }
  static get fold() { return new Dests(undefined, undefined, undefined, undefined, undefined, true) }
  static call(call: Call) { return new Dests(undefined, undefined, undefined, undefined, undefined, undefined, call) }
  static raise(raise: Raise) { return new Dests(undefined, undefined, undefined, undefined, undefined, undefined, undefined, raise) }
  static get fin() { return new Dests(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true) }
  static get win() { return new Dests(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, true) }

  constructor(
    public deal?: number,
    public phase?: true,
    public showdown?: true,
    public share?: true,
    public check?: true,
    public fold?: true,
    public call?: Call,
    public raise?: Raise,
    public fin?: true,
    public win?: true) {}

  get dealer_action() {
    return this.deal ||
      this.phase ||
      this.showdown ||
      this.share ||
      this.fin ||
      this.win
  }

  get fen() {
    if (this.win) {
      return 'win'
    }
    if (this.fin) {
      return 'fin'
    }
    if (this.deal) {
      return `deal-${this.deal}`
    }
    if (this.phase) {
      return 'phase'
    }
    if (this.showdown) {
      return 'showdown'
    }
    if (this.share) {
      return 'share'
    }

    let { check, call, raise, fold } = this
    let res = []

    if (check) {
      res.push('check')
    }
    if (call) {
      res.push(call.fen)
    }
    if (raise) {
      res.push(raise.fen)
    }
    if (fold) {
      res.push('fold')
    }
    return res.join(' ')
  }
}

export class Pot {

  static from_fen = (fen: string) => {

    let [main, side_pots_s] = fen.trim().split('side')
    let [chips, sides] = main.split('-')

    let side_pots: Pot[] = side_pots_s?.trim().split(' ').map(_ => Pot.from_fen(_))

    return new Pot(num(chips), sides.split('').map(_ => num(_)) as Side[], side_pots)
  }

  static empty = () => new Pot(0, [])

  get clone(): Pot {
    let { chips } = this
    let sides = this.sides.slice(0)
    let side_pots: Pot[] | undefined = this.side_pots?.map(_ => _.clone)

    return new Pot(
      chips,
      sides,
      side_pots)
  }

  constructor(
    public chips: Chips,
    public sides: Side[],
    public side_pots?: Pot[]) {}

  get total_pot() {
    return this.chips + sum(this.side_pots?.map(_ => _.chips) ?? [])
  }

  exclude_fold(side: Side) {
    this.sides = this.sides.filter(_ => _ !== side)
  }

  add_bet(side: Side, bet: Bet, folded?: true) {

    if (folded) {
      this.exclude_fold(side)
      this.side_pots?.forEach(_ => _.exclude_fold(side))
    }

    if (!folded && !this.sides.includes(side)) {
      this.sides.push(side)
    }
    this.chips += bet.total

    if (bet.total > 0) {
      return [new PotAddBet(side, bet.total)]
    }
    return []
  }

  side_pot(shorts: Side[], chips: Chips) {

    let side_sides = this.sides
    let side_chips = chips * side_sides.length

    if (!this.side_pots) {
      this.side_pots = []
    }

    let side_pot = new Pot(side_chips, side_sides)
    this.side_pots.push(side_pot)

    this.sides = this.sides.filter(_ => !shorts.includes(_))
    this.chips -= side_chips


    return new SidePotEvent(shorts, chips)
  }


  get fen() {

    let side_pots: string = this.side_pots ? 
      `side ${this.side_pots.map(_ => _.fen).join(' ')}` : ''

    return `${this.chips}-${this.sides.join('')}${side_pots}`
  }
}

export type Phase = string

export class RoundN {

  static make = (small_blind: number, button: Side, stacks: Chips[]) => {
    return new RoundN(small_blind, button, stacks.map(_ => Stack.make(_)))
  }

  static from_fen = (fen: string) => {
    let [rest, f_cards] = fen.split('!')
    let [rest2, pot] = rest.split('$')
    let [head, stacks] = rest2.split('|')

    let [blinds, button] = head.split(' ')
    let [small_blind] = blinds.split('-')

    let middle = f_cards === '' ? undefined : (split_cards(f_cards.slice(1), 5) as [Card, Card, Card, Card, Card])
    let phase = f_cards === '' ? undefined : f_cards[0]

    return new RoundN(num(small_blind), num(button) as Side, stacks.split('/').map(Stack.from_fen), pot === '' ? undefined : Pot.from_fen(pot), middle, phase)
  }

  get clone() {

    let { small_blind, button, phase } = this

    let stacks = this.stacks.map(_ => _.clone)
    let pot = this.pot?.clone
    let middle = this.middle?.slice(0) as [Card, Card, Card, Card, Card]
    let shares = this.shares?.map(_ => _.clone)

    return new RoundN(
      small_blind,
      button,
      stacks,
      pot,
      middle,
      phase,
      shares)
  }

  constructor(
    public small_blind: Chips,
    public button: Side,
    readonly stacks: Stack[],
    public pot?: Pot,
    public middle?: [Card, Card, Card, Card, Card],
    public phase?: Phase,
    public shares?: PotShare[]) {}

  get nb() {
    return this.stacks.length
  }

  find_stack_sides_with_states(n: StackState | StackState[]) {
    if (!Array.isArray(n)) {
      n = [n]
    }

    return find_sides(this.stacks, _ => n.includes(_.state))
  }

  find_stacks_with_states(n: StackState | StackState[]) {
    if (!Array.isArray(n)) {
      n = [n]
    }

    return this.stacks.filter(_ => n.includes(_.state))
  }

  get have_played_sides() {
    return this.find_stack_sides_with_states(['p', 'a', 'f', 'd', 'i', '@', 's', 'w'])
  }


  get small_blind_side() {
    return next_side(this.have_played_sides, this.button)
  }

  get big_blind_side() {
    return next_side(this.have_played_sides, this.small_blind_side)
  }

  get action_side() {
    return this.find_stack_sides_with_states('@')[0]
  }

  get action() {
    return this.stacks[this.action_side - 1]
  }

  get in_other_than_action_sides() {
    return this.find_stack_sides_with_states(['i'])
  }

  get in_other_than_actions() {
    return this.find_stacks_with_states(['i'])
  }

  get allin_and_in_other_than_actions() {
    return this.find_stacks_with_states(['i', 'a'])
  }

  get allin_and_in_other_than_action_sides() {
    return this.find_stack_sides_with_states(['i', 'a'])
  }



  get in_action_next() {
    let { action_side, in_other_than_action_sides } = this

    return next_side(in_other_than_action_sides, action_side)
  }

  get ins() {
    return this.find_stacks_with_states(['i', '@'])
  }

  get in_sides() {
    return this.find_stack_sides_with_states(['i', '@'])
  }

  get phases() {
    return this.find_stacks_with_states('p')
  }

  get phase_sides() {
    return this.find_stack_sides_with_states('p')
  }

  get allin_sides() {
    return this.find_stack_sides_with_states('a')
  }

  get fold_sides() {
    return this.find_stack_sides_with_states('f')
  }

  get showdown_sides() {
    return this.find_stack_sides_with_states('s')
  }


  get have_contributed_to_pots() {
    return this.stacks.filter(_ => !!_.bet)
  }

  get have_contributed_to_pot_sides() {
    return find_sides(this.stacks, _ => !!_.bet)
  }

  pov(side: Side) {

    let { small_blind, button, phase, stacks, nb } = this

    let pov_stacks = stacks.slice(side - 1)

    if (side !== 1) {
      pov_stacks = [...pov_stacks, ...stacks.slice(0, side - 1)]
    }

    let reveal_flop = phase !== 'p',
      reveal_turn = phase === 't' || phase === 'r',
      reveal_river = phase === 'r'

    if (this.showdown_sides.length > 0) {
      reveal_flop = true
      reveal_turn = true
      reveal_river = true
    } 

    let flop = reveal_flop ? (this.middle?.slice(0, 3) as [Card, Card, Card] | undefined) : undefined
    let turn = reveal_turn ? this.middle?.[3] : undefined
    let river = reveal_river ? this.middle?.[4] : undefined

    return new RoundNPov(
      small_blind,
      pov_side(nb, side, button),
      pov_stacks.map((_, i) => i === 0 ? _ : _.hide_cards),
      this.pot,
      flop,
      turn,
      river,
      this.shares?.map(_ => _.pov(nb, side))
    )
  }

  get fen() {

    let { small_blind, button, phase } = this

    let big_blind = small_blind * 2

    let header = `${small_blind}-${big_blind} ${button}`
    let stacks = this.stacks.map(_ => _.fen).join(' / ')

    let pot = this.pot?.fen
    if (pot) {
      pot = ` ${pot} `
    } else {
      pot = ''
    }

    let middle = this.middle?.join('') ?? ''

    let shares = this.shares ? 
      ` shares ${this.shares.map(_ => _.fen).join(' ')}` : ''

    return `${header} | ${stacks} $${pot}!${phase??''}${middle}${shares}`
  }

  get dests() {
    let { action, allin_and_in_other_than_actions, in_other_than_action_sides } = this
    if (action) {
      let res = Dests.fold

      let action_stack = action.stack
      let action_bet = action.bet

      let bets = allin_and_in_other_than_actions.map(_ => (_.bet?.total ?? 0))
      let raises = allin_and_in_other_than_actions.map(_ => (_.bet?.raise ?? 0))
      let max_bet = Math.max(...bets)
      let max_raise = Math.max(...raises)

      let previous = (action_bet?.total ?? 0)
      let to_match = max_bet - previous
      
      if (to_match === 0) {
        res.check = true
      } else if (to_match > 0 && action_stack > to_match) {
        res.call = new Call(to_match)
      }

      let min_raise = Math.max(this.small_blind * 2, max_raise)

      // cant raise if there is noone else and has more stack
      if (in_other_than_action_sides.length === 0) {
        if (action_stack < to_match) {
          res.raise = Raise.cant_match(to_match, min_raise, action_stack)
        } else if (action_stack === to_match) {
          res.raise = Raise.cant_minraise(to_match, min_raise, 0)
        }
      } else {
        if (action_stack < to_match) {
          res.raise = Raise.cant_match(to_match, min_raise, action_stack)
        } else if (action_stack - to_match < min_raise) {
          res.raise = Raise.cant_minraise(to_match, min_raise, action_stack - to_match)
        } else {
          res.raise = new Raise(to_match, min_raise)
        }
      }

      return res
    } else {
      if (this.find_stack_sides_with_states('w').length > 0) {
        if (this.shares) {
          return Dests.share
        } else {
          return Dests.win
        }
      } else if (this.find_stack_sides_with_states('x').length > 0) {
        return Dests.fin
      } else if (this.find_stack_sides_with_states('d').length > 0) {
        return Dests.deal(this.nb)
      } if (this.find_stack_sides_with_states('s').length > 0) {
        if (this.shares) {
          return Dests.share
        } else {
          return Dests.showdown
        }
      } else {
        return Dests.phase
      }
    }
  }


  act(act: string) {

    let events = new Events(this.nb)

    let [cmd, args] = act.split(' ')

    let { nb, small_blind } = this
    let big_blind = small_blind * 2

    let { big_blind_side } = this

    switch (cmd) {
      case 'deal': {
        let { small_blind_side, big_blind_side } = this

        //let deals = this.find_stacks_with_states('d')
        let deal_sides = this.find_stack_sides_with_states('d')
        let side_action_preflop = next_side(deal_sides, big_blind_side)
        let action_side = side_action_preflop


        let big_blind_stack = this.stacks[big_blind_side - 1].stack
        let big_blind_all_in = big_blind_stack <= big_blind

        let small_blind_stack = this.stacks[small_blind_side - 1].stack
        let small_blind_all_in = small_blind_stack <= small_blind

        let bb_allin_less_than_sb = big_blind_all_in && small_blind >= big_blind_stack

        if (small_blind_all_in && action_side === small_blind_side) {
          side_action_preflop = next_side(deal_sides, side_action_preflop)
          action_side = side_action_preflop
        }

        deal_sides.forEach((side) => {
          //let _ = this.stacks[side - 1]

          if (small_blind_all_in && side === small_blind_side) {
            events.all(this.change_state(side, 'a'))
          } else if (bb_allin_less_than_sb && side === small_blind_side)  {
            events.all(this.change_state(side, 'p'))
          } else if (small_blind_all_in && side === big_blind_side && side === action_side) {
            events.all(this.change_state(side, 'p'))
          } else if (big_blind_all_in && side === big_blind_side) {
            events.all(this.change_state(side, 'a'))
          } else if (side === side_action_preflop) {
            events.all(this.change_state(side, '@'))
          } else {
            events.all(this.change_state(side, 'i'))
          }
        })

        let bb_events
        if (big_blind_all_in) {
          bb_events = this.post_bet(big_blind_side, 'allin', 0, big_blind_stack)
        } else {
          if (small_blind_all_in && action_side === big_blind_side) {
            bb_events = this.post_bet(big_blind_side, 'call', small_blind_stack)
          } else {
            bb_events = this.post_bet(big_blind_side, 'bb', 0, big_blind)
          }
        }

        let sb_events
       
        if (small_blind_all_in) {
          sb_events = this.post_bet(small_blind_side, 'allin', 0, small_blind_stack)
        } else if (bb_allin_less_than_sb) {
          sb_events = this.post_bet(small_blind_side, 'call', big_blind_stack)
        } else {
          sb_events = this.post_bet(small_blind_side, 'sb', 0, small_blind)
        }

        events.all(sb_events)
        events.all(bb_events)

        this.middle = split_cards(args.slice(nb * 4, nb * 4 + 10), 5) as [Card, Card, Card, Card, Card]

        deal_sides.forEach((side, i) => {
          let _ = this.stacks[side - 1]
          _.hand = split_cards(args.slice(i * 4), 2) as [Card, Card]

          events.only(side, new HandEvent(side, _.hand!))
        })

        this.phase = 'p'
      } break
      case 'phase': {
        let { fold_sides, allin_sides, phase_sides, phase } =  this

        let no_player_left = phase_sides.length <= 1
        let allins = this.find_stack_sides_with_states('a')
        let allin_this_hand_sides = allin_sides.filter(side => this.stacks[side - 1].bet)

        let everyone_has_folded = no_player_left && allins.length === 0
        let atleast_two_allins = allins.length > 1
        let everyone_has_folded_to_allin = phase_sides.length === 0 && allin_this_hand_sides.length === 1

        if (!this.pot) {
          this.pot = Pot.empty()
        }

        [...phase_sides, ...allin_sides].forEach(side => {
          let _ = this.stacks[side - 1]

          if (_.bet) {
            events.all(this.pot!.add_bet(side, _.bet))
          }
        })

        fold_sides.forEach(side => {
          let _ = this.stacks[side - 1]
          if (_.bet) {
            events.all(this.pot!.add_bet(side, _.bet, true))
          }
        })

        if (!everyone_has_folded_to_allin) {

          let decrease = 0
          allin_this_hand_sides.sort((a, b) => {
            let abet = this.stacks[a - 1].bet!.total
            let bbet = this.stacks[b - 1].bet!.total
            return abet - bbet
          }).forEach(side => {
            let chips = this.stacks[side - 1].bet!.total - decrease
            events.all(this.pot!.side_pot([side], chips))
            decrease += chips
          })
        }

        [...allin_sides, ...fold_sides, ...phase_sides].forEach(side => {
          events.all(this.post_bet(side))
        })

        if (!everyone_has_folded && !everyone_has_folded_to_allin) {
          if (phase === 'p') {
            events.all(new FlopEvent(this.middle!.slice(0, 3) as [Card, Card, Card]))
          } else if (phase === 'f') {
            events.all(new TurnEvent(this.middle![3]))
          } else if (phase === 't') {
            events.all(new RiverEvent(this.middle![4]))
          } 
        }
        
        if (no_player_left) {

          if (!atleast_two_allins && everyone_has_folded_to_allin) {
            allin_sides.forEach(side => {
              events.all(this.change_state(side, 'w'))
            })
          } else if (everyone_has_folded) {
            phase_sides.forEach(side => {
              events.all(this.change_state(side, 'w'))
            })
          } else {
            allins.forEach(side => {
              events.others(side, new HandEvent(side, this.stacks[side - 1].hand!))
            })

            if (phase === 'p') {
              events.all(new TurnEvent(this.middle![3]))
              events.all(new RiverEvent(this.middle![4]))
            } else if (phase === 'f') {
              events.all(new RiverEvent(this.middle![4]))
            } 

            [...phase_sides, ...allin_sides].forEach(side => {
              events.all(this.change_state(side, 's'))
            })

          }
        } else if (phase === 'r') {
          phase_sides.forEach(side => {
            events.all(this.change_state(side, 's'))
          })

          let showdowns = this.find_stack_sides_with_states('s')
          showdowns.forEach(side => {
            events.others(side, new HandEvent(side, this.stacks[side - 1].hand!))
          })
        } else {

          let big_blind_has_folded = this.stacks[big_blind_side - 1].state === 'f'
          let next_action_side = big_blind_has_folded ? next_side(phase_sides, big_blind_side) : big_blind_side

          phase_sides.forEach(side => {
            if (side === next_action_side) {
              events.all(this.change_state(side, '@'))
            } else {
              events.all(this.change_state(side, 'i'))
            }
          })

          this.phase = next_phase(this.phase!)!
        }
      } break
      case 'showdown': {


        [this.pot!, ...this.pot!.side_pots ?? []].forEach(pot => {

          let pot_shares = []
          let { sides, chips } = pot
          if (sides.length === 0) {
          } else if (sides.length === 1) {
            pot_shares.push(PotShare.back(sides[0], chips))
          } else {
            let ranks = sides.map(side => hand_rank([...this.middle!, ...this.stacks[side - 1].hand!]).hand_eval)
            let max_rank = Math.max(...ranks)

            let winners = sides.filter((_side, i) => ranks[i] === max_rank)

            if (winners.length > 1) {
              // TODO tie
              let pot_winner = winners[0]
              pot_shares.push(PotShare.swin(pot_winner, chips))
            } else {
              let pot_winner = winners[0]
              pot_shares.push(PotShare.swin(pot_winner, chips))
            }
          }

          events.all(pot_shares.map(_ => this.pot_share(_)))
        })

      } break
      case 'win': {
        let { sides, chips } = this.pot!
        // everyone has folded so excluded from sides
        let pot_winner = sides[0]
        events.all(this.pot_share(PotShare.win(pot_winner, chips)))
      } break
      case 'call': {

        let { action_side, in_action_next } = this

        let { ins, in_sides } = this


        let to_match = num(args)
        events.all(this.post_bet(action_side, 'call', to_match))

        let everyone_has_bet = ins.every(_ => _.bet)
        let all_bets_equal = ins.every(_ => _.bet?.total === ins[0].bet?.total)
        let bb_has_acted = !ins.find(_ => _.bet?.desc === 'bb')
        if (everyone_has_bet && all_bets_equal && bb_has_acted) {
          in_sides.forEach(side => events.all(this.change_state(side, 'p')))
        } else {
          events.all(this.change_state(action_side, 'i'))
          events.all(this.change_state(in_action_next, '@'))
        }
      } break
      case 'raise': {

        let { action, action_side, in_action_next } = this

        let [to_match, to_raise] = args.split('-').map(_ => num(_))
        
        let action_stack = action.stack
        let total_bet = to_match + to_raise
        let total_bet_with_previous_for_allincase = (action.bet?.total ?? 0) + total_bet

        if (action_stack <= total_bet) {
          events.all(this.post_bet(action_side, 'allin', 
                                   Math.min(action_stack, to_match), 
                                   Math.max(0, Math.min(action_stack - to_match, to_raise))))
          events.all(this.change_state(action_side, 'a'))
        } else {
          events.all(this.post_bet(action_side, 'raise', to_match, to_raise))
          events.all(this.change_state(action_side, 'i'))
        }

        let { in_other_than_action_sides } = this

          let only_in_side = in_other_than_action_sides[0]
        // only player left has moved more than this players allin
        if (in_other_than_action_sides.length === 1 &&
            (this.stacks[only_in_side - 1].bet?.total ?? 0) >= total_bet_with_previous_for_allincase) {
          events.all(this.change_state(in_action_next, 'p'))
        } else if (in_other_than_action_sides.length > 0) {
          events.all(this.change_state(in_action_next, '@'))
        }
      } break
      case 'share': {

        let { shares, have_played_sides } = this


        events.all(this.collect_pot())

        shares!.forEach(share => {
          events.all(this.pot_share_stack_add(share)!)
        })

        have_played_sides.forEach(side => {
          if (this.stacks[side - 1].stack === 0) {
            events.all(this.change_state(side, 'e'))
          } else {
            events.all(this.change_state(side, 'x'))
          }
          events.all(this.collect_card(side))
        })

        this.phase = undefined
      } break
      case 'check': {
        let { action_side, in_action_next } = this
        let { in_other_than_actions, in_sides } = this

      let everyone_has_bet = in_other_than_actions.every(_ => _.bet)
      //let bets_matched = in_.every(_ => _.bet?.total === ins[0].bet?.total)
      if (everyone_has_bet) {
        in_sides.forEach(side => events.all(this.change_state(side, 'p')))
      } else {
        events.all(this.change_state(action_side, 'i'))
        events.all(this.change_state(in_action_next, '@'))
      }

      events.all(this.post_bet(action_side, 'check'))
    }  break
    case 'fold': {
      let { action_side, in_action_next } = this

      let { in_other_than_actions, in_other_than_action_sides } = this

      let allins = this.find_stacks_with_states('a')

      let everyone_has_bet = in_other_than_actions.every(_ => _.bet)
      let bets_matched = all_equal(in_other_than_actions.map(_ => _.bet?.total))

      // TODO case if last player has to make a call
      if (in_other_than_actions.length === 1) {
        in_other_than_action_sides.forEach(side => events.all(this.change_state(side, 'p')))
      } else if (everyone_has_bet && bets_matched) {
        let max_allin_bet = Math.max(...allins.map(_ => _.bet?.total ?? 0))
        // no point in max because all in bets are equal
        let max_ins_bet = Math.max(...in_other_than_actions.map(_ => _.bet!.total))
        if (in_other_than_actions.length === 0) {
        } else if (max_ins_bet >= max_allin_bet) {
          in_other_than_action_sides.forEach(side => events.all(this.change_state(side, 'p')))
        } else {
          events.all(this.change_state(in_action_next, '@'))
        }
      } else {
        events.all(this.change_state(in_action_next, '@'))
      }

      events.all(this.change_state(action_side, 'f'))
      events.all(this.post_bet(action_side, 'fold'))
    } break
  }

  return events
}

  private pot_share_stack_add(share: PotShare) {

    let { swin, win, back } = share


    if (swin) {
      let [side, chips] = swin

      this.stacks[side - 1].stack += chips
      
      return new StackAddEvent(side, chips)
    }


    if (win) {
      let [side, chips] = win

      this.stacks[side - 1].stack += chips
      
      return new StackAddEvent(side, chips)
    }

    if (back) {
      let [side, chips] = back

      this.stacks[side - 1].stack += chips

      return new StackAddEvent(side, chips)
    }
  }

  private collect_pot() {
    this.pot = undefined
    this.shares = undefined
    this.middle = undefined
    return new CollectPot()
  }

  private collect_card(side: Side) {
    this.stacks[side - 1].hand = undefined
    return new CollectHand(side)
  }

  private pot_share(share: PotShare) {
    if (!this.shares) {
      this.shares = []
    }
    this.shares.push(share)
    return new PotShareEvent(share)
  }

  private change_state(pov: Side, state: StackState) {
    this.stacks[pov - 1].state = state
    return new ChangeState(pov, state)
  }

  private post_bet(side: Side, desc?: BetDescription, match?: Chips, raise?: Chips) {
    return this.stacks[side - 1].post_bet(side, desc, match, raise)
  }

}

export abstract class Event {

  static from_fen = (fen: string): Event | undefined => {
    let i
    i = ChangeState.from_fen(fen)
    if (i) { return i }
    i = HandEvent.from_fen(fen)
    if (i) { return i }
    i = StackEvent.from_fen(fen)
    if (i) { return i }
    i = ActionBetEvent.from_fen(fen)
    if (i) { return i }
    i = FlopEvent.from_fen(fen)
    if (i) { return i }
    i = TurnEvent.from_fen(fen)
    if (i) { return i }
    i = RiverEvent.from_fen(fen)
    if (i) { return i }
    i = PotShareEvent.from_fen(fen)
    if (i) { return i }
    i = CollectHand.from_fen(fen)
    if (i) { return i }
    i = CollectPot.from_fen(fen)
    if (i) { return i }
    i = StackAddEvent.from_fen(fen)
    if (i) { return i }
    i = ButtonEvent.from_fen(fen)
    if (i) { return i }
    i = PotAddBet.from_fen(fen)
    if (i) { return i }
    i = SidePotEvent.from_fen(fen)
    if (i) { return i }
  }

  abstract pov(nb: number, pov: Side): Event
  abstract fen: string
}


export class SidePotEvent extends Event {


  static from_fen = (fen: string) => {
    let [cmd, shorts, chips] = fen.split(' ')
    if (cmd === 'v') {
      return new SidePotEvent(shorts.split('').map(_ => parseInt(_) as Side), parseInt(chips))
    }
  }

  constructor(readonly shorts: Side[], readonly chips: Chips) { super() }

  pov(nb: number, pov: Side) {
    return new SidePotEvent(this.shorts.map(side => pov_side(nb, pov, side)), this.chips)
  }

  get fen() {
    return `v ${this.shorts.join('')} ${this.chips}`
  }
}

export class PotAddBet extends Event {

  static from_fen = (fen: string) => {
    let [cmd, side, chips] = fen.split(' ')
    if (cmd === 'p') {
      return new PotAddBet(parseInt(side) as Side, parseInt(chips))
    }
  }



  constructor(readonly side: Side, readonly chips: Chips) { super() }

  pov(nb: number, pov: Side) {
    return new PotAddBet(pov_side(nb, pov, this.side), this.chips)
  }

  get fen() {
    return `p ${this.side} ${this.chips}`
  }
}

export class ButtonEvent extends Event {

  static from_fen = (fen: string) => {
    let [cmd, side] = fen.split(' ')
    if (cmd === 'b') {
      return new ButtonEvent(parseInt(side) as Side)
    }
  }

  constructor(readonly side: Side) { super() }

  pov(nb: number, pov: Side) {
    return new ButtonEvent(pov_side(nb, pov, this.side))
  }

  get fen() {
    return `b ${this.side}`
  }
}

export class StackAddEvent extends Event {

  static from_fen = (fen: string) => {
    let [cmd, side, delta] = fen.split(' ')
    if (cmd === 'S') {
      return new StackAddEvent(parseInt(side) as Side, parseInt(delta))
    }
  }



  constructor(readonly side: Side, readonly delta: Chips) { super() }


  pov(nb: number, pov: Side) {
    return new StackAddEvent(pov_side(nb, pov, this.side), this.delta)
  }

  get fen() {
    return `S ${this.side} ${this.delta}`
  }

}



export class CollectPot extends Event {

  static from_fen = (fen: string) => {
    if (fen === 'C') {
      return new CollectPot()
    }
  }



  pov(_nb: number, _pov: Side) {
    return this
  }

  get fen() {
    return `C`
  }
}

export class CollectHand extends Event {

  static from_fen = (fen: string) => {
    let [cmd, side] = fen.split(' ')
    if (cmd === 'o') {
      return new CollectHand(parseInt(side) as Side)
    }
  }



  constructor(readonly side: Side) { super() }

  pov(nb: number, pov: Side) {
    return new CollectHand(pov_side(nb, pov, this.side))
  }

  get fen() {
    return `o ${this.side}`
  }

}

export class PotShareEvent extends Event {


  static from_fen = (fen: string) => {
    let [cmd, share] = fen.split(' ')
    if (cmd === 'w') {
      return new PotShareEvent(PotShare.from_fen(share))
    }
  }

  constructor(readonly share: PotShare) {super()}

  pov(nb: number, pov: Side) {
    return new PotShareEvent(this.share.pov(nb, pov))
  }


  get fen() {
    return `w ${this.share.fen}`
  }

}
export class RiverEvent extends Event {

  static from_fen = (fen: string) => {
    let [cmd, river] = fen.split(' ')
    if (cmd === 'r') {
      return new RiverEvent(river)
    }
  }



  constructor(readonly river: Card) {super()}

  pov(_nb: number, _pov: Side) {
    return new RiverEvent(this.river)
  }


  get fen() {
    return `r ${this.river}`
  }

}

export class TurnEvent extends Event {

  static from_fen = (fen: string) => {
    let [cmd, turn] = fen.split(' ')
    if (cmd === 't') {
      return new TurnEvent(turn)
    }
  }



  constructor(readonly turn: Card) {super()}

  pov(_nb: number, _pov: Side) {
    return new TurnEvent(this.turn)
  }


  get fen() {
    return `t ${this.turn}`
  }

}
export class FlopEvent extends Event {

  static from_fen = (fen: string) => {
    let [cmd, flop] = fen.split(' ')
    if (cmd === 'f') {
      return new FlopEvent(split_cards(flop) as Card3)
    }
  }



  constructor(readonly flop: [Card, Card, Card]) {super()}

  pov(_nb: number, _pov: Side) {
    return new FlopEvent(this.flop)
  }


  get fen() {
    return `f ${this.flop.join('')}`
  }

}

export class ActionBetEvent extends Event {


  static from_fen = (fen: string) => {
    let [cmd, side, bet] = fen.split(' ')
    if (cmd === 'a') {
      return new ActionBetEvent(parseInt(side) as Side, bet ? Bet.from_fen(bet) : undefined)
    }
  }

  constructor(readonly side: Side, readonly bet?: Bet) { super() }


  pov(nb: number, pov: Side) {
    return new ActionBetEvent(pov_side(nb, pov, this.side), this.bet)
  }

  get fen() {
    if (this.bet) {
      return `a ${this.side} ${this.bet.fen}`
    } else {
      return `a ${this.side}`
    }
  }
}

export class StackEvent extends Event {

  static from_fen = (fen: string) => {
    let [cmd, side, delta] = fen.split(' ')
    if (cmd === 's') {
      return new StackEvent(parseInt(side) as Side, parseInt(delta))
    }
  }

  constructor(readonly side: Side, readonly delta: Chips) { super() }


  pov(nb: number, pov: Side) {
    return new StackEvent(pov_side(nb, pov, this.side), this.delta)
  }

  get fen() {
    return `s ${this.side} ${this.delta}`
  }

}

export class HandEvent extends Event {

  static from_fen = (fen: string) => {
    let [cmd, side, hand] = fen.split(' ')
    if (cmd === 'h') {
      return new HandEvent(parseInt(side) as Side, split_cards(hand) as [Card, Card])
    }
  }



  constructor(readonly side: Side, readonly hand: [Card, Card]) { super() }


  pov(nb: number, pov: Side) {
    return new HandEvent(pov_side(nb, pov, this.side), this.hand)
  }

  get fen() {
    return `h ${this.side} ${this.hand.join('')}`
  }
}

export class ChangeState extends Event {

  static from_fen = (fen: string) => {
    let [cmd, side, state] = fen.split(' ')
    if (cmd === 'c') {
      return new ChangeState(parseInt(side) as Side, state)
    }
  }



  constructor(readonly side: Side, readonly state: StackState) { super() }

  pov(nb: number, pov: Side) {
    return new ChangeState(pov_side(nb, pov, this.side), this.state)
  }

  get fen() {
    return `c ${this.side} ${this.state}`
  }
}


export const EventKlasses = [
  ChangeState,
  HandEvent,
  StackEvent,
  ActionBetEvent,
  FlopEvent,
  TurnEvent,
  RiverEvent,
  PotShareEvent,
  CollectHand,
  CollectPot,
  StackAddEvent,
  ButtonEvent,
  PotAddBet,
  SidePotEvent
]



export class Events {

  events: Map<Side, Event[]>
  specs: Event[]

  constructor(readonly nb: number) {

    this.specs = []

    this.events = new Map()
    for (let i = 1; i <= nb; i++) { 
      let side = i as Side
      this.events.set(side, []) 
    }
  }

  others(pov: Side, events: Event | Event[]) {

    if (!Array.isArray(events)) {

      events = [events]
    }

    for (let event of events) {
      for (let i = 1; i <= this.nb; i++) {
        let side = i as Side
        if (side === pov) continue
        this.events.get(side)!.push(event.pov(this.nb, side))
      }
      this.specs.push(event)
    }

  }

  all(events: Event | Event[]) {

    if (!Array.isArray(events)) {

      events = [events]
    }

    for (let event of events) {
      for (let i = 1; i <= this.nb; i++) {
        let side: Side = i as Side
        this.events.get(side)!.push(event.pov(this.nb, side))
      }
      this.specs.push(event)
    }
  }

  only(s: Side, event: Event) {
    this.events.get(s)!.push(event.pov(this.nb, s))
    this.specs.push(event)
  }

  pov(s: Side) {
    return this.events.get(s)
  }

  get spec() {
    return this.specs
  }


  get extra(): RoundNExtra {

    let turn = this.specs.find(_ => _ instanceof ChangeState && _.state === '@')

    if (turn) {
      let time_left = 13000
      let flop = this.specs.find(_ => _ instanceof FlopEvent)
      let turn = this.specs.find(_ => _ instanceof TurnEvent)
      let river = this.specs.find(_ => _ instanceof RiverEvent)

      if (flop) { time_left += 2000 }
      if (turn) { time_left += 3000 }
      if (river) { time_left += 4000 }

      return { time_left }
    }

    return {}
  }
}

export type RoundNExtra = {
  time_left?: number
}