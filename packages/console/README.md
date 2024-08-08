# @wener/console

- Toolkit for build console like application
- React & TailwindCC & Daisy

## Layout

- src/
  - web/ - Web App
  - app/ - NextJS App Layout Template
  - buildinfo
  - components - Reusable components
  - hooks - Reusable hooks
  - icons - Reusable icons


**exports**

- ./ - utils, do not need react
- ./web - web app based on react

*components*

- ./daisy
- ./loader
- ./floating
- ./icons
- ./router
- ./toast
- ./valtio

## Demo

```bash
pnpm add @wener/console
pnpm add overlayscrollbars overlayscrollbars-react tailwind-merge clsx
```

## Notes

- WebStorm can not resolve tsconfig path import when used by npm

```json
{
  "baseUrl": ".",
  "paths": {
    "@/*": [
      "./src/*"
    ]
  }
}
```
