import { Pressable, Text, View } from 'react-native'
import { useStyles } from '../lib/styles'
import Avatar from './Avatar'

const SUGGESTIONS = [
  'What subscriptions do I have?',
  'Cancel my Netflix subscription',
  'Which merchants can you cancel for me?'
]

export default function Welcome({ onPick }) {
  const { styles } = useStyles()
  return (
    <View style={styles.welcome}>
      <Avatar large />
      <Text style={styles.welcomeTitle}>How can I help?</Text>
      <Text style={styles.welcomeText}>
        I can find your subscriptions and help you cancel the ones you don't need.
      </Text>
      <View style={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => onPick(s)}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          >
            <Text style={styles.chipText}>{s}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}
