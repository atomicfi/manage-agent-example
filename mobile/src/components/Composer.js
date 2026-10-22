import { Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStyles } from '../lib/styles'

// The message box and send button. joined drops the top divider, for when it
// sits under the Transact bar, which already draws one.
export default function Composer({ value, onChangeText, onSend, canSend, joined }) {
  const { theme, styles } = useStyles()
  const insets = useSafeAreaInsets()
  return (
    <View
      style={[
        styles.composer,
        joined && styles.composerJoined,
        { paddingBottom: Math.max(insets.bottom, 12) }
      ]}
    >
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Message Subscription Manager…"
        placeholderTextColor={theme.muted}
        multiline
        submitBehavior="submit"
        returnKeyType="send"
        onSubmitEditing={onSend}
      />
      <Pressable
        accessibilityLabel="Send"
        disabled={!canSend}
        onPress={onSend}
        style={({ pressed }) => [
          styles.send,
          !canSend && styles.sendDisabled,
          pressed && styles.sendPressed
        ]}
      >
        <Text style={styles.sendIcon}>↑</Text>
      </Pressable>
    </View>
  )
}
