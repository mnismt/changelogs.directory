import { beforeEach, describe, expect, it, vi } from "vitest"

describe("createEmailProvider", () => {
	const originalEnv = process.env

	beforeEach(() => {
		vi.resetModules()
		process.env = { ...originalEnv }
	})

	it("should default to ResendProvider when EMAIL_PROVIDER is not set", async () => {
		process.env.RESEND_API_KEY = "test_resend_key"
		delete process.env.EMAIL_PROVIDER

		const { createEmailProvider } = await import("@/lib/email")
		const provider = createEmailProvider()

		expect(provider.constructor.name).toBe("ResendProvider")
	})

	it("should create ResendProvider when EMAIL_PROVIDER=resend", async () => {
		process.env.EMAIL_PROVIDER = "resend"
		process.env.RESEND_API_KEY = "test_resend_key"

		const { createEmailProvider } = await import("@/lib/email")
		const provider = createEmailProvider()

		expect(provider.constructor.name).toBe("ResendProvider")
	})

	it("should create ZeptoMailProvider when EMAIL_PROVIDER=zeptomail", async () => {
		process.env.EMAIL_PROVIDER = "zeptomail"
		process.env.ZEPTOMAIL_API_KEY = "test_zepto_key"

		const { createEmailProvider } = await import("@/lib/email")
		const provider = createEmailProvider()

		expect(provider.constructor.name).toBe("ZeptoMailProvider")
	})

	it("should throw when RESEND_API_KEY is missing for resend provider", async () => {
		process.env.EMAIL_PROVIDER = "resend"
		delete process.env.RESEND_API_KEY

		const { createEmailProvider } = await import("@/lib/email")

		expect(() => createEmailProvider()).toThrow(
			"RESEND_API_KEY is required when EMAIL_PROVIDER=resend"
		)
	})

	it("should throw when ZEPTOMAIL_API_KEY is missing for zeptomail provider", async () => {
		process.env.EMAIL_PROVIDER = "zeptomail"
		delete process.env.ZEPTOMAIL_API_KEY

		const { createEmailProvider } = await import("@/lib/email")

		expect(() => createEmailProvider()).toThrow(
			"ZEPTOMAIL_API_KEY is required when EMAIL_PROVIDER=zeptomail"
		)
	})

	it("should throw for unknown provider", async () => {
		process.env.EMAIL_PROVIDER = "unknown" as "resend"

		const { createEmailProvider } = await import("@/lib/email")

		expect(() => createEmailProvider()).toThrow("Unknown email provider: unknown")
	})
})

