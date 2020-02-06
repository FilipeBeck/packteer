import pack, { PackConfiguration } from '../src'

import _getPI from './Library1'
import _get2PI from './Library2'
import _get3PI from './Library3'

declare global {
	const Library1: () => number
	const Library2: () => number
	const Library3: () => number
	const getPI: () => number
	const get2PI: () => number
	const get3PI: () => number
	const getHelloCosmos: () => string
}

describe('Função `pack()', () => {
	beforeEach(async () => {
		await page.reload()
	})

	const lib1Path = require.resolve('./Library1.ts')
	const lib2Path = require.resolve('./Library2.ts')
	const lib3Path = require.resolve('./Library3.ts')
	const lib4Path = require.resolve('./Library4.ts')

	test('Argumento `entry == string`', async () => {
		expect.assertions(1)

		await pack(page, lib1Path)
		
		const returnValue = await page.evaluate(() => {
			return Library1()
		})

		expect(returnValue).toBe(_getPI())
	})

	test('Argumento `entry == Array<string>`', async () => {
		expect.assertions(1)

		await pack(page, [lib1Path, lib2Path, lib3Path])

		const returnValue = await page.evaluate(() => {
			return [Library1(), Library2(), Library3()]
		})

		expect(returnValue).toEqual([_getPI(), _get2PI(), _get3PI()])
	})

	test('Argumento `entry == Dictionary<string>`', async () => {
		expect.assertions(1)

		await pack(page, { getPI: lib1Path, get2PI: lib2Path, get3PI: lib3Path })

		const returnValue = await page.evaluate(() => {
			return [getPI(), get2PI(), get3PI()]
		})

		expect(returnValue).toEqual([_getPI(), _get2PI(), _get3PI()])
	})

	test('Argumento `configuration`', async () => {
		expect.assertions(1)

		const configuration: PackConfiguration = {
			module: {
				rules: [
					{
						test: /\.txt$/,
						use: 'raw-loader'
					}
				]
			},
			resolve: {
				extensions: ['.txt']
			}
		}

		await pack(page, { getHelloCosmos: lib4Path }, configuration)

		const returnValue = await page.evaluate(() => {
			return getHelloCosmos()
		})

		expect(returnValue).toBe('Hello Cosmos!')
	})

	test('Exceção quando `entry` for vazio', () => {
		const assertion = pack(page, [])

		expect(assertion).rejects.toBeTruthy()
	})
})