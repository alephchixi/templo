import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        { name: 'three', test: /node_modules[\\/]three[\\/]/ },
                        { name: 'tone', test: /node_modules[\\/]tone[\\/]/ },
                    ],
                },
            },
        },
    },
});
