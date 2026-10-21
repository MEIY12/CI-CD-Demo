/**
 * =====================================
 * Standard GraphQL Query
 * =====================================
 */

async function fetchGraphQL(query: any, preview = false) {
  return fetch(
    `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}/environments/${process.env.CONTENTFUL_ENVIRONMENT}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${
          preview
            ? process.env.CONTENTFUL_CPA
            : process.env.CONTENTFUL_CDA
        }`,
      },
      body: JSON.stringify({ query }),
    }
  ).then((response) => response.json())
}

/**
 * =====================================
 * Get Content by Slug
 * =====================================
 */

export const getHomePage = async (preview: boolean) => {
  const content = await fetchGraphQL(
    `query {
      articleCollection(preview: ${preview}, order: title_ASC) {
        items {
          sys { id }
          slug
          title
        }
      }
    }`,
    true
  )

  return content.data.articleCollection.items
}

export const getArticleBySlug = async (slug: string, preview: boolean) => {
  const entry = await fetchGraphQL(
    `query {
      articleCollection(where: { slug: "${slug}" }, preview: ${preview}, limit: 1) {
        items {
          sys { id }
          title
          body {
            json
          }
        }
      }
    }`,
    true
  )

  return entry.data.articleCollection.items[0]
}

/**
 * =====================================
 * Get Slugs
 * =====================================
 */
export const getArticleSlugs = async (preview: boolean) => {
  const entry = await fetchGraphQL(
    `query {
      articleCollection(preview: ${preview}) {
        items {
          slug
        }
      }
    }`,
    true
  )

  return entry.data.articleCollection.items
}