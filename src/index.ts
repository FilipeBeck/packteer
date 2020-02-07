import type {} from 'vanilla-x/Object'
import path from 'path'
import webpack from 'webpack'
import { Page } from 'puppeteer'
import MemoryFileSystem from 'memory-fs'
import merge from 'webpack-merge'

/**
 * Configuração extra para o webpack.
 */
export type PackConfiguration = Pick<webpack.Configuration, 'module' | 'resolve' | 'plugins' | 'externals'>

/**
 * Compila `entry`, carrega-o em `page` e o expõe globalmente com o nome do arquivo (sem a extensão).
 * @param page Página onde o arquivo será carregado.
 * @param entry Caminho do ponto de entrada.
 * @param configuration Configurações extras para o webpack, seguindo a estratégia de [merge.smart](https://www.npmjs.com/package/webpack-merge).
 */
export default async function pack(page: Page, entry: string, configuration?: PackConfiguration): Promise<void>;

/**
 * Compila os arquivos em `entry`, carrega-os em `page` e os expõe globalmente, cada um com o nome do arquivo (sem a extensão).
 * @param page Página onde os arquivos serão carregados.
 * @param entry Caminhos dos pontos de entrada.
 * @param configuration Configurações extras para o webpack, seguindo a estratégia de [merge.smart](https://www.npmjs.com/package/webpack-merge).
 * @throws Argumento `entry` não pode ser vazio.
 */
export default async function pack(page: Page, entry: string[], configuration?: PackConfiguration): Promise<void>;

/**
 * Compila os arquivos em `entry`, carrega-os em `page` e os expõe globalmente, cada um com o nome da chave fornecida para o arquivo.
 * @param page Página onde os arquivos serão carregados.
 * @param entry Dicionário com os pontos de entrada. As chaves serão usadas para nomear as variáveis globais.
 * @param configuration Configurações extras para o webpack, seguindo a estratégia de [merge.smart](https://www.npmjs.com/package/webpack-merge).
 * @throws Argumento `entry` não pode ser vazio.
 */
export default async function pack(page: Page, entry: Dictionary<string>, configuration?: PackConfiguration): Promise<void>;

/**
 * Compila `entry` em `page`.
 */
export default async function pack(page: Page, entry: string | string[] | Dictionary<string>, configuration: PackConfiguration = {}): Promise<void> {
	let entryPoints: Dictionary<string>

	const isEntryString = typeof entry == 'string'
	const isEntryArray = entry instanceof Array
	const isEntryDictionary = !isEntryString && !isEntryArray

	if (!isEntryDictionary) {
		entryPoints = {}

		if (isEntryString) {
			entry = [entry as string]
		}

		for (const filePath of entry as string[]) {
			const libraryName = filePath.split('/').pop()!.replace(/\.[^.]*$/, '')
			entryPoints[libraryName] = filePath
		}
	}
	else {
		entryPoints = entry as Dictionary<string>
	}

	if (!Object.keys(entryPoints).length) {
		throw new Error('Argument `entry` cannot be empty')
	}

	const defaultConfiguration: webpack.Configuration = {
		entry: entryPoints,
		mode: 'development',
		module: {
			rules: [
				{
					test: /\.ts$/,
					use: require.resolve('ts-loader')
				}
			]
		},
		resolve: {
			extensions: ['.js', '.ts']
		},
		output: {
			library: '[name]',
			libraryExport: 'default',
			libraryTarget: 'window',
			path: path.sep,
			filename: '[name]'
		}
	}

	const compiler = webpack(merge.smart(defaultConfiguration, configuration))
	const mfs = compiler.outputFileSystem = new MemoryFileSystem()

	/**
	 * Carrega o arquivo especificado.
	 * @param path Caminho do arquivo.
	 */
	async function readFile(path: string): Promise<string> {
		return new Promise((resolve, reject) => {
			mfs.readFile(path, 'utf8', (error, data) => {
				if (error) {
					reject(error)
				}
				else {
					resolve(data)
				}
			})
		})
	}

	/**
	 * Carrega e executa a biblioteca especificada.
	 * @param libraryName Nome da biblioteca.
	 */
	async function evaluate(libraryName: string): Promise<void> {
		const libraryCode = await readFile(path.join(defaultConfiguration.output!.path!, libraryName))
		await page.evaluate(libraryCode)
	}

	await new Promise<void>((resolve, reject) => {
		compiler.run(async (error, stats) => {
			try {
				if (error || stats.hasErrors()) {
					reject(error || stats.compilation.errors.map(error => ({ ...error, module: undefined })))
				}
				else {
					await Promise.all(Object.keys(entryPoints).map(libraryName => evaluate(libraryName)))
					resolve()
				}
			}
			catch (error) {
				reject(error)
			}
		})
	})
}