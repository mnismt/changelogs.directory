import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorBoundaryCard } from '@/components/shared/error-boundary'
import { captureException } from '@/integrations/sentry'

interface AppErrorBoundaryProps {
	children: ReactNode
}

interface AppErrorBoundaryState {
	hasError: boolean
	errorMessage?: string
}

export class AppErrorBoundary extends Component<
	AppErrorBoundaryProps,
	AppErrorBoundaryState
> {
	state: AppErrorBoundaryState = {
		hasError: false,
		errorMessage: undefined,
	}

	static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
		return { hasError: true, errorMessage: error.message }
	}

	override componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
		console.error('Uncaught application error:', error)
		captureException(error)
	}

	private handleRetry = () => {
		this.setState({ hasError: false, errorMessage: undefined })
	}

	override render(): ReactNode {
		if (this.state.hasError) {
			return (
				<div className="px-4 py-24">
					<ErrorBoundaryCard
						title="Unexpected error"
						message="The interface crashed unexpectedly."
						detail={this.state.errorMessage}
						onRetry={this.handleRetry}
					/>
				</div>
			)
		}

		return this.props.children
	}
}
