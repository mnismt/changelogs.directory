import type { EmailParams, EmailProvider, EmailResult } from '@/lib/email/types'
import { vi } from 'vitest'

/**
 * Create a mock email provider for testing.
 * By default, all emails succeed. Use mockSendEmail to customize behavior.
 */
export function createMockEmailProvider() {
	const mockSendEmail = vi.fn<(params: EmailParams) => Promise<EmailResult>>()

	// Default: all emails succeed
	mockSendEmail.mockResolvedValue({ success: true })

	const provider: EmailProvider = {
		sendEmail: mockSendEmail,
	}

	return {
		provider,
		mockSendEmail,
		/**
		 * Configure the mock to fail for specific emails
		 */
		failForEmails: (emails: string[]) => {
			mockSendEmail.mockImplementation(async (params) => {
				if (emails.includes(params.to)) {
					return { success: false, error: `Failed to send to ${params.to}` }
				}
				return { success: true }
			})
		},
		/**
		 * Configure the mock to fail all emails
		 */
		failAll: (error = 'Email service unavailable') => {
			mockSendEmail.mockResolvedValue({ success: false, error })
		},
		/**
		 * Configure the mock to throw an error (simulates network failure)
		 */
		throwError: (error = new Error('Network error')) => {
			mockSendEmail.mockRejectedValue(error)
		},
		/**
		 * Reset the mock to default success behavior
		 */
		reset: () => {
			mockSendEmail.mockReset()
			mockSendEmail.mockResolvedValue({ success: true })
		},
	}
}

export type MockEmailProvider = ReturnType<typeof createMockEmailProvider>
