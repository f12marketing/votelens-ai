import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      // Fast Refresh for development
      fastRefresh: true,
      // Use Babel for JSX transformation
      babel: {
        plugins: [
          // Code splitting for large components
          '@babel/plugin-syntax-dynamic-import',
        ],
      },
    }),
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Only compress files larger than 10KB
      deleteOriginFile: false,
    }),
    // Brotli compression (better than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
    // Bundle visualization
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'bundle-analysis.html',
    }),
  ],
  build: {
    // Output directory
    outDir: 'dist',
    assetsDir: 'assets',
    
    // Source maps for production debugging (disable for smaller bundles)
    sourcemap: false,
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false, // Remove comments
      },
    },
    
    // Rollup options for advanced configuration
    rollupOptions: {
      output: {
        // Manual chunk splitting strategy
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React and related
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            
            // UI libraries
            if (id.includes('lucide-react') || id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            
            // Charts
            if (id.includes('recharts') || id.includes('d3') || id.includes('chart.js')) {
              return 'vendor-charts';
            }
            
            // Data processing
            if (id.includes('lodash') || id.includes('date-fns') || id.includes('moment')) {
              return 'vendor-utils';
            }
            
            // Other third-party
            return 'vendor-other';
          }
          
          // Feature-based chunks
          if (id.includes('/pages/dashboard/')) {
            return 'chunk-dashboard';
          }
          if (id.includes('/pages/analytics/')) {
            return 'chunk-analytics';
          }
          if (id.includes('/pages/admin/')) {
            return 'chunk-admin';
          }
          if (id.includes('/components/charts/')) {
            return 'chunk-charts';
          }
          if (id.includes('/components/maps/')) {
            return 'chunk-maps';
          }
        },
        
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name || '')) {
            return `assets/media/[name]-[hash].[ext]`;
          }
          if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name || '')) {
            return `assets/images/[name]-[hash].[ext]`;
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name || '')) {
            return `assets/fonts/[name]-[hash].[ext]`;
          }
          return `assets/[ext]/[name]-[hash].[ext]`;
        },
      },
      
      // External dependencies (if using CDN)
      // external: ['react', 'react-dom'],
      
      // Preserve module structure for better caching
      preserveModules: false,
      preserveSymlinks: false,
    },
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000, // 1000KB
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Target modern browsers
    target: 'es2020',
    
    // Polyfills
    polyfillModulePreload: true,
    polyfillDynamicImport: true,
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@hooks': resolve(__dirname, './src/hooks'),
    },
  },
  
  // CSS configuration
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
    devSourcemap: false,
  },
  
  // Server configuration
  server: {
    port: 3000,
    host: true,
    open: true,
    // Proxy for API requests
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'recharts',
    ],
    exclude: [
      // Exclude large dev-only dependencies
      'eslint',
      'prettier',
    ],
  },
  
  // Define environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
});
