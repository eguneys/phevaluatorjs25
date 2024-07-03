import { Card } from './cards'

export class HandRank {

  static from_fen = (fen: string) => {
    let [high, ...rest] = fen.split(' ')

    switch (high) {
      case 'high':
        return HandRank.high(rest as [Card, Card, Card, Card, Card])
      case 'pair':
        return HandRank.pair(rest as [Card, Card, Card, Card])
      case 'ppair':
        return HandRank.pair2(rest as [Card, Card, Card])
      case 'set':
        return HandRank.set(rest as [Card, Card, Card])
      case 'full':
        return HandRank.full(rest as [Card, Card])
      case 'straight':
        return HandRank.straight(rest[0])
      case 'flush':
        return HandRank.flush(rest as [Card, Card, Card, Card, Card])
      case 'quad':
        return HandRank.quad(rest[0])
      case 'sflush':
        return HandRank.sflush(rest[0])
    }
  }

  static quad = (quad: Card) => new HandRank(quad)
  static high = (high: [Card, Card, Card, Card, Card]) => new HandRank(undefined, high)
  static pair = (pair: [Card, Card, Card, Card]) => new HandRank(undefined, undefined, pair)
  static pair2 = (pair2: [Card, Card, Card]) => new HandRank(undefined, undefined, undefined, pair2)
  static set = (set: [Card, Card, Card]) => new HandRank(undefined, undefined, undefined, undefined, set)
  static full = (full: [Card, Card]) => new HandRank(undefined, undefined, undefined, undefined, undefined, full)
  static straight = (straight: Card) => new HandRank(undefined, undefined, undefined, undefined, undefined, undefined, straight)
  static flush = (flush: [Card, Card, Card, Card, Card]) => new HandRank(undefined, undefined, undefined, undefined, undefined, undefined, undefined, flush)
  static sflush = (sflush: Card) => new HandRank(undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, sflush)

  constructor(public quad?: Card, 
              public high?: [Card, Card, Card, Card, Card],
             public pair?: [Card, Card, Card, Card],
             public pair2?: [Card, Card, Card],
             public set?: [Card, Card, Card],
             public full?: [Card, Card],
             public straight?: Card,
             public flush?: [Card, Card, Card, Card, Card],
             public sflush?: Card) {}

  get rank_name() {
    if (this.quad) {
      return 'quad'
    } else if (this.high) {
      return 'high'
    } else if (this.pair) {
      return 'pair'
    } else if (this.pair2) {
      return 'ppair'
    } else if (this.set) {
      return 'set'
    } else if (this.full) {
      return 'full'
    } else if (this.straight) {
      return 'straight'
    } else if (this.flush) {
      return 'flush'
    } else if (this.sflush) {
      return 'sflush'
    }
  }

  get high_card() {
    if (this.quad) {
      return this.quad
    } else if (this.high) {
      return this.high[0]
    } else if (this.pair) {
      return this.pair[0]
    } else if (this.pair2) {
      return this.pair2[0]
    } else if (this.set) {
      return this.set[0]
    } else if (this.full) {
      return this.full[0]
    } else if (this.straight) {
      return this.straight
    } else if (this.flush) {
      return this.flush[0]
    } else if (this.sflush) {
      return this.sflush
    }
  }

  get fen() {
    if (this.quad) {
      return `quad ${this.quad}`
    }
    if (this.high) {
      return `high ${this.high.join(' ')}`
    }
    if (this.full) {
      return `full ${this.full.join(' ')}`
    }
    if (this.set) {
      return `set ${this.set.join(' ')}`
    }
    if (this.pair2) {
      return `ppair ${this.pair2.join(' ')}`
    }
    if (this.pair) {
      return `pair ${this.pair.join(' ')}`
    }

    if (this.sflush) {
      return `sflush ${this.sflush}`
    }

    if (this.straight) {
      return `straight ${this.straight}`
    }

    if (this.flush) {
      return `flush ${this.flush.join(' ')}`
    }
  }

  get hand_eval() {
    return 0
  }
}

export function hand_rank(_cards: Card[]) {

  return new HandRank()
}
