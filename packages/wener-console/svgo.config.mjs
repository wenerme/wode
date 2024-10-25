export default {
  plugins: [
    'preset-default',
    {
      name: 'removeAttrs',
      params: {
        attrs: ['data-.*'],
      },
    },
    {
      name: 'sortAttrs',
    },
  ],
};
