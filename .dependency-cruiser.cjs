/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // 循環参照の禁止
    {
      comment: '循環参照は禁止されています',
      from: {},
      name: 'no-circular',
      severity: 'error',
      to: {
        circular: true,
      },
    },
    // orphan モジュールの検出
    {
      comment: 'どこからも参照されていないモジュールがあります',
      from: {
        orphan: true,
        pathNot: ['\\.test\\.ts$', 'index\\.ts$', '^src/index\\.ts$'],
      },
      name: 'no-orphans',
      severity: 'warn',
      to: {},
    },
    // core から adapters への直接参照を禁止（ポート経由でのみアクセス可能）
    {
      comment: 'core 層から adapters への直接参照は禁止です。ports 経由でアクセスしてください',
      from: {
        path: '^src/core/',
      },
      name: 'no-core-to-adapters',
      severity: 'error',
      to: {
        path: '^src/adapters/',
      },
    },
    // core から cli への参照を禁止（逆方向の依存）
    {
      comment: 'core 層から cli 層への参照は禁止です（依存方向が逆です）',
      from: {
        path: '^src/core/',
      },
      name: 'no-core-to-cli',
      severity: 'error',
      to: {
        path: '^src/cli/',
      },
    },
    // ports から他のレイヤーへの参照を禁止（types のみ許可）
    {
      comment: 'ports は types 以外の他レイヤーを参照できません',
      from: {
        path: '^src/ports/',
      },
      name: 'no-ports-to-other-layers',
      severity: 'error',
      to: {
        path: '^src/(cli|core|adapters)/',
      },
    },
    // types から他への依存を禁止
    {
      comment: 'types は他のモジュールに依存できません',
      from: {
        path: '^src/types/',
      },
      name: 'no-types-dependencies',
      severity: 'error',
      to: {
        path: '^src/(cli|core|adapters|ports)/',
      },
    },
    // adapters から cli/core への参照を禁止
    {
      comment: 'adapters から cli/core への参照は禁止です',
      from: {
        path: '^src/adapters/',
      },
      name: 'no-adapters-to-cli-or-core',
      severity: 'error',
      to: {
        path: '^src/(cli|core)/',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    enhancedResolveOptions: {
      conditionNames: ['import', 'require', 'node', 'default'],
      exportsFields: ['exports'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/(?:@[^/]+/[^/]+|[^/]+)',
        theme: {
          graph: {
            splines: 'ortho',
          },
          modules: [
            {
              attributes: { fillcolor: '#ffcccc' },
              criteria: { source: '^src/cli/' },
            },
            {
              attributes: { fillcolor: '#ccffcc' },
              criteria: { source: '^src/core/' },
            },
            {
              attributes: { fillcolor: '#ccccff' },
              criteria: { source: '^src/adapters/' },
            },
            {
              attributes: { fillcolor: '#ffffcc' },
              criteria: { source: '^src/ports/' },
            },
            {
              attributes: { fillcolor: '#ffccff' },
              criteria: { source: '^src/types/' },
            },
          ],
        },
      },
    },
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    tsPreCompilationDeps: true,
  },
};
