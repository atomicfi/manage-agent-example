import { Text, View } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { useStyles } from '../lib/styles'
import Avatar from './Avatar'
import TaskStatus from './TaskStatus'

export default function Message({ item }) {
  const { styles, markdown } = useStyles()
  if (item.role === 'task') {
    // A Transact task's progress.
    return <TaskStatus task={item} />
  } else if (item.role === 'user') {
    // The user's message, on the right.
    return (
      <View style={[styles.row, styles.rowUser]}>
        <View style={[styles.bubble, styles.userBubble]}>
          <Text style={styles.userText}>{item.text}</Text>
        </View>
      </View>
    )
  } else {
    // The agent's reply, or an error, on the left.
    return (
      <View style={styles.row}>
        <Avatar />
        <View style={styles.agentColumn}>
          <View style={[styles.bubble, styles.agentBubble, item.error && styles.errorBubble]}>
            {item.error ? (
              <Text style={styles.errorText}>{item.text}</Text>
            ) : (
              <Markdown style={markdown}>{item.text}</Markdown>
            )}
          </View>
        </View>
      </View>
    )
  }
}
