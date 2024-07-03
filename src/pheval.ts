import { bit_of_div_4, bit_of_mod_4_x_3, dp, flush, noflush5, noflush6, noflush7, suits } from "./tables"


function hash_quinary(q: number[], k: number) {
  let sum = 0
  let len = 13

  for (let i = 0; i < len; i++) {
    sum += dp[q[i]][len-i-1][k]

    k-= q[i]

    if (k <= 0) {
      break
    }
  }
  return sum
}


/* https://github.com/HenryRLee/PokerHandEvaluator/blob/develop/cpp/src/evaluator5.c */
export function evaluate_5cards(a: number, b: number, c: number, d: number, e: number) {


  let suit_hash = 0

  suit_hash += bit_of_mod_4_x_3[a]
  suit_hash += bit_of_mod_4_x_3[b]
  suit_hash += bit_of_mod_4_x_3[c]
  suit_hash += bit_of_mod_4_x_3[d]
  suit_hash += bit_of_mod_4_x_3[e]

  if (suits[suit_hash]) {
    let suit_binary = [0, 0, 0, 0]

    suit_binary[a & 0x3] |= bit_of_div_4[a]
    suit_binary[b & 0x3] |= bit_of_div_4[b]
    suit_binary[c & 0x3] |= bit_of_div_4[c]
    suit_binary[d & 0x3] |= bit_of_div_4[d]
    suit_binary[e & 0x3] |= bit_of_div_4[e]

    return flush[suit_binary[suits[suit_hash] - 1]]
  }

  let quinary = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]


  quinary[(a >> 2)]++
  quinary[(b >> 2)]++
  quinary[(c >> 2)]++
  quinary[(d >> 2)]++
  quinary[(e >> 2)]++


  let hash = hash_quinary(quinary, 5)

  return noflush5[hash]
}

export function evaluate_6cards(a: number, b: number, c: number, d: number, e: number, f: number) {

  let suit_hash = 0

  suit_hash += bit_of_mod_4_x_3[a]
  suit_hash += bit_of_mod_4_x_3[b]
  suit_hash += bit_of_mod_4_x_3[c]
  suit_hash += bit_of_mod_4_x_3[d]
  suit_hash += bit_of_mod_4_x_3[e]
  suit_hash += bit_of_mod_4_x_3[f]


  if (suits[suit_hash]) {
    let suit_binary = [0, 0, 0, 0]

    suit_binary[a & 0x3] |= bit_of_div_4[a]
    suit_binary[b & 0x3] |= bit_of_div_4[b]
    suit_binary[c & 0x3] |= bit_of_div_4[c]
    suit_binary[d & 0x3] |= bit_of_div_4[d]
    suit_binary[e & 0x3] |= bit_of_div_4[e]
    suit_binary[f & 0x3] |= bit_of_div_4[f]


    return flush[suit_binary[suits[suit_hash] - 1]]
  }

  let quinary = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]


  quinary[(a >> 2)]++
  quinary[(b >> 2)]++
  quinary[(c >> 2)]++
  quinary[(d >> 2)]++
  quinary[(e >> 2)]++
  quinary[(f >> 2)]++

  let hash = hash_quinary(quinary, 6)

  return noflush6[hash]
}

export function evaluate_7cards(a: number, b: number, c: number, d: number, e: number, f: number, g: number) {

  let suit_hash = 0

  suit_hash += bit_of_mod_4_x_3[a]
  suit_hash += bit_of_mod_4_x_3[b]
  suit_hash += bit_of_mod_4_x_3[c]
  suit_hash += bit_of_mod_4_x_3[d]
  suit_hash += bit_of_mod_4_x_3[e]
  suit_hash += bit_of_mod_4_x_3[f]
  suit_hash += bit_of_mod_4_x_3[g]


  if (suits[suit_hash]) {
    let suit_binary = [0, 0, 0, 0]

    suit_binary[a & 0x3] |= bit_of_div_4[a]
    suit_binary[b & 0x3] |= bit_of_div_4[b]
    suit_binary[c & 0x3] |= bit_of_div_4[c]
    suit_binary[d & 0x3] |= bit_of_div_4[d]
    suit_binary[e & 0x3] |= bit_of_div_4[e]
    suit_binary[f & 0x3] |= bit_of_div_4[f]
    suit_binary[g & 0x3] |= bit_of_div_4[g]


    return flush[suit_binary[suits[suit_hash] - 1]]
  }

  let quinary = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]


  quinary[(a >> 2)]++
  quinary[(b >> 2)]++
  quinary[(c >> 2)]++
  quinary[(d >> 2)]++
  quinary[(e >> 2)]++
  quinary[(f >> 2)]++
  quinary[(g >> 2)]++

  let hash = hash_quinary(quinary, 7)

  return noflush7[hash]
}


