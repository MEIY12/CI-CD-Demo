function migrationFunction(migration, context) {
    const article = migration.editContentType("article");
    const articleSeoDescription = article.createField("seoDescription");
    articleSeoDescription
        .name("SEO description")
        .type("Symbol")
        .localized(false)
        .required(false)
        .validations([])
        .disabled(false)
        .omitted(false)
    article.changeFieldControl("seoDescription", "builtin", "singleLine")
}
module.exports = migrationFunction;
