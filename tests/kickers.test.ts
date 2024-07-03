import { it, expect } from 'vitest'
import { get_klass_info_str } from '../src/hand'

it('pair single out', () => {
  let [str, expected] = [`KcKh2s9h3d6c7d`, `pair K976`]
  let r = get_klass_info_str(str)
  expect(r.short_desc).toBe(expected)
})

it.each([
  [`AdAhAcAs2d2c2s`, `quads A`],
  [`AdAhAcAs2d2c3s`, `quads A`],
  [`AdAhAcAsKdKcKs`, `quads A`],
  [`KdKhKcKs5d2c8s`, `quads K`],
  [`QdQhQcQs5d2c8s`, `quads Q`],
  [`3d3h3c3s5d4c8s`, `quads 3`],
  [`2d2h2c2s5d3c8s`, `quads 2`],
])('quads', (str, expected) => {
  let r = get_klass_info_str(str)
  expect(r.short_desc).toBe(expected)
})

it.each([
  [`AcKdQsJhThQc2d`, 'straight A'],
  [`KcQdJsTh9hQc2d`, 'straight K'],
  [`5c6d7s8h9hQc2d`, 'straight 9'],
  [`6c2d3s4h5hQc2d`, 'straight 6'],
  [`Ac2d3s4h5hQc2d`, 'straight 5']
])('straights', (str, expected) => {
  let r = get_klass_info_str(str)
  expect(r.short_desc).toBe(expected)
})

it.each([
  [`QdQhQcQs5d2c8s`, `quads Q`],
  [`KcKhKsJdJc6h7s`, `full KJ`],
  [`7c7s7hKdJh8s3d`, `set 7KJ`],
  [`QhQd8s8d6c4s2h`, `ppair Q86`],
  [`8h9hThJhQh7d2c`, `sflush Q`],
  [`KcKh2s9h3d6c7d`, `pair K976`],
  [`5c6d7s8h9hQc2d`, 'straight 9'],
  [`Ah2h5h8hKh7sJc`, 'flush AK852'],
  [`Ah2d3c4s5h8cQd`, 'straight 5'],
  [`TcJhQdKsAh4c7d`, 'straight A'],
])('mixed', (str, expected) => {
  let r = get_klass_info_str(str)
  expect(r.short_desc).toBe(expected)
})

it('a few more', () => {
  let r = get_klass_info_str('2h3h4h5h6h')
  expect(r.short_desc).toBe('sflush 6')

  r = get_klass_info_str('2h7h4h5h6h')
  expect(r.short_desc).toBe('flush 76542')

  r = get_klass_info_str('2h7c4h5c6h')
  expect(r.short_desc).toBe('high 76542')
})
