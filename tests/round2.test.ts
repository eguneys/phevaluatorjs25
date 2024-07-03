import { it, expect } from 'vitest'
import { RoundN, RoundNPov } from '../src'

it('reads shares from fen', () => {
  let fens = [
    '10-20 1 | d3000 / d3000 $!',
    '10-20 1 | i2980 3cQs bb-0-0-20 / @2990 sb-0-0-10 $!',
    '10-20 1 | @2980 3cQs bb-0-0-20 / i2960 raise-10-10-20 $!',
    '10-20 1 | i2840 3cQs raise-20-20-120 / @2960 raise-10-10-20 $!',
    '10-20 1 | @2840 3cQs raise-20-20-120 / i2720 raise-40-120-120 $!',
    '10-20 1 | i1840 3cQs raise-160-120-880 / @2720 raise-40-120-120 $!',
    '10-20 1 | @1840 3cQs raise-160-120-880 / i960 raise-280-880-880 $!',
    '10-20 1 | f1840 3cQs fold-1160 / p960 raise-280-880-880 $!',
    '10-20 1 | f1840 3cQs / w960 $ 3200-2 !',
    '10-20 2 | s0 Jc2c / s2240 Kc9c $ 320-2side 3440-21 ! shares back-2-320 swin-2-3440'
  ]

  fens.forEach(fen => {
    let r = RoundNPov.from_fen(fen)
    expect(r.fen).toBe(fen)
  })
})

it('fold against allin', () => {
  let r = RoundN.from_fen(`10-20 2 | @2960 3sKc raise-10-10-20 / a0 allin-20-20-2960 $!`)

  expect(r.dests.fen).toBe('raise-2960-2960x2960-0 fold')
  r.act('fold')
  expect(r.fen).toBe(`10-20 2 | f2960 3sKc fold-40 / a0 allin-20-20-2960 $!`)
  expect(r.dests.fen).toBe('phase')
  r.act('phase')
  expect(r.fen).toBe(`10-20 2 | f2960 3sKc / w0 $ 3040-2 !`)
})

it('cant raise an allin if can call', () => {
  let r = RoundN.from_fen(`10-20 2 | a0 5h6d allin-10-10-2960 / @3000 bb-0-0-20 $!`)
  expect(r.dests.fen).toBe('call-2960 fold')
})

it('went allin for equal to last actions bet', () => {
  let r = RoundN.from_fen(`85-170 2 | i3960 AdTd raise-680-170-170 / @170 4hKh call-0-850 $!p6dTc4c9c7d`)
  expect(r.dests.fen).toBe('raise-170-170x170-0 fold')

  r.act('raise 170-0')
  expect(r.fen).toBe(`85-170 2 | p3960 AdTd raise-680-170-170 / a0 4hKh allin-850-170-0 $!p6dTc4c9c7d`)
  expect(r.dests.fen).toBe('phase')
})

it('side pot calculation goes negative', () => {

  let r = RoundN.from_fen(`85-170 1 | i50 6h4s raise-2550-170-170 / @340 QcKh raise-2380-170-170 $!pAh6dAs7cQd`)
  expect(r.dests.fen).toBe(`call-170 raise-170-170 fold`)

  r.act('raise 170-170')
  expect(r.fen).toBe(`85-170 1 | @50 6h4s raise-2550-170-170 / a0 QcKh allin-2720-170-170 $!pAh6dAs7cQd`)
  expect(r.dests.fen).toBe('raise-170-170x50-0 fold')
})

it('allin only match toraise = 0', () => {
  let r = RoundN.from_fen(`60-120 2 | @120 5d2h / i4800 5cKd raise-0-0-120 $ 960-12 !rTdQcJc5sKs`)
  expect(r.dests.fen).toBe(`raise-120-120x120-0 fold`)

  r.act('raise 120-0')

  expect(r.fen).toBe(`60-120 2 | a0 5d2h allin-0-120-0 / p4800 5cKd raise-0-0-120 $ 960-12 !rTdQcJc5sKs`)
  expect(r.dests.fen).toBe('phase')
})

it('bb allin for sb amount', () => {
  let r = RoundN.from_fen(`35-70 2 | d5965 / d35 $!`)
  expect(r.dests.fen).toBe('deal-2')

  r.act('deal AhAc2h2c3h4h5h6h7h')
  expect(r.fen).toBe(`35-70 2 | p5930 AhAc call-0-35 / a0 2h2c allin-0-0-35 $!p3h4h5h6h7h`)
})

