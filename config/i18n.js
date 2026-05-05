const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const path = require('path');

const i18n = i18next.createInstance();

i18n
  .use(Backend)
  .init({
    lng: 'zh',
    fallbackLng: 'en',
    supportedLngs: ['zh', 'en'],
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
    },
    ns: ['common', 'auth', 'export'],
    defaultNS: 'common',
    preload: ['zh', 'en'],
    saveMissing: false,
    debug: process.env.NODE_ENV === 'development',
  });

module.exports = i18n;
