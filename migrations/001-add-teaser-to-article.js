// Add teaser field to article.
function migrationFunction(migration, context) {
  const article = migration.editContentType("article");
  const articleTeaser = article.createField("teaser");
  articleTeaser
      .name("Teaser")
      .type("Text")
      .localized(false)
      .required(false)
      .validations([{ "size": { "max": 180 } }])
      .disabled(false)
      .omitted(false);
}
module.exports = migrationFunction;