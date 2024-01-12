const ENDPOINT = 'https://magento2.docker/graphql';

async function createGuestCart() {
  const result = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // eslint-disable-next-line no-use-before-define
      query: MAGENTO_CREATE_GUEST_CART_MUTATION,
    }),
  });

  const jsonData = await result.json();
  setGuestCartId(jsonData?.data?.createEmptyCart);
  return jsonData?.data?.createEmptyCart;
}

async function addItemToGuestCart() {
  const cartId = getGuestCartId();
  const sku = 'testproduct1';
  const quantity = 1;

  const result = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // eslint-disable-next-line no-use-before-define
      query: MAGENTO_ADD_ITEMS_TO_GUEST_CART_MUTATION,
      variables: {
        cartId,
        sku,
        quantity,
      },
    }),
  });

  const jsonData = await result.json();
  console.log(jsonData?.data?.addSimpleProductsToCart?.cart);
  document.getElementById('minicart').dispatchEvent(new Event('minicart-refresh'));
  return jsonData?.data?.addSimpleProductsToCart?.cart;
}

async function setGuestCartId(cartId) {
  sessionStorage.setItem('guestCartId', cartId);
}

function getGuestCartId() {
  return sessionStorage.getItem('guestCartId');
}

async function fetchCart(cartId) {
  if (!cartId) {
    console.warn('no guest cart id');
    return;
  }
  const result = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // eslint-disable-next-line no-use-before-define
      query: MAGENTO_GUEST_CART_QUERY,
      variables: {
        cartId,
      },
    }),
  });
  const jsonData = await result.json();
  console.log("RESULT", jsonData);

  const minicart = document.getElementById('minicart');
  minicart.textContent = '';
  jsonData?.data?.cart?.items.forEach(item => {
    const lineitem = document.createElement('h6');
    lineitem.innerText = item.product.name;
    minicart.append(lineitem);
  });

  const totalItems = document.createElement('h2');
  totalItems.innerText = `total cart items: ${jsonData?.data?.cart?.total_quantity}`;
  minicart.append(totalItems);

  return jsonData?.data?.cart;
}

export default async function decorate(block) {
  /* change to ul, li */
  const createGuestCartButton = document.createElement('button');
  const guestCartId = getGuestCartId();
  createGuestCartButton.innerText = `Create Guest Cart (current cart: ${guestCartId || '---'})`;
  createGuestCartButton.addEventListener('click', createGuestCart);

  const addItemToGuestCartButton = document.createElement('button');
  addItemToGuestCartButton.innerText = 'Add Item to Guest Cart';
  addItemToGuestCartButton.addEventListener('click', addItemToGuestCart);

  const minicart = document.createElement('div');
  minicart.id = 'minicart';
  minicart.innerText = 'minicart!!';

  minicart.addEventListener('minicart-refresh', async () => {
    fetchCart(getGuestCartId());    
  });

  block.textContent = '';
  block.append(createGuestCartButton);
  block.append(addItemToGuestCartButton);
  block.append(minicart);
  fetchCart(guestCartId);
}

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
const MAGENTO_GUEST_CART_QUERY = `#graphql
query GuestCart($cartId: String!)
{
  
    cart(cart_id: $cartId) {
        items {
            quantity
            product {
                name
                image {
                    url
                }
            }
        }
        total_quantity
    }
  
}
`;

const MAGENTO_CREATE_GUEST_CART_MUTATION = `#graphql
mutation
{
  createEmptyCart
}
`;

const MAGENTO_ADD_ITEMS_TO_GUEST_CART_MUTATION = `#graphql
mutation AddItemsToGuestCart($cartId: String!, $sku: String!, $quantity: Float!){
  addSimpleProductsToCart(
    input: {
      cart_id: $cartId
      cart_items: [
        {
          data: {
            quantity: $quantity
            sku: $sku
          }
        }
      ]
    }
  ) {
    cart {
      items {
        id
        product {
          name
          sku
        }
        quantity
      }
    }
  }

}
`;
