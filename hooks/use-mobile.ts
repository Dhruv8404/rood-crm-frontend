import * as React from 'react'

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useResponsive() {
  const [device, setDevice] = React.useState<'mobile' | 'tablet' | 'desktop' | undefined>(undefined)
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [isTablet, setIsTablet] = React.useState<boolean>(false)
  const [isDesktop, setIsDesktop] = React.useState<boolean>(false)
  const [windowWidth, setWindowWidth] = React.useState<number>(0)

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setWindowWidth(width)
      
      const mobile = width < MOBILE_BREAKPOINT
      const tablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT
      const desktop = width >= TABLET_BREAKPOINT
      
      setIsMobile(mobile)
      setIsTablet(tablet)
      setIsDesktop(desktop)
      
      if (mobile) {
        setDevice('mobile')
      } else if (tablet) {
        setDevice('tablet')
      } else {
        setDevice('desktop')
      }
    }

    // Initial call
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    isMobile,
    isTablet,
    isDesktop,
    device,
    windowWidth,
    breakpoints: {
      mobile: MOBILE_BREAKPOINT,
      tablet: TABLET_BREAKPOINT
    }
  }
}

// For backward compatibility
export function useIsMobile() {
  const { isMobile } = useResponsive()
  return isMobile
}

// Additional utility hooks
export function useIsTablet() {
  const { isTablet } = useResponsive()
  return isTablet
}

export function useIsDesktop() {
  const { isDesktop } = useResponsive()
  return isDesktop
}

export function useWindowWidth() {
  const { windowWidth } = useResponsive()
  return windowWidth
}

// Hook for checking specific breakpoints
export function useBreakpoint(breakpoint: number) {
  const [isBelowBreakpoint, setIsBelowBreakpoint] = React.useState<boolean>(false)

  React.useEffect(() => {
    const handleResize = () => {
      setIsBelowBreakpoint(window.innerWidth < breakpoint)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])

  return isBelowBreakpoint
}

// Hook for checking orientation
export function useOrientation() {
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>(
    window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  )

  React.useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return orientation
}

// Hook for checking if component is visible in viewport
export function useIsInViewport(ref: React.RefObject<HTMLElement>) {
  const [isIntersecting, setIsIntersecting] = React.useState(false)

  React.useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    })

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [ref])

  return isIntersecting
}

// Hook for debounced window resize
export function useDebouncedResize(callback: () => void, delay: number = 250) {
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(callback, delay)
    }

    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [callback, delay])
}