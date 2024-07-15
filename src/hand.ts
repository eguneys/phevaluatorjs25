import { Card, CardId5, CardId6, CardId7, Rank, card_id, split_cards } from './cards'
import { 
  pair_kickers,
  ppair_kickers,
  flush_kickers,
  set_kickers } from './flush_kickers.json'
import { evaluate_5cards, evaluate_6cards, evaluate_7cards } from './pheval'

/* http://suffe.cool/poker/7462.html */

/* https://github.com/eguneys/XPokerEval/blob/master/XPokerEval.TwoPlusTwo/generate_table.cpp#L245 */

//let nb_rs = [0, 1277, 2860, 858, 858, 10, 1277, 156, 156, 10]
let nb_rs_sum = [-1, 0, 1277, 4137, 4995, 5853, 5863, 7140, 7296, 7452, 7462]
/*
export function get_klass(cards: Card[]) {
  let l = lookup_cards(cards)
  let h = ((l >> 12) & 0xf)
  let r = l & 0x0fff

  let s = nb_rs_sum[h]
  let klass = s + r

  return [klass, h, r]
}
  */

export const STRAIGHT_FLUSH = 1
export const FOUR_OF_A_KIND = 2
export const FULL_HOUSE = 3
export const FLUSH = 4
export const STRAIGHT = 5
export const THREE_OF_A_KIND = 6
export const TWO_PAIR = 7
export const ONE_PAIR = 8
export const HIGH_CARD = 9

export function get_rank_category(rank: number) {
  if (rank > 6185) return HIGH_CARD;        // 1277 high card
  if (rank > 3325) return ONE_PAIR;         // 2860 one pair
  if (rank > 2467) return TWO_PAIR;         //  858 two pair
  if (rank > 1609) return THREE_OF_A_KIND;  //  858 three-kind
  if (rank > 1599) return STRAIGHT;         //   10 straights
  if (rank > 322) return FLUSH;             // 1277 flushes
  if (rank > 166) return FULL_HOUSE;        //  156 full house
  if (rank > 10) return FOUR_OF_A_KIND;     //  156 four-kind
  return STRAIGHT_FLUSH;    
}

export function get_klass(cards: Card[]) {
    let holdrank = evaluate_ncards(cards)

    let klass = 7463 - holdrank
    let h = 10 - get_rank_category(holdrank)
    let r = klass - nb_rs_sum[h]

    return [klass, h, r]
}


function kicker_math(r: number, ds: number[]) {
  let ds_sums = ds.map((d, i) =>
    d * ds.slice(i + 1).reduce((a, b) => a * b, 1))

  let ranges = ds.map(_d => [...Array(13).keys()].map(i => 13 - i))

  let res = []
  for (let i = 0; i < ds.length; i++) {
    let d = ds[i]
    let a = Math.ceil(r / (ds_sums[i + 1] ?? 1))
    r -= (a - 1) * ds_sums[i + 1]

    res.push(ranges[i][d - a])

    for (let j = i + 1; j < ranges.length; j++) {
      ranges[j].splice(ranges[j].indexOf(res[res.length - 1]), 1)
    }
  }
  return res
}

function decode_pair_kicker(n: number) {
  return [n & 0xf, n >> 4 & 0xf, n >> 8 & 0xf, n >> 12 & 0xf]
}

function decode_set_kicker(n: number) {
  return [n & 0xf, n >> 4 & 0xf, n >> 8 & 0xf]
}

function decode_flush_kicker(n: number) {
  return [n & 0xf, n >> 4 & 0xf, n >> 8 & 0xf, n >> 12 & 0xf, n >> 16 & 0xf]
}

function flush_kicker_math(r: number) {
  return decode_flush_kicker(flush_kickers[r - 1])
}

function set_kicker_math(r: number) {
  return decode_set_kicker(set_kickers[r - 1])
}

function ppair_kicker_math(r: number) {
  return decode_set_kicker(ppair_kickers[r - 1])
}

