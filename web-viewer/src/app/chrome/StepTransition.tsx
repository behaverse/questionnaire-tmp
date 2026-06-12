import { type ReactNode, useEffect, useState } from 'react'

export function StepTransition({ stepKey, children }: { stepKey: number | string; children: ReactNode }) {
  const [shown, setShown] = useState({ key: stepKey, children })
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (stepKey === shown.key) {
      setShown({ key: stepKey, children })
      return
    }
    setLeaving(true)
    const timer = window.setTimeout(() => {
      setShown({ key: stepKey, children })
      setLeaving(false)
    }, 200)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey, children])
  return (
    <div key={String(shown.key)} className={leaving ? 'qv-step-leave' : 'qv-step-enter'}>
      {shown.children}
    </div>
  )
}
