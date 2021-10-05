const Preset = {
  env(options = {}) {
    return [
      '@babel/preset-env',
      {
        bugfixes: true,
        shippedProposals: true,
        useBuiltIns: 'usage',
        corejs: { version: 3, proposals: true },
        ...options,
      },
    ];
  },
  typescript(options = {}) {
    return [
      '@babel/preset-typescript',
      {
        isTSX: true,
        allExtensions: true,
        allowDeclareFields: true,
        onlyRemoveTypeImports: true,
        ...options,
      },
    ];
  },
  react(options = {}) {
    return [
      '@babel/preset-react',
      { runtime: 'automatic', useBuiltIns: true, ...options },
    ];
  },
  cssProp(options = {}) {
    const presetName = '@linaria';
    if (!options) return presetName;
    return [presetName, options];
  },
};

const assumptions = {
  constantReexports: true,
  constantSuper: true,
  enumerableModuleMeta: true,
  ignoreFunctionLength: true,
  ignoreToPrimitiveHint: true,
  iterableIsArray: true,
  mutableTemplateObject: true,
  noClassCalls: true,
  noDocumentAll: true,
  noNewArrows: true,
  objectRestNoSymbols: true,
  privateFieldsAsProperties: true,
  pureGetters: true,
  setClassMethods: true,
  setComputedProperties: true,
  setPublicClassFields: true,
  setSpreadProperties: true,
  skipForOfIteratorClosing: true,
  superIsCallableConstructor: true,
};

module.exports = {
  assumptions,
  compact: true,
  minified: true,
  env: {
    development: {
      targets: { esmodules: true },
      presets: [
        Preset.env({ targets: { esmodules: true } }),
        Preset.typescript(),
        Preset.react({ development: true }),
        Preset.cssProp(),
      ],
      plugins: ['@babel/plugin-transform-runtime'],
    },
    production: {
      targets: { esmodules: true },
      presets: [
        Preset.env({ targets: { esmodules: true } }),
        Preset.react(),
        Preset.typescript(),
        Preset.cssProp(),
      ],
      plugins: ['@babel/plugin-transform-runtime'],
    },
    server: {
      targets: { node: 'current' },
      presets: [
        Preset.env({ targets: { node: 'current' } }),
        Preset.react(),
        Preset.typescript(),
        Preset.cssProp(),
      ],
      plugins: ['@babel/plugin-transform-runtime'],
    },
  },
};
