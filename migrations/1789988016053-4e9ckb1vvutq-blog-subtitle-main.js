function migrationFunction(migration, context) {
    const blogPost = migration.editContentType("blogPost");
    const blogPostSubtitle = blogPost.createField("subtitle");
    blogPostSubtitle
        .name("Subtitle")
        .type("Symbol")
        .localized(true)
        .required(false)
        .validations([])
        .disabled(false)
        .omitted(false)
    blogPost.moveField("subtitle").beforeField("slug")
    blogPost.changeFieldControl("subtitle", "builtin", "singleLine")
}
module.exports = migrationFunction;
