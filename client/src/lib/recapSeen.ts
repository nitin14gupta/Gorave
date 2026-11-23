import AsyncStorage from '@react-native-async-storage/async-storage'

// Per-month flags for "Your month on Gorave", kept on the phone:
//   revealed   the full-screen recap has been shown once (auto-open or a tap)
//   dismissed  the Home card was closed
type Flag = 'revealed' | 'dismissed'
const key = (flag: Flag, month: string) => `vibe-recap-${flag}-${month}`

export async function getRecapFlag(flag: Flag, month: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key(flag, month))) === '1'
  } catch {
    return false
  }
}

export async function setRecapFlag(flag: Flag, month: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key(flag, month), '1')
  } catch {
    // Not worth surfacing: worst case the card shows once more.
  }
}
