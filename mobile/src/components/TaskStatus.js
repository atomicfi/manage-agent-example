import { ActivityIndicator, Text, View } from 'react-native'
import { useStyles } from '../lib/styles'
import { taskLabel } from '../lib/tasks'
import Avatar from './Avatar'
import Elapsed from './Elapsed'

// One agent message per Transact task: a spinner while it runs, then a check or an X.
export default function TaskStatus({ task }) {
  const { theme, styles } = useStyles()
  const done = task.status !== 'processing'
  return (
    <View style={styles.row}>
      <Avatar />
      <View
        style={[styles.bubble, styles.agentBubble, styles.taskBubble]}
        accessibilityLiveRegion="polite"
      >
        <View style={styles.taskIconSlot}>
          {done ? (
            <View
              style={[
                styles.taskIcon,
                { backgroundColor: task.status === 'completed' ? theme.online : theme.danger }
              ]}
            >
              <Text style={styles.taskIconText}>{task.status === 'completed' ? '✓' : '✕'}</Text>
            </View>
          ) : (
            <ActivityIndicator size="small" color={theme.muted} />
          )}
        </View>
        <Text style={[styles.taskText, !done && styles.taskTextBusy]}>
          {taskLabel(task)}
          {!done && <Elapsed since={task.startedAt} style={styles.taskTimer} />}
        </Text>
      </View>
    </View>
  )
}
