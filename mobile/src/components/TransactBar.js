import { useState } from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { useStyles } from '../lib/styles'
import { launchTransact } from '../transact'

// Atomic's icon, shown on the Transact button. Rendered from Atomic's logo.svg as PNGs
// at 1x, 2x and 3x, since the app doesn't draw SVGs.
const ATOMIC_LOGO = require('../../assets/atomic-logo.png')

// "Cancel <merchant>" or "Connect <merchant>": the user's confirmation. Only a
// tap opens Transact. onTaskStatusUpdate gets each of the task's status updates.
export default function TransactBar({ action, onTaskStatusUpdate }) {
  const { styles } = useStyles()
  // idle → open (Transact on screen) → finished | closed
  const [status, setStatus] = useState('idle')
  // The company's logo from the backend, shown on the button when there is one.
  const logo = action.logo?.url ? action.logo : null

  function open() {
    setStatus('open')
    try {
      launchTransact(action, {
        onTaskStatusUpdate: (data) => onTaskStatusUpdate(data ?? {}),
        onFinish: () => setStatus('finished'),
        // Closing isn't an outcome: Transact may keep working briefly after.
        onClose: () => setStatus((s) => (s === 'finished' ? s : 'closed'))
      })
    } catch (err) {
      console.warn('[transact] could not open', err)
      setStatus('idle')
    }
  }

  if (status === 'finished') {
    return (
      <View style={styles.actionBar}>
        <View style={styles.actionDone}>
          <Text style={styles.actionDoneText}>✓ {action.finishedLabel}</Text>
        </View>
      </View>
    )
  }
  // After a close, the agent decides what happens next. A task may still be
  // running, and reopening the same action could start a duplicate, so the
  // button goes away; the agent issues a new one if the user wants to retry.
  if (status === 'closed') return null
  return (
    <View style={styles.actionBar}>
      <Pressable
        accessibilityRole="button"
        disabled={status === 'open'}
        onPress={open}
        style={({ pressed }) => [
          styles.actionButton,
          status === 'open' && styles.actionButtonBusy,
          pressed && styles.actionButtonPressed
        ]}
      >
        {logo && (
          <View style={styles.actionLogoSlot}>
            <View style={[styles.actionLogo, { backgroundColor: logo.backgroundColor ?? '#ffffff' }]}>
              <Image source={{ uri: logo.url }} style={styles.actionLogoImage} resizeMode="contain" />
            </View>
          </View>
        )}
        <View style={styles.actionButtonLabels}>
          <Text style={styles.actionButtonText}>
            {status === 'open' ? 'Opening…' : action.label}
          </Text>
          <Text style={styles.actionButtonSub}>Securely through Atomic</Text>
        </View>
        <View style={[styles.actionLogoSlot, styles.actionLogoSlotRight]}>
          <Image source={ATOMIC_LOGO} style={styles.atomicLogo} resizeMode="contain" />
        </View>
      </Pressable>
    </View>
  )
}
