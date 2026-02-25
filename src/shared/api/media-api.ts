import { nanoid } from 'nanoid'
import { supabase } from './supabase-client'

export async function uploadMedia(pathPrefix: string, file: File): Promise<string> {
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
  const key = `${pathPrefix}/${nanoid()}.${extension}`
  const { error } = await supabase.storage.from('chat-media').upload(key, file, {
    upsert: false,
  })
  if (error) {
    throw error
  }
  const { data } = supabase.storage.from('chat-media').getPublicUrl(key)
  return data.publicUrl
}