it('sb allin', () => {
  let r = RoundN.from_fen(`160-320 1 | d5920 / d80 $!`)
  expect(r.dests.fen).toBe('deal-2')

  r.act('deal AhAc2h2c3h4h5h6h7h')
  expect(r.fen).toBe(`160-320 1 | p5840 AhAc call-0-80 / a0 2h2c allin-0-0-80 $!p3h4h5h6h7h`)


})

it('headsup bb is allin for less than sb', () => {
  let r = RoundN.from_fen(`410-820 2 | d5550 / d40 $!`)
  expect(r.dests.fen).toBe('deal-2')

  r.act('deal AhAc2h2c3h3c4h5h6h7h8h')
  expect(r.fen).toBe(`410-820 2 | p5510 AhAc call-0-40 / a0 2h2c allin-0-0-40 $!p3h3c4h5h6h`)
})

it('headsup ai play tests', () => {
  let r = RoundN.from_fen(`185-370 1 | p2555 Ac3h bb-0-0-370 / f2890 TdKc fold-185 $!pQc5d5h8dJc`)
  expect(r.dests.fen).toBe('phase')
  r.act('phase')
})

it('bench raise tests', () => {
  let fen0 = `10-20 1 | @80 Qh9s / i80 2c6d / i230 9h8c raise-0-0-30 $ 60-123 !f9dTc4c3h6c`
  let fen = `10-20 1 | @50 Qh9s call-0-30 / i80 2c6d / i230 9h8c raise-0-0-30 $ 60-123 !f9dTc4c3h6c`
  let act = `call 30`

  let r = RoundN.from_fen(fen0)
  expect(r.dests.fen).toBe(`call-30 raise-30-30 fold`)
  r.act(`call 30`)
  expect(r.fen).toBe(`10-20 1 | i50 Qh9s call-0-30 / @80 2c6d / i230 9h8c raise-0-0-30 $ 60-123 !f9dTc4c3h6c`)

})
it('bench tests', () => {

	let r = RoundN.from_fen(`10-20 1 | d100 / d100 / d280 $!`)

  r.act('deal AhAc2h2c3h3c4h5h6h7h8h')
  r.act('fold')
  r.act('call 10')
  r.act('check')
  r.act('phase')
  expect(r.dests.fen).toBe('check raise-0-20 fold')
  r.act('fold')
  expect(r.fen).toBe(`10-20 1 | f100 AhAc / p80 2h2c / f260 3h3c fold-0 $ 40-23 !f4h5h6h7h8h`)


})

it('everyone is allin or fold in phase', () => {
  let r = RoundN.from_fen('10-20 1 | a0 KsJc allin-0-0-10 / @10 7d2c / f260 Qh3h $ 200-12 !r9cTh4c9dJh')

  expect(r.dests.fen).toBe('raise-10-20x10-0 fold')
  r.act('fold')
  expect(r.fen).toBe('10-20 1 | a0 KsJc allin-0-0-10 / f10 7d2c fold-0 / f260 Qh3h $ 200-12 !r9cTh4c9dJh')
  expect(r.dests.fen).toBe('phase')
  r.act('phase')

  expect(r.fen).toBe('10-20 1 | w0 KsJc / f10 7d2c / f260 Qh3h $ 210-1 !r9cTh4c9dJh')
  expect(r.dests.fen).toBe('win')

  r.act('win')
  expect(r.fen).toBe('10-20 1 | w0 KsJc / f10 7d2c / f260 Qh3h $ 210-1 !r9cTh4c9dJh shares win-1-210')

})

it('cant raise if others are allin', () => {
  let r = RoundN.from_fen(`10-20 1 | f100 Kc8h fold-0 / a0 5sTs allin-20-40-40 / @220 Qc4h raise-20-0-40 $!p3dKsKh7dJh`)
  expect(r.dests.fen).toBe(`call-40 fold`)
})

