import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { captureException, Sentry } from '@/integrations/sentry'
import { authClient } from '@/lib/auth/client'
import { cn } from '@/lib/utils'
import { getSessionFn } from '@/server/auth'

export const Route = createFileRoute('/login')({
	component: LoginPage,
	beforeLoad: async () => {
		const session = await getSessionFn()
		if (session?.user) {
			throw redirect({ to: '/admin' })
		}
	},
})

function LoginPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()
	const emailId = useId()
	const passwordId = useId()

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		setError(null)

		try {
			await authClient.signIn.email({
				email,
				password,
				fetchOptions: {
					onSuccess: () => {
						router.navigate({ to: '/admin' })
					},
					onError: (ctx) => {
						Sentry.setContext('login', { email })
						captureException(ctx.error)
						setError(ctx.error.message)
					},
				},
			})
		} catch (err) {
			Sentry.setContext('login', { email })
			captureException(err)
			setError('An unexpected error occurred')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
						Sign in to your account
					</h2>
				</div>
				<form className="mt-8 space-y-6" onSubmit={handleLogin}>
					<div className="-space-y-px rounded-md shadow-sm">
						<div>
							<label htmlFor={emailId} className="sr-only">
								Email address
							</label>
							<input
								id={emailId}
								name="email"
								type="email"
								autoComplete="email"
								required
								className="relative block w-full rounded-t-md border-0 bg-neutral-900 py-1.5 text-white ring-1 ring-inset ring-neutral-800 placeholder:text-neutral-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
								placeholder="Email address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
						<div>
							<label htmlFor={passwordId} className="sr-only">
								Password
							</label>
							<input
								id={passwordId}
								name="password"
								type="password"
								autoComplete="current-password"
								required
								className="relative block w-full rounded-b-md border-0 bg-neutral-900 py-1.5 text-white ring-1 ring-inset ring-neutral-800 placeholder:text-neutral-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
					</div>

					{error && (
						<div className="text-center text-sm text-red-500">{error}</div>
					)}

					<div>
						<button
							type="submit"
							disabled={isLoading}
							className={cn(
								'group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
								isLoading && 'opacity-50 cursor-not-allowed',
							)}
						>
							{isLoading ? 'Signing in...' : 'Sign in'}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
