module.exports = function (migration) {
  const article = migration.editContentType('article');

  article
    .createField('subtitle')
    .name('Subtitle')
    .type('Symbol')
    .localized(false)
    .required(false)
    .validations([])
    .disabled(false)
    .omitted(false);

  article.moveField('subtitle').afterField('title');
  article.changeFieldControl('subtitle', 'builtin', 'singleLine', {});
};
