import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStyles } from '../lib/styles'
import Avatar from './Avatar'

export default function ChatHeader() {
  const { styles } = useStyles()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Avatar />
      <View>
        <Text style={styles.title}>Atomic Subscription Manager</Text>
        <View style={styles.statusRow}>
          <View style={styles.dot} />
          <Text style={styles.status}>Online</Text>
        </View>
      </View>
    </View>
  )
}
