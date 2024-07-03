export const ranks = "23456789TJQKA".split('')

export const suits = "cdhs".split('')

export type Rank = typeof ranks[number]
export type Suit = typeof suits[number]

export type Card = `${Rank}${Suit}`

export type Card3 = [Card, Card, Card]
export type Card5 = [Card, Card, Card, Card, Card]
export type Card7 = [Card, Card, Card, Card, Card, Card, Card]

export type CardId3 = [number, number, number]
export type CardId5 = [number, number, number, number, number]
export type CardId6 = [number, number, number, number, number, number]
export type CardId7 = [number, number, number, number, number, number, number]



export function card_id(card: Card) {
    return ranks.indexOf(card[0]) * 4 + suits.indexOf(card[1])
}

export function id_card(id: number): Card {
    return `${ranks[id / 4]}${suits[id % 4]}`
}

export function split_cards(cards: string, nb = cards.length / 2): Card[] {
    return [...Array(nb).keys()].map(_ => cards.slice(_ * 2, _ * 2 + 2))
}

export function split_cards_to_ids(cs: string): number[] {
    return split_cards(cs).map(_ => card_id(_))
}

export const cards = suits.flatMap(suit => ranks.map(rank => `${rank}${suit}`))

export function make_cards(nb: number) {
    let deck = shuffle(cards.slice(0))
    return deck.slice(0, nb).join('')
}

export function make_deal(nb: number) {
    return make_cards(5 + nb * 2)
}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function shuffle<A>(array: A[]) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}