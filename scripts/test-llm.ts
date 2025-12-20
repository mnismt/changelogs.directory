import { generateText } from 'ai'
import { llm } from '../src/lib/llm'

async function testLLM() {
	if (!llm) {
		console.error('LLM not initialized. Check GEMINI_API_KEY environment variable.')
		process.exit(1)
	}

	console.log('Testing LLM connection...')

	try {
		const { text } = await generateText({
			model: llm,
			prompt: 'Say "Hello from Gemini!" in exactly 5 words.',
		})

		console.log('✅ LLM Response:', text)
		console.log('LLM is working correctly!')
	} catch (error) {
		console.error('❌ LLM test failed:', error)
		process.exit(1)
	}
}

testLLM()
