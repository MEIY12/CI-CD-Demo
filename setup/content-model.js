module.exports = function (migration) {
  const article = migration
    .createContentType("article")
    .name("Article")
    .description("")
    .displayField("title");
  article
    .createField("title")
    .name("Title")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);
  article
    .createField("slug")
    .name("Slug")
    .type("Symbol")
    .localized(false)
    .required(true)
    .validations([])
    .disabled(false)
    .omitted(false);

  article
    .createField("body")
    .name("Body")
    .type("RichText")
    .localized(false)
    .required(true)
    .validations([
      {
        enabledMarks: ["bold", "italic", "underline", "code"],
        message: "Only bold, italic, underline, and code marks are allowed",
      },
      {
        enabledNodeTypes: [
          "heading-1",
          "heading-2",
          "heading-3",
          "heading-4",
          "heading-5",
          "heading-6",
          "ordered-list",
          "unordered-list",
          "hr",
          "blockquote",
          "embedded-asset-block",
          "hyperlink",
          "asset-hyperlink",
          "embedded-entry-inline",
          "table",
        ],

        message:
          "Only heading 1, heading 2, heading 3, heading 4, heading 5, heading 6, ordered list, unordered list, horizontal rule, quote, asset, link to Url, link to asset, inline entry, and table nodes are allowed",
      },
      {
        nodes: {
          "asset-hyperlink": [
            {
              size: {
                max: 8,
              },

              message: null,
            },
          ],

          "embedded-asset-block": [
            {
              size: {
                max: 8,
              },

              message: null,
            },
          ],

          "embedded-entry-block": [
            {
              size: {
                max: 9,
              },

              message: null,
            },
          ],

          "embedded-entry-inline": [
            {
              size: {
                max: 10,
              },

              message: null,
            },
          ],

          "entry-hyperlink": [
            {
              size: {
                max: 10,
              },

              message: null,
            },
          ],
        },
      },
    ])
    .disabled(false)
    .omitted(false);

  article.changeFieldControl("title", "builtin", "singleLine", {});
  article.changeFieldControl("slug", "builtin", "slugEditor", {});
  article.changeFieldControl("body", "builtin", "richTextEditor", {});
};
