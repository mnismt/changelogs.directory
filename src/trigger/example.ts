import { logger, task, wait } from '@trigger.dev/sdk/v3'

export const helloWorldTask = task({
	id: 'hello-world',
	maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
	run: async (payload: any, { ctx }) => {
		// Fetch current IP from a public API
		const response = await fetch('https://api.ipify.org?format=json')
		const data = await response.json()
		const ip = data.ip

		logger.log('Fetched current IP address.', { ip, payload, ctx })

		return {
			message: `Current IP address is ${ip}`,
		}
	},
})