it('a player allin when previous last player has raised more', () => {

  let r = RoundN.from_fen(`10-20 1 | d100 / d100 / d280 $!`)
  r.act('deal AhAc2h2c3h3c4h5h6h7h8h')

  let acts = [
    'raise 20-20',
    'raise 30-60',
    'raise 80-160',
    'raise 60-0'  
  ]

  acts.slice(0, -1).forEach(_ => r.act(_))

  expect(r.fen).toBe(`10-20 1 | @60 AhAc raise-0-20-20 / a0 2h2c allin-10-30-60 / i20 3h3c raise-20-80-160 $!p4h5h6h7h8h`)

  r.act('raise 60-0')

  expect(r.fen).toBe(`10-20 1 | a0 AhAc allin-40-60-0 / a0 2h2c allin-10-30-60 / p20 3h3c raise-20-80-160 $!p4h5h6h7h8h`)

  expect(r.dests.fen).toBe('phase')

  r.act('phase')
  expect(r.fen).toBe(`10-20 1 | s0 AhAc / s0 2h2c / s20 3h3c $ 160-3side 300-312 0-32 !p4h5h6h7h8h`)
  expect(r.dests.fen).toBe('showdown')

})


it('bb has bet more than previous hasnt acted raise-- bug cannot happen', () => {

  let r = RoundN.from_fen(`10-20 1 | d10 / d10 / d280 $!`)

  r.act('deal AhAc2h2c3h3c4h5h6h7h8h')

  expect(r.fen).toBe(`10-20 1 | @10 AhAc / a0 2h2c allin-0-0-10 / i260 3h3c bb-0-0-20 $!p4h5h6h7h8h`)

  expect(r.dests.fen).toBe('raise-20-20x10-0 fold')
  r.act('fold')

  expect(r.fen).toBe(`10-20 1 | f10 AhAc fold-0 / a0 2h2c allin-0-0-10 / p260 3h3c bb-0-0-20 $!p4h5h6h7h8h`)
  expect(r.dests.fen).toBe('phase')
  r.act('phase')

  expect(r.fen).toBe(`10-20 1 | f10 AhAc / s0 2h2c / s260 3h3c $ 10-3side 20-32 !p4h5h6h7h8h`)
  expect(r.dests.fen).toBe('showdown')

  r.act('showdown')
  expect(r.fen).toBe(`10-20 1 | f10 AhAc / s0 2h2c / s260 3h3c $ 10-3side 20-32 !p4h5h6h7h8h shares back-3-10 swin-3-20`)

  expect(r.dests.fen).toBe('share')
  r.act('share')
  expect(r.fen).toBe(`10-20 1 | x10 / e0 / x290 $!`)

})

it('everyone folds', () => {

  let r = RoundN.from_fen(`10-20 1 | f60 AhAc fold-0 / @190 2h2c sb-0-0-10 / i280 3h3c bb-0-0-20 $!p4h5h6h7h8h`)
  r.act('fold')

  expect(r.fen).toBe(`10-20 1 | f60 AhAc fold-0 / f190 2h2c fold-10 / p280 3h3c bb-0-0-20 $!p4h5h6h7h8h`)
  expect(r.dests.fen).toBe('phase')

  let events = r.act('phase')

  expect(r.fen).toBe(`10-20 1 | f60 AhAc / f190 2h2c / w280 3h3c $ 30-3 !p4h5h6h7h8h`)

  expect(events.pov(1).map(_ => _.fen)).toStrictEqual(['p 3 20', 'p 2 10', 'a 1', 'a 2', 'a 3', 'c 3 w'])

  expect(r.dests.fen).toBe('win')

  r.act('win')
  expect(r.fen).toBe(`10-20 1 | f60 AhAc / f190 2h2c / w280 3h3c $ 30-3 !p4h5h6h7h8h shares win-3-30`)

  expect(r.dests.fen).toBe('share')

  r.act('share')

  expect(r.fen).toBe(`10-20 1 | x60 / x190 / x310 $!`)
  expect(r.dests.fen).toBe('fin')
})


it('button folds', () => {

  let r = RoundN.from_fen(`10-20 1 | i60 AhAc call-0-20 / @190 2h2c sb-0-0-10 / i280 3h3c bb-0-0-20 $!p4h5h6h7h8h`)
  expect(r.dests.fen).toBe('call-10 raise-10-20 fold')
  r.act('call 10')

  expect(r.dests.fen).toBe('check raise-0-20 fold')
  r.act('fold')

  expect(r.fen).toBe(`10-20 1 | p60 AhAc call-0-20 / p180 2h2c call-10-10 / f280 3h3c fold-20 $!p4h5h6h7h8h`)
  expect(r.dests.fen).toBe('phase')

  r.act('phase')
  expect(r.fen).toBe(`10-20 1 | @60 AhAc / i180 2h2c / f280 3h3c $ 60-12 !f4h5h6h7h8h`)
})

