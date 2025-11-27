import { beforeEach, describe, expect, it, vi } from "vitest"
import type { EmailParams } from "@/lib/email/types"

vi.mock("zeptomail", () => ({
	SendMailClient: vi.fn().mockImplementation(() => ({
		sendMail: vi.fn(),
	})),
}))

describe("ZeptoMailProvider", () => {
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
		const { SendMailClient } = await import("zeptomail")
		const mockSendMail = vi.fn().mockResolvedValue({ message: "OK" })
		vi.mocked(SendMailClient).mockImplementation(
			() =>
				({
					sendMail: mockSendMail,
				}) as unknown as InstanceType<typeof SendMailClient>
		)

		const { ZeptoMailProvider } = await import("@/lib/email/zepto-provider")
		const provider = new ZeptoMailProvider("test_key")
		const result = await provider.sendEmail(mockParams)

		expect(result).toEqual({ success: true })
		expect(mockSendMail).toHaveBeenCalledWith({
			from: { address: "noreply@test.com", name: "Test" },
			to: [{ email_address: { address: "user@example.com", name: "" } }],
			subject: "Test Subject",
			htmlbody: "<p>Test</p>",
			textbody: "Test",
		})
	})

	it("should use empty string for textbody when text is not provided", async () => {
		const { SendMailClient } = await import("zeptomail")
		const mockSendMail = vi.fn().mockResolvedValue({ message: "OK" })
		vi.mocked(SendMailClient).mockImplementation(
			() =>
				({
					sendMail: mockSendMail,
				}) as unknown as InstanceType<typeof SendMailClient>
		)

		const { ZeptoMailProvider } = await import("@/lib/email/zepto-provider")
		const provider = new ZeptoMailProvider("test_key")
		const paramsWithoutText = { ...mockParams, text: undefined }
		await provider.sendEmail(paramsWithoutText)

		expect(mockSendMail).toHaveBeenCalledWith(
			expect.objectContaining({ textbody: "" })
		)
	})

	it("should handle thrown exceptions", async () => {
		const { SendMailClient } = await import("zeptomail")
		const mockSendMail = vi.fn().mockRejectedValue(new Error("API error"))
		vi.mocked(SendMailClient).mockImplementation(
			() =>
				({
					sendMail: mockSendMail,
				}) as unknown as InstanceType<typeof SendMailClient>
		)

		const { ZeptoMailProvider } = await import("@/lib/email/zepto-provider")
		const provider = new ZeptoMailProvider("test_key")
		const result = await provider.sendEmail(mockParams)

		expect(result).toEqual({ success: false, error: "API error" })
	})
})

