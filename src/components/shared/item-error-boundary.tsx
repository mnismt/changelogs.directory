import { Component, type ErrorInfo, type ReactNode } from 'react'
import { captureException } from '@/integrations/sentry'

interface Props {
	children: ReactNode
	fallback?: ReactNode
}

interface State {
	hasError: boolean
}

export class ItemErrorBoundary extends Component<Props, State> {
	state = { hasError: false }

	static getDerivedStateFromError() {
		return { hasError: true }
	}

	override componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
		captureException(error)
	}

	override render() {
		if (this.state.hasError) {
			return this.props.fallback ?? null
		}

		return this.props.children
	}
}
