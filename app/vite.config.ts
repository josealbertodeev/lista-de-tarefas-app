/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/lista-de-tarefas-app/',
  plugins: [react(), tailwindcss()],
  test: {
    // Só lógica pura de src/lib — sem jsdom, sem testes de componente.
    include: ['src/lib/**/*.test.ts'],
    environment: 'node',
  },
})
