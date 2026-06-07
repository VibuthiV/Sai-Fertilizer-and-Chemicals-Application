module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': '.',
            '@/components': './components',
            '@/services': './services',
            '@/store': './store',
            '@/hooks': './hooks',
            '@/types': './types',
            '@/constants': './constants',
            '@/utils': './utils',
            '@/assets': './assets',
          },
        },
      ],
    ],
  };
};
