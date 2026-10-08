import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Crypto from 'expo-crypto'
import Markdown from 'react-native-markdown-display'
import { connect, sendMessage, sendTransactEvent } from './api'
import { launchTransact } from './transact'
import { useTheme } from './theme'

const SUGGESTIONS = [
  'What subscriptions do I have?',
  'Cancel my Netflix subscription',
  'Which merchants can you cancel for me?'
]

export default function ChatScreen() {
  const theme = useTheme()
  const styles = useMemo(() => makeStyles(theme), [theme])
  const insets = useSafeAreaInsets()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  // Whether the agent is working on a turn, from the server.
  const [busy, setBusy] = useState(false)
  const [connected, setConnected] = useState(false)
  const listRef = useRef(null)

  const addError = (text) =>
    setMessages((m) => [...m, { id: Crypto.randomUUID(), role: 'agent', text, error: true }])

  // The agent's messages arrive here, whether they answer the user or follow up
  // on a webhook, such as a cancellation finishing.
  useEffect(
    () =>
      connect((event) => {
        if (event.type === 'message') setMessages((m) => [...m, event.message])
        else if (event.type === 'busy') setBusy(event.busy)
        else if (event.type === 'error') addError(event.error)
      }, setConnected),
    []
  )

  function send(text) {
    text = text.trim()
    if (!text || busy) return
    setInput('')
    setMessages((m) => [...m, { id: Crypto.randomUUID(), role: 'user', text }])
    queueForAgent(() => sendMessage(text))
  }

  // Sends something to the agent's queue. Shows the typing indicator until the
  // server reports on the turn.
  async function queueForAgent(request) {
    setBusy(true)
    try {
      await request()
    } catch (err) {
      addError(
        err instanceof TypeError ? 'Could not reach the server. Please try again.' : err.message
      )
      setBusy(false)
    }
  }

  const scrollToEnd = () => listRef.current?.scrollToEnd({ animated: true })

  // The latest Transact action, pinned above the composer.
  const transactAction = useMemo(
    () => messages.findLast((m) => m.action?.type === 'launch_transact')?.action ?? null,
    [messages]
  )

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Avatar styles={styles} />
        <View>
          <Text style={styles.title}>Subscription Assistant</Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, !connected && styles.dotOffline]} />
            <Text style={styles.status}>{connected ? 'Online' : 'Connecting…'}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          style={styles.flex}
          contentContainerStyle={[styles.list, messages.length === 0 && styles.listEmpty]}
          data={messages}
          keyExtractor={(m) => m.id}
          onContentSizeChange={scrollToEnd}
          onLayout={scrollToEnd}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Welcome styles={styles} onPick={send} />}
          renderItem={({ item }) => <Message item={item} styles={styles} theme={theme} />}
          ListFooterComponent={busy ? <TypingIndicator styles={styles} /> : null}
        />

        {transactAction && (
          <TransactBar
            // A new action starts fresh.
            key={transactAction.id}
            action={transactAction}
            styles={styles}
            // Tells the agent how the user left Transact, so it can follow up.
            onDone={(event, data) => queueForAgent(() => sendTransactEvent(event, data))}
          />
        )}

        <View
          style={[
            styles.composer,
            transactAction && styles.composerJoined,
            { paddingBottom: Math.max(insets.bottom, 12) }
          ]}
        >
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message Subscription Assistant…"
            placeholderTextColor={theme.muted}
            multiline
            submitBehavior="submit"
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
          />
          <Pressable
            accessibilityLabel="Send"
            disabled={busy || !input.trim()}
            onPress={() => send(input)}
            style={({ pressed }) => [
              styles.send,
              (busy || !input.trim()) && styles.sendDisabled,
              pressed && styles.sendPressed
            ]}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

function Avatar({ styles, large }) {
  return (
    <View style={[styles.avatar, large && styles.avatarLarge]}>
      <Text style={[styles.avatarText, large && styles.avatarTextLarge]}>S</Text>
    </View>
  )
}

