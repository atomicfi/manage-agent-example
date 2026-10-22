import { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'
import { useStyles } from '../lib/styles'
import Avatar from './Avatar'

export default function TypingIndicator() {
  const { styles } = useStyles()
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current
  useEffect(() => {
    const anims = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay((2 - i) * 150)
        ])
      )
    )
    anims.forEach((a) => a.start())
    return () => anims.forEach((a) => a.stop())
  }, [dots])

  return (
    <View style={styles.row} accessibilityLabel="Assistant is typing">
      <Avatar />
      <View style={[styles.bubble, styles.agentBubble, styles.typing]}>
        {dots.map((v, i) => (
          <Animated.View key={i} style={[styles.typingDot, { opacity: v }]} />
        ))}
      </View>
    </View>
  )
}
