function debounce(fn, delay) {
  let timer = null;
  // eslint-disable-next-line func-names
  return function (...rest) {
    const context = this; const
      args = rest;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}

async function fetchResults(term) {
  const result = await fetch('https://magento.dev.atama.land/graphql', {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      // eslint-disable-next-line no-use-before-define
      query: MAGENTO_PRODUCT_QUERY,
      variables: {
        term,
      },
    }),
  });
  const productResult = await result.json();
  const cardsContainer = document.getElementById('cards');
  cardsContainer.textContent = '';
  productResult?.data?.products?.items?.forEach((product) => {
    const card = document.createElement('arc-product-card');
    cardsContainer.append(card);
    card.setAttribute('title', product.name);
    card.setAttribute('handle', product.url_key);
    card.setAttribute('thumbnail', product?.image?.url);
    card.setAttribute('system', 'magento')
  });
}

async function init() {
  const search = document.getElementById('catalog-search');
  search.onkeyup = debounce((event) => {
    fetchResults(event.target.value);
  }, 500);
}

init();

const MAGENTO_PRODUCT_QUERY = `#graphql
query Products($term: String!)
{
    products(search: $term, pageSize: 10) {
        items {
            name
            url_key
            description {
                html
            }
            sku
            stock_status            
            image {
                url
            }
        }
    }
}
`;
