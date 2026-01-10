import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorBoundaryCard } from '@/components/shared/error-boundary'
import { captureException } from '@/integrations/sentry'

interface AppErrorBoundaryProps {
	children: ReactNode
}

interface AppErrorBoundaryState {
	hasError: boolean
	errorMessage?: string
	showDetail: boolean
}

export class AppErrorBoundary extends Component<
	AppErrorBoundaryProps,
	AppErrorBoundaryState
> {
	state: AppErrorBoundaryState = {
		hasError: false,
		errorMessage: undefined,
		showDetail: false,
	}

	static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
		return { hasError: true, errorMessage: error.message, showDetail: false }
	}

	override componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
		console.error('Uncaught application error:', error)
		captureException(error)
	}

	override componentDidMount() {
		// Set showDetail flag after hydration on client
		if (
			typeof window !== 'undefined' &&
			(window.location.hostname === 'localhost' ||
				window.location.hostname === '127.0.0.1')
		) {
			this.setState({ showDetail: true })
		}
	}

	private handleRetry = () => {
		this.setState({ hasError: false, errorMessage: undefined })
	}

	private handleGoHome = () => {
		this.setState({ hasError: false, errorMessage: undefined })
		window.location.href = '/'
	}

	override render(): ReactNode {
		if (this.state.hasError) {
			return (
				<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
					<ErrorBoundaryCard
						title="Unexpected error"
						message="The interface crashed unexpectedly."
						detail={this.state.showDetail ? this.state.errorMessage : undefined}
						onRetry={this.handleRetry}
						onGoHome={this.handleGoHome}
					/>
				</div>
			)
		}

		return this.props.children
	}
}