function Welcome({ styles, onPick }) {
  return (
    <View style={styles.welcome}>
      <Avatar styles={styles} large />
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

function Message({ item, styles, theme }) {
  if (item.role === 'user') {
    return (
      <View style={[styles.row, styles.rowUser]}>
        <View style={[styles.bubble, styles.userBubble]}>
          <Text style={styles.userText}>{item.text}</Text>
        </View>
      </View>
    )
  }
  return (
    <View style={styles.row}>
      <Avatar styles={styles} />
      <View style={styles.agentColumn}>
        <View style={[styles.bubble, styles.agentBubble, item.error && styles.errorBubble]}>
          {item.error ? (
            <Text style={styles.errorText}>{item.text}</Text>
          ) : (
            <Markdown style={markdownStyles(theme)}>{item.text}</Markdown>
          )}
        </View>
      </View>
    </View>
  )
}

// "Cancel <merchant>" or "Connect <merchant>": the user's confirmation. Only a
// tap opens Transact.
function TransactBar({ action, styles, onDone }) {
  // idle → open (Transact on screen) → finished | closed
  const [status, setStatus] = useState('idle')
  // Transact can report both finish and close; signal the agent once per open,
  // with whichever came first.
  const signalled = useRef(false)

  function done(event, data) {
    if (signalled.current) return
    signalled.current = true
    onDone?.(event, data)
  }

  function open() {
    setStatus('open')
    signalled.current = false
    try {
      launchTransact(action, {
        onFinish: (data) => {
          setStatus('finished')
          done('finish', data)
        },
        // Closing isn't an outcome: Transact may keep working briefly after.
        onClose: (data) => {
          setStatus((s) => (s === 'finished' ? s : 'closed'))
          done('close', data)
        }
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
  if (status === 'closed') {
    return (
      <View style={styles.actionBar}>
        <Text style={styles.actionNote}>Closed. Ask the assistant if you want to try again.</Text>
      </View>
    )
  }
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
        <Text style={styles.actionButtonText}>
          {status === 'open' ? 'Opening…' : action.label}
        </Text>
        <Text style={styles.actionButtonSub}>Securely through Atomic</Text>
      </Pressable>
    </View>
  )
}

function TypingIndicator({ styles }) {
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
      <Avatar styles={styles} />
      <View style={[styles.bubble, styles.agentBubble, styles.typing]}>
        {dots.map((v, i) => (
          <Animated.View key={i} style={[styles.typingDot, { opacity: v }]} />
        ))}
      </View>
    </View>
  )
}

const markdownStyles = (t) => ({
  body: { color: t.text, fontSize: 16, lineHeight: 22 },
  paragraph: { marginTop: 0, marginBottom: 6 },
  bullet_list: { marginBottom: 6 },
  ordered_list: { marginBottom: 6 },
  strong: { fontWeight: '600' },
  link: { color: t.accent },
  code_inline: { backgroundColor: t.codeBg, color: t.text, borderRadius: 4, fontSize: 14 },
  fence: { backgroundColor: t.codeBg, color: t.text, borderWidth: 0, borderRadius: 8 },
  code_block: { backgroundColor: t.codeBg, color: t.text, borderWidth: 0, borderRadius: 8 }
})

const makeStyles = (t) =>
  StyleSheet.create({
    flex: { flex: 1 },
    screen: { flex: 1, backgroundColor: t.bg },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: t.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border
    },
    title: { fontSize: 17, fontWeight: '600', color: t.text },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.online },
    dotOffline: { backgroundColor: t.muted },
    status: { fontSize: 12, color: t.muted },

    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#6d5df5',
      alignItems: 'center',
      justifyContent: 'center'
    },
    avatarLarge: { width: 60, height: 60, borderRadius: 30 },
    avatarText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    avatarTextLarge: { fontSize: 24 },

    list: { padding: 16, gap: 14 },
    listEmpty: { flexGrow: 1, justifyContent: 'center' },

    row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    rowUser: { justifyContent: 'flex-end' },
    bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
    userBubble: { backgroundColor: t.accent, borderBottomRightRadius: 6 },
    userText: { color: t.accentText, fontSize: 16, lineHeight: 22 },
    agentBubble: {
      maxWidth: '100%',
      backgroundColor: t.agentBubble,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      borderBottomLeftRadius: 6,
      paddingBottom: 4
    },
    agentColumn: { flexShrink: 1, maxWidth: '80%', gap: 8, alignItems: 'flex-start' },
    actionBar: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
      backgroundColor: t.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border
    },
    actionButton: {
      backgroundColor: t.danger,
      minHeight: 60,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: t.danger,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4
    },
    actionButtonBusy: { opacity: 0.6 },
    actionButtonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
    actionButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    actionButtonSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
    actionDone: {
      minHeight: 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.bg,
      alignItems: 'center',
      justifyContent: 'center'
    },
    actionDoneText: { color: t.text, fontSize: 16, fontWeight: '600' },
    actionNote: { color: t.muted, fontSize: 13, marginTop: 8, textAlign: 'center' },
    errorBubble: { backgroundColor: t.errorBg, borderColor: 'transparent', paddingBottom: 10 },
    errorText: { color: t.errorText, fontSize: 16, lineHeight: 22 },

    typing: { flexDirection: 'row', gap: 5, paddingVertical: 15, paddingBottom: 15 },
    typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.muted },

    welcome: { alignItems: 'center', paddingHorizontal: 12 },
    welcomeTitle: { fontSize: 24, fontWeight: '700', color: t.text, marginTop: 14 },
    welcomeText: {
      fontSize: 15,
      color: t.muted,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 18,
      lineHeight: 21
    },
    suggestions: { gap: 10, alignItems: 'center' },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surface
    },
    chipPressed: { borderColor: t.accent },
    chipText: { color: t.text, fontSize: 15 },

    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 12,
      paddingTop: 10,
      backgroundColor: t.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border
    },
    // Under the Transact bar, which already draws the divider.
    composerJoined: { borderTopWidth: 0 },
    input: {
      flex: 1,
      maxHeight: 140,
      minHeight: 42,
      paddingHorizontal: 16,
      paddingTop: 11,
      paddingBottom: 11,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.bg,
      color: t.text,
      fontSize: 16
    },
    send: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center'
    },
    sendDisabled: { opacity: 0.4 },
    sendPressed: { transform: [{ scale: 0.94 }] },
    sendIcon: { color: t.accentText, fontSize: 22, fontWeight: '700', marginTop: -2 }
  })
