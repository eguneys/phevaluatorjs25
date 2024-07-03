import { it, expect } from 'vitest'

import { evaluate_7cards } from '../src/main'
import { Card7, CardId7, split_cards_to_ids } from '../src/card'

it('works', () => {

    let rank1 = evaluate_7cards(...(split_cards_to_ids("9c4c4s9d4hQc6c") as CardId7))
    let rank2 = evaluate_7cards(...(split_cards_to_ids("9c4c4s9d4h2c9h") as CardId7))


    expect(rank1).toBe(292)
    expect(rank2).toBe(236)
})