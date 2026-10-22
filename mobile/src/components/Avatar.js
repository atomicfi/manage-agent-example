import { Text, View } from 'react-native'
import { useStyles } from '../lib/styles'

export default function Avatar({ large }) {
  const { styles } = useStyles()
  return (
    <View style={[styles.avatar, large && styles.avatarLarge]}>
      <Text style={[styles.avatarText, large && styles.avatarTextLarge]}>A</Text>
    </View>
  )
}
