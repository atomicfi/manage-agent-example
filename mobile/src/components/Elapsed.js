import { useEffect, useState } from 'react'
import { Text } from 'react-native'

// Seconds since a task started, to one decimal place, such as " 2.3 s".
export default function Elapsed({ since, style }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(timer)
  }, [])
  return <Text style={style}>{` ${((now - since) / 1000).toFixed(1)} s`}</Text>
}
