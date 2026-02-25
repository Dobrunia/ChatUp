import { ref } from 'vue'
import { Network } from '@capacitor/network'

const isOnline = ref(true)

export function useNetwork() {
  async function initNetwork(): Promise<void> {
    const status = await Network.getStatus()
    isOnline.value = status.connected
    Network.addListener('networkStatusChange', (nextStatus) => {
      isOnline.value = nextStatus.connected
    })
  }

  return { isOnline, initNetwork }
}
