import { resolve } from 'path'
import { defineConfig, resolveConfig } from 'vite'

export default defineConfig({

    build: {

        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'lheadsup',
            fileName: 'lheadsup',
            formats: ['es']
        }
    }
})