import { beforeEach, describe, expect, it, vi } from "vitest"
import type { EmailParams } from "@/lib/email/types"

vi.mock("resend", () => ({
	Resend: vi.fn().mockImplementation(() => ({
		emails: {
			send: vi.fn(),
		},
	})),
}))

describe("ResendProvider", () => {
	const mockParams: EmailParams = {
		from: { email: "noreply@test.com", name: "Test" },
		to: "user@example.com",
		subject: "Test Subject",
		html: "<p>Test</p>",
		text: "Test",
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should send email successfully", async () => {
		const { Resend } = await import("resend")
		const mockSend = vi.fn().mockResolvedValue({ data: { id: "123" }, error: null })
		vi.mocked(Resend).mockImplementation(
			() =>
				({
					emails: { send: mockSend },
				}) as unknown as InstanceType<typeof Resend>
		)

		const { ResendProvider } = await import("@/lib/email/resend-provider")
		const provider = new ResendProvider("test_key")
		const result = await provider.sendEmail(mockParams)

		expect(result).toEqual({ success: true })
		expect(mockSend).toHaveBeenCalledWith({
			from: "Test <noreply@test.com>",
			to: "user@example.com",
			subject: "Test Subject",
			html: "<p>Test</p>",
			text: "Test",
		})
	})

	it("should return error when Resend API returns error", async () => {
		const { Resend } = await import("resend")
		const mockSend = vi
			.fn()
			.mockResolvedValue({ data: null, error: { message: "Invalid API key" } })
		vi.mocked(Resend).mockImplementation(
			() =>
				({
					emails: { send: mockSend },
				}) as unknown as InstanceType<typeof Resend>
		)

		const { ResendProvider } = await import("@/lib/email/resend-provider")
		const provider = new ResendProvider("bad_key")
		const result = await provider.sendEmail(mockParams)

		expect(result).toEqual({ success: false, error: "Invalid API key" })
	})

	it("should handle thrown exceptions", async () => {
		const { Resend } = await import("resend")
		const mockSend = vi.fn().mockRejectedValue(new Error("Network error"))
		vi.mocked(Resend).mockImplementation(
			() =>
				({
					emails: { send: mockSend },
				}) as unknown as InstanceType<typeof Resend>
		)

		const { ResendProvider } = await import("@/lib/email/resend-provider")
		const provider = new ResendProvider("test_key")
		const result = await provider.sendEmail(mockParams)

		expect(result).toEqual({ success: false, error: "Network error" })
	})
})

