# 0.1.0 (2026-04-25)

### Bug Fixes

- **admin:** add loading state to Add button and fix spinner animation ([87d8e04](https://github.com/finnmo/coles-personal-dashboard-picker/commit/87d8e04263e4f93955055c95d7886c26fe64185a))
- **ci:** regenerate package-lock.json with Node 20 to match CI environment ([5dab047](https://github.com/finnmo/coles-personal-dashboard-picker/commit/5dab047b92c08c1c6403f5a1f213adf637b12da6))
- **ci:** resolve npm ci failures and Google Fonts build error ([3bea956](https://github.com/finnmo/coles-personal-dashboard-picker/commit/3bea95610e9acbe357b7a32a253cad0614b0442f))
- **ci:** sync lock file, fix formatting, fix soft-delete integration test ([22adc98](https://github.com/finnmo/coles-personal-dashboard-picker/commit/22adc983fbcec6f2d162d8153d84d3144eeaa526))
- **coles-api:** construct CDN image URL directly instead of scraping ([1f4aafa](https://github.com/finnmo/coles-personal-dashboard-picker/commit/1f4aafa5abc653cf86bb8093a587b1735237b1da))
- **deps:** replace deprecated conventional-changelog-cli with conventional-changelog@7 ([e24dffc](https://github.com/finnmo/coles-personal-dashboard-picker/commit/e24dffc4c04b19941b9ae8ac0363bcd32d677da8))
- **docker:** copy bcryptjs explicitly into runner stage for entrypoint ([7b331df](https://github.com/finnmo/coles-personal-dashboard-picker/commit/7b331dfe5a92bde44085bdfc567507c1952f6f17))
- **docker:** exclude .env from image and fix password hash script ([caeb8a2](https://github.com/finnmo/coles-personal-dashboard-picker/commit/caeb8a24baf8a8df66405850c74046d5b91e6b4f))
- **docker:** install openssl in deps and builder stages ([c16e1fc](https://github.com/finnmo/coles-personal-dashboard-picker/commit/c16e1fc5e9425ea2bd5e4334cde6ef03304b5371))
- **docker:** resolve runtime issues in production container ([04215e8](https://github.com/finnmo/coles-personal-dashboard-picker/commit/04215e8f990f37abfc5a886b96ce819275f422ee))
- **docker:** resolve SQLite path mismatch and volume write permissions ([ecbdfbd](https://github.com/finnmo/coles-personal-dashboard-picker/commit/ecbdfbdf50c169fd2496c8e12d4efd640e613469))
- **prisma:** add linux-musl openssl-3.0.x binary targets for Alpine ([e5e61c4](https://github.com/finnmo/coles-personal-dashboard-picker/commit/e5e61c449596c11e1a7cf87e84123f4b87ddd8ec))
- **release:** switch to TriPSs/conventional-changelog-action to avoid broken CLI ([1598ee8](https://github.com/finnmo/coles-personal-dashboard-picker/commit/1598ee816c040e3cb6050534ba2444dd5e2aa752))

### Features

- **admin:** admin panel, product CRUD, startup validation ([ef270fc](https://github.com/finnmo/coles-personal-dashboard-picker/commit/ef270fc7a6de5317179d7bfe5939728fc994545a))
- **admin:** scrape og:image from Coles product page on add ([d4ce493](https://github.com/finnmo/coles-personal-dashboard-picker/commit/d4ce49346510433e1d72df66af07f27b8da49d80))
- **coles-api:** switch to RapidAPI coles-product-price-api ([9c12568](https://github.com/finnmo/coles-personal-dashboard-picker/commit/9c12568567217e199f53125711036d6815d92121))
- dashboard UI with product grid, tabs, and theme toggle ([09a2420](https://github.com/finnmo/coles-personal-dashboard-picker/commit/09a24208dcd22edaa247a9f757d4fb392b11643e))
- **dashboard:** letter filter, name search, and RapidAPI result cache ([db98c63](https://github.com/finnmo/coles-personal-dashboard-picker/commit/db98c63f732f7be9b320eeb49f3b4d98ffb7fb99))
- **dashboard:** touchscreen-optimised layout with Inter font and sidebar filter ([705d06d](https://github.com/finnmo/coles-personal-dashboard-picker/commit/705d06d9d54f74bc557ca8239fd2aa7cd3975b84))
- **docker:** add prisma CLI copy to runner stage ([0fbfc99](https://github.com/finnmo/coles-personal-dashboard-picker/commit/0fbfc9903343ba9d1ed888598f75108aa957aa20))
- initial project scaffolding (feat/project-setup) ([46a602b](https://github.com/finnmo/coles-personal-dashboard-picker/commit/46a602b26b34ad32de23b61d3dd97d1037cd6ae0))
- **list:** apple Reminders integration via iOS Shortcuts URL scheme ([d0552f0](https://github.com/finnmo/coles-personal-dashboard-picker/commit/d0552f071da929f2978ffbe8931df81eecddaca5))
- **list:** google Tasks integration with OAuth2 and google_keep fallback ([07a7d0a](https://github.com/finnmo/coles-personal-dashboard-picker/commit/07a7d0ab076f5f6defe616448f0fd06a89402a6e))
- password authentication with JWT session cookies ([76639b7](https://github.com/finnmo/coles-personal-dashboard-picker/commit/76639b780ef4da1a5a0bad392f8af69d8f0d545c))
- **purchase:** priority tracking, purchase endpoint wiring, badge updates ([1a3bbe3](https://github.com/finnmo/coles-personal-dashboard-picker/commit/1a3bbe345bbb8eda2453663028cdf67bbc1218ed))
- round-2 improvements — shopping list, Unraid deploy, observability, resilience ([a3a2d0c](https://github.com/finnmo/coles-personal-dashboard-picker/commit/a3a2d0c06a1b375491b3ff86ea1d62ba5a2e771f))

### Performance Improvements

- **docker:** build platforms in parallel using native runners ([5fc2620](https://github.com/finnmo/coles-personal-dashboard-picker/commit/5fc2620ca0b8623867f7e1da89967a2e30ccc051))
- **docker:** simplify to amd64-only build ([d3271fd](https://github.com/finnmo/coles-personal-dashboard-picker/commit/d3271fdf4418b4be5888d6667534f06a6e3d16ad))
- **docker:** switch to registry cache + fix CHANGELOG formatting ([261f11a](https://github.com/finnmo/coles-personal-dashboard-picker/commit/261f11a3c92277ea3e6e721dd0353f7870211b04))
