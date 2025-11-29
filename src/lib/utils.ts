import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function maskEmail(email: string): string {
	if (!email) return ''
	const [local, domain] = email.split('@')
	if (!local || !domain) return email

	const maskedLocal = `${local[0]}***`
	const [domainName, tld] = domain.split('.')
	const maskedDomain = domainName ? `${domainName[0]}***` : '***'

	return `${maskedLocal}@${maskedDomain}.${tld || 'com'}`
}