it('bb folds', () => {
  let r = RoundN.from_fen(`10-20 1 | i60 AhAc raise-0-20-20 / @190 2h2c sb-0-0-10 / i280 3h3c bb-0-0-20 $!p4h5h6h7h8h`)
  expect(r.dests.fen).toBe('call-30 raise-30-20 fold')
  r.act('call 30')

  expect(r.dests.fen).toBe('call-20 raise-20-20 fold')
  r.act('fold')
  expect(r.fen).toBe(`10-20 1 | p60 AhAc raise-0-20-20 / p160 2h2c call-10-30 / f280 3h3c fold-20 $!p4h5h6h7h8h`)
  expect(r.dests.fen).toBe('phase')

  r.act('phase')

  expect(r.fen).toBe(`10-20 1 | @60 AhAc / i160 2h2c / f280 3h3c $ 100-12 !f4h5h6h7h8h`)

  expect(r.dests.fen).toBe('check raise-0-20 fold')
  r.act('check')
  expect(r.dests.fen).toBe('check raise-0-20 fold')
  r.act('check')
  expect(r.dests.fen).toBe('phase')
  r.act('phase')
  expect(r.dests.fen).toBe('check raise-0-20 fold')
  r.act('check')
  expect(r.dests.fen).toBe('check raise-0-20 fold')
  r.act('check')
  expect(r.dests.fen).toBe('phase')
  r.act('phase')
  expect(r.dests.fen).toBe('check raise-0-20 fold')
  r.act('check')
  expect(r.dests.fen).toBe('check raise-0-20 fold')
  r.act('check')
  expect(r.dests.fen).toBe('phase')
  r.act('phase')


  expect(r.fen).toBe(`10-20 1 | s60 AhAc / s160 2h2c / f280 3h3c $ 100-12 !r4h5h6h7h8h`)
  expect(r.dests.fen).toBe('showdown')

  r.act('showdown')
  expect(r.fen).toBe(`10-20 1 | s60 AhAc / s160 2h2c / f280 3h3c $ 100-12 !r4h5h6h7h8h shares swin-1-100`)

  expect(r.dests.fen).toBe('share')

  r.act('share')

  expect(r.fen).toBe(`10-20 1 | x160 / x160 / x280 $!`)
  expect(r.dests.fen).toBe('fin')


})


it('sb folds', () => {

  let r = RoundN.from_fen(`10-20 1 | i60 AhAc raise-0-20-20 / @190 2h2c sb-0-0-10 / i280 3h3c bb-0-0-20 $!p4h5h6h7h8h`)

  r.act('fold')

  expect(r.fen).toBe(`10-20 1 | i60 AhAc raise-0-20-20 / f190 2h2c fold-10 / @280 3h3c bb-0-0-20 $!p4h5h6h7h8h`)

  expect(r.dests.fen).toBe(`call-20 raise-20-20 fold`)

  r.act('call 20')

  expect(r.fen).toBe(`10-20 1 | p60 AhAc raise-0-20-20 / f190 2h2c fold-10 / p260 3h3c call-20-20 $!p4h5h6h7h8h`)

  expect(r.dests.fen).toBe('phase')

  r.act('phase')

  expect(r.fen).toBe(`10-20 1 | i60 AhAc / f190 2h2c / @260 3h3c $ 90-13 !f4h5h6h7h8h`)

  expect(r.dests.fen).toBe('check raise-0-20 fold')
  r.act('check')
  expect(r.dests.fen).toBe('check raise-0-20 fold')


  r.act('check')

  expect(r.fen).toBe(`10-20 1 | p60 AhAc check-0 / f190 2h2c / p260 3h3c check-0 $ 90-13 !f4h5h6h7h8h`)

  expect(r.dests.fen).toBe('phase')
  r.act('phase')

  expect(r.dests.fen).toBe('check raise-0-20 fold')
  r.act('check')
  expect(r.dests.fen).toBe('check raise-0-20 fold')
  r.act('check')
  expect(r.dests.fen).toBe('phase')
  r.act('phase')
  expect(r.dests.fen).toBe('check raise-0-20 fold')
  r.act('check')
  expect(r.dests.fen).toBe('check raise-0-20 fold')
  r.act('check')
  expect(r.dests.fen).toBe('phase')
  r.act('phase')


  expect(r.fen).toBe(`10-20 1 | s60 AhAc / f190 2h2c / s260 3h3c $ 90-13 !r4h5h6h7h8h`)
  expect(r.dests.fen).toBe('showdown')

  r.act('showdown')
  expect(r.fen).toBe(`10-20 1 | s60 AhAc / f190 2h2c / s260 3h3c $ 90-13 !r4h5h6h7h8h shares swin-1-90`)

  expect(r.dests.fen).toBe('share')

  r.act('share')

  expect(r.fen).toBe(`10-20 1 | x150 / x190 / x260 $!`)
  expect(r.dests.fen).toBe('fin')
})

