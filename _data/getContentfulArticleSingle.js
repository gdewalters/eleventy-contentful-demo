import client from '../_helpers/contentfulClient.js';
import parseImageWrapper from '../_helpers/parseImageWrapper.js';
import cachedFetch from '../_helpers/cache.js';

export default async function getContentfulArticleSingle() {
  // const entryId = process.env.PROMO_ARTICLE_ENTRY_ID;
  const entryId = '5Xdx6Pcqw8f75JSERlMMJh'; // For testing purposes, replace with actual environment variable in production

  if (!entryId) {
    console.warn('PROMO_ARTICLE_ENTRY_ID environment variable is not set.');
    return null;
  }

  const fetcher = async () => {
    const entry = await client.getEntry(entryId, { include: 3 });
    const fields = { ...entry.fields };

    const imageEntry = fields.mainImage || fields.image || null;
    fields.mainImage = parseImageWrapper(imageEntry);

    // This 'deck' processing might still be unnecessary if you only want a single article's fields.
    // However, for now, we're leaving it as is, focusing on the mainImage fix.
    const deck = (fields.deckContent || []).map(item => {
      const typeId = item.sys?.contentType?.sys?.id;
      if (typeId === 'composeArticle') {
        const articleFields = { ...item.fields };
        // This line is for images *within* the deckContent, if it were used.
        articleFields.mainImage = parseImageWrapper(articleFields.mainImage);
        return { ...articleFields, sys: item.sys };
      }
      return null;
    }).filter(Boolean);

    return { ...fields, deckContent: deck, sys: entry.sys };
  };

  try {
    return await cachedFetch(`cardDeck_${entryId}`, fetcher);
  } catch (error) {
    console.error('Error fetching card deck entry:', error);
    return null;
  }
}
