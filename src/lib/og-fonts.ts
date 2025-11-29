import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function loadOGFonts() {
	const [firaCode, inter, interBold] = await Promise.all([
		readFile(join(process.cwd(), 'public/fonts/FiraCode-Regular.ttf')),
		readFile(join(process.cwd(), 'public/fonts/Inter-Regular.ttf')),
		readFile(join(process.cwd(), 'public/fonts/Inter-SemiBold.ttf')),
	])

	return [
		{
			name: 'Fira Code',
			data: firaCode,
			weight: 400 as const,
			style: 'normal' as const,
		},
		{
			name: 'Inter',
			data: inter,
			weight: 400 as const,
			style: 'normal' as const,
		},
		{
			name: 'Inter',
			data: interBold,
			weight: 600 as const,
			style: 'normal' as const,
		},
	]
}
