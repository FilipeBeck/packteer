# packteer

[![Coverage Status](https://coveralls.io/repos/github/FilipeBeck/packteer/badge.svg?branch=master)](https://coveralls.io/github/FilipeBeck/packteer?branch=master)

Helper para usar webpack com puppeteer

## Instalação

`npm install packteer`

`yarn add packteer`

## Uso

```typescript
// ./MyLibrary.ts
export default function hello(): string { return 'Hello Cosmos!' }

// ./MyLibrary.test.ts
test('algum teste com `MyLibrary`', async () => {
  await pack(page, path.join(__dirname, 'MyLibrary.ts'))
  
  const returnValue = await page.evaluate(() => {
    return MyLibrary.hello()
  })

  expect(returnValue).toBe('Hello Cosmos!')
})
```

A função `pack()` compila o arquivo especificado e o executa em `page`, expondo a exportação `default` em uma variável global com o mesmo nome do arquivo (sem a extensão) e retorna uma promessa que será resolvida assim que a compilação e execução terminarem.

```typescript
// ./MyLibrary1.ts
export default function helloLib1: string { return 'Hello Lib 1' }
// ./MyLibrary2.ts
export default function helloLib2: string { return 'Hello Lib 2' }

// ./MyLibraries.test.ts
test('algum teste com `MyLibrary1` e `MyLibrary2`', async () => {
  await pack(page, [path.join(__dirname, 'MyLibrary1.ts'), path.join(__dirname, 'MyLibrary2.ts')])
  
  const returnValue = await page.evaluate(() => {
    return [MyLibrary1.helloLib1(), MyLibrary2.helloLib2()]
  })

  expect(returnValue).toEqual(['Hello Lib 1', 'Hello Lib 2'])
})
```

Quando invocada com um array, a função `pack()` compila e executa cada arquivo fornecido de forma concorrente, expondo uma variável global para cada item do array.

```typescript
// ./MyLibrary1.ts
export function helloLib1: string { return 'Hello Lib 1' }
// ./MyLibrary2.ts
export function helloLib2: string { return 'Hello Lib 2' }

// ./MyLibraries.test.ts
test('algum teste com `MyLibrary1` e `MyLibrary2`', async () => {
  await pack(page, {
    lib1: path.join(__dirname, 'MyLibrary1.ts'),
    lib2: path.join(__dirname, 'MyLibrary2.ts')
  })
  
  const returnValue = await page.evaluate(() => {
    return [lib1.helloLib1(), lib2.helloLib2()]
  })

  expect(returnValue).toEqual(['Hello Lib 1', 'Hello Lib 2'])
})
```

Quando invocada com um dicionário, os nomes das variáveis globais serão definidos pelas chaves de cada arquivo.

```typescript
// ./my-text.txt
Hello Cosmos!
// ./MyAsset.ts
export default getText(): string {
  return require('my-text.txt').default
}

// ./MyLibraryWithAssets.test.ts
test('algum teste com `MyAssets.ts`', async () => {
  const extraConfiguration: PackConfiguration = {
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

  await pack(page, path.join(__dirname, 'MyAsset.ts'), extraConfiguration)

  const returnValue = await page.evaluate(() => {
    return MyAsset.getText()
  })

  expect(returnValue).toBe('Hello Cosmos!')
})
```

A função `pack()` também aceita um terceiro argumento com configurações extras que serão mescladas seguindo a estratégia de [merge.smart](https://www.npmjs.com/package/webpack-merge)
