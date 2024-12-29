import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: bigint | number, decimals = 2) {
  if (!bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  let bytesNum = typeof bytes === 'bigint' ? Number(bytes) : bytes
  const i = Math.floor(Math.log(bytesNum) / Math.log(k))

  return `${parseFloat((bytesNum / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
