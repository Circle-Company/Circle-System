import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test.setup.ts'],
    include: [
      'src/**/*.test.ts',
      'src/**/*.spec.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'src/swipe-engine/tests/**',
      'src/swipe-engine/**/*.test.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/classes/**',
        'src/controllers/**',
        'src/middlewares/**',
        'src/services/**',
        'src/models/**'
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/types.ts',
        'src/**/index.ts',
        'src/config/**',
        'src/swipe-engine/tests/**',
        'src/migrations/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 75,
          statements: 75
        }
      }
    },
    testTimeout: 15000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    silent: false,
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './coverage/test-results.json'
    }
  },
  esbuild: {
    target: 'node16'
  },
  optimizeDeps: {
    include: ['magic-string']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@classes': path.resolve(__dirname, './src/classes'),
      '@controllers': path.resolve(__dirname, './src/controllers'),
      '@middlewares': path.resolve(__dirname, './src/middlewares'),
      '@services': path.resolve(__dirname, './src/services'),
      '@models': path.resolve(__dirname, './src/models'),
      '@errors': path.resolve(__dirname, './src/errors'),
      '@swipe-engine': path.resolve(__dirname, './src/swipe-engine'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@libs': path.resolve(__dirname, './src/libs'),
      '@math': path.resolve(__dirname, './src/math'),
      '@pages': path.resolve(__dirname, './src/pages')
    }
  }
})
