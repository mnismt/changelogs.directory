import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NotFound() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center px-4">
			<div className="text-center">
				<h1 className="font-mono text-6xl font-bold text-foreground">404</h1>
				<p className="mt-4 text-xl text-muted-foreground">Page not found</p>
				<p className="mt-2 text-sm text-muted-foreground">
					The page you're looking for doesn't exist.
				</p>
				<Button asChild className="mt-8">
					<Link to="/">Go back home</Link>
				</Button>
			</div>
		</main>
	)
}
