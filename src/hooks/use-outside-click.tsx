import type React from 'react'
import { useEffect } from 'react'

export const useOutsideClick = (
	ref: React.RefObject<HTMLElement | null>,
	callback: (event: MouseEvent | TouchEvent) => void,
) => {
	useEffect(() => {
		const listener = (event: MouseEvent | TouchEvent) => {
			// DO NOTHING if the element being clicked is the target element or their children
			const target = event.target as Node | null

			if (!ref.current || (target && ref.current.contains(target))) {
				return
			}
			callback(event)
		}

		document.addEventListener('mousedown', listener)
		document.addEventListener('touchstart', listener)

		return () => {
			document.removeEventListener('mousedown', listener)
			document.removeEventListener('touchstart', listener)
		}
	}, [ref, callback])
}
