const helloCosmosText = require('./hello-cosmos.txt').default as string

export default function getHelloCosmos(): string {
	return helloCosmosText
}