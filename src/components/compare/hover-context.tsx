import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useRef,
	useState,
} from 'react'

type HoverContextValue = {
	hoveredId: string | null
	hoveredTier: number | null
	setHovered: (id: string | null, tier?: number | null) => void
}

const HoverContext = createContext<HoverContextValue>({
	hoveredId: null,
	hoveredTier: null,
	setHovered: () => {},
})

export function CompareHoverProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<{
		id: string | null
		tier: number | null
	}>({ id: null, tier: null })
	const timeoutRef = useRef<number | null>(null)

	const setHovered = useCallback(
		(id: string | null, tier: number | null = null) => {
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current)
				timeoutRef.current = null
			}
			if (id === null) {
				timeoutRef.current = window.setTimeout(() => {
					setState({ id: null, tier: null })
					timeoutRef.current = null
				}, 80)
			} else {
				setState({ id, tier })
			}
		},
		[],
	)

	return (
		<HoverContext.Provider
			value={{
				hoveredId: state.id,
				hoveredTier: state.tier,
				setHovered,
			}}
		>
			{children}
		</HoverContext.Provider>
	)
}

export function useCompareHover() {
	return useContext(HoverContext)
}

export function planHoverId(slug: string, planName: string): string {
	return `${slug}::${planName}`
}

/**
 * Bucket plans into price tiers so hover-peer highlighting groups
 * naturally-comparable tiers across cards.
 *
 *   tier 0 = free / non-numeric
 *   tier 1 = entry  (<$25 — Pro/Plus)
 *   tier 2 = mid    ($25–$74 — Teams/Business)
 *   tier 3 = heavy  ($75–$149 — Max 5x/Pro $100)
 *   tier 4 = power  ($150+ — Max 20x/Pro $200/Ultra)
 */
export function priceTier(price: number | 'custom' | undefined): number | null {
	if (typeof price !== 'number') return null
	if (price <= 0) return 0
	if (price < 25) return 1
	if (price < 75) return 2
	if (price < 150) return 3
	return 4
}
