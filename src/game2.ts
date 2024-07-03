import { Chips, Side, StackState, next_side, pov_side, ButtonEvent, StackAddEvent, ChangeState, Events, num, find_sides } from './round2'

export class GDests {

  constructor(
    public sit?: Side[],
    public lea?: Side[],
    public deal?: true,
    public folds?: Side[],
    public nexts?: Side[],
    public share?: true,
    public js?: Side[]
  ) {}

  get fen() {
    let res = []
    if (this.sit) {
      res.push(`sit-${this.sit.join('')}`)
    }

    if (this.lea) {
      res.push(`lea-${this.lea.join('')}`)
    }

    if (this.deal) {
      res.push('deal')
    }

    if (this.js) {
      res.push(`i-${this.js.join('')}`)
    }

    if (this.folds) {
      res.push(`f-${this.folds.join('')}`)
    }

    if (this.nexts) {
      res.push(`n-${this.nexts.join('')}`)
    }

    if (this.share) {
      res.push('share')
    }

    return res.join(' ')
  }
}

export type SeatState = string

export class Seat {

  static get empty() { 
    return new Seat('e', 0)
  }

  static from_fen = (fen: string) => {
    let state = fen.trim()[0]
    let chips = fen.trim().slice(1)
    return new Seat(state, num(chips))
  }

  constructor(
    public state: SeatState,
    public chips: Chips) {}


  get fen() {
    return `${this.state}${this.chips}`
  }
}

function make_game(small_blind: number, nb: number) {
  let seats = [...Array(nb)].map(_ => Seat.empty)
  return new GameN(small_blind, 1, seats)
}

export class GameN {

  static nine = (small_blind: number) => make_game(small_blind, 9)
  static six = (small_blind: number) => make_game(small_blind, 6)
  static three = (small_blind: number) => make_game(small_blind, 3)
  static headsup = (small_blind: number) => make_game(small_blind, 2)

  //`10-20 1 | e0 / e0 / e0`
  static from_fen = (fen: string) => {
    let [head, seats] = fen.split(' | ')

    let [blinds, button] = head.split(' ')
    let [small_blind] = blinds.split('-')


    return new GameN(num(small_blind), num(button) as Side, seats.split(' / ').map(Seat.from_fen))
  }

  constructor(
    readonly small_blind: Chips,
    public button: Side,
    readonly seats: Seat[]
  ) {}

  get nb() {
    return this.seats.length
  }

  find_seat_sides_with_states(n: SeatState | SeatState[]) {
    if (!Array.isArray(n)) {
      n = [n]
    }

    return find_sides(this.seats, _ => n.includes(_.state))
  }

  find_seat_with_states(n: SeatState | SeatState[]) {
    if (!Array.isArray(n)) {
      n = [n]
    }

    return this.seats.filter(_ => n.includes(_.state))
  }

  get spec() {
    let { nb, small_blind, button } = this

    let seats = this.seats

    return new GameN(small_blind, pov_side(nb, 1, button), seats)
  }

  pov(side: Side) {
    let { nb, small_blind, button, seats } = this

    let pov_seats = seats.slice(side - 1)

    if (side !== 1) {
      pov_seats = [...pov_seats, ...seats.slice(0, side - 1)]
    }

    return new GameN(small_blind, pov_side(nb, side, button), pov_seats)
  }

  get fen() {

    let { small_blind, button } = this

    let big_blind = small_blind * 2

    let header = `${small_blind}-${big_blind} ${button}`
    let seats = this.seats.map(_ => _.fen).join(' / ')


    return `${header} | ${seats}`
  }

  get dests() {
    let dests = new GDests()

    let empties = this.find_seat_sides_with_states('e')
    let ins = this.find_seat_sides_with_states('i')

    if (ins.length > 0) {
      dests.folds = ins
      if (empties.length > 0) {
        dests.nexts = empties
      }
      let nexts = this.find_seat_sides_with_states('n')
      if (nexts.length > 0) {
        dests.lea = nexts
      }

      dests.share = true


      let js = this.find_seat_sides_with_states('j')

      if (js.length > 0) {
        dests.js = js
      }
    } else {


      if (empties.length > 0) {
        dests.sit = empties
      }

      let leavies = this.find_seat_sides_with_states(['s', 'w'])

      if (leavies.length > 0) {
        dests.lea = leavies
      }

      let waits = this.find_seat_sides_with_states('w')

      if (waits.length > 0) {
        dests.deal = true
      }
    }

    return dests
  }


  act(act: string) {

    let events = new Events(this.nb)

    let [cmd, args] = act.split(' ')

    switch (cmd) {
      case 'sit': {
        let [side_s, chips_s] = args.split('-')
        let side = num(side_s) as Side
        let chips = num(chips_s) as Chips

        this.seats[side - 1].chips = chips
        events.all(new StackAddEvent(side, chips))


        let single = this.find_seat_sides_with_states('s')

        if (single.length === 1) {
          events.all(this.change_state(single[0], 'w'))
          events.all(this.change_state(side, 'w'))
        } else {
          events.all(this.change_state(side, 's'))
        }
      } break
      case 'lea': {
        let side = num(args) as Side

        events.all(this.leave(side))

        let waits = this.find_seat_sides_with_states('w')

        if (waits.length === 1) {
          waits.forEach(side => {
            events.all(this.change_state(side, 's'))
          })
        } 
      } break
      case 'deal': {

        let waits = this.find_seat_sides_with_states('w')

        waits.forEach(side => {
          events.all(this.change_state(side, 'i'))
        })

        let next_button = next_side(waits, this.button)
        this.button = next_button

        events.all(new ButtonEvent(this.button))
      } break
      case 'share': {
        let chips = args.split('-').map(num)

        let js = this.find_seat_sides_with_states('j')
        let ins = this.find_seat_sides_with_states('i')
        let ins_and_js = this.find_seat_sides_with_states(['i', 'j'])
        let nexts = this.find_seat_sides_with_states('n')

        for (let i = 0; i < chips.length; i++) {
          this.seats[ins_and_js[i] - 1].chips = chips[i]
          events.all(new StackAddEvent(ins_and_js[i], chips[i]))
        }

        {
          js.forEach(side => {
            events.all(this.change_state(side, 'e'))
            this.seats[side - 1].chips = 0
            events.all(new StackAddEvent(side, 0))
          })
        }

        let ins_and_nexts = [...ins, ...nexts]

        if (ins_and_nexts.length === 1) {
          ins_and_nexts.forEach(side => {
            events.all(this.change_state(side, 's'))
          })
        } else {
          ins_and_nexts.forEach(side => {
            events.all(this.change_state(side, 'w'))
          })
        }
      } break
      case 'next': {
        let [side_s, chips_s] = args.split('-')
        let side = num(side_s) as Side
        let chips = num(chips_s) as Chips

        this.seats[side - 1].chips = chips
        events.all(new StackAddEvent(side, chips))

        events.all(this.change_state(side, 'n'))
      } break
      case 'fold': {
        let side = num(args) as Side

        events.all(this.change_state(side, 'j'))
      } break
      case 'in': {
        let side = num(args) as Side

        events.all(this.change_state(side, 'i'))
      }
    }

    return events
  }

  private leave(side: Side) {
    let res = []

    this.seats[side - 1].chips = 0
    res.push(new StackAddEvent(side, 0))
    res.push(this.change_state(side, 'e'))

    return res
  }

  private change_state(side: Side, state: StackState) {
    this.seats[side - 1].state = state
    return new ChangeState(side, state)
  }
}