it('everyone is allin', () => {

  let events

  let r = RoundN.from_fen(`10-20 1 | @380 AhAc call-0-20 / i160 2h2c call-0-10 / i280 3h3c raise-20-0-80 $!p4h5h6h7h8h`)
  expect(r.dests.fen).toBe(`call-80 raise-80-80 fold`)

  r.act(`raise 80-300`)
  r.act(`raise 160-0`)
  expect(r.fen).toBe(`10-20 1 | a0 AhAc allin-20-80-300 / a0 2h2c allin-10-160-0 / @280 3h3c raise-20-0-80 $!p4h5h6h7h8h`)
  expect(r.dests.fen).toBe(`raise-300-300x280-0 fold`)

  r.act(`raise 280-0`)
  expect(r.fen).toBe(`10-20 1 | a0 AhAc allin-20-80-300 / a0 2h2c allin-10-160-0 / a0 3h3c allin-100-280-0 $!p4h5h6h7h8h`)

  expect(r.dests.fen).toBe(`phase`)

  events = r.act(`phase`)

  // 400 170 380
  expect(r.fen).toBe(`10-20 1 | s0 AhAc / s0 2h2c / s0 3h3c $ 0-side 510-123 420-13 20-1 !p4h5h6h7h8h`)


  expect(events.pov(1).map(_ => _.fen)).toStrictEqual(['p 1 400', 'p 2 170', 'p 3 380', 'v 2 170', 'v 3 210', 'v 1 20', 'a 1', 'a 2', 'a 3', 'f 4h5h6h', 'h 2 2h2c', 'h 3 3h3c', 't 7h', 'r 8h', 'c 1 s', 'c 2 s', 'c 3 s'])

  expect(r.dests.fen).toBe(`showdown`)

  events = r.act('showdown')
  expect(r.fen).toBe(`10-20 1 | s0 AhAc / s0 2h2c / s0 3h3c $ 0-side 510-123 420-13 20-1 !p4h5h6h7h8h shares swin-1-510 swin-1-420 back-1-20`)

  expect(events.pov(1).map(_ => _.fen)).toStrictEqual(['w swin-1-510', 'w swin-1-420', 'w back-1-20'])

  expect(r.dests.fen).toBe('share')

  events = r.act('share')
  expect(r.fen).toBe(`10-20 1 | x950 / e0 / e0 $!`)

  expect(r.dests.fen).toBe('fin')
})

it('normal allin', () => {

  let r = RoundN.from_fen(`10-20 1 | @380 AhAc call-0-20 / i160 2h2c call-0-10 / i280 3h3c raise-20-0-80 $!4h5h6h7h8h`)
  expect(r.dests.fen).toBe(`call-80 raise-80-80 fold`)

  r.act(`raise 80-300`)
  expect(r.fen).toBe(`10-20 1 | a0 AhAc allin-20-80-300 / @160 2h2c call-0-10 / i280 3h3c raise-20-0-80 $!4h5h6h7h8h`)
  expect(r.dests.fen).toBe(`raise-390-300x160-0 fold`)
})


it('cant post small blind', () => {
  let r = RoundN.from_fen(`10-20 3 | d10 / d180 / d280 $!`)

  r.act('deal AhAc2h2c3h3c4h5h6h7h8h')

  expect(r.fen).toBe(`10-20 3 | a0 AhAc allin-0-0-10 / i160 2h2c bb-0-0-20 / @280 3h3c $!p4h5h6h7h8h`)


})

it('cant post big blind', () => {
  let r = RoundN.from_fen(`10-20 2 | d20 / d180 / d280 $!`)

  r.act('deal AhAc2h2c3h3c4h5h6h7h8h')

  expect(r.fen).toBe(`10-20 2 | a0 AhAc allin-0-0-20 / @180 2h2c / i270 3h3c sb-0-0-10 $!p4h5h6h7h8h`)

})

