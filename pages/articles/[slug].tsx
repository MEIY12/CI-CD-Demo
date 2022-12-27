import Head from 'next/head'
import Link from 'next/link'
import { Inter } from '@next/font/google'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import { INLINES } from '@contentful/rich-text-types';
import { getArticleBySlug, getArticleSlugs } from '../../lib/api'

const inter = Inter({ subsets: ['latin'] })

export default function StaticArticle({preview, content}: any) {
  const { title, body } = content
  const options = {
    renderNode: {
      [INLINES.EMBEDDED_ENTRY]: (node: any) => {
        const id = node.data.target.sys.id
        const entry = body.links.entries.inline.find((item: any) => item.sys.id === id)
        switch (entry.__typename) {
          case 'Microcopy':
            return <b>{entry.value}</b>
            default: 
          return null
        }
      }
    }
  };
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{maxWidth: '50em', margin: '0 auto'}}>
        <Link href='/'>&lsaquo; Back</Link>
        <h1>{title}</h1>
        {documentToReactComponents(body.json, options)}
      </main>
    </>
  )
}

export async function getStaticPaths({ preview = false }: any) {
  const data = await getArticleSlugs(preview)
  const paths = data.map((item: any) => {
    return {
      params: { 'slug': item.slug }
    }
  })

  return {
    paths,
    fallback: false
  }
}

export async function getStaticProps({ params, preview = false }: any) {
  const content = await getArticleBySlug(params.slug, preview)
  return {
    props: { preview, content },
  }
}
