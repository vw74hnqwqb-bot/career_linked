import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/career_linked/', // 반드시 레포지토리 이름을 앞뒤에 슬래시(/)와 함께 써주세요!
})