it('cant raise allin', () => {

  let r = RoundN.from_fen(`10-20 1 | @150 AhAc call-0-20 / i160 2h2c call-0-10 / i280 3h3c raise-20-0-80 $!4h5h6h7h8h`)
  expect(r.dests.fen).toBe(`call-80 raise-80-80x80-70 fold`)

  r.act(`raise 80-70`)
  expect(r.fen).toBe(`10-20 1 | a0 AhAc allin-20-80-70 / @160 2h2c call-0-10 / i280 3h3c raise-20-0-80 $!4h5h6h7h8h`)


  r = RoundN.from_fen(`10-20 1 | @160 AhAc call-0-20 / i160 2h2c call-0-10 / i280 3h3c raise-20-0-80 $!4h5h6h7h8h`)
  expect(r.dests.fen).toBe(`call-80 raise-80-80 fold`)

  r.act(`raise 80-80`)
  expect(r.fen).toBe(`10-20 1 | a0 AhAc allin-20-80-80 / @160 2h2c call-0-10 / i280 3h3c raise-20-0-80 $!4h5h6h7h8h`)
})

it('cant call allin', () => {
  let r = RoundN.from_fen(`10-20 1 | @80 AhAc call-0-20 / i160 2h2c call-0-10 / i280 3h3c raise-20-0-80 $!p4h5h6h7h8h`)
  expect(r.dests.fen).toBe(`raise-80-80x80-0 fold`)

  r.act(`raise 80-0`)
  expect(r.fen).toBe(`10-20 1 | a0 AhAc allin-20-80-0 / @160 2h2c call-0-10 / i280 3h3c raise-20-0-80 $!p4h5h6h7h8h`)

  r = RoundN.from_fen(`10-20 1 | @70 AhAc call-0-20 / i160 2h2c call-0-10 / i280 3h3c raise-20-0-80 $!p4h5h6h7h8h`)
  expect(r.dests.fen).toBe(`raise-80-80x70-0 fold`)

  r.act(`raise 70-0`)
  expect(r.fen).toBe(`10-20 1 | a0 AhAc allin-20-70-0 / @160 2h2c call-0-10 / i280 3h3c raise-20-0-80 $!p4h5h6h7h8h`)



})


it('min raise', () => {
  let r = RoundN.from_fen(`10-20 1 | i60 AhAc raise-0-20-30 / @160 2h2c sb-0-10 / i280 3h3c bb-0-0-20 $!4h5h6h7h8h`)
  expect(r.dests.fen).toBe(`call-40 raise-40-30 fold`)

  r = RoundN.from_fen(`10-20 1 | i60 AhAc raise-0-20-30 / i160 2h2c raise-10-40-50 / @280 3h3c bb-0-0-20 $!4h5h6h7h8h`)
  expect(r.dests.fen).toBe(`call-80 raise-80-50 fold`)
})

it('bb raise', () => {
  let r = RoundN.from_fen(`10-20 1 | i60 AhAc raise-0-20-20 / i160 2h2c call-10-30 / @280 3h3c bb-0-0-20 $!4h5h6h7h8h`)
  //expect(r.dests.fen).toBe(`call-20 raise-20-20 fold`)
  let events = r.act('raise 20-20')

  expect(r.fen).toBe(`10-20 1 | @60 AhAc raise-0-20-20 / i160 2h2c call-10-30 / i240 3h3c raise-20-20-20 $!4h5h6h7h8h`)
  expect(r.dests.fen).toBe(`call-20 raise-20-20 fold`)
  events = r.act('call 20')
  expect(r.dests.fen).toBe(`call-20 raise-20-20 fold`)
  events = r.act('call 20')

  expect(r.fen).toBe(`10-20 1 | p40 AhAc call-40-20 / p140 2h2c call-40-20 / p240 3h3c raise-20-20-20 $!4h5h6h7h8h`)
  expect(r.dests.fen).toBe('phase')

})

