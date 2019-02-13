# Geacc TensorFlow.js Demo

This demo app detects explicit images using [Geacc pre-trained model](https://github.com/purify-ai/geacc-models/) (MobileNetV2) and TensorFlow.js.

All inference performed in browser. Once initialised, you can start uploading images.

## Building from source

```sh
npm i
npm run build
```

This command generates a `dist/` folder which contains the build artifacts and can be used for deployment.

## Development

When building for development and troubleshooting purposes, use the following command:

```sh
npm run watch
```

It starts a local development HTTP server which watches the filesystem for changes so you can edit the code (JS or HTML) and see changes when you refresh the page immediately.

## License
Source code is licensed under [Apache License 2.0](LICENSE)