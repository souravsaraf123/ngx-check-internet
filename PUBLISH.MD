## Publishing

1. After you have made your changes, bump version in package.json

```
cd projects/ngx-check-internet
npm version patch
```

2. Build package from root workspace

```
cd ../..
ng build ngx-check-internet
```

3. Publish from dist folder

```
cd dist/ngx-check-internet
npm publish
```