it('bb call', () => {

  let r = RoundN.from_fen(`10-20 1 | d100 / d200 / d300 $!`)
  let events = r.act('deal AhAc2h2c3h3c4h5h6h7h8h')
  //expect(r.dests.fen).toBe(`call-20 raise-20-20 fold`)

  events = r.act('raise 20-20')

  expect(r.fen).toBe(`10-20 1 | i60 AhAc raise-0-20-20 / @190 2h2c sb-0-0-10 / i280 3h3c bb-0-0-20 $!p4h5h6h7h8h`)

  expect(events.pov(1).map(_ => _.fen)).toStrictEqual(['a 1 raise-0-20-20', 's 1 40', 'c 1 i', 'c 2 @'])

  expect(r.dests.fen).toBe(`call-30 raise-30-20 fold`)
  events = r.act('call 30')
  expect(r.fen).toBe(`10-20 1 | i60 AhAc raise-0-20-20 / i160 2h2c call-10-30 / @280 3h3c bb-0-0-20 $!p4h5h6h7h8h`)
  expect(r.dests.fen).toBe(`call-20 raise-20-20 fold`)

  events = r.act('call 20')

  expect(r.fen).toBe(`10-20 1 | p60 AhAc raise-0-20-20 / p160 2h2c call-10-30 / p260 3h3c call-20-20 $!p4h5h6h7h8h`)

})

