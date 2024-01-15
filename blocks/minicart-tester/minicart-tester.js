const ENDPOINT = 'https://magento2.docker/graphql';

// async function createGuestCart() {
//   const result = await fetch(ENDPOINT, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       // eslint-disable-next-line no-use-before-define
//       query: MAGENTO_CREATE_GUEST_CART_MUTATION,
//     }),
//   });

//   const jsonData = await result.json();
//   setGuestCartId(jsonData?.data?.createEmptyCart);
//   return jsonData?.data?.createEmptyCart;
// }

async function addItemToGuestCart(sku) {
  const cartId = getGuestCartId();
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
  document.getElementById('minicart').dispatchEvent(new Event('minicart-update'));
  return jsonData?.data?.addSimpleProductsToCart?.cart;
}

async function setGuestCartId(cartId) {
  sessionStorage.setItem('cartId', cartId);
}

function getGuestCartId() {
  return sessionStorage.getItem('cartId');
}

export default async function decorate(block) {
  const addItemToGuestCartButton = document.createElement('button');
  addItemToGuestCartButton.innerText = 'Add Machine to Guest Cart';
  addItemToGuestCartButton.addEventListener('click', () => addItemToGuestCart('testproduct1'));
  const addItemToGuestCartButton2 = document.createElement('button');
  addItemToGuestCartButton2.innerText = 'Add Pod to Guest Cart';
  addItemToGuestCartButton2.addEventListener('click', () => addItemToGuestCart('testproduct2'));

  block.textContent = '';
  block.append(addItemToGuestCartButton);
  block.append(addItemToGuestCartButton2);
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
