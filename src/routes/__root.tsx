import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
	useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { ReactLenis, useLenis } from 'lenis/react'
import { useEffect } from 'react'
import { AppErrorBoundary } from '@/components/shared/app-error-boundary'
import { Footer } from '@/components/shared/footer'
import { Header } from '@/components/shared/header'
import { NotFound } from '@/components/shared/not-found'
import { PostHogPageView } from '@/integrations/posthog/page-view'
import { PostHogProvider } from '@/integrations/posthog/provider'
import { SentryProvider } from '@/integrations/sentry/provider'
import TanStackQueryDevtools from '@/integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'

interface MyRouterContext {
	queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				title: 'changelogs.directory - track cli tool updates',
			},
			{
				name: 'description',
				content:
					'Stay updated with the latest changes in your favorite CLI developer tools. Track releases, features, and breaking changes all in one place.',
			},
			{
				property: 'og:image',
				content: `${import.meta.env.VITE_BASE_URL || 'https://changelogs.directory'}/og`,
			},
			{
				name: 'twitter:image',
				content: `${import.meta.env.VITE_BASE_URL || 'https://changelogs.directory'}/og`,
			},
			{
				name: 'twitter:card',
				content: 'summary_large_image',
			},
		],
		links: [
			{
				rel: 'preconnect',
				href: 'https://fonts.googleapis.com',
			},
			{
				rel: 'preconnect',
				href: 'https://fonts.gstatic.com',
				crossOrigin: 'anonymous',
			},
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&display=swap',
			},
			{
				rel: 'stylesheet',
				href: appCss,
			},
		],
	}),

	shellComponent: RootDocument,
	component: RootComponent,
	notFoundComponent: NotFound,
})

/**
 * ScrollRestoration component that scrolls to top on route changes
 * Uses Lenis for smooth scrolling integration
 */
function ScrollRestoration() {
	const lenis = useLenis()
	const pathname = useRouterState({ select: (s) => s.location.pathname })

	useEffect(() => {
		// Scroll to top when pathname changes
		lenis?.scrollTo(0, { immediate: false })
	}, [pathname, lenis])

	return null
}

function RootComponent() {
	return (
		<SentryProvider>
			<PostHogProvider>
				<PostHogPageView />
				<ScrollRestoration />
				<AppErrorBoundary>
					<Outlet />
				</AppErrorBoundary>
			</PostHogProvider>
		</SentryProvider>
	)
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
			</head>
			<body>
				<ReactLenis root />
				{/* Global Grid Background */}
				<div className="fixed inset-0 z-[-1] pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]">
					<div className="absolute inset-0 bg-background/90 mask-[radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
				</div>
				<div className="flex min-h-screen flex-col">
					<Header />
					<main className="flex-1">{children}</main>
					<Footer />
				</div>
				<TanStackDevtools
					config={{
						position: 'bottom-right',
					}}
					plugins={[
						{
							name: 'Tanstack Router',
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	)
}
