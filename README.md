# less-import-once

Webpack loader to removes duplicated LESS imports marked as (once).

## Installation

```bash
npm install --save-dev less-import-once
```

or

```bash
yarn add --dev less-import-once
```

or

```bash
pnpm install --save-dev less-import-once
```

## Usage

```js
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          'less-loader',
          'less-import-once',
        ],
      },
    ],
  },
};
```

```less
/* Button.less */
@import (once) 'Input.less';
@import (once) url("Input.less");

.Button {
    border: solid;
}
```

```less
/* Checkbox.less */
@import (once) url(Input.less);

.Checkbox {
    cursor: pointer;
}
```

## Output

```less
/* Button.less */
@import (once) 'Input.less';

.Button {
    border: solid;
}
```

```less
/* Checkbox.less */
.Checkbox {
    cursor: pointer;
}
```
