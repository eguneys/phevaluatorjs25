import { resolve } from 'path'
import { defineConfig, resolveConfig } from 'vite'

export default defineConfig({

    build: {

        sourcemap: true,
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'lheadsup',
            fileName: 'lheadsup',
            formats: ['es']
        }
    }
})