function pair_kicker_math(r: number) {
  return decode_pair_kicker(pair_kickers[r - 1])
}

function get_kickers(_klass: number, h: number, r: number) {
  //let min_r = nb_rs_sum[h]
  //let max_r = nb_rs_sum[h + 1]
  //let nb_r = max_r - min_r
  switch (h) {
    case 9: case 5:
      return kicker_math(r, [10])
    case 8: case 7:
      return kicker_math(r, [13, 12])
    case 6:
      return flush_kicker_math(r)
    case 4:
      return set_kicker_math(r)
    case 3:
      return ppair_kicker_math(r)
    case 2:
      return pair_kicker_math(r)
    case 1:
      return flush_kicker_math(r)
    default: return [0]
  }
}


const ranks_asc = '23456789TJQKA'

const rank_long: Record<Rank, [string, string]> = {
  '2': ['Deuce', 'Deuces'],
  '3': ['Trey', 'Treys'],
  '4': ['Four', 'Fours'],
  '5': ['Five', 'Fives'],
  '6': ['Six', 'Sixes'],
  '7':  ['Seven', 'Sevens'],
  '8':  ['Eight', 'Eights'],
  '9':  ['Nine', 'Nines'],
  'T':  ['Ten', 'Tens'],
  'J':  ['Jack', 'Jacks'],
  'Q':  ['Queen', 'Queens'],
  'K':  ['King', 'Kings'],
  'A':  ['Ace', 'Aces']
}

const descs = ['', '1-High', 'Pair of 1_', 
  '1_ and 2_', 'Three 1_', '1-High Straight', '1-High Flush', '1_ Full over 2_',
'Four 1_', '1-High Straight Flush']

function get_desc(klass: number, h: number, _r: number, kickers: number[]) {
  let ones = kickers.map(_ => rank_long[ranks_asc[_ - 1]])

  if (klass === 7462) {
    return 'Royal Flush'
  } else {
    return descs[h]
    .replace('1_', ones[0][1])
    .replace('1', ones[0][0])
    .replace('2_', ones[1]?.[1])
    .replace('2', ones[1]?.[0])
  }
}

const short_descs = ['', 'high xyzXY', 'pair xyzX', 
  'ppair xyz', 'set xyz', 'straight x', 'flush xyzXY', 'full xy',
'quads x', 'sflush x']
function get_shorter_desc(_klass: number, h: number, _r: number, kickers: number[]) {
  let ones = kickers.map(_ => ranks_asc[_ - 1])
  return short_descs[h]
  .replace('x', ones[0])
  .replace('y', ones[1])
  .replace('z', ones[2])
  .replace('X', ones[3])
  .replace('Y', ones[4])
}

const abbrs = ['', 'HC', '1P', '2P', '3K', 'S', 'F', 'FH', '4K', 'SF']

function get_abbr(_klass: number, h: number, _r: number) {
  return abbrs[h]
}



export function get_klass_info(cards: Card[]) {
  let [klass, h, r] = get_klass(cards),
    abbr = get_abbr(klass, h, r),
    kickers = get_kickers(klass, h, r),
    desc = get_desc(klass, h, r, kickers),
    short_desc = get_shorter_desc(klass, h, r, kickers)

  return {
    klass,
    abbr,
    desc,
    short_desc,
    kickers
  }
}

export function get_klass_info_str(cards: string) {
  return get_klass_info(split_cards(cards))
}

export function lookup_cards_str(cards: string) {
    return lookup_cards(split_cards(cards))
}

export function lookup_cards(cards: Card[]) {
  return 7463 - evaluate_ncards(cards)
}

export function evaluate_ncards(cards: Card[]) {
    switch (cards.length) {
        case 5:
            return evaluate_5cards(...(cards.map(_ => card_id(_)) as CardId5))
        case 6:
            return evaluate_6cards(...(cards.map(_ => card_id(_)) as CardId6))
        default:
            return evaluate_7cards(...(cards.map(_ => card_id(_)) as CardId7))
    }
}