it('three way', () => {

  let r = RoundN.from_fen(`10-20 1 | d100 / d200 / d300 $!`)

  expect(r.pov(1).fen).toBe(`10-20 1 | d100 / d200 / d300 $!`)
  expect(r.pov(2).fen).toBe(`10-20 3 | d200 / d300 / d100 $!`)
  expect(r.pov(3).fen).toBe(`10-20 2 | d300 / d100 / d200 $!`)

  expect(r.dests.fen).toBe('deal-3')

  let events = r.act('deal AhAc2h2c3h3c4h5h6h7h8h')
  expect(r.fen).toBe(`10-20 1 | @100 AhAc / i190 2h2c sb-0-0-10 / i280 3h3c bb-0-0-20 $!p4h5h6h7h8h`)

  expect(r.pov(1).fen).toBe(`10-20 1 | @100 AhAc / i190 sb-0-0-10 / i280 bb-0-0-20 $!`)
  expect(r.pov(2).fen).toBe(`10-20 3 | i190 2h2c sb-0-0-10 / i280 bb-0-0-20 / @100 $!`)
  expect(r.pov(3).fen).toBe(`10-20 2 | i280 3h3c bb-0-0-20 / @100 / i190 sb-0-0-10 $!`)

  expect(events.pov(1).map(_ => _.fen)).toStrictEqual(['c 1 @', 'c 2 i', 'c 3 i', 'a 2 sb-0-0-10','s 2 10', 'a 3 bb-0-0-20', 's 3 20', 'h 1 AhAc'])
  expect(events.pov(2).map(_ => _.fen)).toStrictEqual(['c 3 @', 'c 1 i', 'c 2 i', 'a 1 sb-0-0-10', 's 1 10', 'a 2 bb-0-0-20', 's 2 20', 'h 1 2h2c'])
  expect(events.pov(3).map(_ => _.fen)).toStrictEqual(['c 2 @', 'c 3 i', 'c 1 i', 'a 3 sb-0-0-10', 's 3 10', 'a 1 bb-0-0-20', 's 1 20', 'h 1 3h3c'])

  expect(r.dests.fen).toBe(`call-20 raise-20-20 fold`)

  events = r.act('call 20')
  expect(r.fen).toBe(`10-20 1 | i80 AhAc call-0-20 / @190 2h2c sb-0-0-10 / i280 3h3c bb-0-0-20 $!p4h5h6h7h8h`)

  expect(events.pov(1).map(_ => _.fen)).toStrictEqual(['a 1 call-0-20', 's 1 20', 'c 1 i', 'c 2 @'])

  expect(r.dests.fen).toBe(`call-10 raise-10-20 fold`)

  events = r.act('call 10')
  expect(r.fen).toBe(`10-20 1 | i80 AhAc call-0-20 / i180 2h2c call-10-10 / @280 3h3c bb-0-0-20 $!p4h5h6h7h8h`)

  expect(events.pov(1).map(_ => _.fen)).toStrictEqual(['a 2 call-10-10', 's 2 10', 'c 2 i', 'c 3 @'])

  expect(r.dests.fen).toBe(`check raise-0-20 fold`)


  events = r.act('check')
  expect(r.fen).toBe(`10-20 1 | p80 AhAc call-0-20 / p180 2h2c call-10-10 / p280 3h3c check-20 $!p4h5h6h7h8h`)

  expect(events.pov(1).map(_ => _.fen)).toStrictEqual(['c 1 p', 'c 2 p', 'c 3 p', 'a 3 check-20'])

  expect(r.dests.fen).toBe(`phase`)

  events = r.act('phase')
  expect(r.fen).toBe(`10-20 1 | i80 AhAc / i180 2h2c / @280 3h3c $ 60-123 !f4h5h6h7h8h`)

  expect(r.pov(1).fen).toBe(`10-20 1 | i80 AhAc / i180 / @280 $ 60-123 !4h5h6h`)

  expect(events.pov(1).map(_ => _.fen)).toStrictEqual(['p 1 20', 'p 2 20', 'p 3 20', 'a 1', 'a 2', 'a 3',  'f 4h5h6h', 'c 1 i', 'c 2 i', 'c 3 @'])

  expect(r.dests.fen).toBe(`check raise-0-20 fold`)

  events = r.act('check')
  events = r.act('check')
  events = r.act('check')
  expect(r.fen).toBe(`10-20 1 | p80 AhAc check-0 / p180 2h2c check-0 / p280 3h3c check-0 $ 60-123 !f4h5h6h7h8h`)

  events = r.act('phase')
  expect(r.fen).toBe(`10-20 1 | i80 AhAc / i180 2h2c / @280 3h3c $ 60-123 !t4h5h6h7h8h`)

  expect(r.pov(1).fen).toBe(`10-20 1 | i80 AhAc / i180 / @280 $ 60-123 !4h5h6h7h`)

  expect(events.pov(1).map(_ => _.fen)).toStrictEqual(['a 1', 'a 2', 'a 3', 't 7h', 'c 1 i', 'c 2 i', 'c 3 @'])

  expect(r.dests.fen).toBe('check raise-0-20 fold')


  events = r.act('check')
  events = r.act('check')
  events = r.act('check')
  events = r.act('phase')

  expect(r.fen).toBe(`10-20 1 | i80 AhAc / i180 2h2c / @280 3h3c $ 60-123 !r4h5h6h7h8h`)

  expect(r.pov(1).fen).toBe(`10-20 1 | i80 AhAc / i180 / @280 $ 60-123 !4h5h6h7h8h`)
  expect(events.pov(1).map(_ => _.fen)).toStrictEqual(['a 1', 'a 2', 'a 3', 'r 8h', 'c 1 i', 'c 2 i', 'c 3 @'])

  events = r.act('check')
  events = r.act('check')
  events = r.act('check')
  events = r.act('phase')

  expect(r.fen).toBe(`10-20 1 | s80 AhAc / s180 2h2c / s280 3h3c $ 60-123 !r4h5h6h7h8h`)

  expect(r.pov(1).fen).toBe(`10-20 1 | s80 AhAc / s180 2h2c / s280 3h3c $ 60-123 !4h5h6h7h8h`)

  expect(events.pov(1).map(_ => _.fen)).toStrictEqual(['a 1', 'a 2', 'a 3', 'c 1 s', 'c 2 s', 'c 3 s', 'h 2 2h2c', 'h 3 3h3c'])

  expect(r.dests.fen).toBe('showdown')

  events = r.act('showdown')
  expect(r.fen).toBe(`10-20 1 | s80 AhAc / s180 2h2c / s280 3h3c $ 60-123 !r4h5h6h7h8h shares swin-1-60`)

  expect(r.pov(1).fen).toBe(`10-20 1 | s80 AhAc / s180 2h2c / s280 3h3c $ 60-123 !4h5h6h7h8h shares swin-1-60`)
  expect(r.pov(2).fen).toBe(`10-20 3 | s180 2h2c / s280 3h3c / s80 AhAc $ 60-123 !4h5h6h7h8h shares swin-3-60`)

  expect(events.pov(1).map(_ => _.fen)).toStrictEqual(['w swin-1-60'])

  expect(r.dests.fen).toBe('share')

  events = r.act('share')
  expect(r.fen).toBe(`10-20 1 | x140 / x180 / x280 $!`)

  expect(r.pov(1).fen).toBe(`10-20 1 | x140 / x180 / x280 $!`)

  expect(events.pov(1).map(_ => _.fen)).toStrictEqual(['C', 'S 1 60', 'c 1 x', 'o 1', 'c 2 x', 'o 2', 'c 3 x', 'o 3'])

  expect(r.dests.fen).toBe('fin')
})
